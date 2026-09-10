export interface KelasItem {
  id: string;
  nama: string;
  tingkat: number;
  tahunAjaran: string;
  totalSiswa: number;
  totalMapel: number;
  waliKelas: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface GuruOption {
  id: string;
  name: string;
  email: string;
  kelasWali?: {
    id: string;
    nama: string;
  } | null;
}

export interface MapelOption {
  id: string;
  kode: string;
  nama: string;
  isMulok?: boolean;
}

export interface ExistingPengampuItem {
  kelasId: string;
  mapelId: string;
  guruId: string;
  semester?: number;
}

export interface FormKelasProps {
  kelasList: KelasItem[];
  guruOptions: GuruOption[];
  mapelOptions?: MapelOption[];
  existingPengampuList?: ExistingPengampuItem[];
  tahunAjaranAktif: string;
}
