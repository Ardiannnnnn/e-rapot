import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormPeriode, { PeriodeItem } from "./form-periode";

export default async function AdminTahunAjaranPage() {
  const user = await requireUser();

  // Ambil sekolahId
  let sekolahId = user.sekolahId;
  if (!sekolahId) {
    const defaultSekolah = await prisma.sekolah.findFirst();
    sekolahId = defaultSekolah?.id || null;
  }

  const periodes = sekolahId
    ? await prisma.periodeAkademik.findMany({
        where: { sekolahId },
        orderBy: [{ tahunAjaran: "desc" }, { semester: "asc" }],
      })
    : [];

  const periodeList: PeriodeItem[] = periodes.map((p) => ({
    id: p.id,
    tahunAjaran: p.tahunAjaran,
    semester: p.semester,
    isAktif: p.isAktif,
    statusNilai: p.statusNilai,
    tanggalCetak: p.tanggalCetak ? p.tanggalCetak.toISOString() : null,
    tempatCetak: p.tempatCetak,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner Halaman */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
          Pusat Kendali Kalender Akademik • Kurikulum Merdeka
        </span>
        <h1 className="text-2xl font-bold font-poppins">
          Tahun Ajaran & Semester Aktif
        </h1>
        <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
          Atur periode akademik sekolah, tentukan semester yang sedang aktif berjalan, kendalikan pembukaan/penutupan input nilai guru, serta konfigurasi tanggal penerbitan rapor.
        </p>
      </div>

      {/* Form & Manajemen Periode Akademik */}
      <FormPeriode periodeList={periodeList} />
    </div>
  );
}
