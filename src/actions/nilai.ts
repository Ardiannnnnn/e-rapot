"use server";

import { prisma } from "@/lib/prisma";
import { requireActionUser } from "@/lib/auth";
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
  const user = await requireActionUser(["GURU", "WALI_KELAS", "ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);

  const { mapelId, tahunAjaran, semester, items } = payload;

  if (!mapelId || !tahunAjaran || !semester || !items || items.length === 0) {
    return { success: false, message: "Data penilaian tidak lengkap." };
  }

  // Validasi batas angka nilai (0 - 100)
  for (const item of items) {
    if (
      isNaN(item.nilaiTugas) || item.nilaiTugas < 0 || item.nilaiTugas > 100 ||
      isNaN(item.nilaiUTS) || item.nilaiUTS < 0 || item.nilaiUTS > 100 ||
      isNaN(item.nilaiUAS) || item.nilaiUAS < 0 || item.nilaiUAS > 100 ||
      isNaN(item.nilaiAkhir) || item.nilaiAkhir < 0 || item.nilaiAkhir > 100
    ) {
      return {
        success: false,
        message: "Format nilai tidak valid. Nilai Tugas, UTS, dan UAS harus berada di antara 0 sampai 100.",
      };
    }
  }

  try {
    // 1. Verifikasi kepemilikan siswa dan rombel kelas
    const sampleSiswa = await prisma.siswa.findUnique({
      where: { id: items[0].siswaId },
      include: { kelas: true },
    });

    if (!sampleSiswa) {
      return { success: false, message: "Data siswa sasaran tidak ditemukan." };
    }

    const kelasId = sampleSiswa.kelasId;
    const targetSekolahId = sampleSiswa.kelas.sekolahId;

    // Tenant check
    if (user.role !== "SUPER_ADMIN" && user.sekolahId && targetSekolahId !== user.sekolahId) {
      return { success: false, message: "Akses ditolak: Data siswa bukan milik sekolah Anda." };
    }

    // 2. Jika user adalah GURU atau WALI_KELAS, pastikan ia terdaftar sebagai pengampu rombel & mapel ini
    if (user.role === "GURU" || user.role === "WALI_KELAS") {
      const isPengampu = await prisma.pengampu.findFirst({
        where: {
          guruId: user.id,
          kelasId,
          mapelId,
          tahunAjaran,
        },
      });

      if (!isPengampu) {
        return {
          success: false,
          message: "Akses ditolak: Anda tidak memiliki wewenang penugasan mengajar mata pelajaran ini di rombel tersebut.",
        };
      }
    }

    // 3. Pastikan seluruh siswa dalam batch berada dalam rombel yang sama
    const validCount = await prisma.siswa.count({
      where: {
        id: { in: items.map((i) => i.siswaId) },
        kelasId,
      },
    });

    if (validCount !== items.length) {
      return {
        success: false,
        message: "Akses ditolak: Sebagian siswa tidak valid atau tidak terdaftar pada rombel yang sama.",
      };
    }

    // 4. Cek apakah periode akademik sedang dikunci oleh Admin Sekolah
    const effectiveSekolahId = user.sekolahId || targetSekolahId;
    if (effectiveSekolahId) {
      const periode = await prisma.periodeAkademik.findUnique({
        where: {
          sekolahId_tahunAjaran_semester: {
            sekolahId: effectiveSekolahId,
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
    revalidatePath("/wali-kelas/siswa");
    revalidatePath("/wali-kelas/cetak");

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
