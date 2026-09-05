"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";

export interface ItemNilaiImport {
  nisn: string;
  nilaiTugas: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir?: number;
  catatan?: string;
}

export interface ImportNilaiInput {
  mapelId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: number;
  items: ItemNilaiImport[];
}

export async function importNilaiExcelAction(input: ImportNilaiInput) {
  try {
    const user = await requireUser();

    // 1. Otorisasi: Wali Kelas rombel bersangkutan atau Admin
    const isWaliKelas =
      user.kelasWali?.id === input.kelasId ||
      user.role === "ADMIN_SEKOLAH" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN";

    if (!isWaliKelas) {
      return {
        success: false,
        message: "Akses ditolak: Anda bukan Wali Kelas dari rombel ini.",
      };
    }

    // 2. Periksa status kunci nilai pada periode akademik aktif
    const periode = await prisma.periodeAkademik.findFirst({
      where: {
        tahunAjaran: input.tahunAjaran,
        semester: input.semester,
        ...(user.sekolahId ? { sekolahId: user.sekolahId } : {}),
      },
    });

    if (periode && periode.statusNilai === "KUNCI") {
      return {
        success: false,
        message: "Penginputan nilai terkunci oleh Administrator Sekolah untuk periode ini.",
      };
    }

    // 3. Ambil data siswa di kelas ini untuk mencocokkan NISN -> ID Siswa
    const siswaInClass = await prisma.siswa.findMany({
      where: { kelasId: input.kelasId },
      select: { id: true, nisn: true, nama: true },
    });

    const nisnToSiswaMap = new Map<string, { id: string; nama: string }>();
    for (const s of siswaInClass) {
      nisnToSiswaMap.set(s.nisn.trim(), { id: s.id, nama: s.nama });
    }

    // 4. Filter & siapkan operasi upsert
    const validOperations: any[] = [];
    let matchedCount = 0;

    for (const item of input.items) {
      const cleanNisn = String(item.nisn || "").trim();
      const siswa = nisnToSiswaMap.get(cleanNisn);

      if (!siswa) {
        continue; // Lewati jika NISN tidak cocok dengan siswa kelas ini
      }

      const tugas = Math.min(100, Math.max(0, Number(item.nilaiTugas) || 0));
      const uts = Math.min(100, Math.max(0, Number(item.nilaiUTS) || 0));
      const uas = Math.min(100, Math.max(0, Number(item.nilaiUAS) || 0));

      const calculatedAkhir =
        typeof item.nilaiAkhir === "number" && item.nilaiAkhir > 0
          ? Math.min(100, Math.max(0, item.nilaiAkhir))
          : Math.round(tugas * 0.3 + uts * 0.3 + uas * 0.4);

      const cleanCatatan = item.catatan
        ? sanitizeInput(item.catatan, 500)
        : null;

      validOperations.push(
        prisma.nilai.upsert({
          where: {
            siswaId_mapelId_tahunAjaran_semester: {
              siswaId: siswa.id,
              mapelId: input.mapelId,
              tahunAjaran: input.tahunAjaran,
              semester: input.semester,
            },
          },
          update: {
            nilaiTugas: tugas,
            nilaiUTS: uts,
            nilaiUAS: uas,
            nilaiAkhir: calculatedAkhir,
            catatan: cleanCatatan,
          },
          create: {
            siswaId: siswa.id,
            mapelId: input.mapelId,
            tahunAjaran: input.tahunAjaran,
            semester: input.semester,
            nilaiTugas: tugas,
            nilaiUTS: uts,
            nilaiUAS: uas,
            nilaiAkhir: calculatedAkhir,
            catatan: cleanCatatan,
          },
        })
      );

      matchedCount++;
    }

    if (validOperations.length === 0) {
      return {
        success: false,
        message: "Tidak ada data siswa yang cocok dengan NISN di kelas ini.",
      };
    }

    // 5. Eksekusi transaksi massal
    await prisma.$transaction(validOperations);

    // 6. Revalidasi halaman terkait
    revalidatePath("/wali-kelas");
    revalidatePath("/wali-kelas/siswa");
    revalidatePath("/wali-kelas/cetak");
    revalidatePath("/wali-kelas/import-nilai");
    revalidatePath("/guru/siswa");

    return {
      success: true,
      count: matchedCount,
      message: `Berhasil mengimpor dan menyimpan nilai untuk ${matchedCount} siswa.`,
    };
  } catch (error: any) {
    console.error("Gagal mengimpor nilai Excel:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memproses data Excel.",
    };
  }
}
