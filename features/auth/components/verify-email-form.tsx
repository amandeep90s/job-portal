"use client";

import { useTransition } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { trpc } from "@/trpc/client";
import { authValidators, VerifyEmailInput } from "@/validators";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const emailFromParams = searchParams.get("email");
  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation();
  const resendEmailMutation = trpc.auth.resendVerificationEmail.useMutation();

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(authValidators.verifyEmail),
    defaultValues: {
      email: emailFromParams ?? "",
      otp: "",
    },
  });

  const onSubmit = async (data: VerifyEmailInput) => {
    startTransition(async () => {
      try {
        const result = await verifyEmailMutation.mutateAsync(data);
        toast.success(result.message);
        // Redirect to sign-in page after successful verification
        router.push("/sign-in");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Verification failed";
        toast.error(message);
      }
    });
  };

  const onResendEmail = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast.error("Please enter your email to resend verification.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await resendEmailMutation.mutateAsync({ email });
        toast.success(result.message);
        // In production, the token would be sent via email
        // For development, you could show it in a toast or handle differently
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resend verification email";
        toast.error(message);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="bg-muted/50 rounded-lg border p-4 text-sm">
          <p className="text-foreground">
            We&apos;ve sent a verification code to your email. Please enter it below to verify your account.
          </p>
        </div>

        {!emailFromParams && (
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
                    disabled={isPending || form.formState.isSubmitting}
                    placeholder="Enter your email"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="mb-0 block text-center text-sm">6-Digit Verification Code</FormLabel>
              <FormControl>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} {...field} disabled={isPending || form.formState.isSubmitting}>
                    <InputOTPGroup className="flex w-full justify-between">
                      <InputOTPSlot index={0} className="h-12 flex-1" />
                      <InputOTPSlot index={1} className="h-12 flex-1" />
                      <InputOTPSlot index={2} className="h-12 flex-1" />
                      <InputOTPSlot index={3} className="h-12 flex-1" />
                      <InputOTPSlot index={4} className="h-12 flex-1" />
                      <InputOTPSlot index={5} className="h-12 flex-1" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </FormControl>
              <FormMessage className="text-center text-xs" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || form.formState.isSubmitting || verifyEmailMutation.isPending}
        >
          {verifyEmailMutation.isPending ? "Verifying..." : "Verify Email"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onResendEmail}
          disabled={isPending || form.formState.isSubmitting || resendEmailMutation.isPending}
        >
          {resendEmailMutation.isPending ? "Sending..." : "Resend Verification Code"}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already verified? </span>
          <Button asChild variant="link" size="sm" className="p-0">
            <Link href="/sign-in" className="link intent-info variant-ghost">
              Sign in here
            </Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
