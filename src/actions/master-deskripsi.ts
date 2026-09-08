"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";

const DEFAULT_TEMA_P5_INIT = [
  "Tema 1 : Kreasi Nusantara ( Membuat Batik Sederhana )",
  "Tema 2 : Peduli Terhadap Lingkungan Sekitar ( Mengolah Sampah Organik Dan Non Organik )",
  "Tema 3 : Bangunlah Jiwa Dan Raganya ( Menanam Tanaman Obat Keluarga )",
];

const DEFAULT_KEBIASAAN_INIT = [
  "Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat",
  "Terbiasa dalam bangun pagi, beribadah tepat waktu, serta gemar membaca buku",
  "Terbiasa dalam menjaga kebersihan lingkungan dan membantu sesama teman",
  "Terbiasa dalam berolahraga teratur dan mengonsumsi makanan sehat bergizi",
  "Terbiasa dalam bertutur kata santun dan menghormati bapak/ibu guru",
];

const DEFAULT_SARAN_INIT = [
  "Alhamdulillah sikap dan pengetahuan Ananda sudah baik. Kembangkan potensi yang dimiliki karena intan tidak akan dinilai tanpa diasah.",
  "Ananda menunjukkan perkembangan karakter yang sangat baik, memiliki rasa empati tinggi, serta aktif berkolaborasi dengan teman sekelas.",
  "Pertahankan semangat belajar dan ketekunan ananda. Terus kembangkan rasa ingin tahu serta kreativitas yang luar biasa.",
  "Ananda memiliki potensi kepemimpinan yang baik. Diharapkan terus konsisten dalam meningkatkan kedisiplinan dan fokus belajar.",
  "Tingkatkan lagi kemandirian dalam menyelesaikan tugas. Terus percaya diri dalam mengemukakan pendapat di kelas.",
];

const DEFAULT_EKSKUL_INIT = [
  "Pramuka",
  "Palang Merah Remaja (PMR) / UKS",
  "Seni Tari",
  "Seni Musik / Drumband",
  "Sepak Bola / Futsal",
  "Bulu Tangkis",
  "Pencak Silat",
  "Tahfidz Al-Qur'an",
  "Seni Lukis / Gambar",
  "Dokter Kecil",
  "Klub Bahasa Inggris",
];

export async function getTemplateRaporAction(kelasId: string, tahunAjaran: string, semester: number) {
  try {
    const user = await requireUser();

    // Cek apakah sudah ada template untuk kelas dan semester ini
    let templates = await prisma.templateRapor.findMany({
      where: {
        kelasId,
        tahunAjaran,
        semester,
      },
      orderBy: { urutan: "asc" },
    });

    // Jika belum ada template sama sekali, lakukan inisialisasi otomatis
    if (templates.length === 0) {
      const initData: {
        kelasId: string;
        kategori: string;
        judul?: string;
        teks: string;
        urutan: number;
        tahunAjaran: string;
        semester: number;
      }[] = [];

      DEFAULT_TEMA_P5_INIT.forEach((tema, idx) => {
        initData.push({
          kelasId,
          kategori: "TEMA_P5",
          judul: `Tema ${idx + 1}`,
          teks: tema,
          urutan: idx + 1,
          tahunAjaran,
          semester,
        });
      });

      DEFAULT_KEBIASAAN_INIT.forEach((kebiasaan, idx) => {
        initData.push({
          kelasId,
          kategori: "KEBIASAAN",
          judul: `Pilihan Kebiasaan ${idx + 1}`,
          teks: kebiasaan,
          urutan: idx + 1,
          tahunAjaran,
          semester,
        });
      });

      DEFAULT_SARAN_INIT.forEach((saran, idx) => {
        initData.push({
          kelasId,
          kategori: "SARAN_WALI",
          judul: `Pilihan Saran ${idx + 1}`,
          teks: saran,
          urutan: idx + 1,
          tahunAjaran,
          semester,
        });
      });

      DEFAULT_EKSKUL_INIT.forEach((ekskul, idx) => {
        initData.push({
          kelasId,
          kategori: "EKSKUL",
          judul: ekskul,
          teks: ekskul,
          urutan: idx + 1,
          tahunAjaran,
          semester,
        });
      });

      await prisma.templateRapor.createMany({
        data: initData,
      });

      templates = await prisma.templateRapor.findMany({
        where: {
          kelasId,
          tahunAjaran,
          semester,
        },
        orderBy: { urutan: "asc" },
      });
    } else {
      // Jika template sudah ada tapi belum ada kategori EKSKUL, tambahkan inisialisasi ekskul
      const hasEkskul = templates.some((t) => t.kategori === "EKSKUL");
      if (!hasEkskul) {
        const ekskulInitData = DEFAULT_EKSKUL_INIT.map((ekskul, idx) => ({
          kelasId,
          kategori: "EKSKUL",
          judul: ekskul,
          teks: ekskul,
          urutan: idx + 1,
          tahunAjaran,
          semester,
        }));

        await prisma.templateRapor.createMany({
          data: ekskulInitData,
        });

        templates = await prisma.templateRapor.findMany({
          where: {
            kelasId,
            tahunAjaran,
            semester,
          },
          orderBy: { urutan: "asc" },
        });
      }
    }

    return {
      success: true,
      data: {
        temaP5: templates.filter((t) => t.kategori === "TEMA_P5"),
        kebiasaan: templates.filter((t) => t.kategori === "KEBIASAAN"),
        saranWali: templates.filter((t) => t.kategori === "SARAN_WALI"),
        ekskul: templates.filter((t) => t.kategori === "EKSKUL"),
      },
    };
  } catch (error: any) {
    console.error("Gagal getTemplateRaporAction:", error);
    return { success: false, message: error?.message || "Gagal mengambil data template rapor." };
  }
}

