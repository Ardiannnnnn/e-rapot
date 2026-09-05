"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { SessionUser, MenuItem, MenuGroup, Role } from "@/types";

interface SidebarProps {
  user: SessionUser;
  activeClass?: string;
}

export default function Sidebar({ user, activeClass = "Kelas 4-A" }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const role = user.role;

  // Grup Menu Terpadu Berdasarkan RBAC Blueprint
  const menuGroups: MenuGroup[] = [
    // 0. Ruang Lingkup SUPER ADMIN (Tingkat Paling Tinggi / SaaS Multi-Tenant)
    {
      groupLabel: "Super Admin (SaaS)",
      items: [
        {
          title: "Dashboard SaaS",
          href: "/super-admin",
          icon: LayoutDashboardIcon,
          allowedRoles: ["SUPER_ADMIN"],
        },
        {
          title: "Kelola Sekolah",
          href: "/super-admin/sekolah",
          icon: SchoolIcon,
          badge: "Tenants",
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
          allowedRoles: ["SUPER_ADMIN"],
        },
        {
          title: "Tambah Sekolah Baru",
          href: "/super-admin/sekolah/tambah",
          icon: LayersIcon,
          allowedRoles: ["SUPER_ADMIN"],
        },
      ],
    },

    // 1. Ruang Lingkup ADMIN SEKOLAH (Level 1 - 4)
    {
      groupLabel: "Admin Sekolah",
      items: [
        {
          title: "Dashboard Sekolah",
          href: "/admin-sekolah",
          icon: LayoutDashboardIcon,
          allowedRoles: ["ADMIN_SEKOLAH", "ADMIN"],
        },
        {
          title: "Profil Sekolah",
          href: "/admin-sekolah/profil",
          icon: SchoolIcon,
          allowedRoles: ["ADMIN_SEKOLAH", "ADMIN"],
        },
        {
          title: "Tahun & Semester",
          href: "/admin-sekolah/tahun-ajaran",
          icon: CalendarIcon,
          badge: "Aktif",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          allowedRoles: ["ADMIN_SEKOLAH", "ADMIN"],
        },
        {
          title: "Master Kelas & Rombel",
          href: "/admin-sekolah/kelas",
          icon: LayersIcon,
          allowedRoles: ["ADMIN_SEKOLAH", "ADMIN"],
        },
        {
          title: "Master Mata Pelajaran",
          href: "/admin-sekolah/mapel",
          icon: BookOpenIcon,
          allowedRoles: ["ADMIN_SEKOLAH", "ADMIN"],
        },
        {
          title: "Pendidik & Penugasan",
          href: "/admin-sekolah/pendidik",
          icon: UsersIcon,
          allowedRoles: ["ADMIN_SEKOLAH", "ADMIN"],
        },
        {
          title: "Data Siswa",
          href: "/admin-sekolah/siswa",
          icon: UsersIcon,
          badge: "Excel",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          allowedRoles: ["ADMIN_SEKOLAH", "ADMIN"],
        },
      ],
    },

    // 2. Ruang Lingkup GURU MATA PELAJARAN (Level 5 - 7)
    {
      groupLabel: "Guru Mapel",
      items: [
        {
          title: "Beranda Kelas Diampu",
          href: "/guru",
          icon: LayoutDashboardIcon,
          allowedRoles: ["GURU"],
        },
        {
          title: "Data Siswa & Nilai",
          href: "/guru/siswa",
          icon: UsersIcon,
          badge: "Input Nilai",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          allowedRoles: ["GURU"],
        },
        {
          title: "Tujuan Pembelajaran (TP)",
          href: "/guru/tp",
          icon: SparklesIcon,
          badge: "Kurikulum",
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
          allowedRoles: ["GURU"],
        },
      ],
    },

    // 3. Ruang Lingkup WALI KELAS (Level 8 - 9)
    {
      groupLabel: "Wali Kelas",
      items: [
        {
          title: "Kelengkapan Nilai",
          href: "/wali-kelas",
          icon: LayoutDashboardIcon,
          allowedRoles: ["WALI_KELAS"],
        },
        {
          title: "Peserta Didik Binaan",
          href: "/wali-kelas/siswa",
          icon: UsersIcon,
          allowedRoles: ["WALI_KELAS"],
        },
        {
          title: "Import Nilai Excel",
          href: "/wali-kelas/import-nilai",
          icon: TableSpreadsheetIcon,
          badge: "Excel",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          allowedRoles: ["WALI_KELAS"],
        },
        {
          title: "Presensi & Ekskul",
          href: "/wali-kelas/pelengkap",
          icon: ClipboardListIcon,
          badge: "S/I/A",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
          allowedRoles: ["WALI_KELAS"],
        },
        {
          title: "Cetak Rapor Siswa",
          href: "/wali-kelas/cetak",
          icon: PrinterIcon,
          badge: "Bulk PDF",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          allowedRoles: ["WALI_KELAS"],
        },
      ],
    },
  ];

  const isWaliKelas = Boolean(user.kelasWali) || user.role === "WALI_KELAS";
  const isGuruMode = pathname.startsWith("/guru");

  const isItemAllowed = (item: MenuItem) => {
    if (!item.allowedRoles) return true;

    // Jika user adalah Wali Kelas yang juga mengajar (peran ganda):
    if (isWaliKelas && (user.role === "WALI_KELAS" || user.role === "GURU")) {
      if (isGuruMode) {
        // Sedang di mode Guru Mapel: tampilkan menu Guru Mapel
        return item.allowedRoles.includes("GURU");
      } else {
        // Sedang di mode Wali Kelas: tampilkan menu Wali Kelas
        return item.allowedRoles.includes("WALI_KELAS");
      }
    }

    return item.allowedRoles.includes(role);
  };

  const getRoleBadge = (r: Role | string) => {
    switch (r) {
      case "SUPER_ADMIN":
        return { label: "Super Admin (SaaS)", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "ADMIN_SEKOLAH":
      case "ADMIN":
        return { label: "Admin Sekolah", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "WALI_KELAS":
        return { label: "Wali Kelas", bg: "bg-[#e9f0ec] text-[#1b4332] border-[#c2d7ca]" };
      case "GURU":
        return { label: "Guru Mapel", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      default:
        return { label: r, bg: "bg-stone-100 text-stone-700 border-stone-200" };
    }
  };

  const roleMeta = isWaliKelas
    ? isGuruMode
      ? { label: "Mode Guru Mapel", bg: "bg-blue-50 text-blue-700 border-blue-200" }
      : { label: `Wali ${user.kelasWali?.nama || "Kelas"}`, bg: "bg-[#e9f0ec] text-[#1b4332] border-[#c2d7ca]" }
    : getRoleBadge(user.role);

  return (
    <>
      {/* Mobile Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-[#fcfbf9] border-b border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#1b4332] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
            ER
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 block leading-tight font-mono">
              E-Rapor SD
            </span>
            <span className="text-[10px] text-zinc-500 block leading-tight">
              Kurikulum Merdeka
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
          className="p-2 rounded-lg border border-stone-200 bg-white text-zinc-700 hover:bg-stone-50 transition"
        >
          {isMobileOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-stone-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:shadow-none"
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="p-5 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1b4332] to-[#143225] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
                  ER
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-bold text-sm text-zinc-900 tracking-tight font-poppins">
                      E-Rapor SD
                    </h1>
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 text-[#1b4332] uppercase">
                      v1.0
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Kurikulum Merdeka
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-stone-100"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Context Badge */}
            <div className="mt-4 p-2.5 rounded-xl bg-[#f8f7f4] border border-stone-200/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Semester Ganjil
                </span>
                <span className="font-mono font-medium text-zinc-700">2026/2027</span>
              </div>
              {isWaliKelas && !isGuruMode && (
                <div className="mt-1.5 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Rombel Binaan:</span>
                  <span className="font-semibold text-[#1b4332] font-mono">{activeClass}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto overflow-x-hidden scrollbar-thin">
            {menuGroups.map((group, groupIdx) => {
              const visibleItems = group.items.filter(isItemAllowed);
              if (visibleItems.length === 0) return null;

              return (
                <div key={groupIdx} className="space-y-1">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600 font-mono">
                    {group.groupLabel}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? "bg-[#1b4332] text-white shadow-xs font-semibold"
                              : "text-zinc-600 hover:bg-[#f6f5f2] hover:text-zinc-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-emerald-200" : "text-zinc-600 group-hover:text-zinc-900"
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                isActive
                                  ? "bg-white/20 text-white border-white/20"
                                  : item.badgeColor || "bg-stone-100 text-zinc-600 border-stone-200"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-stone-200 bg-[#fbfaf8]">
          <div className="p-2.5 rounded-xl border border-stone-200/80 bg-white shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1b4332]/10 border border-[#1b4332]/20 flex items-center justify-center text-xs font-bold text-[#1b4332] shrink-0 font-mono">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900 truncate leading-tight">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-medium border font-mono ${roleMeta.bg}`}
                  >
                    {roleMeta.label}
                  </span>
                </div>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Keluar dari Aplikasi"
                aria-label="Logout"
                className="p-1.5 rounded-lg text-zinc-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-2 px-2 flex items-center justify-between text-[10px] text-zinc-600 font-mono">
            <span>Rapor-SD &copy; 2026</span>
            <span>Kemendikbud</span>
          </div>
        </div>
      </aside>
    </>
  );
}

// Inline SVGs
function LayoutDashboardIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function SchoolIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 6 8-4 8 4" /><path d="m18 10 3.4 1.7a1 1 0 0 1 .6.9v6.4a1 1 0 0 1-.6.9L18 22" /><path d="M4 10 2 11" /><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" /><path d="M18 5v17" /><path d="M6 5v17" /><circle cx="12" cy="9" r="2" />
    </svg>
  );
}

function CalendarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function LayersIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function UsersIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BookOpenIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function TableSpreadsheetIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function ClipboardListIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}

function PrinterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" />
    </svg>
  );
}

function LogOutIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function MenuIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
