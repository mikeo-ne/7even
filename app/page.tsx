import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Globe2,
  Music4,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

const stores = [
  "Spotify",
  "Apple Music",
  "YouTube Music",
  "Boomplay",
  "Audiomack",
  "Deezer",
  "TIDAL",
  "TikTok",
];

const steps = [
  {
    icon: Music4,
    title: "Upload your release",
    body: "Artwork, audio, credits and split sheets. One form, validated as you go — ISRC and UPC codes are generated for you.",
  },
  {
    icon: Globe2,
    title: "We deliver everywhere",
    body: "Your music goes out to every major store and the African platforms that actually move numbers in your market.",
  },
  {
    icon: BarChart3,
    title: "Watch it earn",
    body: "Streams and revenue per store, per track, per month. No spreadsheet exports, no waiting for an email statement.",
  },
  {
    icon: Wallet,
    title: "Get paid out",
    body: "Withdraw to mobile money or USD once you clear the threshold. Payout history stays in your account forever.",
  },
];

const features = [
  {
    icon: BadgeCheck,
    title: "Metadata that passes QC",
    body: "Store-specific requirements checked before delivery, so a missing contributor or badge never costs you a release date.",
  },
  {
    icon: ShieldCheck,
    title: "You keep your rights",
    body: "Non-exclusive by default. Your masters stay yours, and takedowns are one click — not a support ticket.",
  },
  {
    icon: Smartphone,
    title: "Built for African payouts",
    body: "Mobile money first, with USD wire as a fallback. Earnings visible in the currency you actually spend.",
  },
];

const plans = [
  {
    name: "Artist",
    price: "$0",
    note: "per release",
    features: ["Unlimited releases", "All stores", "100% of royalties", "Monthly statements"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Label",
    price: "$19",
    note: "per month",
    features: ["Everything in Artist", "Unlimited artists", "Team roles & permissions", "Split payments", "Priority QC"],
    cta: "Start 30-day trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    note: "",
    features: ["Catalogue migration", "Custom delivery rails", "Dedicated manager", "API access"],
    cta: "Book a call",
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] glow-lime" />
      <div className="pointer-events-none absolute inset-0 grain opacity-[0.5]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-lime text-[13px] font-black text-ink">
            7
          </span>
          <span className="text-lg font-semibold tracking-tight">7even</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-mute md:flex">
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-mute transition hover:text-white sm:block">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-dim"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-14 sm:pt-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-soft px-3 py-1 text-xs text-mute">
            <span className="size-1.5 rounded-full bg-lime" />
            Now delivering to 8 stores
          </span>
          <h1 className="mt-6 text-5xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-7xl">
            Your music,
            <br />
            <span className="text-lime">everywhere</span> it counts.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
            7even distributes your releases to the world&apos;s streaming platforms and gives you
            the label tools to run the business behind them — artists, splits, earnings, payouts.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-lime-dim"
            >
              Distribute your first release
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/5"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-line bg-ink-soft/60">
        <div className="mx-auto max-w-6xl overflow-hidden px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium tracking-wide text-white/40">
            {stores.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="text-xs font-semibold tracking-[0.2em] text-lime uppercase">How it works</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          From a WAV file to a payout, without leaving the dashboard.
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-ink p-7">
              <div className="flex items-center justify-between">
                <s.icon className="size-5 text-lime" strokeWidth={1.75} />
                <span className="text-xs text-white/25">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 pb-20 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-lime uppercase">Built for labels</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              A catalogue, not a pile of PDFs.
            </h2>
            <p className="mt-4 text-mute">
              Most distributors stop at delivery. 7even gives you the back office too — who is owed
              what, what is live where, and what came in this month.
            </p>
            <div className="mt-8 rounded-xl border border-line bg-ink-soft p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-mute">Last 30 days</span>
                <span className="text-xs text-lime">+18.4%</span>
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight">$4,281.60</p>
              <div className="mt-5 flex h-16 items-end gap-1.5">
                {[28, 36, 30, 44, 39, 52, 47, 60, 55, 68, 61, 76, 71, 84].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-lime/25"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-px overflow-hidden rounded-2xl border border-line">
            {features.map((f) => (
              <div key={f.title} className="flex gap-5 border-b border-line bg-ink p-7 last:border-0">
                <f.icon className="mt-0.5 size-5 shrink-0 text-lime" strokeWidth={1.75} />
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-6 pb-20 sm:pb-28">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-lime uppercase">Pricing</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              You keep 100% of royalties.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-mute">
            No per-release fees, no commission on your streams. Pick the plan that matches your roster.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-7 ${
                p.highlight
                  ? "border-lime/40 bg-linear-to-b from-lime/[0.07] to-transparent"
                  : "border-line bg-ink-soft"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-wide uppercase">{p.name}</h3>
                {p.highlight && (
                  <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-ink uppercase">
                    Most picked
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-xs text-mute">{p.note}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-mute">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span className="size-1 rounded-full bg-lime" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-7 flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-lime text-ink hover:bg-lime-dim"
                    : "border border-line text-white hover:bg-white/5"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-lime/[0.09] via-ink-soft to-ink-soft p-10 sm:p-16">
          <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next release deserves better than a group chat.
          </h2>
          <p className="mt-4 max-w-md text-mute">
            Set up your label in a few minutes. Free to start, and your first release can go out this week.
          </p>
          <Link
            href="/login"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-lime-dim"
          >
            Create your account
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-mute sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-lime text-[10px] font-black text-ink">7</span>
            <span>© {new Date().getFullYear()} 7even. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <Link href="/login" className="transition hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
