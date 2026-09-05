import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import DaftarSiswaClient from "./daftar-siswa";
import { AlertCircleIcon } from "@/components/shared/icons";

export default async function WaliKelasSiswaPage() {
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

  const siswaList = rawSiswaList.map((s) => {
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
      mapelDinilaiCount: validNilai.length,
      totalMapel,
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
