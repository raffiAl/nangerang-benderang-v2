"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { todayISO } from "@/lib/nangerang/ronda";
import type { RondaResponse, TransactionsResponse } from "@/lib/nangerang/types";
import { PublicView } from "./public-view";
import { AdminView } from "./admin-view";

export function AppRoot() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = masih cek sesi
  const [mode, setMode] = useState<"public" | "admin">("public");
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ronda, setRonda] = useState<RondaResponse | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/transactions", { cache: "no-store" });
      if (!res.ok) throw new Error("gagal");
      const json: TransactionsResponse = await res.json();
      setData(json);
    } catch {
      setError("Koneksi ke server bermasalah. Cek internet kamu, terus coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRonda = useCallback(async () => {
    try {
      const res = await fetch(`/api/ronda?today=${todayISO()}`, { cache: "no-store" });
      if (res.ok) setRonda(await res.json());
    } catch {
      // jadwal gagal dimuat — biarkan null (tampil skeleton/teks belum ada)
    }
  }, []);

  // Saat pertama buka: cek sesi login + muat data
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { authed?: boolean }) => {
        if (j?.authed) {
          setAuthed(true);
          setMode("admin"); // bendahara yang masih login langsung dibawa ke mode input
        } else {
          setAuthed(false);
        }
      })
      .catch(() => setAuthed(false));
    refresh();
    refreshRonda();
  }, [refresh, refreshRonda]);

  function handleLoginSuccess() {
    setAuthed(true);
    setMode("admin");
    toast({
      title: "Selamat datang, Bendahara 👋",
      description: "Semua catatan yang kamu simpan langsung kelihatan warga.",
    });
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // tetap keluar di sisi client walau request gagal
    }
    setAuthed(false);
    setMode("public");
    toast({ title: "Sudah keluar", description: "Sampai jumpa lagi!" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-amber-50/50">
      {mode === "admin" && authed ? (
        <AdminView
          data={data}
          loading={loading}
          error={error}
          refresh={refresh}
          ronda={ronda}
          refreshRonda={refreshRonda}
          onViewPublic={() => setMode("public")}
          onLogout={handleLogout}
        />
      ) : (
        <PublicView
          data={data}
          loading={loading}
          error={error}
          authed={authed === true}
          ronda={ronda}
          onEnterAdmin={() => setMode("admin")}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
