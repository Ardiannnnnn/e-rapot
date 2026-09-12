"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrUpdateTPAction, deleteTPAction, bulkCreateTPAction } from "@/actions/tp";
import { Trash2Icon } from "@/components/shared/icons";
import { toast } from "@/components/shared/toast";

interface TPItem {
  id: string;
  kode: string;
  deskripsi: string;
  tingkat: number;
  semester: number;
  tahunAjaran: string;
  createdAt: Date;
}

interface MapelTingkatOption {
  mapelId: string;
  mapelKode: string;
  mapelNama: string;
  tingkat: number;
  kelasNamaList: string[];
}

interface FormTPProps {
  options: MapelTingkatOption[];
  activeOption: MapelTingkatOption;
  tpList: TPItem[];
  selectedTahunAjaran: string;
  selectedSemester: number;
}

// Bank rekomendasi TP standar Kurikulum Merdeka Kemendikbud
const REKOMENDASI_TP: Record<string, { kode: string; deskripsi: string }[]> = {
  "MAT-1": [
    { kode: "TP 1", deskripsi: "menghitung operasi penjumlahan dan pengurangan bilangan cacah sampai 100" },
    { kode: "TP 2", deskripsi: "mengidentifikasi dan membedakan pola bentuk bangun datar serta bangun ruang" },
    { kode: "TP 3", deskripsi: "menyelesaikan soal cerita kontekstual operasi bilangan dalam kehidupan sehari-hari" },
    { kode: "TP 4", deskripsi: "mengukur dan membandingkan panjang serta berat benda dengan satuan tidak baku" },
  ],
  "IPAS-3": [
    { kode: "TP 1", deskripsi: "mengidentifikasi bagian tubuh tumbuhan beserta fungsinya bagi kelangsungan hidup" },
    { kode: "TP 2", deskripsi: "menjelaskan siklus hidup dan metamorfosis pada hewan di lingkungan sekitar" },
    { kode: "TP 3", deskripsi: "menganalisis wujud zat dan perubahannya dalam kehidupan sehari-hari" },
    { kode: "TP 4", deskripsi: "mengenal ragam bentang alam serta interaksi manusia dengan lingkungan sekitar" },
  ],
  "MAT-6": [
    { kode: "TP 1", deskripsi: "menghitung operasi hitung campuran bilangan bulat dan pecahan dengan cermat" },
    { kode: "TP 2", deskripsi: "menentukan keliling dan luas lingkaran menggunakan rumus yang tepat" },
    { kode: "TP 3", deskripsi: "menghitung luas permukaan dan volume bangun ruang prisma serta tabung" },
    { kode: "TP 4", deskripsi: "menyajikan dan menganalisis data dalam bentuk diagram batang dan lingkaran" },
  ],
  "BIN-1": [
    { kode: "TP 1", deskripsi: "melafalkan bunyi huruf dan suku kata dengan artikulasi yang tepat" },
    { kode: "TP 2", deskripsi: "menuliskan kata-kata sederhana yang sering dijumpai sehari-hari" },
    { kode: "TP 3", deskripsi: "menceritakan kembali isi teks pendek yang dibacakan dengan bahasa sendiri" },
  ],
};

