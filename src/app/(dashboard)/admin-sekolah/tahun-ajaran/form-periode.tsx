"use client";

import React, { useState, useTransition } from "react";
import {
  createPeriodeAction,
  setPeriodeAktifAction,
  toggleStatusNilaiAction,
  updatePengaturanCetakAction,
  deletePeriodeAction,
} from "@/actions/periode";

export interface PeriodeItem {
  id: string;
  tahunAjaran: string;
  semester: number;
  isAktif: boolean;
  statusNilai: string;
  tanggalCetak: string | null;
  tempatCetak: string | null;
  createdAt: string;
}

interface FormPeriodeProps {
  periodeList: PeriodeItem[];
}

export default function FormPeriode({ periodeList }: FormPeriodeProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Tambah Periode State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tahunAjaran, setTahunAjaran] = useState("2027/2028");
  const [semester, setSemester] = useState<number>(1);
  const [tanggalCetak, setTanggalCetak] = useState("");
  const [tempatCetak, setTempatCetak] = useState("Jakarta");
  const [setAsAktif, setSetAsAktif] = useState(false);

  // Modal Edit Tanggal Cetak State
  const [editingPeriode, setEditingPeriode] = useState<PeriodeItem | null>(null);
  const [editTanggal, setEditTanggal] = useState("");
  const [editTempat, setEditTempat] = useState("");

  const periodeAktif = periodeList.find((p) => p.isAktif) || periodeList[0];

  // Submit Tambah Periode Baru
  const handleCreatePeriode = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await createPeriodeAction({
        tahunAjaran,
        semester,
        tanggalCetak: tanggalCetak || undefined,
        tempatCetak: tempatCetak || undefined,
        isAktif: setAsAktif,
      });

      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setIsModalOpen(false);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  // Set Periode Aktif
  const handleSetAktif = (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await setPeriodeAktifAction(id);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  // Toggle Buka/Kunci Nilai
  const handleToggleLock = (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await toggleStatusNilaiAction(id);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  // Simpan Pengaturan Cetak Rapor
  const handleSavePengaturanCetak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriode) return;

    setMessage(null);
    startTransition(async () => {
      const res = await updatePengaturanCetakAction({
        periodeId: editingPeriode.id,
        tanggalCetak: editTanggal,
        tempatCetak: editTempat,
      });

      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setEditingPeriode(null);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  // Hapus Periode
  const handleDeletePeriode = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus periode ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await deletePeriodeAction(id);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Kartu Highlight Periode Aktif Saat Ini */}
      {periodeAktif && (
        <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-emerald-50/40 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                PERIODE AKTIF BERJALAN
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  periodeAktif.statusNilai === "BUKA"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {periodeAktif.statusNilai === "BUKA" ? "🔓 Nilai Terbuka (Input Aktif)" : "🔒 Nilai Terkunci (Read-Only)"}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-zinc-900">
                Tahun Ajaran {periodeAktif.tahunAjaran} — Semester {periodeAktif.semester === 1 ? "Ganjil (1)" : "Genap (2)"}
              </h2>
              <p className="text-xs text-zinc-600 mt-1">
                Seluruh aktivitas pembelajaran, penilaian guru, dan pencetakan rapor saat ini mengacu pada periode ini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-700 pt-1 font-mono">
              <div>
                <span className="text-zinc-600">Kota Penerbitan: </span>
                <strong>{periodeAktif.tempatCetak || "Jakarta"}</strong>
              </div>
              <div>•</div>
              <div>
                <span className="text-zinc-600">Tanggal Cetak Rapor: </span>
                <strong>{formatDate(periodeAktif.tanggalCetak)}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleToggleLock(periodeAktif.id)}
              disabled={isPending}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition shadow-xs flex items-center justify-center gap-2 ${
                periodeAktif.statusNilai === "BUKA"
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {periodeAktif.statusNilai === "BUKA" ? (
                <>
                  <span>🔒</span>
                  <span>Kunci Input Nilai Guru</span>
                </>
              ) : (
                <>
                  <span>🔓</span>
                  <span>Buka Kembali Input Nilai</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPeriode(periodeAktif);
                setEditTanggal(
                  periodeAktif.tanggalCetak ? new Date(periodeAktif.tanggalCetak).toISOString().split("T")[0] : ""
                );
                setEditTempat(periodeAktif.tempatCetak || "Jakarta");
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-200 bg-white text-zinc-700 hover:bg-stone-50 transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>📅</span>
              <span>Edit Tanggal Cetak</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="font-bold text-zinc-600 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Action Header Tabel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-zinc-900 text-base font-poppins">
            Riwayat Tahun Ajaran & Semester ({periodeList.length} Periode)
          </h3>
          <p className="text-xs text-zinc-600 mt-0.5">
            Kelola kalender semester, buka/kunci penilaian, dan tentukan semester yang aktif di sekolah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center gap-2"
        >
          <span>➕</span>
          <span>Tambah Periode Baru</span>
        </button>
      </div>

      {/* Tabel Daftar Periode */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">Tahun Ajaran</th>
                <th className="px-4 py-3.5 text-center">Semester</th>
                <th className="px-4 py-3.5 text-center">Status Periode</th>
                <th className="px-4 py-3.5 text-center">Status Nilai Guru</th>
                <th className="px-4 py-3.5">Tanggal Cetak Rapor</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {periodeList.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`hover:bg-stone-50/70 transition-colors ${
                    p.isAktif ? "bg-emerald-50/20 font-medium" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-center text-zinc-600 font-mono">
                    {idx + 1}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-bold text-zinc-900 text-sm font-mono flex items-center gap-2">
                      <span>{p.tahunAjaran}</span>
                      {p.isAktif && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          AKTIF
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        p.semester === 1
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}
                    >
                      Semester {p.semester} ({p.semester === 1 ? "Ganjil" : "Genap"})
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    {p.isAktif ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Sedang Berjalan
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetAktif(p.id)}
                        disabled={isPending}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-stone-300 bg-white text-zinc-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition"
                        title="Jadikan semester ini sebagai periode aktif berjalan"
                      >
                        Jadikan Aktif
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(p.id)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        p.statusNilai === "BUKA"
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      }`}
                      title="Klik untuk mengubah status Buka / Kunci penilaian"
                    >
                      <span>{p.statusNilai === "BUKA" ? "🔓 Terbuka" : "🔒 Terkunci"}</span>
                    </button>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="text-zinc-800 font-medium">
                      {formatDate(p.tanggalCetak)}
                    </div>
                    <div className="text-[11px] text-zinc-600 mt-0.5">
                      Tempat: {p.tempatCetak || "Jakarta"}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPeriode(p);
                          setEditTanggal(
                            p.tanggalCetak ? new Date(p.tanggalCetak).toISOString().split("T")[0] : ""
                          );
                          setEditTempat(p.tempatCetak || "Jakarta");
                        }}
                        className="p-1.5 rounded-lg border border-stone-200 text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 transition"
                        title="Ubah tanggal & kota cetak rapor"
                      >
                        ✏️
                      </button>

                      {!p.isAktif && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePeriode(
                              p.id,
                              `${p.tahunAjaran} Semester ${p.semester === 1 ? "Ganjil" : "Genap"}`
                            )
                          }
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus periode (hanya bisa jika belum ada nilai)"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Periode Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Tambah Tahun Ajaran / Semester Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePeriode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tahun Ajaran (Contoh: 2026/2027, 2027/2028)
                </label>
                <input
                  type="text"
                  required
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  placeholder="2027/2028"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Pilih Semester
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSemester(1)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      semester === 1
                        ? "bg-[#1b4332] text-white border-[#1b4332]"
                        : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Semester 1 (Ganjil)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemester(2)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      semester === 2
                        ? "bg-[#1b4332] text-white border-[#1b4332]"
                        : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Semester 2 (Genap)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tanggal Pembagian Rapor (Tercetak di Rapor)
                </label>
                <input
                  type="date"
                  value={tanggalCetak}
                  onChange={(e) => setTanggalCetak(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kota Tempat Penerbitan Rapor
                </label>
                <input
                  type="text"
                  value={tempatCetak}
                  onChange={(e) => setTempatCetak(e.target.value)}
                  placeholder="Contoh: Jakarta"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700">
                  <input
                    type="checkbox"
                    checked={setAsAktif}
                    onChange={(e) => setSetAsAktif(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-stone-300"
                  />
                  <span>Langsung jadikan periode ini sebagai <strong>Periode Aktif</strong></span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition"
                >
                  {isPending ? "Menyimpan..." : "Simpan Periode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tanggal Cetak */}
      {editingPeriode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Edit Tanggal & Tempat Cetak Rapor
              </h3>
              <button
                type="button"
                onClick={() => setEditingPeriode(null)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Periode: <strong>{editingPeriode.tahunAjaran} — Semester {editingPeriode.semester === 1 ? "Ganjil" : "Genap"}</strong>
            </p>

            <form onSubmit={handleSavePengaturanCetak} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tanggal Cetak / Pembagian Rapor
                </label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kota Penerbitan (contoh: Jakarta, Bandung)
                </label>
                <input
                  type="text"
                  value={editTempat}
                  onChange={(e) => setEditTempat(e.target.value)}
                  placeholder="Jakarta"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingPeriode(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
