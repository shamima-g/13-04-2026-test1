# Test Design: Authentication, Role Configuration, and Role-Based Routing

## Story Summary

**Epic:** 1 — Authentication and Role-Based Routing
**Story:** 1 of 1
**As a** signed-in user
**I want to** be automatically sent to the right page for my role when I sign in
**So that** I can immediately see and work on what is relevant to me without manual navigation.

## Review Purpose

This document presents concrete business examples for BA review before executable tests are written.

Its purpose is to:
- surface missing business decisions
- let the BA review behavior using examples and expected outcomes
- provide an approved source for downstream test generation

## Business Behaviors Identified

- After a successful sign-in, the application reads the user's role and sends them to the correct landing page without any additional action on the user's part.
- The home page `/` is not a real content page — it is purely a redirect hub that sends authenticated users to the right place and unauthenticated users to the sign-in page.
- Any route under the protected area (`/tasks`, `/tasks/all`) requires an active session; visiting without one redirects to sign-in.
- The route `/tasks/all` is restricted to admins only; a signed-in team-member who visits it is silently sent to `/tasks` with no explanation or error shown.
- The application recognises exactly two roles: `admin` and `team-member`. No other role value is valid.
- The sign-in page is keyboard accessible: users can reach and activate all controls using only the Tab key and Enter/Space.

## Key Decisions Surfaced by AI

- **Sign-in page ownership:** The story references the sign-in page as a destination for redirects but does not specify whether this story includes building or modifying the sign-in page UI, or whether an existing template sign-in page is being reused as-is. The acceptance criteria include keyboard accessibility for the sign-in page (AC-11), which implies the story must at minimum verify the sign-in page exists and is accessible.
- **Team-member visiting `/tasks/all` — what exactly is shown briefly before redirect?** The redirect for a team-member hitting `/tasks/all` is described as "silent." It is not specified whether any content flashes briefly before the redirect fires, or whether the redirect happens at the server level (nothing is ever rendered). Middleware or server-component redirects will be instantaneous; client-side redirects may show a blank or loading state momentarily.
- **Redirect destination after sign-in for an unrecognised role:** The two valid roles are `admin` and `team-member`. If a user account somehow has a different or missing role value in the session, the redirect logic has no defined target. This scenario is likely not possible in production but may arise during development or data-migration edge cases.

## Test Scenarios / Review Examples

### 1. Team-member signs in and lands on their task list

| Setup | Value |
| --- | --- |
| User account | email: `user@example.com`, role: `team-member` |
| Starting point | Sign-in page |

| Input | Value |
| --- | --- |
| Action | Enter valid credentials and submit the sign-in form |

| Expected | Value |
| --- | --- |
| Current URL | `/tasks` |
| Page visible | Team-member personal task list (placeholder or real content) |
| Redirect triggered | Yes — automatically, without user clicking anything |

---

### 2. Admin signs in and lands on the all-tasks view

| Setup | Value |
| --- | --- |
| User account | email: `admin@example.com`, role: `admin` |
| Starting point | Sign-in page |

| Input | Value |
| --- | --- |
| Action | Enter valid credentials and submit the sign-in form |

| Expected | Value |
| --- | --- |
| Current URL | `/tasks/all` |
| Page visible | All-tasks view (placeholder or real content) |
| Redirect triggered | Yes — automatically, without user clicking anything |

---

### 3. Signed-in team-member visits the home page `/`

| Setup | Value |
| --- | --- |
| User account | email: `user@example.com`, role: `team-member`, active session |
| Starting point | Directly navigate to `/` |

| Input | Value |
| --- | --- |
| Action | Load `/` in the browser |

| Expected | Value |
| --- | --- |
| Current URL after load | `/tasks` |
| Content shown at `/` | Nothing (redirect happens before any page content renders) |

---

### 4. Signed-in admin visits the home page `/`

| Setup | Value |
| --- | --- |
| User account | email: `admin@example.com`, role: `admin`, active session |
| Starting point | Directly navigate to `/` |

| Input | Value |
| --- | --- |
| Action | Load `/` in the browser |

| Expected | Value |
| --- | --- |
| Current URL after load | `/tasks/all` |
| Content shown at `/` | Nothing (redirect happens before any page content renders) |

---

### 5. Unauthenticated user visits the home page `/`

| Setup | Value |
| --- | --- |
| User account | No active session |
| Starting point | Directly navigate to `/` |

| Input | Value |
| --- | --- |
| Action | Load `/` in the browser |

| Expected | Value |
| --- | --- |
| Current URL after load | Sign-in page (e.g., `/auth/signin`) |
| Content shown at `/` | Nothing (redirect fires before rendering) |

---

### 6. Unauthenticated user tries to access `/tasks`

| Setup | Value |
| --- | --- |
| User account | No active session |
| Starting point | Directly navigate to `/tasks` |

| Input | Value |
| --- | --- |
| Action | Load `/tasks` in the browser |

| Expected | Value |
| --- | --- |
| Current URL after load | Sign-in page |
| Task list content shown | No — user never reaches the protected page |

---

### 7. Unauthenticated user tries to access `/tasks/all`

| Setup | Value |
| --- | --- |
| User account | No active session |
| Starting point | Directly navigate to `/tasks/all` |

| Input | Value |
| --- | --- |
| Action | Load `/tasks/all` in the browser |

