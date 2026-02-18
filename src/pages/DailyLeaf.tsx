import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function DailyLeaf() {
  const { tasks, habits, journalEntries, toggleHabit, addTask, updateTask } = useApp();
  const [intention, setIntention] = useState("Finish the Q4 project proposal draft.");
  const [newItem, setNewItem] = useState("");

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Get items for today
  const todaysTasks = tasks.filter(t => t.date === todayStr);
  const todaysEntries = journalEntries.filter(j => j.date === todayStr);

  const handleAddItem = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && newItem.trim()) {
      addTask({
        id: Date.now().toString(),
        title: newItem,
        status: 'todo',
        date: todayStr,
        movedCount: 0,
        priority: 'medium'
      });
      setNewItem("");
    }
  };

  const handleToggleTask = (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (task) {
          updateTask(id, { status: task.status === 'done' ? 'todo' : 'done' });
      }
  };

  return (
    <div className="flex-1 flex justify-center items-start pt-12 pb-20 px-4 bg-background-light overflow-y-auto">
      <article className="relative w-full max-w-[600px] min-h-[800px] bg-paper shadow-paper hover:shadow-lift transition-shadow duration-500 rounded-sm p-12 flex flex-col gap-8 group/paper">
        {/* Header */}
        <section className="space-y-6 border-b border-wood-light/30 pb-8">
          <div className="flex justify-between items-baseline">
            <h1 className="font-display italic text-4xl text-ink">{todayDisplay}</h1>
            <span className="font-mono text-xs text-pencil tracking-widest uppercase">Daily Leaf • 042</span>
          </div>
          <div className="space-y-2">
            <label className="block font-handwriting text-lg text-accent">Today's Intention</label>
            <div className="relative group/input">
              <input
                className="w-full bg-transparent border-none p-0 text-2xl font-display text-ink placeholder:text-pencil/50 focus:ring-0 focus:outline-none border-b border-transparent focus:border-primary/20 transition-all cursor-text italic"
                placeholder="What is the one thing?"
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
              />
              <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary/30 group-focus-within/input:w-full transition-all duration-500"></div>
            </div>
          </div>
        </section>

        {/* Rapid Log */}
        <section className="flex-1 space-y-1">
            {/* Tasks */}
            {todaysTasks.map(task => (
                <div key={task.id} className="group flex items-start gap-4 py-2 hover:bg-surface-light -mx-4 px-4 rounded transition-colors cursor-pointer relative">
                    <button onClick={() => handleToggleTask(task.id)} className="mt-1.5 text-ink hover:text-primary transition-colors focus:outline-none">
                         <span className={`material-symbols-outlined text-[10px] align-middle ${task.status === 'done' ? 'text-primary font-bold' : ''}`}>
                            {task.status === 'done' ? 'close' : task.status === 'migrated' ? 'east' : 'fiber_manual_record'}
                         </span>
                    </button>
                    <div className="flex-1 flex items-baseline gap-3">
                        <p className={`text-lg leading-snug text-ink ${task.status === 'done' ? 'line-through decoration-pencil decoration-1 opacity-60' : ''}`}>
                            {task.title}
                        </p>
                        {task.status === 'migrated' && (
                             <div className="group/tooltip relative flex gap-0.5 mt-1 cursor-help">
                                {Array.from({ length: task.movedCount }).map((_, i) => (
                                    <div key={i} className="size-1.5 rounded-full bg-tension/40"></div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to="/migration" className="text-pencil hover:text-tension" title="Migrate">
                            <span className="material-symbols-outlined text-[18px]">east</span>
                        </Link>
                    </div>
                </div>
            ))}

            {/* Entries */}
            {todaysEntries.map(entry => (
                <div key={entry.id} className="group flex items-start gap-4 py-2 hover:bg-surface-light -mx-4 px-4 rounded transition-colors cursor-pointer">
                    <div className="mt-1.5 text-pencil">
                        <span className="material-symbols-outlined text-[10px] align-middle">remove</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-lg leading-snug text-ink/80 italic">{entry.content}</p>
                    </div>
                </div>
            ))}

            {/* Add New Item */}
            <div className="group flex items-center gap-4 py-2 -mx-4 px-4 rounded transition-colors mt-4 opacity-50 hover:opacity-100 cursor-text focus-within:opacity-100">
                <div className="mt-0.5 text-primary/60">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                </div>
                <div className="flex-1">
                    <input
                        className="w-full bg-transparent border-none p-0 text-lg font-body text-ink placeholder:text-pencil focus:ring-0 focus:outline-none"
                        placeholder="Add a new entry..."
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleAddItem}
                    />
                </div>
            </div>
        </section>

        {/* Habits */}
        <section className="mt-8 pt-6 border-t border-wood-light/30">
            <h3 className="font-handwriting text-sm text-pencil mb-4">Daily Rituals</h3>
            <div className="flex flex-wrap gap-6">
                {habits.map(habit => {
                    const isCompleted = habit.completedDates.includes(todayStr);
                    let colorClass = 'bg-primary';
                    if (habit.color === 'sage') colorClass = 'bg-sage';
                    if (habit.color === 'accent') colorClass = 'bg-accent';
                    if (habit.color === 'tension') colorClass = 'bg-rose';

                    return (
                        <button
                            key={habit.id}
                            onClick={() => toggleHabit(habit.id, todayStr)}
                            className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
                        >
                            <div className={`relative size-8 rounded-full border flex items-center justify-center transition-all ${isCompleted ? `border-${habit.color === 'primary' ? 'primary' : habit.color}` : 'border-pencil/30 bg-transparent group-hover:bg-wood-light'}`}>
                                <div className={`size-8 rounded-full flex items-center justify-center text-white transition-transform duration-300 ${isCompleted ? `${colorClass} scale-100` : 'scale-0'}`}>
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                </div>
                            </div>
                            <span className={`text-xs font-mono font-medium ${isCompleted ? 'text-primary' : 'text-pencil group-hover:text-ink'}`}>{habit.name}</span>
                        </button>
                    );
                })}
            </div>
        </section>

        {/* Page Corner Fold */}
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-background-light/10 to-transparent pointer-events-none rounded-br-sm"></div>
      </article>

      {/* Sidebar Actions */}
      <aside className="hidden xl:flex flex-col gap-4 fixed right-10 top-32 w-16 items-center">
        <div className="group relative">
            <Link to="/flow" className="size-12 rounded-full bg-paper shadow-md hover:shadow-lg border border-wood-light/50 flex items-center justify-center text-ink hover:text-primary transition-all hover:-translate-y-1">
                <span className="material-symbols-outlined">calendar_view_day</span>
            </Link>
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink bg-paper px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Back to Flow</span>
        </div>
        <div className="group relative">
            <Link to="/migration" className="size-12 rounded-full bg-paper shadow-md hover:shadow-lg border border-wood-light/50 flex items-center justify-center text-ink hover:text-tension transition-all hover:-translate-y-1">
                <span className="material-symbols-outlined">inbox</span>
            </Link>
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink bg-paper px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Migration Station</span>
        </div>
      </aside>
    </div>
  );
}
