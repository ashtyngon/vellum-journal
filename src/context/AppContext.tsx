import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { formatLocalDate } from '../lib/dateUtils';

/* ── BuJo Rapid Log Entry (replaces old Task) ─────────────────────── */

export interface RapidLogEntry {
  id: string;
  type: 'task' | 'event' | 'note';
  title: string;
  date: string;
  // Task-specific
  status?: 'todo' | 'done' | 'migrated' | 'deferred' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  movedCount?: number;
  timeBlock?: string;
  duration?: string;
  section?: string;   // section id — soft assignment without exact time
  order?: number;      // manual sort order within a section/day
  sourceHabit?: string;  // habit name if created from habit drag
  // Event-specific
  time?: string;
  // Shared
  tags?: string[];
  notes?: string;
  description?: string;   // rich task description / body text
  links?: string[];        // URLs associated with this entry
  // Soft-delete
  deletedAt?: string;  // ISO date — moves to trash, purged after 7 days
}

/* ── Habit ─────────────────────────────────────────────────────────── */

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDates: string[];
  color: string;
}

/* ── Journal Entry (updated with method support) ───────────────────── */

export interface JournalStep {
  prompt: string;
  answer: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  image?: string;
  wins?: string[];
  method?: string;
  steps?: JournalStep[];
}

/* ── Collections ───────────────────────────────────────────────────── */

export interface CollectionItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

export interface Collection {
  id: string;
  title: string;
  items: CollectionItem[];
  createdAt: string;
}

/* ── Day Debrief ───────────────────────────────────────────────────── */

export interface DayDebrief {
  date: string;
  planRealism: number;
  accomplishment: number;
  mood: string;
  reflection?: string;
  savedAt?: string; // ISO timestamp of when this debrief was actually saved
}

/* ── Context Type ──────────────────────────────────────────────────── */

interface AppContextType {
  entries: RapidLogEntry[];
  trash: RapidLogEntry[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  collections: Collection[];
  debriefs: DayDebrief[];
  loading: boolean;
  // Entries CRUD
  addEntry: (entry: RapidLogEntry) => void;
  updateEntry: (id: string, updates: Partial<RapidLogEntry>) => void;
  batchUpdateEntries: (updates: Array<{ id: string; updates: Partial<RapidLogEntry> }>) => void;
  deleteEntry: (id: string) => void;
  restoreEntry: (id: string) => void;
  permanentlyDeleteEntry: (id: string) => void;
  // Habits CRUD
  toggleHabit: (id: string, date: string) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  // Journal CRUD
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  // Collections CRUD
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addCollectionItem: (collectionId: string, item: CollectionItem) => void;
  updateCollectionItem: (collectionId: string, itemId: string, updates: Partial<CollectionItem>) => void;
  deleteCollectionItem: (collectionId: string, itemId: string) => void;
  reorderCollectionItems: (collectionId: string, items: CollectionItem[]) => void;
  // Debriefs
  saveDebrief: (debrief: DayDebrief) => void;
  deleteDebrief: (date: string) => void;
  // Onboarding
  isNewUser: boolean;
  completeWalkthrough: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ── No seed data — new users start blank + walkthrough ───────────── */

/* ── Trash cleanup — purge items older than 7 days ────────────────── */

function purgeOldTrash(entries: RapidLogEntry[]): RapidLogEntry[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return entries.filter(e => !e.deletedAt || new Date(e.deletedAt).getTime() > cutoff);
}

/* ── Debrief migration — fix UTC-poisoned dates ──────────────────── */
// Prior code used UTC-based dates which could shift a debrief to the wrong day.
// Debriefs with savedAt: if the local date of savedAt differs from the debrief's
// date field, the debrief was saved under the wrong date. Remove it.
// Debriefs without savedAt (legacy): stamp them so future loads can validate.

function migrateDebriefs(debriefs: DayDebrief[]): DayDebrief[] {
  return debriefs.filter(d => {
    if (!d.savedAt) return true; // legacy — can't verify, user can Clear manually
    // Check: local date of savedAt should match debrief date
    const savedLocalDate = formatLocalDate(new Date(d.savedAt));
    if (savedLocalDate !== d.date) {
      console.warn(`[debrief-migration] Removing UTC-poisoned debrief: savedAt local=${savedLocalDate} but date=${d.date}`);
      return false;
    }
    return true;
  });
}

/* ── localStorage write-ahead log ─────────────────────────────────── */
// Immediately writes state to localStorage on every change so data
// survives page refresh even if Firestore write hasn't completed.

const LS_KEY = 'vellum_wal';

interface WalData {
  entries: RapidLogEntry[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  collections: Collection[];
  debriefs: DayDebrief[];
  ts: number; // timestamp of last write
  uid: string; // user uid this data belongs to
}

function writeWal(uid: string, data: Omit<WalData, 'ts' | 'uid'>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...data, ts: Date.now(), uid }));
  } catch { /* localStorage full or unavailable — non-critical */ }
}

