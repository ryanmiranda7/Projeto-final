import type { FastifyInstance } from "fastify";
import { generateDietPlan } from "../agent";

export async function planRoutes(app: FastifyInstance) {
  app.post("/plan", async (request, reply) => {
    // Configuração dos cabeçalhos para Server-Sent Events (SSE)
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");

    try {
      // Stream dos dados diretamente no response
      for await (const delta of generateDietPlan(request.body as any)) {
        reply.raw.write(delta);
      }
    } catch (err: any) {
      request.log.error(err);
      reply.raw.write(`event: error\n ${JSON.stringify(err.message)}`);
    } finally {
      reply.raw.end();
    }

    return reply;
  });
}