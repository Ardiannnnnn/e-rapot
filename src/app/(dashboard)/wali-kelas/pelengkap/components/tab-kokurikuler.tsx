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
  SparklesIcon,
} from "@/components/shared/icons";
import {
  SiswaPelengkapItem,
  TemaP5MasterItem,
  KokurikulerItem,
} from "@/types/wali-kelas/pelengkap";
import { TablePaginationInfo, TablePaginationNav } from "@/components/shared/table-pagination";

interface TabKokurikulerProps {
  kelasNama: string;
  siswaList: SiswaPelengkapItem[];
  masterTemaList: TemaP5MasterItem[];
  loadingId: string | null;
  isBulkSaving: boolean;
  onToggleTema: (siswaId: string, tema: TemaP5MasterItem) => void;
  onCheckAllForStudent: (siswaId: string) => void;
  onUncheckAllForStudent: (siswaId: string) => void;
  onCheckAllTemaAllStudents: () => void;
  onBulkSaveKokurikuler: () => Promise<void>;
  onSaveIndividual: (siswa: SiswaPelengkapItem) => Promise<void>;
  onRevertIndividual: (siswaId: string) => void;
  onRevertAll: () => void;
}

import {
  cleanTemaTitle,
  isTemaMatch,
  isTemaChecked,
} from "@/lib/kokurikuler";
export { cleanTemaTitle, isTemaMatch, isTemaChecked };

function getShortTemaLabel(m: TemaP5MasterItem, fallbackIdx?: number): string {
  if (m.nomor) return `Tema ${m.nomor}`;
  const match = m.judul.match(/^Tema\s*(\d+)/i);
  if (match) {
    return `Tema ${match[1]}`;
  }
  return typeof fallbackIdx === "number" ? `Tema ${fallbackIdx + 1}` : m.judul;
}

