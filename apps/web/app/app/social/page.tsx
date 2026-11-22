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

          <Panel title="Channels">
            <ul className="divide-y divide-line">
              {CHANNELS.map((channel) => {
                const business = businesses.find((row) => row.slug === channel.slug);
                return (
                  <li key={channel.slug} className="px-5 py-3">
                    <p className="text-xs font-medium">{business?.name ?? channel.slug}</p>
                    <p className="mt-1 text-[11px] text-mute">
                      {channel.handles.length > 0
                        ? channel.handles.map((handle) => `${handle.platform} ${handle.handle}`).join(" · ")
                        : "No dedicated accounts yet"}
                    </p>
                  </li>
                );
              })}
            </ul>
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
    </div>
  );
}
