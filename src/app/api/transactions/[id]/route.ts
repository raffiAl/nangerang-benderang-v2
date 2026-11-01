import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const { id } = await params;
  try {
    await db.transaction.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Transaksi gak ketemu." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
