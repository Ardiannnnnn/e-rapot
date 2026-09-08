"use client";

import React, { useState, useTransition } from "react";
import { createMapelAction, updateMapelAction, deleteMapelAction } from "@/actions/mapel";

export interface MapelItem {
  id: string;
  kode: string;
  nama: string;
  isMulok?: boolean;
  totalPengampu: number;
  totalTP: number;
}

export default function FormMapel({ initialMapelList }: { initialMapelList: MapelItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [isMulok, setIsMulok] = useState(false);

  const [editingMapel, setEditingMapel] = useState<MapelItem | null>(null);
  const [editKode, setEditKode] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editIsMulok, setEditIsMulok] = useState(false);

  const filteredMapel = initialMapelList.filter(
    (m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.kode.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await createMapelAction({ kode, nama, isMulok });
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setKode("");
        setNama("");
        setIsMulok(false);
        setIsAddModalOpen(false);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapel) return;
    setMessage(null);

    startTransition(async () => {
      const res = await updateMapelAction({
        id: editingMapel.id,
        kode: editKode,
        nama: editNama,
        isMulok: editIsMulok,
      });
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setEditingMapel(null);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran '${name}'?`)) return;
    setMessage(null);

    startTransition(async () => {
      const res = await deleteMapelAction(id);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
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

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="font-bold text-zinc-600 ml-2">
            ✕
          </button>
        </div>
      )}

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
                        {m.isMulok ? (
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
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 transition"
                          title="Ubah data mapel"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(m.id, m.nama)}
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
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsMulok(false)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      !isMulok
                        ? "border-[#1b4332] bg-emerald-50/60 ring-1 ring-[#1b4332]"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">Mapel Wajib / Umum</span>
                      {!isMulok && <span className="text-xs font-bold text-[#1b4332]">✓</span>}
                    </div>
                    <span className="text-[10.5px] text-zinc-500 leading-tight">
                      Kurikulum nasional standar
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMulok(true)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      isMulok
                        ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-500"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">Muatan Lokal (Mulok)</span>
                      {isMulok && <span className="text-xs font-bold text-amber-700">✓</span>}
                    </div>
                    <span className="text-[10.5px] text-amber-700/80 leading-tight">
                      Bhs. Simeulue, Daerah, dsb.
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kode Singkat Mapel (Contoh: {isMulok ? "SIMEULUE, ACEH" : "MAT, IPA"}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder={isMulok ? "SIMEULUE" : "KODING"}
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
                  placeholder={isMulok ? "Contoh: Bahasa Simeulue" : "Contoh: Koding & Robotika"}
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
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditIsMulok(false)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      !editIsMulok
                        ? "border-[#1b4332] bg-emerald-50/60 ring-1 ring-[#1b4332]"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">Mapel Wajib / Umum</span>
                      {!editIsMulok && <span className="text-xs font-bold text-[#1b4332]">✓</span>}
                    </div>
                    <span className="text-[10.5px] text-zinc-500 leading-tight">
                      Kurikulum nasional standar
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsMulok(true)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      editIsMulok
                        ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-500"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">Muatan Lokal (Mulok)</span>
                      {editIsMulok && <span className="text-xs font-bold text-amber-700">✓</span>}
                    </div>
                    <span className="text-[10.5px] text-amber-700/80 leading-tight">
                      Bhs. Simeulue, Daerah, dsb.
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
    </div>
  );
}
