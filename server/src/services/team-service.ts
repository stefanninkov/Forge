import { prisma } from '../db/client.js';
import { AppError } from '../utils/errors.js';
import crypto from 'crypto';

// ─── Team CRUD ─────────────────────────────────────────────────────────────────

interface CreateTeamInput {
  name: string;
  slug: string;
}

export async function createTeam(userId: string, input: CreateTeamInput) {
  // Check slug uniqueness
  const existing = await prisma.team.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new AppError(409, 'SLUG_TAKEN', 'This team URL is already taken.');
  }

  const team = await prisma.team.create({
    data: {
      name: input.name,
      slug: input.slug,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: true,
    },
  });

  return team;
}

export async function getTeam(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!member) {
    throw new AppError(403, 'NOT_MEMBER', 'You are not a member of this team.');
  }

  return prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    include: {
      members: {
        include: {
          // No user relation defined on TeamMember, include basic info
        },
      },
      invitations: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function listUserTeams(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          members: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...m.team,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function updateTeam(teamId: string, userId: string, data: { name?: string; avatarUrl?: string }) {
  await requireRole(teamId, userId, ['OWNER', 'ADMIN']);

  return prisma.team.update({
    where: { id: teamId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
  });
}

export async function deleteTeam(teamId: string, userId: string) {
  await requireRole(teamId, userId, ['OWNER']);

  await prisma.team.delete({ where: { id: teamId } });
}

// ─── Members ───────────────────────────────────────────────────────────────────

export async function listMembers(teamId: string, userId: string) {
  await requireRole(teamId, userId, ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    orderBy: { joinedAt: 'asc' },
  });

  // Get user info for each member
  const userIds = members.map((m) => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
    user: userMap.get(m.userId) ?? { id: m.userId, name: null, email: 'Unknown', avatarUrl: null },
  }));
}

export async function updateMemberRole(teamId: string, userId: string, memberId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
  await requireRole(teamId, userId, ['OWNER', 'ADMIN']);

  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
  });

  if (!member) {
    throw new AppError(404, 'NOT_FOUND', 'Team member not found.');
  }

  if (member.role === 'OWNER') {
    throw new AppError(400, 'CANNOT_CHANGE_OWNER', 'Cannot change the role of the team owner.');
  }

  return prisma.teamMember.update({
    where: { id: memberId },
    data: { role },
  });
}

export async function removeMember(teamId: string, userId: string, memberId: string) {
  await requireRole(teamId, userId, ['OWNER', 'ADMIN']);

  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
  });

  if (!member) {
    throw new AppError(404, 'NOT_FOUND', 'Team member not found.');
  }

  if (member.role === 'OWNER') {
    throw new AppError(400, 'CANNOT_REMOVE_OWNER', 'Cannot remove the team owner.');
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
}

export async function leaveTeam(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!member) {
    throw new AppError(404, 'NOT_MEMBER', 'You are not a member of this team.');
  }

  if (member.role === 'OWNER') {
    throw new AppError(400, 'OWNER_CANNOT_LEAVE', 'The team owner cannot leave. Transfer ownership or delete the team.');
  }

  await prisma.teamMember.delete({ where: { id: member.id } });
}

// ─── Invitations ───────────────────────────────────────────────────────────────

export async function inviteMember(teamId: string, userId: string, email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER') {
  await requireRole(teamId, userId, ['OWNER', 'ADMIN']);

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: existingUser.id } },
    });
    if (existingMember) {
      throw new AppError(409, 'ALREADY_MEMBER', 'This user is already a team member.');
    }
  }

  // Check for pending invitation
  const pendingInvite = await prisma.teamInvitation.findFirst({
    where: { teamId, email, status: 'PENDING' },
  });
  if (pendingInvite) {
    throw new AppError(409, 'INVITE_PENDING', 'An invitation has already been sent to this email.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      role,
      token,
      invitedBy: userId,
      expiresAt,
    },
  });
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invitation) {
    throw new AppError(404, 'NOT_FOUND', 'Invitation not found or has expired.');
  }

  if (invitation.status !== 'PENDING') {
    throw new AppError(400, 'INVALID_INVITATION', `This invitation has been ${invitation.status.toLowerCase()}.`);
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    throw new AppError(400, 'INVITATION_EXPIRED', 'This invitation has expired.');
  }

  // Verify user email matches invitation
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.email !== invitation.email) {
    throw new AppError(403, 'EMAIL_MISMATCH', 'This invitation was sent to a different email address.');
  }

  // Create membership and update invitation
  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
      },
    }),
    prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ]);

  return invitation.team;
}

export async function revokeInvitation(teamId: string, userId: string, invitationId: string) {
  await requireRole(teamId, userId, ['OWNER', 'ADMIN']);

  const invitation = await prisma.teamInvitation.findFirst({
    where: { id: invitationId, teamId, status: 'PENDING' },
  });

  if (!invitation) {
    throw new AppError(404, 'NOT_FOUND', 'Invitation not found.');
  }

  return prisma.teamInvitation.update({
    where: { id: invitationId },
    data: { status: 'REVOKED' },
  });
}

export async function listInvitations(teamId: string, userId: string) {
  await requireRole(teamId, userId, ['OWNER', 'ADMIN']);

  return prisma.teamInvitation.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Authorization Helper ──────────────────────────────────────────────────────

type RoleString = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

async function requireRole(teamId: string, userId: string, allowedRoles: RoleString[]) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!member) {
    throw new AppError(403, 'NOT_MEMBER', 'You are not a member of this team.');
  }

  if (!allowedRoles.includes(member.role as RoleString)) {
    throw new AppError(403, 'INSUFFICIENT_ROLE', 'You do not have permission to perform this action.');
  }
}
