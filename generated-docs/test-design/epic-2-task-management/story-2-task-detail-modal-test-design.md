# Test Design: Task Detail Modal

## Story Summary

**Epic:** 2 — Task Management
**Story:** 2 of 5
**As a** signed-in user
**I want to** click on a task and see its full details in an overlay
**So that** I can review all the information about a task without leaving the list.

## Review Purpose

This document presents concrete business examples for BA review before executable tests are written.

Its purpose is to:
- surface missing business decisions
- let the BA review behavior using examples and expected outcomes
- provide an approved source for downstream test generation

## Business Behaviors Identified

- Clicking any task row on the task list opens a modal overlay showing that task's full details.
- The modal always shows the task title, due date, the display name of the assigned user, and the current status ("Pending" or "Complete").
- If the task has a description, it appears in the modal. If the task has no description, the modal renders without error (no blank crash or "undefined" text).
- The modal can be dismissed by clicking outside of it or pressing the Escape key. After closing, the task list remains visible and unchanged.
- A team-member viewing the modal sees only task details — no edit, delete, or mark-complete controls are present in this story.
- An admin viewing the modal for a complete task sees only task details — no mark-complete control is shown (admins cannot mark tasks complete per BR7).
- The task detail data is returned by `GET /v1/tasks/{taskId}`. The API schema embeds the assigned user object (`assignedUser.displayName`), so a second request is not needed to display the assignee name.

## Key Decisions Surfaced by AI

- **Data source for modal content:** The API `Task` schema includes an embedded `assignedUser` object. The modal can be populated either from the task list response data (if the list already returns all required fields including `assignedUser`) or from a fresh `GET /v1/tasks/{taskId}` call triggered when the user clicks. The choice affects loading state behavior — if a separate API call is needed, the modal should show a loading state while it fetches. The story says "consider whether description is already present in the list response" — this is a decision the BA and tech lead should confirm.
- **Status display format:** The story says the modal shows the status as "Pending" or "Complete" (title case). The API returns `pending` or `complete` (lower case). Confirm: should the UI capitalize/transform these values for display, or is there an agreed display label?
- **Due date display format:** The API returns `dueDate` as an ISO 8601 date string (e.g., `2026-05-15`). The story does not specify how the date is displayed in the modal (e.g., "May 15, 2026" vs "15/05/2026" vs "2026-05-15"). Confirm the expected display format.
- **No-description placeholder text:** AC-4 says "the description area is either empty or shows a placeholder — no error is shown." Should a specific placeholder text appear (e.g., "No description provided"), or should the description section simply be absent/hidden?

## Test Scenarios / Review Examples

### 1. Team-member opens a pending task with a description

| Setup | Value |
| --- | --- |
| Signed-in user | Sarah Chen (role: team-member) |
| Task assigned to Sarah | "Update onboarding docs" — status: pending, due: May 15 2026, description: "Revise the first three sections" |
| Other tasks in the system | Tasks assigned to other users (not visible to Sarah) |

| Input | Value |
| --- | --- |
| Action | Sarah clicks the "Update onboarding docs" row |

| Expected | Value |
| --- | --- |
| Modal opens | Yes — overlay appears on top of the task list |
| Title shown | "Update onboarding docs" |
| Description shown | "Revise the first three sections" |
| Due date shown | May 15, 2026 (formatted date) |
| Assigned user shown | "Sarah Chen" |
| Status shown | "Pending" |
| Edit or delete controls visible | No |
| Mark Complete control visible | No (this story does not include that control) |

---

### 2. Team-member opens a complete task

| Setup | Value |
| --- | --- |
| Signed-in user | Sarah Chen (role: team-member) |
| Task assigned to Sarah | "Review Q1 report" — status: complete, due: Apr 1 2026 |

| Input | Value |
| --- | --- |
| Action | Sarah clicks the "Review Q1 report" row |

| Expected | Value |
| --- | --- |
| Modal opens | Yes |
| Status shown | "Complete" |
| No mark-complete control | Correct — this story does not add that control |
| All other task details visible | Yes (title, due date, assignee name) |

---

### 3. Admin opens a pending task from the all-tasks view

| Setup | Value |
| --- | --- |
| Signed-in user | Alex Rivera (role: admin) |
| Task in the system | "Prepare budget forecast" — assigned to Jordan Kim, status: pending, due: Jun 30 2026 |

| Input | Value |
| --- | --- |
| Action | Alex clicks the "Prepare budget forecast" row |

| Expected | Value |
| --- | --- |
| Modal opens | Yes |
| Title shown | "Prepare budget forecast" |
| Due date shown | Jun 30, 2026 |
| Assigned user shown | "Jordan Kim" |
| Status shown | "Pending" |
| Edit or delete controls visible | No (those come in Stories 3 and 4) |
| Mark Complete control visible | No (admins cannot mark tasks complete — BR7) |

---

### 4. Admin opens a complete task

| Setup | Value |
| --- | --- |
| Signed-in user | Alex Rivera (role: admin) |
| Task in the system | "Archive old records" — assigned to Morgan Lee, status: complete, due: Mar 1 2026 |

| Input | Value |
| --- | --- |
| Action | Alex clicks the "Archive old records" row |

