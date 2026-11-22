import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Approval, Business, Task, TaskEventKind, TaskStatus } from "@7even/core";

export type Db = {
  client: SupabaseClient;
  agentId: string | null;
};

export function createDb(url: string, serviceKey: string): Db {
  return {
    client: createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    agentId: null,
  };
}

export class AgentStore {
  private readonly db: Db;
  private readonly agentName: string;

  constructor(db: Db, agentName: string) {
    this.db = db;
    this.agentName = agentName;
  }

  /** Register (or refresh) this bridge and remember its row id. */
  async register(opts: {
    ownerId: string;
    tokenHash: string;
    hostname: string;
    version: string;
    capabilities: string[];
    a2aBaseUrl: string | null;
  }): Promise<string> {
    const { data: existing } = await this.db.client
      .from("agents")
      .select("id")
      .eq("owner_id", opts.ownerId)
      .eq("hostname", opts.hostname)
      .maybeSingle();

    if (existing?.id) {
      await this.db.client
        .from("agents")
        .update({
          name: this.agentName,
          status: "online",
          last_seen_at: new Date().toISOString(),
          version: opts.version,
          a2a_base_url: opts.a2aBaseUrl,
          capabilities: opts.capabilities,
          agent_token_hash: opts.tokenHash,
        })
        .eq("id", existing.id);
      this.db.agentId = existing.id;
      return existing.id;
    }

    const { data, error } = await this.db.client
      .from("agents")
      .insert({
        owner_id: opts.ownerId,
        name: this.agentName,
        hostname: opts.hostname,
        status: "online",
        last_seen_at: new Date().toISOString(),
        version: opts.version,
        a2a_base_url: opts.a2aBaseUrl,
        capabilities: opts.capabilities,
        agent_token_hash: opts.tokenHash,
      })
      .select("id")
      .single();

    if (error) throw new Error(`register agent: ${error.message}`);
    this.db.agentId = data.id as string;
    return this.db.agentId;
  }

  async heartbeat(status: "online" | "busy" | "offline" = "online"): Promise<void> {
    if (!this.db.agentId) return;
    await this.db.client
      .from("agents")
      .update({ status, last_seen_at: new Date().toISOString() })
      .eq("id", this.db.agentId);
  }

  /** Find any owner with a business — the bridge serves one owner per install. */
  async anyOwnerId(): Promise<string | null> {
    const { data } = await this.db.client
      .from("businesses")
      .select("owner_id")
      .limit(1)
      .maybeSingle();
    return data?.owner_id ?? null;
  }

  async getBusiness(id: string | null): Promise<Business | null> {
    if (!id) return null;
    const { data } = await this.db.client.from("businesses").select("*").eq("id", id).maybeSingle();
    return (data as Business | null) ?? null;
  }

  async listBusinesses(ownerId: string): Promise<Business[]> {
    const { data } = await this.db.client
      .from("businesses")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at");
    return (data as Business[]) ?? [];
  }

  /** Atomically-ish claim one queued task so two bridges never run the same work. */
  async claimNext(): Promise<Task | null> {
    const { data: candidates } = await this.db.client
      .from("tasks")
      .select("*")
      .eq("status", "queued")
      .order("created_at")
      .limit(3);

    for (const candidate of (candidates as Task[]) ?? []) {
      const { data: claimed } = await this.db.client
        .from("tasks")
        .update({
          status: "claimed",
          agent_id: this.db.agentId,
          started_at: new Date().toISOString(),
        })
        .eq("id", candidate.id)
        .eq("status", "queued")
        .select("*")
        .maybeSingle();

      if (claimed) return claimed as Task;
    }
    return null;
  }

  async setStatus(taskId: string, status: TaskStatus, patch: Partial<Task> = {}): Promise<void> {
    await this.db.client.from("tasks").update({ status, ...patch }).eq("id", taskId);
    await this.event(taskId, "status", status);
  }

  async finish(taskId: string, result: string): Promise<void> {
    await this.db.client
      .from("tasks")
      .update({ status: "done", result, finished_at: new Date().toISOString() })
      .eq("id", taskId);
    await this.event(taskId, "output", result);
    await this.event(taskId, "status", "done");
  }

  async fail(taskId: string, error: string): Promise<void> {
    await this.db.client
      .from("tasks")
      .update({ status: "failed", error, finished_at: new Date().toISOString() })
      .eq("id", taskId);
    await this.event(taskId, "error", error);
    await this.event(taskId, "status", "failed");
  }

  async event(
    taskId: string,
    kind: TaskEventKind,
    body: string | null,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const ownerId = await this.ownerForTask(taskId);
    if (!ownerId) return;
    await this.db.client
      .from("task_events")
      .insert({ task_id: taskId, owner_id: ownerId, kind, body, data: data ?? null });
  }

  private ownerCache = new Map<string, string>();

  private async ownerForTask(taskId: string): Promise<string | null> {
    const cached = this.ownerCache.get(taskId);
    if (cached) return cached;
    const { data } = await this.db.client
      .from("tasks")
      .select("owner_id")
      .eq("id", taskId)
      .maybeSingle();
    const owner = data?.owner_id ?? null;
    if (owner) this.ownerCache.set(taskId, owner);
    return owner;
  }

  async queueApproval(input: {
    ownerId: string;
    taskId: string;
    businessId: string | null;
    action: string;
    detail?: string | null;
  }): Promise<Approval | null> {
    const { data, error } = await this.db.client
      .from("approvals")
      .insert({
        owner_id: input.ownerId,
        task_id: input.taskId,
        business_id: input.businessId,
        action: input.action,
        detail: input.detail ?? null,
      })
      .select("*")
      .single();
    if (error) return null;
    await this.event(input.taskId, "approval", input.action);
    return data as Approval;
  }

  async getTask(id: string): Promise<Task | null> {
    const { data } = await this.db.client.from("tasks").select("*").eq("id", id).maybeSingle();
    return (data as Task | null) ?? null;
  }

  async createTask(input: {
    ownerId: string;
    businessId: string | null;
    title: string | null;
    prompt: string;
    source: Task["source"];
    originAgent?: string | null;
    contextId?: string | null;
  }): Promise<Task> {
    const { data, error } = await this.db.client
      .from("tasks")
      .insert({
        owner_id: input.ownerId,
        business_id: input.businessId,
        agent_id: this.db.agentId,
        title: input.title,
        prompt: input.prompt,
        source: input.source,
        origin_agent: input.originAgent ?? null,
        context_id: input.contextId ?? null,
        status: "queued",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Task;
  }

  /** Escape hatch for the few queries that are easier inline. */
  raw(): SupabaseClient {
    return this.db.client;
  }

  async touchSchedule(id: string, lastRun: string, nextRun: string | null): Promise<void> {
    await this.db.client
      .from("schedules")
      .update({ last_run_at: lastRun, next_run_at: nextRun })
      .eq("id", id);
  }
}
