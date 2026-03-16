import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  queryUserDocs,
  getDocument,
  createDocument,
  updateDocument,
  removeDocument,
  querySubcollection,
  createSubDocument,
  removeSubDocument,
  requireUid,
  orderBy,
} from '@/lib/firestore';

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
    queryFn: () => queryUserDocs<Team>('teams', [orderBy('createdAt', 'desc')]),
  });
}

export function useTeam(teamId: string | null) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => getDocument<Team>('teams', teamId!),
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => querySubcollection<TeamMember>('teams', teamId!, 'members'),
    enabled: !!teamId,
  });
}

export function useTeamInvitations(teamId: string | null) {
  return useQuery({
    queryKey: ['teams', teamId, 'invitations'],
    queryFn: () => querySubcollection<TeamInvitation>('teams', teamId!, 'invitations'),
    enabled: !!teamId,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const uid = requireUid();
      const id = await createDocument('teams', {
        name: data.name,
        slug: data.slug,
        ownerId: uid,
        avatarUrl: null,
        plan: 'free',
        members: [uid],
      });
      return { id, name: data.name } as Team;
    },
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
      updateDocument('teams', teamId, data),
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
    mutationFn: (teamId: string) => removeDocument('teams', teamId),
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
    mutationFn: async (data: { email: string; role?: string }) => {
      const id = await createSubDocument('teams', teamId, 'invitations', {
        email: data.email,
        role: data.role || 'member',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return { id, email: data.email } as TeamInvitation;
    },
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
    mutationFn: async (data: { memberId: string; role: string }) => {
      await updateDocument(`teams/${teamId}/members`, data.memberId, { role: data.role });
    },
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
    mutationFn: (memberId: string) => removeSubDocument('teams', teamId, 'members', memberId),
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
    mutationFn: async (teamId: string) => {
      const uid = requireUid();
      await removeSubDocument('teams', teamId, 'members', uid);
    },
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
    mutationFn: (invitationId: string) => removeSubDocument('teams', teamId, 'invitations', invitationId),
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
    mutationFn: async (_token: string) => {
      // TODO: Cloud Function for accepting invitations by token
      toast.info('Invitation acceptance requires backend setup');
      return { name: '' } as Team;
    },
    onSuccess: (team) => {
      if (team.name) toast.success(`Joined team "${team.name}"`);
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to accept invitation'),
  });
}

export type { Team, TeamMember, TeamInvitation };
