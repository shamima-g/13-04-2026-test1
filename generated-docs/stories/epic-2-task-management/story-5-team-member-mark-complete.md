# Story: Team Member: Mark Task Complete

**Epic:** Task Management | **Story:** 5 of 5 | **Wireframe:** N/A

**Role:** team-member

**Requirements:** [R11](../specs/feature-requirements.md#functional-requirements), [R12](../specs/feature-requirements.md#functional-requirements), [R13](../specs/feature-requirements.md#functional-requirements), [BR6](../specs/feature-requirements.md#business-rules), [BR7](../specs/feature-requirements.md#business-rules), [BR8](../specs/feature-requirements.md#business-rules)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/tasks` (control appears on task list and/or detail modal) |
| **Target File** | `app/(protected)/tasks/page.tsx`, `components/tasks/TaskDetailModal.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As a** team-member **I want** to mark one of my assigned pending tasks as complete **So that** I can record my progress and let the team know the work is done.

## Acceptance Criteria

### Mark Complete Control Availability (R11, BR6, BR7, BR8)

- [ ] AC-1: Given I am signed in as a team-member and I have a pending task assigned to me, when I view that task, then I can see a "Mark Complete" control.
- [ ] AC-2: Given I am signed in as a team-member and a task assigned to me is already complete, when I view that task, then I do not see a "Mark Complete" control.
- [ ] AC-3: Given I am signed in as an admin, when I view any task, then I do not see a "Mark Complete" control on any task.

### Loading Indicator (R12)

- [ ] AC-4: Given I click "Mark Complete" on a pending task assigned to me, when the request is sent to the API, then a loading indicator is shown on that task's control while the request is in flight.
- [ ] AC-5: Given the "Mark Complete" request is in flight, when I look at the task, then the task's status has not yet changed in the UI — the update only happens after the API responds.

### Successful Completion (R12, R13)

- [ ] AC-6: Given I clicked "Mark Complete" and the API confirms the change, when the response arrives, then the task's status updates to "Complete" in the UI.
- [ ] AC-7: Given the task has been marked complete, when I look at the task, then the "Mark Complete" control is no longer shown.
- [ ] AC-8: Given the task has been marked complete and I have a status filter active, when the task status updates, then the list correctly reflects the new status (for example, the task disappears from "Pending" filter and appears under "Complete" filter).

### No Revert Allowed (BR8)

- [ ] AC-9: Given a task has status "Complete", when I view it as any user, then there is no control to change it back to "Pending".

### Error Handling (R12)

- [ ] AC-10: Given I clicked "Mark Complete" and the API call fails, when the failure occurs, then an error message is shown indicating the update did not go through.
- [ ] AC-11: Given the "Mark Complete" API call failed, when the error is shown, then the task's status remains unchanged — it still shows as pending.
- [ ] AC-12: Given the error message is shown after a failed "Mark Complete", when the error is dismissed or I retry, then the "Mark Complete" control is restored so I can try again.

## API Endpoints (from OpenAPI spec)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/tasks/{taskId}/complete` | Mark a task as complete (team-member only, own tasks) |

## Implementation Notes

- The "Mark Complete" control should only be visible and enabled when: (1) the user is a team-member, (2) the task is assigned to the current user, and (3) the task status is "pending".
- The control may appear both in the task list (Story 1) and in the task detail modal (Story 2). Decide on placement based on UX clarity — a button within the modal is the most natural location, but a quick-action on the list row is also acceptable.
- `POST /v1/tasks/{taskId}/complete` — no request body needed.
- Optimistic UI updates are acceptable but not required. The spec says: status updates in the UI only after the API confirms (R12 — "status updates in the UI only after the API confirms the change"). Do not update the UI before the response arrives.
- After a successful complete, update the task status in local state rather than triggering a full list refetch.
- The 403 response from the API covers two cases: admin attempting to mark complete (BR7), and team-member attempting to mark complete a task not assigned to them (BR6). Since the UI should never show the control in these cases, a 403 is a defensive fallback — display a generic "Unable to complete this task" error if it occurs.
- A 409 response means the task was already complete (BR8). Handle this gracefully by refreshing the task status in the UI and removing the control.
- This is the final story in Epic 2. The QA phase for this story should include manual verification of the full task management experience across Stories 1–5, including: task list display, detail modal, create task, edit/delete, and mark complete.
