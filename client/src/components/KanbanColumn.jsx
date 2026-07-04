import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { STATUS_COLORS } from '../constants';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ status, leads, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const color = STATUS_COLORS[status];

  return (
    <div
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
      style={{ '--column-color': color }}
    >
      <header className="kanban-column__header">
        <span className="kanban-column__dot" aria-hidden="true" />
        <h3 className="kanban-column__title">{status}</h3>
        <span className="kanban-column__count">{leads.length}</span>
      </header>
      <div ref={setNodeRef} className="kanban-column__body">
        <SortableContext items={leads.map((l) => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard key={lead._id} lead={lead} onClick={onCardClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <p className="kanban-column__empty">Drop leads here</p>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
