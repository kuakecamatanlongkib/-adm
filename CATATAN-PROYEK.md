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
  (dimuat dari Google Fonts; offline jatuh ke font sistem). Font surat/PDF = **Arial** sesuai
  PMA 12/2026 (`surat.css`); formulir N7 tetap Times.
- `config.js` → `KUA_CONFIG`: KOP (logo, baris instansi, alamat, kota) & daftar penanda tangan.
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
  Dipakai: pekerjaan. Isi `options` boleh string (`'ASN'`) atau objek
  (`{value:'plh', text:'Plh. Kepala KUA'}`) bila nilai tersimpan perlu beda dari teks tampilan.
- `default: '<nilai>'` → mengisi nilai awal field (mis. `penandatangan` → `'kepala'`).

## Aturan tata naskah dinas: PMA Nomor 12 Tahun 2026
Sejak November 2026 tampilan surat mengikuti **PMA Nomor 12 Tahun 2026 tentang Tata Naskah
Dinas pada Kementerian Agama** (berlaku 13 Juli 2026, menggantikan KMA 9/2016; masa
penyesuaian 2 tahun, Pasal 15). Ringkasan yang diterapkan:
- **Huruf Arial 12** (`surat.css`). Kop: Arial tebal 14 / 12 / 11, alamat-telepon Arial 9,
  logo di kiri, **satu garis** di bawah kop.
- **Ruang tepi:** kiri ≥ 3 cm, kanan ≥ 2 cm, bawah ≥ 2,5 cm; halaman ke-2 dst. atas ≥ 2 cm
  dan bernomor "- 2 -" di tengah atas (lewat `@page`).
- **Tanda tangan:** nama jabatan diakhiri koma; nama lengkap huruf awal kapital **tanpa gelar**,
  tidak tebal/bergaris bawah; ruang tanda tangan ≥ 4 spasi; blok di kanan, tepi kanannya ±3 cm
  dari tepi kertas.
- **NIP di bawah nama** hanya untuk Plh (`nipDiTtd: true` di `config.js`) — contoh surat dinas,
  surat keterangan, dan rekomendasi di PMA tidak mencantumkan NIP, sedangkan contoh tanda tangan
  Plh mencantumkan "NIP: ...".
- **Surat dinas** (Puskesmas, Dispensasi): Nomor/Sifat/Lampiran/Hal di kiri, tempat-tanggal di
  kanan sebaris Nomor, "Yth." + "di Tempat", alinea pembuka diawali "Dengan hormat,", alinea
  menjorok 1,27 cm.
- **Surat keterangan / rekomendasi:** "SURAT KETERANGAN" / "REKOMENDASI" tebal, judul kapital di
  bawahnya, lalu "NOMOR: ..."; tempat-tanggal di atas jabatan penanda tangan.
  Penutup baku: "Demikian surat keterangan ini dibuat untuk digunakan sebagaimana mestinya." /
  "Demikian rekomendasi ini dibuat untuk dipergunakan seperlunya."
- **Format nomor** (diketik manual oleh staf; contoh di form sudah format baru):
  surat dinas `B/123/[kode jabatan]/[klasifikasi]/11/2026`, surat keterangan
  `12/[kode jabatan]/[klasifikasi]/SKet/11/2026`, rekomendasi `.../Rek/...`.
  > Kode jabatan KUA ditetapkan Kepala Kankemenag Kota, dan menurut PMA kode wilayahnya mengacu
  > ke kode wilayah administrasi pemerintahan (Longkib = 11.75.05). Kode `KUA.01.23.05` yang
  > dipakai sekarang mungkin berubah — konfirmasi ke TU Kankemenag, lalu perbarui `placeholder`.
- **Formulir N7** tidak mengikuti tata letak PMA (bentuknya dari Kepdirjen Bimas Islam 473/2020):
  tetap Times, kop polos, nama tebal bergaris bawah + NIP (`.page.formulir`).

## Penanda tangan (Kepala / Plh)
Bila Kepala KUA cuti atau dinas luar, surat ditandatangani **Plh.**
- Daftar penanda tangan ada di `config.js` → `KUA_CONFIG.penandatangan` (array).
  Entri **pertama** (`kepala`) jadi default. Entri `plh` memakai jabatan
  "Plh. Kepala Kantor Urusan Agama / Kecamatan Longkib".
- `nama` ditulis **tanpa gelar**; `nip` berisi angka saja (label "NIP" ditambahkan otomatis).
- **Bila Plh berganti orang:** cukup ubah `nama` & `nip` pada entri `plh` di `config.js`.
- Di form, seksi **"Penanda Tangan"** dengan dropdown *Ditandatangani oleh* **ditambahkan
  otomatis** ke akhir setiap surat (lihat bagian bawah `templates.js`) — template baru
  tidak perlu menyebutnya di `formFields`. Nilai terpilih (id, mis. `plh`) dikirim lewat
  URL, lalu `surat.js` merender blok tanda tangan yang sesuai.
