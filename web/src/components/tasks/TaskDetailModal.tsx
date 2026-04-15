'use client';

/**
 * TaskDetailModal — Task Detail Overlay (Story 2)
 *
 * Displays full task details in a Shadcn Dialog overlay.
 * Opened when the user clicks a task row in the task list.
 *
 * BA Decisions:
 * 1. Data source: uses task data from the list response (no separate API call)
 * 2. Status display: title case — "Pending" / "Complete"
 * 3. Due date format: locale long date, e.g. "May 15, 2026"
 * 4. No-description placeholder: "No description provided" (muted style)
 * 5. No edit / delete / mark-complete controls in this story (BR7)
 *
 * Story: generated-docs/stories/epic-2-task-management/story-2-task-detail-modal.md
 */

import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task } from '@/types/api-generated';

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
  // Parse as UTC noon to avoid off-by-one from local timezone
  const date = new Date(`${isoDate}T12:00:00Z`);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Return title-case status label */
function formatStatus(status: 'pending' | 'complete'): string {
  return status === 'pending' ? 'Pending' : 'Complete';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TaskDetailModalProps {
  /** The task to display, or null when the modal is closed */
  task: Task | null;
  /** Controls whether the dialog is open */
  open: boolean;
  /** Called when the dialog requests to close (backdrop click, Escape key) */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TaskDetailModal({
  task,
  open,
  onClose,
}: TaskDetailModalProps) {
  return (
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
              <DialogTitle>{task.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Task details for {task.title}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid gap-3 text-sm">
              {/* Description */}
              <div>
                <dt className="font-medium text-foreground">Description</dt>
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
                <dt className="font-medium text-foreground">Assigned to</dt>
                <dd className="mt-1 text-muted-foreground">
                  {task.assignedUser.displayName}
                </dd>
              </div>

              {/* Status */}
              <div>
                <dt className="font-medium text-foreground">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={task.status} />
                </dd>
              </div>
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Status badge (inline helper)
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'pending' | 'complete' }) {
  const label = formatStatus(status);
  const className =
    status === 'pending'
      ? 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800'
      : 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800';
  return <span className={className}>{label}</span>;
}
