"use client";

import { useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authValidators, SignInInput } from "@/validators";

export default function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(authValidators.signIn),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: SignInInput) => {
    console.log({ data });
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
            <FormItem className="space-y-0">
              <div className="flex items-center justify-between">
                <FormLabel className="mb-0 block text-sm">Password</FormLabel>

                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot your Password?
                  </Link>
                </Button>
              </div>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  className="input sz-md variant-mixed mb-0"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isPending || form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending || form.formState.isSubmitting}>
          Sign In
        </Button>
      </form>
    </Form>
  );
}
