# Story: Task Detail Modal

**Epic:** Task Management | **Story:** 2 of 5 | **Wireframe:** N/A

**Role:** All Roles

**Requirements:** [R6](../specs/feature-requirements.md#functional-requirements)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/tasks`, `/tasks/all` (modal overlays the list page) |
| **Target File** | `app/(protected)/tasks/page.tsx`, `app/(protected)/tasks/all/page.tsx`, `components/tasks/TaskDetailModal.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As a** signed-in user **I want** to click on a task and see its full details in an overlay **So that** I can review all the information about a task without leaving the list.

## Acceptance Criteria

### Opening the Modal (R6)

- [ ] AC-1: Given I am on the task list page and tasks are displayed, when I click on a task, then a modal overlay opens showing the task's details.
- [ ] AC-2: Given the task detail modal is open, when I look at the modal, then I can see the task title.
- [ ] AC-3: Given the task detail modal is open and the task has a description, when I look at the modal, then I can see the task description.
- [ ] AC-4: Given the task detail modal is open and the task has no description, when I look at the modal, then the description area is either empty or shows a placeholder — no error is shown.
- [ ] AC-5: Given the task detail modal is open, when I look at the modal, then I can see the task's due date.
- [ ] AC-6: Given the task detail modal is open, when I look at the modal, then I can see the display name of the user the task is assigned to.
- [ ] AC-7: Given the task detail modal is open, when I look at the modal, then I can see the current status of the task (either "Pending" or "Complete").

### Closing the Modal

- [ ] AC-8: Given the task detail modal is open, when I click outside the modal or press the Escape key, then the modal closes and I return to the task list.
- [ ] AC-9: Given the task detail modal is open, when I close it, then the task list is still visible and in the same state as before I opened the modal.

### Read-Only View

- [ ] AC-10: Given the task detail modal is open as a team-member, when I look at the modal, then there are no edit or delete controls — only task details are shown.
- [ ] AC-11: Given the task detail modal is open as an admin viewing a complete task, when I look at the modal, then I can see the task details without any controls to mark it complete.

## API Endpoints (from OpenAPI spec)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/tasks/{taskId}` | Fetch full detail for a single task |

## Implementation Notes

- Implement the modal as a Shadcn `<Dialog />` component. Never write a custom modal from scratch.
- The task detail can be fetched either when the user clicks (lazy load) or pre-populated from the list data. If using the list data, consider whether description is already present in the list response or requires a separate `GET /v1/tasks/{taskId}` call. Check the API spec's `Task` schema to determine if all required fields are returned by `GET /v1/tasks`.
- This story adds click handlers to the task rows built in Story 1 — integrate into the existing task list component.
- Admin-specific controls (edit, delete from Story 4) and team-member-specific controls (Mark Complete from Story 5) are NOT part of this story. Those stories will extend this modal.
- The modal is a client component. The task list page that hosts it may remain a server component if the modal and its state are isolated.
- Note: This story enables manual verification of the task detail behavior that will also be tested through Stories 4 and 5, which add controls to this same modal.
