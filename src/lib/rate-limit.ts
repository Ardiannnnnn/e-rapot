import { headers } from "next/headers";

interface RateLimitRecord {
  count: number; // Jumlah kegagalan pada siklus aktif
  blockStage: number; // Tingkat blokir: 0 (5m), 1 (15m), 2 (30m), 3+ (1 jam)
  blockedUntil: number; // Timestamp milidetik sampai kapan diblokir
  lastAttempt: number;
}

// In-memory store untuk melacak kegagalan login per IP + Email
const rateLimitStore = new Map<string, RateLimitRecord>();

// Pembersihan otomatis data kedaluwarsa setiap 10 menit
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      const lastActive = Math.max(record.lastAttempt, record.blockedUntil);
      // Hapus jika sudah tidak diblokir dan tidak ada aktivitas selama 24 jam
      if (record.blockedUntil < now && now - lastActive > 24 * 60 * 60 * 1000) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Mendapatkan IP klien dari request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // Fallback jika dipanggil di luar konteks request
  }
  return "127.0.0.1";
}

/**
 * Format durasi detik menjadi teks ramah pengguna (contoh: "1 jam", "30 menit", "15 menit", "4 menit 30 detik", atau "45 detik")
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return "beberapa detik";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSecs = seconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} jam ${minutes} menit`;
    }
    return `${hours} jam`;
  }

  if (minutes > 0) {
    if (remainingSecs > 0) {
      return `${minutes} menit ${remainingSecs} detik`;
    }
    return `${minutes} menit`;
  }

  return `${seconds} detik`;
}

/**
 * Memeriksa apakah key (IP + email) sedang dalam masa tunggu (terblokir)
 */
export function checkRateLimit(key: string): {
  isBlocked: boolean;
  remainingSeconds: number;
  formattedTime: string;
} {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return { isBlocked: false, remainingSeconds: 0, formattedTime: "" };
  }

  if (record.blockedUntil > now) {
    const remainingSeconds = Math.max(1, Math.ceil((record.blockedUntil - now) / 1000));
    return {
      isBlocked: true,
      remainingSeconds,
      formattedTime: formatRemainingTime(remainingSeconds),
    };
  }

  return { isBlocked: false, remainingSeconds: 0, formattedTime: "" };
}

// Tangga durasi blokir bertingkat (dalam milidetik):
// Siklus 1 (3x gagal): 5 menit
// Siklus 2 (3x gagal berikutnya): 15 menit
// Siklus 3 (3x gagal berikutnya): 30 menit
// Siklus 4+ (3x gagal berikutnya dst): 1 jam (60 menit)
const BLOCK_DURATIONS = [
  5 * 60 * 1000,   // Siklus 1: 5 menit
  15 * 60 * 1000,  // Siklus 2: 15 menit
  30 * 60 * 1000,  // Siklus 3: 30 menit
  60 * 60 * 1000,  // Siklus 4+: 1 jam
];

const IDLE_RESET_TIME = 24 * 60 * 60 * 1000; // Reset tangga blokir jika tidak ada aktivitas selama 24 jam

/**
 * Mencatat percobaan login yang gagal.
 * Aturan:
 * - Batas maksimal: 3 kali gagal per siklus.
 * - Siklus 1: tunggu 5 menit.
 * - Siklus 2: naik ke 15 menit.
 * - Siklus 3: naik ke 30 menit.
 * - Siklus 4+: naik ke 1 jam.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 3
): {
  isBlocked: boolean;
  remainingSeconds: number;
  formattedTime: string;
  attempts: number;
} {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  const lastActive = record ? Math.max(record.lastAttempt, record.blockedUntil) : 0;

  if (!record || (record.blockedUntil < now && now - lastActive > IDLE_RESET_TIME)) {
    record = {
      count: 1,
      blockStage: 0,
      blockedUntil: 0,
      lastAttempt: now,
    };
  } else {
    record.count += 1;
    record.lastAttempt = now;
  }

  // Jika telah mencapai batas maksimal percobaan gagal (3x)
  if (record.count >= maxAttempts) {
    // Tentukan durasi blokir bertingkat sesuai blockStage
    const stageIndex = Math.min(record.blockStage, BLOCK_DURATIONS.length - 1);
    const durationMs = BLOCK_DURATIONS[stageIndex];

    record.blockedUntil = now + durationMs;
    record.blockStage += 1;
    record.count = 0; // Reset counter untuk siklus berikutnya

    rateLimitStore.set(key, record);

    const remainingSeconds = Math.max(1, Math.ceil(durationMs / 1000));
    return {
      isBlocked: true,
      remainingSeconds,
      formattedTime: formatRemainingTime(remainingSeconds),
      attempts: maxAttempts,
    };
  }

  rateLimitStore.set(key, record);
  return {
    isBlocked: false,
    remainingSeconds: 0,
    formattedTime: "",
    attempts: record.count,
  };
}

/**
 * Reset catatan kegagalan saat pengguna berhasil login dengan password yang benar
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
