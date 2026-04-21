import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useApp } from '../context/AppContext';

/* ══════════════════════════════════════════════════════════════════════
   DataRecovery — Hidden admin page for inspecting and recovering data.
   Access via /recover route.
   ══════════════════════════════════════════════════════════════════════ */

interface MonthGroup {
  year: string;
  month: string;
  count: number;
  entries: { id: string; title: string; date: string; type: string; status?: string; deletedAt?: string }[];
}

function groupByMonth(entries: Array<{ id: string; title?: string; date: string; type?: string; status?: string; deletedAt?: string }>): MonthGroup[] {
  const groups: Record<string, MonthGroup> = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) {
      groups[key] = {
        year: d.getFullYear().toString(),
        month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
        count: 0,
        entries: [],
      };
    }
    groups[key].count++;
    groups[key].entries.push({
      id: e.id,
      title: e.title || '(untitled)',
      date: e.date,
      type: e.type || 'unknown',
      status: e.status,
      deletedAt: e.deletedAt,
    });
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export default function DataRecovery() {
  const app = useApp();
  const [firestoreData, setFirestoreData] = useState<Record<string, unknown> | null>(null);
  const [firestoreEntries, setFirestoreEntries] = useState<MonthGroup[]>([]);
  const [firestoreJournals, setFirestoreJournals] = useState<MonthGroup[]>([]);
  const [walData, setWalData] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const uid = auth.currentUser?.uid;

  const loadFirestore = async () => {
    if (!uid) { setStatus('Not logged in'); return; }
    setLoading(true);
    setStatus('Loading from Firestore...');
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) {
        setStatus('No Firestore document found for this user.');
        setLoading(false);
        return;
      }
      const data = snap.data();
      setFirestoreData(data);

      const entries = (data.entries || data.tasks || []) as Array<{ id: string; title?: string; date: string; type?: string; status?: string; deletedAt?: string }>;
      const journals = (data.journalEntries || []) as Array<{ id: string; title?: string; date: string; type?: string; status?: string; deletedAt?: string }>;

      setFirestoreEntries(groupByMonth(entries));
      setFirestoreJournals(groupByMonth(journals));

      const totalEntries = entries.length;
      const deletedEntries = entries.filter(e => e.deletedAt).length;
      const activeEntries = totalEntries - deletedEntries;

      setStatus(`Firestore: ${totalEntries} entries (${activeEntries} active, ${deletedEntries} soft-deleted), ${journals.length} journal entries. Updated: ${data.updatedAt || 'unknown'}`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
    setLoading(false);
  };

  const loadWal = () => {
    const raw = localStorage.getItem('vellum-wal');
    if (!raw) {
      setWalData(null);
      setStatus('No WAL data in localStorage.');
      return;
    }
    setWalData(raw);
    try {
      const parsed = JSON.parse(raw);
      const entryCount = parsed.entries?.length || 0;
      const journalCount = parsed.journalEntries?.length || 0;
      setStatus(`WAL: ${entryCount} entries, ${journalCount} journals. Timestamp: ${new Date(parsed.ts).toISOString()}`);
    } catch {
      setStatus('WAL exists but failed to parse.');
    }
  };

  const clearWalAndReload = () => {
    localStorage.removeItem('vellum-wal');
    setStatus('WAL cleared. Refresh the page to force-load from Firestore.');
  };

  // Compare current app state vs Firestore
  const appEntries = groupByMonth(app.entries);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="font-header italic text-3xl text-ink">Data Recovery</h1>
      <p className="text-pencil text-sm">UID: {uid || 'not logged in'}</p>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={loadFirestore} disabled={loading} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
          Load from Firestore
        </button>
        <button onClick={loadWal} className="px-4 py-2 bg-sage/10 text-sage rounded-lg text-sm font-medium hover:bg-sage/20 transition-colors">
          Check WAL
        </button>
        <button onClick={clearWalAndReload} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
          Clear WAL (force Firestore reload)
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className="p-4 rounded-lg bg-surface-light border border-wood-light/20 text-sm text-ink font-mono whitespace-pre-wrap">
          {status}
        </div>
      )}

      {/* Current app state */}
      <div className="space-y-3">
        <h2 className="font-header italic text-xl text-ink">Current App State (what you see)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {appEntries.map(g => (
            <div key={`app-${g.year}-${g.month}`} className="p-3 rounded-lg bg-surface-light border border-wood-light/15 text-sm">
              <span className="font-mono text-pencil">{g.month} {g.year}</span>
              <span className="ml-2 font-bold text-ink">{g.count}</span>
            </div>
          ))}
          {appEntries.length === 0 && <p className="text-pencil text-sm col-span-4">No entries in app state.</p>}
        </div>
      </div>

      {/* Firestore data */}
      {firestoreEntries.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-header italic text-xl text-ink">Firestore Entries (by month)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {firestoreEntries.map(g => {
              const deleted = g.entries.filter(e => e.deletedAt).length;
              return (
                <div key={`fs-${g.year}-${g.month}`} className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-sm">
                  <span className="font-mono text-pencil">{g.month} {g.year}</span>
                  <span className="ml-2 font-bold text-ink">{g.count}</span>
                  {deleted > 0 && <span className="ml-1 text-red-400 text-xs">({deleted} deleted)</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {firestoreJournals.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-header italic text-xl text-ink">Firestore Journal Entries (by month)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {firestoreJournals.map(g => (
              <div key={`fsj-${g.year}-${g.month}`} className="p-3 rounded-lg bg-sage/5 border border-sage/15 text-sm">
                <span className="font-mono text-pencil">{g.month} {g.year}</span>
                <span className="ml-2 font-bold text-ink">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Firestore entry list (expandable) */}
      {firestoreEntries.length > 0 && (
        <details className="space-y-2">
          <summary className="cursor-pointer font-body text-sm text-primary font-medium">Show all Firestore entries (detailed)</summary>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 mt-3">
            {firestoreEntries.map(g => (
              <div key={`detail-${g.year}-${g.month}`}>
                <h3 className="font-mono text-sm text-pencil mb-2">{g.month} {g.year} ({g.count})</h3>
                <div className="space-y-1 pl-3 border-l-2 border-wood-light/20">
                  {g.entries.map(e => (
                    <div key={e.id} className={`text-xs font-mono ${e.deletedAt ? 'text-red-400 line-through' : 'text-ink/70'}`}>
                      [{e.type}] {e.date} — {e.title} {e.status ? `(${e.status})` : ''} {e.deletedAt ? `🗑 ${e.deletedAt}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Raw Firestore JSON */}
      {firestoreData && (
        <details className="space-y-2">
          <summary className="cursor-pointer font-body text-sm text-primary font-medium">Raw Firestore document</summary>
          <pre className="text-xs font-mono text-ink/60 bg-surface-light p-4 rounded-lg overflow-auto max-h-[50vh] border border-wood-light/15">
            {JSON.stringify(firestoreData, null, 2).slice(0, 50000)}
          </pre>
        </details>
      )}

      {/* WAL JSON */}
      {walData && (
        <details className="space-y-2">
          <summary className="cursor-pointer font-body text-sm text-primary font-medium">Raw WAL data</summary>
          <pre className="text-xs font-mono text-ink/60 bg-surface-light p-4 rounded-lg overflow-auto max-h-[50vh] border border-wood-light/15">
            {walData.slice(0, 50000)}
          </pre>
        </details>
      )}
    </div>
  );
}
