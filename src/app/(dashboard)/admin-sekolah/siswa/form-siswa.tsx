"use client";

import React, { useState, useTransition } from "react";
import { createSiswaAction, updateSiswaAction, deleteSiswaAction } from "@/actions/siswa";

export interface SiswaRecord {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
  alamat: string | null;
  kelasId: string;
  kelas: {
    id: string;
    nama: string;
    tingkat: number;
  };
}

interface FormSiswaProps {
  initialSiswaList: SiswaRecord[];
  kelasList: { id: string; nama: string; tingkat: number }[];
}

export default function FormSiswa({ initialSiswaList, kelasList }: FormSiswaProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [filterKelas, setFilterKelas] = useState<string>("ALL");
  const [filterGender, setFilterGender] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Modal Tambah Siswa
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nisn, setNisn] = useState("");
  const [nis, setNis] = useState("");
  const [nama, setNama] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("L");
  const [kelasId, setKelasId] = useState(kelasList[0]?.id || "");
  const [alamat, setAlamat] = useState("");

  // Modal Edit Siswa / Mutasi
  const [editingSiswa, setEditingSiswa] = useState<SiswaRecord | null>(null);
  const [editNisn, setEditNisn] = useState("");
  const [editNis, setEditNis] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editJenisKelamin, setEditJenisKelamin] = useState("L");
  const [editKelasId, setEditKelasId] = useState("");
  const [editAlamat, setEditAlamat] = useState("");

  const filteredSiswa = initialSiswaList.filter((s) => {
    if (filterKelas !== "ALL" && s.kelasId !== filterKelas) return false;
    if (filterGender !== "ALL" && s.jenisKelamin !== filterGender) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.nama.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.nis.includes(q)
      );
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await createSiswaAction({
        nisn,
        nis,
        nama,
        jenisKelamin,
        kelasId,
        alamat,
      });

      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setNisn("");
        setNis("");
        setNama("");
        setAlamat("");
        setIsAddOpen(false);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    setMessage(null);

    startTransition(async () => {
      const res = await updateSiswaAction({
        id: editingSiswa.id,
        nisn: editNisn,
        nis: editNis,
        nama: editNama,
        jenisKelamin: editJenisKelamin,
        kelasId: editKelasId,
        alamat: editAlamat,
      });

      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setEditingSiswa(null);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleDelete = (id: string, namaSiswa: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data peserta didik '${namaSiswa}'?`)) return;
    setMessage(null);

    startTransition(async () => {
      const res = await deleteSiswaAction(id);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Cari nama, NISN, atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] w-full sm:w-64"
          />

          {/* Filter Rombel Kelas */}
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          >
            <option value="ALL">Semua Rombel ({initialSiswaList.length} Siswa)</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama} (Tk. {k.tingkat})
              </option>
            ))}
          </select>

          {/* Filter Gender */}
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          >
            <option value="ALL">Semua Gender</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            if (kelasList.length === 0) {
              alert("Buat data rombel kelas terlebih dahulu sebelum mendaftarkan siswa.");
              return;
            }
            setKelasId(kelasList[0].id);
            setIsAddOpen(true);
          }}
          className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] transition shadow-xs flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>Tambah Siswa Baru</span>
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

      {/* Info Ringkasan Data */}
      <div className="flex items-center justify-between text-xs text-zinc-600 px-1 font-mono">
        <span>
          Menampilkan <strong className="text-zinc-900">{filteredSiswa.length}</strong> dari total{" "}
          <strong className="text-zinc-900">{initialSiswaList.length}</strong> peserta didik terdaftar.
        </span>
      </div>

      {/* Tabel Data Siswa */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5 min-w-[200px]">Nama Peserta Didik</th>
                <th className="px-4 py-3.5 w-32 font-mono">NISN / NIS</th>
                <th className="px-4 py-3.5 w-28 text-center">L/P</th>
                <th className="px-4 py-3.5 w-32 text-center">Rombel Kelas</th>
                <th className="px-4 py-3.5">Alamat</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-600">
                    Tidak ada data peserta didik yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-center text-zinc-600 font-mono">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-zinc-900 text-sm">{s.nama}</div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs">
                      <div className="text-zinc-900 font-semibold">{s.nisn}</div>
                      <div className="text-[11px] text-zinc-600">NIS: {s.nis}</div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          s.jenisKelamin === "L"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {s.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Kelas {s.kelas.nama}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 max-w-xs truncate">
                      {s.alamat || "-"}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSiswa(s);
                            setEditNisn(s.nisn);
                            setEditNis(s.nis);
                            setEditNama(s.nama);
                            setEditJenisKelamin(s.jenisKelamin);
                            setEditKelasId(s.kelasId);
                            setEditAlamat(s.alamat || "");
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 text-zinc-600 hover:text-zinc-900 hover:bg-stone-50 transition"
                          title="Edit biodata atau mutasi kelas"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.nama)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus siswa"
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

      {/* Modal Tambah Siswa */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Pendaftaran Peserta Didik Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NISN (10 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="0081234567"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NIS (Nomor Induk Siswa) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="2026001"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Rombel Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama} (Tk. {k.tingkat})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Merdeka No. 12, Kelurahan..."
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-stone-300 hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition"
                >
                  {isPending ? "Mendaftarkan..." : "Daftarkan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Siswa / Mutasi Kelas */}
      {editingSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-zinc-900 text-base font-poppins">
                Edit Biodata / Mutasi Rombel Siswa
              </h3>
              <button
                type="button"
                onClick={() => setEditingSiswa(null)}
                className="text-zinc-600 hover:text-zinc-900 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NISN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    NIS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNis}
                    onChange={(e) => setEditNis(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editJenisKelamin}
                    onChange={(e) => setEditJenisKelamin(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mutasi ke Rombel Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editKelasId}
                    onChange={(e) => setEditKelasId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama} (Tk. {k.tingkat})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alamat
                </label>
                <textarea
                  rows={2}
                  value={editAlamat}
                  onChange={(e) => setEditAlamat(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
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
