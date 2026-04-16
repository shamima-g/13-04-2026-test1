'use client';

/**
 * TaskDetailModal — Task Detail Overlay (Stories 2 & 4)
 *
 * Displays full task details in a Shadcn Dialog overlay.
 * Opened when the user clicks a task row in the task list.
 *
 * Story 2 BA Decisions:
 * 1. Data source: uses task data from the list response (no separate API call)
 * 2. Status display: title case — "Pending" / "Complete"
 * 3. Due date format: locale long date, e.g. "May 15, 2026"
 * 4. No-description placeholder: "No description provided" (muted style)
 *
 * Story 4 BA Decisions:
 * - Edit/delete controls rendered only for admin role
 * - Scenario 10 (Option A): On PATCH failure, modal stays in edit mode with
 *   admin's changes preserved and inline error shown.
 * - Scenario 12 (Option A): On DELETE failure, error shown inline inside the modal.
 *
 * Stories: generated-docs/stories/epic-2-task-management/story-2-task-detail-modal.md
 *          generated-docs/stories/epic-2-task-management/story-4-admin-edit-delete-task.md
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateTask, deleteTask, completeTask } from '@/lib/api/endpoints';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import type { Task } from '@/types/api-generated';

// ---------------------------------------------------------------------------
// Validation schema (Story 4 — BR1, BR3)
// ---------------------------------------------------------------------------

const editTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long (max 200 characters)'),
  description: z.string().nullable().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
});

type EditTaskFormValues = z.infer<typeof editTaskSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format an ISO date string (e.g. "2026-05-15") as a long locale date
 * e.g. "May 15, 2026".
 *
 * We parse the date as UTC-noon to avoid any timezone-shift that would
 * display the day before.
 */
function formatDueDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TaskDetailModalProps {
  /** The task to display, or null when the modal is closed */
  task: Task | null;
  /** Controls whether the dialog is open */
  open: boolean;
  /** The role of the currently signed-in user */
  role?: 'admin' | 'team-member';
  /** The ID of the currently signed-in user — used to show Mark Complete for team-members */
  currentUserId?: string;
  /** Called when the dialog requests to close (backdrop click, Escape key) */
  onClose: () => void;
  /** Called when a task is successfully updated — parent should refresh the list */
  onTaskUpdated?: (updatedTask: Task) => void;
  /** Called when a task is successfully deleted — parent should remove from list */
  onTaskDeleted?: (taskId: string) => void;
  /** Called when a task is successfully marked complete — parent updates local state */
  onTaskCompleted?: (completedTask: Task) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TaskDetailModal({
  task,
  open,
  role,
  currentUserId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  onTaskCompleted,
}: TaskDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const completeErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
  });

  // Reset edit mode whenever the modal closes or a new task is opened
  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
      setEditError(null);
      setDeleteError(null);
      setDeleteAlertOpen(false);
      setCompleteError(null);
      if (completeErrorTimer.current) {
        clearTimeout(completeErrorTimer.current);
        completeErrorTimer.current = null;
      }
    }
  }, [open]);

  // Cleanup auto-dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (completeErrorTimer.current) {
        clearTimeout(completeErrorTimer.current);
      }
    };
  }, []);

  // Populate form when entering edit mode
  useEffect(() => {
    if (isEditMode && task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        dueDate: task.dueDate,
      });
    }
  }, [isEditMode, task, reset]);

  /**
   * Handle "Mark Complete" click inside the modal.
   * Only shown for team-member viewing their own pending task (R11, BR6, BR8).
   */
  const handleMarkComplete = async () => {
    if (!task) return;
    setIsCompleting(true);
    setCompleteError(null);
    if (completeErrorTimer.current) {
      clearTimeout(completeErrorTimer.current);
      completeErrorTimer.current = null;
    }

    try {
      const updatedTask = await completeTask(task.id);
      onTaskCompleted?.(updatedTask);
    } catch (err: unknown) {
      const statusCode =
        err !== null && typeof err === 'object' && 'statusCode' in err
          ? (err as { statusCode: number }).statusCode
          : undefined;

      if (statusCode === 409) {
        // 409 Conflict: silently update to complete, no message
        const silentlyUpdated = { ...task, status: 'complete' as const };
        onTaskCompleted?.(silentlyUpdated);
      } else {
        const message =
          statusCode === 403
            ? 'Unable to complete this task.'
            : 'Something went wrong. Please try again.';
        setCompleteError(message);
        // Auto-dismiss after 4 seconds (BA decision: 3–5s)
        completeErrorTimer.current = setTimeout(() => {
          setCompleteError(null);
        }, 4000);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEditClick = () => {
    setEditError(null);
    setIsEditMode(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(false);
    setEditError(null);
  };

  const handleSave = async (values: EditTaskFormValues) => {
    if (!task) return;
    setIsSubmitting(true);
    setEditError(null);
    try {
      const updated = await updateTask(task.id, {
        title: values.title,
        description: values.description ?? null,
        dueDate: values.dueDate,
      });
      setIsEditMode(false);
      onTaskUpdated?.(updated);
    } catch {
      setEditError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!task) return;
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteAlertOpen(false);
    try {
      await deleteTask(task.id);
      onTaskDeleted?.(task.id);
      onClose();
    } catch {
      setDeleteError('Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAlertCancel = () => {
    setDeleteAlertOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
      >
        <DialogContent>
          {task && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Edit Task' : task.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Task details for {task.title}
                </DialogDescription>
              </DialogHeader>

              {/* Delete error — shown inline inside modal (Scenario 12 Option A) */}
              {deleteError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {deleteError}
                </div>
              )}

              {isEditMode ? (
                /* ── Edit mode ─────────────────────────────────────────── */
                <form
                  id="edit-task-form"
                  onSubmit={handleSubmit(handleSave)}
                  className="grid gap-4"
                >
                  {/* Edit error — shown inline in edit mode (Scenario 10 Option A) */}
                  {editError && (
                    <div
                      role="alert"
                      className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {editError}
                    </div>
                  )}

                  {/* Title */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      {...register('title')}
                      aria-invalid={!!errors.title}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      {...register('description')}
                    />
                  </div>

                  {/* Due date */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-due-date">Due date</Label>
                    <Input
                      id="edit-due-date"
                      type="date"
                      {...register('dueDate')}
                      aria-invalid={!!errors.dueDate}
                    />
                    {errors.dueDate && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.dueDate.message}
                      </p>
                    )}
                  </div>

                  {/* Assigned user — locked in edit mode (BR5) */}
                  <div className="grid gap-1.5">
                    <Label>Assigned to</Label>
                    <p className="text-sm text-muted-foreground">
                      {task.assignedUser.displayName}
                    </p>
                  </div>

                  {/* Action buttons — outside form to avoid focus-trap issues */}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      form="edit-task-form"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </form>
              ) : (
                /* ── Read-only view ─────────────────────────────────────── */
                <>
                  <dl className="grid gap-3 text-sm">
                    {/* Description */}
                    <div>
                      <dt className="font-medium text-foreground">
                        Description
                      </dt>
                      <dd className="mt-1">
                        {task.description ? (
                          <span>{task.description}</span>
                        ) : (
                          <span className="text-muted-foreground italic">
                            No description provided
                          </span>
                        )}
                      </dd>
                    </div>

                    {/* Due date */}
                    <div>
                      <dt className="font-medium text-foreground">Due date</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {formatDueDate(task.dueDate)}
                      </dd>
                    </div>

                    {/* Assigned user */}
                    <div>
                      <dt className="font-medium text-foreground">
                        Assigned to
                      </dt>
                      <dd className="mt-1 text-muted-foreground">
                        {task.assignedUser.displayName}
                      </dd>
                    </div>

                    {/* Status */}
                    <div>
                      <dt className="font-medium text-foreground">Status</dt>
                      <dd className="mt-1">
                        <TaskStatusBadge status={task.status} />
                      </dd>
                    </div>
                  </dl>

                  {/* Mark Complete error — auto-dismissing (Story 5, AC-10) */}
                  {completeError && (
                    <div
                      role="alert"
                      className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {completeError}
                    </div>
                  )}

                  {/* Mark Complete control — team-member only, own pending tasks (R11, BR6, BR8) */}
                  {role === 'team-member' &&
                    !!currentUserId &&
                    task.assignedUserId === currentUserId &&
                    task.status === 'pending' && (
                      <div className="flex justify-start pt-2">
                        <Button
                          size="sm"
                          disabled={isCompleting}
                          onClick={handleMarkComplete}
                        >
                          {isCompleting ? 'Saving…' : 'Mark Complete'}
                        </Button>
                      </div>
                    )}

                  {/* Admin controls — Edit and Delete (R9, R10) */}
                  {role === 'admin' && (
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditClick}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — Shadcn AlertDialog (Story 4, R10) */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this task? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteAlertCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Confirm Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
