'use client';

/**
 * CreateTaskForm — Create Task Dialog (Admin Only)
 *
 * A Shadcn <Dialog /> overlay containing the form for creating a new task.
 * Includes fields for title, description (optional), due date, and assigned user.
 * Validates fields client-side using Zod rules matching BR1–BR4.
 * Calls POST /v1/tasks on submit, then notifies parent of success.
 *
 * Story: generated-docs/stories/epic-2-task-management/story-3-admin-create-task.md
 *
 * BA Decisions applied:
 * 1. API error placement: banner at the top of the form (Option A)
 * 2. Success toast: uses useToast from ToastContext
 * 3. Cancellation: Cancel button + X icon (built into Shadcn Dialog) + Escape
 */

import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTask, listUsers } from '@/lib/api/endpoints';
import { useToast } from '@/contexts/ToastContext';
import type { Task, User } from '@/types/api-generated';

// ---------------------------------------------------------------------------
// Validation schema (BR1–BR4)
// ---------------------------------------------------------------------------

const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long — maximum 200 characters'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  assignedUserId: z.string().min(1, 'Assigned user is required'),
});

type FormErrors = Partial<
  Record<keyof z.infer<typeof createTaskSchema>, string>
>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateTaskFormProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateTaskForm({
  open,
  onClose,
  onTaskCreated,
}: CreateTaskFormProps) {
  const { showToast } = useToast();

  // Form field state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');

  // Users list state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load users when the dialog opens
  // ---------------------------------------------------------------------------

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await listUsers();
      setUsers(response.users);
    } catch {
      // If users fail to load, the dropdown will be empty.
      // Not spec'd as an error state in this story — leave silent.
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, loadUsers]);

  // ---------------------------------------------------------------------------
  // Reset form when dialog closes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedUserId('');
      setFormErrors({});
      setApiError(null);
      setIsSubmitting(false);
      setUsers([]);
    }
  }, [open]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): FormErrors {
    const result = createTaskSchema.safeParse({
      title,
      description: description || undefined,
      dueDate,
      assignedUserId,
    });

    if (result.success) {
      return {};
    }

    const errors: FormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FormErrors;
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return errors;
  }

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        assignedUserId,
      });

      showToast({
        variant: 'success',
        title: 'Task created',
        message: `"${newTask.title}" has been created successfully.`,
      });

      onTaskCreated(newTask);
      onClose();
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* API error banner — AC-13 (BA Decision 1: banner at top of form) */}
          {apiError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {apiError}
            </div>
          )}

          {/* Title field — AC-3, BR1 */}
          <div className="space-y-1">
            <Label htmlFor="create-task-title">Title</Label>
            <Input
              id="create-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              aria-describedby={
                formErrors.title ? 'create-task-title-error' : undefined
              }
              aria-invalid={!!formErrors.title}
            />
            {formErrors.title && (
              <p
                id="create-task-title-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {formErrors.title}
              </p>
            )}
          </div>

          {/* Description field — AC-3, BR2 (optional) */}
          <div className="space-y-1">
            <Label htmlFor="create-task-description">Description</Label>
            <textarea
              id="create-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Due date field — AC-3, BR3 */}
          <div className="space-y-1">
            <Label htmlFor="create-task-due-date">Due Date</Label>
            <Input
              id="create-task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-describedby={
                formErrors.dueDate ? 'create-task-due-date-error' : undefined
              }
              aria-invalid={!!formErrors.dueDate}
            />
            {formErrors.dueDate && (
              <p
                id="create-task-due-date-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {formErrors.dueDate}
              </p>
            )}
          </div>

          {/* Assigned user select — AC-3, AC-4, BR4 */}
          <div className="space-y-1">
            <Label htmlFor="create-task-assigned-user">Assigned User</Label>
            <Select
              value={assignedUserId}
              onValueChange={setAssignedUserId}
              disabled={usersLoading}
            >
              <SelectTrigger
                id="create-task-assigned-user"
                aria-label="Assigned User"
                aria-busy={usersLoading}
                aria-invalid={!!formErrors.assignedUserId}
              >
                <SelectValue
                  placeholder={
                    usersLoading ? 'Loading users...' : 'Select a team member'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.assignedUserId && (
              <p
                id="create-task-assigned-user-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {formErrors.assignedUserId}
              </p>
            )}
          </div>

          {/* Footer — Cancel + Submit — AC-15 */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
