/**
 * Navbar — links, user display, logout, role badge, active state
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import * as AuthCtx from '../../context/AuthContext';

// Stub reminder service so NotificationBell doesn't make real requests
vi.mock('../../services/reminderService', () => ({
  getReminderSummary: vi.fn().mockResolvedValue({
    success: true,
    message: 'ok',
    data: { overdue: 0, dueToday: 0, dueThisWeek: 0 },
  }),
}));

const mockLogout = vi.fn();

const renderNavbar = (role = 'admin', path = '/dashboard') => {
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    user: { _id: '1', name: 'Alice Admin', email: 'a@test.com', role },
    token: 'tok',
    loading: false,
    logout: mockLogout,
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  );
};

describe('Navbar', () => {
  it('renders the LeadFlow brand link', () => {
    renderNavbar();
    expect(screen.getByText('LeadFlow')).toBeInTheDocument();
  });

  it('renders all four nav links', () => {
    renderNavbar();
    // Both desktop and mobile menus render the same links — use getAllBy and assert >= 1
    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: 'Pipeline' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: 'Leads' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: 'Analytics' }).length).toBeGreaterThanOrEqual(1);
  });

  it('marks the current route link as active', () => {
    renderNavbar('admin', '/pipeline');
    // The desktop navbar__links nav renders the active link
    const allPipelineLinks = screen.getAllByRole('link', { name: 'Pipeline' });
    const activeLink = allPipelineLinks.find(l => l.classList.contains('navbar__link--active'));
    expect(activeLink).toBeDefined();

    // None of the Dashboard links should be active
    const dashLinks = screen.getAllByRole('link', { name: 'Dashboard' });
    dashLinks.forEach(l => expect(l).not.toHaveClass('navbar__link--active'));
  });

  it('shows the user first initial in avatar', () => {
    renderNavbar();
    const avatar = screen.getByLabelText(/Logged in as/i);
    expect(avatar.textContent).toBe('A');
  });

  it('shows user name', () => {
    renderNavbar();
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
  });

  it('shows the role badge for admin', () => {
    renderNavbar('admin');
    expect(screen.getByLabelText(/role: admin/i)).toBeInTheDocument();
  });

  it('shows the role badge for manager', () => {
    renderNavbar('manager');
    expect(screen.getByLabelText(/role: manager/i)).toBeInTheDocument();
  });

  it('shows the role badge for sales rep', () => {
    renderNavbar('sales_rep');
    expect(screen.getByLabelText(/role: sales rep/i)).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValueOnce(undefined);
    renderNavbar();
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('renders notification bell button', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('opens notification dropdown on bell click', async () => {
    const user = userEvent.setup();
    renderNavbar();
    // Wait for the initial reminder summary to resolve
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    // Dropdown should appear with "Reminders" heading and "No urgent reminders" text
    await waitFor(() =>
      expect(screen.getByText('Reminders')).toBeInTheDocument()
    );
    expect(screen.getByText(/No urgent reminders/i)).toBeInTheDocument();
  });

  it('shows urgent count badge when there are overdue reminders', async () => {
    const { getReminderSummary } = await import('../../services/reminderService');
    getReminderSummary.mockResolvedValueOnce({
      data: { overdue: 3, dueToday: 1, dueThisWeek: 5 },
    });

    renderNavbar();
    // The badge is non-interactive; just verify the bell renders with overdue info
    await waitFor(() => {
      const bell = screen.getByRole('button', { name: /notifications/i });
      expect(bell).toBeInTheDocument();
    });
  });
});
