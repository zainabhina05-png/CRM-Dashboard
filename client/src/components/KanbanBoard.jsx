import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { PIPELINE_STATUSES } from '../constants';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { listContainer, listItem } from '../styles/motion';

const KanbanBoard = ({ grouped, onStatusChange, onCardClick, loading }) => {
  const [activeLead, setActiveLead] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const findLeadById = useCallback((id) => {
    for (const status of PIPELINE_STATUSES) {
      const found = grouped[status]?.find((l) => l._id === id);
      if (found) return found;
    }
    return null;
  }, [grouped]);

  const handleDragStart = useCallback((event) => {
    const lead = findLeadById(event.active.id);
    setActiveLead(lead);
  }, [findLeadById]);

  const handleDragEnd = useCallback(async (event) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const lead = findLeadById(active.id);
    if (!lead) return;

    const newStatus = over.data?.current?.status || over.id;
    if (!PIPELINE_STATUSES.includes(newStatus) || lead.status === newStatus) return;

    await onStatusChange(lead._id, newStatus);
  }, [findLeadById, onStatusChange]);

  if (loading) {
    return (
      <motion.div
        className="kanban-board kanban-board--loading"
        variants={listContainer}
        initial="initial"
        animate="animate"
      >
        {PIPELINE_STATUSES.map((s) => (
          <motion.div key={s} variants={listItem} className="kanban-column kanban-column--skeleton">
            <div className="kanban-column__header" />
            <div className="kanban-column__body">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="kanban-card kanban-card--skeleton" />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="kanban-board"
        variants={listContainer}
        initial="initial"
        animate="animate"
      >
        {PIPELINE_STATUSES.map((status) => (
          <motion.div key={status} variants={listItem}>
            <KanbanColumn
              status={status}
              leads={grouped[status] || []}
              onCardClick={onCardClick}
            />
          </motion.div>
        ))}
      </motion.div>
      <AnimatePresence>
        {activeLead && (
          <DragOverlay>
            <motion.div
              className="kanban-card kanban-card--overlay glass-card"
              initial={{ scale: 1.02, opacity: 0.9 }}
              animate={{ scale: 1.04, opacity: 1 }}
            >
              <div className="kanban-card__header">
                <div className="lead-avatar">{activeLead.name.charAt(0).toUpperCase()}</div>
                <div className="kanban-card__title">{activeLead.name}</div>
              </div>
            </motion.div>
          </DragOverlay>
        )}
      </AnimatePresence>
    </DndContext>
  );
};

export default KanbanBoard;
