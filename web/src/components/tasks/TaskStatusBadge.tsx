import React from 'react';
import type { TaskStatus } from '@/types/api-generated';

/**
 * Renders a colour-coded pill for a task status value.
 * Used in both TaskListClient (task rows) and TaskDetailModal (detail view).
 */
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const label = status === 'pending' ? 'Pending' : 'Complete';
  const className =
    status === 'pending'
      ? 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800'
      : 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800';
  return <span className={className}>{label}</span>;
}
