"use client";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
// <-- hooks can only be used in client components
import { trpc } from "@/trpc/client";

export function ClientGreeting() {
  const [data] = trpc.hello.useSuspenseQuery({ text: "Amandeep" });

  return (
    <div>
      Client says {data.greeting}
      <Button>Click me</Button>
      <ModeToggle />
    </div>
  );
}
