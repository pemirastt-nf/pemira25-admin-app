## [2026-02-23] Checkin Page — Performance & Bug Fixes

### Fixed
- `backend/src/routes/studentRoutes.ts`: Search dialihkan dari in-memory JS filter ke SQL ILIKE + parallel COUNT query. Mendukung ribuan data tanpa loading penuh.
- `frondend-admin/checkin/page.tsx`: Debounce 400ms pada search input — API hanya dipanggil setelah berhenti mengetik.
- `frondend-admin/checkin/page.tsx`: Pisahkan query `dpt-offline-full` khusus untuk rekap angkatan agar DPT Offline selalu tampil lengkap tanpa terpengaruh filter pencarian.
- `frondend-admin/checkin/page.tsx`: Tambahkan info label di tab Rekap per Angkatan yang menjelaskan perilaku filter tanggal.
## [2026-02-23] Mobile Responsive Dashboard Header Buttons

### Changed
- candidates/page.tsx: "Tambah Kandidat" button shows icon-only on mobile (< sm), label visible on sm+
- roadcast/page.tsx: "Buat Email Baru" button shows icon-only on mobile (< sm), label visible on sm+
- students/page.tsx: Multiple action buttons (Tambah Manual, Import Excel, Edit bulk) now collapsed into a DropdownMenu (MoreHorizontal trigger) on mobile; full buttons visible on sm+
- committee/page.tsx: Multiple action buttons (Undang via Link, Tambah Manual) now collapsed into a DropdownMenu (MoreHorizontal trigger) on mobile; full buttons visible on sm+