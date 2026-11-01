"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Gavel,
  Lock,
  Package,
  Receipt,
  ShoppingBasket,
  Users,
  Wallet,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKg, formatRupiah } from "@/lib/nangerang/format";
import { jsDayToDow } from "@/lib/nangerang/ronda";
import type { RondaResponse, TransactionDTO, TransactionType, TransactionsResponse } from "@/lib/nangerang/types";
import { cn } from "@/lib/utils";
import {
  EmptyTransactionList,
  TransactionListSkeleton,
  TransactionRow,
} from "./tx-row";
import { LoginDialog } from "./login-dialog";
import { RondaDayList, weekLabel } from "./ronda";

type Filter = "SEMUA" | TransactionType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "SEMUA", label: "Semua" },
  { value: "IURAN", label: "Iuran" },
  { value: "PENJUALAN", label: "Jual" },
  { value: "PENGELUARAN", label: "Pengeluaran" },
  { value: "DENDA", label: "Denda" },
];

export function PublicView({
  data,
  loading,
  error,
  authed,
  ronda,
  onEnterAdmin,
  onLoginSuccess,
}: {
  data: TransactionsResponse | null;
  loading: boolean;
  error: string | null;
  authed: boolean;
  ronda: RondaResponse | null;
  onEnterAdmin: () => void;
  onLoginSuccess: () => void;
}) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("SEMUA");
  const todayDow = jsDayToDow(new Date().getDay());

  const summary = data?.summary;
  const filtered = useMemo<TransactionDTO[]>(() => {
    const all = data?.transactions ?? [];
    return filter === "SEMUA" ? all : all.filter((t) => t.type === filter);
  }, [data, filter]);

  const stats = [
    {
      label: "Total Iuran Diterima",
      value: summary ? formatKg(summary.totalIuranKg) : "—",
      icon: Wheat,
      accent: "text-emerald-700",
    },
    {
      label: "Beras Terjual",
      value: summary ? formatKg(summary.totalSoldKg) : "—",
      icon: ShoppingBasket,
      accent: "text-amber-700",
    },
    {
      label: "Uang Masuk",
      value: summary ? formatRupiah(summary.totalMoneyIn) : "—",
      icon: Wallet,
      accent: "text-emerald-700",
    },
    {
      label: "Uang dari Denda",
      value: summary ? formatRupiah(summary.totalDenda) : "—",
      icon: Gavel,
      accent: "text-violet-700",
    },
    {
      label: "Pengeluaran",
      value: summary ? formatRupiah(summary.totalMoneyOut) : "—",
      icon: Receipt,
      accent: "text-rose-600",
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {/* Bar atas */}
      <header className="sticky top-0 z-20 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-emerald-700 text-white">
              <Wheat className="size-4" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold tracking-tight">Nangerang Benderang</span>
          </div>
          {authed ? (
            <Button size="sm" variant="outline" onClick={onEnterAdmin}>
              Mode Bendahara
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLoginOpen(true)}
              aria-label="Masuk sebagai bendahara"
            >
              <Lock className="size-3.5" aria-hidden="true" />
              Bendahara
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 py-5">
        {/* Kartu utama */}
        <section
          aria-label="Ringkasan kas"
          className="rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 p-6 text-white shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
            Kas Iuran Beras Kampung
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            Nangerang Benderang
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-50/90">
            Pencatatan iuran beras, penjualan, dan pengeluaran — terbuka buat
            diawasi siapa aja, kapan aja.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Package className="size-3.5" aria-hidden="true" />
                Stok Beras
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {summary ? formatKg(summary.riceStockKg) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Wallet className="size-3.5" aria-hidden="true" />
                Saldo Kas
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {summary ? formatRupiah(summary.cashBalance) : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Jadwal ronda minggu ini */}
        <section aria-label="Jadwal ronda minggu ini">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Users className="size-4 text-emerald-700" aria-hidden="true" />
              Jadwal Ronda Minggu Ini
            </h2>
            {ronda && (
              <span className="text-[11px] text-muted-foreground">
                {weekLabel(ronda.weekStart)}
              </span>
            )}
          </div>
          <RondaDayList ronda={ronda} todayDow={todayDow} />
        </section>

        {/* Ringkasan */}
        <section aria-label="Statistik">
          <h2 className="mb-2.5 text-sm font-bold text-foreground">Ringkasan</h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={cn("rounded-xl border bg-white p-4", i === stats.length - 1 && stats.length % 2 === 1 && "col-span-2")}
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <s.icon className="size-3.5" aria-hidden="true" />
                  {s.label}
                </div>
                <div className={cn("mt-1 text-lg font-bold tabular-nums", s.accent)}>
                  {loading && !summary ? <Skeleton className="h-6 w-20" /> : s.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Riwayat */}
        <section aria-label="Riwayat transaksi">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-foreground">Riwayat Transaksi</h2>
            <span className="text-xs text-muted-foreground">
              {summary ? `${data?.transactions.length ?? 0} catatan` : ""}
            </span>
          </div>

          {/* Filter */}
          <div className="mb-3 flex gap-2" role="tablist" aria-label="Filter jenis transaksi">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  filter === f.value
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-border bg-white text-muted-foreground hover:border-emerald-300 hover:text-emerald-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">Gagal memuat data</p>
                  <p className="mt-0.5 text-xs text-amber-800">{error}</p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <TransactionListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyTransactionList />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t bg-white">
        <div className="mx-auto w-full max-w-lg px-4 py-5 text-center">
          <p className="text-sm font-semibold text-foreground">
            Transparan itu komitmen, bukan pilihan.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Setiap kilo dan setiap rupiah dicatat apa adanya. Saldo dihitung
            otomatis dari catatan — gak bisa diutak-atik manual.
          </p>
        </div>
      </footer>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={() => {
          setLoginOpen(false);
          onLoginSuccess();
        }}
      />
    </div>
  );
}
