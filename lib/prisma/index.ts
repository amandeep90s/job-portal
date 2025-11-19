import { PrismaClient } from "@prisma/client";

import { NodeEnv } from "@/types/env.types";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === NodeEnv.Development ? ["query", "info", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== NodeEnv.Production) globalForPrisma.prisma = prisma;
