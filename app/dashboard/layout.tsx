import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Disc3, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "./NavLink";
import { SignOutButton } from "./SignOutButton";

const nav = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/releases", label: "Releases", icon: Disc3 },
  { href: "/dashboard/artists", label: "Artists", icon: Users },
  { href: "/dashboard/earnings", label: "Earnings", icon: Wallet },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("label_members")
    .select("role, labels(id, name, currency)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const label = (membership?.labels ?? null) as
    | { id: string; name: string; currency: string }
    | null;

  const initial = (label?.name ?? user.email ?? "7").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="flex flex-col justify-between border-line lg:sticky lg:top-0 lg:h-screen lg:border-r">
        <div>
          <div className="flex items-center gap-2.5 px-5 py-5">
            <span className="grid size-8 place-items-center rounded-lg bg-lime text-[13px] font-black text-ink">
              7
            </span>
            <span className="text-base font-semibold tracking-tight">7even</span>
          </div>

          <div className="mx-3 mb-4 rounded-lg border border-line bg-ink-soft px-3.5 py-3">
            <p className="truncate text-sm font-medium">{label?.name ?? "Your label"}</p>
            <p className="mt-0.5 text-[11px] text-mute capitalize">
              {membership?.role ?? "owner"} · {label?.currency ?? "USD"}
            </p>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 lg:block lg:space-y-0.5">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold">
              {initial}
            </span>
            <span className="truncate text-xs text-mute">{user.email}</span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="min-w-0 border-t border-line lg:border-t-0">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
