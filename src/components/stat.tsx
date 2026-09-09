import { prisma } from "@/lib/prisma";

export default async function Stat() {
  let totalSiswa = 0;
  let totalKelas = 0;
  let totalMapel = 0;
  let totalGuru = 0;

  let hasConnectionError = false;

  try {
    const results = await Promise.all([
      prisma.siswa.count(),
      prisma.kelas.count(),
      prisma.mataPelajaran.count(),
      prisma.user.count({
        where: {
          role: {
            in: ["GURU", "WALI_KELAS"],
          },
        },
      }),
    ]);
    totalSiswa = results[0];
    totalKelas = results[1];
    totalMapel = results[2];
    totalGuru = results[3];
  } catch (error: any) {
    console.warn("Gagal memuat statistik landing page pada percobaan 1 (cold start DB):", error?.message);
    // Coba sekali lagi jika cold-start database baru saja bangun
    try {
      totalSiswa = await prisma.siswa.count();
      totalKelas = await prisma.kelas.count();
      totalMapel = await prisma.mataPelajaran.count();
      totalGuru = await prisma.user.count({
        where: {
          role: {
            in: ["GURU", "WALI_KELAS"],
          },
        },
      });
    } catch (retryErr: any) {
      console.error("Gagal retry statistik landing page:", retryErr?.message);
      hasConnectionError = true;
    }
  }

  return (
    <div className="mt-16 w-full space-y-4">
      {hasConnectionError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-left shadow-xs transition-all animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <p className="text-xs font-medium text-amber-900">
              Ada masalah dengan koneksi, silakan coba lagi.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
          >
            <span>↻</span>
            <span>Coba Lagi</span>
          </a>
        </div>
      )}

      <section className="w-full grid grid-cols-2 md:grid-cols-4 gap-3.5 font-mono">
                <div className="p-5 text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
                        Siswa Terdata
                    </span>
                    <div className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332]">
                        {totalSiswa}
                    </div>
                    <span className="text-[11px] text-zinc-600 mt-1 block">Peserta didik</span>
                </div>

                <div className="p-5 text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
                        Kelas 
                    </span>
                    <div className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332]">
                        {totalKelas}
                    </div>
                    <span className="text-[11px] text-zinc-600 mt-1 block">Ruang kelas</span>
                </div>

                <div className=" p-5 text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
                        Pendidik
                    </span>
                    <div className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332]">
                        {totalGuru}
                    </div>
                    <span className="text-[11px] text-zinc-600 mt-1 block">Wali kelas</span>
                </div>

                <div className="p-5 text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
                        Mata Pelajaran
                    </span>
                    <div className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332]">
                        {totalMapel}
                    </div>
                    <span className="text-[11px] text-zinc-600 mt-1 block">Pembelajaran</span>
                </div>
      </section>
    </div>
  );
}