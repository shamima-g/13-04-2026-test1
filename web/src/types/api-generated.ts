/**
 * Generated TypeScript types from OpenAPI spec
 * Source: generated-docs/specs/api-spec.yaml
 * Feature: Team Task Management
 *
 * DO NOT EDIT MANUALLY — regenerate from spec when the API changes.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserRole = 'team-member' | 'admin';

export type TaskStatus = 'pending' | 'complete';

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/**
 * User — returned by GET /auth/me and embedded in Task objects.
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** The user's display name shown in task assignments */
  displayName: string;
  /** The user's email address */
  email: string;
  /** The user's role — determines access rights throughout the app */
  role: UserRole;
}

/**
 * Task — the primary domain object.
 * assignedUser is always embedded for display (avoids a second request, R6).
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  /** Task title (required, 1–200 chars, BR1) */
  title: string;
  /** Optional task description (no character limit in v1, BR2) */
  description: string | null;
  /** Due date for the task in ISO 8601 date format (required, BR3) */
  dueDate: string;
  /** ID of the user the task is assigned to (locked at creation, BR5) */
  assignedUserId: string;
  /** Embedded user object for display */
  assignedUser: User;
  /** Current task status. Completion is final — no revert to pending (BR8) */
  status: TaskStatus;
  /** Timestamp when the task was created */
  createdAt: string;
  /** Timestamp when the task was last updated */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

/**
 * CreateTaskRequest — body for POST /tasks (admin only).
 * assignedUserId is locked at creation and cannot be changed later (BR5).
 */
export interface CreateTaskRequest {
  /** Task title (required, 1–200 chars, BR1) */
  title: string;
  /** Optional task description (BR2) */
  description?: string | null;
  /** Due date in ISO 8601 date format (required, BR3) */
  dueDate: string;
  /** ID of the user to assign the task to — must reference an existing user (BR4) */
  assignedUserId: string;
}

/**
 * UpdateTaskRequest — body for PATCH /tasks/{taskId} (admin only).
 * All fields are optional; include only those to update.
 * assignedUserId is intentionally excluded (BR5).
 */
export interface UpdateTaskRequest {
  /** Updated task title (1–200 chars, BR1) */
  title?: string;
  /** Updated task description (BR2) */
  description?: string | null;
  /** Updated due date in ISO 8601 date format (BR3) */
  dueDate?: string;
}

// ---------------------------------------------------------------------------
// Response envelopes
// ---------------------------------------------------------------------------

/**
 * ListTasksResponse — envelope for GET /tasks.
 */
export interface ListTasksResponse {
  tasks: Task[];
  /** Total count of matching tasks (for pagination) */
  total: number;
}

/**
 * ListUsersResponse — envelope for GET /users.
 */
export interface ListUsersResponse {
  users: User[];
  total: number;
}

/**
 * ErrorResponse — standard error shape returned by all endpoints on failure.
 */
export interface ErrorResponse {
  /** Human-readable error message */
  error: string;
  /** Machine-readable error code (e.g., UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR) */
  code: string;
  /** Additional error details (e.g., field-level validation messages) */
  details?: string[];
}

// ---------------------------------------------------------------------------
// Query parameter types
// ---------------------------------------------------------------------------

/**
 * ListTasksParams — optional query parameters for GET /tasks.
 */
export interface ListTasksParams {
  /** Filter by task status. Omit to return all. */
  status?: TaskStatus;
  /** Maximum number of tasks to return (default 100, max 200) */
  limit?: number;
  /** Number of tasks to skip for pagination */
  offset?: number;
}

/**
 * ListUsersParams — optional query parameters for GET /users.
 */
export interface ListUsersParams {
  /** Maximum number of users to return (default 200, max 500) */
  limit?: number;
  /** Number of users to skip for pagination */
  offset?: number;
}