| Expected | Value |
| --- | --- |
| Modal opens | Yes |
| Status shown | "Complete" |
| No mark-complete control | Correct — admins cannot mark tasks complete |
| All task details visible | Yes (title, due date, assignee "Morgan Lee") |

---

### 5. User closes the modal by clicking outside

| Setup | Value |
| --- | --- |
| Signed-in user | Sarah Chen (role: team-member) |
| Modal state | Modal is open showing task "Update onboarding docs" |
| Task list state before modal opened | Showing 3 tasks, "Pending" filter selected |

| Input | Value |
| --- | --- |
| Action | Sarah clicks outside the modal overlay area |

| Expected | Value |
| --- | --- |
| Modal closes | Yes — overlay disappears |
| Task list visible | Yes |
| Filter state preserved | "Pending" still selected |
| Task list items unchanged | Same 3 tasks still shown |

---

### 6. User closes the modal by pressing Escape

| Setup | Value |
| --- | --- |
| Modal state | Open, showing any task |

| Input | Value |
| --- | --- |
| Action | User presses Escape key |

| Expected | Value |
| --- | --- |
| Modal closes | Yes |
| Task list returns to previous state | Yes |

---

### 7. Task with no description — no placeholder text specified

| Setup | Value |
| --- | --- |
| Task | "Fix printer" — no description field set (null/empty) |

| Input | Value |
| --- | --- |
| Action | User clicks the task row |

| Expected | Value |
| --- | --- |
| Modal opens without error | Yes |
| No "undefined" or blank crash shown | Correct |
| Description area | Empty or placeholder text (BA to confirm exact behavior) |

> **BA decision required:** When a task has no description, what should the modal show in the description area?
>
> Options:
> - Option A: The description section is hidden entirely (no label, no empty space).
> - Option B: The description label is shown but the value area is blank.
> - Option C: A placeholder text such as "No description provided" is shown in muted/secondary style.

---

### 8. Loading state while fetching task detail (if separate API call is used)

| Setup | Value |
| --- | --- |
| Data source decision | Team decides to call `GET /v1/tasks/{taskId}` on click rather than reuse list data |
| Network condition | Simulated slow response (e.g., 500ms delay) |

| Input | Value |
| --- | --- |
| Action | User clicks a task row |

| Expected | Value |
| --- | --- |
| Modal opens immediately | Yes — the dialog shell appears |
| Loading indicator shown | Yes — a spinner or skeleton visible while fetch is in flight |
| Task details shown | After the API responds successfully |

> **BA decision required:** Should the modal show a loading state while task detail is fetched, or should data be pre-populated from the list (no separate fetch needed)?
>
> Options:
> - Option A: Reuse the task object from the list response (no separate fetch). Modal shows data immediately. Simpler but relies on the list returning all fields including `assignedUser`.
> - Option B: Always call `GET /v1/tasks/{taskId}` on click. Modal shows a loading indicator briefly. Guarantees fresh/complete data.
> - Option C: Try to use list data first; fall back to fetch if any field is missing.

## Edge and Alternate Examples

### Task with a very long title

| Setup | Value |
| --- | --- |
| Task title | 198-character string (near the 200-char maximum) |

| Input | Value |
| --- | --- |
| Action | User clicks the task row |

| Expected | Value |
| --- | --- |
| Modal opens without truncation error | Yes — title displays in full or wraps within the modal |
| No UI overflow or clipping that hides content | Correct |

---

### Task detail API call fails (if separate fetch is used)

| Setup | Value |
| --- | --- |
| Data source | Separate `GET /v1/tasks/{taskId}` call |
| API response | 500 Server Error |

| Input | Value |
| --- | --- |
| Action | User clicks a task row |

| Expected | Value |
| --- | --- |
| Modal opens | Yes |
| Error state shown inside modal | Yes — an error message is visible (exact wording TBD) |
| App does not crash | Correct |

> **BA decision required:** If the task detail API call fails, what should appear inside the modal?
>
> Options:
> - Option A: A generic error message ("Unable to load task details. Please try again.") with a Retry button.
> - Option B: The modal closes automatically and a toast error is shown on the list page.
> - Option C: Only relevant if Option A from the data-source decision is chosen — if list data is reused, this scenario does not apply.

---

### Clicking a different task after one is already open

| Setup | Value |
| --- | --- |
| Modal state | Open showing task "Update onboarding docs" |

| Input | Value |
| --- | --- |
| Action | User closes the modal, then clicks a different task "Review Q1 report" |

| Expected | Value |
| --- | --- |
| Second modal opens correctly | Yes — shows "Review Q1 report" details |
| No stale data from first task shown | Correct — content reflects the newly clicked task |

## Out of Scope / Not For This Story

- Edit controls in the modal (Story 4 — Admin Edit/Delete Task)
- Delete controls in the modal (Story 4 — Admin Edit/Delete Task)
- Mark Complete control in the modal (Story 5 — Team Member Mark Complete)
- Creating a new task from the modal (Story 3 — Admin Create Task)
- Preventing a team-member from seeing tasks not assigned to them via modal URL manipulation (this is enforced by the API returning 403; the UI does not need to handle it separately beyond displaying an error)
- Overdue indicators or visual highlighting (R16 — explicitly out of scope in v1)
- Search functionality (R15 — explicitly out of scope in v1)
