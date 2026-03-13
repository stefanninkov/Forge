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

export function useDuplicateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ProjectResponse>(`/projects/${id}/duplicate`).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project duplicated as "${data.name}"`);
    },
    onError: () => toast.error('Failed to duplicate project'),
  });
}

interface NotesResponse {
  data: { notes: string };
}

export function useProjectNotes(projectId: string | null) {
  return useQuery({
    queryKey: ['project-notes', projectId],
    queryFn: () =>
      api.get<NotesResponse>(`/projects/${projectId}/notes`).then((r) => r.data.notes),
    enabled: !!projectId,
  });
}

export function useUpdateProjectNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.put<NotesResponse>(`/projects/${id}/notes`, { notes }).then((r) => r.data.notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-notes', variables.id] });
    },
    onError: () => toast.error('Failed to save notes'),
  });
}
