/**
 * Utility Pembersihan & Sanitasi Input (Proteksi XSS & Script Injection)
 */

export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeInput(str: string, maxLength = 500): string {
  if (!str || typeof str !== "string") return "";
  // 1. Potong spasi berlebih
  let cleaned = str.trim();
  // 2. Hapus tag script atau event handler berbahaya secara eksplisit
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/javascript:/gi, "");
  cleaned = cleaned.replace(/on\w+\s*=/gi, "");
  // 3. Batasi panjang karakter untuk mencegah DoS / buffer overload
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  // Format standar: huruf, angka, titik, strip, plus, underscore; domain dengan titik dan TLD min 2 karakter
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 150 && !/[<>]/.test(email);
}


