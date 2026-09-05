import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import FormProfilSekolah from "./form-profil";

export default async function AdminProfilPage() {
  const user = await requireUser();

  // Cari sekolah terkait user
  let sekolah = user.sekolahId
    ? await prisma.sekolah.findUnique({
        where: { id: user.sekolahId },
      })
    : null;

  if (!sekolah) {
    sekolah = await prisma.sekolah.findFirst();
  }

  if (!sekolah) {
    return (
      <div className="p-8 rounded-2xl border border-stone-200 bg-white text-center">
        <p className="text-zinc-700">Data sekolah belum terdaftar di sistem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner Halaman */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
          Identitas Lembaga • Level Admin Sekolah
        </span>
        <h1 className="text-2xl font-bold font-poppins">
          Profil Sekolah & Kepala Sekolah
        </h1>
        <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
          Kelola data identitas resmi satuan pendidikan, NPSN, alamat, serta pejabat Kepala Sekolah penandatangan rapor siswa.
        </p>
      </div>

      {/* Form Profil */}
      <FormProfilSekolah sekolah={sekolah} />
    </div>
  );
}
