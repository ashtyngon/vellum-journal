import { useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function FlowView() {
  const { tasks } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getDayLabel = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return {
      full: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate()
    };
  };

  const getTasksForDate = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.date === dateStr);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-paper-texture">
      {/* Sidebar: Parking Lot */}
      <aside className="w-[20%] min-w-[280px] h-full flex flex-col border-r border-wood-light/50 bg-surface-light/40 backdrop-blur-md relative z-20 shadow-soft">
        <div className="p-6 pb-2">
          <h2 className="font-display italic text-xl text-ink mb-1">The Parking Lot</h2>
          <p className="font-handwriting text-sm text-bronze">Unscheduled thoughts & ideas</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
          {/* Parking Lot Items (Simulated) */}
          <div className="group bg-surface-light p-4 rounded shadow-soft border border-transparent hover:border-bronze/30 hover:shadow-lifted transition-all cursor-grab active:cursor-grabbing transform hover:-rotate-1 relative">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-0.5">•</span>
              <p className="text-ink text-base leading-snug">Research API limits for the new integration</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-mono text-graphite bg-background-light px-1.5 rounded">DEV-102</span>
              <span className="material-symbols-outlined text-bronze text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
            </div>
          </div>

          <button className="w-full py-3 border border-dashed border-bronze/40 rounded text-bronze hover:text-primary hover:border-primary/40 hover:bg-surface-light/50 transition-all flex items-center justify-center gap-2 mt-4 font-handwriting">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Jot down an idea</span>
          </button>
        </div>
        <div className="p-6 border-t border-primary/5">
          <div className="flex items-center gap-3 text-sm text-graphite hover:text-ink cursor-pointer transition-colors">
            <span className="material-symbols-outlined">archive</span>
            <span>View Archived Notes</span>
          </div>
        </div>
      </aside>

      {/* Timeline Container */}
      <div className="flex-1 h-full relative overflow-hidden bg-transparent">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(to right, #3D3A36 1px, transparent 1px)', backgroundSize: '280px 100%' }}></div>

        {/* Scrollable Area */}
        <div ref={scrollContainerRef} className="horizontal-scroll w-full h-full overflow-x-auto flex items-start px-8 pt-8 pb-12 snap-x snap-mandatory scroll-smooth gap-0">

          {/* Day Column: Past (Yesterday) */}
          <div className="min-w-[280px] w-[280px] h-full flex flex-col gap-4 px-4 border-r border-dashed border-wood-light/50 opacity-60 grayscale-[30%] snap-start">
            <div className="flex flex-col mb-4">
              <h3 className="font-display italic text-2xl text-graphite">{getDayLabel(-1).full}</h3>
              <span className="font-mono text-xs text-bronze">YESTERDAY</span>
            </div>
            <div className="bg-surface-light/60 p-4 rounded shadow-sm border border-rose/20 relative group">
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose opacity-80"></div>
                <div className="flex items-start gap-2 opacity-70">
                    <span className="material-symbols-outlined text-[18px] text-rose mt-0.5">check_box_outline_blank</span>
                    <span className="text-ink line-through decoration-rose/30">Review quarterly budget</span>
                </div>
                <div className="mt-2 text-xs font-handwriting text-rose">Unfinished</div>
            </div>
          </div>

          {/* Day Column: Today (Focus) */}
          <div className="min-w-[280px] w-[280px] h-full flex flex-col gap-4 px-4 border-r border-dashed border-wood-light/50 relative snap-center">
            {/* The "Now" Line */}
            <div className="absolute left-0 right-0 top-[340px] z-30 flex items-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-primary -ml-1"></div>
              <div className="h-px bg-primary flex-1 shadow-[0_0_8px_rgba(236,127,19,0.4)]"></div>
              <div className="bg-primary text-white text-[10px] font-mono px-1.5 py-0.5 rounded-sm ml-2">Now</div>
            </div>

            <div className="flex flex-col mb-4 sticky top-0 z-10 bg-transparent backdrop-blur-[1px] py-2">
              <h3 className="font-display italic text-3xl text-ink font-medium">{getDayLabel(0).full}</h3>
              <span className="font-mono text-xs text-primary font-bold tracking-widest uppercase">Today</span>
            </div>

            {/* Time Block: Morning */}
            <div className="relative w-full rounded bg-sage/20 border border-sage/10 p-2 min-h-[80px]">
              <span className="absolute top-1 left-2 font-mono text-[10px] text-sage font-bold">08:00</span>
              <span className="font-handwriting text-sm text-sage/80 ml-8 block mt-0.5">Morning Routine</span>
            </div>

            {/* Tasks for Today */}
            {getTasksForDate(0).map(task => (
                <div key={task.id} className={`bg-surface-light p-4 rounded shadow-lifted border-l-4 ${task.priority === 'high' ? 'border-primary' : 'border-wood-light'} z-20 relative transform hover:-translate-y-1 transition-transform duration-300 ease-out cursor-pointer`}>
                    <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${task.status === 'done' ? 'text-sage' : 'text-primary'} cursor-pointer hover:bg-primary/10 rounded`}>
                            {task.status === 'done' ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <div className="flex-1">
                            <h4 className="text-lg font-body text-ink font-semibold leading-tight">{task.title}</h4>
                            <p className="text-sm text-graphite mt-1 font-body">Description placeholder...</p>
                        </div>
                    </div>
                     <div className="mt-3 flex items-center gap-2">
                        {task.priority === 'high' && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-mono rounded">URGENT</span>}
                        {task.duration && <span className="text-[10px] font-mono text-graphite ml-auto">{task.duration}</span>}
                    </div>
                </div>
            ))}

            {/* Time Block: Meeting */}
            <div className="relative w-full rounded bg-sage/20 border border-sage/10 p-2 min-h-[100px] mt-8">
              <span className="absolute top-1 left-2 font-mono text-[10px] text-sage font-bold">11:30</span>
              <span className="font-handwriting text-sm text-sage/80 ml-8 block mt-0.5">Sync w/ Product</span>
              <div className="bg-surface-light/90 backdrop-blur-sm p-3 mt-4 rounded shadow-soft border border-sage/20 ml-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-sage">videocam</span>
                  <span className="text-sm font-body text-ink">Weekly Sync</span>
                </div>
              </div>
            </div>
          </div>

          {/* Day Column: Tomorrow */}
          <div className="min-w-[280px] w-[280px] h-full flex flex-col gap-4 px-4 border-r border-dashed border-wood-light/50 snap-center">
            <div className="flex flex-col mb-4">
              <h3 className="font-display italic text-2xl text-ink/80">{getDayLabel(1).full}</h3>
              <span className="font-mono text-xs text-bronze">TOMORROW</span>
            </div>
            {/* Future Task */}
            {getTasksForDate(1).map(task => (
                <div key={task.id} className="bg-surface-light/80 p-4 rounded shadow-soft border border-transparent group hover:bg-surface-light transition-colors">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[20px] text-graphite group-hover:text-primary transition-colors">radio_button_unchecked</span>
                        <span className="text-ink font-body">{task.title}</span>
                    </div>
                </div>
            ))}
             <div className="bg-surface-light/80 p-4 rounded shadow-soft border border-transparent group hover:bg-surface-light transition-colors">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-graphite group-hover:text-primary transition-colors">radio_button_unchecked</span>
                    <span className="text-ink font-body">Review Q3 Reports</span>
                </div>
            </div>
          </div>

          {/* Day Column: Future */}
          <div className="min-w-[280px] w-[280px] h-full flex flex-col gap-4 px-4 border-r border-dashed border-wood-light/50 opacity-80 snap-center">
            <div className="flex flex-col mb-4">
              <h3 className="font-display italic text-2xl text-ink/60">{getDayLabel(2).full}</h3>
            </div>
             <div className="bg-surface-light/60 p-4 rounded shadow-sm border border-transparent opacity-80">
                <div className="flex items-start gap-3">
                    <span className="text-graphite">•</span>
                    <span className="text-ink font-body text-sm">Wrap up sprint</span>
                </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="min-w-[100px] h-full"></div>
        </div>

        {/* Navigation Hint */}
        <div className="absolute bottom-8 right-8 pointer-events-none bg-vellum/80 px-4 py-2 rounded-full border border-wood-light/50 shadow-soft flex items-center gap-2 animate-pulse">
            <span className="font-mono text-xs text-bronze">SCROLL TO NAVIGATE</span>
            <span className="material-symbols-outlined text-bronze text-[16px]">arrow_forward</span>
        </div>
      </div>
    </div>
  );
}
