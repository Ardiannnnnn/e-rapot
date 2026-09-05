import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export default async function GuruDashboardPage() {
  const user = await requireUser();

  // Ambil periode akademik yang sedang aktif di sekolah
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      sekolahId: user.sekolahId || undefined,
      isAktif: true,
    },
  });
  const currentSemester = periodeAktif?.semester || 1;
  const currentTahunAjaran = periodeAktif?.tahunAjaran || "2026/2027";

  // Ambil daftar kelas dan mapel yang spesifik diampu oleh guru pada semester aktif
  const daftarPengampu = await prisma.pengampu.findMany({
    where: {
      guruId: user.id,
      tahunAjaran: currentTahunAjaran,
      OR: [
        { semester: 0 },
        { semester: currentSemester },
      ],
    },
    include: {
      mapel: true,
      kelas: {
        include: {
          _count: {
            select: { siswa: true },
          },
        },
      },
    },
    orderBy: [
      { kelas: { tingkat: "asc" } },
      { kelas: { nama: "asc" } },
      { mapel: { nama: "asc" } },
    ],
  });

  // Hitung metrik spesifik guru
  const totalRombel = new Set(daftarPengampu.map((p) => p.kelasId)).size;
  const totalMapel = new Set(daftarPengampu.map((p) => p.mapelId)).size;
  const totalSiswa = daftarPengampu.reduce(
    (acc, curr) => acc + curr.kelas._count.siswa,
    0
  );

  return (
    <div className="space-y-8">
      {/* Banner Sapaan */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
              Portal Guru • Kurikulum Merdeka
            </span>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-bold backdrop-blur-sm border border-emerald-300/30 font-mono">
              T.A. {currentTahunAjaran} • Semester {currentSemester === 1 ? "1 (Ganjil)" : "2 (Genap)"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
            Selamat Bertugas, {user.name}! 📝
          </h1>
          <p className="mt-1.5 text-sm text-emerald-100/90 max-w-xl">
            Kelola penilaian capaian pembelajaran untuk setiap rombongan belajar dan mata pelajaran yang Anda ampu pada semester aktif ({currentSemester === 1 ? "Ganjil" : "Genap"}).
          </p>
        </div>
      </div>

      {/* Kartu Ringkasan Guru (Spesifik Pengampu) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Kelas / Rombel Diampu
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalRombel}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Rombongan belajar aktif di bawah bimbingan Anda
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Mata Pelajaran Diampu
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalMapel}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Mata pelajaran yang Anda pegang semester ini
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Total Siswa Terdaftar
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalSiswa}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Akumulasi siswa di kelas yang Anda ampu
          </span>
        </div>
      </div>

      {/* Daftar Kelas & Mata Pelajaran yang Diampu */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 font-poppins">
              Daftar Kelas & Mata Pelajaran yang Anda Ampu
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Pilih kelas dan mata pelajaran untuk memasukkan asesmen atau menyusun Tujuan Pembelajaran (TP).
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {daftarPengampu.length} Penugasan Aktif
          </span>
        </div>

        {daftarPengampu.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-3">
              📋
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Belum Ada Penugasan Mengajar
            </h3>
            <p className="text-xs text-zinc-600 mt-1 max-w-md mx-auto">
              Anda belum ditugaskan ke rombongan belajar atau mata pelajaran mana pun. Silakan hubungi <strong>Admin Sekolah</strong> untuk penetapan jadwal pengampu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {daftarPengampu.map((tugas) => (
              <div
                key={tugas.id}
                className="group relative rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition-all hover:border-[#1b4332] hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                      Kelas {tugas.kelas.nama}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-600">
                      T.A. {tugas.tahunAjaran}
                    </span>
                  </div>

                  <h3 className="font-bold text-zinc-900 text-base group-hover:text-[#1b4332] transition-colors">
                    {tugas.mapel.nama}
                  </h3>
                  <p className="text-xs font-mono text-zinc-600 mt-0.5">
                    Kode: {tugas.mapel.kode} • Tingkat {tugas.kelas.tingkat}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">👥</span>
                      <strong className="text-zinc-800 font-semibold">
                        {tugas.kelas._count.siswa}
                      </strong>{" "}
                      Siswa
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded font-medium">
                      Aktif
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
                  <Link
                    href={`/guru/tp?kelasId=${tugas.kelasId}&mapelId=${tugas.mapelId}`}
                    className="text-center rounded-lg border border-stone-200 bg-stone-50 py-1.5 text-xs font-medium text-zinc-700 hover:bg-stone-100 transition-colors"
                  >
                    Atur TP
                  </Link>
                  <Link
                    href={`/guru/siswa?kelasId=${tugas.kelasId}&mapelId=${tugas.mapelId}`}
                    className="text-center rounded-lg bg-[#1b4332] py-1.5 text-xs font-medium text-white hover:bg-[#143225] transition-colors shadow-xs"
                  >
                    Input Nilai
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
