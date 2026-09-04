"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MobileMenuSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex justify-center py-3 sm:hidden"
      >
        <span
          aria-hidden="true"
          className="h-1 w-10 rounded-full bg-white/20"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dark gap-4 border-none bg-popover p-5 text-foreground sm:hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Menu</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-base text-foreground transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            <LogOutIcon className="size-5 text-muted-foreground" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
