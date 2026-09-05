"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface NilaiInputItem {
  siswaId: string;
  nilaiTugas: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir: number;
  catatan?: string;
}

export async function simpanNilaiBatchAction(payload: {
  mapelId: string;
  tahunAjaran: string;
  semester: number;
  items: NilaiInputItem[];
}) {
  const user = await requireUser();

  const { mapelId, tahunAjaran, semester, items } = payload;

  if (!mapelId || !tahunAjaran || !semester || !items || items.length === 0) {
    return { success: false, message: "Data penilaian tidak lengkap." };
  }

  try {
    // Cek apakah periode akademik sedang dikunci oleh Admin Sekolah
    if (user.sekolahId) {
      const periode = await prisma.periodeAkademik.findUnique({
        where: {
          sekolahId_tahunAjaran_semester: {
            sekolahId: user.sekolahId,
            tahunAjaran: tahunAjaran,
            semester: Number(semester),
          },
        },
      });

      if (periode && periode.statusNilai === "KUNCI") {
        return {
          success: false,
          message: `Penginputan nilai untuk periode ${tahunAjaran} Semester ${semester === 1 ? "Ganjil" : "Genap"} telah DIKUNCI oleh Admin Sekolah. Anda tidak dapat mengubah nilai.`,
        };
      }
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.nilai.upsert({
          where: {
            siswaId_mapelId_tahunAjaran_semester: {
              siswaId: item.siswaId,
              mapelId: mapelId,
              tahunAjaran: tahunAjaran,
              semester: Number(semester),
            },
          },
          update: {
            nilaiTugas: Number(item.nilaiTugas) || 0,
            nilaiUTS: Number(item.nilaiUTS) || 0,
            nilaiUAS: Number(item.nilaiUAS) || 0,
            nilaiAkhir: Number(item.nilaiAkhir) || 0,
            catatan: item.catatan || null,
          },
          create: {
            siswaId: item.siswaId,
            mapelId: mapelId,
            tahunAjaran: tahunAjaran,
            semester: Number(semester),
            nilaiTugas: Number(item.nilaiTugas) || 0,
            nilaiUTS: Number(item.nilaiUTS) || 0,
            nilaiUAS: Number(item.nilaiUAS) || 0,
            nilaiAkhir: Number(item.nilaiAkhir) || 0,
            catatan: item.catatan || null,
          },
        })
      )
    );

    revalidatePath("/guru/siswa");
    revalidatePath("/guru");

    return {
      success: true,
      message: `Berhasil menyimpan nilai untuk ${items.length} siswa.`,
    };
  } catch (error: any) {
    console.error("Gagal menyimpan nilai batch:", error);
    return {
      success: false,
      message: "Gagal menyimpan nilai: " + (error?.message || "Terjadi kesalahan."),
    };
  }
}
