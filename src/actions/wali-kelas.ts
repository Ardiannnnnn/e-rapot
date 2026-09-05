"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";

export interface EkskulItem {
  nama: string;
  predikat: "Sangat Baik" | "Baik" | "Cukup" | "Kurang";
  keterangan: string;
}

export interface SimpanPelengkapInput {
  siswaId: string;
  tahunAjaran: string;
  semester: number;
  sakit: number;
  izin: number;
  alpa: number;
  catatanWali?: string;
  ekskul?: EkskulItem[];
}

export async function simpanPelengkapAction(input: SimpanPelengkapInput) {
  try {
    const user = await requireUser();
    if (user.role !== "WALI_KELAS" && user.role !== "ADMIN_SEKOLAH" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { success: false, message: "Akses ditolak: Hanya Wali Kelas atau Admin yang berhak mengubah data ini." };
    }

    const cleanCatatan = input.catatanWali ? sanitizeInput(input.catatanWali, 1000) : null;
    const cleanEkskul = input.ekskul
      ? input.ekskul.map((e) => ({
          nama: sanitizeInput(e.nama, 100),
          predikat: e.predikat,
          keterangan: sanitizeInput(e.keterangan, 500),
        }))
      : null;
    const ekskulJson = cleanEkskul ? JSON.stringify(cleanEkskul) : null;

    await prisma.raporPelengkap.upsert({
      where: {
        siswaId_tahunAjaran_semester: {
          siswaId: input.siswaId,
          tahunAjaran: input.tahunAjaran,
          semester: input.semester,
        },
      },
      update: {
        sakit: Math.max(0, input.sakit || 0),
        izin: Math.max(0, input.izin || 0),
        alpa: Math.max(0, input.alpa || 0),
        catatanWali: cleanCatatan,
        ekskul: ekskulJson,
      },
      create: {
        siswaId: input.siswaId,
        tahunAjaran: input.tahunAjaran,
        semester: input.semester,
        sakit: Math.max(0, input.sakit || 0),
        izin: Math.max(0, input.izin || 0),
        alpa: Math.max(0, input.alpa || 0),
        catatanWali: cleanCatatan,
        ekskul: ekskulJson,
      },
    });

    revalidatePath("/wali-kelas");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");
    revalidatePath("/wali-kelas/siswa");

    return { success: true, message: "Data pelengkap rapor berhasil disimpan." };
  } catch (error: any) {
    console.error("Gagal simpan data pelengkap:", error);
    return { success: false, message: error?.message || "Gagal menyimpan data pelengkap rapor." };
  }
}

export interface BulkPresensiItem {
  siswaId: string;
  sakit: number;
  izin: number;
  alpa: number;
  catatanWali?: string;
}

export async function simpanBulkPresensiAction(input: {
  tahunAjaran: string;
  semester: number;
  items: BulkPresensiItem[];
}) {
  try {
    const user = await requireUser();
    if (user.role !== "WALI_KELAS" && user.role !== "ADMIN_SEKOLAH" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { success: false, message: "Akses ditolak." };
    }

    await prisma.$transaction(
      input.items.map((item) =>
        prisma.raporPelengkap.upsert({
          where: {
            siswaId_tahunAjaran_semester: {
              siswaId: item.siswaId,
              tahunAjaran: input.tahunAjaran,
              semester: input.semester,
            },
          },
          update: {
            sakit: Math.max(0, item.sakit || 0),
            izin: Math.max(0, item.izin || 0),
            alpa: Math.max(0, item.alpa || 0),
            ...(item.catatanWali !== undefined
              ? { catatanWali: sanitizeInput(item.catatanWali, 1000) || null }
              : {}),
          },
          create: {
            siswaId: item.siswaId,
            tahunAjaran: input.tahunAjaran,
            semester: input.semester,
            sakit: Math.max(0, item.sakit || 0),
            izin: Math.max(0, item.izin || 0),
            alpa: Math.max(0, item.alpa || 0),
            catatanWali: item.catatanWali ? sanitizeInput(item.catatanWali, 1000) : null,
          },
        })
      )
    );

    revalidatePath("/wali-kelas");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");
    revalidatePath("/wali-kelas/siswa");

    return { success: true, message: `Berhasil menyimpan presensi & catatan ${input.items.length} siswa.` };
  } catch (error: any) {
    console.error("Gagal simpan bulk presensi:", error);
    return { success: false, message: error?.message || "Gagal menyimpan presensi." };
  }
}
