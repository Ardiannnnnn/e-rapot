import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Mendapatkan data identitas sekolah dengan Server-Side Caching.
 * Di-cache berdasarkan sekolahId dan ditandai tag 'sekolah-[id]'.
 * Otomatis di-invalidasi saat admin sekolah atau super admin mengubah profil sekolah.
 */
export const getCachedSekolah = (sekolahId: string) =>
  unstable_cache(
    async () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`\x1b[33m⚡ [CACHE MISS - DB FETCH]\x1b[0m Mengambil data Profil Sekolah (${sekolahId}) dari database...`);
      }
      return prisma.sekolah.findUnique({
        where: { id: sekolahId },
      });
    },
    [`sekolah-profil-${sekolahId}`],
    {
      tags: [`sekolah-${sekolahId}`],
      revalidate: 3600 * 24, // 24 jam (atau sampai di-trigger updateTag)
    }
  )();

/**
 * Mendapatkan Periode Akademik yang sedang AKTIF untuk sekolah tertentu.
 * Di-cache dengan tag 'periode-aktif-[id]'.
 * Otomatis di-invalidasi saat admin mengganti tahun ajaran atau semester aktif.
 */
export const getCachedPeriodeAktif = (sekolahId: string) =>
  unstable_cache(
    async () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`\x1b[33m⚡ [CACHE MISS - DB FETCH]\x1b[0m Mengambil data Periode Aktif (${sekolahId}) dari database...`);
      }
      return prisma.periodeAkademik.findFirst({
        where: {
          sekolahId,
          isAktif: true,
        },
      });
    },
    [`periode-aktif-${sekolahId}`],
    {
      tags: [`periode-aktif-${sekolahId}`],
      revalidate: 3600 * 24,
    }
  )();

/**
 * Mendapatkan daftar Mata Pelajaran sekolah dengan Server-Side Caching.
 * Di-cache dengan tag 'mapel-[id]'.
 */
export const getCachedMapelList = (sekolahId: string) =>
  unstable_cache(
    async () => {
      return prisma.mataPelajaran.findMany({
        where: {
          pengampu: {
            some: {
              kelas: {
                sekolahId,
              },
            },
          },
        },
        orderBy: { kode: "asc" },
      });
    },
    [`mapel-list-${sekolahId}`],
    {
      tags: [`mapel-${sekolahId}`],
      revalidate: 3600 * 24,
    }
  )();
