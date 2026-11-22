export type Store = { slug: string; name: string; kind: string };
export type Release = {
  id: string;
  title: string;
  type: string;
  status: string;
  artwork_url: string | null;
  release_date: string | null;
  genre: string | null;
  artists: { name: string } | null;
};
export type Earning = {
  store_slug: string;
  period: string;
  streams: number;
  amount_cents: number;
  release_id: string | null;
};

export const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : String(n);

export const statusTone: Record<string, string> = {
  draft: "bg-white/5 text-mute ring-white/10",
  in_review: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  delivered: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  live: "bg-lime/10 text-lime ring-lime/20",
  takedown: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
};

export const statusLabel: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  delivered: "Delivered",
  live: "Live",
  takedown: "Takedown",
};
