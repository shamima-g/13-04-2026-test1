'use client';

import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
  getSession as nextAuthGetSession,
} from 'next-auth/react';

export { useSession } from 'next-auth/react';

/**
 * Signs in the user with email and password.
 * On success, returns the user's role so the caller can redirect to the
 * appropriate role-based landing page (AC-1: /tasks, AC-2: /tasks/all).
 *
 * Per BA Decision 2: no callbackUrl is used. After sign-in, routing is
 * always role-based.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string; ok: boolean; role?: string }> {
  try {
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: 'Invalid credentials', ok: false };
    }

    // Fetch the session to get the role for role-based redirect
    const session = await nextAuthGetSession();
    const role = session?.user?.role as string | undefined;

    return { ok: true, role };
  } catch {
    return { error: 'An error occurred during sign in', ok: false };
  }
}

export async function signOut(): Promise<void> {
  await nextAuthSignOut({ redirect: true, callbackUrl: '/auth/signin' });
}
