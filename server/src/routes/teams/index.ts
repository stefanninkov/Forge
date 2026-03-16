import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import * as teamService from '../../services/team-service.js';
import { ValidationError } from '../../utils/errors.js';

const teamIdParam = z.object({ teamId: z.string().uuid() });
const memberIdParam = z.object({ teamId: z.string().uuid(), memberId: z.string().uuid() });
const invitationIdParam = z.object({ teamId: z.string().uuid(), invitationId: z.string().uuid() });

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

export async function teamRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/teams — List user's teams
  app.get('/', async (request, reply) => {
    const teams = await teamService.listUserTeams(request.user.userId);
    return reply.send({ data: teams });
  });

  // POST /api/teams — Create a team
  app.post('/', async (request, reply) => {
    const body = createTeamSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const team = await teamService.createTeam(request.user.userId, body.data);
    return reply.status(201).send({ data: team });
  });

  // GET /api/teams/:teamId — Get team details
  app.get('/:teamId', async (request, reply) => {
    const params = teamIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const team = await teamService.getTeam(params.data.teamId, request.user.userId);
    return reply.send({ data: team });
  });

  // PUT /api/teams/:teamId — Update team
  app.put('/:teamId', async (request, reply) => {
    const params = teamIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updateTeamSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const team = await teamService.updateTeam(params.data.teamId, request.user.userId, body.data);
    return reply.send({ data: team });
  });

  // DELETE /api/teams/:teamId — Delete team
  app.delete('/:teamId', async (request, reply) => {
    const params = teamIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await teamService.deleteTeam(params.data.teamId, request.user.userId);
    return reply.status(204).send();
  });

  // ─── Members ─────────────────────────────────────────────────────

  // GET /api/teams/:teamId/members — List members
  app.get('/:teamId/members', async (request, reply) => {
    const params = teamIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const members = await teamService.listMembers(params.data.teamId, request.user.userId);
    return reply.send({ data: members });
  });

  // PUT /api/teams/:teamId/members/:memberId — Update member role
  app.put('/:teamId/members/:memberId', async (request, reply) => {
    const params = memberIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updateRoleSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const member = await teamService.updateMemberRole(
      params.data.teamId,
      request.user.userId,
      params.data.memberId,
      body.data.role,
    );
    return reply.send({ data: member });
  });

  // DELETE /api/teams/:teamId/members/:memberId — Remove member
  app.delete('/:teamId/members/:memberId', async (request, reply) => {
    const params = memberIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await teamService.removeMember(params.data.teamId, request.user.userId, params.data.memberId);
    return reply.status(204).send();
  });

  // POST /api/teams/:teamId/leave — Leave team
  app.post('/:teamId/leave', async (request, reply) => {
    const params = teamIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await teamService.leaveTeam(params.data.teamId, request.user.userId);
    return reply.send({ success: true });
  });

  // ─── Invitations ─────────────────────────────────────────────────

  // POST /api/teams/:teamId/invitations — Invite member
  app.post('/:teamId/invitations', async (request, reply) => {
    const params = teamIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = inviteSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const invitation = await teamService.inviteMember(
      params.data.teamId,
      request.user.userId,
      body.data.email,
      body.data.role,
    );
    return reply.status(201).send({ data: invitation });
  });

  // GET /api/teams/:teamId/invitations — List invitations
  app.get('/:teamId/invitations', async (request, reply) => {
    const params = teamIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const invitations = await teamService.listInvitations(params.data.teamId, request.user.userId);
    return reply.send({ data: invitations });
  });

  // DELETE /api/teams/:teamId/invitations/:invitationId — Revoke invitation
  app.delete('/:teamId/invitations/:invitationId', async (request, reply) => {
    const params = invitationIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await teamService.revokeInvitation(params.data.teamId, request.user.userId, params.data.invitationId);
    return reply.status(204).send();
  });

  // POST /api/teams/accept-invitation — Accept invitation
  app.post('/accept-invitation', async (request, reply) => {
    const body = acceptInviteSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const team = await teamService.acceptInvitation(body.data.token, request.user.userId);
    return reply.send({ data: team });
  });
}
