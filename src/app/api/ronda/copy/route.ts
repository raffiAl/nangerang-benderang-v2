import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { addDaysISO, computeWeek, DATE_RE, parseMembersJSON } from "@/lib/nangerang/ronda";

const copySchema = z.object({
  today: z.string().regex(DATE_RE, "Tanggal tidak valid."),
});

// POST /api/ronda/copy -> isi hari-hari yang masih kosong di pekan ini
// dengan tim dari pekan lalu (tidak menimpa yang sudah diedit)
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

  const parsed = copySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const { weekStart } = computeWeek(parsed.data.today);
  const prevWeekStart = addDaysISO(weekStart, -7);

  const [prevRows, currentRows] = await Promise.all([
    db.rondaDay.findMany({ where: { weekStart: prevWeekStart } }),
    db.rondaDay.findMany({ where: { weekStart } }),
  ]);

  const prevByDow = new Map<number, string[]>();
  for (const row of prevRows) {
    prevByDow.set(row.dayOfWeek, parseMembersJSON(row.members));
  }
  const currentFilledDows = new Set(
    currentRows
      .filter((row) => parseMembersJSON(row.members).length > 0)
      .map((row) => row.dayOfWeek)
  );

  let copied = 0;
  for (let dow = 0; dow < 7; dow++) {
    if (currentFilledDows.has(dow)) continue; // jangan timpa yang sudah diedit
    const members = prevByDow.get(dow) ?? [];
    if (members.length === 0) continue;
    await db.rondaDay.upsert({
      where: { weekStart_dayOfWeek: { weekStart, dayOfWeek: dow } },
      create: { weekStart, dayOfWeek: dow, members: JSON.stringify(members) },
      update: { members: JSON.stringify(members) },
    });
    copied++;
  }

  return NextResponse.json({ ok: true, copied });
}
