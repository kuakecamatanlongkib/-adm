# Catatan Proyek — Surat KUA Longkib

Dokumen ini merangkum apa yang sudah dikerjakan agar mudah dilanjutkan suatu saat nanti.

## Apa ini
Aplikasi web statis untuk membuat **surat pengantar KUA Kecamatan Longkib**.
Alur: isi form → klik tombol → surat A4 terbuka di tab baru → dialog cetak muncul
otomatis → **Save as PDF**. Berjalan **sepenuhnya di browser** (tanpa server),
mobile-first & responsif.

## Tautan penting
- **Situs live:** https://kuakecamatanlongkib.github.io/-adm/
- **Repo GitHub:** https://github.com/kuakecamatanlongkib/-adm (akun: `kuakecamatanlongkib`, Public)
- Hosting: **GitHub Pages**, deploy dari branch `main` folder `/ (root)`. Ada file
  `.nojekyll` agar folder `assets/` dilayani apa adanya.

> Catatan akun: GitHub CLI (`gh`) **tidak terpasang** di mesin ini. Push dilakukan
> via `git` biasa; login lewat Git Credential Manager (jendela browser).
> Commit dibuat **tanpa** baris co-author (sesuai permintaan pemilik).

## Cara menjalankan / mengembangkan
- Lokal: dobel-klik `index.html` di browser.
- Online: buka tautan situs live di atas (bisa dari HP maupun komputer).

## Struktur file
```
kua-longkib/
├─ index.html            # halaman form (struktur saja)
├─ surat.html            # halaman surat untuk dicetak (struktur saja)
├─ logo-kemenag.png      # logo kop
├─ .nojekyll             # penanda agar GitHub Pages tidak memproses Jekyll
├─ README.md             # ringkasan untuk pengguna
├─ CATATAN-PROYEK.md     # dokumen ini
└─ assets/
   ├─ styles.css         # gaya halaman form
   ├─ surat.css          # gaya halaman surat (A4 + aturan @media print + mode compact)
   ├─ util.js            # helper bersama (format tanggal, Title Case, escape)
   ├─ config.js          # identitas kantor: KOP + tanda tangan (dipakai semua surat)
   ├─ templates.js       # ★ KATALOG SURAT + pustaka field  ← edit di sini
   ├─ datepicker.js      # komponen kalender custom (tampil dd/mm/yyyy, simpan ISO)
   ├─ app.js             # logika form (pemilih kartu, bangun field dinamis, validasi, transform)
   └─ surat.js           # logika render surat dari template + data
```

## Arsitektur (data-driven)
Form dan surat **dibangun otomatis dari katalog** di `assets/templates.js`.
Menambah surat baru = menambah **satu objek** di `KUA_TEMPLATES` (tidak menyentuh HTML).

- **Pemilih surat (halaman form):** **dropdown** (tertutup secara default) yang isinya
  **kartu** dikelompokkan per kategori (judul kategori + badge jumlah + kartu nama/deskripsi,
  kartu aktif bertanda centang). Pemicu menampilkan surat terpilih; klik di luar menutup menu.
  Dibangun otomatis dari `KUA_TEMPLATES` di `app.js`. Font UI web = **Inter**
  (dimuat dari Google Fonts; offline jatuh ke font sistem). Font PDF tetap Times (`surat.css`).
- `config.js` → `KUA_CONFIG`: KOP (logo, baris instansi, alamat, kota) & blok tanda tangan.
  Ubah identitas kantor / penanda tangan cukup di sini, berlaku ke semua surat.
- `templates.js` →
  - `KUA_FIELDS`: pustaka definisi input yang dipakai ulang antar-template.
  - `KUA_TEMPLATES`: daftar surat.
- Data mengalir: form → URL query (`surat.html?...`) → `surat.js` merender.
  **Nilai tanggal selalu disimpan ISO `yyyy-mm-dd`**; tampilan Indonesia (mis.
  "12 Juni 2026") dihasilkan `KUAUtil.tglIndo()`.

### Properti sebuah template
```
{
  id, nama, kategori, deskripsi,
  compact: true|false,        // true = spasi diringkas agar surat panjang muat 1 halaman
  formFields: [...],          // urutan field di form; "#Judul" = sub-judul seksi
  tujuan: [...baris...],
  salam: true|false,          // "Assalamu'alaikum Wr. Wb."
  pembuka: '...' | [...],     // boleh banyak paragraf
  letterRows: [ {label,value(d)} | {heading:'...'} | {gap:true} ],
  isi: '...' | function(d) | [ ...banyak paragraf... ],
  penutup: '...'
  // KOP & tanda tangan diambil dari config.js
}
```

### Fitur field (di `KUA_FIELDS`)
- `type`: `text` | `textarea` | `date` (pakai datepicker custom) | `select` | `list`
- `list` → daftar **dinamis**: tombol "+ Tambah" untuk menambah baris, tombol ✕ untuk
  hapus. Disimpan sebagai beberapa nilai dipisah baris-baru; baris kosong diabaikan.
  Opsi: `addLabel` (teks tombol tambah). Dipakai surat N7 (daftar syarat/alasan).
