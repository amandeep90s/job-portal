import Redis from "ioredis";

import { env } from "@/lib/config";
import { NodeEnv } from "@/types";

const getRedisUrl = (): string => {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }

  throw new Error("REDIS_URL is not defined in environment variables");
};

const globalForRedis = global as unknown as { redis: Redis | undefined };

export const redis = globalForRedis.redis ?? new Redis(getRedisUrl());

if (env.NODE_ENV !== NodeEnv.Production) globalForRedis.redis = redis;
