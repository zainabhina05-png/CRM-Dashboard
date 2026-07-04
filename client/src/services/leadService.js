import api from './api';

export const getLeads = async ({ page = 1, limit = 10, search = '', status = '', source = '', tag = '' } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (status && status !== 'All') params.append('status', status);
  if (source && source !== 'All') params.append('source', source);
  if (tag) params.append('tag', tag);
  const { data } = await api.get(`/leads?${params}`);
  return data;
};

export const getKanbanLeads = async ({ search = '', source = '', tag = '' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (source && source !== 'All') params.append('source', source);
  if (tag) params.append('tag', tag);
  const { data } = await api.get(`/leads/kanban?${params}`);
  return data;
};

export const getLead = async (id) => {
  const { data } = await api.get(`/leads/${id}`);
  return data;
};

export const createLead = async (payload) => {
  const { data } = await api.post('/leads', payload);
  return data;
};

export const checkDuplicates = async (payload) => {
  const { data } = await api.post('/leads/check-duplicates', payload);
  return data;
};

export const updateLead = async (id, payload) => {
  const { data } = await api.put(`/leads/${id}`, payload);
  return data;
};

export const patchLeadStatus = async (id, status) => {
  const { data } = await api.patch(`/leads/${id}/status`, { status });
  return data;
};

export const addActivity = async (id, payload) => {
  const { data } = await api.post(`/leads/${id}/activities`, payload);
  return data;
};

export const deleteLead = async (id) => {
  const { data } = await api.delete(`/leads/${id}`);
  return data;
};

export const getAnalytics = async () => {
  const { data } = await api.get('/leads/analytics');
  return data;
};

/**
 * Export leads as CSV. Returns a Blob so the caller can trigger a download.
 * Filters mirror the leads list query params.
 */
export const exportLeadsCSV = async ({ status = '', source = '', tag = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (source && source !== 'All') params.append('source', source);
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);

  const response = await api.get(`/leads/export?${params}`, {
    responseType: 'blob',
  });
  return response.data; // Blob
};
