import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import * as AuthContextModule from '../features/auth/context/AuthContext';

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when auth is loading', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
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
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Content</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects non-admin user (USER role) to home /', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: {
        id: 'u-1',
        email: 'user@colivi.com',
        phone: null,
        role: 'USER',
        nickname: 'normaluser',
        firstName: 'Normal',
        lastName1: 'User',
        lastName2: null,
        profilePicUrl: null,
        createdAt: '2026-01-01',
      },
      token: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Content</div>
              </AdminRoute>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated user has ADMIN role', () => {
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
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminRoute>
          <div>Admin Moderation Portal Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Moderation Portal Content')).toBeInTheDocument();
  });
});
