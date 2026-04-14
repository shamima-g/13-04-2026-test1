# Story: Task List View (Both Roles)

**Epic:** Task Management | **Story:** 1 of 5 | **Wireframe:** N/A

**Role:** All Roles

**Requirements:** [R1](../specs/feature-requirements.md#functional-requirements), [R2](../specs/feature-requirements.md#functional-requirements), [R3](../specs/feature-requirements.md#functional-requirements), [R4](../specs/feature-requirements.md#functional-requirements), [R5](../specs/feature-requirements.md#functional-requirements), [R14](../specs/feature-requirements.md#functional-requirements), [BR9](../specs/feature-requirements.md#business-rules), [BR10](../specs/feature-requirements.md#business-rules)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/tasks` (team-member), `/tasks/all` (admin) |
| **Target File** | `app/(protected)/tasks/page.tsx`, `app/(protected)/tasks/all/page.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As a** signed-in user **I want** to see a list of tasks relevant to my role **So that** I can immediately know what work is waiting and can filter it to focus on what matters.

## Acceptance Criteria

### Team-Member Task List (R1)

- [ ] AC-1: Given I am signed in as a team-member and I visit `/tasks`, when the page loads, then I see a list showing only tasks assigned to me.
- [ ] AC-2: Given I am signed in as a team-member and I have tasks assigned to me, when the page loads, then each task in the list shows at minimum the task title, due date, and current status.

### Admin All-Tasks View (R2)

- [ ] AC-3: Given I am signed in as an admin and I visit `/tasks/all`, when the page loads, then I see a list of all tasks across all team members.
- [ ] AC-4: Given I am signed in as an admin and tasks exist, when the page loads, then each task in the list shows at minimum the task title, assigned user's display name, due date, and current status.

### Status Filter (R3)

- [ ] AC-5: Given I am on the task list page, when the page loads, then I see a status filter with the options "All", "Pending", and "Complete".
- [ ] AC-6: Given I am on the task list page and I select "Pending" from the status filter, then the list immediately updates to show only pending tasks without a page reload.
- [ ] AC-7: Given I am on the task list page and I select "Complete" from the status filter, then the list immediately updates to show only completed tasks without a page reload.
- [ ] AC-8: Given I am on the task list page and I select "All" from the status filter, then the list immediately updates to show all tasks regardless of status.

### Empty States (R4, R5)

- [ ] AC-9: Given I am signed in as a team-member and no tasks are assigned to me, when the page loads, then I see the message "No tasks assigned to you yet."
- [ ] AC-10: Given I am signed in as an admin and no tasks have been created, when the page loads, then I see the message "No tasks have been created yet."
- [ ] AC-11: Given I am on the task list page and I select a status filter that results in no matching tasks, when the filter is applied, then I see an appropriate empty state message rather than a blank list.

### Loading State

- [ ] AC-12: Given I visit the task list page, when the task data is being fetched, then I see a visible loading indicator in place of the task list.

### Error Banner and Retry (R14)

- [ ] AC-13: Given I am on the task list page and the task list API call fails, when the error occurs, then I see a banner with the message "Unable to load tasks. Please try again."
- [ ] AC-14: Given the error banner is visible, when I click the "Retry" button, then the application re-requests the task list from the API.
- [ ] AC-15: Given I clicked "Retry" and the API call succeeds this time, when the data loads, then the error banner disappears and the task list is displayed.

### Route Protection (BR9, BR10)

- [ ] AC-16: Given I am not signed in and I try to visit `/tasks` or `/tasks/all`, when the page loads, then I am redirected to the sign-in page.
- [ ] AC-17: Given I am signed in as a team-member and I navigate to `/tasks/all`, when the page loads, then I am silently redirected to `/tasks` with no error message shown.

## API Endpoints (from OpenAPI spec)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/tasks` | Fetch role-scoped task list; accepts optional `status` query parameter |

## Implementation Notes

- The existing placeholder pages at `app/(protected)/tasks/page.tsx` and `app/(protected)/tasks/all/page.tsx` were created as shells in Epic 1. This story replaces their content with the real task list UI.
- For team-member: call `GET /v1/tasks` (no extra param needed — the API returns only assigned tasks for team-members based on their session).
- For admin: call `GET /v1/tasks` (API returns all tasks for admins).
- Status filtering: pass `status=pending` or `status=complete` as query param to `GET /v1/tasks`. On "All", omit the param.
- Use the existing `(protected)` layout group — it already calls `requireAuth()` for BR10 protection. The admin-only guard for `/tasks/all` was established in Epic 1 for BR9.
- Use the typed endpoint functions from `lib/api/endpoints.ts` (generated from the API spec in DESIGN).
- Build the task list as a client component (`"use client"`) so the filter interaction can update state without a full page navigation.
- The "Mark Complete" control (Story 5) and task detail click-through (Story 2) will be integrated on top of this list in subsequent stories. For this story, tasks are displayed but not yet clickable or actionable.
