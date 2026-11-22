import Link from "next/link";
import { Plus } from "lucide-react";
import { getLabel, getReleases } from "@/lib/queries";
import { statusLabel, statusTone } from "@/lib/types";
import { Artwork, Empty, PageHeader } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const { label } = await getLabel();
  if (!label) return <Empty text="No label workspace on this account." />;

  const releases = await getReleases(label.id);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue"
        title="Releases"
        description="Everything you have in flight, delivered, or live."
        action={
          <Link
            href="/dashboard/releases/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-dim"
          >
            <Plus className="size-4" />
            New release
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="hidden grid-cols-[1fr_100px_110px_120px] gap-4 border-b border-line bg-ink-soft px-5 py-3 text-[11px] font-medium tracking-wide text-mute uppercase sm:grid">
          <span>Release</span>
          <span>Tracks</span>
          <span>Release date</span>
          <span>Status</span>
        </div>
        {releases.length === 0 ? (
          <Empty
            text="No releases yet. Your first release takes about two minutes to draft."
            action={
              <Link
                href="/dashboard/releases/new"
                className="rounded-full border border-line px-4 py-2 text-xs font-medium transition hover:bg-white/5"
              >
                Create a release
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {releases.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/releases/${r.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02] sm:grid-cols-[1fr_100px_110px_120px]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Artwork url={r.artwork_url} alt={r.title} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="truncate text-xs text-mute">
                        {r.artists?.name ?? "Unassigned"} · {r.type}
                      </p>
                    </div>
                  </div>
                  <span className="hidden text-xs text-mute sm:block">{r.tracks?.length ?? 0}</span>
                  <span className="hidden text-xs text-mute sm:block">
                    {r.release_date
                      ? new Date(r.release_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                  <span className="justify-self-end sm:justify-self-start">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
                        statusTone[r.status] ?? statusTone.draft
                      }`}
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
