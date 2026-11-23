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
  /**
   * Social publishing credentials. Long-lived platform tokens only — never a
   * password, never a session cookie. Absent key means that platform cannot post,
   * and the agent says so rather than retrying.
   */
  social: {
    publishEnabled: boolean;
    tokens: Record<
      string,
      { accessToken: string; accountId?: string; extra?: Record<string, string> }
    >;
  };
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
  social: { publishEnabled: false, tokens: {} },
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
    social: {
      publishEnabled: file.social?.publishEnabled ?? DEFAULTS.social.publishEnabled,
      tokens: { ...(file.social?.tokens ?? {}) },
    },
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
  // Publishing stays off unless it is switched on deliberately.
  if (env.SEVEN_PUBLISH === "1" || env.SEVEN_PUBLISH === "true") {
    config.social.publishEnabled = true;
  }
  for (const platform of ["x", "instagram", "tiktok", "linkedin"] as const) {
    const token = env[`SEVEN_${platform.toUpperCase()}_TOKEN`];
    if (token) {
      config.social.tokens[platform] = {
        ...(config.social.tokens[platform] ?? { accessToken: "" }),
        accessToken: token,
      };
    }
    const accountId = env[`SEVEN_${platform.toUpperCase()}_ACCOUNT_ID`];
    if (accountId) {
      config.social.tokens[platform] = {
        ...(config.social.tokens[platform] ?? { accessToken: "" }),
        accountId,
      };
    }
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
