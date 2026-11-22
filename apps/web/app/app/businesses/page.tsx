import type { Business } from "@7even/core";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, Panel } from "@/lib/ui";
import { BusinessEditor } from "./BusinessEditor";
import { BusinessForm } from "./BusinessForm";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").order("created_at");
  const businesses = (data as Business[]) ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Portfolio"
        title="Businesses"
        description="Each one gets a workspace folder on your Mac and its own context the agent reads before it acts."
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel title={`Your businesses (${businesses.length})`}>
          {businesses.length === 0 ? (
            <Empty text="Nothing here yet. Add one on the right — you can change everything later." />
          ) : (
            <ul className="divide-y divide-line">
              {businesses.map((business) => (
                <li key={business.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: business.colour }}
                      />
                      <p className="truncate text-sm font-medium">{business.name}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
                        business.autonomy === "auto"
                          ? "bg-signal/10 text-signal ring-signal/25"
                          : "bg-white/5 text-mute ring-white/10"
                      }`}
                    >
                      {business.autonomy === "auto" ? "auto" : "asks first"}
                    </span>
                  </div>
                  {business.brief && (
                    <p className="mt-1.5 text-xs leading-relaxed text-mute">{business.brief}</p>
                  )}
                  <p className="mt-2 font-mono text-[10px] text-white/25">
                    {business.workspace_path ?? `~/${business.slug}`}
                  </p>
                  {business.instructions && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-white/35 hover:text-white/60">
                        standing instructions
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-ink px-3 py-2 text-[11px] leading-relaxed text-white/55">
                        {business.instructions}
                      </pre>
                    </details>
                  )}
                  <BusinessEditor business={business} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <BusinessForm />
      </div>
    </div>
  );
}
