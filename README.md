# Surat KUA Longkib

Aplikasi web sederhana untuk membuat surat pengantar KUA Kecamatan Longkib.
Isi form sambil melihat **pratinjau langsung** surat → cetak / **Save as PDF**.

Berjalan **sepenuhnya di browser** (tanpa server). Bisa dipakai dari komputer maupun HP.

## Cara pakai

1. Buka `index.html` di browser (dobel-klik), atau buka URL-nya bila sudah di-hosting.
2. Pilih **Jenis Surat**, lalu isi data.
3. **Di komputer/laptop:** surat di sebelah kanan ikut berubah setiap kali mengetik.
   Klik **Cetak / Simpan PDF**, lalu pilih **Save as PDF** pada dialog cetak.
4. **Di HP:** klik **Pratinjau Surat** → surat terbuka di tab baru (cubit layar untuk
   memperbesar). Periksa, lalu tekan **Cetak / Simpan PDF**, atau **← Kembali** untuk mengubah data.

> **Kertas F4:** surat dicetak di kertas A4. Khusus **Surat Ikrar Taukil Wali**, bila isinya
> terlalu panjang untuk 1 halaman A4, kertas otomatis diganti ke **F4 / Folio (215 × 330 mm)**.
> Ukuran huruf tidak diubah. Aplikasi akan memberi tahu (tanda biru "Kertas F4") dan
> mengingatkan sebelum mencetak. Siapkan kertas F4 di printer.

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

Form dan halaman cetak akan menyesuaikan otomatis, tanpa perlu mengubah HTML.

## Mengubah identitas kantor / penanda tangan

Edit **`assets/config.js`** (KOP, alamat, nama & NIP penanda tangan). Berlaku
untuk semua surat sekaligus.

## Cara meng-online-kan (gratis)

Karena aplikasi murni statis, bisa di-hosting gratis agar diakses dari HP/laptop:

- **GitHub Pages**, **Netlify**, atau **Cloudflare Pages**: unggah folder ini, lalu
  dapatkan URL yang bisa dibuka siapa saja.
