/**
 * useDebounce — delays value update until after specified delay
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebounce from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update value before delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );
    rerender({ value: 'updated' });
    // Still shows old value — timer hasn't fired
    expect(result.current).toBe('initial');
  });

  it('updates value after delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );
    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('updated');
  });

  it('resets timer when value changes before delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(200); }); // not yet fired
    rerender({ value: 'abc' });
    act(() => { vi.advanceTimersByTime(200); }); // still not fired (timer reset)
    expect(result.current).toBe('a'); // still original
    act(() => { vi.advanceTimersByTime(100); }); // now 300ms since last change
    expect(result.current).toBe('abc');
  });

  it('uses default delay of 400ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'first' } }
    );
    rerender({ value: 'second' });
    act(() => { vi.advanceTimersByTime(399); });
    expect(result.current).toBe('first');
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('second');
  });
});
