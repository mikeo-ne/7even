"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
        active
          ? "bg-white/[0.07] font-medium text-white"
          : "text-mute hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-lime" : ""}`} strokeWidth={1.75} />
      {label}
    </Link>
  );
}
