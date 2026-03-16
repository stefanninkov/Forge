import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  queryUserDocs,
  querySubcollection,
  getDocument,
  createDocument,
  removeDocument,
  setDocument,
  serverTimestamp,
  doc,
  orderBy,
} from '@/lib/firestore';
import type { SetupProfile, SetupStatus } from '@/types/setup';

interface SetupProgressItem {
  id: string;
  status: SetupStatus;
  completedAt: string | null;
}

export function useSetupProgress(projectId: string | null) {
  return useQuery({
    queryKey: ['setup', projectId],
    queryFn: () =>
      querySubcollection<SetupProgressItem>(
        'projects',
        projectId!,
        'setupProgress',
      ),
    enabled: !!projectId,
  });
}

export function useUpdateSetupItem(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemKey, status }: { itemKey: string; status: SetupStatus }) => {
      if (!projectId) throw new Error('No project selected');
      const data: Record<string, unknown> = { status };
      if (status === 'COMPLETED') {
        data.completedAt = serverTimestamp();
      } else {
        data.completedAt = null;
      }
      await setDocument(`projects/${projectId}/setupProgress`, itemKey, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
    },
  });
}

export function useResetSetupProgress(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('No project selected');
      const items = await querySubcollection<SetupProgressItem>(
        'projects',
        projectId,
        'setupProgress',
      );
      const batch = writeBatch(db);
      for (const item of items) {
        const ref = doc(db, 'projects', projectId, 'setupProgress', item.id);
        batch.delete(ref);
      }
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
      toast.success('Setup progress reset');
    },
    onError: () => toast.error('Failed to reset progress'),
  });
}

export function useSetupProfiles() {
  return useQuery({
    queryKey: ['setup-profiles'],
    queryFn: () =>
      queryUserDocs<SetupProfile>('setupProfiles', [
        orderBy('createdAt', 'desc'),
      ]),
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; checklistConfig: Record<string, boolean> }) => {
      const id = await createDocument('setupProfiles', {
        name: data.name,
        checklistConfig: data.checklistConfig,
      });
      return { id, ...data } as SetupProfile & { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-profiles'] });
      toast.success('Profile saved');
    },
    onError: () => toast.error('Failed to save profile'),
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => removeDocument('setupProfiles', profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-profiles'] });
      toast.success('Profile deleted');
    },
    onError: () => toast.error('Failed to delete profile'),
  });
}

export function useApplyProfile(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      if (!projectId) throw new Error('No project selected');
      const profile = await getDocument<SetupProfile>('setupProfiles', profileId);
      if (!profile) throw new Error('Profile not found');

      const batch = writeBatch(db);
      for (const [itemKey, enabled] of Object.entries(profile.checklistConfig)) {
        const ref = doc(db, 'projects', projectId, 'setupProgress', itemKey);
        batch.set(ref, {
          status: enabled ? 'COMPLETED' : 'PENDING',
          completedAt: enabled ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
      toast.success('Profile applied');
    },
    onError: () => toast.error('Failed to apply profile'),
  });
}
