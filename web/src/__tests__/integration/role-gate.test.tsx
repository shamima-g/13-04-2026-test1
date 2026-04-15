/**
 * Integration Test: RoleGate Component
 *
 * Tests for the RoleGate server component that conditionally renders
 * UI elements based on user role authorization.
 *
 * Updated for FRS: two roles only — admin and team-member.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Session } from 'next-auth';

type MockAuthFn = ReturnType<typeof vi.fn<() => Promise<Session | null>>>;

// Mock next-auth before imports
vi.mock('next-auth', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  __esModule: true,
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { auth } from '@/lib/auth/auth';
import { UserRole } from '@/types/roles';
import { RoleGate } from '@/components/RoleGate';

// Helper to create mock sessions
function createMockSession(
  role: UserRole,
  overrides?: Partial<Session['user']>,
): Session {
  return {
    user: {
      id: '1',
      email: `${role.toLowerCase()}@example.com`,
      name: `${role} User`,
      role,
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

describe('RoleGate Component', () => {
  const mockAuth = auth as unknown as MockAuthFn;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders children when authorized', () => {
    it('should render when user has exact required role (admin)', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.ADMIN));

      const result = await RoleGate({
        allowedRoles: [UserRole.ADMIN],
        children: <div>Admin Panel</div>,
      });

      expect(result).toEqual(<div>Admin Panel</div>);
    });

    it('should render when user role is in allowedRoles list', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.TEAM_MEMBER));

      const result = await RoleGate({
        allowedRoles: [UserRole.ADMIN, UserRole.TEAM_MEMBER],
        children: <div>Shared Content</div>,
      });

      expect(result).toEqual(<div>Shared Content</div>);
    });

    it('should render when admin meets minimumRole requirement (team-member minimum)', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.ADMIN));

      const result = await RoleGate({
        minimumRole: UserRole.TEAM_MEMBER,
        children: <div>Any Authenticated Content</div>,
      });

      expect(result).toEqual(<div>Any Authenticated Content</div>);
    });

    it('should render for any authenticated user with requireAuth', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.TEAM_MEMBER));

      const result = await RoleGate({
        requireAuth: true,
        children: <div>Authenticated Content</div>,
      });

      expect(result).toEqual(<div>Authenticated Content</div>);
    });

    it('should render when no role requirements specified', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.TEAM_MEMBER));

      const result = await RoleGate({
        children: <div>Default Content</div>,
      });

      expect(result).toEqual(<div>Default Content</div>);
    });
  });

  describe('hides children when unauthorized', () => {
    it('should return null when team-member lacks admin role', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.TEAM_MEMBER));

      const result = await RoleGate({
        allowedRoles: [UserRole.ADMIN],
        children: <div>Admin Panel</div>,
      });

      expect(result).toBeNull();
    });

    it('should return null when team-member does not meet admin minimum role', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.TEAM_MEMBER));

      const result = await RoleGate({
        minimumRole: UserRole.ADMIN,
        children: <div>Admin Features</div>,
      });

      expect(result).toBeNull();
    });

    it('should return null for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await RoleGate({
        allowedRoles: [UserRole.TEAM_MEMBER],
        children: <div>User Content</div>,
      });

      expect(result).toBeNull();
    });

    it('should return null when session has no user object', async () => {
      mockAuth.mockResolvedValue({
        user: undefined as unknown as Session['user'],
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const result = await RoleGate({
        allowedRoles: [UserRole.ADMIN],
        children: <div>Admin Panel</div>,
      });

      expect(result).toBeNull();
    });
  });

  describe('fallback content', () => {
    it('should show fallback when team-member lacks admin role', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.TEAM_MEMBER));
      const fallback = <div>Access Denied</div>;

      const result = await RoleGate({
        allowedRoles: [UserRole.ADMIN],
        children: <div>Admin Panel</div>,
        fallback,
      });

      expect(result).toEqual(fallback);
    });

    it('should show fallback for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);
      const fallback = <p>Please log in</p>;

      const result = await RoleGate({
        requireAuth: true,
        children: <div>Dashboard</div>,
        fallback,
      });

      expect(result).toEqual(fallback);
    });

    it('should render children (not fallback) when admin is authorized', async () => {
      mockAuth.mockResolvedValue(createMockSession(UserRole.ADMIN));
      const children = <div>Admin Panel</div>;
      const fallback = <div>Access Denied</div>;

      const result = await RoleGate({
        allowedRoles: [UserRole.ADMIN],
        children,
        fallback,
      });

      expect(result).toEqual(children);
    });
  });
});
