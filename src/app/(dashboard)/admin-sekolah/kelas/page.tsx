import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormKelas, { KelasItem, GuruOption } from "./form-kelas";

export default async function AdminKelasPage() {
  const user = await requireUser();

  // Ambil periode aktif untuk default tahun ajaran
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      sekolahId: user.sekolahId || undefined,
      isAktif: true,
    },
  });

  const tahunAjaranAktif = periodeAktif?.tahunAjaran || "2026/2027";

  // Ambil data rombel kelas
  const rawKelasList = await prisma.kelas.findMany({
    include: {
      waliKelas: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          siswa: true,
          pengampu: true,
        },
      },
    },
    orderBy: [
      { tingkat: "asc" },
      { nama: "asc" },
    ],
  });

  const kelasList: KelasItem[] = rawKelasList.map((k) => ({
    id: k.id,
    nama: k.nama,
    tingkat: k.tingkat,
    tahunAjaran: k.tahunAjaran,
    totalSiswa: k._count.siswa,
    totalMapel: k._count.pengampu,
    waliKelas: k.waliKelas,
  }));

  // Ambil data guru untuk opsi dropdown Wali Kelas
  const rawGuruList = await prisma.user.findMany({
    where: {
      role: {
        in: ["GURU", "WALI_KELAS"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      kelasWali: {
        select: {
          id: true,
          nama: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const guruOptions: GuruOption[] = rawGuruList.map((g) => ({
    id: g.id,
    name: g.name,
    email: g.email,
    kelasWali: g.kelasWali,
  }));

  // Ambil daftar mata pelajaran
  const rawMapelList = await prisma.mataPelajaran.findMany({
    select: {
      id: true,
      kode: true,
      nama: true,
    },
    orderBy: {
      nama: "asc",
    },
  });

  const mapelOptions = rawMapelList.map((m) => ({
    id: m.id,
    kode: m.kode,
    nama: m.nama,
  }));

  // Ambil data penugasan yang sudah ada untuk fitur salin template rombel & edit rombel
  const rawExistingPengampu = await prisma.pengampu.findMany({
    where: {
      tahunAjaran: tahunAjaranAktif,
    },
    select: {
      kelasId: true,
      mapelId: true,
      guruId: true,
      semester: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner Halaman */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
          Rombongan Belajar • Level Admin Sekolah
        </span>
        <h1 className="text-2xl font-bold font-poppins">
          Master Kelas & Rombongan Belajar
        </h1>
        <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
          Kelola rombongan belajar tingkat 1 sampai 6, pantau kapasitas peserta didik, dan tunjuk Guru Wali Kelas untuk tiap rombel.
        </p>
      </div>

      {/* Form & Grid Kartu Rombel */}
      <FormKelas
        kelasList={kelasList}
        guruOptions={guruOptions}
        mapelOptions={mapelOptions}
        existingPengampuList={rawExistingPengampu}
        tahunAjaranAktif={tahunAjaranAktif}
      />
    </div>
  );
}
