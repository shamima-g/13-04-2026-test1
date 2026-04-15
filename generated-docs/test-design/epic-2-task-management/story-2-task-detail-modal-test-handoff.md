# Test Handoff: Task Detail Modal

> Engineering document for downstream agents. Not reviewed by the BA.

**Source:** [story-2-task-detail-modal-test-design.md](./story-2-task-detail-modal-test-design.md)
**Epic:** 2 | **Story:** 2

## Coverage for WRITE-TESTS

Every AC from the story file is mapped below.

- AC-1: Clicking a task opens a modal overlay → Example 1, Example 3
- AC-2: Modal shows task title → Example 1, Example 2, Example 3, Example 4
- AC-3: Modal shows description when present → Example 1
- AC-4: Modal shows no error when task has no description → Edge Example "Task with no description"
- AC-5: Modal shows the task's due date → Example 1, Example 3
- AC-6: Modal shows the display name of the assigned user → Example 1, Example 3
- AC-7: Modal shows current status ("Pending" or "Complete") → Example 1 (pending), Example 2 (complete)
- AC-8: Modal closes on outside click or Escape key → Example 5 (outside click), Example 6 (Escape)
- AC-9: Task list visible and unchanged after modal closes → Example 5
- AC-10: Team-member modal shows no edit or delete controls → Example 1, Example 2
- AC-11: Admin viewing complete task modal sees no mark-complete control → Example 4

## Handoff Notes for WRITE-TESTS

- Only generate executable tests from examples in the test-design document.
- Do not invent behavior not represented there or explicitly approved.
- **Preferred render scope:** Component-level (`TaskDetailModal.tsx`) rendered with mocked props, plus integration-level tests that simulate a user clicking a task row in the task list page and asserting the modal appears.
- **Data source decision is unresolved (BA decision required):** Write tests that mock the task data as if passed as props to the modal component. This avoids committing to a fetch strategy until the BA/tech lead decides. If the decision is made to always call `GET /v1/tasks/{taskId}`, add a test that mocks that API call and asserts the modal shows a loading state then populated data.
- **Status display format:** The API returns `pending` / `complete` (lowercase). Tests should assert that the UI displays "Pending" / "Complete" (title case). If the BA confirms a different format, update accordingly.
- **Due date format:** Tests should assert a human-readable date format. Use `May 15, 2026` as the expected display value for an ISO date of `2026-05-15` unless BA confirms otherwise.
- **No-description scenario:** Write a test asserting the modal renders without crashing when `description` is null/undefined. The exact expected rendered output (hidden section vs. placeholder text) is a BA decision — write the test to assert "no error thrown" and "no 'undefined' text visible", then update with the confirmed placeholder text after BA decides.
- **Suggested primary assertions:**
  - Modal dialog element appears in the DOM after a task row is clicked
  - Title, due date, assignee display name, and status are each visible in the modal
  - No edit/delete/mark-complete controls are rendered inside the modal (for this story's scope)
  - Modal is absent from the DOM after clicking outside or pressing Escape
  - Task list content is still rendered after modal closes
- **Important ambiguity flags:**
  - Loading state behavior (separate fetch vs. list data reuse) — BA decision required; tests should cover the chosen path only
  - No-description display (hidden vs. placeholder) — BA decision required; stub with "no crash" test for now
  - API error handling inside modal (if separate fetch) — BA decision required; stub with error boundary test if applicable
  - Due date display format — needs BA/design confirmation before asserting specific formatted strings

## Testability Classification

| Scenario | Category | Reason |
| --- | --- | --- |
| 1. Team-member opens a pending task with description | Unit-testable (RTL) | Component renders correct content from mocked task props |
| 2. Team-member opens a complete task | Unit-testable (RTL) | Component renders "Complete" status from mocked task props |
| 3. Admin opens a pending task | Unit-testable (RTL) | Same component, different role context; no controls rendered |
| 4. Admin opens a complete task | Unit-testable (RTL) | Same component; confirms no mark-complete control |
| 5. Close modal by clicking outside | Unit-testable (RTL) | Shadcn Dialog handles overlay click; can be triggered in RTL with userEvent |
| 6. Close modal by pressing Escape | Unit-testable (RTL) | Keyboard event can be fired in RTL with userEvent.keyboard |
| 7. Task with no description | Unit-testable (RTL) | Component receives null description prop; asserts no crash and no "undefined" text |
| 8. Loading state (if separate API fetch) | Unit-testable (RTL) | Mock the API call with a delayed promise; assert spinner visible then replaced by content |
| Task with very long title | Unit-testable (RTL) | Render component with 198-char title; assert title appears in DOM without truncation error |
| API call failure inside modal | Unit-testable (RTL) | Mock rejected API call; assert error state rendered inside modal |
| Clicking second task after first | Unit-testable (RTL) | Click first task, close modal, click second task; assert modal shows second task's data |

All scenarios in this story are unit-testable. No runtime verification needed.
