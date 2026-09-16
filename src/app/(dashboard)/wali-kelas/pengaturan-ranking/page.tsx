import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AlertCircleIcon } from "@/components/shared/icons";
import PengaturanRankingClient from "./pengaturan-ranking-client";

export const dynamic = "force-dynamic";

export default function PengaturanRankingPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <PengaturanRankingContent />
    </Suspense>
  );
}

async function PengaturanRankingContent() {
  const user = await requireUser();

  // 1. Cari kelas binaan wali kelas
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

  // 3. Ambil daftar pengampu mapel di kelas ini
  const pengampuList = await prisma.pengampu.findMany({
    where: {
      kelasId: kelas.id,
      tahunAjaran,
      OR: [{ semester: 0 }, { semester }],
    },
    include: {
      mapel: true,
      guru: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      mapel: { nama: "asc" },
    },
  });

  // 4. Ambil atau inisialisasi pengaturan penalti presensi kelas
  const pengaturan = (prisma as any).pengaturanKelas
    ? await prisma.pengaturanKelas.findUnique({
        where: {
          kelasId_tahunAjaran_semester: {
            kelasId: kelas.id,
            tahunAjaran,
            semester,
          },
        },
      })
    : null;

  const configData = {
    penaltiAlpa: pengaturan?.penaltiAlpa ?? 1.0,
    penaltiIzin: pengaturan?.penaltiIzin ?? 0.0,
    penaltiSakit: pengaturan?.penaltiSakit ?? 0.0,
    maxAlpaJuara: pengaturan?.maxAlpaJuara !== undefined ? pengaturan.maxAlpaJuara : 3,
  };

  // 5. Hitung jumlah siswa binaan untuk header
  const totalSiswa = await prisma.siswa.count({
    where: { kelasId: kelas.id },
  });

  return (
    <PengaturanRankingClient
      kelasId={kelas.id}
      kelasNama={kelas.nama}
      tingkat={kelas.tingkat}
      tahunAjaran={tahunAjaran}
      semester={semester}
      pengampuList={pengampuList.map((p) => ({
        id: p.id,
        mapelId: p.mapelId,
        mapelNama: p.mapel.nama,
        mapelKode: p.mapel.kode,
        guruNama: p.guru.name,
        bobotTugas: p.bobotTugas,
        bobotUTS: p.bobotUTS,
        bobotUAS: p.bobotUAS,
      }))}
      initialConfig={configData}
      totalSiswa={totalSiswa}
    />
  );
}
