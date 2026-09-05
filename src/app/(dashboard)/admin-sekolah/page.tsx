import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await requireUser();

  const [totalSiswa, totalKelas, totalMapel, totalGuru, periodeAktif] = await Promise.all([
    prisma.siswa.count(),
    prisma.kelas.count(),
    prisma.mataPelajaran.count(),
    prisma.user.count({ where: { role: { in: ["GURU", "WALI_KELAS"] } } }),
    prisma.periodeAkademik.findFirst({
      where: {
        sekolahId: user.sekolahId || undefined,
        isAktif: true,
      },
    }),
  ]);

  const currentTahunAjaran = periodeAktif?.tahunAjaran || "2026/2027";
  const currentSemester = periodeAktif?.semester || 1;

  return (
    <div className="space-y-8">
      {/* Banner Sapaan */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
              Panel Administrator Sekolah
            </span>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-bold backdrop-blur-sm border border-emerald-300/30 font-mono">
              T.A. {currentTahunAjaran} • Semester {currentSemester === 1 ? "1 (Ganjil)" : "2 (Genap)"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
            Selamat Datang, {user.name}! 🏛️
          </h1>
          <p className="mt-1.5 text-sm text-emerald-100/90 max-w-xl">
            Pusat konfigurasi data master, rombel kelas, akun tenaga pendidik, distribusi jadwal mengajar, dan kalender rapor sekolah.
          </p>
        </div>
      </div>

      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Peserta Didik
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalSiswa}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Siswa aktif terdaftar
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Rombel Kelas
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalKelas}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Tingkat 1 s/d 6
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Mata Pelajaran
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalMapel}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Kurikulum Merdeka SD
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Tenaga Pendidik
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalGuru}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Guru & Wali Kelas
          </span>
        </div>
      </div>

      {/* Navigasi Modul Admin Sekolah */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 font-poppins">Modul Pengelolaan Sekolah</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin-sekolah/tahun-ajaran"
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-xs group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono mb-2 inline-block">
              Kalender Rapor
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Tahun Ajaran & Semester
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Tentukan semester aktif berjalan, kunci/buka input nilai guru, dan tanggal cetak rapor.
            </p>
          </Link>

          <Link
            href="/admin-sekolah/pendidik"
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-xs group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono mb-2 inline-block">
              Pendidik & Jadwal
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Pendidik & Penugasan Mengajar
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Buat akun guru baru dan plotting penugasan mengajar per kelas, mapel, serta semester.
            </p>
          </Link>

          <Link
            href="/admin-sekolah/siswa"
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-xs group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono mb-2 inline-block">
              Peserta Didik
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Data Siswa & Mutasi Rombel
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Pencarian NISN/NIS, tambah biodata peserta didik baru, dan mutasi perpindahan rombel kelas.
            </p>
          </Link>

          <Link
            href="/admin-sekolah/kelas"
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-xs group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono mb-2 inline-block">
              Rombongan Belajar
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Master Kelas & Wali Kelas
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Atur rombongan belajar tingkat 1-6 dan tetapkan guru wali kelas untuk setiap rombel.
            </p>
          </Link>

          <Link
            href="/admin-sekolah/mapel"
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-xs group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono mb-2 inline-block">
              Kurikulum
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Master Mata Pelajaran
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Daftar mata pelajaran wajib nasional, muatan lokal, dan mata pelajaran pilihan.
            </p>
          </Link>

          <Link
            href="/admin-sekolah/profil"
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-xs group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-zinc-700 border border-stone-200 font-mono mb-2 inline-block">
              Lembaga & Kepsek
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Profil Sekolah & Kepala Sekolah
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Konfigurasi nama sekolah, NPSN, alamat, dan pejabat Kepala Sekolah penandatangan rapor.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
