# Test Design: Task List View (Both Roles)

## Story Summary

**Epic:** 2 — Task Management
**Story:** 1 of 5
**As a** signed-in user
**I want to** see a list of tasks relevant to my role
**So that** I can immediately know what work is waiting and can filter it to focus on what matters.

## Review Purpose

This document presents concrete business examples for BA review before executable tests are written.

Its purpose is to:
- surface missing business decisions
- let the BA review behavior using examples and expected outcomes
- provide an approved source for downstream test generation

## Business Behaviors Identified

- A team-member visiting `/tasks` sees only the tasks assigned to them — never tasks assigned to other users.
- An admin visiting `/tasks/all` sees every task in the system, regardless of who it is assigned to. Each row includes the assigned user's display name.
- Both roles see the same three filter options: "All", "Pending", and "Complete". Applying a filter immediately narrows the displayed list without reloading the page.
- A team-member who has no tasks assigned sees the message "No tasks assigned to you yet."
- An admin who has no tasks in the system sees the message "No tasks have been created yet."
- When a filter is selected and no tasks match, an appropriate empty-state message appears instead of a blank list area.
- While task data is being fetched, a visible loading indicator replaces the task list.
- If the task list API call fails, a banner reading "Unable to load tasks. Please try again." is shown alongside a "Retry" button. Clicking Retry re-issues the API request.
- If Retry succeeds, the banner is removed and the task list is displayed.
- Unauthenticated users who attempt to access `/tasks` or `/tasks/all` are redirected to the sign-in page.
- A team-member who navigates to the admin-only route `/tasks/all` is silently redirected to `/tasks` — no error or "access denied" message is shown.

## Key Decisions Surfaced by AI

- **Empty-state message when filter returns no results:** AC-11 says "an appropriate empty state message" is shown. The exact wording is not specified in R3, R4, or R5. The BA should confirm the exact text. For example: "No tasks match this filter." or a role-specific variant.
- **Filter behavior on initial page load:** The story and FRS do not specify which filter value is pre-selected when the page first loads. "All" is assumed as the default, but the BA should confirm.
- **Loading indicator form:** The story requires a "visible loading indicator" (AC-12) but does not specify whether this is a spinner, skeleton rows, or a progress bar. The BA does not need to specify the exact form, but any deviation from skeleton rows should be noted if there is a design preference.
- **Error banner position and persistence:** The FRS and story do not specify where the error banner appears (top of page, above the list, inline) or whether it auto-dismisses after a successful Retry. The BA should confirm whether the banner disappears automatically on success or requires the user to dismiss it manually. (AC-15 implies it disappears automatically.)
- **Task fields shown in list row:** AC-2 states "at minimum" title, due date, and status for team-member. AC-4 states "at minimum" title, assigned user's display name, due date, and status for admin. The phrase "at minimum" implies additional fields may be shown. The BA should confirm whether any extra fields (e.g., description snippet) are required, or whether exactly those fields are intended.

## Test Scenarios / Review Examples

### 1. Team-member sees only their own tasks

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (role: team-member) |
| Tasks assigned to Jordan | Task A "Write weekly report" (pending, due 2026-04-20), Task B "Update documentation" (complete, due 2026-04-15) |
| Tasks assigned to other users | Task C "Approve budget" (pending, due 2026-04-18) — assigned to Sam Chen |

| Input | Value |
| --- | --- |
| User visits | `/tasks` |

| Expected | Value |
| --- | --- |
| Tasks shown | "Write weekly report" and "Update documentation" |
| Tasks NOT shown | "Approve budget" (belongs to Sam Chen) |
| Each row shows | Task title, due date, current status |

---

### 2. Admin sees all tasks with assigned user names

| Setup | Value |
| --- | --- |
| Signed-in user | Alex Rivera (role: admin) |
| Tasks in system | Task A "Write weekly report" assigned to Jordan Lee (pending), Task B "Approve budget" assigned to Sam Chen (pending), Task C "Update onboarding docs" assigned to Jordan Lee (complete) |

| Input | Value |
| --- | --- |
| User visits | `/tasks/all` |

| Expected | Value |
| --- | --- |
| Tasks shown | All three tasks |
| Each row shows | Task title, assigned user's display name, due date, current status |
| Row for Task A | "Write weekly report" — Jordan Lee — 2026-04-20 — Pending |
| Row for Task B | "Approve budget" — Sam Chen — 2026-04-18 — Pending |
| Row for Task C | "Update onboarding docs" — Jordan Lee — 2026-04-15 — Complete |

---

### 3. Status filter — show only pending tasks

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| Tasks assigned | "Write weekly report" (pending), "Update documentation" (complete) |
| Page state | Task list loaded, both tasks visible, filter showing "All" |

| Input | Value |
| --- | --- |
| User selects filter | "Pending" |

| Expected | Value |
| --- | --- |
| Task shown | "Write weekly report" |
| Task hidden | "Update documentation" |
| Page reload | None — list updates in place |

---

### 4. Status filter — show only completed tasks

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| Tasks assigned | "Write weekly report" (pending), "Update documentation" (complete) |
| Page state | Filter set to "Pending", only "Write weekly report" visible |

| Input | Value |
| --- | --- |
| User selects filter | "Complete" |

| Expected | Value |
| --- | --- |
| Task shown | "Update documentation" |
| Task hidden | "Write weekly report" |
| Page reload | None — list updates in place |

