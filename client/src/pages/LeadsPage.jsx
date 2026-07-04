import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import useLeads from '../hooks/useLeads';
import useDebounce from '../hooks/useDebounce';
import useRole from '../hooks/useRole';
import { useToast } from '../context/ToastContext';
import LeadTable from '../components/LeadTable';
import LeadModal from '../components/LeadModal';
import LeadDetailPanel from '../components/LeadDetailPanel';
import Pagination from '../components/Pagination';
import { LEAD_STATUSES, DEFAULT_PAGE_SIZE, LEAD_SOURCES } from '../constants';

const LeadsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [page, setPage] = useState(1);

  // Open modal if ?new=true in URL, then immediately clean that param
  const [modalOpen, setModalOpen] = useState(() => {
    if (searchParams.get('new')) {
      return true;
    }
    return false;
  });
  const [editingLead, setEditingLead] = useState(null);
  const [detailLeadId, setDetailLeadId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('');

  const debouncedSearch = useDebounce(search);

  const {
    leads,
    pagination,
    loading,
    error,
    fetchLeads,
    changeStatus,
    removeLead,
    clearError,
    selectedLead,
    fetchLeadDetail,
    logActivity,
    clearSelectedLead,
    exportCSV,
  } = useLeads();

  const { can } = useRole();
  const { toast } = useToast();

  // Fetch leads whenever filters/page change — debounced search prevents call on every keystroke
  useEffect(() => {
    fetchLeads({ page, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch, status: statusFilter, source: sourceFilter, tag: tagFilter });
  }, [fetchLeads, page, debouncedSearch, statusFilter, sourceFilter, tagFilter]);

  // Sync status filter and clean up ?new param from URL on mount
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    // Clean ?new=true from URL so refresh doesn't re-open the modal
    if (searchParams.get('new')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('new');
        return next;
      }, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenModal = useCallback(() => {
    setEditingLead(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditingLead(null);
    // Always clean up URL params related to modal on close
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('new');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleModalSubmit = useCallback(async () => {
    handleModalClose();
    fetchLeads({ page, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch, status: statusFilter, source: sourceFilter });
    toast.success(editingLead ? 'Lead updated' : 'Lead created');
  }, [handleModalClose, fetchLeads, page, debouncedSearch, statusFilter, sourceFilter, toast, editingLead]);

  const handleViewLead = useCallback(async (lead) => {
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
    await changeStatus(id, status);
    if (detailLeadId) await fetchLeadDetail(detailLeadId);
    fetchLeads({ page, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch, status: statusFilter, source: sourceFilter });
  }, [changeStatus, detailLeadId, fetchLeadDetail, fetchLeads, page, debouncedSearch, statusFilter, sourceFilter]);

  const handleStatusChange = useCallback((id, status) => {
    changeStatus(id, status);
  }, [changeStatus]);

  const handleDeleteRequest = useCallback((id) => {
    setDeleteConfirm(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await removeLead(deleteConfirm);
      setDeleteConfirm(null);
      fetchLeads({ page, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch, status: statusFilter, source: sourceFilter });
      toast.success('Lead deleted');
    } catch {
      toast.error('Failed to delete lead');
    }
  }, [deleteConfirm, removeLead, fetchLeads, page, debouncedSearch, statusFilter, sourceFilter, toast]);

  const handleExport = useCallback(async () => {
    try {
      await exportCSV({ status: statusFilter, source: sourceFilter, search: debouncedSearch });
      toast.success('Export ready — check your downloads');
    } catch {
      toast.error('Export failed');
    }
  }, [exportCSV, statusFilter, sourceFilter, debouncedSearch, toast]);

  const allStatuses = ['All', ...LEAD_STATUSES];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Leads</h1>
          <p className="page__subtitle">
            {pagination.total} lead{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          id="add-lead-btn"
          className="btn btn--primary"
          onClick={handleOpenModal}
        >
          + Add Lead
        </button>
        {can('export_leads') && (
          <button
            id="export-leads-btn"
            className="btn btn--ghost"
            onClick={handleExport}
            disabled={loading}
          >
            ↓ Export CSV
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="leads-toolbar">
        <div className="search-box">
          <span className="search-box__icon">⚲</span>
          <input
            id="lead-search-input"
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={handleSearchChange}
            className="search-box__input glass-card"
            aria-label="Search leads"
          />
          {search && (
            <button
              className="search-box__clear"
              onClick={() => { setSearch(''); setPage(1); }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-tabs" role="group" aria-label="Filter by status">
          {allStatuses.map((s) => (
            <button
              key={s}
              id={`filter-${s.toLowerCase()}`}
              className={`filter-tab ${statusFilter === s ? 'filter-tab--active' : ''}`}
              onClick={() => handleStatusFilter(s)}
              aria-pressed={statusFilter === s}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
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

      {/* Lead table */}
      <LeadTable
        leads={leads}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusChange={handleStatusChange}
        onView={handleViewLead}
      />

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        pages={pagination.pages}
        onPageChange={handlePageChange}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="modal modal--sm">
            <div className="modal__header">
              <h2 id="delete-title">Delete Lead</h2>
            </div>
            <p className="modal__body">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div className="modal__footer">
              <button
                className="btn btn--ghost"
                onClick={() => setDeleteConfirm(null)}
                id="cancel-delete-btn"
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={handleDeleteConfirm}
                id="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialData={editingLead}
        loading={loading}
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
    </div>
  );
};

export default LeadsPage;
