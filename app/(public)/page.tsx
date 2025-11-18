import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

export default function Home() {
  return (
    <HydrateClient>
      <ErrorBoundary fallback={<div>Something went wrong.</div>}>
        <Suspense fallback={<div>Loading...</div>}>JobSearch App</Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
