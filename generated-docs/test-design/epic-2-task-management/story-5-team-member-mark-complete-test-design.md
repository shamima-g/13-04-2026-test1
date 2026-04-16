# Test Design: Team Member: Mark Task Complete

## Story Summary

**Epic:** 2
**Story:** 5
**As a** team-member
**I want to** mark one of my assigned pending tasks as complete
**So that** I can record my progress and let the team know the work is done.

## Review Purpose

This document presents concrete business examples for BA review before executable tests are written.

Its purpose is to:
- surface missing business decisions
- let the BA review behavior using examples and expected outcomes
- provide an approved source for downstream test generation

## Business Behaviors Identified

- The "Mark Complete" control is only visible to a team-member viewing their own assigned pending tasks
- An admin never sees the "Mark Complete" control, regardless of which task they view
- A team-member does not see "Mark Complete" on a task assigned to them that is already complete
- Clicking "Mark Complete" triggers an API call and shows a loading indicator during the request
- The task status in the UI does not change until the API responds successfully
- After a successful API response, the task status updates to "Complete" and the control disappears
- The task list correctly reflects the new status when a filter is active
- If the API call fails, an error message is shown and the task status remains "Pending"
- After a failure, the "Mark Complete" control is restored so the user can retry
- No user (team-member or admin) can revert a completed task back to "Pending"

## Key Decisions Surfaced by AI

- **Control placement:** The story allows the "Mark Complete" button to appear in the task list row, the detail modal, or both. The placement decision affects which component(s) hold the API call logic and how error feedback is surfaced.
- **Error dismissal:** After a failed "Mark Complete", the story says the control is restored "when the error is dismissed or I retry." It is unspecified whether the error auto-dismisses after a timeout or requires an explicit user action (e.g., clicking a close/dismiss button).
- **Filter behavior after status update:** The story says the list "correctly reflects" the new status when a filter is active. It does not specify whether the completed task immediately disappears from a "Pending" filter or stays visible until the user re-applies the filter.
- **409 Conflict handling:** The API can return 409 when a task is already complete. The story says to "refresh the task status and remove the control." It is unspecified whether this also shows a user-visible message or is handled silently.

## Test Scenarios / Review Examples

### 1. Team-member sees "Mark Complete" on their own pending task

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Task | "Write quarterly report" (ID: t-001, status: pending, assigned to: u-101) |

| Input | Value |
| --- | --- |
| User action | Views their task list (or opens task detail modal) |

| Expected | Value |
| --- | --- |
| Control visible | "Mark Complete" button is shown on this task |
| Admin visibility | Not applicable (user is team-member) |

---

### 2. Team-member does NOT see "Mark Complete" on an already-completed task

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Task | "Update project plan" (ID: t-002, status: complete, assigned to: u-101) |

| Input | Value |
| --- | --- |
| User action | Views their task list (or opens task detail modal) |

| Expected | Value |
| --- | --- |
| Control visible | "Mark Complete" button is NOT shown on this task |

---

### 3. Admin does NOT see "Mark Complete" on any task

| Setup | Value |
| --- | --- |
| Signed-in user | admin (Bob, ID: u-200) |
| Tasks available | t-001 (pending, assigned to Alice), t-002 (complete, assigned to Alice) |

| Input | Value |
| --- | --- |
| User action | Views the all-tasks list or opens any task detail modal |

| Expected | Value |
| --- | --- |
| Control visible | "Mark Complete" is NOT shown on any task |

---

### 4. Loading indicator shown while "Mark Complete" request is in flight

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Task | "Write quarterly report" (ID: t-001, status: pending, assigned to: u-101) |

| Input | Value |
| --- | --- |
| User action | Clicks "Mark Complete" on task t-001; API response is delayed |

| Expected | Value |
| --- | --- |
| Loading indicator | A loading indicator is shown on the "Mark Complete" control |
| Task status in UI | Still shows "Pending" — no premature status change |
| Control state | Disabled or in loading state to prevent duplicate submission |

---

### 5. Successful mark-complete: task status updates and control disappears

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Task | "Write quarterly report" (ID: t-001, status: pending, assigned to: u-101) |

| Input | Value |
| --- | --- |
| User action | Clicks "Mark Complete" on task t-001; API responds 200 OK |

