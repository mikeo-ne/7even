import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, Panel, StatusPill } from "@/lib/ui";
import { CHANNELS, PLATFORM_LIMITS, type Account, type AccountState } from "@7even/core";
import type { Business, Task } from "@7even/core";
import { SocialComposer } from "./SocialComposer";

export const dynamic = "force-dynamic";

type Post = {
  business: string;
  colour: string;
  title: string;
  platform: string;
  when: string;
  status: Task["status"];
  id: string;
};

const PLATFORMS = ["Instagram", "X", "TikTok", "YouTube", "Facebook", "LinkedIn", "WhatsApp Channel"];

function platformOf(text: string): string {
  const found = PLATFORMS.find((platform) => new RegExp(`\\b${platform}\\b`, "i").test(text));
  return found ?? "—";
}

const STATE_BADGE: Partial<Record<AccountState, { label: string; className: string }>> = {
  empty: { label: "never posted", className: "bg-amber-400/10 text-amber-300" },
  "owner-confirmed": { label: "from you", className: "bg-white/5 text-white/35" },
  deferred: { label: "not yet", className: "bg-white/5 text-white/25" },
};

function AccountLine({ account }: { account: Account }) {
  const badge = STATE_BADGE[account.state];

  const label = (
    <>
      <span className="font-mono text-[10px] text-white/50">
        {account.artist ? `${account.artist} · ` : ""}
        {account.platform} {account.handle}
        {account.owner ? " (yours)" : ""}
      </span>
      {account.writeFor === "amplify" && (
        <span className="ml-1.5 rounded bg-sky-400/10 px-1 py-0.5 text-[9px] text-sky-300">
          amplify only
        </span>
      )}
      {badge && (
        <span className={`ml-1.5 rounded px-1 py-0.5 text-[9px] ${badge.className}`}>
          {badge.label}
        </span>
      )}
    </>
  );

  if (!account.url || account.state === "missing" || account.state === "deferred") {
    return (
      <li className={account.state === "deferred" ? "opacity-45" : undefined}>
        {account.state === "missing" ? (
          <span className="font-mono text-[10px] text-white/25 line-through">
            {account.platform} {account.handle}
          </span>
        ) : (
          label
        )}
      </li>
    );
  }

  return (
    <li>
      <a href={account.url} target="_blank" rel="noreferrer" className="hover:[&>span:first-child]:text-signal">
        {label}
      </a>
    </li>
  );
}

