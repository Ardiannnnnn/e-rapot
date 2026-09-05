import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import FormInputNilai from "./form-input-nilai";

interface PageProps {
  searchParams: Promise<{
    kelasId?: string;
    mapelId?: string;
    semester?: string;
    tahunAjaran?: string;
  }>;
}

export default async function GuruSiswaDanNilaiPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  // 1. Ambil Periode Akademik Aktif di Sekolah
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      sekolahId: user.sekolahId || undefined,
      isAktif: true,
    },
  });

  // Tentukan Tahun Ajaran dan Semester yang sedang dilihat
  const selectedTahunAjaran = params.tahunAjaran || periodeAktif?.tahunAjaran || "2026/2027";
  const selectedSemester = params.semester ? Number(params.semester) : (periodeAktif?.semester || 1);

  // Ambil data status periode yang dipilih (apakah BUKA atau KUNCI)
  const periodeSelected = await prisma.periodeAkademik.findFirst({
    where: {
      sekolahId: user.sekolahId || undefined,
      tahunAjaran: selectedTahunAjaran,
      semester: selectedSemester,
    },
  });
  const isLocked = periodeSelected?.statusNilai === "KUNCI";

  // 2. Ambil penugasan rombel dan mapel yang diampu oleh guru ini pada periode bersangkutan
  const daftarPengampu = await prisma.pengampu.findMany({
    where: {
      guruId: user.id,
      tahunAjaran: selectedTahunAjaran,
      OR: [
        { semester: 0 },
        { semester: selectedSemester },
      ],
    },
    include: {
      kelas: true,
      mapel: true,
    },
    orderBy: [
      { kelas: { tingkat: "asc" } },
      { kelas: { nama: "asc" } },
      { mapel: { nama: "asc" } },
    ],
  });

  // Jika guru belum memiliki penugasan
  if (daftarPengampu.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-3">
            📋
          </div>
          <h2 className="text-lg font-bold text-zinc-900 font-poppins">
            Belum Ada Penugasan Mengajar di Semester Ini
          </h2>
          <p className="text-sm text-zinc-600 mt-1 max-w-md mx-auto">
            Anda belum ditugaskan mengampu kelas pada Tahun Ajaran {selectedTahunAjaran} Semester {selectedSemester === 1 ? "Ganjil" : "Genap"}.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              href={`/guru/siswa?semester=${selectedSemester === 1 ? 2 : 1}`}
              className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-700 text-xs font-semibold hover:bg-stone-50 transition"
            >
              Lihat Semester {selectedSemester === 1 ? "Genap (2)" : "Ganjil (1)"}
            </Link>
            <Link
              href="/guru"
              className="px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Tentukan penugasan mana yang sedang aktif dilihat
  const activePengampu =
    daftarPengampu.find(
      (p) => p.kelasId === params.kelasId && p.mapelId === params.mapelId
    ) || daftarPengampu[0];

  // 4. Ambil data siswa di rombel aktif tersebut
  const siswaList = await prisma.siswa.findMany({
    where: {
      kelasId: activePengampu.kelasId,
    },
    orderBy: {
      nama: "asc",
    },
  });

  // 5. Ambil data nilai yang sudah tersimpan untuk mapel, tahun ajaran, dan semester ini
  const nilaiList = await prisma.nilai.findMany({
    where: {
      mapelId: activePengampu.mapelId,
      tahunAjaran: selectedTahunAjaran,
      semester: selectedSemester,
      siswaId: {
        in: siswaList.map((s) => s.id),
      },
    },
  });

  // 6. Ambil data Tujuan Pembelajaran (TP) untuk mapel, tingkat kelas, dan semester aktif
  const tpList = await prisma.tujuanPembelajaran.findMany({
    where: {
      mapelId: activePengampu.mapelId,
      tingkat: activePengampu.kelas.tingkat,
      semester: selectedSemester,
    },
    orderBy: {
      kode: "asc",
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner Halaman */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
            Penilaian Siswa • Kurikulum Merdeka
          </span>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-bold backdrop-blur-sm border border-emerald-300/30 font-mono">
            T.A. {selectedTahunAjaran} • Semester {selectedSemester === 1 ? "1 (Ganjil)" : "2 (Genap)"}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-poppins">
          Data Siswa & Input Nilai Mata Pelajaran
        </h1>
        <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
          Kelola data nilai sumatif (Tugas, UTS, UAS) dan ketercapaian Tujuan Pembelajaran (TP) untuk seluruh siswa pada rombongan belajar yang Anda ampu.
        </p>
      </div>

      {/* Form Interaktif Input Nilai */}
      <FormInputNilai
        daftarPengampu={daftarPengampu}
        activePengampu={activePengampu}
        siswaList={siswaList}
        nilaiList={nilaiList}
        tpList={tpList}
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
        isLocked={isLocked}
      />
    </div>
  );
}
