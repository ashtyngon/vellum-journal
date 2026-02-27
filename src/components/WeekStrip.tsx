import { useCallback, useMemo, useRef } from 'react';
import { formatLocalDate } from '../lib/dateUtils';

interface WeekStripProps {
  currentDate: string; // YYYY-MM-DD — the currently viewed day
  onSelectDate: (date: string) => void;
  completionStatus: Record<string, 'none' | 'partial' | 'complete'>;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Compact week navigation strip showing Mon-Sun with completion dots
 * and prev/next week arrows.
 */
function WeekStrip({ currentDate, onSelectDate, completionStatus }: WeekStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => formatLocalDate(new Date()), []);

  // Calculate the Monday-Sunday week containing currentDate
  const weekDays = useMemo(() => {
    // Parse at noon to avoid DST edge cases
    const current = new Date(currentDate + 'T12:00:00');
    // getDay(): 0=Sun, 1=Mon ... 6=Sat → convert to Mon-based offset
    const dayOfWeek = current.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + mondayOffset + i);
      days.push(formatLocalDate(d));
    }
    return days;
  }, [currentDate]);

  const isViewingToday = currentDate === today;

  const navigateWeek = useCallback(
    (direction: -1 | 1) => {
      const current = new Date(currentDate + 'T12:00:00');
      current.setDate(current.getDate() + direction * 7);
      onSelectDate(formatLocalDate(current));
    },
    [currentDate, onSelectDate],
  );

  const navigateDay = useCallback(
    (direction: -1 | 1) => {
      const current = new Date(currentDate + 'T12:00:00');
      current.setDate(current.getDate() + direction);
      onSelectDate(formatLocalDate(current));
    },
    [currentDate, onSelectDate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateDay(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateDay(1);
      }
    },
    [navigateDay],
  );

  const getCompletionDot = (dateStr: string) => {
    const status = completionStatus[dateStr] ?? 'none';
    switch (status) {
      case 'complete':
        return <span className="text-[8px] leading-none text-sage">&#9679;</span>; // ●
      case 'partial':
        return <span className="text-[8px] leading-none text-bronze">&#9684;</span>; // ◐
      case 'none':
      default:
        // Only show empty dot for past days or today
        if (dateStr <= today) {
          return <span className="text-[8px] leading-none text-pencil/30">&#9675;</span>; // ○
        }
        return <span className="text-[8px] leading-none invisible">&#9675;</span>; // spacer
    }
  };

  const getDayClasses = (dateStr: string, dayIndex: number) => {
    const isSelected = dateStr === currentDate;
    const isToday = dateStr === today;
    const isWeekend = dayIndex >= 5; // Sat=5, Sun=6
    const isPast = dateStr < today;
    const hasActivity = completionStatus[dateStr] && completionStatus[dateStr] !== 'none';

    const base =
      'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all min-w-[44px] cursor-pointer select-none';

    if (isSelected) {
      return `${base} bg-primary text-white shadow-soft`;
    }

    if (isToday) {
      return `${base} bg-primary/10 text-primary hover:bg-primary/20`;
    }

    if (isWeekend) {
      return `${base} text-accent/70 hover:bg-accent/10`;
    }

    if (isPast && !hasActivity) {
      return `${base} text-pencil/50 hover:bg-surface-light`;
    }

    return `${base} text-ink hover:bg-surface-light`;
  };

  return (
    <div
      ref={stripRef}
      className="flex items-center gap-1 px-3 py-2 bg-paper/80 border-b border-wood-light/20"
      role="navigation"
      aria-label="Week navigation"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Previous week arrow */}
      <button
        onClick={() => navigateWeek(-1)}
        className="w-7 h-7 flex items-center justify-center text-pencil hover:text-primary transition-colors rounded-full hover:bg-surface-light"
        aria-label="Previous week"
        tabIndex={-1}
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
      </button>

      {/* Day buttons */}
      {weekDays.map((dateStr, index) => (
        <button
          key={dateStr}
          onClick={() => onSelectDate(dateStr)}
          className={getDayClasses(dateStr, index)}
          aria-label={`${DAY_LABELS[index]}, ${dateStr}${dateStr === currentDate ? ' (selected)' : ''}${dateStr === today ? ' (today)' : ''}`}
          aria-current={dateStr === currentDate ? 'date' : undefined}
          tabIndex={-1}
        >
          <span className="text-[11px] font-mono font-medium uppercase tracking-wide leading-none">
            {DAY_LABELS[index]}
          </span>
          {getCompletionDot(dateStr)}
        </button>
      ))}

      {/* Next week arrow */}
      <button
        onClick={() => navigateWeek(1)}
        className="w-7 h-7 flex items-center justify-center text-pencil hover:text-primary transition-colors rounded-full hover:bg-surface-light"
        aria-label="Next week"
        tabIndex={-1}
      >
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>

      {/* Today snap button */}
      {!isViewingToday && (
        <button
          onClick={() => onSelectDate(today)}
          className="ml-1 px-2 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
          aria-label="Go to today"
          tabIndex={-1}
        >
          Today
        </button>
      )}
    </div>
  );
}

export default WeekStrip;
