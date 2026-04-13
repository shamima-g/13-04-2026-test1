/**
 * MSW Mock Handlers — Team Task Management
 * Source: generated-docs/specs/api-spec.yaml
 * Base URL: http://localhost:3001/api
 *
 * These handlers intercept API calls during development and testing.
 * They return realistic fixture data matching the OpenAPI spec schemas.
 */

import { http, HttpResponse } from 'msw';
import type {
  User,
  Task,
  ListTasksResponse,
  ListUsersResponse,
  ErrorResponse,
  TaskStatus,
} from '@/types/api-generated';

const BASE_URL = 'http://localhost:3001/api';

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    displayName: 'Alice Chen',
    email: 'alice@example.com',
    role: 'team-member',
  },
  {
    id: 'user-2',
    displayName: 'Bob Torres',
    email: 'bob@example.com',
    role: 'team-member',
  },
  {
    id: 'admin-1',
    displayName: 'Carol Admin',
    email: 'carol@example.com',
    role: 'admin',
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Fix login bug',
    description:
      'The authentication flow fails when the session token expires mid-request.',
    dueDate: '2026-05-01',
    assignedUserId: 'user-1',
    assignedUser: MOCK_USERS[0],
    status: 'pending',
    createdAt: '2026-04-01T09:00:00.000Z',
    updatedAt: '2026-04-01T09:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Write API documentation',
    description: 'Document the new API endpoints.',
    dueDate: '2026-04-20',
    assignedUserId: 'user-1',
    assignedUser: MOCK_USERS[0],
    status: 'complete',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-10T14:30:00.000Z',
  },
  {
    id: 'task-3',
    title: 'Review pull request',
    description: null,
    dueDate: '2026-04-25',
    assignedUserId: 'user-2',
    assignedUser: MOCK_USERS[1],
    status: 'pending',
    createdAt: '2026-04-05T11:00:00.000Z',
    updatedAt: '2026-04-05T11:00:00.000Z',
  },
];

// In-memory mutable store for mock state during tests
let mockTasks: Task[] = [...MOCK_TASKS];

/** Reset mock task store to initial fixture state (call in beforeEach for tests) */
export const resetMockTasks = () => {
  mockTasks = [...MOCK_TASKS];
};

// ---------------------------------------------------------------------------
// Helpers — untyped to allow flexible returns in multi-branch handlers
// ---------------------------------------------------------------------------

