import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'forge-recent-projects';
const MAX_RECENT = 8;

interface RecentEntry {
  projectId: string;
  visitedAt: number;
}

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): RecentEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as RecentEntry[];
  } catch {
    return [];
  }
}

let cachedSnapshot: RecentEntry[] | null = null;
let cachedJson = '';

function getSnapshotMemoized(): RecentEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY) ?? '[]';
  if (raw !== cachedJson) {
    cachedJson = raw;
    try {
      cachedSnapshot = JSON.parse(raw) as RecentEntry[];
    } catch {
      cachedSnapshot = [];
    }
  }
  return cachedSnapshot ?? [];
}

function subscribe(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

export function trackProjectVisit(projectId: string): void {
  const entries = getSnapshot().filter((e) => e.projectId !== projectId);
  entries.unshift({ projectId, visitedAt: Date.now() });
  const trimmed = entries.slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  cachedJson = '';
  cachedSnapshot = null;
  emitChange();
}

/** Returns recently visited project IDs ordered by most recent first */
export function useRecentProjects(): {
  recentIds: string[];
  trackVisit: (projectId: string) => void;
} {
  const entries = useSyncExternalStore(subscribe, getSnapshotMemoized);

  const trackVisit = useCallback((projectId: string) => {
    trackProjectVisit(projectId);
  }, []);

  return {
    recentIds: entries.map((e) => e.projectId),
    trackVisit,
  };
}