export function TabKokurikuler({
  kelasNama,
  siswaList,
  masterTemaList,
  loadingId,
  isBulkSaving,
  onToggleTema,
  onCheckAllForStudent,
  onUncheckAllForStudent,
  onCheckAllTemaAllStudents,
  onBulkSaveKokurikuler,
  onSaveIndividual,
  onRevertIndividual,
  onRevertAll,
}: TabKokurikulerProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "saved" | "unsaved">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const kokurikulerSavedCount = siswaList.filter((s) => s.isKokurikulerSaved).length;
  const unsavedCount = siswaList.length - kokurikulerSavedCount;
  const hasUnsavedChanges = unsavedCount > 0;

  const filteredList = useMemo(() => {
    let list = siswaList;
    if (filterStatus === "unsaved") {
      list = list.filter((s) => !s.isKokurikulerSaved);
    } else if (filterStatus === "saved") {
      list = list.filter((s) => s.isKokurikulerSaved);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    );
  }, [siswaList, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      {/* Box Pengaturan Tema Projek Semester Dinamis dari Master Deskripsi */}
      <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 font-poppins flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-emerald-700" />
              <span>Tema Kokurikuler Kelas {kelasNama}</span>
              <span className="text-xs font-normal text-emerald-800">
                ({masterTemaList.length} Tema Terdaftar di Master)
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unsavedCount === 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold shadow-2xs">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                  Semua Siswa Tersimpan ({kokurikulerSavedCount}/{siswaList.length})
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus(filterStatus === "unsaved" ? "all" : "unsaved");
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition cursor-pointer ${
                  filterStatus === "unsaved"
                    ? "bg-rose-600 text-white border-rose-600 ring-2 ring-rose-600/30"
                    : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50"
                }`}
                title={
                  filterStatus === "unsaved"
                    ? "Klik untuk tampilkan semua siswa"
                    : "Klik untuk memfilter siswa yang belum disimpan"
                }
              >
                <XCircleIcon className={`h-4 w-4 ${filterStatus === "unsaved" ? "text-white" : "text-rose-500"}`} />
                <span>{unsavedCount} Belum Disimpan</span>
              </button>
            )}

            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={onRevertAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                title="Batalkan seluruh perubahan kokurikuler yang belum disimpan"
              >
                <RotateCcwIcon className="h-3.5 w-3.5" />
                Batal Semua
              </button>
            )}

            <button
              type="button"
              disabled={isBulkSaving}
              onClick={onBulkSaveKokurikuler}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <SaveIcon className="h-4 w-4" />
              <span>{isBulkSaving ? "Menyimpan..." : "Simpan Kokurikuler Seluruh Siswa"}</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Tema & Narasi Master */}
        {masterTemaList.length === 0 ? (
          <div className="p-4 rounded-xl bg-white border border-dashed border-emerald-300 text-xs text-zinc-600 text-center">
            Belum ada tema projek yang dirumuskan di Master Deskripsi. Silakan klik{" "}
            <Link href="/wali-kelas/master-deskripsi" className="font-semibold text-emerald-700 underline">
              Kelola di Master Deskripsi
            </Link>{" "}
            untuk menambahkan tema.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {masterTemaList.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-emerald-200/90 bg-white/95 shadow-2xs space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] shrink-0 border border-emerald-300 mt-0.5">
                    Tema {m.nomor}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2" title={m.judul}>
                    {m.judul}
                  </h4>
                </div>
                <p
                  className="text-[11px] text-zinc-600 line-clamp-3 leading-relaxed pl-1 font-sans"
                  title={m.deskripsi}
                >
                  {m.deskripsi || <span className="italic text-zinc-400">Belum ada narasi capaian di master</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Bar: Pencarian, Status Filter & Aksi Cepat */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Input Search Siswa */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari siswa atau NISN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-7 py-1.5 border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <SearchIcon className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-400" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1.5 text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center rounded-xl bg-stone-100 p-0.5 border border-stone-200 text-xs">
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
              Semua ({siswaList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterStatus("saved");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === "saved"
                  ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-emerald-700"
              }`}
            >
              Sudah Disimpan ({kokurikulerSavedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterStatus("unsaved");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === "unsaved"
                  ? "bg-white text-rose-700 shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-rose-700"
              }`}
            >
              Belum Disimpan ({unsavedCount})
            </button>
          </div>
        </div>

        {/* Sisi Kanan: Aksi Cepat Massal & Pagination */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
          {masterTemaList.length > 0 && (
            <button
              type="button"
              onClick={onCheckAllTemaAllStudents}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Centang semua tema projek yang ada di Master untuk seluruh siswa di kelas ini"
            >
              <span>✨</span>
              <span>Centang Semua Tema (Seluruh Siswa)</span>
            </button>
          )}

          <TablePaginationInfo
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            totalItems={filteredList.length}
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

      {/* Tabel Siswa & Pilihan Tema Checkbox */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-zinc-600 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-3 w-14 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Siswa</th>
                <th className="py-3.5 px-3 w-28 text-center">Status</th>
                <th className="py-3.5 px-4 min-w-[340px]">
                  Pilihan Tema Kokurikuler (Projek P5)
                  <span className="block text-[10px] normal-case text-zinc-500 font-normal">
                    Centang [✓] tema yang dicapai siswa
                  </span>
                </th>
                <th className="py-3.5 px-3 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    {search || filterStatus !== "all"
                      ? "Tidak ada siswa yang cocok dengan filter."
                      : "Belum ada data siswa."}
                  </td>
                </tr>
              ) : (
                paginatedList.map((siswa, idx) => {
                  const globalIdx = startIndex + idx + 1;
                  const isSaved = siswa.isKokurikulerSaved ?? true;
                  const isSavingThis = loadingId === siswa.id;
                  const currentKokur = siswa.kokurikuler || [];
                  return (
                    <tr
                      key={siswa.id}
                      className={`transition-colors ${
                        !isSaved ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-stone-50/70"
                      }`}
                    >
                      {/* Nomor Urut */}
                      <td className="py-3.5 px-3 text-center text-zinc-500 font-mono text-xs">
                        {globalIdx}
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-zinc-900 text-sm">
                            {siswa.nama}
                          </span>
                          {!isSaved && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Diubah
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          NISN: {siswa.nisn || "-"}
                        </div>
                      </td>

                      {/* Status Simpan */}
                      <td className="py-3.5 px-3 text-center">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2Icon className="h-3 w-3" />
                            Tersimpan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <XCircleIcon className="h-3 w-3" />
                            Belum Disimpan
                          </span>
                        )}
                      </td>

                      {/* Kolom Checkbox Pilihan Tema Kokurikuler */}
                      <td className="py-3 px-4">
                        {masterTemaList.length === 0 ? (
                          <div className="text-zinc-500 text-xs italic">
                            Belum ada tema di master deskripsi.
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {masterTemaList.map((tema, tIdx) => {
                              const isChecked = isTemaChecked(currentKokur, tema);
                              return (
                                <button
                                  key={tema.id || tIdx}
                                  type="button"
                                  onClick={() => onToggleTema(siswa.id, tema)}
                                  title={`${tema.judul}${
                                    tema.deskripsi ? `\n\nNarasi Capaian Projek:\n${tema.deskripsi}` : ""
                                  }\n\n(Klik untuk centang/batalkan)`}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-emerald-50 text-emerald-950 border-emerald-400 ring-1 ring-emerald-400/40 shadow-2xs"
                                      : "bg-stone-50 text-zinc-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                                  }`}
                                >
                                  <span
                                    className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] transition ${
                                      isChecked
                                        ? "bg-emerald-600 text-white font-bold"
                                        : "border border-stone-300 bg-white text-transparent"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span className="font-semibold text-xs">
                                    {getShortTemaLabel(tema, tIdx)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Kolom Aksi per Siswa */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isSaved && (
                            <button
                              type="button"
                              onClick={() => onRevertIndividual(siswa.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-2xs cursor-pointer"
                              title="Batalkan perubahan pada siswa ini"
                            >
                              <RotateCcwIcon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Batal</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isSavingThis}
                            onClick={() => onSaveIndividual(siswa)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50 ${
                              !isSaved
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-stone-100 hover:bg-stone-200 text-zinc-700"
                            }`}
                            title="Simpan data kokurikuler siswa ini"
                          >
                            <SaveIcon className="h-3.5 w-3.5" />
                            <span>{isSavingThis ? "..." : "Simpan"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Navigation */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Menampilkan{" "}
            <strong>
              {paginatedList.length > 0 ? startIndex + 1 : 0} -{" "}
              {startIndex + paginatedList.length}
            </strong>{" "}
            dari <strong>{filteredList.length}</strong> siswa
          </span>
          <TablePaginationNav
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
}
