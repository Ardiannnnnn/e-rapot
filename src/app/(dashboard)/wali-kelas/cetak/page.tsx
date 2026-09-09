import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import CetakRaporClient from "./cetak-rapor-client";
import { AlertCircleIcon } from "@/components/shared/icons";
import { LembarRaporData, NilaiRaporItem } from "@/types/wali-kelas/cetak";
import { EkskulItem, KokurikulerItem } from "@/actions/wali-kelas";

function getFaseKurikulumMerdeka(tingkat: number): string {
  if (tingkat <= 2) return "A";
  if (tingkat <= 4) return "B";
  if (tingkat <= 6) return "C";
  if (tingkat <= 9) return "D";
  if (tingkat === 10) return "E";
  return "F";
}

export default async function WaliKelasCetakPage(props: {
  searchParams?: Promise<{ kelasId?: string }>;
}) {
  const user = await requireUser();
  const sp = props.searchParams ? await props.searchParams : undefined;
  const requestedKelasId = sp?.kelasId;

  // 1. Cari kelas binaan
  let kelas = null;
  if (requestedKelasId) {
    kelas = await prisma.kelas.findFirst({
      where: {
        id: requestedKelasId,
        ...(user.role === "GURU"
          ? { waliKelasId: user.id }
          : user.sekolahId
          ? { sekolahId: user.sekolahId }
          : {}),
      },
      include: {
        waliKelas: true,
        sekolah: true,
      },
    });
  }

  if (!kelas) {
    kelas = await prisma.kelas.findFirst({
      where: { waliKelasId: user.id },
      include: {
        waliKelas: true,
        sekolah: true,
      },
    });
  }

  if (
    !kelas &&
    (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN" || user.role === "SUPER_ADMIN")
  ) {
    kelas = await prisma.kelas.findFirst({
      where: user.sekolahId ? { sekolahId: user.sekolahId } : undefined,
      include: {
        waliKelas: true,
        sekolah: true,
      },
    });
  }

  if (!kelas) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertCircleIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-zinc-900 font-poppins">
          Belum Ditugaskan Sebagai Wali Kelas
        </h2>
        <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">
          Akun Anda belum terdaftar sebagai wali kelas untuk rombel aktif. Silakan hubungi Administrator Sekolah.
        </p>
      </div>
    );
  }

  // 2. Ambil data sekolah
  const sekolahData =
    kelas.sekolah ||
    (await prisma.sekolah.findFirst({
      where: user.sekolahId ? { id: user.sekolahId } : undefined,
    }));

  const sekolah = {
    nama: sekolahData?.nama || "SDN 7 Simeulue Timur",
    npsn: sekolahData?.npsn || "10203040",
    alamat: sekolahData?.alamat || "Jln. Ibnu Aban Desa Air Dingin",
    kepalaSekolah: sekolahData?.kepalaSekolah || "SYARIFAH RADHIAH, S.Pd.I",
    nipKepsek: sekolahData?.nipKepsek || "197110201994102001",
    kecamatan: "Kecamatan Simeulue Timur",
    kabupatenKota: "Kabupaten Simeulue",
    provinsi: "Provinsi ACEH",
  };

  // 3. Ambil periode akademik aktif
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      ...(user.sekolahId ? { sekolahId: user.sekolahId } : {}),
      isAktif: true,
    },
  });

  const tahunAjaran = periodeAktif?.tahunAjaran || "2026/2027";
  const semester = periodeAktif?.semester || 1;
  const tempatCetak = periodeAktif?.tempatCetak || "Air Dingin";
  const tanggalCetakFormatted = periodeAktif?.tanggalCetak
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(periodeAktif.tanggalCetak))
    : "20 Juni 2026";

  // 4. Ambil daftar mapel yang diajarkan di kelas ini pada semester aktif
  const pengampuList = await prisma.pengampu.findMany({
    where: {
      kelasId: kelas.id,
      tahunAjaran,
      OR: [{ semester: 0 }, { semester }],
    },
    include: {
      mapel: true,
    },
    orderBy: {
      mapel: { kode: "asc" },
    },
  });

  // 5. Ambil data Tujuan Pembelajaran (TP) yang diinput guru untuk tingkat kelas dan semester ini
  const allTujuanPembelajaran = await prisma.tujuanPembelajaran.findMany({
    where: {
      tingkat: kelas.tingkat,
      semester,
    },
    orderBy: { kode: "asc" },
  });

  // 6. Ambil master template rapor untuk kelas ini (Tema P5, Kebiasaan, Saran)
  const masterTemplates = await prisma.templateRapor.findMany({
    where: {
      kelasId: kelas.id,
      tahunAjaran,
      semester,
    },
    orderBy: { urutan: "asc" },
  });

  const masterTemaP5 = masterTemplates.filter((t) => t.kategori === "TEMA_P5");
  const masterKebiasaan = masterTemplates.filter((t) => t.kategori === "KEBIASAAN");
  const masterSaran = masterTemplates.filter((t) => t.kategori === "SARAN_WALI");

  // 7. Ambil seluruh siswa beserta nilai dan data pelengkap
  const siswaList = await prisma.siswa.findMany({
    where: { kelasId: kelas.id },
    include: {
      nilai: {
        where: {
          tahunAjaran,
          semester,
        },
        include: {
          mapel: true,
        },
      },
      raporPelengkap: {
        where: {
          tahunAjaran,
          semester,
        },
      },
    },
    orderBy: { nama: "asc" },
  });

  const fase = getFaseKurikulumMerdeka(kelas.tingkat);
  const waliKelasNama = kelas.waliKelas?.name || user.name;
  const waliKelasNip = (kelas.waliKelas as any)?.nip || (user as any)?.nip || null;

  // 8. Hitung total nilai per siswa untuk menentukan peringkat di kelas
  const totalPerSiswa = siswaList.map((s) => {
    let sum = 0;
    pengampuList.forEach((pmp) => {
      const n = s.nilai.find((item) => item.mapelId === pmp.mapelId);
      sum += n?.nilaiAkhir || 0;
    });
    return { id: s.id, total: sum };
  });

  // Urutkan siswa berdasarkan total nilai tertinggi
  const sortedRanking = [...totalPerSiswa].sort((a, b) => b.total - a.total);

  // 9. Format data lembar rapor per siswa
  const raporList: LembarRaporData[] = siswaList.map((s) => {
    const p = s.raporPelengkap[0];

    // Ekstrakurikuler yang tersimpan
    let ekskulParsed: EkskulItem[] = [];
    if (p && p.ekskul) {
      try {
        ekskulParsed = JSON.parse(p.ekskul);
      } catch (e) {
        ekskulParsed = [];
      }
    }

    // Kokurikuler yang tersimpan
    let kokurikulerParsed: KokurikulerItem[] = [];
    if (p && p.kokurikuler) {
      try {
        kokurikulerParsed = JSON.parse(p.kokurikuler);
      } catch (e) {
        kokurikulerParsed = [];
      }
    }

    // Jika belum ada data kokurikuler yang tersimpan spesifik per siswa tapi ada master tema P5 di kelas ini
    let finalKokurikuler = kokurikulerParsed;
    if (finalKokurikuler.length === 0 && masterTemaP5.length > 0) {
      finalKokurikuler = masterTemaP5.map((t) => {
        const cleanTema = t.teks
          .replace(/^Tema\s*\d+\s*:\s*/i, "")
          .replace(/[()]/g, "")
          .trim();
        return {
          tema: t.teks,
          deskripsi: `${s.nama.toUpperCase()} Sangat Baik dalam keimanan dan ketakwaan terhadap Tuhan YME dan Perlu Bimbingan dalam kesehatan pada kegiatan ${cleanTema}`,
        };
      });
    }

    // Kebiasaan Karakter
    let finalKebiasaan = p?.kebiasaanKarakter?.trim() || null;
    if (!finalKebiasaan && masterKebiasaan.length > 0) {
      finalKebiasaan = `${s.nama.toUpperCase()} ${masterKebiasaan[0].teks}`;
    }

    // Catatan / Saran Wali Kelas
    let finalCatatanWali = p?.catatanWali?.trim() || null;
    if (!finalCatatanWali && masterSaran.length > 0) {
      finalCatatanWali = masterSaran[0].teks;
    }

    // Peringkat siswa saat ini (1-indexed)
    const peringkatIndex = sortedRanking.findIndex((r) => r.id === s.id);
    const peringkat = peringkatIndex >= 0 ? peringkatIndex + 1 : 1;

    // Bangun daftar nilai berdasarkan pengampu mapel & Tujuan Pembelajaran guru
    const nilaiList: NilaiRaporItem[] = pengampuList.map((pmp) => {
      const n = s.nilai.find((item) => item.mapelId === pmp.mapelId);
      const nilaiAkhir = n?.nilaiAkhir || 0;

      // JANGAN ADA DEFAULT: Jika siswa belum memiliki nilai (> 0), kosongkan capaian kompetensi
      if (!n || nilaiAkhir <= 0) {
        return {
          mapelKode: pmp.mapel.kode,
          mapelNama: pmp.mapel.nama,
          isMulok: pmp.mapel.isMulok,
          nilaiAkhir: 0,
          capaianKompetensi: undefined,
          capaianTinggi: undefined,
          capaianRendah: undefined,
        };
      }

      // Cari TP guru untuk mata pelajaran ini
      const mapelTPs = allTujuanPembelajaran.filter(
        (tp) => tp.mapelId === pmp.mapelId
      );

      let capaianTinggi = "";
      let capaianRendah = "";

      // Cek apakah guru mencentang TP spesifik (format di form input guru: "TP Tercapai: TP 1, TP 2")
      const catatanStr = n?.catatan?.trim() || "";
      if (catatanStr.startsWith("TP Tercapai:")) {
        const achievedCodes = catatanStr
          .replace("TP Tercapai:", "")
          .split(",")
          .map((c) => c.trim().toLowerCase());

        const achievedTPs = mapelTPs.filter((tp) =>
          achievedCodes.includes(tp.kode.toLowerCase())
        );
        const unachievedTPs = mapelTPs.filter(
          (tp) => !achievedCodes.includes(tp.kode.toLowerCase())
        );

        if (achievedTPs.length > 0) {
          capaianTinggi = `${s.nama.toUpperCase()} menunjukkan penguasaan yang sangat baik dalam ${achievedTPs[0].deskripsi}`;
        }
        if (achievedTPs.length > 1) {
          capaianRendah = `${s.nama.toUpperCase()} menunjukkan penguasaan yang baik dalam ${achievedTPs[1].deskripsi}`;
        } else if (unachievedTPs.length > 0) {
          capaianRendah = `${s.nama.toUpperCase()} perlu bimbingan dalam ${unachievedTPs[0].deskripsi}`;
        }
      } else if (catatanStr.length > 0) {
        // Jika guru menuliskan catatan manual langsung
        const parts = catatanStr.split("\n").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          capaianTinggi = parts[0];
          capaianRendah = parts[1];
        } else {
          capaianTinggi = parts[0];
        }
      }

      return {
        mapelKode: pmp.mapel.kode,
        mapelNama: pmp.mapel.nama,
        isMulok: pmp.mapel.isMulok,
        nilaiAkhir,
        capaianKompetensi:
          !catatanStr.startsWith("TP Tercapai:") && catatanStr.length > 0
            ? catatanStr
            : undefined,
        capaianTinggi: capaianTinggi || undefined,
        capaianRendah: capaianRendah || undefined,
      };
    });

    return {
      sekolah: {
        nama: sekolah.nama,
        npsn: sekolah.npsn,
        alamat: sekolah.alamat,
        kepalaSekolah: sekolah.kepalaSekolah,
        nipKepsek: sekolah.nipKepsek,
        kecamatan: sekolah.kecamatan,
        kabupatenKota: sekolah.kabupatenKota,
        provinsi: sekolah.provinsi,
      },
      siswa: {
        id: s.id,
        nama: s.nama,
        nisn: s.nisn,
        nis: s.nis,
        jenisKelamin: s.jenisKelamin,
      },
      kelas: {
        nama: kelas.nama,
        tingkat: kelas.tingkat,
        fase,
        totalSiswa: siswaList.length,
      },
      periode: {
        tahunAjaran,
        semester,
        tempatCetak,
        tanggalCetak: tanggalCetakFormatted,
      },
      waliKelas: {
        nama: waliKelasNama,
        nip: waliKelasNip,
      },
      nilaiList,
      pelengkap: {
        sakit: p?.sakit ?? 0,
        izin: p?.izin ?? 0,
        alpa: p?.alpa ?? 0,
        catatanWali: finalCatatanWali,
        ekskul: ekskulParsed,
        kokurikuler: finalKokurikuler.length > 0 ? finalKokurikuler : undefined,
        kebiasaanKarakter: finalKebiasaan,
        statusKelulusan: p?.statusKenaikan ?? null,
      },
      rekapitulasi: {
        peringkat,
        totalSiswa: siswaList.length,
      },
    };
  });

  return (
    <CetakRaporClient
      sekolahNama={sekolah.nama}
      kelasNama={kelas.nama}
      tingkat={kelas.tingkat}
      tahunAjaran={tahunAjaran}
      semester={semester}
      raporList={raporList}
    />
  );
}
