import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Favorite } from '@/types/project';

interface FavoritesResponse {
  data: Favorite[];
}

interface ToggleResponse {
  data: { favorited: boolean };
}

interface CheckResponse {
  data: { favorited: boolean };
}

export function useFavorites(type?: 'project' | 'template' | 'preset') {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  const queryString = params.toString();
  const path = `/favorites${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: ['favorites', type],
    queryFn: () => api.get<FavoritesResponse>(path).then((r) => r.data),
  });
}

export function useIsFavorited(type: string, targetId: string | null) {
  return useQuery({
    queryKey: ['favorite-check', type, targetId],
    queryFn: () =>
      api
        .get<CheckResponse>(`/favorites/check?type=${type}&targetId=${targetId}`)
        .then((r) => r.data.favorited),
    enabled: !!targetId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: 'project' | 'template' | 'preset'; targetId: string }) =>
      api.post<ToggleResponse>('/favorites', data).then((r) => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-check'] });
      toast.success(result.favorited ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: () => toast.error('Failed to update favorite'),
  });
}
