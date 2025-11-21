import { cache } from "react";

import { createHydrationHelpers } from "@trpc/react-query/rsc";

import "server-only"; // <-- ensure this file cannot be imported from the client
import { createCallerFactory, createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

const createContextForRSC = () =>
  createTRPCContext({
    req: {} as unknown as CreateNextContextOptions["req"],
    res: {} as unknown as CreateNextContextOptions["res"],
    info: {
      header: new Headers(),
      accept: "application/json",
      type: "rsc",
      isBatchCall: false,
      calls: [],
      isInternal: true,
    },
  } as unknown as CreateNextContextOptions);

const caller = createCallerFactory(appRouter)(createContextForRSC);
export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(caller, getQueryClient);
