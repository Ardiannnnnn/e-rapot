"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";

export async function createSekolahAction(formData: {
  npsn: string;
  nama: string;
  alamat?: string;
  kepalaSekolah?: string;
  nipKepsek?: string;
}) {
  const { npsn, nama, alamat, kepalaSekolah, nipKepsek } = formData;

  const cleanNpsn = npsn?.trim() || "";
  const cleanNama = sanitizeInput(nama || "", 150);
  const cleanAlamat = sanitizeInput(alamat || "", 300);
  const cleanKepalaSekolah = sanitizeInput(kepalaSekolah || "", 150);
  const cleanNip = nipKepsek?.trim() || "";

  if (!cleanNpsn || !cleanNama || !cleanAlamat || !cleanKepalaSekolah || !cleanNip) {
    return {
      success: false,
      message: "Semua kolom form wajib diisi lengkap (NPSN, Nama Sekolah, Alamat, Nama Kepala Sekolah, dan NIP).",
    };
  }

  // Tolak jika ada upaya injeksi tag HTML (< atau >)
  if (/[<>]/.test(nama || "") || /[<>]/.test(alamat || "") || /[<>]/.test(kepalaSekolah || "")) {
    return {
      success: false,
      message: "Karakter tag HTML (< atau >) tidak diizinkan untuk alasan keamanan sistem.",
    };
  }

  if (!/^\d{8}$/.test(cleanNpsn)) {
    return {
      success: false,
      message: "Format NPSN tidak valid. NPSN harus terdiri dari tepat 8 digit angka murni.",
    };
  }

  const digitsOnly = cleanNip.replace(/[\s.-]/g, "");
  if (!/^\d{18}$/.test(digitsOnly)) {
    return {
      success: false,
      message: "Format NIP Kepala Sekolah tidak valid. NIP harus terdiri dari tepat 18 digit angka (contoh: 19780101 200501 1 002).",
    };
  }

  // Cek duplikasi NPSN
  const existing = await prisma.sekolah.findUnique({
    where: { npsn: cleanNpsn },
  });

  if (existing) {
    return { success: false, message: `NPSN '${cleanNpsn}' sudah terdaftar sebelumnya.` };
  }

  await prisma.sekolah.create({
    data: {
      npsn: cleanNpsn,
      nama: cleanNama,
      alamat: cleanAlamat,
      kepalaSekolah: cleanKepalaSekolah,
      nipKepsek: cleanNip,
      status: "AKTIF",
      isStatus: true,
    },
  });

  revalidatePath("/super-admin/sekolah");
  revalidatePath("/super-admin");

  return { success: true, message: `Sekolah '${cleanNama}' berhasil didaftarkan.` };
}

