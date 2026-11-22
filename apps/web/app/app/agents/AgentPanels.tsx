"use client";

import { useActionState } from "react";
import { Loader2, Network, Plug } from "lucide-react";
import { addPeer, connectAgent, type ActionState } from "../actions";

const input =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15";

export function AgentPanels() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <MiniForm
        icon={<Plug className="size-4 text-signal" />}
        title="Register a bridge"
        hint="Give this Mac a name and its public URL so the control room can show its status."
        action={connectAgent}
        fields={[
          { name: "name", label: "Name", placeholder: "Mike's MacBook" },
          { name: "base_url", label: "Public A2A URL", placeholder: "https://mac.example.com" },
        ]}
        submit="Register"
      />
      <MiniForm
        icon={<Network className="size-4 text-signal" />}
        title="Add a peer agent"
        hint="Any A2A agent with a reachable card. Your bridge can then delegate sub-tasks to it."
        action={addPeer}
        fields={[
          { name: "name", label: "Name", placeholder: "Accounting agent" },
          { name: "base_url", label: "Base URL", placeholder: "https://agent.example.com" },
        ]}
        submit="Add peer"
      />
    </div>
  );
}

function MiniForm({
  icon,
  title,
  hint,
  action,
  fields,
  submit,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: { name: string; label: string; placeholder: string }[];
  submit: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <div className="rounded-xl border border-line bg-soft p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <p className="mt-1.5 text-xs text-mute">{hint}</p>

      <form action={formAction} className="mt-4 space-y-3">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1.5 block text-xs text-mute">{field.label}</span>
            <input name={field.name} placeholder={field.placeholder} className={input} />
          </label>
        ))}

        {state?.error && <p className="text-xs text-rose-300">{state.error}</p>}
        {state?.ok && <p className="text-xs text-signal">{state.ok}</p>}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-white/5 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submit}
        </button>
      </form>
    </div>
  );
}