| Expected | Value |
| --- | --- |
| Current URL after load | Sign-in page |
| All-tasks content shown | No — user never reaches the protected page |

---

### 8. Team-member attempts to access the admin-only route `/tasks/all`

| Setup | Value |
| --- | --- |
| User account | email: `user@example.com`, role: `team-member`, active session |
| Starting point | Directly navigate to `/tasks/all` |

| Input | Value |
| --- | --- |
| Action | Load `/tasks/all` in the browser |

| Expected | Value |
| --- | --- |
| Current URL after load | `/tasks` |
| Error message shown | No — redirect is silent, no error or explanation |
| All-tasks content visible | No |

> **BA decision required:** Should the team-member be aware in any way that they were redirected (e.g., does the page title or browser history entry reflect the redirect)?
>
> Options:
> - Option A: Completely silent redirect — no toast, no message, no indication. Browser history shows `/tasks` as if that was the original destination.
> - Option B: Silent redirect to `/tasks` but the browser history still shows `/tasks/all` was attempted (standard HTTP redirect behaviour). No user-visible message either way.
>
> The story says "silently redirected to their task list with no error message shown," which points to Option A, but browser history behaviour depends on whether this is a server-side redirect (replaces URL) or a client-side push (adds history entry). Current design note: server-side `redirect()` in Next.js replaces the URL, producing Option A behaviour.

---

### 9. Admin accesses `/tasks/all` — granted

| Setup | Value |
| --- | --- |
| User account | email: `admin@example.com`, role: `admin`, active session |
| Starting point | Directly navigate to `/tasks/all` |

| Input | Value |
| --- | --- |
| Action | Load `/tasks/all` in the browser |

| Expected | Value |
| --- | --- |
| Current URL after load | `/tasks/all` (no redirect) |
| Page content visible | All-tasks view content (placeholder or real content) |

---

### 10. Role values are limited to exactly `admin` and `team-member`

| Setup | Value |
| --- | --- |
| Context | Application session / authentication system |

| Input | Value |
| --- | --- |
| Scenario | Application reads a user's role from their session |

| Expected | Value |
| --- | --- |
| Valid role values | `admin`, `team-member` |
| Other values present in codebase | None — old values (`power_user`, `standard_user`, `read_only`) must be absent |

---

### 11. Sign-in page is keyboard accessible

| Setup | Value |
| --- | --- |
| Starting point | Sign-in page (unauthenticated) |
| Input method | Keyboard only (no mouse) |

| Input | Value |
| --- | --- |
| Action | Press Tab to move through interactive controls |

| Expected | Value |
| --- | --- |
| Email field reachable | Yes — receives focus via Tab |
| Password field reachable | Yes — receives focus via Tab |
| Sign-in button reachable | Yes — receives focus via Tab |
| Sign-in button activatable | Yes — pressing Enter or Space submits the form |
| Focus visible | Yes — a visible focus indicator is shown on the focused control |

## Edge and Alternate Examples

### Edge 1: Invalid credentials — user stays on sign-in page

| Setup | Value |
| --- | --- |
| User account | Any account |
| Starting point | Sign-in page |

| Input | Value |
| --- | --- |
| Action | Enter wrong password and submit |

| Expected | Value |
| --- | --- |
| Current URL after submit | Sign-in page (no redirect) |
| Error feedback | An error message is shown on the sign-in page |
| Role-based redirect | Does not happen |

---

### Edge 2: Session expiry while browsing `/tasks`

| Setup | Value |
| --- | --- |
| User account | team-member with a previously valid session that has since expired |
| Starting point | `/tasks` |

| Input | Value |
| --- | --- |
| Action | Attempt to load or refresh the page after session expires |

| Expected | Value |
| --- | --- |
| Redirect | User is sent to the sign-in page |
| Task list shown | No — session gate fires before content renders |

> **BA decision required:** After a session expires and the user is redirected to sign-in, should the application attempt to send them back to the page they were on after they re-authenticate (i.e., a return-URL / callbackUrl parameter), or should they always be dropped back to their role-based landing page?
>
> Options:
> - Option A: Always redirect to the role-based landing page after re-authentication (simpler, consistent with the post-sign-in redirect rule in AC-1/AC-2).
> - Option B: Preserve the originally requested URL and redirect there after re-authentication (common UX pattern but adds complexity).

---

### Edge 3: Demo user credentials — both roles available for manual testing

| Setup | Value |
| --- | --- |
| Demo accounts | `admin@example.com` (role: admin) and `user@example.com` (role: team-member) |
| Removed accounts | `power@example.com`, `readonly@example.com` — these must not exist |

| Input | Value |
| --- | --- |
| Action | Attempt to sign in with a removed demo account |

| Expected | Value |
| --- | --- |
| Result | Sign-in fails — credential not recognised |

## Out of Scope / Not For This Story

- Building the actual task list UI for team-members (Epic 2)
- Building the all-tasks admin view (Epic 2)
- Task creation, editing, deletion, or completion workflows (Epic 2)
- User account management (out of scope for v1 per FRS)
- Password reset or account recovery flows
- Any sign-up / registration flow — user accounts are pre-provisioned
- In-app or email notifications (out of scope per R17)
- Overdue indicators or task filtering (Epic 2)
- Search functionality (out of scope per R15)
