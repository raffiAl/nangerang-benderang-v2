import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { computeWeek, DATE_RE, parseMembersJSON } from "@/lib/nangerang/ronda";
import type { RondaDayDTO, RondaResponse } from "@/lib/nangerang/types";

// GET /api/ronda?today=YYYY-MM-DD -> jadwal pekan yang memuat tanggal itu (publik)
export async function GET(req: NextRequest) {
  const today = req.nextUrl.searchParams.get("today") ?? "";
  if (!DATE_RE.test(today)) {
    return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
  }

  const { weekStart } = computeWeek(today);
  const rows = await db.rondaDay.findMany({
    where: { weekStart },
    orderBy: { dayOfWeek: "asc" },
  });

  const byDow = new Map<number, string[]>();
  for (const row of rows) {
    byDow.set(row.dayOfWeek, parseMembersJSON(row.members));
  }

  const days: RondaDayDTO[] = Array.from({ length: 7 }, (_, dow) => ({
    dayOfWeek: dow,
    members: byDow.get(dow) ?? [],
  }));

  const res: RondaResponse = { weekStart, days };
  return NextResponse.json(res);
}

const putSchema = z.object({
  today: z.string().regex(DATE_RE, "Tanggal tidak valid."),
  dayOfWeek: z.number().int().min(0, "Hari tidak valid.").max(6, "Hari tidak valid."),
  members: z.array(z.string()).max(20, "Maksimal 20 nama per hari."),
});

// PUT /api/ronda -> set/edit tim untuk 1 hari (khusus bendahara)
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const { today, dayOfWeek } = parsed.data;
  const { weekStart } = computeWeek(today);
  const members = parsed.data.members;

  await db.rondaDay.upsert({
    where: { weekStart_dayOfWeek: { weekStart, dayOfWeek } },
    create: { weekStart, dayOfWeek, members: JSON.stringify(members) },
    update: { members: JSON.stringify(members) },
  });

  return NextResponse.json({ ok: true });
}
