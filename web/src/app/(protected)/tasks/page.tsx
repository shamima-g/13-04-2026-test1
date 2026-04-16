/**
 * Team-Member Task List Page
 *
 * Landing page for team-members after sign-in.
 * Shows only tasks assigned to the currently signed-in team-member.
 *
 * Route: /tasks
 * Auth: Required (handled by (protected) layout — BR10)
 *
 * Epic 2, Story 1 — replaces the Epic 1 placeholder shell.
 * FRS-Over-Template: story ACs and FRS are the source of truth.
 */

import { requireAuth } from '@/lib/auth/auth-server';
import TaskListClient from '@/components/tasks/TaskListClient';

export default async function TasksPage() {
  const session = await requireAuth();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      <TaskListClient role="team-member" currentUserId={session.user.id} />
    </main>
  );
}
