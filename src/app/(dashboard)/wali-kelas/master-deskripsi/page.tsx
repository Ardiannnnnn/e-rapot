import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AlertCircleIcon } from "@/components/shared/icons";
import MasterDeskripsiClient from "./master-deskripsi-client";
import { getTemplateRaporAction } from "@/actions/master-deskripsi";

export const dynamic = "force-dynamic";

export default async function MasterDeskripsiPage() {
  const user = await requireUser();

  // 1. Cari kelas binaan
  let kelas = await prisma.kelas.findFirst({
    where: { waliKelasId: user.id },
  });

  if (
    !kelas &&
    (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN" || user.role === "SUPER_ADMIN")
  ) {
    kelas = await prisma.kelas.findFirst({
      where: user.sekolahId ? { sekolahId: user.sekolahId } : undefined,
    });
  }

  if (!kelas) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertCircleIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-zinc-900 font-poppins">
          Belum Ditugaskan Sebagai Wali Kelas
        </h2>
        <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">
          Akun Anda belum terdaftar sebagai wali kelas untuk rombel aktif. Silakan hubungi Administrator Sekolah.
        </p>
      </div>
    );
  }

  // 2. Ambil periode akademik aktif
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      ...(user.sekolahId ? { sekolahId: user.sekolahId } : {}),
      isAktif: true,
    },
  });

  const tahunAjaran = periodeAktif?.tahunAjaran || "2026/2027";
  const semester = periodeAktif?.semester || 1;

  // 3. Ambil data template rapor (auto-seed jika belum ada)
  const res = await getTemplateRaporAction(kelas.id, tahunAjaran, semester);
  const data = res.success && res.data
    ? res.data
    : { temaP5: [], kebiasaan: [], saranWali: [], ekskul: [] };

  return (
    <MasterDeskripsiClient
      kelasId={kelas.id}
      kelasNama={kelas.nama}
      tingkat={kelas.tingkat}
      tahunAjaran={tahunAjaran}
      semester={semester}
      initialTemaP5={data.temaP5}
      initialKebiasaan={data.kebiasaan}
      initialSaranWali={data.saranWali}
      initialEkskul={data.ekskul || []}
    />
  );
}
