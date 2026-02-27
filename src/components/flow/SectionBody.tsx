import { useState, useRef, useMemo, useCallback } from 'react';
import type { RapidLogEntry } from '../../context/AppContext';
import { uid, decodeDrag } from './types';
import type { DaySection } from './types';
import TaskCard from './TaskCard';
import EventCard from './EventCard';
import AddTaskInline from './AddTaskInline';
import TaskDetailModal from './TaskDetailModal';

export default function SectionBody({
  section,
  date,
  tasks,
  events,
  onUpdate,
  onDelete,
  onAdd,
  onBatchUpdate,
  draggingId,
  onDragStartEntry,
  selectedIds,
  onToggleSelect,
  bulkMode,
}: {
  section: DaySection;
  date: string;
  tasks: RapidLogEntry[];
  events: RapidLogEntry[];
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onAdd: (entry: RapidLogEntry) => void;
  onBatchUpdate: (updates: Array<{ id: string; updates: Partial<RapidLogEntry> }>) => void;
  draggingId: string | null;
  onDragStartEntry: (e: React.DragEvent, entryId: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  bulkMode?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [detailEntry, setDetailEntry] = useState<RapidLogEntry | null>(null);
  // Track which index the dragged item is hovering over for insertion indicator
  const [dropInsertIdx, setDropInsertIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine events + tasks into a single visual list for ordering
  const allItems = useMemo(() => {
    const evts = events.map(ev => ({ ...ev, _isEvent: true as const }));
    const tsks = tasks.map(t => ({ ...t, _isEvent: false as const }));
    return [...evts, ...tsks];
  }, [events, tasks]);

  // Calculate drop index from mouse Y position relative to card positions
  const calcDropIndex = useCallback((clientY: number) => {
    if (!containerRef.current) return allItems.length;
    const cards = containerRef.current.querySelectorAll('[data-drop-item]');
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY < midY) return i;
    }
    return cards.length;
  }, [allItems.length]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
    setDropInsertIdx(calcDropIndex(e.clientY));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if actually leaving the container (not entering a child)
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setDragOver(false);
      setDropInsertIdx(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // prevent column-level fallback
    const insertAt = dropInsertIdx ?? allItems.length;
    setDragOver(false);
    setDropInsertIdx(null);

    // Check if this is a habit drag (text/plain contains habit info)
    const habitData = e.dataTransfer.getData('text/plain');
    if (habitData && habitData.startsWith('habit:')) {
      const parts = habitData.split(':');
      const habitName = parts.slice(2).join(':');
      onAdd({
        id: uid(),
        type: 'task',
        title: habitName,
        date,
        status: 'todo',
        section: section.id,
        movedCount: 0,
        sourceHabit: habitName,
        order: insertAt,
      });
      return;
    }

    const payload = decodeDrag(e.dataTransfer.getData('application/json'));
    if (!payload) return;

    const draggedIds = new Set(payload.entryIds);

    // Build the new ordered list: remove dragged items, insert at drop position
    const remaining = allItems.filter(item => !draggedIds.has(item.id));
    // Clamp insert position
    const clampedIdx = Math.min(insertAt, remaining.length);

    const draggedEntries = payload.entryIds;

    // Build the final ordered list
    const finalOrder = [
      ...remaining.slice(0, clampedIdx).map(item => item.id),
      ...draggedEntries,
      ...remaining.slice(clampedIdx).map(item => item.id),
    ];

    // Batch update all items with new order + section assignment for dragged items
    const updates = finalOrder.map((id, idx) => ({
      id,
      updates: {
        order: idx,
        ...(draggedIds.has(id) ? { date, section: section.id, timeBlock: undefined, time: undefined } : {}),
      } as Partial<RapidLogEntry>,
    }));
    onBatchUpdate(updates);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`px-3 py-2 space-y-1.5 transition-colors min-h-[48px] ${
        dragOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset rounded-b' : ''
      }`}
    >
      {/* Events pinned first */}
      {events.map((ev, i) => (
        <div key={ev.id} data-drop-item>
          {/* Drop insertion indicator */}
          {dropInsertIdx === i && (
            <div className="h-0.5 bg-primary rounded-full mx-2 my-1 transition-all" />
          )}
          <EventCard entry={ev} onOpenDetail={() => setDetailEntry(ev)} />
        </div>
      ))}

      {/* Task cards */}
      {tasks.map((t, i) => {
        const globalIdx = events.length + i;
        return (
          <div key={t.id} data-drop-item>
            {dropInsertIdx === globalIdx && (
              <div className="h-0.5 bg-primary rounded-full mx-2 my-1 transition-all" />
            )}
            <TaskCard
              entry={t}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDragStart={onDragStartEntry}
              isDragging={draggingId === t.id}
              isSelected={selectedIds?.has(t.id)}
              onToggleSelect={onToggleSelect}
              bulkMode={bulkMode}
              onOpenDetail={() => setDetailEntry(t)}
            />
          </div>
        );
      })}

      {/* End-of-list insertion indicator */}
      {dropInsertIdx !== null && dropInsertIdx >= allItems.length && (
        <div className="h-0.5 bg-primary rounded-full mx-2 my-1 transition-all" />
      )}

      {/* Empty state */}
      {tasks.length === 0 && events.length === 0 && (
        <p className="text-sm font-handwriting text-pencil/40 italic text-center py-3">
          Drop tasks here or add one below
        </p>
      )}

      {/* Add task inline */}
      <AddTaskInline date={date} sectionId={section.id} onAdd={onAdd} />

      {/* Task detail modal */}
      {detailEntry && (
        <TaskDetailModal
          entry={detailEntry}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onClose={() => setDetailEntry(null)}
        />
      )}
    </div>
  );
}
