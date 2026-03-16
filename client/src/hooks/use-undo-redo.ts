import { useEffect } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';

interface HistoryEntry<T> {
  state: T;
  label?: string;
}

interface UndoRedoState<T> {
  past: HistoryEntry<T>[];
  present: HistoryEntry<T> | null;
  future: HistoryEntry<T>[];
  maxHistory: number;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | undefined;
  redoLabel: string | undefined;
  pushState: (state: T, label?: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

function computeDerived<T>(
  past: HistoryEntry<T>[],
  future: HistoryEntry<T>[],
) {
  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoLabel: past.length > 0 ? past[past.length - 1].label : undefined,
    redoLabel: future.length > 0 ? future[0].label : undefined,
  };
}

export function createUndoRedoStore<T>(maxHistory = 50): StoreApi<UndoRedoState<T>> {
  return createStore<UndoRedoState<T>>((set) => ({
    past: [],
    present: null,
    future: [],
    maxHistory,
    canUndo: false,
    canRedo: false,
    undoLabel: undefined,
    redoLabel: undefined,

    pushState: (state: T, label?: string) => {
      set((prev) => {
        const entry: HistoryEntry<T> = { state, label };

        if (prev.present === null) {
          return {
            present: entry,
            past: [],
            future: [],
            ...computeDerived<T>([], []),
          };
        }

        const newPast = [...prev.past, prev.present];
        if (newPast.length > prev.maxHistory) {
          newPast.splice(0, newPast.length - prev.maxHistory);
        }

        return {
          past: newPast,
          present: entry,
          future: [],
          ...computeDerived<T>(newPast, []),
        };
      });
    },

    undo: () => {
      set((prev) => {
        if (prev.past.length === 0 || prev.present === null) return prev;

        const newPast = prev.past.slice(0, -1);
        const previous = prev.past[prev.past.length - 1];
        const newFuture = [prev.present, ...prev.future];

        return {
          past: newPast,
          present: previous,
          future: newFuture,
          ...computeDerived<T>(newPast, newFuture),
        };
      });
    },

    redo: () => {
      set((prev) => {
        if (prev.future.length === 0) return prev;

        const next = prev.future[0];
        const newFuture = prev.future.slice(1);
        const newPast = prev.present
          ? [...prev.past, prev.present]
          : prev.past;

        return {
          past: newPast,
          present: next,
          future: newFuture,
          ...computeDerived<T>(newPast, newFuture),
        };
      });
    },

    clear: () => {
      set({
        past: [],
        present: null,
        future: [],
        ...computeDerived<T>([], []),
      });
    },
  }));
}

export function useUndoRedoKeyboard<T>(store: StoreApi<UndoRedoState<T>>): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod || event.key.toLowerCase() !== 'z') return;

      event.preventDefault();

      const { undo, redo, canUndo, canRedo } = store.getState();

      if (event.shiftKey) {
        if (canRedo) redo();
      } else {
        if (canUndo) undo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);
}

export function useUndoRedo<T>(store: StoreApi<UndoRedoState<T>>) {
  const state = useStore(store);
  useUndoRedoKeyboard(store);
  return state;
}

// ─── Persisted variant ─────────────────────────────────────────

const STORAGE_PREFIX = 'forge-undo-';

interface PersistedData<T> {
  past: HistoryEntry<T>[];
  present: HistoryEntry<T> | null;
  future: HistoryEntry<T>[];
}

function loadFromStorage<T>(key: string): PersistedData<T> | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedData<T>;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, data: PersistedData<T>): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch {
    // Storage full or quota exceeded — silently ignore
  }
}

function clearStorage(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore
  }
}

export function createPersistedUndoRedoStore<T>(
  storageKey: string,
  maxHistory = 30,
): StoreApi<UndoRedoState<T>> {
  const saved = loadFromStorage<T>(storageKey);

  const initialPast = saved?.past ?? [];
  const initialPresent = saved?.present ?? null;
  const initialFuture = saved?.future ?? [];

  const store = createStore<UndoRedoState<T>>((set, get) => ({
    past: initialPast,
    present: initialPresent,
    future: initialFuture,
    maxHistory,
    ...computeDerived<T>(initialPast, initialFuture),

    pushState: (state: T, label?: string) => {
      set((prev) => {
        const entry: HistoryEntry<T> = { state, label };

        if (prev.present === null) {
          const next = {
            present: entry,
            past: [] as HistoryEntry<T>[],
            future: [] as HistoryEntry<T>[],
            ...computeDerived<T>([], []),
          };
          saveToStorage(storageKey, next);
          return next;
        }

        const newPast = [...prev.past, prev.present];
        if (newPast.length > prev.maxHistory) {
          newPast.splice(0, newPast.length - prev.maxHistory);
        }

        const next = {
          past: newPast,
          present: entry,
          future: [] as HistoryEntry<T>[],
          ...computeDerived<T>(newPast, []),
        };
        saveToStorage(storageKey, next);
        return next;
      });
    },

    undo: () => {
      set((prev) => {
        if (prev.past.length === 0 || prev.present === null) return prev;

        const newPast = prev.past.slice(0, -1);
        const previous = prev.past[prev.past.length - 1];
        const newFuture = [prev.present, ...prev.future];

        const next = {
          past: newPast,
          present: previous,
          future: newFuture,
          ...computeDerived<T>(newPast, newFuture),
        };
        saveToStorage(storageKey, next);
        return next;
      });
    },

    redo: () => {
      set((prev) => {
        if (prev.future.length === 0) return prev;

        const nextEntry = prev.future[0];
        const newFuture = prev.future.slice(1);
        const newPast = prev.present ? [...prev.past, prev.present] : prev.past;

        const next = {
          past: newPast,
          present: nextEntry,
          future: newFuture,
          ...computeDerived<T>(newPast, newFuture),
        };
        saveToStorage(storageKey, next);
        return next;
      });
    },

    clear: () => {
      clearStorage(storageKey);
      set({
        past: [],
        present: null,
        future: [],
        ...computeDerived<T>([], []),
      });
    },
  }));

  return store;
}

export type { UndoRedoState, HistoryEntry };
