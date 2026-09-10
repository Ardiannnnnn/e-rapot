export interface GuruItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  kelasWali: {
    id: string;
    nama: string;
  } | null;
  totalPengampu: number;
}

export interface PengampuRecord {
  id: string;
  tahunAjaran: string;
  semester: number;
  guru: {
    id: string;
    name: string;
    email: string;
  };
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

export interface KelasItemWithWali {
  id: string;
  nama: string;
  tingkat: number;
  waliKelasId?: string | null;
  waliKelasNama?: string | null;
}

export interface FormPendidikProps {
  guruList: GuruItem[];
  pengampuList: PengampuRecord[];
  kelasList: KelasItemWithWali[];
  mapelList: { id: string; kode: string; nama: string }[];
  tahunAjaranAktif: string;
}
