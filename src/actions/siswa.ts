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
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  agama?: string;
  alamat?: string;
}) {
  await requireUser();
  const { nisn, nis, nama, jenisKelamin, kelasId, nik, tempatLahir, tanggalLahir, agama, alamat } = payload;

  if (!nisn || !nis || !nama || !jenisKelamin || !kelasId) {
    return { success: false, message: "NISN, NIPD, Nama, Jenis Kelamin, dan Kelas wajib diisi." };
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
      return { success: false, message: `NIPD '${cleanNis}' sudah terdaftar pada siswa lain.` };
    }

    await prisma.siswa.create({
      data: {
        nisn: cleanNisn,
        nis: cleanNis,
        nama: nama.trim(),
        jenisKelamin: jenisKelamin === "P" ? "P" : "L",
        kelasId,
        nik: nik?.trim() || null,
        tempatLahir: tempatLahir?.trim() || null,
        tanggalLahir: tanggalLahir?.trim() || null,
        agama: agama?.trim() || null,
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
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  agama?: string;
  alamat?: string;
}) {
  await requireUser();
  const { id, nisn, nis, nama, jenisKelamin, kelasId, nik, tempatLahir, tanggalLahir, agama, alamat } = payload;

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
      return { success: false, message: `NIPD '${cleanNis}' sudah terdaftar pada siswa lain.` };
    }

    await prisma.siswa.update({
      where: { id },
      data: {
        nisn: cleanNisn,
        nis: cleanNis,
        nama: nama.trim(),
        jenisKelamin: jenisKelamin === "P" ? "P" : "L",
        kelasId,
        nik: nik?.trim() || null,
        tempatLahir: tempatLahir?.trim() || null,
        tanggalLahir: tanggalLahir?.trim() || null,
        agama: agama?.trim() || null,
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

export interface ItemSiswaImport {
  nama: string;
  nis: string;
  nisn: string;
  jenisKelamin: string;
  kelasNama: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  nik?: string;
  agama?: string;
  alamat?: string;
}

export async function importSiswaExcelAction(items: ItemSiswaImport[]) {
  const user = await requireUser();

  if (items.length === 0) {
    return { success: false, message: "Tidak ada data siswa untuk diimpor." };
  }

  try {
    // 1. Ambil seluruh kelas yang ada di sekolah ini untuk pemetaan nama kelas -> id
    const existingKelasList = await prisma.kelas.findMany({
      where: user.sekolahId ? { sekolahId: user.sekolahId } : undefined,
    });

    const kelasMap = new Map<string, string>();
    for (const k of existingKelasList) {
      const clean1 = k.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
      const clean2 = `kelas${clean1}`;
      kelasMap.set(clean1, k.id);
      kelasMap.set(clean2, k.id);
    }

    let successCount = 0;
    const errors: string[] = [];

    // 2. Proses dalam chunk/batch 50 siswa untuk efisiensi database
    const CHUNK_SIZE = 50;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const operations: any[] = [];

      for (const item of chunk) {
        const cleanNisn = String(item.nisn || "").trim();
        const cleanNis = String(item.nis || "").trim();
        const cleanNama = String(item.nama || "").trim();

        if (!cleanNisn || !cleanNis || !cleanNama) {
          continue;
        }

        // Cari kelasId yang cocok berdasarkan nama kelas di database
        const rawKelas = String(item.kelasNama || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchedKelasId = kelasMap.get(rawKelas);

        if (!matchedKelasId) {
          errors.push(`Siswa '${cleanNama}' (NISN: ${cleanNisn}) ditolak: Rombel '${item.kelasNama || "(kosong)"}' belum terdaftar di Data Kelas.`);
          continue;
        }

        const jk = item.jenisKelamin?.toUpperCase().includes("P") ? "P" : "L";
        const cleanNik = item.nik ? String(item.nik).trim() : null;
        const cleanTempat = item.tempatLahir ? String(item.tempatLahir).trim() : null;
        const cleanTanggal = item.tanggalLahir ? String(item.tanggalLahir).trim() : null;
        const cleanAgama = item.agama ? String(item.agama).trim() : null;
        const cleanAlamat = item.alamat ? String(item.alamat).trim() : null;

        operations.push(
          prisma.siswa.upsert({
            where: { nisn: cleanNisn },
            update: {
              nis: cleanNis,
              nama: cleanNama,
              jenisKelamin: jk,
              kelasId: matchedKelasId,
              nik: cleanNik,
              tempatLahir: cleanTempat,
              tanggalLahir: cleanTanggal,
              agama: cleanAgama,
              alamat: cleanAlamat,
            },
            create: {
              nisn: cleanNisn,
              nis: cleanNis,
              nama: cleanNama,
              jenisKelamin: jk,
              kelasId: matchedKelasId,
              nik: cleanNik,
              tempatLahir: cleanTempat,
              tanggalLahir: cleanTanggal,
              agama: cleanAgama,
              alamat: cleanAlamat,
            },
          })
        );
      }

      if (operations.length > 0) {
        await prisma.$transaction(operations);
        successCount += operations.length;
      }
    }

    revalidatePath("/admin-sekolah/siswa");
    revalidatePath("/admin-sekolah/kelas");
    revalidatePath("/wali-kelas/siswa");
    revalidatePath("/wali-kelas");

    let finalMessage = `Berhasil menyimpan ${successCount} data peserta didik ke database.`;
    if (errors.length > 0) {
      finalMessage += ` (${errors.length} data ditolak karena kelas belum terdaftar)`;
    }

    return {
      success: successCount > 0,
      message: finalMessage,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error("Gagal import siswa massal:", error);
    return {
      success: false,
      message: "Gagal memproses import data: " + (error?.message || "Terjadi kesalahan server."),
    };
  }
}
