/**
 * Epic 1, Story 1 — Sign-In Page Tests
 *
 * Tests that the sign-in page:
 * - Redirects team-member to /tasks after successful sign-in (AC-1)
 * - Redirects admin to /tasks/all after successful sign-in (AC-2)
 * - Shows an error and stays on sign-in page for invalid credentials (Edge 1)
 * - Is keyboard accessible: all controls reachable by Tab and activatable (AC-11)
 * - Does NOT include a callbackUrl in redirect after sign-in (BA Decision 2)
 *
 * FRS source of truth: generated-docs/specs/feature-requirements.md
 * Story: generated-docs/stories/epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md
 */

import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Use vi.hoisted to safely initialize mocks before module loading ──────────

const { mockPush, mockReplace, mockRefresh, mockSignIn } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignIn: vi.fn(),
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({ get: vi.fn(() => null) }),
  redirect: vi.fn(),
}));

// ── Mock next-auth/react ────────────────────────────────────────────────────
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ── Mock @/lib/auth/auth-client ─────────────────────────────────────────────
vi.mock('@/lib/auth/auth-client', () => ({
  signIn: mockSignIn,
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

// ── Import page under test ───────────────────────────────────────────────────
import SignInPage from '@/app/auth/signin/page';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AC-1 / AC-2: Post-sign-in role-based redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-1: after successful sign-in, the user is sent to /tasks (team-member landing)', async () => {
    // signIn succeeds and returns the session role so the page can route appropriately
    // The sign-in page must redirect to /tasks for team-member — NOT to '/'
    mockSignIn.mockResolvedValue({ ok: true, role: 'team-member' });

    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'User123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/tasks');
    });
  });

  it('AC-2: after successful sign-in, admin is sent to /tasks/all', async () => {
    mockSignIn.mockResolvedValue({ ok: true, role: 'admin' });

    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Admin123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/tasks/all');
    });
  });

  it('AC-1/AC-2: redirect goes to a role page, NOT to the home page /', async () => {
    mockSignIn.mockResolvedValue({ ok: true, role: 'team-member' });

    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'User123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    const destinations = mockPush.mock.calls.map((c: string[]) => c[0]);
    // Must go to /tasks or /tasks/all — never to '/'
    expect(destinations.some((d: string) => d === '/')).toBe(false);
    expect(
      destinations.some((d: string) => d === '/tasks' || d === '/tasks/all'),
    ).toBe(true);
  });
});

describe('Edge 1: Invalid credentials — user stays on sign-in page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error message when credentials are wrong', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' });

    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Must NOT navigate away on failure
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('stays on the sign-in page (no redirect) when credentials fail', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' });

    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email/i), 'notauser@example.com');
    await user.type(screen.getByLabelText(/password/i), 'badpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('error message is accessible (uses role=alert)', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' });

    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent?.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('AC-11: Sign-in page keyboard accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('email field is present and reachable', () => {
    render(<SignInPage />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput.tagName).toBe('INPUT');
  });

  it('password field is present and reachable', () => {
    render(<SignInPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.tagName).toBe('INPUT');
  });

  it('sign-in button exists with correct role', () => {
    render(<SignInPage />);

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
  });

  it('all interactive controls are NOT excluded from tab order (no tabIndex=-1)', () => {
    render(<SignInPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).not.toHaveAttribute('tabindex', '-1');
    expect(passwordInput).not.toHaveAttribute('tabindex', '-1');
    expect(signInButton).not.toHaveAttribute('tabindex', '-1');
  });

  it('sign-in button can be activated with Enter key after filling credentials', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' });

    const user = userEvent.setup();
    render(<SignInPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'pass');

    // Pressing Enter in the password field submits the form
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('email and password fields accept text input via keyboard', async () => {
    const user = userEvent.setup();
    render(<SignInPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'secretpass');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('secretpass');
  });
});

describe('BA Decision 2: No callbackUrl in sign-in redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirect destination after sign-in does NOT include a callbackUrl parameter', async () => {
    mockSignIn.mockResolvedValue({ ok: true, role: 'team-member' });

    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'User123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    // The destination must not contain callbackUrl query param
    const pushCalls = mockPush.mock.calls;
    const destinations = pushCalls.map((call: string[]) => call[0]);
    destinations.forEach((dest: string) => {
      expect(dest).not.toContain('callbackUrl');
    });
  });
});
