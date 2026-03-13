import { create } from 'zustand';

const STORAGE_KEY = 'forge-recent-pages';
const MAX_ENTRIES = 20;

export interface RecentPage {
  path: string;
  label: string;
  timestamp: number;
}

interface RecentPagesStore {
  pages: RecentPage[];
  trackPage: (path: string, label: string) => void;
  clearHistory: () => void;
}

function loadFromStorage(): RecentPage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(pages: RecentPage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

export const useRecentPages = create<RecentPagesStore>((set) => ({
  pages: loadFromStorage(),

  trackPage: (path: string, label: string) => {
    set((state) => {
      const filtered = state.pages.filter((p) => p.path !== path);
      const entry: RecentPage = { path, label, timestamp: Date.now() };
      const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
      saveToStorage(next);
      return { pages: next };
    });
  },

  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ pages: [] });
  },
}));
