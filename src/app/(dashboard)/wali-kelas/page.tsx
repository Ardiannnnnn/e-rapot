import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import {
  UsersIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  SmileIcon
} from "@/components/shared/icons";

export default function WaliKelasDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <WaliKelasDashboardContent />
    </Suspense>
  );
}

async function WaliKelasDashboardContent() {
  const user = await requireUser();

  // 1. Cari kelas binaan wali kelas (atau kelas pertama jika Admin)
  let kelas = await prisma.kelas.findFirst({
    where: { waliKelasId: user.id },
    include: {
      waliKelas: true,
    },
  });

  if (!kelas && (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
    kelas = await prisma.kelas.findFirst({
      where: user.sekolahId ? { sekolahId: user.sekolahId } : undefined,
      include: {
        waliKelas: true,
      },
    });
  }

  // 2. Ambil Periode Akademik Aktif
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      ...(user.sekolahId ? { sekolahId: user.sekolahId } : {}),
      isAktif: true,
    },
  });

  const tahunAjaran = periodeAktif?.tahunAjaran || "2026/2027";
  const semester = periodeAktif?.semester || 1;
  const isKunci = periodeAktif?.statusNilai === "KUNCI";

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
          Akun Anda saat ini belum dihubungkan sebagai Wali Kelas pada rombel manapun. Silakan hubungi Administrator Sekolah untuk mengatur penugasan Wali Kelas Anda di menu Master Kelas.
        </p>
      </div>
    );
  }

  // 3. Ambil data siswa di kelas ini beserta nilai dan data pelengkap semester ini
  const siswaList = await prisma.siswa.findMany({
    where: { kelasId: kelas.id },
    include: {
      nilai: {
        where: {
          tahunAjaran,
          semester,
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

  // 4. Ambil mata pelajaran yang diampu di kelas ini pada tahun ajaran & semester aktif
  const pengampuList = await prisma.pengampu.findMany({
    where: {
      kelasId: kelas.id,
      tahunAjaran,
      OR: [{ semester: 0 }, { semester }],
    },
    include: {
      mapel: true,
      guru: true,
    },
    orderBy: {
      mapel: { kode: "asc" },
    },
  });

  const totalSiswa = siswaList.length;
  const totalMapel = pengampuList.length;

  // 5. Analisis Kelengkapan Nilai per Mata Pelajaran
  const mapelProgress = pengampuList.map((p) => {
    // Berapa siswa yang sudah ada nilainya dan nilaiAkhir > 0
    let gradedCount = 0;
    siswaList.forEach((s) => {
      const n = s.nilai.find((item) => item.mapelId === p.mapelId);
      if (n && n.nilaiAkhir > 0) {
        gradedCount++;
      }
    });

    const percent = totalSiswa > 0 ? Math.round((gradedCount / totalSiswa) * 100) : 0;
    return {
      mapelId: p.mapelId,
      kode: p.mapel.kode,
      nama: p.mapel.nama,
      guruNama: p.guru.name,
      gradedCount,
      totalSiswa,
      percent,
      isComplete: gradedCount === totalSiswa && totalSiswa > 0,
    };
  });

  const mapelLengkapCount = mapelProgress.filter((m) => m.isComplete).length;
  const siswaPresensiLengkap = siswaList.filter(
    (s) => s.raporPelengkap.length > 0 && s.raporPelengkap[0].catatanWali
  ).length;

  const totalExpectedGrades = totalSiswa * totalMapel;
  const totalSubmittedGrades = mapelProgress.reduce((acc, curr) => acc + curr.gradedCount, 0);
  const overallGradePercentage =
    totalExpectedGrades > 0
      ? Math.round((totalSubmittedGrades / totalExpectedGrades) * 100)
      : 0;

  const isReadyToPrint =
    totalSiswa > 0 &&
    totalMapel > 0 &&
    overallGradePercentage === 100 &&
    siswaPresensiLengkap === totalSiswa;

  return (
    <div className="space-y-8">
      {/* Banner Sapaan Wali Kelas */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full">
            <div className="flex flex-wrap w-full items-center justify-between gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
                Portal Wali Kelas • Kelas {kelas.nama} (Tingkat {kelas.tingkat})
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
                Semester Aktif
              </span>
              {isKunci && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-semibold">
                  Nilai Terkunci
                </span>
              )}
            </div>
            <div className="w-full flex justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
                Halo, {user.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-medium">
                TA {tahunAjaran} Semester {semester === 1 ? "Ganjil" : "Genap"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kartu Ringkasan Kelas & Metrik Nilai */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Siswa Binaan
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <UsersIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 font-mono">
            {totalSiswa}
          </p>
          <span className="mt-1 block text-xs text-zinc-600">
            Peserta didik aktif di Kelas {kelas.nama}
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Mata Pelajaran
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <BookOpenIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 font-mono">
            {totalMapel}
          </p>
          <span className="mt-1 block text-xs text-zinc-600">
            {mapelLengkapCount} dari {totalMapel} mapel tuntas diinput
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Progres Nilai Masuk
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <CheckCircle2Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight text-emerald-800 font-mono">
              {overallGradePercentage}%
            </p>
            <span className="text-xs text-zinc-600 font-mono">
              ({totalSubmittedGrades}/{totalExpectedGrades})
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-700 rounded-full transition-all duration-500"
              style={{ width: `${overallGradePercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Presensi & Catatan
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <SmileIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 font-mono">
            {siswaPresensiLengkap}/{totalSiswa}
          </p>
          <span className="mt-1 block text-xs text-zinc-600">
            {siswaPresensiLengkap === totalSiswa
              ? "Semua siswa sudah terekap"
              : `${totalSiswa - siswaPresensiLengkap} siswa belum dilengkapi`}
          </span>
        </div>
      </div>

      {/* 3 Langkah Alur Kerja Wali Kelas */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-zinc-900 font-poppins mb-4">
          Alur Kerja Wali Kelas • Semester {semester === 1 ? "Ganjil" : "Genap"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/wali-kelas/siswa"
            className="rounded-xl border border-stone-200 p-4 transition-all hover:border-[#1b4332] hover:bg-stone-50/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                Langkah 1
              </span>
              <ArrowRightIcon className="h-4 w-4 text-zinc-600 group-hover:text-[#1b4332] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="mt-3 font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Data Siswa & Rekap Nilai
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Cek identitas NIPD/NISN dan rekapitulasi nilai akhir masing-masing siswa sekelas.
            </p>
          </Link>

          <Link
            href="/wali-kelas/pelengkap"
            className="rounded-xl border border-stone-200 p-4 transition-all hover:border-[#1b4332] hover:bg-stone-50/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                Langkah 2
              </span>
              <ArrowRightIcon className="h-4 w-4 text-zinc-600 group-hover:text-[#1b4332] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="mt-3 font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Presensi, Catatan & Ekskul
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Input ketidakhadiran (S/I/A), pesan motivasi karakter, dan predikat kegiatan ekstrakurikuler.
            </p>
          </Link>

          <Link
            href="/wali-kelas/cetak"
            className="rounded-xl border border-stone-200 p-4 transition-all hover:border-[#1b4332] hover:bg-stone-50/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                Langkah 3 • Output
              </span>
              <ArrowRightIcon className="h-4 w-4 text-zinc-600 group-hover:text-[#1b4332] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="mt-3 font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Cetak Rapor (Single & Bulk PDF)
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Pratinjau lembar rapor standar Kurikulum Merdeka dan cetak langsung atau export PDF.
            </p>
          </Link>
        </div>
      </div>

      {/* Tabel Status Kelengkapan Pengisian Nilai Per Mata Pelajaran */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 font-poppins">
              Status Kelengkapan Nilai Mata Pelajaran
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Pantau guru pengampu mata pelajaran yang sudah menginput nilai akhir siswa di Kelas {kelas.nama} untuk Semester {semester === 1 ? "Ganjil" : "Genap"}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-lg bg-stone-100 text-zinc-700 font-medium font-mono">
              {mapelLengkapCount}/{totalMapel} Mapel Lengkap
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">No</th>
                <th className="py-3.5 px-6">Mata Pelajaran</th>
                <th className="py-3.5 px-6">Guru Pengampu</th>
                <th className="py-3.5 px-6 text-center">Siswa Dinilai</th>
                <th className="py-3.5 px-6">Progres Pengisian</th>
                <th className="py-3.5 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {mapelProgress.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-600 text-xs">
                    Belum ada mata pelajaran yang diplotkan untuk Kelas {kelas.nama} pada semester ini.
                  </td>
                </tr>
              ) : (
                mapelProgress.map((m, idx) => (
                  <tr key={m.mapelId} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-6 text-xs text-zinc-600 font-mono">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-900">{m.nama}</div>
                      <span className="text-[11px] font-mono text-zinc-600">{m.kode}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-700 font-medium">
                      {m.guruNama}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block font-mono text-xs font-bold text-zinc-900">
                        {m.gradedCount} / {m.totalSiswa}
                      </span>
                    </td>
                    <td className="py-4 px-6 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${m.isComplete
                              ? "bg-emerald-700"
                              : m.percent > 0
                                ? "bg-amber-700"
                                : "bg-stone-200"
                              }`}
                            style={{ width: `${m.percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-zinc-600 w-9 text-right">
                          {m.percent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {m.isComplete ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2Icon className="h-3.5 w-3.5" />
                          Lengkap
                        </span>
                      ) : m.gradedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <ClockIcon className="h-3.5 w-3.5" />
                          Sebagian
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircleIcon className="h-3.5 w-3.5" />
                          Belum Ada
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
