import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@eraport.id";
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD || "AdminNilaiKu2003";
  const name = process.env.SUPER_ADMIN_NAME || "Super Administrator";

  console.log(`[Seed Super Admin] Menyiapkan akun Super Admin: ${email}...`);

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      sekolahId: null,
    },
  });

  console.log(`\n✅ Akun Super Admin berhasil disiapkan!`);
  console.log(`   ID      : ${superAdmin.id}`);
  console.log(`   Email   : ${superAdmin.email}`);
  console.log(`   Nama    : ${superAdmin.name}`);
  console.log(`   Role    : ${superAdmin.role}`);
  console.log(`   Status  : ${superAdmin.isActive ? "Aktif" : "Nonaktif"}`);
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    console.log(`   Password: AdminNilaiKu2003`);
  } else {
    console.log(`   Password: [Menggunakan SUPER_ADMIN_PASSWORD dari env]`);
  }
  process.exit(0);
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding Super Admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
