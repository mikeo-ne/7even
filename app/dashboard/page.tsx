import Link from "next/link";
import { ArrowUpRight, Disc3, Plus, TrendingUp, Wallet } from "lucide-react";
import { compact, money, statusLabel, statusTone } from "@/lib/types";
import { getEarnings, getLabel, getReleases, getStores } from "@/lib/queries";
import { Artwork, Empty } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { label } = await getLabel();

  if (!label) {
    return (
      <div className="rounded-xl border border-line bg-ink-soft p-8">
        <h1 className="text-lg font-semibold">No label attached</h1>
        <p className="mt-2 text-sm text-mute">
          Your account exists but has no label workspace. Sign out and create a new account to
          bootstrap one.
        </p>
      </div>
    );
  }

  const [releases, earnings, stores] = await Promise.all([
    getReleases(label.id),
    getEarnings(label.id, 500),
    getStores(),
  ]);

  const totalStreams = earnings.reduce((a, e) => a + Number(e.streams), 0);
  const totalCents = earnings.reduce((a, e) => a + Number(e.amount_cents), 0);

  const periods = [...new Set(earnings.map((e) => e.period))].sort();
  const lastSix = periods.slice(-6);
  const byPeriod = lastSix.map((p) => ({
    period: p,
    cents: earnings
      .filter((e) => e.period === p)
      .reduce((a, e) => a + Number(e.amount_cents), 0),
  }));
  const peak = Math.max(1, ...byPeriod.map((p) => p.cents));

  const byStore = stores
    .map((s) => ({
      ...s,
      cents: earnings
        .filter((e) => e.stores?.name === s.name)
        .reduce((a, e) => a + Number(e.amount_cents), 0),
      streams: earnings
        .filter((e) => e.stores?.name === s.name)
        .reduce((a, e) => a + Number(e.streams), 0),
    }))
    .sort((a, b) => b.cents - a.cents);
  const storePeak = Math.max(1, ...byStore.map((s) => s.cents));

  const live = releases.filter((r) => r.status === "live").length;

  const stats = [
    { label: "Total earnings", value: money(totalCents), icon: Wallet, hint: `${periods.length} statement periods` },
    { label: "Streams", value: compact(totalStreams), icon: TrendingUp, hint: "Across all stores" },
    { label: "Releases", value: String(releases.length), icon: Disc3, hint: `${live} live` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-lime uppercase">Overview</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{label.name}</h1>
          <p className="mt-1 text-sm text-mute">Catalogue, stores and earnings at a glance.</p>
        </div>
        <Link
          href="/dashboard/releases/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-dim"
        >
          <Plus className="size-4" />
          New release
        </Link>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink-soft p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-mute">{s.label}</span>
              <s.icon className="size-4 text-lime/70" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-[11px] text-white/30">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-line bg-ink-soft p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Earnings by month</h2>
            <span className="text-[11px] text-mute">USD, net</span>
          </div>
          {byPeriod.length === 0 ? (
            <p className="mt-6 text-xs text-white/30">
              No earnings recorded yet. Statements appear here once a store reports.
            </p>
          ) : (
            <div className="mt-6 flex h-40 items-end gap-2">
              {byPeriod.map((p) => (
                <div key={p.period} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-sm bg-lime/30 transition group-hover:bg-lime/60"
                      style={{ height: `${Math.max(4, (p.cents / peak) * 100)}%` }}
                      title={money(p.cents)}
                    />
                  </div>
                  <span className="text-[10px] text-mute">{p.period.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-line bg-ink-soft p-5">
          <h2 className="text-sm font-medium">By store</h2>
          <div className="mt-5 space-y-3.5">
            {byStore.slice(0, 6).map((s) => (
              <div key={s.slug}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-white/80">{s.name}</span>
                  <span className="text-mute">{money(s.cents)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-lime/60"
                    style={{ width: `${Math.max(1, (s.cents / storePeak) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {byStore.every((s) => s.cents === 0) && (
              <p className="text-xs text-white/30">No store revenue yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-medium">Recent releases</h2>
          <Link
            href="/dashboard/releases"
            className="inline-flex items-center gap-1 text-xs text-mute transition hover:text-lime"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        {releases.length === 0 ? (
          <Empty text="Your catalogue is empty. Create a release to get started." />
        ) : (
          <ul className="divide-y divide-line">
            {releases.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/releases/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.02]"
                >
                  <Artwork url={r.artwork_url} alt={r.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="truncate text-xs text-mute">
                      {r.artists?.name ?? "Unassigned artist"} · {r.tracks?.length ?? 0} track
                      {(r.tracks?.length ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
                      statusTone[r.status] ?? statusTone.draft
                    }`}
                  >
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
