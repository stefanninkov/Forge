import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SetupData, SetupProfile } from '@/types/setup';

interface SetupResponse {
  data: SetupData;
}

interface ProfilesResponse {
  data: SetupProfile[];
}

interface ProfileResponse {
  data: SetupProfile;
}

export function useSetupProgress(projectId: string | null) {
  return useQuery({
    queryKey: ['setup', projectId],
    queryFn: () =>
      api.get<SetupResponse>(`/projects/${projectId}/setup`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useUpdateSetupItem(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemKey, status }: { itemKey: string; status: 'COMPLETED' | 'PENDING' | 'SKIPPED' }) =>
      api.put(`/projects/${projectId}/setup/${itemKey}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
    },
  });
}

export function useResetSetupProgress(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/setup/reset`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
    },
  });
}

export function useSetupProfiles() {
  return useQuery({
    queryKey: ['setup-profiles'],
    queryFn: () =>
      api.get<ProfilesResponse>('/setup-profiles').then((r) => r.data),
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; checklistConfig: Record<string, boolean> }) =>
      api.post<ProfileResponse>('/setup-profiles', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-profiles'] });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.delete(`/setup-profiles/${profileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-profiles'] });
    },
  });
}

export function useApplyProfile(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) =>
      api.post(`/projects/${projectId}/setup/apply-profile`, { profileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
    },
  });
}
