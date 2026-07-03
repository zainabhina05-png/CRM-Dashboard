import { useState, useCallback } from 'react';
import {
  getLeads,
  createLead,
  updateLead,
  patchLeadStatus,
  deleteLead,
  getAnalytics,
} from '../services/leadService';
import { DEFAULT_PAGE_SIZE } from '../constants';

/**
 * useLeads — encapsulates all lead API calls with loading, error, and data state.
 * Always uses finally so loading never stays true after an error.
 */
const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, pages: 1 });
  const [analytics, setAnalytics] = useState({ counts: {}, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async ({ page = 1, limit = DEFAULT_PAGE_SIZE, search = '', status = '' } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeads({ page, limit, search, status });
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const addLead = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createLead(payload);
      return res.data.lead;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const editLead = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateLead(id, payload);
      return res.data.lead;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changeStatus = useCallback(async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await patchLeadStatus(id, status);
      // Optimistically update in-place
      setLeads((prev) =>
        prev.map((l) => (l._id === id ? res.data.lead : l))
      );
      return res.data.lead;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeLead = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteLead(id);
      setLeads((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    leads,
    pagination,
    analytics,
    loading,
    error,
    fetchLeads,
    fetchAnalytics,
    addLead,
    editLead,
    changeStatus,
    removeLead,
    clearError,
  };
};

export default useLeads;
