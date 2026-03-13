import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Project } from '@/types/project';

interface ProjectsResponse {
  data: Project[];
}

interface ProjectResponse {
  data: Project;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ProjectsResponse>('/projects').then((r) => r.data),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<ProjectResponse>('/projects', data).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${data.name}" created`);
    },
    onError: () => toast.error('Failed to create project'),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string }) =>
      api.put<ProjectResponse>(`/projects/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
    },
    onError: () => toast.error('Failed to update project'),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: () => toast.error('Failed to delete project'),
  });
}
