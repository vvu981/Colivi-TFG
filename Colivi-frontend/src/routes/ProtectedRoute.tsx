import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('USER' | 'TENANT' | 'OWNER' | 'ADMIN')[];
  forbiddenRoles?: ('USER' | 'TENANT' | 'OWNER' | 'ADMIN')[];
}

/**
 * Guards a route behind authentication with optional RBAC restrictions.
 * - If unauthenticated, redirects to /login.
 * - If user's role is in forbiddenRoles, redirects to /admin (for ADMIN) or / (for others).
 * - If user's role is not in allowedRoles (when specified), redirects to /.
 */
export const ProtectedRoute = ({
  children,
  allowedRoles,
  forbiddenRoles = [],
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Avoid rendering the page before we know auth status
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check forbidden roles
  if (user && forbiddenRoles.includes(user.role as any)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />;
  }

  // Check allowed roles
  if (user && allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};