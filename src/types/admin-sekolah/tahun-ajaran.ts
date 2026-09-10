export interface PeriodeItem {
  id: string;
  tahunAjaran: string;
  semester: number;
  isAktif: boolean;
  statusNilai: string;
  tanggalCetak: string | null;
  tempatCetak: string | null;
  createdAt: string;
}

export interface FormPeriodeProps {
  periodeList: PeriodeItem[];
}

export interface PeriodeFormErrors {
  tahunAjaran?: string;
  tempatCetak?: string;
  tanggalCetak?: string;
}
