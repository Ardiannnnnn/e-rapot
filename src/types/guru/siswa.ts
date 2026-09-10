export interface GuruSiswaPageProps {
  searchParams: Promise<{
    kelasId?: string;
    mapelId?: string;
    semester?: string;
    tahunAjaran?: string;
  }>;
}

export interface SiswaItem {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
}

export interface NilaiData {
  siswaId: string;
  nilaiTugas: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir: number;
  catatan: string | null;
}

export interface PengampuOption {
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

export interface TPItem {
  id: string;
  kode: string;
  deskripsi: string;
  tingkat: number;
}

export interface FormInputNilaiProps {
  daftarPengampu: PengampuOption[];
  activePengampu: PengampuOption;
  siswaList: SiswaItem[];
  nilaiList: NilaiData[];
  tpList: TPItem[];
  selectedTahunAjaran: string;
  selectedSemester: number;
  isLocked: boolean;
}
