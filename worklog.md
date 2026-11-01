# Worklog

---
Task ID: 3
Agent: main (Z.ai)
Task: Mode switch — user (calon fullstack) belajar by doing; user coding di laptop sendiri, assistant jadi mentor zero-kode

Work Log:
- User mengubah mode kerja: bukan "aplikasi langsung jadi", tapi praktek bertahap — tujuan: mandiri membangun & merawat sistem (fullstack)
- Kalibrasi via AskUserQuestion: level=Web dasar (HTML/CSS oke, JS belum lancar), waktu=1-2 j/hari, mulai=DARI NOL (mini rebuild tanpa framework), tempat=laptop sendiri (VS Code+Node+git), mode mentor=ZERO KODE (konsep + hint ladder saja, 0 kode jadi), urutan=ikut mentor
- Kurikulum terkunci (from-zero edition): F1 Browser (HTML/CSS papan kas statis → JS state in-array → localStorage) → F2 Server (Node, serve statis, API GET/POST file JSON, validasi server) → F3 Database (SQLite menggantikan file JSON) → F4 Ujian mandiri (tambah 1 fitur sendiri tanpa bantuan) → F5 Porting ke Next.js (app v1/v2 sandbox jadi bahan bacaan) → F6 fitur asli (denda/ronda lanjutan) + deploy + rawat
- Misi 001 diberikan: (A) setup laptop — Node LTS, VS Code, git, folder nangerang-belajar; (B) konsep cara kerja web analogi desa; (C) index.html statis "Papan Kas" mobile-first — judul, kartu Stok Beras 71 kg, kartu Saldo Kas Rp 435.000, section riwayat kosong; kriteria lulus: rapih di 390px + bisa jelasin tiap baris; larangan copy-paste template
- Kebiasaan yang diminta ke user: jurnal belajar 3 baris per sesi (apa dipelajari / apa nyangkut / pertanyaan besok)
- Aplikasi sandbox (v2 selesai & terverifikasi) berstatus BEKU sebagai referensi bacaan Fase 5; tidak ada perubahan kode sandbox kecuali diminta

Stage Summary:
- Kontrak mentoring aktif: zero-kode, hint ladder (arah konsep → lokasi/alat → contoh minimal), review bergaya code review, milestone mingguan, misi dalam chat
- Sesi berikutnya: menunggu laporan Misi 001 dari user (screenshot + 1 hal yang bikin bingung), lalu review → Misi 002 (JS pertama: tombol Catat Iuran menambah baris via array + render)
- Misi 001 DIKUMPULKAN (screenshot 390px, kualitas visual bagus, angka diganti sendiri 30,5 kg / 933rb). Review diberikan: (1) pujian: hierarki visual, kartu sejajar, mobile-first; (2) pertanyaan sulit: tombol Admin di halaman statis = UI janji fitur belum ada, dua angka manual tidak ada penjamin konsistensi (foreshadow nilai turunan), section Riwayat belum terlihat; (3) perbaikan mandiri: typo "Banderang"→"Benderang" (2x), "Stock"→"Stok", "--"→em dash; (4) GERBANG LULUS = paste kode + 4 quiz: mekanisme kartu sejajar, kenapa tag semantic bukan div semua, uji 320px, berapa tempat warna hijau ditulis (setup pain → nanti CSS variable); (5) administrasi: git init + commit pertama; (6) diingatkan laporan kurang "1 hal paling bikin bingung" + jurnal 3 baris
- Misi 002 BELUM diberikan — menunggu gerbang Misi 001 lulus (disiplin zero-kode)


---
Task ID: 2
Agent: main (Z.ai)
Task: v2 "Nangerang Benderang" — fitur Jadwal Ronda mingguan + Denda Ronda (masuk kas)

