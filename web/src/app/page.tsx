/**
 * Home Page — Redirect Hub
 *
 * This page does not render any content. It is purely a redirect hub:
 * - Unauthenticated users → /auth/signin
 * - Authenticated admins → /tasks/all
 * - Authenticated team-members → /tasks
 *
 * Covers: AC-3, AC-4, AC-5
 */

import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/auth-server';
import { UserRole } from '@/types/roles';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    // AC-5: unauthenticated → sign-in page
    redirect('/auth/signin');
  }

  if (session.user.role === UserRole.ADMIN) {
    // AC-4: admin → all-tasks view
    redirect('/tasks/all');
  }

  // AC-3: team-member (or any authenticated user) → personal task list
  redirect('/tasks');
}
