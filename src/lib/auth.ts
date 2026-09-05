import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionToken },
    include: {
      kelasWali: true,
    },
  });

  if (!user) return null;

  return user as unknown as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
