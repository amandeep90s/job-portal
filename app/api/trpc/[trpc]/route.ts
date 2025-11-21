import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { extractClientIP } from "@/lib/utils/ip-extractor";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

const handler = (req: Request) => {
  // Extract client IP from request
  // Note: remoteAddr should be the actual connection IP from the socket
  // For Vercel, this comes from x-forwarded-for header which represents the proxy
  // For local development, this would be the actual socket connection IP
  const remoteAddr = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
  const clientIP = extractClientIP(req.headers, remoteAddr);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const ctx = await createTRPCContext();
      // Add request info to context
      return {
        ...ctx,
        req,
        headers: req.headers,
        clientIP,
      };
    },
  });
};

export { handler as GET, handler as POST };
