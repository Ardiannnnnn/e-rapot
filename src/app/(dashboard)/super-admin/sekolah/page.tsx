import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import KelolaSekolahClient from "./kelola-sekolah-client";

export default async function SuperAdminSekolahPage() {
  await requireUser();

  const sekolahList = await prisma.sekolah.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { kelas: true, users: true },
      },
      users: {
        where: {
          role: "ADMIN_SEKOLAH",
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return <KelolaSekolahClient initialSekolahList={sekolahList} />;
}
