import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeStore>((set) => {
  const stored = localStorage.getItem('forge-theme') as Theme | null;
  const initial = stored || 'light';
  document.documentElement.setAttribute('data-theme', initial);

  return {
    theme: initial,
    setTheme: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('forge-theme', theme);
      set({ theme });
    },
    toggleTheme: () => {
      set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('forge-theme', next);
        return { theme: next };
      });
    },
  };
});
