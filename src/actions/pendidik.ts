"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createGuruAction(payload: {
  name: string;
  email: string;
  password?: string;
  role?: "GURU" | "WALI_KELAS";
}) {
  const user = await requireUser();
  const { name, email, password, role } = payload;

  if (!name || !email) {
    return { success: false, message: "Nama dan email wajib diisi." };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return { success: false, message: "Email guru sudah terdaftar di sistem." };
    }

    const hashedPassword = await bcrypt.hash(password?.trim() || "password123", 10);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: role || "GURU",
        sekolahId: user.sekolahId || undefined,
      },
    });

    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/admin-sekolah/kelas");

    return { success: true, message: `Akun pendidik untuk '${name}' berhasil dibuat.` };
  } catch (error: any) {
    console.error("Gagal membuat akun guru:", error);
    return { success: false, message: "Gagal membuat akun: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function assignPengampuAction(payload: {
  guruId: string;
  kelasId: string;
  mapelId: string;
  tahunAjaran: string;
  semester: number; // 0 = Semua, 1 = Ganjil, 2 = Genap
}) {
  await requireUser();
  const { guruId, kelasId, mapelId, tahunAjaran, semester } = payload;

  if (!guruId || !kelasId || !mapelId || !tahunAjaran) {
    return { success: false, message: "Data penugasan tidak lengkap." };
  }

  try {
    const sem = Number(semester);

    // Cek apakah penugasan yang sama persis sudah ada
    const existing = await prisma.pengampu.findUnique({
      where: {
        kelasId_mapelId_tahunAjaran_semester: {
          kelasId,
          mapelId,
          tahunAjaran,
          semester: sem,
        },
      },
      include: {
        guru: true,
      },
    });

    if (existing) {
      return {
        success: false,
        message: `Mata pelajaran ini pada periode dan semester tersebut sudah diampu oleh ${existing.guru.name}.`,
      };
    }

    await prisma.pengampu.create({
      data: {
        guruId,
        kelasId,
        mapelId,
        tahunAjaran,
        semester: sem,
      },
    });

    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/guru");
    revalidatePath("/guru/siswa");
    revalidatePath("/guru/tp");

    return { success: true, message: "Penugasan mengajar berhasil ditetapkan." };
  } catch (error: any) {
    console.error("Gagal assign pengampu:", error);
    return { success: false, message: "Gagal menetapkan penugasan: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function deletePengampuAction(pengampuId: string) {
  await requireUser();

  try {
    await prisma.pengampu.delete({
      where: { id: pengampuId },
    });

    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/guru");
    revalidatePath("/guru/siswa");
    revalidatePath("/guru/tp");

    return { success: true, message: "Penugasan mengajar berhasil dicabut." };
  } catch (error: any) {
    console.error("Gagal mencabut pengampu:", error);
    return { success: false, message: "Gagal mencabut penugasan: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function deleteGuruAction(guruId: string) {
  await requireUser();

  try {
    // Cek apakah masih memiliki penugasan aktif
    const countPengampu = await prisma.pengampu.count({
      where: { guruId },
    });

    if (countPengampu > 0) {
      return {
        success: false,
        message: `Guru tidak dapat dihapus karena masih memiliki ${countPengampu} jadwal mengajar aktif. Cabut penugasan terlebih dahulu.`,
      };
    }

    await prisma.user.delete({
      where: { id: guruId },
    });

    revalidatePath("/admin-sekolah/pendidik");

    return { success: true, message: "Akun guru berhasil dihapus." };
  } catch (error: any) {
    console.error("Gagal hapus guru:", error);
    return { success: false, message: "Gagal menghapus akun: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function updateGuruAction(payload: {
  id: string;
  name: string;
  email: string;
  password?: string;
  isActive?: boolean;
  kelasWaliId?: string | null;
}) {
  await requireUser();
  const { id, name, email, password, isActive, kelasWaliId } = payload;

  if (!id || !name || !email) {
    return { success: false, message: "ID, nama, dan email wajib diisi." };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // Cek duplikasi email pada akun lain
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        NOT: { id },
      },
    });

    if (existingEmail) {
      return { success: false, message: "Email sudah digunakan oleh akun lain." };
    }

    const updateUserData: any = {
      name: name.trim(),
      email: cleanEmail,
    };

    if (password && password.trim().length > 0) {
      updateUserData.password = await bcrypt.hash(password.trim(), 10);
    }

    // Ambil kelas wali saat ini untuk guru ini (jika ada)
    const currentKelasWali = await prisma.kelas.findUnique({
      where: { waliKelasId: id },
    });

    if (kelasWaliId) {
      // Guru ini ditugaskan jadi wali kelas untuk kelasWaliId
      updateUserData.role = "WALI_KELAS";

      // Cek apakah rombel kelas target saat ini sudah dipegang oleh guru lain
      const targetKelas = await prisma.kelas.findUnique({
        where: { id: kelasWaliId },
        include: { waliKelas: true },
      });

      if (targetKelas?.waliKelasId && targetKelas.waliKelasId !== id) {
        const oldWaliId = targetKelas.waliKelasId;
        // Lepaskan kelas dan kembalikan role guru lama jadi GURU biasa
        await prisma.user.update({
          where: { id: oldWaliId },
          data: { role: "GURU" },
        });
      }

      // Jika guru ini sebelumnya memegang kelas lain, lepaskan kelas lamanya
      if (currentKelasWali && currentKelasWali.id !== kelasWaliId) {
        await prisma.kelas.update({
          where: { id: currentKelasWali.id },
          data: { waliKelasId: null },
        });
      }

      // Pasang kelas target ke guru ini
      await prisma.kelas.update({
        where: { id: kelasWaliId },
        data: { waliKelasId: id },
      });
    } else {
      // Pilihan "Bukan Wali Kelas" (Guru Mapel Murni)
      updateUserData.role = "GURU";

      // Jika sebelumnya memegang kelas, lepaskan rombel tersebut
      if (currentKelasWali) {
        await prisma.kelas.update({
          where: { id: currentKelasWali.id },
          data: { waliKelasId: null },
        });
      }
    }

    if (typeof payload.isActive === "boolean") {
      updateUserData.isActive = payload.isActive;
      // Jika diset nonaktif dan saat ini memegang wali kelas, batalkan wali kelas
      if (payload.isActive === false && currentKelasWali) {
        await prisma.kelas.update({
          where: { id: currentKelasWali.id },
          data: { waliKelasId: null },
        });
        updateUserData.role = "GURU";
      }
    }

    await prisma.user.update({
      where: { id },
      data: updateUserData,
    });

    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/wali-kelas");

    return { success: true, message: `Data pendidik '${name}' dan status penugasan berhasil diperbarui.` };
  } catch (error: any) {
    console.error("Gagal update guru:", error);
    return { success: false, message: "Gagal memperbarui guru: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function toggleGuruStatusAction(guruId: string) {
  await requireUser();

  try {
    const guru = await prisma.user.findUnique({
      where: { id: guruId },
      include: {
        kelasWali: true,
      },
    });

    if (!guru) {
      return { success: false, message: "Data guru tidak ditemukan." };
    }

    const nextStatus = !guru.isActive;

    if (!nextStatus) {
      // Jika dinonaktifkan:
      // Lepaskan rombel binaan wali kelas (jika ada) agar bisa langsung ditugaskan ke guru lain
      if (guru.kelasWali) {
        await prisma.kelas.update({
          where: { id: guru.kelasWali.id },
          data: { waliKelasId: null },
        });
      }

      await prisma.user.update({
        where: { id: guruId },
        data: {
          isActive: false,
          role: "GURU",
        },
      });

      revalidatePath("/admin-sekolah/pendidik");
      revalidatePath("/admin-sekolah/kelas");
      revalidatePath("/wali-kelas");

      return {
        success: true,
        message: `Akun '${guru.name}' berhasil dinonaktifkan. Hak akses portal wali kelas otomatis dibebaskan.`,
      };
    } else {
      // Jika diaktifkan kembali
      await prisma.user.update({
        where: { id: guruId },
        data: {
          isActive: true,
        },
      });

      revalidatePath("/admin-sekolah/pendidik");

      return {
        success: true,
        message: `Akun '${guru.name}' berhasil diaktifkan kembali.`,
      };
    }
  } catch (error: any) {
    console.error("Gagal toggle status guru:", error);
    return { success: false, message: "Gagal mengubah status guru: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function updatePengampuAction(payload: {
  id: string;
  guruId: string;
  kelasId: string;
  mapelId: string;
  semester: number;
}) {
  await requireUser();
  const { id, guruId, kelasId, mapelId, semester } = payload;

  if (!id || !guruId || !kelasId || !mapelId) {
    return { success: false, message: "Data penugasan tidak lengkap." };
  }

  try {
    const pengampu = await prisma.pengampu.findUnique({
      where: { id },
    });

    if (!pengampu) {
      return { success: false, message: "Jadwal penugasan tidak ditemukan." };
    }

    const sem = Number(semester);

    // Cek apakah ada jadwal lain yang bentrok di kelas, mapel, tahun ajaran, dan semester yang sama
    const conflict = await prisma.pengampu.findFirst({
      where: {
        kelasId,
        mapelId,
        tahunAjaran: pengampu.tahunAjaran,
        semester: sem,
        NOT: { id },
      },
      include: { guru: true, kelas: true, mapel: true },
    });

    if (conflict) {
      return {
        success: false,
        message: `Mata pelajaran ${conflict.mapel.nama} di Kelas ${conflict.kelas.nama} pada semester tersebut sudah diampu oleh ${conflict.guru.name}.`,
      };
    }

    await prisma.pengampu.update({
      where: { id },
      data: {
        guruId,
        kelasId,
        mapelId,
        semester: sem,
      },
    });

    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/guru");

    return { success: true, message: "Penugasan mengajar berhasil diperbarui." };
  } catch (error: any) {
    console.error("Gagal update pengampu:", error);
    return { success: false, message: "Gagal memperbarui penugasan: " + (error?.message || "Terjadi kesalahan.") };
  }
}
