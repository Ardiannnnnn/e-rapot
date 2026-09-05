"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheetIcon,
  FileDownIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SaveIcon,
  PrinterIcon,
  XIcon,
} from "@/components/shared/icons";
import { importNilaiExcelAction, ItemNilaiImport } from "@/actions/wali-kelas-import";
import Link from "next/link";

interface MapelItem {
  id: string;
  kode: string;
  nama: string;
  guruNama?: string;
}

interface SiswaItem {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
}

interface FormImportNilaiProps {
  kelasId: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  mapelList: MapelItem[];
  siswaList: SiswaItem[];
}

interface ParsedRow {
  rowNum: number;
  nisn: string;
  namaExcel: string;
  tugas: number;
  uts: number;
  uas: number;
  nilaiAkhir: number;
  catatan: string;
  isValid: boolean;
  matchedSiswaNama?: string;
}

export default function FormImportNilaiClient({
  kelasId,
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  mapelList,
  siswaList,
}: FormImportNilaiProps) {
  const [selectedMapelId, setSelectedMapelId] = useState<string>(
    mapelList[0]?.id || ""
  );
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [warningModal, setWarningModal] = useState<{
    title: string;
    text: string;
    type?: "warning" | "error" | "info" | "success";
    solution?: string;
    showDownloadTemplate?: boolean;
    primaryActionText?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMapel = mapelList.find((m) => m.id === selectedMapelId);

  // 1. Download Template Excel Khusus Kelas Ini
  const handleDownloadTemplate = () => {
    if (!selectedMapel) return;

    // Header baris pertama
    const headers = [
      "No",
      "NISN",
      "NIS",
      "Nama Peserta Didik",
      "Nilai Tugas (0-100)",
      "Nilai UTS (0-100)",
      "Nilai UAS (0-100)",
      "Catatan Capaian / Deskripsi (Opsional)",
    ];

    // Data siswa kelas ini
    const rows = siswaList.map((s, idx) => [
      idx + 1,
      s.nisn,
      s.nis,
      s.nama,
      "", // Kolom Tugas kosong untuk diisi guru mapel
      "", // Kolom UTS kosong
      "", // Kolom UAS kosong
      "", // Kolom Catatan kosong
    ]);

    const worksheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Atur lebar kolom agar rapi
    ws["!cols"] = [
      { wch: 6 },  // No
      { wch: 15 }, // NISN
      { wch: 12 }, // NIS
      { wch: 30 }, // Nama
      { wch: 20 }, // Tugas
      { wch: 20 }, // UTS
      { wch: 20 }, // UAS
      { wch: 45 }, // Catatan
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nilai Siswa");

    const cleanTA = tahunAjaran.replace("/", "-");
    const safeMapelKode = selectedMapel.kode.replace(/[^a-zA-Z0-9]/g, "");
    const safeKelas = kelasNama.replace(/[^a-zA-Z0-9]/g, "");
    const filename = `Template_Nilai_${safeMapelKode}_Kelas_${safeKelas}_TA_${cleanTA}_Sem_${semester}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  // 2. Baca dan Parse File Excel yang Diunggah
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) return;

        const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setWarningModal({
            title: "Format Penilaian Tidak Sesuai",
            text: "File Excel yang Anda unggah kosong atau tidak memiliki lembar kerja (worksheet).",
            type: "warning",
            solution: `Silakan gunakan template resmi e-Rapor untuk Kelas ${kelasNama} yang telah disediakan.`,
            showDownloadTemplate: true,
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Dapatkan data sebagai array baris (array of arrays)
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          blankrows: false,
          defval: "",
        });

        if (!jsonData || jsonData.length < 2) {
          setWarningModal({
            title: "Format Penilaian Tidak Sesuai",
            text: "File Excel kosong atau tidak memiliki baris data penilaian siswa.",
          });
          return;
        }

        // Cari baris header yang memuat kolom "nisn" atau "nama"
        let headerRowIndex = -1;
        for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
          const row = jsonData[r];
          if (Array.isArray(row)) {
            const hasHeaderKeyword = row.some(
              (cell) =>
                cell != null &&
                String(cell).toLowerCase().trim().includes("nisn")
            );
            if (hasHeaderKeyword) {
              headerRowIndex = r;
              break;
            }
          }
        }

        // Jika tidak ditemukan baris yang memuat kata "nisn" sama sekali
        if (headerRowIndex === -1) {
          setWarningModal({
            title: "Format Penilaian Tidak Sesuai",
            text: "File Excel yang Anda unggah tidak memiliki kolom 'NISN'. Sistem e-Rapor wajib menggunakan kolom NISN untuk memetakan nilai ke siswa Kelas " + kelasNama + ". Silakan unduh dan gunakan format template resmi yang telah disediakan.",
          });
          return;
        }

        const rawHeaders = Array.isArray(jsonData[headerRowIndex])
          ? jsonData[headerRowIndex]
          : [];

        // Pastikan setiap elemen adalah string dan aman dari null/undefined
        const headerRow: string[] = rawHeaders.map((h) =>
          h != null ? String(h).toLowerCase().trim() : ""
        );

        let nisnIdx = headerRow.findIndex((h) => Boolean(h && h.includes("nisn")));
        let namaIdx = headerRow.findIndex((h) => Boolean(h && h.includes("nama")));
        let tugasIdx = headerRow.findIndex((h) => Boolean(h && h.includes("tugas")));
        let utsIdx = headerRow.findIndex((h) => Boolean(h && h.includes("uts")));
        let uasIdx = headerRow.findIndex((h) => Boolean(h && h.includes("uas")));
        let catatanIdx = headerRow.findIndex(
          (h) => Boolean(h && (h.includes("catatan") || h.includes("deskripsi")))
        );

        // Validasi kolom nilai minimal
        if (tugasIdx === -1 && utsIdx === -1 && uasIdx === -1) {
          setWarningModal({
            title: "Format Penilaian Tidak Sesuai",
            text: "File Excel tidak memiliki kolom komponen nilai (Tugas, UTS, atau UAS). Pastikan susunan kolom penilaian sesuai dengan format template resmi e-Rapor.",
          });
          return;
        }

        // Fallback index
        if (namaIdx === -1) namaIdx = 3;
        if (tugasIdx === -1) tugasIdx = 4;
        if (utsIdx === -1) utsIdx = 5;
        if (uasIdx === -1) uasIdx = 6;
        if (catatanIdx === -1) catatanIdx = 7;

        const nisnToSiswaMap = new Map<string, string>();
        for (const s of siswaList) {
          nisnToSiswaMap.set(s.nisn.trim(), s.nama);
        }

        const rows: ParsedRow[] = [];

        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          const rawNisn = String(row[nisnIdx] ?? "").trim();
          if (!rawNisn || rawNisn.toLowerCase() === "nisn") continue;

          const matchedNama = nisnToSiswaMap.get(rawNisn);
          const isValid = Boolean(matchedNama);

          const tugas = parseFloat(String(row[tugasIdx] ?? 0)) || 0;
          const uts = parseFloat(String(row[utsIdx] ?? 0)) || 0;
          const uas = parseFloat(String(row[uasIdx] ?? 0)) || 0;
          const akhir = Math.round(tugas * 0.3 + uts * 0.3 + uas * 0.4);
          const catatan = String(row[catatanIdx] ?? "").trim();

          rows.push({
            rowNum: i + 1,
            nisn: rawNisn,
            namaExcel: String(row[namaIdx] ?? "-").trim(),
            tugas: Math.min(100, Math.max(0, tugas)),
            uts: Math.min(100, Math.max(0, uts)),
            uas: Math.min(100, Math.max(0, uas)),
            nilaiAkhir: akhir,
            catatan,
            isValid,
            matchedSiswaNama: matchedNama,
          });
        }

        if (rows.length === 0) {
          setWarningModal({
            title: "Format Penilaian Tidak Sesuai",
            text: "Tidak ditemukan data siswa atau nilai pada baris di bawah header. Pastikan file tidak kosong.",
          });
          return;
        }

        setParsedRows(rows);

        const validCount = rows.filter((r) => r.isValid).length;
        const invalidCount = rows.length - validCount;

        if (validCount === 0) {
          setParsedRows([]);
          setWarningModal({
            title: "Format Penilaian Tidak Sesuai",
            text: `File Excel berhasil dibaca, namun TIDAK ADA satupun NISN yang cocok dengan ${siswaList.length} siswa di Kelas ${kelasNama}. Pastikan Anda mengunggah file nilai khusus rombel Kelas ${kelasNama}.`,
          });
        } else if (invalidCount > 0) {
          setWarningModal({
            title: "Perhatian: Sebagian Data Siswa Tidak Cocok",
            text: `Ditemukan ${validCount} siswa cocok dengan Kelas ${kelasNama}, tetapi terdapat ${invalidCount} baris siswa yang NISN-nya tidak terdaftar di kelas ini.`,
            type: "warning",
            solution: `Baris yang tidak terdaftar ditandai warna merah pada tabel pratinjau. Sistem hanya akan mengimpor nilai untuk ${validCount} siswa yang sah.`,
            showDownloadTemplate: true,
          });
        }
      } catch (err: any) {
        console.error("Gagal membaca Excel:", err);
        setWarningModal({
          title: "Format Penilaian Tidak Sesuai",
          text: `File spreadsheet tidak dapat diproses: ${err?.message || "Pastikan file menggunakan format .xlsx atau .csv standar."}`,
          type: "error",
          solution: "Pastikan file tidak dikunci dengan password dan unduh template resmi bila perlu.",
          showDownloadTemplate: true,
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 3. Reset File & Tabel Pratinjau
  const handleReset = () => {
    setParsedRows([]);
    setFileName("");
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 4. Simpan Nilai ke Database
  const handleSaveToDatabase = async () => {
    if (parsedRows.length === 0 || !selectedMapelId) return;

    const validItems: ItemNilaiImport[] = parsedRows
      .filter((r) => r.isValid)
      .map((r) => ({
        nisn: r.nisn,
        nilaiTugas: r.tugas,
        nilaiUTS: r.uts,
        nilaiUAS: r.uas,
        nilaiAkhir: r.nilaiAkhir,
        catatan: r.catatan,
      }));

    if (validItems.length === 0) {
      setWarningModal({
        title: "Format Penilaian Tidak Sesuai",
        text: "Tidak ada baris siswa yang valid untuk disimpan ke rapor.",
        type: "warning",
        solution: "Pastikan file Excel memuat NISN siswa yang terdaftar di kelas ini.",
        showDownloadTemplate: true,
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const res = await importNilaiExcelAction({
      mapelId: selectedMapelId,
      kelasId,
      tahunAjaran,
      semester,
      items: validItems,
    });

    setIsSubmitting(false);

    if (res.success) {
      setMessage({
        type: "success",
        text: res.message,
      });
      // Bersihkan pratinjau setelah sukses
      setParsedRows([]);
      setFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setWarningModal({
        title: "Gagal Menyimpan Nilai",
        text: res.message,
        type: "error",
        showDownloadTemplate: false,
      });
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
              Bantuan Wali Kelas • Kelas {kelasNama} (Tingkat {tingkat})
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
              Import Nilai Mata Pelajaran dari Excel
            </h1>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Fasilitasi nilai dari guru mapel (Bahasa Inggris, PJOK, dll.) yang diserahkan dalam bentuk file Excel. Unduh template khusus siswa kelas ini, isi nilai, lalu unggah kembali untuk masuk ke rapor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/wali-kelas"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm border border-white/15 transition-all text-center"
            >
              Cek Kelengkapan Nilai
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Notifikasi Biasa (Success / Error) */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === "success" ? (
              <CheckCircle2Icon className="h-5 w-5 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircleIcon className="h-5 w-5 text-rose-700 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          {message.type === "success" && (
            <Link
              href="/wali-kelas/cetak"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors shrink-0"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              Lihat di Lembar Rapor
            </Link>
          )}
        </div>
      )}

      {/* MODAL BOX DIALOG PERINGATAN / VALIDASI FORMAT PENILAIAN */}
      {warningModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setWarningModal(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-center space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Close X */}
            <button
              type="button"
              onClick={() => setWarningModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-stone-100 transition-colors"
              title="Tutup dialog"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {/* Icon Header Berdasarkan Tipe */}
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xs ${
                warningModal.type === "error"
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : warningModal.type === "success"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-amber-100 text-amber-800 border-amber-200"
              }`}
            >
              {warningModal.type === "success" ? (
                <CheckCircle2Icon className="h-7 w-7 text-emerald-700" />
              ) : (
                <AlertCircleIcon
                  className={`h-7 w-7 ${
                    warningModal.type === "error" ? "text-rose-700" : "text-amber-700"
                  }`}
                />
              )}
            </div>

            {/* Judul & Penjelasan */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 font-poppins">
                {warningModal.title}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed px-2">
                {warningModal.text}
              </p>
            </div>

            {/* Petunjuk Solusi / Bantuan */}
            <div
              className={`p-4 rounded-2xl border text-left text-xs space-y-1 ${
                warningModal.type === "error"
                  ? "bg-rose-50/80 border-rose-200/80 text-rose-950"
                  : "bg-amber-50/80 border-amber-200/80 text-amber-950"
              }`}
            >
              <span
                className={`font-semibold block ${
                  warningModal.type === "error" ? "text-rose-900" : "text-amber-900"
                }`}
              >
                Petunjuk Solusi:
              </span>
              <p
                className={`text-[11px] leading-relaxed ${
                  warningModal.type === "error" ? "text-rose-800" : "text-amber-800"
                }`}
              >
                {warningModal.solution ||
                  `Silakan unduh format template resmi untuk Kelas ${kelasNama}. File template sudah terisi daftar nama dan NISN seluruh siswa secara akurat sehingga kolom penilaian dijamin 100% cocok.`}
              </p>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex flex-col gap-2 pt-1">
              {warningModal.showDownloadTemplate !== false && (
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadTemplate();
                    setWarningModal(null);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <FileDownIcon className="h-4 w-4" />
                  Unduh Template Resmi Kelas {kelasNama}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setWarningModal(null);
                  handleReset();
                }}
                className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-zinc-700 text-xs font-semibold transition-colors"
              >
                Tutup & Pilih File Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2 Kolom Langkah Kerja */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LANGKAH 1: Pilih Mapel & Download Template */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                1
              </span>
              <h2 className="font-bold text-zinc-900 text-base font-poppins">
                Pilih Mapel & Unduh Template
              </h2>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Pilih mata pelajaran yang nilainya akan diimpor. Template yang diunduh sudah otomatis memuat nama dan NISN <strong>{siswaList.length} siswa Kelas {kelasNama}</strong>.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Mata Pelajaran Target:
                </label>
                <select
                  value={selectedMapelId}
                  onChange={(e) => {
                    setSelectedMapelId(e.target.value);
                    handleReset();
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#1b4332]"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.kode}) {m.guruNama ? `— Guru: ${m.guruNama}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition-all shadow-2xs"
          >
            <FileDownIcon className="h-4 w-4 text-emerald-700" />
            Download Format Excel ({selectedMapel?.kode || "Mapel"} • {siswaList.length} Siswa)
          </button>
        </div>

        {/* LANGKAH 2: Upload File Excel */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                2
              </span>
              <h2 className="font-bold text-zinc-900 text-base font-poppins">
                Unggah File Excel dari Guru Mapel
              </h2>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Unggah file Excel (`.xlsx` atau `.csv`) yang sudah diisi oleh guru mapel bersangkutan. Sistem akan mencocokkan data berdasarkan NISN siswa.
            </p>

            <div className="mt-4">
              <label
                htmlFor="excel-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 hover:border-[#1b4332] rounded-2xl cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition-all text-center"
              >
                <FileSpreadsheetIcon className="h-8 w-8 text-emerald-700 mb-2" />
                <span className="text-xs font-semibold text-zinc-800">
                  {fileName ? fileName : "Klik untuk memilih file Excel (.xlsx / .csv)"}
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Mendukung format spreadsheet standar Kemendikbud
                </span>
                <input
                  id="excel-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {fileName && (
            <div className="flex items-center justify-between text-xs text-zinc-600 bg-stone-100 p-2.5 rounded-xl">
              <span className="truncate max-w-xs font-mono font-medium">{fileName}</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-rose-600 hover:text-rose-800 font-semibold text-xs ml-2 flex items-center gap-1"
              >
                <XIcon className="h-3.5 w-3.5" />
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LANGKAH 3: Pratinjau & Validasi Data */}
      {parsedRows.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-zinc-900 font-poppins">
                Pratinjau Hasil Pembacaan Excel ({selectedMapel?.nama})
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5">
                Periksa kesesuaian nilai sebelum menerapkan ke rapor. Nilai Akhir dihitung otomatis: (30% Tugas + 30% UTS + 40% UAS).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  {validCount} Siswa Cocok
                </span>
                {invalidCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                    {invalidCount} NISN Tidak Dikenal
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={isSubmitting || validCount === 0}
                onClick={handleSaveToDatabase}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95"
              >
                <SaveIcon className="h-4 w-4" />
                {isSubmitting
                  ? "Menyimpan ke Database..."
                  : `Simpan & Terapkan Nilai (${validCount} Siswa)`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4">NISN Siswa</th>
                  <th className="py-3 px-4">Nama Siswa di Rombel</th>
                  <th className="py-3 px-3 text-center w-20">Tugas</th>
                  <th className="py-3 px-3 text-center w-20">UTS</th>
                  <th className="py-3 px-3 text-center w-20">UAS</th>
                  <th className="py-3 px-3 text-center w-24">Nilai Akhir</th>
                  <th className="py-3 px-4">Catatan Capaian Pembelajaran</th>
                  <th className="py-3 px-3 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {parsedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.isValid ? "hover:bg-stone-50/70" : "bg-rose-50/40 hover:bg-rose-50/70"
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-mono text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-zinc-800">
                      {row.nisn}
                    </td>
                    <td className="py-3 px-4">
                      {row.isValid ? (
                        <span className="font-semibold text-zinc-900 block">
                          {row.matchedSiswaNama}
                        </span>
                      ) : (
                        <div>
                          <span className="text-zinc-500 line-through block">
                            {row.namaExcel}
                          </span>
                          <span className="text-[10px] text-rose-600 font-semibold">
                            NISN tidak terdaftar di Kelas {kelasNama}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-800">
                      {row.tugas}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-800">
                      {row.uts}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-800">
                      {row.uas}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                          row.nilaiAkhir >= 85
                            ? "bg-emerald-100 text-emerald-900"
                            : row.nilaiAkhir >= 75
                            ? "bg-blue-100 text-blue-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {row.nilaiAkhir}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-700 italic text-[11px] max-w-xs truncate">
                      {row.catatan || "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2Icon className="h-3 w-3" />
                          Cocok
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertCircleIcon className="h-3 w-3" />
                          Gagal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
