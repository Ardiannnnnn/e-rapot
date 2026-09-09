import { EkskulItem } from "./pelengkap";

export interface NilaiRaporItem {
  mapelKode: string;
  mapelNama: string;
  isMulok?: boolean;
  nilaiAkhir: number;
  capaianKompetensi?: string;
  capaianTinggi?: string;
  capaianRendah?: string;
}

export interface LembarRaporSekolah {
  nama: string;
  npsn: string;
  alamat?: string | null;
  kepalaSekolah?: string | null;
  nipKepsek?: string | null;
  kabupatenKota?: string | null;
  kecamatan?: string | null;
  provinsi?: string | null;
}

export interface LembarRaporSiswa {
  id: string;
  nama: string;
  nisn: string;
  nis: string;
  jenisKelamin: string;
}

export interface LembarRaporKelas {
  nama: string;
  tingkat: number;
  fase: string;
  totalSiswa?: number;
}

export interface LembarRaporPeriode {
  tahunAjaran: string;
  semester: number;
  tempatCetak: string;
  tanggalCetak: string;
}

export interface LembarRaporWali {
  nama: string;
  nip?: string | null;
}

export interface LembarRaporPelengkap {
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
  statusKelulusan?: string | null;
}

export interface LembarRaporRekapitulasi {
  peringkat?: number;
  totalSiswa?: number;
}

export interface LembarRaporData {
  sekolah: LembarRaporSekolah;
  siswa: LembarRaporSiswa;
  kelas: LembarRaporKelas;
  periode: LembarRaporPeriode;
  waliKelas: LembarRaporWali;
  nilaiList: NilaiRaporItem[];
  pelengkap: LembarRaporPelengkap;
  rekapitulasi?: LembarRaporRekapitulasi;
}

export interface CetakRaporClientProps {
  sekolahNama: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  raporList: LembarRaporData[];
}
