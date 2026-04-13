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
 * Note: Full task list UI is implemented in Epic 2.
 * This is a minimal placeholder that satisfies AC-2, AC-8, and AC-9 routing.
 */

import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/auth-server';
import { UserRole } from '@/types/roles';

export default async function AllTasksPage() {
  const session = await getSession();

  // Unauthenticated users are already handled by the (protected) layout.
  // This check is a safety net.
  if (!session) {
    redirect('/auth/signin');
  }

  // BR9 / AC-8: team-member trying to access admin-only route
  // Redirect is fully silent — no error message, no history entry.
  // BA Decision 1: server-side redirect() replaces the URL.
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/tasks');
  }

  // AC-9: admin can access this page
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">All Tasks</h1>
      <p className="text-muted-foreground">
        All team tasks will appear here, {session.user.name}.
      </p>
    </main>
  );
}
