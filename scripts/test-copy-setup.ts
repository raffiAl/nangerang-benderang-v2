// Verifikasi endpoint salin-jadwal: siapkan data pekan lalu & pulihkan setelah test
// Jalankan: bun scripts/test-copy-setup.ts <mode: prepare|restore>
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const mode = process.argv[2] ?? "prepare";
const PREV_WEEK = "2026-10-19";
const RABU_ORIGINAL = ["Cecep", "Mamat", "Ujang", "Dedi", "Agus", "Yanto", "Iwan", "Hendra"];

async function main() {
  if (mode === "prepare") {
    await db.rondaDay.upsert({
      where: { weekStart_dayOfWeek: { weekStart: PREV_WEEK, dayOfWeek: 2 } },
      create: {
        weekStart: PREV_WEEK,
        dayOfWeek: 2,
        members: JSON.stringify(["Pak Kades", "Pak RW", "Pak RT"]),
      },
      update: { members: JSON.stringify(["Pak Kades", "Pak RW", "Pak RT"]) },
    });
    // kosongkan Rabu pekan ini biar bisa disalin
    await db.rondaDay.upsert({
      where: { weekStart_dayOfWeek: { weekStart: "2026-10-26", dayOfWeek: 2 } },
      create: { weekStart: "2026-10-26", dayOfWeek: 2, members: "[]" },
      update: { members: "[]" },
    });
    console.log("PREPARED: pekan lalu ada data Rabu, Rabu pekan ini dikosongkan.");
  } else {
    await db.rondaDay.upsert({
      where: { weekStart_dayOfWeek: { weekStart: "2026-10-26", dayOfWeek: 2 } },
      create: { weekStart: "2026-10-26", dayOfWeek: 2, members: JSON.stringify(RABU_ORIGINAL) },
      update: { members: JSON.stringify(RABU_ORIGINAL) },
    });
    await db.rondaDay.deleteMany({ where: { weekStart: PREV_WEEK } });
    console.log("RESTORED: Rabu pulih, data test pekan lalu dihapus.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
