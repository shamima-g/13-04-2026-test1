# Test Design: Admin: Edit and Delete Task

## Story Summary

**Epic:** 2
**Story:** 4
**As an** admin
**I want to** edit a task's title, description, and due date, or delete a task entirely
**So that** I can keep task information accurate and remove work that is no longer needed.

## Review Purpose

This document presents concrete business examples for BA review before executable tests are written.

Its purpose is to:
- surface missing business decisions
- let the BA review behavior using examples and expected outcomes
- provide an approved source for downstream test generation

## Business Behaviors Identified

- Edit and delete controls are shown exclusively to admins inside the task detail modal; team-members never see them.
- Clicking the edit control puts the modal into an edit mode with title, description, and due date as editable fields; the assigned user is shown but locked.
- Saving a valid edit calls PATCH `/v1/tasks/{taskId}` and, on success, updates both the modal view and the background task list without a page reload.
- Inline validation prevents saving an empty title, a title over 200 characters, or a missing due date — error messages appear without hitting the API.
- Cancelling edit mode returns the modal to its original read-only view with no changes applied.
- Clicking delete triggers a confirmation dialog with the exact message "Delete this task? This cannot be undone."
- Confirming deletion calls DELETE `/v1/tasks/{taskId}` and, on success, closes the modal and removes the task from the list.
- Cancelling the delete confirmation leaves the modal open and the task untouched.
- If the PATCH call fails, an error message appears inside the modal and the original values are preserved.
- If the DELETE call fails, an error message appears and the task remains in the list.

## Key Decisions Surfaced by AI

- **Edit mode entry trigger:** The story says "activate the edit control" but does not specify whether a single click or a separate "Edit" button inside the view mode is used. The implementation note references "a button or icon." The test examples assume a clearly labelled **"Edit"** button, but the exact control label and form should be confirmed.
- **Exact validation message wording:** The story specifies that a validation message is shown but does not give exact copy. Examples use representative text; BA should confirm required copy.
- **Retry behaviour on edit failure:** AC-13 says clicking save again retries the API call. The examples assume the error message remains visible until a successful save — BA should confirm whether the error is cleared as soon as the user starts typing again or only on the next save attempt.
- **Task list update mechanism:** AC-8 says the task list also updates after a successful edit. The examples verify the updated title appears in the list without a page reload. BA should confirm this covers all editable fields or just title.
- **Edit mode exit on successful save:** After PATCH succeeds, the modal returns to the read-only detail view. BA should confirm this (vs keeping the modal in edit mode after save).

## Test Scenarios / Review Examples

### 1. Admin sees edit and delete controls; team-member does not

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | "Write Q2 report", assigned to Alice, due 2026-05-01, status pending |

| Input | Value |
| --- | --- |
| Action | Open task detail modal |

| Expected | Value |
| --- | --- |
| Edit control visible | Yes — "Edit" button or icon is present |
| Delete control visible | Yes — "Delete" button is present |

---

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice) |
| Task | "Write Q2 report", assigned to Alice, due 2026-05-01, status pending |

| Input | Value |
| --- | --- |
| Action | Open task detail modal |

| Expected | Value |
| --- | --- |
| Edit control visible | No |
| Delete control visible | No |

---

### 2. Admin enters edit mode

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | "Write Q2 report", assigned to Alice, due 2026-05-01, status pending |
| Modal state | Open in read-only view |

| Input | Value |
| --- | --- |
| Action | Click the Edit control |

| Expected | Value |
| --- | --- |
| Modal switches to edit mode | Yes |
| Title field | Editable, pre-populated with "Write Q2 report" |
| Description field | Editable, pre-populated with existing description |
| Due date field | Editable, pre-populated with 2026-05-01 |
| Assigned user field | Visible but read-only (cannot be changed) |

---

### 3. Admin saves a valid title change

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | task ID: task-101, title "Write Q2 report" |
| Modal state | Edit mode |

| Input | Value |
| --- | --- |
| New title | "Write Q3 report" |
| Description | unchanged |
| Due date | unchanged |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| API call | PATCH `/v1/tasks/task-101` with `{ title: "Write Q3 report" }` |
| Modal | Returns to read-only view showing "Write Q3 report" |
| Task list | Row for task-101 now shows "Write Q3 report" |
| Error message | None |

---

### 4. Admin saves a valid description change

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | task ID: task-101, description: "First draft only" |
| Modal state | Edit mode |

| Input | Value |
| --- | --- |
| New description | "Final version with sign-off" |
| Title | unchanged |
| Due date | unchanged |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| API call | PATCH `/v1/tasks/task-101` with `{ description: "Final version with sign-off" }` |
| Modal | Returns to read-only view showing the new description |
| Error message | None |

---

### 5. Admin saves a valid due date change

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | task ID: task-101, due date: 2026-05-01 |
| Modal state | Edit mode |

| Input | Value |
| --- | --- |
| New due date | 2026-06-15 |
| Title | unchanged |
| Description | unchanged |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| API call | PATCH `/v1/tasks/task-101` with `{ dueDate: "2026-06-15" }` |
| Modal | Returns to read-only view showing 2026-06-15 as due date |
| Error message | None |

---

### 6. Admin cancels an edit

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | "Write Q2 report", due 2026-05-01 |
| Modal state | Edit mode with title changed to "Abandoned edit" |

