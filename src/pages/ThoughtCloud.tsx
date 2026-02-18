import { useState, useRef, type MouseEvent } from 'react';
import { useApp } from '../context/AppContext';

interface Thought {
  id: string;
  x: number;
  y: number;
  content: string;
  type: 'text' | 'image';
  color?: string;
  rotation?: number;
}

export default function ThoughtCloud() {
  const { addTask, addJournalEntry } = useApp();
  const [thoughts, setThoughts] = useState<Thought[]>([
    { id: '1', x: 25, y: 30, content: 'Prepare email marketing sequence for next week.', type: 'text', color: 'bg-amber-400' },
    { id: '2', x: 70, y: 65, content: 'Buy coffee beans', type: 'text', color: 'bg-indigo-300' },
    { id: '3', x: 65, y: 25, content: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFApkJ7KNm7wIHE2I_8r0BnDx5zQE3uc523dm5q7s5rAbugzDG2gpXr3nFF8wJNb8276helulaS_BdoXM3eva86GhM5InCarc7tVawYImrAw5btdRAQZfUZFym0aBaJwpiwfC4jTuR9FMubEHtoBwEUwUjUAg9UGIFxLf66y5DpajqIONwmwWjRjLFm4qIfv7PtndISEvxDwHGbRfpdcBkRqxwS3FFMC0ZyGZAspsE0DAPqZGkN0Sp_fLmaRE2GnOkiznMyQB5-s4', type: 'image' },
  ]);
  const [anchorThought, setAnchorThought] = useState("Launch Project Beta");

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newThought: Thought = {
      id: Date.now().toString(),
      x,
      y,
      content: '',
      type: 'text',
      color: 'bg-stone-200'
    };
    setThoughts([...thoughts, newThought]);
  };

  const handleConvertToTask = () => {
    addTask({
      id: Date.now().toString(),
      title: anchorThought,
      status: 'todo',
      date: new Date().toISOString().split('T')[0],
      movedCount: 0,
      priority: 'medium'
    });
    alert("Converted to Task!");
  };

  const handleConvertToJournal = () => {
    addJournalEntry({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      content: anchorThought,
      tags: ['Brain Dump']
    });
    alert("Added to Journal!");
  };

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-64px)] overflow-hidden bg-vellum-texture cursor-grab active:cursor-grabbing group/canvas" ref={containerRef} onDoubleClick={handleDoubleClick}>
      {/* Background SVG Pencils */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
        <defs>
          <filter id="pencilTexture">
            <feTurbulence baseFrequency="1.2" numOctaves="3" result="noise" type="fractalNoise"></feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"></feDisplacementMap>
          </filter>
        </defs>
        <path className="dark:stroke-stone-600 path-draw" d="M 50% 50% Q 30% 40% 25% 30%" fill="none" filter="url(#pencilTexture)" stroke="#a8a29e" strokeLinecap="round" strokeWidth="1.5"></path>
        <path className="dark:stroke-stone-600 path-draw" d="M 50% 50% Q 65% 60% 70% 65%" fill="none" filter="url(#pencilTexture)" stroke="#a8a29e" strokeLinecap="round" strokeWidth="1.5" style={{ animationDelay: '0.2s' }}></path>
      </svg>

      {/* Anchor Thought */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative group">
          <div className="absolute -inset-2 rounded-[2rem] bg-primary/10 blur-md animate-focus-pulse"></div>
          <div className="absolute -top-8 left-0 -rotate-2 text-primary font-handwriting text-lg opacity-80">Start here!</div>
          <div className="relative bg-paper dark:bg-stone-800 rounded-2xl p-6 shadow-vellum-card w-[340px] border border-wood-light transition-all duration-300 transform hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-lg font-header italic text-primary px-1">Anchor Thought</span>
              <button className="text-pencil hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>
            </div>
            <textarea
              className="w-full bg-transparent border-none p-1 text-2xl font-header italic text-ink focus:ring-0 resize-none h-20 placeholder-pencil leading-snug"
              placeholder="What's on your mind?"
              value={anchorThought}
              onChange={(e) => setAnchorThought(e.target.value)}
            />
            <div className="flex gap-3 mt-4 pt-3 border-t border-dashed border-wood-light opacity-100 transition-opacity">
              <button onClick={handleConvertToTask} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-background-light hover:bg-orange-50 hover:text-primary text-xs font-medium text-pencil transition-colors border border-wood-light">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span className="font-sans">Make Task</span>
              </button>
              <button onClick={handleConvertToJournal} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-background-light hover:bg-orange-50 hover:text-primary text-xs font-medium text-pencil transition-colors border border-wood-light">
                <span className="material-symbols-outlined text-[16px]">book</span>
                <span className="font-sans">Journal It</span>
              </button>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-wood-light cursor-grab active:cursor-grabbing hover:bg-primary/50 transition-colors"></div>
          </div>
        </div>
      </div>

      {/* Floating Thoughts */}
      {thoughts.map((thought) => (
        <div
            key={thought.id}
            className="absolute z-10"
            style={{ top: `${thought.y}%`, left: `${thought.x}%`, transform: 'translate(-50%, -50%)' }}
        >
            {thought.type === 'text' ? (
                <div className="bg-paper dark:bg-stone-800 rounded-xl p-5 shadow-vellum-card w-[200px] border border-wood-light hover:border-primary/30 transition-all duration-200">
                     <div className="flex items-start gap-3">
                        <div className={`mt-1.5 size-2.5 rounded-full ${thought.color} shrink-0 shadow-sm`}></div>
                        {thought.content ? (
                            <p className="text-[15px] font-medium font-handwriting text-ink leading-relaxed">{thought.content}</p>
                        ) : (
                            <textarea
                                autoFocus
                                className="w-full bg-transparent border-none p-0 text-[15px] font-handwriting text-ink focus:ring-0 resize-none h-auto placeholder-pencil leading-relaxed"
                                placeholder="New thought..."
                                onBlur={(e) => {
                                    if (!e.target.value.trim()) {
                                        setThoughts(thoughts.filter(t => t.id !== thought.id));
                                    } else {
                                        setThoughts(thoughts.map(t => t.id === thought.id ? { ...t, content: e.target.value } : t));
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-paper dark:bg-stone-800 rounded-xl p-2.5 shadow-vellum-card w-[180px] border border-wood-light hover:border-primary/30 transition-all duration-200">
                    <div className="w-full h-24 rounded-lg bg-background-light mb-2 overflow-hidden relative shadow-inner">
                        <img src={thought.content} alt="Inspiration" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 sepia-[.2]" />
                    </div>
                    <p className="text-sm font-handwriting text-center text-pencil px-2 pb-1">Workspace Vibe</p>
                </div>
            )}
        </div>
      ))}

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-pencil text-2xl font-header italic pointer-events-none select-none opacity-60">
         Double-click anywhere to spawn a thought...
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2 bg-paper/90 rounded-full shadow-vellum-card border border-wood-light backdrop-blur-sm">
          <button className="size-12 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 group relative">
            <span className="material-symbols-outlined text-[28px]">add</span>
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-ink text-white text-xs font-sans py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">New Bubble</span>
          </button>
          <div className="w-px h-6 bg-wood-light mx-1"></div>
          <button className="size-10 rounded-full hover:bg-background-light text-ink flex items-center justify-center transition-colors group relative">
            <span className="material-symbols-outlined text-[20px]">pan_tool</span>
          </button>
          <button className="size-10 rounded-full hover:bg-background-light text-ink flex items-center justify-center transition-colors group relative">
            <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
          </button>
          <div className="w-px h-6 bg-wood-light mx-1"></div>
          <button className="size-10 rounded-full hover:bg-background-light text-ink flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
          <span className="text-sm font-medium font-display text-pencil w-10 text-center select-none">100%</span>
          <button className="size-10 rounded-full hover:bg-background-light text-ink flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </div>

      <div className="absolute top-24 right-6 flex items-center gap-2 px-4 py-2 bg-paper/60 rounded-lg backdrop-blur text-xs font-medium text-pencil border border-wood-light">
        <span className="material-symbols-outlined text-[16px] animate-pulse text-emerald-500">cloud_done</span>
        <span className="font-sans">All changes saved</span>
      </div>
    </div>
  );
}
