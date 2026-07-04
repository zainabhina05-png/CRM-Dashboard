import { useState, useCallback } from 'react';
import {
  getLeads,
  getKanbanLeads,
  getLead,
  createLead,
  checkDuplicates,
  updateLead,
  patchLeadStatus,
  addActivity,
  deleteLead,
  getAnalytics,
  exportLeadsCSV,
} from '../services/leadService';
import { DEFAULT_PAGE_SIZE } from '../constants';

/**
 * useLeads — encapsulates all lead API calls with loading, error, and data state.
 */
const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [kanban, setKanban] = useState({});
  const [kanbanTotal, setKanbanTotal] = useState(0);
  const [selectedLead, setSelectedLead] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, pages: 1 });
  const [analytics, setAnalytics] = useState({
    counts: {},
    total: 0,
    bySource: [],
    winRate: 0,
    lossRate: 0,
    trend: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async ({ page = 1, limit = DEFAULT_PAGE_SIZE, search = '', status = '', source = '', tag = '' } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeads({ page, limit, search, status, source, tag });
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKanban = useCallback(async ({ search = '', source = '', tag = '' } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getKanbanLeads({ search, source, tag });
      setKanban(res.data.grouped);
      setKanbanTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeadDetail = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLead(id);
      setSelectedLead(res.data.lead);
      return res.data.lead;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lead details');
      throw err;
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

  const exportCSV = useCallback(async (filters = {}) => {
    setError(null);
    try {
      const blob = await exportLeadsCSV(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
      throw err;
    }
  }, []);

  const detectDuplicates = useCallback(async (payload) => {
    try {
      const res = await checkDuplicates(payload);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check duplicates');
      throw err;
    }
  }, []);

  const addLead = useCallback(async (payload, { force = false } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createLead({ ...payload, force });
      return res.data.lead;
    } catch (err) {
      if (err.response?.status === 409) {
        const duplicateError = new Error(err.response.data.message);
        duplicateError.duplicates = err.response.data.data?.duplicates || [];
        duplicateError.isDuplicate = true;
        throw duplicateError;
      }
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
    setError(null);
    try {
      const res = await patchLeadStatus(id, status);
      const updated = res.data.lead;
      setLeads((prev) => prev.map((l) => (l._id === id ? updated : l)));
      setSelectedLead((prev) => (prev?._id === id ? updated : prev));
      setKanban((prev) => {
        if (!Object.keys(prev).length) return prev;
        const next = {};
        Object.keys(prev).forEach((col) => { next[col] = [...(prev[col] || [])]; });
        let movedLead = null;
        Object.keys(next).forEach((col) => {
          const idx = next[col].findIndex((l) => l._id === id);
          if (idx !== -1) {
            movedLead = { ...next[col][idx], status: updated.status };
            next[col].splice(idx, 1);
          }
        });
        if (movedLead && next[updated.status]) {
          next[updated.status].unshift(movedLead);
        }
        return next;
      });
      return updated;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      throw err;
    }
  }, []);

  const logActivity = useCallback(async (id, payload) => {
    setError(null);
    try {
      const res = await addActivity(id, payload);
      setSelectedLead(res.data.lead);
      return res.data.lead;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log activity');
      throw err;
    }
  }, []);

  const removeLead = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteLead(id);
      setLeads((prev) => prev.filter((l) => l._id !== id));
      setSelectedLead((prev) => (prev?._id === id ? null : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSelectedLead = useCallback(() => setSelectedLead(null), []);

  return {
    leads,
    kanban,
    kanbanTotal,
    selectedLead,
    pagination,
    analytics,
    loading,
    error,
    fetchLeads,
    fetchKanban,
    fetchLeadDetail,
    fetchAnalytics,
    detectDuplicates,
    addLead,
    editLead,
    changeStatus,
    logActivity,
    removeLead,
    exportCSV,
    clearError,
    clearSelectedLead,
  };
};

export default useLeads;
