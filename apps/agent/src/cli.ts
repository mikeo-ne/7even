#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { hostname } from "node:os";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { SKILLS } from "@7even/core";
import { CONFIG_PATH, loadConfig, saveConfig, validateConfig, type Config } from "./config.js";
import { AgentStore, createDb } from "./db.js";
import { describeBrain } from "./brain.js";
import { startServer } from "./server.js";
import { startScheduler } from "./scheduler.js";
import { runTask } from "./runner.js";
import { fetchCard, refreshPeers } from "./peers.js";

const VERSION = "0.1.0";

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

async function init() {
  const config = await loadConfig();
  const rl = createInterface({ input: stdin, output: stdout });

  log("\n  7even — setup\n  ─────────────");

  const ask = async (label: string, fallback = "") => {
    const answer = (await rl.question(`  ${label}${fallback ? ` [${fallback}]` : ""}: `)).trim();
    return answer || fallback;
  };

  config.supabaseUrl = await ask("Supabase project URL", config.supabaseUrl || "");
  config.supabaseServiceKey = await ask(
    "Supabase service-role key (hidden in ~/.7even/config.json)",
    config.supabaseServiceKey || "",
  );
  config.agentName = await ask("Name for this Mac", config.agentName || hostname());
  config.publicUrl = await ask(
    "Public URL for A2A peers (empty = localhost only)",
    config.publicUrl || "",
  );
  config.workspaceRoot = await ask("Where should businesses live", config.workspaceRoot);

  if (!config.agentToken) config.agentToken = randomBytes(24).toString("base64url");

  await saveConfig(config);
  rl.close();

  log(`\n  Saved to ${CONFIG_PATH} (chmod 600)`);
  log(`  Agent token: ${config.agentToken}`);
  log("  Add that token to the control room when you connect this Mac.\n");
}

