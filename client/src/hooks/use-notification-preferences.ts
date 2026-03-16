import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
      const res = await api.get('/notifications/preferences');
      return (res as { data: NotificationPref[] }).data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: NotificationPref[]) => {
      const res = await api.put('/notifications/preferences', { preferences });
      return (res as { data: NotificationPref[] }).data;
    },
    onSuccess: (data) => {
      qc.setQueryData(KEYS.prefs, data);
      toast.success('Notification preferences saved');
    },
    onError: () => toast.error('Failed to save notification preferences'),
  });
}
