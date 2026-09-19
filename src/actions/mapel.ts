"use server";

import { prisma } from "@/lib/prisma";
import { requireActionUser } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";

export async function createMapelAction(payload: { kode: string; nama: string; isMulok?: boolean; isSeni?: boolean }) {
  const user = await requireActionUser(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);
  const { kode, nama, isMulok = false, isSeni = false } = payload;

  if (!kode || !nama) {
    return { success: false, message: "Kode mapel dan nama mata pelajaran wajib diisi." };
  }

  try {
    const cleanKode = kode.trim().toUpperCase();
    const existing = await prisma.mataPelajaran.findFirst({
      where: {
        kode: cleanKode,
        ...(user.sekolahId ? { sekolahId: user.sekolahId } : {}),
      },
    });

    if (existing) {
      return { success: false, message: `Kode mapel '${cleanKode}' sudah digunakan oleh mapel lain di sekolah Anda.` };
    }

    await prisma.mataPelajaran.create({
      data: {
        kode: cleanKode,
        nama: nama.trim(),
        isMulok: !!isMulok,
        isSeni: !!isSeni,
        sekolahId: user.sekolahId || undefined,
      },
    });

    revalidatePath("/admin-sekolah/mapel");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/wali-kelas/cetak");
    revalidatePath("/guru");
    if (user.sekolahId) updateTag(`mapel-${user.sekolahId}`);

    return { success: true, message: `Mata pelajaran '${nama}' berhasil ditambahkan.` };
  } catch (error: any) {
    console.error("Gagal tambah mapel:", error);
    return { success: false, message: "Gagal menambah mapel: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function updateMapelAction(payload: { id: string; kode: string; nama: string; isMulok?: boolean; isSeni?: boolean }) {
  const user = await requireActionUser(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);
  const { id, kode, nama, isMulok, isSeni } = payload;

  if (!id || !kode || !nama) {
    return { success: false, message: "Data tidak lengkap." };
  }

  try {
    const target = await prisma.mataPelajaran.findUnique({
      where: { id },
    });

    if (!target) {
      return { success: false, message: "Mata pelajaran tidak ditemukan." };
    }

    if (user.role !== "SUPER_ADMIN" && user.sekolahId && target.sekolahId !== user.sekolahId) {
      return { success: false, message: "Akses ditolak: Mata pelajaran bukan milik sekolah Anda." };
    }

    const cleanKode = kode.trim().toUpperCase();

    // Cek duplikasi kode dengan id lain di sekolah yang sama
    const existing = await prisma.mataPelajaran.findFirst({
      where: {
        kode: cleanKode,
        NOT: { id },
        ...(target.sekolahId ? { sekolahId: target.sekolahId } : {}),
      },
    });

    if (existing) {
      return { success: false, message: `Kode mapel '${cleanKode}' sudah digunakan oleh mapel lain.` };
    }

    await prisma.mataPelajaran.update({
      where: { id },
      data: {
        kode: cleanKode,
        nama: nama.trim(),
        isMulok: !!isMulok,
        isSeni: !!isSeni,
      },
    });

    revalidatePath("/admin-sekolah/mapel");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/wali-kelas/cetak");
    revalidatePath("/guru");
    if (user.sekolahId) updateTag(`mapel-${user.sekolahId}`);

    return { success: true, message: "Mata pelajaran berhasil diperbarui." };
  } catch (error: any) {
    console.error("Gagal update mapel:", error);
    return { success: false, message: "Gagal update mapel: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function deleteMapelAction(id: string) {
  const user = await requireActionUser(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);

  try {
    const target = await prisma.mataPelajaran.findUnique({
      where: { id },
    });

    if (!target) {
      return { success: false, message: "Mata pelajaran tidak ditemukan." };
    }

    if (user.role !== "SUPER_ADMIN" && user.sekolahId && target.sekolahId !== user.sekolahId) {
      return { success: false, message: "Akses ditolak: Mata pelajaran bukan milik sekolah Anda." };
    }

    // Cek apakah sudah ada data nilai siswa terkait mapel ini
    const countNilai = await prisma.nilai.count({
      where: { mapelId: id },
    });

    if (countNilai > 0) {
      return {
        success: false,
        message: `Mata pelajaran tidak dapat dihapus karena sudah memiliki ${countNilai} rekaman nilai siswa.`,
      };
    }

    // Cek apakah masih ada penugasan pengampu terkait mapel ini
    const countPengampu = await prisma.pengampu.count({
      where: { mapelId: id },
    });

    if (countPengampu > 0) {
      return {
        success: false,
        message: `Mata pelajaran tidak dapat dihapus karena masih ditugaskan kepada ${countPengampu} penugasan guru pengampu.`,
      };
    }

    await prisma.mataPelajaran.delete({
      where: { id },
    });

    revalidatePath("/admin-sekolah/mapel");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/guru");
    if (user.sekolahId) updateTag(`mapel-${user.sekolahId}`);

    return { success: true, message: "Mata pelajaran berhasil dihapus." };
  } catch (error: any) {
    console.error("Gagal hapus mapel:", error);
    return { success: false, message: "Gagal menghapus mapel: " + (error?.message || "Terjadi kesalahan.") };
  }
}
