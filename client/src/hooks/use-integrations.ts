import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { serverTimestamp } from '@/lib/firestore';
import type { Integration, Provider } from '@/types/integration';

/** Fetch all user integrations — stored on the user document */
export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return [];
      const data = snap.data();
      const integrations: Integration[] = [];
      const providers: Provider[] = ['figma', 'anthropic', 'webflow'];
      for (const p of providers) {
        if (data.integrations?.[p]) {
          integrations.push({
            id: p,
            provider: p,
            accessToken: data.integrations[p].accessToken || '',
            connectedAt: data.integrations[p].connectedAt || '',
          });
        }
      }
      return integrations;
    },
  });
}

/** Connect an integration (store token on user doc) */
export function useConnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { provider: Provider; accessToken: string }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        integrations: {
          [data.provider]: {
            accessToken: data.accessToken,
            connectedAt: new Date().toISOString(),
          },
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return { provider: data.provider } as Integration;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success(`${vars.provider} connected`);
    },
    onError: () => toast.error('Failed to connect integration'),
  });
}

/** Disconnect an integration */
export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: Provider) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        integrations: {
          [provider]: deleteField(),
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration disconnected');
    },
    onError: () => toast.error('Failed to disconnect integration'),
  });
}
