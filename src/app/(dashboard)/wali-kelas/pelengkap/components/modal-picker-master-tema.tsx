"use client";

import Link from "next/link";
import { XIcon, SlidersHorizontalIcon, CheckIcon } from "@/components/shared/icons";

interface ModalPickerMasterTemaProps {
  isOpen: boolean;
  siswaNama: string;
  slotNo: number;
  currentTema: string;
  temaMasterList: string[];
  onSelect: (tema: string) => void;
  onClose: () => void;
}

export function ModalPickerMasterTema({
  isOpen,
  siswaNama,
  slotNo,
  currentTema,
  temaMasterList,
  onSelect,
  onClose,
}: ModalPickerMasterTemaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 font-poppins">
              Pilih Tema dari Master Kokurikuler (P5)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Untuk siswa: <strong className="text-zinc-800">{siswaNama}</strong> • Slot Tema {slotNo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-stone-100 transition"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Master Options List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Daftar Tema di Master ({temaMasterList.length} Pilihan):
          </p>
          {temaMasterList.map((tema, idx) => {
            const isSelected = tema === currentTema;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelect(tema);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start justify-between gap-3 group cursor-pointer shadow-2xs ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                    : "border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p
                      className={`text-xs leading-relaxed font-semibold ${
                        isSelected ? "text-emerald-950 font-bold" : "text-zinc-800 group-hover:text-emerald-950"
                      }`}
                    >
                      {tema}
                    </p>
                    {isSelected && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        Tema Aktif Saat Ini
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && <CheckIcon className="h-4 w-4 text-emerald-700 shrink-0 mt-1" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <Link
            href="/wali-kelas/master-deskripsi"
            className="text-xs text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1.5"
          >
            <SlidersHorizontalIcon className="h-3.5 w-3.5 text-emerald-700" />
            Kelola Master Tema
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50 transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