function readWal(uid: string): WalData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalData;
    // Only use WAL if it belongs to this user (no time limit —
    // WAL is cleared after confirmed Firestore write, so if it exists, it's needed)
    if (parsed.uid === uid) return parsed;
    // Different user — clear it
    localStorage.removeItem(LS_KEY);
    return null;
  } catch { return null; }
}

function clearWal() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

/* ── Provider ──────────────────────────────────────────────────────── */

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // Start with EMPTY state — never seed defaults into live state.
  // Seed data is only used for brand-new users who have no Firestore doc.
  const [entries, setEntries] = useState<RapidLogEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [debriefs, setDebriefs] = useState<DayDebrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Track whether Firestore data has been loaded for this user session.
  // This prevents saving stale/empty state back to Firestore before load completes.
  const dataLoadedRef = useRef(false);
  const prevUserUid = useRef<string | null>(null);

  // Load from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      // Only reset if we actually had a user before (real logout),
      // NOT on initial mount where user is null while auth resolves.
      if (prevUserUid.current !== null) {
        setEntries([]);
        setHabits([]);
        setJournalEntries([]);
        setCollections([]);
        setDebriefs([]);
        prevUserUid.current = null;
      }
      dataLoadedRef.current = false;
      setLoading(false);
      return;
    }

    // If user object fires again but it's the same uid, don't reload
    if (prevUserUid.current === user.uid && dataLoadedRef.current) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      dataLoadedRef.current = false;

      // Check WAL first — may have data from a page refresh mid-save
      const wal = readWal(user.uid);

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          const firestoreTs = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;

          // If WAL is newer than Firestore, prefer WAL data
          if (wal && wal.ts > firestoreTs) {
            setEntries(purgeOldTrash(wal.entries));
            setHabits(wal.habits);
            setJournalEntries(wal.journalEntries);
            setCollections(wal.collections);
            setDebriefs(migrateDebriefs(wal.debriefs));
            clearWal();
          } else {
            // Use Firestore data (it's current or newer)
            clearWal();
            // Support migration from old 'tasks' field
            if (data.entries) {
              setEntries(purgeOldTrash(data.entries));
            } else if (data.tasks) {
              setEntries((data.tasks as Array<Record<string, unknown>>).map(t => ({
                ...t,
                type: 'task' as const,
                status: (t.status as string) || 'todo',
                priority: (t.priority as string) || 'medium',
                movedCount: (t.movedCount as number) || 0,
              })) as RapidLogEntry[]);
            } else {
              setEntries([]);
            }
            setHabits(data.habits ?? []);
            setJournalEntries(data.journalEntries ?? []);
            setCollections(data.collections ?? []);
            setDebriefs(migrateDebriefs(data.debriefs ?? []));
          }
        } else if (wal) {
          // No Firestore doc but WAL exists — use WAL
          setEntries(purgeOldTrash(wal.entries));
          setHabits(wal.habits);
          setJournalEntries(wal.journalEntries);
          setCollections(wal.collections);
          setDebriefs(migrateDebriefs(wal.debriefs));
          clearWal();
        } else {
          // Brand-new user — start blank, show walkthrough
          setEntries([]);
          setHabits([]);
          setJournalEntries([]);
          setCollections([]);
          setDebriefs([]);
          if (localStorage.getItem('vellum-walkthrough-done') !== 'true') {
            setIsNewUser(true);
          }
          await setDoc(doc(db, 'users', user.uid), {
            entries: [], habits: [], journalEntries: [],
            collections: [], debriefs: [],
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to load from Firestore:', err);
        // If Firestore fails but WAL exists, use WAL as fallback
        if (wal) {
          setEntries(purgeOldTrash(wal.entries));
          setHabits(wal.habits);
          setJournalEntries(wal.journalEntries);
          setCollections(wal.collections);
          setDebriefs(migrateDebriefs(wal.debriefs));
          clearWal();
        }
      }
      prevUserUid.current = user.uid;
      dataLoadedRef.current = true;
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Save to Firestore on EVERY change — no debounce.
  // Also writes to localStorage WAL as a synchronous backup.
  // CRITICAL: Only save AFTER Firestore data has been loaded to prevent
  // overwriting real data with empty/stale state.
  const latestDataRef = useRef({ entries, habits, journalEntries, collections, debriefs });
  latestDataRef.current = { entries, habits, journalEntries, collections, debriefs };

  const flushSave = useCallback(() => {
    if (!user || !dataLoadedRef.current) return;
    const data = latestDataRef.current;
    setDoc(doc(db, 'users', user.uid), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true })
      .then(() => {
        // Firestore write succeeded — WAL no longer needed
        clearWal();
      })
      .catch(err => console.error('Save failed (WAL preserved):', err));
  }, [user]);

  useEffect(() => {
    if (!user || !dataLoadedRef.current) return;
    // IMMEDIATELY write to localStorage (synchronous backup)
    writeWal(user.uid, latestDataRef.current);
    // Save to Firestore immediately — no debounce
    flushSave();
  }, [entries, habits, journalEntries, collections, debriefs, user, flushSave]);

  // Flush any pending save when the page is about to unload.
  // Even if the async Firestore write doesn't complete, the WAL is already
  // in localStorage from the synchronous write above.
  useEffect(() => {
    const handleUnload = () => flushSave();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [flushSave]);

  /* ── Entries CRUD ──────────────────────────────────────────────── */

  const addEntry = useCallback((entry: RapidLogEntry) =>
    setEntries(prev => [...prev, entry]), []);

  const updateEntry = useCallback((id: string, updates: Partial<RapidLogEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e)), []);

  // Atomic batch update — single state change for multiple entries
  const batchUpdateEntries = useCallback((updates: Array<{ id: string; updates: Partial<RapidLogEntry> }>) => {
    setEntries(prev => {
      const updateMap = new Map(updates.map(u => [u.id, u.updates]));
      return prev.map(e => {
        const u = updateMap.get(e.id);
        return u ? { ...e, ...u } : e;
      });
    });
  }, []);

  // Soft-delete: mark with deletedAt timestamp (kept for 7 days)
  const deleteEntry = useCallback((id: string) =>
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e
    )), []);

  const restoreEntry = useCallback((id: string) =>
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, deletedAt: undefined } : e
    )), []);

  const permanentlyDeleteEntry = useCallback((id: string) =>
    setEntries(prev => prev.filter(e => e.id !== id)), []);

  /* ── Habits CRUD ───────────────────────────────────────────────── */

  const toggleHabit = useCallback((id: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const isCompleted = h.completedDates.includes(date);
      const newDates = isCompleted ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date];
      let streak = 0;
      const d = new Date();
      while (newDates.includes(formatLocalDate(d))) { streak++; d.setDate(d.getDate() - 1); }
      return { ...h, completedDates: newDates, streak };
    }));
  }, []);

  const addHabit = useCallback((habit: Habit) => setHabits(prev => [...prev, habit]), []);
  const updateHabit = useCallback((id: string, updates: Partial<Habit>) =>
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h)), []);
  const deleteHabit = useCallback((id: string) => setHabits(prev => prev.filter(h => h.id !== id)), []);

  /* ── Journal CRUD ──────────────────────────────────────────────── */

  const addJournalEntry = useCallback((entry: JournalEntry) =>
    setJournalEntries(prev => [...prev, entry]), []);
  const updateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) =>
    setJournalEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e)), []);
  const deleteJournalEntry = useCallback((id: string) =>
    setJournalEntries(prev => prev.filter(e => e.id !== id)), []);

  /* ── Collections CRUD ──────────────────────────────────────────── */

  const addCollection = useCallback((collection: Collection) =>
    setCollections(prev => [...prev, collection]), []);

  const updateCollection = useCallback((id: string, updates: Partial<Collection>) =>
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)), []);

  const deleteCollection = useCallback((id: string) =>
    setCollections(prev => prev.filter(c => c.id !== id)), []);

  const addCollectionItem = useCallback((collectionId: string, item: CollectionItem) =>
    setCollections(prev => prev.map(c =>
      c.id === collectionId ? { ...c, items: [...c.items, item] } : c
    )), []);

  const updateCollectionItem = useCallback((collectionId: string, itemId: string, updates: Partial<CollectionItem>) =>
    setCollections(prev => prev.map(c =>
      c.id === collectionId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
        : c
    )), []);

  const deleteCollectionItem = useCallback((collectionId: string, itemId: string) =>
    setCollections(prev => prev.map(c =>
      c.id === collectionId
        ? { ...c, items: c.items.filter(i => i.id !== itemId) }
        : c
    )), []);

  const reorderCollectionItems = useCallback((collectionId: string, items: CollectionItem[]) =>
    setCollections(prev => prev.map(c =>
      c.id === collectionId ? { ...c, items } : c
    )), []);

  /* ── Debriefs ──────────────────────────────────────────────────── */

  const saveDebrief = useCallback((debrief: DayDebrief) =>
    setDebriefs(prev => {
      const stamped = { ...debrief, savedAt: new Date().toISOString() };
      const existing = prev.findIndex(d => d.date === debrief.date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = stamped;
        return updated;
      }
      return [...prev, stamped];
    }), []);

  const deleteDebrief = useCallback((date: string) =>
    setDebriefs(prev => prev.filter(d => d.date !== date)), []);

  /* ── Onboarding ────────────────────────────────────────────────── */

  const completeWalkthrough = useCallback(() => {
    setIsNewUser(false);
    localStorage.setItem('vellum-walkthrough-done', 'true');
  }, []);

  /* ── Provider ──────────────────────────────────────────────────── */

  // Split entries into active and trash for consumers
  const activeEntries = useMemo(() => entries.filter(e => !e.deletedAt), [entries]);
  const trashEntries = useMemo(() => entries.filter(e => !!e.deletedAt), [entries]);

  const contextValue = useMemo(() => ({
    entries: activeEntries, trash: trashEntries,
    habits, journalEntries, collections, debriefs, loading,
    addEntry, updateEntry, batchUpdateEntries, deleteEntry, restoreEntry, permanentlyDeleteEntry,
    toggleHabit, addHabit, updateHabit, deleteHabit,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    addCollection, updateCollection, deleteCollection,
    addCollectionItem, updateCollectionItem, deleteCollectionItem, reorderCollectionItems,
    saveDebrief, deleteDebrief,
    isNewUser, completeWalkthrough,
  }), [
    activeEntries, trashEntries, habits, journalEntries, collections, debriefs, loading,
    addEntry, updateEntry, batchUpdateEntries, deleteEntry, restoreEntry, permanentlyDeleteEntry,
    toggleHabit, addHabit, updateHabit, deleteHabit,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    addCollection, updateCollection, deleteCollection,
    addCollectionItem, updateCollectionItem, deleteCollectionItem, reorderCollectionItems,
    saveDebrief, deleteDebrief,
    isNewUser, completeWalkthrough,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
