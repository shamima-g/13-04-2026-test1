/**
 * Epic 1, Story 1 — Role Configuration Tests
 *
 * Tests that the role system contains exactly the two FRS-defined roles:
 * - admin
 * - team-member
 *
 * Covers: AC-10, Edge 3
 *
 * FRS source of truth: generated-docs/specs/feature-requirements.md
 * Story: generated-docs/stories/epic-1-auth-and-routing/story-1-auth-role-config-and-routing.md
 */

import {
  UserRole,
  getAllRoles,
  isValidRole,
  DEFAULT_ROLE,
  ROLE_HIERARCHY,
} from '@/types/roles';

describe('AC-10: Role values are limited to exactly admin and team-member', () => {
  it('UserRole enum contains exactly two values: admin and team-member', () => {
    const roles = getAllRoles();
    expect(roles).toHaveLength(2);
    expect(roles).toContain('admin');
    expect(roles).toContain('team-member');
  });

  it('admin is a valid role value', () => {
    expect(isValidRole('admin')).toBe(true);
  });

  it('team-member is a valid role value', () => {
    expect(isValidRole('team-member')).toBe(true);
  });

  it('old template role power_user is NOT a valid role', () => {
    expect(isValidRole('power_user')).toBe(false);
  });

  it('old template role standard_user is NOT a valid role', () => {
    expect(isValidRole('standard_user')).toBe(false);
  });

  it('old template role read_only is NOT a valid role', () => {
    expect(isValidRole('read_only')).toBe(false);
  });

  it('arbitrary unknown role values are not valid', () => {
    expect(isValidRole('super_admin')).toBe(false);
    expect(isValidRole('')).toBe(false);
    expect(isValidRole('ADMIN')).toBe(false);
  });

  it('UserRole.ADMIN equals the string "admin"', () => {
    expect(UserRole.ADMIN).toBe('admin');
  });

  it('UserRole.TEAM_MEMBER equals the string "team-member"', () => {
    expect(UserRole.TEAM_MEMBER).toBe('team-member');
  });

  it('ROLE_HIERARCHY only contains admin and team-member keys', () => {
    const keys = Object.keys(ROLE_HIERARCHY);
    expect(keys).toHaveLength(2);
    expect(keys).toContain('admin');
    expect(keys).toContain('team-member');
  });
});

describe('Edge 3: Demo user credentials — only two roles available', () => {
  it('POWER_USER is not in UserRole enum (old demo user removed)', () => {
    expect((UserRole as Record<string, string>)['POWER_USER']).toBeUndefined();
  });

  it('STANDARD_USER is not in UserRole enum (old demo user removed)', () => {
    expect(
      (UserRole as Record<string, string>)['STANDARD_USER'],
    ).toBeUndefined();
  });

  it('READ_ONLY is not in UserRole enum (old demo user removed)', () => {
    expect((UserRole as Record<string, string>)['READ_ONLY']).toBeUndefined();
  });

  it('DEFAULT_ROLE is team-member (the lower-privilege FRS role)', () => {
    expect(DEFAULT_ROLE).toBe(UserRole.TEAM_MEMBER);
  });
});
