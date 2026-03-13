import { create } from 'zustand';

interface SidebarStore {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

export const useSidebar = create<SidebarStore>((set) => {
  const stored = localStorage.getItem('forge-sidebar-collapsed');
  const initial = stored === 'true';

  return {
    collapsed: initial,
    setCollapsed: (collapsed) => {
      localStorage.setItem('forge-sidebar-collapsed', String(collapsed));
      set({ collapsed });
    },
    toggleCollapsed: () => {
      set((state) => {
        const next = !state.collapsed;
        localStorage.setItem('forge-sidebar-collapsed', String(next));
        return { collapsed: next };
      });
    },
  };
});
