import { PLATFORMS, MINIMUM_STACK, type Automation } from "@7even/core";
import { PageHeader, Panel } from "@/lib/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TONE: Record<Automation, { label: string; className: string }> = {
  free: { label: "agent can post free", className: "bg-signal/10 text-signal" },
  review: { label: "free after app review", className: "bg-amber-400/10 text-amber-300" },
  paid: { label: "costs money per post", className: "bg-rose-500/10 text-rose-300" },
  manual: { label: "by hand", className: "bg-white/5 text-white/40" },
};

type AccountRow = {
  id: string;
  platform: string;
  handle: string;
  label: string | null;
  role: string;
  present: boolean;
  api_account_id: string | null;
  login_email: string | null;
  notes: string | null;
  business_id: string | null;
};

type BusinessRow = { id: string; name: string };

/** The ones that can be switched on today, in the order worth doing them. */
const LATEST: { platform: string; title: string; body: string }[] = [
  {
    platform: "instagram",
    title: "Instagram — free today, on the Instagram Login path",
    body:
      "An account you own does not need an app review. Create a Meta app, add the Instagram product, choose Instagram Login, add the professional account as a tester, and generate a token in the dashboard. Publish against graph.instagram.com with instagram_business_content_publish. A review is only for posting to accounts you do not own.",
  },
  {
    platform: "facebook",
    title: "Facebook Page — free today, because you already have the Page",
    body:
      "Posting to a Page you administer is Standard Access: no review, no payment. You need a Page access token with pages_manage_posts and the Page id. That is the same app as Instagram.",
  },
  {
    platform: "linkedin",
    title: "LinkedIn — the one that actually waits",
    body:
      "Company-page posting needs the Community Management API, which LinkedIn reviews by hand: roughly one to four weeks, and posting as a Page is refused until it is approved. Start the application early; it is the only queue here that is truly gated.",
  },
];

export default async function SetupPage() {
  const ordered = [...PLATFORMS].sort((a, b) => a.priority - b.priority);

  const supabase = await createClient();
  const [{ data: accountRows }, { data: businessRows }] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .order("platform")
      .order("present", { ascending: false }),
    supabase.from("businesses").select("id,name"),
  ]);

  const accounts = (accountRows as AccountRow[] | null) ?? [];
  const businesses = (businessRows as BusinessRow[] | null) ?? [];
  const businessName = new Map(businesses.map((row) => [row.id, row.name]));

  const present = accounts.filter((row) => row.present);
  const missing = accounts.filter((row) => !row.present);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Accounts"
        title="What to set up"
        description="Every account the businesses need, what form it has to be in, and whether an agent can actually post to it."
      />

      <Panel title="The honest position on automation">
        <div className="space-y-3 px-5 py-4 text-xs leading-relaxed text-mute">
          <p>
            <span className="text-white/80">X cannot be automated for free.</span> Its free API tier
            closed to new developers in February 2026. It is now pay-per-use: roughly{" "}
            <span className="font-mono text-white/60">$0.015</span> a post, and{" "}
            <span className="font-mono text-white/60">$0.20</span> for a post containing a link. For
            a label that posts links, that is the worst value of any platform here. Post X by hand —
            X&apos;s own scheduler is free.
          </p>
          <p>
            <span className="text-white/80">Instagram and TikTok need approval, not money.</span>{" "}
            Both are free to post to through their APIs once an app review passes. Until then, the
            agent writes and you paste — the copy button on each post gives you exactly what to
            paste.
          </p>
          <p>
            <span className="text-white/80">LinkedIn is the quiet win.</span> It posts to a company
            page on the free developer tier, and it is where East Sound&apos;s audience actually is.
          </p>
        </div>
      </Panel>

      <Panel title={`What exists today (${present.length})`}>
        {present.length === 0 ? (
          <p className="px-5 py-4 text-xs text-mute">
            No accounts recorded yet. Nothing is planned against a handle until it is in this list.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {present.map((row) => (
              <li key={row.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white/40">
                    {row.platform}
                  </span>
                  <span className="font-mono text-xs text-white/80">{row.handle}</span>
                  {row.role === "artist" && (
                    <span className="rounded bg-sky-400/10 px-1.5 py-0.5 text-[9px] text-sky-300">artist</span>
                  )}
                  {row.business_id && (
                    <span className="text-[10px] text-white/30">{businessName.get(row.business_id)}</span>
                  )}
                  {row.api_account_id ? (
                    <span className="rounded bg-signal/10 px-1.5 py-0.5 text-[9px] text-signal">
                      id recorded
                    </span>
                  ) : (
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/25">
                      id not recorded
                    </span>
                  )}
                </div>
                {row.notes && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{row.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {missing.length > 0 && (
        <Panel title="Wanted, not yet real">
          <ul className="divide-y divide-line">
            {missing.map((row) => (
              <li key={row.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-amber-300">
                    {row.platform}
                  </span>
                  <span className="font-mono text-xs text-white/60">{row.handle}</span>
                  {row.business_id && (
                    <span className="text-[10px] text-white/30">{businessName.get(row.business_id)}</span>
                  )}
                </div>
                {row.notes && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{row.notes}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="px-5 pb-4 pt-2 text-[10px] text-white/30">
            Nothing is ever planned against these until they are marked present.
          </p>
        </Panel>
      )}

      <Panel title="Free today, no review">
        <ul className="divide-y divide-line">
          {LATEST.map((item) => (
            <li key={item.platform} className="px-5 py-4">
              <p className="text-xs font-medium text-white/80">{item.title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{item.body}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Start with this">
        <ul className="divide-y divide-line">
          {MINIMUM_STACK.map((item, index) => (
            <li key={item} className="flex gap-3 px-5 py-3">
              <span className="font-mono text-[10px] text-signal">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-xs text-white/70">{item}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Every platform, in priority order">
        <ul className="divide-y divide-line">
          {ordered.map((spec) => (
            <li key={spec.key} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-white/25">
                  {String(spec.priority).padStart(2, "0")}
                </span>
                <p className="text-sm font-medium">{spec.platform}</p>
                <span className={`rounded-full px-2 py-0.5 text-[9px] ${TONE[spec.automation].className}`}>
                  {TONE[spec.automation].label}
                </span>
                {spec.adapter ? (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">
                    adapter built
                  </span>
                ) : (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/25">
                    no adapter
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-mute">{spec.why}</p>

              <dl className="mt-2.5 space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <dt className="inline text-white/35">Account needed · </dt>
                  <dd className="inline text-white/65">{spec.account}</dd>
                </div>
                <div>
                  <dt className="inline text-white/35">Format · </dt>
                  <dd className="inline text-white/65">{spec.limits}</dd>
                </div>
                <div>
                  <dt className="inline text-white/35">Automation · </dt>
                  <dd className="inline text-white/65">{spec.automationNote}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="One account to own them all">
        <p className="px-5 py-4 text-xs leading-relaxed text-mute">
          Use a single Google account to create every brand account —{" "}
          <span className="font-mono text-white/60">7hmusicgroupug@gmail.com</span> already exists and
          is published on the site. Create Instagram, TikTok, YouTube, LinkedIn and the Facebook Page
          from that one login, so a phone is never the only thing holding the keys. Add{" "}
          <span className="font-mono text-white/60">mikeonerecords@gmail.com</span> as a second admin
          on each. If either mailbox is lost, the accounts are still recoverable — which is the only
          disaster here that is unrecoverable.
        </p>
      </Panel>
    </div>
  );
}
