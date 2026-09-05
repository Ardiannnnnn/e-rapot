/**
 * Format tanggal dalam format Indonesia standar
 */
export function formatTanggalIndo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Format nilai angka desimal standar
 */
export function formatNilai(val: number | null | undefined): string {
  if (val === null || val === undefined) return "-";
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
}
