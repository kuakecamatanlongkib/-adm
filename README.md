# Surat KUA Longkib

Aplikasi web sederhana untuk membuat surat pengantar KUA Kecamatan Longkib.
Isi form → klik tombol → surat terbuka di tab baru → cetak / **Save as PDF**.

Berjalan **sepenuhnya di browser** (tanpa server). Mobile-first & responsif.

## Cara pakai

1. Buka `index.html` di browser (dobel-klik) — atau dari URL bila sudah di-hosting.
2. Pilih **Jenis Surat**, isi data, klik **Buat Surat & Cetak PDF**.
3. Tab baru terbuka dan dialog cetak muncul otomatis. Pilih **Save as PDF**.

> Taruh file logo bernama `logo-kemenag.png` di folder ini agar muncul di kop surat.
> Tanpa file itu, surat tetap tampil (logo kosong).

## Struktur file

```
kua-longkib/
├─ index.html          # halaman form
├─ surat.html          # halaman surat (untuk dicetak)
├─ logo-kemenag.png    # logo kop (sediakan sendiri)
└─ assets/
   ├─ styles.css       # gaya halaman form
   ├─ surat.css        # gaya halaman surat (A4 + aturan cetak)
   ├─ util.js          # helper bersama (format tanggal, dll.)
   ├─ config.js        # identitas kantor: KOP + tanda tangan
   ├─ templates.js     # KATALOG SURAT  ← edit di sini untuk menambah surat
   ├─ datepicker.js    # komponen kalender custom (tampil dd/mm/yyyy, nilai ISO)
   ├─ app.js           # logika form
   └─ surat.js         # logika render surat
```

## Menambah template surat baru

Cukup edit **`assets/templates.js`**:

1. Jika butuh field baru, tambahkan di `KUA_FIELDS`.
2. Tambahkan satu objek baru ke array `KUA_TEMPLATES` (ada contoh pola di file).

Form dan halaman cetak akan menyesuaikan otomatis — tidak perlu mengubah HTML.

## Mengubah identitas kantor / penanda tangan

Edit **`assets/config.js`** (KOP, alamat, nama & NIP penanda tangan). Berlaku
untuk semua surat sekaligus.

## Cara meng-online-kan (gratis)

Karena aplikasi murni statis, bisa di-hosting gratis agar diakses dari HP/laptop:

- **GitHub Pages**, **Netlify**, atau **Cloudflare Pages** — unggah folder ini,
  dapat URL yang bisa dibuka siapa saja.
