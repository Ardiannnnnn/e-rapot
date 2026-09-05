"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Mendapatkan Periode Akademik yang sedang AKTIF untuk sekolah pengguna login.
 */
export async function getPeriodeAktif() {
  const user = await requireUser();
  if (!user.sekolahId) return null;

  const periode = await prisma.periodeAkademik.findFirst({
    where: {
      sekolahId: user.sekolahId,
      isAktif: true,
    },
  });

  return periode;
}

/**
 * Tambah Periode Akademik Baru (Tahun Ajaran & Semester)
 */
export async function createPeriodeAction(payload: {
  tahunAjaran: string;
  semester: number;
  tanggalCetak?: string;
  tempatCetak?: string;
  isAktif?: boolean;
}) {
  const user = await requireUser();
  if (!user.sekolahId) {
    return { success: false, message: "Pengguna tidak terhubung ke data sekolah." };
  }

  const { tahunAjaran, semester, tanggalCetak, tempatCetak, isAktif } = payload;

  if (!tahunAjaran || !semester) {
    return { success: false, message: "Tahun ajaran dan semester wajib diisi." };
  }

  try {
    // Cek apakah sudah ada periode yang sama
    const existing = await prisma.periodeAkademik.findUnique({
      where: {
        sekolahId_tahunAjaran_semester: {
          sekolahId: user.sekolahId,
          tahunAjaran: tahunAjaran.trim(),
          semester: Number(semester),
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: `Periode Tahun Ajaran ${tahunAjaran} Semester ${semester === 1 ? "Ganjil" : "Genap"} sudah ada.`,
      };
    }

    // Jika diset sebagai aktif, nonaktifkan periode lain
    if (isAktif) {
      await prisma.periodeAkademik.updateMany({
        where: { sekolahId: user.sekolahId },
        data: { isAktif: false },
      });
    }

    await prisma.periodeAkademik.create({
      data: {
        sekolahId: user.sekolahId,
        tahunAjaran: tahunAjaran.trim(),
        semester: Number(semester),
        isAktif: Boolean(isAktif),
        statusNilai: "BUKA",
        tanggalCetak: tanggalCetak ? new Date(tanggalCetak) : null,
        tempatCetak: tempatCetak?.trim() || "Jakarta",
      },
    });

    revalidatePath("/admin-sekolah/tahun-ajaran");
    revalidatePath("/guru");
    revalidatePath("/guru/siswa");
    revalidatePath("/guru/tp");

    return {
      success: true,
      message: `Berhasil menambahkan periode ${tahunAjaran} Semester ${semester === 1 ? "Ganjil" : "Genap"}.`,
    };
  } catch (error: any) {
    console.error("Gagal membuat periode akademik:", error);
    return {
      success: false,
      message: "Gagal membuat periode: " + (error?.message || "Terjadi kesalahan."),
    };
  }
}

/**
 * Menetapkan satu periode sebagai Periode Berjalan (AKTIF)
 */
export async function setPeriodeAktifAction(periodeId: string) {
  const user = await requireUser();
  if (!user.sekolahId) {
    return { success: false, message: "Pengguna tidak terhubung ke data sekolah." };
  }

  try {
    const target = await prisma.periodeAkademik.findUnique({
      where: { id: periodeId },
    });

    if (!target || target.sekolahId !== user.sekolahId) {
      return { success: false, message: "Periode akademik tidak ditemukan." };
    }

    await prisma.$transaction([
      prisma.periodeAkademik.updateMany({
        where: { sekolahId: user.sekolahId },
        data: { isAktif: false },
      }),
      prisma.periodeAkademik.update({
        where: { id: periodeId },
        data: { isAktif: true },
      }),
    ]);

    revalidatePath("/admin-sekolah/tahun-ajaran");
    revalidatePath("/guru");
    revalidatePath("/guru/siswa");
    revalidatePath("/guru/tp");

    return {
      success: true,
      message: `Periode aktif berhasil dialihkan ke ${target.tahunAjaran} Semester ${target.semester === 1 ? "Ganjil" : "Genap"}.`,
    };
  } catch (error: any) {
    console.error("Gagal mengubah periode aktif:", error);
    return {
      success: false,
      message: "Gagal menetapkan periode aktif: " + (error?.message || "Terjadi kesalahan."),
    };
  }
}

/**
 * Toggle Status Input Nilai (BUKA <-> KUNCI)
 */
export async function toggleStatusNilaiAction(periodeId: string) {
  const user = await requireUser();
  if (!user.sekolahId) {
    return { success: false, message: "Pengguna tidak terhubung ke data sekolah." };
  }

  try {
    const target = await prisma.periodeAkademik.findUnique({
      where: { id: periodeId },
    });

    if (!target || target.sekolahId !== user.sekolahId) {
      return { success: false, message: "Periode akademik tidak ditemukan." };
    }

    const nextStatus = target.statusNilai === "BUKA" ? "KUNCI" : "BUKA";

    await prisma.periodeAkademik.update({
      where: { id: periodeId },
      data: { statusNilai: nextStatus },
    });

    revalidatePath("/admin-sekolah/tahun-ajaran");
    revalidatePath("/guru/siswa");

    return {
      success: true,
      message: `Status penilaian periode ${target.tahunAjaran} Sem. ${target.semester} berhasil diubah menjadi: ${nextStatus === "BUKA" ? "TERBUKA (Bisa Input)" : "TERKUNCI (Read-only)"}.`,
    };
  } catch (error: any) {
    console.error("Gagal toggle status nilai:", error);
    return {
      success: false,
      message: "Gagal mengubah status penilaian: " + (error?.message || "Terjadi kesalahan."),
    };
  }
}

/**
 * Update Tanggal dan Tempat Cetak Rapor
 */
export async function updatePengaturanCetakAction(payload: {
  periodeId: string;
  tanggalCetak: string;
  tempatCetak: string;
}) {
  const user = await requireUser();
  if (!user.sekolahId) {
    return { success: false, message: "Pengguna tidak terhubung ke data sekolah." };
  }

  try {
    const target = await prisma.periodeAkademik.findUnique({
      where: { id: payload.periodeId },
    });

    if (!target || target.sekolahId !== user.sekolahId) {
      return { success: false, message: "Periode akademik tidak ditemukan." };
    }

    await prisma.periodeAkademik.update({
      where: { id: payload.periodeId },
      data: {
        tanggalCetak: payload.tanggalCetak ? new Date(payload.tanggalCetak) : null,
        tempatCetak: payload.tempatCetak?.trim() || "Jakarta",
      },
    });

    revalidatePath("/admin-sekolah/tahun-ajaran");

    return {
      success: true,
      message: "Pengaturan tanggal dan tempat cetak rapor berhasil disimpan.",
    };
  } catch (error: any) {
    console.error("Gagal update pengaturan cetak:", error);
    return {
      success: false,
      message: "Gagal menyimpan: " + (error?.message || "Terjadi kesalahan."),
    };
  }
}

/**
 * Hapus Periode Akademik
 */
export async function deletePeriodeAction(periodeId: string) {
  const user = await requireUser();
  if (!user.sekolahId) {
    return { success: false, message: "Pengguna tidak terhubung ke data sekolah." };
  }

  try {
    const target = await prisma.periodeAkademik.findUnique({
      where: { id: periodeId },
    });

    if (!target || target.sekolahId !== user.sekolahId) {
      return { success: false, message: "Periode tidak ditemukan." };
    }

    if (target.isAktif) {
      return {
        success: false,
        message: "Tidak dapat menghapus periode yang sedang berstatus AKTIF. Silakan aktifkan periode lain terlebih dahulu.",
      };
    }

    // Cek apakah sudah ada data nilai pada periode ini
    const countNilai = await prisma.nilai.count({
      where: {
        tahunAjaran: target.tahunAjaran,
        semester: target.semester,
      },
    });

    if (countNilai > 0) {
      return {
        success: false,
        message: `Tidak dapat menghapus periode ini karena sudah memiliki ${countNilai} rekaman nilai siswa.`,
      };
    }

    await prisma.periodeAkademik.delete({
      where: { id: periodeId },
    });

    revalidatePath("/admin-sekolah/tahun-ajaran");

    return {
      success: true,
      message: `Periode ${target.tahunAjaran} Semester ${target.semester === 1 ? "Ganjil" : "Genap"} berhasil dihapus.`,
    };
  } catch (error: any) {
    console.error("Gagal menghapus periode:", error);
    return {
      success: false,
      message: "Gagal menghapus periode: " + (error?.message || "Terjadi kesalahan."),
    };
  }
}
