# PEMIRA 2025 — Admin App

Aplikasi admin resmi untuk **Pemilihan Raya Mahasiswa (PEMIRA) 2025** yang diselenggarakan oleh kegiatan kampus. Repositori ini merupakan bagian dari sistem pemilihan resmi dan bersifat internal — hanya digunakan oleh panitia yang berwenang.

> ⚠️ **Perhatian:** Repositori ini adalah milik resmi penyelenggara PEMIRA 2025. Penggunaan, penyalinan, atau distribusi kode di luar keperluan resmi kegiatan tanpa izin tidak diperkenankan.

## Tentang Proyek

Aplikasi ini dibangun untuk mendukung penyelenggaraan Pemilihan Raya Mahasiswa 2025. Fitur-fitur yang tersedia meliputi:

- **Dashboard** — ringkasan statistik dan informasi pemilihan secara real-time
- **Kandidat** — manajemen data kandidat (pasangan calon)
- **Mahasiswa** — manajemen data pemilih terdaftar
- **Panitia** — manajemen akun dan hak akses panitia
- **Absensi (Check-in)** — pencatatan kehadiran pemilih
- **Suara** — rekap dan monitoring hasil pemungutan suara
- **Broadcast** — pengiriman pengumuman kepada pemilih
- **Chat** — komunikasi internal panitia
- **SMTP** — konfigurasi pengiriman email
- **Log Aktivitas** — pencatatan seluruh aktivitas sistem
- **Pengaturan** — konfigurasi umum aplikasi

## Teknologi

- [Next.js 16](https://nextjs.org/) — framework React untuk frontend
- [React 19](https://react.dev/) — library UI
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) — komponen UI aksesibel
- [TanStack Query](https://tanstack.com/query) — manajemen state server
- [TanStack Table](https://tanstack.com/table) — tabel data
- [Socket.IO Client](https://socket.io/) — komunikasi real-time
- [Recharts](https://recharts.org/) — visualisasi data

## Persyaratan

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

## Instalasi & Pengembangan

1. Clone repositori ini:

   ```bash
   git clone https://github.com/pemirastt-nf/pemira25-admin-app.git
   cd pemira25-admin-app
   ```

2. Install dependensi:

   ```bash
   pnpm install
   ```

3. Salin file environment dan sesuaikan nilainya:

   ```bash
   cp .env.example .env.local
   ```

   Variabel environment yang diperlukan:

   | Variabel              | Keterangan                          |
   |-----------------------|-------------------------------------|
   | `NEXT_PUBLIC_API_URL` | URL base API backend                |
   | `PORT`                | Port aplikasi (default: `8000`)     |

4. Jalankan server pengembangan:

   ```bash
   pnpm dev
   ```

   Aplikasi dapat diakses di [http://localhost:8000](http://localhost:8000).

## Build Produksi

```bash
pnpm build
pnpm start
```

## Lisensi & Hak Cipta

Proyek ini dikembangkan khusus untuk keperluan **PEMIRA 2025** dan merupakan properti resmi penyelenggara. Seluruh hak cipta dilindungi. Tidak diizinkan untuk digunakan, dimodifikasi, atau didistribusikan di luar keperluan kegiatan resmi tanpa persetujuan tertulis dari penyelenggara.
