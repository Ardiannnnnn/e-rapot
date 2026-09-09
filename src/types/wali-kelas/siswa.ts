export interface NilaiItem {
  id: string;
  mapelId: string;
  mapelKode: string;
  mapelNama: string;
  nilaiTugas: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir: number;
  catatan?: string | null;
}

export interface SiswaPresensi {
  sakit: number;
  izin: number;
  alpa: number;
  catatanWali?: string | null;
}

export interface SiswaItem {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
  alamat?: string | null;
  nilai: NilaiItem[];
  presensi: SiswaPresensi | null;
  rataRata: number;
  mapelDinilaiCount: number;
  totalMapel: number;
}

export interface DaftarSiswaProps {
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  siswaList: SiswaItem[];
}
