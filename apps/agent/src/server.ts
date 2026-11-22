import Fastify from "fastify";
import {
  A2A_ERRORS,
  A2A_VERSION,
  AGENT_DESCRIPTION,
  SKILLS,
  agentCard,
  partsToPrompt,
  taskToA2A,
  textMessage,
  type A2AMessage,
} from "@7even/core";
import { createHash, timingSafeEqual } from "node:crypto";
import type { AgentStore } from "./db.js";
import type { Config } from "./config.js";
import type { Task } from "@7even/core";

export type ServerDeps = {
  store: AgentStore;
  config: Config;
  ownerId: () => string | null;
  version: string;
};

function tokenMatches(expected: string, provided: string | undefined): boolean {
  if (!provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The bridge is two things in one process:
 *
 *  1. A local JSON-RPC endpoint that the control room's cloud agent can post
 *     tasks to (bearer-token protected, no inbound ports required if you also
 *     run a tunnel).
 *  2. A spec-shaped A2A agent — card at /.well-known/agent-card.json, methods
 *     at /a2a — so other agents can discover and call it directly.
 */
export async function startServer(deps: ServerDeps) {
  const { store, config, ownerId } = deps;

  const app = Fastify({ logger: false, bodyLimit: 2 * 1024 * 1024 });

  app.addHook("onSend", async (_req, reply) => {
    reply.header("access-control-allow-origin", "*");
    reply.header("access-control-allow-headers", "authorization, content-type");
    reply.header("access-control-allow-methods", "GET, POST, OPTIONS");
  });

  app.options("*", async (_req, reply) => reply.code(204).send());

  const baseUrl = () =>
    config.publicUrl || `http://localhost:${config.port}`;

  app.get("/", async () => ({
    name: "7even bridge",
    version: deps.version,
    protocol: `A2A ${A2A_VERSION}`,
    card: "/.well-known/agent-card.json",
    rpc: "/a2a",
    health: "/health",
  }));

  app.get("/health", async () => ({
    ok: true,
    agent: config.agentName,
    owner: Boolean(ownerId()),
    uptime: Math.round(process.uptime()),
  }));

  app.get("/.well-known/agent-card.json", async () =>
    agentCard(baseUrl(), {
      name: `7even · ${config.agentName}`,
      description: AGENT_DESCRIPTION,
      version: deps.version,
      skills: SKILLS,
    }),
  );

  app.post("/a2a", async (request, reply) => {
    const body = request.body as {
      jsonrpc?: string;
      id?: string | number;
      method?: string;
      params?: Record<string, unknown>;
    };

    const id = body?.id ?? null;
    const auth = request.headers.authorization;

    if (!tokenMatches(config.agentToken, auth?.replace(/^Bearer\s+/i, ""))) {
      return reply.code(401).send({
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: "Unauthorized: send the agent token as a bearer token." },
      });
    }

    const owner = ownerId();
    if (!owner) {
      return reply.code(503).send({
        jsonrpc: "2.0",
        id,
        error: { code: A2A_ERRORS.internalError, message: "No owner configured on this bridge yet." },
      });
    }

    const fail = (code: number, message: string) =>
      reply.send({ jsonrpc: "2.0", id, error: { code, message } });

    switch (body.method) {
      case "message/send":
      case "message/stream": {
        const message = (body.params?.message ?? null) as A2AMessage | null;
        if (!message?.parts?.length) {
          return fail(A2A_ERRORS.invalidParams, "params.message.parts is required");
        }

        const prompt = partsToPrompt(message.parts);
        const contextId = message.contextId ?? crypto.randomUUID();
        const from = (message.metadata?.from as string | undefined) ?? "anonymous agent";

        const task = await store.createTask({
          ownerId: owner,
          businessId: (message.metadata?.businessId as string | undefined) ?? null,
          title: prompt.slice(0, 80),
          prompt,
          source: "a2a",
          originAgent: from,
          contextId,
        });

        await store.event(task.id, "thought", `Received from ${from}`);

        if (body.method === "message/stream") {
          // Stream the task envelope immediately, then poll until terminal.
          reply.raw.writeHead(200, {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            connection: "keep-alive",
            "access-control-allow-origin": "*",
          });

          const send = (payload: unknown) =>
            reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);

          let last = "";
          const deadline = Date.now() + 10 * 60_000;
          while (Date.now() < deadline) {
            const current = (await store.getTask(task.id)) as Task | null;
            if (!current) break;
            const projection = taskToA2A(current, contextId);
            const serialised = JSON.stringify(projection);
            if (serialised !== last) {
              send({ jsonrpc: "2.0", id, result: projection });
              last = serialised;
            }
            if (["done", "failed", "cancelled", "waiting_approval"].includes(current.status)) break;
            await new Promise((r) => setTimeout(r, 1200));
          }
          reply.raw.end();
          return reply;
        }

        const blocking = (body.params?.configuration as { blocking?: boolean } | undefined)?.blocking;
        if (!blocking) {
          return reply.send({ jsonrpc: "2.0", id, result: taskToA2A(task, contextId) });
        }

        const deadline = Date.now() + 10 * 60_000;
        while (Date.now() < deadline) {
          const current = await store.getTask(task.id);
          if (!current) break;
          if (["done", "failed", "cancelled", "waiting_approval"].includes(current.status)) {
            return reply.send({ jsonrpc: "2.0", id, result: taskToA2A(current, contextId) });
          }
          await new Promise((r) => setTimeout(r, 900));
        }

        const latest = await store.getTask(task.id);
        return reply.send({
          jsonrpc: "2.0",
          id,
          result: taskToA2A(
            latest ?? task,
            contextId,
          ),
        });
      }

      case "tasks/get": {
        const taskId = String(body.params?.id ?? "");
        const task = await store.getTask(taskId);
        if (!task) return fail(A2A_ERRORS.taskNotFound, "Task not found");
        return reply.send({
          jsonrpc: "2.0",
          id,
          result: taskToA2A(task, task.context_id ?? String(id)),
        });
      }

      case "tasks/cancel": {
        const taskId = String(body.params?.id ?? "");
        const task = await store.getTask(taskId);
        if (!task) return fail(A2A_ERRORS.taskNotFound, "Task not found");
        if (["done", "failed", "cancelled"].includes(task.status)) {
          return fail(A2A_ERRORS.taskNotCancelable, `Task is already ${task.status}`);
        }
        await store.setStatus(taskId, "cancelled", { finished_at: new Date().toISOString() });
        const updated = await store.getTask(taskId);
        return reply.send({
          jsonrpc: "2.0",
          id,
          result: taskToA2A(updated ?? task, task.context_id ?? String(id)),
        });
      }

      default:
        return fail(A2A_ERRORS.methodNotFound, `Unknown method: ${body.method ?? "(none)"}`);
    }
  });

  /** Ping endpoint for the control room's "is my Mac awake" check. */
  app.post("/ping", async (request, reply) => {
    const auth = request.headers.authorization;
    if (!tokenMatches(config.agentToken, auth?.replace(/^Bearer\s+/i, ""))) {
      return reply.code(401).send({ ok: false });
    }
    await store.heartbeat("online");
    return {
      ok: true,
      agent: config.agentName,
      message: textMessage("pong").parts,
      time: new Date().toISOString(),
    };
  });

  await app.listen({ host: "0.0.0.0", port: config.port });
  return app;
}
