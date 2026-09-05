"use client";

import { useState } from "react";
import {
  SaveIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SmileIcon,
  TrophyIcon,
  PlusIcon,
  Trash2Icon,
  SparklesIcon,
  PrinterIcon,
  SearchIcon,
  XIcon,
} from "@/components/shared/icons";
import {
  simpanPelengkapAction,
  simpanBulkPresensiAction,
  EkskulItem,
} from "@/actions/wali-kelas";
import Link from "next/link";

interface SiswaPelengkapItem {
  id: string;
  nama: string;
  nisn: string;
  nis: string;
  jenisKelamin: string;
  sakit: number;
  izin: number;
  alpa: number;
  catatanWali: string;
  ekskul: EkskulItem[];
}

interface FormPelengkapProps {
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  initialSiswaList: SiswaPelengkapItem[];
}

const TEMPLATE_CATATAN = [
  "Ananda menunjukkan perkembangan karakter yang sangat baik, memiliki rasa empati tinggi, serta aktif berkolaborasi.",
  "Pertahankan semangat belajar dan ketekunan ananda. Terus kembangkan rasa ingin tahu serta kreativitas yang luar biasa.",
  "Ananda memiliki potensi kepemimpinan yang baik. Diharapkan terus konsisten dalam meningkatkan kedisiplinan dan fokus belajar.",
  "Tingkatkan lagi kemandirian dalam menyelesaikan tugas. Terus percaya diri dalam mengemukakan pendapat di kelas.",
  "Ananda ramah, sopan, dan disenangi teman-teman. Terus pertahankan akhlak terpuji dan tingkatkan prestasi akademik.",
];

