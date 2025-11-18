"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";
import { authValidators, type SignupInput } from "@/validators/auth.validators";

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const signupMutation = trpc.auth.signup.useMutation();

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SignupInput>({
    resolver: zodResolver(authValidators.signup),
    defaultValues: {
      role: "job_seeker",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: SignupInput) => {
    startTransition(async () => {
      try {
        const result = await signupMutation.mutateAsync(data);
        toast.success(result.message);
        // Redirect to email verification
        router.push("/verify-email");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Signup failed";
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="block text-sm">
          Full Name
        </Label>
        <Input
          type="text"
          id="name"
          placeholder="John Doe"
          {...register("name")}
          disabled={isPending || isSubmitting}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="block text-sm">
          Email
        </Label>
        <Input
          type="email"
          id="email"
          placeholder="name@example.com"
          {...register("email")}
          disabled={isPending || isSubmitting}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="block text-sm">
          Password
        </Label>
        <Input
          type="password"
          id="password"
          placeholder="••••••••"
          {...register("password")}
          disabled={isPending || isSubmitting}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        <p className="text-muted-foreground text-xs">At least 8 characters with uppercase, lowercase, and numbers</p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="block text-sm">
          Confirm Password
        </Label>
        <Input
          type="password"
          id="confirmPassword"
          placeholder="••••••••"
          {...register("confirmPassword")}
          disabled={isPending || isSubmitting}
          className={errors.confirmPassword ? "border-red-500" : ""}
        />
        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label className="block text-sm">I am a</Label>
        <div className="grid grid-cols-2 gap-3">
          <label className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition">
            <input
              type="radio"
              value="job_seeker"
              {...register("role")}
              disabled={isPending || isSubmitting}
              className="cursor-pointer"
            />
            <span className="text-sm">Job Seeker</span>
          </label>
          <label className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition">
            <input
              type="radio"
              value="employer"
              {...register("role")}
              disabled={isPending || isSubmitting}
              className="cursor-pointer"
            />
            <span className="text-sm">Employer</span>
          </label>
        </div>
        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-2">
        <label className="flex items-start gap-2">
          <Checkbox
            id="agreeToTerms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => {
              setAgreeToTerms(checked as boolean);
              setValue("agreeToTerms", checked as boolean);
            }}
            disabled={isPending || isSubmitting}
            className="mt-1"
          />
          <span className="text-sm">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.agreeToTerms && <p className="text-xs text-red-500">{errors.agreeToTerms.message}</p>}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending || isSubmitting || signupMutation.isPending}>
        {isPending || isSubmitting || signupMutation.isPending ? "Creating Account..." : "Create Account"}
      </Button>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-accent-foreground text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}
