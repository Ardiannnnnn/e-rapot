import React from "react";
import { NilaiRaporItem, LembarRaporData } from "@/types/wali-kelas/cetak";

export type { NilaiRaporItem, LembarRaporData };

// Helper untuk deskripsi capaian kompetensi ganda (Sekat Sangat Baik & Baik)
function getDeskripsiCapaian(
  namaSiswa: string,
  mapelNama: string,
  nilaiAkhir: number,
  customCapaian?: string,
  customTinggi?: string,
  customRendah?: string
): { tinggi?: string; rendah?: string } | null {
  // JANGAN ADA DEFAULT: Jika belum ada nilai akhir (> 0), tidak ada capaian kompetensi
  if (nilaiAkhir <= 0) {
    return null;
  }

  if (customTinggi || customRendah) {
    return {
      tinggi: customTinggi,
      rendah: customRendah,
    };
  }

  if (customCapaian && customCapaian.trim()) {
    const parts = customCapaian.split("\n").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        tinggi: parts[0],
        rendah: parts[1],
      };
    }
    return {
      tinggi: parts[0],
    };
  }

  // JANGAN ADA DEFAULT: Kembalikan null jika guru belum memasukkan TP atau catatan
  return null;
}

export default function LembarRapor({ data }: { data: LembarRaporData }) {
  const {
    sekolah,
    siswa,
    kelas,
    periode,
    waliKelas,
    nilaiList,
    pelengkap,
  } = data;

  // Hitung total & rata-rata nilai
  const validNilai = nilaiList.filter((n) => n.nilaiAkhir > 0);
  const totalNilai = validNilai.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
  const rataRata =
    validNilai.length > 0 ? (totalNilai / validNilai.length).toFixed(2) : "0.00";

  // Total ketidakhadiran
  const totalAbsen = (pelengkap.sakit || 0) + (pelengkap.izin || 0) + (pelengkap.alpa || 0);

  // Status kelulusan / kenaikan kelas (Hanya berlaku pada Semester 2 / Genap)
  const isSemesterGenap = periode.semester === 2;
  const isKelasAkhir = kelas.tingkat === 6;
  const statusHasil =
    pelengkap.statusKelulusan || (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${kelas.tingkat + 1}`);

  // Pisahkan mapel umum dan mulok secara dinamis
  const checkIsMulok = (item: NilaiRaporItem) => {
    if (typeof item.isMulok === "boolean") {
      return item.isMulok;
    }
    const n = (item.mapelNama || "").toLowerCase();
    const k = (item.mapelKode || "").toLowerCase();
    return (
      n.includes("muatan lokal") ||
      n.includes("mulok") ||
      n.includes("bahasa daerah") ||
      n.includes("bahasa simeulue") ||
      n.includes("simeulue") ||
      n.includes("bahasa aceh") ||
      n.includes("bahasa jawa") ||
      n.includes("bahasa sunda") ||
      n.includes("budaya aceh") ||
      k.includes("mulok")
    );
  };

  const mapelReguler = nilaiList.filter((n) => !checkIsMulok(n));
  const mapelMulok = nilaiList.filter((n) => checkIsMulok(n));

  // Data Kokurikuler (P5) dinamis
  const listKokurikuler = pelengkap.kokurikuler || [];

  // Ekstrakurikuler dinamis
  const listEkskul = (pelengkap.ekskul || []).filter(
    (e) => e.nama && e.nama.trim() !== ""
  );

  return (
    <div className="rapor-double-page text-black font-sans">
      {/* ========================================================================= */}
      {/* ============================== LEMBAR 1 ================================= */}
      {/* ========================================================================= */}
      <div className="rapor-paper page-1 bg-white p-8 sm:p-10 max-w-[850px] mx-auto border border-stone-300 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-[11px] leading-tight">
        {/* 1. JUDUL RESMI */}
        <div className="text-center mb-6">
          <h1 className="text-sm font-bold uppercase tracking-wider text-black">
            LAPORAN HASIL BELAJAR
          </h1>
        </div>

        {/* 2. IDENTITAS SISWA & SEKOLAH (2 KOLOM RAPI) */}
        <div className="grid grid-cols-12 gap-2 text-[11px] mb-5">
          {/* Kolom Kiri: Siswa & Satuan Pendidikan */}
          <div className="col-span-7 space-y-1">
            <div className="flex">
              <span className="w-32 text-black">Nama Peserta Didik</span>
              <span className="w-4 font-semibold">:</span>
              <span className="font-bold text-black uppercase tracking-wide">
                {siswa.nama}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-black">NISN / NIS</span>
              <span className="w-4 font-semibold">:</span>
              <span className="font-semibold text-black">
                {siswa.nisn || "-"} / {siswa.nis || "-"}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-black">Nama Sekolah</span>
              <span className="w-4 font-semibold">:</span>
              <span className="text-black font-medium">
                {sekolah.nama || "SDN 7 Simeulue Timur"}
              </span>
            </div>
            <div className="flex items-start">
              <span className="w-32 text-black shrink-0">Alamat Sekolah</span>
              <span className="w-4 font-semibold shrink-0">:</span>
              <div className="text-black">
                <p>{sekolah.alamat || "Jln. Ibnu Aban Desa Air Dingin"}</p>
                <p className="text-[10px] text-zinc-800">
                  {sekolah.kecamatan || "Kecamatan Simeulue Timur"}{" "}
                  {sekolah.kabupatenKota || "Kabupaten Simeulue"}{" "}
                  {sekolah.provinsi || "Provinsi ACEH"}
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Kelas, Semester, Tahun Pelajaran */}
          <div className="col-span-5 space-y-1 pl-4">
            <div className="flex">
              <span className="w-28 text-black">Kelas</span>
              <span className="w-4 font-semibold">:</span>
              <span className="font-bold text-black">{kelas.nama}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-black">Fase</span>
              <span className="w-4 font-semibold">:</span>
              <span className="font-bold text-black">
                {kelas.fase ? kelas.fase.replace("Fase ", "").trim() : "C"}
              </span>
            </div>
            <div className="flex">
              <span className="w-28 text-black">Semester</span>
              <span className="w-4 font-semibold">:</span>
              <span className="font-bold text-black">
                {periode.semester === 1 ? "I ( SATU )" : "II ( DUA )"}
              </span>
            </div>
            <div className="flex">
              <span className="w-28 text-black">Tahun Pelajaran</span>
              <span className="w-4 font-semibold">:</span>
              <span className="font-semibold text-black">{periode.tahunAjaran}</span>
            </div>
          </div>
        </div>

        {/* 3. TABEL NILAI & CAPAIAN KOMPETENSI (4 KOLOM) */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-black text-[10.5px]">
            <thead>
              <tr className="bg-[#e2e2e2] text-black font-bold text-center">
                <th className="border border-black py-1.5 px-1.5 w-10">No</th>
                <th className="border border-black py-1.5 px-2.5 w-52 text-center">
                  Mata Pelajaran
                </th>
                <th className="border border-black py-1.5 px-1.5 w-20 text-center">
                  Nilai Akhir
                </th>
                <th className="border border-black py-1.5 px-3 text-center">
                  Capaian Kompetensi
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Mapel Reguler */}
              {mapelReguler.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-black py-4 text-center text-zinc-500 italic">
                    Belum ada data nilai mata pelajaran.
                  </td>
                </tr>
              ) : (
                mapelReguler.map((n, idx) => {
                  const capaian = getDeskripsiCapaian(
                    siswa.nama,
                    n.mapelNama,
                    n.nilaiAkhir,
                    n.capaianKompetensi,
                    n.capaianTinggi,
                    n.capaianRendah
                  );

                  return (
                    <tr key={idx} className="align-top">
                      <td className="border border-black py-2 px-1 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-black py-2 px-2.5 font-medium text-black">
                        {n.mapelNama}
                      </td>
                      <td className="border border-black py-2 px-1 text-center font-bold">
                        {n.nilaiAkhir > 0 ? n.nilaiAkhir : "-"}
                      </td>
                      <td className="border border-black p-0 leading-relaxed text-black">
                        {capaian && (capaian.tinggi || capaian.rendah) ? (
                          <>
                            {capaian.tinggi && (
                              <div className={`p-2 ${capaian.rendah ? "border-b border-zinc-400" : ""}`}>
                                {capaian.tinggi}
                              </div>
                            )}
                            {capaian.rendah && (
                              <div className="p-2">
                                {capaian.rendah}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-2 text-center text-zinc-400 font-mono">-</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Baris Muatan Lokal (Hanya ditampilkan jika ada mata pelajaran Muatan Lokal di kelas ini) */}
              {mapelMulok.length > 0 && (
                <>
                  <tr>
                    <td className="border border-black py-1 px-1 text-center font-medium">
                      {mapelReguler.length + 1}
                    </td>
                    <td className="border border-black py-1 px-2.5 font-semibold text-black" colSpan={3}>
                      Muatan Lokal
                    </td>
                  </tr>
                  {mapelMulok.map((m, mIdx) => {
                    const capaian = getDeskripsiCapaian(
                      siswa.nama,
                      m.mapelNama,
                      m.nilaiAkhir,
                      m.capaianKompetensi,
                      m.capaianTinggi,
                      m.capaianRendah
                    );
                    return (
                      <tr key={`mulok-${mIdx}`} className="align-top">
                        <td className="border border-black py-2 px-1 text-center"></td>
                        <td className="border border-black py-2 px-2.5 pl-5 font-medium text-black">
                          {mIdx + 1} {m.mapelNama}
                        </td>
                        <td className="border border-black py-2 px-1 text-center font-bold">
                          {m.nilaiAkhir > 0 ? m.nilaiAkhir : "-"}
                        </td>
                        <td className="border border-black p-0 leading-relaxed text-black">
                          {capaian && (capaian.tinggi || capaian.rendah) ? (
                            <>
                              {capaian.tinggi && (
                                <div className={`p-2 ${capaian.rendah ? "border-b border-zinc-400" : ""}`}>
                                  {capaian.tinggi}
                                </div>
                              )}
                              {capaian.rendah && (
                                <div className="p-2">
                                  {capaian.rendah}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-2 text-center text-zinc-400 font-mono">-</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}

              {/* Baris Total / Footer: Jumlah, Rata-rata, dan Peringkat Dinamis Sesuai Format Resmi */}
              <tr className="font-bold bg-white text-[10.5px]">
                <td colSpan={2} className="border border-black py-1.5 px-3 text-left">
                  Jumlah
                </td>
                <td className="border border-black py-1.5 px-1 text-center font-bold font-mono">
                  {totalNilai > 0 ? totalNilai : "-"}
                </td>
                <td className="border border-black p-0">
                  <div className="flex items-stretch h-full text-center divide-x divide-black">
                    <div className="w-24 py-1.5 px-2 font-bold text-left shrink-0">
                      Rata-rata
                    </div>
                    <div className="w-20 py-1.5 px-2 font-bold font-mono text-center shrink-0">
                      {validNilai.length > 0 ? rataRata.replace(".", ",") : "-"}
                    </div>
                    <div className="flex-1 py-1.5 px-3 font-bold text-center whitespace-nowrap">
                      {data.rekapitulasi?.peringkat ? (
                        <span>
                          Peringkat ke - {data.rekapitulasi.peringkat} dari{" "}
                          {data.rekapitulasi.totalSiswa || kelas.totalSiswa || 0} siswa
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ===================== PEMISAH VISUAL ANTAR LEMBAR ======================== */}
      {/* ========================================================================= */}
      <div className="my-8 border-b-2 border-dashed border-stone-300 print:hidden" />

      {/* ========================================================================= */}
      {/* ============================== LEMBAR 2 ================================= */}
      {/* ========================================================================= */}
      <div className="rapor-paper page-2 bg-white p-8 sm:p-10 max-w-[850px] mx-auto border border-stone-300 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-[11px] leading-tight mt-6 print:mt-0">
        {/* 1. EKSTRAKURIKULER DINAMIS */}
        <div className="mb-4 space-y-1">
          <h2 className="text-[11.5px] font-bold text-black">
            Ekstrakurikuler
          </h2>
          <table className="w-full border-collapse border border-black text-[10.5px]">
            <thead>
              <tr className="bg-[#e2e2e2] text-black font-bold text-left">
                <th className="border border-black py-1 px-3 w-52">Ekstrakurikuler</th>
                <th className="border border-black py-1 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {listEkskul.length === 0 ? (
                <tr className="h-6">
                  <td className="border border-black py-1 px-3 text-center">-</td>
                  <td className="border border-black py-1 px-3 text-center">-</td>
                </tr>
              ) : (
                listEkskul.map((e, idx) => (
                  <tr key={idx} className="h-6">
                    <td className="border border-black py-1 px-3 font-medium text-black">
                      {e.nama}
                    </td>
                    <td className="border border-black py-1 px-3 text-black">
                      {e.predikat || "-"}
                    </td>
                  </tr>
                ))
              )}
              {/* Spacer rows agar tinggi tabel proporsional saat cetak A4 */}
              {Array.from({
                length: Math.max(0, 3 - Math.max(1, listEkskul.length)),
              }).map((_, i) => (
                <tr key={`spacer-${i}`} className="h-5">
                  <td className="border border-black py-1 px-3">&nbsp;</td>
                  <td className="border border-black py-1 px-3">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. KOKURIKULER (P5) DINAMIS */}
        <div className="mb-4 space-y-1">
          <h2 className="text-[11.5px] font-bold text-black">
            Kokurikuler
          </h2>
          <div className="border border-black text-[10.5px]">
            {listKokurikuler.length === 0 ? (
              <div className="p-3 text-center italic text-zinc-500">
                -
              </div>
            ) : (
              listKokurikuler.map((k, idx) => (
                <div key={idx} className={idx > 0 ? "border-t border-black" : ""}>
                  <div className="bg-[#e2e2e2] py-1 px-3 font-semibold text-black border-b border-black">
                    {k.tema}
                  </div>
                  <div className="p-2.5 leading-relaxed text-black">
                    {k.deskripsi}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. 7 KEBIASAAN ANAK INDONESIA HEBAT DINAMIS */}
        <div className="mb-4 space-y-1">
          <h2 className="text-[11.5px] font-bold text-black">
            7 Kebiasaan Anak Indonesia Hebat
          </h2>
          <div className="border border-black p-2.5 text-[10.5px] leading-relaxed text-black">
            {pelengkap.kebiasaanKarakter ||
              `${siswa.nama.toUpperCase()} Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat`}
          </div>
        </div>

        {/* 4. SARAN-SARAN / CATATAN WALI KELAS DINAMIS */}
        <div className="mb-4 space-y-1">
          <h2 className="text-[11.5px] font-bold text-black">
            Saran-saran / Catatan Wali Kelas
          </h2>
          <div className="border border-black p-2.5 text-[10.5px] leading-relaxed text-black">
            {pelengkap.catatanWali ||
              "Alhamdulillah sikap dan pengetahuan Ananda sudah baik. Kembangkan potensi yang dimiliki karena intan tidak akan dinilai tanpa diasah."}
          </div>
        </div>

        {/* 5. KETIDAKHADIRAN & KEPUTUSAN KELULUSAN / KENAIKAN KELAS */}
        <div
          className={`grid ${
            isSemesterGenap ? "grid-cols-12 gap-6" : "grid-cols-1 max-w-xs"
          } mb-6 print:mb-4 items-start`}
        >
          {/* Kolom Kiri: Ketidakhadiran */}
          <div className={isSemesterGenap ? "col-span-6" : "w-full"}>
            <table className="w-full border-collapse border border-black text-[10.5px]">
              <thead>
                <tr className="bg-[#e2e2e2] text-black font-bold text-center">
                  <th colSpan={3} className="border border-black py-1 px-3">
                    Ketidakhadiran
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-3 w-40">Sakit</td>
                  <td className="border-t border-b border-black py-1 text-center w-4">:</td>
                  <td className="border border-black py-1 px-3 text-left font-mono">
                    {pelengkap.sakit} Hari
                  </td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3">Izin</td>
                  <td className="border-t border-b border-black py-1 text-center w-4">:</td>
                  <td className="border border-black py-1 px-3 text-left font-mono">
                    {pelengkap.izin} Hari
                  </td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3">Tanpa Keterangan</td>
                  <td className="border-t border-b border-black py-1 text-center w-4">:</td>
                  <td className="border border-black py-1 px-3 text-left font-mono">
                    {pelengkap.alpa} Hari
                  </td>
                </tr>
                <tr className="font-semibold bg-stone-50/50">
                  <td className="border border-black py-1 px-3">Jumlah</td>
                  <td className="border-t border-b border-black py-1 text-center w-4">:</td>
                  <td className="border border-black py-1 px-3 text-left font-mono">
                    {totalAbsen} Hari
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kolom Kanan: LULUS/TIDAK LULUS (atau Kenaikan Kelas) - HANYA ADA DI SEMESTER GENAP */}
          {isSemesterGenap && (
            <div className="col-span-6">
              <div className="border border-black">
                <div className="bg-[#e2e2e2] border-b border-black py-1 px-3 text-center font-bold text-[10.5px]">
                  {isKelasAkhir ? "LULUS/TIDAK LULUS" : "KENAIKAN KELAS"}
                </div>
                <div className="h-[96px] flex items-center justify-center">
                  <span className="text-sm font-bold tracking-wider text-black">
                    {statusHasil}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. TANDA TANGAN RESMI (SEGITIGA KHAS RAPOR) */}
        <div className="text-[11px] font-sans text-black pt-1">
          {/* Baris Atas: Orang Tua (Kiri) & Guru Kelas (Kanan) */}
          <div className="flex justify-between items-start mb-6 print:mb-4">
            {/* Orang Tua / Wali */}
            <div className="text-center w-56">
              <p className="mb-1">Mengetahui :</p>
              <p className="font-semibold">Orang Tua / Wali Siswa</p>
              <div className="h-16 print:h-12" />
              <p className="border-b border-black inline-block px-12"></p>
            </div>

            {/* Guru Kelas */}
            <div className="text-center w-60">
              <p className="mb-1">
                {periode.tempatCetak || "Air Dingin"},{" "}
                {periode.tanggalCetak || "20 Juni 2026"}
              </p>
              <p className="font-semibold">Guru Kelas {kelas.nama}</p>
              <div className="h-16 print:h-12" />
              <p className="font-bold underline uppercase">
                {waliKelas.nama || "-"}
              </p>
              <p className="text-[10px] mt-0.5">
                {waliKelas.nip ? `NIP. ${waliKelas.nip}` : "NIP. -"}
              </p>
            </div>
          </div>

          {/* Baris Bawah: Kepala Sekolah (Tengah) */}
          <div className="text-center mx-auto w-64">
            <p className="mb-1">Mengetahui ,</p>
            <p className="font-semibold">
              Kepala {sekolah.nama || "SDN 7 Simeulue Timur"}
            </p>
            <div className="h-16 print:h-12" />
            <p className="font-bold underline uppercase">
              {sekolah.kepalaSekolah || "SYARIFAH RADHIAH, S.Pd.I"}
            </p>
            <p className="text-[10px] mt-0.5">
              {sekolah.nipKepsek ? `NIP. ${sekolah.nipKepsek}` : "NIP. -"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
