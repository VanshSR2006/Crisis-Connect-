/**
 * src/components/shared/RequireAuth.tsx
 * Role-based route guard. Wraps protected route groups in router.tsx.
 *
 * Behavior:
 *  - No token or no stored user  → redirect to /login
 *  - user.role !== allowedRole   → redirect to /login
 *  - Match                       → render <Outlet /> (children render normally)
 *
 * NOTE: This component does NOT modify any layout or UI. It only gates access.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import type { UserRole } from '@/types';

interface RequireAuthProps {
  /** The single role that is permitted to access the wrapped route group. */
  allowedRole: UserRole;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRole }) => {
  const token = getStoredToken();
  const user = getStoredUser();

  // No active session at all
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but wrong role (e.g. citizen trying /officer/*)
  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  // Authorised — render the child routes
  return <Outlet />;
};
