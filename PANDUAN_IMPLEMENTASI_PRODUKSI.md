# Panduan Implementasi & Deployment Produksi (Vercel & Neon PostgreSQL)
**Aplikasi e-Rapor Multi-Tenant (Kurikulum Merdeka)**  
*Tech Stack: Next.js 16 (App Router + Turbopack) & Neon Serverless PostgreSQL*

---

## 1. Arsitektur Produksi

Aplikasi e-Rapor dirancang dengan arsitektur modern berbasis serverless yang siap menghadapi beban puncak saat periode pengisian nilai dan pembagian rapor:

```
[ Klien / Browser (Guru, Admin, Wali Kelas) ]
                    │
                    ▼  (HTTPS / TLS 1.3 - Vercel Edge Network)
[ Vercel Edge & Serverless Functions (Next.js 16 App Router) ]
   ├── Otentikasi: Stateless Signed JWT (HTTP-Only Secure Cookie)
   ├── Logging: Zero-console output di production (hanya error/warn)
   └── ORM: Prisma 7 Client (dengan Prisma Pg Driver Adapter)
                    │
                    ▼  (Pooled Connection via SSL)
[ Neon Serverless PostgreSQL (Region: ap-southeast-1 Singapore) ]
   ├── PgBouncer Connection Pooler (Mencegah exhaustion koneksi)
   ├── Point-in-Time Restore (PITR) & Automated Daily Snapshots
   └── Multi-Tenant Data Isolation (Tenant-scoped by sekolahId)
```

---

## 2. Persiapan Environment Variables

Environment variables berikut wajib dikonfigurasi di dashboard Vercel (Production & Preview):

| Variabel | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string PostgreSQL Neon dengan PgBouncer pooler | `postgresql://neondb_owner:***@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | Kunci rahasia 256-bit untuk enkripsi/verifikasi JWT session | String heksadesimal 64 karakter (random) |
| `NODE_ENV` | Mode lingkungan aplikasi | `production` (otomatis diatur Vercel) |

### Cara Generate AUTH_SECRET Produksi
Jalankan perintah ini di terminal lokal Anda untuk menghasilkan key yang kuat dan aman:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
> [!CAUTION]
> Jangan pernah membocorkan `AUTH_SECRET` ke git commit atau repository publik. Nilai ini hanya boleh disimpan di environment variables Vercel dan file `.env` lokal Anda.

---

## 3. Konfigurasi Proyek & Build Engine

Proyek ini telah dikonfigurasi secara optimal untuk runtime Vercel:

### A. Script Build (`package.json`)
Pastikan script `build` menjalankan generasi Prisma Client sebelum Next.js build:
```json
"scripts": {
  "build": "prisma generate && next build"
}
```

### B. Optimasi Compiler & Log Sanitization (`next.config.ts`)
Console log sensitif (seperti data payload, token debug) secara otomatis dibersihkan oleh compiler Turbopack saat build production:
```ts
compiler: {
  removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
}
```

---

## 4. Langkah-Langkah Deployment ke Vercel

### Langkah 1: Push Perubahan Terakhir ke GitHub
Pastikan seluruh file dan dependensi telah ter-commit ke branch `main`:
```bash
git add package.json PANDUAN_IMPLEMENTASI_PRODUKSI.md
git commit -m "feat: panduan produksi dan optimasi build script"
git push origin main
```

### Langkah 2: Import Proyek di Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New...** > **Project**.
2. Pilih repository GitHub: `Ardiannnnnn/e-rapot`.
3. Di bagian **Configure Project**:
   - **Framework Preset**: Next.js (terdeteksi otomatis).
   - **Root Directory**: `./` (default).
   - **Build Command**: `prisma generate && next build` (atau biarkan default membaca dari `package.json`).
   - **Output Directory**: `.next` (default).

### Langkah 3: Atur Environment Variables di Vercel
Pada bagian **Environment Variables** di Vercel:
1. Tambahkan `DATABASE_URL`: Masukkan connection string Neon **pooled endpoint** (yang berakhiran `-pooler.ap-southeast-1.aws.neon.tech`).
2. Tambahkan `AUTH_SECRET`: Masukkan string 256-bit hasil generate.
3. Klik **Deploy**.

Vercel akan menjalankan build turbopack dan memberikan URL produksi (contoh: `https://e-rapot.vercel.app`).

---

