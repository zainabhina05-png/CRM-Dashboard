/**
 * RegisterPage — matches real DOM from RegisterPage.jsx
 * Labels: "Full Name", "Email", "Password", "Confirm Password"
 * Validation error: "Please fill in all fields" shown in alert, not inline
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from '../../pages/RegisterPage';
import * as AuthCtx from '../../context/AuthContext';

const mockRegister = vi.fn();

const renderRegister = (overrides = {}) => {
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    user: null, token: null, loading: false, error: null,
    register: mockRegister, clearError: vi.fn(),
    ...overrides,
  });
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register"  element={<RegisterPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/login"     element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => vi.clearAllMocks());

describe('RegisterPage', () => {
  it('renders Full Name, Email, Password, and Confirm Password fields', () => {
    renderRegister();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('renders Create Account button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('shows "Please fill in all fields" alert on empty submit', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() =>
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows password length error when password is too short', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText('Full Name'),  'Alice');
    await user.type(screen.getByLabelText('Email'),      'alice@example.com');
    await user.type(screen.getByLabelText('Password'),   'abc');
    await user.type(screen.getByLabelText('Confirm Password'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() =>
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    );
  });

  it('shows "Passwords do not match" when passwords differ', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText('Full Name'),  'Bob');
    await user.type(screen.getByLabelText('Email'),      'bob@example.com');
    await user.type(screen.getByLabelText('Password'),   'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() =>
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    );
  });

  it('calls register(name, email, password) on valid submit', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({
      data: { data: { user: { _id: '1', name: 'New', role: 'sales_rep' }, token: 'tok' } },
    });
    renderRegister();

    await user.type(screen.getByLabelText('Full Name'),  'New User');
    await user.type(screen.getByLabelText('Email'),      'new@example.com');
    await user.type(screen.getByLabelText('Password'),   'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('New User', 'new@example.com', 'password123')
    );
  });

  it('displays context error as alert', () => {
    renderRegister({ error: 'Email already in use' });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Email already in use')).toBeInTheDocument();
  });

  it('has a link to the login page', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
