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
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredList = siswaList.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nisn.includes(search) ||
      s.nis.includes(search);
    const matchGender =
      genderFilter === "ALL" || s.jenisKelamin === genderFilter;
    return matchSearch && matchGender;
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
                <th className="py-3.5 px-6 text-center">Rata-rata Nilai</th>
                <th className="py-3.5 px-6 text-center">Presensi (S/I/A)</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-600 text-xs">
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
                        {s.rataRata > 0 ? (
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              s.rataRata >= 85
                                ? "bg-emerald-100 text-emerald-900"
                                : s.rataRata >= 75
                                ? "bg-blue-100 text-blue-900"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {s.rataRata.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {s.presensi ? (
                          <span className="font-mono text-xs font-medium text-zinc-800 bg-stone-100 px-2 py-0.5 rounded">
                            S:{s.presensi.sakit} • I:{s.presensi.izin} • A:{s.presensi.alpa}
                          </span>
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
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium block">
                    Rata-rata Nilai
                  </span>
                  <p className="mt-1 text-2xl font-bold font-mono text-emerald-800">
                    {selectedSiswa.rataRata > 0 ? selectedSiswa.rataRata.toFixed(1) : "-"}
                  </p>
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
                  <p className="mt-1 text-base font-bold font-mono text-zinc-800">
                    S:{selectedSiswa.presensi?.sakit || 0} I:{selectedSiswa.presensi?.izin || 0} A:{selectedSiswa.presensi?.alpa || 0}
                  </p>
                </div>
              </div>

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
