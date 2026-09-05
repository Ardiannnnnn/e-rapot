import { EkskulItem } from "@/actions/wali-kelas";

export interface LembarRaporData {
  sekolah: {
    nama: string;
    npsn: string;
    alamat?: string | null;
    kepalaSekolah?: string | null;
    nipKepsek?: string | null;
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
  nilaiList: {
    mapelKode: string;
    mapelNama: string;
    nilaiAkhir: number;
    capaianKompetensi: string;
  }[];
  pelengkap: {
    sakit: number;
    izin: number;
    alpa: number;
    catatanWali?: string | null;
    ekskul: EkskulItem[];
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

  return (
    <div className="rapor-paper bg-white text-zinc-900 p-8 sm:p-12 max-w-4xl mx-auto border border-stone-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
      {/* 1. KOP RESMI LAPORAN HASIL BELAJAR */}
      <div className="text-center border-b-2 border-zinc-900 pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide font-poppins">
          {sekolah.nama}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-700 mt-1">
          NPSN: {sekolah.npsn} {sekolah.alamat ? `• ${sekolah.alamat}` : ""}
        </p>
        <div className="mt-4 pt-2 border-t border-zinc-400">
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider font-poppins text-zinc-900">
            LAPORAN HASIL BELAJAR (RAPOR)
          </h1>
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest font-mono">
            KURIKULUM MERDEKA
          </span>
        </div>
      </div>

      {/* 2. IDENTITAS PESERTA DIDIK & ROMBEL */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-6 pb-4 border-b border-stone-200 font-sans">
        <div className="space-y-1.5">
          <div className="flex">
            <span className="w-36 text-zinc-600">Nama Peserta Didik</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-bold text-zinc-900 uppercase">{siswa.nama}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-zinc-600">NISN / NIS</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-mono text-zinc-900">{siswa.nisn} / {siswa.nis}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-zinc-600">Nama Sekolah</span>
            <span className="w-4 font-semibold">:</span>
            <span className="text-zinc-900">{sekolah.nama}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex">
            <span className="w-28 text-zinc-600">Kelas / Fase</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-semibold text-zinc-900">
              {kelas.nama} / {kelas.fase}
            </span>
          </div>
          <div className="flex">
            <span className="w-28 text-zinc-600">Semester</span>
            <span className="w-4 font-semibold">:</span>
            <span className="text-zinc-900">
              {periode.semester} ({periode.semester === 1 ? "Ganjil" : "Genap"})
            </span>
          </div>
          <div className="flex">
            <span className="w-28 text-zinc-600">Tahun Ajaran</span>
            <span className="w-4 font-semibold">:</span>
            <span className="font-mono text-zinc-900">{periode.tahunAjaran}</span>
          </div>
        </div>
      </div>

      {/* 3. TABEL NILAI & CAPAIAN KOMPETENSI */}
      <div className="mb-6 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
          A. Nilai & Capaian Kompetensi
        </h3>
        <table className="w-full border-collapse border border-zinc-900 text-xs">
          <thead>
            <tr className="bg-stone-100 text-zinc-900 text-center font-bold">
              <th className="border border-zinc-900 py-2 px-2 w-10">No</th>
              <th className="border border-zinc-900 py-2 px-3 w-52 text-left">Muatan Pelajaran</th>
              <th className="border border-zinc-900 py-2 px-2 w-20">Nilai Akhir</th>
              <th className="border border-zinc-900 py-2 px-3 text-left">Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            {nilaiList.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-zinc-900 py-4 text-center text-zinc-500 italic">
                  Belum ada nilai yang dimasukkan untuk peserta didik ini.
                </td>
              </tr>
            ) : (
              nilaiList.map((n, idx) => (
                <tr key={idx} className="align-top">
                  <td className="border border-zinc-900 py-2.5 px-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-zinc-900 py-2.5 px-3 font-semibold text-zinc-900">
                    {n.mapelNama}
                  </td>
                  <td className="border border-zinc-900 py-2.5 px-2 text-center font-mono font-bold">
                    {n.nilaiAkhir > 0 ? n.nilaiAkhir : "-"}
                  </td>
                  <td className="border border-zinc-900 py-2.5 px-3 text-justify leading-relaxed text-zinc-800">
                    {n.capaianKompetensi}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. EKSTRAKURIKULER & PRESENSI DALAM 2 KOLOM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Ekstrakurikuler */}
        <div className="md:col-span-2 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
            B. Ekstrakurikuler
          </h3>
          <table className="w-full border-collapse border border-zinc-900 text-xs">
            <thead>
              <tr className="bg-stone-100 text-zinc-900 font-bold text-center">
                <th className="border border-zinc-900 py-2 px-2 w-8">No</th>
                <th className="border border-zinc-900 py-2 px-3 w-40 text-left">Kegiatan</th>
                <th className="border border-zinc-900 py-2 px-2 w-24">Predikat</th>
                <th className="border border-zinc-900 py-2 px-3 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {pelengkap.ekskul.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-zinc-900 py-3 text-center text-zinc-500 italic">
                    - Tidak mengikuti kegiatan ekstrakurikuler -
                  </td>
                </tr>
              ) : (
                pelengkap.ekskul.map((e, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="border border-zinc-900 py-2 px-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-zinc-900 py-2 px-3 font-medium">{e.nama}</td>
                    <td className="border border-zinc-900 py-2 px-2 text-center font-semibold">{e.predikat}</td>
                    <td className="border border-zinc-900 py-2 px-3 leading-relaxed">{e.keterangan}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Ketidakhadiran */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
            C. Ketidakhadiran
          </h3>
          <table className="w-full border-collapse border border-zinc-900 text-xs">
            <tbody>
              <tr>
                <td className="border border-zinc-900 py-1.5 px-3">Sakit</td>
                <td className="border border-zinc-900 py-1.5 px-3 text-center font-mono font-bold w-20">
                  {pelengkap.sakit} hari
                </td>
              </tr>
              <tr>
                <td className="border border-zinc-900 py-1.5 px-3">Izin</td>
                <td className="border border-zinc-900 py-1.5 px-3 text-center font-mono font-bold w-20">
                  {pelengkap.izin} hari
                </td>
              </tr>
              <tr>
                <td className="border border-zinc-900 py-1.5 px-3">Tanpa Keterangan</td>
                <td className="border border-zinc-900 py-1.5 px-3 text-center font-mono font-bold w-20">
                  {pelengkap.alpa} hari
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CATATAN WALI KELAS */}
      <div className="mb-8 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
          D. Catatan Perkembangan & Pembinaan Karakter
        </h3>
        <div className="border border-zinc-900 p-3.5 text-xs text-zinc-800 leading-relaxed italic min-h-[50px] bg-stone-50/30">
          {pelengkap.catatanWali
            ? pelengkap.catatanWali
            : "Tingkatkan terus prestasi akademik dan pertahankan budi pekerti yang luhur."}
        </div>
      </div>

      {/* 6. TITIMANGSA & TANDA TANGAN RESMI */}
      <div className="pt-2 text-xs font-sans text-zinc-900">
        <div className="flex justify-between items-start mb-16">
          <div className="text-center w-60">
            <p className="mb-1">Mengetahui,</p>
            <p className="font-semibold">Orang Tua / Wali Murid</p>
            <div className="h-20" />
            <p className="font-semibold border-b border-zinc-900 inline-block px-12">
              .............................................
            </p>
          </div>

          <div className="text-center w-60">
            <p className="mb-1">
              {periode.tempatCetak}, {periode.tanggalCetak}
            </p>
            <p className="font-semibold">Wali Kelas</p>
            <div className="h-20" />
            <p className="font-bold border-b border-zinc-900 inline-block">
              {waliKelas.nama}
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              NIP. {waliKelas.nip || "-"}
            </p>
          </div>
        </div>

        <div className="text-center mx-auto w-64">
          <p className="mb-1">Mengetahui,</p>
          <p className="font-semibold">Kepala Sekolah</p>
          <div className="h-20" />
          <p className="font-bold border-b border-zinc-900 inline-block">
            {sekolah.kepalaSekolah || "Kepala Sekolah"}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            NIP. {sekolah.nipKepsek || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
