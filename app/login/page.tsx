import { AuthForm } from "./AuthForm";

export const metadata = { title: "Sign in — 7even" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex items-center justify-center px-6 py-16">
        <div className="pointer-events-none absolute inset-0 glow-lime opacity-60" />
        <div className="relative">
          <AuthForm />
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-line bg-ink-soft lg:block">
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-lime text-[13px] font-black text-ink">
              7
            </span>
            <span className="text-lg font-semibold tracking-tight">7even</span>
          </div>

          <div>
            <blockquote className="max-w-md text-2xl leading-snug font-medium tracking-tight text-white/90">
              &ldquo;We went from emailing spreadsheets at midnight to knowing exactly what each
              store paid us.&rdquo;
            </blockquote>
            <p className="mt-5 text-sm text-mute">
              Independent label · Kampala
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-line pt-8">
            {[
              ["8", "Stores"],
              ["100%", "Royalties kept"],
              ["0", "Per-release fees"],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="text-2xl font-semibold tracking-tight text-lime">{v}</dt>
                <dd className="mt-1 text-xs text-mute">{k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
