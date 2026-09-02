import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Guards routes restricted exclusively to administrators (role === 'ADMIN').
 * - Unauthenticated users are redirected to /login.
 * - Authenticated users with non-admin roles are redirected to /.
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
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

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
