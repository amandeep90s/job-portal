import Link from "next/link";

import { LogoIcon } from "@/components/common";
import { Button } from "@/components/ui/button";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export function VerifyEmailView() {
  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]">
        <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
          <div className="text-center">
            <Link href="/" aria-label="go home" className="mx-auto block w-fit">
              <LogoIcon />
            </Link>
            <h1 className="mt-4 mb-1 text-xl font-semibold">Verify Your Email</h1>
            <p className="text-sm">Enter the 6-digit code we sent to your email</p>
          </div>
          <VerifyEmailForm />
        </div>

        <div className="p-3">
          <p className="text-accent-foreground text-center text-sm">
            Don&apos;t have an account?
            <Button asChild variant="link" className="px-2">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </p>
        </div>
      </div>
    </section>
  );
}
