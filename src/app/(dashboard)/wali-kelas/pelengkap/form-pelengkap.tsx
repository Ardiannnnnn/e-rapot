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
  XCircleIcon,
  ClockIcon,
  SlidersHorizontalIcon,
} from "@/components/shared/icons";
import {
  simpanPelengkapAction,
  simpanBulkPresensiAction,
  simpanBulkEkskulAction,
  simpanBulkKokurikulerAction,
  simpanBulkKebiasaanAction,
  simpanBulkKenaikanAction,
  EkskulItem,
  KokurikulerItem,
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
  kokurikuler: KokurikulerItem[];
  kebiasaanKarakter: string;
  statusKenaikan: string;
  isPresensiSaved?: boolean;
  isEkskulSaved?: boolean;
  isKokurikulerSaved?: boolean;
  isKebiasaanSaved?: boolean;
  isKenaikanSaved?: boolean;
}

interface TemplateOptionItem {
  id: string;
  judul?: string | null;
  teks: string;
}

interface FormPelengkapProps {
  kelasId?: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  initialSiswaList: SiswaPelengkapItem[];
  initialTemplates?: {
    temaP5: TemplateOptionItem[];
    kebiasaan: TemplateOptionItem[];
    saranWali: TemplateOptionItem[];
    ekskul?: TemplateOptionItem[];
  };
}

const DEFAULT_TEMA_P5 = [
  "Tema 1 : Kreasi Nusantara ( Membuat Batik Sederhana )",
  "Tema 2 : Peduli Terhadap Lingkungan Sekitar ( Mengolah Sampah Organik Dan Non Organik )",
  "Tema 3 : Bangunlah Jiwa Dan Raganya ( Menanam Tanaman Obat Keluarga )",
];

const DEFAULT_KEBIASAAN_OPTIONS = [
  "Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat",
  "Terbiasa dalam bangun pagi, beribadah tepat waktu, serta gemar membaca buku",
  "Terbiasa dalam menjaga kebersihan lingkungan dan membantu sesama teman",
  "Terbiasa dalam berolahraga teratur dan mengonsumsi makanan sehat bergizi",
  "Terbiasa dalam bertutur kata santun dan menghormati bapak/ibu guru",
];

const DEFAULT_SARAN_OPTIONS = [
  "Alhamdulillah sikap dan pengetahuan Ananda sudah baik. Kembangkan potensi yang dimiliki karena intan tidak akan dinilai tanpa diasah.",
  "Ananda menunjukkan perkembangan karakter yang sangat baik, memiliki rasa empati tinggi, serta aktif berkolaborasi.",
  "Pertahankan semangat belajar dan ketekunan ananda. Terus kembangkan rasa ingin tahu serta kreativitas yang luar biasa.",
  "Ananda memiliki potensi kepemimpinan yang baik. Diharapkan terus konsisten dalam meningkatkan kedisiplinan dan fokus belajar.",
  "Tingkatkan lagi kemandirian dalam menyelesaikan tugas. Terus percaya diri dalam mengemukakan pendapat di kelas.",
];

const DEFAULT_EKSKUL_OPTIONS = [
  "Pramuka",
  "Palang Merah Remaja (PMR) / UKS",
  "Seni Tari",
  "Seni Musik / Drumband",
  "Sepak Bola / Futsal",
  "Bulu Tangkis",
  "Pencak Silat",
  "Tahfidz Al-Qur'an",
  "Seni Lukis / Gambar",
  "Dokter Kecil",
  "Klub Bahasa Inggris",
];