## 5. Konfigurasi Custom Domain Sekolah

Untuk mengaitkan domain resmi sekolah (misal: `rapor.sman1contoh.sch.id`):

1. Di Vercel Dashboard, masuk ke menu **Settings** > **Domains**.
2. Masukkan nama domain Anda: `rapor.sekolah.sch.id` dan klik **Add**.
3. Buka DNS Management penyedia domain sekolah Anda (Cloudflare, Rumahweb, Niagahoster, dll.), tambahkan record berikut:
   - **Tipe**: `CNAME`
   - **Name / Host**: `rapor` (atau subdomain yang dipilih)
   - **Target / Value**: `cname.vercel-dns.com`
4. Vercel akan memverifikasi DNS dan secara otomatis menerbitkan sertifikat SSL/TLS (Let's Encrypt) gratis dan auto-renew.

---

## 6. Manajemen Database Neon di Produksi

### A. Connection Pooling (PgBouncer)
Aplikasi Next.js serverless membuka koneksi instan di setiap request. Menggunakan endpoint pooling Neon sangat penting:
- **Pooled URL (Gunakan untuk runtime Vercel)**:
  `postgresql://neondb_owner:***@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
- **Direct URL (Gunakan jika menjalankan migrasi skema berat/DDL)**:
  URL tanpa kata `-pooler`.

### B. Neon Database Branching (Fitur Unggulan)
Sebelum melakukan perubahan skema database besar di kemudian hari:
1. Buat **Branch Baru** di Neon console (misal: `staging-v2`). Branch ini berupa copy instan database (Copy-on-Write) tanpa memakan kuota storage penuh.
2. Uji coba migration pada branch tersebut.
3. Setelah stabil, terapkan pada database utama (`main`).

### C. Backup & Point-in-Time Restore (PITR)
Neon secara default mencatat log Write-Ahead (WAL):
- Anda dapat mengembalikan (restore) data ke titik waktu tertentu (menit/jam sebelumnya) jika terjadi kesalahan operator sekolah yang tidak disengaja.
- Disarankan membuat snapshot manual sebelum masa input nilai akhir semester dimulai.

---

## 7. Checklist Uji Fungsi Pasca Deployment (Smoke Test)

Lakukan pengujian cepat setelah aplikasi live:

- [ ] **Akses Halaman Login**: Pastikan antarmuka login termuat cepat dan responsif.
- [ ] **Login Super Admin**: Masuk dengan akun SUPER_ADMIN dan pastikan dashboard global menampilkan statistik sekolah dengan tepat.
- [ ] **Login Operator / Admin Sekolah**:
  - Cek katalog **Mata Pelajaran**: Pastikan hanya mapel milik sekolah yang bersangkutan yang muncul.
  - Cek **Daftar Siswa & Kelas**: Pastikan isolasi tenant aman.
  - Uji **Impor Siswa Excel**: Coba unduh template dan lakukan impor file uji coba.
- [ ] **Login Guru & Wali Kelas**:
  - Masuk ke menu input nilai.
  - Pastikan guru hanya dapat menginput nilai pada kelas & mata pelajaran yang diampunya.
  - Uji cetak / unduh Rapor Siswa.
- [ ] **Keamanan Session**: Periksa cookie di browser DevTools; pastikan cookie bertanda `HttpOnly` dan `Secure`.

---

## 8. Runbook Pemeliharaan & Troubleshooting

### A. Cara Rollback Cepat (Instant Rollback)
Jika build baru mengalami kendala:
1. Buka Vercel Dashboard > **Deployments**.
2. Pilih deployment versi sebelumnya yang stabil.
3. Klik tombol **Instant Rollback**. Aplikasi akan langsung kembali ke versi tersebut dalam hitungan detik tanpa perlu build ulang.

### B. Pembaruan Skema Database di Masa Depan
Jika ada penambahan tabel atau kolom baru di `prisma/schema.prisma`:
```bash
# 1. Update schema.prisma secara lokal
# 2. Push skema ke Neon DB
npx prisma db push

# 3. Commit dan push ke GitHub
git add prisma/schema.prisma
git commit -m "feat: skema baru"
git push origin main
```
Vercel akan mendeteksi commit baru, otomatis menjalankan `prisma generate && next build`, dan merilis versi terbaru.

---
*Dokumen ini dibuat sebagai acuan resmi deployment sistem e-Rapor Kurikulum Merdeka.*
