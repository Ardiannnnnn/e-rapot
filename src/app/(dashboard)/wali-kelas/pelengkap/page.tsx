import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormPelengkapClient from "./form-pelengkap";
import { AlertCircleIcon } from "@/components/shared/icons";
import { EkskulItem } from "@/actions/wali-kelas";
import { getTemplateRaporAction } from "@/actions/master-deskripsi";

export const dynamic = "force-dynamic";

export default function WaliKelasPelengkapPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <PelengkapContent />
    </Suspense>
  );
}

async function PelengkapContent() {
  const user = await requireUser();

  // 1. Cari kelas binaan
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

  // 3. Ambil seluruh siswa beserta data raporPelengkap untuk semester ini
  const rawSiswaList = await prisma.siswa.findMany({
    where: { kelasId: kelas.id },
    include: {
      raporPelengkap: {
        where: {
          tahunAjaran,
          semester,
        },
      },
    },
    orderBy: { nama: "asc" },
  });

  const initialSiswaList = rawSiswaList.map((s) => {
    const p = s.raporPelengkap[0];
    let ekskulParsed: EkskulItem[] = [];
    if (p && p.ekskul) {
      try {
        ekskulParsed = JSON.parse(p.ekskul);
      } catch (e) {
        ekskulParsed = [];
      }
    }

    let kokurikulerParsed = [];
    if (p && p.kokurikuler) {
      try {
        kokurikulerParsed = JSON.parse(p.kokurikuler);
      } catch (e) {
        kokurikulerParsed = [];
      }
    }

    return {
      id: s.id,
      nama: s.nama,
      nisn: s.nisn,
      nis: s.nis,
      jenisKelamin: s.jenisKelamin,
      sakit: p?.sakit ?? 0,
      izin: p?.izin ?? 0,
      alpa: p?.alpa ?? 0,
      catatanWali: p?.catatanWali ?? "",
      ekskul: ekskulParsed,
      kokurikuler: kokurikulerParsed,
      kebiasaanKarakter: p?.kebiasaanKarakter ?? "",
      statusKenaikan: p?.statusKenaikan ?? "",
      isPresensiSaved: !!p,
      isEkskulSaved: !!(p && p.ekskul !== null),
      isKokurikulerSaved: !!(p && p.kokurikuler && kokurikulerParsed.length > 0),
      isKebiasaanSaved: !!(p && p.kebiasaanKarakter && p.kebiasaanKarakter.trim().length > 0),
      isKenaikanSaved: semester === 2
        ? !!(p && p.statusKenaikan && p.statusKenaikan.trim().length > 0)
        : true,
    };
  });

  // 4. Ambil master template rapor untuk kelas & semester ini
  const tplRes = await getTemplateRaporAction(kelas.id, tahunAjaran, semester);
  const initialTemplates = tplRes.success && tplRes.data
    ? tplRes.data
    : { temaP5: [], kebiasaan: [], saranWali: [], ekskul: [] };

  return (
    <FormPelengkapClient
      kelasId={kelas.id}
      kelasNama={kelas.nama}
      tingkat={kelas.tingkat}
      tahunAjaran={tahunAjaran}
      semester={semester}
      initialSiswaList={initialSiswaList}
      initialTemplates={initialTemplates}
    />
  );
}
