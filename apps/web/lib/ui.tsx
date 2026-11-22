import type { TaskStatus } from "@7even/core";

export const statusTone: Record<TaskStatus, string> = {
  queued: "bg-white/5 text-white/60 ring-white/10",
  claimed: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  running: "bg-signal/10 text-signal ring-signal/25",
  waiting_approval: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  done: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  failed: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
  cancelled: "bg-white/5 text-white/40 ring-white/10",
};

export const statusLabel: Record<TaskStatus, string> = {
  queued: "Queued",
  claimed: "Picked up",
  running: "Running",
  waiting_approval: "Needs you",
  done: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${
        statusTone[status] ?? statusTone.queued
      }`}
    >
      {status === "running" && <span className="live-dot size-1.5 rounded-full bg-signal" />}
      {statusLabel[status] ?? status}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-signal uppercase">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-lg text-sm text-mute">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="max-w-sm text-xs leading-relaxed text-white/35">{text}</p>
      {action}
    </div>
  );
}

export function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-line ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-line bg-soft px-5 py-3.5">
          <h2 className="text-sm font-medium">{title}</h2>
          {meta}
        </header>
      )}
      {children}
    </section>
  );
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