| Input | Value |
| --- | --- |
| Action | Click Cancel |

| Expected | Value |
| --- | --- |
| Modal | Returns to read-only detail view |
| Displayed title | "Write Q2 report" (original, unchanged) |
| API call | None |

---

### 7. Delete confirmation dialog appears

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | "Write Q2 report" |
| Modal state | Open in read-only view |

| Input | Value |
| --- | --- |
| Action | Click the Delete control |

| Expected | Value |
| --- | --- |
| Confirmation dialog | Opens |
| Dialog message | "Delete this task? This cannot be undone." |

---

### 8. Admin confirms deletion — success

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | task ID: task-101, "Write Q2 report" |
| Dialog state | Confirmation dialog open |

| Input | Value |
| --- | --- |
| Action | Click Confirm (or equivalent "Delete" button in dialog) |

| Expected | Value |
| --- | --- |
| API call | DELETE `/v1/tasks/task-101` |
| Modal | Closes |
| Task list | "Write Q2 report" row is no longer visible |
| Error message | None |

---

### 9. Admin cancels deletion

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | "Write Q2 report" |
| Dialog state | Confirmation dialog open |

| Input | Value |
| --- | --- |
| Action | Click Cancel in the confirmation dialog |

| Expected | Value |
| --- | --- |
| Confirmation dialog | Closes |
| Task detail modal | Remains open |
| Task | Still present in list |
| API call | None |

---

### 10. Edit API call fails — error shown, original values preserved

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | task ID: task-101, title "Write Q2 report" |
| Modal state | Edit mode |
| API behaviour | PATCH returns 500 Server Error |

| Input | Value |
| --- | --- |
| New title | "Write Q3 report" |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| Error message | Visible inline inside the modal (edit mode) |
| Modal | Remains in edit mode — admin's edited values ("Write Q3 report") are preserved in the fields |
| Displayed title in fields | "Write Q3 report" (admin's edits retained so they can retry without re-entering) |
| Task list | Still shows "Write Q2 report" (no partial update applied) |

**Resolved (Option A):** On PATCH failure, the modal stays in edit mode with the admin's changes preserved in the fields and an inline error message shown. The admin can retry by clicking Save again or correct their input before saving.

---

### 11. Admin retries after edit failure

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | task ID: task-101 |
| Modal state | Error message visible from previous failed save |
| API behaviour | PATCH now returns 200 OK |

| Input | Value |
| --- | --- |
| Action | Click Save again (without changing any field values) |

| Expected | Value |
| --- | --- |
| API call | PATCH `/v1/tasks/task-101` retried |
| On success | Modal shows updated values, error message cleared |

---

### 12. Delete API call fails — error shown, task remains

| Setup | Value |
| --- | --- |
| Signed-in user | admin |
| Task | task ID: task-101, "Write Q2 report" |
| Dialog state | Confirmation dialog — admin confirmed |
| API behaviour | DELETE returns 500 Server Error |

| Input | Value |
| --- | --- |
| Action | (Confirmation already clicked) |

| Expected | Value |
| --- | --- |
| Error message | Visible inline inside the task detail modal |
| Modal | Stays open |
| Task | Still in the list — not removed |

**Resolved (Option A):** On DELETE failure, the error message is shown inline inside the task detail modal. The modal remains open and the task is not removed from the list.

---

## Edge and Alternate Examples

### A. Title exactly at 200 characters — valid save

| Input | Value |
| --- | --- |
| Title | Exactly 200 characters (e.g., 200 × "A") |
| Other fields | Valid |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| API call | PATCH fires with the 200-character title |
| Error message | None |

---

### B. Title blank — validation error, no API call

| Setup | Value |
| --- | --- |
| Modal state | Edit mode |

| Input | Value |
| --- | --- |
| Title | (empty — cleared by admin) |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| Inline validation message | Title is required (or similar) |
| API call | None — blocked by client-side validation |

---

### C. Title 201 characters — validation error, no API call

| Input | Value |
| --- | --- |
| Title | 201 characters |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| Inline validation message | Title is too long (max 200 characters) |
| API call | None — blocked by client-side validation |

---

### D. Due date cleared — validation error, no API call

| Setup | Value |
| --- | --- |
| Modal state | Edit mode |

| Input | Value |
| --- | --- |
| Due date | (cleared by admin) |
| Action | Click Save |

| Expected | Value |
| --- | --- |
| Inline validation message | Due date is required |
| API call | None — blocked by client-side validation |

---

### E. Assigned user field is locked in edit mode

| Setup | Value |
| --- | --- |
| Task | Assigned to Alice |
| Modal state | Edit mode |

| Input | Value |
| --- | --- |
| Action | Inspect the assigned user field |

| Expected | Value |
| --- | --- |
| Assigned user field | Visible, shows "Alice" |
| Field state | Read-only / disabled — no interaction possible |

---

## Out of Scope / Not For This Story

- Reassigning a task to a different user (locked by BR5; not permitted in any story).
- Marking a task as complete (covered in Story 5).
- Creating a new task (covered in Story 3).
- Viewing a task's detail without edit/delete controls (covered in Story 2).
- Filtering the task list (covered in Story 1).
- Team-member attempting to access admin routes (covered in Epic 1 auth/routing story).
- Any admin editing a task that belongs to a different tenant or workspace (not in scope for v1).
