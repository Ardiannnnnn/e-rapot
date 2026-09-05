import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await requireUser();

  const [totalSiswa, totalKelas, totalMapel, totalGuru] = await Promise.all([
    prisma.siswa.count(),
    prisma.kelas.count(),
    prisma.mataPelajaran.count(),
    prisma.user.count({ where: { role: { in: ["GURU", "WALI_KELAS"] } } }),
  ]);

  return (
    <div className="space-y-8">
      {/* Banner Sapaan */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-3 backdrop-blur-sm">
            Panel Administrator Sekolah • T.A. 2026/2027 Ganjil
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
            Selamat Datang, {user.name}!
          </h1>
          <p className="mt-1.5 text-sm text-emerald-100/90 max-w-xl">
            Pusat konfigurasi data master, rombel kelas, akun tenaga pendidik, dan kalender rapor sekolah.
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
            Ruang rombongan belajar
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

      {/* Navigasi Modul Master */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 font-poppins">Kelola Data Master Sekolah</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin-sekolah/siswa"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono mb-2 inline-block">
              Excel Import
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Data Peserta Didik
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Impor massal dari spreadsheet, update NISN, dan mutasi kelas.
            </p>
          </Link>

          <Link
            href="/admin-sekolah/kelas"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono mb-2 inline-block">
              Rombel
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Kelas & Penetapan Wali
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Atur rombongan belajar tingkat 1-6 dan tetapkan guru wali kelas.
            </p>
          </Link>

          <Link
            href="/admin-sekolah/mapel"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono mb-2 inline-block">
              Kurikulum
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Master Mata Pelajaran
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Daftar mata pelajaran wajib, muatan lokal, dan alokasi fase belajar.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