export default function FormPelengkapClient({
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  initialSiswaList,
}: FormPelengkapProps) {
  const [activeTab, setActiveTab] = useState<"PRESENSI" | "EKSKUL">("PRESENSI");
  const [siswaList, setSiswaList] = useState<SiswaPelengkapItem[]>(initialSiswaList);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchEkskul, setSearchEkskul] = useState("");

  const filteredEkskulList = siswaList.filter((s) => {
    const q = searchEkskul.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nama.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.nis.includes(q)
    );
  });

  // Update attendance field
  const handlePresensiChange = (
    siswaId: string,
    field: "sakit" | "izin" | "alpa",
    val: number
  ) => {
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId ? { ...s, [field]: Math.max(0, val || 0) } : s
      )
    );
  };

  // Update Catatan Wali
  const handleCatatanChange = (siswaId: string, text: string) => {
    setSiswaList((prev) =>
      prev.map((s) => (s.id === siswaId ? { ...s, catatanWali: text } : s))
    );
  };

  // Simpan data 1 siswa (presensi, catatan, ekskul)
  const handleSaveIndividual = async (siswa: SiswaPelengkapItem) => {
    setLoadingId(siswa.id);
    setMessage(null);

    const res = await simpanPelengkapAction({
      siswaId: siswa.id,
      tahunAjaran,
      semester,
      sakit: siswa.sakit,
      izin: siswa.izin,
      alpa: siswa.alpa,
      catatanWali: siswa.catatanWali,
      ekskul: siswa.ekskul,
    });

    setLoadingId(null);
    if (res.success) {
      setMessage({ type: "success", text: `Data pelengkap untuk ${siswa.nama} berhasil disimpan!` });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Simpan Bulk Presensi & Catatan seluruh kelas
  const handleBulkSavePresensi = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    const res = await simpanBulkPresensiAction({
      tahunAjaran,
      semester,
      items: siswaList.map((s) => ({
        siswaId: s.id,
        sakit: s.sakit,
        izin: s.izin,
        alpa: s.alpa,
        catatanWali: s.catatanWali,
      })),
    });

    setIsBulkSaving(false);
    if (res.success) {
      setMessage({ type: "success", text: res.message });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Tambah Ekskul item pada siswa
  const handleAddEkskul = (siswaId: string) => {
    setSiswaList((prev) =>
      prev.map((s) => {
        if (s.id !== siswaId) return s;
        const newEkskul: EkskulItem = {
          nama: "Pramuka",
          predikat: "Baik",
          keterangan: "Aktif mengikuti kegiatan ekstrakurikuler dengan antusias.",
        };
        return { ...s, ekskul: [...(s.ekskul || []), newEkskul] };
      })
    );
  };

  // Ubah Ekskul item
  const handleUpdateEkskul = (
    siswaId: string,
    index: number,
    field: keyof EkskulItem,
    val: string
  ) => {
    setSiswaList((prev) =>
      prev.map((s) => {
        if (s.id !== siswaId) return s;
        const updated = [...s.ekskul];
        updated[index] = { ...updated[index], [field]: val };
        return { ...s, ekskul: updated };
      })
    );
  };

  // Hapus Ekskul item
  const handleRemoveEkskul = (siswaId: string, index: number) => {
    setSiswaList((prev) =>
      prev.map((s) => {
        if (s.id !== siswaId) return s;
        const updated = s.ekskul.filter((_, i) => i !== index);
        return { ...s, ekskul: updated };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
              Kelengkapan Rapor • Kelas {kelasNama} (Tingkat {tingkat})
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
              Presensi, Catatan Karakter & Ekskul
            </h1>
            <p className="mt-1 text-sm text-emerald-100/90">
              Tahun Ajaran {tahunAjaran} • Semester {semester === 1 ? "Ganjil" : "Genap"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/wali-kelas/cetak"
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              Lanjut ke Cetak Rapor
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Notifikasi */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2Icon className="h-5 w-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-rose-700 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab Navigasi & Bulk Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-1">
          <button
            onClick={() => setActiveTab("PRESENSI")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "PRESENSI"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <SmileIcon className="h-4 w-4 text-amber-700" />
            Presensi & Catatan Wali ({siswaList.length} Siswa)
          </button>
          <button
            onClick={() => setActiveTab("EKSKUL")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "EKSKUL"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <TrophyIcon className="h-4 w-4 text-purple-700" />
            Ekstrakurikuler
          </button>
        </div>

        {activeTab === "PRESENSI" && (
          <button
            onClick={handleBulkSavePresensi}
            disabled={isBulkSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <SaveIcon className="h-4 w-4" />
            {isBulkSaving ? "Menyimpan Seluruh Kelas..." : "Simpan Semua Presensi & Catatan"}
          </button>
        )}
      </div>

      {/* TAB 1: PRESENSI & CATATAN WALI KELAS */}
      {activeTab === "PRESENSI" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900">
            <span className="font-semibold block mb-1">Panduan Pengisian:</span>
            Isikan jumlah hari ketidakhadiran siswa (Sakit, Izin, Alpa) dan berikan narasi motivasi/catatan karakter. Anda dapat mengklik tombol rekomendasi di bawah untuk mengisi narasi otomatis yang sesuai dengan Kurikulum Merdeka.
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 w-60">Nama Siswa</th>
                    <th className="py-3.5 px-3 w-20 text-center">Sakit (S)</th>
                    <th className="py-3.5 px-3 w-20 text-center">Izin (I)</th>
                    <th className="py-3.5 px-3 w-20 text-center">Alpa (A)</th>
                    <th className="py-3.5 px-4">Catatan Wali Kelas</th>
                    <th className="py-3.5 px-4 w-28 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {siswaList.map((s, idx) => {
                    const isLoading = loadingId === s.id;
                    return (
                      <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-3 px-4 text-xs text-zinc-600 font-mono text-center">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-900 block text-xs">
                            {s.nama}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-600">
                            NISN: {s.nisn}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={s.sakit}
                            onChange={(e) =>
                              handlePresensiChange(s.id, "sakit", parseInt(e.target.value) || 0)
                            }
                            className="w-14 text-center py-1 text-xs rounded-lg border border-stone-200 font-mono focus:ring-1 focus:ring-[#1b4332]"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={s.izin}
                            onChange={(e) =>
                              handlePresensiChange(s.id, "izin", parseInt(e.target.value) || 0)
                            }
                            className="w-14 text-center py-1 text-xs rounded-lg border border-stone-200 font-mono focus:ring-1 focus:ring-[#1b4332]"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={s.alpa}
                            onChange={(e) =>
                              handlePresensiChange(s.id, "alpa", parseInt(e.target.value) || 0)
                            }
                            className="w-14 text-center py-1 text-xs rounded-lg border border-stone-200 font-mono focus:ring-1 focus:ring-[#1b4332]"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={s.catatanWali}
                              onChange={(e) => handleCatatanChange(s.id, e.target.value)}
                              placeholder="Masukkan catatan perkembangan sikap & motivasi belajar..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-[#1b4332]"
                            />
                            {/* Template chips */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-zinc-600 font-medium flex items-center gap-1">
                                <SparklesIcon className="h-3 w-3 text-purple-600" />
                                Template:
                              </span>
                              {TEMPLATE_CATATAN.slice(0, 3).map((template, tIdx) => (
                                <button
                                  key={tIdx}
                                  type="button"
                                  onClick={() => handleCatatanChange(s.id, template)}
                                  className="text-[10px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-zinc-700 transition-colors"
                                >
                                  Opsi {tIdx + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSaveIndividual(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            <SaveIcon className="h-3.5 w-3.5" />
                            {isLoading ? "..." : "Simpan"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EKSTRAKURIKULER */}
      {activeTab === "EKSKUL" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/70 text-xs text-purple-900">
            <span className="font-semibold block mb-1">Manajemen Ekstrakurikuler Siswa:</span>
            Tambahkan kegiatan ekstrakurikuler yang diikuti oleh peserta didik (misal: Pramuka, UKS, PMR, Seni Tari, Olahraga). Anda dapat menambahkan lebih dari satu kegiatan per siswa.
          </div>

          {/* Kotak Pencarian Siswa Ekstrakurikuler */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchEkskul}
                onChange={(e) => setSearchEkskul(e.target.value)}
                placeholder="Cari nama, NISN, atau NIS siswa..."
                className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-[#1b4332] bg-stone-50/50"
              />
              {searchEkskul && (
                <button
                  type="button"
                  onClick={() => setSearchEkskul("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs text-zinc-500 font-mono">
              Menampilkan {filteredEkskulList.length} dari {siswaList.length} siswa
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredEkskulList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center">
                <p className="text-xs text-zinc-500">
                  Tidak ditemukan siswa dengan kata kunci "{searchEkskul}".
                </p>
                <button
                  type="button"
                  onClick={() => setSearchEkskul("")}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-zinc-700 transition-colors"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              filteredEkskulList.map((s, idx) => {
              const isLoading = loadingId === s.id;
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 font-mono text-xs font-bold text-zinc-700">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-zinc-900 text-sm">{s.nama}</h3>
                        <span className="text-xs text-zinc-600 font-mono">
                          NISN: {s.nisn} | NIS: {s.nis}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddEkskul(s.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-colors"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Tambah Ekskul
                      </button>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSaveIndividual(s)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1b4332] text-white hover:bg-[#143225] text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                      >
                        <SaveIcon className="h-3.5 w-3.5" />
                        {isLoading ? "Menyimpan..." : "Simpan Ekskul"}
                      </button>
                    </div>
                  </div>

                  {s.ekskul && s.ekskul.length > 0 ? (
                    <div className="space-y-3">
                      {s.ekskul.map((item, eIdx) => (
                        <div
                          key={eIdx}
                          className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                        >
                          <div className="w-full sm:w-48">
                            <label className="text-[10px] font-semibold text-zinc-600 uppercase block mb-1">
                              Nama Kegiatan
                            </label>
                            <input
                              type="text"
                              value={item.nama}
                              onChange={(e) =>
                                handleUpdateEkskul(s.id, eIdx, "nama", e.target.value)
                              }
                              placeholder="Contoh: Pramuka"
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-200 bg-white"
                            />
                          </div>

                          <div className="w-full sm:w-36">
                            <label className="text-[10px] font-semibold text-zinc-600 uppercase block mb-1">
                              Predikat
                            </label>
                            <select
                              value={item.predikat}
                              onChange={(e) =>
                                handleUpdateEkskul(s.id, eIdx, "predikat", e.target.value)
                              }
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-200 bg-white font-medium"
                            >
                              <option value="Sangat Baik">Sangat Baik</option>
                              <option value="Baik">Baik</option>
                              <option value="Cukup">Cukup</option>
                              <option value="Kurang">Kurang</option>
                            </select>
                          </div>

                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-semibold text-zinc-600 uppercase block mb-1">
                              Keterangan Capaian
                            </label>
                            <input
                              type="text"
                              value={item.keterangan}
                              onChange={(e) =>
                                handleUpdateEkskul(s.id, eIdx, "keterangan", e.target.value)
                              }
                              placeholder="Deskripsi keaktifan atau pencapaian kegiatan..."
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-200 bg-white"
                            />
                          </div>

                          <div className="sm:pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveEkskul(s.id, eIdx)}
                              className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              title="Hapus ekskul ini"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-stone-200 text-center text-xs text-zinc-600">
                      Belum ada kegiatan ekstrakurikuler yang dicatat untuk siswa ini. Klik tombol <span className="font-semibold text-purple-700">"Tambah Ekskul"</span> di atas.
                    </div>
                  )}
                </div>
              );
            }))}
          </div>
        </div>
      )}
    </div>
  );
}
