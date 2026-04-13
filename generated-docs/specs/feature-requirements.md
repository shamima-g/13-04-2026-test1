# Feature: Team Task Management

## Problem Statement

Small teams need a centralised way to assign and track work. Currently tasks are scattered across emails and spreadsheets, making it hard to know what is pending and who owns it. This application gives admins a single place to create and manage tasks and gives team members a focused view of exactly what is assigned to them.

## User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| team-member | A standard employee who receives and completes assigned work | View their own assigned tasks only; mark their own assigned tasks as complete; no access to admin routes |
| admin | A manager or team lead responsible for work assignment | Create tasks; assign tasks to any team member; edit task title, description, and due date; delete tasks; view all tasks across all team members; cannot mark tasks complete |

## Functional Requirements

- **R1:** After sign-in, a team-member is directed to their personal task list, which shows only tasks assigned to them.
- **R2:** After sign-in, an admin is directed to the all-tasks view, which shows every task regardless of assignment.
- **R3:** The task list can be filtered by status. The available filter values are "All", "Pending", and "Complete". Selecting a value immediately updates the displayed list without a page reload.
- **R4:** When a team-member's task list is empty (no tasks assigned to them), the page displays the message "No tasks assigned to you yet."
- **R5:** When the admin all-tasks view contains no tasks, the page displays the message "No tasks have been created yet."
- **R6:** Clicking a task in the list opens a task detail modal overlay. The modal displays the task title, description (if present), due date, assigned user's display name, and current status.
- **R7:** An admin can create a new task using a "Create Task" button visible on the all-tasks view. The create form collects: title (required), description (optional), due date (required), and assigned user (required, selected from a list of existing users).
- **R8:** After a task is successfully created, the admin is returned to the all-tasks view and a success toast notification is shown.
- **R9:** An admin can edit the title, description, and due date of an existing task. The assigned user cannot be changed after task creation.
- **R10:** An admin can delete a task. Before deletion, a confirmation dialog is shown with the message "Delete this task? This cannot be undone." The task is deleted only after the admin confirms.
- **R11:** A team-member can mark one of their own assigned tasks as complete by activating a "Mark Complete" control. The control is only available on tasks assigned to that team-member with a status of "pending".
- **R12:** While a mark-complete request is in flight, a loading indicator is shown on the relevant task control. The status updates in the UI only after the API confirms the change.
- **R13:** Once a task is marked complete, the "Mark Complete" control is no longer shown for that task. No revert-to-pending action is available to any user.
- **R14:** When the task list API call fails, an error banner is displayed with the message "Unable to load tasks. Please try again." and a "Retry" button that re-triggers the request.
- **R15:** There is no search functionality in v1.
- **R16:** There are no overdue indicators or highlighting — all pending tasks are displayed with equal visual weight regardless of due date.
- **R17:** There are no in-app or email notifications in v1.

## Business Rules

- **BR1:** Task title is required and must be between 1 and 200 characters. Submission with an empty title or a title exceeding 200 characters is rejected and an inline validation message is shown.
- **BR2:** Task description is optional. There is no character limit enforced on the description field in v1.
- **BR3:** Due date is required. Submission without a due date is rejected and an inline validation message is shown.
- **BR4:** The assigned user must be selected from the list of existing users. Free-text entry of an assignee name is not permitted.
- **BR5:** The assigned user is locked at the time of task creation. Admins cannot reassign a task to a different user after it has been created.
- **BR6:** Only the team-member to whom a task is assigned may mark that task as complete. If a team-member attempts to mark complete a task not assigned to them, the API rejects the request.
- **BR7:** Admins cannot mark any task as complete.
- **BR8:** Task completion is final. Once a task has status "complete", no user can revert it to "pending".
- **BR9:** A team-member who navigates to an admin-only route is silently redirected to their task list. No error message is displayed.
- **BR10:** All routes require authentication. Unauthenticated users are redirected to the sign-in page.

## Data Model

| Entity | Key Fields | Relationships |
|--------|------------|---------------|
| Task | id, title (string, required, 1–200 chars), description (string, optional), dueDate (date, required), assignedUserId (ref → User.id), status (enum: pending \| complete), createdAt (timestamp), updatedAt (timestamp) | Belongs to one User (assigned user) |
| User | id, displayName (string), email (string), role (enum: team-member \| admin) | Has many Tasks (as assigned user) |

Notes:
- Tasks are standalone; there are no parent–child or blocking relationships between tasks.
- User account management (creating, editing, and deleting user records) is out of scope for v1 and is handled outside the application.

## Key Workflows

### Team-Member: View and Complete an Assigned Task

1. Team-member signs in and is redirected to their personal task list.
2. The task list displays all tasks assigned to them. If the list is empty, "No tasks assigned to you yet." is shown.
3. Team-member optionally filters the list by status (All / Pending / Complete).
4. Team-member clicks a task row to open the task detail modal.
5. Team-member activates "Mark Complete" on a pending task assigned to them.
6. A loading indicator appears on the control while the API request is in flight.
7. On API success, the task status in the UI updates to "complete" and the "Mark Complete" control is removed.
8. If the API call fails, an error message is displayed and the task status remains unchanged.

### Admin: Create a Task

1. Admin signs in and is redirected to the all-tasks view.
2. Admin clicks "Create Task".
3. A form (or modal) opens with fields: title, description, due date, and assigned user.
4. Admin fills in required fields and selects an assigned user from the existing-user list.
5. Admin submits the form.
6. On API success, the form closes, the admin is returned to the all-tasks view, and a success toast is shown.
7. If the API call fails, an error message is shown within the form and the admin can retry.

### Admin: Edit a Task

