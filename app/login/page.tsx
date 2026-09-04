"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup";

function AuthForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setEmail("");
    setPassword("");
    setIsPasswordVisible(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="dark flex min-h-svh items-center justify-center bg-background px-6 text-foreground sm:px-4">
      <div className="flex w-full max-w-xs flex-col gap-5 sm:max-w-sm sm:gap-6">
        <p className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Renewd
        </p>

        <div className="flex rounded-xl border border-white/10 bg-[#151515] p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-bold transition-colors sm:py-2.5",
              isLogin
                ? "bg-[var(--accent-pink)] text-black"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-bold transition-colors sm:py-2.5",
              !isLogin
                ? "bg-[var(--accent-pink)] text-black"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sign up
          </button>
        </div>

        <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <Label
              htmlFor="email"
              className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase sm:text-[11px]"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-lg border-white/10 bg-black/40 px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <Label
              htmlFor="password"
              className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase sm:text-[11px]"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 rounded-lg border-white/10 bg-black/40 px-3 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-[var(--accent-pink)]"
              >
                {isPasswordVisible ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-auto rounded-lg border-transparent bg-[var(--accent-pink)] py-2.5 text-sm font-bold text-black hover:bg-[var(--accent-pink)]/85"
          >
            {isSubmitting
              ? isLogin
                ? "Logging in..."
                : "Signing up..."
              : isLogin
                ? "Log in"
                : "Sign up"}
          </Button>
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "signup" : "login")}
              className="font-bold text-[var(--accent-pink)] hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function AuthFormWithSearchParams() {
  const searchParams = useSearchParams();
  const initialMode: Mode =
    searchParams.get("mode") === "signup" ? "signup" : "login";
  return <AuthForm initialMode={initialMode} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthFormWithSearchParams />
    </Suspense>
  );
}
