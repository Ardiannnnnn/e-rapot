"use client";

import React, { useState, useTransition, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  createSiswaAction,
  updateSiswaAction,
  deleteSiswaAction,
  importSiswaExcelAction,
  ItemSiswaImport,
} from "@/actions/siswa";
import {
  TablePaginationInfo,
  TablePaginationNav,
} from "@/components/shared/table-pagination";
import {
  FileSpreadsheetIcon,
  FileDownIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SaveIcon,
  XIcon,
} from "@/components/shared/icons";

import { SiswaRecord, FormSiswaProps } from "@/types/admin-sekolah";

export type { SiswaRecord };

export default function FormSiswa({ initialSiswaList, kelasList }: FormSiswaProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Alert Modal Pop-up Berhasil (Sesuai Aturan AGENTS.md)
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Modal Konfirmasi Hapus Siswa (Pengganti browser confirm)
  const [confirmDeleteSiswa, setConfirmDeleteSiswa] = useState<{
    id: string;
    nama: string;
  } | null>(null);

  const [filterKelas, setFilterKelas] = useState<string>("ALL");
  const [filterGender, setFilterGender] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal Tambah Siswa Manual
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nisn, setNisn] = useState("");
  const [nis, setNis] = useState("");
  const [nama, setNama] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("L");
  const [nik, setNik] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [agama, setAgama] = useState("Islam");
  const [kelasId, setKelasId] = useState(kelasList[0]?.id || "");
  const [alamat, setAlamat] = useState("");

  // Modal Edit Siswa / Mutasi
  const [editingSiswa, setEditingSiswa] = useState<SiswaRecord | null>(null);
  const [editNisn, setEditNisn] = useState("");
  const [editNis, setEditNis] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editJenisKelamin, setEditJenisKelamin] = useState("L");
  const [editNik, setEditNik] = useState("");
  const [editTempatLahir, setEditTempatLahir] = useState("");
  const [editTanggalLahir, setEditTanggalLahir] = useState("");
  const [editAgama, setEditAgama] = useState("Islam");
  const [editKelasId, setEditKelasId] = useState("");
  const [editAlamat, setEditAlamat] = useState("");

  // Modal Import Siswa dari Excel
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importRows, setImportRows] = useState<ItemSiswaImport[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const filteredSiswa = initialSiswaList.filter((s) => {
    if (filterKelas !== "ALL" && s.kelasId !== filterKelas) return false;
    if (filterGender !== "ALL" && s.jenisKelamin !== filterGender) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.nama.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.nis.includes(q) ||
        (s.nik && s.nik.includes(q))
      );
    }
    return true;
  });

  // Perhitungan Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSiswa.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedSiswa = filteredSiswa.slice(startIndex, startIndex + pageSize);

  // Kamus Kelas Terdaftar untuk validasi client-side saat import
  const registeredKelasMap = useMemo(() => {
    const map = new Set<string>();
    for (const k of kelasList) {
      const clean1 = k.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
      const clean2 = `kelas${clean1}`;
      map.add(clean1);
      map.add(clean2);
    }
    return map;
  }, [kelasList]);

  // Filter pratinjau import (Semua vs Bermasalah)
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "INVALID">("ALL");

  // Siswa dalam pratinjau yang kelasnya belum terdaftar
  const unmappedRowsCount = useMemo(() => {
    return importRows.filter((r) => {
      const clean = String(r.kelasNama || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return !registeredKelasMap.has(clean);
    }).length;
  }, [importRows, registeredKelasMap]);

  const displayedImportRows = useMemo(() => {
    if (previewFilter === "INVALID") {
      return importRows.filter(
        (r) => !registeredKelasMap.has(String(r.kelasNama || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
      );
    }
    return importRows;
  }, [importRows, previewFilter, registeredKelasMap]);

  // 1. Download Template Excel Khusus Data Siswa (Format Dapodik 10 Kolom)
  const handleDownloadTemplate = () => {
    const headers = [
      "Kelas",
      "Nama Peserta Didik",
      "NIPD",
      "L/P",
      "NISN",
      "Tempat Lahir",
      "Tanggal Lahir",
      "NIK",
      "Agama",
      "Alamat",
    ];

    const sampleKelas = kelasList[0]?.nama ? `Kelas ${kelasList[0].nama}` : "Kelas 5B";
    const sampleRows = [
      [
        sampleKelas,
        "ADITYA MAULANA",
        "1856",
        "L",
        "0155117154",
        "SINABANG",
        "30/03/2015",
        "1109043003150002",
        "Islam",
        "AIR DINGIN",
      ],
      [
        sampleKelas,
        "CUT ARSY ANIAH",
        "1857",
        "P",
        "3156710419",
        "SINABANG",
        "05/02/2015",
        "1109044502150002",
        "Islam",
        "HASAN BASRI",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws["!cols"] = [
      { wch: 14 }, // Kelas
      { wch: 28 }, // Nama
      { wch: 12 }, // NIPD
      { wch: 6 },  // L/P
      { wch: 15 }, // NISN
      { wch: 16 }, // Tempat Lahir
      { wch: 14 }, // Tanggal Lahir
      { wch: 20 }, // NIK
      { wch: 12 }, // Agama
      { wch: 30 }, // Alamat
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa_eRapor.xlsx");
  };

  // 2. Upload & Parse File Excel Siswa
  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportErrors([]);
    setPreviewFilter("ALL");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) return;

        const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setImportErrors(["File Excel tidak memiliki lembar kerja (worksheet)."]);
          return;
        }

        const ws = workbook.Sheets[firstSheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          blankrows: false,
          defval: "",
        });

        if (!jsonData || jsonData.length < 2) {
          setImportErrors(["File Excel kosong atau tidak memiliki data baris siswa."]);
          return;
        }

        // Cari header row
        let headerRowIndex = -1;
        for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
          const row = jsonData[r];
          if (Array.isArray(row)) {
            const rowStr = row.map((c) => String(c).toLowerCase());
            if (rowStr.some((c) => c.includes("nama") || c.includes("nisn") || c.includes("nipd") || c.includes("nis"))) {
              headerRowIndex = r;
              break;
            }
          }
        }

        const formatExcelDate = (val: any): string => {
          if (!val) return "";
          if (val instanceof Date) {
            const day = String(val.getDate()).padStart(2, "0");
            const month = String(val.getMonth() + 1).padStart(2, "0");
            const year = val.getFullYear();
            return `${day}/${month}/${year}`;
          }
          if (typeof val === "number" && val > 20000 && val < 70000) {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            const day = String(date.getUTCDate()).padStart(2, "0");
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const year = date.getUTCFullYear();
            return `${day}/${month}/${year}`;
          }
          return String(val).trim();
        };

        let kelasIdx = 0;
        let namaIdx = 1;
        let nisIdx = 2;
        let lpIdx = 3;
        let nisnIdx = 4;
        let tempatIdx = 5;
        let tglIdx = 6;
        let nikIdx = 7;
        let agamaIdx = 8;
        let alamatIdx = 9;

        if (headerRowIndex !== -1) {
          const rawHeaders = jsonData[headerRowIndex].map((h) => String(h || "").toLowerCase().trim());
          const foundKelas = rawHeaders.findIndex((h) => h.includes("kelas") || h.includes("rombel"));
          const foundNama = rawHeaders.findIndex((h) => h.includes("nama"));
          const foundNisn = rawHeaders.findIndex((h) => h.includes("nisn"));
          const foundNis = rawHeaders.findIndex(
            (h) => (h === "nipd" || h.includes("nipd") || h === "nis" || h.includes("nis")) && !h.includes("nisn")
          );
          const foundLp = rawHeaders.findIndex((h) => h.includes("l/p") || h.includes("gender") || h.includes("kelamin") || h === "jk");
          const foundTempat = rawHeaders.findIndex(
            (h) => (h.includes("tempat") || h.includes("tmp")) && !h.includes("tanggal") && !h.includes("tgl")
          );
          const foundTgl = rawHeaders.findIndex(
            (h) => (h.includes("tanggal") || h.includes("tgl")) || (h.includes("lahir") && !h.includes("tempat") && !h.includes("tmp"))
          );
          const foundNik = rawHeaders.findIndex((h) => h.includes("nik"));
          const foundAgama = rawHeaders.findIndex((h) => h.includes("agama"));
          const foundAlamat = rawHeaders.findIndex((h) => h.includes("alamat"));

          if (foundKelas !== -1) kelasIdx = foundKelas;
          if (foundNama !== -1) namaIdx = foundNama;
          if (foundNis !== -1) nisIdx = foundNis;
          if (foundLp !== -1) lpIdx = foundLp;
          if (foundNisn !== -1) nisnIdx = foundNisn;
          if (foundTempat !== -1) tempatIdx = foundTempat;
          if (foundTgl !== -1) tglIdx = foundTgl;
          if (foundNik !== -1) nikIdx = foundNik;
          if (foundAgama !== -1) agamaIdx = foundAgama;
          if (foundAlamat !== -1) alamatIdx = foundAlamat;
        }

        const parsed: ItemSiswaImport[] = [];
        const startRow = headerRowIndex === -1 ? 0 : headerRowIndex + 1;

        for (let r = startRow; r < jsonData.length; r++) {
          const row = jsonData[r];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          const rawNama = String(row[namaIdx] ?? "").trim();
          const rawNisn = String(row[nisnIdx] ?? "").trim();
          const rawNis = String(row[nisIdx] ?? "").trim();

          // Lewati baris kosong atau baris header yang terulang
          if (!rawNama || rawNama.toLowerCase() === "nama" || rawNama.toLowerCase() === "nama peserta didik" || rawNama.toLowerCase() === "nama siswa") continue;

          const rawKelas = String(row[kelasIdx] ?? "").trim() || (kelasList[0]?.nama ? `Kelas ${kelasList[0].nama}` : "Kelas 1");
          const rawLp = String(row[lpIdx] ?? "L").trim().toUpperCase();
          const rawTempat = String(row[tempatIdx] ?? "").trim();
          const rawTgl = formatExcelDate(row[tglIdx]);
          const rawNik = String(row[nikIdx] ?? "").trim();
          const rawAgama = String(row[agamaIdx] ?? "Islam").trim();
          const rawAlamat = String(row[alamatIdx] ?? "").trim();

          parsed.push({
            kelasNama: rawKelas,
            nama: rawNama,
            nis: rawNis || rawNisn,
            jenisKelamin: rawLp.startsWith("P") ? "P" : "L",
            nisn: rawNisn,
            tempatLahir: rawTempat,
            tanggalLahir: rawTgl,
            nik: rawNik,
            agama: rawAgama,
            alamat: rawAlamat,
          });
        }

        if (parsed.length === 0) {
          setImportErrors(["Tidak ada data siswa yang valid ditemukan pada spreadsheet."]);
        } else {
          setImportRows(parsed);
        }
      } catch (err: any) {
        console.error("Gagal baca file:", err);
        setImportErrors(["Gagal membaca file spreadsheet: " + (err?.message || "Format tidak valid")]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 3. Simpan Massal Hasil Import ke Database
  const handleProcessImport = async () => {
    if (importRows.length === 0) return;
    setIsImporting(true);
    setImportErrors([]);

    const res = await importSiswaExcelAction(importRows);
    setIsImporting(false);

    if (res.success) {
      setIsImportOpen(false);
      setImportRows([]);
      setImportFileName("");
      if (importFileInputRef.current) importFileInputRef.current.value = "";

      setAlertModal({
        isOpen: true,
        title: "Import Siswa Berhasil",
        message: res.message,
      });

      if (res.errors && res.errors.length > 0) {
        setMessage({
          type: "error",
          text: `Beberapa data siswa tidak tersimpan: ${res.errors.slice(0, 3).join("; ")}`,
        });
      }
    } else {
      setImportErrors(res.errors || [res.message]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await createSiswaAction({
        nisn,
        nis,
        nama,
        jenisKelamin,
        kelasId,
        nik,
        tempatLahir,
        tanggalLahir,
        agama,
        alamat,
      });

      if (res.success) {
        setNisn("");
        setNis("");
        setNama("");
        setNik("");
        setTempatLahir("");
        setTanggalLahir("");
        setAgama("Islam");
        setAlamat("");
        setIsAddOpen(false);
        setAlertModal({
          isOpen: true,
          title: "Peserta Didik Berhasil Ditambahkan",
          message: res.message,
        });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    setMessage(null);

    startTransition(async () => {
      const res = await updateSiswaAction({
        id: editingSiswa.id,
        nisn: editNisn,
        nis: editNis,
        nama: editNama,
        jenisKelamin: editJenisKelamin,
        kelasId: editKelasId,
        nik: editNik,
        tempatLahir: editTempatLahir,
        tanggalLahir: editTanggalLahir,
        agama: editAgama,
        alamat: editAlamat,
      });

      if (res.success) {
        setEditingSiswa(null);
        setAlertModal({
          isOpen: true,
          title: "Data Peserta Didik Berhasil Diperbarui",
          message: res.message,
        });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteSiswa) return;
    const { id } = confirmDeleteSiswa;
    setMessage(null);

    startTransition(async () => {
      const res = await deleteSiswaAction(id);
      setConfirmDeleteSiswa(null);
      if (res.success) {
        setAlertModal({
          isOpen: true,
          title: "Peserta Didik Berhasil Dihapus",
          message: res.message,
        });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Cari nama, NISN, NIPD, atau NIK..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] w-full sm:w-64"
          />

          {/* Filter Rombel Kelas */}
          <select
            value={filterKelas}
            onChange={(e) => {
              setFilterKelas(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          >
            <option value="ALL">Semua Rombel ({initialSiswaList.length} Siswa)</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama} (Tk. {k.tingkat})
              </option>
            ))}
          </select>

          {/* Filter Gender */}
          <select
            value={filterGender}
            onChange={(e) => {
              setFilterGender(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          >
            <option value="ALL">Semua Gender</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        {/* Action Buttons: Import Excel & Tambah Siswa */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => {
              setImportErrors([]);
              setImportRows([]);
              setImportFileName("");
              setPreviewFilter("ALL");
              setIsImportOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition shadow-xs flex items-center justify-center gap-2 active:scale-95"
          >
            <FileSpreadsheetIcon className="h-4 w-4 text-emerald-700" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (kelasList.length === 0) {
                alert("Buat data rombel kelas terlebih dahulu sebelum mendaftarkan siswa.");
                return;
              }
              setKelasId(kelasList[0].id);
              setNik("");
              setTempatLahir("");
              setTanggalLahir("");
              setAgama("Islam");
              setIsAddOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>➕</span>
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
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

      {/* Bar Kontrol Pagination & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <TablePaginationInfo
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={filteredSiswa.length}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          onPageChange={(page) => setCurrentPage(page)}
          label="peserta didik"
        />

        {(filterKelas !== "ALL" || filterGender !== "ALL" || search.trim()) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-mono">
              Filter aktif: <strong className="text-zinc-900">{filteredSiswa.length}</strong> dari {initialSiswaList.length} siswa
            </span>
            <button
              type="button"
              onClick={() => {
                setFilterKelas("ALL");
                setFilterGender("ALL");
                setSearch("");
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-rose-600 font-semibold transition text-[11px]"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Tabel Data Siswa */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5 min-w-[220px]">Nama Peserta Didik</th>
                <th className="px-4 py-3.5 w-36 font-mono">NISN / NIPD / NIK</th>
                <th className="px-4 py-3.5 w-28 text-center">L/P</th>
                <th className="px-4 py-3.5 w-32 text-center">Rombel Kelas</th>
                <th className="px-4 py-3.5">Alamat</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-600">
                    Tidak ada data peserta didik yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedSiswa.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-center text-zinc-600 font-mono">
                      {startIndex + idx + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-zinc-900 text-sm">{s.nama}</div>
                      {(s.tempatLahir || s.tanggalLahir || s.agama) && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {[
                            s.tempatLahir && s.tanggalLahir
                              ? `${s.tempatLahir}, ${s.tanggalLahir}`
                              : s.tempatLahir || s.tanggalLahir,
                            s.agama,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs">
                      <div className="text-zinc-900 font-semibold">{s.nisn}</div>
                      <div className="text-[11px] text-zinc-600">NIPD: {s.nis}</div>
                      {s.nik && (
                        <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[140px]" title={`NIK: ${s.nik}`}>
                          NIK: {s.nik}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          s.jenisKelamin === "L"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {s.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Kelas {s.kelas.nama}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 max-w-xs truncate">
                      {s.alamat || "-"}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSiswa(s);
                            setEditNisn(s.nisn);
                            setEditNis(s.nis);
                            setEditNama(s.nama);
                            setEditJenisKelamin(s.jenisKelamin);
                            setEditNik(s.nik || "");
                            setEditTempatLahir(s.tempatLahir || "");
                            setEditTanggalLahir(s.tanggalLahir || "");
                            setEditAgama(s.agama || "Islam");
                            setEditKelasId(s.kelasId);
                            setEditAlamat(s.alamat || "");
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 text-zinc-600 hover:text-zinc-900 hover:bg-stone-50 transition"
                          title="Edit biodata atau mutasi kelas"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSiswa({ id: s.id, nama: s.nama })}
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus siswa"
                        >
                          🗑️
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

      {/* Navigasi Pagination */}
      <TablePaginationNav
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        totalItems={filteredSiswa.length}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* MODAL IMPORT SISWA DARI EXCEL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <FileSpreadsheetIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base font-poppins">
                    Import Data Peserta Didik dari Excel
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Mendukung format spreadsheet standar ekspor Dapodik Kemendikbud
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-stone-100 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1 & 2 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unduh Template */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
                      1
                    </span>
                    Unduh Format Template
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                    Unduh format template Excel resmi dengan 10 kolom standar: <strong>Kelas, Nama, NIPD, L/P, NISN, Tempat Lahir, Tgl Lahir, NIK, Agama, Alamat</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-semibold shadow-2xs transition active:scale-95"
                >
                  <FileDownIcon className="h-4 w-4 text-emerald-700" />
                  <span>Download Format Excel</span>
                </button>
              </div>

              {/* Unggah File */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
                      2
                    </span>
                    Pilih File Excel Anda
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                    Pilih file (.xlsx / .csv) yang sudah diisi. Sistem otomatis memetakan siswa ke rombel kelas yang sesuai.
                  </p>
                </div>
                <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 text-center">
                  <FileSpreadsheetIcon className="h-4 w-4" />
                  <span>{importFileName ? "Ganti File Excel" : "Pilih File Excel"}</span>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleImportFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Error Message if any */}
            {importErrors.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircleIcon className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Perhatian:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Peringatan jika ditemukan kelas yang belum terdaftar */}
            {importRows.length > 0 && unmappedRowsCount > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircleIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">
                    Perhatian: Ditemukan {unmappedRowsCount} siswa dengan rombel kelas yang belum terdaftar di Data Kelas.
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Sistem menerapkan <strong>Prinsip Integritas Data</strong>: baris siswa dengan kelas yang belum terdaftar akan otomatis ditolak saat disimpan. Anda dapat mendaftarkan rombel kelas tersebut terlebih dahulu di menu <strong>Data Kelas</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Pratinjau Data yang Terbaca */}
            {importRows.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-zinc-900 font-poppins">
                      Pratinjau Data Terbaca ({importRows.length} Siswa)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {unmappedRowsCount > 0 && (
                      <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPreviewFilter("ALL")}
                          className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                            previewFilter === "ALL"
                              ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                              : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          Semua ({importRows.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewFilter("INVALID")}
                          className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                            previewFilter === "INVALID"
                              ? "bg-rose-100 text-rose-800 font-semibold"
                              : "text-rose-600 hover:text-rose-800"
                          }`}
                        >
                          ⚠️ Belum Terdaftar ({unmappedRowsCount})
                        </button>
                      </div>
                    )}
                    <span className="text-[11px] text-zinc-500 font-mono">
                      File: {importFileName}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-stone-200 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-stone-50 text-zinc-600 uppercase text-[10px] font-mono border-b border-stone-200 sticky top-0 bg-stone-50 z-10">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">No</th>
                        <th className="py-2 px-3">Kelas</th>
                        <th className="py-2 px-3">Nama Lengkap</th>
                        <th className="py-2 px-3 font-mono">NIPD</th>
                        <th className="py-2 px-3 font-mono">NISN</th>
                        <th className="py-2 px-2 text-center">L/P</th>
                        <th className="py-2 px-3">Tempat Lahir</th>
                        <th className="py-2 px-3">Tanggal Lahir</th>
                        <th className="py-2 px-3 font-mono">NIK</th>
                        <th className="py-2 px-2.5">Agama</th>
                        <th className="py-2 px-3">Alamat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {displayedImportRows.map((row, idx) => {
                        const isKelasValid = registeredKelasMap.has(
                          String(row.kelasNama || "").toLowerCase().replace(/[^a-z0-9]/g, "")
                        );
                        return (
                          <tr
                            key={idx}
                            className={isKelasValid ? "hover:bg-stone-50/60" : "bg-rose-50/50 hover:bg-rose-50/80"}
                          >
                            <td className="py-1.5 px-2.5 text-center font-mono text-zinc-500">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 whitespace-nowrap">
                              {isKelasValid ? (
                                <span className="font-semibold text-emerald-800">{row.kelasNama}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                                  <span>{row.kelasNama || "(kosong)"}</span>
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                    Belum Terdaftar
                                  </span>
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-medium text-zinc-900 whitespace-nowrap">
                              {row.nama}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-zinc-700 whitespace-nowrap">
                              {row.nis || "-"}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-zinc-700 whitespace-nowrap">
                              {row.nisn}
                            </td>
                            <td className="py-1.5 px-2 text-center font-semibold">
                              {row.jenisKelamin}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-700 whitespace-nowrap">
                              {row.tempatLahir || "-"}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-zinc-700 whitespace-nowrap">
                              {row.tanggalLahir || "-"}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-zinc-700 whitespace-nowrap">
                              {row.nik || "-"}
                            </td>
                            <td className="py-1.5 px-2.5 text-zinc-700 whitespace-nowrap">
                              {row.agama || "-"}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-600 truncate max-w-[140px]" title={row.alamat}>
                              {row.alamat || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 px-1 gap-1">
                  <span>
                    Menampilkan <strong>{displayedImportRows.length}</strong> dari <strong>{importRows.length}</strong> seluruh data siswa terbaca.
                  </span>
                  <span className="text-zinc-400 italic">
                    Gulir tabel ke bawah untuk memeriksa seluruh baris data secara lengkap.
                  </span>
                </div>
              </div>
            )}

            {/* Action Dialog */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
              <button
                type="button"
                disabled={isImporting}
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-stone-50 text-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isImporting || importRows.length === 0 || (importRows.length - unmappedRowsCount === 0)}
                onClick={handleProcessImport}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-bold shadow-md transition disabled:opacity-50 active:scale-95"
              >
                <SaveIcon className="h-4 w-4" />
                <span>
                  {isImporting
                    ? "Menyimpan ke Database..."
                    : unmappedRowsCount > 0
                    ? `Simpan ${importRows.length - unmappedRowsCount} Siswa Valid (${unmappedRowsCount} Ditolak)`
                    : `Simpan ke Database (${importRows.length} Siswa)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Siswa Manual */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Pendaftaran Peserta Didik Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-500 hover:text-zinc-800 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NISN (10 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="0081234567"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NIPD (Nomor Induk Peserta Didik) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="2026001"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NIK Kependudukan (16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="1109043003150002"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Agama
                  </label>
                  <select
                    value={agama}
                    onChange={(e) => setAgama(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    placeholder="Contoh: Sinabang"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="text"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    placeholder="30/03/2015"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Rombel Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama} (Tk. {k.tingkat})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Merdeka No. 12, Air Dingin..."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
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
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition shadow-xs"
                >
                  {isPending ? "Mendaftarkan..." : "Daftarkan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Siswa / Mutasi Kelas */}
      {editingSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Edit Biodata / Mutasi Rombel Siswa
              </h3>
              <button
                type="button"
                onClick={() => setEditingSiswa(null)}
                className="text-zinc-500 hover:text-zinc-800 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NISN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NIPD <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNis}
                    onChange={(e) => setEditNis(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NIK Kependudukan (16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={editNik}
                    onChange={(e) => setEditNik(e.target.value)}
                    placeholder="1109043003150002"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Agama
                  </label>
                  <select
                    value={editAgama}
                    onChange={(e) => setEditAgama(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={editTempatLahir}
                    onChange={(e) => setEditTempatLahir(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="text"
                    value={editTanggalLahir}
                    onChange={(e) => setEditTanggalLahir(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editJenisKelamin}
                    onChange={(e) => setEditJenisKelamin(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mutasi ke Rombel Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editKelasId}
                    onChange={(e) => setEditKelasId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-bold text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama} (Tk. {k.tingkat})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alamat
                </label>
                <textarea
                  rows={2}
                  value={editAlamat}
                  onChange={(e) => setEditAlamat(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition shadow-xs"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Siswa (Pengganti Browser Confirm Sesuai AGENTS.md) */}
      {confirmDeleteSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircleIcon className="h-8 w-8 text-rose-600" />
            </div>

            <div>
              <h3 className="font-bold text-zinc-900 text-lg font-poppins">
                Hapus Data Peserta Didik?
              </h3>
              <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed px-2">
                Apakah Anda yakin ingin menghapus data peserta didik{" "}
                <strong className="text-zinc-800">{confirmDeleteSiswa.nama}</strong>?
                Tindakan ini permanen dan tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSiswa(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal Pop-up Berhasil (Sesuai Aturan AGENTS.md) */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2Icon className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-bold text-zinc-900 text-lg font-poppins">{alertModal.title}</h3>
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
