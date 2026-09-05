"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import LoginModal from "@/components/login";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="w-full bg-[#fcfbf9]/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo Brand Kiri */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#1b4332] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
            ER
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-zinc-900 leading-none font-mono">
              E-Rapor SD
            </span>
            <span className="text-[11px] text-zinc-600 mt-1 leading-none font-mono">
              Kurikulum Merdeka
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#1b4332] hover:bg-[#143225] text-white transition-all shadow-xs"
          >
            Masuk Portal
          </Link>
        </div>
      </div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}
