import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export default async function WaliKelasDashboardPage() {
  const user = await requireUser();

  // Ambil data rombel yang dibina
  const kelas = await prisma.kelas.findFirst({
    where: { waliKelasId: user.id },
    include: {
      siswa: true,
    },
  });

  const totalSiswaKelas = kelas?.siswa.length || 0;
  const totalMapel = await prisma.mataPelajaran.count();

  return (
    <div className="space-y-8">
      {/* Banner Sapaan */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-3 backdrop-blur-sm">
            Portal Wali Kelas • {kelas ? `Kelas ${kelas.nama}` : "Rombel Binaan"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
            Semangat Mengajar, {user.name}! 📚
          </h1>
          <p className="mt-1.5 text-sm text-emerald-100/90 max-w-xl">
            Kelola rekapitulasi nilai, capaian kompetensi, presensi, catatan sikap, dan cetak rapor peserta didik kelas Anda.
          </p>
        </div>
      </div>

      {/* Kartu Ringkasan Kelas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Peserta Didik Binaan
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalSiswaKelas}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Siswa aktif di {kelas ? `Kelas ${kelas.nama}` : "kelas ini"}
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Mata Pelajaran Kelas
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalMapel}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Komponen nilai kurikulum
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Status Rapor Kelas
          </span>
          <p className="mt-2 text-xl font-bold tracking-tight text-emerald-700 font-mono">
            Siap Dikompilasi
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Tahun Ajaran 2026/2027 Ganjil
          </span>
        </div>
      </div>

      {/* Menu Aksi Cepat Wali Kelas */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 font-poppins">Alur Kerja Penilaian & Rapor</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/wali-kelas/siswa"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono mb-2 inline-block">
              Langkah 1
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Data Siswa Binaan
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Verifikasi NIS, NISN, dan kelengkapan identitas peserta didik.
            </p>
          </Link>

          <Link
            href="/wali-kelas/pelengkap"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono mb-2 inline-block">
              Langkah 2
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Presensi & Ekstrakurikuler
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Input ketidakhadiran (S/I/A), catatan perkembangan, dan predikat ekskul.
            </p>
          </Link>

          <Link
            href="/wali-kelas/cetak"
            className="rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-[#1b4332] hover:shadow-sm group block"
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono mb-2 inline-block">
              Langkah 3 • Output
            </span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-[#1b4332] transition-colors">
              Cetak Rapor (Bulk PDF)
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Preview lembar rapor dan generate file PDF siap cetak satu kelas.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
