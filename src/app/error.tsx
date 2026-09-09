"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error untuk kebutuhan internal debugging developer
    console.error("Terjadi error sistem/koneksi:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center p-6 text-zinc-900 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-8 shadow-lg text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-xs">
          ⚠️
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-poppins text-zinc-900">
            Ada masalah dengan koneksi
          </h2>

          <p className="text-xs text-zinc-600 leading-relaxed">
            Silakan coba lagi beberapa saat lagi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center justify-center gap-2"
          >
            <span>↻</span>
            <span>Coba Lagi</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-zinc-700 text-xs font-medium hover:bg-stone-50 transition"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
