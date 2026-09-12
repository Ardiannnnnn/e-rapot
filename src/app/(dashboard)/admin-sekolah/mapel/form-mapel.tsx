"use client";

import React, { useState, useTransition } from "react";
import { createMapelAction, updateMapelAction, deleteMapelAction } from "@/actions/mapel";
import { Trash2Icon } from "@/components/shared/icons";
import { toast } from "@/components/shared/toast";

export interface MapelItem {
  id: string;
  kode: string;
  nama: string;
  isMulok?: boolean;
  isSeni?: boolean;
  totalPengampu: number;
  totalTP: number;
}

export default function FormMapel({ initialMapelList }: { initialMapelList: MapelItem[] }) {
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MapelItem | null>(null);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [isMulok, setIsMulok] = useState(false);
  const [isSeni, setIsSeni] = useState(false);

  const [editingMapel, setEditingMapel] = useState<MapelItem | null>(null);
  const [editKode, setEditKode] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editIsMulok, setEditIsMulok] = useState(false);
  const [editIsSeni, setEditIsSeni] = useState(false);

  const filteredMapel = initialMapelList.filter(
    (m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.kode.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await createMapelAction({ kode, nama, isMulok, isSeni });
      if (res.success) {
        toast.success(res.message);
        setKode("");
        setNama("");
        setIsMulok(false);
        setIsSeni(false);
        setIsAddModalOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapel) return;

    startTransition(async () => {
      const res = await updateMapelAction({
        id: editingMapel.id,
        kode: editKode,
        nama: editNama,
        isMulok: editIsMulok,
        isSeni: editIsSeni,
      });
      if (res.success) {
        toast.success(res.message);
        setEditingMapel(null);
      } else {
        toast.error(res.message);
      }
    });
  };

  const executeDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteMapelAction(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari kode atau nama mapel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      {/* Tabel Data Mata Pelajaran */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5 w-32">Kode Mapel</th>
                <th className="px-4 py-3.5">Nama Mata Pelajaran</th>
                <th className="px-4 py-3.5 text-center">Guru Pengampu</th>
                <th className="px-4 py-3.5 text-center">Bank TP</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredMapel.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-600">
                    Tidak ada mata pelajaran yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredMapel.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-center text-zinc-600 font-mono">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {m.kode}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                        <span className="font-semibold text-zinc-900 text-sm">{m.nama}</span>
                        {m.isSeni ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-800 border border-violet-200 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                            Seni Pilihan
                          </span>
                        ) : m.isMulok ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Muatan Lokal (Mulok)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-zinc-600 w-fit">
                            Mapel Wajib
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-zinc-700">
                        {m.totalPengampu} rombel
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        {m.totalTP} TP
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMapel(m);
                            setEditKode(m.kode);
                            setEditNama(m.nama);
                            setEditIsMulok(!!m.isMulok);
                            setEditIsSeni(!!m.isSeni);
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 transition"
                          title="Ubah data mapel"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(m)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus mapel"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Mapel */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Tambah Mata Pelajaran Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Kategori / Jenis Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMulok(false);
                      setIsSeni(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      !isMulok && !isSeni
                        ? "border-[#1b4332] bg-emerald-50/60 ring-1 ring-[#1b4332]"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-900">Mapel Wajib</span>
                      {!isMulok && !isSeni && <span className="text-xs font-bold text-[#1b4332]">✓</span>}
                    </div>
                    <span className="text-[9.5px] text-zinc-500 leading-tight">
                      Umum / Nasional
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMulok(false);
                      setIsSeni(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      isSeni
                        ? "border-violet-500 bg-violet-50/70 ring-1 ring-violet-500"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-violet-900">Seni Pilihan</span>
                      {isSeni && <span className="text-xs font-bold text-violet-700">✓</span>}
                    </div>
                    <span className="text-[9.5px] text-violet-700/80 leading-tight">
                      Musik, Rupa, dll.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMulok(true);
                      setIsSeni(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      isMulok
                        ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-500"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900">Muatan Lokal</span>
                      {isMulok && <span className="text-xs font-bold text-amber-700">✓</span>}
                    </div>
                    <span className="text-[9.5px] text-amber-700/80 leading-tight">
                      Bhs. Daerah, dll.
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kode Singkat Mapel (Contoh: {isSeni ? "MUSIK, RUPA, TARI" : isMulok ? "SIMEULUE, ACEH" : "MAT, IPA"}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder={isSeni ? "MUSIK" : isMulok ? "SIMEULUE" : "KODING"}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono font-bold text-zinc-900 uppercase focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Resmi Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder={isSeni ? "Contoh: Seni Musik / Seni Rupa" : isMulok ? "Contoh: Bahasa Simeulue" : "Contoh: Koding & Robotika"}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition"
                >
                  {isPending ? "Menyimpan..." : "Simpan Mapel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Mapel */}
      {editingMapel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Edit Mata Pelajaran
              </h3>
              <button
                type="button"
                onClick={() => setEditingMapel(null)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Kategori / Jenis Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditIsMulok(false);
                      setEditIsSeni(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      !editIsMulok && !editIsSeni
                        ? "border-[#1b4332] bg-emerald-50/60 ring-1 ring-[#1b4332]"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-900">Mapel Wajib</span>
                      {!editIsMulok && !editIsSeni && <span className="text-xs font-bold text-[#1b4332]">✓</span>}
                    </div>
                    <span className="text-[9.5px] text-zinc-500 leading-tight">
                      Umum / Nasional
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditIsMulok(false);
                      setEditIsSeni(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      editIsSeni
                        ? "border-violet-500 bg-violet-50/70 ring-1 ring-violet-500"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-violet-900">Seni Pilihan</span>
                      {editIsSeni && <span className="text-xs font-bold text-violet-700">✓</span>}
                    </div>
                    <span className="text-[9.5px] text-violet-700/80 leading-tight">
                      Musik, Rupa, dll.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditIsMulok(true);
                      setEditIsSeni(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      editIsMulok
                        ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-500"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900">Muatan Lokal</span>
                      {editIsMulok && <span className="text-xs font-bold text-amber-700">✓</span>}
                    </div>
                    <span className="text-[9.5px] text-amber-700/80 leading-tight">
                      Bhs. Daerah, dll.
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kode Mapel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editKode}
                  onChange={(e) => setEditKode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono font-bold text-zinc-900 uppercase focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingMapel(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Mapel (In-App Modal) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                  Hapus Mata Pelajaran?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus mata pelajaran{" "}
              <strong className="text-zinc-900 font-semibold">{deleteTarget.nama}</strong> ({deleteTarget.kode})?
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  executeDelete(target.id);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Mapel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
