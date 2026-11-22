import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Radio, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLabel, getStores } from "@/lib/queries";
import { money, statusLabel, statusTone } from "@/lib/types";
import { Artwork } from "@/lib/ui";
import { StatusControls } from "./StatusControls";
import { deleteRelease } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { label, role } = await getLabel();
  if (!label) notFound();

  const supabase = await createClient();
  const { data: release } = await supabase
    .from("releases")
    .select(
      "id, title, type, status, genre, artwork_url, release_date, upc, created_at, artists(name), tracks(id, title, position, isrc, duration_seconds, explicit), deliveries(store_slug, status, live_at), earnings(streams, amount_cents, period), stores(slug, name)",
    )
    .eq("id", id)
    .eq("label_id", label.id)
    .maybeSingle();

  if (!release) notFound();

  const stores = await getStores();

  type Track = {
    id: string;
    title: string;
    position: number;
    isrc: string | null;
    duration_seconds: number | null;
    explicit: boolean;
  };
  type Delivery = { store_slug: string; status: string; live_at: string | null };

  const tracks = ([...(release.tracks ?? [])] as Track[]).sort((a, b) => a.position - b.position);
  const deliveries = (release.deliveries ?? []) as Delivery[];
  const earnings = (release.earnings ?? []) as { streams: number; amount_cents: number; period: string }[];
  const deliveryFor = (slug: string) => deliveries.find((d) => d.store_slug === slug);

  const totalStreams = earnings.reduce((a, e) => a + Number(e.streams), 0);
  const totalCents = earnings.reduce((a, e) => a + Number(e.amount_cents), 0);
  const canEdit = role !== "artist";

  return (
    <div className="space-y-7">
      <Link
        href="/dashboard/releases"
        className="inline-flex items-center gap-1.5 text-xs text-mute transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        All releases
      </Link>

      <div className="flex flex-wrap items-start gap-5">
        <Artwork url={release.artwork_url} alt={release.title} size={88} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">{release.title}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
                statusTone[release.status] ?? statusTone.draft
              }`}
            >
              {statusLabel[release.status] ?? release.status}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-mute">
            {(release.artists as unknown as { name: string } | null)?.name ?? "Unassigned"} ·{" "}
            {release.type}
            {release.genre ? ` · ${release.genre}` : ""}
            {release.release_date
              ? ` · ${new Date(release.release_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`
              : ""}
          </p>
          {release.upc && <p className="mt-1 text-[11px] text-white/30">UPC {release.upc}</p>}
        </div>
        {canEdit && <StatusControls releaseId={release.id} status={release.status} />}
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {[
          ["Streams", totalStreams.toLocaleString()],
          ["Revenue", money(totalCents)],
          ["Live on", `${deliveries.filter((d) => d.status === "live").length} / ${stores.length} stores`],
        ].map(([k, v]) => (
          <div key={k} className="bg-ink-soft p-5">
            <p className="text-xs text-mute">{k}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{v}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-line">
        <h2 className="border-b border-line bg-ink-soft px-5 py-3.5 text-sm font-medium">Tracks</h2>
        <ul className="divide-y divide-line">
          {tracks.map((t) => (
            <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-4 text-center text-xs text-white/25">{t.position}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{t.title}</p>
                <p className="text-[11px] text-white/30">
                  {t.isrc ? `ISRC ${t.isrc}` : "ISRC pending"}
                  {t.duration_seconds ? ` · ${fmtDuration(t.duration_seconds)}` : ""}
                  {t.explicit ? " · Explicit" : ""}
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-white/25">
                <Upload className="size-3" />
                audio
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line bg-ink-soft px-5 py-3.5">
          <h2 className="text-sm font-medium">Delivery status</h2>
          <span className="text-[11px] text-mute">
            {release.status === "delivered" || release.status === "live"
              ? "Sent to all stores"
              : "Not delivered yet"}
          </span>
        </div>
        <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 sm:[&>li:nth-child(-n+2)]:border-t-0">
          {stores.map((s) => {
            const d = deliveryFor(s.slug);
            return (
              <li
                key={s.slug}
                className="flex items-center justify-between gap-3 border-line px-5 py-3.5 sm:border-t sm:odd:border-r"
              >
                <span className="text-sm text-white/80">{s.name}</span>
                {d?.status === "live" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/10 px-2.5 py-1 text-[10px] font-medium text-lime ring-1 ring-lime/20 ring-inset">
                    <Check className="size-3" /> Live
                  </span>
                ) : d?.status === "processing" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/10 px-2.5 py-1 text-[10px] font-medium text-sky-300 ring-1 ring-sky-400/20 ring-inset">
                    <Radio className="size-3" /> Processing
                  </span>
                ) : d?.status === "rejected" ? (
                  <span className="rounded-full bg-rose-400/10 px-2.5 py-1 text-[10px] font-medium text-rose-300 ring-1 ring-rose-400/20 ring-inset">
                    Rejected
                  </span>
                ) : (
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-mute ring-1 ring-white/10 ring-inset">
                    Not sent
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {canEdit && (
        <form action={deleteRelease} className="border-t border-line pt-5">
          <input type="hidden" name="release_id" value={release.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-xs text-mute transition hover:text-rose-300"
          >
            <Trash2 className="size-3.5" />
            Delete this release
          </button>
        </form>
      )}
    </div>
  );
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
