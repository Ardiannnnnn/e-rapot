import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Memulai proses seeding komprehensif...");

  // 1. Bersihkan data lama (sesuai urutan foreign key dependency)
  console.log("Membersihkan data lama...");
  await prisma.periodeAkademik.deleteMany();
  await prisma.tujuanPembelajaran.deleteMany();
  await prisma.pengampu.deleteMany();
  await prisma.nilai.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.mataPelajaran.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sekolah.deleteMany();

  // 2. Buat Data 1 Sekolah (Tenant Utama)
  const sekolah = await prisma.sekolah.create({
    data: {
      npsn: "10203040",
      nama: "SD Negeri 01 Merdeka Jakarta",
      alamat: "Jl. Pendidikan No. 10, Gambir, Jakarta Pusat",
      kepalaSekolah: "Drs. H. Mulyadi, M.Pd.",
      nipKepsek: "19780101 200501 1 002",
      status: "AKTIF",
    },
  });
  console.log(`Sekolah dibuat: ${sekolah.nama}`);

  // Buat Data Periode Akademik (Tahun Ajaran & Semester)
  await prisma.periodeAkademik.createMany({
    data: [
      {
        sekolahId: sekolah.id,
        tahunAjaran: "2025/2026",
        semester: 1,
        isAktif: false,
        statusNilai: "KUNCI",
        tanggalCetak: new Date("2025-12-20"),
        tempatCetak: "Jakarta",
      },
      {
        sekolahId: sekolah.id,
        tahunAjaran: "2025/2026",
        semester: 2,
        isAktif: false,
        statusNilai: "KUNCI",
        tanggalCetak: new Date("2026-06-20"),
        tempatCetak: "Jakarta",
      },
      {
        sekolahId: sekolah.id,
        tahunAjaran: "2026/2027",
        semester: 1,
        isAktif: true,
        statusNilai: "BUKA",
        tanggalCetak: new Date("2026-12-19"),
        tempatCetak: "Jakarta",
      },
      {
        sekolahId: sekolah.id,
        tahunAjaran: "2026/2027",
        semester: 2,
        isAktif: false,
        statusNilai: "BUKA",
        tanggalCetak: new Date("2027-06-19"),
        tempatCetak: "Jakarta",
      },
    ],
  });
  console.log("Periode akademik awal berhasil dibuat.");

  // Hash password sekali untuk dipakai seluruh akun (sangat efisien)
  const defaultPassword = await bcrypt.hash("password123", 10);

  // 3. Buat Akun Super Admin & Admin Sekolah
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@eraport.id",
      name: "Super Administrator (SaaS)",
      password: defaultPassword,
      role: "SUPER_ADMIN",
    },
  });

  const adminSekolah = await prisma.user.create({
    data: {
      email: "admin@sekolah.sch.id",
      name: "Admin SD Negeri 01",
      password: defaultPassword,
      role: "ADMIN_SEKOLAH",
      sekolahId: sekolah.id,
    },
  });
  console.log("Akun Super Admin dan Admin Sekolah dibuat.");

  // 4. Buat 30 Data Guru (12 Wali Kelas + 18 Guru Mapel)
  console.log("Membuat 30 akun guru...");

  // 12 Wali Kelas (WALI_KELAS)
  const waliKelasData = [
    { name: "Budi Santoso, S.Pd.", email: "guru1@eraport.sch.id" }, // wali 1A (guru1 kompatibel)
    { name: "Siti Rahmawati, S.Pd.", email: "wali1b@sekolah.sch.id" }, // wali 1B
    { name: "Ahmad Fauzi, S.Pd.I.", email: "wali2a@sekolah.sch.id" }, // wali 2A
    { name: "Dewi Lestari, M.Pd.", email: "wali2b@sekolah.sch.id" }, // wali 2B
    { name: "Hendra Wijaya, S.Pd.", email: "wali3a@sekolah.sch.id" }, // wali 3A
    { name: "Rina Kusuma, S.Pd.", email: "wali3b@sekolah.sch.id" }, // wali 3B
    { name: "Agus Setiawan, S.Pd.", email: "wali4a@sekolah.sch.id" }, // wali 4A
    { name: "Nurul Hidayah, M.Pd.", email: "wali4b@sekolah.sch.id" }, // wali 4B
    { name: "Eko Prasetyo, S.Pd.", email: "wali5a@sekolah.sch.id" }, // wali 5A
    { name: "Sri Wahyuni, S.Pd.", email: "wali5b@sekolah.sch.id" }, // wali 5B
    { name: "Bambang Hermanto, M.Pd.", email: "wali6a@sekolah.sch.id" }, // wali 6A
    { name: "Ratna Sari, S.Pd.", email: "wali6b@sekolah.sch.id" }, // wali 6B
  ];

  const createdWaliKelas: any[] = [];
  for (const wali of waliKelasData) {
    const user = await prisma.user.create({
      data: {
        name: wali.name,
        email: wali.email,
        password: defaultPassword,
        role: "WALI_KELAS",
        sekolahId: sekolah.id,
      },
    });
    createdWaliKelas.push(user);
  }

  // 18 Guru Mata Pelajaran (GURU)
  const guruMapelData = [
    { name: "Siti Rahma, M.Pd.", email: "guru2@eraport.sch.id" }, // Guru Mapel utama (guru2 kompatibel)
    { name: "Joko Susilo, S.Pd.", email: "guru3@sekolah.sch.id" },
    { name: "Fitri Handayani, S.Pd.", email: "guru4@sekolah.sch.id" },
    { name: "Muhammad Ridwan, S.Pd.I.", email: "guru5@sekolah.sch.id" },
    { name: "Dian Permatasari, S.Pd.", email: "guru6@sekolah.sch.id" },
    { name: "Arif Rahman, S.Pd.", email: "guru7@sekolah.sch.id" },
    { name: "Tri Wulandari, S.Pd.", email: "guru8@sekolah.sch.id" },
    { name: "Doni Kurniawan, S.Pd.", email: "guru9@sekolah.sch.id" },
    { name: "Maya Anggraini, S.Pd.", email: "guru10@sekolah.sch.id" },
    { name: "Fajar Nugroho, S.Pd.", email: "guru11@sekolah.sch.id" },
    { name: "Indah Permata, S.Pd.", email: "guru12@sekolah.sch.id" },
    { name: "Rizky Maulana, S.Pd.", email: "guru13@sekolah.sch.id" },
    { name: "Yuni Astuti, S.Pd.", email: "guru14@sekolah.sch.id" },
    { name: "Bayu Pratama, S.Pd.", email: "guru15@sekolah.sch.id" },
    { name: "Anisa Rahmawati, S.Pd.", email: "guru16@sekolah.sch.id" },
    { name: "Dedi Supriyadi, S.Pd.", email: "guru17@sekolah.sch.id" },
    { name: "Larasati Putri, S.Pd.", email: "guru18@sekolah.sch.id" },
    { name: "Wahyu Hidayat, S.Pd.", email: "guru19@sekolah.sch.id" },
  ];

  const createdGuruMapel: any[] = [];
  for (const guru of guruMapelData) {
    const user = await prisma.user.create({
      data: {
        name: guru.name,
        email: guru.email,
        password: defaultPassword,
        role: "GURU",
        sekolahId: sekolah.id,
      },
    });
    createdGuruMapel.push(user);
  }

  console.log(`Total 30 Guru berhasil dibuat: 12 Wali Kelas + 18 Guru Mapel.`);

  // 5. Buat 12 Kelas (1A s/d 6B) dengan masing-masing 1 Wali Kelas
  console.log("Membuat 12 kelas (1A-6B)...");
  const kelasConfigs = [
    { nama: "1A", tingkat: 1 },
    { nama: "1B", tingkat: 1 },
    { nama: "2A", tingkat: 2 },
    { nama: "2B", tingkat: 2 },
    { nama: "3A", tingkat: 3 },
    { nama: "3B", tingkat: 3 },
    { nama: "4A", tingkat: 4 },
    { nama: "4B", tingkat: 4 },
    { nama: "5A", tingkat: 5 },
    { nama: "5B", tingkat: 5 },
    { nama: "6A", tingkat: 6 },
    { nama: "6B", tingkat: 6 },
  ];

  const createdKelasMap: Record<string, any> = {};
  for (let i = 0; i < kelasConfigs.length; i++) {
    const cfg = kelasConfigs[i];
    const wali = createdWaliKelas[i];
    const k = await prisma.kelas.create({
      data: {
        nama: cfg.nama,
        tingkat: cfg.tingkat,
        tahunAjaran: "2026/2027",
        sekolahId: sekolah.id,
        waliKelasId: wali.id,
      },
    });
    createdKelasMap[cfg.nama] = k;
  }
  console.log("12 Rombongan Belajar berhasil dibuat dan dipasangkan ke masing-masing Wali Kelas.");

  // 6. Buat Master Mata Pelajaran (Kurikulum Merdeka SD)
  console.log("Membuat master mata pelajaran...");
  const mapelList = [
    { kode: "PAI", nama: "Pendidikan Agama Islam & Budi Pekerti" },
    { kode: "PPKN", nama: "Pendidikan Pancasila" },
    { kode: "BIN", nama: "Bahasa Indonesia" },
    { kode: "MAT", nama: "Matematika" },
    { kode: "IPAS", nama: "Ilmu Pengetahuan Alam dan Sosial (IPAS)" },
    { kode: "SB", nama: "Seni dan Budaya" },
    { kode: "PJOK", nama: "Pendidikan Jasmani, Olahraga, dan Kesehatan" },
    { kode: "BIG", nama: "Bahasa Inggris" },
  ];

  const createdMapelMap: Record<string, any> = {};
  for (const m of mapelList) {
    const created = await prisma.mataPelajaran.create({ data: m });
    createdMapelMap[m.kode] = created;
  }
  console.log("8 Mata Pelajaran berhasil dibuat.");

  // 7. Buat Penugasan Guru Pengampu (Pengampu)
  console.log("Membuat penugasan guru pengampu (Pengampu)...");
  const pengampuList: any[] = [];

  // [A] Penugasan Guru Spesifik Pengujian: Bu Siti Rahma, M.Pd. (guru2@eraport.sch.id)
  // - Semester 1 (Ganjil): Mengajar 3 rombel (1A Matematika, 1B Matematika, 3A IPAS)
  // - Semester 2 (Genap) : Hanya mengajar 1 rombel (1A Matematika)
  const sitiRahma = createdGuruMapel[0];
  pengampuList.push(
    {
      guruId: sitiRahma.id,
      mapelId: createdMapelMap["MAT"].id,
      kelasId: createdKelasMap["1A"].id,
      tahunAjaran: "2026/2027",
      semester: 0, // Berlaku di SEMUA semester (Ganjil & Genap)
    },
    {
      guruId: sitiRahma.id,
      mapelId: createdMapelMap["MAT"].id,
      kelasId: createdKelasMap["1B"].id,
      tahunAjaran: "2026/2027",
      semester: 1, // HANYA diajar pada Semester Ganjil (1)
    },
    {
      guruId: sitiRahma.id,
      mapelId: createdMapelMap["IPAS"].id,
      kelasId: createdKelasMap["3A"].id,
      tahunAjaran: "2026/2027",
      semester: 1, // HANYA diajar pada Semester Ganjil (1)
    }
  );

  // [B] Penugasan Wali Kelas 1A (Budi Santoso, S.Pd. - guru1@eraport.sch.id)
  // - Kelas 1A: Bahasa Indonesia & Pendidikan Pancasila
  const budiSantoso = createdWaliKelas[0];
  pengampuList.push(
    {
      guruId: budiSantoso.id,
      mapelId: createdMapelMap["BIN"].id,
      kelasId: createdKelasMap["1A"].id,
      tahunAjaran: "2026/2027",
    },
    {
      guruId: budiSantoso.id,
      mapelId: createdMapelMap["PPKN"].id,
      kelasId: createdKelasMap["1A"].id,
      tahunAjaran: "2026/2027",
    }
  );

  // [C] Distribusi penugasan untuk guru-guru lainnya ke sisa kelas & mapel
  const otherGuruList = [...createdGuruMapel.slice(1), ...createdWaliKelas.slice(1)];
  let guruIdx = 0;
  for (const kelasKey of Object.keys(createdKelasMap)) {
    const k = createdKelasMap[kelasKey];
    for (const mapelKey of ["PAI", "BIN", "IPAS", "PJOK", "BIG", "SB"]) {
      // Lewati jika sudah di-assign secara manual di atas
      const alreadyAssigned = pengampuList.some(
        (p) => p.kelasId === k.id && p.mapelId === createdMapelMap[mapelKey].id
      );
      if (!alreadyAssigned) {
        const assignedGuru = otherGuruList[guruIdx % otherGuruList.length];
        guruIdx++;
        pengampuList.push({
          guruId: assignedGuru.id,
          mapelId: createdMapelMap[mapelKey].id,
          kelasId: k.id,
          tahunAjaran: "2026/2027",
        });
      }
    }
  }

  await prisma.pengampu.createMany({
    data: pengampuList,
    skipDuplicates: true,
  });
  console.log(`Total ${pengampuList.length} penugasan guru pengampu berhasil dibuat.`);

  // 7b. Buat Sampel Tujuan Pembelajaran (TP) untuk Siti Rahma, M.Pd.
  await prisma.tujuanPembelajaran.createMany({
    data: [
      {
        kode: "TP 1",
        deskripsi: "menghitung operasi penjumlahan dan pengurangan bilangan cacah sampai 100",
        tingkat: 1,
        semester: 1,
        tahunAjaran: "2026/2027",
        mapelId: createdMapelMap["MAT"].id,
        guruId: sitiRahma.id,
      },
      {
        kode: "TP 2",
        deskripsi: "mengidentifikasi dan membedakan pola bentuk bangun datar serta bangun ruang",
        tingkat: 1,
        semester: 1,
        tahunAjaran: "2026/2027",
        mapelId: createdMapelMap["MAT"].id,
        guruId: sitiRahma.id,
      },
      {
        kode: "TP 3",
        deskripsi: "menyelesaikan soal cerita kontekstual operasi bilangan dalam kehidupan sehari-hari",
        tingkat: 1,
        semester: 1,
        tahunAjaran: "2026/2027",
        mapelId: createdMapelMap["MAT"].id,
        guruId: sitiRahma.id,
      },
      {
        kode: "TP 1",
        deskripsi: "mengidentifikasi bagian tubuh tumbuhan beserta fungsinya bagi kelangsungan hidup",
        tingkat: 3,
        semester: 1,
        tahunAjaran: "2026/2027",
        mapelId: createdMapelMap["IPAS"].id,
        guruId: sitiRahma.id,
      },
      {
        kode: "TP 2",
        deskripsi: "menjelaskan siklus hidup dan metamorfosis pada hewan di lingkungan sekitar",
        tingkat: 3,
        semester: 1,
        tahunAjaran: "2026/2027",
        mapelId: createdMapelMap["IPAS"].id,
        guruId: sitiRahma.id,
      },
      {
        kode: "TP 1",
        deskripsi: "menghitung operasi hitung campuran bilangan bulat dan pecahan dengan cermat",
        tingkat: 6,
        semester: 1,
        tahunAjaran: "2026/2027",
        mapelId: createdMapelMap["MAT"].id,
        guruId: sitiRahma.id,
      },
      {
        kode: "TP 2",
        deskripsi: "menentukan keliling dan luas lingkaran menggunakan rumus yang tepat",
        tingkat: 6,
        semester: 1,
        tahunAjaran: "2026/2027",
        mapelId: createdMapelMap["MAT"].id,
        guruId: sitiRahma.id,
      },
    ],
  });
  console.log("Sampel Tujuan Pembelajaran (TP) berhasil dibuat.");

  // 8. Buat 15 Siswa untuk Setiap Kelas (12 kelas x 15 = 180 Siswa)
  console.log("Membuat 180 siswa (15 siswa di setiap kelas)...");

  const namaDepanL = [
    "Ahmad", "Muhammad", "Rizki", "Fajar", "Bima", "Dimas", "Bagas", "Aditya",
    "Rafi", "Alif", "Ilham", "Daffa", "Gilang", "Reza", "Farhan", "Bayu",
    "Zaki", "Yoga", "Hafiz", "Dani"
  ];
  const namaDepanP = [
    "Aulia", "Siti", "Putri", "Nabila", "Zahra", "Anisa", "Rina", "Salma",
    "Syifa", "Tiara", "Lestari", "Dinda", "Fitri", "Nadia", "Aisyah", "Keyla",
    "Salsabila", "Maya", "Cantika", "Mutia"
  ];
  const namaBelakang = [
    "Pratama", "Saputra", "Ramadhan", "Kusuma", "Hidayat", "Wijaya", "Setiawan",
    "Nugraha", "Santoso", "Firmansyah", "Utami", "Lestari", "Wulandari", "Anggraini",
    "Permata", "Maharani", "Sari", "Prameswari", "Syahrini", "Gunawan"
  ];

  const siswaList: any[] = [];
  let siswaCounter = 1;

  for (const kelasKey of Object.keys(createdKelasMap)) {
    const k = createdKelasMap[kelasKey];

    for (let s = 1; s <= 15; s++) {
      const isLaki = s % 2 !== 0;
      const depanList = isLaki ? namaDepanL : namaDepanP;
      const depan = depanList[(siswaCounter + s) % depanList.length];
      const belakang = namaBelakang[(siswaCounter * 2 + s) % namaBelakang.length];
      const nama = `${depan} ${belakang}`;

      const nisn = `008${String(1000000 + siswaCounter).slice(1)}`; // 10 digit unik
      const nis = `202607${String(1000 + siswaCounter).slice(1)}`; // 7 digit unik

      siswaList.push({
        nisn,
        nis,
        nama,
        jenisKelamin: isLaki ? "L" : "P",
        alamat: `Jl. Melati No. ${s}, Kel. Gambir, Jakarta Pusat`,
        kelasId: k.id,
      });

      siswaCounter++;
    }
  }

  await prisma.siswa.createMany({
    data: siswaList,
  });
  console.log(`Total ${siswaList.length} siswa berhasil didistribusikan ke 12 kelas (15 siswa/kelas).`);

  console.log(`
========================================================================
            RINGKASAN HASIL SEEDING DATA PERCONTOHAN LENGKAP
========================================================================
Institusi   : ${sekolah.nama} (NPSN: ${sekolah.npsn})
Total Guru  : 30 Akun Guru (12 Wali Kelas + 18 Guru Mapel)
Total Rombel: 12 Kelas (1A s/d 6B) - Masing-masing memiliki 1 Wali Kelas
Total Mapel : 8 Mata Pelajaran (Kurikulum Merdeka SD)
Total Siswa : 180 Siswa Aktif (15 Siswa per Kelas)
Password All: password123

------------------------------------------------------------------------
KREDENSIAL PENGUJIAN UTAMA:
------------------------------------------------------------------------
1. SUPER ADMIN (SaaS Platform Owner)
   - Email    : superadmin@eraport.id
   - Password : password123
   - Rute     : /super-admin

2. ADMIN SEKOLAH (Tata Usaha SD Negeri 01)
   - Email    : admin@sekolah.sch.id
   - Password : password123
   - Rute     : /admin-sekolah

3. GURU MENGAMPU BANYAK MAPEL & KELAS (Contoh Bu Siti Rahma)
   - Email    : guru2@eraport.sch.id
   - Password : password123
   - Rute     : /guru
   - Mengampu : 
     * Kelas 1A -> Matematika (15 Siswa)
     * Kelas 1B -> Matematika (15 Siswa)
     * Kelas 3A -> IPAS (15 Siswa)
     * Kelas 6A -> Matematika (15 Siswa)
   - Total Siswa Diajar: 60 Siswa!

4. WALI KELAS 1A (Budi Santoso, S.Pd.)
   - Email    : guru1@eraport.sch.id
   - Password : password123
   - Rute     : /wali-kelas (dan /guru)
   - Mengampu : Kelas 1A (Bahasa Indonesia & PPKn)
========================================================================
  `);
}

main()
  .catch((e) => {
    console.error("Gagal melakukan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });