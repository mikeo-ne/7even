/**
 * Shared vocabulary between the local bridge (your Mac), the web control room
 * and any external A2A agent that calls us.
 */

export type TaskStatus =
  | "queued"
  | "claimed"
  | "running"
  | "waiting_approval"
  | "done"
  | "failed"
  | "cancelled";

export type TaskSource = "ui" | "schedule" | "a2a" | "cli";

export type Autonomy = "ask" | "auto";

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  brief: string | null;
  instructions: string | null;
  workspace_path: string | null;
  autonomy: Autonomy;
  colour: string;
  created_at: string;
};

export type AgentRecord = {
  id: string;
  owner_id: string;
  name: string;
  hostname: string | null;
  version: string | null;
  status: "online" | "busy" | "offline";
  last_seen_at: string | null;
  a2a_base_url: string | null;
  capabilities: string[];
  created_at: string;
};

export type Task = {
  id: string;
  owner_id: string;
  business_id: string | null;
  agent_id: string | null;
  title: string | null;
  prompt: string;
  source: TaskSource;
  origin_agent: string | null;
  context_id: string | null;
  status: TaskStatus;
  result: string | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type TaskEventKind =
  | "status"
  | "thought"
  | "tool"
  | "output"
  | "error"
  | "artifact"
  | "approval";

export type TaskEvent = {
  id: number;
  task_id: string;
  kind: TaskEventKind;
  body: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
};

export type Approval = {
  id: string;
  owner_id: string;
  task_id: string | null;
  business_id: string | null;
  action: string;
  detail: string | null;
  status: "pending" | "approved" | "rejected";
  decided_at: string | null;
  created_at: string;
};

export const TERMINAL: TaskStatus[] = ["done", "failed", "cancelled"];

export const isTerminal = (s: TaskStatus) => TERMINAL.includes(s);

/** UUID that works in Node, browsers and edge runtimes alike. */
export function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16);
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Slugify a business name into a stable url/A2A key. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "business";
}

/* ---------------------------------------------------------------- posts --- */

export type PostPlatform = "instagram" | "tiktok" | "x" | "youtube" | "facebook" | "linkedin";
export type PostFormat = "image" | "carousel" | "reel" | "video" | "story" | "text" | "thread";
export type PostStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

/** Who the account belongs to. A label post and an artist post are not the same thing. */
export type AccountRole = "label" | "artist" | "owner";

export type Post = {
  id: string;
  owner_id: string;
  business_id: string | null;
  task_id: string | null;
  approval_id: string | null;
  platform: PostPlatform;
  account_handle: string;
  account_role: AccountRole;
  format: PostFormat;
  caption: string;
  alt_text: string | null;
  hashtags: string[];
  link: string | null;
  media_urls: string[];
  scheduled_for: string | null;
  status: PostStatus;
  external_id: string | null;
  error: string | null;
  published_at: string | null;
  created_at: string;
};

/**
 * What the brain emits for a post. Small on purpose: if the model can invent a
 * field, it will, and every invented field is something to validate later.
 */
export type PostDraft = {
  platform: PostPlatform;
  account_handle: string;
  account_role: AccountRole;
  format: PostFormat;
  caption: string;
  alt_text?: string;
  hashtags?: string[];
  link?: string;
  media_urls?: string[];
  scheduled_for?: string;
};

export type PublishResult = {
  ok: boolean;
  externalId?: string;
  error?: string;
  /** True when the platform needs something the agent cannot supply (app review, 2FA). */
  needsHuman?: boolean;
};