---

### 5. Status filter — return to "All"

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| Page state | Filter set to "Complete", only "Update documentation" visible |

| Input | Value |
| --- | --- |
| User selects filter | "All" |

| Expected | Value |
| --- | --- |
| Tasks shown | Both "Write weekly report" and "Update documentation" |

---

### 6. Team-member empty state — no tasks assigned

| Setup | Value |
| --- | --- |
| Signed-in user | Morgan Blake (team-member) |
| Tasks assigned to Morgan | None |

| Input | Value |
| --- | --- |
| User visits | `/tasks` |

| Expected | Value |
| --- | --- |
| Message displayed | "No tasks assigned to you yet." |
| Task list | Not shown (no rows, no blank table) |

---

### 7. Admin empty state — no tasks in system

| Setup | Value |
| --- | --- |
| Signed-in user | Alex Rivera (admin) |
| Tasks in system | None |

| Input | Value |
| --- | --- |
| User visits | `/tasks/all` |

| Expected | Value |
| --- | --- |
| Message displayed | "No tasks have been created yet." |
| Task list | Not shown |

---

### 8. Loading state while tasks are being fetched

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| API state | Task list request is in flight (not yet returned) |

| Input | Value |
| --- | --- |
| User visits | `/tasks` |

| Expected | Value |
| --- | --- |
| Visible indicator | A loading indicator is shown where the task list will appear |
| Task list | Not shown until data arrives |

---

### 9. API failure — error banner with Retry

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| API behavior | `GET /v1/tasks` returns a server error (500) |

| Input | Value |
| --- | --- |
| User visits | `/tasks` |

| Expected | Value |
| --- | --- |
| Banner message | "Unable to load tasks. Please try again." |
| Retry button | Visible alongside or below the banner |
| Task list | Not shown |

---

### 10. Retry succeeds — banner clears, list appears

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| Page state | Error banner visible, task list not shown |
| API behavior on retry | Returns successfully with Jordan's tasks |

| Input | Value |
| --- | --- |
| User clicks | "Retry" button |

| Expected | Value |
| --- | --- |
| Error banner | Disappears |
| Task list | Displays Jordan's tasks |

> **BA decision required:** Does the banner disappear automatically when the Retry call succeeds, or does the user need to dismiss it manually after the list loads?
>
> Options:
> - Option A: Banner disappears automatically when data loads successfully (implied by AC-15).
> - Option B: Banner remains until the user dismisses it manually, even after data loads.

---

### 11. Route protection — admin-only route for team-member

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |

| Input | Value |
| --- | --- |
| User navigates to | `/tasks/all` |

| Expected | Value |
| --- | --- |
| Result | User is silently redirected to `/tasks` |
| Error or message shown | None |

---

### 12. Route protection — unauthenticated user

| Setup | Value |
| --- | --- |
| User state | Not signed in |

| Input | Value |
| --- | --- |
| User attempts to visit | `/tasks` or `/tasks/all` |

| Expected | Value |
| --- | --- |
| Result | Redirected to the sign-in page |

---

## Edge and Alternate Examples

### Filter produces no results

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| Tasks assigned | "Write weekly report" (pending) — no completed tasks |
| Page state | Filter set to "All", one task visible |

| Input | Value |
| --- | --- |
| User selects filter | "Complete" |

| Expected | Value |
| --- | --- |
| Task list | No rows shown |
| Empty-state message | An appropriate message is shown (exact wording: see BA decision) |

> **BA decision required:** What is the exact empty-state message when a filter returns no results?
>
> Options:
> - Option A: "No tasks match this filter." (generic, works for both roles)
> - Option B: Role-specific variant, e.g., "You have no completed tasks." / "No completed tasks found."
> - Option C: The same role-specific empty-state message used for the no-tasks case (R4/R5 wording)

---

### All tasks are filtered away for admin

| Setup | Value |
| --- | --- |
| Signed-in user | Alex Rivera (admin) |
| Tasks in system | All tasks have status "pending" |

| Input | Value |
| --- | --- |
| User selects filter | "Complete" |

| Expected | Value |
| --- | --- |
| Empty-state message | An appropriate message is shown (same BA decision as above applies) |

---

### Retry fails again

| Setup | Value |
| --- | --- |
| Signed-in user | Jordan Lee (team-member) |
| Page state | Error banner visible after initial failure |
| API behavior on retry | Returns another server error (500) |

| Input | Value |
| --- | --- |
| User clicks | "Retry" button |

| Expected | Value |
| --- | --- |
| Error banner | Remains visible (or reappears) |
| Task list | Not shown |

> **BA decision required:** When Retry itself fails, should the error banner remain as-is, or should the UI give any additional indication (e.g., "Still unavailable. Please try later.")?
>
> Options:
> - Option A: The same banner remains, no additional message.
> - Option B: A slightly different message is shown after repeated failures.

---

## Out of Scope / Not For This Story

- Clicking a task row to open the task detail modal (Story 2)
- The "Mark Complete" control on task rows (Story 5)
- The "Create Task" button and form (Story 3)
- Edit and delete task actions (Story 4)
- Pagination of the task list (not in v1 scope)
- Search functionality (explicitly excluded by R15)
- Overdue indicators or due-date highlighting (excluded by R16)
- In-app notifications (excluded by R17)
