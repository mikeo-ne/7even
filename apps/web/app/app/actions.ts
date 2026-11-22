"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@7even/core";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string } | undefined;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createBusiness(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const workspace = String(formData.get("workspace_path") ?? "").trim();
  const autonomy = String(formData.get("autonomy") ?? "ask") === "auto" ? "auto" : "ask";
  const colour = String(formData.get("colour") ?? "#d7ff3e");

  if (!name) return { error: "Give the business a name." };

  const { error } = await supabase.from("businesses").insert({
    owner_id: user.id,
    name,
    slug: slugify(name),
    brief: brief || null,
    instructions: instructions || null,
    workspace_path: workspace || null,
    autonomy,
    colour,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "You already have a business with that name." : error.message,
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/businesses");
  return { ok: `${name} is ready. The bridge will pick it up on its next tick.` };
}

export async function updateBusiness(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const workspace = String(formData.get("workspace_path") ?? "").trim();
  const autonomy = String(formData.get("autonomy") ?? "ask") === "auto" ? "auto" : "ask";
  const colour = String(formData.get("colour") ?? "#d7ff3e");

  if (!id) return { error: "That business no longer exists." };
  if (!name) return { error: "Give the business a name." };

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      brief: brief || null,
      instructions: instructions || null,
      workspace_path: workspace || null,
      autonomy,
      colour,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/businesses");
  return { ok: `${name} updated. The agent reads the new brief on its next task.` };
}

export async function queueTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const prompt = String(formData.get("prompt") ?? "").trim();
  const businessId = String(formData.get("business_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!prompt) return { error: "Describe what you want done." };

  const { error } = await supabase.from("tasks").insert({
    owner_id: user.id,
    business_id: businessId || null,
    title: title || prompt.slice(0, 80),
    prompt,
    source: "ui",
    status: "queued",
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/tasks");
  return { ok: "Queued. Your Mac will pick it up within a couple of seconds if the bridge is running." };
}

export async function decideApproval(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("approval_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const approved = decision === "approve";

  const { data: approval } = await supabase
    .from("approvals")
    .select("id, task_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!approval) return;

  await supabase
    .from("approvals")
    .update({ status: approved ? "approved" : "rejected", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (approval.task_id) {
    await supabase.from("task_events").insert({
      task_id: approval.task_id,
      kind: "approval",
      body: approved ? "Approved by owner" : "Rejected by owner",
    });

    const { count } = await supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("task_id", approval.task_id)
      .eq("status", "pending");

    if (!count) {
      if (approved) {
        await supabase
          .from("tasks")
          .update({ status: "done", finished_at: new Date().toISOString() })
          .eq("id", approval.task_id);
      } else {
        await supabase
          .from("tasks")
          .update({ status: "cancelled", finished_at: new Date().toISOString() })
          .eq("id", approval.task_id);
      }
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/approvals");
}

export async function connectAgent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "Mac").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim();

  const { data: existing } = await supabase
    .from("agents")
    .select("id")
    .eq("owner_id", user.id)
    .eq("name", name)
    .maybeSingle();

  const record = {
    owner_id: user.id,
    name,
    hostname: baseUrl || null,
    a2a_base_url: baseUrl || null,
    status: baseUrl ? "online" : "offline",
    last_seen_at: baseUrl ? new Date().toISOString() : null,
    capabilities: ["business-ops", "research", "delegate", "scheduled"],
  };

  const { error } = existing?.id
    ? await supabase.from("agents").update(record).eq("id", existing.id)
    : await supabase.from("agents").insert(record);

  if (error) return { error: error.message };

  revalidatePath("/app/agents");
  return { ok: "Agent registered. Start the bridge with `7even start`." };
}

export async function addPeer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim();

  if (!name || !baseUrl) return { error: "A peer needs a name and a base URL." };

  let card: unknown = null;
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/.well-known/agent-card.json`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) card = await res.json();
  } catch {
    // Card fetch is best-effort; the bridge will retry.
  }

  const { error } = await supabase.from("peers").insert({
    owner_id: user.id,
    name: (card as { name?: string } | null)?.name ?? name,
    base_url: baseUrl,
    card,
    last_seen_at: card ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/agents");
  return { ok: card ? "Peer added and its agent card was fetched." : "Peer added — card not reachable yet." };
}

export async function createSchedule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const cron = String(formData.get("cron") ?? "").trim();
  const businessId = String(formData.get("business_id") ?? "");

  if (!name || !prompt || !cron) return { error: "Name, prompt and cron are all required." };

  const { error } = await supabase.from("schedules").insert({
    owner_id: user.id,
    business_id: businessId || null,
    name,
    prompt,
    cron,
    enabled: true,
    next_run_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/app/schedules");
  return { ok: "Schedule created — the bridge will run it on its next tick." };
}

export async function toggleSchedule(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("schedule_id") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";

  await supabase
    .from("schedules")
    .update({ enabled, next_run_at: enabled ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/app/schedules");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
