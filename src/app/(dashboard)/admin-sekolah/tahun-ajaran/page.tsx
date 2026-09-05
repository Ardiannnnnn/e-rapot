import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormPeriode, { PeriodeItem } from "./form-periode";

export default async function AdminTahunAjaranPage() {
  const user = await requireUser();

  // Ambil sekolahId
  let sekolahId = user.sekolahId;
  if (!sekolahId) {
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
