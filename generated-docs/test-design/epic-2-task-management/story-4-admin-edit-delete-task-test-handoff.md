# Test Handoff: Admin: Edit and Delete Task

> Engineering document for downstream agents. Not reviewed by the BA.

**Source:** [story-4-admin-edit-delete-task-test-design.md](./story-4-admin-edit-delete-task-test-design.md)
**Epic:** 2 | **Story:** 4

## Coverage for WRITE-TESTS

- AC-1: Admin sees edit control in task detail modal → Scenario 1 (admin view)
- AC-2: Team-member does NOT see edit control in task detail modal → Scenario 1 (team-member view)
- AC-3: Clicking edit control switches modal to edit mode with editable fields → Scenario 2
- AC-4: Assigned user is shown but read-only/locked in edit mode → Scenario 2, Edge Example E
- AC-5: Valid title change saved — modal updates to show new title → Scenario 3
- AC-6: Valid description change saved — modal updates to show new description → Scenario 4
- AC-7: Valid due date change saved — modal updates to show new due date → Scenario 5
- AC-8: Successful save also updates task list without page reload → Scenario 3
- AC-9: Empty title shows inline validation, no API call → Edge Example B
- AC-10: Title >200 chars shows inline validation, no API call → Edge Examples A (boundary valid), C (boundary+1 invalid)
- AC-11: Cleared due date shows inline validation, no API call → Edge Example D
- AC-12: PATCH failure shows error message; original values preserved, no partial update → Scenario 10
- AC-13: Retrying save after error retries the API call → Scenario 11
- AC-14: Cancel edit returns modal to read-only view with original values unchanged → Scenario 6
- AC-15: Admin sees delete control in task detail modal → Scenario 1 (admin view)
- AC-16: Team-member does NOT see delete control in task detail modal → Scenario 1 (team-member view)
- AC-17: Clicking delete opens confirmation dialog with exact message → Scenario 7
- AC-18: Confirming deletion calls DELETE API → Scenario 8
- AC-19: Successful deletion closes modal and removes task from list → Scenario 8
- AC-20: Cancelling delete confirmation leaves modal open and task unchanged → Scenario 9
- AC-21: DELETE failure shows error message; task remains in list → Scenario 12

## Handoff Notes for WRITE-TESTS

- Only generate executable tests from examples in the test-design document
- Do not invent behavior not represented there or explicitly approved
- Preferred render scope: **component** — render `TaskDetailModal` in isolation with mocked session/role and mocked API handlers (MSW or vi.fn()); no full page render needed for most scenarios
- The modal has two rendering contexts: admin and team-member. Use a mock session factory to toggle between roles.
- Suggested primary assertions:
  - Role-gated controls: use `queryByRole('button', { name: /edit/i })` and `queryByRole('button', { name: /delete/i })`
  - Edit mode: assert that form fields are present and pre-populated after clicking Edit
  - Assigned user field in edit mode: assert it is `disabled` (or `aria-disabled="true"`)
  - Successful save: assert modal returns to read-only view and list row title is updated
  - Validation errors: assert error text is visible and no API call was made
  - Confirmation dialog: assert presence of dialog with exact text "Delete this task? This cannot be undone."
  - Post-delete: assert modal closes and deleted task row is absent from the list
  - API failure: assert error text visible and original values still displayed
- Important ambiguity flags:
  - **Edit mode after PATCH failure:** The test-design documents this as a BA decision (Option A = stay in edit mode, Option B = return to read-only). Until the BA resolves this, write the test for Option A (stay in edit mode with error) as the default — it is the more conservative/user-friendly path. Flag the test with a comment: `// BA decision pending: see test-design Scenario 10`.
  - **DELETE failure error placement:** BA decision pending on inline vs toast. Default to inline error inside the modal for the test.
  - **Confirmation button label in AlertDialog:** The Shadcn `<AlertDialog />` uses "Continue" as the confirm button by default. Confirm the actual label used in implementation before asserting on it; use `getByRole('button', { name: /continue|delete/i })` to be safe.

## Testability Classification

| Scenario | Category | Reason |
| --- | --- | --- |
| 1. Admin sees edit/delete controls; team-member does not | Unit-testable (RTL) | Conditional rendering based on role prop/session mock |
| 2. Admin enters edit mode | Unit-testable (RTL) | Click interaction changes component state — fully exercisable in jsdom |
| 3. Admin saves valid title change | Unit-testable (RTL) | Form submit triggers mocked PATCH; component updates on resolved promise |
| 4. Admin saves valid description change | Unit-testable (RTL) | Same pattern as Scenario 3 |
| 5. Admin saves valid due date change | Unit-testable (RTL) | Same pattern as Scenario 3 |
| 6. Admin cancels an edit | Unit-testable (RTL) | Click Cancel changes component state back to read-only |
| 7. Delete confirmation dialog appears | Unit-testable (RTL) | Click triggers AlertDialog — jsdom can render Shadcn dialogs with portal mocks |
| 8. Admin confirms deletion — success | Unit-testable (RTL) | Click Confirm triggers mocked DELETE; component removes task row |
| 9. Admin cancels deletion | Unit-testable (RTL) | Click Cancel in AlertDialog closes dialog without API call |
| 10. Edit API call fails — error shown, original values preserved | Unit-testable (RTL) | Mock PATCH to reject; assert error message and no data change |
| 11. Admin retries after edit failure | Unit-testable (RTL) | Mock PATCH success on second call; assert modal updates |
| 12. Delete API call fails — error shown, task remains | Unit-testable (RTL) | Mock DELETE to reject; assert error message and task still in list |
| Edge A. Title at 200 chars — valid | Unit-testable (RTL) | Input boundary value; assert no validation message and API call fires |
| Edge B. Title blank — validation error | Unit-testable (RTL) | Input empty string; assert validation message, no API call |
| Edge C. Title 201 chars — validation error | Unit-testable (RTL) | Input 201-char string; assert validation message, no API call |
| Edge D. Due date cleared — validation error | Unit-testable (RTL) | Clear date input; assert validation message, no API call |
| Edge E. Assigned user locked in edit mode | Unit-testable (RTL) | Assert disabled attribute on assigned user field when in edit mode |

All scenarios in this story are unit-testable. No runtime verification needed.
