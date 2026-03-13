export type Provider = 'figma' | 'anthropic' | 'webflow';

export interface Integration {
  id: string;
  provider: Provider;
  isConnected: boolean;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
