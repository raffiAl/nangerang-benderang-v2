// Seed data contoh untuk Nangerang Benderang
// Jalankan: bun scripts/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function d(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

async function main() {
  const count = await db.transaction.count();
  if (count > 0) {
    console.log(`Sudah ada ${count} transaksi, skip seed.`);
    return;
  }

  await db.transaction.createMany({
    data: [
      { type: "IURAN", date: d("2026-10-20"), riceKg: 14.5, note: "Iuran harian warga" },
      { type: "IURAN", date: d("2026-10-21"), riceKg: 12, note: null },
      { type: "IURAN", date: d("2026-10-22"), riceKg: 15.5, note: "Iuran harian warga" },
      { type: "IURAN", date: d("2026-10-23"), riceKg: 13, note: null },
      { type: "IURAN", date: d("2026-10-24"), riceKg: 16, note: "Iuran harian warga" },
      {
        type: "PENJUALAN",
        date: d("2026-10-25"),
        riceKg: 40,
        pricePerKg: 13000,
        amount: 520000,
        note: "Dijual ke warga RT 03",
      },
      { type: "IURAN", date: d("2026-10-26"), riceKg: 14, note: null },
      {
        type: "PENGELUARAN",
        date: d("2026-10-26"),
        amount: 85000,
        note: "Beli karung kosong 20 pcs",
      },
      { type: "IURAN", date: d("2026-10-27"), riceKg: 15.5, note: "Iuran harian warga" },
    ],
  });

  console.log("Seed selesai: 9 transaksi contoh.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
