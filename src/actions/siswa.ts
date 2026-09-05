"use server";

import { prisma } from "@/lib/prisma";

export async function getSiswaByKelas(kelasId: string) {
  return prisma.siswa.findMany({
    where: { kelasId },
    orderBy: { nama: "asc" },
  });
}
