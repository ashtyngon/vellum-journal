import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr, daysAgo } from '../lib/dateUtils';

/* ── Types ─────────────────────────────────────────────────────────── */

interface WinItem {
  id: string;
  originalId: string;
  date: string;
  title: string;
  content: string;
  method?: string;
  mood?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function formatMonthYear(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function groupByMonth(items: WinItem[]): { month: string; items: WinItem[] }[] {
  const map = new Map<string, WinItem[]>();
  for (const item of items) {
    const key = item.date.slice(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, items]) => ({ month, items }));
}

/* ── Warm glow animation on new win ────────────────────────────────── */

function GlowBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className="w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary/20 via-accent/10 to-transparent animate-[glow-burst_1.2s_ease-out_forwards] opacity-0" />
    </div>
  );
}

/* ── Growth indicator (replaces confetti) ──────────────────────────── */

const GROWTH_STAGES = [
  { min: 0, icon: 'eco', label: 'Seed', color: 'text-sage' },
  { min: 3, icon: 'grass', label: 'Sprout', color: 'text-sage' },
  { min: 7, icon: 'potted_plant', label: 'Growing', color: 'text-primary' },
  { min: 15, icon: 'nature', label: 'Flourishing', color: 'text-primary' },
  { min: 30, icon: 'park', label: 'Thriving', color: 'text-accent' },
  { min: 50, icon: 'forest', label: 'Garden', color: 'text-accent' },
];

function getGrowthStage(count: number) {
  let stage = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) {
    if (count >= s.min) stage = s;
  }
  return stage;
}

/* ── Main Component ────────────────────────────────────────────────── */