export default async function SocialPage() {
  const supabase = await createClient();

  const [{ data: businessRows }, { data: taskRows }] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at"),
    supabase
      .from("tasks")
      .select("id,title,prompt,status,business_id,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const businesses = (businessRows as Business[]) ?? [];
  const byId = new Map(businesses.map((business) => [business.id, business]));

  const isSocial = (task: Task) =>
    /social|post|caption|instagram|tiktok|youtube|hashtag|content|promote|promotion|campaign/i.test(
      `${task.title ?? ""} ${task.prompt ?? ""}`,
    );

  const posts: Post[] = ((taskRows as Task[]) ?? [])
    .filter(isSocial)
    .map((task) => {
      const business = task.business_id ? byId.get(task.business_id) : undefined;
      return {
        business: business?.name ?? "—",
        colour: business?.colour ?? "#d7ff3e",
        title: task.title ?? task.prompt.slice(0, 80),
        platform: platformOf(`${task.title ?? ""} ${task.prompt}`),
        when: new Date(task.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        status: task.status,
        id: task.id,
      };
    });

  const perPlatform = PLATFORMS.map((platform) => ({
    platform,
    count: posts.filter((post) => post.platform === platform).length,
  })).filter((row) => row.count > 0);

  const pausedEveryone = CHANNELS.flatMap((channel) =>
    channel.paused.map((person) => ({ person, business: channel.slug })),
  ).filter(
    (entry, index, all) => all.findIndex((other) => other.person.name === entry.person.name) === index,
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reach"
        title="Social"
        description="Working set: the label, Baranga and Mike 1ne. Every post the agent plans or drafts lands here, and publishing always waits for you."
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title={`Planned and drafted (${posts.length})`}
          meta={
            perPlatform.length > 0 ? (
              <span className="font-mono text-[10px] text-white/30">
                {perPlatform.map((row) => `${row.platform} ${row.count}`).join(" · ")}
              </span>
            ) : undefined
          }
        >
          {posts.length === 0 ? (
            <Empty text="Nothing social yet. Ask for a post below, or wait for the Monday plan to run." />
          ) : (
            <ul className="divide-y divide-line">
              {posts.map((post) => (
                <li key={post.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: post.colour }}
                      />
                      <p className="truncate text-sm">{post.title}</p>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-white/30">
                      {post.business} · {post.platform} · {post.when}
                    </p>
                  </div>
                  <StatusPill status={post.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <SocialComposer businesses={businesses} />

          <Panel title="Where we post">
            <div className="divide-y divide-line">
              {CHANNELS.map((channel) => {
                const business = businesses.find((row) => row.slug === channel.slug);
                return (
                  <div key={channel.slug} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: business?.colour ?? "#d7ff3e" }}
                      />
                      <p className="text-xs font-medium">{business?.name ?? channel.slug}</p>
                    </div>

                    <ul className="mt-1.5 space-y-1">
                      {channel.brand.map((account) => (
                        <AccountLine key={`${account.platform}-${account.handle}`} account={account} />
                      ))}
                    </ul>

                    {channel.artists.length > 0 && (
                      <>
                        <p className="mt-2.5 text-[10px] tracking-wide text-white/25 uppercase">
                          Artists
                        </p>
                        <ul className="mt-1 space-y-1">
                          {channel.artists.map((account) => (
                            <AccountLine
                              key={`artist-${account.platform}-${account.handle}`}
                              account={account}
                            />
                          ))}
                        </ul>
                      </>
                    )}

                    {channel.deferred.length > 0 && (
                      <>
                        <p className="mt-2.5 text-[10px] tracking-wide text-white/25 uppercase">
                          You will create
                        </p>
                        <ul className="mt-1 space-y-1">
                          {channel.deferred.map((account) => (
                            <AccountLine
                              key={`deferred-${account.platform}-${account.handle}`}
                              account={account}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Paused — off limits to the agent" meta={<span className="font-mono text-[10px] text-white/30">no posts, tags or plans</span>}>
        <ul className="divide-y divide-line">
          {pausedEveryone.map(({ person }) => (
            <li key={person.name} className="px-5 py-4">
              <p className="text-sm font-medium text-white/70">{person.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-mute">{person.reason}</p>
              <p className="mt-1.5 font-mono text-[10px] text-white/25">
                {person.handles
                  .map((handle) => `${handle.platform} ${handle.handle}`)
                  .join("  ·  ")}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="How the agent treats each account">
        <ul className="divide-y divide-line">
          <li className="px-5 py-3.5">
            <p className="text-xs font-medium text-white/80">Label accounts — the agent writes them</p>
            <p className="mt-1 text-[11px] leading-relaxed text-mute">
              Full drafts in the label&apos;s third-person voice, queued for your approval. This is
              where most of the work happens.
            </p>
          </li>
          <li className="px-5 py-3.5">
            <p className="text-xs font-medium text-white/80">
              <span className="mr-1.5 rounded bg-sky-400/10 px-1 py-0.5 text-[9px] text-sky-300">
                amplify only
              </span>
              Baranga — his voice stays his
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-mute">
              The agent never writes copy for him to post. It plans what the <em>label</em> does
              about his posts: quote, repost, Story share, or the label&apos;s own post pointing at
              him. No ghost-writing, no duets, no stitch bait.
            </p>
          </li>
          <li className="px-5 py-3.5">
            <p className="text-xs font-medium text-white/80">
              Mike 1ne — written first person, because it is you
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-mute">
              Drafts say &ldquo;I&rdquo;, as the producer talking to other producers. They still need
              your approval, because posting as you is not the same as posting as the label.
            </p>
          </li>
        </ul>
      </Panel>

      <Panel title="Limits the agent checks">
        <ul className="grid gap-px bg-line sm:grid-cols-2">
          {PLATFORM_LIMITS.map((limit) => (
            <li key={limit.platform} className="flex items-center justify-between bg-soft px-5 py-2.5">
              <span className="text-[11px] text-white/60">{limit.platform}</span>
              <span className="font-mono text-[10px] text-white/30">
                {limit.post}
                {limit.hashtags ? ` · ${limit.hashtags} tags` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
