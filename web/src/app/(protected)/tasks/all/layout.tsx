/**
 * Admin-Only Layout for /tasks/all
 *
 * Enforces admin role requirement for the all-tasks page.
 * Uses requireMinimumRole to satisfy security pattern validation.
 */

import { redirect } from 'next/navigation';
import { requireMinimumRole } from '@/lib/auth/auth-helpers';
import { UserRole } from '@/types/roles';

interface AdminTasksLayoutProps {
  children: React.ReactNode;
}

export default async function AdminTasksLayout({
  children,
}: AdminTasksLayoutProps): Promise<React.ReactElement> {
  // Require admin role — non-admins are redirected to /tasks
  try {
    await requireMinimumRole(UserRole.ADMIN);
  } catch {
    redirect('/tasks');
  }

  return <>{children}</>;
}
