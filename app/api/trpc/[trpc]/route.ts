import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createContext: () => createTRPCContext({ req } as any),
  });

export { handler as GET, handler as POST };
