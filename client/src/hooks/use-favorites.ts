import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  queryUserDocs,
  createDocument,
  removeDocument,
  requireUid,
  where,
  orderBy,
} from '@/lib/firestore';
import { collection, query, where as fsWhere, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Favorite } from '@/types/project';

export function useFavorites(type?: 'project' | 'template' | 'preset') {
  const constraints = [orderBy('createdAt', 'desc')];
  if (type) constraints.unshift(where('entityType', '==', type));

  return useQuery({
    queryKey: ['favorites', type],
    queryFn: () => queryUserDocs<Favorite>('favorites', constraints),
  });
}

export function useIsFavorited(type: string, targetId: string | null) {
  return useQuery({
    queryKey: ['favorite-check', type, targetId],
    queryFn: async () => {
      const uid = requireUid();
      const q = query(
        collection(db, 'favorites'),
        fsWhere('userId', '==', uid),
        fsWhere('entityType', '==', type),
        fsWhere('entityId', '==', targetId),
      );
      const snap = await getDocs(q);
      return !snap.empty;
    },
    enabled: !!targetId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { type: 'project' | 'template' | 'preset'; targetId: string }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const q = query(
        collection(db, 'favorites'),
        fsWhere('userId', '==', uid),
        fsWhere('entityType', '==', data.type),
        fsWhere('entityId', '==', data.targetId),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        await createDocument('favorites', { entityType: data.type, entityId: data.targetId });
        return { favorited: true };
      } else {
        await deleteDoc(snap.docs[0].ref);
        return { favorited: false };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-check'] });
      toast.success(result.favorited ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: () => toast.error('Failed to update favorite'),
  });
}
