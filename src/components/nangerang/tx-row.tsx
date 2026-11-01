"use client";

import { Gavel, Receipt, ShoppingBasket, Trash2, Wheat } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateID, formatKg, formatRupiah } from "@/lib/nangerang/format";
import type { TransactionDTO, TransactionType } from "@/lib/nangerang/types";
import { cn } from "@/lib/utils";

export const TYPE_META: Record<
  TransactionType,
  { label: string; icon: typeof Wheat; iconClass: string }
> = {
  IURAN: {
    label: "Iuran Beras",
    icon: Wheat,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  PENJUALAN: {
    label: "Jual Beras",
    icon: ShoppingBasket,
    iconClass: "bg-amber-100 text-amber-700",
  },
  PENGELUARAN: {
    label: "Pengeluaran",
    icon: Receipt,
    iconClass: "bg-rose-100 text-rose-700",
  },
  DENDA: {
    label: "Denda Ronda",
    icon: Gavel,
    iconClass: "bg-violet-100 text-violet-700",
  },
};

export function TransactionRow({
  tx,
  onDelete,
  deleting,
}: {
  tx: TransactionDTO;
  onDelete?: (tx: TransactionDTO) => void;
  deleting?: boolean;
}) {
  const meta = TYPE_META[tx.type];
  const Icon = meta.icon;

  let title = meta.label;
  let sub: string | null = null;
  if (tx.type === "PENJUALAN" && tx.riceKg != null && tx.pricePerKg != null) {
    sub = `${formatKg(tx.riceKg)} × ${formatRupiah(tx.pricePerKg)}`;
    if (tx.note) sub = `${sub} • ${tx.note}`;
  } else if (tx.type === "PENGELUARAN") {
    title = tx.note ?? meta.label; // keterangan = judul utama pengeluaran
    sub = "Pengeluaran kas";
  } else if (tx.type === "DENDA") {
    title = tx.note ?? meta.label; // keterangan = siapa + alasan didenda
    sub = "Denda ronda — masuk kas";
  } else {
    sub = tx.note ?? "Iuran harian";
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-white p-3.5">
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          meta.iconClass
        )}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{title}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
          {formatDateID(tx.date)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {tx.type === "IURAN" && tx.riceKg != null && (
          <p className="text-sm font-bold tabular-nums text-emerald-600">
            +{formatKg(tx.riceKg)}
          </p>
        )}
        {tx.type === "PENJUALAN" && (
          <>
            {tx.amount != null && (
              <p className="text-sm font-bold tabular-nums text-emerald-600">
                +{formatRupiah(tx.amount)}
              </p>
            )}
            {tx.riceKg != null && (
              <p className="mt-0.5 text-[11px] font-medium tabular-nums text-amber-600">
                −{formatKg(tx.riceKg)}
              </p>
            )}
          </>
        )}
        {tx.type === "PENGELUARAN" && tx.amount != null && (
          <p className="text-sm font-bold tabular-nums text-rose-600">
            −{formatRupiah(tx.amount)}
          </p>
        )}
        {tx.type === "DENDA" && tx.amount != null && (
          <p className="text-sm font-bold tabular-nums text-violet-600">
            +{formatRupiah(tx.amount)}
          </p>
        )}
      </div>

      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label={`Hapus transaksi ${title}`}
              disabled={deleting}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
              <AlertDialogDescription>
                {title} — {formatDateID(tx.date)}. Catatan yang dihapus gak bisa
                dikembalikan. Saldo & stok bakal dihitung ulang otomatis.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(tx)}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Ya, Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  );
}

export function TransactionListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl border bg-white p-3.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-4 w-20" />
        </li>
      ))}
    </ul>
  );
}

export function EmptyTransactionList() {
  return (
    <div className="rounded-xl border border-dashed bg-white/60 p-8 text-center">
      <Wheat className="mx-auto size-8 text-muted-foreground/40" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold">Belum ada transaksi</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Catatan dari bendahara bakal muncul di sini, dan bisa dilihat siapa aja.
      </p>
    </div>
  );
}
