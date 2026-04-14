# Story: Admin: Create Task

**Epic:** Task Management | **Story:** 3 of 5 | **Wireframe:** N/A

**Role:** admin

**Requirements:** [R7](../specs/feature-requirements.md#functional-requirements), [R8](../specs/feature-requirements.md#functional-requirements), [BR1](../specs/feature-requirements.md#business-rules), [BR2](../specs/feature-requirements.md#business-rules), [BR3](../specs/feature-requirements.md#business-rules), [BR4](../specs/feature-requirements.md#business-rules)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/tasks/all` (create form opens as overlay on this page) |
| **Target File** | `app/(protected)/tasks/all/page.tsx`, `components/tasks/CreateTaskForm.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As an** admin **I want** to create a new task with a title, description, due date, and assigned team member **So that** I can assign work to the right person and track it through to completion.

## Acceptance Criteria

### Create Task Button (R7)

- [ ] AC-1: Given I am signed in as an admin and I am on the all-tasks view, when the page loads, then I see a "Create Task" button.
- [ ] AC-2: Given I am signed in as a team-member, when I am on my task list, then I do not see a "Create Task" button.

### Create Task Form (R7)

- [ ] AC-3: Given I am an admin and I click "Create Task", when the button is clicked, then a form opens with fields for title, description, due date, and assigned user.
- [ ] AC-4: Given the create task form is open, when I look at the form, then the assigned user field is a dropdown or select control populated with existing users — I cannot type a free-form name.

### Inline Validation (BR1, BR2, BR3, BR4)

- [ ] AC-5: Given the create task form is open and I submit it without entering a title, when I attempt to submit, then I see an inline validation message indicating the title is required.
- [ ] AC-6: Given the create task form is open and I enter a title longer than 200 characters, when I attempt to submit, then I see an inline validation message indicating the title is too long.
- [ ] AC-7: Given the create task form is open and I submit it without selecting a due date, when I attempt to submit, then I see an inline validation message indicating the due date is required.
- [ ] AC-8: Given the create task form is open and I submit it without selecting an assigned user, when I attempt to submit, then I see an inline validation message indicating an assigned user is required.
- [ ] AC-9: Given the create task form is open, when I fill in all required fields correctly and click submit, then no validation errors are shown and the form submission proceeds.

### Successful Submission (R8)

- [ ] AC-10: Given I have filled in a valid title, due date, and assigned user, when I submit the form and the API accepts the request, then the form closes.
- [ ] AC-11: Given the task was successfully created, when the form closes, then I am back on the all-tasks view and the new task appears in the list.
- [ ] AC-12: Given the task was successfully created, when the form closes, then I see a success toast notification confirming the task was created.

### Error Handling

- [ ] AC-13: Given I have filled in the form and submitted it, when the API call fails, then an error message is shown within the form — the form does not close.
- [ ] AC-14: Given the error message is visible in the form, when I correct any issues and resubmit, then the form retries the API call.

### Cancelling the Form

- [ ] AC-15: Given the create task form is open, when I cancel or close the form without submitting, then the form closes and the task list is unchanged.

## API Endpoints (from OpenAPI spec)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/tasks` | Create a new task (admin only) |
| GET | `/v1/users` | Fetch all users to populate the assigned-user selector |

## Implementation Notes

- Use a Shadcn `<Dialog />` for the create task form overlay. Never write a custom modal.
- Use Shadcn form components (`<Input />`, `<Textarea />`, `<Button />`) and a date picker component for due date.
- The assigned user dropdown must be populated from `GET /v1/users` (admin only). Load users when the form opens (or eagerly on page mount).
- The "Create Task" button should only be rendered for admins — check role from session before rendering.
- `POST /v1/tasks` request body: `{ title, description (optional), dueDate, assignedUserId }`.
- Use Zod validation from `lib/validation/` for client-side field validation matching BR1–BR4 rules (title 1–200 chars, dueDate required, assignedUserId required).
- Success toast: use the toast utility from `lib/toast/` or Shadcn's `useToast` hook.
- After successful creation, invalidate/refresh the task list so the new task appears immediately.
- Description is optional (BR2) — the field should accept empty input without validation error.
