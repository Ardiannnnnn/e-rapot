"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSekolahAction(formData: {
  npsn: string;
  nama: string;
  alamat?: string;
  kepalaSekolah?: string;
  nipKepsek?: string;
}) {
  const { npsn, nama, alamat, kepalaSekolah, nipKepsek } = formData;

  if (!npsn || !nama) {
    return { success: false, message: "NPSN dan Nama Sekolah wajib diisi." };
  }

  // Cek duplikasi NPSN
  const existing = await prisma.sekolah.findUnique({
    where: { npsn },
  });

  if (existing) {
    return { success: false, message: "NPSN ini sudah terdaftar sebelumnya." };
  }

  await prisma.sekolah.create({
    data: {
      npsn,
      nama,
      alamat: alamat || null,
      kepalaSekolah: kepalaSekolah || null,
      nipKepsek: nipKepsek || null,
      status: "AKTIF",
    },
  });

  revalidatePath("/super-admin/sekolah");
  revalidatePath("/super-admin");

  return { success: true };
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

  try {
    // Cek duplikasi NPSN dengan sekolah lain
    const existing = await prisma.sekolah.findFirst({
      where: {
        npsn,
        NOT: { id: sekolahId },
      },
    });

    if (existing) {
      return { success: false, message: "NPSN sudah dipakai oleh sekolah lain." };
    }

    await prisma.sekolah.update({
      where: { id: sekolahId },
      data: {
        npsn: npsn.trim(),
        nama: nama.trim(),
        alamat: alamat?.trim() || null,
        kepalaSekolah: kepalaSekolah?.trim() || null,
        nipKepsek: nipKepsek?.trim() || null,
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
