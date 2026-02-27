import { useState, useRef, useEffect } from 'react';
import type { RapidLogEntry } from '../../context/AppContext';
import { formatTime12, renderTextWithLinks } from './types';

export default function TaskDetailModal({
  entry,
  onUpdate,
  onDelete,
  onClose,
}: {
  entry: RapidLogEntry;
  onUpdate: (id: string, updates: Partial<RapidLogEntry>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [desc, setDesc] = useState(entry.description ?? '');
  const [linkInput, setLinkInput] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        commitAndClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') commitAndClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc]);

  const commitAndClose = () => {
    const updates: Partial<RapidLogEntry> = {};
    const trimTitle = title.trim();
    if (trimTitle && trimTitle !== entry.title) updates.title = trimTitle;
    const trimDesc = desc.trim();
    if (trimDesc !== (entry.description ?? '')) updates.description = trimDesc || undefined;
    if (Object.keys(updates).length > 0) onUpdate(entry.id, updates);
    onClose();
  };

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    const url = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    const existing = entry.links ?? [];
    if (!existing.includes(url)) {
      onUpdate(entry.id, { links: [...existing, url] });
    }
    setLinkInput('');
  };

  const removeLink = (url: string) => {
    onUpdate(entry.id, { links: (entry.links ?? []).filter(l => l !== url) });
  };

  const isDone = entry.status === 'done';
  const isEvent = entry.type === 'event';
  const borderClass = isEvent ? 'border-l-sage' : 'border-l-wood-light';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/30 backdrop-blur-[2px]">
      <div
        ref={modalRef}
        className={`bg-paper rounded-xl shadow-lifted border-l-4 ${borderClass} w-[90vw] max-w-md max-h-[80vh] overflow-y-auto no-scrollbar`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-3">
          {isEvent ? (
            <span className="material-symbols-outlined text-[22px] text-sage shrink-0 mt-1">event</span>
          ) : (
            <button
              onClick={() => {
                onUpdate(entry.id, { status: isDone ? 'todo' : 'done' });
              }}
              className="shrink-0 mt-1"
            >
              <span className={`material-symbols-outlined text-[22px] transition-colors ${
                isDone ? 'text-sage' : 'text-primary hover:text-primary/70'
              }`}>
                {isDone ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </button>
          )}

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={`flex-1 bg-transparent font-body text-base text-ink outline-none border-b border-transparent focus:border-primary/30 transition-colors ${
              isDone ? 'line-through decoration-sage/50 text-ink/60' : ''
            }`}
            placeholder={isEvent ? "Event title" : "Task title"}
          />

          <button onClick={commitAndClose} className="text-pencil hover:text-ink transition-colors shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* Description */}
          <div>
            <label className="text-[12px] font-mono text-pencil uppercase tracking-widest mb-1.5 block">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="Add details, notes, context…"
              className="w-full bg-surface-light/50 border border-wood-light/20 rounded-lg text-sm font-body text-ink p-3 outline-none focus:border-primary/30 resize-none transition-colors placeholder:text-pencil/30"
            />
            {/* Render clickable links in description preview */}
            {desc && (
              <div className="mt-1 text-sm font-body text-ink-light leading-relaxed">
                {renderTextWithLinks(desc)}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <label className="text-[12px] font-mono text-pencil uppercase tracking-widest mb-1.5 block">Links</label>
            {(entry.links ?? []).length > 0 && (
              <div className="space-y-1.5 mb-2">
                {entry.links!.map(url => {
                  const shortUrl = url.replace(/^https?:\/\//, '');
                  return (
                    <div key={url} className="flex items-center gap-2 group/link bg-surface-light/50 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-[14px] text-primary/50 shrink-0">link</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 truncate flex-1"
                      >
                        {shortUrl.length > 50 ? shortUrl.slice(0, 50) + '…' : shortUrl}
                      </a>
                      <button
                        onClick={() => removeLink(url)}
                        className="text-pencil/30 hover:text-rose opacity-0 group-hover/link:opacity-100 transition-all shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-pencil/40 shrink-0">add_link</span>
              <input
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
                placeholder="Paste a URL…"
                className="flex-1 bg-transparent text-sm font-mono text-ink border-b border-dashed border-wood-light/30 outline-none py-1.5 placeholder:text-pencil/30 focus:border-primary/40 transition-colors"
              />
              <button
                onClick={addLink}
                disabled={!linkInput.trim()}
                className="text-primary hover:text-primary/80 disabled:opacity-30 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 flex-wrap text-[12px] font-mono text-pencil/60 pt-2 border-t border-wood-light/15">
            {entry.timeBlock && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {formatTime12(entry.timeBlock)}
              </span>
            )}
            {entry.duration && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">timer</span>
                {entry.duration}
              </span>
            )}
            {entry.tags?.map(tag => (
              <span key={tag} className="bg-background-light px-1.5 py-0.5 rounded">{tag}</span>
            ))}
            {(entry.movedCount ?? 0) > 0 && (
              <span className="text-rose">moved {entry.movedCount}×</span>
            )}
          </div>

          {/* Delete button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => { onDelete(entry.id); onClose(); }}
              className="text-sm font-body text-pencil/40 hover:text-rose transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              Delete {entry.type === 'event' ? 'event' : 'task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
