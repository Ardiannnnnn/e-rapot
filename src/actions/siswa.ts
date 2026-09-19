"use server";

import { prisma } from "@/lib/prisma";
import { requireActionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSiswaByKelas(kelasId: string) {
  const user = await requireActionUser();
  const targetKelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    select: { sekolahId: true },
  });

  if (!targetKelas || (user.role !== "SUPER_ADMIN" && user.sekolahId && targetKelas.sekolahId !== user.sekolahId)) {
    throw new Error("Akses ditolak: Rombel bukan milik sekolah Anda.");
  }

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
  const user = await requireActionUser(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);
  const { nisn, nis, nama, jenisKelamin, kelasId, nik, tempatLahir, tanggalLahir, agama, alamat } = payload;

  if (!nisn || !nis || !nama || !jenisKelamin || !kelasId) {
    return { success: false, message: "NISN, NIPD, Nama, Jenis Kelamin, dan Kelas wajib diisi." };
  }

  try {
    const cleanNisn = nisn.trim();
    const cleanNis = nis.trim();

    // Validasi kepemilikan kelas (tenant check)
    const targetKelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: { id: true, sekolahId: true },
    });
    if (!targetKelas) {
      return { success: false, message: "Rombel kelas tidak ditemukan." };
    }
    if (user.role !== "SUPER_ADMIN" && user.sekolahId && targetKelas.sekolahId !== user.sekolahId) {
      return { success: false, message: "Akses ditolak: Rombel bukan milik sekolah Anda." };
    }

    const existingNisn = await prisma.siswa.findUnique({
      where: { nisn: cleanNisn },
    });
    if (existingNisn) {
      return { success: false, message: `NISN '${cleanNisn}' sudah terdaftar pada siswa lain.` };
    }

    // NIS unik dalam lingkup sekolah target
    const existingNis = await prisma.siswa.findFirst({
      where: {
        nis: cleanNis,
        kelas: { sekolahId: targetKelas.sekolahId },
      },
    });
    if (existingNis) {
      return { success: false, message: `NIPD/NIS '${cleanNis}' sudah terdaftar pada siswa lain di sekolah ini.` };
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
  const user = await requireActionUser(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);
  const { id, nisn, nis, nama, jenisKelamin, kelasId, nik, tempatLahir, tanggalLahir, agama, alamat } = payload;

  if (!id || !nisn || !nis || !nama || !jenisKelamin || !kelasId) {
    return { success: false, message: "Data tidak lengkap." };
  }

  try {
    // Validasi kepemilikan data siswa (BOLA/IDOR protection)
    const existingSiswa = await prisma.siswa.findUnique({
      where: { id },
      include: { kelas: true },
    });
    if (!existingSiswa) {
      return { success: false, message: "Data siswa tidak ditemukan." };
    }
    if (user.role !== "SUPER_ADMIN" && user.sekolahId && existingSiswa.kelas.sekolahId !== user.sekolahId) {
      return { success: false, message: "Akses ditolak: Data siswa bukan milik sekolah Anda." };
    }

    // Validasi rombel baru
    const targetKelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: { id: true, sekolahId: true },
    });
    if (!targetKelas) {
      return { success: false, message: "Rombel kelas tidak ditemukan." };
    }
    if (user.role !== "SUPER_ADMIN" && user.sekolahId && targetKelas.sekolahId !== user.sekolahId) {
      return { success: false, message: "Akses ditolak: Rombel tujuan bukan milik sekolah Anda." };
    }

    const cleanNisn = nisn.trim();
    const cleanNis = nis.trim();

    // Cek duplikasi NISN global dengan ID lain
    const existingNisn = await prisma.siswa.findFirst({
      where: {
        nisn: cleanNisn,
        NOT: { id },
      },
    });
    if (existingNisn) {
      return { success: false, message: `NISN '${cleanNisn}' sudah terdaftar pada siswa lain.` };
    }

    // Cek duplikasi NIS dalam lingkup sekolah
    const existingNis = await prisma.siswa.findFirst({
      where: {
        nis: cleanNis,
        NOT: { id },
        kelas: { sekolahId: targetKelas.sekolahId },
      },
    });
    if (existingNis) {
      return { success: false, message: `NIPD/NIS '${cleanNis}' sudah terdaftar pada siswa lain di sekolah ini.` };
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
  const user = await requireActionUser(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);

  try {
    // Validasi kepemilikan siswa (BOLA/IDOR protection)
    const existingSiswa = await prisma.siswa.findUnique({
      where: { id: siswaId },
      include: { kelas: true },
    });
    if (!existingSiswa) {
      return { success: false, message: "Data siswa tidak ditemukan." };
    }
    if (user.role !== "SUPER_ADMIN" && user.sekolahId && existingSiswa.kelas.sekolahId !== user.sekolahId) {
      return { success: false, message: "Akses ditolak: Siswa ini bukan milik sekolah Anda." };
    }

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
  const user = await requireActionUser(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);

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

      // Cek siswa yang sudah ada di database untuk mencegah pembajakan data lintas sekolah (Cross-Tenant Hijacking)
      const chunkNisns = chunk.map((c) => String(c.nisn || "").trim()).filter(Boolean);
      const existingSiswaList = await prisma.siswa.findMany({
        where: { nisn: { in: chunkNisns } },
        include: { kelas: true },
      });
      const existingMap = new Map(existingSiswaList.map((s) => [s.nisn, s]));

      for (const item of chunk) {
        const cleanNisn = String(item.nisn || "").trim();
        const cleanNis = String(item.nis || "").trim();
        const cleanNama = String(item.nama || "").trim();

        if (!cleanNisn || !cleanNis || !cleanNama) {
          continue;
        }

        // Validasi proteksi kepemilikan tenant
        const existingSiswa = existingMap.get(cleanNisn);
        if (
          existingSiswa &&
          user.role !== "SUPER_ADMIN" &&
          user.sekolahId &&
          existingSiswa.kelas.sekolahId !== user.sekolahId
        ) {
          errors.push(`Siswa '${cleanNama}' (NISN: ${cleanNisn}) ditolak: Sudah terdaftar pada satuan pendidikan lain.`);
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
