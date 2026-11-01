"use client";

import { useState } from "react";
import { CalendarDays, Loader2, Pencil, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { addDaysISO, DAY_NAMES_ID, parseMembersInput, todayISO } from "@/lib/nangerang/ronda";
import { formatDateID } from "@/lib/nangerang/format";
import type { RondaResponse } from "@/lib/nangerang/types";
import { cn } from "@/lib/utils";

/** Label pekan, misal "26 Okt 2026 – 1 Nov 2026" */
export function weekLabel(weekStart: string): string {
  return `${formatDateID(`${weekStart}T00:00:00.000Z`)} – ${formatDateID(
    `${addDaysISO(weekStart, 6)}T00:00:00.000Z`
  )}`;
}

/**
 * Daftar 7 hari jadwal ronda. Dipakai di halaman publik (read-only)
 * dan di dashboard bendahara (dengan tombol Edit).
 */
export function RondaDayList({
  ronda,
  todayDow,
  onEdit,
}: {
  ronda: RondaResponse | null;
  todayDow: number;
  onEdit?: (dayOfWeek: number) => void;
}) {
  if (!ronda) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {ronda.days.map((day) => {
        const isToday = day.dayOfWeek === todayDow;
        return (
          <li
            key={day.dayOfWeek}
            className={cn(
              "rounded-xl border bg-white p-3.5",
              isToday && "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-16 shrink-0">
                <p
                  className={cn(
                    "text-sm font-bold leading-tight",
                    isToday ? "text-emerald-700" : "text-foreground"
                  )}
                >
                  {DAY_NAMES_ID[day.dayOfWeek]}
                </p>
                {isToday && (
                  <span className="mt-0.5 inline-block rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Hari Ini
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {day.members.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {day.members.map((name) => (
                      <span
                        key={name}
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                          isToday
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-muted text-foreground/80"
                        )}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground/70">Belum di-set</p>
                )}
              </div>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(day.dayOfWeek)}
                  aria-label={`Edit tim ronda ${DAY_NAMES_ID[day.dayOfWeek]}`}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Pencil className="size-4" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Dialog edit tim ronda untuk 1 hari — nama diketik bebas,
 * satu nama per baris (boleh juga dipisah koma, biar gampang paste dari WA).
 * Catatan: komponen ini di-mount kondisional + key={dayOfWeek} oleh parent,
 * jadi state teks selalu fresh sesuai hari yang diedit tanpa useEffect.
 */
export function EditRondaDayDialog({
  dayOfWeek,
  initialMembers,
  open,
  onOpenChange,
  onSaved,
}: {
  dayOfWeek: number | null;
  initialMembers: string[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (msg: string) => void;
}) {
  const [text, setText] = useState(() => initialMembers.join("\n"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseMembersInput(text);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (dayOfWeek == null || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ronda", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ today: todayISO(), dayOfWeek, members: parsed }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Gagal menyimpan jadwal.");
        return;
      }
      onSaved(
        parsed.length > 0
          ? `Tim ronda ${DAY_NAMES_ID[dayOfWeek]} tersimpan (${parsed.length} orang).`
          : `Tim ronda ${DAY_NAMES_ID[dayOfWeek]} dikosongkan.`
      );
      onOpenChange(false);
    } catch {
      setError("Gagal terhubung ke server. Cek koneksi internet.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Users className="size-4" aria-hidden="true" />
            </span>
            Tim Ronda — {dayOfWeek != null ? DAY_NAMES_ID[dayOfWeek] : ""}
          </DialogTitle>
          <DialogDescription>
            Nama diketik bebas, satu nama per baris. Boleh juga dipisah koma —
            enak buat paste dari grup WA.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ronda-members">Nama anggota</Label>
            <Textarea
              id="ronda-members"
              placeholder={"Asep\nUdin\nMamat\nUjang"}
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Terdeteksi <strong>{parsed.length}</strong> nama
              {parsed.length > 0 && `: ${parsed.slice(0, 4).join(", ")}${parsed.length > 4 ? ", ..." : ""}`}
            </p>
          </div>
          {error && (
            <p className="text-xs font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Jadwal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Tombol "Salin dari Minggu Lalu" — isi hari yang masih kosong dari pekan sebelumnya */
export function CopyLastWeekButton({
  onSuccess,
  disabled,
}: {
  onSuccess: (msg: string) => void;
  disabled?: boolean;
}) {
  const [copying, setCopying] = useState(false);

  async function handleCopy() {
    if (copying) return;
    setCopying(true);
    try {
      const res = await fetch("/api/ronda/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ today: todayISO() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast({
          title: "Gagal menyalin",
          description: json?.error ?? "Coba lagi ya.",
          variant: "destructive",
        });
        return;
      }
      const copied = json?.copied ?? 0;
      if (copied === 0) {
        toast({
          title: "Gak ada yang disalin",
          description: "Minggu lalu belum ada jadwal, atau hari kosongnya gak ada.",
        });
      } else {
        onSuccess(`${copied} hari terisi dari jadwal minggu lalu (yang sudah di-edit gak ditimpa).`);
      }
    } catch {
      toast({
        title: "Gagal terhubung ke server",
        description: "Cek koneksi internet kamu.",
        variant: "destructive",
      });
    } finally {
      setCopying(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleCopy}
      disabled={disabled || copying}
    >
      {copying ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <CalendarDays className="size-4" aria-hidden="true" />
      )}
      Salin dari Minggu Lalu
    </Button>
  );
}
