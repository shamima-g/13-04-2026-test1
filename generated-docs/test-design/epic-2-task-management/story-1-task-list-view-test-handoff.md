# Test Handoff: Task List View (Both Roles)

> Engineering document for downstream agents. Not reviewed by the BA.

**Source:** [story-1-task-list-view-test-design.md](./story-1-task-list-view-test-design.md)
**Epic:** 2 | **Story:** 1

## Coverage for WRITE-TESTS

- AC-1: Team-member at `/tasks` sees only their own tasks → Example 1
- AC-2: Team-member task rows show title, due date, status → Example 1
- AC-3: Admin at `/tasks/all` sees all tasks → Example 2
- AC-4: Admin task rows show title, assigned user display name, due date, status → Example 2
- AC-5: Filter control shows "All", "Pending", "Complete" options → Example 3 (filter control presence)
- AC-6: Selecting "Pending" filter immediately updates list to pending-only → Example 3
- AC-7: Selecting "Complete" filter immediately updates list to complete-only → Example 4
- AC-8: Selecting "All" restores full list → Example 5
- AC-9: Team-member with no tasks sees "No tasks assigned to you yet." → Example 6
- AC-10: Admin with no tasks sees "No tasks have been created yet." → Example 7
- AC-11: Filter returning no results shows appropriate empty-state message → Edge Example 1, Edge Example 2
- AC-12: Loading indicator shown while data is being fetched → Example 8
- AC-13: API failure shows banner "Unable to load tasks. Please try again." → Example 9
- AC-14: "Retry" button is visible on error and re-triggers the API request → Example 9
- AC-15: Successful Retry removes banner and shows task list → Example 10
- AC-16: Unauthenticated user is redirected to sign-in page → Example 12
- AC-17: Team-member navigating to `/tasks/all` is redirected to `/tasks` silently → Example 11

## Handoff Notes for WRITE-TESTS

- Only generate executable tests from examples in the test-design document.
- Do not invent behavior not represented there or explicitly approved.
- Preferred render scope: **full page (integration test)** — this story involves routing, API calls, role-based data scoping, and conditional rendering that benefits from full component tree rendering rather than unit-level component tests.
- The two routes (`/tasks` and `/tasks/all`) have distinct role contexts; write separate test suites or describe blocks for team-member and admin scenarios.
- Suggested primary assertions:
  - `getByRole('listitem')` or `getByRole('row')` counts / content to verify task visibility
  - `getByText` for exact empty-state messages ("No tasks assigned to you yet." / "No tasks have been created yet.")
  - `getByRole('combobox')` or `getByRole('option')` for filter control options
  - `getByText('Unable to load tasks. Please try again.')` for error banner
  - `getByRole('button', { name: /retry/i })` for Retry button
  - `waitFor` for async data-load assertions
- Mock `lib/api/endpoints.ts` (specifically the `listTasks` function) for all API call scenarios — do not use `fetch` directly.
- Mock `next/navigation` (useRouter, usePathname, redirect) before component imports.
- For loading state test: resolve the mock promise manually (via `mockResolvedValueOnce` with a delayed resolve or by testing intermediate render state before promise settles).
- Important ambiguity flags:
  - AC-11 exact empty-state message when filter returns no results is unspecified — use a placeholder assertion or mark with a TODO comment pending BA decision.
  - AC-15 banner auto-dismiss vs manual dismiss is unresolved — implement the auto-dismiss path (Option A) as the most natural UX, but note the open BA decision in a comment.
  - AC-14 confirms Retry re-triggers the request — assert that the API mock was called a second time after clicking Retry.
  - Retry-fails-again behavior (Edge Example 3) has an open BA decision — implement as "banner remains visible" (Option A) for now.

## Testability Classification

| Scenario | Category | Reason |
| --- | --- | --- |
| 1. Team-member sees only their own tasks | Unit-testable (RTL) | Component renders based on mocked API response; role context provided via mocked session |
| 2. Admin sees all tasks with assigned user names | Unit-testable (RTL) | Component renders based on mocked API response; role context provided via mocked session |
| 3. Status filter — show only pending tasks | Unit-testable (RTL) | Filter interaction is client-side state; jsdom can simulate clicks and assert list update |
| 4. Status filter — show only completed tasks | Unit-testable (RTL) | Same as scenario 3 |
| 5. Status filter — return to "All" | Unit-testable (RTL) | Same as scenario 3 |
| 6. Team-member empty state — no tasks assigned | Unit-testable (RTL) | Component renders empty-state message based on empty mock API response |
| 7. Admin empty state — no tasks in system | Unit-testable (RTL) | Same as scenario 6 |
| 8. Loading state while tasks are fetched | Unit-testable (RTL) | Intermediate render state before promise resolves can be asserted in jsdom |
| 9. API failure — error banner with Retry | Unit-testable (RTL) | Mock API rejection triggers error banner render; Retry button presence asserted |
| 10. Retry succeeds — banner clears, list appears | Unit-testable (RTL) | Chain `mockResolvedValueOnce` (reject) then `mockResolvedValueOnce` (resolve); assert state transitions |
| 11. Team-member redirected from `/tasks/all` | Runtime-only | Middleware/route guard redirect requires real Next.js routing stack — jsdom cannot exercise the (protected) layout group redirect |
| 12. Unauthenticated user redirected to sign-in | Runtime-only | Auth redirect is enforced at the Next.js middleware / layout level — not exercisable in jsdom |
| Edge 1. Filter produces no results | Unit-testable (RTL) | Client-side filter; empty result renders empty-state message |
| Edge 2. All admin tasks filtered away | Unit-testable (RTL) | Same as Edge 1 |
| Edge 3. Retry fails again | Unit-testable (RTL) | Chain two mock rejections; assert banner remains visible |

## Runtime Verification Checklist

These items cannot be verified by automated tests and must be checked during QA manual verification:

- [ ] Visiting `/tasks` without being signed in redirects to the sign-in page (AC-16)
- [ ] Visiting `/tasks/all` without being signed in redirects to the sign-in page (AC-16)
- [ ] Signing in as a team-member and navigating to `/tasks/all` redirects silently to `/tasks` with no error message shown (AC-17, BR9)