async function start() {
  const config = await loadConfig();
  const problems = validateConfig(config);
  if (problems.length) {
    for (const p of problems) log(`  ✗ ${p}`);
    log("\n  Run `7even init` first.\n");
    process.exitCode = 1;
    return;
  }

  const db = createDb(config.supabaseUrl, config.supabaseServiceKey);
  const store = new AgentStore(db, config.agentName);

  // One owner per install: the bridge serves whichever account owns businesses.
  let owner: string | null = null;
  const refreshOwner = async () => {
    owner = owner ?? (await store.anyOwnerId());
    return owner;
  };
  await refreshOwner();

  if (!owner) {
    log("  No businesses found in Supabase yet.");
    log("  Create one in the control room, then this bridge will pick it up.\n");
  }

  const tokenHash = createHash("sha256").update(config.agentToken).digest("hex");
  if (owner) {
    await store.register({
      ownerId: owner,
      tokenHash,
      hostname: hostname(),
      version: VERSION,
      capabilities: SKILLS.map((s) => s.id),
      a2aBaseUrl: config.publicUrl || `http://localhost:${config.port}`,
    });
  }

  await startServer({
    store,
    config,
    version: VERSION,
    ownerId: () => owner,
  });

  const stopScheduler = startScheduler(store);

  const brain = await describeBrain(config);
  log("\n  7even bridge running");
  log(`  ──────────────────────`);
  log(`  agent card   http://localhost:${config.port}/.well-known/agent-card.json`);
  log(`  a2a rpc      http://localhost:${config.port}/a2a`);
  log(`  brain        ${brain}`);
  log(`  workspaces   ${config.workspaceRoot}`);
  log(`  polling      every ${config.pollMs}ms\n`);

  // Presence heartbeat every 20s.
  const beat = setInterval(() => {
    void (async () => {
      if (!owner) await refreshOwner();
      await store.heartbeat("online");
    })();
  }, 20_000);

  // Peer card refresh every 5 minutes (cheap, keeps the registry current).
  const peers = setInterval(() => {
    void (async () => {
      const current = owner ?? (await refreshOwner());
      if (current) await refreshPeers(store, current);
    })();
  }, 5 * 60_000);

  // The work loop.
  let busy = false;
  const loop = setInterval(() => {
    void (async () => {
      if (busy) return;
      busy = true;
      try {
        const task = await store.claimNext();
        if (task) {
          log(`  ▶ ${task.title ?? task.prompt.slice(0, 60)}`);
          await runTask(store, config, task);
          log(`  ✓ ${task.id.slice(0, 8)}`);
        }
      } catch (error) {
        log(`  ! ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        busy = false;
      }
    })();
  }, config.pollMs);

  const shutdown = async () => {
    clearInterval(loop);
    clearInterval(beat);
    clearInterval(peers);
    stopScheduler();
    await store.heartbeat("offline").catch(() => undefined);
    log("\n  Bridge stopped.\n");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function status() {
  const config = await loadConfig();
  const problems = validateConfig(config);
  log("\n  7even status\n  ────────────");
  log(`  config       ${CONFIG_PATH}`);
  log(`  supabase     ${config.supabaseUrl || "(unset)"}`);
  log(`  brain        ${await describeBrain(config)}`);
  log(`  port         ${config.port}`);
  log(`  public url   ${config.publicUrl || "(localhost only)"}`);
  log(`  workspaces   ${config.workspaceRoot}`);
  if (problems.length) {
    log(`\n  ✗ ${problems.join("\n  ✗ ")}`);
  } else {
    const res = await fetch(`http://localhost:${config.port}/health`).catch(() => null);
    const health = res ? ((await res.json()) as { ok?: boolean; uptime?: number }) : null;
    log(`  bridge       ${health?.ok ? `up (${health.uptime}s)` : "not running"}`);
  }
  log("");
}

async function task(promptParts: string[]) {
  const prompt = promptParts.join(" ").trim();
  if (!prompt) {
    log("  Usage: 7even task \"what you want done\" [--business <slug>]");
    return;
  }

  const config = await loadConfig();
  const problems = validateConfig(config);
  if (problems.length) {
    log(`  ✗ ${problems[0]}`);
    return;
  }

  const store = new AgentStore(createDb(config.supabaseUrl, config.supabaseServiceKey), config.agentName);
  const owner = await store.anyOwnerId();
  if (!owner) {
    log("  No owner/business found in Supabase yet.");
    return;
  }

  const businesses = await store.listBusinesses(owner);
  const flagIndex = promptParts.indexOf("--business");
  const slug = flagIndex >= 0 ? promptParts[flagIndex + 1] : undefined;
  const business = slug ? businesses.find((b) => b.slug === slug) ?? null : businesses[0] ?? null;

  if (!business && businesses.length > 1) {
    log("  Several businesses exist — pick one with --business <slug>:");
    for (const b of businesses) log(`    ${b.slug}  ${b.name}`);
    return;
  }

  const created = await store.createTask({
    ownerId: owner,
    businessId: business?.id ?? null,
    title: prompt.slice(0, 80),
    prompt,
    source: "cli",
  });

  log(`\n  queued ${created.id}${business ? ` for ${business.name}` : ""}`);
  log("  Ctrl-C to stop waiting (the bridge keeps working).\n");

  let lastEventCount = 0;
  const render = async () => {
    const { data } = await store
      .raw()
      .from("task_events")
      .select("id, kind, body")
      .eq("task_id", created.id)
      .order("id");
    const events = (data as { id: number; kind: string; body: string | null }[]) ?? [];
    for (const e of events.slice(lastEventCount)) {
      if (e.kind === "thought" && e.body) log(`  · ${e.body.split("\n")[0].slice(0, 160)}`);
      if (e.kind === "tool" && e.body) log(`  ⚙ ${e.body}`);
    }
    lastEventCount = events.length;

    const current = await store.getTask(created.id);
    if (!current) return true;
    if (["done", "failed", "cancelled", "waiting_approval"].includes(current.status)) {
      log(`\n  ${current.status.toUpperCase()}\n`);
      log(current.result ?? current.error ?? "(no output)");
      log("");
      return true;
    }
    return false;
  };

  // If the bridge is not running, run the task in-process instead.
  const health = await fetch(`http://localhost:${config.port}/health`).catch(() => null);
  if (!health) {
    log("  bridge not running — executing inline\n");
    const claimed = await store.claimNext();
    if (claimed) await runTask(store, config, claimed);
    await render();
    return;
  }

  while (!(await render())) {
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function peer(command: string | undefined, args: string[]) {
  const config = await loadConfig();
  const store = new AgentStore(createDb(config.supabaseUrl, config.supabaseServiceKey), config.agentName);
  const owner = await store.anyOwnerId();
  if (!owner) {
    log("  Set up a business in the control room first.");
    return;
  }

  if (!command || command === "list") {
    const { data } = await store.raw().from("peers").select("name, base_url, card").eq("owner_id", owner);
    const peers = (data as { name: string; base_url: string; card: { skills?: { name: string }[] } | null }[]) ?? [];
    if (!peers.length) {
      log("\n  No peers yet. Add one:\n    7even peer add <name> <base-url>\n");
      return;
    }
    log("\n  Peers\n  ─────");
    for (const p of peers) {
      log(`  ${p.name.padEnd(18)} ${p.base_url}`);
      const skills = p.card?.skills?.map((s) => s.name).join(", ");
      if (skills) log(`  ${"".padEnd(18)} ${skills}`);
    }
    log("");
    return;
  }

  if (command === "add") {
    const [name, baseUrl] = args;
    if (!name || !baseUrl) {
      log("  Usage: 7even peer add <name> <base-url>");
      return;
    }
    const card = await fetchCard(baseUrl);
    const { error } = await store.raw().from("peers").insert({
      owner_id: owner,
      name: card?.name ?? name,
      base_url: baseUrl,
      card,
      last_seen_at: card ? new Date().toISOString() : null,
    });
    if (error) {
      log(`  ✗ ${error.message}`);
      return;
    }
    log(`  ✓ added ${card?.name ?? name}${card ? "" : " (card not reachable yet)"}`);
    return;
  }

  if (command === "refresh") {
    await refreshPeers(store, owner);
    log("  ✓ peer cards refreshed");
    return;
  }

  log("  Usage: 7even peer [list|add|refresh]");
}

async function install() {
  const config = await loadConfig();
  const plistPath = `${process.env.HOME}/Library/LaunchAgents/ne.seven.bridge.plist`;
  const nodePath = process.execPath;
  const script = `${process.cwd()}/dist/cli.js`;

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>ne.seven.bridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${script}</string>
    <string>start</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${process.env.HOME}/Library/Logs/7even.log</string>
  <key>StandardErrorPath</key><string>${process.env.HOME}/Library/Logs/7even.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
`;

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(`${process.env.HOME}/Library/LaunchAgents`, { recursive: true });
  await mkdir(`${process.env.HOME}/Library/Logs`, { recursive: true });
  await writeFile(plistPath, plist, "utf8");

  log(`  ✓ wrote ${plistPath}`);
  log("  Load it with:");
  log(`    launchctl load -w ${plistPath}`);
  log("  Logs:");
  log(`    tail -f ${process.env.HOME}/Library/Logs/7even.log`);
  log(`\n  (config: ${CONFIG_PATH}, port ${config.port})\n`);

  if (process.platform !== "darwin") {
    log("  Note: this command targets macOS launchd; on Linux use systemd instead.\n");
  }
}

function help() {
  log(`
  7even — an agent that runs your businesses on your own Mac

  Usage
    7even init                 set up Supabase + agent token
    7even start                run the bridge (A2A server + task loop)
    7even status               show config, brain and bridge health
    7even task "<prompt>"      queue work from the terminal
        --business <slug>      pick which business it belongs to
    7even peer list            show agents you can delegate to
    7even peer add <n> <url>   register a peer by its base URL
    7even peer refresh         re-fetch peer agent cards
    7even install              install as a macOS launch agent
    7even help                 this message

  Environment
    SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   override config file
    ANTHROPIC_API_KEY                          fallback brain
    SEVEN_BRAIN=claude-cli|anthropic-api       force a brain
    SEVEN_PUBLIC_URL                           public URL for A2A peers
`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case "init":
      return init();
    case "start":
      return start();
    case "status":
      return status();
    case "task":
      return task(rest);
    case "peer":
      return peer(rest[0], rest.slice(1));
    case "install":
      return install();
    case "version":
    case "--version":
    case "-v":
      log(VERSION);
      return;
    case "help":
    case undefined:
    case "--help":
    case "-h":
      return help();
    default:
      log(`  Unknown command: ${command}`);
      return help();
  }
}

main().catch((error) => {
  log(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

// Keep spawn referenced for the install path on some runtimes.
void spawn;
