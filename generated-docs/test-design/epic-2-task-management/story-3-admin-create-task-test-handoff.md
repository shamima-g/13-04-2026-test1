# Test Handoff: Admin: Create Task

> Engineering document for downstream agents. Not reviewed by the BA.

**Source:** [story-3-admin-create-task-test-design.md](./story-3-admin-create-task-test-design.md)
**Epic:** 2 | **Story:** 3

## Coverage for WRITE-TESTS

- AC-1: Admin sees "Create Task" button on all-tasks view → Scenario 1
- AC-2: Team-member does not see "Create Task" button → Scenario 2
- AC-3: Clicking "Create Task" opens form with all four fields → Scenario 3
- AC-4: Assigned user field is a dropdown (not free-text), populated from users → Scenario 3
- AC-5: Submit without title shows inline validation error → Scenario 5
- AC-6: Submit with title > 200 characters shows inline validation error → Scenario 6
- AC-7: Submit without due date shows inline validation error → Scenario 7
- AC-8: Submit without assigned user shows inline validation error → Scenario 8
- AC-9: All required fields filled correctly → no validation errors, form submits → Scenario 4
- AC-10: API success → form closes → Scenario 4
- AC-11: API success → new task appears in task list → Scenario 4
- AC-12: API success → success toast shown → Scenario 4
- AC-13: API failure → error message shown inside form, form stays open → Scenario 9
- AC-14: After API error → resubmit retries the API call → Scenario 10
- AC-15: Cancel/close form → form closes, task list unchanged → Scenario 11

Edge examples:
- AC-9 (description optional): Edge 1
- AC-3/AC-4 (dropdown loading): Edge 2
- AC-5/AC-6 (boundary values at 200 chars, 1 char): Edge 3, Edge 4

## Handoff Notes for WRITE-TESTS

- Only generate executable tests from examples in the test-design document
- Do not invent behavior not represented there or explicitly approved
- Preferred render scope: **full page** for AC-1, AC-2, AC-11 (list refresh); **component** for form validation (AC-5 through AC-9), API success/error handling (AC-10 through AC-14), cancel behavior (AC-15)
- Suggested primary assertions:
  - `getByRole('button', { name: /create task/i })` — presence/absence by role
  - `getByRole('dialog')` — form open state
  - `getByRole('combobox')` or `getByLabelText(/assigned user/i)` — dropdown rendered
  - `getByText(...)` — validation error messages (inline)
  - `getByText(...)` — success toast content
  - Task in list: `getByText('Design new onboarding flow')` after mock resolves
- Mock strategy:
  - `GET /v1/users` → mock with at least 2 users: `[{ id: 'u-101', displayName: 'Alice Chen', ... }, { id: 'u-102', displayName: 'Bob Gomez', ... }]`
  - `POST /v1/tasks` → `mockResolvedValueOnce` for success (201 with created Task object) and `mockRejectedValueOnce` for error (500) scenarios
  - `GET /v1/tasks` → mock task list refresh after creation (or mock the invalidation/refetch trigger)
  - Role detection: mock session to return `{ role: 'admin' }` or `{ role: 'team-member' }` as needed per test
- Important ambiguity flags:
  - API error display location inside form is unspecified (BA decision required — Scenario 9). Write a flexible assertion that checks the error message exists *somewhere* inside the dialog, rather than asserting a specific position.
  - Cancel/close mechanisms are unspecified (BA decision required — Scenario 11). Test the Cancel button at minimum. If X icon and Escape are also implemented, add those tests after BA confirms.
  - New task position in list after creation is unspecified. Assert the task *appears in the list* without asserting position (first/last/sorted).
  - Success toast message text is unspecified. Assert that *a* toast appears (e.g., by role `status` or `alert`) rather than asserting exact copy.
  - Users dropdown loading state is unspecified (BA decision required — Edge 2). Write a test that confirms the dropdown is eventually populated; skip the intermediate loading-state assertion unless BA confirms the expected loading UI.
  - Whitespace-only title is out of scope — do not add a test for it unless the BA approves a trim rule.

## Testability Classification

| Scenario | Category | Reason |
| --- | --- | --- |
| 1. Admin sees "Create Task" button | Unit-testable (RTL) | Button conditional render based on mocked role session |
| 2. Team-member does not see "Create Task" button | Unit-testable (RTL) | Button conditional render based on mocked role session |
| 3. Admin opens create task form | Unit-testable (RTL) | Dialog open state triggered by button click; dropdown populated from mocked GET /v1/users |
| 4. Admin submits valid task successfully | Unit-testable (RTL) | Form submission with mocked POST /v1/tasks success; list refresh and toast via mocked API |
| 5. Submit without title — validation error | Unit-testable (RTL) | Client-side Zod validation triggers inline error without API call |
| 6. Submit with title > 200 chars — validation error | Unit-testable (RTL) | Client-side Zod validation triggers inline error without API call |
| 7. Submit without due date — validation error | Unit-testable (RTL) | Client-side Zod validation triggers inline error without API call |
| 8. Submit without assigned user — validation error | Unit-testable (RTL) | Client-side Zod validation triggers inline error without API call |
| 9. API error — form stays open with error message | Unit-testable (RTL) | Mocked POST /v1/tasks rejection; check error renders inside dialog |
| 10. Retry after API error | Unit-testable (RTL) | Second submit after mocked failure; mock then resolves on next call |
| 11. Cancel form — task list unchanged | Unit-testable (RTL) | Cancel button click closes dialog; no POST /v1/tasks was called |
| Edge 1: Description left blank — no error | Unit-testable (RTL) | Submitting without description; verify no validation error and API is called |
| Edge 2: Users dropdown loading state | Unit-testable (RTL) | Mock GET /v1/users with delayed resolve; assert dropdown population after resolve |
| Edge 3: Title exactly 200 chars — accepted | Unit-testable (RTL) | Boundary value test; Zod schema allows exactly 200 |
| Edge 4: Title exactly 1 char — accepted | Unit-testable (RTL) | Boundary value test; Zod schema allows exactly 1 |

All scenarios in this story are unit-testable. No runtime verification needed.
