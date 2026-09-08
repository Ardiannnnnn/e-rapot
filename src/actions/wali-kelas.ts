"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";

export interface EkskulItem {
  nama: string;
  predikat: "Sangat Baik" | "Baik" | "Cukup" | "Kurang";
  keterangan?: string;
}

export interface KokurikulerItem {
  tema: string;
  deskripsi: string;
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
  kokurikuler?: KokurikulerItem[];
  kebiasaanKarakter?: string;
  statusKenaikan?: string;
}

export async function simpanPelengkapAction(input: SimpanPelengkapInput) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return {
        success: false,
        message: "Akses ditolak: Hanya Wali Kelas atau Admin yang berhak mengubah data ini.",
      };
    }

    const cleanCatatan = input.catatanWali ? sanitizeInput(input.catatanWali, 1000) : null;
    const cleanKebiasaan = input.kebiasaanKarakter
      ? sanitizeInput(input.kebiasaanKarakter, 1000)
      : null;
    const cleanStatusKenaikan = input.statusKenaikan
      ? sanitizeInput(input.statusKenaikan, 100)
      : null;

    const cleanEkskul = input.ekskul
      ? input.ekskul.map((e) => ({
          nama: sanitizeInput(e.nama, 100),
          predikat: e.predikat,
          keterangan: e.keterangan ? sanitizeInput(e.keterangan, 500) : "",
        }))
      : null;
    const ekskulJson = cleanEkskul ? JSON.stringify(cleanEkskul) : null;

    const cleanKokurikuler = input.kokurikuler
      ? input.kokurikuler.map((k) => ({
          tema: sanitizeInput(k.tema, 250),
          deskripsi: sanitizeInput(k.deskripsi, 1000),
        }))
      : null;
    const kokurikulerJson = cleanKokurikuler ? JSON.stringify(cleanKokurikuler) : null;

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
        kokurikuler: kokurikulerJson,
        kebiasaanKarakter: cleanKebiasaan,
        statusKenaikan: cleanStatusKenaikan,
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
        kokurikuler: kokurikulerJson,
        kebiasaanKarakter: cleanKebiasaan,
        statusKenaikan: cleanStatusKenaikan,
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
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
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

    return { success: true, message: `Berhasil menyimpan data presensi & catatan.` };
  } catch (error: any) {
    console.error("Gagal simpan bulk presensi:", error);
    return { success: false, message: error?.message || "Gagal menyimpan presensi." };
  }
}

export async function simpanBulkKokurikulerAction(input: {
  tahunAjaran: string;
  semester: number;
  items: {
    siswaId: string;
    kokurikuler: KokurikulerItem[];
  }[];
}) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    await prisma.$transaction(
      input.items.map((item) => {
        const cleanKokurikuler = item.kokurikuler.map((k) => ({
          tema: sanitizeInput(k.tema, 250),
          deskripsi: sanitizeInput(k.deskripsi, 1000),
        }));
        const kokurikulerJson = JSON.stringify(cleanKokurikuler);

        return prisma.raporPelengkap.upsert({
          where: {
            siswaId_tahunAjaran_semester: {
              siswaId: item.siswaId,
              tahunAjaran: input.tahunAjaran,
              semester: input.semester,
            },
          },
          update: {
            kokurikuler: kokurikulerJson,
          },
          create: {
            siswaId: item.siswaId,
            tahunAjaran: input.tahunAjaran,
            semester: input.semester,
            kokurikuler: kokurikulerJson,
          },
        });
      })
    );

    revalidatePath("/wali-kelas");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, message: "Data kokurikuler (P5) berhasil disimpan." };
  } catch (error: any) {
    console.error("Gagal simpan kokurikuler:", error);
    return { success: false, message: error?.message || "Gagal menyimpan kokurikuler." };
  }
}

export async function simpanBulkEkskulAction(input: {
  tahunAjaran: string;
  semester: number;
  items: {
    siswaId: string;
    ekskul: EkskulItem[];
  }[];
}) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    await prisma.$transaction(
      input.items.map((item) => {
        const jsonEkskul = JSON.stringify(item.ekskul);
        return prisma.raporPelengkap.upsert({
          where: {
            siswaId_tahunAjaran_semester: {
              siswaId: item.siswaId,
              tahunAjaran: input.tahunAjaran,
              semester: input.semester,
            },
          },
          update: {
            ekskul: jsonEkskul,
          },
          create: {
            siswaId: item.siswaId,
            tahunAjaran: input.tahunAjaran,
            semester: input.semester,
            ekskul: jsonEkskul,
          },
        });
      })
    );

    revalidatePath("/wali-kelas");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, message: "Data ekstrakurikuler seluruh siswa berhasil disimpan." };
  } catch (error: any) {
    console.error("Gagal simpan ekstrakurikuler bulk:", error);
    return { success: false, message: error?.message || "Gagal menyimpan data ekstrakurikuler." };
  }
}

export async function simpanBulkKebiasaanAction(input: {
  tahunAjaran: string;
  semester: number;
  items: {
    siswaId: string;
    kebiasaanKarakter: string;
  }[];
}) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    await prisma.$transaction(
      input.items.map((item) => {
        const cleanKebiasaan = sanitizeInput(item.kebiasaanKarakter, 1000);
        return prisma.raporPelengkap.upsert({
          where: {
            siswaId_tahunAjaran_semester: {
              siswaId: item.siswaId,
              tahunAjaran: input.tahunAjaran,
              semester: input.semester,
            },
          },
          update: {
            kebiasaanKarakter: cleanKebiasaan,
          },
          create: {
            siswaId: item.siswaId,
            tahunAjaran: input.tahunAjaran,
            semester: input.semester,
            kebiasaanKarakter: cleanKebiasaan,
          },
        });
      })
    );

    revalidatePath("/wali-kelas");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, message: "Data 7 kebiasaan anak indonesia hebat berhasil disimpan." };
  } catch (error: any) {
    console.error("Gagal simpan kebiasaan karakter:", error);
    return { success: false, message: error?.message || "Gagal menyimpan data kebiasaan." };
  }
}

export async function simpanBulkKenaikanAction(input: {
  tahunAjaran: string;
  semester: number;
  items: {
    siswaId: string;
    statusKenaikan: string;
  }[];
}) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    await prisma.$transaction(
      input.items.map((item) => {
        const cleanStatus = sanitizeInput(item.statusKenaikan, 100);
        return prisma.raporPelengkap.upsert({
          where: {
            siswaId_tahunAjaran_semester: {
              siswaId: item.siswaId,
              tahunAjaran: input.tahunAjaran,
              semester: input.semester,
            },
          },
          update: {
            statusKenaikan: cleanStatus,
          },
          create: {
            siswaId: item.siswaId,
            tahunAjaran: input.tahunAjaran,
            semester: input.semester,
            statusKenaikan: cleanStatus,
          },
        });
      })
    );

    revalidatePath("/wali-kelas");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, message: "Status kenaikan kelas / kelulusan berhasil disimpan." };
  } catch (error: any) {
    console.error("Gagal simpan status kenaikan:", error);
    return { success: false, message: error?.message || "Gagal menyimpan status kenaikan." };
  }
}
