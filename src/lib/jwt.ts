import { SignJWT, jwtVerify } from "jose";

export interface AuthJWTPayload {
  userId: string;
  email: string;
  role: string;
  sekolahId: string | null;
}

const DEFAULT_SECRET = "45271641b48f3520bfc38ce3b81b782e767d45d90109641aca886c4c7109c917";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
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
