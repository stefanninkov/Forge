export type Provider = 'figma' | 'anthropic' | 'webflow';

export interface TokenEntry {
  id: string;
  label: string;
  token: string;
  createdAt: string;
}

export interface TokenVault {
  figma: TokenEntry[];
  webflow: TokenEntry[];
  anthropic: TokenEntry[];
}

/** @deprecated — kept for backward compat during migration */
export interface Integration {
  id: string;
  provider: Provider;
  accessToken: string;
  connectedAt: string;
  isConnected?: boolean;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}
