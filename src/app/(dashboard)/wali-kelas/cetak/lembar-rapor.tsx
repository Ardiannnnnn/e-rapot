import React from "react";
import { EkskulItem } from "@/actions/wali-kelas";

export interface NilaiRaporItem {
  mapelKode: string;
  mapelNama: string;
  nilaiAkhir: number;
  capaianKompetensi?: string;
  capaianTinggi?: string;
  capaianRendah?: string;
}

export interface LembarRaporData {
  sekolah: {
    nama: string;
    npsn: string;
    alamat?: string | null;
    kepalaSekolah?: string | null;
    nipKepsek?: string | null;
    kabupatenKota?: string | null;
    kecamatan?: string | null;
    provinsi?: string | null;
  };
  siswa: {
    id: string;
    nama: string;
    nisn: string;
    nis: string;
    jenisKelamin: string;
  };
  kelas: {
    nama: string;
    tingkat: number;
    fase: string;
    totalSiswa?: number;
  };
  periode: {
    tahunAjaran: string;
    semester: number;
    tempatCetak: string;
    tanggalCetak: string;
  };
  waliKelas: {
    nama: string;
    nip?: string | null;
  };
  nilaiList: NilaiRaporItem[];
  pelengkap: {
    sakit: number;
    izin: number;
    alpa: number;
    catatanWali?: string | null;
    ekskul?: EkskulItem[];
    kokurikuler?: {
      tema: string;
      deskripsi: string;
    }[];
    kebiasaanKarakter?: string | null;
    statusKelulusan?: string | null; // "LULUS" atau "Naik ke Kelas ..."
  };
  rekapitulasi?: {
    peringkat?: number;
    totalSiswa?: number;
  };
}

