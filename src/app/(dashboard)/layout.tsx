import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/shared/sidebar";
import DashboardHeader from "@/components/shared/dashboard-header";

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
        {/* Top Bar Header Dinamis */}
        <DashboardHeader user={user} />

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
