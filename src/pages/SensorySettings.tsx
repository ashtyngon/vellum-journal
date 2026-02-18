import { useApp } from '../context/AppContext';

export default function SensorySettings() {
  const { settings, updateSettings } = useApp();

  return (
    <div className="flex flex-col lg:flex-row flex-1 max-w-[1440px] mx-auto w-full p-4 lg:p-12 gap-12">
      <main className="flex-1 flex flex-col gap-10 max-w-3xl">
        <div className="flex flex-col gap-3 pb-4 border-b border-wood-light">
          <h1 className="text-4xl md:text-5xl font-header italic text-ink">Sensory Profile</h1>
          <p className="text-ink-light text-lg font-light font-body">Tune your environment for focus and comfort. Changes save automatically.</p>
        </div>

        <div className="grid gap-8">
          {/* Paper Feel */}
          <section className="bg-surface-light/60 rounded-xl p-8 shadow-paper border border-wood-light backdrop-blur-sm transition-all hover:shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-bronze text-2xl">texture</span>
              <h2 className="text-xl font-header italic font-semibold text-ink">Paper Feel</h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="font-medium text-ink font-display">Grain Intensity</label>
                <span className="text-sm font-handwriting text-sage font-bold bg-sage/10 px-3 py-1 rounded-md">{settings.paperTexture}%</span>
              </div>
              <div className="relative h-6 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.paperTexture}
                  onChange={(e) => updateSettings({ paperTexture: parseInt(e.target.value) })}
                  className="w-full z-10 accent-bronze h-1 bg-wood-light rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <p className="text-sm text-ink-light italic">Adjust the texture opacity to reduce visual noise.</p>
            </div>
          </section>

          {/* Ink Choice */}
          <section className="bg-surface-light/60 rounded-xl p-8 shadow-paper border border-wood-light backdrop-blur-sm transition-all hover:shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-bronze text-2xl">ink_pen</span>
              <h2 className="text-xl font-header italic font-semibold text-ink">Ink Choice</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'navy', label: 'Navy Blue', color: 'bg-ink-navy' },
                { id: 'sepia', label: 'Warm Sepia', color: 'bg-ink-sepia' },
                { id: 'charcoal', label: 'Charcoal', color: 'bg-ink-charcoal' },
              ].map((ink) => (
                <label key={ink.id} className="cursor-pointer group relative">
                  <input
                    type="radio"
                    name="ink"
                    className="peer sr-only"
                    checked={settings.inkColor === ink.id}
                    onChange={() => updateSettings({ inkColor: ink.id as any })}
                  />
                  <div className="p-5 rounded-lg border-2 border-wood-light bg-surface-light peer-checked:border-sage peer-checked:bg-sage/5 hover:border-bronze/40 transition-all flex flex-col items-center gap-4 shadow-sm selection-ring">
                    <div className={`size-14 rounded-full ${ink.color} shadow-inner ring-4 ring-wood-light peer-checked:ring-sage/30`}></div>
                    <span className="font-header italic text-lg text-ink">{ink.label}</span>
                  </div>
                  <div className="absolute top-3 right-3 text-sage opacity-0 peer-checked:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Audio Feedback */}
          <section className="bg-surface-light/60 rounded-xl p-8 shadow-paper border border-wood-light backdrop-blur-sm transition-all hover:shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-bronze text-2xl">headphones</span>
              <h2 className="text-xl font-header italic font-semibold text-ink">Audio Feedback</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
               {[
                { id: 'mechanical', label: 'Mechanical', sub: 'Clicky & Tactile', icon: 'keyboard' },
                { id: 'pencil', label: 'Pencil', sub: 'Soft scratching', icon: 'edit' },
                { id: 'silence', label: 'Silence', sub: 'No distractions', icon: 'volume_off' },
              ].map((sound) => (
                <label key={sound.id} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="sound"
                    className="peer sr-only"
                    checked={settings.sound === sound.id}
                    onChange={() => updateSettings({ sound: sound.id as any })}
                  />
                  <div className="h-full p-4 rounded-lg border border-wood-light bg-background-light/50 peer-checked:bg-sage peer-checked:text-white peer-checked:border-sage transition-all flex items-center gap-3 hover:border-bronze/30 shadow-sm">
                    <span className="material-symbols-outlined">{sound.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-header italic font-bold text-lg">{sound.label}</span>
                      <span className="text-xs opacity-80 font-display">{sound.sub}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Gentle Reminders */}
          <section className="bg-surface-light/60 rounded-xl p-8 shadow-paper border border-wood-light backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:shadow-card">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-sky-100 text-sky-700 mt-1">
                <span className="material-symbols-outlined text-xl">mindfulness</span>
              </div>
              <div>
                <h2 className="text-xl font-header italic font-semibold text-ink">Gentle Reminders</h2>
                <p className="text-ink-light text-sm max-w-xs mt-1">Nudges to take a breath or stretch during long sessions.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-light p-2 rounded-lg border border-wood-light shadow-sm">
              <button
                className="size-9 flex items-center justify-center rounded bg-background-light text-ink-light hover:text-bronze hover:bg-wood-light shadow-sm border border-wood-light transition-colors"
                onClick={() => updateSettings({ reminderInterval: Math.max(5, settings.reminderInterval - 5) })}
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <div className="flex flex-col items-center px-4 min-w-[100px]">
                <span className="font-header italic text-xl font-bold text-ink">{settings.reminderInterval} mins</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold font-display">Frequency</span>
              </div>
              <button
                className="size-9 flex items-center justify-center rounded bg-background-light text-ink-light hover:text-bronze hover:bg-wood-light shadow-sm border border-wood-light transition-colors"
                onClick={() => updateSettings({ reminderInterval: settings.reminderInterval + 5 })}
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Live Preview Sidebar */}
      <aside className="hidden lg:block w-96 shrink-0">
        <div className="sticky top-28 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-bronze">Live Preview</h3>
            <div className="flex items-center gap-2 text-xs text-sage font-bold font-mono uppercase">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sage"></span>
               </span>
               Updating
            </div>
          </div>

          <div className="relative w-full aspect-[3/4] bg-paper rounded-sm shadow-xl border-t border-b border-l border-wood-light overflow-hidden transform transition-all duration-500 hover:rotate-1 hover:scale-[1.01] origin-top-left">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-wood-light/50 to-transparent z-20 pointer-events-none"></div>
            <div className="absolute left-2 top-0 bottom-0 w-px border-l border-dashed border-ink-light/30 z-20"></div>
            <div className="absolute inset-0 bg-grain z-0 pointer-events-none mix-blend-multiply" style={{ opacity: settings.paperTexture / 100 * 0.2 }}></div>

            <div className="relative z-10 py-10 pl-12 pr-8 flex flex-col h-full">
               <div className="flex justify-between items-start mb-10 opacity-70">
                  <span className={`text-xs font-handwriting text-lg font-bold ${settings.inkColor === 'navy' ? 'text-ink-navy' : settings.inkColor === 'sepia' ? 'text-ink-sepia' : 'text-ink-charcoal'}`}>Oct 24th</span>
                  <span className={`material-symbols-outlined text-xl ${settings.inkColor === 'navy' ? 'text-ink-navy' : settings.inkColor === 'sepia' ? 'text-ink-sepia' : 'text-ink-charcoal'}`}>bookmark</span>
               </div>

               <div className={`font-body text-2xl leading-relaxed ${settings.inkColor === 'navy' ? 'text-ink-navy' : settings.inkColor === 'sepia' ? 'text-ink-sepia' : 'text-ink-charcoal'}`}>
                  <p className="mb-6 first-letter:text-5xl first-letter:font-header first-letter:italic first-letter:mr-1 first-letter:float-left first-letter:leading-none">
                    Today I focused on the small things.
                  </p>
                  <p className="mb-6">
                    The morning coffee was perfect. I managed to clear my inbox by noon.
                  </p>
                  <p className="italic text-xl opacity-90">It's a good day.</p>
               </div>

               <div className="mt-auto pt-6 border-t border-ink-light/10">
                  <div className={`flex items-center gap-3 text-sm font-handwriting text-lg ${settings.inkColor === 'navy' ? 'text-ink-navy' : settings.inkColor === 'sepia' ? 'text-ink-sepia' : 'text-ink-charcoal'} opacity-70`}>
                     <span className="material-symbols-outlined text-lg">check_circle</span>
                     <span>3 tasks completed</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-surface-light/50 border border-wood-light p-4 rounded-lg flex items-start gap-3 mt-4 backdrop-blur-sm">
             <span className="material-symbols-outlined text-sage mt-0.5">info</span>
             <p className="text-sm text-ink-light leading-relaxed font-display">
                This preview reflects your choices in real-time. Notice how the texture interacts with the <span className="font-bold text-bronze">Crimson Pro</span> serif font.
             </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
