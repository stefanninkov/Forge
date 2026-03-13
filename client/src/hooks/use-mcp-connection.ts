import { create } from 'zustand';
import { api } from '@/lib/api';
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
      const res = await api.post<{ data: { status: string; message: string } }>('/mcp/reconnect');
      toast.info(res.data.message || 'MCP reconnection attempted');
      set({ status: 'disconnected' });
    } catch {
      toast.error('Failed to reconnect to Webflow MCP');
      set({ status: 'disconnected' });
    }
  },
  checkStatus: async () => {
    try {
      const res = await api.get<{ data: { connected: boolean; site?: { name: string; url: string } } }>('/mcp/status');
      set({
        status: res.data.connected ? 'connected' : 'disconnected',
        siteInfo: res.data.site ?? null,
      });
    } catch {
      set({ status: 'disconnected', siteInfo: null });
    }
  },
}));
