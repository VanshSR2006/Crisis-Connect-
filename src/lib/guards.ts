import { UserRole } from '@/types';

/**
 * Stub for future role-based route access check.
 * In Phase 1, all routes remain accessible for demo & verification.
 */
export function hasRoleAccess(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return true; // Phase 1 demo mode
  return userRole === requiredRole;
}
