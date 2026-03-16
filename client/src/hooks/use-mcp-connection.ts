import { create } from 'zustand';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from 'sonner';

interface MCPConnectionStore {
  status: 'connected' | 'disconnected' | 'reconnecting';
  siteInfo: { name: string; url: string } | null;
  reconnect: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

export const useMCPConnection = create<MCPConnectionStore>((set) => ({
  status: 'disconnected',
  siteInfo: null,
  reconnect: async () => {
    set({ status: 'reconnecting' });
    try {
      const fn = httpsCallable<void, { status: string; message: string }>(functions, 'mcpReconnect');
      const result = await fn();
      toast.info(result.data.message || 'MCP reconnection attempted');
      set({ status: 'disconnected' });
    } catch {
      toast.error('Failed to reconnect to Webflow MCP');
      set({ status: 'disconnected' });
    }
  },
  checkStatus: async () => {
    try {
      const fn = httpsCallable<void, { connected: boolean; site?: { name: string; url: string } }>(functions, 'mcpStatus');
      const result = await fn();
      set({
        status: result.data.connected ? 'connected' : 'disconnected',
        siteInfo: result.data.site ?? null,
      });
    } catch {
      set({ status: 'disconnected', siteInfo: null });
    }
  },
}));
