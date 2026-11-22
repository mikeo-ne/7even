"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLabel } from "@/lib/queries";

export type FormState = { error?: string } | undefined;

async function requireLabel() {
  const { label, role } = await getLabel();
  if (!label) throw new Error("No label workspace found for this account.");
  if (role === "artist") throw new Error("Only label owners and managers can edit the catalogue.");
  return label;
}

export async function createRelease(_prev: FormState, formData: FormData): Promise<FormState> {
  const label = await requireLabel();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const artistId = String(formData.get("artist_id") ?? "");
  const type = String(formData.get("type") ?? "single");
  const releaseDate = String(formData.get("release_date") ?? "");
  const trackTitles = formData.getAll("track_title").map((t) => String(t).trim()).filter(Boolean);

  if (!title) return { error: "A release needs a title." };
  if (trackTitles.length === 0) return { error: "Add at least one track to the release." };

  const { data: release, error } = await supabase
    .from("releases")
    .insert({
      label_id: label.id,
      artist_id: artistId || null,
      title,
      type,
      genre: String(formData.get("genre") ?? "").trim() || null,
      artwork_url: String(formData.get("artwork_url") ?? "").trim() || null,
      release_date: releaseDate || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { error: trackError } = await supabase.from("tracks").insert(
    trackTitles.map((t, i) => ({ release_id: release.id, title: t, position: i + 1 })),
  );
  if (trackError) return { error: trackError.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/releases");
  redirect(`/dashboard/releases/${release.id}`);
}

export async function updateReleaseStatus(releaseId: string, status: string) {
  const label = await requireLabel();
  const supabase = await createClient();

  const { error } = await supabase
    .from("releases")
    .update({ status })
    .eq("id", releaseId)
    .eq("label_id", label.id);

  if (error) throw new Error(error.message);

  if (status === "delivered") {
    const { data: stores } = await supabase.from("stores").select("slug");
    if (stores?.length) {
      await supabase.from("deliveries").upsert(
        stores.map((s) => ({
          release_id: releaseId,
          store_slug: s.slug,
          status: "processing",
        })),
        { onConflict: "release_id,store_slug" },
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/releases");
  revalidatePath(`/dashboard/releases/${releaseId}`);
}

export async function createArtist(_prev: FormState, formData: FormData): Promise<FormState> {
  const label = await requireLabel();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "An artist needs a name." };

  const { error } = await supabase.from("artists").insert({
    label_id: label.id,
    name,
    bio: String(formData.get("bio") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/artists");
  revalidatePath("/dashboard");
  redirect("/dashboard/artists");
}

export async function deleteRelease(formData: FormData) {
  const label = await requireLabel();
  const id = String(formData.get("release_id") ?? "");
  const supabase = await createClient();

  await supabase.from("releases").delete().eq("id", id).eq("label_id", label.id);
  revalidatePath("/dashboard/releases");
  redirect("/dashboard/releases");
}