| Expected | Value |
| --- | --- |
| Task status | Updates to "Complete" |
| Control visible | "Mark Complete" button is no longer shown |
| Full page reload | Not triggered — only local state updated |

---

### 6. Successful mark-complete with "Pending" filter active — task leaves view

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Active filter | "Pending" |
| Task | "Write quarterly report" (ID: t-001, status: pending, assigned to: u-101) |

| Input | Value |
| --- | --- |
| User action | Clicks "Mark Complete" on task t-001; API responds 200 OK |

| Expected | Value |
| --- | --- |
| Task in list | Task disappears from the "Pending" filter view |
| No page reload | List updates without a full refresh |

> **BA decision required:** Does the task disappear from the "Pending" filter immediately after the API confirms (recommended UX), or does it remain visible until the user manually changes or re-applies the filter?
>
> Options:
> - Option A: Task disappears immediately from the "Pending" filter after status update (immediate reactive update)
> - Option B: Task remains visible until the user interacts with the filter again (deferred update)

---

### 7. Failed "Mark Complete" — error shown, status unchanged, control restored

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Task | "Write quarterly report" (ID: t-001, status: pending, assigned to: u-101) |

| Input | Value |
| --- | --- |
| User action | Clicks "Mark Complete" on task t-001; API responds with 500 error |

| Expected | Value |
| --- | --- |
| Error message | An error message is shown indicating the update did not go through |
| Task status | Still shows "Pending" — unchanged |
| Control visible | "Mark Complete" button is restored (available to retry) |

> **BA decision required:** How is the error dismissed?
>
> Options:
> - Option A: Error auto-dismisses after a short timeout (e.g., 3–5 seconds)
> - Option B: User must explicitly dismiss the error (e.g., click a close/dismiss button)
> - Option C: Error is replaced when the user retries the action

---

### 8. No revert-to-pending control for any user

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) OR admin (Bob, ID: u-200) |
| Task | Any task with status: complete |

| Input | Value |
| --- | --- |
| User action | Views the task (list row or detail modal) |

| Expected | Value |
| --- | --- |
| Revert control | No "Revert to Pending" or similar control is shown to any user |

---

## Edge and Alternate Examples

### Edge 1: 403 Forbidden response (defensive fallback)

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Task | t-001 (pending, but assigned to a different user — or admin sends request) |
| Note | The UI should prevent this from happening, but the API may return 403 as a fallback |

| Input | Value |
| --- | --- |
| User action | "Mark Complete" request sent; API responds with 403 |

| Expected | Value |
| --- | --- |
| Error message | A generic "Unable to complete this task" error is displayed |
| Task status | Unchanged (pending) |
| Control | Restored for retry |

---

### Edge 2: 409 Conflict response (task already complete)

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Task | t-001 — was pending in UI but was completed in another session/tab simultaneously |

| Input | Value |
| --- | --- |
| User action | Clicks "Mark Complete"; API responds with 409 Conflict |

| Expected | Value |
| --- | --- |
| Task status | Updates to "Complete" in the UI (reflect actual API state) |
| Control visible | "Mark Complete" button is removed |

> **BA decision required:** When a 409 Conflict is received (task already complete), should a message be shown to the user (e.g., "This task is already complete") or should the UI silently update to reflect the completed state?
>
> Options:
> - Option A: Show a brief informational message ("This task is already complete") then update status
> - Option B: Silently update the task status and remove the control (no message)

---

### Edge 3: Successful completion with "Complete" filter active — task appears in view

| Setup | Value |
| --- | --- |
| Signed-in user | team-member (Alice, ID: u-101) |
| Active filter | "Complete" |
| Task | t-001 (pending, but triggered mark-complete; view is currently showing only complete tasks) |

| Input | Value |
| --- | --- |
| User action | Mark Complete succeeds via API |

| Expected | Value |
| --- | --- |
| Task in list | Task appears in the "Complete" filter view |

---

## Out of Scope / Not For This Story

- Team-members viewing tasks assigned to other team-members (they cannot see those tasks — only their own appear in their list)
- Admin creating, editing, or deleting tasks (Stories 3 and 4)
- Task detail modal content display (Story 2)
- Task list loading, filtering, and empty state behavior not related to mark-complete (Story 1)
- Error banner for task list load failure (Story 1, R14)
- In-app notifications (R17 — out of scope for v1)
- Overdue indicators (R16 — out of scope for v1)
- User account management
