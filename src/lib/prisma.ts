import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Jika model baru belum ada di cache memory runtime Next.js, reset instance
if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  (!("pengampu" in globalForPrisma.prisma) ||
    !("tujuanPembelajaran" in globalForPrisma.prisma) ||
    !("periodeAkademik" in globalForPrisma.prisma) ||
    !("raporPelengkap" in globalForPrisma.prisma))
) {
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;