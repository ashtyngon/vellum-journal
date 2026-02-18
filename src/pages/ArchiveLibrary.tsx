import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function ArchiveLibrary() {
  const { journalEntries } = useApp();

  // Group entries by Year -> Month
  const collections = useMemo(() => {
    const groups: Record<string, Record<string, number>> = {};

    journalEntries.forEach(entry => {
      const date = new Date(entry.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();

      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = 0;
      groups[year][month]++;
    });

    return groups;
  }, [journalEntries]);

  const monthColors: Record<string, string> = {
    'JAN': 'bg-[#2c3e50]', 'FEB': 'bg-[#8e44ad]', 'MAR': 'bg-primary',
    'APR': 'bg-[#27ae60]', 'MAY': 'bg-[#c0392b]', 'JUN': 'bg-[#7f8c8d]',
    'JUL': 'bg-[#d35400]', 'AUG': 'bg-[#16a085]', 'SEP': 'bg-[#f39c12]',
    'OCT': 'bg-[#e67e22]', 'NOV': 'bg-[#bdc3c7]', 'DEC': 'bg-[#2980b9]'
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 md:px-8 py-8 gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-wood-light/50">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl md:text-5xl tracking-tight font-header italic">The Archive Vault</h2>
          <p className="text-ink-light text-lg font-handwriting">Your library of past wins and memories.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative group w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-ink-light">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 bg-surface-light/50 border-none rounded-lg text-ink placeholder-ink-light focus:ring-2 focus:ring-primary transition-all shadow-inner font-body text-sm"
              placeholder="Search memories, tags..."
              type="text"
            />
          </div>
          <button className="flex items-center justify-center gap-2 bg-surface-light/50 px-4 py-2.5 rounded-lg text-ink hover:bg-wood-light transition-colors font-body text-sm font-medium shadow-sm">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-12 mt-4">
        {Object.entries(collections).reverse().map(([year, months]) => (
          <div key={year} className="flex flex-col">
            <div className="flex items-center gap-3 mb-1 px-2">
              <h3 className="text-2xl font-bold font-header italic">{year} Collection</h3>
              <span className="h-px flex-1 bg-wood-light"></span>
              <span className="text-sm font-handwriting text-ink-light bg-surface-light px-2 py-0.5 rounded">
                {Object.values(months).reduce((a, b) => a + b, 0)} Entries
              </span>
            </div>

            <div className="relative bg-wood-texture rounded-lg pt-8 px-8 pb-3 shadow-shelf border-t-8 border-[#e0d6cc]">
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10"></div>

              <div className="flex flex-wrap items-end gap-x-2 gap-y-8 md:gap-x-6 relative z-10 min-h-[240px]">
                {Object.entries(months).map(([month, count]) => (
                  <div key={month} className="group relative flex flex-col items-center cursor-pointer transition-transform duration-200 hover:-translate-y-2 hover:z-10 w-12 md:w-16">
                    <div className={`relative h-48 md:h-56 w-full rounded-sm ${monthColors[month] || 'bg-primary'} shadow-book flex flex-col justify-between py-4 border-l border-white/10 overflow-hidden`}>
                      <div className="spine-ridge h-full w-2 absolute left-1 top-0 opacity-30"></div>

                      {/* Decorative Spine Elements based on Month */}
                      {month === 'JAN' && <div className="w-full h-8 border-y border-[#ffd700]/30 mt-4"></div>}
                      {month === 'FEB' && <div className="mt-auto mb-4 mx-auto"><span className="material-symbols-outlined text-white/50 text-xl">favorite</span></div>}
                      {month === 'APR' && (
                        <>
                           <div className="w-full h-px bg-[#f1c40f] absolute top-10"></div>
                           <div className="w-full h-px bg-[#f1c40f] absolute top-12"></div>
                           <div className="w-full h-px bg-[#f1c40f] absolute bottom-12"></div>
                           <div className="w-full h-px bg-[#f1c40f] absolute bottom-10"></div>
                        </>
                      )}

                      <span className="text-white font-header text-lg md:text-xl font-bold tracking-widest rotate-180 writing-mode-vertical mx-auto drop-shadow-md py-2">
                        {month}
                      </span>

                      <div className="mt-auto mx-auto size-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shadow-inner" title={`${count} Entries`}>
                        {count}
                      </div>
                    </div>
                    <div className="absolute -bottom-3 w-full h-2 bg-black/20 rounded-full blur-sm group-hover:blur-md group-hover:w-[90%] transition-all"></div>
                  </div>
                ))}

                {/* Placeholder/Empty Slots visual */}
                {Object.keys(months).length < 12 && Array.from({ length: 3 }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-2 md:w-4 h-48 md:h-56 bg-black/5 rounded-sm transform skew-x-1 opacity-20"></div>
                ))}

              </div>

              <div className="h-6 w-full bg-[#d0c0b0] mt-0 rounded-b-sm shadow-md flex items-center justify-center relative z-10">
                <div className="w-[98%] h-2 bg-[#bda895] rounded-full opacity-30 mt-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
