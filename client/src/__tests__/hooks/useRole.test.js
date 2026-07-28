/**
 * useRole — permission checks, role flags, hasRole
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useRole from '../../hooks/useRole';
import * as AuthCtx from '../../context/AuthContext';

const mockRole = (role) =>
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    user: role ? { _id: '1', name: 'U', role } : null,
    token: role ? 'tok' : null,
  });

describe('useRole', () => {
  it('returns null role when not authenticated', () => {
    mockRole(null);
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBeNull();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isManager).toBe(false);
    expect(result.current.isSalesRep).toBe(false);
  });

  it('sets isAdmin=true for admin role', () => {
    mockRole('admin');
    const { result } = renderHook(() => useRole());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isManager).toBe(false);
    expect(result.current.isSalesRep).toBe(false);
  });

  it('sets isManager=true for manager role', () => {
    mockRole('manager');
    const { result } = renderHook(() => useRole());
    expect(result.current.isManager).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('sets isSalesRep=true for sales_rep', () => {
    mockRole('sales_rep');
    const { result } = renderHook(() => useRole());
    expect(result.current.isSalesRep).toBe(true);
  });

  describe('can()', () => {
    it('sales_rep can create_lead', () => {
      mockRole('sales_rep');
      const { result } = renderHook(() => useRole());
      expect(result.current.can('create_lead')).toBe(true);
    });

    it('sales_rep cannot delete_lead', () => {
      mockRole('sales_rep');
      const { result } = renderHook(() => useRole());
      expect(result.current.can('delete_lead')).toBe(false);
    });

    it('manager can delete_lead', () => {
      mockRole('manager');
      const { result } = renderHook(() => useRole());
      expect(result.current.can('delete_lead')).toBe(true);
    });

    it('admin can manage_users', () => {
      mockRole('admin');
      const { result } = renderHook(() => useRole());
      expect(result.current.can('manage_users')).toBe(true);
    });

    it('sales_rep cannot manage_users', () => {
      mockRole('sales_rep');
      const { result } = renderHook(() => useRole());
      expect(result.current.can('manage_users')).toBe(false);
    });

    it('returns false for unknown permission', () => {
      mockRole('admin');
      const { result } = renderHook(() => useRole());
      expect(result.current.can('unknown_action')).toBe(false);
    });

    it('returns false when not authenticated', () => {
      mockRole(null);
      const { result } = renderHook(() => useRole());
      expect(result.current.can('create_lead')).toBe(false);
    });
  });

  describe('hasRole()', () => {
    it('returns true when user has specified role', () => {
      mockRole('manager');
      const { result } = renderHook(() => useRole());
      expect(result.current.hasRole('manager', 'admin')).toBe(true);
    });

    it('returns false when user does not have role', () => {
      mockRole('sales_rep');
      const { result } = renderHook(() => useRole());
      expect(result.current.hasRole('admin', 'manager')).toBe(false);
    });
  });
});
