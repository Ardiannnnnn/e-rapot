"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { createKelasAction, updateKelasAction, deleteKelasAction } from "@/actions/kelas";

export interface KelasItem {
  id: string;
  nama: string;
  tingkat: number;
  tahunAjaran: string;
  totalSiswa: number;
  totalMapel: number;
  waliKelas: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface GuruOption {
  id: string;
  name: string;
  email: string;
  kelasWali?: {
    id: string;
    nama: string;
  } | null;
}

export interface MapelOption {
  id: string;
  kode: string;
  nama: string;
  isMulok?: boolean;
}

export interface ExistingPengampuItem {
  kelasId: string;
  mapelId: string;
  guruId: string;
  semester?: number;
}

interface FormKelasProps {
  kelasList: KelasItem[];
  guruOptions: GuruOption[];
  mapelOptions?: MapelOption[];
  existingPengampuList?: ExistingPengampuItem[];
  tahunAjaranAktif: string;
}

function SearchableGuruSelect({
  value,
  onChange,
  guruOptions,
  currentKelasId,
  placeholder = "-- Cari & Pilih Guru Wali Kelas (Opsional) --",
}: {
  value: string;
  onChange: (guruId: string) => void;
  guruOptions: GuruOption[];
  currentKelasId?: string;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedGuru = guruOptions.find((g) => g.id === value);

  // Filter guru berdasarkan kata kunci pencarian
  const filteredGurus = guruOptions.filter((g) => {
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
  });

  // Hitung jumlah yang tersedia vs sudah ditugaskan
  const availableCount = filteredGurus.filter(
    (g) => !g.kelasWali || (currentKelasId && g.kelasWali.id === currentKelasId)
  ).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Pemicu Dropdown */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs cursor-pointer hover:border-stone-400 focus-within:border-[#1b4332] focus-within:ring-1 focus-within:ring-[#1b4332] transition shadow-2xs"
      >
        {selectedGuru ? (
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-zinc-900">{selectedGuru.name}</span>
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
              ({selectedGuru.email})
            </span>
            {selectedGuru.kelasWali && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Wali Kelas {selectedGuru.kelasWali.nama}
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-400">{placeholder}</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedGuru && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-zinc-400 hover:text-rose-600 p-0.5 rounded text-xs"
              title="Kosongkan Wali Kelas"
            >
              ✕
            </button>
          )}
          <span className="text-zinc-400 text-[10px]">▼</span>
        </div>
      </div>

      {/* Popover Dropdown dengan Fitur Search */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Input Pencarian */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/80">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="🔍 Ketik nama atau email guru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 px-1">
              <span>{filteredGurus.length} guru ditemukan</span>
              <span className="text-emerald-700 font-semibold">{availableCount} guru tersedia</span>
            </div>
          </div>

          {/* List Guru */}
          <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 text-xs">
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="px-3 py-2.5 hover:bg-stone-50 cursor-pointer text-zinc-500 italic flex items-center justify-between transition"
            >
              <span>-- Jangan Tentukan Wali Kelas Dulu (Kosongkan) --</span>
              {value === "" && <span className="text-[#1b4332] font-bold">✓</span>}
            </div>

            {filteredGurus.length === 0 ? (
              <div className="px-3 py-6 text-center text-zinc-400 text-xs">
                Tidak ada akun guru yang cocok dengan "{search}"
              </div>
            ) : (
              filteredGurus.map((g) => {
                const isWaliElsewhere =
                  g.kelasWali && (!currentKelasId || g.kelasWali.id !== currentKelasId);
                const isSelected = g.id === value;

                return (
                  <div
                    key={g.id}
                    onClick={() => {
                      if (isWaliElsewhere) return;
                      onChange(g.id);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2.5 flex items-center justify-between transition ${
                      isWaliElsewhere
                        ? "bg-stone-50/60 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-emerald-50 text-emerald-950 font-semibold cursor-pointer"
                        : "hover:bg-emerald-50/40 cursor-pointer"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900">{g.name}</span>
                        {isWaliElsewhere ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                            <span>🔒</span>
                            <span>Sudah Wali Kelas {g.kelasWali?.nama}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                            <span>🟢</span>
                            <span>Tersedia</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{g.email}</div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="text-[#1b4332] font-bold text-sm">✓</span>
                      ) : isWaliElsewhere ? (
                        <span className="text-[10px] text-zinc-400 italic">Tidak tersedia</span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormKelas({
  kelasList,
  guruOptions,
  mapelOptions = [],
  existingPengampuList = [],
  tahunAjaranAktif,
}: FormKelasProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    type: "success" | "warning" | "error";
    title: string;
    message: string;
    details?: string[];
    solution?: string;
    actionText?: string;
  } | null>(null);

  const [selectedTingkat, setSelectedTingkat] = useState<number | "ALL">("ALL");

  // Helper untuk mengecek mata pelajaran khusus (Agama / PAI / PJOK / Penjas)
  const isSpecialMapel = (m: { nama: string; kode: string }) => {
    const lower = (m.nama + " " + m.kode).toLowerCase();
    return (
      lower.includes("agama") ||
      lower.includes("islam") ||
      lower.includes("kristen") ||
      lower.includes("katolik") ||
      lower.includes("hindu") ||
      lower.includes("buddha") ||
      lower.includes("pai") ||
      lower.includes("pjok") ||
      lower.includes("penjas") ||
      lower.includes("olahraga")
    );
  };

  // Modal Tambah Kelas
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [tingkat, setTingkat] = useState(1);
  const [waliKelasId, setWaliKelasId] = useState("");
  const [isWaliKecualiPJOK, setIsWaliKecualiPJOK] = useState(false);
  const [isSemuaKeWali, setIsSemuaKeWali] = useState(false);

  // State Plotting Mapel Sekaligus
  const [selectedMapels, setSelectedMapels] = useState<
    Record<string, { selected: boolean; guruId: string; semester: number }>
  >({});
  const [copySourceKelasId, setCopySourceKelasId] = useState<string>("");

  // Modal Edit Kelas
  const [editingKelas, setEditingKelas] = useState<KelasItem | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editTingkat, setEditTingkat] = useState(1);
  const [editWaliKelasId, setEditWaliKelasId] = useState("");
  const [editIsWaliKecualiPJOK, setEditIsWaliKecualiPJOK] = useState(false);
  const [editIsSemuaKeWali, setEditIsSemuaKeWali] = useState(false);

  const filteredKelas =
    selectedTingkat === "ALL"
      ? kelasList
      : kelasList.filter((k) => k.tingkat === selectedTingkat);

  // Inisialisasi form Tambah Kelas
  const handleOpenAddModal = () => {
    setNama("");
    setTingkat(selectedTingkat === "ALL" ? 1 : selectedTingkat);
    setWaliKelasId("");
    setCopySourceKelasId("");
    setIsWaliKecualiPJOK(false);
    setIsSemuaKeWali(false);

    // Mulai dengan unchecked agar pengguna sengaja mencentang atau klik tombol pintas
    const initial: Record<string, { selected: boolean; guruId: string; semester: number }> = {};
    mapelOptions.forEach((m) => {
      initial[m.id] = { selected: false, guruId: "", semester: 0 };
    });
    setSelectedMapels(initial);
    setIsAddOpen(true);
  };

  const handleToggleMapel = (mapelId: string) => {
    setSelectedMapels((prev) => {
      const current = prev[mapelId];
      const nextSelected = !current?.selected;
      return {
        ...prev,
        [mapelId]: {
          selected: nextSelected,
          // Jangan paksa waliKelasId secara otomatis saat centang mapel
          guruId: current?.guruId || "",
          semester: current?.semester ?? 0,
        },
      };
    });
  };

  const handleGuruChangeForMapel = (mapelId: string, guruId: string) => {
    setSelectedMapels((prev) => ({
      ...prev,
      [mapelId]: {
        selected: true,
        guruId,
        semester: prev[mapelId]?.semester ?? 0,
      },
    }));
  };

  const handleSemesterChangeForMapel = (mapelId: string, semester: number) => {
    setSelectedMapels((prev) => ({
      ...prev,
      [mapelId]: {
        selected: prev[mapelId]?.selected ?? true,
        guruId: prev[mapelId]?.guruId || "",
        semester,
      },
    }));
  };

  const handleSelectAll = (select: boolean) => {
    const updated: Record<string, { selected: boolean; guruId: string; semester: number }> = {};
    mapelOptions.forEach((m) => {
      updated[m.id] = {
        selected: select,
        // Jangan timpa guruId yang sudah ada, dan jangan paksa waliKelasId otomatis
        guruId: select ? (selectedMapels[m.id]?.guruId || "") : "",
        semester: selectedMapels[m.id]?.semester ?? 0,
      };
    });
    setSelectedMapels(updated);
    if (!select) {
      setIsWaliKecualiPJOK(false);
      setIsSemuaKeWali(false);
    }
  };

  // Checkbox aksi: Wali Kelas = Guru Kelas (Kecuali PAI & PJOK)
  const handleToggleWaliKecualiPJOK = (checked: boolean) => {
    if (checked && !waliKelasId) {
      setFeedbackModal({
        type: "warning",
        title: "Wali Kelas Belum Dipilih",
        message: "Silakan pilih Guru Wali Kelas terlebih dahulu pada formulir di atas.",
        solution: "Pilih nama guru wali kelas terlebih dahulu, lalu centang kembali opsi ini.",
        actionText: "Mengerti",
      });
      return;
    }

    setIsWaliKecualiPJOK(checked);
    if (checked) {
      setIsSemuaKeWali(false);
      setSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          if (!isSpecialMapel(m)) {
            updated[m.id] = {
              selected: true,
              guruId: waliKelasId,
              semester: updated[m.id]?.semester ?? 0,
            };
          }
        });
        return updated;
      });
    } else {
      // Uncheck: kembalikan pengampu yang diisi waliKelasId ke default kosong
      setSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          if (!isSpecialMapel(m) && updated[m.id]?.guruId === waliKelasId) {
            updated[m.id] = {
              ...updated[m.id],
              guruId: "",
            };
          }
        });
        return updated;
      });
    }
  };

  // Checkbox aksi: Semua ke Wali Kelas
  const handleToggleSemuaKeWali = (checked: boolean) => {
    if (checked && !waliKelasId) {
      setFeedbackModal({
        type: "warning",
        title: "Wali Kelas Belum Dipilih",
        message: "Silakan pilih Guru Wali Kelas terlebih dahulu pada formulir di atas.",
        solution: "Pilih nama guru wali kelas terlebih dahulu, lalu centang kembali opsi ini.",
        actionText: "Mengerti",
      });
      return;
    }

    setIsSemuaKeWali(checked);
    if (checked) {
      setIsWaliKecualiPJOK(false);
      setSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          updated[m.id] = {
            selected: true,
            guruId: waliKelasId,
            semester: updated[m.id]?.semester ?? 0,
          };
        });
        return updated;
      });
    } else {
      // Uncheck: kembalikan semua yang diisi waliKelasId ke default kosong
      setSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          if (updated[m.id]?.guruId === waliKelasId) {
            updated[m.id] = {
              ...updated[m.id],
              guruId: "",
            };
          }
        });
        return updated;
      });
    }
  };

  const handleCopyFromRombel = (srcKelasId: string) => {
    setCopySourceKelasId(srcKelasId);
    if (!srcKelasId) return;

    const sourcePengampu = existingPengampuList.filter((p) => p.kelasId === srcKelasId);
    const updated: Record<string, { selected: boolean; guruId: string; semester: number }> = {};

    mapelOptions.forEach((m) => {
      const match = sourcePengampu.find((p) => p.mapelId === m.id);
      if (match) {
        updated[m.id] = {
          selected: true,
          guruId: match.guruId,
          semester: match.semester ?? 0,
        };
      } else {
        updated[m.id] = {
          selected: false,
          guruId: "",
          semester: 0,
        };
      }
    });
    setSelectedMapels(updated);
  };

  const totalMapelChecked = Object.values(selectedMapels).filter((v) => v.selected).length;
  const totalMapelWithGuru = Object.values(selectedMapels).filter(
    (v) => v.selected && v.guruId
  ).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validasi: jika ada mapel yang dicentang tapi belum ada guru
    const checkedWithoutGuru = Object.entries(selectedMapels).filter(
      ([_, val]) => val.selected && !val.guruId
    );
    if (checkedWithoutGuru.length > 0) {
      const missingNames = checkedWithoutGuru
        .map(([id]) => mapelOptions.find((m) => m.id === id)?.nama)
        .filter(Boolean) as string[];

      setFeedbackModal({
        type: "warning",
        title: "Guru Pengampu Belum Lengkap",
        message: `Terdapat ${checkedWithoutGuru.length} mata pelajaran yang dicentang namun belum ditentukan guru pengampunya.`,
        details: missingNames.slice(0, 5).concat(
          missingNames.length > 5 ? [`...dan ${missingNames.length - 5} mapel lainnya`] : []
        ),
        solution:
          "Silakan tentukan guru pengampu pada setiap baris mapel yang dicentang, atau hilangkan tanda centang jika mapel tersebut tidak diajarkan.",
        actionText: "Kembali & Lengkapi Guru",
      });
      return;
    }

    const mapelPengampuPayload = Object.entries(selectedMapels)
      .filter(([_, val]) => val.selected && val.guruId)
      .map(([mapelId, val]) => ({
        mapelId,
        guruId: val.guruId,
        semester: val.semester || 0,
      }));

    startTransition(async () => {
      const res = await createKelasAction({
        nama,
        tingkat,
        tahunAjaran: tahunAjaranAktif,
        waliKelasId: waliKelasId || undefined,
        mapelPengampu: mapelPengampuPayload,
      });

      if (res.success) {
        setNama("");
        setWaliKelasId("");
        setIsAddOpen(false);
        setFeedbackModal({
          type: "success",
          title: "Berhasil Menambahkan Rombel!",
          message: res.message,
          actionText: "Selesai",
        });
      } else {
        setFeedbackModal({
          type: "error",
          title: "Gagal Menambahkan Rombel",
          message: res.message,
          solution: "Silakan periksa kembali formulir atau pastikan nama rombel belum terdaftar.",
          actionText: "Periksa Kembali",
        });
      }
    });
  };

  // State & Handlers Plotting Mapel di Modal Edit Kelas
  const [editSelectedMapels, setEditSelectedMapels] = useState<
    Record<string, { selected: boolean; guruId: string; semester: number }>
  >({});
  const [editCopySourceKelasId, setEditCopySourceKelasId] = useState<string>("");

  const handleOpenEditModal = (k: KelasItem) => {
    setEditingKelas(k);
    setEditNama(k.nama);
    setEditTingkat(k.tingkat);
    setEditWaliKelasId(k.waliKelas?.id || "");
    setEditCopySourceKelasId("");
    setEditIsWaliKecualiPJOK(false);
    setEditIsSemuaKeWali(false);

    // Load existing pengampu untuk rombel ini
    const currentAssignments = existingPengampuList.filter((p) => p.kelasId === k.id);
    const initial: Record<string, { selected: boolean; guruId: string; semester: number }> = {};
    mapelOptions.forEach((m) => {
      const match = currentAssignments.find((a) => a.mapelId === m.id);
      if (match) {
        initial[m.id] = {
          selected: true,
          guruId: match.guruId,
          semester: match.semester ?? 0,
        };
      } else {
        initial[m.id] = {
          selected: false,
          guruId: "",
          semester: 0,
        };
      }
    });
    setEditSelectedMapels(initial);
  };

  const handleEditToggleMapel = (mapelId: string) => {
    setEditSelectedMapels((prev) => {
      const current = prev[mapelId];
      const nextSelected = !current?.selected;
      return {
        ...prev,
        [mapelId]: {
          selected: nextSelected,
          // Jangan paksa wali kelas otomatis
          guruId: current?.guruId || "",
          semester: current?.semester ?? 0,
        },
      };
    });
  };

  const handleEditGuruChangeForMapel = (mapelId: string, guruId: string) => {
    setEditSelectedMapels((prev) => ({
      ...prev,
      [mapelId]: {
        selected: true,
        guruId,
        semester: prev[mapelId]?.semester ?? 0,
      },
    }));
  };

  const handleEditSemesterChangeForMapel = (mapelId: string, semester: number) => {
    setEditSelectedMapels((prev) => ({
      ...prev,
      [mapelId]: {
        selected: prev[mapelId]?.selected ?? true,
        guruId: prev[mapelId]?.guruId || "",
        semester,
      },
    }));
  };

  const handleEditSelectAll = (select: boolean) => {
    const updated: Record<string, { selected: boolean; guruId: string; semester: number }> = {};
    mapelOptions.forEach((m) => {
      updated[m.id] = {
        selected: select,
        // Jangan timpa guruId yang sudah ada, dan jangan paksa wali kelas otomatis
        guruId: select ? (editSelectedMapels[m.id]?.guruId || "") : "",
        semester: editSelectedMapels[m.id]?.semester ?? 0,
      };
    });
    setEditSelectedMapels(updated);
    if (!select) {
      setEditIsWaliKecualiPJOK(false);
      setEditIsSemuaKeWali(false);
    }
  };

  // Checkbox aksi: Edit Wali Kelas = Guru Kelas (Kecuali PAI & PJOK)
  const handleEditToggleWaliKecualiPJOK = (checked: boolean) => {
    if (checked && !editWaliKelasId) {
      setFeedbackModal({
        type: "warning",
        title: "Wali Kelas Belum Dipilih",
        message: "Silakan pilih Guru Wali Kelas terlebih dahulu pada kolom formulir di atas.",
        solution: "Pilih nama guru wali kelas terlebih dahulu, lalu centang kembali opsi ini.",
        actionText: "Mengerti",
      });
      return;
    }

    setEditIsWaliKecualiPJOK(checked);
    if (checked) {
      setEditIsSemuaKeWali(false);
      setEditSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          if (!isSpecialMapel(m)) {
            updated[m.id] = {
              selected: true,
              guruId: editWaliKelasId,
              semester: updated[m.id]?.semester ?? 0,
            };
          }
        });
        return updated;
      });
    } else {
      // Uncheck: kembalikan mapel yang terisi editWaliKelasId ke default kosong
      setEditSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          if (!isSpecialMapel(m) && updated[m.id]?.guruId === editWaliKelasId) {
            updated[m.id] = {
              ...updated[m.id],
              guruId: "",
            };
          }
        });
        return updated;
      });
    }
  };

  // Checkbox aksi: Edit Semua ke Wali Kelas
  const handleEditToggleSemuaKeWali = (checked: boolean) => {
    if (checked && !editWaliKelasId) {
      setFeedbackModal({
        type: "warning",
        title: "Wali Kelas Belum Dipilih",
        message: "Silakan pilih Guru Wali Kelas terlebih dahulu pada kolom formulir di atas.",
        solution: "Pilih nama guru wali kelas terlebih dahulu, lalu centang kembali opsi ini.",
        actionText: "Mengerti",
      });
      return;
    }

    setEditIsSemuaKeWali(checked);
    if (checked) {
      setEditIsWaliKecualiPJOK(false);
      setEditSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          updated[m.id] = {
            selected: true,
            guruId: editWaliKelasId,
            semester: updated[m.id]?.semester ?? 0,
          };
        });
        return updated;
      });
    } else {
      // Uncheck: kembalikan semua yang terisi editWaliKelasId ke default kosong
      setEditSelectedMapels((prev) => {
        const updated = { ...prev };
        mapelOptions.forEach((m) => {
          if (updated[m.id]?.guruId === editWaliKelasId) {
            updated[m.id] = {
              ...updated[m.id],
              guruId: "",
            };
          }
        });
        return updated;
      });
    }
  };

  const handleEditCopyFromRombel = (srcKelasId: string) => {
    setEditCopySourceKelasId(srcKelasId);
    if (!srcKelasId) return;

    const sourcePengampu = existingPengampuList.filter((p) => p.kelasId === srcKelasId);
    const updated: Record<string, { selected: boolean; guruId: string; semester: number }> = {};

    mapelOptions.forEach((m) => {
      const match = sourcePengampu.find((p) => p.mapelId === m.id);
      if (match) {
        updated[m.id] = {
          selected: true,
          guruId: match.guruId,
          semester: match.semester ?? 0,
        };
      } else {
        updated[m.id] = {
          selected: false,
          guruId: "",
          semester: 0,
        };
      }
    });
    setEditSelectedMapels(updated);
  };

  const totalEditMapelChecked = Object.values(editSelectedMapels).filter(
    (v) => v.selected
  ).length;
  const totalEditMapelWithGuru = Object.values(editSelectedMapels).filter(
    (v) => v.selected && v.guruId
  ).length;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelas) return;
    setMessage(null);

    // Validasi: jika ada mapel yang dicentang tapi belum ada guru
    const checkedWithoutGuru = Object.entries(editSelectedMapels).filter(
      ([_, val]) => val.selected && !val.guruId
    );
    if (checkedWithoutGuru.length > 0) {
      const missingNames = checkedWithoutGuru
        .map(([id]) => mapelOptions.find((m) => m.id === id)?.nama)
        .filter(Boolean) as string[];

      setFeedbackModal({
        type: "warning",
        title: "Guru Pengampu Belum Lengkap",
        message: `Terdapat ${checkedWithoutGuru.length} mata pelajaran yang dicentang namun belum ditentukan guru pengampunya.`,
        details: missingNames.slice(0, 5).concat(
          missingNames.length > 5 ? [`...dan ${missingNames.length - 5} mapel lainnya`] : []
        ),
        solution:
          "Silakan tentukan guru pengampu untuk setiap mata pelajaran yang dicentang, atau hilangkan tanda centang jika mapel tersebut tidak diajarkan.",
        actionText: "Kembali & Lengkapi Guru",
      });
      return;
    }

    const mapelPengampuPayload = Object.entries(editSelectedMapels)
      .filter(([_, val]) => val.selected && val.guruId)
      .map(([mapelId, val]) => ({
        mapelId,
        guruId: val.guruId,
        semester: val.semester || 0,
      }));

    startTransition(async () => {
      const res = await updateKelasAction({
        id: editingKelas.id,
        nama: editNama,
        tingkat: editTingkat,
        waliKelasId: editWaliKelasId || null,
        mapelPengampu: mapelPengampuPayload,
      });

      if (res.success) {
        setEditingKelas(null);
        setFeedbackModal({
          type: "success",
          title: "Perubahan Berhasil Disimpan!",
          message: res.message,
          actionText: "Selesai",
        });
      } else {
        setFeedbackModal({
          type: "error",
          title: "Gagal Menyimpan Perubahan",
          message: res.message,
          solution: "Silakan periksa kembali konfigurasi rombel dan pengampu mata pelajaran.",
          actionText: "Periksa Kembali",
        });
      }
    });
  };

  const handleDelete = (id: string, namaKelas: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Rombel '${namaKelas}'?`)) return;
    setMessage(null);

    startTransition(async () => {
      const res = await deleteKelasAction(id);
      if (res.success) {
        setFeedbackModal({
          type: "success",
          title: "Rombel Berhasil Dihapus",
          message: res.message,
          actionText: "Selesai",
        });
      } else {
        setFeedbackModal({
          type: "error",
          title: "Gagal Menghapus Rombel",
          message: res.message,
          solution: "Pastikan data siswa atau nilai yang terhubung sudah disesuaikan terlebih dahulu.",
          actionText: "Tutup",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Tingkat & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tingkat 1 s/d 6 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTingkat("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              selectedTingkat === "ALL"
                ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs"
                : "bg-white text-zinc-700 border-stone-200 hover:bg-stone-50"
            }`}
          >
            Semua Tingkat ({kelasList.length})
          </button>
          {[1, 2, 3, 4, 5, 6].map((lvl) => {
            const count = kelasList.filter((k) => k.tingkat === lvl).length;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedTingkat(lvl)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  selectedTingkat === lvl
                    ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs"
                    : "bg-white text-zinc-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                Tingkat {lvl} ({count})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>Tambah Rombel Kelas</span>
        </button>
      </div>

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

      {/* Grid Kartu Rombel Kelas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKelas.map((k) => (
          <div
            key={k.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-[#1b4332]/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Tingkat {k.tingkat}
                  </span>
                  <h3 className="text-2xl font-bold text-zinc-900 font-poppins mt-2">
                    Kelas {k.nama}
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-600 bg-stone-100 px-2 py-1 rounded-lg">
                  T.A. {k.tahunAjaran}
                </span>
              </div>

              {/* Status Wali Kelas */}
              <div className="mt-4 pt-3 border-t border-stone-100">
                <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider block mb-1 font-mono">
                  Wali Kelas:
                </span>
                {k.waliKelas ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                      {k.waliKelas.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 text-xs truncate">
                        {k.waliKelas.name}
                      </p>
                      <p className="text-[10px] text-zinc-600 truncate">{k.waliKelas.email}</p>
                    </div>
                  </div>
                ) : (
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    ⚠️ Belum Ada Wali Kelas
                  </span>
                )}
              </div>
            </div>

            {/* Statistik Siswa & Aksi */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div className="text-xs text-zinc-600 font-mono">
                <strong className="text-zinc-900 font-bold text-sm">{k.totalSiswa}</strong> Siswa
                <span className="text-zinc-600 mx-1.5">•</span>
                <span>{k.totalMapel} Mapel</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(k)}
                  className="p-1.5 rounded-lg border border-stone-200 text-zinc-600 hover:text-zinc-900 hover:bg-stone-50 transition text-xs"
                  title="Edit rombel & penugasan mapel"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(k.id, k.nama)}
                  disabled={isPending}
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition text-xs"
                  title="Hapus rombel"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Kelas & Plotting Mapel Sekaligus */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3.5 shrink-0">
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-poppins">
                  Tambah Rombongan Belajar & Plotting Mapel
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Buat rombel baru sekaligus tentukan mata pelajaran dan guru pengampunya dalam satu langkah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 h-8 w-8 rounded-lg hover:bg-stone-100 flex items-center justify-center font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* Bagian 1: Identitas Rombel */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono flex items-center gap-2">
                  <span>1. Identitas Rombel & Wali Kelas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Nama Rombel (Contoh: 1A, 2B, 7C) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value.toUpperCase())}
                      placeholder="Contoh: 1C"
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Tingkat Kelas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={tingkat}
                      onChange={(e) => setTingkat(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Tingkat {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Penetapan Guru Wali Kelas
                  </label>
                  <SearchableGuruSelect
                    value={waliKelasId}
                    onChange={(id) => setWaliKelasId(id)}
                    guruOptions={guruOptions}
                    placeholder="-- Cari & Pilih Guru Wali Kelas (Opsional) --"
                  />
                  <span className="block text-[11px] text-zinc-500 mt-1">
                    Guru yang dipilih otomatis bertindak sebagai Wali Kelas dan dapat langsung di-plot mengajar mapel kelas di bawah.
                  </span>
                </div>
              </div>

              {/* Bagian 2: Plotting Mata Pelajaran & Guru Pengampu */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-mono">
                      2. Plotting Mata Pelajaran & Pengampu
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      {totalMapelChecked} dari {mapelOptions.length} Mapel
                    </span>
                  </div>

                  {/* Salin dari Rombel lain jika ada */}
                  {kelasList.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-zinc-500 font-medium">📋 Salin dari:</span>
                      <select
                        value={copySourceKelasId}
                        onChange={(e) => handleCopyFromRombel(e.target.value)}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                      >
                        <option value="">Pilih Rombel Lain...</option>
                        {kelasList.map((k) => (
                          <option key={k.id} value={k.id}>
                            Kelas {k.nama} (Tingkat {k.tingkat})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Bar Tombol Pintas / Shortcuts */}
                <div className="flex flex-wrap items-center gap-2.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs">
                  <span className="text-zinc-500 font-semibold flex items-center gap-1">Pintas:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-zinc-700 font-medium transition"
                  >
                    ✓ Centang Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-zinc-700 font-medium transition"
                  >
                    ✕ Hapus Centang
                  </button>

                  <span className="text-zinc-300">|</span>

                  {/* Checkbox Aksi Plotting ke Wali Kelas */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-stone-200 hover:border-emerald-500 select-none transition">
                      <input
                        type="checkbox"
                        checked={isWaliKecualiPJOK}
                        onChange={(e) => handleToggleWaliKecualiPJOK(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                      />
                      <span className="font-medium text-zinc-700">
                        🧑‍🏫 Wali Kelas = Guru Kelas{" "}
                        <span className="text-zinc-400 text-[11px] font-normal">(Kecuali PAI & PJOK)</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-stone-200 hover:border-emerald-500 select-none transition">
                      <input
                        type="checkbox"
                        checked={isSemuaKeWali}
                        onChange={(e) => handleToggleSemuaKeWali(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                      />
                      <span className="font-medium text-zinc-700">
                        Semua ke Wali Kelas
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tabel Checklist Mapel & Pengampu */}
                <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-xs max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-stone-100 border-b border-stone-200 z-10">
                      <tr className="font-mono text-[11px] text-zinc-600 uppercase">
                        <th className="px-3 py-2 w-10 text-center">Pilih</th>
                        <th className="px-3 py-2">Mata Pelajaran</th>
                        <th className="px-3 py-2">Guru Pengampu</th>
                        <th className="px-3 py-2 w-36">Semester</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {mapelOptions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                            Belum ada mata pelajaran terdaftar di sistem.
                          </td>
                        </tr>
                      ) : (
                        mapelOptions.map((m) => {
                          const state = selectedMapels[m.id] || {
                            selected: false,
                            guruId: "",
                            semester: 0,
                          };

                          return (
                            <tr
                              key={m.id}
                              className={`transition-colors ${
                                state.selected ? "bg-emerald-50/40" : "hover:bg-stone-50"
                              }`}
                            >
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={state.selected}
                                  onChange={() => handleToggleMapel(m.id)}
                                  className="h-4 w-4 rounded text-[#1b4332] border-stone-300 focus:ring-[#1b4332] cursor-pointer"
                                />
                              </td>

                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`font-medium ${
                                      state.selected ? "text-zinc-900" : "text-zinc-500"
                                    }`}
                                  >
                                    {m.nama}
                                  </span>
                                  {m.isMulok && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                      Mulok
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-zinc-400">
                                  {m.kode}
                                </span>
                              </td>

                              <td className="px-3 py-2">
                                <select
                                  disabled={!state.selected}
                                  value={state.guruId}
                                  onChange={(e) => handleGuruChangeForMapel(m.id, e.target.value)}
                                  className={`w-full rounded-lg border px-2.5 py-1 text-xs transition ${
                                    !state.selected
                                      ? "bg-stone-100 text-zinc-400 border-stone-200 cursor-not-allowed"
                                      : !state.guruId
                                      ? "bg-amber-50/60 text-amber-900 border-amber-300 font-medium"
                                      : "bg-white text-zinc-900 border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                                  }`}
                                >
                                  <option value="">-- Pilih Guru Pengampu --</option>
                                  {guruOptions.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-2">
                                <select
                                  disabled={!state.selected}
                                  value={state.semester}
                                  onChange={(e) =>
                                    handleSemesterChangeForMapel(m.id, Number(e.target.value))
                                  }
                                  className={`w-full rounded-lg border px-2 py-1 text-xs transition ${
                                    !state.selected
                                      ? "bg-stone-100 text-zinc-400 border-stone-200 cursor-not-allowed"
                                      : "bg-white text-zinc-800 border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                                  }`}
                                >
                                  <option value={0}>Semua (1 & 2)</option>
                                  <option value={1}>Ganjil (1)</option>
                                  <option value={2}>Genap (2)</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                  <span>
                    💡 Terpilih <strong>{totalMapelChecked}</strong> mapel (
                    <strong className="text-emerald-700">{totalMapelWithGuru}</strong> sudah ada
                    guru pengampu).
                  </span>
                  {totalMapelChecked > totalMapelWithGuru && (
                    <span className="text-amber-600 font-medium">
                      ⚠️ {totalMapelChecked - totalMapelWithGuru} mapel belum dipilih gurunya.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition shadow-xs flex items-center gap-2"
                >
                  {isPending && <span className="animate-spin">⏳</span>}
                  <span>
                    {isPending
                      ? "Menyimpan..."
                      : totalMapelWithGuru > 0
                      ? `Simpan Rombel & Plot ${totalMapelWithGuru} Mapel`
                      : "Simpan Rombel"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Rombel & Plotting Mapel Pengampu */}
      {editingKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3.5 shrink-0">
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-poppins">
                  Edit Rombel & Plotting Mapel • Kelas {editingKelas.nama}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ubah identitas kelas, wali kelas, serta atur mata pelajaran dan guru pengampunya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingKelas(null)}
                className="text-zinc-400 hover:text-zinc-700 h-8 w-8 rounded-lg hover:bg-stone-100 flex items-center justify-center font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* Bagian 1: Identitas Rombel */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 font-mono flex items-center gap-2">
                  <span>1. Identitas Rombel & Wali Kelas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Nama Rombel <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editNama}
                      onChange={(e) => setEditNama(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Tingkat Kelas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editTingkat}
                      onChange={(e) => setEditTingkat(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Tingkat {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Guru Wali Kelas
                  </label>
                  <SearchableGuruSelect
                    value={editWaliKelasId}
                    onChange={(id) => setEditWaliKelasId(id)}
                    guruOptions={guruOptions}
                    currentKelasId={editingKelas.id}
                    placeholder="-- Cari & Pilih Guru Wali Kelas --"
                  />
                  <span className="block text-[11px] text-zinc-500 mt-1">
                    Guru yang dipilih bertindak sebagai Wali Kelas di rombel ini.
                  </span>
                </div>
              </div>

              {/* Bagian 2: Plotting & Edit Mata Pelajaran & Pengampu */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-mono">
                      2. Pengaturan Mata Pelajaran & Guru Pengampu
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      {totalEditMapelChecked} dari {mapelOptions.length} Mapel Terpilih
                    </span>
                  </div>

                  {/* Salin dari Rombel lain jika ada */}
                  {kelasList.filter((k) => k.id !== editingKelas.id).length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-zinc-500 font-medium">📋 Salin dari:</span>
                      <select
                        value={editCopySourceKelasId}
                        onChange={(e) => handleEditCopyFromRombel(e.target.value)}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                      >
                        <option value="">Pilih Rombel Lain...</option>
                        {kelasList
                          .filter((k) => k.id !== editingKelas.id)
                          .map((k) => (
                            <option key={k.id} value={k.id}>
                              Kelas {k.nama} (Tingkat {k.tingkat})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Bar Tombol Pintas / Shortcuts */}
                <div className="flex flex-wrap items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs">
                  <span className="text-zinc-500 font-medium">Pintas Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleEditSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-zinc-700 font-medium transition"
                  >
                    ✓ Centang Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-zinc-700 font-medium transition"
                  >
                    ✕ Hapus Centang
                  </button>

                  <span className="text-zinc-300">|</span>

                  {/* Checkbox Aksi Plotting ke Wali Kelas */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-stone-200 hover:border-emerald-500 select-none transition">
                      <input
                        type="checkbox"
                        checked={editIsWaliKecualiPJOK}
                        onChange={(e) => handleEditToggleWaliKecualiPJOK(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                      />
                      <span className="font-medium text-zinc-700">
                        🧑‍🏫 Wali Kelas = Guru Kelas{" "}
                        <span className="text-zinc-400 text-[11px] font-normal">(Kecuali PAI & PJOK)</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-stone-200 hover:border-emerald-500 select-none transition">
                      <input
                        type="checkbox"
                        checked={editIsSemuaKeWali}
                        onChange={(e) => handleEditToggleSemuaKeWali(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                      />
                      <span className="font-medium text-zinc-700">
                        Semua ke Wali Kelas
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tabel Checklist Mapel & Pengampu */}
                <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-xs max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-stone-100 border-b border-stone-200 z-10">
                      <tr className="font-mono text-[11px] text-zinc-600 uppercase">
                        <th className="px-3 py-2 w-10 text-center">Pilih</th>
                        <th className="px-3 py-2">Mata Pelajaran</th>
                        <th className="px-3 py-2">Guru Pengampu</th>
                        <th className="px-3 py-2 w-36">Semester</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {mapelOptions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                            Belum ada mata pelajaran terdaftar di sistem.
                          </td>
                        </tr>
                      ) : (
                        mapelOptions.map((m) => {
                          const state = editSelectedMapels[m.id] || {
                            selected: false,
                            guruId: "",
                            semester: 0,
                          };

                          return (
                            <tr
                              key={m.id}
                              className={`transition-colors ${
                                state.selected ? "bg-emerald-50/40" : "hover:bg-stone-50"
                              }`}
                            >
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={state.selected}
                                  onChange={() => handleEditToggleMapel(m.id)}
                                  className="h-4 w-4 rounded text-[#1b4332] border-stone-300 focus:ring-[#1b4332] cursor-pointer"
                                />
                              </td>

                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`font-medium ${
                                      state.selected ? "text-zinc-900" : "text-zinc-500"
                                    }`}
                                  >
                                    {m.nama}
                                  </span>
                                  {m.isMulok && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                      Mulok
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-zinc-400">
                                  {m.kode}
                                </span>
                              </td>

                              <td className="px-3 py-2">
                                <select
                                  disabled={!state.selected}
                                  value={state.guruId}
                                  onChange={(e) =>
                                    handleEditGuruChangeForMapel(m.id, e.target.value)
                                  }
                                  className={`w-full rounded-lg border px-2.5 py-1 text-xs transition ${
                                    !state.selected
                                      ? "bg-stone-100 text-zinc-400 border-stone-200 cursor-not-allowed"
                                      : !state.guruId
                                      ? "bg-rose-50/70 text-rose-900 border-rose-300 font-semibold"
                                      : "bg-white text-zinc-900 border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                                  }`}
                                >
                                  <option value="">-- Pilih Guru Pengampu --</option>
                                  {guruOptions.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-3 py-2">
                                <select
                                  disabled={!state.selected}
                                  value={state.semester}
                                  onChange={(e) =>
                                    handleEditSemesterChangeForMapel(m.id, Number(e.target.value))
                                  }
                                  className={`w-full rounded-lg border px-2 py-1 text-xs transition ${
                                    !state.selected
                                      ? "bg-stone-100 text-zinc-400 border-stone-200 cursor-not-allowed"
                                      : "bg-white text-zinc-800 border-stone-200 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                                  }`}
                                >
                                  <option value={0}>Semua (1 & 2)</option>
                                  <option value={1}>Ganjil (1)</option>
                                  <option value={2}>Genap (2)</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                  <span>
                    💡 Terpilih <strong>{totalEditMapelChecked}</strong> mapel (
                    <strong className="text-emerald-700">{totalEditMapelWithGuru}</strong> sudah
                    ada guru pengampu).
                  </span>
                  {totalEditMapelChecked > totalEditMapelWithGuru && (
                    <span className="text-rose-600 font-semibold">
                      ⚠️ {totalEditMapelChecked - totalEditMapelWithGuru} mapel belum dipilih gurunya.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingKelas(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition shadow-xs flex items-center gap-2"
                >
                  {isPending && <span className="animate-spin">⏳</span>}
                  <span>
                    {isPending ? "Menyimpan..." : "Simpan Perubahan Rombel"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal (Success / Warning / Error) */}
      {feedbackModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-stone-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {/* Icon Status */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-inner ${
                feedbackModal.type === "success"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : feedbackModal.type === "warning"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              {feedbackModal.type === "success" && (
                <svg className="w-8 h-8 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {feedbackModal.type === "warning" && (
                <svg className="w-8 h-8 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {feedbackModal.type === "error" && (
                <svg className="w-8 h-8 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            {/* Judul Modal */}
            <h3 className="text-xl font-bold text-zinc-900 font-poppins">
              {feedbackModal.title}
            </h3>

            {/* Pesan Utama */}
            <p className="text-xs sm:text-sm text-zinc-600 mt-2 leading-relaxed">
              {feedbackModal.message}
            </p>

            {/* Daftar Rincian Mapel Bermasalah (jika ada) */}
            {feedbackModal.details && feedbackModal.details.length > 0 && (
              <div className="w-full mt-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-left">
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider block mb-1.5">
                  Mata Pelajaran Terkait:
                </span>
                <ul className="text-xs text-zinc-700 space-y-1">
                  {feedbackModal.details.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Saran / Solusi */}
            {feedbackModal.solution && (
              <div
                className={`w-full mt-3 p-3 rounded-xl text-left text-xs leading-relaxed ${
                  feedbackModal.type === "warning"
                    ? "bg-amber-50 text-amber-900 border border-amber-200/80"
                    : feedbackModal.type === "error"
                    ? "bg-rose-50 text-rose-900 border border-rose-200/80"
                    : "bg-emerald-50 text-emerald-900 border border-emerald-200/80"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold shrink-0">💡 Solusi:</span>
                  <span>{feedbackModal.solution}</span>
                </div>
              </div>
            )}

            {/* Tombol Aksi */}
            <button
              type="button"
              onClick={() => setFeedbackModal(null)}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl font-semibold text-xs transition shadow-xs ${
                feedbackModal.type === "success"
                  ? "bg-[#1b4332] hover:bg-[#143225] text-white"
                  : feedbackModal.type === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {feedbackModal.actionText || "Tutup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
