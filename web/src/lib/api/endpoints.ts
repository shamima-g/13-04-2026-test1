/**
 * Typed API endpoint functions — Team Task Management
 * Source: generated-docs/specs/api-spec.yaml
 * Base URL: http://localhost:3001/api (configured via NEXT_PUBLIC_API_BASE_URL)
 *
 * All functions use the project API client (get, post, put, del helpers).
 * DO NOT call fetch() directly in components — always use these functions.
 */

import { get, post, del } from '@/lib/api/client';
import { apiClient } from '@/lib/api/client';
import type {
  User,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  ListTasksResponse,
  ListUsersResponse,
  ListTasksParams,
  ListUsersParams,
} from '@/types/api-generated';

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

/**
 * GET /auth/me
 * Returns the session user's id, displayName, email, and role.
 * Used to determine post-sign-in redirect and role-based UI (R1, R2, BR10).
 */
export const getCurrentUser = (): Promise<User> => get<User>('/auth/me');

// ---------------------------------------------------------------------------
// Task endpoints
// ---------------------------------------------------------------------------

/**
 * GET /tasks
 * Returns tasks visible to the authenticated user (role-scoped):
 * - team-member: only tasks assigned to them (R1)
 * - admin: all tasks regardless of assignment (R2)
 * Supports optional status filtering (R3).
 */
export const listTasks = (
  params?: ListTasksParams,
): Promise<ListTasksResponse> =>
  get<ListTasksResponse>(
    '/tasks',
    params as Record<string, string | number | boolean | undefined>,
  );

/**
 * POST /tasks
 * Creates a new task (admin only).
 * The assigned user is locked at creation and cannot be changed later (BR5).
 * R7, R8, BR1–BR5, BR7
 */
export const createTask = (data: CreateTaskRequest): Promise<Task> =>
  post<Task>('/tasks', data);

/**
 * GET /tasks/{taskId}
 * Returns full detail for a single task.
 * team-member may only fetch tasks assigned to them; admin may fetch any task.
 * R6, BR6, BR9
 */
export const getTask = (taskId: string): Promise<Task> =>
  get<Task>(`/tasks/${taskId}`);

/**
 * PATCH /tasks/{taskId}
 * Updates editable fields of an existing task: title, description, dueDate.
 * assignedUserId cannot be changed (BR5). Admin only.
 * R9, BR1–BR3, BR5, BR7
 */
export const updateTask = (
  taskId: string,
  data: UpdateTaskRequest,
): Promise<Task> =>
  apiClient<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/**
 * DELETE /tasks/{taskId}
 * Permanently deletes a task (admin only). Deletion is irreversible.
 * R10, BR7
 */
export const deleteTask = (taskId: string): Promise<void> =>
  del<void>(`/tasks/${taskId}`);

/**
 * POST /tasks/{taskId}/complete
 * Marks a pending task as complete.
 * Only the team-member to whom the task is assigned may call this (BR6).
 * Admins cannot mark tasks complete (BR7). Completion is final (BR8).
 * R11, R12, R13, BR6, BR7, BR8
 */
export const completeTask = (taskId: string): Promise<Task> =>
  post<Task>(`/tasks/${taskId}/complete`);

// ---------------------------------------------------------------------------
// User endpoints
// ---------------------------------------------------------------------------

/**
 * GET /users
 * Returns all user records for the task assignment dropdown (admin only).
 * Populates the assigned-user selector when creating a task (R7, BR4).
 */
export const listUsers = (
  params?: ListUsersParams,
): Promise<ListUsersResponse> =>
  get<ListUsersResponse>(
    '/users',
    params as Record<string, string | number | boolean | undefined>,
  );
