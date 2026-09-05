"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createOrUpdateTPAction(formData: {
  id?: string;
  kode: string;
  deskripsi: string;
  tingkat: number;
  semester: number;
  tahunAjaran: string;
  mapelId: string;
}) {
  const user = await requireUser();

  const { id, kode, deskripsi, tingkat, semester, tahunAjaran, mapelId } = formData;

  if (!kode?.trim() || !deskripsi?.trim() || !tingkat || !mapelId) {
    return { success: false, message: "Kode TP, deskripsi, tingkat, dan mata pelajaran wajib diisi." };
  }

  try {
    if (id) {
      await prisma.tujuanPembelajaran.update({
        where: { id },
        data: {
          kode: kode.trim().toUpperCase(),
          deskripsi: deskripsi.trim(),
          tingkat: Number(tingkat),
          semester: Number(semester) || 1,
          tahunAjaran: tahunAjaran || "2026/2027",
          mapelId,
        },
      });
    } else {
      await prisma.tujuanPembelajaran.create({
        data: {
          kode: kode.trim().toUpperCase(),
          deskripsi: deskripsi.trim(),
          tingkat: Number(tingkat),
          semester: Number(semester) || 1,
          tahunAjaran: tahunAjaran || "2026/2027",
          mapelId,
          guruId: user.id,
        },
      });
    }

    revalidatePath("/guru/tp");
    return { success: true, message: id ? "Tujuan Pembelajaran berhasil diperbarui." : "Tujuan Pembelajaran baru berhasil ditambahkan." };
  } catch (error: any) {
    console.error("Gagal menyimpan TP:", error);
    return { success: false, message: "Gagal menyimpan TP: " + (error?.message || "Terjadi kesalahan.") };
  }
}

export async function deleteTPAction(id: string) {
  await requireUser();

  if (!id) {
    return { success: false, message: "ID TP tidak ditemukan." };
  }

  try {
    await prisma.tujuanPembelajaran.delete({
      where: { id },
    });

    revalidatePath("/guru/tp");
    return { success: true, message: "Tujuan Pembelajaran berhasil dihapus." };
  } catch (error: any) {
    console.error("Gagal menghapus TP:", error);
    return { success: false, message: "Gagal menghapus TP." };
  }
}

export async function bulkCreateTPAction(payload: {
  mapelId: string;
  tingkat: number;
  semester: number;
  tahunAjaran: string;
  items: { kode: string; deskripsi: string }[];
}) {
  const user = await requireUser();

  const { mapelId, tingkat, semester, tahunAjaran, items } = payload;

  if (!mapelId || !tingkat || !items || items.length === 0) {
    return { success: false, message: "Data TP tidak lengkap." };
  }

  try {
    await prisma.tujuanPembelajaran.createMany({
      data: items.map((it) => ({
        kode: it.kode.trim().toUpperCase(),
        deskripsi: it.deskripsi.trim(),
        tingkat: Number(tingkat),
        semester: Number(semester) || 1,
        tahunAjaran: tahunAjaran || "2026/2027",
        mapelId,
        guruId: user.id,
      })),
    });

    revalidatePath("/guru/tp");
    return { success: true, message: `Berhasil menambahkan ${items.length} Tujuan Pembelajaran.` };
  } catch (error: any) {
    console.error("Gagal menambahkan TP secara massal:", error);
    return { success: false, message: "Gagal menambahkan TP." };
  }
}
