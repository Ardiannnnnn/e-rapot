"use client";

import { useState } from "react";
import {
  SparklesIcon,
  PlusIcon,
  Trash2Icon,
  SaveIcon,
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
import Link from "next/link";

export interface TemplateItem {
  id: string;
  kategori: string;
  judul?: string | null;
  teks: string;
  urutan: number;
}

interface MasterDeskripsiClientProps {
  kelasId: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  initialTemaP5: TemplateItem[];
  initialKebiasaan: TemplateItem[];
  initialSaranWali: TemplateItem[];
  initialEkskul?: TemplateItem[];
}

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
  const [activeTab, setActiveTab] = useState<"TEMA_P5" | "KEBIASAAN" | "SARAN_WALI" | "EKSKUL">("TEMA_P5");
  const [temaP5List, setTemaP5List] = useState<TemplateItem[]>(initialTemaP5);
  const [kebiasaanList, setKebiasaanList] = useState<TemplateItem[]>(initialKebiasaan);
  const [saranWaliList, setSaranWaliList] = useState<TemplateItem[]>(initialSaranWali);
  const [ekskulList, setEkskulList] = useState<TemplateItem[]>(initialEkskul || []);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State untuk Tambah Baru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formJudul, setFormJudul] = useState("");
  const [formTeks, setFormTeks] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJudul, setEditJudul] = useState("");
  const [editTeks, setEditTeks] = useState("");

  const currentList =
    activeTab === "TEMA_P5"
      ? temaP5List
      : activeTab === "KEBIASAAN"
      ? kebiasaanList
      : activeTab === "SARAN_WALI"
      ? saranWaliList
      : ekskulList;

  // Handle Tambah Template
  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeks.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    const res = await tambahTemplateAction({
      kelasId,
      kategori: activeTab,
      judul: formJudul.trim() || undefined,
      teks: formTeks.trim(),
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

      setFormJudul("");
      setFormTeks("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: res.message });
    } else {
      setMessage({ type: "error", text: res.message || "Gagal menambahkan template." });
    }
  };

  // Handle Update
  const handleStartEdit = (item: TemplateItem) => {
    setEditingId(item.id);
    setEditJudul(item.judul || "");
    setEditTeks(item.teks);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTeks.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    const res = await updateTemplateAction(id, editTeks.trim(), editJudul.trim() || undefined);
    setIsSubmitting(false);

    if (res.success) {
      const updater = (prev: TemplateItem[]) =>
        prev.map((item) =>
          item.id === id ? { ...item, judul: editJudul.trim() || item.judul, teks: editTeks.trim() } : item
        );

      if (activeTab === "TEMA_P5") setTemaP5List(updater);
      else if (activeTab === "KEBIASAAN") setKebiasaanList(updater);
      else if (activeTab === "SARAN_WALI") setSaranWaliList(updater);
      else setEkskulList(updater);

      setEditingId(null);
      setMessage({ type: "success", text: "Perubahan berhasil disimpan." });
    } else {
      setMessage({ type: "error", text: res.message || "Gagal menyimpan perubahan." });
    }
  };

  // Handle Hapus
  const handleHapus = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pilihan ini?")) return;

    setIsSubmitting(true);
    setMessage(null);

    const res = await hapusTemplateAction(id);
    setIsSubmitting(false);

    if (res.success) {
      const remover = (prev: TemplateItem[]) => prev.filter((item) => item.id !== id);
      if (activeTab === "TEMA_P5") setTemaP5List(remover);
      else if (activeTab === "KEBIASAAN") setKebiasaanList(remover);
      else if (activeTab === "SARAN_WALI") setSaranWaliList(remover);
      else setEkskulList(remover);

      setMessage({ type: "success", text: "Template berhasil dihapus." });
    } else {
      setMessage({ type: "error", text: res.message || "Gagal menghapus template." });
    }
  };

  // Reset Default
  const handleResetDefault = async () => {
    if (!confirm("Kembalikan semua tema dan opsi ke standar bawaan Kurikulum Merdeka? Data kustom akan ter-reset.")) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const res = await resetDefaultTemplateAction(kelasId, tahunAjaran, semester);
    setIsSubmitting(false);

    if (res.success) {
      window.location.reload();
    } else {
      setMessage({ type: "error", text: res.message || "Gagal me-reset template." });
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
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Kelola kumpulan tema kokurikuler P5, pilihan 7 kebiasaan anak hebat, dan template saran wali kelas
              yang dapat ditambah, diubah, maupun dihapus kapan saja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetDefault}
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
          onClick={() => {
            setFormJudul(
              activeTab === "TEMA_P5"
                ? `Tema ${currentList.length + 1}`
                : activeTab === "EKSKUL"
                ? ""
                : `Pilihan ${currentList.length + 1}`
            );
            setFormTeks("");
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs"
        >
          <PlusIcon className="h-4 w-4" />
          {activeTab === "TEMA_P5"
            ? "Tambah Tema Baru"
            : activeTab === "KEBIASAAN"
            ? "Tambah Opsi Kebiasaan"
            : activeTab === "SARAN_WALI"
            ? "Tambah Opsi Saran"
            : "Tambah Ekstrakurikuler Baru"}
        </button>
      </div>

      {/* Deskripsi Tab Aktif */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-zinc-600">
        {activeTab === "TEMA_P5" && (
          <p>
            Daftar <strong>Tema Projek P5</strong> untuk Kelas {kelasNama} di semester ini. Anda dapat menambah, mengedit, atau menghapus tema sesuai ketetapan sekolah.
          </p>
        )}
        {activeTab === "KEBIASAAN" && (
          <p>
            Daftar opsi narasi <strong>7 Kebiasaan Anak Indonesia Hebat</strong>. Seluruh opsi di bawah ini akan otomatis muncul dalam dropdown/modal pilihan saat Anda mengisi rapor siswa.
          </p>
        )}
        {activeTab === "SARAN_WALI" && (
          <p>
            Daftar opsi <strong>Saran-saran & Catatan Pembinaan Karakter</strong>. Pilihan ini akan tampil sebagai rekomendasi template cepat di formulir rapor.
          </p>
        )}
        {activeTab === "EKSKUL" && (
          <p>
            Daftar master kegiatan <strong>Ekstrakurikuler</strong> yang tersedia di sekolah. Di form pengisian rapor siswa, wali kelas tinggal <strong>memilih dari opsi ini</strong> tanpa perlu mengetik manual lagi.
          </p>
        )}
      </div>

      {/* Daftar Item */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 bg-white text-zinc-500 text-xs">
            Belum ada data untuk kategori ini. Klik tombol di atas untuk menambah.
          </div>
        ) : (
          currentList.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white shadow-xs hover:border-emerald-300 transition-all space-y-3"
            >
              {editingId === item.id ? (
                /* Mode Edit Inline */
                <div className="space-y-3">
                  {activeTab === "EKSKUL" ? (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-zinc-700">Nama Ekstrakurikuler:</span>
                      <input
                        type="text"
                        value={editTeks}
                        onChange={(e) => {
                          setEditTeks(e.target.value);
                          setEditJudul(e.target.value);
                        }}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-700">Label / Judul:</span>
                        <input
                          type="text"
                          value={editJudul}
                          onChange={(e) => setEditJudul(e.target.value)}
                          className="flex-1 p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-zinc-700">Isi Deskripsi / Teks:</span>
                        <textarea
                          rows={3}
                          value={editTeks}
                          onChange={(e) => setEditTeks(e.target.value)}
                          className="w-full p-2.5 border border-stone-300 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-zinc-600 text-xs font-medium hover:bg-stone-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveEdit(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225]"
                    >
                      <SaveIcon className="h-3.5 w-3.5" />
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode Tampil Normal */
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {activeTab === "EKSKUL" ? (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-zinc-900 text-sm">
                          {item.teks}
                        </h3>
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                          Ekstrakurikuler
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                            {idx + 1}
                          </span>
                          <h3 className="font-bold text-zinc-900 text-xs sm:text-sm">
                            {item.judul || `Pilihan ${idx + 1}`}
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-700 leading-relaxed pl-8 font-sans">
                          {item.teks}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start pl-8 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-zinc-700 text-xs font-medium transition"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleHapus(item.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                      title="Hapus"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog Tambah Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                {activeTab === "TEMA_P5"
                  ? "Tambah Tema Projek P5"
                  : activeTab === "KEBIASAAN"
                  ? "Tambah Opsi 7 Kebiasaan Anak Hebat"
                  : activeTab === "SARAN_WALI"
                  ? "Tambah Opsi Saran-saran Wali"
                  : "Tambah Kegiatan Ekstrakurikuler Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTambah} className="space-y-4">
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
                  {activeTab === "EKSKUL" ? "Nama Kegiatan Ekstrakurikuler *" : "Isi Deskripsi / Teks Lengkap *"}
                </label>
                <textarea
                  rows={activeTab === "EKSKUL" ? 2 : 4}
                  required
                  placeholder={
                    activeTab === "TEMA_P5"
                      ? "Contoh: Tema 4 : Kewirausahaan ( Mengolah Makanan Tradisional )"
                      : activeTab === "KEBIASAAN"
                      ? "Contoh: Terbiasa dalam merapikan alat belajar sendiri dan belum terbiasa sarapan pagi"
                      : activeTab === "SARAN_WALI"
                      ? "Contoh: Tingkatkan terus ketelitian dalam belajar dan pertahankan adab yang santun."
                      : "Contoh: Karate / Robotika / Paskibra / Renang"
                  }
                  value={formTeks}
                  onChange={(e) => {
                    setFormTeks(e.target.value);
                    if (activeTab === "EKSKUL") setFormJudul(e.target.value);
                  }}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formTeks.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50"
                >
                  <SaveIcon className="h-4 w-4" />
                  {isSubmitting ? "Menyimpan..." : "Simpan Pilihan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
