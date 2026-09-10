"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sanitizeInput, isValidEmail } from "@/lib/sanitize";

/**
 * Server Action: Buat Operator Sekolah Baru
 * Khusus Super Admin. Role akun otomatis diset ke ADMIN_SEKOLAH.
 */
export async function createOperatorAction(formData: {
  nama: string;
  email: string;
  password: string;
  sekolahId: string;
}) {
  const currentUser = await requireUser();
  if (currentUser.role !== "SUPER_ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya Super Admin yang berwenang." };
  }

  const cleanNama = sanitizeInput(formData.nama || "", 100);
  const cleanEmail = (formData.email || "").trim().toLowerCase();
  const rawPassword = formData.password || "";
  const cleanSekolahId = (formData.sekolahId || "").trim();

  // Validasi Required
  if (!cleanNama || !cleanEmail || !rawPassword || !cleanSekolahId) {
    return {
      success: false,
      message: "Semua isian formulir wajib diisi lengkap (Sekolah, Nama, Email, dan Kata Sandi).",
    };
  }

  // Proteksi XSS (tag HTML < atau >)
  if (/[<>]/.test(formData.nama || "") || /[<>]/.test(formData.email || "")) {
    return {
      success: false,
      message: "Karakter tag HTML (< atau >) tidak diizinkan untuk alasan keamanan sistem.",
    };
  }

  // Validasi Format Email
  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: "Format email tidak valid. Pastikan penulisan email benar (contoh: operator@sekolah.sch.id).",
    };
  }

  // Validasi Panjang Password
  if (rawPassword.length < 6) {
    return {
      success: false,
      message: "Kata sandi minimal harus terdiri dari 6 karakter.",
    };
  }

  // Pastikan Sekolah Terdaftar
  const sekolah = await prisma.sekolah.findUnique({
    where: { id: cleanSekolahId },
  });

  if (!sekolah) {
    return {
      success: false,
      message: "Sekolah yang dipilih tidak ditemukan dalam database.",
    };
  }

  // Cek Keunikan Email
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    return {
      success: false,
      message: `Alamat email '${cleanEmail}' sudah terdaftar pada akun lain. Gunakan email berbeda.`,
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await prisma.user.create({
      data: {
        name: cleanNama,
        email: cleanEmail,
        password: hashedPassword,
        role: "ADMIN_SEKOLAH",
        isActive: true,
        sekolahId: cleanSekolahId,
      },
    });

    revalidatePath("/super-admin/operator");
    revalidatePath("/super-admin/sekolah");

    return {
      success: true,
      message: `Akun Operator untuk '${cleanNama}' di ${sekolah.nama} berhasil dibuat.`,
    };
  } catch (error: any) {
    console.error("Gagal membuat operator sekolah:", error);
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menyimpan operator: " + (error?.message || ""),
    };
  }
}

/**
 * Server Action: Update Data Operator Sekolah
 */
export async function updateOperatorAction(
  id: string,
  formData: {
    nama: string;
    email: string;
    password?: string;
    sekolahId: string;
  }
) {
  const currentUser = await requireUser();
  if (currentUser.role !== "SUPER_ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya Super Admin yang berwenang." };
  }

  if (!id) {
    return { success: false, message: "ID Operator tidak valid." };
  }

  const cleanNama = sanitizeInput(formData.nama || "", 100);
  const cleanEmail = (formData.email || "").trim().toLowerCase();
  const rawPassword = formData.password?.trim() || "";
  const cleanSekolahId = (formData.sekolahId || "").trim();

  // Validasi Required
  if (!cleanNama || !cleanEmail || !cleanSekolahId) {
    return {
      success: false,
      message: "Pilihan Sekolah, Nama Operator, dan Email wajib diisi lengkap.",
    };
  }

  // Proteksi XSS
  if (/[<>]/.test(formData.nama || "") || /[<>]/.test(formData.email || "")) {
    return {
      success: false,
      message: "Karakter tag HTML (< atau >) tidak diizinkan untuk alasan keamanan sistem.",
    };
  }

  // Validasi Email
  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: "Format email tidak valid. Pastikan penulisan email benar.",
    };
  }

  // Jika password diisi, cek panjang minimal
  if (rawPassword && rawPassword.length < 6) {
    return {
      success: false,
      message: "Kata sandi baru minimal harus terdiri dari 6 karakter.",
    };
  }

  // Cek duplikasi email dengan user lain
  const existingUser = await prisma.user.findFirst({
    where: {
      email: cleanEmail,
      NOT: { id },
    },
  });

  if (existingUser) {
    return {
      success: false,
      message: `Alamat email '${cleanEmail}' sudah digunakan oleh akun lain.`,
    };
  }

  // Pastikan Sekolah Terdaftar
  const sekolah = await prisma.sekolah.findUnique({
    where: { id: cleanSekolahId },
  });

  if (!sekolah) {
    return {
      success: false,
      message: "Sekolah yang dipilih tidak valid atau tidak ditemukan.",
    };
  }

  try {
    const updateData: any = {
      name: cleanNama,
      email: cleanEmail,
      sekolahId: cleanSekolahId,
    };

    if (rawPassword) {
      updateData.password = await bcrypt.hash(rawPassword, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/super-admin/operator");
    revalidatePath("/super-admin/sekolah");

    return {
      success: true,
      message: `Data operator '${cleanNama}' berhasil diperbarui.`,
    };
  } catch (error: any) {
    console.error("Gagal update operator:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui data operator: " + (error?.message || ""),
    };
  }
}

/**
 * Server Action: Toggle Status Aktif / Nonaktif Operator
 */
export async function toggleStatusOperatorAction(id: string, currentIsActive: boolean) {
  const currentUser = await requireUser();
  if (currentUser.role !== "SUPER_ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya Super Admin yang berwenang." };
  }

  if (!id) {
    return { success: false, message: "ID Operator tidak valid." };
  }

  try {
    const targetStatus = !currentIsActive;

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: targetStatus },
      select: { name: true, isActive: true },
    });

    revalidatePath("/super-admin/operator");

    const statusText = targetStatus ? "diaktifkan kembali" : "dinonaktifkan";
    return {
      success: true,
      message: `Akun Operator '${updated.name}' berhasil ${statusText}.`,
    };
  } catch (error: any) {
    console.error("Gagal mengubah status operator:", error);
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat mengubah status operator.",
    };
  }
}
