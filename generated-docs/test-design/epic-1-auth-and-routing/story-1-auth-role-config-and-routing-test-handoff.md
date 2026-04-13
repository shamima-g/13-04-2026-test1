# Test Handoff: Authentication, Role Configuration, and Role-Based Routing

> Engineering document for downstream agents. Not reviewed by the BA.

**Source:** [story-1-auth-role-config-and-routing-test-design.md](./story-1-auth-role-config-and-routing-test-design.md)
**Epic:** 1 | **Story:** 1

## Coverage for WRITE-TESTS

- AC-1: Team-member signs in → redirected to `/tasks` → Example 1
- AC-2: Admin signs in → redirected to `/tasks/all` → Example 2
- AC-3: Signed-in team-member visits `/` → redirected to `/tasks` → Example 3
- AC-4: Signed-in admin visits `/` → redirected to `/tasks/all` → Example 4
- AC-5: Unauthenticated user visits `/` → redirected to sign-in page → Example 5
- AC-6: Unauthenticated user visits `/tasks` → redirected to sign-in page → Example 6
- AC-7: Unauthenticated user visits `/tasks/all` → redirected to sign-in page → Example 7
- AC-8: Team-member visits `/tasks/all` → silently redirected to `/tasks`, no error shown → Example 8
- AC-9: Admin visits `/tasks/all` → access granted, no redirect → Example 9
- AC-10: Only `admin` and `team-member` role values exist in the system → Example 10
- AC-11: Sign-in page keyboard accessibility → Example 11

## Handoff Notes for WRITE-TESTS

- Only generate executable tests from the examples in the test-design document
- Do not invent behavior not represented there or explicitly approved
- Preferred render scope: **full page / server component** for redirect behaviors; **component** for keyboard accessibility check on the sign-in page
- Suggested primary assertions:
  - For redirect scenarios: assert the mock `redirect()` function was called with the expected path, OR assert that `useRouter().push` / `next/navigation` redirect was called with the expected destination
  - For role-value scenario (AC-10): assert that `types/roles.ts` exports exactly two role values (`admin`, `team-member`) and that no other values are present
  - For keyboard accessibility (AC-11): assert that the email input, password input, and submit button are present in the DOM and have correct `type` attributes; tab-order and focus-ring CSS are runtime-only concerns
  - For no-error-message check (AC-8): assert that no alert, toast, or error text is rendered after the redirect
- Important ambiguity flags:
  - The BA decision about return-URL after session expiry (Edge 2) is unresolved — do not implement callbackUrl logic; default to role-based landing page only
  - The BA decision about browser history on team-member → `/tasks/all` redirect (Example 8) is a runtime concern; the unit test can only verify that `redirect('/tasks')` was called
  - AC-11 (keyboard accessibility) has partial unit-testable coverage (element presence, type attributes) but full tab-order and focus-ring verification is runtime-only

## Testability Classification

| Scenario | Category | Reason |
| --- | --- | --- |
| 1. Team-member signs in → `/tasks` | Runtime-only | Post-sign-in redirect fires in NextAuth callbacks / Next.js middleware; the redirect chain spans multiple server layers that jsdom cannot exercise end-to-end |
| 2. Admin signs in → `/tasks/all` | Runtime-only | Same reason as Scenario 1 |
| 3. Team-member visits `/` → `/tasks` | Unit-testable (RTL) | The home page is an async server component calling `getSession()` and `redirect()`. Both can be mocked in Vitest; assert `redirect('/tasks')` called |
| 4. Admin visits `/` → `/tasks/all` | Unit-testable (RTL) | Same as Scenario 3; mock session with admin role, assert `redirect('/tasks/all')` |
| 5. Unauthenticated user visits `/` → sign-in | Unit-testable (RTL) | Mock `getSession()` to return null; assert `redirect('/auth/signin')` called |
| 6. Unauthenticated user visits `/tasks` | Runtime-only | Unauthenticated redirect on protected routes is handled by the `(protected)` layout's `requireAuth()` call or Next.js middleware; needs real routing stack |
| 7. Unauthenticated user visits `/tasks/all` | Runtime-only | Same reason as Scenario 6 |
| 8. Team-member visits `/tasks/all` → `/tasks` | Runtime-only | Admin-only guard is a server-component or layout-level redirect; requires real Next.js routing context to verify the full redirect chain |
| 9. Admin visits `/tasks/all` → no redirect | Runtime-only | Same reason as Scenario 8; verifying the absence of a redirect requires the real routing stack |
| 10. Role values limited to `admin` and `team-member` | Unit-testable (RTL) | Assert that `types/roles.ts` exports exactly the two expected enum values and that legacy role values are absent |
| 11. Sign-in page keyboard accessibility | Unit-testable (RTL) | Assert input elements are present with correct types; full focus-ring and tab-order verification is runtime-only |
| Edge 1. Invalid credentials | Runtime-only | Credentials validation occurs server-side in NextAuth; the sign-in error display may be unit-testable if the sign-in page component receives an error prop |
| Edge 2. Session expiry | Runtime-only | Requires a real session and timing; cannot be simulated in jsdom |
| Edge 3. Removed demo accounts | Runtime-only | Verifying that old credentials are rejected requires the real auth provider |

## Runtime Verification Checklist

These items cannot be verified by automated tests and must be checked during QA manual verification:

- [ ] After signing in as `user@example.com` (team-member), the browser lands on `/tasks` with no extra clicks required.
- [ ] After signing in as `admin@example.com` (admin), the browser lands on `/tasks/all` with no extra clicks required.
- [ ] Visiting `/tasks` without a session redirects to the sign-in page.
- [ ] Visiting `/tasks/all` without a session redirects to the sign-in page.
- [ ] While signed in as a team-member, navigating directly to `/tasks/all` silently redirects to `/tasks` — no error message or explanation appears.
- [ ] While signed in as an admin, navigating directly to `/tasks/all` loads the page without any redirect.
- [ ] Signing in with removed demo credentials (`power@example.com`, `readonly@example.com`) shows a sign-in error — the accounts do not exist.
- [ ] On the sign-in page, pressing Tab cycles through the email field, password field, and sign-in button in order, each receiving a visible focus indicator. Pressing Enter on the button submits the form.
