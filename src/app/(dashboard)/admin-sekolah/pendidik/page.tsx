import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormPendidik from "./form-pendidik";
import { GuruItem, PengampuRecord } from "@/types/admin-sekolah";

export default function AdminPendidikPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminPendidikContent />
    </Suspense>
  );
}

async function AdminPendidikContent() {
  const user = await requireUser();

  // Ambil periode aktif untuk tahun ajaran
  const periodeAktif = await prisma.periodeAkademik.findFirst({
    where: {
      sekolahId: user.sekolahId || undefined,
      isAktif: true,
    },
  });
  const tahunAjaranAktif = periodeAktif?.tahunAjaran || "2026/2027";

  // Ambil daftar akun guru
  const rawGuruList = await prisma.user.findMany({
    where: {
      role: {
        in: ["GURU", "WALI_KELAS"],
      },
    },
    include: {
      kelasWali: {
        select: {
          id: true,
          nama: true,
        },
      },
      _count: {
        select: {
          pengampu: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const guruList: GuruItem[] = rawGuruList.map((g) => ({
    id: g.id,
    name: g.name,
    email: g.email,
    role: g.role,
    isActive: g.isActive !== false,
    kelasWali: g.kelasWali,
    totalPengampu: g._count.pengampu,
  }));

  // Ambil data penugasan pengampu
  const rawPengampuList = await prisma.pengampu.findMany({
    where: {
      tahunAjaran: tahunAjaranAktif,
    },
    include: {
      guru: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      kelas: {
        select: {
          id: true,
          nama: true,
          tingkat: true,
        },
      },
      mapel: {
        select: {
          id: true,
          kode: true,
          nama: true,
        },
      },
    },
    orderBy: [
      { kelas: { tingkat: "asc" } },
      { kelas: { nama: "asc" } },
      { mapel: { nama: "asc" } },
    ],
  });

  const pengampuList: PengampuRecord[] = rawPengampuList.map((p) => ({
    id: p.id,
    tahunAjaran: p.tahunAjaran,
    semester: p.semester,
    guru: p.guru,
    kelas: p.kelas,
    mapel: p.mapel,
  }));

  // Ambil daftar rombel untuk opsi form
  const rawKelasList = await prisma.kelas.findMany({
    select: {
      id: true,
      nama: true,
      tingkat: true,
      waliKelasId: true,
      waliKelas: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { tingkat: "asc" },
      { nama: "asc" },
    ],
  });

  const kelasList = rawKelasList.map((k) => ({
    id: k.id,
    nama: k.nama,
    tingkat: k.tingkat,
    waliKelasId: k.waliKelasId,
    waliKelasNama: k.waliKelas?.name || null,
  }));

  // Ambil daftar mapel untuk opsi form
  const mapelList = await prisma.mataPelajaran.findMany({
    select: {
      id: true,
      kode: true,
      nama: true,
    },
    orderBy: {
      nama: "asc",
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner Halaman */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
          Pendidik & Tenaga Kependidikan • Level Admin Sekolah
        </span>
        <h1 className="text-2xl font-bold font-poppins">
          Pendidik & Penugasan Mengajar
        </h1>
        <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
          Kelola data akun guru, penugasan mengajar mata pelajaran per rombel kelas, serta penetapan semester mengajar aktif (Ganjil / Genap).
        </p>
      </div>

      {/* Form Pendidik & Penugasan Mengajar */}
      <FormPendidik
        guruList={guruList}
        pengampuList={pengampuList}
        kelasList={kelasList}
        mapelList={mapelList}
        tahunAjaranAktif={tahunAjaranAktif}
      />
    </div>
  );
}
