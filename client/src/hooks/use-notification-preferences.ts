import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { serverTimestamp } from '@/lib/firestore';

interface NotificationPref {
  event: string;
  channel: 'email' | 'in_app';
  enabled: boolean;
}

const KEYS = {
  prefs: ['notification-preferences'] as const,
};

export function useNotificationPreferences() {
  return useQuery({
    queryKey: KEYS.prefs,
    queryFn: async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const ref = doc(db, 'notificationPreferences', uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return [];
      return (snap.data().preferences ?? []) as NotificationPref[];
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: NotificationPref[]) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const ref = doc(db, 'notificationPreferences', uid);
      await setDoc(ref, { preferences, userId: uid, updatedAt: serverTimestamp() }, { merge: true });
      return preferences;
    },
    onSuccess: (data) => {
      qc.setQueryData(KEYS.prefs, data);
      toast.success('Notification preferences saved');
    },
    onError: () => toast.error('Failed to save notification preferences'),
  });
}
