import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormSiswa, { SiswaRecord } from "./form-siswa";

export default async function AdminSiswaPage() {
  await requireUser();

  // Ambil seluruh siswa dengan relasi kelas
  const rawSiswaList = await prisma.siswa.findMany({
    include: {
      kelas: {
        select: {
          id: true,
          nama: true,
          tingkat: true,
        },
      },
    },
    orderBy: [
      { kelas: { tingkat: "asc" } },
      { kelas: { nama: "asc" } },
      { nama: "asc" },
    ],
  });

  const siswaList: SiswaRecord[] = rawSiswaList.map((s) => ({
    id: s.id,
    nisn: s.nisn,
    nis: s.nis,
    nama: s.nama,
    jenisKelamin: s.jenisKelamin,
    alamat: s.alamat,
    kelasId: s.kelasId,
    kelas: s.kelas,
  }));

  // Ambil daftar kelas untuk filter dan form
  const kelasList = await prisma.kelas.findMany({
    select: {
      id: true,
      nama: true,
      tingkat: true,
    },
    orderBy: [
      { tingkat: "asc" },
      { nama: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header Banner Halaman */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
          Peserta Didik • Level Admin Sekolah
        </span>
        <h1 className="text-2xl font-bold font-poppins">
          Data Peserta Didik (Siswa)
        </h1>
        <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
          Kelola data induk peserta didik, penomoran NISN & NIS resmi, mutasi rombongan belajar, dan biodata profil siswa.
        </p>
      </div>

      {/* Form & Tabel Siswa */}
      <FormSiswa initialSiswaList={siswaList} kelasList={kelasList} />
    </div>
  );
}
