import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function HabitTrace() {
  const { habits, toggleHabit } = useApp();

  // Generate last 14 days + 3 future days
  const days = useMemo(() => {
    const d = [];
    const today = new Date();
    // Start from 2 weeks ago
    const start = new Date(today);
    start.setDate(today.getDate() - 14);

    for (let i = 0; i < 18; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;

      d.push({
        dateStr: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday,
        isPast,
        isFuture: !isPast && !isToday
      });
    }
    return d;
  }, []);

  const rowHeight = 88;
  const colWidth = 280;
  const startX = 256; // Padding-left (64 * 4)
  const startY = 165; // Offset for first habit (approx header height + padding)

  // SVG Paths
  const paths = useMemo(() => {
    return habits.map((habit, hIndex) => {
        const points = days
            .map((day, dIndex) => ({ day, dIndex }))
            .filter(({ day }) => habit.completedDates.includes(day.dateStr))
            .map(({ dIndex }) => ({
                x: startX + dIndex * colWidth + (colWidth / 2),
                y: startY + hIndex * rowHeight
            }));

        if (points.length < 2) return null;

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
             const p1 = points[i-1];
             const p2 = points[i];
             const midX = (p1.x + p2.x) / 2;
             d += ` C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
        }

        let colorClass = 'text-primary';
        if (habit.color === 'sage') colorClass = 'text-sage';
        if (habit.color === 'accent') colorClass = 'text-accent';
        if (habit.color === 'tension') colorClass = 'text-rose';

        return { id: habit.id, d, color: colorClass };
    });
  }, [habits, days]);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col h-[calc(100vh-64px)] bg-background-light">
      {/* Controls Bar */}
      <div className="flex-none px-6 md:px-10 py-4 flex items-center justify-between z-40 bg-gradient-to-b from-background-light to-transparent">
        <div>
          <h1 className="text-3xl font-display italic text-ink">Habit Trace</h1>
          <p className="text-pencil font-handwriting text-sm mt-1">Tracing the lines of your intention.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-light/50 backdrop-blur-md p-1.5 rounded-full border border-wood-light shadow-sm">
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-ink/60 hover:bg-surface-light/80 transition-colors">Tasks</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-bold bg-surface-light text-primary shadow-sm ring-1 ring-black/5">Habits</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-ink/60 hover:bg-surface-light/80 transition-colors">Mood</button>
        </div>
      </div>

      <div className="flex-1 relative overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="relative min-w-max h-full pl-64 pr-20">

            {/* Sidebar Overlay (Fixed position relative to viewport but aligned with rows) */}
            <div className="fixed left-0 top-[180px] w-64 z-30 flex flex-col pointer-events-none hidden md:flex pl-8 space-y-[64px]">
                 {habits.map((habit) => (
                    <div key={habit.id} className="group flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity cursor-pointer h-6 pointer-events-auto">
                        <div className={`size-2 rounded-full ${habit.color === 'sage' ? 'bg-sage' : habit.color === 'accent' ? 'bg-accent' : habit.color === 'tension' ? 'bg-rose' : 'bg-primary'}`}></div>
                        <span className="font-display text-lg text-ink whitespace-nowrap">{habit.name}</span>
                    </div>
                ))}
            </div>

            {/* SVG Overlay */}
            <svg className="absolute top-0 left-0 h-full pointer-events-none z-10" style={{ width: Math.max(2000, days.length * colWidth + startX), height: '100%' }}>
                <defs>
                    <filter id="pencil-texture">
                        <feTurbulence baseFrequency="1.2" numOctaves="3" result="noise" type="fractalNoise"></feTurbulence>
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4"></feDisplacementMap>
                    </filter>
                </defs>
                {paths.map((p) => p && (
                    <path
                        key={p.id}
                        d={p.d}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className={`${p.color} opacity-60`}
                        style={{ filter: 'url(#pencil-texture)' }}
                    />
                ))}
            </svg>

            {/* Columns */}
            <div className="flex h-full pt-8 gap-0 relative z-20">
                {days.map((day) => (
                    <div key={day.dateStr} className={`w-[280px] flex flex-col group px-4 border-r border-dashed border-wood-light/30 ${day.isPast ? 'opacity-80' : ''}`}>
                         {/* Header */}
                         <div className={`mb-12 pb-2 flex justify-between items-baseline border-b ${day.isToday ? 'border-primary' : 'border-wood-light'}`}>
                            <span className="font-display italic text-2xl text-ink">
                                {day.dayName} {day.dayNum}
                            </span>
                            {day.isToday && <span className="font-bold text-xs text-white bg-primary px-2 py-0.5 rounded-full tracking-wider">TODAY</span>}
                        </div>

                        {/* Nodes */}
                        <div className="flex flex-col space-y-[64px] items-center relative">
                             {/* Vertical Guide Line */}
                             <div className="absolute top-0 bottom-0 w-px bg-wood-light/50 left-1/2 -z-10 border-l border-dashed border-wood-light"></div>

                             {habits.map((habit) => {
                                const isCompleted = habit.completedDates.includes(day.dateStr);
                                let bgClass = 'bg-primary';
                                if (habit.color === 'sage') bgClass = 'bg-sage';
                                if (habit.color === 'accent') bgClass = 'bg-accent';
                                if (habit.color === 'tension') bgClass = 'bg-rose';

                                return (
                                    <button
                                        key={habit.id}
                                        onClick={() => toggleHabit(habit.id, day.dateStr)}
                                        className="group/node relative z-30 focus:outline-none h-6 flex items-center justify-center transition-transform active:scale-95"
                                    >
                                        {isCompleted ? (
                                            <div className={`size-5 rounded-full ${bgClass} shadow-sm ring-4 ring-background-light transition-all duration-300 hover:scale-110`}></div>
                                        ) : (
                                            <div className="size-4 rounded-full border-2 border-dashed border-wood-light bg-transparent group-hover/node:border-primary group-hover/node:bg-primary/10 transition-colors"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
}
