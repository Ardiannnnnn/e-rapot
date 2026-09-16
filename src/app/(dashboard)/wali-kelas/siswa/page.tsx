import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import DaftarSiswaClient from "./daftar-siswa";
import { AlertCircleIcon } from "@/components/shared/icons";
import { SiswaItem } from "@/types/wali-kelas/siswa";

export default function WaliKelasSiswaPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <WaliKelasSiswaContent />
    </Suspense>
  );
}

async function WaliKelasSiswaContent() {
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

  // 3. Ambil seluruh mapel yang diampu di kelas ini pada semester ini
  const pengampuList = await prisma.pengampu.findMany({
    where: {
      kelasId: kelas.id,
      tahunAjaran,
      OR: [{ semester: 0 }, { semester }],
    },
    include: {
      mapel: true,
    },
  });
  const totalMapel = pengampuList.length;

  // 4. Ambil seluruh siswa dengan nilai & raporPelengkap pada semester ini
  const rawSiswaList = await prisma.siswa.findMany({
    where: { kelasId: kelas.id },
    include: {
      nilai: {
        where: {
          tahunAjaran,
          semester,
        },
        include: {
          mapel: true,
        },
      },
      raporPelengkap: {
        where: {
          tahunAjaran,
          semester,
        },
      },
    },
    orderBy: { nama: "asc" },
  });

  // 5. Olah data nilai per siswa
  const rawFormatted = rawSiswaList.map((s) => {
    const nilaiFormatted = s.nilai.map((n) => ({
      id: n.id,
      mapelId: n.mapelId,
      mapelKode: n.mapel.kode,
      mapelNama: n.mapel.nama,
      nilaiTugas: n.nilaiTugas,
      nilaiUTS: n.nilaiUTS,
      nilaiUAS: n.nilaiUAS,
      nilaiAkhir: n.nilaiAkhir,
      catatan: n.catatan,
    }));

    const validNilai = nilaiFormatted.filter((n) => n.nilaiAkhir > 0);
    const sumNilai = validNilai.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
    const rataRata = validNilai.length > 0 ? sumNilai / validNilai.length : 0;

    const p = s.raporPelengkap[0];
    const presensi = p
      ? {
          sakit: p.sakit,
          izin: p.izin,
          alpa: p.alpa,
          catatanWali: p.catatanWali,
        }
      : null;

    return {
      id: s.id,
      nisn: s.nisn,
      nis: s.nis,
      nama: s.nama,
      jenisKelamin: s.jenisKelamin,
      alamat: s.alamat,
      nilai: nilaiFormatted,
      presensi,
      rataRata,
      totalNilai: sumNilai,
      mapelDinilaiCount: validNilai.length,
      totalMapel,
    };
  });

  // 6. Ambil pengaturan penalti presensi untuk perankingan juara
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

  const penaltiAlpa = pengaturan?.penaltiAlpa ?? 1.0;
  const penaltiIzin = pengaturan?.penaltiIzin ?? 0.0;
  const penaltiSakit = pengaturan?.penaltiSakit ?? 0.0;
  const maxAlpaJuara = pengaturan?.maxAlpaJuara !== undefined ? pengaturan.maxAlpaJuara : 3;

  // 7. Hitung peringkat di kelas dengan memperhitungkan penalti presensi (Alpa, Izin, Sakit) dan syarat juara
  const siswaDenganNilai = rawFormatted
    .filter((s) => s.totalNilai > 0)
    .map((s) => {
      const a = s.presensi?.alpa || 0;
      const i = s.presensi?.izin || 0;
      const sk = s.presensi?.sakit || 0;
      const penalti = a * penaltiAlpa + i * penaltiIzin + sk * penaltiSakit;
      const roundedPenalti = Math.round(penalti * 10) / 10;
      // Penalti presensi langsung memotong Total Nilai siswa untuk penentuan skor juara
      const skorAkhir = Math.max(0, Math.round((s.totalNilai - roundedPenalti) * 10) / 10);
      // Batas alpa hanya mendiskualifikasi syarat 3 besar jika diisi angka positif (> 0)
      const isDisqualified =
        maxAlpaJuara !== null && maxAlpaJuara > 0 && a > maxAlpaJuara;

      return {
        id: s.id,
        skorAkhir,
        total: s.totalNilai,
        alpa: a,
        izin: i,
        sakit: sk,
        penalti: roundedPenalti,
        isDisqualified,
      };
    });

  const sortedRanking = [...siswaDenganNilai].sort((a, b) => {
    if (b.skorAkhir !== a.skorAkhir) return b.skorAkhir - a.skorAkhir;
    if (a.alpa !== b.alpa) return a.alpa - b.alpa;
    return a.izin + a.sakit - (b.izin + b.sakit);
  });

  const rankingMap = new Map<string, number>();
  const penaltiMap = new Map<
    string,
    { penalti: number; skorAkhir: number; isDisqualified: boolean }
  >();

  // Pembagian ranking:
  // Jika ada siswa yang gugur dari 3 besar karena melebihi toleransi alpa,
  // posisi Juara 1, 2, 3 diisi oleh 3 siswa terbaik yang memenuhi syarat
  const topEligible: typeof sortedRanking = [];
  const disqualifiedList: typeof sortedRanking = [];

  sortedRanking.forEach((item) => {
    if (item.isDisqualified) {
      disqualifiedList.push(item);
    } else {
      topEligible.push(item);
    }
  });

  const finalOrdered: typeof sortedRanking = [];
  if (disqualifiedList.length === 0) {
    finalOrdered.push(...sortedRanking);
  } else {
    // 3 Besar diisi oleh eligible
    const top3 = topEligible.slice(0, 3);
    const remainingEligible = topEligible.slice(3);
    finalOrdered.push(...top3);

    // Sisanya digabung dan diurutkan kembali untuk peringkat 4 ke bawah
    const remainingAll = [...remainingEligible, ...disqualifiedList].sort((a, b) => {
      if (b.skorAkhir !== a.skorAkhir) return b.skorAkhir - a.skorAkhir;
      if (a.alpa !== b.alpa) return a.alpa - b.alpa;
      return a.izin + a.sakit - (b.izin + b.sakit);
    });
    finalOrdered.push(...remainingAll);
  }

  finalOrdered.forEach((item, idx) => {
    rankingMap.set(item.id, idx + 1);
    penaltiMap.set(item.id, {
      penalti: item.penalti,
      skorAkhir: item.skorAkhir,
      isDisqualified: item.isDisqualified,
    });
  });

  const siswaList: SiswaItem[] = rawFormatted.map((s) => {
    const extra = penaltiMap.get(s.id);
    return {
      ...s,
      peringkat: rankingMap.get(s.id) || null,
      penaltiPresensi: extra?.penalti,
      skorAkhirRanking: extra?.skorAkhir,
      isDisqualifiedJuara: extra?.isDisqualified,
    };
  });

  return (
    <DaftarSiswaClient
      kelasNama={kelas.nama}
      tingkat={kelas.tingkat}
      tahunAjaran={tahunAjaran}
      semester={semester}
      siswaList={siswaList}
    />
  );
}
