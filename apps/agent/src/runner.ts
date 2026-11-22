import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import {
  buildTaskPrompt,
  channelFile,
  extractApprovals,
  slugify,
  type Business,
  type Task,
} from "@7even/core";
import type { AgentStore } from "./db.js";
import { BrainError, runBrain } from "./brain.js";
import type { Config } from "./config.js";

const running = new Set<string>();

/**
 * Execute one task: assemble context, run the brain in the business workspace,
 * stream progress into the event log, and either finish or park for approval.
 *
 * Nothing here is provider-specific — swapping the brain does not change how a
 * task is tracked, which is what keeps the control room honest.
 */
export async function runTask(store: AgentStore, config: Config, task: Task): Promise<void> {
  if (running.has(task.id)) return;
  running.add(task.id);

  try {
    await store.setStatus(task.id, "running");

    const business = await store.getBusiness(task.business_id);
    const cwd = await ensureWorkspace(config, business);
    const peer = task.origin_agent ? { name: task.origin_agent } : null;

    const prompt = buildTaskPrompt({
      prompt: task.prompt,
      business,
      origin: task.source,
      peer,
      approvalsRequired: business ? business.autonomy !== "auto" : true,
    });

    await store.event(task.id, "thought", `Working in ${cwd}`);
    await store.heartbeat("busy");

    const run = await runBrain(config, prompt, {
      cwd,
      events: {
        onThought: (text) => void store.event(task.id, "thought", text.slice(0, 4000)),
        onToolUse: (name, detail) =>
          void store.event(task.id, "tool", name, detail ? { input: detail } : undefined),
      },
      timeoutMs: Number(process.env.SEVEN_TASK_TIMEOUT_MS ?? 15 * 60_000),
    });

    const { cleaned, approvals } = extractApprovals(run.text || "");

    for (const action of approvals) {
      await store.queueApproval({
        ownerId: task.owner_id,
        taskId: task.id,
        businessId: task.business_id,
        action,
        detail: cleaned.slice(0, 2000) || null,
      });
    }

    if (approvals.length > 0) {
      await store.raw()
        .from("tasks")
        .update({ status: "waiting_approval", result: cleaned })
        .eq("id", task.id);
      await store.event(task.id, "status", "waiting_approval");
      await store.event(
        task.id,
        "output",
        `Waiting for approval:\n${approvals.map((a) => `• ${a}`).join("\n")}`,
      );
    } else {
      await store.finish(task.id, cleaned || "(no output)");
    }

    await store.heartbeat("online");
  } catch (error) {
    const message =
      error instanceof BrainError
        ? `${error.message}${error.hint ? `\n\n${error.hint}` : ""}`
        : error instanceof Error
          ? error.message
          : String(error);
    await store.fail(task.id, message);
    await store.heartbeat("online");
  } finally {
    running.delete(task.id);
  }
}

export async function ensureWorkspace(config: Config, business: Business | null): Promise<string> {
  const dir = business?.workspace_path?.trim()
    ? business.workspace_path
    : join(config.workspaceRoot, business ? slugify(business.name) : "_general");
  await mkdir(dir, { recursive: true });
  if (business) await writeChannelFile(dir, business);
  return dir;
}

/**
 * Drop CHANNELS.md into the workspace once, and never touch it again: the owner
 * edits it on their Mac and that copy wins over anything in this repo.
 */
async function writeChannelFile(dir: string, business: Business): Promise<void> {
  const file = join(dir, "CHANNELS.md");
  try {
    await access(file, constants.F_OK);
    return;
  } catch {
    // not there yet — write it
  }
  const slug = business.workspace_path
    ? business.workspace_path.split("/").filter(Boolean).pop() ?? slugify(business.name)
    : slugify(business.name);
  await writeFile(file, channelFile(slug, business.name), "utf8");
}

export function isRunning(taskId: string): boolean {
  return running.has(taskId);
}
