import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  } else if (user.role === "ADMIN_SEKOLAH" || user.role === "ADMIN") {
    redirect("/admin-sekolah");
  } else if (user.role === "WALI_KELAS") {
    redirect("/wali-kelas");
  } else {
    redirect("/guru");
  }
}
