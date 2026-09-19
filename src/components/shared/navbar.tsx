"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginModal from "@/components/login";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="w-full pt-4 pb-2 px-4 sticky top-0 z-30 flex justify-center">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-md border border-stone-200/90 rounded-full px-5 py-2.5 flex items-center justify-between shadow-xs">
        {/* Brand Kiri */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl overflow-hidden shadow-xs border border-stone-200/80 bg-[#1b4332] flex items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/logo.webp"
              alt="Logo NilaiKu"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-900 font-poppins">
            NilaiKu
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="group relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-semibold shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
            <span>Masuk Portal</span>
          </button>
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}
