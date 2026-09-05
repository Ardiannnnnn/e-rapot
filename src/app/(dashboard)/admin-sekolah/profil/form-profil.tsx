"use client";

import React, { useState, useTransition } from "react";
import { updateProfilSekolahAction } from "@/actions/sekolah";

interface ProfilSekolahData {
  id: string;
  npsn: string;
  nama: string;
  alamat: string | null;
  kepalaSekolah: string | null;
  nipKepsek: string | null;
  status: string;
}

export default function FormProfilSekolah({ sekolah }: { sekolah: ProfilSekolahData }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [npsn, setNpsn] = useState(sekolah.npsn);
  const [nama, setNama] = useState(sekolah.nama);
  const [alamat, setAlamat] = useState(sekolah.alamat || "");
  const [kepalaSekolah, setKepalaSekolah] = useState(sekolah.kepalaSekolah || "");
  const [nipKepsek, setNipKepsek] = useState(sekolah.nipKepsek || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await updateProfilSekolahAction({
        sekolahId: sekolah.id,
        npsn,
        nama,
        alamat,
        kepalaSekolah,
        nipKepsek,
      });

      if (res.success) {
        setMessage({ type: "success", text: res.message || "Profil sekolah berhasil diperbarui." });
      } else {
        setMessage({ type: "error", text: res.message || "Gagal memperbarui profil." });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Input Data Sekolah */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="text-base font-bold text-zinc-900 font-poppins">
              Identitas Satuan Pendidikan & Kepala Sekolah
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Data ini digunakan secara otomatis pada bagian kop rapor dan pengesahan tanda tangan kepala sekolah.
            </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                NPSN (Nomor Pokok Sekolah Nasional) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 10203040"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Status Operasional Satuan
              </label>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {sekolah.status || "AKTIF"}
                </span>
                <span className="text-[11px] text-zinc-600">Dikelola oleh Super Administrator</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Nama Resmi Sekolah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: SD Negeri 01 Merdeka Jakarta"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 font-semibold focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Alamat Lengkap Sekolah
            </label>
            <textarea
              rows={3}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Jl. Pendidikan No. 10, Gambir, Jakarta Pusat..."
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
            />
          </div>

          <div className="pt-2 border-t border-stone-200">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
              Identitas Pimpinan Satuan Pendidikan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Nama Lengkap Kepala Sekolah (Beserta Gelar)
                </label>
                <input
                  type="text"
                  value={kepalaSekolah}
                  onChange={(e) => setKepalaSekolah(e.target.value)}
                  placeholder="Drs. H. Mulyadi, M.Pd."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={nipKepsek}
                  onChange={(e) => setNipKepsek(e.target.value)}
                  placeholder="19780101 200501 1 002"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-200">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition shadow-xs flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Pratinjau Lembar Pengesahan Rapor */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-3 font-mono">
            📄 Pratinjau Tanda Tangan Resmi Rapor
          </span>

          <div className="bg-white rounded-xl border border-stone-200 p-5 text-center text-xs space-y-4 shadow-2xs">
            <div className="border-b border-stone-200 pb-2">
              <p className="font-bold text-zinc-900 text-sm">{nama || "NAMA SEKOLAH"}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">{alamat || "Alamat sekolah belum diisi"}</p>
              <p className="text-[10px] font-mono text-zinc-600">NPSN: {npsn || "-"}</p>
            </div>

            <div className="pt-2 text-zinc-700">
              <p className="text-[11px] text-zinc-600">Mengetahui,</p>
              <p className="font-semibold text-zinc-800 mt-0.5">Kepala Sekolah</p>

              <div className="h-14 flex items-center justify-center text-zinc-600 text-[10px] italic">
                (Tanda Tangan & Cap Stempel)
              </div>

              <p className="font-bold text-zinc-900 underline text-xs">
                {kepalaSekolah || "Nama Kepala Sekolah Belum Diisi"}
              </p>
              <p className="font-mono text-[11px] text-zinc-600 mt-0.5">
                NIP. {nipKepsek || "-"}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800 leading-relaxed">
            ℹ️ Informasi di atas akan langsung disinkronkan ke seluruh pencetakan e-Rapor dan dokumen kelulusan siswa.
          </div>
        </div>
      </div>
    </div>
  );
}
