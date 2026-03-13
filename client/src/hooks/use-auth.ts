import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  restoreSession: () => Promise<void>;
}

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export const useAuth = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isRestoring: !!localStorage.getItem('forge-refresh-token'),
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isRestoring: false }),
  clearAuth: () => {
    localStorage.removeItem('forge-refresh-token');
    set({ user: null, accessToken: null, isAuthenticated: false, isRestoring: false });
  },
  restoreSession: async () => {
    const refreshToken = localStorage.getItem('forge-refresh-token');
    if (!refreshToken) {
      set({ isRestoring: false });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const data = await res.json();
      localStorage.setItem('forge-refresh-token', data.refreshToken);
      get().setAuth(data.user, data.accessToken);
    } catch {
      get().clearAuth();
    }
  },
}));
