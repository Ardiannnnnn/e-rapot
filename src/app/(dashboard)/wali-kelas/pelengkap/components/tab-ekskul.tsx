"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  Trash2Icon,
  SaveIcon,
  RotateCcwIcon,
} from "@/components/shared/icons";
import { SiswaPelengkapItem, EkskulItem, PredikatEkskul } from "@/types/wali-kelas/pelengkap";
import { ModalConfirmEkskul } from "./modal-confirm-ekskul";

interface TabEkskulProps {
  siswaList: SiswaPelengkapItem[];
  opsiEkskulList: string[];
  loadingId: string | null;
  isBulkSaving: boolean;
  onAddAndSaveEkskul: (
    siswaId: string,
    data: { nama: string; predikat: PredikatEkskul }
  ) => Promise<void>;
  onDeleteAndSaveEkskul: (siswaId: string, idx: number) => Promise<void>;
  onUpdateEkskul: (
    siswaId: string,
    idx: number,
    field: keyof EkskulItem,
    val: string
  ) => void;
  onBulkSaveEkskul: () => Promise<void>;
  onSaveIndividual: (siswa: SiswaPelengkapItem) => Promise<void>;
  onRevertIndividual: (siswaId: string) => void;
  onRevertAll: () => void;
}

export function TabEkskul({
  siswaList,
  opsiEkskulList,
  loadingId,
  isBulkSaving,
  onAddAndSaveEkskul,
  onDeleteAndSaveEkskul,
  onUpdateEkskul,
  onBulkSaveEkskul,
  onSaveIndividual,
  onRevertIndividual,
  onRevertAll,
}: TabEkskulProps) {
  const ekskulSavedCount = siswaList.filter((s) => s.isEkskulSaved).length;
  const hasUnsavedChanges = siswaList.some((s) => !s.isEkskulSaved);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "ADD" | "DELETE";
    siswaId: string;
    siswaNama: string;
    existingEkskulNames: string[];
    ekskulIdx?: number;
    ekskulNama?: string;
  }>({
    isOpen: false,
    type: "ADD",
    siswaId: "",
    siswaNama: "",
    existingEkskulNames: [],
  });

  const handleConfirmAdd = async (data: { nama: string; predikat: PredikatEkskul }) => {
    await onAddAndSaveEkskul(confirmModal.siswaId, data);
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmDelete = async () => {
    if (confirmModal.ekskulIdx !== undefined) {
      await onDeleteAndSaveEkskul(confirmModal.siswaId, confirmModal.ekskulIdx);
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
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
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={onRevertAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs"
              title="Batalkan seluruh perubahan ekstrakurikuler yang belum disimpan"
            >
              <RotateCcwIcon className="h-3.5 w-3.5" />
              Batal Semua
            </button>
          )}
          <button
            type="button"
            disabled={isBulkSaving}
            onClick={onBulkSaveEkskul}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50"
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
                <h4 className="font-semibold text-zinc-900 text-xs">
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
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      type: "ADD",
                      siswaId: s.id,
                      siswaNama: s.nama,
                      existingEkskulNames: s.ekskul.map((e) => e.nama),
                    })
                  }
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
                  <div
                    key={eIdx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-zinc-800 truncate font-poppins">
                        {e.nama}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={e.predikat}
                        onChange={(ev) =>
                          onUpdateEkskul(
                            s.id,
                            eIdx,
                            "predikat",
                            ev.target.value as PredikatEkskul
                          )
                        }
                        className="w-32 p-1.5 border border-stone-300 rounded-lg text-xs font-semibold bg-white text-zinc-900 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Sangat Baik">Sangat Baik</option>
                        <option value="Baik">Baik</option>
                        <option value="Cukup">Cukup</option>
                        <option value="Kurang">Kurang</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            type: "DELETE",
                            siswaId: s.id,
                            siswaNama: s.nama,
                            existingEkskulNames: [],
                            ekskulIdx: eIdx,
                            ekskulNama: e.nama || "Ekstrakurikuler",
                          })
                        }
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Ekstrakurikuler"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end items-center gap-1.5">
              {!s.isEkskulSaved && (
                <button
                  type="button"
                  onClick={() => onRevertIndividual(s.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-2xs"
                  title="Batalkan perubahan ekstrakurikuler untuk siswa ini"
                >
                  <RotateCcwIcon className="h-3 w-3" />
                  <span>Batal</span>
                </button>
              )}
              <button
                type="button"
                disabled={loadingId === s.id}
                onClick={() => onSaveIndividual(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition shadow-2xs ${
                  s.isEkskulSaved
                    ? "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                }`}
              >
                {loadingId === s.id ? "Menyimpan..." : "Simpan Siswa Ini"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Konfirmasi & Pilihan Tambah / Hapus Ekskul */}
      <ModalConfirmEkskul
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        siswaNama={confirmModal.siswaNama}
        ekskulNama={confirmModal.ekskulNama}
        opsiEkskulList={opsiEkskulList}
        existingEkskulNames={confirmModal.existingEkskulNames}
        isSubmitting={loadingId === confirmModal.siswaId}
        onConfirmAdd={handleConfirmAdd}
        onConfirmDelete={handleConfirmDelete}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
