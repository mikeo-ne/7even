# 7even

An AI agent that runs on **your own Mac** and manages your businesses — driven from a web
control room, and **native to the A2A protocol** so other agents can discover it, send it
work, and receive work back.

Two halves:

| | Where it runs | What it does |
| --- | --- | --- |
| **Control room** (`apps/web`) | Vercel + Supabase | landing page, auth, task queue, live log, businesses, approvals, agents, schedules |
| **Bridge** (`apps/agent`) | your Mac | executes tasks with Claude Code, publishes the A2A agent card, polls the queue, runs schedules |

You never open a port to the internet unless you want peers to reach you. The bridge
_pulls_ work from the queue.

---

## Quick start (on the Mac)

```bash
git clone https://github.com/mikeo-ne/7even && cd 7even
npm install && npm run build

node apps/agent/dist/cli.js init     # paste Supabase URL + service-role key
node apps/agent/dist/cli.js start    # A2A server + task loop
node apps/agent/dist/cli.js install  # optional: start at login (launchd)
```

`init` prints an **agent token** and stores everything in `~/.7even/config.json`
(chmod `600`). Add the token when you register the bridge in the control room.

Then in the control room: **Businesses → add one**, then **Overview → queue a task**.
The bridge picks it up within a second or two.

Terminal alternative:

```bash
node apps/agent/dist/cli.js task "reconcile last month's statements" --business 1ne-records
```

---

## The A2A surface

Every bridge is a spec-shaped agent:

```
GET  /.well-known/agent-card.json     → agent card (skills, capabilities, url)
POST /a2a                             → JSON-RPC 2.0
GET  /health
```

Supported methods: `message/send` (with `configuration.blocking`), `message/stream`
(SSE), `tasks/get`, `tasks/cancel`.

```bash
curl -s http://localhost:4319/.well-known/agent-card.json | jq .

curl -s -X POST http://localhost:4319/a2a \
  -H "authorization: Bearer $SEVEN_AGENT_TOKEN" \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"message/send","params":{
        "message":{"kind":"message","messageId":"m-1","role":"user",
          "parts":[{"kind":"text","text":"reconcile last month"}]},
        "configuration":{"blocking":true}}}'
```

Published skills: `business-ops`, `research`, `delegate`, `scheduled`. Inbound tasks are
tagged with the caller (via `metadata.from`) and framed as **peer requests, not owner
commands** — an external agent cannot quietly extend its scope.

### Delegating outward

Your bridge can call any A2A agent with a reachable card:

```bash
node apps/agent/dist/cli.js peer add "Accounting agent" https://books.example.com
node apps/agent/dist/cli.js peer list
```

Peers are stored in Supabase and their cards are re-fetched every 5 minutes, so the
control room always shows what each one can do.

---

## The brain

`SEVEN_BRAIN` picks how tasks are executed:

| Mode | Behaviour |
| --- | --- |
| `auto` (default) | Claude Code CLI if installed, else the Anthropic API |
| `claude-cli` | `claude -p … --output-format stream-json` — inherits your tools, MCP servers and logins |
| `anthropic-api` | direct API call with `ANTHROPIC_API_KEY` (no local tools) |

Model: `SEVEN_MODEL` (default `claude-sonnet-4-5-20250929`). Timeout:
`SEVEN_TASK_TIMEOUT_MS` (default 15 min).

In `auto`, if neither a CLI nor a key is present the task fails with a clear message
rather than silently doing nothing.

---

## Guardrails

Businesses default to **ask before acting**. The prompt assembly in
`packages/core/src/prompt.ts` requires the model to emit

```
APPROVAL: <the exact irreversible action>
```

before sending mail, spending money, or deleting anything. The bridge strips those
lines, writes them to `approvals`, and parks the task in `waiting_approval` until you
decide in the control room (or an agent answers it via `tasks/get`). Set a business to
`auto` to skip that gate.

---

## Workspaces

Each business gets a folder:

- `workspace_path` if you set one (e.g. `~/Businesses/1ne-records`)
- otherwise `~/7even-workspaces/<slug>`

The model is told to stay inside it. Brief + standing instructions are injected on every
task, so context does not have to be repeated.

---

## Data model (Supabase project `sfoussxjeewouexusunw`)

`businesses`, `agents`, `tasks`, `task_events`, `approvals`, `peers`, `schedules`.

- RLS on all seven tables, every policy scoped to `owner_id = auth.uid()`.
  Verified: an owner sees their rows, a stranger sees zero, `anon` has no grants at all.
- The bridge uses the **service-role key** (server-side only, on your Mac).
- `task_events` carries `owner_id` so the live log is readable without recursive policies.
- Realtime is enabled on `task_events`, `tasks`, `approvals`, `agents` for the live view.

---

## Repo layout

```
packages/core   A2A types + card, task projection, prompt framing, approval parsing
apps/agent      bridge: Fastify server, task loop, scheduler, brain adapters, CLI
apps/web        control room: Next.js App Router, Supabase SSR auth, Tailwind v4
```

```bash
npm run build           # all three
npm run typecheck       # all three
npm run dev:web         # control room on :3000
npm run dev:agent       # bridge in watch mode
```

Vercel builds with:
`npm run build --workspace @7even/core && npm run build --workspace @7even/web`,
output `apps/web/.next`.

---

## Not built yet

- Push notifications when a task finishes or needs approval (currently you refresh the page)
- Audio/voice intake, Slack/Telegram entry points
- Per-business peer allow-lists (peers are currently owner-wide)
- Signed agent cards / DID-based identity, so peers can verify *who* is calling
- A2A `pushNotifications` webhooks (card advertises streaming only)
