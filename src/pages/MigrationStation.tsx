import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function MigrationStation() {
  const { tasks, updateTask } = useApp();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const leftBehind = useMemo(() => {
    return tasks.filter(t => t.status === 'todo' && t.date < todayStr);
  }, [tasks]);

  const movingForward = useMemo(() => {
      return {
          today: tasks.filter(t => t.date === todayStr && t.status !== 'done'),
          tomorrow: tasks.filter(t => t.date === tomorrowStr),
          nextWeek: tasks.filter(t => t.date > tomorrowStr)
      }
  }, [tasks]);

  const handleMove = (id: string, target: 'today' | 'tomorrow' | 'nextWeek' | 'delete') => {
      if (target === 'delete') {
          // In a real app, delete. Here, maybe mark as deferred?
          updateTask(id, { status: 'deferred' });
          return;
      }

      let newDate = todayStr;
      if (target === 'tomorrow') newDate = tomorrowStr;
      if (target === 'nextWeek') {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          newDate = d.toISOString().split('T')[0];
      }

      const task = tasks.find(t => t.id === id);
      updateTask(id, { date: newDate, movedCount: (task?.movedCount || 0) + 1, status: 'migrated' });
  };

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-warm-grey/90 p-4 sm:p-8 backdrop-blur-sm transition-all duration-500">
      <div className="group/modal relative flex h-full max-h-[800px] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-paper shadow-2xl ring-1 ring-white/20">
        <div className="pointer-events-none absolute inset-0 z-0 bg-noise opacity-50 mix-blend-multiply"></div>

        {/* Header */}
        <div className="relative z-10 flex w-full flex-col justify-between border-b border-wood-light px-8 py-6 sm:flex-row sm:items-end bg-surface-light/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary/80">
              <span className="material-symbols-outlined text-xl">history_edu</span>
              <span className="text-sm font-bold uppercase tracking-widest font-sans">Morning Migration</span>
            </div>
            <h1 className="font-display text-4xl italic text-ink">Review Yesterday</h1>
            <p className="max-w-md text-pencil font-body">Drag tasks to move them forward. The unfinished business of the past is heavy; choose only what matters.</p>
          </div>
          <div className="mt-4 flex items-center gap-4 sm:mt-0">
             <button onClick={() => navigate('/daily')} className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0 active:shadow-sm">
                <span className="font-medium tracking-wide">Finish Review</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Content Split View */}
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden sm:flex-row">
            {/* LEFT COLUMN: THE PAST */}
            <div className="flex flex-1 flex-col border-r border-wood-light bg-[#fbf9f7] relative">
                <div className="sticky top-0 z-20 flex items-center justify-between bg-[#fbf9f7]/95 px-6 py-4 backdrop-blur-sm border-b border-wood-light/50">
                    <h2 className="font-display text-xl italic text-ink/80">Left Behind</h2>
                    <span className="rounded-full bg-wood-light px-2 py-0.5 text-xs font-semibold text-ink-light">{leftBehind.length} tasks</span>
                </div>

                <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6 pb-32">
                    {leftBehind.map(task => (
                        <div key={task.id} className="group relative cursor-grab active:cursor-grabbing">
                            <div className="paper-stack-effect relative flex flex-col gap-3 rounded border border-wood-light bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-paper hover:border-primary/30">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 h-2 w-2 rounded-full border border-wood-light"></div>
                                        <div>
                                            <p className="text-lg leading-tight text-ink font-body">{task.title}</p>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-pencil">
                                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                <span>{task.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleMove(task.id, 'today')} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary hover:text-white">Today</button>
                                        <button onClick={() => handleMove(task.id, 'tomorrow')} className="text-xs bg-wood-light text-ink px-2 py-1 rounded hover:bg-ink hover:text-white">Tmrw</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {leftBehind.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-pencil italic">
                            All caught up!
                        </div>
                    )}
                </div>

                {/* Shredder Zone */}
                <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-wood-light bg-[#f4f1ee] p-4 transition-colors hover:bg-red-50 group/shredder cursor-pointer">
                    <div className="flex h-24 flex-col items-center justify-center rounded border-2 border-dashed border-wood-light bg-transparent text-pencil transition-all group-hover/shredder:border-red-300 group-hover/shredder:text-red-400">
                        <span className="material-symbols-outlined text-3xl mb-1 group-hover/shredder:animate-bounce">delete_sweep</span>
                        <span className="text-sm font-medium font-body">Let it go (Shred)</span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: THE FUTURE */}
            <div className="flex flex-1 flex-col bg-surface-light/60 relative">
                <div className="sticky top-0 z-20 flex items-center justify-between bg-surface-light/95 px-6 py-4 backdrop-blur-sm border-b border-wood-light/50">
                    <h2 className="font-display text-xl italic text-ink/80">Moving Forward</h2>
                </div>

                <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6 pb-12">
                     {/* Today Bucket */}
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-primary">
                            <h3 className="font-sans text-sm font-bold uppercase tracking-wider">Today (Focus)</h3>
                            <span className="text-xs opacity-60 font-mono">{todayStr}</span>
                        </div>
                        <div className="min-h-[160px] w-full rounded-lg border-2 border-primary/20 bg-primary/5 p-4 transition-colors hover:border-primary/40 hover:bg-primary/10">
                             {movingForward.today.length === 0 ? (
                                <div className="mb-3 flex items-center justify-center rounded border border-dashed border-primary/30 py-6 text-primary/40">
                                    <span className="text-sm italic font-handwriting">Drop to focus today</span>
                                </div>
                             ) : (
                                movingForward.today.map(t => (
                                    <div key={t.id} className="relative mb-2 flex flex-col gap-3 rounded border border-primary/20 bg-white p-3 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 h-2 w-2 rounded-full border border-primary bg-primary"></div>
                                                <p className="text-base leading-tight text-ink font-body">{t.title}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                             )}
                        </div>
                     </div>

                     {/* Tomorrow Bucket */}
                     <div className="flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between text-ink-light">
                            <h3 className="font-sans text-sm font-bold uppercase tracking-wider">Tomorrow</h3>
                        </div>
                        <div className="min-h-[120px] w-full rounded-lg border-2 border-dashed border-wood-light bg-background-light p-4 transition-colors hover:border-ink-light hover:bg-wood-light/30">
                            {movingForward.tomorrow.length > 0 ? (
                                movingForward.tomorrow.map(t => (
                                    <div key={t.id} className="relative mb-2 flex flex-col gap-3 rounded border border-wood-light bg-white p-3 shadow-sm">
                                        <p className="text-base leading-tight text-ink font-body">{t.title}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="flex h-full items-center justify-center text-pencil">
                                    <span className="text-sm italic font-handwriting">Save for tomorrow</span>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