export async function updateProfilSekolahAction(payload: {
  sekolahId: string;
  npsn: string;
  nama: string;
  alamat?: string;
  kepalaSekolah?: string;
  nipKepsek?: string;
}) {
  const { sekolahId, npsn, nama, alamat, kepalaSekolah, nipKepsek } = payload;

  if (!sekolahId || !npsn || !nama) {
    return { success: false, message: "NPSN dan Nama Sekolah wajib diisi." };
  }

  const cleanNpsn = npsn.trim();
  const cleanNama = sanitizeInput(nama || "", 150);
  const cleanAlamat = sanitizeInput(alamat || "", 300);
  const cleanKepalaSekolah = sanitizeInput(kepalaSekolah || "", 150);
  const cleanNip = nipKepsek?.trim();

  // Tolak jika ada upaya injeksi tag HTML (< atau >)
  if (/[<>]/.test(nama || "") || /[<>]/.test(alamat || "") || /[<>]/.test(kepalaSekolah || "")) {
    return {
      success: false,
      message: "Karakter tag HTML (< atau >) tidak diizinkan untuk alasan keamanan sistem.",
    };
  }

  if (!/^\d{8}$/.test(cleanNpsn)) {
    return {
      success: false,
      message: "Format NPSN tidak valid. NPSN harus terdiri dari tepat 8 digit angka murni.",
    };
  }

  if (cleanNip && cleanNip !== "-") {
    const digitsOnly = cleanNip.replace(/[\s.-]/g, "");
    if (!/^\d{18}$/.test(digitsOnly)) {
      return {
        success: false,
        message: "Format NIP Kepala Sekolah tidak valid. NIP harus terdiri dari tepat 18 digit angka (contoh: 19780101 200501 1 002).",
      };
    }
  }

  try {
    // Cek duplikasi NPSN dengan sekolah lain
    const existing = await prisma.sekolah.findFirst({
      where: {
        npsn: cleanNpsn,
        NOT: { id: sekolahId },
      },
    });

    if (existing) {
      return { success: false, message: "NPSN sudah dipakai oleh sekolah lain." };
    }

    await prisma.sekolah.update({
      where: { id: sekolahId },
      data: {
        npsn: cleanNpsn,
        nama: cleanNama,
        alamat: cleanAlamat || null,
        kepalaSekolah: cleanKepalaSekolah || null,
        nipKepsek: cleanNip || null,
      },
    });

    revalidatePath("/admin-sekolah/profil");
    revalidatePath("/admin-sekolah");

    return { success: true, message: "Profil identitas sekolah berhasil diperbarui." };
  } catch (error: any) {
    console.error("Gagal update profil sekolah:", error);
    return { success: false, message: "Gagal memperbarui profil: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function updateSekolahSuperAdminAction(payload: {
  id: string;
  npsn: string;
  nama: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepsek: string;
  status?: string;
}) {
  const { id, npsn, nama, alamat, kepalaSekolah, nipKepsek, status } = payload;

  const cleanNpsn = npsn?.trim() || "";
  const cleanNama = sanitizeInput(nama || "", 150);
  const cleanAlamat = sanitizeInput(alamat || "", 300);
  const cleanKepalaSekolah = sanitizeInput(kepalaSekolah || "", 150);
  const cleanNip = nipKepsek?.trim() || "";
  const cleanStatus = status === "NONAKTIF" ? "NONAKTIF" : "AKTIF";

  if (!id || !cleanNpsn || !cleanNama || !cleanAlamat || !cleanKepalaSekolah || !cleanNip) {
    return {
      success: false,
      message: "Semua kolom form wajib diisi lengkap (NPSN, Nama Sekolah, Alamat, Nama Kepala Sekolah, dan NIP).",
    };
  }

  // Tolak jika ada upaya injeksi tag HTML (< atau >)
  if (/[<>]/.test(nama || "") || /[<>]/.test(alamat || "") || /[<>]/.test(kepalaSekolah || "")) {
    return {
      success: false,
      message: "Karakter tag HTML (< atau >) tidak diizinkan untuk alasan keamanan sistem.",
    };
  }

  if (!/^\d{8}$/.test(cleanNpsn)) {
    return {
      success: false,
      message: "Format NPSN tidak valid. NPSN harus terdiri dari tepat 8 digit angka murni.",
    };
  }

  const digitsOnly = cleanNip.replace(/[\s.-]/g, "");
  if (!/^\d{18}$/.test(digitsOnly)) {
    return {
      success: false,
      message: "Format NIP Kepala Sekolah tidak valid. NIP harus terdiri dari tepat 18 digit angka (contoh: 19780101 200501 1 002).",
    };
  }

  try {
    // Cek duplikasi NPSN dengan sekolah lain
    const existing = await prisma.sekolah.findFirst({
      where: {
        npsn: cleanNpsn,
        NOT: { id },
      },
    });

    if (existing) {
      return { success: false, message: `NPSN '${cleanNpsn}' sudah digunakan oleh instansi sekolah lain.` };
    }

    await prisma.sekolah.update({
      where: { id },
      data: {
        npsn: cleanNpsn,
        nama: cleanNama,
        alamat: cleanAlamat,
        kepalaSekolah: cleanKepalaSekolah,
        nipKepsek: cleanNip,
        status: cleanStatus,
        isStatus: cleanStatus === "AKTIF",
      },
    });

    revalidatePath("/super-admin/sekolah");
    revalidatePath(`/super-admin/sekolah/${id}/edit`);
    revalidatePath("/super-admin");

    return { success: true, message: `Data sekolah '${cleanNama}' berhasil diperbarui.` };
  } catch (error: any) {
    console.error("Gagal update data sekolah Super Admin:", error);
    return { success: false, message: "Gagal memperbarui data sekolah: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function toggleStatusSekolahAction(id: string, newIsStatus: boolean) {
  if (!id) return { success: false, message: "ID sekolah tidak valid." };

  try {
    const updated = await prisma.sekolah.update({
      where: { id },
      data: {
        isStatus: newIsStatus,
        status: newIsStatus ? "AKTIF" : "NONAKTIF",
      },
    });

    revalidatePath("/super-admin/sekolah");
    revalidatePath("/super-admin");

    return {
      success: true,
      message: newIsStatus
        ? `Sekolah '${updated.nama}' berhasil diaktifkan kembali (isStatus = 1).`
        : `Sekolah '${updated.nama}' berhasil dinonaktifkan (Soft Delete, isStatus = 0).`,
    };
  } catch (error: any) {
    console.error("Gagal ubah status sekolah:", error);
    return {
      success: false,
      message: "Gagal mengubah status sekolah: " + (error?.message || "Terjadi kesalahan."),
    };
  }
}

