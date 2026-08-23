import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Guards a route behind authentication.
 * If the user is not authenticated, redirects to /login and saves the
 * intended destination in location state so they can be returned afterwards.
 * While auth is still loading (initial hydration), renders nothing to avoid flash.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
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

  return <>{children}</>;
};