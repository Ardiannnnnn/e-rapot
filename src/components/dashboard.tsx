import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();

  const [totalSiswa, totalKelas, totalMapel] = await Promise.all([
    prisma.siswa.count(),
    prisma.kelas.count(),
    prisma.mataPelajaran.count(),
  ]);

  return (
    <div>
      {/* Banner Sapaan */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-3 backdrop-blur-sm">
            Tahun Ajaran 2026/2027 • Semester Ganjil
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins">Halo, {user.name}! 👋</h2>
          <p className="mt-1.5 text-sm text-emerald-100/90 max-w-xl">
            Selamat datang kembali di portal administrasi rekapitulasi nilai dan capaian hasil belajar siswa.
          </p>
        </div>
      </div>

      {/* Kartu Ringkasan Statistik */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Siswa Terdata
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalSiswa}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Peserta didik aktif
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Ruang Kelas
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalKelas}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Rombongan belajar
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
            Kurikulum pembelajaran
          </span>
        </div>
      </div>

      {/* Modul Navigasi Cepat Berdasarkan Role */}
      <h3 className="mt-10 text-lg font-bold text-zinc-900 font-poppins">Aksi Cepat</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {user.role === "ADMIN" && (
          <>
            <a
              href="/dashboard/siswa"
              className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm cursor-pointer group block"
            >
              <h4 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
                Kelola Data Siswa
              </h4>
              <p className="mt-1 text-xs text-zinc-600">
                Tambah, perbarui NISN, dan mutasi kelas siswa.
              </p>
            </a>
            <a
              href="/dashboard/kelas"
              className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm cursor-pointer group block"
            >
              <h4 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
                Distribusi Mapel & Kelas
              </h4>
              <p className="mt-1 text-xs text-zinc-600">
                Pengaturan jadwal dan penetapan guru mata pelajaran.
              </p>
            </a>
          </>
        )}

        {(user.role === "WALI_KELAS" || user.role === "GURU") && (
          <a
            href="/dashboard/nilai"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm cursor-pointer group block"
          >
            <h4 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Input Nilai Siswa
            </h4>
            <p className="mt-1 text-xs text-zinc-600">
              Isi nilai tugas, PTS, dan PAS semester berjalan.
            </p>
          </a>
        )}

        {user.role === "WALI_KELAS" && (
          <a
            href="/dashboard/cetak"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm cursor-pointer group block"
          >
            <h4 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Cetak Rapor Siswa
            </h4>
            <p className="mt-1 text-xs text-zinc-600">
              Generate rekapitulasi nilai dan lembar raport PDF.
            </p>
          </a>
        )}
      </div>
    </div>
  );
}