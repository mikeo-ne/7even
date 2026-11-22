import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Layers,
  Lock,
  Network,
  Terminal,
  Waypoints,
} from "lucide-react";

const loop = [
  {
    icon: Waypoints,
    title: "You ask, from anywhere",
    body: "Type a job in the control room on your phone. It lands in the queue — the agent picks it up the next time your Mac is awake.",
  },
  {
    icon: BrainCircuit,
    title: "It works with local tools",
    body: "The bridge runs Claude Code on your machine, in each business's own folder. Real files, real shell, your logged-in accounts.",
  },
  {
    icon: Lock,
    title: "It stops at anything irreversible",
    body: "Money out, messages sent, files deleted — those become approval cards. One tap to continue, one to reject.",
  },
  {
    icon: Network,
    title: "Other agents can call it",
    body: "Every bridge publishes an A2A agent card. Peers discover it, send tasks, and get results back in the open protocol.",
  },
];

const capabilities = [
  "Runs in each business's own workspace folder",
  "A2A agent card at /.well-known/agent-card.json",
  "JSON-RPC message/send, message/stream, tasks/get, tasks/cancel",
  "Approval queue for outbound money, mail and deletes",
  "Recurring schedules with cron, queued as normal tasks",
  "Delegates sub-tasks to peer agents by URL",
  "Live event log: thoughts, tool calls, output",
  "Bridge is token-authenticated, no inbound ports required",
];

const skills = [
  { name: "business-ops", detail: "Carry out an operational task for one business" },
  { name: "research", detail: "Web + workspace investigation with a sourced report" },
  { name: "delegate", detail: "Accept from a peer, hand off sub-tasks, report back" },
  { name: "scheduled", detail: "Recurring triage that only surfaces what needs you" },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-fade" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] signal-glow" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-signal text-[13px] font-black text-ink">
            7
          </span>
          <span className="text-lg font-semibold tracking-tight">7even</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-mute md:flex">
          <a href="#loop" className="transition hover:text-white">How it works</a>
          <a href="#a2a" className="transition hover:text-white">A2A</a>
          <a href="#install" className="transition hover:text-white">Install</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-mute transition hover:text-white sm:block">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition hover:bg-signal-dim"
          >
            Open control room
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-14 pb-16 sm:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-soft px-3 py-1 text-xs text-mute">
            <span className="live-dot size-1.5 rounded-full bg-signal" />
            A2A protocol · runs on your own Mac
          </span>
          <h1 className="mt-6 text-5xl leading-[1.03] font-semibold tracking-[-0.035em] sm:text-7xl">
            An agent that
            <br />
            runs your <span className="text-signal">businesses</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
            7even is a personal agent that lives on your Mac. It does the actual work — in your
            folders, with your tools — and it speaks A2A, so other agents can hire it and it can
            hire them.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-signal px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-signal-dim"
            >
              Get the control room
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#install"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm font-medium transition hover:bg-white/5"
            >
              <Terminal className="size-4" />
              npx 7even init
            </a>
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-line bg-soft/80 p-1.5 backdrop-blur">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-white/30">
            <span className="size-2 rounded-full bg-white/10" />
            <span className="size-2 rounded-full bg-white/10" />
            <span className="size-2 rounded-full bg-white/10" />
            <span className="ml-2">7even · agent card</span>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-ink px-4 py-4 text-[12px] leading-relaxed text-white/70">
{`$ curl -s http://localhost:4319/.well-known/agent-card.json | jq '.skills[].id'
"business-ops"
"research"
"delegate"
"scheduled"

$ curl -s -X POST http://localhost:4319/a2a \\
    -H "authorization: Bearer $SEVEN_AGENT_TOKEN" \\
    -d '{"jsonrpc":"2.0","id":1,"method":"message/send",
         "params":{"message":{"kind":"message","role":"user",
         "parts":[{"kind":"text","text":"reconcile last month"}]}}}'`}
          </pre>
        </div>
      </section>

      <section className="relative z-10 border-y border-line bg-soft/50">
        <div className="mx-auto grid max-w-6xl gap-px bg-line sm:grid-cols-3">
          {[
            ["Runs locally", "Your files never leave the machine to be worked on"],
            ["Tool-native", "Claude Code, MCP servers, your shell and logins"],
            ["Agent-native", "A2A card, JSON-RPC tasks, peer delegation"],
          ].map(([title, detail]) => (
            <div key={title} className="bg-ink px-6 py-6">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs text-mute">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="loop" className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">The loop</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Ask from your phone. It works on your Mac.
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {loop.map((step, i) => (
            <div key={step.title} className="bg-ink p-7">
              <div className="flex items-center justify-between">
                <step.icon className="size-5 text-signal" strokeWidth={1.75} />
                <span className="text-xs text-white/25">0{i + 1}</span>
              </div>
              <h3 className="mt-6 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="a2a" className="relative z-10 mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">Interoperable</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Built on the open agent protocol, not a walled garden.
            </h2>
            <p className="mt-4 text-mute">
              7even speaks Agent2Agent. Your agent publishes a card describing what it can do,
              accepts tasks over JSON-RPC, streams progress, and can delegate to any other agent
              with a URL — including ones you did not write.
            </p>
            <div className="mt-8 space-y-px overflow-hidden rounded-xl border border-line">
              {skills.map((s) => (
                <div key={s.name} className="flex items-center gap-4 bg-soft px-4 py-3">
                  <code className="rounded bg-signal/10 px-2 py-0.5 text-[11px] text-signal">
                    {s.name}
                  </code>
                  <span className="text-xs text-mute">{s.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-soft p-6">
            <div className="flex items-center gap-2 text-xs text-mute">
              <Layers className="size-4 text-signal" />
              What the bridge does
            </div>
            <ul className="mt-5 space-y-3">
              {capabilities.map((c) => (
                <li key={c} className="flex gap-3 text-sm text-white/75">
                  <Check className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={2} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="install" className="relative z-10 mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
        <div className="rounded-3xl border border-line bg-gradient-to-br from-signal/[0.08] via-soft to-soft p-8 sm:p-12">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Three commands on the Mac.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-mute">
            The control room holds the queue and the history. The bridge on your Mac is what
            actually executes.
          </p>
          <pre className="mt-7 overflow-x-auto rounded-xl border border-line bg-ink px-5 py-4 text-[12px] leading-relaxed text-white/70">
{`git clone https://github.com/mikeo-ne/7even && cd 7even
npm install && npm run build
node apps/agent/dist/cli.js init     # paste your Supabase keys
node apps/agent/dist/cli.js start    # the bridge is live
node apps/agent/dist/cli.js install  # optional: start at login`}
          </pre>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal-dim"
            >
              Open the control room
            </Link>
            <a
              href="https://a2a-protocol.org"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium transition hover:bg-white/5"
            >
              Read the A2A spec
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-xs text-mute sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-signal text-[10px] font-black text-ink">
              7
            </span>
            <span>© {new Date().getFullYear()} 7even</span>
          </div>
          <div className="flex gap-6">
            <a href="#a2a" className="transition hover:text-white">A2A</a>
            <Link href="/login" className="transition hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
