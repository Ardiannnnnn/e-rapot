"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  XCircleIcon,
  SlidersHorizontalIcon,
  SaveIcon,
  RotateCcwIcon,
  SearchIcon,
} from "@/components/shared/icons";
import { SiswaPelengkapItem } from "@/types/wali-kelas/pelengkap";
import { TablePaginationInfo, TablePaginationNav } from "@/components/shared/table-pagination";

interface TabPresensiProps {
  siswaList: SiswaPelengkapItem[];
  loadingId: string | null;
  isBulkSaving: boolean;
  onPresensiChange: (
    siswaId: string,
    field: "sakit" | "izin" | "alpa",
    val: number
  ) => void;
  onCatatanChange: (siswaId: string, text: string) => void;
  onOpenSaranModal: (siswaId: string) => void;
  onBulkSavePresensi: () => Promise<void>;
  onSaveIndividual: (siswa: SiswaPelengkapItem) => Promise<void>;
  onRevertIndividual: (siswaId: string) => void;
  onRevertAll: () => void;
}

export function TabPresensi({
  siswaList,
  loadingId,
  isBulkSaving,
  onPresensiChange,
  onCatatanChange,
  onOpenSaranModal,
  onBulkSavePresensi,
  onSaveIndividual,
  onRevertIndividual,
  onRevertAll,
}: TabPresensiProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const presensiSavedCount = siswaList.filter((s) => s.isPresensiSaved).length;
  const hasUnsavedChanges = presensiSavedCount < siswaList.length;

  const filteredList = useMemo(() => {
    if (!search.trim()) return siswaList;
    const q = search.toLowerCase().trim();
    return siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    );
  }, [siswaList, search]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  return (
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
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={onRevertAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs"
              title="Batalkan seluruh perubahan presensi yang belum disimpan"
            >
              <RotateCcwIcon className="h-3.5 w-3.5" />
              Batal Semua
            </button>
          )}
          <button
            type="button"
            disabled={isBulkSaving}
            onClick={onBulkSavePresensi}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50"
          >
            <SaveIcon className="h-4 w-4" />
            {isBulkSaving ? "Menyimpan..." : "Simpan Semua Presensi"}
          </button>
        </div>
      </div>

      {/* Search & Keterangan Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama atau NISN siswa..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-2xs font-medium"
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

        <TablePaginationInfo
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={filteredList.length}
          onPageSizeChange={(size) => setPageSize(size)}
          onPageChange={(page) => setCurrentPage(page)}
          label="siswa"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-stone-100 text-zinc-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4 w-48">Nama Siswa</th>
              <th className="py-3 px-4 w-32 text-center">NISN</th>
              <th className="py-3 px-4 w-36 text-center">Status Simpan</th>
              <th className="py-3 px-2 w-16 text-center">Sakit</th>
              <th className="py-3 px-2 w-16 text-center">Izin</th>
              <th className="py-3 px-2 w-16 text-center">Alpa</th>
              <th className="py-3 px-4">Saran-saran / Catatan Wali Kelas</th>
              <th className="py-3 px-3 w-44 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-zinc-400 italic">
                  {search
                    ? `Tidak ada siswa yang cocok dengan pencarian "${search}".`
                    : "Belum ada data siswa."}
                </td>
              </tr>
            ) : (
              paginatedList.map((s, idx) => (
                <tr key={s.id} className="hover:bg-stone-50/60 transition">
                  <td className="py-3 px-4 text-center font-mono font-medium text-zinc-500">
                    {startIndex + idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-zinc-900">{s.nama}</p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-zinc-600">
                    {s.nisn || "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {s.isPresensiSaved ? (
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
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      min="0"
                      value={s.sakit}
                      onChange={(e) =>
                        onPresensiChange(
                          s.id,
                          "sakit",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full text-center p-2 border border-stone-300 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      min="0"
                      value={s.izin}
                      onChange={(e) =>
                        onPresensiChange(
                          s.id,
                          "izin",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full text-center p-2 border border-stone-300 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      min="0"
                      value={s.alpa}
                      onChange={(e) =>
                        onPresensiChange(
                          s.id,
                          "alpa",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full text-center p-2 border border-stone-300 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1.5">
                      <textarea
                        rows={2}
                        value={s.catatanWali}
                        onChange={(e) => onCatatanChange(s.id, e.target.value)}
                        placeholder="Ketik catatan bimbingan atau pilih dari template..."
                        className="w-full p-2 border border-stone-300 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onOpenSaranModal(s.id)}
                          className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                        >
                          <span>📝</span> Pilih dari Master
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center align-top pt-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {!s.isPresensiSaved && (
                        <button
                          type="button"
                          onClick={() => onRevertIndividual(s.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-2xs"
                          title="Batalkan perubahan presensi untuk siswa ini"
                        >
                          <RotateCcwIcon className="h-3.5 w-3.5" />
                          <span>Batal</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={loadingId === s.id}
                        onClick={() => onSaveIndividual(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                          s.isPresensiSaved
                            ? "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Pagination Nav */}
      <TablePaginationNav
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        totalItems={filteredList.length}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
