"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSekolahAction } from "@/actions/sekolah";

export default function TambahSekolahPage() {
  const router = useRouter();
  const [npsn, setNpsn] = useState("");
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kepalaSekolah, setKepalaSekolah] = useState("");
  const [nipKepsek, setNipKepsek] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await createSekolahAction({
        npsn,
        nama,
        alamat,
        kepalaSekolah,
        nipKepsek,
      });

      if (res.success) {
        router.push("/super-admin/sekolah");
      } else {
        setError(res.message || "Gagal mendaftarkan sekolah.");
        setLoading(false);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mb-1">
          <Link href="/super-admin/sekolah" className="hover:text-zinc-800">
            Kelola Sekolah
          </Link>
          <span>/</span>
          <span className="text-zinc-800 font-semibold">Tambah Baru</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 font-poppins">
          Registrasi Sekolah Baru (Tenant)
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Daftarkan instansi sekolah baru untuk menggunakan portal e-raport Kurikulum Merdeka.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                NPSN Sekolah *
              </label>
              <input
                type="text"
                required
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 10203040"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                Nama Sekolah *
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: SD Negeri 01 Pagi"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
              Alamat Lengkap Sekolah
            </label>
            <textarea
              rows={3}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Jl. Pendidikan No. 1, Kelurahan..."
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={kepalaSekolah}
                onChange={(e) => setKepalaSekolah(e.target.value)}
                placeholder="Drs. H. Mulyadi, M.Pd."
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={nipKepsek}
                onChange={(e) => setNipKepsek(e.target.value)}
                placeholder="19780101 200501 1 002"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
            <Link
              href="/super-admin/sekolah"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-zinc-700 transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan & Aktifkan Sekolah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
