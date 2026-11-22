"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      title="Sign out"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await createClient().auth.signOut();
          router.replace("/");
          router.refresh();
        })
      }
      className="grid size-8 place-items-center rounded-lg text-mute transition hover:bg-white/5 hover:text-white disabled:opacity-50"
    >
      <LogOut className="size-4" />
    </button>
  );
}
