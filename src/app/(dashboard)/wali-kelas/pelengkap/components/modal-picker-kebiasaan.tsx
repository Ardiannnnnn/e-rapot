"use client";

import Link from "next/link";
import { XIcon, SlidersHorizontalIcon } from "@/components/shared/icons";

interface ModalPickerKebiasaanProps {
  isOpen: boolean;
  siswaNama?: string;
  opsiList: string[];
  onSelect: (opsi: string) => void;
  onClose: () => void;
}

export function ModalPickerKebiasaan({
  isOpen,
  siswaNama,
  opsiList,
  onSelect,
  onClose,
}: ModalPickerKebiasaanProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 font-poppins">
              Pilih Opsi 7 Kebiasaan Anak Indonesia Hebat
            </h3>
            {siswaNama && (
              <p className="text-xs text-zinc-500">
                Untuk: <strong>{siswaNama}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {opsiList.map((opsi, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(opsi)}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition flex items-start gap-3 group"
            >
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                {idx + 1}
              </span>
              <div className="text-xs text-zinc-800 leading-relaxed group-hover:text-emerald-950 font-medium">
                {opsi}
              </div>
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <Link
            href="/wali-kelas/master-deskripsi"
            className="text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1.5"
          >
            <SlidersHorizontalIcon className="h-3.5 w-3.5" />
            Kelola Pilihan Opsi di Master Deskripsi
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