export async function tambahTemplateAction(input: {
  kelasId: string;
  kategori: "TEMA_P5" | "KEBIASAAN" | "SARAN_WALI" | "EKSKUL";
  judul?: string;
  teks: string;
  tahunAjaran: string;
  semester: number;
}) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    const cleanTeks = sanitizeInput(input.teks, 1000);
    if (!cleanTeks) {
      return { success: false, message: "Teks template tidak boleh kosong." };
    }

    const cleanJudul = input.judul ? sanitizeInput(input.judul, 150) : null;

    // Hitung urutan terakhir
    const count = await prisma.templateRapor.count({
      where: {
        kelasId: input.kelasId,
        kategori: input.kategori,
        tahunAjaran: input.tahunAjaran,
        semester: input.semester,
      },
    });

    const item = await prisma.templateRapor.create({
      data: {
        kelasId: input.kelasId,
        kategori: input.kategori,
        judul: cleanJudul || (input.kategori === "TEMA_P5" ? `Tema ${count + 1}` : `Pilihan ${count + 1}`),
        teks: cleanTeks,
        urutan: count + 1,
        tahunAjaran: input.tahunAjaran,
        semester: input.semester,
      },
    });

    revalidatePath("/wali-kelas/master-deskripsi");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, data: item, message: "Template berhasil ditambahkan." };
  } catch (error: any) {
    console.error("Gagal tambahTemplateAction:", error);
    return { success: false, message: error?.message || "Gagal menambahkan template." };
  }
}

export async function updateTemplateAction(id: string, teks: string, judul?: string) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    const cleanTeks = sanitizeInput(teks, 1000);
    if (!cleanTeks) {
      return { success: false, message: "Teks template tidak boleh kosong." };
    }

    const item = await prisma.templateRapor.update({
      where: { id },
      data: {
        teks: cleanTeks,
        ...(judul !== undefined ? { judul: sanitizeInput(judul, 150) } : {}),
      },
    });

    revalidatePath("/wali-kelas/master-deskripsi");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, data: item, message: "Template berhasil diperbarui." };
  } catch (error: any) {
    console.error("Gagal updateTemplateAction:", error);
    return { success: false, message: error?.message || "Gagal mengubah template." };
  }
}

export async function hapusTemplateAction(id: string) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    await prisma.templateRapor.delete({
      where: { id },
    });

    revalidatePath("/wali-kelas/master-deskripsi");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, message: "Template berhasil dihapus." };
  } catch (error: any) {
    console.error("Gagal hapusTemplateAction:", error);
    return { success: false, message: error?.message || "Gagal menghapus template." };
  }
}

export async function resetDefaultTemplateAction(kelasId: string, tahunAjaran: string, semester: number) {
  try {
    const user = await requireUser();
    if (
      user.role !== "WALI_KELAS" &&
      user.role !== "ADMIN_SEKOLAH" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, message: "Akses ditolak." };
    }

    // Hapus yang lama
    await prisma.templateRapor.deleteMany({
      where: {
        kelasId,
        tahunAjaran,
        semester,
      },
    });

    // Inisialisasi ulang
    const initData: {
      kelasId: string;
      kategori: string;
      judul?: string;
      teks: string;
      urutan: number;
      tahunAjaran: string;
      semester: number;
    }[] = [];

    DEFAULT_TEMA_P5_INIT.forEach((tema, idx) => {
      initData.push({
        kelasId,
        kategori: "TEMA_P5",
        judul: `Tema ${idx + 1}`,
        teks: tema,
        urutan: idx + 1,
        tahunAjaran,
        semester,
      });
    });

    DEFAULT_KEBIASAAN_INIT.forEach((kebiasaan, idx) => {
      initData.push({
        kelasId,
        kategori: "KEBIASAAN",
        judul: `Pilihan Kebiasaan ${idx + 1}`,
        teks: kebiasaan,
        urutan: idx + 1,
        tahunAjaran,
        semester,
      });
    });

    DEFAULT_SARAN_INIT.forEach((saran, idx) => {
      initData.push({
        kelasId,
        kategori: "SARAN_WALI",
        judul: `Pilihan Saran ${idx + 1}`,
        teks: saran,
        urutan: idx + 1,
        tahunAjaran,
        semester,
      });
    });

    DEFAULT_EKSKUL_INIT.forEach((ekskul, idx) => {
      initData.push({
        kelasId,
        kategori: "EKSKUL",
        judul: ekskul,
        teks: ekskul,
        urutan: idx + 1,
        tahunAjaran,
        semester,
      });
    });

    await prisma.templateRapor.createMany({
      data: initData,
    });

    revalidatePath("/wali-kelas/master-deskripsi");
    revalidatePath("/wali-kelas/pelengkap");
    revalidatePath("/wali-kelas/cetak");

    return { success: true, message: "Template berhasil di-reset ke standar Kurikulum Merdeka." };
  } catch (error: any) {
    console.error("Gagal resetDefaultTemplateAction:", error);
    return { success: false, message: error?.message || "Gagal me-reset template." };
  }
}
