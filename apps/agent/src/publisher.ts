import { adapterFor, platformName, type Post, type PublishContext } from "@7even/core";
import type { AgentStore } from "./db.js";
import type { Config } from "./config.js";

/**
 * The publish loop.
 *
 * Approving a post does not mean it goes out immediately: it means it becomes
 * eligible. This worker picks up approved posts whose slot has arrived, publishes
 * them through the platform adapter, and records the truth — including "this
 * platform is not connected", which is a human problem, not a retry.
 *
 * A post is never marked published because the request looked fine. It is marked
 * published when the platform returned an id.
 */
export async function publishDue(store: AgentStore, config: Config): Promise<number> {
  const due = await store.duePosts();
  if (due.length === 0) return 0;

  const ctx: PublishContext = {
    tokens: config.social?.tokens ?? {},
    publicUrl: config.publicUrl || undefined,
  };

  let published = 0;

  for (const post of due) {
    const adapter = adapterFor(post.platform);

    await store.setPostStatus(post.id, "publishing");

    if (!adapter) {
      await store.setPostStatus(post.id, "failed", {
        error: `${platformName(post.platform as never)} has no adapter yet. Publishing there is manual.`,
      });
      await store.event(
        (post.task_id ?? post.id) as string,
        "error",
        `${platformName(post.platform as never)}: no adapter, nothing sent`,
      );
      continue;
    }

    try {
      const result = await adapter.publish(post, ctx);

      if (result.ok) {
        await store.setPostStatus(post.id, "published", {
          externalId: result.externalId,
          publishedAt: new Date().toISOString(),
        });
        if (post.task_id) {
          await store.event(
            post.task_id,
            "output",
            `Published to ${platformName(post.platform as never)} ${post.account_handle}${result.externalId ? ` — id ${result.externalId}` : ""}`,
          );
        }
        published += 1;
      } else {
        await store.setPostStatus(post.id, "failed", { error: result.error ?? "unknown failure" });
        if (post.task_id) {
          await store.event(
            post.task_id,
            "error",
            `${platformName(post.platform as never)} failed: ${result.error ?? "unknown"}${result.needsHuman ? " (needs you, not a retry)" : ""}`,
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await store.setPostStatus(post.id, "failed", { error: message });
      if (post.task_id) await store.event(post.task_id, "error", message);
    }
  }

  return published;
}
