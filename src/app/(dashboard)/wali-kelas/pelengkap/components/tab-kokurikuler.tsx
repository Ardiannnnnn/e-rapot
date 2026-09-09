"use client";

import Link from "next/link";
import {
  CheckCircle2Icon,
  XCircleIcon,
  SlidersHorizontalIcon,
  SaveIcon,
  RotateCcwIcon,
} from "@/components/shared/icons";
import { SiswaPelengkapItem } from "@/types/wali-kelas/pelengkap";

interface TabKokurikulerProps {
  kelasNama: string;
  siswaList: SiswaPelengkapItem[];
  temaList: string[];
  loadingId: string | null;
  isBulkSaving: boolean;
  onKokurikulerChange: (siswaId: string, temaIdx: number, tema: string, deskripsi: string) => void;
  onBulkSaveKokurikuler: () => Promise<void>;
  onSaveIndividual: (siswa: SiswaPelengkapItem) => Promise<void>;
  onRevertIndividual: (siswaId: string) => void;
  onRevertAll: () => void;
}

export function TabKokurikuler({
  kelasNama,
  siswaList,
  temaList,
  loadingId,
  isBulkSaving,
  onKokurikulerChange,
  onBulkSaveKokurikuler,
  onSaveIndividual,
  onRevertIndividual,
  onRevertAll,
}: TabKokurikulerProps) {
  const kokurikulerSavedCount = siswaList.filter((s) => s.isKokurikulerSaved).length;
  const hasUnsavedChanges = kokurikulerSavedCount < siswaList.length;

  return (
    <div className="space-y-4">
      {/* Box Pengaturan Tema Projek Semester Dinamis */}
      <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 font-poppins">
              Tema Kokurikuler (Projek P5) Kelas {kelasNama}
            </h3>
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
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={onRevertAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50"
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
              <th className="py-3 px-4 w-48">Nama Siswa</th>
              <th className="py-3 px-4 w-32 text-center">NISN</th>
              <th className="py-3 px-4 w-36 text-center">Status Simpan</th>
              <th className="py-3 px-4">Deskripsi Pencapaian Seluruh Tema Projek P5</th>
              <th className="py-3 px-3 w-44 text-center">Aksi</th>
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
                </td>
                <td className="py-3 px-4 text-center font-mono text-xs text-zinc-600">
                  {s.nisn || "-"}
                </td>
                <td className="py-3 px-4 text-center">
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
                            onChange={(e) =>
                              onKokurikulerChange(s.id, tIdx, t, e.target.value)
                            }
                            className="w-full p-2 border border-stone-300 rounded-lg text-xs leading-relaxed bg-white focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="py-3 px-3 text-center align-top pt-4">
                  <div className="flex items-center justify-center gap-1.5">
                    {!s.isKokurikulerSaved && (
                      <button
                        type="button"
                        onClick={() => onRevertIndividual(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-2xs"
                        title="Batalkan perubahan kokurikuler untuk siswa ini"
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
                        s.isKokurikulerSaved
                          ? "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
