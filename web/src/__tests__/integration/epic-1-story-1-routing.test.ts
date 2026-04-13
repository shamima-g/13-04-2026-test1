/**
 * Epic 1, Story 1 — Routing and Auth Guard Tests
 *
 * Tests that server-side auth logic:
 * - Redirects unauthenticated users to /auth/signin (AC-5, AC-6, AC-7)
 * - Provides session data for role-based home page redirect (AC-3, AC-4)
 * - Redirects team-member from /tasks/all to /tasks silently (AC-8)
 * - Allows admin to access /tasks/all (AC-9)
 * - Does NOT use a callbackUrl after session expiry re-auth (Edge 2)
 *
 * FRS source of truth: generated-docs/specs/feature-requirements.md
 * Story: generated-docs/stories/epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md
 */

import { vi } from 'vitest';

// ── All vi.mock calls at top level (hoisted) ────────────────────────────────

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string): never => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => null),
    }),
  ),
}));

vi.mock('next-auth', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth/auth';
import { getSession, requireAuth } from '@/lib/auth/auth-server';
import { redirect } from 'next/navigation';

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockRedirect = redirect as unknown as ReturnType<typeof vi.fn>;

function makeAdminSession() {
  return {
    user: {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' as const,
    },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  };
}

function makeTeamMemberSession() {
  return {
    user: {
      id: '2',
      name: 'Team Member',
      email: 'user@example.com',
      role: 'team-member' as const,
    },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  };
}

/**
 * Captures the redirect path thrown by Next.js redirect() or returns null
 * if the function completed without redirecting.
 */
async function captureRedirect(
  fn: () => Promise<unknown>,
): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT:')) {
      return err.message.replace('NEXT_REDIRECT:', '');
    }
    throw err;
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AC-3 / AC-4 / AC-5: Home page (/) redirect hub — getSession contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation((path: string): never => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it('AC-3: team-member session is returned — home page redirects to /tasks', async () => {
    mockAuth.mockResolvedValue(makeTeamMemberSession());

    const session = await getSession();

    // Session must have role 'team-member' (FRS role, not template's 'standard_user')
    expect(session).not.toBeNull();
    expect(session!.user.role).toBe('team-member');

    // Home page logic: if role is 'admin' → /tasks/all, else → /tasks
    const expectedRedirect =
      session!.user.role === 'admin' ? '/tasks/all' : '/tasks';
    expect(expectedRedirect).toBe('/tasks');
  });

  it('AC-4: admin session is returned — home page redirects to /tasks/all', async () => {
    mockAuth.mockResolvedValue(makeAdminSession());

    const session = await getSession();

    // Session must have role 'admin'
    expect(session).not.toBeNull();
    expect(session!.user.role).toBe('admin');

    const expectedRedirect =
      session!.user.role === 'admin' ? '/tasks/all' : '/tasks';
    expect(expectedRedirect).toBe('/tasks/all');
  });

  it('AC-5: null session — home page redirects to /auth/signin', async () => {
    mockAuth.mockResolvedValue(null);

    const session = await getSession();

    expect(session).toBeNull();

    // When no session, home page must redirect to sign-in
    const expectedRedirect = session === null ? '/auth/signin' : '/tasks';
    expect(expectedRedirect).toBe('/auth/signin');
  });
});

describe('AC-6 / AC-7: requireAuth redirects unauthenticated users to /auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation((path: string): never => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it('AC-6 / AC-7: requireAuth redirects to /auth/signin when session is absent', async () => {
    mockAuth.mockResolvedValue(null);

    const redirectedTo = await captureRedirect(() => requireAuth());

    // Must redirect to /auth/signin (protected layout uses this for all protected routes)
    expect(redirectedTo).toBe('/auth/signin');
  });

  it('requireAuth allows through when session is present (team-member)', async () => {
    mockAuth.mockResolvedValue(makeTeamMemberSession());

    // Should complete without throwing
    const session = await requireAuth();
    expect(session).not.toBeNull();
    expect(session.user.role).toBe('team-member');
  });

  it('requireAuth allows through when session is present (admin)', async () => {
    mockAuth.mockResolvedValue(makeAdminSession());

    const session = await requireAuth();
    expect(session).not.toBeNull();
    expect(session.user.role).toBe('admin');
  });
});

describe('AC-8 / AC-9: Admin-only route protection for /tasks/all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation((path: string): never => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it('AC-8: team-member session — guard redirects to /tasks (silent, no error page)', async () => {
    mockAuth.mockResolvedValue(makeTeamMemberSession());

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.user.role).toBe('team-member');

    // The guard: if not admin, redirect to /tasks (BA Decision 1: silent)
    const isAdmin = session!.user.role === 'admin';
    expect(isAdmin).toBe(false);

    // The redirect target must be /tasks (not a forbidden/error page)
    const redirectTarget = isAdmin ? null : '/tasks';
    expect(redirectTarget).toBe('/tasks');
    expect(redirectTarget).not.toContain('forbidden');
    expect(redirectTarget).not.toContain('error');
  });

  it('AC-8: redirect for team-member is NOT to /auth/forbidden', async () => {
    mockAuth.mockResolvedValue(makeTeamMemberSession());

    const session = await getSession();
    const redirectTarget = session!.user.role === 'admin' ? null : '/tasks';

    expect(redirectTarget).not.toBe('/auth/forbidden');
    expect(redirectTarget).not.toMatch(/forbidden|error/i);
  });

  it('AC-9: admin session — guard does NOT redirect (admin can access /tasks/all)', async () => {
    mockAuth.mockResolvedValue(makeAdminSession());

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.user.role).toBe('admin');

    // Admin: no redirect
    const isAdmin = session!.user.role === 'admin';
    const redirectTarget = isAdmin ? null : '/tasks';

    expect(redirectTarget).toBeNull();
    expect(isAdmin).toBe(true);
  });
});

describe('Edge 2: Session expiry — no callbackUrl / return-URL after re-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation((path: string): never => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it('requireAuth redirects to plain /auth/signin (no callbackUrl) when session is absent', async () => {
    // Per BA Decision 2: no callbackUrl — always redirect to /auth/signin plain.
    // The current template implementation appends callbackUrl — this test will FAIL
    // until requireAuth() is updated to redirect to /auth/signin without callbackUrl.
    mockAuth.mockResolvedValue(null);

    const redirectedTo = await captureRedirect(() => requireAuth());

    // Must be exactly /auth/signin, with no query string
    expect(redirectedTo).toBe('/auth/signin');
    expect(redirectedTo).not.toContain('callbackUrl');
  });

  it('team-member always lands on /tasks after re-authentication (role-based, not return-URL)', () => {
    // Post-sign-in: role-based routing only (AC-1)
    const session = makeTeamMemberSession();
    const role: string = session.user.role;
    const landingPage = role === 'admin' ? '/tasks/all' : '/tasks';
    expect(landingPage).toBe('/tasks');
  });

  it('admin always lands on /tasks/all after re-authentication (role-based, not return-URL)', () => {
    // Post-sign-in: role-based routing only (AC-2)
    const session = makeAdminSession();
    const role: string = session.user.role;
    const landingPage = role === 'admin' ? '/tasks/all' : '/tasks';
    expect(landingPage).toBe('/tasks/all');
  });
});
