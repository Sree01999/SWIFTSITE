"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();

    startTransition(() => {
      router.replace("/auth/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      data-capability="auth-logout"
      disabled={isPending}
      onClick={signOut}
      className={className ?? "btn-secondary text-sm disabled:opacity-60"}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
