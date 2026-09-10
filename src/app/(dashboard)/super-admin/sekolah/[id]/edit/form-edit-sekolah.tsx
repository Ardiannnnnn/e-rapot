"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateSekolahSuperAdminAction } from "@/actions/sekolah";

interface SekolahData {
  id: string;
  npsn: string;
  nama: string;
  alamat: string | null;
  kepalaSekolah: string | null;
  nipKepsek: string | null;
  status: string;
}

export default function FormEditSekolah({ initialData }: { initialData: SekolahData }) {
  const router = useRouter();
  const [npsn, setNpsn] = useState(initialData.npsn);
  const [nama, setNama] = useState(initialData.nama);
  const [alamat, setAlamat] = useState(initialData.alamat || "");
  const [kepalaSekolah, setKepalaSekolah] = useState(initialData.kepalaSekolah || "");
  const [nipKepsek, setNipKepsek] = useState(initialData.nipKepsek || "");
  const [status, setStatus] = useState(initialData.status || "AKTIF");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    npsn: false,
    nama: false,
    alamat: false,
    kepalaSekolah: false,
    nipKepsek: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Validasi NPSN
  const getNpsnError = (val: string) => {
    if (!val.trim()) {
      return (submitted || touched.npsn) ? "NPSN sekolah wajib diisi (8 digit angka)." : "";
    }
    if (/[^\d]/.test(val)) {
      return "NPSN hanya boleh berisi angka (tidak boleh ada huruf, spasi, atau simbol).";
    }
    if (val.length !== 8) {
      return `NPSN harus tepat 8 digit angka (saat ini ${val.length}/8 digit).`;
    }
    return "";
  };

  // 2. Validasi Nama Sekolah
  const getNamaError = (val: string) => {
    if (!val.trim()) {
      return (submitted || touched.nama) ? "Nama sekolah wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan demi keamanan.";
    }
    return "";
  };

  // 3. Validasi Alamat
  const getAlamatError = (val: string) => {
    if (!val.trim()) {
      return (submitted || touched.alamat) ? "Alamat lengkap sekolah wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan demi keamanan.";
    }
    return "";
  };

  // 4. Validasi Nama Kepala Sekolah
  const getKepalaSekolahError = (val: string) => {
    if (!val.trim()) {
      return (submitted || touched.kepalaSekolah) ? "Nama kepala sekolah wajib diisi." : "";
    }
    if (/[<>]/.test(val)) {
      return "Karakter tag HTML (< atau >) tidak diizinkan demi keamanan.";
    }
    return "";
  };

  // 5. Validasi NIP Kepala Sekolah
  const getNipError = (val: string) => {
    if (!val.trim()) {
      return (submitted || touched.nipKepsek) ? "NIP kepala sekolah wajib diisi (18 digit angka)." : "";
    }
    if (/[^\d\s]/.test(val)) {
      return "NIP hanya boleh berisi angka dan spasi (tidak boleh ada huruf atau simbol).";
    }
    const digits = val.replace(/\s/g, "");
    if (digits.length !== 18) {
      return `NIP harus tepat 18 digit angka (saat ini ${digits.length}/18 digit). Contoh: 19780101 200501 1 002`;
    }
    return "";
  };

  const npsnError = getNpsnError(npsn);
  const namaError = getNamaError(nama);
  const alamatError = getAlamatError(alamat);
  const kepalaSekolahError = getKepalaSekolahError(kepalaSekolah);
  const nipError = getNipError(nipKepsek);

  const isNpsnValid = npsn.trim().length === 8 && !/[^\d]/.test(npsn);
  const isNamaValid = nama.trim().length > 0 && !/[<>]/.test(nama);
  const isAlamatValid = alamat.trim().length > 0 && !/[<>]/.test(alamat);
  const isKepalaSekolahValid = kepalaSekolah.trim().length > 0 && !/[<>]/.test(kepalaSekolah);
  const isNipValid = nipKepsek.trim().length > 0 && nipKepsek.replace(/\s/g, "").length === 18 && !/[^\d\s]/.test(nipKepsek);

  const hasAnyError = Boolean(
    npsnError ||
    namaError ||
    alamatError ||
    kepalaSekolahError ||
    nipError ||
    !npsn.trim() ||
    !nama.trim() ||
    !alamat.trim() ||
    !kepalaSekolah.trim() ||
    !nipKepsek.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTouched({
      npsn: true,
      nama: true,
      alamat: true,
      kepalaSekolah: true,
      nipKepsek: true,
    });
    setError("");
    setSuccess("");

    if (hasAnyError) {
      setError("Semua kolom form wajib diisi dengan benar. Silakan periksa input yang bertanda merah.");
      return;
    }

    setLoading(true);

    try {
      const res = await updateSekolahSuperAdminAction({
        id: initialData.id,
        npsn: npsn.trim(),
        nama: nama.trim(),
        alamat: alamat.trim(),
        kepalaSekolah: kepalaSekolah.trim(),
        nipKepsek: nipKepsek.trim(),
        status,
      });

      if (res.success) {
        setSuccess("Perubahan data sekolah berhasil disimpan.");
        setTimeout(() => {
          router.push("/super-admin/sekolah");
        }, 1200);
      } else {
        setError(res.message || "Gagal memperbarui data sekolah.");
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
          <span className="text-zinc-800 font-semibold">Edit Data Sekolah</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 font-poppins">
          Perbarui Profil Sekolah (Tenant)
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Perbaiki identitas instansi, kepala sekolah, atau status operasional lisensi sekolah binaan.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
              <span>✓</span>
              <span>{success} Mengalihkan kembali ke daftar sekolah...</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NPSN Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                NPSN Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={npsn}
                onBlur={() => setTouched((p) => ({ ...p, npsn: true }))}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 10203040"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono placeholder:text-zinc-400 outline-none transition ${
                  npsnError
                    ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                    : isNpsnValid
                    ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                    : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                }`}
              />
              {npsnError && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                  <span className="font-bold text-xs mt-[-1px]">✕</span>
                  <span>{npsnError}</span>
                </p>
              )}
              {isNpsnValid && (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="font-bold">✓</span>
                  <span>Format NPSN valid (8 digit angka)</span>
                </p>
              )}
            </div>

            {/* Nama Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                Nama Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onBlur={() => setTouched((p) => ({ ...p, nama: true }))}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: SD Negeri 01 Pagi"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs placeholder:text-zinc-400 outline-none transition ${
                  namaError
                    ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                    : isNamaValid
                    ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                    : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                }`}
              />
              {namaError && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                  <span className="font-bold text-xs mt-[-1px]">✕</span>
                  <span>{namaError}</span>
                </p>
              )}
              {isNamaValid && (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="font-bold">✓</span>
                  <span>Nama sekolah terisi</span>
                </p>
              )}
            </div>
          </div>

          {/* Alamat Lengkap Sekolah */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
              Alamat Lengkap Sekolah <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={alamat}
              onBlur={() => setTouched((p) => ({ ...p, alamat: true }))}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Jl. Pendidikan No. 1, Kelurahan..."
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs placeholder:text-zinc-400 outline-none transition ${
                alamatError
                  ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                  : isAlamatValid
                  ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
              }`}
            />
            {alamatError && (
              <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                <span className="font-bold text-xs mt-[-1px]">✕</span>
                <span>{alamatError}</span>
              </p>
            )}
            {isAlamatValid && (
              <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <span className="font-bold">✓</span>
                <span>Alamat lengkap terisi</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Kepala Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                Nama Kepala Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={kepalaSekolah}
                onBlur={() => setTouched((p) => ({ ...p, kepalaSekolah: true }))}
                onChange={(e) => setKepalaSekolah(e.target.value)}
                placeholder="Drs. H. Mulyadi, M.Pd."
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs placeholder:text-zinc-400 outline-none transition ${
                  kepalaSekolahError
                    ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                    : isKepalaSekolahValid
                    ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                    : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                }`}
              />
              {kepalaSekolahError && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                  <span className="font-bold text-xs mt-[-1px]">✕</span>
                  <span>{kepalaSekolahError}</span>
                </p>
              )}
              {isKepalaSekolahValid && (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="font-bold">✓</span>
                  <span>Nama kepala sekolah terisi</span>
                </p>
              )}
            </div>

            {/* NIP Kepala Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
                NIP Kepala Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nipKepsek}
                onBlur={() => setTouched((p) => ({ ...p, nipKepsek: true }))}
                onChange={(e) => setNipKepsek(e.target.value)}
                placeholder="Contoh: 19780101 200501 1 002"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono placeholder:text-zinc-400 outline-none transition ${
                  nipError
                    ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                    : isNipValid
                    ? "border-emerald-500 bg-emerald-50/20 text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                    : "border-stone-200 text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
                }`}
              />
              {nipError && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600 flex items-start gap-1">
                  <span className="font-bold text-xs mt-[-1px]">✕</span>
                  <span>{nipError}</span>
                </p>
              )}
              {isNipValid && (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="font-bold">✓</span>
                  <span>Format NIP valid (18 digit angka)</span>
                </p>
              )}
            </div>
          </div>

          {/* Status Lisensi Sekolah */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
              Status Operasional Lisensi <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none"
            >
              <option value="AKTIF">AKTIF (Dapat diakses guru & admin)</option>
              <option value="NONAKTIF">NONAKTIF (Akses dibekukan)</option>
            </select>
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
              {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
