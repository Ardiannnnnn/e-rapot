import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/shared/sidebar";
import DashboardHeader from "@/components/shared/dashboard-header";
import { ToastProvider } from "@/components/shared/toast";

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

  // 2. Ambil periode akademik aktif sekolah
  const periodeAktif = user.sekolahId
    ? await prisma.periodeAkademik.findFirst({
        where: { sekolahId: user.sekolahId, isAktif: true },
        select: { tahunAjaran: true, semester: true },
      })
    : null;

  const assignedClass = user.kelasWali ? `Kelas ${user.kelasWali.nama}` : "";

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#fcfbf9] text-zinc-900 selection:bg-[#1b4332] selection:text-emerald-100 flex flex-col lg:flex-row print:block print:bg-white print:p-0 print:m-0">
        {/* Navigasi Sidebar Bersama */}
        <div className="print:hidden">
          <Sidebar user={user} activeClass={assignedClass} periodeAktif={periodeAktif} />
        </div>

        {/* Konten Utama Kanan */}
        <div className="flex-1 flex flex-col min-w-0 print:block print:w-full print:p-0 print:m-0">
          {/* Top Bar Header Dinamis */}
          <div className="print:hidden">
            <DashboardHeader user={user} />
          </div>

          {/* Dynamic Page Children */}
          <main className="flex-1 px-6 sm:px-8 py-8 w-full print:p-0 print:m-0 print:w-full print:max-w-none">
            {children}
          </main>

          <footer className="border-t border-stone-200 py-6 text-center text-xs text-zinc-500 mt-auto print:hidden">
            NilaiKu &copy; 2026 • Sistem Informasi Kurikulum Merdeka
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}

