export interface SiswaRecord {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
  nik?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  agama?: string | null;
  alamat: string | null;
  kelasId: string;
  kelas: {
    id: string;
    nama: string;
    tingkat: number;
  };
}

export interface FormSiswaProps {
  initialSiswaList: SiswaRecord[];
  kelasList: { id: string; nama: string; tingkat: number }[];
}
