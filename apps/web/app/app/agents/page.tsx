import type { AgentRecord, AgentCard } from "@7even/core";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, Panel, relativeTime } from "@/lib/ui";
import { AgentPanels } from "./AgentPanels";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const supabase = await createClient();
  const [agents, peers] = await Promise.all([
    supabase.from("agents").select("*").order("last_seen_at", { ascending: false }),
    supabase.from("peers").select("*").order("created_at", { ascending: false }),
  ]);

  const bridges = (agents.data as AgentRecord[]) ?? [];
  const peerRows = (peers.data as { id: string; name: string; base_url: string; card: AgentCard | null; last_seen_at: string | null }[]) ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Network"
        title="Agents"
        description="Your bridge, plus every peer agent yours can delegate to over A2A."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`Your bridges (${bridges.length})`}>
          {bridges.length === 0 ? (
            <Empty text="No bridge registered. Start it on your Mac — it checks in every 20 seconds." />
          ) : (
            <ul className="divide-y divide-line">
              {bridges.map((agent) => (
                <li key={agent.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${
                          agent.status === "online"
                            ? "live-dot bg-signal"
                            : agent.status === "busy"
                              ? "bg-amber-400"
                              : "bg-white/25"
                        }`}
                      />
                      <p className="truncate text-sm font-medium">{agent.name}</p>
                    </div>
                    <span className="text-[11px] text-mute">{relativeTime(agent.last_seen_at)}</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-white/25">
                    {agent.a2a_base_url ?? "no public url"} · v{agent.version ?? "?"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {agent.capabilities?.map((capability) => (
                      <span
                        key={capability}
                        className="rounded bg-signal/10 px-1.5 py-0.5 text-[10px] text-signal"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Peers (${peerRows.length})`}>
          {peerRows.length === 0 ? (
            <Empty text="No peers yet. Add an A2A agent by its base URL and your bridge can hand work to it." />
          ) : (
            <ul className="divide-y divide-line">
              {peerRows.map((peer) => (
                <li key={peer.id} className="px-5 py-4">
                  <p className="text-sm font-medium">{peer.name}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-white/25">{peer.base_url}</p>
                  {peer.card?.skills?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {peer.card.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-amber-300/70">
                      card not reachable — the bridge will retry
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <AgentPanels />

      <Panel title="Connect from another agent">
        <div className="space-y-3 px-5 py-4 text-sm text-white/70">
          <p>Your bridge publishes a standard agent card:</p>
          <pre className="overflow-x-auto rounded-lg border border-line bg-ink px-4 py-3 text-[11px] text-white/60">
{`GET  https://<your-public-url>/.well-known/agent-card.json

POST https://<your-public-url>/a2a
authorization: Bearer <agent token>
content-type: application/json

{"jsonrpc":"2.0","id":1,"method":"message/send",
 "params":{"message":{"kind":"message","messageId":"m-1","role":"user",
  "parts":[{"kind":"text","text":"reconcile last month"}]},
  "configuration":{"blocking":true}}}`}
          </pre>
          <p className="text-xs text-mute">
            The token is the one printed by <code className="text-signal">7even init</code>. It
            lives in <code className="text-signal">~/.7even/config.json</code> on your Mac.
          </p>
        </div>
      </Panel>
    </div>
  );
}
