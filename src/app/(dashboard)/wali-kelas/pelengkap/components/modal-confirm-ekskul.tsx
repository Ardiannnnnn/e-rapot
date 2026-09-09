"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  XIcon,
  PlusIcon,
  Trash2Icon,
  SlidersHorizontalIcon,
} from "@/components/shared/icons";
import { PredikatEkskul } from "@/types/wali-kelas/pelengkap";

interface ModalConfirmEkskulProps {
  isOpen: boolean;
  type: "ADD" | "DELETE";
  siswaNama: string;
  ekskulNama?: string;
  opsiEkskulList?: string[];
  existingEkskulNames?: string[];
  isSubmitting?: boolean;
  onConfirmAdd?: (data: { nama: string; predikat: PredikatEkskul }) => void;
  onConfirmDelete?: () => void;
  onClose: () => void;
}

export function ModalConfirmEkskul({
  isOpen,
  type,
  siswaNama,
  ekskulNama,
  opsiEkskulList = [],
  existingEkskulNames = [],
  isSubmitting = false,
  onConfirmAdd,
  onConfirmDelete,
  onClose,
}: ModalConfirmEkskulProps) {
  const [selectedNama, setSelectedNama] = useState<string>("");
  const [selectedPredikat, setSelectedPredikat] = useState<PredikatEkskul>("Baik");

  useEffect(() => {
    if (isOpen && type === "ADD") {
      const avail = opsiEkskulList.filter(
        (opt) => !existingEkskulNames.includes(opt)
      );
      setSelectedNama(avail.length > 0 ? avail[0] : opsiEkskulList[0] || "Pramuka");
      setSelectedPredikat("Baik");
    }
  }, [isOpen, type, opsiEkskulList, existingEkskulNames]);

  if (!isOpen) return null;

  const isAdd = type === "ADD";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isAdd
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              <AlertCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                {isAdd ? "Tambah Ekstrakurikuler" : "Hapus Ekstrakurikuler"}
              </h3>
              <p className="text-[11px] text-zinc-500">
                Siswa: <strong className="text-zinc-800 font-semibold">{siswaNama}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {isAdd ? (
          <div className="space-y-3.5 py-1">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Pilih Ekstrakurikuler <span className="text-rose-500">*</span>
              </label>
              {opsiEkskulList.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1.5">
                  <p>Belum ada pilihan ekstrakurikuler di master.</p>
                  <Link
                    href="/wali-kelas/master-deskripsi"
                    className="text-[11px] text-emerald-700 font-semibold underline inline-flex items-center gap-1"
                  >
                    <SlidersHorizontalIcon className="h-3 w-3" />
                    Tambah pilihan di Master Deskripsi
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedNama}
                  onChange={(e) => setSelectedNama(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-semibold bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {opsiEkskulList.map((opt) => {
                    const isTaken = existingEkskulNames.includes(opt);
                    return (
                      <option key={opt} value={opt} disabled={isTaken}>
                        {opt} {isTaken ? "(Sudah Diambil)" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Predikat Nilai <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPredikat}
                onChange={(e) =>
                  setSelectedPredikat(e.target.value as PredikatEkskul)
                }
                className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-semibold bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Sangat Baik">Sangat Baik</option>
                <option value="Baik">Baik</option>
                <option value="Cukup">Cukup</option>
                <option value="Kurang">Kurang</option>
              </select>
            </div>

            <p className="text-[11px] text-zinc-400">
              Data ekstrakurikuler ini akan langsung disimpan ke database setelah ditambahkan.
            </p>
          </div>
        ) : (
          <div className="text-xs text-zinc-600 leading-relaxed space-y-2 py-1">
            <p>
              Apakah Anda yakin ingin menghapus kegiatan{" "}
              <strong className="text-zinc-900 font-semibold">{ekskulNama}</strong> untuk siswa{" "}
              <strong className="text-zinc-900 font-semibold">{siswaNama}</strong>?
            </p>
            <p className="text-[11px] text-zinc-400">
              Data ini akan langsung dihapus dari database.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50 transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting || (isAdd && !selectedNama)}
            onClick={() => {
              if (isAdd) {
                onConfirmAdd?.({
                  nama: selectedNama,
                  predikat: selectedPredikat,
                });
              } else {
                onConfirmDelete?.();
              }
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition shadow-xs disabled:opacity-50 ${
              isAdd
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isAdd ? (
              <>
                <PlusIcon className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Menyimpan..." : "Ya, Tambahkan"}</span>
              </>
            ) : (
              <>
                <Trash2Icon className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Menghapus..." : "Ya, Hapus"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
