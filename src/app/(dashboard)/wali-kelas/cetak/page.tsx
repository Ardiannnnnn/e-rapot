import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import CetakRaporClient from "./cetak-rapor-client";
import { AlertCircleIcon } from "@/components/shared/icons";
import { LembarRaporData } from "./lembar-rapor";
import { EkskulItem } from "@/actions/wali-kelas";

function getFaseKurikulumMerdeka(tingkat: number): string {
  if (tingkat <= 2) return "Fase A";
  if (tingkat <= 4) return "Fase B";
  if (tingkat <= 6) return "Fase C";
  if (tingkat <= 9) return "Fase D";
  if (tingkat === 10) return "Fase E";
  return "Fase F";
}

export default async function WaliKelasCetakPage() {
  const user = await requireUser();

  // 1. Cari kelas binaan
  let kelas = await prisma.kelas.findFirst({
    where: { waliKelasId: user.id },
    include: {
      waliKelas: true,
      sekolah: true,
    },
  });

  if (!kelas && (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
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
  const sekolah =
    kelas.sekolah ||
    (await prisma.sekolah.findFirst({
      where: user.sekolahId ? { id: user.sekolahId } : undefined,
    })) || {
      nama: "SD NEGERI CONTOH 01",
      npsn: "10203040",
      alamat: "Jl. Pendidikan No. 45, Jakarta",
      kepalaSekolah: "Drs. H. Mulyadi, M.Pd.",
      nipKepsek: "196805121992031004",
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
  const tempatCetak = periodeAktif?.tempatCetak || "Jakarta";
  const tanggalCetakFormatted = periodeAktif?.tanggalCetak
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(periodeAktif.tanggalCetak))
    : "20 Desember 2026";

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

  // 5. Ambil seluruh siswa beserta nilai dan data pelengkap
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

  // 6. Format data lembar rapor per siswa
  const raporList: LembarRaporData[] = siswaList.map((s) => {
    const p = s.raporPelengkap[0];
    let ekskulParsed: EkskulItem[] = [];
    if (p && p.ekskul) {
      try {
        ekskulParsed = JSON.parse(p.ekskul);
      } catch (e) {
        ekskulParsed = [];
      }
    }

    // Bangun daftar nilai berdasarkan pengampu mapel
    const nilaiList = pengampuList.map((pmp) => {
      const n = s.nilai.find((item) => item.mapelId === pmp.mapelId);
      const nilaiAkhir = n?.nilaiAkhir || 0;

      let capaianKompetensi = n?.catatan?.trim() || "";
      if (!capaianKompetensi) {
        if (nilaiAkhir >= 88) {
          capaianKompetensi = `Menunjukkan penguasaan materi yang sangat baik dan melampaui seluruh kriteria tujuan pembelajaran ${pmp.mapel.nama}.`;
        } else if (nilaiAkhir >= 75) {
          capaianKompetensi = `Menunjukkan pemahaman yang baik dan konsisten dalam mencapai tujuan pembelajaran ${pmp.mapel.nama}.`;
        } else if (nilaiAkhir > 0) {
          capaianKompetensi = `Cukup menguasai kompetensi dasar, perlu penguatan dan bimbingan lebih lanjut pada beberapa materi ${pmp.mapel.nama}.`;
        } else {
          capaianKompetensi = `Nilai capaian kompetensi belum dimasukkan oleh guru mata pelajaran.`;
        }
      }

      return {
        mapelKode: pmp.mapel.kode,
        mapelNama: pmp.mapel.nama,
        nilaiAkhir,
        capaianKompetensi,
      };
    });

    return {
      sekolah: {
        nama: sekolah.nama,
        npsn: sekolah.npsn,
        alamat: sekolah.alamat,
        kepalaSekolah: sekolah.kepalaSekolah,
        nipKepsek: sekolah.nipKepsek,
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
      },
      periode: {
        tahunAjaran,
        semester,
        tempatCetak,
        tanggalCetak: tanggalCetakFormatted,
      },
      waliKelas: {
        nama: waliKelasNama,
        nip: null,
      },
      nilaiList,
      pelengkap: {
        sakit: p?.sakit ?? 0,
        izin: p?.izin ?? 0,
        alpa: p?.alpa ?? 0,
        catatanWali: p?.catatanWali ?? null,
        ekskul: ekskulParsed,
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
