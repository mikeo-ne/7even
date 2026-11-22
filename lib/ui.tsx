export function Artwork({ url, alt, size = 44 }: { url: string | null; alt: string; size?: number }) {
  if (!url) {
    return (
      <div
        className="grid shrink-0 place-items-center rounded-md bg-white/[0.06] text-xs text-white/25"
        style={{ width: size, height: size }}
      >
        ♪
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="shrink-0 rounded-md object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <p className="max-w-xs text-xs leading-relaxed text-white/35">{text}</p>
      {action}
    </div>
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
        <p className="text-xs font-semibold tracking-[0.18em] text-lime uppercase">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-mute">{description}</p>}
      </div>
      {action}
    </div>
  );
}
