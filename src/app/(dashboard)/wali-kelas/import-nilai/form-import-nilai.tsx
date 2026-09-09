"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  MapelImportItem as MapelItem,
  SiswaImportItem as SiswaItem,
  FormImportNilaiProps,
  ParsedRow,
} from "@/types/wali-kelas/import-nilai";

// Helper untuk mendeteksi mata pelajaran dari awalan nama file Excel
export function detectMapelFromFilename(
  fileName: string,
  mapelList: MapelItem[]
): MapelItem | null {
  if (!fileName || !mapelList || mapelList.length === 0) return null;

  // Hapus path folder jika ada (e.g. C:\fakepath\...)
  const baseName = fileName.split(/[\/\\]/).pop() || fileName;

  // Hapus ekstensi .xlsx, .xls, .csv
  let clean = baseName.replace(/\.(xlsx|xls|csv)$/i, "").trim();

  // Hapus prefix umum template jika ada: "Template_Nilai_", "Template Nilai -", "Template_", "Nilai_"
  clean = clean.replace(/^(template[_\-\s]*(nilai)?|nilai)[_\-\s]+/i, "").trim();

  // Urutkan kode dari karakter terpanjang ke terpendek agar kode spesifik dicocokkan duluan
  const sorted = [...mapelList].sort(
    (a, b) => (b.kode?.length || 0) - (a.kode?.length || 0)
  );

  // 1. Cocokkan awalan nama file dengan kode mapel (case-insensitive)
  // Diikuti pemisah (_, -, spasi, ., atau langsung 'kelas' / angka)
  for (const m of sorted) {
    if (!m.kode) continue;
    const safeKode = m.kode.replace(/[^a-zA-Z0-9]/g, "");
    if (!safeKode) continue;

    const regex = new RegExp(`^${safeKode}([_\-\\s\\.]|$|(?=kelas)|(?=[0-9]))`, "i");
    if (regex.test(clean)) {
      return m;
    }
  }

  // 2. Cocokkan jika awalan menggunakan nama lengkap mapel (misal: "Bahasa_Indonesia_Kelas_2A")
  for (const m of sorted) {
    if (!m.nama) continue;
    const cleanNama = m.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLower = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanNama.length >= 3 && cleanLower.startsWith(cleanNama)) {
      return m;
    }
  }

  return null;
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
  const router = useRouter();
  const [currentMapelList, setCurrentMapelList] = useState<MapelItem[]>(mapelList);
  const [selectedMapelId, setSelectedMapelId] = useState<string>(
    mapelList[0]?.id || ""
  );

  useEffect(() => {
    setCurrentMapelList(mapelList);
  }, [mapelList]);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
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

  const selectedMapel = currentMapelList.find((m) => m.id === selectedMapelId) || mapelList[0];

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
    const safeMapelKode = selectedMapel.kode.toUpperCase().replace(/[^a-zA-Z0-9]/g, "");
    const safeKelas = kelasNama.replace(/[^a-zA-Z0-9]/g, "");
    // Format nama file baku diawali kode mapel sesuai aturan
    const filename = `${safeMapelKode}_Kelas_${safeKelas}_TA_${cleanTA}_Sem_${semester}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  // 2. Baca dan Parse File Excel yang Diunggah
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Aturan 1: Validasi Awalan Nama File (Harus diawali Kode Mapel yang sah di kelas ini)
    const detectedMapel = detectMapelFromFilename(file.name, currentMapelList);
    if (!detectedMapel) {
      const validCodes = currentMapelList.map((m) => `${m.kode} (${m.nama})`).join(", ");
      setWarningModal({
        title: "Format Nama File Ditolak",
        text: `File "${file.name}" tidak dapat diproses karena nama file tidak diawali dengan kode mata pelajaran yang sah untuk Kelas ${kelasNama}.`,
        type: "error",
        solution: `Sistem mewajibkan format nama file diawali dengan kode mata pelajaran agar nilai tidak salah tertimpa ke mata pelajaran lain. Contoh penamaan yang benar: "BIN_Kelas_${kelasNama}.xlsx" atau "IPAS_Kelas_${kelasNama}.xlsx".\n\nDaftar kode mapel yang berlaku di Kelas ${kelasNama}: ${validCodes}.`,
        showDownloadTemplate: true,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setParsedRows([]);
      setFileName("");
      return;
    }

    // Aturan 2: Validasi Kesesuaian Kelas pada Nama File
    const kelasRegex = /kelas[_\-\s]*([0-9]+[a-zA-Z]*)/i;
    const matchKelas = file.name.match(kelasRegex);
    const currentKelasClean = kelasNama.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (matchKelas && matchKelas[1]) {
      const fileKelasClean = matchKelas[1].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (fileKelasClean !== currentKelasClean) {
        setWarningModal({
          title: "File Rombel Tidak Cocok",
          text: `File "${file.name}" terdeteksi untuk Kelas ${matchKelas[1].toUpperCase()}, sedangkan rombel yang sedang Anda kelola adalah Kelas ${kelasNama}.`,
          type: "error",
          solution: `Harap unggah file nilai khusus rombel Kelas ${kelasNama}. Anda dapat mengunduh format template resmi khusus Kelas ${kelasNama} pada Langkah 1.`,
          showDownloadTemplate: true,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setParsedRows([]);
        setFileName("");
        return;
      }
    }

    // Otomatis sinkronkan target mata pelajaran sesuai dengan file yang diunggah
    setSelectedMapelId(detectedMapel.id);
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
        } else {
          setMessage({
            type: "success",
            text: `File "${file.name}" terverifikasi untuk mapel ${detectedMapel.nama} (${detectedMapel.kode}). Seluruh ${validCount} siswa 100% cocok dengan Kelas ${kelasNama}.`,
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
      // Perbarui status mapel di widget informasi langsung di UI
      setCurrentMapelList((prev) =>
        prev.map((m) =>
          m.id === selectedMapelId
            ? { ...m, terisiCount: validItems.length }
            : m
        )
      );
      router.refresh();

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

  const totalMapel = currentMapelList.length;
  const completeCount = currentMapelList.filter(
    (m) => (m.terisiCount || 0) >= siswaList.length && siswaList.length > 0
  ).length;
  const partialCount = currentMapelList.filter(
    (m) => (m.terisiCount || 0) > 0 && (m.terisiCount || 0) < siswaList.length
  ).length;
  const emptyCount = currentMapelList.filter(
    (m) => (m.terisiCount || 0) === 0
  ).length;
  const completionPercent = totalMapel > 0 ? Math.round((completeCount / totalMapel) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full flex justify-between flex-row-reverse">
            <span className="text-lg inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 font-medium mb-2 backdrop-blur-sm font-mono">
              Wali Kelas • Kelas {kelasNama} (Tingkat {tingkat})
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-poppins">
              Import Nilai Mata Pelajaran dari Excel
            </h1>
          </div>
        </div>
      </div>

      {/* WIDGET STATUS PENGISIAN NILAI MATA PELAJARAN */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 font-poppins">
                Status Pengisian Nilai Mata Pelajaran
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {completeCount} / {totalMapel} Mapel Lengkap ({completionPercent}%)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Klik salah satu mata pelajaran di bawah untuk memilih target impor atau mengunduh template nilainya secara langsung.
            </p>
          </div>

          {/* Indikator Status Legend */}
          <div className="flex items-center gap-2 text-[11px] font-medium flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              {completeCount} Lengkap
            </span>
            {partialCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {partialCount} Sebagian
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 border border-stone-200">
              <span className="h-2 w-2 rounded-full bg-stone-400" />
              {emptyCount} Belum Ada Nilai
            </span>
          </div>
        </div>

        {/* Mini Progress Bar Keseluruhan */}
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-700 transition-all duration-500 rounded-full"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Grid Kartu Status Mata Pelajaran */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {currentMapelList.map((m) => {
            const isSelected = m.id === selectedMapelId;
            const count = m.terisiCount || 0;
            const total = siswaList.length;
            const isComplete = count >= total && total > 0;
            const isPartial = count > 0 && count < total;
            const percent = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMapelId(m.id);
                  handleReset();
                }}
                className={`p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between group ${
                  isSelected
                    ? "border-[#1b4332] bg-emerald-50/50 ring-2 ring-[#1b4332]/20 shadow-xs"
                    : "border-stone-200 bg-stone-50/40 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-[#1b4332] text-white"
                        : "bg-white text-zinc-800 border border-stone-200 group-hover:border-stone-300"
                    }`}
                  >
                    {m.kode}
                  </span>
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      <CheckCircle2Icon className="h-3 w-3 text-emerald-700" />
                      Lengkap
                    </span>
                  ) : isPartial ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/60">
                      <AlertCircleIcon className="h-3 w-3 text-amber-700" />
                      {count}/{total}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                      Kosong
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-emerald-950">
                    {m.nama}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {m.guruNama ? `Guru: ${m.guruNama}` : "Wali Kelas"}
                  </div>
                </div>

                {/* Progress bar per mapel */}
                <div className="mt-3 pt-2 border-t border-stone-200/60 space-y-1">
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isComplete
                          ? "bg-emerald-600"
                          : isPartial
                          ? "bg-amber-500"
                          : "bg-transparent"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-mono">
                      Terisi: <strong className={isComplete ? "text-emerald-700" : isPartial ? "text-amber-700" : "text-stone-600"}>{count}/{total}</strong>
                    </span>
                    {isSelected && (
                      <span className="font-semibold text-[#1b4332] text-[10px]">
                        • Aktif
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
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
              className={`p-4 rounded-2xl border text-left text-xs space-y-1.5 ${
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
                className={`text-[11px] leading-relaxed whitespace-pre-line ${
                  warningModal.type === "error" ? "text-rose-800" : "text-amber-800"
                }`}
              >
                {warningModal.solution ||
                  `Silakan unduh format template resmi untuk Kelas ${kelasNama}. File template sudah terisi daftar nama dan NISN seluruh siswa secara akurat.`}
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

      {/* MODAL KONFIRMASI SIMPAN NILAI KE DATABASE */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-center space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Close X */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-stone-100 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <SaveIcon className="h-7 w-7 text-emerald-700" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-900 font-poppins">
                Konfirmasi Simpan Nilai
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed px-2">
                Pastikan mata pelajaran tujuan dan data penilaian sudah sesuai sebelum diterapkan ke lembar rapor siswa.
              </p>
            </div>

            {/* Rincian Target Import */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/70">
                <span className="text-zinc-500 font-medium">Mata Pelajaran:</span>
                <span className="font-bold text-zinc-900 font-mono text-right">
                  {selectedMapel?.nama} ({selectedMapel?.kode})
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/70">
                <span className="text-zinc-500 font-medium">Guru Pengampu:</span>
                <span className="font-semibold text-zinc-800 text-right">
                  {selectedMapel?.guruNama || "Wali Kelas"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/70">
                <span className="text-zinc-500 font-medium">Rombel Target:</span>
                <span className="font-semibold text-zinc-800">
                  Kelas {kelasNama} (Tingkat {tingkat})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Data Siap Disimpan:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold font-mono text-xs">
                  {validCount} Siswa Cocok
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertCircleIcon className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Nilai rapor siswa pada mata pelajaran <strong>{selectedMapel?.nama}</strong> akan <strong>diperbarui</strong> dengan data dari file ini.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-zinc-700 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setShowConfirmModal(false);
                  await handleSaveToDatabase();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {isSubmitting ? "Menyimpan..." : "Ya, Simpan Nilai"}
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
              Pilih mata pelajaran yang nilainya akan diimpor. Template yang diunduh otomatis diawali kode mapel (contoh: <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-emerald-900 font-semibold">{selectedMapel?.kode || "BIN"}_Kelas_{kelasNama}...xlsx</code>) dan memuat NISN <strong>{siswaList.length} siswa Kelas {kelasNama}</strong>.
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
                  {currentMapelList.map((m) => {
                    const count = m.terisiCount || 0;
                    const isLengkap = count >= siswaList.length && siswaList.length > 0;
                    const statusText = isLengkap
                      ? `[✓ Lengkap: ${count}/${siswaList.length}]`
                      : count > 0
                      ? `[⚠ Sebagian: ${count}/${siswaList.length}]`
                      : `[○ Belum Diisi]`;

                    return (
                      <option key={m.id} value={m.id}>
                        {m.kode} — {m.nama} {statusText} {m.guruNama ? `(Guru: ${m.guruNama})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition-all shadow-2xs active:scale-95"
            >
              <FileDownIcon className="h-4 w-4 text-emerald-700" />
              Download Format Excel ({selectedMapel?.kode || "Mapel"} • {siswaList.length} Siswa)
            </button>
            <p className="text-[10px] text-zinc-400 text-center font-mono truncate">
              {selectedMapel?.kode}_Kelas_{kelasNama.replace(/[^a-zA-Z0-9]/g, "")}_TA_{tahunAjaran.replace("/", "-")}_Sem_{semester}.xlsx
            </p>
          </div>
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
              Unggah file spreadsheet (`.xlsx` atau `.csv`). Sistem akan <strong>mendeteksi mapel secara otomatis dari awalan nama file</strong> dan mencocokkan nilai berdasarkan NISN.
            </p>

            {/* Aturan Wajib Awalan Nama File */}
            <div className="mt-3 p-3 rounded-xl bg-sky-50/80 border border-sky-200/80 text-[11px] text-sky-950 flex items-start gap-2">
              <AlertCircleIcon className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-sky-900">Aturan Nama File Wajib:</strong>
                <span className="text-sky-900/90 leading-relaxed">
                  Nama file wajib diawali kode mapel (contoh: <code className="font-mono bg-sky-100/90 px-1 py-0.5 rounded font-semibold text-sky-900">BIN_Kelas_{kelasNama}.xlsx</code> atau <code className="font-mono bg-sky-100/90 px-1 py-0.5 rounded font-semibold text-sky-900">IPAS_Kelas_{kelasNama}.xlsx</code>). File dengan nama yang tidak sesuai awalan kode mapel akan otomatis ditolak.
                </span>
              </div>
            </div>

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
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900 font-poppins">
                  Pratinjau Hasil Pembacaan Excel
                </h3>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {selectedMapel?.kode}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                Target Mapel: <strong className="text-zinc-900 font-semibold">{selectedMapel?.nama}</strong> • Guru: {selectedMapel?.guruNama || "Wali Kelas"}
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
                onClick={() => setShowConfirmModal(true)}
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
