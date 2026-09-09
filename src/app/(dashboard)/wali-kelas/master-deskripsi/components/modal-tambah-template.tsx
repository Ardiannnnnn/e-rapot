"use client";

import { useState, useEffect } from "react";
import { XIcon, SaveIcon } from "@/components/shared/icons";
import { KategoriTemplate } from "@/types/wali-kelas/master-deskripsi";
import { ModalConfirmMaster } from "./modal-confirm-master";

interface ModalTambahTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: KategoriTemplate;
  currentCount: number;
  isSubmitting: boolean;
  onTambah: (judul: string, teks: string) => Promise<boolean>;
}

export function ModalTambahTemplate({
  isOpen,
  onClose,
  activeTab,
  currentCount,
  isSubmitting,
  onTambah,
}: ModalTambahTemplateProps) {
  const [formJudul, setFormJudul] = useState("");
  const [formTeks, setFormTeks] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormJudul(
        activeTab === "TEMA_P5"
          ? `Tema ${currentCount + 1}`
          : activeTab === "EKSKUL"
          ? ""
          : `Pilihan ${currentCount + 1}`
      );
      setFormTeks("");
      setIsConfirmOpen(false);
    }
  }, [isOpen, activeTab, currentCount]);

  if (!isOpen) return null;

  const finalJudul =
    activeTab === "EKSKUL" ? formTeks.trim() : formJudul.trim();

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeks.trim()) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmAdd = async () => {
    const success = await onTambah(finalJudul, formTeks.trim());
    if (success) {
      setIsConfirmOpen(false);
      onClose();
    }
  };

  const modalTitle =
    activeTab === "TEMA_P5"
      ? "Tambah Tema Projek P5"
      : activeTab === "KEBIASAAN"
      ? "Tambah Opsi 7 Kebiasaan Anak Hebat"
      : activeTab === "SARAN_WALI"
      ? "Tambah Opsi Saran-saran Wali"
      : "Tambah Kegiatan Ekstrakurikuler Baru";

  const placeholderTeks =
    activeTab === "TEMA_P5"
      ? "Contoh: Tema 4 : Kewirausahaan ( Mengolah Makanan Tradisional )"
      : activeTab === "KEBIASAAN"
      ? "Contoh: Terbiasa dalam merapikan alat belajar sendiri dan belum terbiasa sarapan pagi"
      : activeTab === "SARAN_WALI"
      ? "Contoh: Tingkatkan terus ketelitian dalam belajar dan pertahankan adab yang santun."
      : "Contoh: Karate / Robotika / Paskibra / Renang";

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-zinc-900 font-poppins">
              {modalTitle}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 p-1"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handlePreSubmit} className="space-y-4">
            {activeTab !== "EKSKUL" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  Judul / Label Singkat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tema 4 : Kewirausahaan"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                {activeTab === "EKSKUL"
                  ? "Nama Kegiatan Ekstrakurikuler *"
                  : "Isi Deskripsi / Teks Lengkap *"}
              </label>
              <textarea
                rows={activeTab === "EKSKUL" ? 2 : 4}
                required
                placeholder={placeholderTeks}
                value={formTeks}
                onChange={(e) => setFormTeks(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formTeks.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition shadow-xs"
              >
                <SaveIcon className="h-4 w-4" />
                <span>Simpan Pilihan</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Alert Konfirmasi Tambah */}
      <ModalConfirmMaster
        isOpen={isConfirmOpen}
        type="ADD"
        title="Konfirmasi Tambah Template"
        message="Apakah Anda yakin ingin menambahkan template ini ke daftar master deskripsi?"
        itemText={finalJudul ? `${finalJudul}: ${formTeks.trim()}` : formTeks.trim()}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmAdd}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
