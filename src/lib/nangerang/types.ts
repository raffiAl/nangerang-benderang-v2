export type TransactionType = "IURAN" | "PENJUALAN" | "PENGELUARAN" | "DENDA";

export interface TransactionDTO {
  id: string;
  type: TransactionType;
  date: string; // ISO string (UTC midnight dari tanggal kejadian)
  riceKg: number | null;
  pricePerKg: number | null;
  amount: number | null;
  note: string | null;
  createdAt: string;
}

export interface CashSummary {
  totalIuranKg: number; // total kilo iuran yang sudah diterima
  totalSoldKg: number; // total kilo beras yang sudah dijual
  riceStockKg: number; // stok beras sekarang (iuran - terjual)
  totalMoneyIn: number; // total uang masuk dari penjualan
  totalDenda: number; // total uang masuk dari denda ronda
  totalMoneyOut: number; // total pengeluaran
  cashBalance: number; // saldo kas sekarang (penjualan + denda - pengeluaran)
}

export interface RondaDayDTO {
  dayOfWeek: number; // 0=Senin .. 6=Minggu
  members: string[];
}

export interface RondaResponse {
  weekStart: string; // tanggal Senin (YYYY-MM-DD)
  days: RondaDayDTO[]; // selalu 7 entri
}

export interface TransactionsResponse {
  summary: CashSummary;
  transactions: TransactionDTO[];
}
