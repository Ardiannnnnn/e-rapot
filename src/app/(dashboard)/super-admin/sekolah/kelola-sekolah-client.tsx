"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  createSekolahAction,
  updateSekolahSuperAdminAction,
  toggleStatusSekolahAction,
} from "@/actions/sekolah";
import { CheckCircle2Icon, AlertCircleIcon, SaveIcon } from "@/components/shared/icons";

export interface SekolahItem {
  id: string;
  npsn: string;
  nama: string;
  alamat: string | null;
  kepalaSekolah: string | null;
  nipKepsek: string | null;
  status: string;
  isStatus: boolean;
  createdAt: Date;
  _count: {
    kelas: number;
    users: number;
  };
  users?: {
    id: string;
    name: string;
    role: string;
  }[];
}

export default function KelolaSekolahClient({ initialSekolahList }: { initialSekolahList: SekolahItem[] }) {
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSekolah, setEditingSekolah] = useState<SekolahItem | null>(null);
  const [confirmToggleSekolah, setConfirmToggleSekolah] = useState<{
    sekolah: SekolahItem;
    targetIsStatus: boolean;
  } | null>(null);

  // Alert Dialog Modal State (Setelah Berhasil Tambah/Edit/Hapus)
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  // State Form Input (Tambah / Edit)
  const [npsn, setNpsn] = useState("");
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kepalaSekolah, setKepalaSekolah] = useState("");
  const [nipKepsek, setNipKepsek] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    npsn: false,
    nama: false,
    alamat: false,
    kepalaSekolah: false,
    nipKepsek: false,
  });
  const [formError, setFormError] = useState("");

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setNpsn("");
    setNama("");
    setAlamat("");
    setKepalaSekolah("");
    setNipKepsek("");
    setFormSubmitted(false);
    setTouched({
      npsn: false,
      nama: false,
      alamat: false,
      kepalaSekolah: false,
      nipKepsek: false,
    });
    setFormError("");
    setIsAddModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (sek: SekolahItem) => {
    setEditingSekolah(sek);
    setNpsn(sek.npsn);
    setNama(sek.nama);
    setAlamat(sek.alamat || "");
    setKepalaSekolah(sek.kepalaSekolah || "");
    setNipKepsek(sek.nipKepsek || "");
    setFormSubmitted(false);
    setTouched({
      npsn: false,
      nama: false,
      alamat: false,
      kepalaSekolah: false,
      nipKepsek: false,
    });
    setFormError("");
  };

  // Tutup Form Modal
  const handleCloseFormModal = () => {
    setIsAddModalOpen(false);
    setEditingSekolah(null);
    setFormError("");
  };

  // Evaluasi Validasi Realtime
  const getNpsnError = (val: string) => {
    if (!val.trim()) {
      return (formSubmitted || touched.npsn) ? "NPSN sekolah wajib diisi (8 digit angka)." : "";
    }
    if (/[^\d]/.test(val)) {
      return "NPSN hanya boleh berisi angka (tidak boleh ada huruf, spasi, atau simbol).";
    }
    if (val.length !== 8) {
      return `NPSN harus tepat 8 digit angka (saat ini ${val.length}/8 digit).`;
    }
    return "";
  };

  const getNamaError = (val: string) => {
    if (!val.trim()) {
      return (formSubmitted || touched.nama) ? "Nama sekolah wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan demi keamanan.";
    }
    return "";
  };

  const getAlamatError = (val: string) => {
    if (!val.trim()) {
      return (formSubmitted || touched.alamat) ? "Alamat lengkap sekolah wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan demi keamanan.";
    }
    return "";
  };

  const getKepalaSekolahError = (val: string) => {
    if (!val.trim()) {
      return (formSubmitted || touched.kepalaSekolah) ? "Nama kepala sekolah wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan demi keamanan.";
    }
    return "";
  };

  const getNipError = (val: string) => {
    if (!val.trim()) {
      return (formSubmitted || touched.nipKepsek) ? "NIP kepala sekolah wajib diisi (18 digit angka)." : "";
    }
    if (/[^\d\s]/.test(val)) {
      return "NIP hanya boleh berisi angka dan spasi (tidak boleh ada huruf atau simbol).";
    }
    const digits = val.replace(/\s/g, "");
    if (digits.length !== 18) {
      return `NIP harus tepat 18 digit angka (saat ini ${digits.length}/18 digit). Contoh: 19780101 200501 1 002`;
    }
    return "";
  };

  const npsnError = getNpsnError(npsn);
  const namaError = getNamaError(nama);
  const alamatError = getAlamatError(alamat);
  const kepalaSekolahError = getKepalaSekolahError(kepalaSekolah);
  const nipError = getNipError(nipKepsek);

  const isNpsnValid = npsn.trim().length === 8 && !/[^\d]/.test(npsn);
  const isNamaValid = nama.trim().length > 0 && !/[<>]/.test(nama);
  const isAlamatValid = alamat.trim().length > 0 && !/[<>]/.test(alamat);
  const isKepalaSekolahValid = kepalaSekolah.trim().length > 0 && !/[<>]/.test(kepalaSekolah);
  const isNipValid = nipKepsek.trim().length > 0 && nipKepsek.replace(/\s/g, "").length === 18 && !/[^\d\s]/.test(nipKepsek);

  const hasAnyError = Boolean(
    npsnError ||
    namaError ||
    alamatError ||
    kepalaSekolahError ||
    nipError ||
    !npsn.trim() ||
    !nama.trim() ||
    !alamat.trim() ||
    !kepalaSekolah.trim() ||
    !nipKepsek.trim()
  );

  // Submit Tambah Sekolah
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTouched({
      npsn: true,
      nama: true,
      alamat: true,
      kepalaSekolah: true,
      nipKepsek: true,
    });
    setFormError("");

    if (hasAnyError) {
      setFormError("Semua kolom form wajib diisi dengan benar. Silakan periksa input bertanda merah.");
      return;
    }

    startTransition(async () => {
      const res = await createSekolahAction({
        npsn: npsn.trim(),
        nama: nama.trim(),
        alamat: alamat.trim(),
        kepalaSekolah: kepalaSekolah.trim(),
        nipKepsek: nipKepsek.trim(),
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setAlertModal({
          isOpen: true,
          title: "Sekolah Berhasil Didaftarkan!",
          message: `Instansi sekolah '${nama.trim()}' (NPSN: ${npsn.trim()}) telah berhasil ditambahkan dengan status AKTIF (isStatus = 1).`,
          type: "success",
        });
      } else {
        setFormError(res.message || "Gagal mendaftarkan sekolah.");
      }
    });
  };

  // Submit Edit Sekolah
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSekolah) return;

    setFormSubmitted(true);
    setTouched({
      npsn: true,
      nama: true,
      alamat: true,
      kepalaSekolah: true,
      nipKepsek: true,
    });
    setFormError("");

    if (hasAnyError) {
      setFormError("Semua kolom form wajib diisi dengan benar. Silakan periksa input bertanda merah.");
      return;
    }

    startTransition(async () => {
      const res = await updateSekolahSuperAdminAction({
        id: editingSekolah.id,
        npsn: npsn.trim(),
        nama: nama.trim(),
        alamat: alamat.trim(),
        kepalaSekolah: kepalaSekolah.trim(),
        nipKepsek: nipKepsek.trim(),
        status: editingSekolah.status,
      });

      if (res.success) {
        setEditingSekolah(null);
        setAlertModal({
          isOpen: true,
          title: "Data Sekolah Berhasil Diperbarui!",
          message: `Perubahan profil sekolah '${nama.trim()}' telah berhasil disimpan ke database.`,
          type: "success",
        });
      } else {
        setFormError(res.message || "Gagal memperbarui data sekolah.");
      }
    });
  };

  // Eksekusi Toggle Status (Soft Delete isStatus 0/1)
  const handleExecuteToggleStatus = () => {
    if (!confirmToggleSekolah) return;
    const { sekolah, targetIsStatus } = confirmToggleSekolah;

    startTransition(async () => {
      const res = await toggleStatusSekolahAction(sekolah.id, targetIsStatus);

      setConfirmToggleSekolah(null);
      if (res.success) {
        setAlertModal({
          isOpen: true,
          title: targetIsStatus ? "Sekolah Berhasil Diaktifkan!" : "Sekolah Berhasil Dinonaktifkan (Soft Delete)!",
          message: targetIsStatus
            ? `Sekolah '${sekolah.nama}' kini telah AKTIF kembali (isStatus = 1).`
            : `Sekolah '${sekolah.nama}' telah dinonaktifkan (isStatus = 0). Data tidak dihapus permanen dan dapat diaktifkan kembali kapan saja.`,
          type: targetIsStatus ? "success" : "info",
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: "Operasi Gagal",
          message: res.message,
          type: "info",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mb-1">
            <Link href="/super-admin" className="hover:text-zinc-800">
              Super Admin
            </Link>
            <span>/</span>
            <span className="text-zinc-800 font-semibold">Kelola Sekolah</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 font-poppins">
            Daftar Sekolah Binaan (Tenants)
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kelola instansi sekolah, status lisensi operasional (isStatus), dan penandatangan rapor.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white transition shadow-xs flex items-center gap-1.5 w-fit active:scale-95 cursor-pointer"
        >
          <span className="text-sm font-bold">+</span>
          <span>Tambah Sekolah Baru</span>
        </button>
      </div>

      {/* Tabel Sekolah */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        {initialSekolahList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-500 font-medium">Belum ada sekolah yang terdaftar di sistem.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-3 inline-block text-xs font-semibold text-[#1b4332] hover:underline cursor-pointer"
            >
              + Klik di sini untuk menambah sekolah baru sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-[#fbfaf8] text-zinc-600 font-mono">
                  <th className="py-3.5 px-4 font-semibold w-12 text-center">No</th>
                  <th className="py-3.5 px-4 font-semibold w-28">NPSN</th>
                  <th className="py-3.5 px-4 font-semibold min-w-[200px]">Nama Sekolah & Alamat</th>
                  <th className="py-3.5 px-4 font-semibold min-w-[180px]">Kepala Sekolah</th>
                  <th className="py-3.5 px-4 font-semibold text-center w-28">Rombel</th>
                  <th className="py-3.5 px-4 font-semibold text-center w-32">Operator</th>
                  <th className="py-3.5 px-4 font-semibold text-center w-36">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right w-44">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {initialSekolahList.map((sek, idx) => {
                  const isActive = sek.isStatus !== false && sek.status === "AKTIF";
                  return (
                    <tr
                      key={sek.id}
                      className={`transition-colors ${
                        isActive ? "hover:bg-stone-50/80" : "bg-stone-50/40 hover:bg-stone-100/60 opacity-80"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-500">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-800">{sek.npsn}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 text-[13px]">{sek.nama}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                          {sek.alamat || "Alamat belum diatur"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-800">{sek.kepalaSekolah || "-"}</div>
                        {sek.nipKepsek && (
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            NIP: {sek.nipKepsek}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-700">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-zinc-700 border border-stone-200 text-[11px]">
                          {sek._count?.kelas || 0} Rombel
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {sek.users && sek.users.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Sudah Ada</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            <span>Belum Ada</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>1 • AKTIF</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>0 • NONAKTIF</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Tombol Edit Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sek)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 text-zinc-700 transition shadow-2xs cursor-pointer"
                            title="Edit Data Sekolah"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>

                          {/* Tombol Soft Delete / Toggle isStatus */}
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmToggleSekolah({
                                  sekolah: sek,
                                  targetIsStatus: false,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition shadow-2xs cursor-pointer"
                              title="Nonaktifkan Sekolah (Soft Delete)"
                            >
                              <span>🚫</span>
                              <span>Nonaktifkan</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmToggleSekolah({
                                  sekolah: sek,
                                  targetIsStatus: true,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition shadow-2xs cursor-pointer"
                              title="Aktifkan Kembali Sekolah"
                            >
                              <span>♻️</span>
                              <span>Aktifkan</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. MODAL FORM: TAMBAH & EDIT SEKOLAH                     */}
      {/* ========================================================= */}
      {(isAddModalOpen || editingSekolah) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-poppins">
                  {editingSekolah ? "Edit Data Sekolah (Tenant)" : "Registrasi Sekolah Baru"}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Semua inputan form wajib diisi lengkap untuk integritas dokumen rapor.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseFormModal}
                className="text-zinc-500 hover:text-zinc-800 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form
              onSubmit={editingSekolah ? handleEditSubmit : handleCreateSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NPSN Sekolah */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                    NPSN Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={npsn}
                    onBlur={() => setTouched((p) => ({ ...p, npsn: true }))}
                    onChange={(e) => setNpsn(e.target.value)}
                    placeholder="Contoh: 10203040"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono placeholder:text-zinc-400 outline-none transition ${
                      npsnError
                        ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                        : isNpsnValid
                        ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                    }`}
                  />
                  {npsnError && (
                    <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                      <span className="font-bold text-xs mt-[-1px]">✕</span>
                      <span>{npsnError}</span>
                    </p>
                  )}
                  {isNpsnValid && (
                    <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                      <span className="font-bold">✓</span>
                      <span>Format NPSN valid (8 digit angka)</span>
                    </p>
                  )}
                </div>

                {/* Nama Sekolah */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                    Nama Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onBlur={() => setTouched((p) => ({ ...p, nama: true }))}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: SD Negeri 01 Pagi"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs placeholder:text-zinc-400 outline-none transition ${
                      namaError
                        ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                        : isNamaValid
                        ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                    }`}
                  />
                  {namaError && (
                    <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                      <span className="font-bold text-xs mt-[-1px]">✕</span>
                      <span>{namaError}</span>
                    </p>
                  )}
                  {isNamaValid && (
                    <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                      <span className="font-bold">✓</span>
                      <span>Nama sekolah terisi</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Alamat Lengkap Sekolah */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                  Alamat Lengkap Sekolah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={alamat}
                  onBlur={() => setTouched((p) => ({ ...p, alamat: true }))}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Pendidikan No. 1, Kelurahan..."
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs placeholder:text-zinc-400 outline-none transition ${
                    alamatError
                      ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                      : isAlamatValid
                      ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                      : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                  }`}
                />
                {alamatError && (
                  <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                    <span className="font-bold text-xs mt-[-1px]">✕</span>
                    <span>{alamatError}</span>
                  </p>
                )}
                {isAlamatValid && (
                  <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <span className="font-bold">✓</span>
                    <span>Alamat lengkap terisi</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Kepala Sekolah */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                    Nama Kepala Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kepalaSekolah}
                    onBlur={() => setTouched((p) => ({ ...p, kepalaSekolah: true }))}
                    onChange={(e) => setKepalaSekolah(e.target.value)}
                    placeholder="Drs. H. Mulyadi, M.Pd."
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs placeholder:text-zinc-400 outline-none transition ${
                      kepalaSekolahError
                        ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                        : isKepalaSekolahValid
                        ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                    }`}
                  />
                  {kepalaSekolahError && (
                    <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                      <span className="font-bold text-xs mt-[-1px]">✕</span>
                      <span>{kepalaSekolahError}</span>
                    </p>
                  )}
                  {isKepalaSekolahValid && (
                    <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                      <span className="font-bold">✓</span>
                      <span>Nama kepala sekolah terisi</span>
                    </p>
                  )}
                </div>

                {/* NIP Kepala Sekolah */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                    NIP Kepala Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nipKepsek}
                    onBlur={() => setTouched((p) => ({ ...p, nipKepsek: true }))}
                    onChange={(e) => setNipKepsek(e.target.value)}
                    placeholder="Contoh: 19780101 200501 1 002"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono placeholder:text-zinc-400 outline-none transition ${
                      nipError
                        ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                        : isNipValid
                        ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                    }`}
                  />
                  {nipError && (
                    <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                      <span className="font-bold text-xs mt-[-1px]">✕</span>
                      <span>{nipError}</span>
                    </p>
                  )}
                  {isNipValid && (
                    <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                      <span className="font-bold">✓</span>
                      <span>Format NIP valid (18 digit angka)</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleCloseFormModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-stone-50 text-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-bold shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <SaveIcon className="h-4 w-4" />
                  <span>
                    {isPending
                      ? "Menyimpan..."
                      : editingSekolah
                      ? "Simpan Perubahan"
                      : "Simpan & Daftarkan"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL KONFIRMASI SOFT DELETE / TOGGLE ISSTATUS        */}
      {/* ========================================================= */}
      {confirmToggleSekolah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  confirmToggleSekolah.targetIsStatus
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {confirmToggleSekolah.targetIsStatus ? (
                  <CheckCircle2Icon className="h-6 w-6" />
                ) : (
                  <AlertCircleIcon className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-poppins">
                  {confirmToggleSekolah.targetIsStatus
                    ? "Aktifkan Kembali Sekolah?"
                    : "Konfirmasi Nonaktifkan Sekolah"}
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  {confirmToggleSekolah.targetIsStatus ? (
                    <>
                      Apakah Anda ingin mengaktifkan kembali instansi{" "}
                      <strong>{confirmToggleSekolah.sekolah.nama}</strong>? Status lisensi akan
                      diubah menjadi <strong>AKTIF (isStatus = 1)</strong> sehingga guru dan admin
                      dapat mengakses kembali.
                    </>
                  ) : (
                    <>
                      Apakah Anda yakin ingin menonaktifkan instansi{" "}
                      <strong>{confirmToggleSekolah.sekolah.nama}</strong>?
                      <br />
                      <span className="block mt-1.5 p-2.5 rounded-xl bg-rose-50 text-rose-800 text-[11px] border border-rose-200">
                        <strong>Teknis Soft Delete:</strong>
                        <br />• Kolom <strong>IsStatus</strong> akan diubah menjadi{" "}
                        <strong>0 (NONAKTIF)</strong>.<br />• Data sekolah, kelas, dan siswa{" "}
                        <strong>TIDAK DIHAPUS</strong> dari database dan dapat diaktifkan kembali
                        kapan saja.
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmToggleSekolah(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-stone-50 text-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleExecuteToggleStatus}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer ${
                  confirmToggleSekolah.targetIsStatus
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-rose-700 hover:bg-rose-800"
                }`}
              >
                {isPending
                  ? "Memproses..."
                  : confirmToggleSekolah.targetIsStatus
                  ? "Ya, Aktifkan Kembali"
                  : "Ya, Nonaktifkan (Soft Delete)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ALERT MODAL SUKSES (POP-UP NOTIFIKASI BERHASIL)       */}
      {/* ========================================================= */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2Icon className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-bold text-zinc-900 text-lg font-poppins">
                {alertModal.title}
              </h3>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed px-2">
                {alertModal.message}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAlertModal((p) => ({ ...p, isOpen: false }))}
                className="w-full py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                Tutup & Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
