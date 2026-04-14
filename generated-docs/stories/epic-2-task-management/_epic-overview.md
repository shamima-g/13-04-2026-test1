# Epic 2: Task Management

## Description

Delivers the full task management experience for both roles. Team members can view their assigned tasks, filter by status, open task details, and mark tasks complete. Admins can view all tasks, create new tasks, edit existing tasks, and delete tasks. Depends on Epic 1 (authentication and role-based routing must be complete first).

## Stories

1. **Task List View (Both Roles)** — Role-scoped task list with status filter, empty states, error banner with retry, and loading state. | File: `story-1-task-list-view.md` | Status: Pending
2. **Task Detail Modal** — Click any task to open a read-only detail overlay showing title, description, due date, assigned user display name, and current status. | File: `story-2-task-detail-modal.md` | Status: Pending
3. **Admin: Create Task** — "Create Task" button and form with title, description, due date, and assigned user. Inline validation, API submission, success toast, and error handling. | File: `story-3-admin-create-task.md` | Status: Pending
4. **Admin: Edit and Delete Task** — Edit title, description, due date from detail modal (assigned user locked). Delete flow with confirmation dialog. | File: `story-4-admin-edit-delete-task.md` | Status: Pending
5. **Team Member: Mark Task Complete** — "Mark Complete" control on pending tasks assigned to the current user. Loading indicator, status update on success, control removal after completion, and error handling. | File: `story-5-team-member-mark-complete.md` | Status: Pending
