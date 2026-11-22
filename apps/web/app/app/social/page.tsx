import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, Panel, StatusPill } from "@/lib/ui";
import { CHANNELS, PLATFORM_LIMITS } from "@7even/core";
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

/** Pull a platform out of a task title, because the agent is asked to say it. */
function platformOf(text: string): string {
  const found = PLATFORMS.find((platform) => new RegExp(`\\b${platform}\\b`, "i").test(text));
  return found ?? "—";
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
    /social|post|caption|instagram|tiktok|youtube|hashtag|content|promote|promotion|campaign|schedule.*post/i.test(
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

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reach"
        title="Social"
        description="Every post the agent has planned or drafted, by business and platform. Publishing always waits for your approval."
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
                const brand = channel.brand;
                return (
                  <div key={channel.slug} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: business?.colour ?? "#d7ff3e" }}
                      />
                      <p className="text-xs font-medium">{business?.name ?? channel.slug}</p>
                    </div>

                    {brand.length === 0 ? (
                      <p className="mt-1.5 text-[11px] text-amber-300/80">
                        No accounts. Drafts are for you to place.
                      </p>
                    ) : (
                      <ul className="mt-1.5 space-y-1">
                        {brand.map((account) => (
                          <li key={`${account.platform}-${account.handle}`}>
                            {account.state === "missing" ? (
                              <span className="font-mono text-[10px] text-white/25 line-through">
                                {account.platform} {account.handle}
                              </span>
                            ) : (
                              <a
                                href={account.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[10px] text-white/50 hover:text-signal"
                              >
                                {account.platform} {account.handle}
                              </a>
                            )}
                            {account.state === "empty" && (
                              <span className="ml-1.5 rounded bg-amber-400/10 px-1 py-0.5 text-[9px] text-amber-300">
                                never posted
                              </span>
                            )}
                            {account.state === "login-walled" && (
                              <span className="ml-1.5 rounded bg-white/5 px-1 py-0.5 text-[9px] text-white/35">
                                unverified
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {channel.artists.length > 0 && (
                      <p className="mt-2 text-[10px] text-white/30">
                        plus {channel.artists.length} artist accounts
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Limits the agent checks">
            <ul className="divide-y divide-line">
              {PLATFORM_LIMITS.slice(0, 5).map((limit) => (
                <li key={limit.platform} className="flex items-center justify-between px-5 py-2.5">
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
      </div>

      <Panel title="Artist accounts the label can plan with">
        <ul className="grid gap-px bg-line sm:grid-cols-2">
          {CHANNELS.filter((channel) => channel.slug === "7h-music-group")
            .flatMap((channel) => channel.artists)
            .filter((account) => account.platform === "Instagram" || account.platform === "TikTok")
            .map((account) => (
              <li key={`${account.platform}-${account.handle}`} className="bg-soft px-5 py-3">
                <p className="text-xs font-medium text-white/80">{account.artist}</p>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block font-mono text-[10px] text-white/40 hover:text-signal"
                >
                  {account.platform} {account.handle}
                </a>
                {account.note && (
                  <p className="mt-1 text-[10px] leading-relaxed text-white/30">{account.note}</p>
                )}
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
