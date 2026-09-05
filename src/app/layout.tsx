import type { Metadata } from "next";
import "./globals.css";
import { poppins, fontMono, fontSans } from "@/lib/fonts";


export const metadata: Metadata = {
  title: "E-Rapor Digital | Sistem Penilaian Siswa",
  description: "Portal manajemen nilai dan capaian hasil belajar siswa",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${poppins.variable} ${fontMono.variable} ${fontSans.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
