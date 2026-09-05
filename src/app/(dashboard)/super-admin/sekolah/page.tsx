import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export default async function SuperAdminSekolahPage() {
  await requireUser();

  const sekolahList = await prisma.sekolah.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { kelas: true, users: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mb-1">
            <Link href="/super-admin" className="hover:text-zinc-800">
              Super Admin
            </Link>
            <span>/</span>
            <span className="text-zinc-800 font-semibold">Kelola Sekolah</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 font-poppins">
            Daftar Sekolah Binaan (Tenants)
          </h1>
        </div>

        <Link
          href="/super-admin/sekolah/tambah"
          className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white transition shadow-xs flex items-center gap-1.5 w-fit"
        >
          <span>+</span> Tambah Sekolah Baru
        </Link>
      </div>

      {/* Tabel Sekolah */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        {sekolahList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-500">Belum ada sekolah yang terdaftar di sistem.</p>
            <Link
              href="/super-admin/sekolah/tambah"
              className="mt-3 inline-block text-xs font-semibold text-[#1b4332] hover:underline"
            >
              Klik di sini untuk menambah sekolah baru
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-[#fbfaf8] text-zinc-600 font-mono">
                  <th className="py-3.5 px-4 font-semibold">NPSN</th>
                  <th className="py-3.5 px-4 font-semibold">Nama Sekolah</th>
                  <th className="py-3.5 px-4 font-semibold">Kepala Sekolah</th>
                  <th className="py-3.5 px-4 font-semibold">Rombel Kelas</th>
                  <th className="py-3.5 px-4 font-semibold">Status Lisensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sekolahList.map((sek) => (
                  <tr key={sek.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-800">{sek.npsn}</td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">{sek.nama}</td>
                    <td className="py-3.5 px-4 text-zinc-600">{sek.kepalaSekolah || "-"}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-700">{sek._count.kelas} Rombel</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sek.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
