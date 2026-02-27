import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatLocalDate, todayStr } from '../lib/dateUtils';

const HABIT_COLORS: { key: string; hex: string; bg: string; text: string; label: string }[] = [
  { key: 'sage',      hex: '#8fa88f', bg: 'bg-sage',          text: 'text-sage',      label: 'Sage' },
  { key: 'primary',   hex: '#ec7f13', bg: 'bg-primary',       text: 'text-primary',   label: 'Amber' },
  { key: 'accent',    hex: '#9c6644', bg: 'bg-accent',        text: 'text-accent',    label: 'Sienna' },
  { key: 'tension',   hex: '#C47C7C', bg: 'bg-rose',          text: 'text-rose',      label: 'Rose' },
  { key: 'sky',       hex: '#5B9BD5', bg: 'bg-[#5B9BD5]',     text: 'text-[#5B9BD5]', label: 'Sky' },
  { key: 'lavender',  hex: '#9B8EC4', bg: 'bg-[#9B8EC4]',     text: 'text-[#9B8EC4]', label: 'Lavender' },
  { key: 'teal',      hex: '#5AA5A0', bg: 'bg-[#5AA5A0]',     text: 'text-[#5AA5A0]', label: 'Teal' },
  { key: 'coral',     hex: '#E27D60', bg: 'bg-[#E27D60]',     text: 'text-[#E27D60]', label: 'Coral' },
  { key: 'slate',     hex: '#6B7B8D', bg: 'bg-[#6B7B8D]',     text: 'text-[#6B7B8D]', label: 'Slate' },
  { key: 'gold',      hex: '#D4A843', bg: 'bg-[#D4A843]',     text: 'text-[#D4A843]', label: 'Gold' },
  { key: 'forest',    hex: '#4A7C59', bg: 'bg-[#4A7C59]',     text: 'text-[#4A7C59]', label: 'Forest' },
  { key: 'plum',      hex: '#8B5E83', bg: 'bg-[#8B5E83]',     text: 'text-[#8B5E83]', label: 'Plum' },
];

function colorToBg(color: string) {
  return HABIT_COLORS.find(c => c.key === color)?.bg ?? 'bg-primary';
}

function colorToText(color: string) {
  return HABIT_COLORS.find(c => c.key === color)?.text ?? 'text-primary';
}

function colorToHex(color: string) {
  return HABIT_COLORS.find(c => c.key === color)?.hex ?? '#ec7f13';
}

const CELL_W = 48;
const CELL_H = 52;
const HEADER_H = 36;

