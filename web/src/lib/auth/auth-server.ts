/**
 * Server-Side Authentication Helpers
 *
 * These functions should ONLY be used in Server Components and Server Actions.
 * For Client Components, use hooks from auth-client.ts instead.
 *
 * Security Note:
 * Following Next.js 16 and Vercel's security recommendations, authentication
 * checks are performed in Server Components (layouts) rather than middleware/proxy.
 * This approach provides defense-in-depth and ensures auth checks cannot be bypassed.
 *
 * BA Decision 2: No callbackUrl / return-URL is preserved after session expiry.
 * After re-authentication, users are always directed to their role-based landing page
 * (/tasks for team-member, /tasks/all for admin). This is consistent with AC-1/AC-2.
 */

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { hasMinimumRole } from '@/lib/auth/auth-helpers';
import { UserRole } from '@/types/roles';

import type { Session } from 'next-auth';

/**
 * Requires authentication for the current page.
 * Redirects to sign-in if not authenticated.
 *
 * Per BA Decision 2: no callbackUrl is appended to the sign-in URL.
 * After re-authentication, the user is directed to their role-based landing page.
 *
 * Usage in Server Components:
 * ```tsx
 * export default async function TasksPage() {
 *   const session = await requireAuth();
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * ```
 *
 * @returns Session object if authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session) {
    // BA Decision 2: redirect to plain /auth/signin without callbackUrl.
    // After re-authentication, the home page (/) reads the session role and
    // redirects to the correct landing page (/tasks or /tasks/all).
    redirect('/auth/signin');
  }

  return session;
}

/**
 * Requires minimum role level for the current page (hierarchical check).
 * Redirects to forbidden page if user doesn't meet minimum role requirement.
 *
 * Hierarchical: ADMIN (100) can access TEAM_MEMBER (10) routes.
 *
 * @param minimumRole - The minimum required role level
 * @returns Session object if user meets minimum role requirement
 */
export async function requireMinimumRole(
  minimumRole: UserRole,
): Promise<Session> {
  const session = await requireAuth();

  if (!hasMinimumRole(session.user, minimumRole)) {
    const forbiddenUrl = `/auth/forbidden?required=${minimumRole}&current=${session.user.role}`;
    redirect(forbiddenUrl);
  }

  return session;
}

/**
 * Requires exact role match for the current page (strict check).
 * Redirects to forbidden page if user doesn't have the exact role.
 *
 * Non-hierarchical: Only ADMIN can access ADMIN routes.
 *
 * @param role - The exact required role
 * @returns Session object if user has exact role
 */
export async function requireExactRole(role: UserRole): Promise<Session> {
  const session = await requireAuth();

  if (session.user.role !== role) {
    const forbiddenUrl = `/auth/forbidden?required=${role}&current=${session.user.role}`;
    redirect(forbiddenUrl);
  }

  return session;
}

/**
 * Gets the current session without requiring authentication.
 * Returns null if not authenticated.
 *
 * Usage in Server Components:
 * ```tsx
 * export default async function OptionalAuthPage() {
 *   const session = await getSession();
 *   if (session) {
 *     return <div>Welcome {session.user.name}</div>;
 *   }
 *   return <div>Welcome Guest</div>;
 * }
 * ```
 *
 * @returns Session object if authenticated, null otherwise
 */
export async function getSession(): Promise<Session | null> {
  return await auth();
}

/**
 * Checks if the current user meets minimum role requirement (hierarchical).
 * Returns false if not authenticated.
 *
 * @param minimumRole - The minimum role level to check for
 * @returns true if user meets minimum role requirement, false otherwise
 */
export async function checkMinimumRole(
  minimumRole: UserRole,
): Promise<boolean> {
  const session = await auth();

  if (!session) {
    return false;
  }

  return hasMinimumRole(session.user, minimumRole);
}

/**
 * Checks if the current user has exact role match (non-hierarchical).
 * Returns false if not authenticated.
 *
 * @param role - The exact role to check for
 * @returns true if user has exact role, false otherwise
 */
export async function checkExactRole(role: UserRole): Promise<boolean> {
  const session = await auth();

  if (!session) {
    return false;
  }

  return session.user.role === role;
}
