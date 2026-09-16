"use client";

import { useState } from "react";
import { XIcon, SlidersHorizontalIcon, CheckCircle2Icon, AlertCircleIcon } from "@/components/shared/icons";
import { updateBobotPengampuAction } from "@/actions/pengaturan-nilai";
import { toast } from "@/components/shared/toast";
import { useRouter } from "next/navigation";

interface ModalBobotNilaiProps {
  pengampuId: string;
  mapelNama: string;
  kelasNama: string;
  initialBobotTugas?: number | null;
  initialBobotUTS?: number | null;
  initialBobotUAS?: number | null;
  onClose: () => void;
  onSuccess?: (bobot: { tugas: number; uts: number; uas: number }) => void;
}

export default function ModalBobotNilai({
  pengampuId,
  mapelNama,
  kelasNama,
  initialBobotTugas,
  initialBobotUTS,
  initialBobotUAS,
  onClose,
  onSuccess,
}: ModalBobotNilaiProps) {
  const router = useRouter();
  const [bobotTugas, setBobotTugas] = useState<number>(initialBobotTugas ?? 0);
  const [bobotUTS, setBobotUTS] = useState<number>(initialBobotUTS ?? 0);
  const [bobotUAS, setBobotUAS] = useState<number>(initialBobotUAS ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = Math.round((bobotTugas + bobotUTS + bobotUAS) * 10) / 10;
  const isValid = total === 100;

  const handleApplyPreset = (t: number, u: number, a: number) => {
    setBobotTugas(t);
    setBobotUTS(u);
    setBobotUAS(a);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error(`Total bobot harus tepat 100%. Saat ini masih ${total}%.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateBobotPengampuAction({
        pengampuId,
        bobotTugas,
        bobotUTS,
        bobotUAS,
      });

      if (res.success) {
        toast.success(res.message);
        if (onSuccess) {
          onSuccess({ tugas: bobotTugas, uts: bobotUTS, uas: bobotUAS });
        }
        router.refresh();
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal menyimpan bobot penilaian.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <SlidersHorizontalIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                Atur Bobot Penilaian Mapel
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                {mapelNama} • Kelas {kelasNama}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-stone-100 transition"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Tentukan persentase kontribusi masing-masing komponen terhadap <strong>Nilai Akhir Rapor</strong>. Total ketiga komponen harus berjumlah tepat <strong>100%</strong>.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-zinc-700">
                Tugas / Harian
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bobotTugas}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setBobotTugas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full pr-6 pl-3 py-2 text-center text-sm font-bold font-mono rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#1b4332]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-zinc-700">
                UTS (Tengah)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bobotUTS}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setBobotUTS(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full pr-6 pl-3 py-2 text-center text-sm font-bold font-mono rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#1b4332]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-zinc-700">
                UAS (Akhir)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bobotUAS}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setBobotUAS(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full pr-6 pl-3 py-2 text-center text-sm font-bold font-mono rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#1b4332]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Indikator Total Validasi */}
          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold border ${
              isValid
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isValid ? (
                <CheckCircle2Icon className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircleIcon className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>
                {isValid
                  ? "Total Bobot Valid (Pas 100%)"
                  : `Total: ${total}% (${total < 100 ? `Kurang ${100 - total}%` : `Lebih ${total - 100}%`})`}
              </span>
            </div>
            <span className="font-mono text-sm font-bold">{total}%</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-semibold transition shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? "Menyimpan & Menghitung..." : "Simpan & Terapkan Bobot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
