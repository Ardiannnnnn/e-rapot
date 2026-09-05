"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSiswaByKelas(kelasId: string) {
  return prisma.siswa.findMany({
    where: { kelasId },
    orderBy: { nama: "asc" },
  });
}

export async function createSiswaAction(payload: {
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string; // "L" / "P"
  kelasId: string;
  alamat?: string;
}) {
  await requireUser();
  const { nisn, nis, nama, jenisKelamin, kelasId, alamat } = payload;

  if (!nisn || !nis || !nama || !jenisKelamin || !kelasId) {
    return { success: false, message: "NISN, NIS, Nama, Jenis Kelamin, dan Kelas wajib diisi." };
  }

  try {
    const cleanNisn = nisn.trim();
    const cleanNis = nis.trim();

    const existingNisn = await prisma.siswa.findUnique({
      where: { nisn: cleanNisn },
    });
    if (existingNisn) {
      return { success: false, message: `NISN '${cleanNisn}' sudah terdaftar pada siswa lain.` };
    }

    const existingNis = await prisma.siswa.findUnique({
      where: { nis: cleanNis },
    });
    if (existingNis) {
      return { success: false, message: `NIS '${cleanNis}' sudah terdaftar pada siswa lain.` };
    }

    await prisma.siswa.create({
      data: {
        nisn: cleanNisn,
        nis: cleanNis,
        nama: nama.trim(),
        jenisKelamin: jenisKelamin === "P" ? "P" : "L",
        kelasId,
        alamat: alamat?.trim() || null,
      },
    });

    revalidatePath("/admin-sekolah/siswa");
    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/guru/siswa");

    return { success: true, message: `Siswa '${nama}' berhasil didaftarkan.` };
  } catch (error: any) {
    console.error("Gagal tambah siswa:", error);
    return { success: false, message: "Gagal menambah siswa: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function updateSiswaAction(payload: {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
  kelasId: string;
  alamat?: string;
}) {
  await requireUser();
  const { id, nisn, nis, nama, jenisKelamin, kelasId, alamat } = payload;

  if (!id || !nisn || !nis || !nama || !jenisKelamin || !kelasId) {
    return { success: false, message: "Data tidak lengkap." };
  }

  try {
    const cleanNisn = nisn.trim();
    const cleanNis = nis.trim();

    // Cek duplikasi NISN dengan ID lain
    const existingNisn = await prisma.siswa.findFirst({
      where: {
        nisn: cleanNisn,
        NOT: { id },
      },
    });
    if (existingNisn) {
      return { success: false, message: `NISN '${cleanNisn}' sudah terdaftar pada siswa lain.` };
    }

    const existingNis = await prisma.siswa.findFirst({
      where: {
        nis: cleanNis,
        NOT: { id },
      },
    });
    if (existingNis) {
      return { success: false, message: `NIS '${cleanNis}' sudah terdaftar pada siswa lain.` };
    }

    await prisma.siswa.update({
      where: { id },
      data: {
        nisn: cleanNisn,
        nis: cleanNis,
        nama: nama.trim(),
        jenisKelamin: jenisKelamin === "P" ? "P" : "L",
        kelasId,
        alamat: alamat?.trim() || null,
      },
    });

    revalidatePath("/admin-sekolah/siswa");
    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/guru/siswa");

    return { success: true, message: `Data siswa '${nama}' berhasil diperbarui.` };
  } catch (error: any) {
    console.error("Gagal update siswa:", error);
    return { success: false, message: "Gagal update data siswa: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function deleteSiswaAction(siswaId: string) {
  await requireUser();

  try {
    await prisma.siswa.delete({
      where: { id: siswaId },
    });

    revalidatePath("/admin-sekolah/siswa");
    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/guru/siswa");

    return { success: true, message: "Data siswa berhasil dihapus." };
  } catch (error: any) {
    console.error("Gagal hapus siswa:", error);
    return { success: false, message: "Gagal menghapus siswa: " + (error?.message || "Terjadi kesalahan.") };
  }
}
