/**
 * TagInput — adding, removing tags, keyboard interaction
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from '../../components/TagInput';

describe('TagInput', () => {
  it('renders existing tags', () => {
    render(<TagInput tags={['hot', 'vip']} onChange={vi.fn()} />);
    expect(screen.getByText('hot')).toBeInTheDocument();
    expect(screen.getByText('vip')).toBeInTheDocument();
  });

  it('adds a tag on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'newtag');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(['newtag']);
  });

  it('adds a tag on comma keystroke', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'mytag,');
    expect(onChange).toHaveBeenCalled();
  });

  it('removes tag when × button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput tags={['hot', 'vip']} onChange={onChange} />);
    // Click the × on the first tag
    const removeButtons = screen.getAllByRole('button');
    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalled();
    const newTags = onChange.mock.calls[0][0];
    expect(newTags).not.toContain('hot');
  });

  it('does not add empty or whitespace-only tags', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not add duplicate tags', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput tags={['existing']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'existing');
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
