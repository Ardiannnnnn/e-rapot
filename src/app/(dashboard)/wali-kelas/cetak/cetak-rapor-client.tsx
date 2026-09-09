"use client";

import { useState } from "react";
import { PrinterIcon, UsersIcon, UserIcon, ArrowLeftIcon, FileDownIcon } from "@/components/shared/icons";
import Link from "next/link";
import LembarRapor from "./lembar-rapor";
import { CetakRaporClientProps, LembarRaporData } from "@/types/wali-kelas/cetak";

export default function CetakRaporClient({
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  raporList,
}: CetakRaporClientProps) {
  // "ALL" untuk Cetak Semua Sekaligus, atau id siswa
  const [selectedMode, setSelectedMode] = useState<string>("ALL");

  const handlePrint = () => {
    window.print();
  };

  const displayedList =
    selectedMode === "ALL"
      ? raporList
      : raporList.filter((r) => r.siswa.id === selectedMode);

  return (
    <div className="space-y-6">
      {/* Tombol & Pengaturan Cetak (Disembunyikan saat print) */}
      <div className="print:hidden space-y-6">
        {/* Banner Header */}
        <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-400">•</span>
                <span className="text-xs font-mono text-emerald-200">
                  Kelas {kelasNama} (Tingkat {tingkat})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
                Cetak Rapor Kurikulum Merdeka
              </h1>
              <p className="mt-1 text-sm text-emerald-100/90">
                Tahun Ajaran {tahunAjaran} • Semester {semester === 1 ? "Ganjil" : "Genap"} • {raporList.length} Peserta Didik
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 text-emerald-950 font-bold text-sm hover:bg-emerald-300 transition-all shadow-lg active:scale-95"
              >
                <PrinterIcon className="h-4 w-4" />
                {selectedMode === "ALL"
                  ? `Cetak Bulk Sekelas (${raporList.length} Siswa)`
                  : "Cetak Rapor Siswa Ini"}
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar Pilihan Cetak */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Mode Cetak:
            </span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-[#1b4332]"
            >
              <option value="ALL">
                📄 Cetak Semua Siswa Sekelas ({raporList.length} Siswa - Bulk Print)
              </option>
              <optgroup label="Pilih Individu Siswa">
                {raporList.map((r, idx) => (
                  <option key={r.siswa.id} value={r.siswa.id}>
                    {idx + 1}. {r.siswa.nama} ({r.siswa.nisn})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="text-xs text-zinc-600 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>
              Format standar A4 Portrait Kemendikbudristek • Siap cetak ke printer / Simpan PDF
            </span>
          </div>
        </div>
      </div>

      {/* Area Lembar Rapor (Dicetak ke Kertas / PDF) */}
      <div className="rapor-container space-y-12 print:space-y-0">
        {displayedList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-stone-200 bg-white text-zinc-600">
            Tidak ada data rapor yang tersedia untuk dicetak.
          </div>
        ) : (
          displayedList.map((r) => (
            <div
              key={r.siswa.id}
              className="rapor-sheet-wrapper"
            >
              <LembarRapor data={r} />
            </div>
          ))
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm 1.2cm 1.2cm 1.2cm;
          }
          html, body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          nav,
          aside,
          header,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          .rapor-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .rapor-sheet-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          /* Hanya buat jeda halaman ke siswa berikutnya jika BUKAN siswa terakhir */
          .rapor-sheet-wrapper:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          /* Lembar 1 otomatis jeda ke Lembar 2 */
          .page-1 {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Lembar 2 tidak boleh pecah di tengah halaman */
          .page-2 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .rapor-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}
