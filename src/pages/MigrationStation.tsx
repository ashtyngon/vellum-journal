import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatLocalDate } from '../lib/dateUtils';

type DropTarget = 'today' | 'tomorrow' | 'nextWeek' | 'shredder';

interface MigrationStationProps {
  open: boolean;
  onClose: () => void;
}

export default function MigrationStation({ open, onClose }: MigrationStationProps) {
  const { entries, updateEntry } = useApp();

  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<DropTarget | null>(null);
  const [shreddedIds, setShreddedIds] = useState<Set<string>>(new Set());

  const todayStr = formatLocalDate(new Date());

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDate(tomorrow);

  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = formatLocalDate(nextWeekDate);

  const leftBehind = useMemo(() => {
    return entries.filter(
      (e) => e.type === 'task' && e.status === 'todo' && e.date < todayStr && !shreddedIds.has(e.id)
    );
  }, [entries, todayStr, shreddedIds]);

  const movingForward = useMemo(() => {
    return {
      today: entries.filter(
        (e) =>
          e.type === 'task' &&
          e.date === todayStr &&
          e.status !== 'done' &&
          e.status !== 'deferred'
      ),
      tomorrow: entries.filter(
        (e) =>
          e.type === 'task' &&
          e.date === tomorrowStr &&
          e.status !== 'done' &&
          e.status !== 'deferred'
      ),
      nextWeek: entries.filter(
        (e) =>
          e.type === 'task' &&
          e.date > tomorrowStr &&
          e.date <= nextWeekStr &&
          e.status !== 'done' &&
          e.status !== 'deferred'
      ),
    };
  }, [entries, todayStr, tomorrowStr, nextWeekStr]);

  const handleMove = (entryId: string, target: DropTarget) => {
    if (target === 'shredder') {
      updateEntry(entryId, { status: 'deferred' });
      setShreddedIds((prev) => new Set(prev).add(entryId));
      return;
    }

    let newDate = todayStr;
    if (target === 'tomorrow') newDate = tomorrowStr;
    if (target === 'nextWeek') newDate = nextWeekStr;

    const entry = entries.find((e) => e.id === entryId);
    updateEntry(entryId, {
      date: newDate,
      movedCount: (entry?.movedCount || 0) + 1,
      status: 'todo',
    });
  };

  // --- Drag handlers ---

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, entryId: string) => {
    setDraggedEntryId(entryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entryId);
    requestAnimationFrame(() => {
      const el = document.getElementById(`task-card-${entryId}`);
      if (el) el.style.opacity = '0.4';
    });
  };

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>, entryId: string) => {
    e.preventDefault();
    setDraggedEntryId(null);
    setActiveDropZone(null);
    const el = document.getElementById(`task-card-${entryId}`);
    if (el) el.style.opacity = '1';
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, zone: DropTarget) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setActiveDropZone(zone);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>, zone: DropTarget) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && (e.currentTarget as Node).contains(relatedTarget)) return;
    if (activeDropZone === zone) {
      setActiveDropZone(null);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, zone: DropTarget) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('text/plain');
    if (entryId) {
      handleMove(entryId, zone);
    }
    setDraggedEntryId(null);
    setActiveDropZone(null);
  };

  // --- Helpers ---

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const movedDots = (count: number | undefined) => {
    if (!count) return null;
    const dots = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      dots.push(
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-tension/60"
        />
      );
    }
    if (count > 5) {
      dots.push(
        <span key="plus" className="text-[10px] text-tension/60 ml-0.5">
          +{count - 5}
        </span>
      );
    }
    return (
      <div className="flex items-center gap-0.5" title={`Moved ${count} time${count > 1 ? 's' : ''}`}>
        {dots}
      </div>
    );
  };

  const dropZoneHighlight = (zone: DropTarget, base: string, active: string) => {
    return activeDropZone === zone ? active : base;
  };

  // --- Render ---

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[480px] max-w-[90vw] z-50 flex flex-col bg-paper shadow-2xl transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Texture overlay */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-noise opacity-50 mix-blend-multiply" />

        {/* ==================== HEADER ==================== */}
        <div className="relative z-10 flex w-full items-start justify-between border-b border-wood-light px-6 py-5 bg-surface-light/50">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-primary/80">
              <span className="material-symbols-outlined text-xl">history_edu</span>
              <span className="text-sm font-bold uppercase tracking-widest font-sans">
                Morning Migration
              </span>
            </div>
            <h2 className="font-display text-2xl italic text-ink">Review Yesterday</h2>
            <p className="text-sm text-pencil font-body leading-snug">
              Drag tasks to move them forward. Choose only what matters.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="ml-3 mt-0.5 flex-shrink-0 rounded-full p-1.5 text-pencil hover:text-ink hover:bg-surface-light transition-colors"
            aria-label="Close migration panel"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ==================== SCROLLABLE CONTENT ==================== */}
        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
          {/* ========== LEFT BEHIND SECTION ========== */}
          <div className="border-b border-wood-light/50">
            <div className="sticky top-0 z-20 flex items-center justify-between bg-paper/95 px-6 py-3 backdrop-blur-sm border-b border-wood-light/30">
              <h3 className="font-display text-lg italic text-ink/80">Left Behind</h3>
              <span className="rounded-full bg-wood-light px-2.5 py-0.5 text-xs font-semibold text-ink/60 font-mono">
                {leftBehind.length} task{leftBehind.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3 p-6">
              {leftBehind.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-pencil gap-2">
                  <span className="material-symbols-outlined text-4xl text-sage/60">
                    task_alt
                  </span>
                  <span className="text-base italic font-handwriting text-sage">
                    All caught up!
                  </span>
                  <span className="text-xs font-body text-pencil/60">
                    Nothing left behind. Well done.
                  </span>
                </div>
              ) : (
                leftBehind.map((entry) => (
                  <div
                    key={entry.id}
                    id={`task-card-${entry.id}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, entry.id)}
                    onDragEnd={(e) => onDragEnd(e, entry.id)}
                    className={`group relative cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      draggedEntryId === entry.id ? 'scale-[0.97]' : ''
                    }`}
                  >
                    <div className="relative flex flex-col gap-2 rounded border border-wood-light bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
                      {/* Drag handle indicator */}
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-[3px] opacity-0 group-hover:opacity-40 transition-opacity">
                        <span className="block h-[2px] w-3 rounded bg-pencil" />
                        <span className="block h-[2px] w-3 rounded bg-pencil" />
                        <span className="block h-[2px] w-3 rounded bg-pencil" />
                      </div>

                      <div className="flex items-start justify-between pl-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full border border-wood-light" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-snug text-ink font-body truncate">
                              {entry.title}
                            </p>
                            <div className="mt-1 flex items-center gap-3">
                              <div className="flex items-center gap-1 text-xs text-pencil">
                                <span className="material-symbols-outlined text-[13px]">
                                  calendar_today
                                </span>
                                <span className="font-mono text-[11px]">
                                  {formatDate(entry.date)}
                                </span>
                              </div>
                              {entry.tags && entry.tags.length > 0 && (
                                <span className="rounded bg-wood-light/60 px-1.5 py-0.5 text-[10px] font-mono text-ink/60">
                                  {entry.tags[0]}
                                </span>
                              )}
                              {movedDots(entry.movedCount)}
                            </div>
                          </div>
                        </div>

                        {/* Quick-action buttons */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(entry.id, 'today');
                            }}
                            className="text-[11px] bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                          >
                            Today
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(entry.id, 'tomorrow');
                            }}
                            className="text-[11px] bg-wood-light text-ink/60 px-2 py-1 rounded hover:bg-ink hover:text-white transition-colors whitespace-nowrap"
                          >
                            Tmrw
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========== MOVING FORWARD SECTION ========== */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg italic text-ink/80">Moving Forward</h3>
              <span className="text-xs text-pencil font-body italic">
                Drop tasks to reschedule
              </span>
            </div>

            <div className="space-y-5">
              {/* ---- TODAY BUCKET ---- */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans text-sm font-bold uppercase tracking-wider text-primary">
                    Today (Focus)
                  </h4>
                  <span className="text-[11px] opacity-60 font-mono text-pencil">
                    {todayStr}
                  </span>
                </div>
                <div
                  onDragOver={(e) => onDragOver(e, 'today')}
                  onDragLeave={(e) => onDragLeave(e, 'today')}
                  onDrop={(e) => onDrop(e, 'today')}
                  className={`min-h-[100px] w-full rounded-lg border-2 p-3 transition-all duration-300 ${dropZoneHighlight(
                    'today',
                    'border-primary/20 bg-primary/5 hover:border-primary/30',
                    'border-primary bg-primary/15 shadow-inner scale-[1.01]'
                  )}`}
                >
                  {movingForward.today.length === 0 && activeDropZone !== 'today' && (
                    <div className="flex items-center justify-center rounded border border-dashed border-primary/30 py-6 text-primary/40">
                      <span className="text-sm italic font-handwriting">
                        Drop to focus today
                      </span>
                    </div>
                  )}
                  {activeDropZone === 'today' && movingForward.today.length === 0 && (
                    <div className="flex items-center justify-center rounded border border-dashed border-primary/50 py-6 text-primary/70 bg-primary/5">
                      <span className="text-sm font-handwriting font-semibold">
                        Release to add here
                      </span>
                    </div>
                  )}
                  {movingForward.today.map((t) => (
                    <div
                      key={t.id}
                      className="relative mb-2 last:mb-0 flex items-start gap-3 rounded border border-primary/20 bg-white p-3 shadow-sm"
                    >
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug text-ink font-body truncate">
                          {t.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          {t.timeBlock && (
                            <span className="text-[10px] font-mono text-primary/60">
                              {t.timeBlock}
                            </span>
                          )}
                          {movedDots(t.movedCount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ---- TOMORROW BUCKET ---- */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans text-sm font-bold uppercase tracking-wider text-ink/60">
                    Tomorrow
                  </h4>
                  <span className="text-[11px] opacity-60 font-mono text-pencil">
                    {tomorrowStr}
                  </span>
                </div>
                <div
                  onDragOver={(e) => onDragOver(e, 'tomorrow')}
                  onDragLeave={(e) => onDragLeave(e, 'tomorrow')}
                  onDrop={(e) => onDrop(e, 'tomorrow')}
                  className={`min-h-[80px] w-full rounded-lg border-2 border-dashed p-3 transition-all duration-300 ${dropZoneHighlight(
                    'tomorrow',
                    'border-wood-light bg-background-light hover:border-bronze/40',
                    'border-bronze bg-bronze/10 shadow-inner scale-[1.01]'
                  )}`}
                >
                  {movingForward.tomorrow.length === 0 && activeDropZone !== 'tomorrow' && (
                    <div className="flex h-full min-h-[56px] items-center justify-center text-pencil">
                      <span className="text-sm italic font-handwriting">
                        Save for tomorrow
                      </span>
                    </div>
                  )}
                  {activeDropZone === 'tomorrow' && movingForward.tomorrow.length === 0 && (
                    <div className="flex h-full min-h-[56px] items-center justify-center text-bronze">
                      <span className="text-sm font-handwriting font-semibold">
                        Release to add here
                      </span>
                    </div>
                  )}
                  {movingForward.tomorrow.map((t) => (
                    <div
                      key={t.id}
                      className="relative mb-2 last:mb-0 flex items-start gap-3 rounded border border-wood-light bg-white p-3 shadow-sm"
                    >
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full border border-bronze bg-bronze/40" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug text-ink font-body truncate">
                          {t.title}
                        </p>
                        {movedDots(t.movedCount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ---- NEXT WEEK BUCKET ---- */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans text-sm font-bold uppercase tracking-wider text-sage">
                    Later This Week
                  </h4>
                  <span className="text-[11px] opacity-60 font-mono text-pencil">
                    {nextWeekStr}
                  </span>
                </div>
                <div
                  onDragOver={(e) => onDragOver(e, 'nextWeek')}
                  onDragLeave={(e) => onDragLeave(e, 'nextWeek')}
                  onDrop={(e) => onDrop(e, 'nextWeek')}
                  className={`min-h-[70px] w-full rounded-lg border-2 border-dashed p-3 transition-all duration-300 ${dropZoneHighlight(
                    'nextWeek',
                    'border-sage/30 bg-sage/5 hover:border-sage/40',
                    'border-sage bg-sage/15 shadow-inner scale-[1.01]'
                  )}`}
                >
                  {movingForward.nextWeek.length === 0 && activeDropZone !== 'nextWeek' && (
                    <div className="flex h-full min-h-[46px] items-center justify-center text-sage/50">
                      <span className="text-sm italic font-handwriting">
                        Push to later this week
                      </span>
                    </div>
                  )}
                  {activeDropZone === 'nextWeek' && movingForward.nextWeek.length === 0 && (
                    <div className="flex h-full min-h-[46px] items-center justify-center text-sage">
                      <span className="text-sm font-handwriting font-semibold">
                        Release to add here
                      </span>
                    </div>
                  )}
                  {movingForward.nextWeek.map((t) => (
                    <div
                      key={t.id}
                      className="relative mb-2 last:mb-0 flex items-start gap-3 rounded border border-sage/30 bg-white p-3 shadow-sm"
                    >
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full border border-sage bg-sage/40" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug text-ink font-body truncate">
                          {t.title}
                        </p>
                        {movedDots(t.movedCount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== SHREDDER ZONE (pinned to bottom) ========== */}
        <div
          onDragOver={(e) => onDragOver(e, 'shredder')}
          onDragLeave={(e) => onDragLeave(e, 'shredder')}
          onDrop={(e) => onDrop(e, 'shredder')}
          className={`relative z-10 border-t border-wood-light p-4 transition-all duration-300 ${
            activeDropZone === 'shredder'
              ? 'bg-tension/10 border-t-tension/40'
              : 'bg-surface-light/80'
          }`}
        >
          <div
            className={`flex h-20 flex-col items-center justify-center rounded border-2 border-dashed transition-all duration-300 ${
              activeDropZone === 'shredder'
                ? 'border-tension bg-tension/10 text-tension scale-[1.02]'
                : 'border-wood-light bg-transparent text-pencil hover:border-tension/40 hover:text-tension/60'
            }`}
          >
            <span
              className={`material-symbols-outlined text-2xl mb-1 transition-transform ${
                activeDropZone === 'shredder' ? 'animate-bounce' : ''
              }`}
            >
              delete_sweep
            </span>
            <span className="text-sm font-medium font-body">
              {activeDropZone === 'shredder' ? 'Release to let go' : 'Let it go (Shred)'}
            </span>
          </div>
        </div>

        {/* Drag overlay hint */}
        {draggedEntryId && (
          <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-ink/80 px-4 py-2 text-xs text-white/90 font-body shadow-lg backdrop-blur-sm">
            Drop on a bucket or the shredder
          </div>
        )}
      </div>
    </>
  );
}
