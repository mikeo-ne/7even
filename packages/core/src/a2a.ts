/**
 * Agent2Agent (A2A) wire format.
 *
 * Implements the pieces of the A2A spec that matter for a locally-hosted agent:
 *   - Agent Card discovery  (GET /.well-known/agent-card.json)
 *   - JSON-RPC 2.0 methods  (message/send, message/stream, tasks/get, tasks/cancel)
 *   - Task lifecycle        (submitted -> working -> input-required -> completed/failed)
 *
 * We keep our own richer task model in Postgres and project it onto the A2A
 * shapes at the edge, so external agents see a spec-compliant surface while the
 * control room keeps full history.
 */

import { newId, type Task, type TaskStatus } from "./types.js";

export const A2A_VERSION = "0.3.0";

export type A2ARole = "user" | "agent";

export type A2APart =
  | { kind: "text"; text: string; metadata?: Record<string, unknown> }
  | { kind: "data"; data: Record<string, unknown>; metadata?: Record<string, unknown> }
  | { kind: "file"; file: { name?: string; mimeType?: string; uri?: string; bytes?: string } };

export type A2AMessage = {
  kind: "message";
  messageId: string;
  role: A2ARole;
  parts: A2APart[];
  contextId?: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
};

export type A2ATaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "canceled"
  | "failed"
  | "rejected"
  | "unknown";

export type A2AArtifact = {
  artifactId: string;
  name?: string;
  parts: A2APart[];
  metadata?: Record<string, unknown>;
};

export type A2ATask = {
  kind: "task";
  id: string;
  contextId: string;
  status: { state: A2ATaskState; message?: A2AMessage; timestamp?: string };
  history?: A2AMessage[];
  artifacts?: A2AArtifact[];
  metadata?: Record<string, unknown>;
};

export type AgentSkill = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
};

export type AgentCard = {
  name: string;
  description: string;
  version: string;
  protocolVersion: string;
  url: string;
  preferredTransport?: "JSONRPC" | "HTTP+JSON";
  capabilities: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  provider?: { organization: string; url?: string };
};

export type A2ARequest =
  | { jsonrpc: "2.0"; id: string | number; method: "message/send"; params: { message: A2AMessage; configuration?: { blocking?: boolean } } }
  | { jsonrpc: "2.0"; id: string | number; method: "message/stream"; params: { message: A2AMessage } }
  | { jsonrpc: "2.0"; id: string | number; method: "tasks/get"; params: { id: string; historyLength?: number } }
  | { jsonrpc: "2.0"; id: string | number; method: "tasks/cancel"; params: { id: string } };

export type A2AResponse<T = unknown> =
  | { jsonrpc: "2.0"; id: string | number; result: T }
  | { jsonrpc: "2.0"; id: string | number; error: { code: number; message: string; data?: unknown } };

export const A2A_ERRORS = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internalError: -32603,
  taskNotFound: -32001,
  taskNotCancelable: -32002,
  unsupportedOperation: -32003,
} as const;

/** Map our internal statuses onto A2A's task states. */
export function toA2AState(status: TaskStatus): A2ATaskState {
  switch (status) {
    case "queued":
      return "submitted";
    case "claimed":
    case "running":
      return "working";
    case "waiting_approval":
      return "input-required";
    case "done":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "canceled";
    default:
      return "unknown";
  }
}

export function textMessage(text: string, role: A2ARole = "agent", extra?: Partial<A2AMessage>): A2AMessage {
  return {
    kind: "message",
    messageId: newId(),
    role,
    parts: [{ kind: "text", text }],
    ...extra,
  };
}

export function partsToPrompt(parts: A2APart[]): string {
  return parts
    .map((p) => {
      if (p.kind === "text") return p.text;
      if (p.kind === "data") return "```json\n" + JSON.stringify(p.data, null, 2) + "\n```";
      return `[file ${p.file.name ?? "attachment"}${p.file.uri ? ` at ${p.file.uri}` : ""}]`;
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Project an internal task into an A2A task object for external callers. */
export function taskToA2A(task: Task, contextId: string): A2ATask {
  const state = toA2AState(task.status);
  const out: A2ATask = {
    kind: "task",
    id: task.id,
    contextId: task.context_id ?? contextId,
    status: {
      state,
      timestamp: task.finished_at ?? task.started_at ?? task.created_at,
    },
    metadata: { source: task.source, title: task.title },
  };

  if (task.status === "failed" && task.error) {
    out.status.message = textMessage(task.error);
  }

  if (task.status === "waiting_approval") {
    out.status.message = textMessage(
      "This task needs a human decision in the 7even control room before it can continue.",
    );
  }

  if (task.result) {
    out.artifacts = [
      {
        artifactId: `${task.id}-result`,
        name: task.title ?? "Result",
        parts: [{ kind: "text", text: task.result }],
      },
    ];
  }

  return out;
}

export function agentCard(baseUrl: string, opts: { name: string; description: string; version: string; skills: AgentSkill[] }): AgentCard {
  return {
    name: opts.name,
    description: opts.description,
    version: opts.version,
    protocolVersion: A2A_VERSION,
    url: `${baseUrl.replace(/\/$/, "")}/a2a`,
    preferredTransport: "JSONRPC",
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    skills: opts.skills,
    provider: { organization: "7even" },
  };
}
