import { create } from 'zustand';

interface ClipboardEntry {
  id: string;
  content: string;
  label: string;
  type: 'animation-attrs' | 'css' | 'script' | 'html' | 'class-name' | 'other';
  timestamp: number;
}

interface ClipboardHistoryStore {
  entries: ClipboardEntry[];
  addEntry: (content: string, label: string, type: ClipboardEntry['type']) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = 'forge-clipboard-history';
const MAX_ENTRIES = 50;

function loadEntries(): ClipboardEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ClipboardEntry[];
    }
  } catch {
    // Ignore malformed data
  }
  return [];
}

function persistEntries(entries: ClipboardEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage errors
  }
}

export type { ClipboardEntry };

export const useClipboardHistory = create<ClipboardHistoryStore>((set) => ({
  entries: loadEntries(),

  addEntry: (content, label, type) => {
    set((state) => {
      const entry: ClipboardEntry = {
        id: crypto.randomUUID(),
        content,
        label,
        type,
        timestamp: Date.now(),
      };
      const next = [entry, ...state.entries].slice(0, MAX_ENTRIES);
      persistEntries(next);
      return { entries: next };
    });
  },

  removeEntry: (id) => {
    set((state) => {
      const next = state.entries.filter((e) => e.id !== id);
      persistEntries(next);
      return { entries: next };
    });
  },

  clearHistory: () => {
    persistEntries([]);
    set({ entries: [] });
  },
}));
