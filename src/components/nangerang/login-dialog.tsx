"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset setiap kali dialog ditutup dibuka lagi
  useEffect(() => {
    if (open) {
      setPassword("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Gagal masuk. Coba lagi ya.");
        return;
      }
      onSuccess();
    } catch {
      setError("Gagal terhubung ke server. Cek koneksi internet.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Lock className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center">Masuk Bendahara</DialogTitle>
          <DialogDescription className="text-center">
            Halaman ini cuma buat bendahara yang mau mencatat transaksi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              inputMode="text"
              autoComplete="current-password"
              placeholder="Password bendahara"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            {error && (
              <p className="text-xs font-medium text-rose-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !password.trim()}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Memeriksa...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
