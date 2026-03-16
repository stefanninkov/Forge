import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  queryUserDocs,
  getDocument,
  createDocument,
  updateDocument,
  removeDocument,
  requireUid,
  orderBy,
  where,
} from '@/lib/firestore';
import type { Project } from '@/types/project';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () =>
      queryUserDocs<Project>('projects', [
        where('isArchived', '==', false),
        orderBy('updatedAt', 'desc'),
      ]),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const id = await createDocument('projects', {
        name: data.name,
        description: data.description || '',
        webflowSiteId: '',
        figmaFileKey: '',
        animationConfig: {},
        scalingConfig: null,
        scriptStatus: 'none',
        notes: '',
        isArchived: false,
        lastVisitedAt: null,
        defaultUnit: 'px',
      });
      return { id, ...data } as Project & { id: string };
    },
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
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string }) => {
      await updateDocument('projects', id, data);
      return data;
    },
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
    mutationFn: (id: string) => removeDocument('projects', id),
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
    mutationFn: async (id: string) => {
      const project = await getDocument<Project>('projects', id);
      if (!project) throw new Error('Project not found');
      const newId = await createDocument('projects', {
        name: `${project.name} (copy)`,
        description: project.description || '',
        webflowSiteId: project.webflowSiteId || '',
        figmaFileKey: project.figmaFileKey || '',
        animationConfig: project.animationConfig || {},
        scalingConfig: project.scalingConfig || null,
        scriptStatus: 'none',
        notes: project.notes || '',
        isArchived: false,
        lastVisitedAt: null,
        defaultUnit: project.defaultUnit || 'px',
      });
      return { id: newId, name: `${project.name} (copy)` } as Project & { id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project duplicated as "${data.name}"`);
    },
    onError: () => toast.error('Failed to duplicate project'),
  });
}

export function useProjectNotes(projectId: string | null) {
  return useQuery({
    queryKey: ['project-notes', projectId],
    queryFn: async () => {
      if (!projectId) return '';
      const project = await getDocument<Project>('projects', projectId);
      return project?.notes || '';
    },
    enabled: !!projectId,
  });
}

export function useUpdateProjectNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      await updateDocument('projects', id, { notes });
      return notes;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-notes', variables.id] });
    },
    onError: () => toast.error('Failed to save notes'),
  });
}
