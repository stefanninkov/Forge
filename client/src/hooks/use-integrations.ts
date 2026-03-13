import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Integration, Provider } from '@/types/integration';

interface IntegrationsResponse {
  data: Integration[];
}

interface IntegrationResponse {
  data: Integration;
}

/** Fetch all user integrations */
export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get<IntegrationsResponse>('/integrations').then((r) => r.data),
  });
}

/** Connect an integration (store token/key) */
export function useConnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { provider: Provider; accessToken: string }) =>
      api.post<IntegrationResponse>('/integrations', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

/** Disconnect an integration */
export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: Provider) => api.delete(`/integrations/${provider}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}
