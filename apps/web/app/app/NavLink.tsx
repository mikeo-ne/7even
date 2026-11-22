"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export function NavLink({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = href === "/app" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
        active ? "bg-white/[0.07] font-medium text-white" : "text-mute hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-signal" : ""}`} strokeWidth={1.75} />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-signal px-1.5 py-0.5 text-[10px] font-bold text-ink">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
