"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";

export async function createKelasAction(payload: {
  nama: string;
  tingkat: number;
  tahunAjaran: string;
  waliKelasId?: string;
  mapelPengampu?: {
    mapelId: string;
    guruId: string;
    semester?: number;
  }[];
}) {
  const user = await requireUser();
  const { nama, tingkat, tahunAjaran, waliKelasId, mapelPengampu } = payload;

  const cleanNama = sanitizeInput(nama || "", 20).toUpperCase();

  if (!cleanNama || !tingkat || !tahunAjaran) {
    return { success: false, message: "Nama rombel, tingkat kelas, dan tahun ajaran wajib diisi." };
  }

  if (/[<>]/.test(nama || "")) {
    return {
      success: false,
      message: "Karakter tag HTML (< atau >) tidak diizinkan untuk alasan keamanan sistem.",
    };
  }

  if (cleanNama.length < 2) {
    return {
      success: false,
      message: "Nama rombel minimal harus terdiri dari 2 karakter (contoh: 1A, 5C).",
    };
  }

  try {
    const existing = await prisma.kelas.findUnique({
      where: { nama: cleanNama },
    });

    if (existing) {
      return { success: false, message: `Rombel '${cleanNama}' sudah terdaftar.` };
    }

    // Jika waliKelasId dipilih, cek apakah guru sudah menjadi wali kelas di rombel lain
    if (waliKelasId) {
      const existingWali = await prisma.kelas.findUnique({
        where: { waliKelasId },
      });
      if (existingWali) {
        return {
          success: false,
          message: "Guru tersebut sudah menjadi wali kelas di rombel lain. Satu guru hanya dapat menjadi wali kelas untuk 1 rombel.",
        };
      }
    }

    const newKelas = await prisma.kelas.create({
      data: {
        nama: cleanNama,
        tingkat: Number(tingkat),
        tahunAjaran: tahunAjaran.trim(),
        sekolahId: user.sekolahId || undefined,
        waliKelasId: waliKelasId || null,
      },
    });

    // Update role user menjadi WALI_KELAS jika di-assign
    if (waliKelasId) {
      await prisma.user.update({
        where: { id: waliKelasId },
        data: { role: "WALI_KELAS" },
      });
    }

    // Validasi mapelPengampu jika ada
    if (mapelPengampu && mapelPengampu.length > 0) {
      for (const item of mapelPengampu) {
        if (!item.guruId) {
          return {
            success: false,
            message: "Semua mata pelajaran yang dicentang wajib ditentukan guru pengampunya.",
          };
        }
      }
    }

    // Buat penugasan pengampu sekaligus jika ada
    let totalAssigned = 0;
    if (mapelPengampu && mapelPengampu.length > 0) {
      for (const item of mapelPengampu) {
        if (item.mapelId && item.guruId) {
          await prisma.pengampu.create({
            data: {
              kelasId: newKelas.id,
              mapelId: item.mapelId,
              guruId: item.guruId,
              tahunAjaran: tahunAjaran.trim(),
              semester: item.semester ?? 0,
            },
          });
          totalAssigned++;
        }
      }
    }

    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/admin-sekolah/siswa");

    const extraMsg = totalAssigned > 0 ? ` bersama ${totalAssigned} penugasan mata pelajaran.` : ".";
    return { success: true, message: `Rombel '${cleanNama}' berhasil ditambahkan${extraMsg}` };
  } catch (error: any) {
    console.error("Gagal membuat kelas:", error);
    return { success: false, message: "Gagal membuat kelas: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function updateKelasAction(payload: {
  id: string;
  nama: string;
  tingkat: number;
  waliKelasId?: string | null;
  mapelPengampu?: {
    mapelId: string;
    guruId: string;
    semester?: number;
  }[];
}) {
  await requireUser();
  const { id, nama, tingkat, waliKelasId, mapelPengampu } = payload;

  const cleanNama = sanitizeInput(nama || "", 20).toUpperCase();

  if (!id || !cleanNama || !tingkat) {
    return { success: false, message: "ID, nama rombel, dan tingkat kelas wajib diisi." };
  }

  if (/[<>]/.test(nama || "")) {
    return {
      success: false,
      message: "Karakter tag HTML (< atau >) tidak diizinkan untuk alasan keamanan sistem.",
    };
  }

  if (cleanNama.length < 2) {
    return {
      success: false,
      message: "Nama rombel minimal harus terdiri dari 2 karakter (contoh: 1A, 5C).",
    };
  }

  // Validasi mapelPengampu jika ada
  if (mapelPengampu && mapelPengampu.length > 0) {
    for (const item of mapelPengampu) {
      if (!item.guruId) {
        return {
          success: false,
          message: "Setiap mata pelajaran yang dicentang wajib ditentukan guru pengampunya.",
        };
      }
    }
  }

  try {
    // Cek duplikasi nama
    const existing = await prisma.kelas.findFirst({
      where: {
        nama: cleanNama,
        NOT: { id },
      },
    });

    if (existing) {
      return { success: false, message: `Rombel '${cleanNama}' sudah digunakan.` };
    }

    // Ambil data kelas lama untuk cek perubahan wali kelas
    const oldKelas = await prisma.kelas.findUnique({
      where: { id },
    });

    if (!oldKelas) {
      return { success: false, message: "Data rombel tidak ditemukan." };
    }

    if (waliKelasId && waliKelasId !== oldKelas.waliKelasId) {
      const existingWali = await prisma.kelas.findFirst({
        where: {
          waliKelasId,
          NOT: { id },
        },
      });
      if (existingWali) {
        return {
          success: false,
          message: "Guru tersebut sudah menjadi wali kelas di rombel lain.",
        };
      }
    }

    await prisma.kelas.update({
      where: { id },
      data: {
        nama: cleanNama,
        tingkat: Number(tingkat),
        waliKelasId: waliKelasId || null,
      },
    });

    // Update role guru baru jadi WALI_KELAS jika di-assign
    if (waliKelasId && waliKelasId !== oldKelas.waliKelasId) {
      await prisma.user.update({
        where: { id: waliKelasId },
        data: { role: "WALI_KELAS" },
      });
    }

    // Jika wali kelas dicabut atau diganti, cek apakah wali kelas lama masih jadi wali di rombel lain
    if (oldKelas.waliKelasId && oldKelas.waliKelasId !== waliKelasId) {
      const isStillWali = await prisma.kelas.findFirst({
        where: { waliKelasId: oldKelas.waliKelasId, NOT: { id } },
      });
      if (!isStillWali) {
        await prisma.user.update({
          where: { id: oldKelas.waliKelasId },
          data: { role: "GURU" },
        });
      }
    }

    // Sinkronisasi data penugasan mapel jika dikirim
    let totalAssigned = 0;
    if (mapelPengampu !== undefined) {
      const existingPengampu = await prisma.pengampu.findMany({
        where: {
          kelasId: id,
          tahunAjaran: oldKelas.tahunAjaran,
        },
      });

      const targetMapelIds = new Set(mapelPengampu.map((m) => m.mapelId));

      // Hapus penugasan yang tidak lagi dicentang
      const toDelete = existingPengampu.filter((p) => !targetMapelIds.has(p.mapelId));
      if (toDelete.length > 0) {
        await prisma.pengampu.deleteMany({
          where: {
            id: { in: toDelete.map((d) => d.id) },
          },
        });
      }

      // Update atau buat penugasan yang dicentang
      for (const item of mapelPengampu) {
        if (!item.guruId) continue;
        const matched = existingPengampu.find((p) => p.mapelId === item.mapelId);
        if (matched) {
          if (matched.guruId !== item.guruId || matched.semester !== (item.semester ?? 0)) {
            await prisma.pengampu.update({
              where: { id: matched.id },
              data: {
                guruId: item.guruId,
                semester: item.semester ?? 0,
              },
            });
          }
        } else {
          await prisma.pengampu.create({
            data: {
              kelasId: id,
              mapelId: item.mapelId,
              guruId: item.guruId,
              tahunAjaran: oldKelas.tahunAjaran,
              semester: item.semester ?? 0,
            },
          });
        }
        totalAssigned++;
      }
    }

    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/admin-sekolah/siswa");
    revalidatePath("/wali-kelas");

    const extraMsg =
      mapelPengampu !== undefined
        ? ` dan susunan ${totalAssigned} mata pelajaran telah diperbarui.`
        : ".";
    return { success: true, message: `Rombel '${cleanNama}' berhasil diperbarui${extraMsg}` };
  } catch (error: any) {
    console.error("Gagal update kelas:", error);
    return { success: false, message: "Gagal update kelas: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function deleteKelasAction(id: string) {
  await requireUser();

  try {
    const countSiswa = await prisma.siswa.count({
      where: { kelasId: id },
    });

    if (countSiswa > 0) {
      return {
        success: false,
        message: `Rombel tidak dapat dihapus karena masih memiliki ${countSiswa} siswa terdaftar. Pindahkan siswa terlebih dahulu.`,
      };
    }

    await prisma.kelas.delete({
      where: { id },
    });

    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/admin-sekolah/siswa");

    return { success: true, message: "Rombel berhasil dihapus." };
  } catch (error: any) {
    console.error("Gagal hapus kelas:", error);
    return { success: false, message: "Gagal menghapus kelas: " + (error?.message || "Terjadi kesalahan.") };
  }
}
