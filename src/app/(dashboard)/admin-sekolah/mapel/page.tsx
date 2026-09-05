import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormMapel, { MapelItem } from "./form-mapel";

export default async function AdminMapelPage() {
  await requireUser();

  const mapelListRaw = await prisma.mataPelajaran.findMany({
    include: {
      _count: {
        select: {
          pengampu: true,
          tujuanPembelajaran: true,
        },
      },
    },
    orderBy: {
      nama: "asc",
    },
  });

  const mapelList: MapelItem[] = mapelListRaw.map((m) => ({
    id: m.id,
    kode: m.kode,
    nama: m.nama,
    totalPengampu: m._count.pengampu,
    totalTP: m._count.tujuanPembelajaran,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner Halaman */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
          Kurikulum & Mata Pelajaran • Level Admin Sekolah
        </span>
        <h1 className="text-2xl font-bold font-poppins">
          Master Mata Pelajaran
        </h1>
        <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
          Kelola struktur mata pelajaran nasional Kurikulum Merdeka, muatan lokal, dan mata pelajaran pilihan yang diajarkan pada satuan pendidikan.
        </p>
      </div>

      {/* Form & Tabel Mapel */}
      <FormMapel initialMapelList={mapelList} />
    </div>
  );
}
