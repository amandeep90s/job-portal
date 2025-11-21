import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/config";
import { NodeEnv } from "@/types/env.types";

const connectionString = `${env.DATABASE_URL}`;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === NodeEnv.Development ? ["query", "info", "warn", "error"] : ["warn", "error"],
});

if (env.NODE_ENV !== NodeEnv.Production) globalForPrisma.prisma = prisma;

export { prisma };
