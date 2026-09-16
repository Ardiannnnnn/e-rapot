"use client";

import { useState } from "react";
import {
  SlidersHorizontalIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SaveIcon,
  RotateCcwIcon,
  UsersIcon,
  PrinterIcon,
} from "@/components/shared/icons";
import { updatePengaturanKelasAction } from "@/actions/pengaturan-nilai";
import ModalBobotNilai from "@/app/(dashboard)/guru/siswa/modal-bobot-nilai";
import { toast } from "@/components/shared/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PengampuItem {
  id: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  guruNama: string;
  bobotTugas: number | null;
  bobotUTS: number | null;
  bobotUAS: number | null;
}

interface PengaturanRankingClientProps {
  kelasId: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  pengampuList: PengampuItem[];
  initialConfig: {
    penaltiAlpa: number;
    penaltiIzin: number;
    penaltiSakit: number;
    maxAlpaJuara: number | null;
  };
  totalSiswa: number;
}

export default function PengaturanRankingClient({
  kelasId,
  kelasNama,
  tingkat,
  tahunAjaran,
  semester,
  pengampuList,
  initialConfig,
  totalSiswa,
}: PengaturanRankingClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"RANKING" | "BOBOT">("RANKING");

  // Form State Penalti Presensi
  const [penaltiAlpa, setPenaltiAlpa] = useState<number>(initialConfig.penaltiAlpa);
  const [penaltiIzin, setPenaltiIzin] = useState<number>(initialConfig.penaltiIzin);
  const [penaltiSakit, setPenaltiSakit] = useState<number>(initialConfig.penaltiSakit);
  const [maxAlpaJuara, setMaxAlpaJuara] = useState<string>(
    initialConfig.maxAlpaJuara !== null ? String(initialConfig.maxAlpaJuara) : ""
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Modal edit bobot mapel
  const [selectedPengampu, setSelectedPengampu] = useState<PengampuItem | null>(null);

  const parsedMaxAlpa =
    maxAlpaJuara !== "" && !isNaN(parseInt(maxAlpaJuara, 10)) && parseInt(maxAlpaJuara, 10) > 0
      ? parseInt(maxAlpaJuara, 10)
      : null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);

    try {
      const res = await updatePengaturanKelasAction({
        kelasId,
        tahunAjaran,
        semester,
        penaltiAlpa,
        penaltiIzin,
        penaltiSakit,
        maxAlpaJuara: parsedMaxAlpa,
      });

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleResetDefaults = () => {
    setPenaltiAlpa(1.0);
    setPenaltiIzin(0.0);
    setPenaltiSakit(0.0);
    setMaxAlpaJuara("3");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b4332] to-[#143225] p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium backdrop-blur-sm font-mono">
                Portal Wali Kelas • Kelas {kelasNama} (Tingkat {tingkat})
              </span>
              <span className="text-emerald-400">•</span>
              <span className="text-xs text-emerald-200 font-mono">
                TA {tahunAjaran} • Semester {semester === 1 ? "Ganjil" : "Genap"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins">
              Bobot Nilai & Aturan Presensi
            </h1>
            <p className="mt-1 text-sm text-emerald-100/90">
              Konfigurasi pembobotan nilai per mata pelajaran dan kebijakan potongan poin presensi ({totalSiswa} siswa binaan).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              href="/wali-kelas/siswa"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all shadow-xs"
            >
              <UsersIcon className="h-3.5 w-3.5" />
              Lihat Rekap Siswa
            </Link>
            <Link
              href="/wali-kelas/cetak"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              Cetak Rapor
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigasi Standar Sesuai Menu Lain */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("RANKING")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "RANKING"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
          }`}
        >
          <span>⚖️</span>
          <span>1. Kebijakan & Penalti Presensi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BOBOT")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "BOBOT"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-stone-100 text-zinc-600 hover:bg-stone-200"
          }`}
        >
          <SlidersHorizontalIcon className="h-4 w-4" />
          <span>2. Matriks Bobot Mata Pelajaran</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "BOBOT"
                ? "bg-emerald-400 text-emerald-950"
                : "bg-stone-200 text-zinc-700"
            }`}
          >
            {pengampuList.length} Mapel
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PENGATURAN KEBIJAKAN & PENALTI PRESENSI */}
      {/* ========================================================================= */}
      {activeTab === "RANKING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Form Aturan Penalti Presensi */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm shadow-2xs">
                    ⚖️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 font-poppins">
                      Kebijakan Potongan Poin Presensi
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Konfigurasi bobot pengurang nilai per hari ketidakhadiran siswa
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
                  title="Kembalikan ke standar default"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" />
                  Reset Default
                </button>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Tentukan berapa poin yang dikurangkan dari akumulasi evaluasi nilai siswa per hari ketidakhadiran di kelas ini.
              </p>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                {/* Penalti Alpa */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <span>🚫 Potongan Alpa (Tanpa Keterangan)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono font-bold">
                        Per Hari
                      </span>
                    </label>
                    <span className="text-xs font-mono text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded">
                      -{penaltiAlpa} poin
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={penaltiAlpa}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPenaltiAlpa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white border border-rose-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-2xs"
                  />
                  <span className="text-[11px] text-zinc-500 block">
                    Misal siswa memiliki 2 hari alpa &times; {penaltiAlpa} = -{Math.round(2 * penaltiAlpa * 10) / 10} poin pengurangan.
                  </span>
                </div>

                {/* Penalti Izin */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>📩 Potongan Izin</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono font-bold">
                        Per Hari
                      </span>
                    </label>
                    <span className="text-xs font-mono text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                      -{penaltiIzin} poin
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={penaltiIzin}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPenaltiIzin(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                  <span className="text-[11px] text-zinc-500 block">
                    Beri nilai 0 jika izin resmi tidak mengurangi poin evaluasi siswa.
                  </span>
                </div>

                {/* Penalti Sakit */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <span>🏥 Potongan Sakit</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-mono font-bold">
                        Per Hari
                      </span>
                    </label>
                    <span className="text-xs font-mono text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                      -{penaltiSakit} poin
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={penaltiSakit}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPenaltiSakit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <span className="text-[11px] text-zinc-500 block">
                    Disarankan bernilai 0 jika ketidakhadiran sakit disertai surat keterangan dokter.
                  </span>
                </div>

                {/* Batas Maksimal Toleransi Alpa */}
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                  <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span>🛡️ Batas Maksimal Toleransi Alpa</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    placeholder="Kosongkan atau isi 0 jika tanpa batas"
                    value={maxAlpaJuara}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setMaxAlpaJuara(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1b4332] shadow-2xs"
                  />
                  <span className="text-[11px] text-zinc-500 block leading-relaxed">
                    Batas maksimal hari alpa yang ditoleransi per semester. Siswa yang melebihi batas ini akan ditandai untuk evaluasi khusus wali kelas.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="w-full py-3 px-4 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <SaveIcon className="h-4 w-4" />
                    {isSavingConfig ? "Menyimpan Aturan..." : "Simpan Aturan Presensi"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Panduan & Informasi Presensi */}
          <div className="lg:col-span-5 space-y-5">
            {/* Card Panduan & Rumus */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-bold">
                  📘
                </div>
                <h4 className="text-xs font-bold text-zinc-900 font-poppins uppercase tracking-wider">
                  Panduan Pengaruh Presensi
                </h4>
              </div>

              <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-bold text-zinc-900 block mb-1">📐 Rumus Penalti Presensi</span>
                  <div className="font-mono text-[11px] bg-white p-2 rounded border border-stone-200 text-emerald-800 font-bold text-center">
                    Total Penalti = (Alpa &times; Potongan) + (Izin &times; Potongan) + (Sakit &times; Potongan)
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Nilai Evaluasi = Total Nilai Akumulasi - Total Penalti Presensi.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <p className="text-[11.5px]">
                      <strong>Aman & Terpisah:</strong> Penalti presensi hanya digunakan untuk evaluasi kedisiplinan dan <em>sama sekali tidak mengubah nilai rapor murni</em> pada masing-masing mata pelajaran.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold">✓</span>
                    <p className="text-[11.5px]">
                      <strong>Peringatan Dini:</strong> Siswa yang memiliki jumlah Alpa melebihi batas toleransi akan mendapatkan tanda evaluasi bagi wali kelas dan guru BK.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATRIKS BOBOT NILAI MATA PELAJARAN KELAS */}
      {/* ========================================================================= */}
      {activeTab === "BOBOT" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                  Daftar Bobot Penilaian per Mata Pelajaran (Kelas {kelasNama})
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Setiap mata pelajaran dapat memiliki komposisi persentase yang berbeda sesuai karakteristik materi. Sebagai Wali Kelas, Anda dapat menyesuaikan bobot jika diperlukan.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[11px] font-semibold text-zinc-600 uppercase border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Guru Pengampu</th>
                    <th className="py-3 px-3 text-center">Tugas (Formatif)</th>
                    <th className="py-3 px-3 text-center">UTS (Tengah)</th>
                    <th className="py-3 px-3 text-center">UAS (Akhir)</th>
                    <th className="py-3 px-3 text-center">Total Bobot</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pengampuList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400 italic">
                        Belum ada penugasan guru pengampu di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    pengampuList.map((p) => {
                      const isConfigured =
                        p.bobotTugas !== null &&
                        p.bobotUTS !== null &&
                        p.bobotUAS !== null;
                      const total = isConfigured
                        ? (p.bobotTugas || 0) + (p.bobotUTS || 0) + (p.bobotUAS || 0)
                        : null;
                      return (
                        <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-zinc-900">
                            <div>{p.mapelNama}</div>
                            <div className="font-mono text-[10.5px] text-zinc-400 font-normal">
                              Kode: {p.mapelKode}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-700">
                            {p.guruNama}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-zinc-800">
                            {p.bobotTugas !== null ? (
                              <span className="px-2 py-0.5 rounded bg-stone-100">
                                {p.bobotTugas}%
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-zinc-800">
                            {p.bobotUTS !== null ? (
                              <span className="px-2 py-0.5 rounded bg-stone-100">
                                {p.bobotUTS}%
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-zinc-800">
                            {p.bobotUAS !== null ? (
                              <span className="px-2 py-0.5 rounded bg-stone-100">
                                {p.bobotUAS}%
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold">
                            {!isConfigured ? (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                                Belum Disetel
                              </span>
                            ) : total === 100 ? (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {total}%
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                                {total}%
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPengampu(p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                                !isConfigured
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                                  : "border border-stone-200 hover:border-[#1b4332] text-zinc-700 hover:text-[#1b4332]"
                              }`}
                            >
                              <SlidersHorizontalIcon className="h-3.5 w-3.5 text-emerald-700" />
                              <span>{!isConfigured ? "Atur Bobot" : "Ubah Bobot"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Bobot Pengampu */}
      {selectedPengampu && (
        <ModalBobotNilai
          pengampuId={selectedPengampu.id}
          mapelNama={selectedPengampu.mapelNama}
          kelasNama={kelasNama}
          initialBobotTugas={selectedPengampu.bobotTugas}
          initialBobotUTS={selectedPengampu.bobotUTS}
          initialBobotUAS={selectedPengampu.bobotUAS}
          onClose={() => setSelectedPengampu(null)}
          onSuccess={(b) => {
            selectedPengampu.bobotTugas = b.tugas;
            selectedPengampu.bobotUTS = b.uts;
            selectedPengampu.bobotUAS = b.uas;
          }}
        />
      )}
    </div>
  );
}
