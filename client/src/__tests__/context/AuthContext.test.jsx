/**
 * AuthContext — tests the reducer logic and exposed methods.
 *
 * Strategy: mock the service layer (authService.js) so no network
 * requests are made. This is faster and more reliable than HTTP mocking
 * in jsdom, which doesn't intercept XHR-based Axios reliably.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ─── mock the service module before importing the context ──
vi.mock('../../services/authService', () => ({
  login:    vi.fn(),
  register: vi.fn(),
  logout:   vi.fn(),
  getMe:    vi.fn(),
}));

import * as authService from '../../services/authService';
import { AuthProvider, useAuth } from '../../context/AuthContext';

/* ── shared fixture ──────────────────────────────────────── */
const fakeUser  = { _id: '1', name: 'Admin User', email: 'admin@test.com', role: 'admin' };
const fakeToken = 'fake.jwt.token';

const fakeLoginResponse = () => ({
  data: { data: { user: fakeUser, token: fakeToken, sessionId: 'sess001' } },
});

/* ── helper component ────────────────────────────────────── */
const AuthDisplay = () => {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      {loading && <span data-testid="loading">Loading</span>}
      {user   && <span data-testid="user-name">{user.name}</span>}
      {user   && <span data-testid="user-role">{user.role}</span>}
      {!user && !loading && <span data-testid="logged-out">Logged out</span>}
      <button onClick={() => login('admin@test.com', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const wrap = (ui) =>
  render(<MemoryRouter><AuthProvider>{ui}</AuthProvider></MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // Default: getMe rejects (no stored token scenario)
  authService.getMe.mockRejectedValue(new Error('no token'));
});

/* ──────────────────────────────────────────────────────────── */
describe('AuthContext', () => {
  it('starts in loading state and resolves to logged-out when no token', async () => {
    // getMe is already mocked to reject; no token in localStorage
    wrap(<AuthDisplay />);
    // After async resolution, should show logged-out (loading resolves very fast in test)
    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    );
    expect(screen.getByTestId('logged-out')).toBeInTheDocument();
  });

  it('login: calls loginService and sets user on success', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValueOnce(fakeLoginResponse());

    wrap(<AuthDisplay />);
    await waitFor(() => screen.getByText('Login')); // wait for loading to finish

    await user.click(screen.getByText('Login'));

    await waitFor(() =>
      expect(screen.getByTestId('user-name')).toBeInTheDocument()
    );
    expect(screen.getByTestId('user-name').textContent).toBe('Admin User');
    expect(screen.getByTestId('user-role').textContent).toBe('admin');
    expect(localStorage.getItem('token')).toBe(fakeToken);
  });

  it('login: calls loginService with correct credentials', async () => {
    // The "login fails" scenario is covered in LoginPage.test.jsx via
    // the context error prop. Here we just verify loginService is called.
    const user = userEvent.setup();
    authService.login.mockResolvedValueOnce(fakeLoginResponse());

    wrap(<AuthDisplay />);
    await waitFor(() => screen.getByText('Login'));
    await user.click(screen.getByText('Login'));

    expect(authService.login).toHaveBeenCalledWith('admin@test.com', 'password123');
  });

  it('logout: clears user and removes token from localStorage', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValueOnce(fakeLoginResponse());
    authService.logout.mockResolvedValueOnce({});

    wrap(<AuthDisplay />);
    await waitFor(() => screen.getByText('Login'));
    await user.click(screen.getByText('Login'));
    await waitFor(() => screen.getByTestId('user-name'));

    await user.click(screen.getByText('Logout'));

    await waitFor(() =>
      expect(screen.getByTestId('logged-out')).toBeInTheDocument()
    );
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('restores user from localStorage when getMe succeeds', async () => {
    localStorage.setItem('token', fakeToken);
    authService.getMe.mockResolvedValueOnce({
      data: { data: { user: fakeUser } },
    });

    wrap(<AuthDisplay />);

    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    );
    expect(screen.getByTestId('user-name')).toBeInTheDocument();
    expect(screen.getByTestId('user-name').textContent).toBe('Admin User');
  });

  it('clears localStorage when getMe fails on mount', async () => {
    localStorage.setItem('token', 'expired.token');
    authService.getMe.mockRejectedValueOnce(new Error('expired'));

    wrap(<AuthDisplay />);
    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    );
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('logged-out')).toBeInTheDocument();
  });
});
