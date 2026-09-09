"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PrinterIcon,
  SlidersHorizontalIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  XIcon,
} from "@/components/shared/icons";
import {
  simpanPelengkapAction,
  simpanBulkPresensiAction,
  simpanBulkKebiasaanAction,
  simpanBulkKokurikulerAction,
  simpanBulkKenaikanAction,
  simpanBulkEkskulAction,
} from "@/actions/wali-kelas";
import {
  SiswaPelengkapItem,
  FormPelengkapProps,
  EkskulItem,
  PelengkapTab,
  PredikatEkskul,
} from "@/types/wali-kelas/pelengkap";
import {
  TabPresensi,
  TabEkskul,
  TabKokurikuler,
  TabKebiasaan,
  TabKenaikan,
  ModalPickerKebiasaan,
  ModalPickerSaran,
} from "./components";

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
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  initialSiswaList,
  initialTemplates,
}: FormPelengkapProps) {
  const [activeTab, setActiveTab] = useState<PelengkapTab>("PRESENSI");
  const [siswaList, setSiswaList] = useState<SiswaPelengkapItem[]>(initialSiswaList);
  const [savedSiswaList, setSavedSiswaList] = useState<SiswaPelengkapItem[]>(initialSiswaList);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Kumpulan opsi kebiasaan, saran & ekskul (ditarik dari Master Deskripsi atau default)
  const [opsiKebiasaanList] = useState<string[]>(() => {
    if (initialTemplates?.kebiasaan && initialTemplates.kebiasaan.length > 0) {
      return initialTemplates.kebiasaan.map((k) => k.teks);
    }
    return DEFAULT_KEBIASAAN_OPTIONS;
  });

  const [opsiSaranList] = useState<string[]>(() => {
    if (initialTemplates?.saranWali && initialTemplates.saranWali.length > 0) {
      return initialTemplates.saranWali.map((s) => s.teks);
    }
    return DEFAULT_SARAN_OPTIONS;
  });

  const [opsiEkskulList] = useState<string[]>(() => {
    if (initialTemplates?.ekskul && initialTemplates.ekskul.length > 0) {
      return initialTemplates.ekskul.map((e) => e.teks);
    }
    return DEFAULT_EKSKUL_OPTIONS;
  });

  // Modal Picker State
  const [kebiasaanModalSiswaId, setKebiasaanModalSiswaId] = useState<string | null>(null);
  const [saranModalSiswaId, setSaranModalSiswaId] = useState<string | null>(null);

  // State untuk Tema Kokurikuler Kelas (Dikelola di Master Deskripsi)
  const [temaList] = useState<string[]>(() => {
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

    try {
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
        const updater = (prev: SiswaPelengkapItem[]) =>
          prev.map((s) => ({
            ...s,
            isPresensiSaved: true,
          }));
        setSiswaList(updater);
        setSavedSiswaList(updater);
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      }
    } catch {
      setIsBulkSaving(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
    }
  };

  // Simpan Bulk Kebiasaan
  const handleBulkSaveKebiasaan = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    try {
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
        const updater = (prev: SiswaPelengkapItem[]) =>
          prev.map((s) => {
            const val =
              s.kebiasaanKarakter ||
              `${s.nama.toUpperCase()} Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat`;
            return {
              ...s,
              kebiasaanKarakter: val,
              isKebiasaanSaved: true,
            };
          });
        setSiswaList(updater);
        setSavedSiswaList(updater);
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      }
    } catch {
      setIsBulkSaving(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
    }
  };

  // Simpan Bulk Kokurikuler (P5)
  const handleBulkSaveKokurikuler = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    try {
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
        const updater = (prev: SiswaPelengkapItem[]) =>
          prev.map((s) => {
            const savedItem = items.find((it) => it.siswaId === s.id);
            return {
              ...s,
              kokurikuler: savedItem ? savedItem.kokurikuler : s.kokurikuler,
              isKokurikulerSaved: true,
            };
          });
        setSiswaList(updater);
        setSavedSiswaList(updater);
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      }
    } catch {
      setIsBulkSaving(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
    }
  };

  // Simpan Bulk Kenaikan Kelas
  const handleBulkSaveKenaikan = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    try {
      const items = siswaList.map((s) => {
        const val =
          s.statusKenaikan || (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${tingkat + 1}`);
        return {
          siswaId: s.id,
          statusKenaikan: val,
        };
      });

      const res = await simpanBulkKenaikanAction({
        tahunAjaran,
        semester,
        items,
      });

      setIsBulkSaving(false);
      if (res.success) {
        const updater = (prev: SiswaPelengkapItem[]) =>
          prev.map((s) => {
            const val =
              s.statusKenaikan || (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${tingkat + 1}`);
            return {
              ...s,
              statusKenaikan: val,
              isKenaikanSaved: true,
            };
          });
        setSiswaList(updater);
        setSavedSiswaList(updater);
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      }
    } catch {
      setIsBulkSaving(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
    }
  };

  // Simpan Bulk Ekstrakurikuler
  const handleBulkSaveEkskul = async () => {
    setIsBulkSaving(true);
    setMessage(null);

    try {
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
        const updater = (prev: SiswaPelengkapItem[]) =>
          prev.map((s) => ({
            ...s,
            isEkskulSaved: true,
          }));
        setSiswaList(updater);
        setSavedSiswaList(updater);
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      }
    } catch {
      setIsBulkSaving(false);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
    }
  };

  // Ekskul Handler
  const handleAddAndSaveEkskul = async (
    siswaId: string,
    ekskulData: { nama: string; predikat: PredikatEkskul }
  ) => {
    const student = siswaList.find((s) => s.id === siswaId);
    if (!student) return;
    const updatedStudent: SiswaPelengkapItem = {
      ...student,
      ekskul: [...student.ekskul, ekskulData],
    };
    setSiswaList((prev) =>
      prev.map((s) => (s.id === siswaId ? updatedStudent : s))
    );
    await handleSaveIndividual(updatedStudent);
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
        next[idx] = { ...next[idx], [field]: val as PredikatEkskul };
        return { ...s, ekskul: next, isEkskulSaved: false };
      })
    );
  };

  const handleDeleteAndSaveEkskul = async (siswaId: string, idx: number) => {
    const student = siswaList.find((s) => s.id === siswaId);
    if (!student) return;
    const updatedStudent: SiswaPelengkapItem = {
      ...student,
      ekskul: student.ekskul.filter((_, i) => i !== idx),
    };
    setSiswaList((prev) =>
      prev.map((s) => (s.id === siswaId ? updatedStudent : s))
    );
    await handleSaveIndividual(updatedStudent);
  };

  // Kokurikuler Handler
  const handleKokurikulerChange = (
    siswaId: string,
    temaIdx: number,
    tema: string,
    deskripsi: string
  ) => {
    setSiswaList((prev) =>
      prev.map((item) => {
        if (item.id !== siswaId) return item;
        const nextKokur = [...item.kokurikuler];
        nextKokur[temaIdx] = {
          tema,
          deskripsi,
        };
        return { ...item, kokurikuler: nextKokur, isKokurikulerSaved: false };
      })
    );
  };

  // Simpan Individual Siswa (Hanya simpan 1 row siswa ini ke server, hemat beban database)
  const handleSaveIndividual = async (siswa: SiswaPelengkapItem) => {
    setLoadingId(siswa.id);
    setMessage(null);

    try {
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
        const updater = (prev: SiswaPelengkapItem[]) =>
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
          );
        setSiswaList(updater);
        setSavedSiswaList(updater);
        setMessage({ type: "success", text: `Data ${siswa.nama} berhasil disimpan.` });
      } else {
        setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
      }
    } catch {
      setLoadingId(null);
      setMessage({ type: "error", text: "Ada masalah dengan koneksi, silakan coba lagi" });
    }
  };

  const presensiSavedCount = siswaList.filter((s) => s.isPresensiSaved).length;
  const ekskulSavedCount = siswaList.filter((s) => s.isEkskulSaved).length;
  const kokurikulerSavedCount = siswaList.filter((s) => s.isKokurikulerSaved).length;
  const kebiasaanSavedCount = siswaList.filter((s) => s.isKebiasaanSaved).length;
  const kenaikanSavedCount = siswaList.filter(
    (s) => s.isKenaikanSaved && s.statusKenaikan
  ).length;

  const activeKebiasaanSiswa = siswaList.find((s) => s.id === kebiasaanModalSiswaId);
  const activeSaranSiswa = siswaList.find((s) => s.id === saranModalSiswaId);

  // Revert Kenaikan Individual
  const handleRevertIndividualKenaikan = (siswaId: string) => {
    const original = savedSiswaList.find((s) => s.id === siswaId);
    if (!original) return;
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId
          ? {
              ...s,
              statusKenaikan: original.statusKenaikan,
              isKenaikanSaved: original.isKenaikanSaved ?? true,
            }
          : s
      )
    );
  };

  // Revert Kenaikan Semua
  const handleRevertAllKenaikan = () => {
    setSiswaList((prev) =>
      prev.map((s) => {
        const original = savedSiswaList.find((orig) => orig.id === s.id);
        return original
          ? {
              ...s,
              statusKenaikan: original.statusKenaikan,
              isKenaikanSaved: original.isKenaikanSaved ?? true,
            }
          : s;
      })
    );
    setMessage({
      type: "success",
      text: "Perubahan status kenaikan berhasil dibatalkan.",
    });
  };

  // Revert Kebiasaan Individual
  const handleRevertIndividualKebiasaan = (siswaId: string) => {
    const original = savedSiswaList.find((s) => s.id === siswaId);
    if (!original) return;
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId
          ? {
              ...s,
              kebiasaanKarakter: original.kebiasaanKarakter,
              isKebiasaanSaved: original.isKebiasaanSaved ?? true,
            }
          : s
      )
    );
  };

  // Revert Kebiasaan Semua
  const handleRevertAllKebiasaan = () => {
    setSiswaList((prev) =>
      prev.map((s) => {
        const original = savedSiswaList.find((orig) => orig.id === s.id);
        return original
          ? {
              ...s,
              kebiasaanKarakter: original.kebiasaanKarakter,
              isKebiasaanSaved: original.isKebiasaanSaved ?? true,
            }
          : s;
      })
    );
    setMessage({
      type: "success",
      text: "Perubahan 7 kebiasaan berhasil dibatalkan.",
    });
  };

  // Revert Presensi Individual
  const handleRevertIndividualPresensi = (siswaId: string) => {
    const original = savedSiswaList.find((s) => s.id === siswaId);
    if (!original) return;
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId
          ? {
              ...s,
              sakit: original.sakit,
              izin: original.izin,
              alpa: original.alpa,
              catatanWali: original.catatanWali,
              isPresensiSaved: original.isPresensiSaved ?? true,
            }
          : s
      )
    );
  };

  // Revert Presensi Semua
  const handleRevertAllPresensi = () => {
    setSiswaList((prev) =>
      prev.map((s) => {
        const original = savedSiswaList.find((orig) => orig.id === s.id);
        return original
          ? {
              ...s,
              sakit: original.sakit,
              izin: original.izin,
              alpa: original.alpa,
              catatanWali: original.catatanWali,
              isPresensiSaved: original.isPresensiSaved ?? true,
            }
          : s;
      })
    );
    setMessage({
      type: "success",
      text: "Perubahan presensi berhasil dibatalkan.",
    });
  };

  // Revert Ekskul Individual
  const handleRevertIndividualEkskul = (siswaId: string) => {
    const original = savedSiswaList.find((s) => s.id === siswaId);
    if (!original) return;
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId
          ? {
              ...s,
              ekskul: original.ekskul,
              isEkskulSaved: original.isEkskulSaved ?? true,
            }
          : s
      )
    );
    setMessage({
      type: "success",
      text: `Perubahan ekstrakurikuler ${original.nama} berhasil dibatalkan.`,
    });
  };

  // Revert Ekskul Semua
  const handleRevertAllEkskul = () => {
    setSiswaList((prev) =>
      prev.map((s) => {
        const original = savedSiswaList.find((orig) => orig.id === s.id);
        return original
          ? {
              ...s,
              ekskul: original.ekskul,
              isEkskulSaved: original.isEkskulSaved ?? true,
            }
          : s;
      })
    );
    setMessage({
      type: "success",
      text: "Perubahan ekstrakurikuler berhasil dibatalkan.",
    });
  };

  // Revert Kokurikuler Individual
  const handleRevertIndividualKokurikuler = (siswaId: string) => {
    const original = savedSiswaList.find((s) => s.id === siswaId);
    if (!original) return;
    setSiswaList((prev) =>
      prev.map((s) =>
        s.id === siswaId
          ? {
              ...s,
              kokurikuler: original.kokurikuler,
              isKokurikulerSaved: original.isKokurikulerSaved ?? true,
            }
          : s
      )
    );
  };

  // Revert Kokurikuler Semua
  const handleRevertAllKokurikuler = () => {
    setSiswaList((prev) =>
      prev.map((s) => {
        const original = savedSiswaList.find((orig) => orig.id === s.id);
        return original
          ? {
              ...s,
              kokurikuler: original.kokurikuler,
              isKokurikulerSaved: original.isKokurikulerSaved ?? true,
            }
          : s;
      })
    );
    setMessage({
      type: "success",
      text: "Perubahan kokurikuler berhasil dibatalkan.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
                Portal Wali Kelas • Kelas {kelasNama} (Tingkat {tingkat})
              </span>
              <span className="text-emerald-400">•</span>
              <span className="text-xs text-emerald-200 font-mono">
                TA {tahunAjaran} Semester {semester === 1 ? "Ganjil" : "Genap"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
              Data Pelengkap Rapor Siswa
            </h1>
         
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              href="/wali-kelas/master-deskripsi"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all shadow-xs"
            >
              <SlidersHorizontalIcon className="h-3.5 w-3.5" />
              Kelola Master Deskripsi
            </Link>
            <Link
              href="/wali-kelas/cetak"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              Cetak Lembar Rapor
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

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
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

      {/* Konten Tab Aktif */}
      {activeTab === "PRESENSI" && (
        <TabPresensi
          siswaList={siswaList}
          loadingId={loadingId}
          isBulkSaving={isBulkSaving}
          onPresensiChange={handlePresensiChange}
          onCatatanChange={handleCatatanChange}
          onOpenSaranModal={(siswaId) => setSaranModalSiswaId(siswaId)}
          onBulkSavePresensi={handleBulkSavePresensi}
          onSaveIndividual={handleSaveIndividual}
          onRevertIndividual={handleRevertIndividualPresensi}
          onRevertAll={handleRevertAllPresensi}
        />
      )}

      {activeTab === "EKSKUL" && (
        <TabEkskul
          siswaList={siswaList}
          opsiEkskulList={opsiEkskulList}
          loadingId={loadingId}
          isBulkSaving={isBulkSaving}
          onAddAndSaveEkskul={handleAddAndSaveEkskul}
          onDeleteAndSaveEkskul={handleDeleteAndSaveEkskul}
          onUpdateEkskul={handleUpdateEkskul}
          onBulkSaveEkskul={handleBulkSaveEkskul}
          onSaveIndividual={handleSaveIndividual}
          onRevertIndividual={handleRevertIndividualEkskul}
          onRevertAll={handleRevertAllEkskul}
        />
      )}

      {activeTab === "KOKURIKULER" && (
        <TabKokurikuler
          kelasNama={kelasNama}
          siswaList={siswaList}
          temaList={temaList}
          loadingId={loadingId}
          isBulkSaving={isBulkSaving}
          onKokurikulerChange={handleKokurikulerChange}
          onBulkSaveKokurikuler={handleBulkSaveKokurikuler}
          onSaveIndividual={handleSaveIndividual}
          onRevertIndividual={handleRevertIndividualKokurikuler}
          onRevertAll={handleRevertAllKokurikuler}
        />
      )}

      {activeTab === "KEBIASAAN" && (
        <TabKebiasaan
          siswaList={siswaList}
          opsiKebiasaanList={opsiKebiasaanList}
          loadingId={loadingId}
          isBulkSaving={isBulkSaving}
          onKebiasaanChange={handleKebiasaanChange}
          onOpenKebiasaanModal={(siswaId) => setKebiasaanModalSiswaId(siswaId)}
          onBulkSaveKebiasaan={handleBulkSaveKebiasaan}
          onSaveIndividual={handleSaveIndividual}
          onRevertIndividual={handleRevertIndividualKebiasaan}
          onRevertAll={handleRevertAllKebiasaan}
        />
      )}

      {activeTab === "KENAIKAN" && (
        <TabKenaikan
          siswaList={siswaList}
          tingkat={tingkat}
          isKelasAkhir={isKelasAkhir}
          isSemesterGenap={isSemesterGenap}
          loadingId={loadingId}
          isBulkSaving={isBulkSaving}
          onStatusKenaikanChange={handleStatusKenaikanChange}
          onBulkSetKenaikan={handleBulkSetKenaikan}
          onBulkSaveKenaikan={handleBulkSaveKenaikan}
          onSaveIndividual={handleSaveIndividual}
          onRevertIndividual={handleRevertIndividualKenaikan}
          onRevertAll={handleRevertAllKenaikan}
        />
      )}

      {/* Modal Picker Kebiasaan */}
      <ModalPickerKebiasaan
        isOpen={!!kebiasaanModalSiswaId}
        siswaNama={activeKebiasaanSiswa?.nama}
        opsiList={opsiKebiasaanList}
        onSelect={(opsi) => {
          if (activeKebiasaanSiswa) {
            handleKebiasaanChange(
              activeKebiasaanSiswa.id,
              `${activeKebiasaanSiswa.nama.toUpperCase()} ${opsi}`
            );
          }
          setKebiasaanModalSiswaId(null);
        }}
        onClose={() => setKebiasaanModalSiswaId(null)}
      />

      {/* Modal Picker Saran */}
      <ModalPickerSaran
        isOpen={!!saranModalSiswaId}
        siswaNama={activeSaranSiswa?.nama}
        opsiList={opsiSaranList}
        onSelect={(opsi) => {
          if (activeSaranSiswa) {
            handleCatatanChange(activeSaranSiswa.id, opsi);
          }
          setSaranModalSiswaId(null);
        }}
        onClose={() => setSaranModalSiswaId(null)}
      />
    </div>
  );
}
