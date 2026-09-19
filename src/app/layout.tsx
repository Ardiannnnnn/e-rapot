import type { Metadata } from "next";
import "./globals.css";
import { poppins, fontMono, fontSans } from "@/lib/fonts";


export const metadata: Metadata = {
  title: "NilaiKu | Platform Rapor & Penilaian Digital",
  description: "Platform all-in-one pengelolaan nilai dan pencetakan rapor digital fleksibel untuk sekolah",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
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
