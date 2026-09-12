"use client";

import React, { useState, useTransition } from "react";
import {
  createPeriodeAction,
  setPeriodeAktifAction,
  toggleStatusNilaiAction,
  updatePengaturanCetakAction,
  deletePeriodeAction,
} from "@/actions/periode";
import { AlertCircleIcon } from "@/components/shared/icons";
import { PeriodeItem, FormPeriodeProps, PeriodeFormErrors } from "@/types/admin-sekolah";
import { toast } from "@/components/shared/toast";

export type { PeriodeItem };

export default function FormPeriode({ periodeList }: FormPeriodeProps) {
  const [isPending, startTransition] = useTransition();

  // Modal Konfirmasi Hapus (Pengganti browser confirm)
  const [confirmDeletePeriode, setConfirmDeletePeriode] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Modal Tambah Periode State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [semester, setSemester] = useState<number>(1);
  const [tanggalCetak, setTanggalCetak] = useState("");
  const [tempatCetak, setTempatCetak] = useState("");
  const [setAsAktif, setSetAsAktif] = useState(false);

  // Form Validation State - Tambah
  const [addErrors, setAddErrors] = useState<PeriodeFormErrors>({});
  const [addTouched, setAddTouched] = useState<Record<string, boolean>>({});

  // Modal Edit Tanggal Cetak State
  const [editingPeriode, setEditingPeriode] = useState<PeriodeItem | null>(null);
  const [editTanggal, setEditTanggal] = useState("");
  const [editTempat, setEditTempat] = useState("");

  // Form Validation State - Edit
  const [editErrors, setEditErrors] = useState<{ editTempat?: string }>({});
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});

  const periodeAktif = periodeList.find((p) => p.isAktif) || periodeList[0];

  // Helper validasi form tambah
  const validateAddForm = (ta: string, sem: number, tempat: string) => {
    const errs: PeriodeFormErrors = {};
    const trimmedTa = ta.trim();

    if (!trimmedTa) {
      errs.tahunAjaran = "Tahun ajaran wajib diisi.";
    } else if (!/^\d{4}\/\d{4}$/.test(trimmedTa)) {
      errs.tahunAjaran = "Format tahun ajaran harus YYYY/YYYY (contoh: 2026/2027).";
    } else {
      const [y1, y2] = trimmedTa.split("/").map(Number);
      if (y2 !== y1 + 1) {
        errs.tahunAjaran = `Tahun kedua harus ${y1 + 1} (contoh: ${y1}/${y1 + 1}).`;
      } else {
        const isDuplicate = periodeList.some(
          (p) => p.tahunAjaran === trimmedTa && p.semester === sem
        );
        if (isDuplicate) {
          errs.tahunAjaran = `Periode ${trimmedTa} Semester ${sem === 1 ? "1 (Ganjil)" : "2 (Genap)"} sudah terdaftar.`;
        }
      }
    }

    if (tempat && /[<>]/.test(tempat)) {
      errs.tempatCetak = "Kota penerbitan tidak boleh mengandung karakter < atau >.";
    } else if (tempat && tempat.trim().length > 50) {
      errs.tempatCetak = "Nama kota penerbitan maksimal 50 karakter.";
    }

    return errs;
  };

  // Helper validasi form edit
  const validateEditForm = (tempat: string) => {
    const errs: { editTempat?: string } = {};
    if (tempat && /[<>]/.test(tempat)) {
      errs.editTempat = "Kota penerbitan tidak boleh mengandung karakter < atau >.";
    } else if (tempat && tempat.trim().length > 50) {
      errs.editTempat = "Nama kota penerbitan maksimal 50 karakter.";
    }
    return errs;
  };

  // Submit Tambah Periode Baru
  const handleCreatePeriode = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateAddForm(tahunAjaran, semester, tempatCetak);
    setAddErrors(validation);
    setAddTouched({ tahunAjaran: true, tempatCetak: true });

    if (Object.keys(validation).length > 0) {
      return;
    }

    startTransition(async () => {
      const res = await createPeriodeAction({
        tahunAjaran: tahunAjaran.trim(),
        semester,
        tanggalCetak: tanggalCetak || undefined,
        tempatCetak: tempatCetak.trim() || undefined,
        isAktif: setAsAktif,
      });

      if (res.success) {
        setIsModalOpen(false);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Set Periode Aktif
  const handleSetAktif = (id: string) => {
    startTransition(async () => {
      const res = await setPeriodeAktifAction(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Toggle Buka/Kunci Nilai
  const handleToggleLock = (id: string) => {
    startTransition(async () => {
      const res = await toggleStatusNilaiAction(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Simpan Pengaturan Cetak Rapor
  const handleSavePengaturanCetak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriode) return;

    const validation = validateEditForm(editTempat);
    setEditErrors(validation);
    setEditTouched({ editTempat: true });

    if (Object.keys(validation).length > 0) {
      return;
    }

    startTransition(async () => {
      const res = await updatePengaturanCetakAction({
        periodeId: editingPeriode.id,
        tanggalCetak: editTanggal,
        tempatCetak: editTempat.trim(),
      });

      if (res.success) {
        setEditingPeriode(null);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Konfirmasi Eksekusi Hapus Periode
  const handleDeletePeriodeConfirm = () => {
    if (!confirmDeletePeriode) return;
    const { id } = confirmDeletePeriode;

    startTransition(async () => {
      const res = await deletePeriodeAction(id);
      setConfirmDeletePeriode(null);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
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
          onClick={() => {
            setAddErrors({});
            setAddTouched({});
            setIsModalOpen(true);
          }}
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
                          setEditErrors({});
                          setEditTouched({});
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
                            setConfirmDeletePeriode({
                              id: p.id,
                              name: `${p.tahunAjaran} Semester ${p.semester === 1 ? "Ganjil" : "Genap"}`,
                            })
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
                  Tahun Ajaran <span className="text-rose-500">*</span>{" "}
                  <span className="text-zinc-400 font-normal">(Contoh: 2026/2027, 2027/2028)</span>
                </label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTahunAjaran(val);
                    if (addTouched.tahunAjaran) {
                      setAddErrors((prev) => ({
                        ...prev,
                        ...validateAddForm(val, semester, tempatCetak),
                        tahunAjaran: validateAddForm(val, semester, tempatCetak).tahunAjaran,
                      }));
                    }
                  }}
                  onBlur={() => {
                    setAddTouched((prev) => ({ ...prev, tahunAjaran: true }));
                    setAddErrors((prev) => ({
                      ...prev,
                      ...validateAddForm(tahunAjaran, semester, tempatCetak),
                    }));
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 ${
                    addTouched.tahunAjaran && addErrors.tahunAjaran
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-[#1b4332]"
                  }`}
                />
                {addTouched.tahunAjaran && addErrors.tahunAjaran && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                    <span>⚠️</span> {addErrors.tahunAjaran}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Pilih Semester
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSemester(1);
                      if (addTouched.tahunAjaran) {
                        setAddErrors((prev) => ({
                          ...prev,
                          ...validateAddForm(tahunAjaran, 1, tempatCetak),
                        }));
                      }
                    }}
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
                    onClick={() => {
                      setSemester(2);
                      if (addTouched.tahunAjaran) {
                        setAddErrors((prev) => ({
                          ...prev,
                          ...validateAddForm(tahunAjaran, 2, tempatCetak),
                        }));
                      }
                    }}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setTempatCetak(val);
                    if (addTouched.tempatCetak) {
                      setAddErrors((prev) => ({
                        ...prev,
                        ...validateAddForm(tahunAjaran, semester, val),
                      }));
                    }
                  }}
                  onBlur={() => {
                    setAddTouched((prev) => ({ ...prev, tempatCetak: true }));
                    setAddErrors((prev) => ({
                      ...prev,
                      ...validateAddForm(tahunAjaran, semester, tempatCetak),
                    }));
                  }}
                  placeholder="Contoh: Jakarta"
                  className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 ${
                    addTouched.tempatCetak && addErrors.tempatCetak
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-[#1b4332]"
                  }`}
                />
                {addTouched.tempatCetak && addErrors.tempatCetak && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                    <span>⚠️</span> {addErrors.tempatCetak}
                  </p>
                )}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditTempat(val);
                    if (editTouched.editTempat) {
                      setEditErrors(validateEditForm(val));
                    }
                  }}
                  onBlur={() => {
                    setEditTouched((p) => ({ ...p, editTempat: true }));
                    setEditErrors(validateEditForm(editTempat));
                  }}
                  placeholder="Jakarta"
                  className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 ${
                    editTouched.editTempat && editErrors.editTempat
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-[#1b4332]"
                  }`}
                />
                {editTouched.editTempat && editErrors.editTempat && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                    <span>⚠️</span> {editErrors.editTempat}
                  </p>
                )}
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

      {/* Modal Konfirmasi Hapus Periode (Pengganti Browser Confirm Sesuai AGENTS.md) */}
      {confirmDeletePeriode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircleIcon className="h-8 w-8 text-rose-600" />
            </div>

            <div>
              <h3 className="font-bold text-zinc-900 text-lg font-poppins">
                Hapus Periode Akademik?
              </h3>
              <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed px-2">
                Apakah Anda yakin ingin menghapus periode{" "}
                <strong className="text-zinc-800">{confirmDeletePeriode.name}</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePeriode(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePeriodeConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