const errorResponse = (
  message: string,
  code: string,
  status: number,
  details?: string[],
) =>
  HttpResponse.json(
    {
      error: message,
      code,
      ...(details ? { details } : {}),
    } satisfies ErrorResponse,
    { status },
  );

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const handlers = [
  // -------------------------------------------------------------------------
  // GET /auth/me — return the team-member user by default
  // Override in tests by using server.use(http.get(...))
  // -------------------------------------------------------------------------
  http.get(`${BASE_URL}/auth/me`, () => {
    return HttpResponse.json(MOCK_USERS[0] satisfies User);
  }),

  // -------------------------------------------------------------------------
  // GET /tasks — list tasks (role-scoped in real API; mock returns all)
  // Supports ?status=pending|complete filtering
  // -------------------------------------------------------------------------
  http.get(`${BASE_URL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') as TaskStatus | null;
    const limit = parseInt(url.searchParams.get('limit') ?? '100', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    let filtered = mockTasks;
    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    const paginated = filtered.slice(offset, offset + limit);
    return HttpResponse.json({
      tasks: paginated,
      total: filtered.length,
    } satisfies ListTasksResponse);
  }),

  // -------------------------------------------------------------------------
  // POST /tasks — create a new task (admin only)
  // -------------------------------------------------------------------------
  http.post(`${BASE_URL}/tasks`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      description?: string | null;
      dueDate: string;
      assignedUserId: string;
    };

    if (!body.title || body.title.trim().length === 0) {
      return errorResponse('Title is required', 'VALIDATION_ERROR', 400, [
        'title: Title is required',
      ]);
    }

    if (body.title.length > 200) {
      return errorResponse(
        'Title must be 200 characters or fewer',
        'VALIDATION_ERROR',
        400,
        ['title: Title must be 200 characters or fewer'],
      );
    }

    if (!body.dueDate) {
      return errorResponse('Due date is required', 'VALIDATION_ERROR', 400, [
        'dueDate: Due date is required',
      ]);
    }

    const assignedUser = MOCK_USERS.find((u) => u.id === body.assignedUserId);
    if (!assignedUser) {
      return errorResponse('Assigned user not found', 'VALIDATION_ERROR', 400, [
        'assignedUserId: Must reference an existing user',
      ]);
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: body.title,
      description: body.description ?? null,
      dueDate: body.dueDate,
      assignedUserId: body.assignedUserId,
      assignedUser,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTasks = [...mockTasks, newTask];
    return HttpResponse.json(newTask satisfies Task, { status: 201 });
  }),

  // -------------------------------------------------------------------------
  // GET /tasks/{taskId} — task detail
  // -------------------------------------------------------------------------
  http.get(`${BASE_URL}/tasks/:taskId`, ({ params }) => {
    const task = mockTasks.find((t) => t.id === params.taskId);
    if (!task) return errorResponse('Task not found', 'NOT_FOUND', 404);
    return HttpResponse.json(task satisfies Task);
  }),

  // -------------------------------------------------------------------------
  // PATCH /tasks/{taskId} — update task (admin only)
  // -------------------------------------------------------------------------
  http.patch(`${BASE_URL}/tasks/:taskId`, async ({ params, request }) => {
    const taskIndex = mockTasks.findIndex((t) => t.id === params.taskId);
    if (taskIndex === -1)
      return errorResponse('Task not found', 'NOT_FOUND', 404);

    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      dueDate?: string;
    };

    if (body.title !== undefined) {
      if (body.title.trim().length === 0) {
        return errorResponse('Title is required', 'VALIDATION_ERROR', 400);
      }
      if (body.title.length > 200) {
        return errorResponse(
          'Title must be 200 characters or fewer',
          'VALIDATION_ERROR',
          400,
        );
      }
    }

    const updated: Task = {
      ...mockTasks[taskIndex],
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      updatedAt: new Date().toISOString(),
    };

    mockTasks = [
      ...mockTasks.slice(0, taskIndex),
      updated,
      ...mockTasks.slice(taskIndex + 1),
    ];

    return HttpResponse.json(updated satisfies Task);
  }),

  // -------------------------------------------------------------------------
  // DELETE /tasks/{taskId} — delete task (admin only)
  // -------------------------------------------------------------------------
  http.delete(`${BASE_URL}/tasks/:taskId`, ({ params }) => {
    const taskIndex = mockTasks.findIndex((t) => t.id === params.taskId);
    if (taskIndex === -1)
      return errorResponse('Task not found', 'NOT_FOUND', 404);

    mockTasks = [
      ...mockTasks.slice(0, taskIndex),
      ...mockTasks.slice(taskIndex + 1),
    ];

    return new HttpResponse(null, { status: 204 });
  }),

  // -------------------------------------------------------------------------
  // POST /tasks/{taskId}/complete — mark task complete (team-member only)
  // -------------------------------------------------------------------------
  http.post(`${BASE_URL}/tasks/:taskId/complete`, ({ params }) => {
    const taskIndex = mockTasks.findIndex((t) => t.id === params.taskId);
    if (taskIndex === -1)
      return errorResponse('Task not found', 'NOT_FOUND', 404);

    const task = mockTasks[taskIndex];

    if (task.status === 'complete') {
      return errorResponse('Task is already complete', 'CONFLICT', 409);
    }

    // In the mock we cannot check the current user's role/id — tests should
    // override this handler with server.use() to test role-based rejections.
    const updated: Task = {
      ...task,
      status: 'complete',
      updatedAt: new Date().toISOString(),
    };

    mockTasks = [
      ...mockTasks.slice(0, taskIndex),
      updated,
      ...mockTasks.slice(taskIndex + 1),
    ];

    return HttpResponse.json(updated satisfies Task);
  }),

  // -------------------------------------------------------------------------
  // GET /users — list all users (admin only)
  // -------------------------------------------------------------------------
  http.get(`${BASE_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '200', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    const paginated = MOCK_USERS.slice(offset, offset + limit);
    return HttpResponse.json({
      users: paginated,
      total: MOCK_USERS.length,
    } satisfies ListUsersResponse);
  }),
];
