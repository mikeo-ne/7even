import { readFile, writeFile, mkdir, chmod } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type Config = {
  supabaseUrl: string;
  /** Service-role key. Lives only in ~/.7even/config.json (chmod 600) — never in the repo. */
  supabaseServiceKey: string;
  agentName: string;
  /** Token external A2A agents must present to call this bridge. */
  agentToken: string;
  port: number;
  /** Cloudflare quick tunnel / ngrok etc. Public URL peers can reach. Empty = LAN only. */
  publicUrl: string;
  workspaceRoot: string;
  brain: {
    mode: "auto" | "claude-cli" | "anthropic-api";
    claudeBin: string;
    anthropicKey: string;
    model: string;
  };
  pollMs: number;
};

export const CONFIG_DIR = join(homedir(), ".7even");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULTS: Config = {
  supabaseUrl: "",
  supabaseServiceKey: "",
  agentName: "Mac",
  agentToken: "",
  port: 4319,
  publicUrl: "",
  workspaceRoot: join(homedir(), "7even-workspaces"),
  brain: {
    mode: "auto",
    claudeBin: "claude",
    anthropicKey: "",
    model: "claude-sonnet-4-5-20250929",
  },
  pollMs: 2000,
};

export async function loadConfig(): Promise<Config> {
  let file: Partial<Config> = {};
  try {
    file = JSON.parse(await readFile(CONFIG_PATH, "utf8")) as Partial<Config>;
  } catch {
    file = {};
  }

  const env = process.env;
  const config: Config = {
    ...DEFAULTS,
    ...file,
    brain: { ...DEFAULTS.brain, ...(file.brain ?? {}) },
  };

  // Environment always wins, so `SUPABASE_URL=... 7even start` works in CI or launchd.
  config.supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || config.supabaseUrl;
  config.supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceKey;
  config.agentToken = env.SEVEN_AGENT_TOKEN || config.agentToken;
  config.port = env.PORT ? Number(env.PORT) : config.port;
  config.publicUrl = env.SEVEN_PUBLIC_URL || config.publicUrl;
  config.brain.anthropicKey = env.ANTHROPIC_API_KEY || config.brain.anthropicKey;
  config.brain.model = env.SEVEN_MODEL || config.brain.model;
  if (env.SEVEN_BRAIN === "claude-cli" || env.SEVEN_BRAIN === "anthropic-api") {
    config.brain.mode = env.SEVEN_BRAIN;
  }

  return config;
}

export async function saveConfig(config: Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
  await chmod(CONFIG_PATH, 0o600).catch(() => undefined);
}

export function validateConfig(config: Config): string[] {
  const problems: string[] = [];
  if (!config.supabaseUrl) problems.push("supabaseUrl is empty — run `7even init`");
  if (!config.supabaseServiceKey) problems.push("supabaseServiceKey is empty — run `7even init`");
  if (!config.agentToken) problems.push("agentToken is empty — run `7even init`");
  return problems;
}