// Helper untuk deskripsi capaian kompetensi ganda (Sekat Sangat Baik & Baik)
function getDeskripsiCapaian(
  namaSiswa: string,
  mapelNama: string,
  nilaiAkhir: number,
  customCapaian?: string,
  customTinggi?: string,
  customRendah?: string
) {
  if (customTinggi && customRendah) {
    return {
      tinggi: customTinggi,
      rendah: customRendah,
    };
  }

  const namaLower = mapelNama.toLowerCase();
  const namaSiswaUpper = namaSiswa.toUpperCase();

  // Template materi standar berdasarkan mata pelajaran Kurikulum Merdeka
  let materiTinggi = "memahami materi pembelajaran dengan sangat baik";
  let materiRendah = "menerapkan konsep pembelajaran dalam tugas harian";

  if (namaLower.includes("agama")) {
    materiTinggi = "Memahami dan mengamalkan ajaran agama Islam dalam kehidupan sehari-hari";
    materiRendah = "Memahami dan mengamalkan ajaran agama Islam dalam kehidupan sehari-hari";
  } else if (namaLower.includes("pancasila")) {
    materiTinggi = "menguraikan makna sila-sila dalam Pancasila";
    materiRendah = "menguraikan makna sila-sila dalam Pancasila";
  } else if (namaLower.includes("indonesia")) {
    materiTinggi = "mendapatkan inspirasi dari kisah anak-anak muda yang mengubah dunia";
    materiRendah = "mendapatkan inspirasi dari kisah anak-anak muda yang mengubah dunia";
  } else if (namaLower.includes("matematika")) {
    materiTinggi = "memahami perkalian pecahan dengan bilangan asli dan menghitung hasil perkalian tersebut";
    materiRendah = "memahami perkalian pecahan dengan bilangan asli dan menghitung hasil perkalian tersebut";
  } else if (namaLower.includes("alam") || namaLower.includes("ipas") || namaLower.includes("sosial")) {
    materiTinggi = "mengidentifikasi organ tubuh yang berkaitan dengan sistem gerak";
    materiRendah = "mengidentifikasi organ tubuh yang berkaitan dengan sistem gerak";
  } else if (namaLower.includes("seni") || namaLower.includes("prakarya")) {
    materiTinggi = "menunjukkan kepekaannya terhadap unsur-unsur musik";
    materiRendah = "menunjukkan kepekaannya terhadap unsur-unsur musik";
  } else if (namaLower.includes("jasmani") || namaLower.includes("pjok") || namaLower.includes("olahraga")) {
    materiTinggi = "menjelaskan modifikasi pola gerak dasar variasi melempar, menangkap, dan menggiring bola dengan benar";
    materiRendah = "menjelaskan modifikasi pola gerak dasar variasi melempar, menangkap, dan menggiring bola dengan benar";
  } else if (namaLower.includes("inggris")) {
    materiTinggi = "mengidentifikasi dan mengucapkan kata kerja bentuk lampau (past activity)";
    materiRendah = "mengidentifikasi dan mengucapkan kata kerja bentuk lampau (past activity)";
  } else if (namaLower.includes("lokal") || namaLower.includes("mulok") || namaLower.includes("aceh")) {
    materiTinggi = "Melestarikan budaya dan kearifan lokal";
    materiRendah = "Melestarikan budaya dan kearifan lokal";
  } else if (customCapaian) {
    materiTinggi = customCapaian;
    materiRendah = customCapaian;
  }

  return {
    tinggi: `${namaSiswaUpper} menunjukkan penguasaan yang sangat baik dalam ${materiTinggi}`,
    rendah: `${namaSiswaUpper} menunjukkan penguasaan yang baik dalam ${materiRendah}`,
  };
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

  // Status kelulusan / kenaikan kelas
  const isKelasAkhir = kelas.tingkat === 6 || kelas.tingkat === 9 || kelas.tingkat === 12;
  const statusHasil =
    pelengkap.statusKelulusan || (isKelasAkhir ? "LULUS" : `Naik ke Kelas ${kelas.tingkat + 1}`);

  // Pisahkan mapel umum dan mulok jika ada
  const mapelReguler = nilaiList.filter(
    (n) => !n.mapelNama.toLowerCase().includes("muatan lokal") && !n.mapelNama.toLowerCase().includes("mulok")
  );
  const mapelMulok = nilaiList.filter(
    (n) => n.mapelNama.toLowerCase().includes("muatan lokal") || n.mapelNama.toLowerCase().includes("mulok")
  );

  // Data default Kokurikuler (P5)
  const listKokurikuler =
    pelengkap.kokurikuler && pelengkap.kokurikuler.length > 0
      ? pelengkap.kokurikuler
      : [
          {
            tema: "Tema 1 : Kreasi Nusantara ( Membuat Batik Sederhana )",
            deskripsi: `${siswa.nama.toUpperCase()} Sangat Baik dalam keimanan dan ketakwaan terhadap Tuhan YME dan Perlu Bimbingan dalam kesehatan pada kegiataan Membuat Batik Sederhana`,
          },
          {
            tema: "Tema 2 : Peduli Terhadap Lingkungan Sekitar ( Mengolah Sampah Organik Dan Non Organik )",
            deskripsi: `${siswa.nama.toUpperCase()} Sangat Baik dalam keimanan dan ketakwaan terhadap Tuhan YME dan Perlu Bimbingan dalam kesehatan pada kegiataan Mengolah Sampah Organik Dan Non Organik`,
          },
          {
            tema: "Tema 3 : Bangunlah Jiwa Dan Raganya ( Menanam Tanaman Obat Keluarga )",
            deskripsi: `${siswa.nama.toUpperCase()} Sangat Baik dalam keimanan dan ketakwaan terhadap Tuhan YME dan Perlu Bimbingan dalam kesehatan pada kegiataan Menanam Tanaman Obat Keluarga`,
          },
        ];

  // Ekstrakurikuler default
  const listEkskul =
    pelengkap.ekskul && pelengkap.ekskul.length > 0
      ? pelengkap.ekskul
      : [
          { nama: "Pramuka", predikat: "Baik", keterangan: "" },
          { nama: "olahraga", predikat: "Baik", keterangan: "" },
          { nama: "keagamaan", predikat: "Baik", keterangan: "" },
        ];

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
                        {/* Sekat Atas: Capaian Sangat Baik */}
                        <div className="p-2 border-b border-zinc-400">
                          {capaian.tinggi}
                        </div>
                        {/* Sekat Bawah: Capaian Baik */}
                        <div className="p-2">
                          {capaian.rendah}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Baris Muatan Lokal (Nomor 9 atau nomor berikutnya) */}
              <tr>
                <td className="border border-black py-1 px-1 text-center font-medium">
                  {mapelReguler.length + 1}
                </td>
                <td className="border border-black py-1 px-2.5 font-semibold text-black" colSpan={3}>
                  Muatan Lokal
                </td>
              </tr>
              {mapelMulok.length > 0 ? (
                mapelMulok.map((m, mIdx) => {
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
                        {m.mapelNama}
                      </td>
                      <td className="border border-black py-2 px-1 text-center font-bold">
                        {m.nilaiAkhir > 0 ? m.nilaiAkhir : "-"}
                      </td>
                      <td className="border border-black p-0 leading-relaxed text-black">
                        <div className="p-2 border-b border-zinc-400">
                          {capaian.tinggi}
                        </div>
                        <div className="p-2">
                          {capaian.rendah}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="align-top">
                  <td className="border border-black py-2 px-1 text-center"></td>
                  <td className="border border-black py-2 px-2.5 pl-5 font-medium text-black">
                    Mulok
                  </td>
                  <td className="border border-black py-2 px-1 text-center font-bold">
                    88
                  </td>
                  <td className="border border-black p-0 leading-relaxed text-black">
                    <div className="p-2 border-b border-zinc-400">
                      {siswa.nama.toUpperCase()} menunjukkan penguasaan yang sangat baik dalam Melestarikan budaya dan kearifan lokal
                    </div>
                    <div className="p-2">
                      {siswa.nama.toUpperCase()} menunjukkan penguasaan yang baik dalam Melestarikan budaya dan kearifan lokal
                    </div>
                  </td>
                </tr>
              )}

              {/* Baris Total / Footer: Jumlah dan Rata-rata */}
              <tr className="font-bold bg-white">
                <td colSpan={2} className="border border-black py-1.5 px-3 text-left">
                  Jumlah
                </td>
                <td className="border border-black py-1.5 px-1 text-center">
                  {totalNilai > 0 ? totalNilai : "749"}
                </td>
                <td className="border border-black py-1.5 px-3">
                  <div className="flex items-center gap-8">
                    <span>Rata-rata</span>
                    <span className="font-mono">{rataRata !== "0.00" ? rataRata : "83.22"}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ===================== PAGE BREAK (PEMISAH HALAMAN CETAK) ================== */}
      {/* ========================================================================= */}
      <div
        className="page-break-divider print:break-after-page print:page-break-after-always my-6 print:my-0"
        style={{ pageBreakAfter: "always", breakAfter: "page" }}
      />

      {/* ========================================================================= */}
      {/* ============================== LEMBAR 2 ================================= */}
      {/* ========================================================================= */}
      <div className="rapor-paper page-2 bg-white p-8 sm:p-10 max-w-[850px] mx-auto border border-stone-300 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-[11px] leading-tight mt-6 print:mt-0">
        {/* 1. EKSTRAKURIKULER */}
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
              {listEkskul.map((e, idx) => (
                <tr key={idx} className="h-6">
                  <td className="border border-black py-1 px-3 font-medium text-black">
                    {e.nama}
                  </td>
                  <td className="border border-black py-1 px-3 text-black">
                    {e.predikat || "Baik"}
                  </td>
                </tr>
              ))}
              {/* Spacer row jika perlu */}
              {listEkskul.length < 4 && (
                <tr className="h-5">
                  <td className="border border-black py-1 px-3">&nbsp;</td>
                  <td className="border border-black py-1 px-3">&nbsp;</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. KOKURIKULER (P5) */}
        <div className="mb-4 space-y-1">
          <h2 className="text-[11.5px] font-bold text-black">
            Kokurikuler
          </h2>
          <div className="border border-black text-[10.5px]">
            {listKokurikuler.map((k, idx) => (
              <div key={idx} className={idx > 0 ? "border-t border-black" : ""}>
                <div className="bg-[#e2e2e2] py-1 px-3 font-semibold text-black border-b border-black">
                  {k.tema}
                </div>
                <div className="p-2.5 leading-relaxed text-black">
                  {k.deskripsi}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 7 KEBIASAAN ANAK INDONESIA HEBAT */}
        <div className="mb-4 space-y-1">
          <h2 className="text-[11.5px] font-bold text-black">
            7 Kebiasaan Anak Indonesia Hebat
          </h2>
          <div className="border border-black p-2.5 text-[10.5px] leading-relaxed text-black">
            {pelengkap.kebiasaanKarakter ||
              `${siswa.nama.toUpperCase()} Terbiasa dalam beribadah dan Belum Terbiasa dalam tidur cepat`}
          </div>
        </div>

        {/* 4. SARAN-SARAN / CATATAN WALI KELAS */}
        <div className="mb-5 space-y-1">
          <h2 className="text-[11.5px] font-bold text-black">
            Saran-saran / Catatan Wali Kelas
          </h2>
          <div className="border border-black p-2.5 text-[10.5px] leading-relaxed text-black">
            {pelengkap.catatanWali ||
              "Alhamdulillah sikap dan pengetahuan Ananda sudah baik. Kembangkan potensi yang dimiliki karena intan tidak akan dinilai tanpa diasah."}
          </div>
        </div>

        {/* 5. KETIDAKHADIRAN & KEPUTUSAN KELULUSAN (2 KOLOM SEJAJAR) */}
        <div className="grid grid-cols-12 gap-6 mb-8 items-start">
          {/* Kolom Kiri: Ketidakhadiran */}
          <div className="col-span-6">
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

          {/* Kolom Kanan: LULUS/TIDAK LULUS (atau Kenaikan Kelas) */}
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
        </div>

        {/* 6. TANDA TANGAN RESMI (SEGITIGA KHAS RAPOR) */}
        <div className="text-[11px] font-sans text-black pt-2">
          {/* Baris Atas: Orang Tua (Kiri) & Guru Kelas (Kanan) */}
          <div className="flex justify-between items-start mb-8">
            {/* Orang Tua / Wali */}
            <div className="text-center w-56">
              <p className="mb-1">Mengetahui :</p>
              <p className="font-semibold">Orang Tua / Wali Siswa</p>
              <div className="h-20" />
              <p className="border-b border-black inline-block px-12"></p>
            </div>

            {/* Guru Kelas */}
            <div className="text-center w-60">
              <p className="mb-1">
                {periode.tempatCetak || "Air Dingin"},{" "}
                {periode.tanggalCetak || "20 Juni 2026"}
              </p>
              <p className="font-semibold">Guru Kelas {kelas.nama}</p>
              <div className="h-20" />
              <p className="font-bold underline uppercase">
                {waliKelas.nama || "SANTI MARIA, S.Pd"}
              </p>
              <p className="text-[10px] mt-0.5">
                NIP. {waliKelas.nip || "198201022008032001"}
              </p>
            </div>
          </div>

          {/* Baris Bawah: Kepala Sekolah (Tengah) */}
          <div className="text-center mx-auto w-64">
            <p className="mb-1">Mengetahui ,</p>
            <p className="font-semibold">
              Kepala {sekolah.nama || "SDN 7 Simeulue Timur"}
            </p>
            <div className="h-20" />
            <p className="font-bold underline uppercase">
              {sekolah.kepalaSekolah || "SYARIFAH RADHIAH, S.Pd.I"}
            </p>
            <p className="text-[10px] mt-0.5">
              NIP. {sekolah.nipKepsek || "197110201994102001"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
