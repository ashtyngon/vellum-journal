import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import type { JournalEntry, Collection, CollectionItem, RapidLogEntry } from '../context/AppContext';
import { todayStr } from '../lib/dateUtils';

/* ── Constants ─────────────────────────────────────────────────────── */

const monthColors: Record<string, string> = {
  'JAN': 'bg-[#2c3e50]', 'FEB': 'bg-[#8e44ad]', 'MAR': 'bg-primary',
  'APR': 'bg-[#27ae60]', 'MAY': 'bg-[#c0392b]', 'JUN': 'bg-[#7f8c8d]',
  'JUL': 'bg-[#d35400]', 'AUG': 'bg-[#16a085]', 'SEP': 'bg-[#f39c12]',
  'OCT': 'bg-[#e67e22]', 'NOV': 'bg-[#bdc3c7]', 'DEC': 'bg-[#2980b9]',
};

const MONTH_ORDER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type ArchiveTab = 'journals' | 'collections';

/* ── Helpers ───────────────────────────────────────────────────────── */

function monthIndex(m: string) {
  return MONTH_ORDER.indexOf(m);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/* ── Modal Shell ───────────────────────────────────────────────────── */

function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   JOURNALS TAB
   ══════════════════════════════════════════════════════════════════════ */

function JournalsTab({
  search,
  setSearch,
}: {
  search: string;
  setSearch: (v: string) => void;
}) {
  const {
    journalEntries,
    entries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
  } = useApp();

  const [expandedMonth, setExpandedMonth] = useState<{ year: string; month: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ date: todayStr(), title: '', content: '' });

  /* ── Events from rapid log for monthly views ──────────────────── */
  const rapidEvents = useMemo(() => entries.filter(e => e.type === 'event'), [entries]);

  /* ── Search across journal entries AND rapid log entries ───────── */
  const filteredJournal = useMemo(() => {
    if (!search.trim()) return journalEntries;
    const q = search.toLowerCase();
    return journalEntries.filter(entry => {
      const inContent = entry.content.toLowerCase().includes(q);
      const inTitle = entry.title?.toLowerCase().includes(q);
      const inTags = entry.tags?.some(t => t.toLowerCase().includes(q));
      return inContent || inTitle || inTags;
    });
  }, [journalEntries, search]);

  const filteredRapidEvents = useMemo(() => {
    if (!search.trim()) return rapidEvents;
    const q = search.toLowerCase();
    return rapidEvents.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.tags?.some(t => t.toLowerCase().includes(q)) ||
      e.notes?.toLowerCase().includes(q)
    );
  }, [rapidEvents, search]);

  /* ── Group journal entries by Year -> Month ───────────────────── */
  const groupedJournals = useMemo(() => {
    const groups: Record<string, Record<string, JournalEntry[]>> = {};
    filteredJournal.forEach(entry => {
      const date = new Date(entry.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];
      groups[year][month].push(entry);
    });
    return groups;
  }, [filteredJournal]);

  /* ── Group rapid events by Year -> Month ──────────────────────── */
  const groupedEvents = useMemo(() => {
    const groups: Record<string, Record<string, RapidLogEntry[]>> = {};
    filteredRapidEvents.forEach(entry => {
      const date = new Date(entry.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];
      groups[year][month].push(entry);
    });
    return groups;
  }, [filteredRapidEvents]);

  /* ── Merge all years for shelf display ────────────────────────── */
  const allYears = useMemo(() => {
    const yearSet = new Set([...Object.keys(groupedJournals), ...Object.keys(groupedEvents)]);
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [groupedJournals, groupedEvents]);

  const allMonthsForYear = useCallback((year: string) => {
    const jMonths = Object.keys(groupedJournals[year] || {});
    const eMonths = Object.keys(groupedEvents[year] || {});
    const monthSet = new Set([...jMonths, ...eMonths]);
    return Array.from(monthSet).sort((a, b) => monthIndex(a) - monthIndex(b));
  }, [groupedJournals, groupedEvents]);

  const entryCountForMonth = useCallback((year: string, month: string) => {
    const jCount = groupedJournals[year]?.[month]?.length ?? 0;
    const eCount = groupedEvents[year]?.[month]?.length ?? 0;
    return jCount + eCount;
  }, [groupedJournals, groupedEvents]);

  /* ── Expanded month data ──────────────────────────────────────── */
  const expandedJournalEntries = useMemo(() => {
    if (!expandedMonth) return [];
    return (groupedJournals[expandedMonth.year]?.[expandedMonth.month] || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expandedMonth, groupedJournals]);

  const expandedEvents = useMemo(() => {
    if (!expandedMonth) return [];
    return (groupedEvents[expandedMonth.year]?.[expandedMonth.month] || [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expandedMonth, groupedEvents]);

  /* ── Handlers ─────────────────────────────────────────────────── */
  function handleAddEntry() {
    if (!newEntry.content.trim()) return;
    const entry: JournalEntry = {
      id: `j-${uid()}`,
      date: newEntry.date,
      title: newEntry.title.trim() || undefined,
      content: newEntry.content.trim(),
    };
    addJournalEntry(entry);
    setNewEntry({ date: todayStr(), title: '', content: '' });
    setShowAddForm(false);
  }

  function handleSaveEdit() {
    if (!editingEntry) return;
    updateJournalEntry(editingEntry.id, {
      title: editingEntry.title?.trim() || undefined,
      content: editingEntry.content.trim(),
    });
    setEditingEntry(null);
  }

  function handleDeleteEntry(id: string) {
    deleteJournalEntry(id);
    setDeleteConfirm(null);
    if (expandedJournalEntries.length <= 1 && expandedEvents.length === 0) {
      setExpandedMonth(null);
    }
  }

  const totalFiltered = filteredJournal.length + filteredRapidEvents.length;
  const hasEntries = totalFiltered > 0;

  return (
    <>
      {/* Search + Add */}
      <div className="w-full flex flex-col sm:flex-row gap-3">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-ink-light">search</span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 bg-surface-light/50 border-none rounded-lg text-ink placeholder-ink-light focus:ring-2 focus:ring-primary transition-all shadow-inner font-body text-sm"
            placeholder="Search journals, events, tags..."
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-light hover:text-ink transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary text-white px-4 py-2.5 rounded-lg transition-colors font-body text-sm font-medium shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>New Entry</span>
        </button>
      </div>

      {/* Search indicator */}
      {search.trim() && (
        <div className="text-sm font-body text-ink-light px-2 -mt-4">
          {totalFiltered} {totalFiltered === 1 ? 'result' : 'results'} matching &ldquo;{search}&rdquo;
        </div>
      )}

      {/* Empty state */}
      {!hasEntries && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="material-symbols-outlined text-6xl text-wood-light">auto_stories</span>
          <p className="text-xl font-header italic text-ink-light">
            {search.trim() ? 'No entries match your search.' : 'Your archive is empty.'}
          </p>
          <p className="text-sm font-body text-ink-light/70">
            {search.trim() ? 'Try a different search term.' : 'Start journaling to fill your shelves with memories.'}
          </p>
          {!search.trim() && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 flex items-center gap-2 bg-primary/90 hover:bg-primary text-white px-5 py-2.5 rounded-lg transition-colors font-body text-sm font-medium shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              Write your first entry
            </button>
          )}
        </div>
      )}

      {/* Bookshelves by year */}
      <div className="flex flex-col gap-12 mt-4">
        {allYears.map(year => {
          const months = allMonthsForYear(year);
          const totalEntries = months.reduce((sum, m) => sum + entryCountForMonth(year, m), 0);

          return (
            <div key={year} className="flex flex-col">
              <div className="flex items-center gap-3 mb-1 px-2">
                <h3 className="text-2xl font-bold font-header italic text-ink">{year} Journal</h3>
                <span className="h-px flex-1 bg-wood-light"></span>
                <span className="text-sm font-handwriting text-ink-light bg-surface-light px-2 py-0.5 rounded">
                  {totalEntries} {totalEntries === 1 ? 'Entry' : 'Entries'}
                </span>
              </div>

              <div className="relative bg-wood-texture rounded-lg pt-8 px-4 sm:px-8 pb-3 shadow-shelf border-t-8 border-[#e0d6cc]">
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10"></div>

                <div className="flex flex-wrap items-end gap-x-2 gap-y-8 md:gap-x-6 relative z-10 min-h-[240px]">
                  {months.map(month => {
                    const count = entryCountForMonth(year, month);
                    const baseH = 192;
                    const extraH = Math.min(count * 8, 48);
                    const bookH = baseH + extraH;

                    return (
                      <button
                        key={month}
                        onClick={() => setExpandedMonth({ year, month })}
                        className="group relative flex flex-col items-center cursor-pointer transition-transform duration-200 hover:-translate-y-2 hover:z-10 w-12 md:w-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                        aria-label={`${month} ${year} - ${count} ${count === 1 ? 'entry' : 'entries'}`}
                      >
                        <div
                          className={`relative w-full rounded-sm ${monthColors[month] || 'bg-primary'} shadow-book flex flex-col items-center justify-between py-3 border-l border-white/10 overflow-hidden`}
                          style={{ height: `${bookH}px` }}
                        >
                          <div className="spine-ridge h-full w-2 absolute left-1 top-0 opacity-30"></div>

                          {month === 'JAN' && <div className="w-full h-8 border-y border-[#ffd700]/30 mt-2 shrink-0"></div>}
                          {month === 'FEB' && (
                            <div className="shrink-0 mt-2">
                              <span className="material-symbols-outlined text-white/50 text-xl">favorite</span>
                            </div>
                          )}
                          {month === 'APR' && (
                            <>
                              <div className="w-full h-px bg-[#f1c40f] absolute top-10"></div>
                              <div className="w-full h-px bg-[#f1c40f] absolute top-12"></div>
                              <div className="w-full h-px bg-[#f1c40f] absolute bottom-12"></div>
                              <div className="w-full h-px bg-[#f1c40f] absolute bottom-10"></div>
                            </>
                          )}
                          {month === 'DEC' && (
                            <div className="shrink-0 mt-2">
                              <span className="material-symbols-outlined text-white/40 text-lg">ac_unit</span>
                            </div>
                          )}

                          <span
                            className="text-white font-header text-lg md:text-xl font-bold tracking-widest mx-auto drop-shadow-md flex-1 flex items-center"
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                          >
                            {month}
                          </span>

                          <div
                            className="shrink-0 mx-auto size-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shadow-inner"
                            title={`${count} ${count === 1 ? 'Entry' : 'Entries'}`}
                          >
                            {count}
                          </div>
                        </div>

                        <div className="absolute -bottom-3 w-full h-2 bg-black/20 rounded-full blur-sm group-hover:blur-md group-hover:w-[90%] transition-all"></div>
                      </button>
                    );
                  })}

                  {months.length < 12 && Array.from({ length: Math.min(3, 12 - months.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-2 md:w-4 h-48 md:h-56 bg-black/5 rounded-sm transform skew-x-1 opacity-20"></div>
                  ))}
                </div>

                <div className="h-6 w-full bg-[#d0c0b0] mt-0 rounded-b-sm shadow-md flex items-center justify-center relative z-10">
                  <div className="w-[98%] h-2 bg-[#bda895] rounded-full opacity-30 mt-1"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Expanded Month Modal ────────────────────────────────────── */}
      {expandedMonth && (
        <ModalOverlay onClose={() => setExpandedMonth(null)}>
          <div className="bg-paper rounded-xl shadow-lifted w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className={`${monthColors[expandedMonth.month] || 'bg-primary'} px-6 py-4 flex items-center justify-between`}>
              <div>
                <h3 className="text-xl font-header italic text-white drop-shadow-sm">
                  {expandedMonth.month} {expandedMonth.year}
                </h3>
                <p className="text-white/70 text-sm font-body">
                  {expandedJournalEntries.length} journal {expandedJournalEntries.length === 1 ? 'entry' : 'entries'}
                  {expandedEvents.length > 0 && ` + ${expandedEvents.length} event${expandedEvents.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                onClick={() => setExpandedMonth(null)}
                className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Events section */}
              {expandedEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-body font-semibold text-ink-light uppercase tracking-wider">Events</h4>
                  {expandedEvents.map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 py-2 px-3 bg-surface-light/30 rounded-lg border border-wood-light/20">
                      <div className="size-2.5 rounded-full bg-primary shrink-0" />
                      <span className="font-body text-sm text-ink flex-1">{ev.title}</span>
                      {ev.time && (
                        <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                          {ev.time}
                        </span>
                      )}
                      <span className="text-xs font-mono text-ink-light shrink-0">{formatDate(ev.date)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Journal entries */}
              {expandedJournalEntries.length === 0 && expandedEvents.length === 0 ? (
                <p className="text-center text-ink-light font-body py-8">No entries for this month.</p>
              ) : (
                expandedJournalEntries.map(entry => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setEditingEntry({ ...entry })}
                    className="w-full text-left bg-surface-light/50 rounded-lg p-4 shadow-paper border border-wood-light/30 hover:shadow-soft hover:border-primary/20 transition-all group cursor-pointer"
                  >
                    {/* Entry header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-ink-light">{formatDate(entry.date)}</span>
                        {entry.mood && (
                          <span className="material-symbols-outlined text-primary text-lg" title={entry.mood}>
                            {entry.mood}
                          </span>
                        )}
                        {entry.method && (
                          <span className="text-xs font-mono bg-sage/20 text-sage px-1.5 py-0.5 rounded">
                            {entry.method}
                          </span>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-ink-light/0 group-hover:text-ink-light transition-colors text-lg">
                        edit
                      </span>
                    </div>

                    {entry.title && (
                      <h4 className="font-display text-base font-semibold text-ink mb-1">{entry.title}</h4>
                    )}

                    <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap line-clamp-3">{entry.content}</p>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {entry.tags.map(tag => (
                          <span key={tag} className="text-xs font-body bg-wood-light/40 text-ink-light px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.wins && entry.wins.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.wins.map(win => (
                          <span key={win} className="text-xs font-body bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">emoji_events</span>
                            {win}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Edit Entry Modal ────────────────────────────────────────── */}
      {editingEntry && (
        <ModalOverlay onClose={() => setEditingEntry(null)}>
          <div className="bg-paper rounded-xl shadow-lifted w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
            <div className="bg-accent px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-header italic text-white drop-shadow-sm">Edit Entry</h3>
              <div className="flex items-center gap-2">
                {deleteConfirm === editingEntry.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70 font-body">Delete?</span>
                    <button
                      onClick={() => { handleDeleteEntry(editingEntry.id); setEditingEntry(null); }}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded font-body transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded font-body transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(editingEntry.id)}
                    className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                    aria-label="Delete entry"
                  >
                    <span className="material-symbols-outlined text-lg">delete_outline</span>
                  </button>
                )}
                <button
                  onClick={() => { setEditingEntry(null); setDeleteConfirm(null); }}
                  className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-sm font-body font-medium text-ink mb-1">Title</label>
                <input
                  type="text"
                  value={editingEntry.title || ''}
                  onChange={e => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  placeholder="Optional title..."
                  className="w-full px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-body text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-ink-light"
                />
              </div>

              {/* Structured steps (read-only) for method-based entries */}
              {editingEntry.method && editingEntry.steps && editingEntry.steps.length > 0 && (
                <div>
                  <label className="block text-sm font-body font-medium text-ink mb-2">
                    Method: <span className="font-mono text-xs bg-sage/20 text-sage px-1.5 py-0.5 rounded">{editingEntry.method}</span>
                  </label>
                  <div className="space-y-2 bg-surface-light/30 rounded-lg p-3 border border-wood-light/20">
                    {editingEntry.steps.map((step, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <p className="text-xs font-body font-semibold text-ink-light">{step.prompt}</p>
                        <p className="text-sm font-body text-ink pl-2 border-l-2 border-primary/20">{step.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content / discovery text */}
              <div>
                <label className="block text-sm font-body font-medium text-ink mb-1">
                  {editingEntry.method ? 'Discovery / Reflection' : 'Content'}
                </label>
                <textarea
                  value={editingEntry.content}
                  onChange={e => setEditingEntry({ ...editingEntry, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-body text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none placeholder-ink-light"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setEditingEntry(null); setDeleteConfirm(null); }}
                  className="px-4 py-2 rounded-lg font-body text-sm text-ink-light hover:text-ink hover:bg-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editingEntry.content.trim()}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-body text-sm font-medium transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Add Entry Modal ─────────────────────────────────────────── */}
      {showAddForm && (
        <ModalOverlay onClose={() => setShowAddForm(false)}>
          <div className="bg-paper rounded-xl shadow-lifted w-full max-w-lg flex flex-col overflow-hidden">
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-header italic text-white drop-shadow-sm">New Journal Entry</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-body font-medium text-ink mb-1">Date</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={e => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-ink mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={e => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give it a title..."
                  className="w-full px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-body text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-ink-light"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-ink mb-1">What&apos;s on your mind?</label>
                <textarea
                  value={newEntry.content}
                  onChange={e => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  placeholder="Write your thoughts..."
                  className="w-full px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-body text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none placeholder-ink-light"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg font-body text-sm text-ink-light hover:text-ink hover:bg-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  disabled={!newEntry.content.trim()}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-body text-sm font-medium transition-colors shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COLLECTIONS TAB
   ══════════════════════════════════════════════════════════════════════ */

function CollectionsTab() {
  const {
    collections,
    addCollection,
    updateCollection,
    deleteCollection,
    addCollectionItem,
    updateCollectionItem,
    deleteCollectionItem,
    reorderCollectionItems,
  } = useApp();

  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);
  const [creatingTitle, setCreatingTitle] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ── Drag-and-drop state ──────────────────────────────────────── */
  const dragItemRef = useRef<string | null>(null);
  const dragOverItemRef = useRef<string | null>(null);

  const openCollection = useMemo(
    () => collections.find(c => c.id === openCollectionId) ?? null,
    [collections, openCollectionId],
  );

  const sortedItems = useMemo(
    () => openCollection ? [...openCollection.items].sort((a, b) => a.order - b.order) : [],
    [openCollection],
  );

  /* ── Handlers ─────────────────────────────────────────────────── */

  function handleCreateCollection() {
    if (creatingTitle === null) {
      setCreatingTitle('');
      return;
    }
    const title = creatingTitle.trim();
    if (!title) { setCreatingTitle(null); return; }
    const collection: Collection = {
      id: `col-${uid()}`,
      title,
      items: [],
      createdAt: new Date().toISOString(),
    };
    addCollection(collection);
    setCreatingTitle(null);
    setOpenCollectionId(collection.id);
  }

  function handleDeleteCollection(id: string) {
    deleteCollection(id);
    setDeleteConfirmId(null);
    if (openCollectionId === id) setOpenCollectionId(null);
  }

  function handleSaveTitle() {
    if (!openCollection) return;
    const title = titleDraft.trim();
    if (title && title !== openCollection.title) {
      updateCollection(openCollection.id, { title });
    }
    setEditingTitle(false);
  }

  function handleAddItem() {
    if (!openCollection || !newItemText.trim()) return;
    const item: CollectionItem = {
      id: `ci-${uid()}`,
      text: newItemText.trim(),
      done: false,
      order: openCollection.items.length,
    };
    addCollectionItem(openCollection.id, item);
    setNewItemText('');
  }

  function handleSaveItemEdit(itemId: string) {
    if (!openCollection) return;
    const text = editingItemText.trim();
    if (text) {
      updateCollectionItem(openCollection.id, itemId, { text });
    }
    setEditingItemId(null);
    setEditingItemText('');
  }

  function handleDragStart(itemId: string) {
    dragItemRef.current = itemId;
  }

  function handleDragEnter(itemId: string) {
    dragOverItemRef.current = itemId;
  }

  function handleDragEnd() {
    if (!openCollection || !dragItemRef.current || !dragOverItemRef.current) return;
    if (dragItemRef.current === dragOverItemRef.current) return;

    const items = [...sortedItems];
    const dragIdx = items.findIndex(i => i.id === dragItemRef.current);
    const overIdx = items.findIndex(i => i.id === dragOverItemRef.current);
    if (dragIdx === -1 || overIdx === -1) return;

    const [dragged] = items.splice(dragIdx, 1);
    items.splice(overIdx, 0, dragged);

    const reordered = items.map((item, idx) => ({ ...item, order: idx }));
    reorderCollectionItems(openCollection.id, reordered);

    dragItemRef.current = null;
    dragOverItemRef.current = null;
  }

  /* ── Open collection view ─────────────────────────────────────── */
  if (openCollection) {
    return (
      <div className="flex flex-col gap-6">
        {/* Back button */}
        <button
          onClick={() => { setOpenCollectionId(null); setEditingTitle(false); }}
          className="flex items-center gap-1 text-ink-light hover:text-ink font-body text-sm transition-colors self-start"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Collections
        </button>

        {/* Collection title */}
        <div className="flex items-center gap-3">
          {editingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                autoFocus
                className="flex-1 px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-display text-2xl italic focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button onClick={handleSaveTitle} className="text-primary hover:text-primary-dark transition-colors">
                <span className="material-symbols-outlined">check</span>
              </button>
              <button onClick={() => setEditingTitle(false)} className="text-ink-light hover:text-ink transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ) : (
            <h3
              className="text-3xl font-display italic text-ink cursor-pointer hover:text-primary transition-colors group flex items-center gap-2"
              onClick={() => { setEditingTitle(true); setTitleDraft(openCollection.title); }}
            >
              {openCollection.title}
              <span className="material-symbols-outlined text-lg text-ink-light/0 group-hover:text-ink-light transition-colors">edit</span>
            </h3>
          )}
        </div>

        {/* Items list */}
        <div className="bg-paper border border-wood-light/30 rounded-xl shadow-paper overflow-hidden">
          {sortedItems.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="font-handwriting text-ink-light text-lg">No items yet. Add one below.</p>
            </div>
          )}

          <ul className="divide-y divide-wood-light/20">
            {sortedItems.map(item => (
              <li
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragEnter={() => handleDragEnter(item.id)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                className="flex items-center gap-3 px-4 py-3 group hover:bg-surface-light/30 transition-colors"
              >
                {/* Drag handle */}
                <span className="material-symbols-outlined text-ink-light/30 group-hover:text-ink-light cursor-grab active:cursor-grabbing transition-colors text-lg shrink-0">
                  drag_indicator
                </span>

                {/* Checkbox */}
                <button
                  onClick={() => updateCollectionItem(openCollection.id, item.id, { done: !item.done })}
                  className={`size-5 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                    item.done
                      ? 'bg-primary border-primary text-white'
                      : 'border-wood-light hover:border-primary'
                  }`}
                >
                  {item.done && <span className="material-symbols-outlined text-sm">check</span>}
                </button>

                {/* Text - click to edit inline */}
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={editingItemText}
                    onChange={e => setEditingItemText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveItemEdit(item.id); if (e.key === 'Escape') setEditingItemId(null); }}
                    onBlur={() => handleSaveItemEdit(item.id)}
                    autoFocus
                    className="flex-1 px-2 py-1 bg-surface-light/50 border border-wood-light/40 rounded text-ink font-body text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <span
                    onClick={() => { setEditingItemId(item.id); setEditingItemText(item.text); }}
                    className={`flex-1 font-body text-sm cursor-text ${
                      item.done ? 'line-through text-ink-light/60' : 'text-ink'
                    }`}
                  >
                    {item.text}
                  </span>
                )}

                {/* Delete button on hover */}
                <button
                  onClick={() => deleteCollectionItem(openCollection.id, item.id)}
                  className="text-ink-light/0 group-hover:text-ink-light/50 hover:!text-red-500 transition-colors p-0.5 rounded shrink-0"
                  aria-label="Delete item"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Add item input */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-wood-light/20 bg-surface-light/20">
            <span className="material-symbols-outlined text-primary/50 text-lg shrink-0">add_circle_outline</span>
            <input
              type="text"
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
              placeholder="Add an item..."
              className="flex-1 bg-transparent border-none text-ink font-body text-sm focus:ring-0 placeholder-ink-light/50 outline-none"
            />
            {newItemText.trim() && (
              <button
                onClick={handleAddItem}
                className="text-primary hover:text-primary-dark transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">check</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Collections grid ─────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">
      {/* New Collection button / inline input */}
      <div className="flex items-center gap-3">
        {creatingTitle !== null ? (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={creatingTitle}
              onChange={e => setCreatingTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateCollection(); if (e.key === 'Escape') setCreatingTitle(null); }}
              autoFocus
              placeholder="Collection title..."
              className="flex-1 px-3 py-2 bg-surface-light/50 border border-wood-light/40 rounded-lg text-ink font-display text-sm italic focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-ink-light"
            />
            <button
              onClick={handleCreateCollection}
              disabled={!creatingTitle.trim()}
              className="text-primary hover:text-primary-dark transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">check</span>
            </button>
            <button onClick={() => setCreatingTitle(null)} className="text-ink-light hover:text-ink transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingTitle('')}
            className="flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary text-white px-4 py-2.5 rounded-lg transition-colors font-body text-sm font-medium shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>New Collection</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {collections.length === 0 && creatingTitle === null && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="material-symbols-outlined text-6xl text-wood-light">collections_bookmark</span>
          <p className="text-xl font-header italic text-ink-light">No collections yet.</p>
          <p className="text-base font-handwriting text-ink-light/70 text-center max-w-sm leading-relaxed">
            Try: Books to Read, Monthly Goals, Gift Ideas
          </p>
          <button
            onClick={() => setCreatingTitle('')}
            className="mt-4 flex items-center gap-2 bg-primary/90 hover:bg-primary text-white px-5 py-2.5 rounded-lg transition-colors font-body text-sm font-medium shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create your first collection
          </button>
        </div>
      )}

      {/* Collection cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((col, idx) => {
          const previewItems = col.items.sort((a, b) => a.order - b.order).slice(0, 3);
          const rotation = idx % 2 === 0 ? 'rotate-[0.5deg]' : 'rotate-[-0.5deg]';

          return (
            <div key={col.id} className="relative group">
              <button
                onClick={() => setOpenCollectionId(col.id)}
                className={`w-full text-left bg-paper border border-wood-light/30 rounded-lg shadow-paper p-5 transition-all hover:shadow-soft hover:-translate-y-1 ${rotation} hover:rotate-0 cursor-pointer`}
              >
                {/* Title */}
                <h4 className="font-display italic text-lg text-ink mb-2 leading-tight">{col.title}</h4>

                {/* Item count badge */}
                <span className="inline-block text-xs font-mono bg-wood-light/30 text-ink-light px-2 py-0.5 rounded-full mb-3">
                  {col.items.length} {col.items.length === 1 ? 'item' : 'items'}
                </span>

                {/* Preview items */}
                {previewItems.length > 0 && (
                  <ul className="space-y-1.5">
                    {previewItems.map(item => (
                      <li key={item.id} className="flex items-center gap-2">
                        <div className={`size-3.5 rounded border shrink-0 flex items-center justify-center ${
                          item.done
                            ? 'bg-primary/80 border-primary/80 text-white'
                            : 'border-wood-light'
                        }`}>
                          {item.done && <span className="material-symbols-outlined text-[10px]">check</span>}
                        </div>
                        <span className={`text-xs font-body truncate ${
                          item.done ? 'line-through text-ink-light/50' : 'text-ink-light'
                        }`}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                    {col.items.length > 3 && (
                      <li className="text-xs font-body text-ink-light/50 pl-5">
                        +{col.items.length - 3} more
                      </li>
                    )}
                  </ul>
                )}
              </button>

              {/* Delete button on hover */}
              {deleteConfirmId === col.id ? (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-paper rounded-lg shadow-soft px-2 py-1 border border-wood-light/40 z-10">
                  <span className="text-xs font-body text-ink-light">Delete?</span>
                  <button
                    onClick={() => handleDeleteCollection(col.id)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded font-body transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-xs bg-surface-light hover:bg-wood-light text-ink px-2 py-0.5 rounded font-body transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setDeleteConfirmId(col.id); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-ink-light/50 hover:text-red-500 transition-all p-1 rounded-full hover:bg-red-50"
                  aria-label="Delete collection"
                >
                  <span className="material-symbols-outlined text-lg">delete_outline</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function ArchiveLibrary() {
  const [activeTab, setActiveTab] = useState<ArchiveTab>('journals');
  const [search, setSearch] = useState('');

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 md:px-8 py-8 gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-wood-light/50">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl md:text-5xl tracking-tight font-header italic text-ink">
            {activeTab === 'collections' ? 'Collections' : 'The Archive'}
          </h2>
          <p className="text-ink-light text-lg font-handwriting">
            {activeTab === 'collections'
              ? 'Themed lists for anything worth tracking.'
              : 'Your library of journal entries and reflections.'}
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex bg-surface-light/60 rounded-lg p-1 shadow-inner-shallow border border-wood-light/20">
          <button
            onClick={() => setActiveTab('journals')}
            className={`px-5 py-2 rounded-md font-body text-sm font-medium transition-all ${
              activeTab === 'journals'
                ? 'bg-paper text-ink shadow-paper'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            Journals
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-5 py-2 rounded-md font-body text-sm font-medium transition-all ${
              activeTab === 'collections'
                ? 'bg-paper text-ink shadow-paper'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            Collections
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'journals' ? (
        <JournalsTab search={search} setSearch={setSearch} />
      ) : (
        <CollectionsTab />
      )}
    </div>
  );
}
