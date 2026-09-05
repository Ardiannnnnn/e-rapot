"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginAction({ email, password });

      if (!res.success) {
        setError(res.message || "Gagal masuk.");
      } else {
        onClose();
        router.push("/dashboard");
      }
    } catch {
      setError("Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };


  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative border border-stone-100"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-xl font-bold text-gray-900 font-poppins">Masuk ke Akun</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {/* Tampilkan pesan error jika login gagal */}
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="placeholder:text-zinc-400 bg-white text-zinc-900 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="placeholder:text-zinc-400 bg-white text-zinc-900 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1b4332] hover:bg-[#143225] disabled:bg-stone-400 py-2.5 text-sm font-semibold text-white transition-all shadow-sm cursor-pointer mt-2"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}