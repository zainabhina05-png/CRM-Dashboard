/**
 * StatusBadge — renders each pipeline status with correct color variable
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusBadge from '../../components/StatusBadge';

const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

describe('StatusBadge — display mode', () => {
  statuses.forEach(status => {
    it(`renders "${status}" label`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(new RegExp(status))).toBeInTheDocument();
    });
  });

  it('applies status-badge class', () => {
    const { container } = render(<StatusBadge status="New" />);
    expect(container.firstChild).toHaveClass('status-badge');
  });
});

describe('StatusBadge — editable (with onChange)', () => {
  it('renders a select element when onChange is provided', () => {
    const onChange = vi.fn();
    render(<StatusBadge status="New" onChange={onChange} leadId="lead1" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onChange with leadId and new status on change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusBadge status="New" onChange={onChange} leadId="lead1" />);
    await user.selectOptions(screen.getByRole('combobox'), 'Contacted');
    expect(onChange).toHaveBeenCalledWith('lead1', 'Contacted');
  });
});
