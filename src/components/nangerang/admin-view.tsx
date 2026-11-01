"use client";

import { useState } from "react";
import {
  Eye,
  Gavel,
  Loader2,
  LogOut,
  Receipt,
  ShoppingBasket,
  Wallet,
  Wheat,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKg, formatRupiah, parseDecimalID, todayISO } from "@/lib/nangerang/format";
import { DAY_NAMES_ID, jsDayToDow } from "@/lib/nangerang/ronda";
import type { RondaResponse, TransactionDTO, TransactionsResponse } from "@/lib/nangerang/types";
import { cn } from "@/lib/utils";
import { EmptyTransactionList, TransactionListSkeleton, TransactionRow } from "./tx-row";
import {
  CopyLastWeekButton,
  EditRondaDayDialog,
  RondaDayList,
  weekLabel,
} from "./ronda";

type SubmitPayload = Record<string, unknown> & { type: string; date: string };

async function createTransaction(
  payload: SubmitPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: json?.error ?? "Gagal menyimpan." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server. Cek koneksi internet." };
  }
}

// ===================== Dialog: Iuran Masuk =====================
function IuranDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (msg: string) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setDate(todayISO());
    setKg("");
    setNote("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const riceKg = parseDecimalID(kg);
    if (riceKg == null || riceKg <= 0) {
      setError("Isi jumlah beras yang masuk (boleh desimal, contoh: 12,5).");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createTransaction({
      type: "IURAN",
      date,
      riceKg,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan.");
      return;
    }
    onSaved(`Iuran ${formatKg(riceKg)} tercatat.`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Wheat className="size-4" aria-hidden="true" />
            </span>
            Iuran Beras Masuk
          </DialogTitle>
          <DialogDescription>
            Cukup catat berapa kilo yang masuk hari ini — gak perlu nama siapa aja.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="iuran-date">Tanggal</Label>
            <Input
              id="iuran-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iuran-kg">Jumlah (kg)</Label>
            <Input
              id="iuran-kg"
              inputMode="decimal"
              placeholder="contoh: 12,5"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iuran-note">Catatan (opsional)</Label>
            <Input
              id="iuran-note"
              placeholder="contoh: iuran harian warga"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
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
                "Simpan Iuran"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Dialog: Jual Beras =====================
function JualDialog({
  open,
  onOpenChange,
  onSaved,
  stockKg,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (msg: string) => void;
  stockKg: number;
}) {
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const kgNum = parseDecimalID(kg);
  const priceNum = parseDecimalID(price);
  const total = kgNum != null && priceNum != null ? kgNum * priceNum : null;
  const stockExceeded = kgNum != null && kgNum > stockKg + 1e-9;

  function reset() {
    setDate(todayISO());
    setKg("");
    setPrice("");
    setNote("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (kgNum == null || kgNum <= 0) {
      setError("Isi jumlah beras yang dijual (kg).");
      return;
    }
    if (priceNum == null || priceNum <= 0) {
      setError("Isi harga jual per kilo (Rp).");
      return;
    }
    if (stockExceeded) {
      setError(`Stok cuma ${formatKg(stockKg)} — gak bisa jual lebih dari itu.`);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createTransaction({
      type: "PENJUALAN",
      date,
      riceKg: kgNum,
      pricePerKg: priceNum,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan.");
      return;
    }
    onSaved(`Penjualan ${formatKg(kgNum)} tercatat — masuk ${formatRupiah(kgNum * priceNum)}.`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-amber-100 text-amber-700">
              <ShoppingBasket className="size-4" aria-hidden="true" />
            </span>
            Jual Beras
          </DialogTitle>
          <DialogDescription>
            Stok beras sekarang: <strong>{formatKg(stockKg)}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jual-date">Tanggal</Label>
            <Input
              id="jual-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="jual-kg">Jumlah (kg)</Label>
              <Input
                id="jual-kg"
                inputMode="decimal"
                placeholder="contoh: 40"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jual-price">Harga per kg</Label>
              <Input
                id="jual-price"
                inputMode="numeric"
                placeholder="contoh: 13000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          {total != null && total > 0 && (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs text-emerald-700">Uang masuk</p>
              <p className="text-lg font-bold tabular-nums text-emerald-700">
                {formatRupiah(total)}
              </p>
            </div>
          )}
          {stockExceeded && (
            <p className="text-xs font-medium text-rose-600" role="alert">
              Stok cuma {formatKg(stockKg)} — gak bisa jual lebih dari itu.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="jual-note">Catatan (opsional)</Label>
            <Input
              id="jual-note"
              placeholder="contoh: dijual ke warga RT 03"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>
          {error && !stockExceeded && (
            <p className="text-xs font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={saving || stockExceeded}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Penjualan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Dialog: Pengeluaran =====================
function PengeluaranDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (msg: string) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setDate(todayISO());
    setDesc("");
    setAmount("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseDecimalID(amount);
    if (!desc.trim()) {
      setError("Keterangan wajib diisi — warga berhak tahu uang dipakai buat apa.");
      return;
    }
    if (amountNum == null || amountNum <= 0) {
      setError("Isi jumlah pengeluaran (Rp).");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createTransaction({
      type: "PENGELUARAN",
      date,
      amount: amountNum,
      note: desc.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan.");
      return;
    }
    onSaved(`Pengeluaran ${formatRupiah(amountNum)} tercatat.`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-rose-100 text-rose-700">
              <Receipt className="size-4" aria-hidden="true" />
            </span>
            Catat Pengeluaran
          </DialogTitle>
          <DialogDescription>
            Tulis jelas uangnya dipakai buat apa — ini inti transparansi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keluar-date">Tanggal</Label>
            <Input
              id="keluar-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keluar-desc">Dipakai buat apa?</Label>
            <Input
              id="keluar-desc"
              placeholder="contoh: beli karung kosong 20 pcs"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={200}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keluar-amount">Jumlah (Rp)</Label>
            <Input
              id="keluar-amount"
              inputMode="numeric"
              placeholder="contoh: 85000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
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
                "Simpan Pengeluaran"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Dialog: Denda Ronda =====================
function DendaDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (msg: string) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setDate(todayISO());
    setDesc("");
    setAmount("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseDecimalID(amount);
    if (!desc.trim()) {
      setError("Keterangan wajib diisi — tulis siapa yang didenda dan alasannya.");
      return;
    }
    if (amountNum == null || amountNum <= 0) {
      setError("Isi jumlah dendanya (Rp).");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createTransaction({
      type: "DENDA",
      date,
      amount: amountNum,
      note: desc.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan.");
      return;
    }
    onSaved(`Denda ${formatRupiah(amountNum)} tercatat masuk kas.`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-violet-100 text-violet-700">
              <Gavel className="size-4" aria-hidden="true" />
            </span>
            Denda Ronda
          </DialogTitle>
          <DialogDescription>
            Uang denda langsung masuk kas. Nominal bebas — yang penting keterangannya jelas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="denda-date">Tanggal</Label>
            <Input
              id="denda-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="denda-desc">Siapa + alasannya?</Label>
            <Input
              id="denda-desc"
              placeholder="contoh: Denda Mamat — gak ronda tanpa kabar"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={200}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="denda-amount">Jumlah (Rp)</Label>
            <Input
              id="denda-amount"
              inputMode="numeric"
              placeholder="contoh: 25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
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
                "Simpan Denda"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Admin View =====================
export function AdminView({
  data,
  loading,
  error,
  refresh,
  ronda,
  refreshRonda,
  onViewPublic,
  onLogout,
}: {
  data: TransactionsResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  ronda: RondaResponse | null;
  refreshRonda: () => Promise<void>;
  onViewPublic: () => void;
  onLogout: () => void;
}) {
  const [dialog, setDialog] = useState<
    "IURAN" | "PENJUALAN" | "PENGELUARAN" | "DENDA" | null
  >(null);
  const [editingDow, setEditingDow] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const summary = data?.summary;
  const transactions = data?.transactions ?? [];
  const todayDow = jsDayToDow(new Date().getDay());

  const quickActions = [
    {
      type: "IURAN" as const,
      label: "Iuran Masuk",
      desc: "Beras masuk hari ini",
      icon: Wheat,
      classes: "hover:border-emerald-400 hover:bg-emerald-50/60 text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      type: "PENJUALAN" as const,
      label: "Jual Beras",
      desc: "Beras dijual, uang masuk",
      icon: ShoppingBasket,
      classes: "hover:border-amber-400 hover:bg-amber-50/60 text-amber-700",
      iconBg: "bg-amber-100 text-amber-700",
    },
    {
      type: "PENGELUARAN" as const,
      label: "Pengeluaran",
      desc: "Kas keluar, catat tujuannya",
      icon: Receipt,
      classes: "hover:border-rose-400 hover:bg-rose-50/60 text-rose-700",
      iconBg: "bg-rose-100 text-rose-700",
    },
    {
      type: "DENDA" as const,
      label: "Denda Ronda",
      desc: "Denda masuk kas",
      icon: Gavel,
      classes: "hover:border-violet-400 hover:bg-violet-50/60 text-violet-700",
      iconBg: "bg-violet-100 text-violet-700",
    },
  ];

  function handleSaved(msg: string) {
    toast({ title: "Tersimpan", description: msg });
    refresh();
  }

  function handleRondaSaved(msg: string) {
    toast({ title: "Tersimpan", description: msg });
    refreshRonda();
  }

  async function handleDelete(tx: TransactionDTO) {
    setDeletingId(tx.id);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast({
          title: "Gagal menghapus",
          description: json?.error ?? "Coba lagi ya.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Terhapus", description: "Saldo & stok dihitung ulang otomatis." });
      await refresh();
    } catch {
      toast({
        title: "Gagal terhubung ke server",
        description: "Cek koneksi internet kamu.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Bar atas */}
      <header className="sticky top-0 z-20 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Mode Bendahara
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onViewPublic}>
              <Eye className="size-4" aria-hidden="true" />
              Lihat Publik
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onLogout}
              className="text-muted-foreground hover:text-rose-600"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 py-5">
        {/* Info cepat */}
        <section className="grid grid-cols-2 gap-3" aria-label="Info cepat">
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wheat className="size-3.5" aria-hidden="true" />
              Stok Beras
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
              {summary ? formatKg(summary.riceStockKg) : "—"}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" aria-hidden="true" />
              Saldo Kas
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
              {summary ? formatRupiah(summary.cashBalance) : "—"}
            </p>
          </div>
        </section>

        {/* Catat transaksi */}
        <section aria-label="Catat transaksi">
          <h2 className="mb-2.5 text-sm font-bold text-foreground">Catat Transaksi</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <button
                key={a.type}
                type="button"
                onClick={() => setDialog(a.type)}
                className={cn(
                  "flex min-h-24 flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center transition-colors",
                  a.classes
                )}
              >
                <span
                  className={cn("grid size-9 place-items-center rounded-full", a.iconBg)}
                  aria-hidden="true"
                >
                  <a.icon className="size-4.5" />
                </span>
                <span className="text-xs font-bold leading-tight">{a.label}</span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {a.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Jadwal ronda */}
        <section aria-label="Jadwal ronda minggu ini">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">Jadwal Ronda Minggu Ini</h2>
              {ronda && (
                <p className="text-[11px] text-muted-foreground">{weekLabel(ronda.weekStart)}</p>
              )}
            </div>
            <CopyLastWeekButton onSuccess={handleRondaSaved} />
          </div>
          <RondaDayList ronda={ronda} todayDow={todayDow} onEdit={(dow) => setEditingDow(dow)} />
        </section>

        {/* Transaksi terakhir */}
        <section aria-label="Transaksi terakhir">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Semua Catatan</h2>
            <span className="text-xs text-muted-foreground">
              {transactions.length} catatan
            </span>
          </div>

          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {error}
            </div>
          ) : loading ? (
            <TransactionListSkeleton />
          ) : transactions.length === 0 ? (
            <EmptyTransactionList />
          ) : (
            <ul className="space-y-2.5">
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onDelete={handleDelete}
                  deleting={deletingId === tx.id}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t bg-white">
        <div className="mx-auto w-full max-w-lg px-4 py-4 text-center text-xs text-muted-foreground">
          Semua catatan langsung tampil di halaman publik warga.
        </div>
      </footer>

      <IuranDialog
        open={dialog === "IURAN"}
        onOpenChange={(v) => setDialog(v ? "IURAN" : null)}
        onSaved={handleSaved}
      />
      <JualDialog
        open={dialog === "PENJUALAN"}
        onOpenChange={(v) => setDialog(v ? "PENJUALAN" : null)}
        onSaved={handleSaved}
        stockKg={summary?.riceStockKg ?? 0}
      />
      <PengeluaranDialog
        open={dialog === "PENGELUARAN"}
        onOpenChange={(v) => setDialog(v ? "PENGELUARAN" : null)}
        onSaved={handleSaved}
      />
      <DendaDialog
        open={dialog === "DENDA"}
        onOpenChange={(v) => setDialog(v ? "DENDA" : null)}
        onSaved={handleSaved}
      />
      {editingDow != null && (
        <EditRondaDayDialog
          key={editingDow}
          dayOfWeek={editingDow}
          initialMembers={
            ronda?.days.find((d) => d.dayOfWeek === editingDow)?.members ?? []
          }
          open={true}
          onOpenChange={(v) => {
            if (!v) setEditingDow(null);
          }}
          onSaved={handleRondaSaved}
        />
      )}
    </div>
  );
}
