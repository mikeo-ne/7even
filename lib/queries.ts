import { createClient } from "./supabase/server";

export type LabelRow = { id: string; name: string; currency: string; country: string | null };

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getLabel() {
  const { supabase, user } = await getSession();
  if (!user) return { supabase, user: null, label: null, role: null };

  const { data } = await supabase
    .from("label_members")
    .select("role, labels(id, name, currency, country)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    user,
    label: (data?.labels ?? null) as LabelRow | null,
    role: (data?.role ?? null) as string | null,
  };
}

export type ReleaseRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  genre: string | null;
  artwork_url: string | null;
  release_date: string | null;
  artists: { name: string } | null;
  tracks: { id: string }[];
};

export async function getReleases(labelId: string): Promise<ReleaseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("releases")
    .select("id, title, type, status, genre, artwork_url, release_date, artists(name), tracks(id)")
    .eq("label_id", labelId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ReleaseRow[];
}

export type ArtistRow = {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  created_at: string;
  releases: { id: string }[];
};

export async function getArtists(labelId: string): Promise<ArtistRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("id, name, bio, image_url, created_at, releases(id)")
    .eq("label_id", labelId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ArtistRow[];
}

export type EarningRow = {
  id: number;
  period: string;
  streams: number;
  amount_cents: number;
  release_id: string | null;
  stores: { name: string } | null;
  releases: { title: string } | null;
};

export async function getEarnings(labelId: string, limit = 200): Promise<EarningRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("earnings")
    .select("id, period, streams, amount_cents, release_id, stores(name), releases(title)")
    .eq("label_id", labelId)
    .order("period", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EarningRow[];
}

export async function getPayouts(labelId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payouts")
    .select("id, amount_cents, status, method, paid_at, created_at")
    .eq("label_id", labelId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStores() {
  const supabase = await createClient();
  const { data } = await supabase.from("stores").select("slug, name, kind").order("sort_order");
  return data ?? [];
}
