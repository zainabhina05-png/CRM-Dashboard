import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getReminders,
  getReminderSummary,
  createReminder,
  completeReminder,
  deleteReminder,
} from '../services/reminderService';

/**
 * useReminders — manages reminders for a specific lead or globally.
 *
 * @param {string} [leadId]  — if supplied, auto-fetches reminders for that lead on mount
 */
const useReminders = (leadId) => {
  const [reminders, setReminders]   = useState([]);
  const [summary, setSummary]       = useState({ overdue: 0, dueToday: 0, dueThisWeek: 0 });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchReminders = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReminders({ leadId, ...opts });
      if (mountedRef.current) setReminders(res.data.reminders);
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Failed to fetch reminders');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [leadId]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getReminderSummary();
      if (mountedRef.current) setSummary(res.data);
    } catch {
      // summary failure is non-critical, don't surface to user
    }
  }, []);

  // Auto-fetch when a leadId is provided
  useEffect(() => {
    if (leadId) fetchReminders();
  }, [leadId, fetchReminders]);

  const addReminder = useCallback(async ({ title, dueDate }) => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createReminder({ title, dueDate, leadId });
      if (mountedRef.current) {
        setReminders((prev) => [...prev, res.data.reminder].sort(
          (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
        ));
      }
      return res.data.reminder;
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Failed to create reminder');
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [leadId]);

  const markComplete = useCallback(async (id) => {
    setError(null);
    try {
      await completeReminder(id);
      if (mountedRef.current) {
        setReminders((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Failed to complete reminder');
    }
  }, []);

  const removeReminder = useCallback(async (id) => {
    setError(null);
    try {
      await deleteReminder(id);
      if (mountedRef.current) {
        setReminders((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Failed to delete reminder');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    reminders,
    summary,
    loading,
    error,
    fetchReminders,
    fetchSummary,
    addReminder,
    markComplete,
    removeReminder,
    clearError,
  };
};

export default useReminders;
