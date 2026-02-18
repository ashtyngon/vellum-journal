import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

interface ScrapbookItem {
  id: string;
  type: 'task' | 'habit' | 'memory';
  date: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  image: string;
  content: string;
  rotation: string;
}

export default function CelebrationScrapbook() {
  const { tasks, habits, journalEntries } = useApp();
  const [filter, setFilter] = useState<'all' | 'memories' | 'tasks' | 'habits'>('all');

  const items = useMemo(() => {
    const allItems: ScrapbookItem[] = [];

    // Add Completed Tasks
    tasks.filter(t => t.status === 'done').forEach(t => {
      allItems.push({
        id: `t-${t.id}`,
        type: 'task',
        date: t.date,
        title: t.title,
        subtitle: 'Completed Task',
        icon: 'check_circle',
        color: 'text-primary',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRGkl1yv3wu-j9qHZBMjLxFA07DrEzeVioC4IMVX9CjQSDSqbHDA1GH7-WkoDKLb0rFrkSCwqGmjr3tkVyHabrS4p3sGIBi7N4smWlH0fBa6A_2Yyjhozk9CK8DfVCngZaR9vUt1kKiP4TCataio3Jg6sbsRzEKHRqkdnapud73FwlBz4kSBBZsWudSaVvQI2upBb4QQg9XkexqcjWVMPLeI9Kd5jqc3LROUL7AvYtVClOYxXB0jeO8VJBSvsOPYiisup9rdTkzJA',
        content: 'Wrapped up the project ahead of schedule.',
        rotation: 'rotate-1'
      });
    });

    // Add Habits with streaks
    habits.filter(h => h.streak > 3).forEach(h => {
      allItems.push({
        id: `h-${h.id}`,
        type: 'habit',
        date: 'Current Streak',
        title: `${h.streak} Day Streak!`,
        subtitle: h.name,
        icon: 'self_improvement',
        color: 'text-green-600',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjP7gelXuBn9IWB6ShkkC1E9_Nwsotl6HEw0DRHru6v9WW_FCtmYof5eQGiQ8nIYLvso7_z_0a9YkJ8NlVPG4gQi5AfBmMvLEd72fsPPcvn7y6UkhCZ5iL1VQ7j9NvBUbMa_PytyNuJnmsy2pejDTNYGzwUDCo6hvkw5qJvCME_LMcYvzijWT9pNedB4ZZl-Na9ze2nSCB92frvq4Pqr9dVV6bqgXye19pAo9LrEiNOSh_9Wr_OeArhas5htgNM32ajpQzcRrFzdQ',
        content: `Keeping up with ${h.name}.`,
        rotation: '-rotate-2'
      });
    });

    // Add Journal Entries with wins
    journalEntries.forEach(j => {
      allItems.push({
        id: `j-${j.id}`,
        type: 'memory',
        date: j.date,
        title: j.title || 'Journal Entry',
        subtitle: 'Reflection',
        icon: 'auto_stories',
        color: 'text-pink-500',
        image: j.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI7wiQtuxPdKm5LK391qlmRpxIX18KnF5GzV7-UErw_IUUD4DNS7vUTxbz8kr4lrbjeu0iauVPpXlipE3YiVAceYXo4amKdmVkTEsIgr-TByK5SSF1hrhsm2ThFdn2FcqxHSXr1pmh_mnnlIno9cpBY8XRf0Nl4raLdjiPZLCSrFRa-sxYq0Z9F8G9FAb2-Eg3sk2_SUh-CT7dJ8SRlH4877APBasTLdGCHCEM1nHS8eH11njY95EplrTBKT5hCnBISiZPOciP31M',
        content: j.content,
        rotation: 'rotate-[-1deg]'
      });
    });

    return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks, habits, journalEntries]);

  const filteredItems = filter === 'all' ? items : items.filter(i => i.type === (filter === 'memories' ? 'memory' : filter === 'tasks' ? 'task' : 'habit'));

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-background-cream min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide mb-3 font-display">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Progress Tracker
          </div>
          <h2 className="text-5xl md:text-6xl font-normal text-ink tracking-tight mb-3 font-header italic">
             My Small Wins Gallery
          </h2>
          <p className="text-lg text-ink-light leading-relaxed font-handwriting">
             Look how far you've come. This is a safe space to collect your victories, no matter how small.
          </p>
        </div>
        <button className="group relative flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-1 overflow-hidden font-display">
          <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
          <span className="material-symbols-outlined text-2xl animate-bounce">celebration</span>
          <span className="font-bold text-lg">Throw Confetti</span>
        </button>
      </div>

      <div className="sticky top-20 z-40 bg-background-cream/95 backdrop-blur-sm py-4 mb-8 border-b border-dashed border-vellum/80 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:static">
        <div className="flex flex-wrap items-center gap-3 font-display">
          <button onClick={() => setFilter('all')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform active:scale-95 ${filter === 'all' ? 'bg-ink text-white shadow-md' : 'bg-white border border-vellum text-ink hover:border-primary/30 hover:bg-primary/5'}`}>
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            <span className="text-sm font-medium">All Memories</span>
          </button>
          <button onClick={() => setFilter('tasks')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform active:scale-95 ${filter === 'tasks' ? 'bg-ink text-white shadow-md' : 'bg-white border border-vellum text-ink hover:border-primary/30 hover:bg-primary/5'}`}>
            <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
            <span className="text-sm font-medium">Completed Tasks</span>
          </button>
          <button onClick={() => setFilter('memories')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform active:scale-95 ${filter === 'memories' ? 'bg-ink text-white shadow-md' : 'bg-white border border-vellum text-ink hover:border-primary/30 hover:bg-primary/5'}`}>
            <span className="material-symbols-outlined text-[18px] text-pink-500">favorite</span>
            <span className="text-sm font-medium">Reflections</span>
          </button>
          <button onClick={() => setFilter('habits')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform active:scale-95 ${filter === 'habits' ? 'bg-ink text-white shadow-md' : 'bg-white border border-vellum text-ink hover:border-primary/30 hover:bg-primary/5'}`}>
            <span className="material-symbols-outlined text-[18px] text-blue-500">water_drop</span>
            <span className="text-sm font-medium">Habits</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
        {filteredItems.map((item, index) => (
          <div key={item.id} className={`relative group perspective-1000 ${index % 3 === 0 ? 'mt-0' : index % 3 === 1 ? 'mt-8' : 'mt-12'}`}>
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-primary/20 ${index % 2 === 0 ? 'rotate-[-2deg]' : 'rotate-[2deg]'} z-20 washi-tape opacity-80`}></div>
            <div className={`polaroid-card relative p-3 pb-8 rounded-sm shadow-polaroid cursor-pointer h-full flex flex-col ${item.rotation} group-hover:rotate-0 transition-transform duration-300`}>
              <div className="aspect-square w-full bg-vellum mb-4 overflow-hidden rounded-sm relative shadow-inner">
                {item.image ? (
                   <img src={item.image} alt={item.title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-pink-300">favorite</span>
                    </div>
                )}
                <div className={`absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm ${item.color}`}>
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
              </div>
              <div className="px-2 flex flex-col flex-1">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-light font-display">{item.subtitle}</span>
                  <span className="text-xs text-ink-light/70 font-display">{item.date}</span>
                </div>
                <h3 className="text-2xl font-normal text-ink leading-tight mb-3 group-hover:text-primary transition-colors font-header italic">{item.title}</h3>
                <p className="text-lg text-ink-light line-clamp-2 mt-auto handwriting leading-snug">{item.content}</p>
              </div>
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="material-symbols-outlined text-yellow-400 text-2xl animate-bounce">spark</span>
              </div>
            </div>
          </div>
        ))}

        <div className="relative group perspective-1000 flex flex-col h-full min-h-[300px] mt-8">
            <div className="border-2 border-dashed border-vellum rounded-sm h-full w-full flex flex-col items-center justify-center p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group-hover:scale-[1.02]">
                <div className="w-16 h-16 rounded-full bg-vellum flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-ink-light group-hover:text-primary transition-colors">add</span>
                </div>
                <h3 className="text-2xl font-normal text-ink mb-1 font-header italic">Add a Small Win</h3>
                <p className="text-lg text-ink-light handwriting leading-snug">Capture a moment of gratitude or a completed task.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
