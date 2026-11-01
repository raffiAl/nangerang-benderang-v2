// Seed v2: jadwal ronda minggu berjalan (pekan 26 Okt 2026) + contoh transaksi denda
// Jalankan: bun scripts/seed-v2.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const WEEK_START = "2026-10-26"; // Senin

// Tim ronda berotasi — sebagian nama muncul di beberapa hari
const JADWAL: Record<number, string[]> = {
  0: ["Asep", "Udin", "Mamat", "Ujang", "Dedi", "Iwan", "Cecep", "Agus"],
  1: ["Yanto", "Hendra", "Dadang", "Udin", "Rustam", "Enung", "Asep", "Wawan"],
  2: ["Cecep", "Mamat", "Ujang", "Dedi", "Agus", "Yanto", "Iwan", "Hendra"],
  3: ["Dadang", "Wawan", "Rustam", "Enung", "Asep", "Udin", "Ujang", "Mamat"],
  4: ["Iwan", "Dedi", "Yanto", "Cecep", "Agus", "Hendra", "Dadang", "Wawan"],
  5: ["Ujang", "Rustam", "Mamat", "Enung", "Asep", "Iwan", "Yanto", "Dedi"],
  6: ["Udin", "Cecep", "Dadang", "Hendra", "Agus", "Wawan", "Ujang", "Asep"],
};

function d(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

async function main() {
  const existing = await db.rondaDay.count({ where: { weekStart: WEEK_START } });
  if (existing > 0) {
    console.log(`Jadwal ronda minggu ${WEEK_START} sudah ada (${existing} hari), skip.`);
  } else {
    await db.rondaDay.createMany({
      data: Object.entries(JADWAL).map(([dow, members]) => ({
        weekStart: WEEK_START,
        dayOfWeek: Number(dow),
        members: JSON.stringify(members),
      })),
    });
    console.log(`Jadwal ronda minggu ${WEEK_START} selesai: 7 hari.`);
  }

  const dendaCount = await db.transaction.count({ where: { type: "DENDA" } });
  if (dendaCount === 0) {
    await db.transaction.create({
      data: {
        type: "DENDA",
        date: d("2026-10-26"),
        amount: 25000,
        note: "Denda Mamat — gak ronda tanpa kabar",
      },
    });
    console.log("Contoh transaksi denda dibuat.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
