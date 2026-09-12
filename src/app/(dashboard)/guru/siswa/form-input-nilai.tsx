"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { simpanNilaiBatchAction, NilaiInputItem } from "@/actions/nilai";
import { FormInputNilaiProps, SiswaItem, NilaiData, TPItem } from "@/types/guru";
import {
  TablePaginationInfo,
  TablePaginationNav,
} from "@/components/shared/table-pagination";
import { toast } from "@/components/shared/toast";

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

  // State pagination & pencarian siswa
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Inisialisasi state form per siswa
  const [formData, setFormData] = useState(() =>
    buildInitialValues(siswaList, nilaiList, tpList)
  );

  // Sinkronisasi state form jika data server berubah atau setelah simpan berhasil
  useEffect(() => {
    setFormData(buildInitialValues(siswaList, nilaiList, tpList));
  }, [siswaList, nilaiList, tpList]);

  // Filter & Pagination data siswa
  const filteredSiswaList = useMemo(() => {
    if (!searchQuery.trim()) return siswaList;
    const q = searchQuery.toLowerCase();
    return siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q)
    );
  }, [siswaList, searchQuery]);

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

  // Kalkulasi nilai akhir: Bobot Tugas 30% + UTS 30% + UAS 40%
  const hitungNilaiAkhir = (tugasStr: string, utsStr: string, uasStr: string) => {
    const tugas = parseFloat(tugasStr) || 0;
    const uts = parseFloat(utsStr) || 0;
    const uas = parseFloat(uasStr) || 0;
    if (tugas === 0 && uts === 0 && uas === 0) return 0;
    return Math.round((tugas * 0.3 + uts * 0.3 + uas * 0.4) * 10) / 10;
  };

  const getPredikat = (nilai: number) => {
    if (nilai === 0) return { label: "-", color: "text-zinc-600 bg-stone-100" };
    if (nilai >= 85) return { label: "A (Sangat Baik)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (nilai >= 75) return { label: "B (Baik)", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (nilai >= 65) return { label: "C (Cukup)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "D (Perlu Bimbingan)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  // Auto-fill nilai dan centang ketercapaian TP otomatis
  const handleAutoFill = (val: number) => {
    const nextState: typeof formData = {};
    siswaList.forEach((s) => {
      const current = formData[s.id];

      // Jika guru sudah menginput/mengubah nilai, pertahankan nilai tersebut.
      // Nilai simulasi hanya diisi jika kolom input masih kosong.
      const offset = (s.nama.charCodeAt(0) % 15) - 3;
      const t =
        current?.tugas !== "" && current?.tugas !== undefined
          ? current.tugas
          : String(Math.min(100, Math.max(60, val + offset)));
      const u =
        current?.uts !== "" && current?.uts !== undefined
          ? current.uts
          : String(Math.min(100, Math.max(60, val + offset + 2)));
      const a =
        current?.uas !== "" && current?.uas !== undefined
          ? current.uas
          : String(Math.min(100, Math.max(60, val + offset + 4)));

      const na = hitungNilaiAkhir(t, u, a);

      // Otomatis centang TP berdasarkan Nilai Akhir terkini:
      // Nilai >= 85 tuntas seluruh TP, nilai < 85 tuntas sebagian
      const checked =
        na >= 85
          ? tpList.map((tp) => tp.id)
          : tpList.slice(0, Math.max(1, tpList.length - 1)).map((tp) => tp.id);

      nextState[s.id] = {
        tugas: t,
        uts: u,
        uas: a,
        checkedTPs: checked,
      };
    });
    setFormData(nextState);
    toast.info("Auto-fill berhasil: nilai dipertahankan dan ketercapaian TP disesuaikan otomatis.");
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
      } else {
        toast.error(res.message);
      }
    });
  };

  const totalSiswa = siswaList.length;
  const sudahDinilaiCount = siswaList.filter((s) => {
    const d = formData[s.id];
    return d && hitungNilaiAkhir(d.tugas, d.uts, d.uas) > 0;
  }).length;

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
            T.A. {selectedTahunAjaran} • Semester {selectedSemester === 1 ? "1 (Ganjil)" : "2 (Genap)"} •{" "}
            <strong className="text-zinc-900 font-semibold">{totalSiswa} Siswa Terdaftar</strong> (
            <span className="text-emerald-700 font-medium">{sudahDinilaiCount} siswa terisi</span>)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleAutoFill(80)}
            disabled={isLocked}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white text-zinc-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
            title={isLocked ? "Penilaian terkunci" : "Isi contoh nilai cepat dan centang TP otomatis untuk simulasi"}
          >
            ⚡ Auto-Fill Nilai & TP
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

      {/* Fitur Pencarian & Info Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
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
          {searchQuery && (
            <span className="text-xs text-zinc-500 whitespace-nowrap hidden md:inline">
              Ditemukan <strong className="text-zinc-800">{totalFiltered}</strong> dari {totalSiswa} siswa
            </span>
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

      {/* Tabel Data Siswa & Input Nilai dengan Kolom Checkbox TP */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                <th className="px-3 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5 min-w-[200px]">Nama Siswa</th>
                <th className="px-3 py-3.5 w-28 text-center">L/P</th>
                <th className="px-2 py-3.5 w-20 text-center">Tugas</th>
                <th className="px-2 py-3.5 w-20 text-center">UTS</th>
                <th className="px-2 py-3.5 w-20 text-center">UAS</th>
                <th className="px-3 py-3.5 w-28 text-center">Nilai Akhir</th>
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
                    {searchQuery ? "Tidak ada siswa yang cocok dengan pencarian." : "Belum ada siswa di rombel ini."}
                  </td>
                </tr>
              ) : (
                paginatedSiswaList.map((siswa, idx) => {
                  const globalIdx = (safeCurrentPage - 1) * pageSize + idx + 1;
                  const data = formData[siswa.id] || { tugas: "", uts: "", uas: "", checkedTPs: [] };
                  const na = hitungNilaiAkhir(data.tugas, data.uts, data.uas);
                  const pred = getPredikat(na);

                  return (
                    <tr key={siswa.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-3 py-3.5 text-center text-zinc-600 font-mono">
                        {globalIdx}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900 text-sm">
                          {siswa.nama}
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
                          onChange={(e) => handleScoreChange(siswa.id, "uas", e.target.value)}
                          className="w-full text-center rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-xs focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] disabled:bg-stone-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        <div className="font-mono font-bold text-sm text-zinc-900">
                          {na > 0 ? na : "-"}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mt-1 ${pred.color}`}>
                          {pred.label}
                        </span>
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
            <span className="font-mono font-semibold text-zinc-800">
              (Tugas &times; 30%) + (UTS &times; 30%) + (UAS &times; 40%)
            </span>
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
    </div>
  );
}
