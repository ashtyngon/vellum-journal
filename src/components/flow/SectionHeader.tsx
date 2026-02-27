import { useState, useRef, useEffect } from 'react';
import type { DaySection } from './types';
import { formatHour12 } from './types';

export default function SectionHeader({
  section,
  customName,
  onRename,
  isCollapsed,
  onToggleCollapse,
  onZoom,
  onUnpinTimes,
  taskCount,
  eventCount,
  hasTimedTasks,
}: {
  section: DaySection;
  customName: string;
  onRename: (name: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onZoom: () => void;
  onUnpinTimes: () => void;
  taskCount: number;
  eventCount: number;
  hasTimedTasks: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(customName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameValue(customName); }, [customName]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== customName) onRename(trimmed);
    else setNameValue(customName);
    setEditing(false);
  };

  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-t ${section.color} border-b ${section.accentColor} cursor-pointer select-none overflow-hidden`}
      onClick={e => {
        if (editing) return;
        if ((e.target as HTMLElement).closest('[data-no-collapse]')) return;
        onToggleCollapse();
      }}
    >
      {/* Collapse chevron */}
      <span className={`material-symbols-outlined text-[18px] text-pencil transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
        expand_more
      </span>

      {/* Editable name */}
      {editing ? (
        <input
          ref={inputRef}
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setNameValue(customName); setEditing(false); }
          }}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-primary/40 font-display italic text-base text-ink outline-none"
        />
      ) : (
        <h4
          className="flex-1 min-w-0 font-display italic text-base text-ink hover:text-primary/80 transition-colors truncate"
          onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
          title="Double-click to rename"
        >
          {customName}
        </h4>
      )}

      {/* Time range */}
      <span className="font-mono text-[12px] text-pencil tracking-wider shrink-0">
        {formatHour12(section.startHour)} - {formatHour12(section.endHour)}
      </span>

      {/* Counts badge */}
      {(taskCount > 0 || eventCount > 0) && (
        <span className="font-mono text-[12px] text-pencil bg-surface-light px-1.5 py-0.5 rounded shrink-0">
          {taskCount > 0 && `${taskCount}t`}
          {taskCount > 0 && eventCount > 0 && ' '}
          {eventCount > 0 && `${eventCount}e`}
        </span>
      )}

      {/* Unpin times button — only when tasks have specific time slots */}
      {hasTimedTasks && (
        <button
          data-no-collapse
          onClick={e => { e.stopPropagation(); onUnpinTimes(); }}
          className="text-pencil/40 hover:text-primary transition-colors shrink-0"
          title="Unpin all tasks from time slots"
        >
          <span className="material-symbols-outlined text-[16px]">timer_off</span>
        </button>
      )}

      {/* Zoom button */}
      <button
        data-no-collapse
        onClick={e => { e.stopPropagation(); onZoom(); }}
        className="text-pencil hover:text-primary transition-colors shrink-0"
        title="Zoom into hourly view"
      >
        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
      </button>
    </div>
  );
}
