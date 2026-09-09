export interface TemplateItem {
  id: string;
  kategori: string;
  judul?: string | null;
  teks: string;
  urutan: number;
}

export type KategoriTemplate = "TEMA_P5" | "KEBIASAAN" | "SARAN_WALI" | "EKSKUL";

export interface MasterTabProps {
  items: TemplateItem[];
  isSubmitting: boolean;
  onUpdate: (id: string, teks: string, judul?: string) => Promise<boolean>;
  onDelete: (item: TemplateItem) => void;
}

export interface MasterDeskripsiClientProps {
  kelasId: string;
  kelasNama: string;
  tingkat: number;
  tahunAjaran: string;
  semester: number;
  initialTemaP5: TemplateItem[];
  initialKebiasaan: TemplateItem[];
  initialSaranWali: TemplateItem[];
  initialEkskul?: TemplateItem[];
}
