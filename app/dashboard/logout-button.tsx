"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      aria-label="Log out"
      onClick={handleLogout}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOutIcon className="size-5" />
    </button>
  );
}
