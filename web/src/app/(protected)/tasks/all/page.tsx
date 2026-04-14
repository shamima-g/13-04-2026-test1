/**
 * Admin All-Tasks Page
 *
 * Landing page for admins after sign-in.
 * Shows all tasks across all team members.
 *
 * Route: /tasks/all
 * Auth: Required (handled by (protected) layout — BR10)
 * Role: Admin only (BR9 — team-members are silently redirected to /tasks)
 *
 * BA Decision 1: The redirect for a team-member is fully silent (Option A).
 * Uses server-side redirect() which replaces the URL — /tasks/all does NOT
 * appear in browser history after redirect.
 *
 * Epic 2, Story 1 — replaces the Epic 1 placeholder shell.
 * FRS-Over-Template: story ACs and FRS are the source of truth.
 */

import TaskListClient from '@/components/tasks/TaskListClient';

/**
 * Admin All-Tasks Page
 *
 * Landing page for admins after sign-in.
 * Shows all tasks across all team members.
 *
 * Route: /tasks/all
 * Auth: Required (handled by (protected) layout — BR10)
 * Role: Admin only (BR9 — enforced by layout.tsx via requireMinimumRole)
 *
 * Epic 2, Story 1 — replaces the Epic 1 placeholder shell.
 * FRS-Over-Template: story ACs and FRS are the source of truth.
 */

export default function AllTasksPage() {
  // Role enforcement is handled by layout.tsx via requireMinimumRole
  // Only admins can reach this page
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Tasks</h1>
      <TaskListClient role="admin" />
    </main>
  );
}
