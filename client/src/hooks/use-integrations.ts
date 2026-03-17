import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { serverTimestamp } from '@/lib/firestore';
import type { TokenEntry, TokenVault, Provider } from '@/types/integration';

const EMPTY_VAULT: TokenVault = {
  figma: [],
  webflow: [],
  anthropic: [],
};

// ── Token Vault ──────────────────────────────────────────────

export function useTokenVault() {
  return useQuery({
    queryKey: ['token-vault'],
    queryFn: async (): Promise<TokenVault> => {
      const uid = auth.currentUser?.uid;
      if (!uid) return EMPTY_VAULT;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return EMPTY_VAULT;
      const data = snap.data();
      const vault = data.tokenVault;
      if (!vault) {
        // Migrate from old flat integrations format
        const legacy = data.integrations;
        if (legacy) {
          return migrateFromLegacy(legacy);
        }
        return EMPTY_VAULT;
      }
      return {
        figma: vault.figma ?? [],
        webflow: vault.webflow ?? [],
        anthropic: vault.anthropic ?? [],
      };
    },
  });
}

function migrateFromLegacy(legacy: Record<string, { accessToken?: string; connectedAt?: string }>): TokenVault {
  const vault: TokenVault = { figma: [], webflow: [], anthropic: [] };
  const providers: Provider[] = ['figma', 'webflow', 'anthropic'];
  for (const p of providers) {
    if (legacy[p]?.accessToken) {
      vault[p].push({
        id: crypto.randomUUID(),
        label: `My ${p.charAt(0).toUpperCase() + p.slice(1)}`,
        token: legacy[p].accessToken!,
        createdAt: legacy[p].connectedAt ?? new Date().toISOString(),
      });
    }
  }
  return vault;
}

export function useAddToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { provider: Provider; label: string; token: string }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const existing = snap.data()?.tokenVault ?? {};
      const providerTokens: TokenEntry[] = existing[data.provider] ?? [];

      const entry: TokenEntry = {
        id: crypto.randomUUID(),
        label: data.label,
        token: data.token,
        createdAt: new Date().toISOString(),
      };

      providerTokens.push(entry);

      await setDoc(userRef, {
        tokenVault: {
          ...existing,
          [data.provider]: providerTokens,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return entry;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['token-vault'] });
      toast.success(`${vars.provider} token added`);
    },
    onError: () => toast.error('Failed to add token'),
  });
}

export function useRemoveToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { provider: Provider; tokenId: string }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const existing = snap.data()?.tokenVault ?? {};
      const providerTokens: TokenEntry[] = existing[data.provider] ?? [];

      const filtered = providerTokens.filter((t) => t.id !== data.tokenId);

      await setDoc(userRef, {
        tokenVault: {
          ...existing,
          [data.provider]: filtered,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-vault'] });
      toast.success('Token removed');
    },
    onError: () => toast.error('Failed to remove token'),
  });
}

export function useUpdateTokenLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { provider: Provider; tokenId: string; label: string }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const existing = snap.data()?.tokenVault ?? {};
      const providerTokens: TokenEntry[] = existing[data.provider] ?? [];

      const updated = providerTokens.map((t) =>
        t.id === data.tokenId ? { ...t, label: data.label } : t,
      );

      await setDoc(userRef, {
        tokenVault: {
          ...existing,
          [data.provider]: updated,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-vault'] });
      toast.success('Token label updated');
    },
    onError: () => toast.error('Failed to update token'),
  });
}

// ── Backward-compat: useIntegrations (reads from vault) ──────

export function useIntegrations() {
  const { data: vault, isLoading } = useTokenVault();
  const integrations = vault
    ? (['figma', 'webflow', 'anthropic'] as Provider[])
        .filter((p) => vault[p].length > 0)
        .map((p) => ({
          id: p,
          provider: p,
          accessToken: vault[p][0].token,
          connectedAt: vault[p][0].createdAt,
        }))
    : [];
  return { data: integrations, isLoading };
}
