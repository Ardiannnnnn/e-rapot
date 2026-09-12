"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  createOperatorAction,
  updateOperatorAction,
  toggleStatusOperatorAction,
} from "@/actions/operator";
import { CheckCircle2Icon, AlertCircleIcon, SaveIcon } from "@/components/shared/icons";
import { toast } from "@/components/shared/toast";

export interface OperatorItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  sekolahId: string | null;
  createdAt: Date;
  sekolah: {
    id: string;
    nama: string;
    npsn: string;
    isStatus: boolean;
  } | null;
}

export default function KelolaOperatorClient({
  initialOperatorList,
  sekolahOptions,
}: {
  initialOperatorList: OperatorItem[];
  sekolahOptions: { id: string; nama: string; npsn: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  // Modal State (Tambah / Edit)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<OperatorItem | null>(null);
  const [confirmToggleOperator, setConfirmToggleOperator] = useState<{
    operator: OperatorItem;
    targetIsActive: boolean;
  } | null>(null);

  // State Form Input
  const [sekolahId, setSekolahId] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    sekolahId: false,
    nama: false,
    email: false,
    password: false,
  });
  const [formError, setFormError] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AKTIF" | "NONAKTIF">("ALL");
  const [sekolahFilter, setSekolahFilter] = useState<string>("ALL");

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setSekolahId(sekolahOptions.length > 0 ? sekolahOptions[0].id : "");
    setNama("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFormSubmitted(false);
    setTouched({
      sekolahId: false,
      nama: false,
      email: false,
      password: false,
    });
    setFormError("");
    setIsAddModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (op: OperatorItem) => {
    setEditingOperator(op);
    setSekolahId(op.sekolahId || (sekolahOptions.length > 0 ? sekolahOptions[0].id : ""));
    setNama(op.name);
    setEmail(op.email);
    setPassword("");
    setShowPassword(false);
    setFormSubmitted(false);
    setTouched({
      sekolahId: false,
      nama: false,
      email: false,
      password: false,
    });
    setFormError("");
  };

  // Tutup Form Modal
  const handleCloseFormModal = () => {
    setIsAddModalOpen(false);
    setEditingOperator(null);
    setFormError("");
  };

  // Evaluasi Validasi Realtime
  const getSekolahError = (val: string) => {
    if (!val.trim()) {
      return formSubmitted || touched.sekolahId ? "Pilihan sekolah wajib dipilih." : "";
    }
    return "";
  };

  const getNamaError = (val: string) => {
    if (!val.trim()) {
      return formSubmitted || touched.nama ? "Nama lengkap operator wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan.";
    }
    if (val.trim().length < 3) {
      return "Nama operator minimal 3 karakter.";
    }
    return "";
  };

  const getEmailError = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return formSubmitted || touched.email ? "Alamat email operator wajib diisi." : "";
    }
    if (/[<>]/.test(trimmed)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Format email tidak valid (contoh: operator@sekolah.sch.id).";
    }
    return "";
  };

  const getPasswordError = (val: string, isEdit = false) => {
    if (!isEdit && !val) {
      return formSubmitted || touched.password ? "Kata sandi wajib diisi." : "";
    }
    if (val && val.length < 6) {
      return "Kata sandi minimal harus terdiri dari 6 karakter.";
    }
    return "";
  };

  // Status validasi form saat ini
  const isFormValid = editingOperator
    ? !getSekolahError(sekolahId) &&
      !getNamaError(nama) &&
      !getEmailError(email) &&
      !getPasswordError(password, true)
    : !getSekolahError(sekolahId) &&
      !getNamaError(nama) &&
      !getEmailError(email) &&
      !getPasswordError(password, false);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!isFormValid) {
      setFormError("Mohon perbaiki isian form yang bertanda merah sebelum menyimpan.");
      return;
    }

    setFormError("");

    startTransition(async () => {
      try {
        if (editingOperator) {
          // Mode Edit
          const res = await updateOperatorAction(editingOperator.id, {
            sekolahId,
            nama,
            email,
            password: password ? password : undefined,
          });

          if (!res.success) {
            setFormError(res.message);
          } else {
            handleCloseFormModal();
            toast.success(res.message);
          }
        } else {
          // Mode Tambah Baru
          const res = await createOperatorAction({
            sekolahId,
            nama,
            email,
            password,
          });

          if (!res.success) {
            setFormError(res.message);
          } else {
            handleCloseFormModal();
            toast.success(`${res.message} Akun siap digunakan untuk login.`);
          }
        }
      } catch (err: any) {
        setFormError(err?.message || "Terjadi kesalahan saat menyimpan data.");
      }
    });
  };

  // Eksekusi Toggle Status Aktif / Nonaktif
  const handleExecuteToggleStatus = () => {
    if (!confirmToggleOperator) return;

    startTransition(async () => {
      try {
        const res = await toggleStatusOperatorAction(
          confirmToggleOperator.operator.id,
          confirmToggleOperator.operator.isActive
        );

        const targetIsActive = confirmToggleOperator.targetIsActive;
        setConfirmToggleOperator(null);

        if (!res.success) {
          toast.error(res.message);
        } else {
          toast.success(res.message);
        }
      } catch (err: any) {
        setConfirmToggleOperator(null);
        toast.error(err?.message || "Gagal mengubah status akun operator.");
      }
    });
  };

  // Filter Data Operator
  const filteredOperators = initialOperatorList.filter((op) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      op.name.toLowerCase().includes(q) ||
      op.email.toLowerCase().includes(q) ||
      (op.sekolah?.nama || "").toLowerCase().includes(q) ||
      (op.sekolah?.npsn || "").toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "AKTIF"
        ? op.isActive === true
        : op.isActive === false;

    const matchSekolah = sekolahFilter === "ALL" ? true : op.sekolahId === sekolahFilter;

    return matchQuery && matchStatus && matchSekolah;
  });

  const totalAktif = initialOperatorList.filter((o) => o.isActive).length;
  const totalNonaktif = initialOperatorList.filter((o) => !o.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1b4332] via-[#24543f] to-[#143225] p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-sm border border-emerald-400/20 font-mono tracking-wide">
                Super Admin • SaaS Multi-Tenant
              </span>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-bold border border-emerald-300/30 font-mono">
                {initialOperatorList.length} Akun Operator
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins tracking-tight">
              Kelola Operator Sekolah
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-[#1b4332] px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition duration-200 active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tambah Operator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
              Total Operator
            </span>
            <p className="mt-1.5 text-2xl font-bold text-[#1b4332] font-mono">
              {initialOperatorList.length}
            </p>
            <span className="text-[11px] text-zinc-600">Terdaftar di sistem</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            👥
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
              Operator Aktif
            </span>
            <p className="mt-1.5 text-2xl font-bold text-emerald-600 font-mono">{totalAktif}</p>
            <span className="text-[11px] text-zinc-600">Dapat login ke panel</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            🟢
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
              Operator Nonaktif
            </span>
            <p className="mt-1.5 text-2xl font-bold text-stone-500 font-mono">{totalNonaktif}</p>
            <span className="text-[11px] text-zinc-600">Akses login ditangguhkan</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold">
            ⚪
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
              Sekolah Terdaftar
            </span>
            <p className="mt-1.5 text-2xl font-bold text-indigo-600 font-mono">
              {sekolahOptions.length}
            </p>
            <span className="text-[11px] text-zinc-600">Lembaga aktif siap ditautkan</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            🏛️
          </div>
        </div>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari nama, email, sekolah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-2.5 pl-10 text-xs text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/20 focus:outline-none transition"
          />
          <svg
            className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Sekolah & Status */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Dropdown Filter Sekolah */}
          <select
            value={sekolahFilter}
            onChange={(e) => setSekolahFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-stone-300 focus:border-[#1b4332] focus:outline-none transition"
          >
            <option value="ALL">Semua Sekolah</option>
            {sekolahOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>

          {/* Filter Status Aktif */}
          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "ALL"
                  ? "bg-white text-zinc-900 shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("AKTIF")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "AKTIF"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("NONAKTIF")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "NONAKTIF"
                  ? "bg-stone-700 text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Data Operator Sekolah */}
      <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-4 w-12 text-center">No</th>
                <th className="px-5 py-4">Operator Sekolah</th>
                <th className="px-5 py-4">Sekolah Induk & NPSN</th>
                <th className="px-5 py-4">Hak Akses</th>
                <th className="px-5 py-4 text-center">Status Akun</th>
                <th className="px-5 py-4">Terdaftar</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-600">
                    <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3 text-lg">
                      👥
                    </div>
                    <p className="font-semibold text-zinc-800 text-sm">
                      Tidak ada operator ditemukan
                    </p>
                    <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
                      {searchQuery || statusFilter !== "ALL" || sekolahFilter !== "ALL"
                        ? "Tidak ada data operator yang sesuai dengan kriteria filter saat ini."
                        : "Belum ada akun operator sekolah yang terdaftar. Klik tombol 'Tambah Operator' untuk membuat akun baru."}
                    </p>
                    {searchQuery || statusFilter !== "ALL" || sekolahFilter !== "ALL" ? (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                          setSekolahFilter("ALL");
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition"
                      >
                        Reset Filter
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenAdd}
                        className="mt-3 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-bold hover:bg-[#143225] transition"
                      >
                        + Tambah Operator Pertama
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op, idx) => {
                  const isAktif = op.isActive;

                  return (
                    <tr
                      key={op.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        !isAktif ? "bg-stone-50/40 opacity-75" : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-center font-mono text-zinc-600 font-semibold">
                        {idx + 1}
                      </td>

                      {/* Info Operator */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase font-poppins">
                            {op.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 font-poppins text-xs sm:text-sm">
                              {op.name}
                            </div>
                            <div className="text-[11px] text-zinc-600 font-mono mt-0.5">
                              {op.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Info Sekolah */}
                      <td className="px-5 py-4">
                        {op.sekolah ? (
                          <div>
                            <div className="font-semibold text-zinc-800">{op.sekolah.nama}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-zinc-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                NPSN: {op.sekolah.npsn}
                              </span>
                              {!op.sekolah.isStatus && (
                                <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-semibold">
                                  Sekolah Nonaktif
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600 italic">Belum ditautkan</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          🛡️ Admin Sekolah
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                            isAktif
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-stone-100 text-stone-600 border-stone-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAktif ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                            }`}
                          />
                          {isAktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      {/* Tanggal Terdaftar */}
                      <td className="px-5 py-4 text-zinc-600 font-mono text-[11px]">
                        {new Date(op.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Tombol Aksi */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(op)}
                            title="Edit Operator"
                            className="p-1.5 rounded-lg border border-stone-200 text-zinc-700 hover:bg-stone-100 hover:border-stone-300 transition active:scale-95 cursor-pointer"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>

                          {/* Tombol Toggle Status */}
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmToggleOperator({
                                operator: op,
                                targetIsActive: !isAktif,
                              })
                            }
                            title={isAktif ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            className={`p-1.5 rounded-lg border transition active:scale-95 cursor-pointer ${
                              isAktif
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {isAktif ? (
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. MODAL TAMBAH & EDIT OPERATOR SEKOLAH                   */}
      {/* ========================================================= */}
      {(isAddModalOpen || editingOperator) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 mb-1 font-mono">
                  {editingOperator ? "Perbarui Akun" : "Registrasi Akun Baru"}
                </span>
                <h2 className="font-bold text-zinc-900 text-lg sm:text-xl font-poppins">
                  {editingOperator ? `Edit Operator Sekolah` : "Tambah Operator Sekolah"}
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {editingOperator
                    ? "Perbarui informasi akun operator atau atur ulang kata sandi login."
                    : "Pilih sekolah terdaftar dan buatkan akun login untuk operator sekolah."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseFormModal}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Error Banner jika ada kegagalan server */}
            {formError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            {/* Warning jika belum ada sekolah terdaftar */}
            {!editingOperator && sekolahOptions.length === 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                <p className="font-bold">⚠️ Belum Ada Sekolah Terdaftar!</p>
                <p>
                  Anda belum memiliki data sekolah aktif. Operator harus ditautkan ke satu sekolah.
                  Silakan tambahkan data sekolah terlebih dahulu pada menu <strong>Kelola Sekolah</strong>.
                </p>
                <Link
                  href="/super-admin/sekolah"
                  className="inline-block px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition"
                >
                  Buka Kelola Sekolah &rarr;
                </Link>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Dropdown Pilihan Sekolah */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Sekolah Yang Dikelola <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={sekolahOptions.length === 0}
                  value={sekolahId}
                  onChange={(e) => {
                    setSekolahId(e.target.value);
                    setTouched((p) => ({ ...p, sekolahId: true }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, sekolahId: true }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none transition ${
                    getSekolahError(sekolahId)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 bg-stone-50/50 focus:bg-white focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/20"
                  }`}
                >
                  <option value="">-- Pilih Sekolah Terdaftar --</option>
                  {sekolahOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.npsn} — {s.nama}
                    </option>
                  ))}
                </select>
                {getSekolahError(sekolahId) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getSekolahError(sekolahId)}
                  </p>
                )}
              </div>

              {/* Nama Lengkap Operator */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Nama Lengkap Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Fauzi, S.Pd / Admin Dapodik"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value);
                    setTouched((p) => ({ ...p, nama: true }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, nama: true }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition ${
                    getNamaError(nama)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 bg-stone-50/50 focus:bg-white focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/20"
                  }`}
                />
                {getNamaError(nama) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getNamaError(nama)}
                  </p>
                )}
              </div>

              {/* Email Login */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Email Akun Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: operator.sdn07@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setTouched((p) => ({ ...p, email: true }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition font-mono ${
                    getEmailError(email)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 bg-stone-50/50 focus:bg-white focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/20"
                  }`}
                />
                {getEmailError(email) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getEmailError(email)}
                  </p>
                )}
              </div>

              {/* Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-800">
                    Kata Sandi (Password){" "}
                    {editingOperator ? (
                      <span className="text-zinc-600 font-normal">(Opsional)</span>
                    ) : (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800"
                  >
                    {showPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    editingOperator
                      ? "Kosongkan jika tidak ingin mengubah kata sandi"
                      : "Minimal 6 karakter (contoh: Admin123!)"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setTouched((p) => ({ ...p, password: true }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition font-mono ${
                    getPasswordError(password, !!editingOperator)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 bg-stone-50/50 focus:bg-white focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/20"
                  }`}
                />
                {getPasswordError(password, !!editingOperator) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getPasswordError(password, !!editingOperator)}
                  </p>
                )}
                {editingOperator && (
                  <p className="mt-1 text-[10px] text-zinc-600">
                    * Kosongkan kolom kata sandi jika hanya ingin mengubah nama, email, atau sekolah.
                  </p>
                )}
              </div>

              {/* Badge Hak Akses (Otomatis) */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Hak Akses (Role)
                  </span>
                  <span className="font-semibold text-emerald-950">
                    🛡️ Administrator Sekolah (ADMIN_SEKOLAH)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold font-mono">
                  Otomatis
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleCloseFormModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-stone-50 text-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || (!editingOperator && sekolahOptions.length === 0)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-bold shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <SaveIcon className="w-3.5 h-3.5" />
                  <span>
                    {isPending
                      ? "Menyimpan..."
                      : editingOperator
                      ? "Simpan Perubahan"
                      : "Buat Akun Operator"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL KONFIRMASI NONAKTIFKAN / AKTIFKAN STATUS AKUN    */}
      {/* ========================================================= */}
      {confirmToggleOperator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmToggleOperator.targetIsActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {confirmToggleOperator.targetIsActive ? "🟢" : "⚠️"}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-poppins">
                  {confirmToggleOperator.targetIsActive
                    ? "Aktifkan Akun Operator?"
                    : "Nonaktifkan Akun Operator?"}
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  {confirmToggleOperator.targetIsActive ? (
                    <>
                      Apakah Anda yakin ingin mengaktifkan kembali akun untuk{" "}
                      <strong>{confirmToggleOperator.operator.name}</strong> (
                      {confirmToggleOperator.operator.email})? Operator ini akan dapat login kembali
                      ke panel sekolah.
                    </>
                  ) : (
                    <>
                      Apakah Anda yakin ingin menonaktifkan akun untuk{" "}
                      <strong>{confirmToggleOperator.operator.name}</strong> (
                      {confirmToggleOperator.operator.email})?
                      <br />
                      <span className="block mt-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px] border border-amber-200">
                        <strong>Catatan:</strong>
                        <br />• Akses login operator akan ditangguhkan sementara.
                        <br />• Data sekolah, kelas, mapel, dan nilai tidak akan terhapus.
                        <br />• Akun dapat diaktifkan kembali kapan saja oleh Super Admin.
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
                onClick={() => setConfirmToggleOperator(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-stone-50 text-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleExecuteToggleStatus}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer ${
                  confirmToggleOperator.targetIsActive
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-amber-700 hover:bg-amber-800"
                }`}
              >
                {isPending
                  ? "Memproses..."
                  : confirmToggleOperator.targetIsActive
                  ? "Ya, Aktifkan Akun"
                  : "Ya, Nonaktifkan Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
