"use client";
import { ModeToggle } from "@/components/ui/mode-toggle";
// <-- hooks can only be used in client components
import { Button } from "@/components/ui/button";
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