- `half: true` → ditata 2 kolom berdampingan dengan field `half` berikutnya
- `default: 'today'` → tanggal otomatis hari ini
- `validate(v)` → kembalikan pesan error atau null (mis. NIK 16 digit)
- `transform`:
  - `titlecase` → awal tiap kata kapital; **bagian setelah koma dibiarkan** (untuk gelar,
    mis. `budi, S.H.` → `Budi, S.H.`). Dipakai: nama, tempat lahir.
  - `titlecaseall` → semua kata kapital termasuk setelah koma. Dipakai: alamat.
  - Transform berjalan **real-time saat mengetik** (kursor dijaga).
- `select` dengan `options:[...]`, opsional `otherValue` → memunculkan kolom teks "lainnya".
  Dipakai: pekerjaan.

## Template yang sudah ada (4)
1. `puskesmas-laki` — Pengantar Puskesmas, calon pengantin **laki-laki** (pemeriksaan kesehatan).
2. `puskesmas-perempuan` — Pengantar Puskesmas, calon pengantin **perempuan** (imunisasi TT & cek kehamilan).
3. `dispensasi-nikah` — Permohonan **Dispensasi Nikah** ke Camat (2 orang: calon suami & istri,
   rencana akad, 2 paragraf isi). Pakai `compact: true` agar muat 1 halaman.
4. `n7-penolakan-kehendak` — **Formulir Model N7** (pemberitahuan/penolakan kehendak nikah/rujuk).
   Pakai tata letak formulir (`formLayout`): kop tengah tanpa logo & tanpa garis, ada `lampiranRef`,
   `judulFormulir`, `modelKode`, `kopBaris`, `tanggalTanpaKota`. Dua blok pilihan berkotak centang
   (□, dicentang tangan) dengan daftar syarat **dinamis** dari field `list`. Penutup `wassalam: true`.

### Properti khusus tata letak formulir (dipakai N7)
- `formLayout: true` → kop teks rata tengah tanpa logo/garis (bukan kop 3 kolom standar).
- `lampiranRef: [...]` → teks kecil kiri atas (mis. "Lampiran XI" / dasar hukum).
- `judulFormulir`, `modelKode` → judul formulir di tengah + kode model di kanan.
- `kopBaris: [...]` → baris instansi pada kop polos (terpisah dari `config.js`).
- `tanggalTanpaKota: true` → tanggal tampil tanpa awalan kota ("Longkib, ").
- `metaRows: [{label,value(d)}]` → baris meta tambahan setelah "Nomor" (mis. Lampiran, Perihal).
- `checklist: [{heading, listKey}]` → blok □ + daftar bernomor; `listKey` menunjuk field `list`.
- `wassalam: true` → tampilkan "Wassalam," di atas blok tanda tangan.
- `tujuan`/`pembuka` kini boleh berisi **fungsi** `function(d)` untuk baris/paragraf dinamis.

## Cara menambah template baru
1. (Bila perlu field baru) tambahkan di `KUA_FIELDS` (`assets/templates.js`).
2. Tambahkan satu objek baru ke `KUA_TEMPLATES` (sudah ada contoh pola di file).
3. Untuk surat panjang yang berisiko tumpah ke halaman 2, set `compact: true`.
4. Tes (lihat di bawah), lalu commit & push.

## Tampilan surat & cetak (`surat.css`)
- Halaman A4, kop 3 kolom (logo kiri, teks tengah, penyeimbang), garis tebal-tipis.
- Tanggal **rata kanan**, badan surat **rata kanan-kiri (justify)**, **spasi baris 1.15**.
- Blok tanda tangan agak ke kanan, `break-inside: avoid` agar tidak terbelah antar-halaman.
- **Mode `compact`** (`.page.compact`): margin & ruang tanda tangan diperkecil khusus surat
  panjang; line spacing tetap 1.15.

## Cara tes hasil ke PDF (verifikasi cepat)
Render `surat.html` dengan data contoh memakai Chrome headless (Windows PowerShell):
```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$prof = Join-Path $env:TEMP ("kuaP" + [guid]::NewGuid().ToString("N"))
$url = "file:///D:/Projects/kua-longkib/surat.html?__t=puskesmas-laki&nomor=B-123&tanggal=2026-06-12&nama=Budi+Santoso&nik=1207230807880002&tempatLahir=Subulussalam&tanggalLahir=1988-08-07&pekerjaan=ASN&alamat=Subulussalam"
& $chrome --headless=new --disable-gpu --no-first-run --user-data-dir=$prof `
  --virtual-time-budget=3000 --run-all-compositor-stages-before-draw `
  --no-pdf-header-footer --print-to-pdf="D:\Projects\kua-longkib\__tes.pdf" $url
```
File uji berpola `__*.pdf`, `__*.png`, `cek-*.pdf`, `contoh-*.pdf` di-*ignore* oleh `.gitignore`.

## Deploy (update situs live)
```powershell
cd D:\Projects\kua-longkib
git add -A
git commit -m "pesan perubahan"      # tanpa baris co-author
git push origin main                 # login GitHub bila diminta
```
GitHub Pages otomatis membangun ulang dari `main`. Bila pernah me-*rewrite* history,
gunakan `git push --force-with-lease origin main`.

## Ide / kemungkinan lanjutan
- Tambah template surat lain sesuai kebutuhan.
- Opsi nomor surat otomatis (mis. simpan di `localStorage`) bila diinginkan.
- Arsip ke Google Sheets / simpan PDF ke Drive → perlu Google Apps Script (saat ini belum).
