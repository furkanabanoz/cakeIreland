import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function normalizeRateLimitKey(key: string) {
  return createHash("sha256")
    .update(key.trim().toLowerCase())
    .digest("hex");
}

export async function checkRateLimit({
  key,
  limit,
  windowMs,
  userId,
}: {
  key: string;
  limit: number;
  windowMs: number;
  userId?: string;
}): Promise<RateLimitResult> {
  if (
    !key.trim() ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowMs) ||
    windowMs < 1
  ) {
    throw new Error("Invalid rate limit configuration.");
  }

  const hashedKey = normalizeRateLimitKey(key);
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  await prisma.$executeRaw`
    INSERT INTO "RateLimitBucket" ("key", "userId", "count", "resetAt", "updatedAt")
    VALUES (${hashedKey}, ${userId ?? null}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "userId" = COALESCE(EXCLUDED."userId", "RateLimitBucket"."userId"),
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN EXCLUDED."resetAt"
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = ${now}
  `;

  const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({
    where: {
      key: hashedKey,
    },
    select: {
      count: true,
      resetAt: true,
    },
  });

  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)
    ),
  };
}

export function getClientAddress(request: Request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return (
    request.headers.get("x-vercel-forwarded-for")?.trim() ||
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