export default function FormTP({
  options,
  activeOption,
  tpList,
  selectedTahunAjaran,
  selectedSemester,
}: FormTPProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<TPItem | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [kode, setKode] = useState(`TP ${tpList.length + 1}`);
  const [deskripsi, setDeskripsi] = useState("");

  const handleSelectOption = (opt: MapelTingkatOption) => {
    setEditingId(null);
    setDeskripsi("");
    router.push(
      `/guru/tp?mapelId=${opt.mapelId}&tingkat=${opt.tingkat}&semester=${selectedSemester}&tahunAjaran=${selectedTahunAjaran}`
    );
  };

  const handleEdit = (tp: TPItem) => {
    setEditingId(tp.id);
    setKode(tp.kode);
    setDeskripsi(tp.deskripsi);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setKode(`TP ${tpList.length + 1}`);
    setDeskripsi("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!kode.trim() || !deskripsi.trim()) {
      toast.error("Kode TP dan Deskripsi tidak boleh kosong.");
      return;
    }

    startTransition(async () => {
      const res = await createOrUpdateTPAction({
        id: editingId || undefined,
        kode: kode.trim(),
        deskripsi: deskripsi.trim(),
        tingkat: activeOption.tingkat,
        semester: selectedSemester,
        tahunAjaran: selectedTahunAjaran,
        mapelId: activeOption.mapelId,
      });

      if (res.success) {
        toast.success(res.message);
        setEditingId(null);
        setDeskripsi("");
        setKode(`TP ${tpList.length + (editingId ? 1 : 2)}`);
      } else {
        toast.error(res.message);
      }
    });
  };

  const executeDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteTPAction(id);
      if (res.success) {
        toast.success(res.message);
        if (editingId === id) handleCancelEdit();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleLoadRekomendasi = () => {
    const key = `${activeOption.mapelKode}-${activeOption.tingkat}`;
    const rek = REKOMENDASI_TP[key] || [
      { kode: "TP 1", deskripsi: `memahami konsep dasar ${activeOption.mapelNama.toLowerCase()} lingkup materi awal` },
      { kode: "TP 2", deskripsi: `mengaplikasikan keterampilan ${activeOption.mapelNama.toLowerCase()} dalam pemecahan masalah` },
      { kode: "TP 3", deskripsi: `menganalisis dan menyajikan hasil penyelidikan materi secara mandiri` },
    ];

    startTransition(async () => {
      const res = await bulkCreateTPAction({
        mapelId: activeOption.mapelId,
        tingkat: activeOption.tingkat,
        semester: selectedSemester,
        tahunAjaran: selectedTahunAjaran,
        items: rek,
      });

      if (res.success) {
        toast.success("Berhasil memuat rekomendasi Tujuan Pembelajaran resmi.");
      } else {
        toast.error(res.message);
      }
    });
  };

  // Validasi huruf kecil di awal kalimat (panduan resmi e-rapor)
  const isFirstLetterCapital = deskripsi.length > 0 && deskripsi[0] === deskripsi[0].toUpperCase() && deskripsi[0] !== deskripsi[0].toLowerCase();

  return (
    <div className="space-y-6">
      {/* 1. Selector Semester & Tahun Ajaran */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Periode Perumusan TP:
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono font-bold text-zinc-900 text-base">
              Tahun Ajaran {selectedTahunAjaran}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Semester {selectedSemester === 1 ? "1 (Ganjil)" : "2 (Genap)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 mr-1">Pilih Semester:</span>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/guru/tp?mapelId=${activeOption.mapelId}&tingkat=${activeOption.tingkat}&semester=1&tahunAjaran=${selectedTahunAjaran}`
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
                `/guru/tp?mapelId=${activeOption.mapelId}&tingkat=${activeOption.tingkat}&semester=2&tahunAjaran=${selectedTahunAjaran}`
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

      {/* 2. Selector Pita Mapel & Tingkat Kelas yang Diampu */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block">
              Pilih Mata Pelajaran & Tingkat Kelas:
            </span>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {options.length} Mapel-Tingkat
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {options.map((opt) => {
            const isSelected = opt.mapelId === activeOption.mapelId && opt.tingkat === activeOption.tingkat;
            return (
              <button
                key={`${opt.mapelId}-${opt.tingkat}`}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${isSelected
                    ? "bg-[#1b4332] text-white border-[#1b4332] shadow-sm ring-2 ring-[#1b4332]/20"
                    : "bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                  }`}
              >
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${isSelected ? "bg-white/20 text-white" : "bg-white text-emerald-800 border border-stone-200"
                  }`}>
                  Tingkat {opt.tingkat}
                </span>
                <span className="font-semibold">{opt.mapelNama}</span>
                <span className={`text-[10px] font-mono ${isSelected ? "text-emerald-200" : "text-zinc-600"}`}>
                  (Kelas {opt.kelasNamaList.join(", ")})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Informasi Tingkat & Mapel Aktif */}
      <div className="bg-[#fcfbf9] border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 font-poppins">
              {activeOption.mapelNama} • Tingkat {activeOption.tingkat}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 font-mono">
              Fase {activeOption.tingkat <= 2 ? "A" : activeOption.tingkat <= 4 ? "B" : "C"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-xs text-zinc-600 sm:text-right">
              Berlaku untuk rombel: <strong>Kelas {activeOption.kelasNamaList.join(", ")}</strong> • T.A. {selectedTahunAjaran} • Semester {selectedSemester === 1 ? "1 (Ganjil)" : "2 (Genap)"}
            </p>

            {tpList.length === 0 && (
              <button
                type="button"
                onClick={handleLoadRekomendasi}
                disabled={isPending}
                className="shrink-0 px-4 py-2 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition shadow-xs flex items-center gap-2"
              >
                ⚡ Muat Rekomendasi Kurikulum Merdeka
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Form Input / Edit Tujuan Pembelajaran */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-900 text-base font-poppins">
            {editingId ? "✏️ Edit Tujuan Pembelajaran" : "➕ Tambah Tujuan Pembelajaran Baru"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Kode TP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="Contoh: TP 1"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:border-[#1b4332] focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700">
                  Deskripsi Tujuan Pembelajaran <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-mono ${deskripsi.length > 100 ? "text-rose-600 font-bold" : "text-zinc-600"}`}>
                  {deskripsi.length} / 100 karakter
                </span>
              </div>
              <input
                type="text"
                value={deskripsi}
                maxLength={120}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="awali huruf kecil, contoh: menghitung operasi penjumlahan dan pengurangan sampai 100"
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 ${deskripsi.length > 100
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                    : "border-stone-200 focus:border-[#1b4332] focus:ring-[#1b4332]"
                  }`}
                required
              />
            </div>
          </div>

          {/* Panduan Kaidah Penulisan */}
          {/* <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-[11px] text-zinc-600 space-y-1">
            <p className="font-semibold text-zinc-800">📌 Panduan Penulisan Kurikulum Merdeka (Kemendikbud):</p>
            <ul className="list-disc list-inside space-y-0.5 text-zinc-600">
              <li>Awali dengan kata kerja operasional kompetensi (contoh: <em>menghitung, menganalisis, mengidentifikasi</em>).</li>
              <li>Disarankan menggunakan <strong>huruf kecil di awal</strong> agar luwes saat digabung ke kalimat rapor (<em>"Ananda menunjukkan penguasaan dalam..."</em>).</li>
              <li>Maksimal 100 karakter agar tampilan cetak rapor tetap rapi dan tidak melipat panjang.</li>
            </ul>
            {isFirstLetterCapital && (
              <p className="text-amber-700 font-medium pt-1">
                ⚠️ Peringatan: Huruf pertama diawali huruf kapital. Disarankan mengubahnya menjadi huruf kecil (contoh: <code>{deskripsi.charAt(0).toLowerCase() + deskripsi.slice(1)}</code>).
              </p>
            )}
          </div> */}

          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 bg-white text-zinc-700 hover:bg-stone-50 transition"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 text-xs font-semibold rounded-xl bg-[#1b4332] text-white hover:bg-[#143225] disabled:opacity-50 transition shadow-xs"
            >
              {isPending ? "Menyimpan..." : editingId ? "Perbarui Tujuan Pembelajaran" : "Simpan Tujuan Pembelajaran"}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Tabel Daftar TP yang Sudah Ditetapkan */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 text-base font-poppins">
              Daftar Tujuan Pembelajaran Terdaftar ({tpList.length} TP)
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              TP ini akan menjadi opsi penilaian capaian tertinggi dan perlu bimbingan pada asesmen rapor.
            </p>
          </div>
        </div>

        {tpList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-2">📝</div>
            <h4 className="text-sm font-semibold text-zinc-900">Belum Ada Tujuan Pembelajaran</h4>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
              Belum ada TP yang dirumuskan untuk mata pelajaran dan tingkat kelas ini. Silakan input form di atas atau klik tombol <em>Muat Rekomendasi</em>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 font-mono text-zinc-600 uppercase text-[11px] tracking-wider">
                  <th className="px-4 py-3.5 w-16 text-center">Kode</th>
                  <th className="px-4 py-3.5">Deskripsi Tujuan Pembelajaran (Kompetensi yang Dituntut)</th>
                  <th className="px-4 py-3.5 w-28 text-center">Jumlah Karakter</th>
                  <th className="px-4 py-3.5 w-28 text-center">Status Rapor</th>
                  <th className="px-4 py-3.5 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {tpList.map((tp) => (
                  <tr key={tp.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-800">
                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200">
                        {tp.kode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-zinc-900 font-medium text-sm leading-relaxed">
                        {tp.deskripsi}
                      </div>
                      <span className="text-[11px] text-zinc-600 font-mono">
                        Mata Pelajaran: {activeOption.mapelNama} • Tingkat {activeOption.tingkat}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-zinc-600">
                      <span className={tp.deskripsi.length > 100 ? "text-rose-600 font-bold" : "text-zinc-700"}>
                        {tp.deskripsi.length} karakter
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif di Rapor
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(tp)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-zinc-700 hover:bg-stone-100 transition text-[11px] font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(tp)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition text-[11px] font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus TP (In-App Modal) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 font-poppins">
                  Hapus Tujuan Pembelajaran?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-zinc-900 font-semibold">{deleteTarget.kode}</strong>: &quot;{deleteTarget.deskripsi}&quot;?
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-stone-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  executeDelete(target.id);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus TP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
