import type { RapidLogEntry } from '../../context/AppContext';
import { formatTime12 } from './types';

export default function EventCard({ entry, onOpenDetail }: { entry: RapidLogEntry; onOpenDetail?: () => void }) {
  return (
    <div
      className="bg-background-light/80 border border-sage/20 p-3 rounded shadow-soft flex items-start gap-2.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lifted transition-all group"
      onClick={() => onOpenDetail?.()}
    >
      <span className="material-symbols-outlined text-[18px] text-sage mt-0.5 shrink-0">circle</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-ink leading-snug group-hover:text-primary/80 transition-colors">{entry.title}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {entry.time && (
            <span className="text-[12px] font-mono text-sage bg-sage/10 px-1.5 py-0.5 rounded">
              {formatTime12(entry.time)}
            </span>
          )}
          {entry.duration && (
            <span className="text-[12px] font-mono text-pencil">{entry.duration}</span>
          )}
          {entry.description && (
            <span className="text-pencil/40"><span className="material-symbols-outlined text-[12px]">description</span></span>
          )}
        </div>
      </div>
    </div>
  );
}
