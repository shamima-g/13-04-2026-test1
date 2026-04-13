/**
 * User Role Definitions
 *
 * Two roles are defined per the Feature Requirements Specification (FRS):
 * - admin: manager/team lead — creates and assigns tasks, views all tasks
 * - team-member: standard employee — views and completes own assigned tasks
 */

/**
 * FRS-defined role enum.
 * Only two roles exist in this application.
 */
export enum UserRole {
  /**
   * Manager or team lead.
   * Can create tasks, assign tasks, edit task details, delete tasks, view all tasks.
   * Cannot mark tasks as complete.
   */
  ADMIN = 'admin',

  /**
   * Standard employee who receives and completes assigned work.
   * Can view their own assigned tasks only and mark them as complete.
   * No access to admin routes.
   */
  TEAM_MEMBER = 'team-member',
}

/**
 * Role hierarchy defines the privilege level of each role.
 * Higher numbers indicate greater privilege.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.TEAM_MEMBER]: 10,
};

/**
 * Human-readable role descriptions for UI display
 */
export const roleDescriptions: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Manager — creates and manages tasks for the team',
  [UserRole.TEAM_MEMBER]: 'Team member — views and completes assigned tasks',
};

/**
 * Default role for new users (lower-privilege FRS role).
 */
export const DEFAULT_ROLE = UserRole.TEAM_MEMBER;

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Get all available roles as an array
 */
export function getAllRoles(): UserRole[] {
  return Object.values(UserRole);
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] ?? 0;
}
