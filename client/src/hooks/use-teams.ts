import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  avatarUrl: string | null;
  plan: string;
  createdAt: string;
  role?: string;
  joinedAt?: string;
  members?: TeamMember[];
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get<{ data: Team[] }>('/teams').then((r) => r.data),
  });
}

export function useTeam(teamId: string | null) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => api.get<{ data: Team }>(`/teams/${teamId}`).then((r) => r.data),
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => api.get<{ data: TeamMember[] }>(`/teams/${teamId}/members`).then((r) => r.data),
    enabled: !!teamId,
  });
}

export function useTeamInvitations(teamId: string | null) {
  return useQuery({
    queryKey: ['teams', teamId, 'invitations'],
    queryFn: () =>
      api.get<{ data: TeamInvitation[] }>(`/teams/${teamId}/invitations`).then((r) => r.data),
    enabled: !!teamId,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.post<{ data: Team }>('/teams', data).then((r) => r.data),
    onSuccess: (team) => {
      toast.success(`Team "${team.name}" created`);
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create team'),
  });
}

export function useUpdateTeam(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; avatarUrl?: string }) =>
      api.put<{ data: Team }>(`/teams/${teamId}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Team updated');
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update team'),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => api.delete(`/teams/${teamId}`),
    onSuccess: () => {
      toast.success('Team deleted');
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete team'),
  });
}

export function useInviteMember(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role?: string }) =>
      api.post<{ data: TeamInvitation }>(`/teams/${teamId}/invitations`, data).then((r) => r.data),
    onSuccess: (inv) => {
      toast.success(`Invitation sent to ${inv.email}`);
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'invitations'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send invitation'),
  });
}

export function useUpdateMemberRole(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { memberId: string; role: string }) =>
      api.put(`/teams/${teamId}/members/${data.memberId}`, { role: data.role }),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update role'),
  });
}

export function useRemoveMember(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.delete(`/teams/${teamId}/members/${memberId}`),
    onSuccess: () => {
      toast.success('Member removed');
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to remove member'),
  });
}

export function useLeaveTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => api.post(`/teams/${teamId}/leave`),
    onSuccess: () => {
      toast.success('Left team');
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to leave team'),
  });
}

export function useRevokeInvitation(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => api.delete(`/teams/${teamId}/invitations/${invitationId}`),
    onSuccess: () => {
      toast.success('Invitation revoked');
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'invitations'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to revoke invitation'),
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ data: Team }>('/teams/accept-invitation', { token }).then((r) => r.data),
    onSuccess: (team) => {
      toast.success(`Joined team "${team.name}"`);
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to accept invitation'),
  });
}

export type { Team, TeamMember, TeamInvitation };