- Sebuah template masih bisa **memaksa** penanda tangan sendiri lewat properti `ttd`;
  bila diisi, dropdown tidak ditambahkan ke form surat itu.

## Template yang sudah ada (8)
1. `puskesmas-laki` — Pengantar Puskesmas, calon pengantin **laki-laki** (pemeriksaan kesehatan).
2. `puskesmas-perempuan` — Pengantar Puskesmas, calon pengantin **perempuan** (imunisasi TT & cek kehamilan).
3. `dispensasi-nikah` — Permohonan **Dispensasi Nikah** ke Camat (2 orang: calon suami & istri,
   rencana akad, 2 paragraf isi).
4. `n7-penolakan-kehendak` — **Formulir Model N7** (pemberitahuan/penolakan kehendak nikah/rujuk).
   Pakai tata letak formulir (`formLayout`): kop tengah tanpa logo & tanpa garis, ada `lampiranRef`,
   `judulFormulir`, `modelKode`, `kopBaris`, `tanggalTanpaKota`. Dua blok pilihan berkotak centang
   (□, dicentang tangan) dengan daftar syarat **dinamis** dari field `list`. Penutup `wassalam: true`.

5. `keterangan-bimwin` — **Surat Keterangan Sudah Mengikuti Bimbingan Catin** (BIMWIN).
   Judul + nomor di tengah (`judulSurat`), tanpa tujuan & tanpa salam, tanggal hanya di atas
   blok tanda tangan (`tanggalDiTtd`). Badan surat memuat **dua blok identitas**: penanda tangan
   (otomatis ikut pilihan Kepala/Plh lewat `KUAUtil.ttdAktif`) lalu calon pengantin.
   Field `pihak` memilih "Calon Suami"/"Calon Istri" — dipakai di kalimat pengantar sekaligus isi.
   Nama hari pelaksanaan bimbingan dihitung otomatis dari tanggal (`KUAUtil.hariIndo`).

   > Surat contoh dari KUA menulis "Calon Istri" pada blok data padahal isinya calon suami, dan
   > memuat beberapa salah ketik ("Tersusun", "di selerenggarakan"). Di template ini ejaan sudah
   > dirapikan dan pilihan suami/istri dijadikan satu field agar tidak lagi bisa keliru.
   > Kota pada tanda tangan mengikuti `config.js` (**Longkib**), bukan "Subulussalam" seperti
   > pada surat contoh, supaya konsisten dengan surat lain.

6. `keterangan-memeluk-islam` — **Surat Keterangan Memeluk Agama Islam** (dari contoh
   `SURAT Pernyataan memeluk agama islam.docx`; isinya keterangan dari Kepala KUA, jadi berbentuk
   Surat Keterangan). Data yang bersangkutan (+ NIK, jenis kelamin, agama sebelumnya), lalu
   "Berdasarkan data yang diterima Kantor Urusan Agama Kecamatan Longkib, ..." + Hari/Tanggal
   (hari dihitung otomatis — contoh lama salah menulis "Jum'at 13 Agustus 2026", padahal Kamis),
   Tempat, **Dibimbing oleh**, Saksi-saksi (field `list`, dinomori otomatis).
7. `ikrar-taukil-wali` — **Surat Ikrar Taukil Wali** (dari `SURAT WAKILAH.docx`). Wali nasab yang
   berhalangan hadir mewakilkan akad kepada KUA tempat akad. `hubunganWali` (dropdown: ayah,
   kakek, saudara, keponakan, paman, sepupu) mengubah frasa "adalah wali nasab (...)" dan sebutan
   di ikrar ("anak perempuan saya", "cucu perempuan saya", dst. — lihat `HUBUNGAN_WALI`).
   Mahar teks bebas + `pembayaranMahar` (Dibayar Tunai/Terutang). Tanda tangan khusus lewat
   `ttdHTML`: [Mengetahui Kepala KUA | Wali + kotak Meterai Rp10.000], lalu [Saksi I | Saksi II].
   Bukan naskah dinas KUA, jadi memakai `hurufKecil` (11 pt) + `compact` agar muat 1 halaman.
8. `rekomendasi-simas` — **Rekomendasi Bantuan Masjid (SIMAS)** (dari `Surat Rekomendasi SIMAS.pdf`).
   Bentuk Rekomendasi PMA: **Dasar** (field `list` opsional — tidak tampil bila kosong) dan
   **Menimbang** (disusun otomatis: masjid terdaftar di SIMAS + berada di wilayah kerja KUA),
   identitas pemberi, "Dengan ini memberikan rekomendasi kepada:", paragraf "Untuk ...".
   > Nomor juknis bantuan masjid 2026 tidak dipublikasikan daring (yang ditemukan hanya juknis
   > lama, mis. Kepdirjen Bimas Islam 224/2022). Bila juknis 2026 sudah didapat, isi kolom Dasar,
   > atau jadikan isi tetap di fungsi `items` pada `konsiderans` template ini.

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

