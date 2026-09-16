"use client";

import { useState } from "react";
import {
  SearchIcon,
  EyeIcon,
  XIcon,
  PrinterIcon
} from "@/components/shared/icons";
import Link from "next/link";
import { SiswaItem, DaftarSiswaProps } from "@/types/wali-kelas/siswa";
import { TablePaginationInfo, TablePaginationNav } from "@/components/shared/table-pagination";

export default function DaftarSiswaClient({
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  siswaList,
}: DaftarSiswaProps) {
  const hasNilai = siswaList.some((s) => s.totalNilai > 0 || (s.peringkat !== null && s.peringkat !== undefined));
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"nama" | "peringkat" | "totalNilai">(() =>
    hasNilai ? "peringkat" : "nama"
  );
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredList = siswaList
    .filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.nisn.includes(search) ||
        s.nis.includes(search);
      const matchGender =
        genderFilter === "ALL" || s.jenisKelamin === genderFilter;
      return matchSearch && matchGender;
    })
    .sort((a, b) => {
      if (sortBy === "peringkat") {
        const rankA = a.peringkat ?? 9999;
        const rankB = b.peringkat ?? 9999;
        if (rankA !== rankB) return rankA - rankB;
        return a.nama.localeCompare(b.nama);
      }
      if (sortBy === "totalNilai") {
        if (b.totalNilai !== a.totalNilai) return b.totalNilai - a.totalNilai;
        return a.nama.localeCompare(b.nama);
      }
      return a.nama.localeCompare(b.nama);
    });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2 backdrop-blur-sm font-mono">
              Peserta Didik Binaan • Kelas {kelasNama} (Tingkat {tingkat})
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
              Data Siswa & Rekap Capaian Kelas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/wali-kelas/pelengkap"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm border border-white/15 transition-all text-center"
            >
              Input Presensi & Catatan
            </Link>
            <Link
              href="/wali-kelas/cetak"
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              Cetak Rapor
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau NIPD..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1b4332] shadow-2xs font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600">Gender:</span>
            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                onClick={() => {
                  setGenderFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  genderFilter === "ALL"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Semua ({siswaList.length})
              </button>
              <button
                onClick={() => {
                  setGenderFilter("L");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  genderFilter === "L"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-zinc-600 hover:text-blue-700"
                }`}
              >
                L ({siswaList.filter((s) => s.jenisKelamin === "L").length})
              </button>
              <button
                onClick={() => {
                  setGenderFilter("P");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  genderFilter === "P"
                    ? "bg-white text-rose-700 shadow-xs"
                    : "text-zinc-600 hover:text-rose-700"
                }`}
              >
                P ({siswaList.filter((s) => s.jenisKelamin === "P").length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as "nama" | "peringkat" | "totalNilai");
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-[#1b4332]"
            >
              <option value="peringkat">🏆 Peringkat Kelas</option>
              <option value="totalNilai">Total Nilai Tertinggi</option>
              <option value="nama">Nama (A - Z)</option>
            </select>
          </div>
        </div>

        <TablePaginationInfo
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={filteredList.length}
          onPageSizeChange={(size) => setPageSize(size)}
          onPageChange={(page) => setCurrentPage(page)}
          label="peserta didik"
        />
      </div>

      {/* Tabel Peserta Didik */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">No</th>
                <th className="py-3.5 px-6">Nama Peserta Didik</th>
                <th className="py-3.5 px-6">NISN / NIPD</th>
                <th className="py-3.5 px-6 text-center">L/P</th>
                <th className="py-3.5 px-6 text-center">Mapel Dinilai</th>
                <th className="py-3.5 px-6 text-center">Total Nilai</th>
                <th className="py-3.5 px-6 text-center">Peringkat</th>
                <th className="py-3.5 px-6 text-center">Presensi (S/I/A)</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-600 text-xs">
                    Tidak ditemukan peserta didik yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedList.map((s, idx) => {
                  const isAllGraded =
                    s.totalMapel > 0 && s.mapelDinilaiCount === s.totalMapel;
                  return (
                    <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-6 text-xs text-zinc-600 font-mono">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-zinc-900 block">
                          {s.nama}
                        </span>
                        {s.alamat && (
                          <span className="text-[11px] text-zinc-600 block line-clamp-1">
                            {s.alamat}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-mono text-xs font-medium text-zinc-800">
                          {s.nisn}
                        </div>
                        <div className="font-mono text-[11px] text-zinc-600">
                          NIPD: {s.nis}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            s.jenisKelamin === "L"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {s.jenisKelamin}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isAllGraded
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : s.mapelDinilaiCount > 0
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-stone-100 text-zinc-600"
                          }`}
                        >
                          {s.mapelDinilaiCount} / {s.totalMapel} Mapel
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {s.totalNilai > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono text-sm font-bold text-zinc-900">
                              {Math.round(s.totalNilai * 10) / 10}
                            </span>
                            <span className="font-mono text-[10.5px] text-zinc-500">
                              Rata: {s.rataRata.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {s.peringkat ? (
                          <span
                            className={`inline-flex items-center justify-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              s.peringkat === 1
                                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                                : s.peringkat === 2
                                ? "bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs"
                                : s.peringkat === 3
                                ? "bg-orange-100 text-orange-900 border border-orange-300 shadow-2xs"
                                : "bg-stone-100 text-zinc-700 border border-stone-200"
                            }`}
                          >
                            {s.peringkat === 1 && "🥇 Juara 1"}
                            {s.peringkat === 2 && "🥈 Juara 2"}
                            {s.peringkat === 3 && "🥉 Juara 3"}
                            {s.peringkat > 3 && `Ke-${s.peringkat}`}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {s.presensi ? (
                          (() => {
                            const sk = s.presensi.sakit || 0;
                            const iz = s.presensi.izin || 0;
                            const al = s.presensi.alpa || 0;
                            const hasAbsence = sk > 0 || iz > 0 || al > 0;

                            if (!hasAbsence) {
                              return (
                                <span
                                  className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200"
                                  title="Hadir Penuh (0 Sakit, 0 Izin, 0 Alpa)"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                  S:0 • I:0 • A:0
                                </span>
                              );
                            }

                            return (
                              <div className="inline-flex items-center gap-1 font-mono text-xs">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] border ${
                                    sk > 0
                                      ? "bg-blue-100 text-blue-800 border-blue-300 font-bold shadow-2xs"
                                      : "bg-stone-50 text-zinc-400 border-stone-200"
                                  }`}
                                  title={`Sakit: ${sk} hari`}
                                >
                                  S:{sk}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] border ${
                                    iz > 0
                                      ? "bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-2xs"
                                      : "bg-stone-50 text-zinc-400 border-stone-200"
                                  }`}
                                  title={`Izin: ${iz} hari`}
                                >
                                  I:{iz}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] border ${
                                    al > 0
                                      ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold ring-1 ring-rose-400/30 shadow-2xs"
                                      : "bg-stone-50 text-zinc-400 border-stone-200"
                                  }`}
                                  title={`Alpa / Tanpa Keterangan: ${al} hari`}
                                >
                                  A:{al}
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Belum diisi
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedSiswa(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-[#1b4332] text-xs font-medium text-zinc-800 hover:text-[#1b4332] transition-colors"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          Detail Nilai
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Centered Pagination Nav */}
      <TablePaginationNav
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        totalItems={filteredList.length}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modal Dialog Detail Nilai Siswa */}
      {selectedSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-xs font-mono text-emerald-800 font-semibold uppercase block">
                  Capaian Akademik • Kelas {kelasNama}
                </span>
                <h3 className="text-lg font-bold text-zinc-900 font-poppins">
                  {selectedSiswa.nama}
                </h3>
                <p className="text-xs text-zinc-600 font-mono">
                  NISN: {selectedSiswa.nisn} | NIPD: {selectedSiswa.nis}
                </p>
              </div>
              <button
                onClick={() => setSelectedSiswa(null)}
                className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Ringkasan Nilai Siswa */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium block">
                    Peringkat Kelas
                  </span>
                  <p className="mt-1 text-2xl font-bold font-mono text-amber-700">
                    {selectedSiswa.peringkat ? (
                      selectedSiswa.peringkat <= 3
                        ? `Juara ${selectedSiswa.peringkat}`
                        : `Ke-${selectedSiswa.peringkat}`
                    ) : (
                      "-"
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium block">
                    Total Nilai
                  </span>
                  <p className="mt-1 text-2xl font-bold font-mono text-emerald-800">
                    {selectedSiswa.totalNilai > 0 ? (Math.round(selectedSiswa.totalNilai * 10) / 10).toFixed(1) : "-"}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Rata: {selectedSiswa.rataRata > 0 ? selectedSiswa.rataRata.toFixed(1) : "-"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium block">
                    Mapel Dinilai
                  </span>
                  <p className="mt-1 text-2xl font-bold font-mono text-zinc-900">
                    {selectedSiswa.mapelDinilaiCount} / {selectedSiswa.totalMapel}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium block">
                    Ketidakhadiran
                  </span>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        (selectedSiswa.presensi?.sakit || 0) > 0
                          ? "bg-blue-100 text-blue-800 border-blue-300 shadow-2xs"
                          : "bg-white text-zinc-400 border-stone-200"
                      }`}
                      title={`Sakit: ${selectedSiswa.presensi?.sakit || 0} hari`}
                    >
                      S:{selectedSiswa.presensi?.sakit || 0}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        (selectedSiswa.presensi?.izin || 0) > 0
                          ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                          : "bg-white text-zinc-400 border-stone-200"
                      }`}
                      title={`Izin: ${selectedSiswa.presensi?.izin || 0} hari`}
                    >
                      I:{selectedSiswa.presensi?.izin || 0}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        (selectedSiswa.presensi?.alpa || 0) > 0
                          ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold shadow-2xs"
                          : "bg-white text-zinc-400 border-stone-200"
                      }`}
                      title={`Alpa: ${selectedSiswa.presensi?.alpa || 0} hari`}
                    >
                      A:{selectedSiswa.presensi?.alpa || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Transparansi Penalti Presensi */}
              {selectedSiswa.penaltiPresensi !== undefined && selectedSiswa.penaltiPresensi > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚖️</span>
                    <span>
                      Total Nilai: <strong>{selectedSiswa.totalNilai}</strong> • Penalti Presensi: <strong className="text-rose-600">-{selectedSiswa.penaltiPresensi}</strong> (Alpa: {selectedSiswa.presensi?.alpa || 0}, Izin: {selectedSiswa.presensi?.izin || 0}, Sakit: {selectedSiswa.presensi?.sakit || 0})
                    </span>
                  </div>
                  <span className="font-bold font-mono text-emerald-800 bg-white px-3 py-1 rounded-lg border border-amber-200 whitespace-nowrap shadow-2xs">
                    Skor Juara: {selectedSiswa.skorAkhirRanking !== undefined ? Math.round(selectedSiswa.skorAkhirRanking * 10) / 10 : "-"}
                  </span>
                </div>
              )}

              {selectedSiswa.isDisqualifiedJuara && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 shadow-2xs">
                  <span>🚫</span>
                  <span>
                    Siswa tidak memenuhi syarat masuk 3 Besar (Juara 1, 2, atau 3) karena jumlah Alpa ({selectedSiswa.presensi?.alpa || 0} hari) melebihi batas toleransi juara.
                  </span>
                </div>
              )}

              {/* Tabel Komponen Nilai Per Mapel */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-3">
                  Rincian Nilai Mata Pelajaran
                </h4>
                <div className="rounded-xl border border-stone-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-[11px] font-semibold text-zinc-600 uppercase border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-4">Mata Pelajaran</th>
                        <th className="py-2.5 px-3 text-center">Tugas</th>
                        <th className="py-2.5 px-3 text-center">UTS</th>
                        <th className="py-2.5 px-3 text-center">UAS</th>
                        <th className="py-2.5 px-3 text-center font-bold text-zinc-900">
                          Nilai Akhir
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedSiswa.nilai.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-zinc-600">
                            Belum ada nilai yang diinputkan oleh guru mapel.
                          </td>
                        </tr>
                      ) : (
                        selectedSiswa.nilai.map((n) => (
                          <tr key={n.id} className="hover:bg-stone-50">
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-zinc-900 block">
                                {n.mapelNama}
                              </span>
                              <span className="text-[10px] text-zinc-600 font-mono">
                                {n.mapelKode}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                              {n.nilaiTugas}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                              {n.nilaiUTS}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                              {n.nilaiUAS}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800">
                              {n.nilaiAkhir}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {selectedSiswa.nilai.length > 0 && (
                      <tfoot className="bg-stone-50 border-t border-stone-200 font-bold">
                        <tr>
                          <td colSpan={4} className="py-2.5 px-4 text-zinc-800 text-right">
                            Total Nilai Seluruh Mapel:
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-emerald-900 text-sm">
                            {Math.round(selectedSiswa.totalNilai * 10) / 10}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Catatan Karakter Wali Kelas */}
              {selectedSiswa.presensi?.catatanWali && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                  <span className="font-semibold text-emerald-900 block mb-1">
                    Catatan Perkembangan Karakter Wali Kelas:
                  </span>
                  <p className="text-emerald-800 italic">
                    "{selectedSiswa.presensi.catatanWali}"
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200 flex justify-end gap-2 bg-stone-50">
              <button
                onClick={() => setSelectedSiswa(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 rounded-xl hover:bg-stone-200/50 transition-colors"
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
