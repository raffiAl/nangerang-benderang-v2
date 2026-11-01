import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import type { CashSummary, TransactionDTO } from "@/lib/nangerang/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function getCurrentStockKg(): Promise<number> {
  const grouped = await db.transaction.groupBy({
    by: ["type"],
    _sum: { riceKg: true },
    where: { type: { in: ["IURAN", "PENJUALAN"] } },
  });
  let stock = 0;
  for (const g of grouped) {
    if (g.type === "IURAN") stock += g._sum.riceKg ?? 0;
    else stock -= g._sum.riceKg ?? 0;
  }
  return round2(stock);
}

export async function GET() {
  const txs = await db.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const summary: CashSummary = {
    totalIuranKg: 0,
    totalSoldKg: 0,
    riceStockKg: 0,
    totalMoneyIn: 0,
    totalDenda: 0,
    totalMoneyOut: 0,
    cashBalance: 0,
  };

  for (const t of txs) {
    if (t.type === "IURAN") {
      summary.totalIuranKg += t.riceKg ?? 0;
    } else if (t.type === "PENJUALAN") {
      summary.totalSoldKg += t.riceKg ?? 0;
      summary.totalMoneyIn += t.amount ?? 0;
    } else if (t.type === "PENGELUARAN") {
      summary.totalMoneyOut += t.amount ?? 0;
    } else if (t.type === "DENDA") {
      summary.totalDenda += t.amount ?? 0;
    }
  }

  summary.totalIuranKg = round2(summary.totalIuranKg);
  summary.totalSoldKg = round2(summary.totalSoldKg);
  summary.riceStockKg = round2(summary.totalIuranKg - summary.totalSoldKg);
  summary.totalMoneyIn = round2(summary.totalMoneyIn);
  summary.totalDenda = round2(summary.totalDenda);
  summary.totalMoneyOut = round2(summary.totalMoneyOut);
  summary.cashBalance = round2(summary.totalMoneyIn + summary.totalDenda - summary.totalMoneyOut);

  return NextResponse.json({
    summary,
    transactions: txs satisfies TransactionDTO[],
  });
}

const createSchema = z.object({
  type: z.enum(["IURAN", "PENJUALAN", "PENGELUARAN", "DENDA"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  riceKg: z.number().positive("Jumlah kilo harus lebih dari 0.").optional(),
  pricePerKg: z.number().positive("Harga per kilo harus lebih dari 0.").optional(),
  amount: z.number().positive("Jumlah uang harus lebih dari 0.").optional(),
  note: z.string().trim().max(200, "Catatan maksimal 200 karakter.").optional(),
});

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const { type, date, note } = parsed.data;
  const dateObj = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
  }

  // ===== Validasi per tipe transaksi =====
  if (type === "IURAN") {
    const riceKg = parsed.data.riceKg;
    if (!riceKg) {
      return NextResponse.json(
        { error: "Jumlah beras (kg) wajib diisi." },
        { status: 400 }
      );
    }
    const created = await db.transaction.create({
      data: { type, date: dateObj, riceKg: round2(riceKg), note: note || null },
    });
    return NextResponse.json({ ok: true, transaction: created }, { status: 201 });
  }

  if (type === "PENJUALAN") {
    const riceKg = parsed.data.riceKg;
    const pricePerKg = parsed.data.pricePerKg;
    if (!riceKg || !pricePerKg) {
      return NextResponse.json(
        { error: "Jumlah kilo dan harga per kilo wajib diisi." },
        { status: 400 }
      );
    }
    // Aturan bisnis: gak boleh jual beras lebih banyak dari stok yang ada
    const stock = await getCurrentStockKg();
    if (riceKg > stock + 1e-9) {
      return NextResponse.json(
        {
          error: `Stok beras cuma ${stock.toLocaleString("id-ID")} kg — gak cukup buat jual ${riceKg
            .toLocaleString("id-ID")
            .replace(".", ",")} kg.`,
        },
        { status: 400 }
      );
    }
    const amount = round2(riceKg * pricePerKg);
    const created = await db.transaction.create({
      data: {
        type,
        date: dateObj,
        riceKg: round2(riceKg),
        pricePerKg: round2(pricePerKg),
        amount,
        note: note || null,
      },
    });
    return NextResponse.json({ ok: true, transaction: created }, { status: 201 });
  }

  if (type === "DENDA") {
    return createDenda(dateObj, parsed.data.amount, note);
  }

  // PENGELUARAN — keterangan wajib, ini inti transparansi
  const amount = parsed.data.amount;
  if (!amount) {
    return NextResponse.json(
      { error: "Jumlah pengeluaran (Rp) wajib diisi." },
      { status: 400 }
    );
  }
  if (!note) {
    return NextResponse.json(
      { error: "Keterangan wajib diisi — warga berhak tahu uang dipakai buat apa." },
      { status: 400 }
    );
  }
  const created = await db.transaction.create({
    data: { type, date: dateObj, amount: round2(amount), note },
  });
  return NextResponse.json({ ok: true, transaction: created }, { status: 201 });
}

// DENDA — uang masuk ke kas; nominal bebas, keterangan wajib (siapa + alasannya)
async function createDenda(
  dateObj: Date,
  amount: number | undefined,
  note: string | undefined
) {
  if (!amount) {
    return NextResponse.json(
      { error: "Jumlah denda (Rp) wajib diisi." },
      { status: 400 }
    );
  }
  if (!note) {
    return NextResponse.json(
      { error: "Keterangan wajib diisi — tulis siapa yang didenda dan alasannya." },
      { status: 400 }
    );
  }
  const created = await db.transaction.create({
    data: { type: "DENDA", date: dateObj, amount: round2(amount), note },
  });
  return NextResponse.json({ ok: true, transaction: created }, { status: 201 });
}
