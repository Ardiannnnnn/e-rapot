"use client";

import React, { useState } from "react";
import Image from "next/image";
import LoginModal from "./login";

export default function NetworkHero() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-center text-center">
      {/* smartphone landingpage */}
      <div className="w-full md:hidden flex flex-col items-center text-center">
        <div className="flex flex-col items-center justify-center pt-1 pb-2">
          <div className="relative group mb-2.5">
            <div className="p-1.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 border border-emerald-200/90 shadow-2xs flex items-center justify-center">
              <div className="relative w-14 h-14 rounded-xl p-0.5 bg-gradient-to-br from-emerald-400 via-emerald-600 to-[#1b4332] shadow-md shadow-emerald-900/20 shrink-0">
                <Image
                  src="/logo.webp"
                  alt="Logo NilaiKu"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover rounded-[10px]"
                  priority
                />
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-poppins">
            NilaiKu
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            All-in-one Platform Rapor & Penilaian Sekolah
          </p>
        </div>
        <div className="w-full max-w-sm mx-auto mt-4 px-2">
          <div className="relative pl-6 border-l-2 border-emerald-400/80 ml-3.5 space-y-3 text-left">
            <div className="relative">
              <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-700" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-amber-400 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center text-lg shadow-sm shadow-amber-500/25 shrink-0 border border-white/50">
                    💡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Adaptif
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                      Menyesuaikan Kurikulum
                    </h4>
                    <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                      Bisa menyesuaikan dengan kurikulum sekolah (Kurikulum Merdeka, K13, atau khas yayasan).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-blue-400 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 flex items-center justify-center text-lg shadow-sm shadow-blue-500/25 shrink-0 border border-white/50 text-white">
                    📊
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        Kompatibel
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                      Smart Excel Importer
                    </h4>
                    <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                      Guru leluasa input via format Excel yang sudah familiar lalu diunggah instan sekali klik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-orange-400 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 via-rose-500 to-rose-600 flex items-center justify-center text-lg shadow-sm shadow-orange-500/25 shrink-0 border border-white/50 text-white font-bold">
                    ⚡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                        Efisiensi
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                      85% Lebih Cepat & Otomatis
                    </h4>
                    <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                      Hitung nilai akhir & pembobotan otomatis tanpa risiko rumus rusak atau salah ketik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-emerald-400 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm shadow-black/5 shrink-0 border border-stone-200">
                    🖨️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Publikasi
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                      1-Klik Cetak Rapor Rapi
                    </h4>
                    <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                      Format rapor standar lengkap dengan cover, capaian kompetensi, presensi, hingga karakter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol CTA Masuk Portal */}
          <div className="mt-6 pt-2 pb-2">
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-semibold text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Buka Portal Rapor</span>
              <span className="text-base">→</span>
            </button>
          </div>
        </div>
      </div>
      {/* end smartphone landingpage */}

      {/* desktop landingpage */}
      <div className="hidden md:flex w-full flex-col items-center">
        <div className="relative w-full max-w-5xl my-4 sm:my-8 px-2">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 960 360"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M 285 85 L 390 85 L 440 180 L 450 180"
              stroke="#cbd5e1"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M 285 275 L 390 275 L 440 180 L 450 180"
              stroke="#cbd5e1"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M 510 180 L 520 180 L 570 85 L 675 85"
              stroke="#cbd5e1"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M 510 180 L 520 180 L 570 275 L 675 275"
              stroke="#cbd5e1"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M 285 85 L 390 85 L 440 180 L 450 180"
              stroke="#10b981"
              strokeWidth="1.75"
              className="pipeline-flowing-stroke"
            />
            <path
              d="M 285 275 L 390 275 L 440 180 L 450 180"
              stroke="#10b981"
              strokeWidth="1.75"
              className="pipeline-flowing-stroke"
            />
            <path
              d="M 510 180 L 520 180 L 570 85 L 675 85"
              stroke="#10b981"
              strokeWidth="1.75"
              className="pipeline-flowing-stroke"
            />
            <path
              d="M 510 180 L 520 180 L 570 275 L 675 275"
              stroke="#10b981"
              strokeWidth="1.75"
              className="pipeline-flowing-stroke"
            />
            <circle cx="390" cy="85" r="4" fill="#8b5cf6" className="animate-pulse" />
            <circle cx="390" cy="275" r="4" fill="#8b5cf6" className="animate-pulse" />
            <circle cx="570" cy="85" r="4" fill="#8b5cf6" className="animate-pulse" />
            <circle cx="570" cy="275" r="4" fill="#8b5cf6" className="animate-pulse" />
          </svg>

          <div className="w-full grid grid-cols-[1fr_auto_1fr] gap-8 items-center relative z-10">
            <div className="flex flex-col gap-6 items-end">
              <div className="w-full max-w-[290px] p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all text-left group">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center text-xl shadow-md shadow-amber-500/25 shrink-0 border border-white/40 group-hover:scale-105 transition-transform">
                    💡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        Adaptif
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                      Menyesuaikan Kurikulum
                    </h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                      Bisa menyesuaikan dengan kurikulum sekolah (Kurikulum Merdeka, K13, atau khas yayasan).
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[290px] p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-left group">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 flex items-center justify-center text-xl shadow-md shadow-blue-500/25 shrink-0 border border-white/40 text-white group-hover:scale-105 transition-transform">
                    📊
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        Kompatibel
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                      Smart Excel Importer
                    </h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                      Guru leluasa input via format Excel yang sudah familiar lalu diunggah instan sekali klik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-r from-emerald-600 to-teal-500 opacity-25 blur-lg group-hover:opacity-50 transition-opacity" />
                <div className="relative w-[98px] h-[98px] rounded-[28px] p-0.5 bg-gradient-to-br from-emerald-400 via-emerald-600 to-[#1b4332] shadow-2xl shadow-emerald-800/35 transition-transform group-hover:scale-105 duration-300">
                  <div className="w-full h-full rounded-[26px] overflow-hidden bg-[#1b4332] flex items-center justify-center shadow-inner">
                    <Image
                      src="/logo.webp"
                      alt="Logo NilaiKu"
                      width={98}
                      height={98}
                      className="w-full h-full object-cover rounded-[26px]"
                      priority
                    />
                  </div>
                </div>
              </div>

              <span className="mt-2.5 text-[11px] font-bold font-mono text-emerald-950 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
                NilaiKu
              </span>
            </div>

            <div className="flex flex-col gap-6 items-start">
              <div className="w-full max-w-[290px] p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm hover:shadow-md hover:border-orange-400 transition-all text-left group">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-orange-400 via-rose-500 to-rose-600 flex items-center justify-center text-xl shadow-md shadow-orange-500/25 shrink-0 border border-white/40 text-white font-bold group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200">
                        Efisiensi
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                      85% Lebih Cepat & Otomatis
                    </h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                      Hitung nilai akhir & pembobotan otomatis tanpa risiko rumus rusak atau salah ketik.
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[290px] p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all text-left group">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center text-xl shadow-md shadow-black/8 shrink-0 border border-stone-200 group-hover:scale-105 transition-transform">
                    🖨️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Publikasi
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                      1-Klik Cetak Rapor Rapi
                    </h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                      Format rapor standar lengkap dengan cover, capaian kompetensi, presensi, hingga karakter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 max-w-4xl leading-[1.1] font-poppins mt-3">
          All-in-one Platform <span className="text-[#1b4332]">NilaiKu</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
          <strong>NilaiKu</strong> adalah platform modern yang dirancang untuk menyesuaikan kurikulum sekolah Anda, menyederhanakan rekapitulasi nilai, hingga pencetakan rapor instan.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-semibold text-sm shadow-xl shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Buka Portal Rapor
          </button>
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
