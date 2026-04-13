/**
 * Team-Member Task List Page
 *
 * Landing page for team-members after sign-in.
 * Shows only tasks assigned to the currently signed-in team-member.
 *
 * Route: /tasks
 * Auth: Required (handled by (protected) layout — BR10)
 *
 * Note: Full task list UI is implemented in Epic 2.
 * This is a minimal placeholder that satisfies AC-1 and AC-3 routing.
 */

import { requireAuth } from '@/lib/auth/auth-server';

export default async function TasksPage() {
  const session = await requireAuth();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Tasks</h1>
      <p className="text-muted-foreground">
        Welcome, {session.user.name}. Your assigned tasks will appear here.
      </p>
    </main>
  );
}
