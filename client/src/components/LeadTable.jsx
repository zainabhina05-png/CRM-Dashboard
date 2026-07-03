import { useCallback } from 'react';
import StatusBadge from './StatusBadge';

const LeadTable = ({ leads, onEdit, onDelete, onStatusChange, loading }) => {
  const handleEdit = useCallback((lead) => () => onEdit(lead), [onEdit]);
  const handleDelete = useCallback((id) => () => onDelete(id), [onDelete]);

  if (loading) {
    return (
      <div className="table-skeleton glass-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="table-skeleton__row" />
        ))}
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">◲</div>
        <h3>No leads found</h3>
        <p>Try adjusting your search or filter, or add a new lead.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id} className="lead-table__row">
              <td className="lead-table__name">
                <div className="lead-avatar">{lead.name.charAt(0).toUpperCase()}</div>
                {lead.name}
              </td>
              <td>{lead.email}</td>
              <td>{lead.company || <span className="muted">—</span>}</td>
              <td>{lead.phone || <span className="muted">—</span>}</td>
              <td>
                <StatusBadge
                  status={lead.status}
                  leadId={lead._id}
                  onChange={onStatusChange}
                />
              </td>
              <td className="muted">
                {new Date(lead.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="lead-table__actions">
                <button
                  className="btn btn--sm btn--ghost btn--icon"
                  onClick={handleEdit(lead)}
                  aria-label={`Edit ${lead.name}`}
                >
                  ✎
                </button>
                <button
                  className="btn btn--sm btn--danger-ghost btn--icon"
                  onClick={handleDelete(lead._id)}
                  aria-label={`Delete ${lead.name}`}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;
