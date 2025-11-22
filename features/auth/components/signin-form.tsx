"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { authValidators, SignInInput } from "@/validators";

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const signInMutation = trpc.auth.signIn.useMutation();

  const form = useForm<SignInInput>({
    resolver: zodResolver(authValidators.signIn),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    startTransition(async () => {
      try {
        const result = await signInMutation.mutateAsync(data);
        toast.success(result.message);

        // SECURITY: Session creation is now handled server-side as part of the sign-in mutation
        // This prevents race conditions where authentication succeeds but session creation fails.
        // The server sets secure HTTP-only cookies during the sign-in process.

        // Check if user is verified
        if (!result.verified) {
          // Redirect unverified users to email verification page
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }

        // Redirect verified users based on role
        const dashboardUrl = result.user.role === "employer" ? "/employer" : "/job-seeker";
        router.push(dashboardUrl);
      } catch (error) {
        // Generic error message for security - don't reveal specific failure reasons
        let message = "Sign in failed. Please check your credentials and try again.";

        if (error instanceof Error) {
          // Only show account-specific messages for certain error types
          if (error.message.includes("locked") || error.message.includes("minutes")) {
            message = error.message; // Account lock message is expected to be shown
          } else if (error.message.includes("disabled")) {
            message = "Your account is currently unavailable. Please contact support.";
          }
          // For all other errors, use generic message to prevent user enumeration
        }
        toast.error(message);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="mb-0 block text-sm">Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  className="mb-0"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isPending || form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="mb-0 block text-sm">Password</FormLabel>
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot your Password?
                  </a>
                </Button>
              </div>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  className="mb-0"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isPending || form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || form.formState.isSubmitting || signInMutation.isPending}
        >
          {signInMutation.isPending ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
