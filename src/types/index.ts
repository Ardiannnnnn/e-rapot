export type Role = "SUPER_ADMIN" | "ADMIN_SEKOLAH" | "ADMIN" | "GURU" | "WALI_KELAS";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  sekolahId?: string | null;
  kelasWali?: {
    id: string;
    nama: string;
    tingkat: number;
    tahunAjaran: string;
  } | null;
}

export interface MenuItem {
  title: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
  badge?: string;
  badgeColor?: string;
  allowedRoles?: Role[];
}

export interface MenuGroup {
  groupLabel: string;
  items: MenuItem[];
}
