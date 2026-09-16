"use client";

import React, { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { simpanNilaiBatchAction, NilaiInputItem } from "@/actions/nilai";
import { FormInputNilaiProps, SiswaItem, NilaiData, TPItem } from "@/types/guru";
import {
  TablePaginationInfo,
  TablePaginationNav,
} from "@/components/shared/table-pagination";
import { toast } from "@/components/shared/toast";
import { SlidersHorizontalIcon } from "@/components/shared/icons";
import ModalBobotNilai from "./modal-bobot-nilai";

// Helper untuk membangun data form awal dari nilai & TP tersimpan
function buildInitialValues(
  siswaList: SiswaItem[],
  nilaiList: NilaiData[],
  tpList: TPItem[]
) {
  const values: Record<
    string,
    { tugas: string; uts: string; uas: string; checkedTPs: string[] }
  > = {};

  siswaList.forEach((s) => {
    const existing = nilaiList.find((n) => n.siswaId === s.id);

    // Ambil TP yang sudah pernah tersimpan sebelumnya (jika ada)
    const savedChecked: string[] = [];
    if (existing?.catatan) {
      // Ambil kode-kode TP dari format catatan: "TP Tercapai: TP 1, TP 2"
      const rawCodes = existing.catatan
        .replace(/^TP Tercapai:\s*/i, "")
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);

      tpList.forEach((t) => {
        const codeClean = (t.kode || "").trim().toLowerCase();
        if (
          (codeClean && rawCodes.includes(codeClean)) ||
          (t.deskripsi && existing.catatan?.toLowerCase().includes(t.deskripsi.toLowerCase()))
        ) {
          savedChecked.push(t.id);
        }
      });
    }

    values[s.id] = {
      tugas: existing && existing.nilaiTugas > 0 ? String(existing.nilaiTugas) : "",
      uts: existing && existing.nilaiUTS > 0 ? String(existing.nilaiUTS) : "",
      uas: existing && existing.nilaiUAS > 0 ? String(existing.nilaiUAS) : "",
      checkedTPs: savedChecked,
    };
  });

  return values;
}

