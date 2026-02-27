import { useState, useRef, useEffect } from 'react';
import type { RapidLogEntry } from '../../context/AppContext';
import { parseNaturalEntry } from '../../lib/nlParser';
import { uid } from './types';

export default function AddTaskInline({
  date,
  sectionId,
  onAdd,
}: {
  date: string;
  sectionId?: string;
  onAdd: (entry: RapidLogEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const submit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      const parsed = parseNaturalEntry(trimmed);
      if (parsed.type === 'event') {
        onAdd({
          id: uid(),
          type: 'event',
          title: parsed.title,
          date: parsed.date || date,
          time: parsed.time,
          duration: parsed.duration,
        });
      } else {
        onAdd({
          id: uid(),
          type: 'task',
          title: parsed.title,
          status: 'todo',
          date: parsed.date || date,
          movedCount: 0,
          // Only pin to a time slot if the user explicitly typed a time.
          // Otherwise just assign to the section (no timeBlock).
          ...(parsed.time ? { timeBlock: parsed.time } : {}),
          ...(sectionId ? { section: sectionId } : {}),
        });
      }
      setTitle('');
    }
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 border border-dashed border-bronze/25 rounded text-bronze hover:text-primary hover:border-primary/30 hover:bg-surface-light/50 transition-all flex items-center justify-center gap-1 font-handwriting text-sm"
      >
        <span className="material-symbols-outlined text-[14px]">add</span>
        Add task
      </button>
    );
  }

  return (
    <div className="bg-surface-light rounded shadow-soft p-3 border border-primary/20">
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') { setTitle(''); setOpen(false); }
        }}
        placeholder="What needs doing?"
        className="w-full bg-transparent text-sm font-body text-ink outline-none placeholder:text-pencil/50"
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button onClick={() => { setTitle(''); setOpen(false); }} className="text-sm text-pencil hover:text-ink transition-colors">
          Cancel
        </button>
        <button onClick={submit} className="text-sm text-white bg-primary hover:bg-primary-dark px-3 py-1 rounded transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}
