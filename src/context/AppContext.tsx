import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'done' | 'migrated' | 'deferred';
  date: string; // YYYY-MM-DD
  movedCount: number;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  duration?: string; // e.g., "1h 30m"
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDates: string[]; // Array of YYYY-MM-DD
  color: string; // Tailwind color class or hex
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  image?: string;
  wins?: string[];
}

export interface Settings {
  paperTexture: number; // 0-100 opacity
  inkColor: 'navy' | 'sepia' | 'charcoal';
  sound: 'mechanical' | 'pencil' | 'silence';
  reminderInterval: number; // minutes
}

interface AppContextType {
  tasks: Task[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  settings: Settings;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleHabit: (id: string, date: string) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review quarterly budget', status: 'todo', date: '2023-10-24', movedCount: 0, priority: 'high', duration: '30m' },
    { id: '2', title: 'Call Mom regarding weekend plans', status: 'migrated', date: '2023-10-24', movedCount: 3, priority: 'medium' },
    { id: '3', title: 'Client Strategy Sync', status: 'todo', date: '2023-10-24', movedCount: 0, priority: 'high', duration: '1h' },
    { id: '4', title: 'Email Design Team re: assets', status: 'done', date: '2023-10-24', movedCount: 0, priority: 'medium' },
    { id: '5', title: 'Pick up dry cleaning', status: 'todo', date: '2023-10-25', movedCount: 0, priority: 'low' },
    { id: '6', title: 'Research API limits', status: 'todo', date: '2023-10-23', movedCount: 0, priority: 'medium', tags: ['DEV-102'] },
  ]);

  const [habits, setHabits] = useState<Habit[]>([
    { id: 'h1', name: 'Morning Pages', streak: 12, completedDates: ['2023-10-24', '2023-10-23'], color: 'sage' },
    { id: 'h2', name: 'Deep Work', streak: 5, completedDates: ['2023-10-24'], color: 'accent' },
    { id: 'h3', name: 'No Sugar', streak: 3, completedDates: [], color: 'tension' },
    { id: 'h4', name: 'Meditation', streak: 24, completedDates: ['2023-10-24', '2023-10-23', '2023-10-22'], color: 'primary' },
  ]);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: 'j1',
      date: '2023-08-12',
      content: 'Completed the quarterly report ahead of schedule.',
      tags: ['Work'],
      wins: ['Completed report']
    },
    {
      id: 'j2',
      date: '2023-08-15',
      content: 'Finally organized the garage shelves.',
      tags: ['Home'],
      wins: ['Organized garage']
    },
    {
        id: 'j3',
        date: '2023-10-24',
        content: 'Today I focused on the small things. The morning coffee was perfect. I managed to clear my inbox by noon.',
        mood: 'sentiment_satisfied',
        tags: ['Reflection']
    }
  ]);

  const [settings, setSettings] = useState<Settings>({
    paperTexture: 40,
    inkColor: 'charcoal',
    sound: 'pencil',
    reminderInterval: 20
  });

  const addTask = (task: Task) => setTasks([...tasks, task]);
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const toggleHabit = (id: string, date: string) => {
    setHabits(habits.map(h => {
      if (h.id !== id) return h;
      const isCompleted = h.completedDates.includes(date);
      const newDates = isCompleted
        ? h.completedDates.filter(d => d !== date)
        : [...h.completedDates, date];
      return { ...h, completedDates: newDates };
    }));
  };

  const addJournalEntry = (entry: JournalEntry) => setJournalEntries([...journalEntries, entry]);

  const updateSettings = (newSettings: Partial<Settings>) => setSettings({ ...settings, ...newSettings });

  return (
    <AppContext.Provider value={{ tasks, habits, journalEntries, settings, addTask, updateTask, toggleHabit, addJournalEntry, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
