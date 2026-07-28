/**
 * ProtectedRoute — redirect, loading spinner, role guard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import * as AuthContextModule from '../../context/AuthContext';

const mockUseAuth = (overrides = {}) =>
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: null,
    token: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });

const renderWithRouter = (ui, initialEntry = '/protected') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login"     element={<div>Login Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('shows spinner while loading', () => {
    mockUseAuth({ loading: true, user: null, token: null });
    renderWithRouter(
      <ProtectedRoute><div>Secret</div></ProtectedRoute>
    );
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    mockUseAuth({ user: null, token: null });
    renderWithRouter(
      <ProtectedRoute><div>Secret</div></ProtectedRoute>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseAuth({
      user: { _id: '1', name: 'Alice', role: 'sales_rep' },
      token: 'tok',
    });
    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    );
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('shows access denied when role is not allowed', () => {
    mockUseAuth({
      user: { _id: '1', name: 'Rep', role: 'sales_rep' },
      token: 'tok',
    });
    renderWithRouter(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Only</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });

  it('renders children when role is in allowedRoles', () => {
    mockUseAuth({
      user: { _id: '1', name: 'Admin', role: 'admin' },
      token: 'tok',
    });
    renderWithRouter(
      <ProtectedRoute allowedRoles={['admin', 'manager']}>
        <div>Allowed</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Allowed')).toBeInTheDocument();
  });
});
