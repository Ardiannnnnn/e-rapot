import { SignJWT, jwtVerify } from "jose";

export interface AuthJWTPayload {
  userId: string;
  email: string;
  role: string;
  sekolahId: string | null;
}

const DEFAULT_SECRET = "45271641b48f3520bfc38ce3b81b782e767d45d90109641aca886c4c7109c917";

export function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === DEFAULT_SECRET) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: AUTH_SECRET wajib disetel dengan kunci rahasia unik (bukan default) pada environment production!");
    }
    // Di dev / test, izinkan fallback dengan peringatan satu kali
    if (process.env.NODE_ENV !== "test") {
      console.warn("⚠️  [SECURITY WARNING] AUTH_SECRET belum disetel unik di .env! Menggunakan default secret sementara (TIDAK AMAN UNTUK PRODUCTION).");
    }
  }
  return new TextEncoder().encode(secret || DEFAULT_SECRET);
}

/**
 * Buat Signed JWT Token dengan masa aktif default 7 hari
 */
export async function signJWT(
  payload: AuthJWTPayload,
  expiresIn: string = "7d"
): Promise<string> {
  const secretKey = getSecretKey();

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sekolahId: payload.sekolahId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verifikasi keaslian dan masa berlaku JWT Token
 * Mengembalikan payload jika valid, atau null jika tidak valid/kadaluarsa/dipalsukan
 */
export async function verifyJWT(token: string): Promise<AuthJWTPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      !payload.userId ||
      typeof payload.userId !== "string" ||
      !payload.role ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: (payload.email as string) || "",
      role: payload.role as string,
      sekolahId: (payload.sekolahId as string) || null,
    };
  } catch {
    // Token tidak sah, tanda tangan salah, atau sudah kadaluarsa
    return null;
  }
}
