"use client";

import React, { useState, useTransition } from "react";
import {
  createGuruAction,
  updateGuruAction,
  toggleGuruStatusAction,
  assignPengampuAction,
  updatePengampuAction,
  deletePengampuAction,
  deleteGuruAction,
} from "@/actions/pendidik";

import {
  GuruItem,
  PengampuRecord,
  KelasItemWithWali,
  FormPendidikProps,
} from "@/types/admin-sekolah";
import { TablePagination } from "@/components/shared/table-pagination";
import { CheckCircle2Icon, AlertCircleIcon } from "@/components/shared/icons";
import { toast } from "@/components/shared/toast";

export default function FormPendidik({
  guruList,
  pengampuList,
  kelasList,
  mapelList,
  tahunAjaranAktif,
}: FormPendidikProps) {
  const [activeTab, setActiveTab] = useState<"GURU" | "PENGAMPU">("PENGAMPU");
  const [isPending, startTransition] = useTransition();

  // Filter Tab Pengampu
  const [searchPengampu, setSearchPengampu] = useState("");
  const [filterKelas, setFilterKelas] = useState<string>("ALL");
  const [filterSemester, setFilterSemester] = useState<number | "ALL">("ALL");
  const [filterGuru, setFilterGuru] = useState<string>("ALL");

  // Modal Tambah Guru
  const [isAddGuruOpen, setIsAddGuruOpen] = useState(false);
  const [guruName, setGuruName] = useState("");
  const [guruEmail, setGuruEmail] = useState("");
  const [guruPassword, setGuruPassword] = useState("password123");
  const [showGuruPassword, setShowGuruPassword] = useState(false);
  const [guruSubmitted, setGuruSubmitted] = useState(false);
  const [guruTouched, setGuruTouched] = useState({
    name: false,
    email: false,
    password: false,
  });
  const [guruFormError, setGuruFormError] = useState("");

  // Modal Edit Guru & Atur Wali Kelas
  const [isEditGuruOpen, setIsEditGuruOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruItem | null>(null);
  const [editGuruName, setEditGuruName] = useState("");
  const [editGuruEmail, setEditGuruEmail] = useState("");
  const [editGuruPassword, setEditGuruPassword] = useState("");
  const [showEditGuruPassword, setShowEditGuruPassword] = useState(false);
  const [editGuruIsActive, setEditGuruIsActive] = useState<boolean>(true);
  const [editGuruKelasWaliId, setEditGuruKelasWaliId] = useState<string>("NONE");
  const [editGuruSubmitted, setEditGuruSubmitted] = useState(false);
  const [editGuruTouched, setEditGuruTouched] = useState({
    name: false,
    email: false,
    password: false,
  });
  const [editGuruFormError, setEditGuruFormError] = useState("");

  // Confirm Dialog Modal (In-App Confirmation menggantikan confirm browser)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor?: "rose" | "emerald";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Ya, Lanjutkan",
    confirmColor: "rose",
    onConfirm: () => {},
  });

  // Modal Tambah Penugasan Mengajar
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignGuruId, setAssignGuruId] = useState("");
  const [assignKelasId, setAssignKelasId] = useState("");
  const [assignMapelId, setAssignMapelId] = useState("");
  const [assignSemester, setAssignSemester] = useState<number>(0); // 0 = Semua, 1 = Ganjil, 2 = Genap

  // Modal Edit Penugasan Mengajar
  const [isEditPengampuOpen, setIsEditPengampuOpen] = useState(false);
  const [editingPengampu, setEditingPengampu] = useState<PengampuRecord | null>(null);
  const [editPengampuGuruId, setEditPengampuGuruId] = useState("");
  const [editPengampuKelasId, setEditPengampuKelasId] = useState("");
  const [editPengampuMapelId, setEditPengampuMapelId] = useState("");
  const [editPengampuSemester, setEditPengampuSemester] = useState<number>(0);

  // Search & Filter Guru
  const [searchGuru, setSearchGuru] = useState("");
  const [filterStatusGuru, setFilterStatusGuru] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filteredGuru = guruList.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(searchGuru.toLowerCase()) ||
      g.email.toLowerCase().includes(searchGuru.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatusGuru === "ACTIVE" && !g.isActive) return false;
    if (filterStatusGuru === "INACTIVE" && g.isActive) return false;
    return true;
  });

  const filteredPengampu = pengampuList.filter((p) => {
    if (searchPengampu.trim()) {
      const q = searchPengampu.toLowerCase();
      const matchMapel =
        p.mapel.nama.toLowerCase().includes(q) || p.mapel.kode.toLowerCase().includes(q);
      const matchGuru =
        p.guru.name.toLowerCase().includes(q) || p.guru.email.toLowerCase().includes(q);
      const matchKelas = p.kelas.nama.toLowerCase().includes(q);
      if (!matchMapel && !matchGuru && !matchKelas) return false;
    }
    if (filterKelas !== "ALL" && p.kelas.id !== filterKelas) return false;
    if (filterGuru !== "ALL" && p.guru.id !== filterGuru) return false;
    if (filterSemester !== "ALL") {
      // Jika filter semester ganjil (1), match semester 0 dan 1
      // Jika filter semester genap (2), match semester 0 dan 2
      if (filterSemester === 1 && p.semester !== 0 && p.semester !== 1) return false;
      if (filterSemester === 2 && p.semester !== 0 && p.semester !== 2) return false;
      if (filterSemester === 0 && p.semester !== 0) return false;
    }
    return true;
  });

  // Pagination State Tab 1: Pengampu (Default 10, opsi 10/20/30)
  const [currentPagePengampu, setCurrentPagePengampu] = useState(1);
  const [pageSizePengampu, setPageSizePengampu] = useState<10 | 20 | 30>(10);

  // Pagination State Tab 2: Guru (Default 10, opsi 10/20/30)
  const [currentPageGuru, setCurrentPageGuru] = useState(1);
  const [pageSizeGuru, setPageSizeGuru] = useState<10 | 20 | 30>(10);

  // Tab 1 Pagination Calculations
  const totalPengampu = filteredPengampu.length;
  const totalPagesPengampu = Math.max(1, Math.ceil(totalPengampu / pageSizePengampu));
  const safePagePengampu = Math.min(currentPagePengampu, totalPagesPengampu);
  const startIndexPengampu = (safePagePengampu - 1) * pageSizePengampu;
  const paginatedPengampu = filteredPengampu.slice(
    startIndexPengampu,
    startIndexPengampu + pageSizePengampu
  );

  // Tab 2 Pagination Calculations
  const totalGuru = filteredGuru.length;
  const totalPagesGuru = Math.max(1, Math.ceil(totalGuru / pageSizeGuru));
  const safePageGuru = Math.min(currentPageGuru, totalPagesGuru);
  const startIndexGuru = (safePageGuru - 1) * pageSizeGuru;
  const paginatedGuru = filteredGuru.slice(
    startIndexGuru,
    startIndexGuru + pageSizeGuru
  );

  // Validasi Realtime Tambah Guru
  const getGuruNameError = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return (guruSubmitted || guruTouched.name) ? "Nama lengkap guru wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan.";
    }
    if (trimmed.length < 3) {
      return "Nama lengkap guru minimal harus 3 karakter.";
    }
    return "";
  };

  const getGuruEmailError = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return (guruSubmitted || guruTouched.email) ? "Alamat email akun login wajib diisi." : "";
    }
    if (/[<>]/.test(trimmed)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Format email tidak valid (contoh: guru@sekolah.sch.id).";
    }
    return "";
  };

  const getGuruPasswordError = (val: string) => {
    if (val && val.length < 6) {
      return "Kata sandi minimal harus terdiri dari 6 karakter.";
    }
    return "";
  };

  const handleOpenAddGuru = () => {
    setGuruName("");
    setGuruEmail("");
    setGuruPassword("password123");
    setShowGuruPassword(false);
    setGuruSubmitted(false);
    setGuruTouched({ name: false, email: false, password: false });
    setGuruFormError("");
    setIsAddGuruOpen(true);
  };

  const handleCreateGuru = (e: React.FormEvent) => {
    e.preventDefault();
    setGuruSubmitted(true);

    const nameErr = getGuruNameError(guruName);
    const emailErr = getGuruEmailError(guruEmail);
    const passErr = getGuruPasswordError(guruPassword);

    if (nameErr || emailErr || passErr) {
      setGuruFormError("Silakan perbaiki isian formulir yang bertanda merah.");
      return;
    }

    setGuruFormError("");

    startTransition(async () => {
      const res = await createGuruAction({
        name: guruName,
        email: guruEmail,
        password: guruPassword,
      });

      if (res.success) {
        toast.success(res.message);
        setGuruName("");
        setGuruEmail("");
        setGuruPassword("password123");
        setIsAddGuruOpen(false);
      } else {
        setGuruFormError(res.message);
      }
    });
  };

  const handleAssignPengampu = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await assignPengampuAction({
        guruId: assignGuruId,
        kelasId: assignKelasId,
        mapelId: assignMapelId,
        tahunAjaran: tahunAjaranAktif,
        semester: assignSemester,
      });

      if (res.success) {
        toast.success(res.message);
        setIsAssignOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Validasi Realtime Edit Guru
  const getEditGuruNameError = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return editGuruSubmitted || editGuruTouched.name ? "Nama lengkap guru wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan.";
    }
    if (trimmed.length < 3) {
      return "Nama lengkap guru minimal harus 3 karakter.";
    }
    return "";
  };

  const getEditGuruEmailError = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return editGuruSubmitted || editGuruTouched.email ? "Alamat email akun login wajib diisi." : "";
    }
    if (/[<>]/.test(trimmed)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Format email tidak valid (contoh: guru@sekolah.sch.id).";
    }
    return "";
  };

  const getEditGuruPasswordError = (val: string) => {
    if (val && val.length < 6) {
      return "Kata sandi baru minimal harus terdiri dari 6 karakter.";
    }
    return "";
  };

  const handleOpenEditGuru = (g: GuruItem) => {
    setEditingGuru(g);
    setEditGuruName(g.name);
    setEditGuruEmail(g.email);
    setEditGuruPassword("");
    setShowEditGuruPassword(false);
    setEditGuruIsActive(g.isActive);
    setEditGuruKelasWaliId(g.kelasWali?.id || "NONE");
    setEditGuruSubmitted(false);
    setEditGuruTouched({ name: false, email: false, password: false });
    setEditGuruFormError("");
    setIsEditGuruOpen(true);
  };

  const handleUpdateGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuru) return;
    setEditGuruSubmitted(true);

    const nameErr = getEditGuruNameError(editGuruName);
    const emailErr = getEditGuruEmailError(editGuruEmail);
    const passErr = getEditGuruPasswordError(editGuruPassword);

    if (nameErr || emailErr || passErr) {
      setEditGuruFormError("Silakan perbaiki isian formulir yang bertanda merah.");
      return;
    }

    setEditGuruFormError("");

    startTransition(async () => {
      const res = await updateGuruAction({
        id: editingGuru.id,
        name: editGuruName,
        email: editGuruEmail,
        password: editGuruPassword.trim() || undefined,
        isActive: editGuruIsActive,
        kelasWaliId: editGuruKelasWaliId === "NONE" ? null : editGuruKelasWaliId,
      });

      if (res.success) {
        toast.success(res.message);
        setIsEditGuruOpen(false);
      } else {
        setEditGuruFormError(res.message);
      }
    });
  };

  const handleToggleGuruStatus = (guruId: string, currentStatus: boolean, name: string) => {
    const actionText = currentStatus
      ? `Nonaktifkan akun guru '${name}'? Guru tidak akan dapat login dan penugasan wali kelasnya (jika ada) akan otomatis dibebaskan agar bisa digantikan oleh guru baru.`
      : `Aktifkan kembali akun guru '${name}'? Guru akan dapat kembali mengakses akun dan fitur penilaian.`;

    setConfirmModal({
      isOpen: true,
      title: currentStatus ? "Nonaktifkan Akun Guru?" : "Aktifkan Akun Guru?",
      message: actionText,
      confirmLabel: currentStatus ? "Ya, Nonaktifkan" : "Ya, Aktifkan",
      confirmColor: currentStatus ? "rose" : "emerald",
      onConfirm: () => {
        startTransition(async () => {
          const res = await toggleGuruStatusAction(guruId);
          if (res.success) {
            toast.success(res.message);
          } else {
            toast.error(res.message);
          }
        });
      },
    });
  };

  const handleOpenEditPengampu = (p: PengampuRecord) => {
    setEditingPengampu(p);
    setEditPengampuGuruId(p.guru.id);
    setEditPengampuKelasId(p.kelas.id);
    setEditPengampuMapelId(p.mapel.id);
    setEditPengampuSemester(p.semester);
    setIsEditPengampuOpen(true);
  };

  const handleUpdatePengampu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPengampu) return;

    startTransition(async () => {
      const res = await updatePengampuAction({
        id: editingPengampu.id,
        guruId: editPengampuGuruId,
        kelasId: editPengampuKelasId,
        mapelId: editPengampuMapelId,
        semester: editPengampuSemester,
      });

      if (res.success) {
        toast.success(res.message);
        setIsEditPengampuOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDeletePengampu = (id: string, guru: string, mapel: string, kelas: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Cabut Penugasan Mengajar?",
      message: `Apakah Anda yakin ingin mencabut penugasan mengajar ${mapel} di Kelas ${kelas} dari guru ${guru}?`,
      confirmLabel: "Ya, Cabut Penugasan",
      confirmColor: "rose",
      onConfirm: () => {
        startTransition(async () => {
          const res = await deletePengampuAction(id);
          if (res.success) {
            toast.success(res.message);
          } else {
            toast.error(res.message);
          }
        });
      },
    });
  };

  const handleDeleteGuru = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Akun Guru?",
      message: `Hapus akun guru '${name}'? Seluruh riwayat penugasan terkait akan terhapus dan tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Ya, Hapus Akun",
      confirmColor: "rose",
      onConfirm: () => {
        startTransition(async () => {
          const res = await deleteGuruAction(id);
          if (res.success) {
            toast.success(res.message);
          } else {
            toast.error(res.message);
          }
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab("PENGAMPU")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "PENGAMPU"
              ? "border-[#1b4332] text-[#1b4332]"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <span>📋</span>
          <span>Distribusi Penugasan Mengajar ({pengampuList.length} Jadwal)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("GURU")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "GURU"
              ? "border-[#1b4332] text-[#1b4332]"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <span>👥</span>
          <span>Daftar Akun Pendidik ({guruList.length} Guru)</span>
        </button>
      </div>

      {/* TAB 1: DISTRIBUSI PENUGASAN MENGAJAR (PENGAMPU) */}
      {activeTab === "PENGAMPU" && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Input Pencarian */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari guru, mapel, rombel..."
                  value={searchPengampu}
                  onChange={(e) => setSearchPengampu(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] shadow-2xs"
                />
                <span className="absolute left-3 top-3 text-zinc-400 text-xs">🔍</span>
              </div>

              {/* Filter Rombel */}
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-zinc-700 focus:outline-none focus:border-[#1b4332] shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelas {k.nama} (Tingkat {k.tingkat})
                  </option>
                ))}
              </select>

              {/* Filter Semester */}
              <select
                value={filterSemester}
                onChange={(e) =>
                  setFilterSemester(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
                }
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-zinc-700 focus:outline-none focus:border-[#1b4332] shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua Semester</option>
                <option value={0}>Semester 1 & 2 (Setahun)</option>
                <option value={1}>Hanya Semester Ganjil (1)</option>
                <option value={2}>Hanya Semester Genap (2)</option>
              </select>

              {/* Filter Guru */}
              <select
                value={filterGuru}
                onChange={(e) => setFilterGuru(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-zinc-700 focus:outline-none focus:border-[#1b4332] shadow-2xs cursor-pointer max-w-xs truncate"
              >
                <option value="ALL">Semua Guru Pengampu</option>
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                if (guruList.length === 0 || kelasList.length === 0 || mapelList.length === 0) {
                  toast.warning("Pastikan data guru, kelas, dan mapel sudah terdaftar sebelum melakukan penugasan.");
                  return;
                }
                setAssignGuruId(guruList[0]?.id || "");
                setAssignKelasId(kelasList[0]?.id || "");
                setAssignMapelId(mapelList[0]?.id || "");
                setAssignSemester(0);
                setIsAssignOpen(true);
              }}
              className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>Plotting Penugasan Baru</span>
            </button>
          </div>

          {/* Tabel Penugasan */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                    <th className="px-4 py-3.5 w-12 text-center">No</th>
                    <th className="px-4 py-3.5 w-28">Rombel</th>
                    <th className="px-4 py-3.5">Mata Pelajaran</th>
                    <th className="px-4 py-3.5">Guru Pengampu</th>
                    <th className="px-4 py-3.5 text-center">Berlaku Pada Semester</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {paginatedPengampu.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-600">
                        Tidak ada jadwal penugasan yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPengampu.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-4 py-3.5 text-center text-zinc-600 font-mono">
                          {startIndexPengampu + idx + 1}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Kelas {p.kelas.nama}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-zinc-900 text-sm">{p.mapel.nama}</div>
                          <span className="text-[10px] font-mono text-zinc-600">Kode: {p.mapel.kode}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-zinc-900">{p.guru.name}</div>
                          <div className="text-[11px] text-zinc-600">{p.guru.email}</div>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {p.semester === 0 ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Semua Semester (1 & 2)
                            </span>
                          ) : p.semester === 1 ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Semester 1 (Ganjil Saja)
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Semester 2 (Genap Saja)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPengampu(p)}
                              disabled={isPending}
                              className="px-2.5 py-1 rounded-lg border border-stone-300 hover:border-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition text-xs font-medium text-zinc-700"
                              title="Ubah guru pengampu atau semester mengajar"
                            >
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePengampu(p.id, p.guru.name, p.mapel.nama, p.kelas.nama)
                              }
                              disabled={isPending}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition text-xs font-medium"
                              title="Cabut penugasan mengajar ini"
                            >
                              Cabut Penugasan
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer Tab 1 menggunakan Template Standar */}
          <TablePagination
            currentPage={safePagePengampu}
            pageSize={pageSizePengampu}
            totalItems={totalPengampu}
            onPageChange={(page) => setCurrentPagePengampu(page)}
            onPageSizeChange={(size) => {
              setPageSizePengampu(size as 10 | 20 | 30);
              setCurrentPagePengampu(1);
            }}
            label="jadwal penugasan"
            pageSizeOptions={[10, 20, 30]}
          />
        </div>
      )}

      {/* TAB 2: DAFTAR AKUN PENDIDIK */}
      {activeTab === "GURU" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari nama atau email guru..."
                  value={searchGuru}
                  onChange={(e) => {
                    setSearchGuru(e.target.value);
                    setCurrentPageGuru(1);
                  }}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <select
                value={filterStatusGuru}
                onChange={(e) => {
                  setFilterStatusGuru(e.target.value as any);
                  setCurrentPageGuru(1);
                }}
                className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
              >
                <option value="ALL">Semua Status ({guruList.length})</option>
                <option value="ACTIVE">
                  🟢 Hanya Aktif ({guruList.filter((g) => g.isActive).length})
                </option>
                <option value="INACTIVE">
                  ⚪ Hanya Nonaktif ({guruList.filter((g) => !g.isActive).length})
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddGuru}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>Tambah Guru Baru</span>
            </button>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                    <th className="px-4 py-3.5 w-12 text-center">No</th>
                    <th className="px-4 py-3.5">Nama Guru</th>
                    <th className="px-4 py-3.5">Email Akun</th>
                    <th className="px-4 py-3.5 text-center">Status Guru</th>
                    <th className="px-4 py-3.5 text-center">Peran Wali Kelas</th>
                    <th className="px-4 py-3.5 text-center">Total Jadwal Diampu</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {paginatedGuru.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-600">
                        Tidak ada akun guru yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedGuru.map((g, idx) => (
                      <tr
                        key={g.id}
                        className={`transition-colors ${
                          g.isActive ? "hover:bg-stone-50/70" : "bg-stone-50/40 opacity-75"
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center text-zinc-600 font-mono">
                          {startIndexGuru + idx + 1}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-zinc-900 text-sm">{g.name}</div>
                          {!g.isActive && (
                            <span className="text-[10px] text-zinc-500 font-medium block">
                              (Nonaktif)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-zinc-700">
                          {g.email}
                        </td>

                        {/* KOLOM STATUS GURU */}
                        <td className="px-4 py-3.5 text-center">
                          {g.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditGuru(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Status: Aktif. Klik untuk mengubah data atau status guru."
                            >
                              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                              <span>Aktif</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEditGuru(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-zinc-600 border border-stone-200 hover:bg-stone-200 transition-colors cursor-pointer"
                              title="Status: Nonaktif. Klik untuk mengaktifkan kembali."
                            >
                              <span className="h-2 w-2 rounded-full bg-zinc-400"></span>
                              <span>Nonaktif</span>
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {g.kelasWali ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditGuru(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Klik untuk mengubah penugasan wali kelas"
                            >
                              <span>🏫</span>
                              <span>Wali Kelas {g.kelasWali.nama}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEditGuru(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-zinc-700 hover:bg-stone-200 transition-colors cursor-pointer"
                              title="Klik untuk menugaskan guru ini menjadi wali kelas"
                            >
                              <span>👨‍🏫</span>
                              <span>Guru Mapel Murni</span>
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="font-mono font-bold text-zinc-900">
                            {g.totalPengampu}
                          </span>{" "}
                          <span className="text-zinc-600">jadwal</span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGuru(g)}
                              disabled={isPending}
                              className="px-2.5 py-1 rounded-lg border border-stone-300 hover:border-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition text-xs font-medium text-zinc-700"
                              title="Edit identitas, status aktif, & atur peran wali kelas"
                            >
                              Edit / Atur
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGuru(g.id, g.name)}
                              disabled={isPending || g.totalPengampu > 0 || g.kelasWali !== null}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium"
                              title={
                                g.kelasWali !== null
                                  ? "Lepaskan status wali kelas terlebih dahulu untuk menghapus guru"
                                  : g.totalPengampu > 0
                                  ? "Cabut penugasan mengajar terlebih dahulu untuk menghapus guru"
                                  : "Hapus akun guru"
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer Tab 2 menggunakan Template Standar */}
          <TablePagination
            currentPage={safePageGuru}
            pageSize={pageSizeGuru}
            totalItems={totalGuru}
            onPageChange={(page) => setCurrentPageGuru(page)}
            onPageSizeChange={(size) => {
              setPageSizeGuru(size as 10 | 20 | 30);
              setCurrentPageGuru(1);
            }}
            label="akun pendidik"
            pageSizeOptions={[10, 20, 30]}
          />
        </div>
      )}

      {/* Modal Tambah Guru */}
      {isAddGuruOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Tambah Akun Guru Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddGuruOpen(false)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            {guruFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                ⚠️ {guruFormError}
              </div>
            )}

            <form onSubmit={handleCreateGuru} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap Guru & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guruName}
                  onChange={(e) => {
                    setGuruName(e.target.value);
                    setGuruTouched((p) => ({ ...p, name: true }));
                  }}
                  onBlur={() => setGuruTouched((p) => ({ ...p, name: true }))}
                  placeholder="Contoh: Budi Santoso, S.Pd."
                  className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 focus:outline-none transition ${
                    getGuruNameError(guruName)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                  }`}
                />
                {getGuruNameError(guruName) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getGuruNameError(guruName)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Email Akun Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guruEmail}
                  onChange={(e) => {
                    setGuruEmail(e.target.value);
                    setGuruTouched((p) => ({ ...p, email: true }));
                  }}
                  onBlur={() => setGuruTouched((p) => ({ ...p, email: true }))}
                  placeholder="guru@sekolah.sch.id"
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none transition ${
                    getGuruEmailError(guruEmail)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                  }`}
                />
                {getGuruEmailError(guruEmail) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getGuruEmailError(guruEmail)}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Password Awal
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGuruPassword(!showGuruPassword)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800"
                  >
                    {showGuruPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
                <input
                  type={showGuruPassword ? "text" : "password"}
                  value={guruPassword}
                  onChange={(e) => {
                    setGuruPassword(e.target.value);
                    setGuruTouched((p) => ({ ...p, password: true }));
                  }}
                  onBlur={() => setGuruTouched((p) => ({ ...p, password: true }))}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none transition ${
                    getGuruPasswordError(guruPassword)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                  }`}
                />
                {getGuruPasswordError(guruPassword) ? (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getGuruPasswordError(guruPassword)}
                  </p>
                ) : (
                  <span className="block text-[11px] text-zinc-600 mt-1">
                    Default: password123 (Minimal 6 karakter)
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddGuruOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition cursor-pointer active:scale-95"
                >
                  {isPending ? "Menyimpan..." : "Simpan Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Plotting Penugasan Mengajar (Pengampu) */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Plotting Penugasan Guru Mengajar
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignOpen(false)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignPengampu} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Pilih Guru Pengampu <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignGuruId}
                  onChange={(e) => setAssignGuruId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                >
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Pilih Rombel Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={assignKelasId}
                    onChange={(e) => setAssignKelasId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama} (Tk. {k.tingkat})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={assignMapelId}
                    onChange={(e) => setAssignMapelId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} ({m.kode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Berlaku Pada Semester Berapa? <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignSemester}
                  onChange={(e) => setAssignSemester(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                >
                  <option value={0}>Semua Semester (Ganjil & Genap) — Rekomendasi Mapel Umum</option>
                  <option value={1}>Hanya Semester 1 (Ganjil Saja)</option>
                  <option value={2}>Hanya Semester 2 (Genap Saja)</option>
                </select>
                <span className="block text-[11px] text-zinc-600 mt-1">
                  Jika memilih "Hanya Semester Genap", mapel ini hanya akan tampil di lembar nilai dan rapor semester genap kelas tersebut.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition"
                >
                  {isPending ? "Menyimpan..." : "Tetapkan Penugasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pendidik & Penugasan Wali Kelas */}
      {isEditGuruOpen && editingGuru && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-poppins">
                  Edit Pendidik & Atur Wali Kelas
                </h3>
                <p className="text-xs text-zinc-500">
                  Perbarui identitas akun dan rombel binaan wali kelas untuk {editingGuru.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditGuruOpen(false)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            {editGuruFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                ⚠️ {editGuruFormError}
              </div>
            )}

            <form onSubmit={handleUpdateGuru} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editGuruName}
                  onChange={(e) => {
                    setEditGuruName(e.target.value);
                    setEditGuruTouched((p) => ({ ...p, name: true }));
                  }}
                  onBlur={() => setEditGuruTouched((p) => ({ ...p, name: true }))}
                  className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 focus:outline-none transition ${
                    getEditGuruNameError(editGuruName)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                  }`}
                />
                {getEditGuruNameError(editGuruName) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getEditGuruNameError(editGuruName)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Email Akun Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editGuruEmail}
                  onChange={(e) => {
                    setEditGuruEmail(e.target.value);
                    setEditGuruTouched((p) => ({ ...p, email: true }));
                  }}
                  onBlur={() => setEditGuruTouched((p) => ({ ...p, email: true }))}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none transition ${
                    getEditGuruEmailError(editGuruEmail)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                  }`}
                />
                {getEditGuruEmailError(editGuruEmail) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getEditGuruEmailError(editGuruEmail)}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Password Baru (Kosongkan jika tidak ingin mengubah)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEditGuruPassword(!showEditGuruPassword)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800"
                  >
                    {showEditGuruPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
                <input
                  type={showEditGuruPassword ? "text" : "password"}
                  value={editGuruPassword}
                  onChange={(e) => {
                    setEditGuruPassword(e.target.value);
                    setEditGuruTouched((p) => ({ ...p, password: true }));
                  }}
                  onBlur={() => setEditGuruTouched((p) => ({ ...p, password: true }))}
                  placeholder="Ketik password baru jika ingin mereset..."
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none transition ${
                    getEditGuruPasswordError(editGuruPassword)
                      ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200"
                      : "border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                  }`}
                />
                {getEditGuruPasswordError(editGuruPassword) && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {getEditGuruPasswordError(editGuruPassword)}
                  </p>
                )}
              </div>

              {/* PENGATURAN STATUS KEAKTIFAN AKUN */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-zinc-900">
                  Status Kepegawaian / Akun
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="guruStatus"
                      checked={editGuruIsActive === true}
                      onChange={() => setEditGuruIsActive(true)}
                      className="text-[#1b4332] focus:ring-[#1b4332]"
                    />
                    <span className="font-semibold text-emerald-800">🟢 Aktif</span>
                    <span className="text-zinc-500 text-[11px]">(Bisa login & mengajar)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="guruStatus"
                      checked={editGuruIsActive === false}
                      onChange={() => setEditGuruIsActive(false)}
                      className="text-zinc-600 focus:ring-zinc-500"
                    />
                    <span className="font-semibold text-zinc-600">⚪ Nonaktif</span>
                    <span className="text-zinc-500 text-[11px]">(Cuti / Pensiun / Pindah)</span>
                  </label>
                </div>
                {!editGuruIsActive && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                    ⚠️ Jika dinonaktifkan, akun tidak dapat login dan penugasan wali kelasnya otomatis dibebaskan agar bisa digantikan oleh guru lain. Histori nilai masa lalu tetap tersimpan aman.
                  </p>
                )}
              </div>

              {/* PENGATURAN STATUS / ROLE WALI KELAS */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-zinc-900">
                  🏫 Penugasan Sebagai Wali Kelas (Rombel Binaan)
                </label>
                <select
                  value={editGuruKelasWaliId}
                  onChange={(e) => setEditGuruKelasWaliId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-zinc-900 font-medium focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                >
                  <option value="NONE">
                    — Bukan Wali Kelas (Guru Mapel Murni) —
                  </option>
                  {kelasList.map((k) => {
                    const isCurrent = k.waliKelasId === editingGuru.id;
                    const isOccupiedByOther = Boolean(k.waliKelasId && !isCurrent);

                    return (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama} (Tk. {k.tingkat})
                        {isCurrent
                          ? " • [Rombel Binaan Saat Ini]"
                          : isOccupiedByOther
                          ? ` • [⚠️ Wali Kelas Saat Ini: ${k.waliKelasNama || "Guru lain"}]`
                          : " • [Tersedia / Belum Ada Wali]"}
                      </option>
                    );
                  })}
                </select>

                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  {editGuruKelasWaliId === "NONE" ? (
                    <span>
                      Guru ini akan berperan sebagai <strong>Guru Mapel Murni</strong> dan tidak memiliki hak akses khusus pengisian rapor pelengkap atau cetak rapor kelas.
                    </span>
                  ) : (
                    <span>
                      Guru ini akan memiliki peran <strong>Wali Kelas</strong> serta hak akses input presensi, catatan karakter, ekstrakurikuler, import nilai Excel rombel, dan cetak rapor. Jika kelas tersebut sebelumnya dipegang guru lain, peran wali kelas akan dialihkan secara otomatis.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditGuruOpen(false)}
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

      {/* Modal Edit Penugasan Pengampu */}
      {isEditPengampuOpen && editingPengampu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-poppins">
                  Ubah Jadwal Pengampu Mengajar
                </h3>
                <p className="text-xs text-zinc-500">
                  {editingPengampu.mapel.nama} • Kelas {editingPengampu.kelas.nama}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPengampuOpen(false)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePengampu} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Guru Pengampu <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editPengampuGuruId}
                  onChange={(e) => setEditPengampuGuruId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                >
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.email})
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] text-zinc-500 mt-1">
                  Bisa dialihkan ke guru lain jika terjadi pergantian pengampu mata pelajaran ini.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Rombel Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={editPengampuKelasId}
                    onChange={(e) => setEditPengampuKelasId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama} (Tk. {k.tingkat})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={editPengampuMapelId}
                    onChange={(e) => setEditPengampuMapelId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} ({m.kode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Berlaku Pada Semester Berapa? <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editPengampuSemester}
                  onChange={(e) => setEditPengampuSemester(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                >
                  <option value={0}>Semua Semester (Ganjil & Genap) — Rekomendasi Mapel Umum</option>
                  <option value={1}>Hanya Semester 1 (Ganjil Saja)</option>
                  <option value={2}>Hanya Semester 2 (Genap Saja)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditPengampuOpen(false)}
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

      {/* Confirmation Modal (In-App Dialog menggantikan confirm browser) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  confirmModal.confirmColor === "emerald"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                <AlertCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Konfirmasi Tindakan
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-600 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  const onConfirm = confirmModal.onConfirm;
                  setConfirmModal((p) => ({ ...p, isOpen: false }));
                  onConfirm();
                }}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
                  confirmModal.confirmColor === "emerald"
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isPending ? "Memproses..." : confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