export default function HabitTrace() {
  const { habits, toggleHabit, addHabit, updateHabit, deleteHabit } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState<string>('primary');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [hoveredHabitId, setHoveredHabitId] = useState<string | null>(null);
  const [colorPickerHabitId, setColorPickerHabitId] = useState<string | null>(null);

  // Responsive day count: 7 on mobile, 14 on desktop
  const [dayCount, setDayCount] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 7 : 14,
  );

  useEffect(() => {
    const onResize = () => setDayCount(window.innerWidth < 768 ? 7 : 14);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [dateKey, setDateKey] = useState(todayStr);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible')
        setDateKey((prev) => { const now = todayStr(); return prev !== now ? now : prev; });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  const today = dateKey;

  const days = useMemo(() => {
    const result: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = dayCount; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = formatLocalDate(date);
      result.push({
        dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: dateStr === today,
      });
    }
    return result;
  }, [dayCount, today]);

  // SVG bezier trace paths for consecutive completed dates
  const tracePaths = useMemo(() => {
    return habits.flatMap((habit, hIndex) => {
      const completedIndices = days
        .map((_day, dIndex) => ({ dateStr: _day.dateStr, dIndex }))
        .filter(({ dateStr }) => habit.completedDates.includes(dateStr))
        .map(({ dIndex }) => dIndex);

      const segments: number[][] = [];
      let current: number[] = [];
      for (const idx of completedIndices) {
        if (current.length === 0 || idx === current[current.length - 1] + 1) {
          current.push(idx);
        } else {
          if (current.length >= 2) segments.push(current);
          current = [idx];
        }
      }
      if (current.length >= 2) segments.push(current);

      return segments.map((seg, sIdx) => {
        const points = seg.map((dIndex) => ({
          x: dIndex * CELL_W + CELL_W / 2,
          y: HEADER_H + hIndex * CELL_H + CELL_H / 2,
        }));

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          const midX = (p1.x + p2.x) / 2;
          d += ` C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
        }

        return { key: `${habit.id}-seg-${sIdx}`, d, color: colorToHex(habit.color) };
      });
    });
  }, [habits, days]);

  /* ── Handlers ────────────────────────────────────────────────────── */

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    addHabit({
      id: 'h' + Date.now().toString(36),
      name: newHabitName.trim(),
      streak: 0,
      completedDates: [],
      color: newHabitColor,
    });
    setNewHabitName('');
    setNewHabitColor('primary');
    setShowAddForm(false);
  };

  const handleStartEdit = (habitId: string, currentName: string) => {
    setEditingHabitId(habitId);
    setEditingName(currentName);
  };

  const handleFinishEdit = (habitId: string) => {
    if (editingName.trim() && editingName.trim() !== habits.find((h) => h.id === habitId)?.name) {
      updateHabit(habitId, { name: editingName.trim() });
    }
    setEditingHabitId(null);
    setEditingName('');
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
    if (editingHabitId === habitId) setEditingHabitId(null);
  };

  /* ── Derived ─────────────────────────────────────────────────────── */

  const gridWidth = days.length * CELL_W;
  const gridHeight = HEADER_H + habits.length * CELL_H;

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-background-light">
      {/* Header */}
      <div className="flex-none px-6 md:px-10 py-4 z-40 bg-gradient-to-b from-background-light via-background-light to-transparent">
        <h1 className="text-3xl font-header italic text-ink">Habit Trace</h1>
        <p className="text-pencil font-mono text-sm mt-1 tracking-wider">Track what you actually do, not what you wish you did</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 md:px-10 pb-8">
        {/* Add Habit */}
        <div className="mb-5">
          {showAddForm ? (
            <div className="inline-flex items-center gap-3 bg-paper border border-wood-light rounded-lg px-4 py-3 shadow-sm">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddHabit();
                  if (e.key === 'Escape') { setShowAddForm(false); setNewHabitName(''); }
                }}
                placeholder="Habit name..."
                autoFocus
                className="bg-transparent font-body text-sm text-ink placeholder:text-pencil/60 outline-none border-b border-dashed border-wood-light focus:border-primary w-44"
              />
              <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setNewHabitColor(c.key)}
                    className={`size-5 rounded-full transition-all ${c.bg} ${
                      newHabitColor === c.key
                        ? 'ring-2 ring-offset-1 ring-offset-paper ring-ink/30 scale-110'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
              <button
                onClick={handleAddHabit}
                disabled={!newHabitName.trim()}
                className="px-3 py-1 bg-primary text-white text-sm font-body font-semibold rounded-full hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewHabitName(''); }}
                className="text-pencil hover:text-ink text-sm font-body transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-sm font-body text-primary hover:text-primary-dark transition-colors group"
            >
              <span className="size-6 rounded-full border-2 border-dashed border-primary/40 group-hover:border-primary flex items-center justify-center transition-colors">
                <svg className="size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </span>
              Add a new habit
            </button>
          )}
        </div>

        {/* Grid */}
        {habits.length === 0 ? (
          <p className="text-pencil font-body italic">No habits yet. Add one above to start tracking.</p>
        ) : (
          <div className="flex gap-0">
            {/* Habit name column (sticky left) */}
            <div className="flex-none z-20 bg-background-light pr-3" style={{ minWidth: 180 }}>
              <div style={{ height: HEADER_H }} />
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-2 group/row relative"
                  style={{ height: CELL_H }}
                  onMouseEnter={() => setHoveredHabitId(habit.id)}
                  onMouseLeave={() => setHoveredHabitId(null)}
                >
                  {/* Clickable color dot */}
                  <button
                    onClick={() => setColorPickerHabitId(colorPickerHabitId === habit.id ? null : habit.id)}
                    className={`flex-none size-3.5 rounded-full ${colorToBg(habit.color)} hover:ring-2 hover:ring-offset-1 hover:ring-ink/20 transition-all cursor-pointer`}
                    title="Change color"
                  />
                  {/* Color picker popover */}
                  {colorPickerHabitId === habit.id && (
                    <div className="absolute left-0 top-full z-30 bg-surface-light shadow-lifted rounded-lg border border-wood-light/40 p-2 flex flex-wrap gap-1.5 w-48">
                      {HABIT_COLORS.map(c => (
                        <button
                          key={c.key}
                          onClick={() => { updateHabit(habit.id, { color: c.key }); setColorPickerHabitId(null); }}
                          className={`size-6 rounded-full transition-all ${c.bg} ${
                            habit.color === c.key
                              ? 'ring-2 ring-offset-1 ring-ink/40 scale-110'
                              : 'hover:scale-110 opacity-70 hover:opacity-100'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  )}

                  {editingHabitId === habit.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleFinishEdit(habit.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishEdit(habit.id);
                        if (e.key === 'Escape') { setEditingHabitId(null); setEditingName(''); }
                      }}
                      autoFocus
                      className="bg-transparent font-display text-sm text-ink outline-none border-b border-dashed border-primary w-28"
                    />
                  ) : (
                    <button
                      onClick={() => handleStartEdit(habit.id, habit.name)}
                      className="font-display text-sm text-ink hover:text-primary transition-colors truncate text-left max-w-[120px]"
                      title="Click to rename"
                    >
                      {habit.name}
                    </button>
                  )}

                  <span className="font-mono text-[12px] text-pencil ml-auto flex-none">
                    {habit.streak > 0 && (
                      <span className={colorToText(habit.color)}>{habit.streak}d</span>
                    )}
                  </span>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className={`flex-none size-5 rounded-full flex items-center justify-center text-rose/60 hover:text-rose hover:bg-rose/10 transition-all ${
                      hoveredHabitId === habit.id ? 'opacity-100' : 'opacity-0'
                    }`}
                    title="Delete habit"
                  >
                    <svg className="size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Scrollable grid */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <div className="relative" style={{ width: gridWidth, minHeight: gridHeight }}>
                {/* SVG trace lines */}
                <svg
                  className="absolute inset-0 pointer-events-none z-10"
                  width={gridWidth}
                  height={gridHeight}
                >
                  <defs>
                    <filter id="pencil-trace">
                      <feTurbulence baseFrequency="0.8" numOctaves="2" result="noise" type="fractalNoise" />
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    </filter>
                  </defs>
                  {tracePaths.map((p) => (
                    <path
                      key={p.key}
                      d={p.d}
                      fill="none"
                      stroke={p.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.45"
                      style={{ filter: 'url(#pencil-trace)' }}
                    />
                  ))}
                </svg>

                {/* Day column headers */}
                <div className="flex" style={{ height: HEADER_H }}>
                  {days.map((day) => (
                    <div
                      key={day.dateStr}
                      className="flex flex-col items-center justify-end"
                      style={{ width: CELL_W }}
                    >
                      <span className={`font-handwriting text-[12px] leading-none ${day.isToday ? 'text-primary font-bold' : 'text-pencil'}`}>
                        {day.dayName}
                      </span>
                      <span className={`font-display text-sm leading-tight ${day.isToday ? 'text-primary font-bold' : 'text-ink/50'}`}>
                        {day.dayNum}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Today highlight line */}
                {days.map((day, dIndex) =>
                  day.isToday ? (
                    <div
                      key="today-line"
                      className="absolute top-0 bottom-0 w-px bg-primary/20"
                      style={{ left: dIndex * CELL_W + CELL_W / 2 }}
                    />
                  ) : null,
                )}

                {/* Grid rows */}
                {habits.map((habit) => (
                  <div key={habit.id} className="flex items-center" style={{ height: CELL_H }}>
                    {days.map((day) => {
                      const done = habit.completedDates.includes(day.dateStr);
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => toggleHabit(habit.id, day.dateStr)}
                          className="flex items-center justify-center transition-transform active:scale-90 relative z-20"
                          style={{ width: CELL_W, height: CELL_H }}
                          title={`${habit.name} - ${day.dateStr}`}
                        >
                          {done ? (
                            <div className={`size-5 rounded-full ${colorToBg(habit.color)} shadow-sm ring-2 ring-background-light transition-all duration-200 hover:scale-125`} />
                          ) : (
                            <div className="size-4 rounded-full border-[1.5px] border-dashed border-wood-light/70 bg-transparent hover:border-primary/50 hover:bg-primary/5 transition-colors" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
