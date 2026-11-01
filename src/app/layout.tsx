import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nangerang Benderang — Kas Iuran Beras",
  description:
    "Pencatatan iuran beras, penjualan, dan pengeluaran kampung. Transparan, terbuka, dan bisa diawasi siapa aja.",
  keywords: ["iuran beras", "kas kampung", "transparansi", "Nangerang Benderang"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌾</text></svg>",
  },
  openGraph: {
    title: "Nangerang Benderang — Kas Iuran Beras",
    description:
      "Pencatatan iuran beras, penjualan, dan pengeluaran kampung. Transparan, terbuka, dan bisa diawasi siapa aja.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#065f46",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
