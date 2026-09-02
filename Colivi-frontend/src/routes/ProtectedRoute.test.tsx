import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from '../features/auth/context/AuthContext';

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user to /login', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/create-listing']}>
        <Routes>
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute>
                <div>Create Listing Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Create Listing Page')).not.toBeInTheDocument();
  });

  it('redirects ADMIN user away from forbidden creation routes to /admin', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@colivi.com',
        phone: null,
        role: 'ADMIN',
        nickname: 'admin',
        firstName: 'Admin',
        lastName1: 'Super',
        lastName2: null,
        profilePicUrl: null,
        createdAt: '2026-01-01',
      },
      token: 'admin-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/create-accommodation']}>
        <Routes>
          <Route
            path="/create-accommodation"
            element={
              <ProtectedRoute forbiddenRoles={['ADMIN']}>
                <div>Create Accommodation Form</div>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Create Accommodation Form')).not.toBeInTheDocument();
  });

  it('allows regular USER on creation routes when forbiddenRoles is ADMIN', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@colivi.com',
        phone: null,
        role: 'USER',
        nickname: 'user',
        firstName: 'Normal',
        lastName1: 'User',
        lastName2: null,
        profilePicUrl: null,
        createdAt: '2026-01-01',
      },
      token: 'user-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/create-accommodation']}>
        <Routes>
          <Route
            path="/create-accommodation"
            element={
              <ProtectedRoute forbiddenRoles={['ADMIN']}>
                <div>Create Accommodation Form</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Create Accommodation Form')).toBeInTheDocument();
  });
});
