/**
 * Helper ronda — dipakai di client & server (tanpa import Node).
 * Konvensi: dayOfWeek 0=Senin .. 6=Minggu (pekan Indonesia mulai Senin).
 */

import { todayISO } from "./format";

export { todayISO };

export const DAY_NAMES_ID = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** JS getDay() (0=Minggu..6=Sabtu) -> dayOfWeek kita (0=Senin..6=Minggu) */
export function jsDayToDow(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Tambah n hari ke tanggal YYYY-MM-DD (aritmetika UTC, aman dari geser hari) */
export function addDaysISO(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Dari tanggal "hari ini" (YYYY-MM-DD), hitung tanggal Senin pekan itu
 * dan dayOfWeek hari ini.
 */
export function computeWeek(todayStr: string): { weekStart: string; todayDow: number } {
  const d = new Date(`${todayStr}T00:00:00.000Z`);
  const todayDow = jsDayToDow(d.getUTCDay());
  return { weekStart: addDaysISO(todayStr, -todayDow), todayDow };
}

/** Nama anggota ronda: bersihkan, buang duplikat & yang kosong, batasi jumlah */
export function cleanMembers(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= 20) break;
  }
  return out;
}

/** Parse input textarea: satu nama per baris, boleh juga dipisah koma */
export function parseMembersInput(text: string): string[] {
  return cleanMembers(text.split(/[\n,]+/));
}

export function parseMembersJSON(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return cleanMembers(arr);
  } catch {
    return [];
  }
}
