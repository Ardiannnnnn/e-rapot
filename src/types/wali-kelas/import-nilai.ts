export interface MapelImportItem {
  id: string;
  kode: string;
  nama: string;
  guruNama?: string;
  terisiCount?: number;
  totalSiswa?: number;
  bobotTugas?: number;
  bobotUTS?: number;
  bobotUAS?: number;
}

export interface SiswaImportItem {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
}

export interface ParsedRow {
  rowNum: number;
  nisn: string;
  namaExcel: string;
  tugas: number;
  uts: number;
  uas: number;
  nilaiAkhir: number;
  catatan: string;
  isValid: boolean;
  matchedSiswaNama?: string;
}

export interface FormImportNilaiProps {
  kelasId: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  mapelList: MapelImportItem[];
  siswaList: SiswaImportItem[];
}
