import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormImportNilaiClient from "./form-import-nilai";
import { AlertCircleIcon } from "@/components/shared/icons";

export default async function WaliKelasImportNilaiPage() {
  const user = await requireUser();

  // 1. Cari kelas binaan wali kelas (atau kelas pertama jika Admin)
  let kelas = await prisma.kelas.findFirst({
    where: { waliKelasId: user.id },
  });

  if (!kelas && (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
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

  // 3. Ambil seluruh mata pelajaran yang diampu di kelas ini pada semester aktif
  const pengampuList = await prisma.pengampu.findMany({
    where: {
      kelasId: kelas.id,
      tahunAjaran,
      OR: [{ semester: 0 }, { semester }],
    },
    include: {
      mapel: true,
      guru: true,
    },
    orderBy: {
      mapel: { kode: "asc" },
    },
  });

  const mapelList = pengampuList.map((p) => ({
    id: p.mapel.id,
    kode: p.mapel.kode,
    nama: p.mapel.nama,
    guruNama: p.guru.name,
  }));

  // 4. Ambil seluruh siswa di rombel ini
  const siswaList = await prisma.siswa.findMany({
    where: { kelasId: kelas.id },
    select: {
      id: true,
      nisn: true,
      nis: true,
      nama: true,
      jenisKelamin: true,
    },
    orderBy: { nama: "asc" },
  });

  return (
    <FormImportNilaiClient
      kelasId={kelas.id}
      kelasNama={kelas.nama}
      tingkat={kelas.tingkat}
      tahunAjaran={tahunAjaran}
      semester={semester}
      mapelList={mapelList}
      siswaList={siswaList}
    />
  );
}
