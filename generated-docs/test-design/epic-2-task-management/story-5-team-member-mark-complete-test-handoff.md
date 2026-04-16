# Test Handoff: Team Member: Mark Task Complete

> Engineering document for downstream agents. Not reviewed by the BA.

**Source:** [story-5-team-member-mark-complete-test-design.md](./story-5-team-member-mark-complete-test-design.md)
**Epic:** 2 | **Story:** 5

## Coverage for WRITE-TESTS

- AC-1: Team-member sees "Mark Complete" on their own pending task → Example 1
- AC-2: Team-member does NOT see "Mark Complete" on a completed task they own → Example 2
- AC-3: Admin never sees "Mark Complete" on any task → Example 3
- AC-4: Loading indicator shown while request is in flight → Example 4
- AC-5: Task status does not change in UI before API confirms → Example 4
- AC-6: Task status updates to "Complete" after API success → Example 5
- AC-7: "Mark Complete" control disappears after task is completed → Example 5
- AC-8: Task list reflects new status correctly when filter is active → Example 6
- AC-9: No revert-to-pending control for any user → Example 8
- AC-10: Error message shown when API call fails → Example 7
- AC-11: Task status remains "Pending" after failed API call → Example 7
- AC-12: "Mark Complete" control restored after error for retry → Example 7

## Handoff Notes for WRITE-TESTS

- Only generate executable tests from examples in the test-design document
- Do not invent behavior not represented there or explicitly approved
- Preferred render scope: component (TaskDetailModal and/or task list row component, depending on where control is placed)
- The "Mark Complete" control placement (task list row vs. detail modal vs. both) must be confirmed from the existing implementation before writing tests. Check `web/src/components/tasks/` to determine where the control is rendered
- Suggested primary assertions:
  - `getByRole('button', { name: /mark complete/i })` — presence or absence based on role, assignment, and status
  - `queryByRole('button', { name: /mark complete/i })` — absence assertions for admin and completed tasks
  - Loading state: check for disabled state or loading spinner on the control after click, before API resolves
  - Error message: `getByText` or `getByRole('alert')` after mocked API failure
  - Status update: task row/card reflects "Complete" status after mocked API success
- Mock strategy:
  - Mock `POST /v1/tasks/{taskId}/complete` for success (200), failure (500), forbidden (403), and conflict (409)
  - Use `mockResolvedValueOnce` for in-flight state assertions (delay resolution for loading indicator test)
  - Provide current user context via auth mock (team-member vs. admin)
- Important ambiguity flags:
  - BA decision required on filter reactivity (Example 6) — default to immediate reactive update if not resolved
  - BA decision required on error dismissal mechanism (Example 7) — default to error persists until retry/dismiss if not resolved
  - BA decision required on 409 Conflict user messaging (Edge 2) — default to silent UI update if not resolved
  - Control placement is not fully specified in the story — check implementation before writing tests

## Testability Classification

| Scenario | Category | Reason |
| --- | --- | --- |
| Example 1: Team-member sees "Mark Complete" on pending own task | Unit-testable (RTL) | Conditional rendering based on role, assignee, and status — testable with props/context mocks |
| Example 2: Team-member does NOT see control on completed task | Unit-testable (RTL) | Conditional rendering check — straightforward absence assertion |
| Example 3: Admin does NOT see "Mark Complete" on any task | Unit-testable (RTL) | Role-based conditional rendering — testable with admin auth context mock |
| Example 4: Loading indicator while request is in flight | Unit-testable (RTL) | Can mock deferred API response and assert loading state before resolution |
| Example 5: Successful mark-complete — status updates, control disappears | Unit-testable (RTL) | API mock (200 OK) + state update assertions in RTL |
| Example 6: Successful mark-complete with Pending filter — task leaves view | Unit-testable (RTL) | Filter + status state update can be tested with component-level state mocks |
| Example 7: Failed mark-complete — error shown, status unchanged, control restored | Unit-testable (RTL) | API mock (500 error) + error display + control re-appearance assertions |
| Example 8: No revert control for any user | Unit-testable (RTL) | Absence of revert control for both roles — conditional render check |
| Edge 1: 403 Forbidden response | Unit-testable (RTL) | API mock (403) + error message assertion |
| Edge 2: 409 Conflict response | Unit-testable (RTL) | API mock (409) + status-update-to-complete assertion + control removal |
| Edge 3: Completed task appears in "Complete" filter view | Unit-testable (RTL) | Filter + post-success state update can be asserted with component state |

All scenarios in this story are unit-testable. No runtime verification needed.