export default function CelebrationScrapbook() {
  const { journalEntries, deleteJournalEntry, addJournalEntry } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newWinTitle, setNewWinTitle] = useState('');
  const [newWinContent, setNewWinContent] = useState('');
  const [showGlow, setShowGlow] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const addInputRef = useRef<HTMLTextAreaElement>(null);

  // Only manual wins and journal entries that have wins
  const wins = useMemo(() => {
    const items: WinItem[] = [];

    for (const j of journalEntries) {
      // Entries with wins field
      if (j.wins && j.wins.length > 0) {
        items.push({
          id: j.id,
          originalId: j.id,
          date: j.date,
          title: j.title || 'A Quiet Win',
          content: j.wins.join(' · '),
          method: j.method,
          mood: j.mood,
        });
      }
    }

    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [journalEntries]);

  const grouped = useMemo(() => groupByMonth(wins), [wins]);
  const totalWins = wins.length;
  const growth = getGrowthStage(totalWins);

  // Streak calculation
  const currentStreak = useMemo(() => {
    if (wins.length === 0) return 0;
    const uniqueDates = [...new Set(wins.map(w => w.date))].sort().reverse();
    const today = todayStr();
    const yesterday = daysAgo(1);

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i] + 'T00:00:00');
      const prev = new Date(uniqueDates[i + 1] + 'T00:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  }, [wins]);

  // Focus input when form opens
  useEffect(() => {
    if (showAddForm) {
      setTimeout(() => addInputRef.current?.focus(), 100);
    }
  }, [showAddForm]);

  function handleAddWin() {
    if (!newWinContent.trim()) return;
    addJournalEntry({
      id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: todayStr(),
      title: newWinTitle.trim() || 'A Win',
      content: newWinContent.trim(),
      wins: [newWinContent.trim()],
    });
    setNewWinTitle('');
    setNewWinContent('');
    setShowAddForm(false);

    // Warm glow animation instead of confetti
    setShowGlow(true);
    setTimeout(() => setShowGlow(false), 1500);
  }

  function handleDelete(id: string) {
    deleteJournalEntry(id);
    setDeleteConfirm(null);
    setExpandedId(null);
  }

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 bg-background-light min-h-screen">
      <GlowBurst active={showGlow} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-4xl md:text-5xl tracking-tight font-header italic text-ink mb-2">
          Wins
        </h2>
        <p className="text-ink-light text-lg font-handwriting">
          A quiet place to notice what went right.
        </p>
      </div>

      {/* ── Growth + Stats bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-6 mb-8 p-5 bg-paper rounded-xl border border-wood-light/30 shadow-paper">
        {/* Growth plant */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-surface-light flex items-center justify-center ${growth.color}`}>
            <span className="material-symbols-outlined text-2xl">{growth.icon}</span>
          </div>
          <div>
            <p className="text-sm font-body font-medium text-ink">{growth.label}</p>
            <p className="text-xs font-body text-ink-light">
              {totalWins} win{totalWins !== 1 ? 's' : ''} collected
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-wood-light/40 hidden sm:block" />

        {/* Streak */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-xl">local_fire_department</span>
            <div>
              <p className="text-sm font-body font-medium text-ink">{currentStreak} day streak</p>
              <p className="text-xs font-body text-ink-light">Keep noticing the good</p>
            </div>
          </div>
        )}

        {/* Next milestone */}
        <div className="ml-auto hidden sm:block">
          {(() => {
            const nextStage = GROWTH_STAGES.find(s => s.min > totalWins);
            if (!nextStage) return (
              <p className="text-xs font-handwriting text-ink-light italic">Your garden is in full bloom ✦</p>
            );
            return (
              <div className="text-right">
                <p className="text-xs font-body text-ink-light">
                  {nextStage.min - totalWins} more to reach
                </p>
                <p className="text-sm font-body font-medium text-ink flex items-center gap-1 justify-end">
                  <span className={`material-symbols-outlined text-base ${nextStage.color}`}>{nextStage.icon}</span>
                  {nextStage.label}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Add Win ─────────────────────────────────────────────────── */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-8 flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed border-wood-light/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-surface-light group-hover:bg-primary/15 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-xl text-ink-light group-hover:text-primary transition-colors">add</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-body font-medium text-ink">Record a win</p>
            <p className="text-xs font-body text-ink-light">Something you did, noticed, or felt grateful for</p>
          </div>
        </button>
      ) : (
        <div className="mb-8 p-5 bg-paper rounded-xl border border-wood-light/30 shadow-paper space-y-3">
          <input
            type="text"
            placeholder="Give it a name (optional)"
            value={newWinTitle}
            onChange={e => setNewWinTitle(e.target.value)}
            className="w-full px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-body text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-ink-light"
          />
          <textarea
            ref={addInputRef}
            placeholder="What went well today? What are you proud of?"
            value={newWinContent}
            onChange={e => setNewWinContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-handwriting text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none placeholder-ink-light"
            onKeyDown={e => {
              if (e.key === 'Enter' && e.metaKey) handleAddWin();
              if (e.key === 'Escape') { setShowAddForm(false); setNewWinTitle(''); setNewWinContent(''); }
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs font-body text-ink-light">⌘Enter to save · Esc to cancel</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddForm(false); setNewWinTitle(''); setNewWinContent(''); }}
                className="px-4 py-2 rounded-lg font-body text-sm text-ink-light hover:text-ink hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWin}
                disabled={!newWinContent.trim()}
                className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-body text-sm font-medium transition-colors"
              >
                Save Win
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline ────────────────────────────────────────────────── */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-ink-light">eco</span>
          </div>
          <h3 className="text-xl font-header italic text-ink mb-2">Plant your first seed</h3>
          <p className="text-sm font-body text-ink-light max-w-sm">
            Add your first win above. It doesn&apos;t have to be big — noticing something small is a win too.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(group => (
            <div key={group.month}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-display italic text-ink">
                  {formatMonthYear(group.items[0].date)}
                </h3>
                <div className="flex-1 h-px bg-wood-light/30" />
                <span className="text-xs font-mono text-ink-light bg-surface-light px-2 py-0.5 rounded-full">
                  {group.items.length}
                </span>
              </div>

              {/* Win cards */}
              <div className="space-y-3">
                {group.items.map(item => {
                  const isExpanded = expandedId === item.id;
                  const isDeleting = deleteConfirm === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`group relative bg-paper rounded-xl border transition-all cursor-pointer ${
                        isExpanded
                          ? 'border-primary/30 shadow-soft'
                          : 'border-wood-light/20 hover:border-wood-light/40 shadow-paper hover:shadow-soft'
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <div className="flex items-start gap-4 p-4">
                        {/* Date badge */}
                        <div className="shrink-0 w-12 text-center pt-0.5">
                          <p className="text-lg font-display font-bold text-ink leading-none">
                            {new Date(item.date + 'T00:00:00').getDate()}
                          </p>
                          <p className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
                            {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium text-ink leading-snug">
                            {item.title}
                          </p>
                          <p className={`font-handwriting text-sm text-ink-light mt-1 leading-relaxed ${
                            isExpanded ? '' : 'line-clamp-2'
                          }`}>
                            {item.content}
                          </p>

                          {/* Method badge */}
                          {item.method && (
                            <span className="inline-block mt-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {item.method.replace(/-/g, ' ')}
                            </span>
                          )}
                        </div>

                        {/* Mood indicator */}
                        {item.mood && (
                          <span className="material-symbols-outlined text-lg text-primary/60 shrink-0">
                            {item.mood}
                          </span>
                        )}
                      </div>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div className="px-4 pb-3 flex items-center justify-end gap-2 border-t border-wood-light/20 pt-3">
                          {isDeleting ? (
                            <>
                              <span className="text-xs font-body text-ink-light mr-2">Remove this win?</span>
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                                className="px-3 py-1.5 rounded-lg bg-tension/10 text-tension text-xs font-body font-medium hover:bg-tension/20 transition-colors"
                              >
                                Yes, remove
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setDeleteConfirm(null); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-body text-ink-light hover:bg-surface-light transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteConfirm(item.id); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-body text-ink-light hover:text-tension hover:bg-tension/5 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