### Properti surat dinas (Puskesmas, Dispensasi)
- `hal` → baris "Hal"; `sifat` (bawaan "Biasa") dan `lampiran` (bawaan "-") boleh diisi.
- `yth: ['Camat Longkib', 'di Tempat']` → blok "Yth." (bentuk lama `tujuan` hanya dipakai N7).

### Properti naskah berjudul (surat keterangan, rekomendasi, ikrar)
- `jenisNaskah: 'Surat Keterangan'` → baris tebal kapital di tengah; `judulSurat` (string/fungsi)
  → baris judul kapital di bawahnya; lalu "NOMOR: ...". Nomor tidak tampil di kiri atas.
- `tanggalDiTtd: true` → tempat-tanggal di atas jabatan pada blok tanda tangan.
- `konsiderans: [{label, items(d), gaya:'huruf'}]` → blok "Dasar :" / "Menimbang :" bernomor
  1. 2. / a. b.; butir kosong dibuang, tanda baca akhir dirapikan (";" lalu ".").
- `letterRows` menerima `{ text: '...' | function(d), indent: true }` → kalimat biasa di antara
  dua tabel data (mis. "dengan ini menerangkan bahwa:"); `indent` = alinea menjorok.
- Konstanta `BARIS_PENANDA_TANGAN` (Nama/NIP/Jabatan, ikut Kepala/Plh) dipakai ulang.

### Properti lain
- `isi` boleh berisi objek `{ text, cls }`: `cls: 'tanpa-indent'` (lanjutan kalimat setelah tabel,
  paragraf "Untuk ..."), `cls: 'ikrar'` (blok kutipan menjorok kiri-kanan). `penutup` boleh fungsi.
- `ttdHTML: function(d, h)` → tata letak tanda tangan khusus; `h` berisi `esc`, `tabel(rows, cls)`,
  `tglTeks`, `ttd`, `jabatanHTML(ttd)`, `namaHTML(ttd)`. Dipakai taukil wali.
- `hurufKecil: true` → huruf 11 pt (hanya untuk formulir non-naskah-dinas yang panjang).
- `placeholder: { nomor: '...' }` → contoh isian per template (mis. format nomor SKet/Rek).

### Helper di `util.js`
- `KUAUtil.tglIndo(iso)` → "8 Juni 2026"; `KUAUtil.hariIndo(iso)` → "Senin".
- `KUAUtil.ttdAktif(d)` → entri penanda tangan yang berlaku (pilihan form, atau entri pertama
  `config.js`). Dipakai `surat.js` untuk blok tanda tangan, dan oleh template yang perlu
  menyebut identitas penanda tangan di badan surat.
- `KUAUtil.nipSaja(nip)` → buang awalan "NIP. " untuk baris yang sudah berlabel "NIP".

## Cara menambah template baru
1. (Bila perlu field baru) tambahkan di `KUA_FIELDS` (`assets/templates.js`).
2. Tambahkan satu objek baru ke `KUA_TEMPLATES` (sudah ada contoh pola di file).
3. Untuk surat panjang yang berisiko tumpah ke halaman 2, set `compact: true`.
4. Tes (lihat di bawah), lalu commit & push.

## Tampilan surat & cetak (`surat.css`)
- Halaman A4, Arial 12, kop PMA (logo kiri, teks tengah, satu garis). Ruang tepi lewat `@page`
  agar berlaku di setiap halaman; halaman pertama atas 12 mm.
- Badan surat **rata kanan-kiri (justify)**, **spasi baris 1.15**, alinea menjorok 1,27 cm.
- Blok tanda tangan di kanan, `break-inside: avoid` agar tidak terbelah antar-halaman.
- **Mode `compact`** (`.page.compact`): jarak antar-bagian diringkas untuk surat panjang;
  ruang tepi & ruang tanda tangan tetap sesuai PMA.

## Cara tes hasil ke PDF (verifikasi cepat)
Render `surat.html` dengan data contoh memakai Chrome headless (Windows PowerShell):
```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$prof = Join-Path $env:TEMP ("kuaP" + [guid]::NewGuid().ToString("N"))
$url = "file:///D:/Projects/kua-longkib/surat.html?__t=puskesmas-laki&nomor=B/123&tanggal=2026-06-12&nama=Budi+Santoso&nik=1207230807880002&tempatLahir=Subulussalam&tanggalLahir=1988-08-07&pekerjaan=ASN&alamat=Subulussalam"
Start-Process -FilePath $chrome -Wait -NoNewWindow -ArgumentList @('--headless', '--disable-gpu',
  '--no-first-run', "--user-data-dir=$prof", '--no-pdf-header-footer',
  '--print-to-pdf=D:\Projects\kua-longkib\__tes.pdf', $url)
```
> **Jangan** pakai `--virtual-time-budget`: dengan flag itu `window.print()` otomatis di
> halaman surat ikut terpicu dan membatalkan cetak headless (Chrome 157 — PDF tidak terbentuk).
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
