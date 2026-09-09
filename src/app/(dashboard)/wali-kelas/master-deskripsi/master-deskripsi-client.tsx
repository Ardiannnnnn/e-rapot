"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  PlusIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
  XIcon,
  SmileIcon,
  BookOpenIcon,
  ArrowRightIcon,
  TrophyIcon,
} from "@/components/shared/icons";
import {
  tambahTemplateAction,
  updateTemplateAction,
  hapusTemplateAction,
  resetDefaultTemplateAction,
} from "@/actions/master-deskripsi";
import {
  TemplateItem,
  KategoriTemplate,
  MasterDeskripsiClientProps,
} from "@/types/wali-kelas/master-deskripsi";
import {
  TabTemaP5,
  TabKebiasaan,
  TabSaranWali,
  TabEkskul,
  ModalTambahTemplate,
  ModalConfirmMaster,
} from "./components";

export type { TemplateItem };

export default function MasterDeskripsiClient({
  kelasId,
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  initialTemaP5,
  initialKebiasaan,
  initialSaranWali,
  initialEkskul,
}: MasterDeskripsiClientProps) {
  const [activeTab, setActiveTab] = useState<KategoriTemplate>("TEMA_P5");
  const [temaP5List, setTemaP5List] = useState<TemplateItem[]>(initialTemaP5);
  const [kebiasaanList, setKebiasaanList] = useState<TemplateItem[]>(initialKebiasaan);
  const [saranWaliList, setSaranWaliList] = useState<TemplateItem[]>(initialSaranWali);
  const [ekskulList, setEkskulList] = useState<TemplateItem[]>(initialEkskul || []);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const currentList =
    activeTab === "TEMA_P5"
      ? temaP5List
      : activeTab === "KEBIASAAN"
      ? kebiasaanList
      : activeTab === "SARAN_WALI"
      ? saranWaliList
      : ekskulList;

  // Handle Tambah Template
  const handleTambah = async (judul: string, teks: string): Promise<boolean> => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await tambahTemplateAction({
        kelasId,
        kategori: activeTab,
        judul: judul || undefined,
        teks,
        tahunAjaran,
        semester,
      });

      setIsSubmitting(false);

      if (res.success && res.data) {
        const newItem: TemplateItem = res.data;
        if (activeTab === "TEMA_P5") {
          setTemaP5List((prev) => [...prev, newItem]);
        } else if (activeTab === "KEBIASAAN") {
          setKebiasaanList((prev) => [...prev, newItem]);
        } else if (activeTab === "SARAN_WALI") {
          setSaranWaliList((prev) => [...prev, newItem]);
        } else {
          setEkskulList((prev) => [...prev, newItem]);
        }

        setMessage({ type: "success", text: res.message || "Berhasil menambahkan template." });
        return true;
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
        return false;
      }
    } catch {
      setIsSubmitting(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      return false;
    }
  };

  // Handle Update
  const handleUpdate = async (id: string, teks: string, judul?: string): Promise<boolean> => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await updateTemplateAction(id, teks, judul);
      setIsSubmitting(false);

      if (res.success) {
        const updater = (prev: TemplateItem[]) =>
          prev.map((item) =>
            item.id === id ? { ...item, judul: judul || item.judul, teks } : item
          );

        if (activeTab === "TEMA_P5") setTemaP5List(updater);
        else if (activeTab === "KEBIASAAN") setKebiasaanList(updater);
        else if (activeTab === "SARAN_WALI") setSaranWaliList(updater);
        else setEkskulList(updater);

        setMessage({ type: "success", text: "Perubahan berhasil disimpan." });
        return true;
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
        return false;
      }
    } catch {
      setIsSubmitting(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      return false;
    }
  };

  // Handle Hapus
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await hapusTemplateAction(id);
      setIsSubmitting(false);

      if (res.success) {
        const remover = (prev: TemplateItem[]) => prev.filter((item) => item.id !== id);
        if (activeTab === "TEMA_P5") setTemaP5List(remover);
        else if (activeTab === "KEBIASAAN") setKebiasaanList(remover);
        else if (activeTab === "SARAN_WALI") setSaranWaliList(remover);
        else setEkskulList(remover);

        setMessage({ type: "success", text: "Template berhasil dihapus." });
        setDeleteTarget(null);
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      }
    } catch {
      setIsSubmitting(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
    }
  };

  // Reset Default
  const handleConfirmReset = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await resetDefaultTemplateAction(kelasId, tahunAjaran, semester);
      setIsSubmitting(false);

      if (res.success) {
        setIsResetConfirmOpen(false);
        window.location.reload();
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
        setIsResetConfirmOpen(false);
      }
    } catch {
      setIsSubmitting(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      setIsResetConfirmOpen(false);
    }
  };

  const getAddButtonLabel = () => {
    switch (activeTab) {
      case "TEMA_P5":
        return "Tambah Tema Baru";
      case "KEBIASAAN":
        return "Tambah Opsi Kebiasaan";
      case "SARAN_WALI":
        return "Tambah Opsi Saran";
      case "EKSKUL":
        return "Tambah Ekstrakurikuler Baru";
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
                Kelas {kelasNama} • Tingkat {tingkat}
              </span>
              <span className="text-emerald-400">•</span>
              <span className="text-xs text-emerald-200 font-mono">
                TA {tahunAjaran} Semester {semester === 1 ? "Ganjil" : "Genap"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
              Master Deskripsi & Tema Rapor
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all shadow-xs disabled:opacity-50"
            >
              <RotateCcwIcon className="h-3.5 w-3.5" />
              Reset Standar
            </button>
            <Link
              href="/wali-kelas/pelengkap"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-xs"
            >
              Isi Pelengkap Rapor
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Notifikasi */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2Icon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{message.text}</div>
          <button
            onClick={() => setMessage(null)}
            className="text-zinc-400 hover:text-zinc-600 p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab Navigasi 4 Kategori */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("TEMA_P5")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "TEMA_P5"
                ? "bg-[#1b4332] text-white shadow-xs"
                : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
            }`}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            1. Tema Kokurikuler (P5) ({temaP5List.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("KEBIASAAN")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "KEBIASAAN"
                ? "bg-[#1b4332] text-white shadow-xs"
                : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
            }`}
          >
            <SmileIcon className="h-3.5 w-3.5" />
            2. 7 Kebiasaan Anak Hebat ({kebiasaanList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SARAN_WALI")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "SARAN_WALI"
                ? "bg-[#1b4332] text-white shadow-xs"
                : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
            }`}
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            3. Saran Wali ({saranWaliList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EKSKUL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "EKSKUL"
                ? "bg-[#1b4332] text-white shadow-xs"
                : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
            }`}
          >
            <TrophyIcon className="h-3.5 w-3.5" />
            4. Ekstrakurikuler ({ekskulList.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs"
        >
          <PlusIcon className="h-4 w-4" />
          {getAddButtonLabel()}
        </button>
      </div>

      {/* Konten Tab Aktif */}
      {activeTab === "TEMA_P5" && (
        <TabTemaP5
          items={temaP5List}
          isSubmitting={isSubmitting}
          onUpdate={handleUpdate}
          onDelete={(item) => setDeleteTarget(item)}
        />
      )}

      {activeTab === "KEBIASAAN" && (
        <TabKebiasaan
          items={kebiasaanList}
          isSubmitting={isSubmitting}
          onUpdate={handleUpdate}
          onDelete={(item) => setDeleteTarget(item)}
        />
      )}

      {activeTab === "SARAN_WALI" && (
        <TabSaranWali
          items={saranWaliList}
          isSubmitting={isSubmitting}
          onUpdate={handleUpdate}
          onDelete={(item) => setDeleteTarget(item)}
        />
      )}

      {activeTab === "EKSKUL" && (
        <TabEkskul
          items={ekskulList}
          isSubmitting={isSubmitting}
          onUpdate={handleUpdate}
          onDelete={(item) => setDeleteTarget(item)}
        />
      )}

      {/* Modal Dialog Tambah Baru */}
      <ModalTambahTemplate
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab}
        currentCount={currentList.length}
        isSubmitting={isSubmitting}
        onTambah={handleTambah}
      />

      {/* Modal Alert Konfirmasi Hapus */}
      <ModalConfirmMaster
        isOpen={!!deleteTarget}
        type="DELETE"
        title="Hapus Template Deskripsi"
        message="Apakah Anda yakin ingin menghapus pilihan template ini?"
        itemText={
          deleteTarget
            ? deleteTarget.judul
              ? `${deleteTarget.judul}: ${deleteTarget.teks}`
              : deleteTarget.teks
            : ""
        }
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal Alert Konfirmasi Reset Standar */}
      <ModalConfirmMaster
        isOpen={isResetConfirmOpen}
        type="RESET"
        title="Reset ke Standar Bawaan"
        message="Kembalikan semua tema dan opsi ke standar bawaan Kurikulum Merdeka? Seluruh data kustom yang telah diubah akan di-reset."
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
