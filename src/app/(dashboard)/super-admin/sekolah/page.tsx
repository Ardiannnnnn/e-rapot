import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import KelolaSekolahClient from "./kelola-sekolah-client";

export default function SuperAdminSekolahPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <SuperAdminSekolahContent />
    </Suspense>
  );
}

async function SuperAdminSekolahContent() {
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
