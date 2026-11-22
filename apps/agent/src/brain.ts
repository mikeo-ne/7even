import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import type { Config } from "./config.js";

export type BrainRun = {
  text: string;
  used: "claude-cli" | "anthropic-api";
};

export type BrainEvents = {
  onThought?: (text: string) => void;
  onToolUse?: (name: string, detail?: string) => void;
};

export class BrainError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
  }
}

async function which(bin: string): Promise<string | null> {
  if (bin.includes("/")) {
    try {
      await access(bin, constants.X_OK);
      return bin;
    } catch {
      return null;
    }
  }
  const path = process.env.PATH ?? "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin";
  for (const dir of path.split(":")) {
    const candidate = join(dir, bin);
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Run one task through whichever brain is available.
 *
 * Claude Code CLI is preferred ("auto"): it already carries the owner's tools,
 * permissions and MCP servers, and it costs no extra key. The Anthropic API is
 * the fallback for headless installs that only have a key.
 */
export async function runBrain(
  config: Config,
  prompt: string,
  opts: { cwd: string; events?: BrainEvents; timeoutMs?: number },
): Promise<BrainRun> {
  const mode = config.brain.mode;
  const cli = await which(config.brain.claudeBin);

  if ((mode === "auto" || mode === "claude-cli") && cli) {
    return runClaudeCli(config, cli, prompt, opts);
  }

  if (mode === "claude-cli" && !cli) {
    throw new BrainError(
      `Could not find the Claude Code CLI ("${config.brain.claudeBin}").`,
      "Install it with `npm i -g @anthropic-ai/claude-code`, or set SEVEN_BRAIN=anthropic-api with ANTHROPIC_API_KEY.",
    );
  }

  if (config.brain.anthropicKey) {
    return runAnthropicApi(config, prompt, opts.events);
  }

  throw new BrainError(
    "No brain available: Claude Code CLI not found and no ANTHROPIC_API_KEY set.",
    "Install Claude Code (`npm i -g @anthropic-ai/claude-code`) or export ANTHROPIC_API_KEY.",
  );
}

function runClaudeCli(
  config: Config,
  bin: string,
  prompt: string,
  opts: { cwd: string; events?: BrainEvents; timeoutMs?: number },
): Promise<BrainRun> {
  const args = [
    "-p",
    prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--permission-mode",
    "acceptEdits",
    "--model",
    config.brain.model,
  ];

  return new Promise<BrainRun>((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: opts.cwd,
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let buffer = "";
    let final = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(
      () => {
        if (settled) return;
        child.kill("SIGTERM");
        settled = true;
        reject(new BrainError("Claude Code timed out.", "Raise the timeout with SEVEN_TASK_TIMEOUT_MS."));
      },
      opts.timeoutMs ?? 15 * 60_000,
    );

    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      let index: number;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line) continue;
        try {
          const evt = JSON.parse(line) as Record<string, unknown>;
          const type = String(evt.type ?? "");

          if (type === "assistant" && evt.message) {
            const content = (evt.message as { content?: unknown[] }).content ?? [];
            for (const block of content) {
              const b = block as { type?: string; text?: string; name?: string; input?: unknown };
              if (b.type === "text" && b.text) {
                final += (final ? "\n" : "") + b.text.trim();
                opts.events?.onThought?.(b.text.trim());
              } else if (b.type === "tool_use" && b.name) {
                opts.events?.onToolUse?.(b.name, JSON.stringify(b.input ?? {}).slice(0, 400));
              }
            }
          }

          if (type === "result" && typeof evt.result === "string") {
            final = evt.result.trim() || final;
          }
        } catch {
          // Non-JSON line (e.g. a warning) — keep it for diagnostics only.
          stderr += line + "\n";
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      reject(new BrainError(`Failed to start Claude Code: ${err.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      if (code !== 0 && !final) {
        reject(
          new BrainError(
            `Claude Code exited with ${code}.`,
            stderr.trim().split("\n").slice(-3).join(" "),
          ),
        );
        return;
      }
      resolve({ text: final.trim(), used: "claude-cli" });
    });
  });
}

async function runAnthropicApi(
  config: Config,
  prompt: string,
  events?: BrainEvents,
): Promise<BrainRun> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.brain.anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.brain.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new BrainError(`Anthropic API returned ${res.status}.`, body.slice(0, 300));
  }

  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (json.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n")
    .trim();

  events?.onThought?.(text);
  return { text, used: "anthropic-api" };
}

export async function describeBrain(config: Config): Promise<string> {
  const cli = await which(config.brain.claudeBin);
  if ((config.brain.mode === "auto" || config.brain.mode === "claude-cli") && cli) {
    return `Claude Code CLI (${cli}) · ${config.brain.model}`;
  }
  if (config.brain.anthropicKey) return `Anthropic API · ${config.brain.model}`;
  return "none (install Claude Code or set ANTHROPIC_API_KEY)";
}
