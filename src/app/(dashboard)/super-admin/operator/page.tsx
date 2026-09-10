import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import KelolaOperatorClient from "./kelola-operator-client";

export default async function SuperAdminOperatorPage() {
  const user = await requireUser();

  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin-sekolah");
  }

  const [operatorList, sekolahList] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "ADMIN_SEKOLAH",
      },
      include: {
        sekolah: {
          select: {
            id: true,
            nama: true,
            npsn: true,
            isStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sekolah.findMany({
      where: {
        isStatus: true,
      },
      select: {
        id: true,
        nama: true,
        npsn: true,
      },
      orderBy: { nama: "asc" },
    }),
  ]);

  return (
    <KelolaOperatorClient
      initialOperatorList={operatorList}
      sekolahOptions={sekolahList}
    />
  );
}
