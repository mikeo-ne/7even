import type { AgentCard } from "@7even/core";
import type { AgentStore } from "./db.js";

/** Fetch and cache a peer's agent card. */
export async function fetchCard(baseUrl: string): Promise<AgentCard | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/.well-known/agent-card.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return (await res.json()) as AgentCard;
  } catch {
    return null;
  }
}

export type PeerCallResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * Send a task to a peer A2A agent and wait for the result.
 * Uses message/send with blocking, which every compliant agent must support.
 */
export async function callPeer(
  baseUrl: string,
  prompt: string,
  opts: { contextId?: string; timeoutMs?: number } = {},
): Promise<PeerCallResult> {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/a2a`;
  const body = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "message/send",
    params: {
      message: {
        kind: "message",
        messageId: crypto.randomUUID(),
        role: "user",
        contextId: opts.contextId,
        parts: [{ kind: "text", text: prompt }],
      },
      configuration: { blocking: true },
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5 * 60_000),
    });

    const json = (await res.json()) as {
      result?: { kind?: string; artifacts?: { parts?: { kind: string; text?: string }[] }[]; status?: { state?: string; message?: { parts?: { text?: string }[] } } };
      error?: { message?: string };
    };

    if (json.error) return { ok: false, error: json.error.message ?? "peer returned an error" };

    const task = json.result;
    if (!task) return { ok: false, error: "peer returned no result" };

    const artifactText = (task.artifacts ?? [])
      .flatMap((a) => a.parts ?? [])
      .filter((p) => p.kind === "text" && p.text)
      .map((p) => p.text)
      .join("\n\n")
      .trim();

    if (artifactText) return { ok: true, text: artifactText };

    const statusText = (task.status?.message?.parts ?? [])
      .map((p) => p.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    if (statusText) return { ok: true, text: statusText };

    return { ok: false, error: `peer finished in state "${task.status?.state ?? "unknown"}" with no output` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Refresh stored peer cards, so the control room can show what each peer can do. */
export async function refreshPeers(store: AgentStore, ownerId: string): Promise<void> {
  const { data } = await store.raw().from("peers").select("id, base_url").eq("owner_id", ownerId);
  for (const peer of (data as { id: string; base_url: string }[]) ?? []) {
    const card = await fetchCard(peer.base_url);
    if (card) {
      await store.raw()
        .from("peers")
        .update({ card, name: card.name, last_seen_at: new Date().toISOString() })
        .eq("id", peer.id);
    }
  }
}
