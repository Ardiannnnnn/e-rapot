"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createMapelAction(payload: { kode: string; nama: string }) {
  await requireUser();
  const { kode, nama } = payload;

  if (!kode || !nama) {
    return { success: false, message: "Kode mapel dan nama mata pelajaran wajib diisi." };
  }

  try {
    const cleanKode = kode.trim().toUpperCase();
    const existing = await prisma.mataPelajaran.findUnique({
      where: { kode: cleanKode },
    });

    if (existing) {
      return { success: false, message: `Kode mapel '${cleanKode}' sudah digunakan oleh mapel lain.` };
    }

    await prisma.mataPelajaran.create({
      data: {
        kode: cleanKode,
        nama: nama.trim(),
      },
    });

    revalidatePath("/admin-sekolah/mapel");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/guru");

    return { success: true, message: `Mata pelajaran '${nama}' berhasil ditambahkan.` };
  } catch (error: any) {
    console.error("Gagal tambah mapel:", error);
    return { success: false, message: "Gagal menambah mapel: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function updateMapelAction(payload: { id: string; kode: string; nama: string }) {
  await requireUser();
  const { id, kode, nama } = payload;

  if (!id || !kode || !nama) {
    return { success: false, message: "Data tidak lengkap." };
  }

  try {
    const cleanKode = kode.trim().toUpperCase();

    // Cek duplikasi kode dengan id lain
    const existing = await prisma.mataPelajaran.findFirst({
      where: {
        kode: cleanKode,
        NOT: { id },
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
      },
    });

    revalidatePath("/admin-sekolah/mapel");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/guru");

    return { success: true, message: "Mata pelajaran berhasil diperbarui." };
  } catch (error: any) {
    console.error("Gagal update mapel:", error);
    return { success: false, message: "Gagal update mapel: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function deleteMapelAction(id: string) {
  await requireUser();

  try {
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

    await prisma.mataPelajaran.delete({
      where: { id },
    });

    revalidatePath("/admin-sekolah/mapel");
    revalidatePath("/admin-sekolah/pendidik");
    revalidatePath("/guru");

    return { success: true, message: "Mata pelajaran berhasil dihapus." };
  } catch (error: any) {
    console.error("Gagal hapus mapel:", error);
    return { success: false, message: "Gagal menghapus mapel: " + (error?.message || "Terjadi kesalahan.") };
  }
}
