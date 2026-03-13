import { create } from 'zustand';

interface ActiveProjectStore {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

export const useActiveProject = create<ActiveProjectStore>((set) => {
  const stored = localStorage.getItem('forge-active-project');

  return {
    activeProjectId: stored || null,
    setActiveProjectId: (id) => {
      if (id) {
        localStorage.setItem('forge-active-project', id);
      } else {
        localStorage.removeItem('forge-active-project');
      }
      set({ activeProjectId: id });
    },
  };
});
