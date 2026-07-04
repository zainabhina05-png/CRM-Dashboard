import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SOURCE_LABELS } from '../constants';

const KanbanCard = ({ lead, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id, data: { lead, status: lead.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`kanban-card glass-card ${isDragging ? 'kanban-card--dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className="kanban-card__click"
        onClick={(e) => {
          e.stopPropagation();
          onClick(lead);
        }}
        aria-label={`View details for ${lead.name}`}
      >
        <div className="kanban-card__header">
          <div className="lead-avatar">{lead.name.charAt(0).toUpperCase()}</div>
          <div className="kanban-card__title">{lead.name}</div>
        </div>
        {lead.company && <p className="kanban-card__company">{lead.company}</p>}
        <p className="kanban-card__email muted">{lead.email}</p>
        <div className="kanban-card__footer">
          {lead.source && lead.source !== 'other' && (
            <span className="kanban-card__source">{SOURCE_LABELS[lead.source]}</span>
          )}
          {lead.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-chip tag-chip--sm">{tag}</span>
          ))}
        </div>
      </button>
    </article>
  );
};

export default KanbanCard;
