import { Suspense } from "react";
import DashboardLoading from "@/app/(dashboard)/loading";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import FormPeriode from "./form-periode";
import { PeriodeItem } from "@/types/admin-sekolah";

export default function AdminTahunAjaranPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminTahunAjaranContent />
    </Suspense>
  );
}

async function AdminTahunAjaranContent() {
  const user = await requireRole(["ADMIN_SEKOLAH", "ADMIN", "SUPER_ADMIN"]);

  // Ambil sekolahId
  let sekolahId = user.sekolahId;
  if (!sekolahId && user.role === "SUPER_ADMIN") {
    const defaultSekolah = await prisma.sekolah.findFirst();
    sekolahId = defaultSekolah?.id || null;
  }

  const periodes = sekolahId
    ? await prisma.periodeAkademik.findMany({
        where: { sekolahId },
        orderBy: [{ tahunAjaran: "desc" }, { semester: "asc" }],
      })
    : [];

  const periodeList: PeriodeItem[] = periodes.map((p) => ({
    id: p.id,
    tahunAjaran: p.tahunAjaran,
    semester: p.semester,
    isAktif: p.isAktif,
    statusNilai: p.statusNilai,
    tanggalCetak: p.tanggalCetak ? p.tanggalCetak.toISOString() : null,
    tempatCetak: p.tempatCetak,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div>
      <FormPeriode periodeList={periodeList} />
    </div>
  );
}
