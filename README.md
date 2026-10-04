# NilaiKu — Platform Rapor & Penilaian Kurikulum Merdeka

**NilaiKu** adalah aplikasi web modern untuk pengelolaan penilaian akademik dan pencetakan rapor digital berbasis Kurikulum Merdeka. Dirancang untuk memudahkan kolaborasi antara Guru, Wali Kelas, dan Admin Sekolah secara cepat, akurat, dan efisien.

---

## Fitur Utama

- **Multi-Role & Hak Akses**: Super Admin, Admin Sekolah / Operator, Guru Mata Pelajaran, dan Wali Kelas.
- **Manajemen Data Akademik**: Pengelolaan Sekolah, Tahun Ajaran, Semester, Kelas/Rombel, dan Peserta Didik.
- **Penilaian Pembelajaran**:
  - Penilaian berbasis Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP).
  - Pengaturan bobot nilai (Tugas, UTS, UAS) dengan kalkulasi nilai akhir otomatis.
  - Import dan export nilai via Excel (.xlsx).
- **Data Pelengkap Rapor**:
  - Rekapitulasi Presensi (Sakit, Izin, Alpa).
  - Ekstrakurikuler & Predikat.
  - Kokurikuler (Projek P5) berbasis tema dinamis.
  - 7 Kebiasaan Anak Indonesia Hebat & Catatan/Saran Wali Kelas.
  - Status Kenaikan / Kelulusan Siswa.
- **Cetak Rapor Digital**:
  - Format lembar rapor Kurikulum Merdeka standar nasional.
  - Cetak lembar rapor per siswa dan Bulk PDF per kelas.

---

## Teknologi

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, TypeScript)
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL & [Prisma ORM](https://www.prisma.io/)
- **Autentikasi**: JWT Session aman (Cookie HttpOnly, durasi 8 jam)

---

## Menjalankan Proyek

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Sinkronisasi Database**:
   ```bash
   npx prisma db push
   ```

3. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```