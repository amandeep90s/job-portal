import { cache } from "react";

import { initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";

export const createTRPCContext = cache(async (opts: CreateNextContextOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getClientIp = (req: any) => {
    return (
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      "unknown"
    );
  };
  return {
    req: opts.req,
    res: opts.res,
    ip: getClientIp(opts.req),
    // TODO: Add user info here if you have authentication
    user: null,
  };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;

export const baseProcedure = t.procedure;

export const middleware = t.middleware;

// Base router and procedure helpers
export const createTRPCRouter = t.router;
