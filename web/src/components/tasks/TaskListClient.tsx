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

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import { listTasks } from '@/lib/api/endpoints';
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TaskListClient({ role }: TaskListClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);

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

  const renderStatus = (status: TaskStatus) => {
    const label = status === 'pending' ? 'Pending' : 'Complete';
    const className =
      status === 'pending'
        ? 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800'
        : 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800';
    return <span className={className}>{label}</span>;
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

      {/* Task list — AC-1 through AC-4, AC-9, AC-10, AC-11 */}
      {!isLoading && !error && (
        <>
          {tasks.length === 0 ? (
            renderEmptyState()
          ) : (
            <ul
              className="divide-y divide-border rounded-md border"
              aria-label="Task list"
            >
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
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
                    {renderStatus(task.status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Task detail modal — Story 2 */}
      <TaskDetailModal
        task={selectedTask}
        open={modalOpen}
        onClose={handleModalClose}
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
