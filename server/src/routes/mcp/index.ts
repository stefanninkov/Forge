import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';

export async function mcpRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/mcp/status
  app.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    // MCP connection is managed client-side via the Webflow Designer companion app.
    // This endpoint returns the server-side awareness of the connection.
    // In production, this would check a WebSocket connection or stored state.
    return reply.send({
      data: {
        status: 'disconnected',
        siteInfo: null,
        lastConnected: null,
      },
    });
  });

  // POST /api/mcp/reconnect
  app.post('/reconnect', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Trigger reconnection attempt. In production, this would
    // attempt to re-establish the MCP WebSocket connection.
    return reply.send({
      data: {
        status: 'disconnected',
        message: 'Reconnection requires the Webflow Designer to be open with the MCP Companion App running.',
      },
    });
  });
}
