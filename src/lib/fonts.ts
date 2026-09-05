import { Plus_Jakarta_Sans, JetBrains_Mono, Geist, Poppins } from "next/font/google";

export const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const poppins = Poppins({
    weight: ["400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    variable: "--font-poppins",
    display: "swap",
});
    