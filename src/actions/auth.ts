"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isValidEmail, sanitizeInput } from "@/lib/sanitize";
import { signJWT } from "@/lib/jwt";
import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/rate-limit";

export async function loginAction(formData: { email: string; password: string }) {
  const email = sanitizeInput(formData.email || "").toLowerCase();
  const password = formData.password || "";

  if (!email || !password || !isValidEmail(email)) {
    return { success: false, message: "Format email atau kata sandi tidak valid." };
  }

  // 1. Periksa batas percobaan login (Rate Limiting: maks 3x gagal, tunggu 5 menit / 15 menit)
  const clientIp = await getClientIp();
  const rateLimitKey = `login_${clientIp}_${email}`;

  const limitCheck = checkRateLimit(rateLimitKey);
  if (limitCheck.isBlocked) {
    return {
      success: false,
      message: `Terlalu banyak percobaan login gagal. Silakan tunggu ${limitCheck.formattedTime} sebelum mencoba lagi.`,
    };
  }

  // 2. Cari user di database via Prisma (Parameterized query - Kebal SQL Injection)
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const failed = recordFailedAttempt(rateLimitKey, 3);
    if (failed.isBlocked) {
      return {
        success: false,
        message: `Terlalu banyak percobaan login gagal. Silakan tunggu ${failed.formattedTime} sebelum mencoba lagi.`,
      };
    }
    return {
      success: false,
      message: "Email atau kata sandi salah.",
    };
  }

  // Cek status aktif akun
  if (user.isActive === false) {
    return {
      success: false,
      message: "Akun Anda berstatus nonaktif. Silakan hubungi Administrator Sekolah.",
    };
  }

  // 3. Verifikasi password hash menggunakan bcryptjs
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const failed = recordFailedAttempt(rateLimitKey, 3);
    if (failed.isBlocked) {
      return {
        success: false,
        message: `Terlalu banyak percobaan login gagal. Silakan tunggu ${failed.formattedTime} sebelum mencoba lagi.`,
      };
    }
    return {
      success: false,
      message: "Email atau kata sandi salah.",
    };
  }

  // 4. Reset counter kegagalan karena login berhasil
  resetRateLimit(rateLimitKey);

  // 3. Terbitkan Signed JWT Token bertanda tangan rahasia server
  const token = await signJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    sekolahId: user.sekolahId || null,
  });

  // 4. Set cookie session aman (HttpOnly, SameSite, Secure)
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
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
