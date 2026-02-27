import { useState, useRef, useEffect } from 'react';
import type { RapidLogEntry } from '../../context/AppContext';

export default function ParkingLotItem({
  entry,
  onSchedule,
  onUpdate,
  onDelete,
  onDragStart,
  isDragging,
}: {
  entry: RapidLogEntry;
  onSchedule: (id: string) => void;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, entryId: string) => void;
  isDragging: boolean;
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

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, entry.id)}
      className={`group bg-surface-light p-3 rounded shadow-soft border border-transparent hover:border-bronze/30 hover:shadow-lifted transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 scale-95' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onSchedule(entry.id)}
          className="text-bronze hover:text-primary transition-colors mt-0.5 shrink-0"
          title="Schedule to today"
        >
          <span className="material-symbols-outlined text-[16px]">schedule</span>
        </button>

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
              className="text-sm font-body text-ink leading-snug cursor-text hover:text-primary/80 transition-colors"
              onClick={() => setEditing(true)}
            >
              {entry.title}
            </p>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5">
              {entry.tags.map(tag => (
                <span key={tag} className="text-[12px] font-mono text-pencil bg-background-light px-1.5 rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(entry.id)}
          className="text-pencil hover:text-rose transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Delete"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>
  );
}