export default function FormInputNilai({
  daftarPengampu,
  activePengampu,
  siswaList,
  nilaiList,
  tpList,
  selectedTahunAjaran,
  selectedSemester,
  isLocked,
}: FormInputNilaiProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State pagination, filter status pengisian & pengurutan siswa
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"nama-asc" | "nama-desc" | "nilai-desc" | "nilai-asc">("nama-asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "sudah" | "belum">("all");

  // Inisialisasi state form per siswa
  const [formData, setFormData] = useState(() =>
    buildInitialValues(siswaList, nilaiList, tpList)
  );

  // State bobot penilaian dinamis pengampu
  const [showBobotModal, setShowBobotModal] = useState(false);
  const [activeBobot, setActiveBobot] = useState<{
    tugas: number | null;
    uts: number | null;
    uas: number | null;
  }>({
    tugas: activePengampu.bobotTugas ?? null,
    uts: activePengampu.bobotUTS ?? null,
    uas: activePengampu.bobotUAS ?? null,
  });

  const isBobotConfigured =
    activeBobot.tugas !== null &&
    activeBobot.uts !== null &&
    activeBobot.uas !== null;

  useEffect(() => {
    setActiveBobot({
      tugas: activePengampu.bobotTugas ?? null,
      uts: activePengampu.bobotUTS ?? null,
      uas: activePengampu.bobotUAS ?? null,
    });
  }, [activePengampu.id, activePengampu.bobotTugas, activePengampu.bobotUTS, activePengampu.bobotUAS]);

  // Sinkronisasi state form jika data server berubah atau setelah simpan berhasil
  useEffect(() => {
    setFormData(buildInitialValues(siswaList, nilaiList, tpList));
  }, [siswaList, nilaiList, tpList]);

  // Kalkulasi nilai akhir: Berdasarkan bobot dinamis pengampu (Tugas, UTS, UAS)
  const hitungNilaiAkhir = (tugasStr: string, utsStr: string, uasStr: string) => {
    const tugas = parseFloat(tugasStr) || 0;
    const uts = parseFloat(utsStr) || 0;
    const uas = parseFloat(uasStr) || 0;
    if (tugas === 0 && uts === 0 && uas === 0) return 0;
    if (!isBobotConfigured) return 0;
    const wTugas = (activeBobot.tugas || 0) / 100;
    const wUTS = (activeBobot.uts || 0) / 100;
    const wUAS = (activeBobot.uas || 0) / 100;
    return Math.round((tugas * wTugas + uts * wUTS + uas * wUAS) * 10) / 10;
  };

  // Helper kalkulasi & status penginputan nilai per siswa
  const getSkorSiswa = (siswaId: string) => {
    const d = formData[siswaId];
    if (!d) return { total: 0, na: 0, hasNilai: false, skorAcuan: 0 };
    const t = parseFloat(d.tugas) || 0;
    const u = parseFloat(d.uts) || 0;
    const a = parseFloat(d.uas) || 0;
    const hasNilai =
      (d.tugas !== "" && d.tugas !== undefined) ||
      (d.uts !== "" && d.uts !== undefined) ||
      (d.uas !== "" && d.uas !== undefined);

    const na = hitungNilaiAkhir(d.tugas, d.uts, d.uas);
    const total = Math.round((t + u + a) * 10) / 10;
    // Jika bobot aktif dan NA ada gunakan NA, jika bobot belum diatur gunakan total penjumlahan nilai
    const skorAcuan = isBobotConfigured && na > 0 ? na : total;

    return { total, na, hasNilai, skorAcuan };
  };

  // Snapshot nilai untuk stabilisasi urutan baris saat guru mengetik nilai
  // Posisi urutan hanya dikalkulasi saat:
  // 1. Opsi dropdown 'Urutkan' atau 'Filter' diubah
  // 2. Data server pertama kali dimuat / data direfresh
  // 3. Tombol 'Simpan Semua Nilai' selesai dijalankan
  // 4. Guru menekan tombol 'Perbarui Urutan' secara manual
  const [sortSnapshotVersion, setSortSnapshotVersion] = useState(0);
  const scoreSnapshotRef = useRef<Record<string, { skorAcuan: number; hasNilai: boolean }>>({});

  const updateSortSnapshot = () => {
    const map: Record<string, { skorAcuan: number; hasNilai: boolean }> = {};
    siswaList.forEach((s) => {
      const sk = getSkorSiswa(s.id);
      map[s.id] = {
        skorAcuan: sk.skorAcuan,
        hasNilai: sk.hasNilai,
      };
    });
    scoreSnapshotRef.current = map;
    setSortSnapshotVersion((v) => v + 1);
  };

  // Update snapshot saat opsi pengurutan/filter diubah atau data server datang
  useEffect(() => {
    updateSortSnapshot();
  }, [sortBy, filterStatus, siswaList, nilaiList]);

  // Ranking map nilai tertinggi (tetap stabil saat guru mengetik, tidak melompat)
  const rankingMap = useMemo(() => {
    const graded = siswaList
      .map((s) => {
        const snap = scoreSnapshotRef.current[s.id] ?? getSkorSiswa(s.id);
        return {
          id: s.id,
          skorAcuan: snap.skorAcuan,
          hasNilai: snap.hasNilai,
        };
      })
      .filter((s) => s.hasNilai && s.skorAcuan > 0);

    graded.sort((a, b) => b.skorAcuan - a.skorAcuan);

    const map = new Map<string, number>();
    let currentRank = 1;
    for (let i = 0; i < graded.length; i++) {
      if (i > 0 && graded[i].skorAcuan < graded[i - 1].skorAcuan) {
        currentRank = i + 1;
      }
      map.set(graded[i].id, currentRank);
    }
    return map;
  }, [siswaList, sortSnapshotVersion]);

  const totalSiswa = siswaList.length;
  const sudahDinilaiCount = useMemo(() => {
    return siswaList.filter((s) => getSkorSiswa(s.id).hasNilai).length;
  }, [siswaList, formData]);

  // Filter, Sorting & Pagination data siswa (urutan baris stabil saat mengetik)
  const filteredSiswaList = useMemo(() => {
    let list = [...siswaList];

    // 1. Filter Pencarian Nama / NISN / NIPD
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nisn.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q)
      );
    }

    // 2. Filter Status Pengisian Nilai (berdasarkan snapshot agar baris tidak hilang tiba-tiba)
    if (filterStatus === "sudah") {
      list = list.filter((s) => (scoreSnapshotRef.current[s.id]?.hasNilai ?? getSkorSiswa(s.id).hasNilai));
    } else if (filterStatus === "belum") {
      list = list.filter((s) => !(scoreSnapshotRef.current[s.id]?.hasNilai ?? getSkorSiswa(s.id).hasNilai));
    }

    // 3. Pengurutan (Sort) menggunakan snapshot skor
    list.sort((a, b) => {
      const snapA = scoreSnapshotRef.current[a.id] ?? { skorAcuan: 0, hasNilai: false };
      const snapB = scoreSnapshotRef.current[b.id] ?? { skorAcuan: 0, hasNilai: false };

      if (sortBy === "nilai-desc") {
        if (snapA.hasNilai && !snapB.hasNilai) return -1;
        if (!snapA.hasNilai && snapB.hasNilai) return 1;
        if (snapB.skorAcuan !== snapA.skorAcuan) {
          return snapB.skorAcuan - snapA.skorAcuan;
        }
        return a.nama.localeCompare(b.nama);
      }

      if (sortBy === "nilai-asc") {
        if (snapA.hasNilai && !snapB.hasNilai) return -1;
        if (!snapA.hasNilai && snapB.hasNilai) return 1;
        if (snapA.skorAcuan !== snapB.skorAcuan) {
          return snapA.skorAcuan - snapB.skorAcuan;
        }
        return a.nama.localeCompare(b.nama);
      }

      if (sortBy === "nama-desc") {
        return b.nama.localeCompare(a.nama);
      }

      return a.nama.localeCompare(b.nama);
    });

    return list;
  }, [siswaList, searchQuery, filterStatus, sortBy, sortSnapshotVersion]);

  const totalFiltered = filteredSiswaList.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSiswaList = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSiswaList.slice(start, start + pageSize);
  }, [filteredSiswaList, safeCurrentPage, pageSize]);

  // Handle perubahan input angka dengan validasi batasan 0-100
  const handleScoreChange = (siswaId: string, field: "tugas" | "uts" | "uas", value: string) => {
    if (isLocked) return;

    if (value !== "") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (num < 0) value = "0";
        else if (num > 100) value = "100";
      }
    }

    setFormData((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value,
      },
    }));
  };

  // Handle toggle centang checkbox TP per siswa
  const handleToggleTP = (siswaId: string, tpId: string) => {
    if (isLocked) return;
    setFormData((prev) => {
      const current = prev[siswaId]?.checkedTPs || [];
      const exists = current.includes(tpId);
      const nextChecked = exists
        ? current.filter((id) => id !== tpId)
        : [...current, tpId];

      return {
        ...prev,
        [siswaId]: {
          ...prev[siswaId],
          checkedTPs: nextChecked,
        },
      };
    });
  };

  const getPredikat = (nilai: number) => {
    if (nilai === 0) return { label: "-", color: "text-zinc-600 bg-stone-100" };
    if (nilai >= 85) return { label: "A (Sangat Baik)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (nilai >= 75) return { label: "B (Baik)", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (nilai >= 65) return { label: "C (Cukup)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "D (Perlu Bimbingan)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  // Terapkan semua Tujuan Pembelajaran (TP) tercapai untuk seluruh siswa
  const handleCheckAllTP = () => {
    if (isLocked) return;
    if (tpList.length === 0) {
      toast.error("Belum ada TP yang terdaftar untuk mapel ini.");
      return;
    }

    const allTPIds = tpList.map((tp) => tp.id);

    setFormData((prev) => {
      const nextState = { ...prev };
      siswaList.forEach((s) => {
        nextState[s.id] = {
          ...nextState[s.id],
          checkedTPs: allTPIds,
        };
      });
      return nextState;
    });
  };

  // Submit Simpan Nilai dengan Validasi Lengkap
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Form: Cek apakah ada nilai yang di luar rentang 0-100
    for (const s of siswaList) {
      const d = formData[s.id];
      if (d) {
        const t = parseFloat(d.tugas);
        const u = parseFloat(d.uts);
        const a = parseFloat(d.uas);
        if (!isNaN(t) && (t < 0 || t > 100)) {
          toast.error(`Nilai Tugas untuk ${s.nama} (${d.tugas}) tidak valid. Nilai harus berada dalam rentang 0 sampai 100.`);
          return;
        }
        if (!isNaN(u) && (u < 0 || u > 100)) {
          toast.error(`Nilai UTS untuk ${s.nama} (${d.uts}) tidak valid. Nilai harus berada dalam rentang 0 sampai 100.`);
          return;
        }
        if (!isNaN(a) && (a < 0 || a > 100)) {
          toast.error(`Nilai UAS untuk ${s.nama} (${d.uas}) tidak valid. Nilai harus berada dalam rentang 0 sampai 100.`);
          return;
        }
      }
    }

    const items: NilaiInputItem[] = siswaList.map((s) => {
      const d = formData[s.id] || { tugas: "0", uts: "0", uas: "0", checkedTPs: [] };
      const na = hitungNilaiAkhir(d.tugas, d.uts, d.uas);
      const tpTercapaiCodes = d.checkedTPs
        .map((id) => tpList.find((t) => t.id === id)?.kode)
        .filter(Boolean)
        .join(", ");

      return {
        siswaId: s.id,
        nilaiTugas: parseFloat(d.tugas) || 0,
        nilaiUTS: parseFloat(d.uts) || 0,
        nilaiUAS: parseFloat(d.uas) || 0,
        nilaiAkhir: na,
        catatan: tpTercapaiCodes ? `TP Tercapai: ${tpTercapaiCodes}` : undefined,
      };
    });

    startTransition(async () => {
      const res = await simpanNilaiBatchAction({
        mapelId: activePengampu.mapelId,
        tahunAjaran: selectedTahunAjaran,
        semester: selectedSemester,
        items,
      });

      if (res.success) {
        toast.success(res.message);
        router.refresh();
        updateSortSnapshot();
      } else {
        toast.error(res.message);
      }
    });
  };


  return (
    <div className="space-y-6">
      {/* 1. Selector Semester & Tahun Ajaran */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Periode Penilaian Rapor:
          </span>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="font-mono font-bold text-zinc-900 text-base">
              Tahun Ajaran {selectedTahunAjaran}
            </span>
            {isLocked ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                <span>🔒</span>
                <span>Nilai Terkunci (Read-Only)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Penginputan Terbuka</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 mr-1">Pilih Semester:</span>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/guru/siswa?kelasId=${activePengampu.kelasId}&mapelId=${activePengampu.mapelId}&semester=1&tahunAjaran=${selectedTahunAjaran}`
              )
            }
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              selectedSemester === 1
                ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs ring-2 ring-[#1b4332]/20"
                : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
            }`}
          >
            Semester 1 (Ganjil)
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/guru/siswa?kelasId=${activePengampu.kelasId}&mapelId=${activePengampu.mapelId}&semester=2&tahunAjaran=${selectedTahunAjaran}`
              )
            }
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              selectedSemester === 2
                ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs ring-2 ring-[#1b4332]/20"
                : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
            }`}
          >
            Semester 2 (Genap)
          </button>
        </div>
      </div>

      {/* Warning Alert Jika Periode Terkunci */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <span className="text-xl shrink-0">🔒</span>
          <div>
            <p className="font-bold text-sm">Penilaian Telah Dikunci Admin Sekolah</p>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Penginputan dan perubahan nilai pada Tahun Ajaran {selectedTahunAjaran} Semester {selectedSemester === 1 ? "Ganjil (1)" : "Genap (2)"} saat ini ditutup untuk persiapan pencetakan rapor. Tabel penilaian di bawah berstatus <strong>Hanya Baca (Read-Only)</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Warning Alert Jika Bobot Belum Diatur */}
      {!isBobotConfigured && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-sm">Bobot Penilaian Belum Ditetapkan</p>
              <p className="text-amber-800 mt-0.5">
                Mata pelajaran ini belum memiliki persentase bobot Tugas, UTS, dan UAS di database. Silakan tentukan bobot terlebih dahulu agar nilai akhir dapat dihitung.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowBobotModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Atur Bobot Sekarang
          </button>
        </div>
      )}

      {/* 2. Selector Penugasan Rombel & Mapel yang Diampu */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-2.5">
          Pilih Rombel & Mata Pelajaran yang Anda Ampu:
        </span>
        <div className="flex flex-wrap gap-2.5">
          {daftarPengampu.map((p) => {
            const isSelected = p.id === activePengampu.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/guru/siswa?kelasId=${p.kelasId}&mapelId=${p.mapelId}&semester=${selectedSemester}&tahunAjaran=${selectedTahunAjaran}`
                  )
                }
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? "bg-[#1b4332] text-white border-[#1b4332] shadow-sm ring-2 ring-[#1b4332]/20"
                    : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-white text-emerald-800 border border-stone-200"
                  }`}
                >
                  Kelas {p.kelas.nama}
                </span>
                <span>{p.mapel.nama}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Daftar TP yang Berlaku untuk Mata Pelajaran Ini */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm font-poppins flex items-center gap-2">
              <span>Tujuan Pembelajaran (TP) Terdaftar ({tpList.length} TP)</span>
            </h3>
          </div>
        </div>

        {tpList.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <span>
              ⚠️ Belum ada Tujuan Pembelajaran yang dirumuskan untuk mata pelajaran <strong>{activePengampu.mapel.nama}</strong> pada tingkat {activePengampu.kelas.tingkat}.
            </span>
            <Link
              href={`/guru/tp?mapelId=${activePengampu.mapelId}&tingkat=${activePengampu.kelas.tingkat}`}
              className="px-3 py-1 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 transition"
            >
              Tambah TP Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {tpList.map((tp) => (
              <div
                key={tp.id}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs flex items-start gap-2.5"
              >
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] shrink-0 border border-emerald-200">
                  {tp.kode}
                </span>
                <p className="text-zinc-700 line-clamp-2 leading-relaxed text-[11px]" title={tp.deskripsi}>
                  {tp.deskripsi}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ringkasan Kelas Terpilih & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#fcfbf9] border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 font-poppins">
              Kelas {activePengampu.kelas.nama} — {activePengampu.mapel.nama}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Tingkat {activePengampu.kelas.tingkat}
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            
            <strong className="text-zinc-900 font-semibold">{totalSiswa} Siswa Terdaftar</strong> (
            <span className="text-emerald-700 font-medium">{sudahDinilaiCount} siswa terisi</span>)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowBobotModal(true)}
            className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl border transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
              !isBobotConfigured
                ? "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
                : "border-stone-300 bg-white text-emerald-950 hover:bg-stone-50"
            }`}
            title="Atur persentase bobot Tugas, UTS, dan UAS untuk mata pelajaran ini"
          >
            <SlidersHorizontalIcon className="h-3.5 w-3.5 text-emerald-700" />
            {isBobotConfigured ? (
              <span>Bobot: T {activeBobot.tugas}% • U {activeBobot.uts}% • A {activeBobot.uas}%</span>
            ) : (
              <span className="font-bold text-amber-800">⚠️ Atur Bobot Nilai</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleCheckAllTP}
            disabled={isLocked || tpList.length === 0}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white text-zinc-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            title={isLocked ? "Penilaian terkunci" : "Centang semua TP yang terdaftar untuk seluruh siswa di kelas ini"}
          >
            <span>✅</span>
            <span>Terapkan Semua TP</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isLocked}
            className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold rounded-xl bg-[#1b4332] text-white hover:bg-[#143225] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isLocked ? (
              <>
                <span>🔒</span>
                <span>Nilai Terkunci</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Simpan Semua Nilai</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fitur Pencarian, Filter Status & Urutkan */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Sisi Kiri: Pencarian & Filter Status Nilai */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama, NISN, atau NIPD..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-stone-200 bg-white placeholder-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] focus:outline-none transition shadow-2xs"
              />
              <span className="absolute left-3 top-2.5 text-zinc-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tab Status Nilai */}
            <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filterStatus === "all"
                    ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Semua ({totalSiswa})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("sudah");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filterStatus === "sudah"
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-emerald-700"
                }`}
              >
                Sudah Diisi ({sudahDinilaiCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("belum");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filterStatus === "belum"
                    ? "bg-white text-rose-700 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-rose-700"
                }`}
              >
                Belum Diisi ({totalSiswa - sudahDinilaiCount})
              </button>
            </div>
          </div>

          {/* Sisi Kanan: Urutkan & Pagination Info */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-600">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-zinc-800 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="nama-asc">Nama Siswa (A - Z)</option>
                <option value="nama-desc">Nama Siswa (Z - A)</option>
                <option value="nilai-desc">🏆 Total / Nilai Tertinggi</option>
                <option value="nilai-asc">📉 Nilai Terendah</option>
              </select>

              {(sortBy === "nilai-desc" || sortBy === "nilai-asc") && (
                <button
                  type="button"
                  onClick={() => {
                    updateSortSnapshot();
                    toast.info("Posisi baris diperbarui sesuai nilai terbaru.");
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs text-zinc-700 font-medium transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Perbarui urutan baris berdasarkan nilai input terbaru"
                >
                  <span>🔄</span>
                  <span className="hidden sm:inline">Perbarui Posisi</span>
                </button>
              )}
            </div>

            <TablePaginationInfo
              currentPage={safeCurrentPage}
              pageSize={pageSize}
              totalItems={totalFiltered}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              onPageChange={(page) => setCurrentPage(page)}
              label="siswa"
              pageSizeOptions={[10, 20, 30, 50]}
            />
          </div>
        </div>

        {/* Info filter & pengurutan aktif */}
        {(searchQuery || filterStatus !== "all" || sortBy !== "nama-asc") && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 pt-0.5">
            <span>
              Menampilkan <strong>{totalFiltered}</strong> dari {totalSiswa} siswa
            </span>
            {sortBy === "nilai-desc" && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                <span>🏆</span> Diurutkan Total Nilai Tertinggi
              </span>
            )}
            {sortBy === "nilai-asc" && (
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-zinc-700 border border-stone-200 text-[11px] font-semibold flex items-center gap-1">
                <span>📉</span> Diurutkan Nilai Terendah
              </span>
            )}
            {filterStatus !== "all" && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                Filter: {filterStatus === "sudah" ? "Hanya yang sudah diisi" : "Hanya yang belum diisi"}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setSortBy("nama-asc");
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 hover:underline cursor-pointer ml-auto font-medium"
            >
              Reset Filter & Urutan
            </button>
          </div>
        )}
      </div>

      {/* Tabel Data Siswa & Input Nilai dengan Kolom Checkbox TP */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                <th className="px-3 py-3.5 w-16 text-center">
                  {sortBy === "nilai-desc" ? "Rank" : "No"}
                </th>
                <th className="px-4 py-3.5 min-w-[200px]">Nama Siswa</th>
                <th className="px-3 py-3.5 w-28 text-center">L/P</th>
                <th className="px-2 py-3.5 w-20 text-center">Tugas</th>
                <th className="px-2 py-3.5 w-20 text-center">UTS</th>
                <th className="px-2 py-3.5 w-20 text-center">UAS</th>
                <th className="px-3 py-3.5 w-28 text-center">
                  {isBobotConfigured ? "Nilai Akhir" : "Total Nilai"}
                </th>
                <th className="px-4 py-3.5 min-w-[240px]">
                  Ketercapaian TP
                  <span className="block text-[10px] normal-case text-zinc-600 font-normal">
                    Centang [✓] TP yang tercapai
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {paginatedSiswaList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    {searchQuery || filterStatus !== "all"
                      ? "Tidak ada siswa yang cocok dengan kriteria filter."
                      : "Belum ada siswa di rombel ini."}
                  </td>
                </tr>
              ) : (
                paginatedSiswaList.map((siswa, idx) => {
                  const globalIdx = (safeCurrentPage - 1) * pageSize + idx + 1;
                  const data = formData[siswa.id] || { tugas: "", uts: "", uas: "", checkedTPs: [] };
                  const skor = getSkorSiswa(siswa.id);
                  const na = skor.na;
                  const pred = getPredikat(na);
                  const rank = rankingMap.get(siswa.id);

                  return (
                    <tr key={siswa.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-3 py-3.5 text-center text-zinc-600 font-mono">
                        {sortBy === "nilai-desc" && rank ? (
                          rank === 1 ? (
                            <span
                              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                              title="Peringkat 1 (Tertinggi)"
                            >
                              🥇 1
                            </span>
                          ) : rank === 2 ? (
                            <span
                              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs"
                              title="Peringkat 2"
                            >
                              🥈 2
                            </span>
                          ) : rank === 3 ? (
                            <span
                              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300 shadow-2xs"
                              title="Peringkat 3"
                            >
                              🥉 3
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-zinc-700">
                              #{rank}
                            </span>
                          )
                        ) : (
                          globalIdx
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-zinc-900 text-sm">
                            {siswa.nama}
                          </span>
                          {sortBy !== "nilai-desc" && rank && rank <= 3 && (
                            <span
                              className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200"
                              title={`Peringkat ${rank} di kelas ini`}
                            >
                              {rank === 1 ? "🥇 #1" : rank === 2 ? "🥈 #2" : "🥉 #3"}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-600 font-mono mt-0.5 whitespace-nowrap">
                          NISN: {siswa.nisn} • NIPD: {siswa.nis}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            siswa.jenisKelamin === "L"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {siswa.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </span>
                      </td>

                      <td className="px-2 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0"
                          disabled={isLocked}
                          value={data.tugas}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleScoreChange(siswa.id, "tugas", e.target.value)}
                          className="w-full text-center rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-xs focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] disabled:bg-stone-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                        />
                      </td>

                      <td className="px-2 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0"
                          disabled={isLocked}
                          value={data.uts}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleScoreChange(siswa.id, "uts", e.target.value)}
                          className="w-full text-center rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-xs focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] disabled:bg-stone-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                        />
                      </td>

                      <td className="px-2 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0"
                          disabled={isLocked}
                          value={data.uas}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleScoreChange(siswa.id, "uas", e.target.value)}
                          className="w-full text-center rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-xs focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] disabled:bg-stone-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        {isBobotConfigured ? (
                          <>
                            <div className="font-mono font-bold text-sm text-zinc-900">
                              {na > 0 ? na : "-"}
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mt-1 ${pred.color}`}>
                              {pred.label}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="font-mono font-bold text-sm text-zinc-900">
                              {skor.total > 0 ? skor.total : "-"}
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium border mt-1 bg-amber-50 text-amber-800 border-amber-200">
                              {skor.total > 0 ? `Total: ${skor.total}` : "Belum diisi"}
                            </span>
                          </>
                        )}
                      </td>

                      {/* Kolom Ketercapaian TP Langsung */}
                      <td className="px-4 py-3">
                        {tpList.length === 0 ? (
                          <div className="text-zinc-600 text-xs italic">
                            Belum ada TP terdaftar untuk mapel ini di semester {selectedSemester}.
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tpList.map((tp) => {
                              const isChecked = data.checkedTPs.includes(tp.id);
                              return (
                                <button
                                  key={tp.id}
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => handleToggleTP(siswa.id, tp.id)}
                                  title={`${tp.kode}: ${tp.deskripsi} ${isLocked ? "(Terkunci)" : "(Klik untuk centang)"}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-85 ${
                                    isChecked
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold ring-1 ring-emerald-300/30"
                                      : "bg-stone-50 text-zinc-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                                  }`}
                                >
                                  <span
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                      isChecked
                                        ? "bg-emerald-600 text-white font-bold"
                                        : "border border-stone-300 text-transparent"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span className="font-mono">{tp.kode}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info tabel */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div>
            <span>Rumus Nilai Akhir: </span>
            {isBobotConfigured ? (
              <span className="font-mono font-semibold text-zinc-800">
                (Tugas &times; {activeBobot.tugas}%) + (UTS &times; {activeBobot.uts}%) + (UAS &times; {activeBobot.uas}%)
              </span>
            ) : (
              <span className="font-medium text-amber-700">
                Bobot belum ditetapkan (nilai akhir dihitung setelah bobot diatur via tombol di atas)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isLocked}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-xl bg-[#1b4332] text-white hover:bg-[#143225] disabled:opacity-50 transition shadow-xs cursor-pointer"
          >
            {isPending ? "Sedang Menyimpan Data..." : "Simpan Semua Nilai Siswa"}
          </button>
        </div>
      </div>

      {/* Centered Pagination Nav (Prev / Next & Angka Halaman) */}
      <TablePaginationNav
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        totalItems={totalFiltered}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modal Dialog Atur Bobot Penilaian Mapel */}
      {showBobotModal && (
        <ModalBobotNilai
          pengampuId={activePengampu.id}
          mapelNama={activePengampu.mapel.nama}
          kelasNama={activePengampu.kelas.nama}
          initialBobotTugas={activeBobot.tugas}
          initialBobotUTS={activeBobot.uts}
          initialBobotUAS={activeBobot.uas}
          onClose={() => setShowBobotModal(false)}
          onSuccess={(b) => setActiveBobot(b)}
        />
      )}
    </div>
  );
}
