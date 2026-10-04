import { KokurikulerItem, TemaP5MasterItem } from "@/types/wali-kelas/pelengkap";

export function cleanTemaTitle(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^Tema\s*\d+\s*[:\-]?\s*/i, "").trim();
}

export function isTemaMatch(k: KokurikulerItem, m: TemaP5MasterItem): boolean {
  if (!k || !k.tema || !m || !m.judul) return false;
  const cleanK = k.tema.trim().toLowerCase();
  const cleanM = m.judul.trim().toLowerCase();
  if (cleanK === cleanM) return true;

  // Bandingkan isi judul tanpa prefix 'Tema X' agar jika nomor berubah tetap cocok
  const contentK = cleanTemaTitle(cleanK).toLowerCase();
  const contentM = cleanTemaTitle(cleanM).toLowerCase();
  if (contentK && contentM) {
    if (contentK === contentM) return true;
    if (contentK.includes(contentM) || contentM.includes(contentK)) return true;
  }

  return cleanK.includes(cleanM) || cleanM.includes(cleanK);
}

export function isTemaChecked(
  studentKokur: KokurikulerItem[] | undefined,
  masterTema: TemaP5MasterItem
): boolean {
  if (!studentKokur || studentKokur.length === 0) return false;
  return studentKokur.some((k) => isTemaMatch(k, masterTema));
}

export function formatTemaTitle(rawJudul: string, nomor: number): string {
  const clean = cleanTemaTitle(rawJudul) || rawJudul || `Tema ${nomor}`;
  return `Tema ${nomor} : ${clean}`;
}
