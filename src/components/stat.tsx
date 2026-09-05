import { prisma } from "@/lib/prisma";

export default async function Stat(){
    const [totalSiswa, totalKelas, totalMapel, totalGuru] = await Promise.all([
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
    return (
        <section className="mt-16 w-full grid grid-cols-2 md:grid-cols-4 gap-3.5 font-mono">
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
    )
}