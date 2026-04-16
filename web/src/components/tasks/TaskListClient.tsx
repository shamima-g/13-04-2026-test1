'use client';

/**
 * TaskListClient — Task List View (Both Roles)
 *
 * Client component that renders the task list with status filtering,
 * empty states, loading state, and error/retry handling.
 *
 * Used by:
 *   - app/(protected)/tasks/page.tsx        (team-member, route: /tasks)
 *   - app/(protected)/tasks/all/page.tsx    (admin, route: /tasks/all)
 *
 * Story: generated-docs/stories/epic-2-task-management/story-1-task-list-view.md
 * AC-1–AC-15 implemented here. AC-16 and AC-17 are handled at the layout/page level.
 *
 * BA Decisions:
 * 1. Empty filter message: "No tasks match this filter."
 * 2. Default filter: "All" pre-selected on load
 * 3. Loading: any visible indicator acceptable
 * 4. Retry success: banner auto-dismisses (Option A)
 * 5. Retry fails again: same banner stays, no new message (Option A)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { listTasks, completeTask } from '@/lib/api/endpoints';
import type {
  ListTasksResponse,
  Task,
  TaskStatus,
} from '@/types/api-generated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterValue = 'all' | TaskStatus;

interface TaskListClientProps {
  /** The role of the currently signed-in user — drives empty-state copy */
  role: 'team-member' | 'admin';
  /**
   * The ID of the currently signed-in user.
   * Required for team-members — used to determine whether to show the
   * "Mark Complete" control on tasks assigned to them (R11, BR6).
   */
  currentUserId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TaskListClient({
  role,
  currentUserId,
}: TaskListClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  // Per-task mark-complete loading state: taskId → boolean
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    new Set(),
  );
  // Per-task mark-complete error state: taskId → error message | null
  const [completeErrors, setCompleteErrors] = useState<
    Record<string, string | null>
  >({});
  // Ref to store auto-dismiss timer IDs so we can clear them on unmount
  const dismissTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const fetchTasks = useCallback(async (statusFilter: FilterValue) => {
    setIsLoading(true);
    setError(null);
    try {
      const params =
        statusFilter === 'all' ? undefined : { status: statusFilter };
      const response: ListTasksResponse = await listTasks(params);
      setTasks(response.tasks);
    } catch {
      setError('Unable to load tasks. Please try again.');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks('all');
  }, [fetchTasks]);

  const handleFilterChange = (value: FilterValue) => {
    setFilter(value);
    fetchTasks(value);
  };

  const handleRetry = () => {
    fetchTasks(filter);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskCreated = useCallback(() => {
    // Refresh the task list after creation to show the new task — AC-11
    fetchTasks(filter);
  }, [fetchTasks, filter]);

  // Clean up auto-dismiss timers on unmount
  useEffect(() => {
    const timers = dismissTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  /**
   * Handle "Mark Complete" button click for a task row.
   * Calls POST /v1/tasks/{taskId}/complete.
   * - Loading state: button is disabled while the request is in flight
   * - Success: update task status in local state; if Pending filter is active
   *   and the task is now complete, it disappears reactively (AC-8)
   * - Error (4xx/5xx): show an inline error that auto-dismisses after 4s
   * - 409 Conflict: silently update task to complete, no error message (BA decision)
   * - 403 Forbidden: show a generic "Unable to complete this task" error (BA decision)
   */
  const handleMarkComplete = useCallback(async (taskId: string) => {
    setCompletingTaskIds((prev) => new Set(prev).add(taskId));
    setCompleteErrors((prev) => ({ ...prev, [taskId]: null }));
    if (dismissTimers.current[taskId]) {
      clearTimeout(dismissTimers.current[taskId]);
    }

    try {
      const updatedTask = await completeTask(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      setSelectedTask((prev) => (prev?.id === taskId ? updatedTask : prev));
    } catch (err: unknown) {
      const statusCode =
        err !== null && typeof err === 'object' && 'statusCode' in err
          ? (err as { statusCode: number }).statusCode
          : undefined;

      if (statusCode === 409) {
        // 409 Conflict: task is already complete — silently update UI, no message
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: 'complete' as const } : t,
          ),
        );
        setSelectedTask((prev) =>
          prev?.id === taskId ? { ...prev, status: 'complete' as const } : prev,
        );
      } else {
        const message =
          statusCode === 403
            ? 'Unable to complete this task.'
            : 'Something went wrong. Please try again.';
        setCompleteErrors((prev) => ({ ...prev, [taskId]: message }));

        // Auto-dismiss after 4 seconds (BA decision: 3–5s)
        dismissTimers.current[taskId] = setTimeout(() => {
          setCompleteErrors((prev) => ({ ...prev, [taskId]: null }));
        }, 4000);
      }
    } finally {
      setCompletingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, []);

  /**
   * Determine whether to show the "Mark Complete" button for a given task.
   * Visible only when:
   *   1. The signed-in user is a team-member
   *   2. The task is assigned to the current user
   *   3. The task status is "pending"
   */
  const canMarkComplete = useCallback(
    (task: Task) =>
      role === 'team-member' &&
      !!currentUserId &&
      task.assignedUserId === currentUserId &&
      task.status === 'pending',
    [role, currentUserId],
  );

  /**
   * Apply client-side filter to the tasks array.
   *
   * This ensures immediate reactivity after mark-complete (AC-8, BA decision 3):
   * when a filter is active and a task's status changes (e.g., pending → complete),
   * the task is removed from (or added to) the filtered view right away without a
   * full API refetch. The API already returns the correct set on initial load; the
   * client-side filter only re-evaluates after local state mutations.
   */
  const displayedTasks =
    filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const renderEmptyState = () => {
    // If a filter is active and produced no results, show the generic filter message.
    if (filter !== 'all') {
      return (
        <p className="text-muted-foreground text-sm py-6 text-center">
          No tasks match this filter.
        </p>
      );
    }
    // Role-specific empty state for a fresh (unfiltered) empty list.
    if (role === 'team-member') {
      return (
        <p className="text-muted-foreground text-sm py-6 text-center">
          No tasks assigned to you yet.
        </p>
      );
    }
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        No tasks have been created yet.
      </p>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top bar: filter buttons + Create Task button (admin only) */}
      <div className="flex items-center justify-between gap-2">
        {/* Status filter buttons — AC-5 */}
        <div
          className="flex gap-2"
          role="group"
          aria-label="Filter tasks by status"
        >
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('all')}
            aria-pressed={filter === 'all'}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('pending')}
            aria-pressed={filter === 'pending'}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'complete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('complete')}
            aria-pressed={filter === 'complete'}
          >
            Complete
          </Button>
        </div>

        {/* Create Task button — admin only, AC-1, AC-2 */}
        {role === 'admin' && (
          <Button size="sm" onClick={() => setCreateFormOpen(true)}>
            Create Task
          </Button>
        )}
      </div>

      {/* Loading state — AC-12 */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading tasks"
          aria-busy="true"
          className="flex flex-col gap-2 py-4"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 w-full rounded-md bg-muted animate-pulse"
            />
          ))}
          <span className="sr-only">Loading tasks…</span>
        </div>
      )}

      {/* Error banner — AC-13, AC-14, AC-15 */}
      {!isLoading && error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="ml-4 shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Task list — AC-1 through AC-4, AC-9, AC-10, AC-11, AC-8 (Story 5) */}
      {!isLoading && !error && (
        <>
          {displayedTasks.length === 0 ? (
            renderEmptyState()
          ) : (
            <ul
              className="divide-y divide-border rounded-md border"
              aria-label="Task list"
            >
              {displayedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Clickable task details area */}
                  <div
                    className="flex flex-col gap-1 flex-1 cursor-pointer min-w-0"
                    onClick={() => handleTaskClick(task)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleTaskClick(task);
                      }
                    }}
                    aria-label={`View details for ${task.title}`}
                  >
                    {/* Task title — AC-2, AC-4 */}
                    <span className="font-medium text-sm">{task.title}</span>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {/* Assigned user display name (admin only) — AC-4 */}
                      {role === 'admin' && (
                        <span>{task.assignedUser.displayName}</span>
                      )}

                      {/* Due date — AC-2, AC-4 */}
                      <span>{task.dueDate}</span>

                      {/* Current status — AC-2, AC-4 */}
                      <TaskStatusBadge status={task.status} />
                    </div>

                    {/* Inline error for mark-complete failure — auto-dismissing */}
                    {completeErrors[task.id] && (
                      <div
                        role="alert"
                        className="mt-1 text-xs text-destructive"
                      >
                        {completeErrors[task.id]}
                      </div>
                    )}
                  </div>

                  {/* Mark Complete button — team-member only, own pending tasks (R11, BR6, BR8) */}
                  {canMarkComplete(task) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={completingTaskIds.has(task.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkComplete(task.id);
                      }}
                    >
                      {completingTaskIds.has(task.id)
                        ? 'Saving…'
                        : 'Mark Complete'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Task detail modal — Stories 2, 4, & 5 */}
      <TaskDetailModal
        task={selectedTask}
        open={modalOpen}
        role={role}
        currentUserId={currentUserId}
        onClose={handleModalClose}
        onTaskUpdated={(updatedTask) => {
          // Update the task in local state immediately for a fast UI response
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          );
          setSelectedTask(updatedTask);
          // Also refresh the list from the API to keep server state in sync — AC-8
          fetchTasks(filter);
        }}
        onTaskDeleted={(taskId) => {
          // Remove the task from local state immediately
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
          handleModalClose();
          // Refresh the list from the API to confirm server state — AC-19
          fetchTasks(filter);
        }}
        onTaskCompleted={(completedTask) => {
          // Update the task in local state — AC-6, AC-7, AC-8
          setTasks((prev) =>
            prev.map((t) => (t.id === completedTask.id ? completedTask : t)),
          );
          setSelectedTask(completedTask);
        }}
      />

      {/* Create task form — Story 3 (admin only) */}
      {role === 'admin' && (
        <CreateTaskForm
          open={createFormOpen}
          onClose={() => setCreateFormOpen(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
