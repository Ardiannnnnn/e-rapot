"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginAction({ email, password });
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      } else {
        setError(res.message || "Gagal masuk. Periksa email & kata sandi.");
        setLoading(false);
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Brand & Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#143225] text-white flex items-center justify-center font-bold text-lg tracking-wider shadow-xs">
            ER
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 font-poppins">
            Masuk Portal E-Rapor
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-sans">
            Sistem Informasi Rapor SD • Kurikulum Merdeka
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 font-sans">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white py-2.5 text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memverifikasi...
              </>
            ) : (
              "Masuk ke Portal"
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-100 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-800 transition font-medium"
          >
            &larr; Kembali ke Beranda Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