1. Admin opens a task's detail modal.
2. Admin activates the edit control.
3. Admin updates one or more of: title, description, due date. The assigned user field is disabled.
4. Admin saves changes.
5. On API success, the modal displays the updated values.
6. If the API call fails, an error message is shown and the original values are preserved.

### Admin: Delete a Task

1. Admin opens a task's detail modal or activates delete from the task list.
2. A confirmation dialog is shown: "Delete this task? This cannot be undone."
3. Admin confirms deletion.
4. On API success, the task is removed from the all-tasks view.
5. If the API call fails, an error message is shown and the task remains in the list.

### Error Recovery: Task List Load Failure

1. Application attempts to load the task list from the API.
2. The API call fails (network error or server error).
3. An error banner is displayed: "Unable to load tasks. Please try again." with a "Retry" button.
4. User clicks "Retry"; the application re-issues the API request.

## Compliance & Regulatory Requirements

No compliance domains were identified during intake screening. The application is for internal employees only, stores only standard employee identity data (id, displayName, email, role), and contains no payment, health, or other sensitive personal data requiring regulatory treatment.

## Non-Functional Requirements

- **NFR1:** The application meets WCAG 2.1 Level AA accessibility requirements. All interactive elements are operable via keyboard, have visible focus indicators, and carry appropriate ARIA labels where native semantics are insufficient.
- **NFR2:** The task list view (both team-member and admin) loads and renders within 2 seconds on a standard broadband connection.
- **NFR3:** The application is designed and optimised for desktop viewport widths. Tablet viewports are supported on a best-effort basis. Mobile viewports are out of scope for v1.
- **NFR4:** The application is tested against and supports the latest 2 released versions of Chrome, Firefox, Safari, and Edge.
- **NFR5:** The application is light mode only. No dark mode or system-preference theming is required in v1.
- **NFR6:** Authentication sessions use NextAuth defaults (30-day session duration). No forced session timeout or idle-logout is required in v1.

## Out of Scope

- Email notifications and in-app notifications
- File attachments on tasks
- Comments and activity history on tasks
- In-app user account management (creating, editing, and deleting users)
- Task priority levels
- Recurring tasks
- Reporting and analytics dashboards
- Dark mode and system-preference theming
- Mobile viewport support
- Task reassignment after creation
- Reverting a completed task to pending
- Task search
- Overdue task highlighting

## Source Traceability

| ID   | Source | Reference |
|------|--------|-----------|
| R1   | User input | Clarifying question: "Where does each role land after sign-in?" — team-member lands on personal task list |
| R2   | User input | Clarifying question: "Where does each role land after sign-in?" — admin lands on all-tasks view |
| R3   | User input | Clarifying question: "What filter/sort controls are available in v1?" — status filter only (pending/complete) |
| R4   | User input | Clarifying question: "What should appear when a list is empty?" — "No tasks assigned to you yet." for team-member |
| R5   | User input | Clarifying question: "What should appear when a list is empty?" — "No tasks have been created yet." for admin |
| R6   | User input | Clarifying question: "How is task detail presented?" — modal overlay |
| R7   | intake-manifest.json | context.projectDescription: "Admins can create tasks, assign them to any team member"; clarifying question on form fields |
| R8   | User input | Clarifying question: "What happens after task creation?" — returned to task list, success toast |
| R9   | intake-manifest.json | context.projectDescription: "edit due dates"; clarifying question confirmed title/description also editable, assigned user locked |
| R10  | intake-manifest.json | context.projectDescription: "delete tasks"; clarifying question confirmed deletion confirmation dialog |
| R11  | intake-manifest.json | context.projectDescription: "mark them complete"; clarifying questions confirmed team-member only, own tasks only |
| R12  | User input | Clarifying question: "When is the status change shown in the UI?" — after API confirmation, loading indicator during request |
| R13  | User input | Clarifying question: "Can a completed task be reverted?" — completion is final |
| R14  | User input | Clarifying question: "What happens when the API fails to load tasks?" — error banner with retry |
| R15  | User input | Clarifying question: "Is there search in v1?" — no search |
| R16  | User input | Clarifying question: "Should overdue tasks be highlighted?" — no overdue highlighting |
| R17  | User input | Clarifying question: "Are there notifications in v1?" — no notifications |
| BR1  | User input | Clarifying question on validation rules: title required, 1–200 characters |
| BR2  | User input | Clarifying question on validation rules: description optional |
| BR3  | User input | Clarifying question on validation rules: due date required |
| BR4  | User input | Clarifying question: "How is the assigned user selected?" — list of existing users, no free-text |
| BR5  | User input | Clarifying question: "Can an admin reassign a task after creation?" — assigned person locked at creation |
| BR6  | User input | Clarifying question: "Who can mark a task complete?" — only the assigned team-member; API enforces |
| BR7  | User input | Clarifying question: "Can admins mark tasks complete?" — admins cannot |
| BR8  | User input | Clarifying question: "Can a completed task be reverted?" — completion is final for all users |
| BR9  | User input | Clarifying question: "What happens when a team-member navigates to an admin route?" — silent redirect, no error |
| BR10 | intake-manifest.json | context.projectDescription: "Everyone must be signed in — no public access"; authMethod: "frontend-only" |
| NFR1 | User input | Clarifying question on accessibility: WCAG 2.1 Level AA |
| NFR2 | User input | Clarifying question on performance: task list loads within 2 seconds on standard broadband |
| NFR3 | User input | Clarifying question on responsive behavior: desktop-focused, tablet best-effort, mobile out of scope |
| NFR4 | User input | Clarifying question on browser support: latest 2 versions of Chrome, Firefox, Safari, Edge |
| NFR5 | User input | Clarifying question on theming: light mode only, no dark mode |
| NFR6 | User input | Clarifying question on session: NextAuth default 30-day session, no forced timeout |
