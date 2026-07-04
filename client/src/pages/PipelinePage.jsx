import { useState, useEffect, useCallback } from 'react';
import useLeads from '../hooks/useLeads';
import useDebounce from '../hooks/useDebounce';
import KanbanBoard from '../components/KanbanBoard';
import LeadModal from '../components/LeadModal';
import LeadDetailPanel from '../components/LeadDetailPanel';
import { LEAD_SOURCES } from '../constants';
import { useToast } from '../context/ToastContext';

const PipelinePage = () => {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [detailLeadId, setDetailLeadId] = useState(null);

  const debouncedSearch = useDebounce(search);

  const {
    kanban,
    kanbanTotal,
    selectedLead,
    loading,
    error,
    fetchKanban,
    fetchLeadDetail,
    changeStatus,
    logActivity,
    clearError,
    clearSelectedLead,
  } = useLeads();

  const { toast } = useToast();

  const refreshKanban = useCallback(() => {
    fetchKanban({ search: debouncedSearch, source: sourceFilter });
  }, [fetchKanban, debouncedSearch, sourceFilter]);

  useEffect(() => {
    refreshKanban();
  }, [refreshKanban]);

  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await changeStatus(id, status);
      toast.success(`Moved to ${status}`);
      refreshKanban();
    } catch {
      refreshKanban();
    }
  }, [changeStatus, refreshKanban, toast]);

  const handleCardClick = useCallback(async (lead) => {
    setDetailLeadId(lead._id);
    await fetchLeadDetail(lead._id);
  }, [fetchLeadDetail]);

  const handleDetailClose = useCallback(() => {
    setDetailLeadId(null);
    clearSelectedLead();
  }, [clearSelectedLead]);

  const handleEditFromDetail = useCallback((lead) => {
    setEditingLead(lead);
    setModalOpen(true);
    handleDetailClose();
  }, [handleDetailClose]);

  const handleLogActivity = useCallback(async (payload) => {
    if (!detailLeadId) return;
    await logActivity(detailLeadId, payload);
  }, [detailLeadId, logActivity]);

  const handleDetailStatusChange = useCallback(async (id, status) => {
    await handleStatusChange(id, status);
    if (detailLeadId) await fetchLeadDetail(detailLeadId);
  }, [handleStatusChange, detailLeadId, fetchLeadDetail]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditingLead(null);
  }, []);

  const handleModalSubmit = useCallback(async () => {
    handleModalClose();
    refreshKanban();
  }, [handleModalClose, refreshKanban]);

  return (
    <div className="page page--pipeline">
      <div className="page__header">
        <div>
          <h1 className="page__title">Pipeline</h1>
          <p className="page__subtitle">
            {kanbanTotal} lead{kanbanTotal !== 1 ? 's' : ''} across all stages
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          + Add Lead
        </button>
      </div>

      <div className="leads-toolbar">
        <div className="search-box">
          <span className="search-box__icon">⚲</span>
          <input
            type="search"
            placeholder="Search pipeline…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-box__input glass-card"
            aria-label="Search pipeline"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by source"
          className="pipeline-source-filter"
        >
          <option value="All">All Sources</option>
          {LEAD_SOURCES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <span>{error}</span>
          <button className="alert__close" onClick={clearError} aria-label="Dismiss">✕</button>
        </div>
      )}

      <KanbanBoard
        grouped={kanban}
        loading={loading && !Object.keys(kanban).length}
        onStatusChange={handleStatusChange}
        onCardClick={handleCardClick}
      />

      {detailLeadId && (
        <LeadDetailPanel
          lead={selectedLead}
          loading={loading}
          onClose={handleDetailClose}
          onEdit={handleEditFromDetail}
          onLogActivity={handleLogActivity}
          onStatusChange={handleDetailStatusChange}
        />
      )}

      <LeadModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialData={editingLead}
        loading={loading}
      />
    </div>
  );
};

export default PipelinePage;
