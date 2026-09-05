import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fcfbf9] text-zinc-900 flex flex-col justify-between selection:bg-[#1b4332] selection:text-emerald-100">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {children}
      </div>
      <footer className="py-6 text-center text-xs text-zinc-500 border-t border-stone-200/60">
        E-Rapor SD &copy; 2026 • Sistem Informasi Kurikulum Merdeka
      </footer>
    </div>
  );
}
