import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Memulai proses seeding...");

  // 1. Bersihkan data lama (opsional, agar id tidak duplikat saat dijalankan ulang)
  await prisma.nilai.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.mataPelajaran.deleteMany();
  await prisma.user.deleteMany();

  // 2. Buat Data Akun Pengguna
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@eraport.sch.id",
      name: "Administrator Sekolah",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const waliKelas7A = await prisma.user.create({
    data: {
      email: "guru1@eraport.sch.id",
      name: "Budi Santoso, S.Pd.",
      password: hashedPassword,
      role: "WALI_KELAS",
    },
  });

  const guruMapel = await prisma.user.create({
    data: {
      email: "guru2@eraport.sch.id",
      name: "Siti Rahma, M.Pd.",
      password: hashedPassword,
      role: "GURU",
    },
  });

  console.log("Akun pengguna berhasil dibuat.");

  // 3. Buat Data Kelas
  const kelas7A = await prisma.kelas.create({
    data: {
      nama: "7A",
      tingkat: 7,
      tahunAjaran: "2026/2027",
      waliKelasId: waliKelas7A.id,
    },
  });

  await prisma.kelas.create({
    data: {
      nama: "7B",
      tingkat: 7,
      tahunAjaran: "2026/2027",
    },
  });

  console.log("Data kelas berhasil dibuat.");

  // 4. Buat Data Mata Pelajaran
  const mapelList = [
    { kode: "PAI", nama: "Pendidikan Agama Islam" },
    { kode: "PKN", nama: "Pendidikan Kewarganegaraan" },
    { kode: "BIN", nama: "Bahasa Indonesia" },
    { kode: "MAT", nama: "Matematika" },
    { kode: "IPA", nama: "Ilmu Pengetahuan Alam" },
    { kode: "IPS", nama: "Ilmu Pengetahuan Sosial" },
    { kode: "BIG", nama: "Bahasa Inggris" },
  ];

  for (const mapel of mapelList) {
    await prisma.mataPelajaran.create({
      data: mapel,
    });
  }

  console.log("Data mata pelajaran berhasil dibuat.");

  // 5. Buat Sampel Data Siswa
  await prisma.siswa.createMany({
    data: [
      {
        nisn: "0081234567",
        nis: "202607001",
        nama: "Ahmad Rizki",
        jenisKelamin: "L",
        alamat: "Jl. Merdeka No. 10",
        kelasId: kelas7A.id,
      },
      {
        nisn: "0087654321",
        nis: "202607002",
        nama: "Aulia Putri",
        jenisKelamin: "P",
        alamat: "Jl. Sudirman No. 25",
        kelasId: kelas7A.id,
      },
    ],
  });

  console.log("Data siswa berhasil dibuat.");
}

main()
  .catch((e) => {
    console.error("Gagal melakukan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });