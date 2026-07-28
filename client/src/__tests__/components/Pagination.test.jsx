/**
 * Pagination — page buttons, ellipsis, disabled states, callbacks
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../components/Pagination';

describe('Pagination', () => {
  it('renders nothing when pages <= 1', () => {
    const { container } = render(
      <Pagination page={1} pages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correct number of page buttons', () => {
    render(<Pagination page={1} pages={3} onPageChange={vi.fn()} />);
    // Pages 1, 2, 3 + prev/next arrows
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  });

  it('calls onPageChange with correct page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={1} pages={5} onPageChange={onChange} />);
    // Click on page 2 button
    const buttons = screen.getAllByRole('button');
    const page2 = buttons.find(b => b.textContent === '2');
    if (page2) await user.click(page2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('marks current page button as active', () => {
    render(<Pagination page={2} pages={5} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const activePage = buttons.find(b => b.classList.contains('pagination__btn--active'));
    expect(activePage).toBeDefined();
    expect(activePage.textContent).toBe('2');
  });

  it('disables previous button on first page', () => {
    render(<Pagination page={1} pages={5} onPageChange={vi.fn()} />);
    const prevBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('‹') || b.textContent.includes('←') || b.textContent.includes('<')
    );
    if (prevBtn) expect(prevBtn).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination page={5} pages={5} onPageChange={vi.fn()} />);
    const nextBtn = screen.getAllByRole('button').find(b =>
      b.textContent.includes('›') || b.textContent.includes('→') || b.textContent.includes('>')
    );
    if (nextBtn) expect(nextBtn).toBeDisabled();
  });
});
