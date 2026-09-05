import HeroActions from "./hero-actions";
import Stat from "./stat";

export default async function Main() {
    return (
        <main className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9f0ec] border border-[#d2dfd6] text-[#1b4332] text-xs font-medium mb-8">
                Tahun Ajaran 2026/2027
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 max-w-2xl leading-[1.2] font-poppins">
                Rekapitulasi Nilai Akademik yang Akurat, Teratur, dan Simpel.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-zinc-600 max-w-lg leading-relaxed">
                Ruang kerja digital wali kelas dalam mengelola dan melakukan rekap nilai rapor dari para siswa.
            </p>

            <HeroActions />
            <Stat />
        </main>
    );
}