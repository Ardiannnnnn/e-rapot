import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { verifyJWT } from "@/lib/jwt";

/**
 * Mendapatkan pengguna yang sedang login berdasarkan JWT session token.
 * Dibungkus dengan React cache() agar dalam 1 kali render halaman (layout, header, page),
 * query database hanya dieksekusi 1 kali (Request-Level Deduping).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;

  // 1. Verifikasi tanda tangan kriptografis JWT
  const payload = await verifyJWT(sessionToken);
  if (!payload) return null;

  // 2. Ambil data user terkini dari database berdasarkan userId terverifikasi
  console.log(`\x1b[36mℹ️  [DB HIT - USER SESSION]\x1b[0m Query database dieksekusi untuk: ${payload.email}`);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      kelasWali: true,
    },
  });

  if (!user || user.isActive === false) return null;

  return user as unknown as SessionUser;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Memastikan user login dan memiliki role yang diizinkan.
 * Jika tidak berhak, otomatis redirect ke dashboard yang sesuai atau /login.
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "SUPER_ADMIN") {
      redirect("/super-admin");
    } else if (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN") {
      redirect("/admin-sekolah");
    } else if (user.role === "WALI_KELAS") {
      redirect("/wali-kelas");
    } else if (user.role === "GURU") {
      redirect("/guru");
    } else {
      redirect("/login");
    }
  }

  return user;
}