export default function FormPelengkapClient({
  kelasId,
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  initialSiswaList,
  initialTemplates,
}: FormPelengkapProps) {
  const [activeTab, setActiveTab] = useState<
    "PRESENSI" | "EKSKUL" | "KOKURIKULER" | "KEBIASAAN" | "KENAIKAN"
  >("PRESENSI");
  const [siswaList, setSiswaList] = useState<SiswaPelengkapItem[]>(initialSiswaList);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Kumpulan opsi kebiasaan, saran & ekskul (ditarik dari Master Deskripsi atau default)
  const [opsiKebiasaanList, setOpsiKebiasaanList] = useState<string[]>(() => {
    if (initialTemplates?.kebiasaan && initialTemplates.kebiasaan.length > 0) {
      return initialTemplates.kebiasaan.map((k) => k.teks);
    }
    return DEFAULT_KEBIASAAN_OPTIONS;
  });

  const [opsiSaranList, setOpsiSaranList] = useState<string[]>(() => {
    if (initialTemplates?.saranWali && initialTemplates.saranWali.length > 0) {
      return initialTemplates.saranWali.map((s) => s.teks);
    }
    return DEFAULT_SARAN_OPTIONS;
  });

  const [opsiEkskulList, setOpsiEkskulList] = useState<string[]>(() => {
    if (initialTemplates?.ekskul && initialTemplates.ekskul.length > 0) {
      return initialTemplates.ekskul.map((e) => e.teks);
    }
    return DEFAULT_EKSKUL_OPTIONS;
  });

  // Modal Picker State untuk 7 Kebiasaan
  const [kebiasaanModalSiswaId, setKebiasaanModalSiswaId] = useState<string | null>(null);
  // Modal Picker State untuk Saran Wali
  const [saranModalSiswaId, setSaranModalSiswaId] = useState<string | null>(null);


  // State untuk Tema Kokurikuler Kelas (Dikelola di Master Deskripsi)
  const [temaList, setTemaList] = useState<string[]>(() => {
    if (initialTemplates?.temaP5 && initialTemplates.temaP5.length > 0) {
      return initialTemplates.temaP5.map((t) => t.teks);
    }
    if (initialSiswaList[0]?.kokurikuler && initialSiswaList[0].kokurikuler.length > 0) {
      return initialSiswaList[0].kokurikuler.map((k) => k.tema);
    }
    return DEFAULT_TEMA_P5;
  });

  const isSemesterGenap = semester === 2;
  const isKelasAkhir = tingkat === 6;

  // Update attendance field
  const handlePresensiChange = (
    siswaId: string,
    field: "sakit" | "izin" | "alpa",
    val: number
  ) => {
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId
          ? { ...s, [field]: Math.max(0, val || 0), isPresensiSaved: false }
          : s
      )
    );
  };

  // Update Catatan Wali
  const handleCatatanChange = (siswaId: string, text: string) => {
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId ? { ...s, catatanWali: text, isPresensiSaved: false } : s
      )
    );
  };

  // Update Kebiasaan Karakter
  const handleKebiasaanChange = (siswaId: string, text: string) => {
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId
          ? { ...s, kebiasaanKarakter: text, isKebiasaanSaved: false }
          : s
      )
    );
  };

  // Update Status Kenaikan
  const handleStatusKenaikanChange = (siswaId: string, val: string) => {
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId ? { ...s, statusKenaikan: val, isKenaikanSaved: false } : s
      )
    );
  };

  // Bulk Set Kenaikan
  const handleBulkSetKenaikan = (val: string) => {
    setSiswaList((prev) =>
      prev.map((s) => ({ ...s, statusKenaikan: val, isKenaikanSaved: false }))
    );
    setMessage({
      type: "success",
      text: `Status ${val} diterapkan ke seluruh siswa. Klik 'Simpan Status Kenaikan' untuk menyimpan.`,
    });
  };

  // Simpan Bulk Presensi
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
      setSiswaList((prev) =>
        prev.map((s) => ({
          ...s,
          isPresensiSaved: true,
        }))
      );
      setMessage({ type: "success", text: res.message });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Simpan Bulk Kebiasaan
  const handleBulkSaveKebiasaan = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    const items = siswaList.map((s) => {
      const val =
        s.kebiasaanKarakter ||
        `${s.nama.toUpperCase()} Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat`;
      return {
        siswaId: s.id,
        kebiasaanKarakter: val,
      };
    });

    const res = await simpanBulkKebiasaanAction({
      tahunAjaran,
      semester,
      items,
    });

    setIsBulkSaving(false);
    if (res.success) {
      setSiswaList((prev) =>
        prev.map((s) => {
          const val =
            s.kebiasaanKarakter ||
            `${s.nama.toUpperCase()} Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat`;
          return {
            ...s,
            kebiasaanKarakter: val,
            isKebiasaanSaved: true,
          };
        })
      );
      setMessage({ type: "success", text: res.message });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Simpan Bulk Kenaikan
  const handleBulkSaveKenaikan = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    const items = siswaList.map((s) => ({
      siswaId: s.id,
      statusKenaikan: s.statusKenaikan || (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${tingkat + 1}`),
    }));

    const res = await simpanBulkKenaikanAction({
      tahunAjaran,
      semester,
      items,
    });

    setIsBulkSaving(false);
    if (res.success) {
      setSiswaList((prev) =>
        prev.map((s) => ({
          ...s,
          statusKenaikan: s.statusKenaikan || (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${tingkat + 1}`),
          isKenaikanSaved: true,
        }))
      );
      setMessage({ type: "success", text: res.message });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Simpan Bulk Kokurikuler (P5)
  const handleBulkSaveKokurikuler = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    const items = siswaList.map((s) => {
      const kokur = temaList.map((t, idx) => {
        const existing = s.kokurikuler.find((k) => k.tema === t) || s.kokurikuler[idx];
        const desc =
          existing?.deskripsi ||
          `${s.nama.toUpperCase()} Sangat Baik dalam keimanan dan ketakwaan terhadap Tuhan YME dan Perlu Bimbingan dalam kesehatan pada kegiatan ${t.replace(/Tema \d+ : /, "").trim()}`;
        return {
          tema: t,
          deskripsi: desc,
        };
      });

      return {
        siswaId: s.id,
        kokurikuler: kokur,
      };
    });

    const res = await simpanBulkKokurikulerAction({
      tahunAjaran,
      semester,
      items,
    });

    setIsBulkSaving(false);
    if (res.success) {
      setSiswaList((prev) =>
        prev.map((s) => {
          const savedItem = items.find((it) => it.siswaId === s.id);
          return {
            ...s,
            kokurikuler: savedItem ? savedItem.kokurikuler : s.kokurikuler,
            isKokurikulerSaved: true,
          };
        })
      );
      setMessage({ type: "success", text: res.message });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Simpan Bulk Ekstrakurikuler
  const handleBulkSaveEkskul = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    const res = await simpanBulkEkskulAction({
      tahunAjaran,
      semester,
      items: siswaList.map((s) => ({
        siswaId: s.id,
        ekskul: s.ekskul,
      })),
    });

    setIsBulkSaving(false);
    if (res.success) {
      setSiswaList((prev) =>
        prev.map((s) => ({
          ...s,
          isEkskulSaved: true,
        }))
      );
      setMessage({ type: "success", text: res.message });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Ekskul Handler
  const handleAddEkskul = (siswaId: string) => {
    setSiswaList((prev) =>
      prev.map((s) => {
        if (s.id !== siswaId) return s;
        const existingNames = s.ekskul.map((e) => e.nama);
        const firstAvailable =
          opsiEkskulList.find((opt) => !existingNames.includes(opt)) ||
          opsiEkskulList[0] ||
          "Pramuka";
        return {
          ...s,
          ekskul: [...s.ekskul, { nama: firstAvailable, predikat: "Baik" }],
          isEkskulSaved: false,
        };
      })
    );
  };

  const handleUpdateEkskul = (
    siswaId: string,
    idx: number,
    field: keyof EkskulItem,
    val: string
  ) => {
    setSiswaList((prev) =>
      prev.map((s) => {
        if (s.id !== siswaId) return s;
        const next = [...s.ekskul];
        next[idx] = { ...next[idx], [field]: val };
        return { ...s, ekskul: next, isEkskulSaved: false };
      })
    );
  };

  const handleDeleteEkskul = (siswaId: string, idx: number) => {
    setSiswaList((prev) =>
      prev.map((s) => {
        if (s.id !== siswaId) return s;
        return { ...s, ekskul: s.ekskul.filter((_, i) => i !== idx), isEkskulSaved: false };
      })
    );
  };

  // Simpan Individual Siswa (Hanya simpan 1 row siswa ini ke server, hemat beban database)
  const handleSaveIndividual = async (siswa: SiswaPelengkapItem) => {
    setLoadingId(siswa.id);
    setMessage(null);

    const kokur = temaList.map((t, idx) => {
      const existing = siswa.kokurikuler.find((k) => k.tema === t) || siswa.kokurikuler[idx];
      const desc =
        existing?.deskripsi ||
        `${siswa.nama.toUpperCase()} Sangat Baik dalam keimanan dan ketakwaan terhadap Tuhan YME dan Perlu Bimbingan dalam kesehatan pada kegiatan ${t.replace(/Tema \d+ : /, "").trim()}`;
      return {
        tema: t,
        deskripsi: desc,
      };
    });

    const kebiasaan =
      siswa.kebiasaanKarakter ||
      `${siswa.nama.toUpperCase()} Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat`;

    const statusKenaikan =
      siswa.statusKenaikan || (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${tingkat + 1}`);

    const res = await simpanPelengkapAction({
      siswaId: siswa.id,
      tahunAjaran,
      semester,
      sakit: siswa.sakit,
      izin: siswa.izin,
      alpa: siswa.alpa,
      catatanWali: siswa.catatanWali,
      ekskul: siswa.ekskul,
      kokurikuler: kokur,
      kebiasaanKarakter: kebiasaan,
      statusKenaikan,
    });

    setLoadingId(null);
    if (res.success) {
      setSiswaList((prev) =>
        prev.map((s) =>
          s.id === siswa.id
            ? {
                ...s,
                kokurikuler: kokur,
                kebiasaanKarakter: kebiasaan,
                statusKenaikan,
                isPresensiSaved: true,
                isEkskulSaved: true,
                isKokurikulerSaved: true,
                isKebiasaanSaved: true,
                isKenaikanSaved: true,
              }
            : s
        )
      );
      setMessage({
        type: "success",
        text: `Data ${siswa.nama} berhasil disimpan ke database!`,
      });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Hitung jumlah siswa tersimpan untuk indikator status
  const presensiSavedCount = siswaList.filter((s) => s.isPresensiSaved).length;
  const ekskulSavedCount = siswaList.filter((s) => s.isEkskulSaved).length;
  const kokurikulerSavedCount = siswaList.filter((s) => s.isKokurikulerSaved).length;
  const kebiasaanSavedCount = siswaList.filter((s) => s.isKebiasaanSaved).length;
  const kenaikanSavedCount = siswaList.filter((s) => s.isKenaikanSaved && s.statusKenaikan).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
                Kelas {kelasNama} • Tingkat {tingkat}
              </span>
              <span className="text-emerald-400">•</span>
              <span className="text-xs text-emerald-200 font-mono">
                TA {tahunAjaran} Semester {semester === 1 ? "Ganjil" : "Genap"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
              Data Pelengkap Rapor Kurikulum Merdeka
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Kelola presensi, ekstrakurikuler, tema kokurikuler P5 yang dinamis, 7 kebiasaan anak indonesia hebat,
              catatan saran wali, dan status kenaikan kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              href="/wali-kelas/master-deskripsi"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all shadow-xs"
            >
              <SparklesIcon className="h-4 w-4 text-emerald-300" />
              Kelola Master Deskripsi
            </Link>
            <Link
              href="/wali-kelas/cetak"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <PrinterIcon className="h-4 w-4" />
              Lihat Cetak Rapor
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Notifikasi */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2Icon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{message.text}</div>
          <button
            onClick={() => setMessage(null)}
            className="text-zinc-400 hover:text-zinc-600 p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}



      {/* Tab Navigasi 5 Bagian */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("PRESENSI")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "PRESENSI"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
          }`}
        >
          <span>1. Presensi & Saran Wali</span>
          {presensiSavedCount === siswaList.length ? (
            <span
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                activeTab === "PRESENSI"
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              ✓
            </span>
          ) : (
            <span
              className={`inline-flex items-center justify-center px-1.5 h-4 rounded-full text-[9px] font-bold ${
                activeTab === "PRESENSI"
                  ? "bg-rose-400 text-rose-950"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {presensiSavedCount}/{siswaList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EKSKUL")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "EKSKUL"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
          }`}
        >
          <span>2. Ekstrakurikuler</span>
          {ekskulSavedCount === siswaList.length ? (
            <span
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                activeTab === "EKSKUL"
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              ✓
            </span>
          ) : (
            <span
              className={`inline-flex items-center justify-center px-1.5 h-4 rounded-full text-[9px] font-bold ${
                activeTab === "EKSKUL"
                  ? "bg-stone-300 text-zinc-800"
                  : "bg-stone-200 text-zinc-700"
              }`}
            >
              {ekskulSavedCount}/{siswaList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("KOKURIKULER")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "KOKURIKULER"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
          }`}
        >
          <span>3. Kokurikuler (Projek P5) ({temaList.length} Tema)</span>
          {kokurikulerSavedCount === siswaList.length ? (
            <span
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                activeTab === "KOKURIKULER"
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              ✓
            </span>
          ) : (
            <span
              className={`inline-flex items-center justify-center px-1.5 h-4 rounded-full text-[9px] font-bold ${
                activeTab === "KOKURIKULER"
                  ? "bg-rose-400 text-rose-950"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {kokurikulerSavedCount}/{siswaList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("KEBIASAAN")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "KEBIASAAN"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
          }`}
        >
          <span>4. 7 Kebiasaan Anak Hebat</span>
          {kebiasaanSavedCount === siswaList.length ? (
            <span
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                activeTab === "KEBIASAAN"
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              ✓
            </span>
          ) : (
            <span
              className={`inline-flex items-center justify-center px-1.5 h-4 rounded-full text-[9px] font-bold ${
                activeTab === "KEBIASAAN"
                  ? "bg-rose-400 text-rose-950"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {kebiasaanSavedCount}/{siswaList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("KENAIKAN")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "KENAIKAN"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
          }`}
        >
          <span>5. Kenaikan / Kelulusan {isSemesterGenap ? "(Aktif)" : "(Semester Genap)"}</span>
          {kenaikanSavedCount === siswaList.length ? (
            <span
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                activeTab === "KENAIKAN"
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              ✓
            </span>
          ) : (
            <span
              className={`inline-flex items-center justify-center px-1.5 h-4 rounded-full text-[9px] font-bold ${
                activeTab === "KENAIKAN"
                  ? "bg-amber-400 text-amber-950"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {kenaikanSavedCount}/{siswaList.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRESENSI & SARAN WALI */}
      {/* ========================================================================= */}
      {activeTab === "PRESENSI" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                Rekap Presensi & Saran Wali Kelas
              </h3>
              <p className="text-xs text-zinc-500">
                Isi jumlah hari sakit, izin, alpa, serta catatan pembinaan karakter peserta didik.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold shadow-2xs">
                {presensiSavedCount === siswaList.length ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                    Semua Tersimpan ({presensiSavedCount}/{siswaList.length})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600">
                    <XCircleIcon className="h-4 w-4 text-rose-500" />
                    {siswaList.length - presensiSavedCount} Belum Disimpan
                  </span>
                )}
              </div>
              <Link
                href="/wali-kelas/master-deskripsi"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white text-zinc-700 text-xs font-semibold hover:bg-stone-50 transition"
              >
                <SlidersHorizontalIcon className="h-3.5 w-3.5 text-zinc-500" />
                Kelola Opsi Saran di Master
              </Link>
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={handleBulkSavePresensi}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {isBulkSaving ? "Menyimpan..." : "Simpan Semua Presensi"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-zinc-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-60">Nama Siswa</th>
                  <th className="py-3 px-2 w-20 text-center">Sakit</th>
                  <th className="py-3 px-2 w-20 text-center">Izin</th>
                  <th className="py-3 px-2 w-20 text-center">Alpa</th>
                  <th className="py-3 px-4">Saran-saran / Catatan Wali Kelas</th>
                  <th className="py-3 px-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {siswaList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 text-center font-mono font-medium text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{s.nama}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        NISN: {s.nisn} • NIS: {s.nis}
                      </p>
                      <div className="mt-1.5">
                        {s.isPresensiSaved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                            Sudah Disimpan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircleIcon className="h-3 w-3 text-rose-500" />
                            Belum Disimpan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        value={s.sakit}
                        onChange={(e) =>
                          handlePresensiChange(s.id, "sakit", parseInt(e.target.value))
                        }
                        className="w-full text-center py-1.5 px-1 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        value={s.izin}
                        onChange={(e) =>
                          handlePresensiChange(s.id, "izin", parseInt(e.target.value))
                        }
                        className="w-full text-center py-1.5 px-1 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        value={s.alpa}
                        onChange={(e) =>
                          handlePresensiChange(s.id, "alpa", parseInt(e.target.value))
                        }
                        className="w-full text-center py-1.5 px-1 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={s.catatanWali}
                          placeholder="Tulis saran pembinaan..."
                          onChange={(e) => handleCatatanChange(s.id, e.target.value)}
                          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSaranModalSiswaId(s.id)}
                            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <span>📋</span> Pilih dari Opsi Saran Lengkap ({opsiSaranList.length} Pilihan)
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center align-middle">
                      <button
                        type="button"
                        disabled={loadingId === s.id}
                        onClick={() => handleSaveIndividual(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                          s.isPresensiSaved
                            ? "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                            : "bg-[#1b4332] text-white hover:bg-[#143225]"
                        } disabled:opacity-50`}
                        title="Simpan data siswa ini saja"
                      >
                        {loadingId === s.id ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <SaveIcon className="h-3.5 w-3.5" />
                        )}
                        <span>Simpan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EKSTRAKURIKULER */}
      {/* ========================================================================= */}
      {activeTab === "EKSKUL" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                Daftar Ekstrakurikuler & Predikat
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Pilih kegiatan ekstrakurikuler yang diikuti siswa dari master dan tentukan predikat nilainya.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/wali-kelas/master-deskripsi"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition shadow-2xs"
              >
                <span>⚙️</span> Kelola Pilihan Ekskul di Master ({opsiEkskulList.length} Pilihan)
              </Link>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold shadow-2xs">
                {ekskulSavedCount === siswaList.length ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                    Semua Tersimpan ({ekskulSavedCount}/{siswaList.length})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-zinc-700">
                    <ClockIcon className="h-4 w-4 text-zinc-500" />
                    {ekskulSavedCount}/{siswaList.length} Siswa Tersimpan
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={handleBulkSaveEkskul}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {isBulkSaving ? "Menyimpan..." : "Simpan Semua Ekskul"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {siswaList.map((s, idx) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div>
                    <h4 className="font-bold text-zinc-900 text-xs">
                      {idx + 1}. {s.nama}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono">NISN: {s.nisn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.isEkskulSaved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                        Sudah Disimpan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircleIcon className="h-3 w-3 text-rose-500" />
                        Belum Disimpan
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddEkskul(s.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
                    >
                      <PlusIcon className="h-3 w-3" /> Tambah
                    </button>
                  </div>
                </div>

                {s.ekskul.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2 text-center">
                    Belum ada ekstrakurikuler yang diikuti.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {s.ekskul.map((e, eIdx) => (
                      <div key={eIdx} className="flex items-center gap-2">
                        <select
                          value={e.nama}
                          onChange={(ev) =>
                            handleUpdateEkskul(s.id, eIdx, "nama", ev.target.value)
                          }
                          className="flex-1 p-2 border border-stone-300 rounded-lg text-xs font-semibold bg-white text-zinc-900 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="" disabled>-- Pilih Ekstrakurikuler --</option>
                          {e.nama && !opsiEkskulList.includes(e.nama) && (
                            <option value={e.nama}>{e.nama} (Kustom)</option>
                          )}
                          {opsiEkskulList.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <select
                          value={e.predikat}
                          onChange={(ev) =>
                            handleUpdateEkskul(
                              s.id,
                              eIdx,
                              "predikat",
                              ev.target.value as any
                            )
                          }
                          className="w-32 p-2 border border-stone-300 rounded-lg text-xs font-semibold bg-white text-zinc-900 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Sangat Baik">Sangat Baik</option>
                          <option value="Baik">Baik</option>
                          <option value="Cukup">Cukup</option>
                          <option value="Kurang">Kurang</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteEkskul(s.id, eIdx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Ekstrakurikuler"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={loadingId === s.id}
                    onClick={() => handleSaveIndividual(s)}
                    className="px-3 py-1.5 rounded-lg bg-[#1b4332] text-white text-[11px] font-semibold hover:bg-[#143225] transition"
                  >
                    {loadingId === s.id ? "Menyimpan..." : "Simpan Siswa Ini"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KOKURIKULER (P5) - DINAMIS TAMBAH/HAPUS TEMA */}
      {/* ========================================================================= */}
      {activeTab === "KOKURIKULER" && (
        <div className="space-y-4">
          {/* Box Pengaturan Tema Projek Semester Dinamis */}
          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-emerald-950 font-poppins">
                  Tema Kokurikuler (Projek P5) Kelas {kelasNama}
                </h3>
                <p className="text-xs text-emerald-800">
                  Daftar tema projek aktif semester ini. Penambahan, penghapusan, atau perubahan tema dikelola melalui menu Master Deskripsi Rapor.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold shadow-2xs">
                  {kokurikulerSavedCount === siswaList.length ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                      Semua Siswa Tersimpan ({kokurikulerSavedCount}/{siswaList.length})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <XCircleIcon className="h-4 w-4 text-rose-500" />
                      {siswaList.length - kokurikulerSavedCount} Siswa Belum Disimpan
                    </span>
                  )}
                </div>
                <Link
                  href="/wali-kelas/master-deskripsi"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 shadow-xs transition"
                >
                  <SlidersHorizontalIcon className="h-3.5 w-3.5 text-emerald-700" />
                  Kelola Tema di Master Deskripsi
                </Link>
                <button
                  type="button"
                  disabled={isBulkSaving}
                  onClick={handleBulkSaveKokurikuler}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs disabled:opacity-50"
                >
                  <SaveIcon className="h-4 w-4" />
                  {isBulkSaving ? "Menyimpan..." : "Simpan Kokurikuler Seluruh Siswa"}
                </button>
              </div>
            </div>

            {/* List Tema Aktif (Read-Only Badges) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {temaList.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-2xs flex items-start gap-3"
                >
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono shrink-0 mt-0.5">
                    Tema {idx + 1}
                  </span>
                  <div className="text-xs font-semibold text-zinc-800 leading-snug">
                    {t}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* List Siswa & Narasi Kokurikuler Sesuai Jumlah Tema */}
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-zinc-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-56">Nama Siswa</th>
                  <th className="py-3 px-4">Deskripsi Pencapaian Seluruh Tema Projek P5</th>
                  <th className="py-3 px-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {siswaList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 text-center font-mono font-medium text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{s.nama}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">NISN: {s.nisn}</p>
                      <div className="mt-1.5">
                        {s.isKokurikulerSaved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                            Sudah Disimpan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircleIcon className="h-3 w-3 text-rose-500" />
                            Belum Disimpan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-2.5">
                        {temaList.map((t, tIdx) => {
                          const existing =
                            s.kokurikuler.find((k) => k.tema === t) || s.kokurikuler[tIdx];
                          const val =
                            existing?.deskripsi ||
                            `${s.nama.toUpperCase()} Sangat Baik dalam keimanan dan ketakwaan terhadap Tuhan YME dan Perlu Bimbingan dalam kesehatan pada kegiatan ${t.replace(/Tema \d+ : /, "").trim()}`;

                          return (
                            <div key={tIdx} className="space-y-1 bg-stone-50/40 p-2 rounded-xl border border-stone-200">
                              <span className="text-[11px] font-bold text-zinc-800 block">
                                {t}
                              </span>
                              <textarea
                                rows={2}
                                value={val}
                                onChange={(e) => {
                                  const nextKokur = [...s.kokurikuler];
                                  nextKokur[tIdx] = {
                                    tema: t,
                                    deskripsi: e.target.value,
                                  };
                                  setSiswaList((prev) =>
                                    prev.map((item) =>
                                      item.id === s.id
                                        ? { ...item, kokurikuler: nextKokur, isKokurikulerSaved: false }
                                        : item
                                    )
                                  );
                                }}
                                className="w-full p-2 border border-stone-300 rounded-lg text-xs leading-relaxed bg-white"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center align-top pt-4">
                      <button
                        type="button"
                        disabled={loadingId === s.id}
                        onClick={() => handleSaveIndividual(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                          s.isKokurikulerSaved
                            ? "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                            : "bg-[#1b4332] text-white hover:bg-[#143225]"
                        } disabled:opacity-50`}
                        title="Simpan kokurikuler siswa ini saja"
                      >
                        {loadingId === s.id ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <SaveIcon className="h-3.5 w-3.5" />
                        )}
                        <span>Simpan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 7 KEBIASAAN ANAK HEBAT - DENGAN DROPDOWN / MODAL KETERANGAN LENGKAP */}
      {/* ========================================================================= */}
      {activeTab === "KEBIASAAN" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                7 Kebiasaan Anak Indonesia Hebat
              </h3>
              <p className="text-xs text-zinc-500">
                Pilih atau ketik narasi pembiasaan karakter positif anak. Klik tombol opsi untuk melihat deskripsi lengkap.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold shadow-2xs">
                {kebiasaanSavedCount === siswaList.length ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                    Semua Siswa Tersimpan ({kebiasaanSavedCount}/{siswaList.length})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600">
                    <XCircleIcon className="h-4 w-4 text-rose-500" />
                    {siswaList.length - kebiasaanSavedCount} Belum Disimpan
                  </span>
                )}
              </div>
              <Link
                href="/wali-kelas/master-deskripsi"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white text-zinc-700 text-xs font-semibold hover:bg-stone-50 transition"
              >
                <SlidersHorizontalIcon className="h-3.5 w-3.5 text-zinc-500" />
                Kelola Opsi Kebiasaan di Master
              </Link>
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={handleBulkSaveKebiasaan}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {isBulkSaving ? "Menyimpan..." : "Simpan Semua Kebiasaan"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-zinc-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-60">Nama Siswa</th>
                  <th className="py-3 px-4">Deskripsi 7 Kebiasaan Anak Indonesia Hebat</th>
                  <th className="py-3 px-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {siswaList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 text-center font-mono font-medium text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{s.nama}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">NISN: {s.nisn}</p>
                      <div className="mt-1.5">
                        {s.isKebiasaanSaved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                            Sudah Disimpan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircleIcon className="h-3 w-3 text-rose-500" />
                            Belum Disimpan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={
                            s.kebiasaanKarakter ||
                            `${s.nama.toUpperCase()} Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat`
                          }
                          onChange={(e) => handleKebiasaanChange(s.id, e.target.value)}
                          className="w-full p-2 border border-stone-300 rounded-lg text-xs leading-relaxed"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setKebiasaanModalSiswaId(s.id)}
                            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <span>✨</span> Pilih dari Opsi Kebiasaan Lengkap ({opsiKebiasaanList.length} Pilihan)
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center align-top pt-4">
                      <button
                        type="button"
                        disabled={loadingId === s.id}
                        onClick={() => handleSaveIndividual(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                          s.isKebiasaanSaved
                            ? "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                            : "bg-[#1b4332] text-white hover:bg-[#143225]"
                        } disabled:opacity-50`}
                        title="Simpan kebiasaan siswa ini saja"
                      >
                        {loadingId === s.id ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <SaveIcon className="h-3.5 w-3.5" />
                        )}
                        <span>Simpan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: KENAIKAN KELAS / KELULUSAN */}
      {/* ========================================================================= */}
      {activeTab === "KENAIKAN" && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-amber-950 font-poppins">
                  Keputusan {isKelasAkhir ? "Kelulusan (Tingkat Akhir)" : "Kenaikan Kelas"}
                </h3>
                <p className="text-xs text-amber-800">
                  {isSemesterGenap
                    ? "Semester Genap aktif: Status ini akan langsung dicetak pada Lembar 2 Rapor."
                    : "Perhatian: Saat ini sedang Semester Ganjil (1). Kotak kenaikan kelas otomatis disembunyikan pada cetak rapor semester ganjil."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold shadow-2xs">
                  {kenaikanSavedCount === siswaList.length ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                      Semua Siswa Tersimpan ({kenaikanSavedCount}/{siswaList.length})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-800">
                      <XCircleIcon className="h-4 w-4 text-amber-600" />
                      {siswaList.length - kenaikanSavedCount} Belum Disimpan
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isBulkSaving}
                  onClick={handleBulkSaveKenaikan}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs disabled:opacity-50"
                >
                  <SaveIcon className="h-4 w-4" />
                  {isBulkSaving ? "Menyimpan..." : "Simpan Status Kenaikan"}
                </button>
              </div>
            </div>

            {/* Tombol Aksi Cepat Bulk */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60">
              <span className="text-xs font-semibold text-amber-900">Aksi Cepat:</span>
              {isKelasAkhir ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleBulkSetKenaikan("LULUS")}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold transition"
                  >
                    Set Semua Lulus
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetKenaikan("TIDAK LULUS")}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg font-semibold transition"
                  >
                    Set Semua Tidak Lulus
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleBulkSetKenaikan(`Naik ke Kelas ${tingkat + 1}`)
                    }
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold transition"
                  >
                    Set Semua Naik ke Kelas {tingkat + 1}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleBulkSetKenaikan(`Tinggal di Kelas ${tingkat}`)
                    }
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg font-semibold transition"
                  >
                    Set Semua Tinggal Kelas
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-zinc-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-72">Nama Siswa</th>
                  <th className="py-3 px-4">
                    Status {isKelasAkhir ? "Kelulusan" : "Kenaikan Kelas"}
                  </th>
                  <th className="py-3 px-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {siswaList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 text-center font-mono font-medium text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{s.nama}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">NISN: {s.nisn}</p>
                      <div className="mt-1.5">
                        {s.isKenaikanSaved && s.statusKenaikan ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                            Sudah Disimpan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircleIcon className="h-3 w-3 text-rose-500" />
                            Belum Disimpan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={
                          s.statusKenaikan ||
                          (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${tingkat + 1}`)
                        }
                        onChange={(e) =>
                          handleStatusKenaikanChange(s.id, e.target.value)
                        }
                        className="w-72 p-2 border border-stone-300 rounded-lg text-xs font-bold text-zinc-900 bg-white focus:ring-1 focus:ring-emerald-500"
                      >
                        {isKelasAkhir ? (
                          <>
                            <option value="LULUS">LULUS</option>
                            <option value="TIDAK LULUS">TIDAK LULUS</option>
                          </>
                        ) : (
                          <>
                            <option value={`Naik ke Kelas ${tingkat + 1}`}>
                              Naik ke Kelas {tingkat + 1}
                            </option>
                            <option value={`Tinggal di Kelas ${tingkat}`}>
                              Tinggal di Kelas {tingkat}
                            </option>
                          </>
                        )}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-center align-middle">
                      <button
                        type="button"
                        disabled={loadingId === s.id}
                        onClick={() => handleSaveIndividual(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                          s.isKenaikanSaved
                            ? "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                            : "bg-[#1b4332] text-white hover:bg-[#143225]"
                        } disabled:opacity-50`}
                        title="Simpan status kenaikan siswa ini saja"
                      >
                        {loadingId === s.id ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <SaveIcon className="h-3.5 w-3.5" />
                        )}
                        <span>Simpan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PICKER: 7 KEBIASAAN ANAK HEBAT (DENGAN TEKS LENGKAP) */}
      {/* ========================================================================= */}
      {kebiasaanModalSiswaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                  Pilih Opsi 7 Kebiasaan Anak Indonesia Hebat
                </h3>
                <p className="text-xs text-zinc-500">
                  Untuk: <strong>{siswaList.find((s) => s.id === kebiasaanModalSiswaId)?.nama}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKebiasaanModalSiswaId(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {opsiKebiasaanList.map((opsi, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const s = siswaList.find((item) => item.id === kebiasaanModalSiswaId);
                    if (s) {
                      handleKebiasaanChange(s.id, `${s.nama.toUpperCase()} ${opsi}`);
                    }
                    setKebiasaanModalSiswaId(null);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition flex items-start gap-3 group"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                    {idx + 1}
                  </span>
                  <div className="text-xs text-zinc-800 leading-relaxed group-hover:text-emerald-950 font-medium">
                    {opsi}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <Link
                href="/wali-kelas/master-deskripsi"
                className="text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1.5"
              >
                <SlidersHorizontalIcon className="h-3.5 w-3.5" />
                Kelola Pilihan Opsi di Master Deskripsi
              </Link>
              <button
                type="button"
                onClick={() => setKebiasaanModalSiswaId(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PICKER: SARAN-SARAN / CATATAN WALI (DENGAN TEKS LENGKAP) */}
      {/* ========================================================================= */}
      {saranModalSiswaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                  Pilih Opsi Saran-saran & Catatan Pembinaan
                </h3>
                <p className="text-xs text-zinc-500">
                  Untuk: <strong>{siswaList.find((s) => s.id === saranModalSiswaId)?.nama}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSaranModalSiswaId(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {opsiSaranList.map((opsi, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const s = siswaList.find((item) => item.id === saranModalSiswaId);
                    if (s) {
                      handleCatatanChange(s.id, opsi);
                    }
                    setSaranModalSiswaId(null);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition flex items-start gap-3 group"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                    {idx + 1}
                  </span>
                  <div className="text-xs text-zinc-800 leading-relaxed group-hover:text-emerald-950 font-medium">
                    {opsi}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <Link
                href="/wali-kelas/master-deskripsi"
                className="text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1.5"
              >
                <SlidersHorizontalIcon className="h-3.5 w-3.5" />
                Kelola Pilihan Opsi di Master Deskripsi
              </Link>
              <button
                type="button"
                onClick={() => setSaranModalSiswaId(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
