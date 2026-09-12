import { NextResponse, type NextRequest } from "next/server";
import { verifyJWT } from "@/lib/jwt";

function getRoleHomePath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "ADMIN_SEKOLAH":
    case "ADMIN":
      return "/admin-sekolah";
    case "WALI_KELAS":
      return "/wali-kelas";
    case "GURU":
      return "/guru";
    default:
      return "/dashboard";
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("session_token")?.value;

  // 1. Verifikasi token via Web Crypto (jose)
  const payload = token ? await verifyJWT(token) : null;

  // 2. Proteksi Halaman Login
  if (pathname === "/login") {
    if (payload) {
      // Pengguna sudah login, arahkan langsung ke dashboard sesuai role
      const redirectUrl = new URL(getRoleHomePath(payload.role), request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 3. Identifikasi Jalur yang Dilindungi (Protected Routes)
  const isProtected =
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/admin-sekolah") ||
    pathname.startsWith("/wali-kelas") ||
    pathname.startsWith("/guru") ||
    pathname.startsWith("/dashboard");

  if (isProtected) {
    if (!payload) {
      // Belum login atau token kadaluarsa/tidak valid
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      // Bersihkan cookie sesi yang cacat/kadaluarsa
      if (token) {
        response.cookies.delete("session_token");
      }
      return response;
    }

    // 4. Role-Based Access Control (RBAC) Enforcement
    const role = payload.role;

    // A. Akses Super Admin: Hanya untuk SUPER_ADMIN
    if (pathname.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
    }

    // B. Akses Admin Sekolah: Hanya untuk ADMIN_SEKOLAH, ADMIN, SUPER_ADMIN
    if (
      pathname.startsWith("/admin-sekolah") &&
      role !== "ADMIN_SEKOLAH" &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
    }

    // C. Akses Wali Kelas: Hanya untuk WALI_KELAS, ADMIN_SEKOLAH, ADMIN, SUPER_ADMIN
    if (
      pathname.startsWith("/wali-kelas") &&
      role !== "WALI_KELAS" &&
      role !== "ADMIN_SEKOLAH" &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
    }

    // D. Akses Guru: Hanya untuk role pengajar dan administrator
    if (
      pathname.startsWith("/guru") &&
      role !== "GURU" &&
      role !== "WALI_KELAS" &&
      role !== "ADMIN_SEKOLAH" &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/super-admin/:path*",
    "/admin-sekolah/:path*",
    "/wali-kelas/:path*",
    "/guru/:path*",
    "/dashboard/:path*",
  ],
};
