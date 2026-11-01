const idNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** Format kilo: 12.5 -> "12,5 kg" */
export function formatKg(kg: number): string {
  return `${idNumber.format(kg)} kg`;
}

/** Format rupiah: 37500 -> "Rp 37.500" */
export function formatRupiah(amount: number): string {
  return `Rp ${idNumber.format(amount)}`;
}

const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Format tanggal ISO menjadi "27 Okt 2026".
 * Pakai bagian UTC karena tanggal disimpan sebagai UTC midnight —
 * jadi tanggal yang dipilih bendahara tidak akan geser satu hari.
 */
export function formatDateID(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getUTCDate()} ${MONTHS_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Tanggal hari ini (zona waktu perangkat) dalam format YYYY-MM-DD untuk input date */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse angka yang mungkin ditulis dengan koma desimal (gaya Indonesia),
 * contoh: "12,5" -> 12.5. Mengembalikan null kalau tidak valid.
 */
export function parseDecimalID(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
