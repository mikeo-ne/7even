import { AuthForm } from "./AuthForm";

export const metadata = { title: "Sign in — 7even" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex items-center justify-center px-6 py-16">
        <div className="pointer-events-none absolute inset-0 signal-glow opacity-70" />
        <div className="relative">
          <AuthForm />
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-line bg-soft lg:block">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-signal text-[13px] font-black text-ink">
              7
            </span>
            <span className="text-lg font-semibold tracking-tight">7even</span>
          </div>

          <div className="max-w-sm">
            <p className="text-2xl leading-snug font-medium tracking-tight text-white/90">
              The queue lives here. The work happens on your Mac.
            </p>
            <p className="mt-4 text-sm text-mute">
              Sign in, add a business, then paste your agent token to connect the bridge.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-line pt-8">
            {[
              ["A2A", "Protocol"],
              ["Local", "Execution"],
              ["1 tap", "Approvals"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-xl font-semibold tracking-tight text-signal">{value}</dt>
                <dd className="mt-1 text-xs text-mute">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
