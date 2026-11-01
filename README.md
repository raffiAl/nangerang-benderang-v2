# Nangerang Benderang

Sistem kas iuran beras kampung — transparan, tahan lupa, dan bisa dipake bendahara langsung dari HP.

## Dampak untuk Warga

Sebelumnya pencatatan dilakukan manual di buku: rawan hilang, rawan salah hitung, dan isinya cuma bisa dilihat bendahara. Sistem ini menggantinya:

| Masalah dulu | Solusi di sistem |
|---|---|
| **Pencatatan manual** — buku bisa hilang, kena air, atau salah salin | Semua transaksi tersimpan permanen di database. Buku yang nggak bisa kebakar. |
| **Angka gampang selisih** — stok dan saldo diketik manual, bisa (sengaja atau enggak) nggak konsisten | Stok & saldo **dihitung otomatis** dari seluruh data. Tidak ada angka yang diketik manusia, jadi tidak ada yang bisa diutak-atik. |
| **Transparansi terbatas** — warga harus nunggu diundang atau bertanya | Halaman publik: siapapun yang punya link bisa lihat stok, saldo, seluruh riwayat, dan jadwal ronda — kapan aja, tanpa login. |
| **Beban bendahara** — catat manual, rekap manual, atur jadwal manual | Input dari HP ±30 detik per transaksi; jadwal ronda bisa disalin dari minggu lalu sekali klik. |

Hasil di lapangan: sistem ini terbukti kepake — menyelesaikan tiga masalah itu (pencatatan manual, integritas data, transparansi) dalam satu alat sederhana.

## Fitur

- **Iuran beras** masuk (kg) — tanpa perlu nama, cukup jumlahnya
- **Penjualan beras** (kg × harga) — ditolak otomatis kalau melebihi stok
- **Pengeluaran kas** — keterangan wajib; tiap rupiah yang keluar ada ceritanya
- **Denda ronda** — uang masuk dengan keterangan siapa & kenapa, punya kategori khusus
- **Jadwal ronda mingguan** — diatur per hari, bisa salin dari minggu lalu; warga lihat jadwal + penanda hari ini
- **Stok & saldo real-time** — dihitung ulang dari data setiap kali halaman dibuka

## Cara Pakai

- **Bendahara**: klik "Admin" di kanan atas → masuk password → input & edit terbuka
- **Warga**: cukup buka link-nya. Tanpa akun, tanpa password.

## Menjalankan dari Nol (laptop/PC baru)

Prasyarat: [Node.js LTS](https://nodejs.org).

```bash
npm install
```

Bikin file `.env` di root (salin dari `.env.example`, isi sendiri):

```ini
DATABASE_URL=file:<alamat-absolut>/db/custom.db
AUTH_SECRET=(kalimat rahasia acak buatan sendiri)
ADMIN_PASSWORD=(password bendahara)
```

```bash
npx prisma db push        # bikin database dari schema (file db/ memang tidak ikut repo)
npx prisma generate       # bangun Prisma Client
npx next dev -p 3000      # nyalakan → http://localhost:3000
```

Opsional, isi data contoh:

```bash
npx tsx scripts/seed.ts
```

## Troubleshooting — error nyata yang pernah terjadi

| Pesan error | Penyebab | Solusi |
|---|---|---|
| `the URL must start with the protocol file:` | `.env` belum kebaca (salah nama/salah posisi) atau dibuat pas server jalan | Pastikan `.env` di root sejajar `package.json`, lalu restart server |
| `Error code 14: Unable to open the database file` | `DATABASE_URL` pakai path relatif, engine salah "posisi berdiri" | Pakai **alamat absolut** di `DATABASE_URL` |
| `tee is not recognized` (Windows) | script `dev` pake `tee` yang nggak ada di CMD | Jalankan `npx next dev -p 3000` langsung |
| Push GitHub minta password terus ditolak | GitHub tidak menerima password akun | Pakai Personal Access Token (Settings → Developer settings) |

## Aturan Desain — kenapa sistem ini susah dibohongin

1. Stok & saldo **tidak pernah disimpan** — selalu dihitung ulang dari data. Kebenaran cuma satu sumber: daftar transaksi.
2. Penjualan **ditolak di server** kalau melebihi stok — validasi di client bukan keamanan.
3. Pengeluaran **wajib ada keterangan** — inti transparansi.
4. Rahasia (`AUTH_SECRET`, `ADMIN_PASSWORD`) hidup di `.env`, yang tidak pernah masuk repo. `.env.example` jadi panduan konfigurasinya.

## Peta Kode

```
src/app/api/**            → server: logika, validasi, aturan bisnis
src/components/nangerang/ → UI yang dilihat bendahara & warga
src/lib/**                → logika bersama (format, auth, hitung kas)
prisma/schema.prisma      → cetak biru database
scripts/                  → perkakas (seed, tes)
```

## Stack

Next.js 16 (React 19) · Prisma · SQLite · Tailwind CSS

## Rencana Lanjut

- Foto nota sebagai bukti fisik di tiap transaksi
- Rekap bulanan + export
- Riwayat jadwal ronda minggu-minggu sebelumnya
- Deploy ke internet + backup otomatis

## Merawat Sistem Ini

- **Backup** = salin satu file: `db/custom.db`. Rutin, misal tiap minggu.
- **Serah terima** = file README ini + `.env.example` — cukup buat orang baru nyala-kan sistem di mesin mana pun.
