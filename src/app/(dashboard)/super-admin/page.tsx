import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

export default function SuperAdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <SuperAdminDashboardContent />
    </Suspense>
  );
}

async function SuperAdminDashboardContent() {
  const user = await requireRole(["SUPER_ADMIN"]);

  const [totalSekolah, totalSiswa, totalGuru, daftarSekolah] = await Promise.all([
    prisma.sekolah.count(),
    prisma.siswa.count(),
    prisma.user.count({ where: { role: { in: ["ADMIN_SEKOLAH", "ADMIN", "GURU", "WALI_KELAS"] } } }),
    prisma.sekolah.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { kelas: true, users: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Banner Sapaan */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-3 backdrop-blur-sm">
            Portal Pemilik Platform SaaS • Multi-Tenant Level
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
            Panel Super Admin, {user.name} 
          </h1>
        </div>
      </div>

      {/* Kartu Ringkasan Global */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Sekolah Terdaftar
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalSekolah}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Instansi sekolah aktif (Tenants)
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Total Siswa Seluruh Sekolah
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalSiswa}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Akumulasi peserta didik
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Akun Pendidik & Admin
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1b4332] font-mono">
            {totalGuru}
          </p>
          <span className="mt-1 block text-[11px] text-zinc-600">
            Pengguna aktif di platform
          </span>
        </div>
      </div>

      {/* Aksi Cepat & Daftar Sekolah */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900 font-poppins">Daftar Sekolah Binaan</h2>
            <p className="text-xs text-zinc-500">Daftar instansi penyewa yang terdaftar di sistem e-raport</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/super-admin/sekolah"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white transition shadow-xs flex items-center gap-1.5"
            >
              <span>🏛️</span> Kelola Sekolah
            </Link>
            <Link
              href="/super-admin/operator"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5"
            >
              <span>👥</span> Kelola Operator
            </Link>
          </div>
        </div>

        {daftarSekolah.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-zinc-500 font-medium">Belum ada data sekolah yang didaftarkan.</p>
            <Link
              href="/super-admin/sekolah"
              className="mt-3 inline-block text-xs font-semibold text-[#1b4332] hover:underline"
            >
              Daftarkan sekolah pertama sekarang &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-stone-100">
            {daftarSekolah.map((sek) => (
              <div key={sek.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">{sek.nama}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5 font-mono">
                    <span>NPSN: {sek.npsn}</span>
                    <span>•</span>
                    <span>Kepsek: {sek.kepalaSekolah || "-"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sek.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
