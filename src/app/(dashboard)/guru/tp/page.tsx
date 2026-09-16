import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import FormTP from "./form-tp";

interface PageProps {
  searchParams: Promise<{
    mapelId?: string;
    tingkat?: string;
    semester?: string;
    tahunAjaran?: string;
  }>;
}

export default function GuruTPPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <GuruTPContent searchParams={searchParams} />
    </Suspense>
  );
}

async function GuruTPContent({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  // 1. Ambil Periode Akademik Aktif
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      sekolahId: user.sekolahId || undefined,
      isAktif: true,
    },
  });

  const selectedTahunAjaran = params.tahunAjaran || periodeAktif?.tahunAjaran || "2026/2027";
  const selectedSemester = params.semester ? Number(params.semester) : (periodeAktif?.semester || 1);

  // 2. Ambil penugasan rombel dan mapel yang diampu guru pada periode ini
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
      { mapel: { nama: "asc" } },
    ],
  });

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
            Anda belum ditugaskan ke kelas atau mata pelajaran mana pun pada Tahun Ajaran {selectedTahunAjaran} Semester {selectedSemester === 1 ? "Ganjil" : "Genap"}.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              href={`/guru/tp?semester=${selectedSemester === 1 ? 2 : 1}`}
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

  // 3. Gabungkan kelas paralel pada tingkat dan mapel yang sama (Prinsip Kurikulum Merdeka)
  const optionsMap: Record<
    string,
    { mapelId: string; mapelKode: string; mapelNama: string; tingkat: number; kelasNamaList: string[] }
  > = {};

  daftarPengampu.forEach((p) => {
    const key = `${p.mapelId}-${p.kelas.tingkat}`;
    if (!optionsMap[key]) {
      optionsMap[key] = {
        mapelId: p.mapelId,
        mapelKode: p.mapel.kode,
        mapelNama: p.mapel.nama,
        tingkat: p.kelas.tingkat,
        kelasNamaList: [p.kelas.nama],
      };
    } else {
      if (!optionsMap[key].kelasNamaList.includes(p.kelas.nama)) {
        optionsMap[key].kelasNamaList.push(p.kelas.nama);
      }
    }
  });

  const options = Object.values(optionsMap);

  // 4. Tentukan opsi yang aktif
  const activeOption =
    options.find(
      (o) => o.mapelId === params.mapelId && o.tingkat === Number(params.tingkat)
    ) || options[0];

  // 5. Ambil daftar TP yang sudah terdaftar untuk mapel, tingkat, dan semester tersebut
  const tpList = await prisma.tujuanPembelajaran.findMany({
    where: {
      mapelId: activeOption.mapelId,
      tingkat: activeOption.tingkat,
      semester: selectedSemester,
    },
    orderBy: {
      kode: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <FormTP
        options={options}
        activeOption={activeOption}
        tpList={tpList}
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
      />
    </div>
  );
}
