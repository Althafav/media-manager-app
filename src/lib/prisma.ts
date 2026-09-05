import { PrismaClient } from '@/generated/prisma/client'

// Accelerate connects through Prisma's managed proxy over HTTP (its own pooled connection
// to the database), which is why it replaces the @prisma/adapter-pg direct TCP connection
// here rather than combining with it — a client can only use one connection strategy.
// Migrations still go straight to the database via DATABASE_URL (see prisma7.config.ts),
// unaffected by this.
//
// Deliberately NOT applying .$extends(withAccelerate()) from @prisma/extension-accelerate:
// (1) its per-query `cacheStrategy` option adds a second caching layer with its own TTL,
// independent of our tag-based revalidateTag/updateTag invalidation in src/lib/data.ts —
// mixing the two would risk serving stale data after a real write, exactly the class of bug
// this session's diff-sync/speakersEqual work fixed. (2) more concretely, applying it here
// breaks Prisma's generated `include`/`select` result-type inference project-wide (verified:
// `tsc --noEmit` was clean before adding it, and threw ~80 errors across every page using
// `include` the moment `.$extends(withAccelerate())` was added, then clean again once
// removed) — a real incompatibility between this extension's generic method overrides and
// the installed @prisma/client version, not a hypothetical. The `accelerateUrl` connection
// itself (pooling) still applies without the extension.
function createPrismaClient() {
  return new PrismaClient({
    accelerateUrl: process.env.ACCELERATE_DATABASE_URL!,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> | undefined }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
