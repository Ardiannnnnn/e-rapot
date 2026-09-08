"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/types";

export default function DashboardHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const isWaliKelas = Boolean(user.kelasWali) || user.role === "WALI_KELAS";
  const isGuruMode = pathname.startsWith("/guru");

  const getBreadcrumbs = () => {
    if (pathname.startsWith("/wali-kelas/siswa")) {
      return { section: "Wali Kelas", page: "Peserta Didik Binaan" };
    }
    if (pathname.startsWith("/wali-kelas/import-nilai")) {
      return { section: "Wali Kelas", page: "Import Nilai Excel" };
    }
    if (pathname.startsWith("/wali-kelas/pelengkap")) {
      return { section: "Wali Kelas", page: "Presensi & Ekskul" };
    }
    if (pathname.startsWith("/wali-kelas/cetak")) {
      return { section: "Wali Kelas", page: "Cetak Rapor Siswa" };
    }
    if (pathname === "/wali-kelas") {
      return { section: "Wali Kelas", page: "Kelengkapan Nilai Rombel" };
    }
    if (pathname.startsWith("/guru/siswa")) {
      return { section: "Guru Mapel", page: "Input Nilai Siswa" };
    }
    if (pathname.startsWith("/guru/tp")) {
      return { section: "Guru Mapel", page: "Tujuan Pembelajaran (TP)" };
    }
    if (pathname === "/guru") {
      return { section: "Guru Mapel", page: "Beranda Kelas Diampu" };
    }
    if (pathname.startsWith("/admin-sekolah/profil")) {
      return { section: "Admin Sekolah", page: "Profil Sekolah" };
    }
    if (pathname.startsWith("/admin-sekolah/tahun-ajaran")) {
      return { section: "Admin Sekolah", page: "Tahun Ajaran & Semester" };
    }
    if (pathname.startsWith("/admin-sekolah/kelas")) {
      return { section: "Admin Sekolah", page: "Master Kelas & Rombel" };
    }
    if (pathname.startsWith("/admin-sekolah/mapel")) {
      return { section: "Admin Sekolah", page: "Master Mata Pelajaran" };
    }
    if (pathname.startsWith("/admin-sekolah/pendidik")) {
      return { section: "Admin Sekolah", page: "Pendidik & Penugasan" };
    }
    if (pathname.startsWith("/admin-sekolah/siswa")) {
      return { section: "Admin Sekolah", page: "Data Siswa" };
    }
    if (pathname === "/admin-sekolah") {
      return { section: "Admin Sekolah", page: "Dashboard Admin" };
    }
    return { section: "Dashboard", page: "" };
  };

  const { section, page } = getBreadcrumbs();

  return (
    <header className="hidden lg:flex print:hidden sticky top-0 z-30 border-b border-stone-200 bg-[#fcfbf9]/95 backdrop-blur-md px-8 py-3 items-center justify-between">
      {/* Breadcrumb Navigasi Kiri */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
        <span>Portal</span>
        <span>/</span>
        <span className="font-medium text-zinc-700">{section}</span>
        {page && (
          <>
            <span>/</span>
            <span className="font-semibold text-emerald-900">{page}</span>
          </>
        )}
      </div>

      {/* Bagian Kanan: Switcher Peran & Profil Pengguna */}
      <div className="flex items-center gap-4">
        {/* Tombol Switch Mode: Guru Mapel vs Wali Kelas */}
        {isWaliKelas && (
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-2xs">
            <Link
              href="/guru/siswa"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isGuruMode
                  ? "bg-[#1b4332] text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-stone-200/60"
              }`}
            >
              <span>👨‍🏫 Guru Mapel</span>
            </Link>
            <Link
              href="/wali-kelas"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isGuruMode
                  ? "bg-[#1b4332] text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-stone-200/60"
              }`}
            >
              <span>🏫 Wali Kelas {user.kelasWali ? `(${user.kelasWali.nama})` : ""}</span>
            </Link>
          </div>
        )}

        {/* Profil Akun Login */}
        <div className="flex items-center gap-3 pl-2 border-l border-stone-200">
          <div className="text-right">
            <p className="text-xs font-semibold text-zinc-900 leading-tight">{user.name}</p>
            <span className="text-[10px] text-zinc-500 font-mono block">
              {user.email}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1b4332] text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
