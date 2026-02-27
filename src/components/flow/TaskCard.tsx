import { useState, useRef, useEffect } from 'react';
import type { RapidLogEntry } from '../../context/AppContext';
import { celebrateTask } from '../../components/TaskCelebration';
import { formatTime12 } from './types';

export default function TaskCard({
  entry,
  onUpdate,
  onDelete,
  onDragStart,
  isDragging,
  isSelected,
  onToggleSelect,
  bulkMode,
  onOpenDetail,
}: {
  entry: RapidLogEntry;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, entryId: string) => void;
  isDragging: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  bulkMode?: boolean;
  onOpenDetail?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitle(entry.title); }, [entry.title]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commitEdit = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== entry.title) onUpdate(entry.id, { title: trimmed });
    else setTitle(entry.title);
    setEditing(false);
  };

  const toggleDone = (el?: HTMLElement) => {
    const wasUndone = entry.status !== 'done';
    onUpdate(entry.id, { status: entry.status === 'done' ? 'todo' : 'done' });
    if (wasUndone && el) celebrateTask(el);
  };

  const isDone = entry.status === 'done';
  const isHabitTask = !!entry.sourceHabit;
  const borderClass = isHabitTask
    ? 'border-l-sage'
    : 'border-l-wood-light';
  const hasDetails = !!(entry.description || (entry.links && entry.links.length > 0));

  return (
    <div
      draggable={!editing}
      onDragStart={e => { if (!editing) onDragStart(e, entry.id); }}
      className={`group ${isHabitTask ? 'bg-sage/5' : 'bg-surface-light'} p-3 rounded shadow-soft border-l-4 ${borderClass} transition-all ${
        !editing ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDone ? 'opacity-50' : ''} ${isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5 hover:shadow-lifted'} ${
        isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Bulk select checkbox */}
        {bulkMode && (
          <button
            onClick={e => { e.stopPropagation(); onToggleSelect?.(entry.id); }}
            className="shrink-0 mt-0.5"
          >
            <span className={`material-symbols-outlined text-[18px] transition-colors ${
              isSelected ? 'text-primary' : 'text-pencil/40 hover:text-primary/70'
            }`}>
              {isSelected ? 'check_box' : 'check_box_outline_blank'}
            </span>
          </button>
        )}

        {/* Checkbox */}
        {!bulkMode && (
          <button onClick={(e) => toggleDone(e.currentTarget as HTMLElement)} className="shrink-0 mt-0.5">
            <span className={`material-symbols-outlined text-[18px] transition-colors ${
              isDone ? 'text-sage' : 'text-primary hover:text-primary/70'
            }`}>
              {isDone ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </button>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') { setTitle(entry.title); setEditing(false); }
              }}
              className="w-full bg-transparent border-b border-primary/40 text-sm font-body text-ink outline-none"
            />
          ) : (
            <p
              className={`text-sm font-body text-ink leading-snug cursor-pointer hover:text-primary/80 transition-colors ${
                isDone ? 'line-through decoration-sage/50' : ''
              }`}
              onClick={() => onOpenDetail?.()}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
            >
              {entry.title}
              {hasDetails && (
                <span className="inline-block ml-1 text-pencil/40 align-middle">
                  <span className="material-symbols-outlined text-[12px]">description</span>
                </span>
              )}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {isHabitTask && (
              <span className="text-[12px] font-mono text-sage bg-sage/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">routine</span>
                habit
              </span>
            )}
            {entry.timeBlock && (
              <button
                onClick={e => { e.stopPropagation(); onUpdate(entry.id, { timeBlock: undefined }); }}
                className="text-[12px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded hover:bg-primary/15 hover:line-through transition-all flex items-center gap-0.5 group/time"
                title="Click to unpin from time"
              >
                {formatTime12(entry.timeBlock)}
                <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/time:opacity-100 transition-opacity">close</span>
              </button>
            )}
            {entry.duration && (
              <span className="text-[12px] font-mono text-pencil">{entry.duration}</span>
            )}
            {entry.tags?.map(tag => (
              <span key={tag} className="text-[12px] font-mono text-pencil bg-background-light px-1.5 rounded">{tag}</span>
            ))}
            {(entry.links ?? []).length > 0 && (
              <span className="text-[12px] font-mono text-primary/60" title={`${entry.links!.length} link(s)`}>
                <span className="material-symbols-outlined text-[12px] align-middle">link</span>
                {entry.links!.length}
              </span>
            )}
            {(entry.movedCount ?? 0) > 0 && (
              <span className="text-[12px] font-mono text-rose" title={`Moved ${entry.movedCount} time(s)`}>
                ↻{entry.movedCount}
              </span>
            )}
          </div>
        </div>

        {/* Actions on hover */}
        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Send to parking lot */}
          <button
            onClick={e => { e.stopPropagation(); onUpdate(entry.id, { section: undefined, timeBlock: undefined, time: undefined }); }}
            className="text-pencil/50 hover:text-primary transition-colors"
            title="Send to parking lot"
          >
            <span className="material-symbols-outlined text-[15px]">inventory_2</span>
          </button>
          {/* Delete */}
          <button
            onClick={() => onDelete(entry.id)}
            className="text-pencil/50 hover:text-rose transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
