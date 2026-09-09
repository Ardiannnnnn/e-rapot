import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Version token untuk memaksa regenerasi instance Prisma Client di memory Next.js dev saat schema berubah
const PRISMA_CLIENT_VERSION = "2026-09-08-mulok-v2";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaVersion?: string;
  pgPool?: pg.Pool;
};

// Singleton pool untuk mencegah exhaustion pool connection di Next.js hot-reload
if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  globalForPrisma.pgPool.on("error", (err) => {
    // Tangani disconnect idle client serverless (Neon suspend) agar tidak crash
    console.warn("[Postgres Pool Warning]", err.message);
  });
}

// Jika schema berubah atau model/kolom baru ditambahkan, buang instance lama di memory
if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  globalForPrisma.prismaVersion !== PRISMA_CLIENT_VERSION
) {
  globalForPrisma.prisma = undefined;
}

const adapter = new PrismaPg(globalForPrisma.pgPool, {
  onPoolError: (err) => {
    console.warn("[PrismaPg Pool Warning]", err.message);
  },
  onConnectionError: (err) => {
    console.warn("[PrismaPg Connection Warning]", err.message);
  },
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION;
}