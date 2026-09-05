"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSekolahAction(formData: {
  npsn: string;
  nama: string;
  alamat?: string;
  kepalaSekolah?: string;
  nipKepsek?: string;
}) {
  const { npsn, nama, alamat, kepalaSekolah, nipKepsek } = formData;

  if (!npsn || !nama) {
    return { success: false, message: "NPSN dan Nama Sekolah wajib diisi." };
  }

  // Cek duplikasi NPSN
  const existing = await prisma.sekolah.findUnique({
    where: { npsn },
  });

  if (existing) {
    return { success: false, message: "NPSN ini sudah terdaftar sebelumnya." };
  }

  await prisma.sekolah.create({
    data: {
      npsn,
      nama,
      alamat: alamat || null,
      kepalaSekolah: kepalaSekolah || null,
      nipKepsek: nipKepsek || null,
      status: "AKTIF",
    },
  });

  revalidatePath("/super-admin/sekolah");
  revalidatePath("/super-admin");

  return { success: true };
}
