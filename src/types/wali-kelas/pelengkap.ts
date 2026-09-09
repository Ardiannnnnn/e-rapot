export type PredikatEkskul = "Sangat Baik" | "Baik" | "Cukup" | "Kurang";

export type PelengkapTab = "PRESENSI" | "EKSKUL" | "KOKURIKULER" | "KEBIASAAN" | "KENAIKAN";

export interface EkskulItem {
  nama: string;
  predikat: PredikatEkskul;
  keterangan?: string;
}

export interface KokurikulerItem {
  tema: string;
  deskripsi: string;
}

export interface SiswaPelengkapItem {
  id: string;
  nama: string;
  nisn: string;
  nis: string;
  jenisKelamin: string;
  sakit: number;
  izin: number;
  alpa: number;
  catatanWali: string;
  ekskul: EkskulItem[];
  kokurikuler: KokurikulerItem[];
  kebiasaanKarakter: string;
  statusKenaikan: string;
  isPresensiSaved?: boolean;
  isEkskulSaved?: boolean;
  isKokurikulerSaved?: boolean;
  isKebiasaanSaved?: boolean;
  isKenaikanSaved?: boolean;
}

export interface TemplateOptionItem {
  id: string;
  judul?: string | null;
  teks: string;
}

export interface FormPelengkapTemplates {
  temaP5: TemplateOptionItem[];
  kebiasaan: TemplateOptionItem[];
  saranWali: TemplateOptionItem[];
  ekskul?: TemplateOptionItem[];
}

export interface FormPelengkapProps {
  kelasId?: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  initialSiswaList: SiswaPelengkapItem[];
  initialTemplates?: FormPelengkapTemplates;
}
