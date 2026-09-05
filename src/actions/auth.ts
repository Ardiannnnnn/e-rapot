"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isValidEmail, sanitizeInput } from "@/lib/sanitize";

export async function loginAction(formData: { email: string; password: string }) {
  const email = sanitizeInput(formData.email || "").toLowerCase();
  const password = formData.password || "";

  if (!email || !password || !isValidEmail(email)) {
    return { success: false, message: "Format email atau kata sandi tidak valid." };
  }

  // 1. Cari user di database via Prisma (Parameterized query - Kebal SQL Injection)
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, message: "Email atau kata sandi salah." };
  }

  // Cek status aktif akun
  if (user.isActive === false) {
    return {
      success: false,
      message: "Akun Anda berstatus nonaktif. Silakan hubungi Administrator Sekolah.",
    };
  }

  // 2. Verifikasi password hash menggunakan bcryptjs
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return { success: false, message: "Email atau kata sandi salah." };
  }

  // 3. Set cookie session aman (HttpOnly, SameSite, Secure)
  const cookieStore = await cookies();
  cookieStore.set("session_token", user.id.toString(), {
    httpOnly: true, // Kebal pencurian XSS dari JS browser
    sameSite: "lax", // Kebal CSRF
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 minggu
    path: "/",
  });

  // Tentukan rute tujuan berdasarkan role
  let redirectUrl = "/admin-sekolah";
  if (user.role === "SUPER_ADMIN") {
    redirectUrl = "/super-admin";
  } else if (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN") {
    redirectUrl = "/admin-sekolah";
  } else if (user.role === "WALI_KELAS") {
    redirectUrl = "/wali-kelas";
  } else if (user.role === "GURU") {
    redirectUrl = "/guru";
  }

  return { success: true, redirectUrl };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  redirect("/login");
}