Work Log:
- Discovery v2 via Q&A user: nama diketik bebas (tanpa master data), tim ~8 orang (fleksibel), tim berulang → perlu salin minggu lalu, publik + highlight hari ini, denda masuk kas (nominal bebas, keterangan wajib), jam ronda tidak dicatat
- Prisma: model baru `RondaDay` (weekStart YYYY-MM-DD Senin, dayOfWeek 0=Senin..6=Minggu, members JSON string, unique [weekStart, dayOfWeek]) — db:push ok
- Konvensi pekan Senin-based; client kirim `today` (tanggal perangkat user) ke API supaya bebas masalah timezone server
- API baru: GET/PUT /api/ronda (publik read / auth write per hari), POST /api/ronda/copy (isi hari kosong dari pekan lalu, TIDAK menimpa yang sudah diedit)
- API transaksi extended: tipe baru DENDA (uang masuk, keterangan wajib siapa+alasan); summary.totalDenda; cashBalance = penjualan + denda - pengeluaran
- UI publik: section "Jadwal Ronda Minggu Ini" (label pekan, hari ini ring emerald + badge HARI INI, chips nama), statistik "Uang dari Denda" (5 kartu), filter chip Denda
- UI admin: quick action jadi 4 (grid 2x2), DendaDialog, section jadwal dengan tombol Salin + EditRondaDayDialog per hari (textarea satu nama per baris / koma, live count)
- Refactor robustness: EditRondaDayDialog di-mount kondisional + key={dayOfWeek} (hindari reset state via useEffect deps)
- Fix infra: dev server restart diperlukan untuk load Prisma Client baru (model RondaDay); pola restart yang survive antar sesi tool = jalankan .zscripts/dev.sh via double-fork setsid (proses ter-orphan ke PID 1)
- Verifikasi browser end-to-end: kartu ronda + highlight hari ini ✓, filter denda ✓, saldo 825rb+25rb=850rb ✓, login ✓, 4 quick action ✓, edit jadwal (live count + persist) ✓, denda tersimpan + toast ✓, endpoint salin terbukti (copied:1, hari terisi gak ditimpa) via API test scripts/test-copy-setup.ts ✓, data test dibersihkan ✓, mobile 390px kedua view ✓, console bersih ✓, lint bersih ✓

Stage Summary:
- v2 live: jadwal ronda mingguan (set/edit/salin) + denda masuk kas terintegrasi penuh dengan buku besar
- Seed v2: jadwal contoh pekan 26 Okt 2026 (7 hari x 8 nama) + 1 contoh denda
- Skrip bantu: scripts/seed-v2.ts, scripts/test-copy-setup.ts (prepare/restore)
- V3 backlog: riwayat jadwal minggu lalu, notifikasi/pengingat, absensi ronda, foto nota (dari v2 lama), export Excel, rekap bulanan


---
Task ID: 1
Agent: main (Z.ai)
Task: Membangun sistem web "Nangerang Benderang" — pencatatan & transparansi kas iuran beras kampung (Next.js 16 fullstack)

Work Log:
- Discovery dilakukan lewat percakapan dengan user (why: transparansi, data aman, memudahkan bendahara; who: bendahara input via HP + warga lihat via link publik tanpa login; constraint: zero maintenance, foto nota digeser ke v2, nama sistem "Nangerang Benderang")
- Inisialisasi environment fullstack (curl init script) — Next.js 16 App Router + Tailwind 4 + shadcn/ui + Prisma/SQLite
- Prisma schema: model `Transaction` (type IURAN/PENJUALAN/PENGELUARAN, date, riceKg, pricePerKg, amount, note) — db:push sukses ke db/custom.db
- Seed data contoh (9 transaksi, Okt 2026) via scripts/seed.ts
- Auth: password tunggal bendahara (env ADMIN_PASSWORD, default bendahara123), cookie httpOnly HMAC-signed stateless (lib/auth.ts)
- API routes: /api/auth/login, /api/auth/logout, /api/auth/session, GET+POST /api/transactions (validasi zod + aturan bisnis stok), DELETE /api/transactions/[id]
- Aturan bisnis: saldo & stok SELALU dihitung dari data (tidak pernah diinput manual); penjualan ditolak jika melebihi stok; keterangan pengeluaran wajib (inti transparansi)
- UI (semua di route `/`): PublicView (hero stok+saldo, 4 kartu ringkasan, filter chips, riwayat transaksi), AdminView (3 quick-action + dialog form input, hapus dengan konfirmasi), LoginDialog — mobile-first max-w-lg, tema emerald/amber
- Fix hydration error: Skeleton (div) di dalam <p> pada kartu statistik → diganti div
- Verifikasi end-to-end via agent-browser: render publik ✓, filter ✓, login (password salah & benar) ✓, tambah iuran 10,5 kg (input koma desimal) ✓, validasi jual melebihi stok (inline error + tombol disabled) ✓, jual valid 30 kg×13rb (stok 71→41, saldo +390rb) ✓, hapus dengan konfirmasi (angka dihitung ulang otomatis) ✓, logout ✓, viewport mobile 390px ✓
- Lint bersih, dev.log tanpa error, semua API 200/201

Stage Summary:
- Deliverable: web app Next.js 16 berjalan di port 3000, single route `/`
- Password bendahara default: bendahara123 (bisa diganti di .env → ADMIN_PASSWORD)
- File kunci: prisma/schema.prisma, src/lib/auth.ts, src/lib/nangerang/{types,format}.ts, src/app/api/**, src/components/nangerang/{app-root,public-view,admin-view,login-dialog,tx-row}.tsx, scripts/seed.ts
- Data saat ini = data contoh (bisa dihapus lewat Mode Bendahara atau reset DB)
- V2 yang sudah disepakati: foto nota, export Excel, rekap bulanan
