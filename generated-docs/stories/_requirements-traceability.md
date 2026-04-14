# Requirements Traceability Matrix

Generated: 2026-04-14 | Feature: Team Task Management | Epics scoped: 2/2

## Coverage Summary
- **Functional Requirements:** 14/17 covered (82%)
- **Business Rules:** 10/10 covered (100%)
- **Non-Functional:** 1/6 covered (17%)
- **Compliance:** 0/0 covered (100%)
- **Uncovered:** R15, R16, R17, NFR2, NFR3, NFR4, NFR5, NFR6

## Functional Requirements

| Req ID | Description | Covered By |
|--------|-------------|------------|
| R1 | After sign-in, a team-member is directed to their personal task list, which s... | [Story 1: Authentication, Role Configuration, and Role-Based Routing](epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md), [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |
| R2 | After sign-in, an admin is directed to the all-tasks view, which shows every ... | [Story 1: Authentication, Role Configuration, and Role-Based Routing](epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md), [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |
| R3 | The task list can be filtered by status. The available filter values are "All... | [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |
| R4 | When a team-member's task list is empty (no tasks assigned to them), the page... | [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |
| R5 | When the admin all-tasks view contains no tasks, the page displays the messag... | [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |
| R6 | Clicking a task in the list opens a task detail modal overlay. The modal disp... | [Story 2: Task Detail Modal](epic-2-task-management/story-2-task-detail-modal.md) |
| R7 | An admin can create a new task using a "Create Task" button visible on the al... | [Story 3: Admin: Create Task](epic-2-task-management/story-3-admin-create-task.md) |
| R8 | After a task is successfully created, the admin is returned to the all-tasks ... | [Story 3: Admin: Create Task](epic-2-task-management/story-3-admin-create-task.md) |
| R9 | An admin can edit the title, description, and due date of an existing task. T... | [Story 4: Admin: Edit and Delete Task](epic-2-task-management/story-4-admin-edit-delete-task.md) |
| R10 | An admin can delete a task. Before deletion, a confirmation dialog is shown w... | [Story 4: Admin: Edit and Delete Task](epic-2-task-management/story-4-admin-edit-delete-task.md) |
| R11 | A team-member can mark one of their own assigned tasks as complete by activat... | [Story 5: Team Member: Mark Task Complete](epic-2-task-management/story-5-team-member-mark-complete.md) |
| R12 | While a mark-complete request is in flight, a loading indicator is shown on t... | [Story 5: Team Member: Mark Task Complete](epic-2-task-management/story-5-team-member-mark-complete.md) |
| R13 | Once a task is marked complete, the "Mark Complete" control is no longer show... | [Story 5: Team Member: Mark Task Complete](epic-2-task-management/story-5-team-member-mark-complete.md) |
| R14 | When the task list API call fails, an error banner is displayed with the mess... | [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |
| R15 | There is no search functionality in v1. | *UNCOVERED* |
| R16 | There are no overdue indicators or highlighting — all pending tasks are displ... | *UNCOVERED* |
| R17 | There are no in-app or email notifications in v1. | *UNCOVERED* |

## Business Rules

| Rule ID | Description | Covered By |
|--------|-------------|------------|
| BR1 | Task title is required and must be between 1 and 200 characters. Submission w... | [Story 3: Admin: Create Task](epic-2-task-management/story-3-admin-create-task.md) |
| BR2 | Task description is optional. There is no character limit enforced on the des... | [Story 3: Admin: Create Task](epic-2-task-management/story-3-admin-create-task.md) |
| BR3 | Due date is required. Submission without a due date is rejected and an inline... | [Story 3: Admin: Create Task](epic-2-task-management/story-3-admin-create-task.md) |
| BR4 | The assigned user must be selected from the list of existing users. Free-text... | [Story 3: Admin: Create Task](epic-2-task-management/story-3-admin-create-task.md) |
| BR5 | The assigned user is locked at the time of task creation. Admins cannot reass... | [Story 4: Admin: Edit and Delete Task](epic-2-task-management/story-4-admin-edit-delete-task.md) |
| BR6 | Only the team-member to whom a task is assigned may mark that task as complet... | [Story 5: Team Member: Mark Task Complete](epic-2-task-management/story-5-team-member-mark-complete.md) |
| BR7 | Admins cannot mark any task as complete. | [Story 5: Team Member: Mark Task Complete](epic-2-task-management/story-5-team-member-mark-complete.md) |
| BR8 | Task completion is final. Once a task has status "complete", no user can reve... | [Story 5: Team Member: Mark Task Complete](epic-2-task-management/story-5-team-member-mark-complete.md) |
| BR9 | A team-member who navigates to an admin-only route is silently redirected to ... | [Story 1: Authentication, Role Configuration, and Role-Based Routing](epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md), [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |
| BR10 | All routes require authentication. Unauthenticated users are redirected to th... | [Story 1: Authentication, Role Configuration, and Role-Based Routing](epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md), [Story 1: Task List View (Both Roles)](epic-2-task-management/story-1-task-list-view.md) |

## Non-Functional Requirements

| Req ID | Description | Covered By |
|--------|-------------|------------|
| NFR1 | The application meets WCAG 2.1 Level AA accessibility requirements. All inter... | [Story 1: Authentication, Role Configuration, and Role-Based Routing](epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md) |
| NFR2 | The task list view (both team-member and admin) loads and renders within 2 se... | *UNCOVERED* |
| NFR3 | The application is designed and optimised for desktop viewport widths. Tablet... | *UNCOVERED* |
| NFR4 | The application is tested against and supports the latest 2 released versions... | *UNCOVERED* |
| NFR5 | The application is light mode only. No dark mode or system-preference theming... | *UNCOVERED* |
| NFR6 | Authentication sessions use NextAuth defaults (30-day session duration). No f... | *UNCOVERED* |
