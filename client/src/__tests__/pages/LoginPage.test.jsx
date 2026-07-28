/**
 * LoginPage — matches real DOM from LoginPage.jsx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import * as AuthCtx from '../../context/AuthContext';

const mockLogin = vi.fn();

const renderLogin = (overrides = {}) => {
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    user: null,
    token: null,
    loading: false,
    error: null,
    login: mockLogin,
    logout: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  });

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => vi.clearAllMocks());

describe('LoginPage', () => {
  it('renders Email and Password labels', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows "Please fill in all fields" alert on empty submit', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() =>
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login(email, password) on valid submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({
      data: { data: { user: { _id: '1', name: 'A', role: 'sales_rep' }, token: 'tok' } },
    });
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123')
    );
  });

  it('displays context error prop as alert', () => {
    renderLogin({ error: 'Invalid email or password' });
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('navigates to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({
      data: { data: { user: { _id: '1', name: 'A', role: 'sales_rep' }, token: 'tok' } },
    });
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() =>
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    );
  });

  it('has a link to /register', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: 'Create one' })).toBeInTheDocument();
  });
});
