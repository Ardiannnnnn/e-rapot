"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface UpdateBobotPengampuInput {
  pengampuId: string;
  bobotTugas: number;
  bobotUTS: number;
  bobotUAS: number;
}

export interface UpdatePengaturanKelasInput {
  kelasId: string;
  tahunAjaran: string;
  semester: number;
  penaltiAlpa: number;
  penaltiIzin: number;
  penaltiSakit: number;
  maxAlpaJuara?: number | null;
}

/**
 * Update bobot Tugas, UTS, UAS pada penugasan pengampu tertentu.
 * Bisa dilakukan oleh Guru pengampu yang bersangkutan atau Wali Kelas / Admin.
 * Otomatis menghitung ulang nilaiAkhir seluruh siswa pada mapel & kelas tersebut!
 */
export async function updateBobotPengampuAction(input: UpdateBobotPengampuInput) {
  try {
    const user = await requireUser();
    const { pengampuId, bobotTugas, bobotUTS, bobotUAS } = input;

    // Validasi angka
    if (
      isNaN(bobotTugas) || bobotTugas < 0 ||
      isNaN(bobotUTS) || bobotUTS < 0 ||
      isNaN(bobotUAS) || bobotUAS < 0
    ) {
      return { success: false, message: "Persentase bobot tidak boleh bernilai negatif." };
    }

    const total = Math.round((bobotTugas + bobotUTS + bobotUAS) * 10) / 10;
    if (total !== 100) {
      return {
        success: false,
        message: `Total bobot harus tepat 100%. Saat ini total: ${total}%.`,
      };
    }

    // Cari pengampu
    const pengampu = await prisma.pengampu.findUnique({
      where: { id: pengampuId },
      include: {
        kelas: true,
        mapel: true,
      },
    });

    if (!pengampu) {
      return { success: false, message: "Data penugasan pengampu tidak ditemukan." };
    }

    // Validasi hak akses: Pengampu sendiri, Wali kelas rombel ini, atau Admin di sekolah yang sama
    const isGuruPengampu = pengampu.guruId === user.id;
    const isWaliKelas = pengampu.kelas.waliKelasId === user.id;
    const isAdmin =
      (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") &&
      (!user.sekolahId || pengampu.kelas.sekolahId === user.sekolahId);

    if (!isGuruPengampu && !isWaliKelas && !isAdmin) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk mengubah bobot mata pelajaran ini.",
      };
    }

    // 1. Update bobot di tabel Pengampu
    await prisma.pengampu.update({
      where: { id: pengampuId },
      data: {
        bobotTugas,
        bobotUTS,
        bobotUAS,
      },
    });

    // 2. Ambil seluruh siswa di kelas tersebut
    const siswaList = await prisma.siswa.findMany({
      where: { kelasId: pengampu.kelasId },
      select: { id: true },
    });
    const siswaIds = siswaList.map((s) => s.id);

    // 3. Hitung ulang seluruh nilaiAkhir yang sudah ada di database untuk mapel & kelas ini
    if (siswaIds.length > 0) {
      const existingNilai = await prisma.nilai.findMany({
        where: {
          siswaId: { in: siswaIds },
          mapelId: pengampu.mapelId,
          tahunAjaran: pengampu.tahunAjaran,
          ...(pengampu.semester !== 0 ? { semester: pengampu.semester } : {}),
        },
      });

      const updates = existingNilai.map((n) => {
        const t = n.nilaiTugas || 0;
        const u = n.nilaiUTS || 0;
        const a = n.nilaiUAS || 0;

        let calculatedAkhir = 0;
        if (t > 0 || u > 0 || a > 0) {
          calculatedAkhir =
            Math.round((t * (bobotTugas / 100) + u * (bobotUTS / 100) + a * (bobotUAS / 100)) * 10) / 10;
        }

        return prisma.nilai.update({
          where: { id: n.id },
          data: { nilaiAkhir: calculatedAkhir },
        });
      });

      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }
    }

    revalidatePath("/guru/siswa");
    revalidatePath("/wali-kelas/siswa");
    revalidatePath("/wali-kelas/cetak");
    revalidatePath("/wali-kelas/pengaturan-ranking");

    return {
      success: true,
      message: `Bobot penilaian ${pengampu.mapel.nama} berhasil diperbarui (Tugas: ${bobotTugas}%, UTS: ${bobotUTS}%, UAS: ${bobotUAS}%). Nilai akhir siswa telah disinkronkan.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal memperbarui bobot mata pelajaran.",
    };
  }
}

/**
 * Update pengaturan penalti presensi dan aturan juara kelas oleh Wali Kelas
 */
export async function updatePengaturanKelasAction(input: UpdatePengaturanKelasInput) {
  try {
    const user = await requireUser();
    const { kelasId, tahunAjaran, semester, penaltiAlpa, penaltiIzin, penaltiSakit, maxAlpaJuara } =
      input;

    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
    });

    if (!kelas) {
      return { success: false, message: "Kelas tidak ditemukan." };
    }

    const isWali = kelas.waliKelasId === user.id;
    const isAdmin =
      (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") &&
      (!user.sekolahId || kelas.sekolahId === user.sekolahId);

    if (!isWali && !isAdmin) {
      return {
        success: false,
        message: "Hanya Wali Kelas atau Administrator yang dapat mengubah aturan perankingan kelas ini.",
      };
    }

    await prisma.pengaturanKelas.upsert({
      where: {
        kelasId_tahunAjaran_semester: {
          kelasId,
          tahunAjaran,
          semester,
        },
      },
      update: {
        penaltiAlpa: Math.max(0, penaltiAlpa || 0),
        penaltiIzin: Math.max(0, penaltiIzin || 0),
        penaltiSakit: Math.max(0, penaltiSakit || 0),
        maxAlpaJuara: maxAlpaJuara !== undefined ? maxAlpaJuara : null,
      },
      create: {
        kelasId,
        tahunAjaran,
        semester,
        penaltiAlpa: Math.max(0, penaltiAlpa || 0),
        penaltiIzin: Math.max(0, penaltiIzin || 0),
        penaltiSakit: Math.max(0, penaltiSakit || 0),
        maxAlpaJuara: maxAlpaJuara !== undefined ? maxAlpaJuara : null,
      },
    });

    revalidatePath("/wali-kelas/siswa");
    revalidatePath("/wali-kelas/cetak");
    revalidatePath("/wali-kelas/pengaturan-ranking");

    return {
      success: true,
      message: "Aturan penalti presensi dan kriteria juara kelas berhasil disimpan.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal menyimpan pengaturan perankingan kelas.",
    };
  }
}
