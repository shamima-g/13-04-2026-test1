# Story: Admin: Edit and Delete Task

**Epic:** Task Management | **Story:** 4 of 5 | **Wireframe:** N/A

**Role:** admin

**Requirements:** [R9](../specs/feature-requirements.md#functional-requirements), [R10](../specs/feature-requirements.md#functional-requirements), [BR5](../specs/feature-requirements.md#business-rules)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/tasks/all` (edit/delete controls appear in the task detail modal) |
| **Target File** | `app/(protected)/tasks/all/page.tsx`, `components/tasks/TaskDetailModal.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As an** admin **I want** to edit a task's title, description, and due date, or delete a task entirely **So that** I can keep task information accurate and remove work that is no longer needed.

## Acceptance Criteria

### Edit Controls Visible for Admin (R9)

- [x] AC-1: Given I am signed in as an admin and I open a task's detail modal, when the modal opens, then I can see an edit control (button or icon) to edit the task.
- [x] AC-2: Given I am signed in as a team-member and I open a task's detail modal, when the modal opens, then I do not see any edit control.

### Editing a Task (R9, BR5)

- [x] AC-3: Given I am an admin and I activate the edit control in the task detail modal, when I click it, then the modal switches to an edit mode showing the title, description, and due date as editable fields.
- [x] AC-4: Given the task is in edit mode, when I look at the assigned user field, then it is shown but cannot be changed — it is locked or read-only (BR5).
- [x] AC-5: Given I am in edit mode and I change the title to something valid and save, when the API accepts the change, then the modal updates to show the new title.
- [x] AC-6: Given I am in edit mode and I change the description and save, when the API accepts the change, then the modal updates to show the new description.
- [x] AC-7: Given I am in edit mode and I change the due date and save, when the API accepts the change, then the modal updates to show the new due date.
- [x] AC-8: Given I am in edit mode and I save valid changes, when the save succeeds, then the task list in the background also reflects the updated values.

### Edit Validation (BR1, BR3)

- [x] AC-9: Given I am in edit mode and I clear the title field and try to save, when I attempt to save, then I see an inline validation message that the title is required.
- [x] AC-10: Given I am in edit mode and I enter a title longer than 200 characters, when I attempt to save, then I see an inline validation message that the title is too long.
- [x] AC-11: Given I am in edit mode and I clear the due date and try to save, when I attempt to save, then I see an inline validation message that a due date is required.

### Edit Error Handling

- [x] AC-12: Given I am in edit mode and I submit valid changes, when the API call fails, then an error message is shown in the modal and the original task values are preserved — no partial update is displayed.
- [x] AC-13: Given the edit error message is visible, when I try saving again, then the application retries the API call.

### Cancelling an Edit

- [x] AC-14: Given I am in edit mode and I cancel without saving, when I cancel, then the modal returns to the read-only detail view showing the original task values unchanged.

### Delete Controls Visible for Admin (R10)

- [x] AC-15: Given I am signed in as an admin and I open a task's detail modal, when the modal opens, then I can see a delete control (button) to delete the task.
- [x] AC-16: Given I am signed in as a team-member and I open a task's detail modal, when the modal opens, then I do not see any delete control.

### Delete Confirmation Flow (R10)

- [x] AC-17: Given I am an admin and I click the delete control in the task detail modal, when I click it, then a confirmation dialog opens with the message "Delete this task? This cannot be undone."
- [x] AC-18: Given the delete confirmation dialog is open, when I confirm the deletion, then the API is called to delete the task.
- [x] AC-19: Given the deletion is confirmed and the API succeeds, when the task is deleted, then the modal closes and the task is no longer visible in the all-tasks list.
- [x] AC-20: Given the delete confirmation dialog is open, when I cancel without confirming, then the dialog closes, the task detail modal remains open, and the task is not deleted.

### Delete Error Handling

- [x] AC-21: Given I confirmed deletion and the API call fails, when the failure occurs, then an error message is shown and the task remains in the list — it is not removed.

## API Endpoints (from OpenAPI spec)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/v1/tasks/{taskId}` | Update editable fields of an existing task |
| DELETE | `/v1/tasks/{taskId}` | Permanently delete a task |

## Implementation Notes

- Edit and delete controls should only be rendered for admins. Check role from session before rendering these controls.
- Use a Shadcn `<AlertDialog />` for the delete confirmation — not a plain `<Dialog />`. The AlertDialog is designed for destructive confirmations.
- `PATCH /v1/tasks/{taskId}` request body accepts any combination of `{ title, description, dueDate }`. The `assignedUserId` field cannot be sent in an update request.
- The assigned user field must be visibly present in edit mode but rendered as disabled/read-only to communicate BR5 clearly to the admin.
- After a successful edit, update both the modal display and the task list — avoid a full page reload.
- After a successful delete, close the modal and remove the task from the list without reloading the page.
- This story extends the `TaskDetailModal` built in Story 2. Add the edit/delete controls and edit mode to that component.
- Note: Stories 2, 4, and 5 all extend the same modal component. The QA phase for Story 5 (the last to extend the modal) should include manual verification of the full modal experience across all three stories.
