# Manual Verification Checklist
## Story 4: Admin Edit and Delete Task
**Route:** `/tasks/all`

> **Note:** The test-handoff for this story states that all scenarios are fully unit-testable (RTL) with no runtime verification needed. However, since the feature is accessible in the browser at `/tasks/all`, the checklist below covers key end-to-end flows for optional browser confirmation.

### Setup
- [ ] Sign in as an admin user
- [ ] Navigate to the All Tasks page (`/tasks/all`)

### Edit Controls
- [ ] You can see an "Edit" button when you open any task's detail panel
- [ ] You do NOT see an Edit button when signed in as a team member

### Entering Edit Mode
- [ ] Clicking "Edit" switches the panel to an edit form with fields for title, description, and due date
- [ ] All fields are pre-filled with the task's current values
- [ ] The assigned user is shown but cannot be changed

### Saving Changes
- [ ] Changing the title and clicking "Save" updates the title in the panel AND in the task list
- [ ] Changing the description and saving updates the description in the panel
- [ ] Changing the due date and saving updates the due date in the panel

### Validation
- [ ] Clearing the title and clicking "Save" shows "Title is required" (API is not called)
- [ ] Entering a title longer than 200 characters shows "Title is too long" (API is not called)
- [ ] Clearing the due date and clicking "Save" shows "Due date is required" (API is not called)

### Cancelling an Edit
- [ ] Clicking "Cancel" in edit mode returns the panel to read-only view with original values intact

### Delete Controls
- [ ] You can see a "Delete" button when you open any task's detail panel (as admin)
- [ ] You do NOT see a Delete button when signed in as a team member

### Delete Confirmation Flow
- [ ] Clicking "Delete" shows a confirmation message: "Delete this task? This cannot be undone."
- [ ] Clicking "Cancel" in the confirmation view closes the confirmation but keeps the panel open and the task in the list
- [ ] Clicking "Delete" in the confirmation view removes the task from the list and closes the panel

### Error Handling (if testable manually)
- [ ] If the save fails, an error message appears in the panel and the original task values are preserved
- [ ] If the delete fails, an error message appears in the panel and the task remains in the list
