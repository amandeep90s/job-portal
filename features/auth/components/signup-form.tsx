"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/trpc/client";
import { authValidators, SignUpInput } from "@/validators";

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const signupMutation = trpc.auth.signup.useMutation();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(authValidators.signup),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "job_seeker",
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    startTransition(async () => {
      try {
        const result = await signupMutation.mutateAsync(data);
        toast.success(result.message);

        // Redirect to sign-in page after successful signup
        router.push("/sign-in");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Signup Failed";
        toast.error(message);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="block text-sm">Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  className="mb-0"
                  autoComplete="name"
                  disabled={isPending || form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="block text-sm">Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  className="mb-0"
                  autoComplete="email"
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
              <FormLabel className="block text-sm">Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  className="input sz-md variant-mixed mb-0"
                  autoComplete="new-password"
                  disabled={isPending || form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="block text-sm">Confirm Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  className="mb-0"
                  autoComplete="new-password"
                  disabled={isPending || form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <p className="block text-sm">I am a</p>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending || form.formState.isSubmitting}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="hover:bg-accent flex items-center gap-2 rounded-lg border p-3 transition">
                      <RadioGroupItem value="job_seeker" id="job_seeker" />
                      <Label htmlFor="job_seeker">Job Seeker</Label>
                    </div>
                    <div className="hover:bg-accent flex items-center gap-2 rounded-lg border p-3 transition">
                      <RadioGroupItem value="employer" id="employer" />
                      <Label htmlFor="employer">Employer</Label>
                    </div>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
