"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { simpanNilaiBatchAction, NilaiInputItem } from "@/actions/nilai";

interface SiswaItem {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
}

interface NilaiData {
  siswaId: string;
  nilaiTugas: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir: number;
  catatan: string | null;
}

interface PengampuOption {
  id: string;
  kelasId: string;
  mapelId: string;
  tahunAjaran: string;
  kelas: {
    id: string;
    nama: string;
    tingkat: number;
  };
  mapel: {
    id: string;
    kode: string;
    nama: string;
  };
}

interface TPItem {
  id: string;
  kode: string;
  deskripsi: string;
  tingkat: number;
}

interface FormInputNilaiProps {
  daftarPengampu: PengampuOption[];
  activePengampu: PengampuOption;
  siswaList: SiswaItem[];
  nilaiList: NilaiData[];
  tpList: TPItem[];
  selectedTahunAjaran: string;
  selectedSemester: number;
  isLocked: boolean;
}

export default function FormInputNilai({
  daftarPengampu,
  activePengampu,
  siswaList,
  nilaiList,
  tpList,
  selectedTahunAjaran,
  selectedSemester,
  isLocked,
}: FormInputNilaiProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Inisialisasi state form per siswa
  const initialValues: Record<
    string,
    { tugas: string; uts: string; uas: string; checkedTPs: string[] }
  > = {};

  siswaList.forEach((s) => {
    const existing = nilaiList.find((n) => n.siswaId === s.id);

    // Ambil TP yang sudah pernah tersimpan sebelumnya (jika ada)
    const savedChecked: string[] = [];
    if (existing?.catatan) {
      tpList.forEach((t) => {
        if (existing.catatan?.includes(t.kode) || existing.catatan?.includes(t.deskripsi)) {
          savedChecked.push(t.id);
        }
      });
    }

    initialValues[s.id] = {
      tugas: existing && existing.nilaiTugas > 0 ? String(existing.nilaiTugas) : "",
      uts: existing && existing.nilaiUTS > 0 ? String(existing.nilaiUTS) : "",
      uas: existing && existing.nilaiUAS > 0 ? String(existing.nilaiUAS) : "",
      checkedTPs: savedChecked,
    };
  });

  const [formData, setFormData] = useState(initialValues);

  // Handle perubahan input angka
  const handleScoreChange = (siswaId: string, field: "tugas" | "uts" | "uas", value: string) => {
    if (isLocked) return;
    setFormData((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value,
      },
    }));
  };

  // Handle toggle centang checkbox TP per siswa
  const handleToggleTP = (siswaId: string, tpId: string) => {
    if (isLocked) return;
    setFormData((prev) => {
      const current = prev[siswaId]?.checkedTPs || [];
      const exists = current.includes(tpId);
      const nextChecked = exists
        ? current.filter((id) => id !== tpId)
        : [...current, tpId];

      return {
        ...prev,
        [siswaId]: {
          ...prev[siswaId],
          checkedTPs: nextChecked,
        },
      };
    });
  };

  // Kalkulasi nilai akhir: Bobot Tugas 30% + UTS 30% + UAS 40%
  const hitungNilaiAkhir = (tugasStr: string, utsStr: string, uasStr: string) => {
    const tugas = parseFloat(tugasStr) || 0;
    const uts = parseFloat(utsStr) || 0;
    const uas = parseFloat(uasStr) || 0;
    if (tugas === 0 && uts === 0 && uas === 0) return 0;
    return Math.round((tugas * 0.3 + uts * 0.3 + uas * 0.4) * 10) / 10;
  };

  const getPredikat = (nilai: number) => {
    if (nilai === 0) return { label: "-", color: "text-zinc-600 bg-stone-100" };
    if (nilai >= 85) return { label: "A (Sangat Baik)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (nilai >= 75) return { label: "B (Baik)", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (nilai >= 65) return { label: "C (Cukup)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "D (Perlu Bimbingan)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  // Auto-fill simulasi nilai dan centang TP
  const handleAutoFill = (val: number) => {
    const nextState: typeof formData = {};
    siswaList.forEach((s) => {
      const offset = (s.nama.charCodeAt(0) % 15) - 3;
      const t = Math.min(100, Math.max(60, val + offset));
      const u = Math.min(100, Math.max(60, val + offset + 2));
      const a = Math.min(100, Math.max(60, val + offset + 4));
      const na = hitungNilaiAkhir(String(t), String(u), String(a));

      const checked =
        na >= 85
          ? tpList.map((tp) => tp.id)
          : tpList.slice(0, Math.max(1, tpList.length - 1)).map((tp) => tp.id);

      nextState[s.id] = {
        tugas: String(t),
        uts: String(u),
        uas: String(a),
        checkedTPs: checked,
      };
    });
    setFormData(nextState);
    setMessage({
      type: "success",
      text: "Nilai simulasi dan centang TP berhasil diisikan. Klik 'Simpan Semua Nilai' untuk menyimpan ke database.",
    });
  };

  // Submit Simpan Nilai
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const items: NilaiInputItem[] = siswaList.map((s) => {
      const d = formData[s.id] || { tugas: "0", uts: "0", uas: "0", checkedTPs: [] };
      const na = hitungNilaiAkhir(d.tugas, d.uts, d.uas);
      const tpTercapaiCodes = d.checkedTPs
        .map((id) => tpList.find((t) => t.id === id)?.kode)
        .filter(Boolean)
        .join(", ");

      return {
        siswaId: s.id,
        nilaiTugas: parseFloat(d.tugas) || 0,
        nilaiUTS: parseFloat(d.uts) || 0,
        nilaiUAS: parseFloat(d.uas) || 0,
        nilaiAkhir: na,
        catatan: tpTercapaiCodes ? `TP Tercapai: ${tpTercapaiCodes}` : undefined,
      };
    });

    startTransition(async () => {
      const res = await simpanNilaiBatchAction({
        mapelId: activePengampu.mapelId,
        tahunAjaran: selectedTahunAjaran,
        semester: selectedSemester,
        items,
      });

      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const totalSiswa = siswaList.length;
  const sudahDinilaiCount = siswaList.filter((s) => {
    const d = formData[s.id];
    return d && hitungNilaiAkhir(d.tugas, d.uts, d.uas) > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* 1. Selector Semester & Tahun Ajaran */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Periode Penilaian Rapor:
          </span>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="font-mono font-bold text-zinc-900 text-base">
              Tahun Ajaran {selectedTahunAjaran}
            </span>
            {isLocked ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                <span>🔒</span>
                <span>Nilai Terkunci (Read-Only)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Penginputan Terbuka</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 mr-1">Pilih Semester:</span>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/guru/siswa?kelasId=${activePengampu.kelasId}&mapelId=${activePengampu.mapelId}&semester=1&tahunAjaran=${selectedTahunAjaran}`
              )
            }
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              selectedSemester === 1
                ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs ring-2 ring-[#1b4332]/20"
                : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
            }`}
          >
            Semester 1 (Ganjil)
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/guru/siswa?kelasId=${activePengampu.kelasId}&mapelId=${activePengampu.mapelId}&semester=2&tahunAjaran=${selectedTahunAjaran}`
              )
            }
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              selectedSemester === 2
                ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs ring-2 ring-[#1b4332]/20"
                : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
            }`}
          >
            Semester 2 (Genap)
          </button>
        </div>
      </div>

      {/* Warning Alert Jika Periode Terkunci */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <span className="text-xl shrink-0">🔒</span>
          <div>
            <p className="font-bold text-sm">Penilaian Telah Dikunci Admin Sekolah</p>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Penginputan dan perubahan nilai pada Tahun Ajaran {selectedTahunAjaran} Semester {selectedSemester === 1 ? "Ganjil (1)" : "Genap (2)"} saat ini ditutup untuk persiapan pencetakan rapor. Tabel penilaian di bawah berstatus <strong>Hanya Baca (Read-Only)</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 2. Selector Penugasan Rombel & Mapel yang Diampu */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-2.5">
          Pilih Rombel & Mata Pelajaran yang Anda Ampu:
        </span>
        <div className="flex flex-wrap gap-2.5">
          {daftarPengampu.map((p) => {
            const isSelected = p.id === activePengampu.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/guru/siswa?kelasId=${p.kelasId}&mapelId=${p.mapelId}&semester=${selectedSemester}&tahunAjaran=${selectedTahunAjaran}`
                  )
                }
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? "bg-[#1b4332] text-white border-[#1b4332] shadow-sm ring-2 ring-[#1b4332]/20"
                    : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-white text-emerald-800 border border-stone-200"
                  }`}
                >
                  Kelas {p.kelas.nama}
                </span>
                <span>{p.mapel.nama}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Daftar TP yang Berlaku untuk Mata Pelajaran Ini */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm font-poppins flex items-center gap-2">
              <span>🎯</span>
              <span>Tujuan Pembelajaran (TP) Terdaftar ({tpList.length} TP)</span>
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Daftar TP semester ini sebagai acuan ketercapaian kompetensi pembelajaran siswa.
            </p>
          </div>
          <Link
            href={`/guru/tp?mapelId=${activePengampu.mapelId}&tingkat=${activePengampu.kelas.tingkat}`}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
          >
            <span>Kelola TP di Menu TP</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {tpList.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <span>
              ⚠️ Belum ada Tujuan Pembelajaran yang dirumuskan untuk mata pelajaran <strong>{activePengampu.mapel.nama}</strong> pada tingkat {activePengampu.kelas.tingkat}.
            </span>
            <Link
              href={`/guru/tp?mapelId=${activePengampu.mapelId}&tingkat=${activePengampu.kelas.tingkat}`}
              className="px-3 py-1 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 transition"
            >
              Tambah TP Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {tpList.map((tp) => (
              <div
                key={tp.id}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs flex items-start gap-2.5"
              >
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] shrink-0 border border-emerald-200">
                  {tp.kode}
                </span>
                <p className="text-zinc-700 line-clamp-2 leading-relaxed text-[11px]" title={tp.deskripsi}>
                  {tp.deskripsi}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ringkasan Kelas Terpilih & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#fcfbf9] border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 font-poppins">
              Kelas {activePengampu.kelas.nama} — {activePengampu.mapel.nama}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Tingkat {activePengampu.kelas.tingkat}
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            T.A. {selectedTahunAjaran} • Semester {selectedSemester === 1 ? "1 (Ganjil)" : "2 (Genap)"} •{" "}
            <strong className="text-zinc-900 font-semibold">{totalSiswa} Siswa Terdaftar</strong> (
            <span className="text-emerald-700 font-medium">{sudahDinilaiCount} siswa terisi</span>)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleAutoFill(80)}
            disabled={isLocked}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white text-zinc-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
            title={isLocked ? "Penilaian terkunci" : "Isi contoh nilai cepat dan centang TP otomatis untuk simulasi"}
          >
            ⚡ Auto-Fill Nilai & TP
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isLocked}
            className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold rounded-xl bg-[#1b4332] text-white hover:bg-[#143225] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isLocked ? (
              <>
                <span>🔒</span>
                <span>Nilai Terkunci</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Simpan Semua Nilai</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pesan Notifikasi */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-zinc-600 hover:text-zinc-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabel Data Siswa & Input Nilai dengan Kolom Checkbox TP */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                <th className="px-3 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5 min-w-[200px]">Nama Siswa</th>
                <th className="px-3 py-3.5 w-28 text-center">L/P</th>
                <th className="px-2 py-3.5 w-20 text-center">Tugas</th>
                <th className="px-2 py-3.5 w-20 text-center">UTS</th>
                <th className="px-2 py-3.5 w-20 text-center">UAS</th>
                <th className="px-3 py-3.5 w-28 text-center">Nilai Akhir</th>
                <th className="px-4 py-3.5 min-w-[240px]">
                  Ketercapaian TP
                  <span className="block text-[10px] normal-case text-zinc-600 font-normal">
                    Centang [✓] TP yang tercapai
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {siswaList.map((siswa, idx) => {
                const data = formData[siswa.id] || { tugas: "", uts: "", uas: "", checkedTPs: [] };
                const na = hitungNilaiAkhir(data.tugas, data.uts, data.uas);
                const pred = getPredikat(na);

                return (
                  <tr key={siswa.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-3 py-3.5 text-center text-zinc-600 font-mono">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-zinc-900 text-sm">
                        {siswa.nama}
                      </div>
                      <div className="text-[11px] text-zinc-600 font-mono mt-0.5 whitespace-nowrap">
                        NISN: {siswa.nisn} • NIS: {siswa.nis}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          siswa.jenisKelamin === "L"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {siswa.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </td>

                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0"
                        disabled={isLocked}
                        value={data.tugas}
                        onChange={(e) => handleScoreChange(siswa.id, "tugas", e.target.value)}
                        className="w-full text-center rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-xs focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] disabled:bg-stone-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                      />
                    </td>

                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0"
                        disabled={isLocked}
                        value={data.uts}
                        onChange={(e) => handleScoreChange(siswa.id, "uts", e.target.value)}
                        className="w-full text-center rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-xs focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] disabled:bg-stone-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                      />
                    </td>

                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0"
                        disabled={isLocked}
                        value={data.uas}
                        onChange={(e) => handleScoreChange(siswa.id, "uas", e.target.value)}
                        className="w-full text-center rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-xs focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332] disabled:bg-stone-100 disabled:cursor-not-allowed disabled:text-zinc-600"
                      />
                    </td>

                    <td className="px-3 py-3 text-center">
                      <div className="font-mono font-bold text-sm text-zinc-900">
                        {na > 0 ? na : "-"}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mt-1 ${pred.color}`}>
                        {pred.label}
                      </span>
                    </td>

                    {/* Kolom Ketercapaian TP Langsung */}
                    <td className="px-4 py-3">
                      {tpList.length === 0 ? (
                        <div className="text-zinc-600 text-xs italic">
                          Belum ada TP terdaftar untuk mapel ini di semester {selectedSemester}.
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tpList.map((tp) => {
                            const isChecked = data.checkedTPs.includes(tp.id);
                            return (
                              <button
                                key={tp.id}
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleToggleTP(siswa.id, tp.id)}
                                title={`${tp.kode}: ${tp.deskripsi} ${isLocked ? "(Terkunci)" : "(Klik untuk centang)"}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:cursor-not-allowed disabled:opacity-85 ${
                                  isChecked
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold ring-1 ring-emerald-300/30"
                                    : "bg-stone-50 text-zinc-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                    isChecked
                                      ? "bg-emerald-600 text-white font-bold"
                                      : "border border-stone-300 text-transparent"
                                  }`}
                                >
                                  ✓
                                </span>
                                <span className="font-mono">{tp.kode}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info tabel */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div>
            <span>Rumus Nilai Akhir: </span>
            <span className="font-mono font-semibold text-zinc-800">
              (Tugas &times; 30%) + (UTS &times; 30%) + (UAS &times; 40%)
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-xl bg-[#1b4332] text-white hover:bg-[#143225] disabled:opacity-50 transition shadow-xs"
          >
            {isPending ? "Sedang Menyimpan Data..." : "Simpan Semua Nilai Siswa"}
          </button>
        </div>
      </div>
    </div>
  );
}
