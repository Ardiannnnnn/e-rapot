import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/shared/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Verifikasi sesi pengguna
  const user = await getCurrentUser();

  // Jika belum login, redirect ke halaman login
  if (!user) {
    redirect("/login");
  }

  const assignedClass = user.kelasWali ? `Kelas ${user.kelasWali.nama}` : "Kelas 4-A";

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-zinc-900 selection:bg-[#1b4332] selection:text-emerald-100 flex flex-col lg:flex-row">
      {/* Navigasi Sidebar Bersama */}
      <Sidebar user={user} activeClass={assignedClass} />

      {/* Konten Utama Kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="hidden lg:flex sticky top-0 z-30 border-b border-stone-200 bg-[#fcfbf9]/95 backdrop-blur-md px-8 py-3.5 items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span>Portal</span>
            <span>/</span>
            <span className="font-semibold text-zinc-800 capitalize">
              {user.role === "ADMIN"
                ? "Admin Sekolah"
                : user.role === "WALI_KELAS"
                ? "Wali Kelas"
                : "Guru Mapel"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-900 leading-tight">{user.name}</p>
              <span className="text-[10px] text-zinc-500 font-mono">
                {user.email}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1b4332] text-white flex items-center justify-center font-bold text-xs font-mono">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dynamic Page Children */}
        <main className="flex-1 px-6 sm:px-8 py-8 w-full">
          {children}
        </main>

        <footer className="border-t border-stone-200 py-6 text-center text-xs text-zinc-500 mt-auto">
          E-Rapor SD &copy; 2026 • Sistem Informasi Kurikulum Merdeka
        </footer>
      </div>
    </div>
  );
}
