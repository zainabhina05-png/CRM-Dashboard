import api from './api';

export const getReminders = async ({ leadId, completed } = {}) => {
  const params = new URLSearchParams();
  if (leadId !== undefined) params.append('leadId', leadId);
  if (completed !== undefined) params.append('completed', completed);
  const { data } = await api.get(`/reminders?${params}`);
  return data;
};

export const getReminderSummary = async () => {
  const { data } = await api.get('/reminders/summary');
  return data;
};

export const createReminder = async ({ title, dueDate, leadId }) => {
  const { data } = await api.post('/reminders', { title, dueDate, leadId });
  return data;
};

export const completeReminder = async (id) => {
  const { data } = await api.patch(`/reminders/${id}/complete`);
  return data;
};

export const deleteReminder = async (id) => {
  const { data } = await api.delete(`/reminders/${id}`);
  return data;
};
