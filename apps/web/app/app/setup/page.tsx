import { PLATFORMS, MINIMUM_STACK, type Automation } from "@7even/core";
import { PageHeader, Panel } from "@/lib/ui";

export const dynamic = "force-static";

const TONE: Record<Automation, { label: string; className: string }> = {
  free: { label: "agent can post free", className: "bg-signal/10 text-signal" },
  review: { label: "free after app review", className: "bg-amber-400/10 text-amber-300" },
  paid: { label: "costs money per post", className: "bg-rose-500/10 text-rose-300" },
  manual: { label: "by hand", className: "bg-white/5 text-white/40" },
};

export default function SetupPage() {
  const ordered = [...PLATFORMS].sort((a, b) => a.priority - b.priority);

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
