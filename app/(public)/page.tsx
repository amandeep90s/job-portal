import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { env } from "@/lib/config";
import { HydrateClient } from "@/trpc/server";

export default function Home() {
  return (
    <HydrateClient>
      <ErrorBoundary fallback={<div>Something went wrong.</div>}>
        <Suspense fallback={<div>Loading...</div>}>{env.APP_NAME} App</Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
