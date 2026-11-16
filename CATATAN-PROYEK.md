# Catatan Proyek — Surat KUA Longkib

Dokumen ini merangkum apa yang sudah dikerjakan agar mudah dilanjutkan suatu saat nanti.

## Apa ini
Aplikasi web statis untuk membuat **surat pengantar KUA Kecamatan Longkib**.
Berjalan **sepenuhnya di browser** (tanpa server), dipakai seimbang dari komputer dan HP.
- **Layar lebar (≥ 1024px):** form di kiri, **pratinjau langsung** surat A4 di kanan yang
  berubah setiap kali mengetik → tombol **Cetak Surat** (atau **Ctrl+P**) mencetak isi pratinjau.
- **HP / tablet layar sentuh:** form saja → tombol **Pratinjau Surat** membuka surat di tab
  baru (lembar A4 utuh, cubit untuk zoom) → staf memeriksa → **Cetak Surat**.

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
├─ index.html            # halaman form + panel pratinjau (struktur saja)
├─ surat.html            # halaman surat: mandiri (HP) atau tertanam di pratinjau (?embed=1)
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
   ├─ app.js             # logika form (pemilih kartu, field dinamis, validasi, transform,
   │                     #   pratinjau langsung, alur cetak per mode layar)
   └─ surat.js           # build(data) -> HTML surat; skala A4, garis batas halaman, postMessage
```

## Arsitektur (data-driven)
Form dan surat **dibangun otomatis dari katalog** di `assets/templates.js`.
Menambah surat baru = menambah **satu objek** di `KUA_TEMPLATES` (tidak menyentuh HTML).

- **Pemilih surat (halaman form):** **dropdown** (tertutup secara default) berisi **daftar
  baris** per kategori (nama + deskripsi; baris aktif berlatar hijau muda + centang). Pemicu
  menampilkan surat terpilih; klik di luar menutup menu. Dibangun otomatis dari `KUA_TEMPLATES`
  di `app.js`. Font UI web = **Inter** (dimuat dari Google Fonts; offline jatuh ke font sistem).
  Font surat/PDF = **Arial** sesuai PMA 12/2026 (`surat.css`); formulir N7 tetap Times.
  Aturan tampilan form ada di bagian *Tampilan form (UI)*.
- `config.js` → `KUA_CONFIG`: KOP (logo, baris instansi, alamat, kota) & daftar penanda tangan.
  Ubah identitas kantor / penanda tangan cukup di sini, berlaku ke semua surat.
- `templates.js` →
  - `KUA_FIELDS`: pustaka definisi input yang dipakai ulang antar-template.
  - `KUA_TEMPLATES`: daftar surat.
- Data mengalir: form → `surat.js` merender. Layar lebar lewat **postMessage** ke iframe
  pratinjau; HP lewat **URL query** (`surat.html?...`). Lihat bagian *Pratinjau langsung*.
  **Nilai tanggal selalu disimpan ISO `yyyy-mm-dd`**; tampilan Indonesia (mis.
  "12 Juni 2026") dihasilkan `KUAUtil.tglIndo()`.

## Pratinjau langsung & alur cetak
- **Batas mode:** `min-width: 1024px` → dua kolom (CSS di `styles.css`, cek `mqLebar` di
  `app.js`). Di bawah itu panel pratinjau disembunyikan dan iframe tidak dibuat.
- **Iframe pratinjau** = `surat.html?embed=1` (dibuat `app.js` saat jenis surat pertama dipilih).
  CSS form dan CSS surat tetap terpisah, dan pratinjau memakai CSS yang sama dengan cetak.
- **Protokol postMessage** (dipakai agar tetap jalan dari `file://`). Perhatian: di `file://`
  Chrome/Edge memberi induk `location.origin === "file://"`, sedangkan iframe ber-origin anonim
  (`"null"`). Bila `targetOrigin` diisi `"file://"`, pesan **dibuang diam-diam** (pratinjau
  kosong). Karena itu `app.js` memakai `'*'` di `file://` dan origin sendiri di http(s).
  Uji pratinjau di **kedua** protokol.
  - induk → iframe: `{kua:'render', data, fokus}`, `{kua:'fokus', fokus}`,
    `{kua:'zoom', mode:'halaman'|'lebar'}`, `{kua:'print', data}` (gambar ulang tanpa fokus lalu
    `window.print()` di dalam iframe);
  - iframe → induk: `{kua:'ready'}`, `{kua:'info', title, lebih, kertas}`, `{kua:'afterprint'}`
    (`kertas` = `'A4'` | `'F4'`, lihat *Kertas otomatis F4*).
- **Setiap perubahan form** (`input`/`change` didelegasikan di `<form>`, plus hapus baris
  daftar dan bangun ulang form) → `schedulePreview()` → digabung per frame layar
  (`requestAnimationFrame`) → `collectData()` (tanpa validasi) → render. Kolom kosong tampil
  kosong, sama seperti hasil akhir. Mengetik di kolom yang bertanda error menghapus tandanya.
- **Skala:** lembar selalu ditata pada ukuran asli 210 mm lalu di-`transform: scale()`, jadi
  pemenggalan baris sama dengan hasil cetak. `.sheet` diberi ukuran setelah skala agar area
  gulir tepat. `@media print` membatalkan skala (`transform: none !important`).
  Pilihan ukuran di panel: **Pas lebar** (maks. 130%) / **Satu halaman** (seluruh lembar
  terlihat). **Bawaan selalu Pas lebar** (permintaan pemilik); pilihan tidak diingat, jadi
  setiap kali halaman dibuka kembali ke Pas lebar.
- **Garis batas halaman 1:** bila isi melewati tinggi area cetak halaman 1 (A4 260 mm; F4 293 mm;
  formulir 261 mm), muncul garis merah putus-putus + label, dan badge "Lebih dari 1 halaman" (panel
  pratinjau / toolbar mandiri). Sudah dicek cocok dengan pemenggalan PDF sungguhan (N7, 25 syarat).
  Karena itu ruang tepi layar `.page.formulir` disamakan dengan `@page formulir` (18 mm atas/bawah).
- **Cetak di layar lebar:** validasi → (bila kertas F4: dialog pengingat) → judul halaman induk
  diganti judul surat (nama file PDF) → `{kua:'print'}` → dikembalikan setelah `afterprint`.
- **Tombol "Cetak Surat"** (dulu "Cetak / Simpan PDF"; garis miring terkesan dua tombol): sedikit
  timbul + petunjuk `Ctrl P` (disembunyikan di layar sentuh). Simpan PDF dijelaskan di keterangan
  bawah form, karena browser tidak mengizinkan aplikasi memilih "Save as PDF" sendiri.
- **Ctrl+P / ⌘P** selalu mencetak SURAT lewat alur tombol (validasi, pengingat F4), bukan halaman
  aplikasi: di halaman form (`app.js`), saat kursor di panel pratinjau (iframe kirim
  `{kua:'pintasanCetak'}`), dan di tab surat HP (`cetakMandiri()`). Bila halaman form tetap dicetak
  lewat menu browser, yang tercetak hanya petunjuk (`@media print` di `styles.css`).

### Pratinjau mengikuti kolom yang sedang diisi
Saat staf masuk ke sebuah kolom (layar lebar), pratinjau **bergulir** ke bagian surat tempat
nilai kolom itu tampil dan **menyorotnya** kuning tipis (CSS Custom Highlight `kua-fokus`; tidak
ikut tercetak). Gulir hanya bila bagian itu belum terlihat (tepi 48 px), jadi tidak melompat saat
mengetik; halus, atau langsung bila "kurangi gerakan".
- `app.js`: `focusin` pada `.field` → `fokusKolom` → `{kua:'fokus'}`; setiap render ikut membawa
  `fokus`. Fokus ke tombol / pemilih surat menghapus sorotan; klik bagian yang tidak bisa difokus
  (mis. tanggal di kalender) tidak mengubahnya.
- `surat.js` (`rentangKolom` → `rangeDari` → `ikutiFokus`), **otomatis untuk semua template**:
  - kolom teks/daftar: `build()` sekali lagi (tidak ditampilkan) dengan penanda tak terlihat
    U+2063/U+2064 di awal & akhir nilai → posisi tepat, semua kemunculan;
  - tanggal & pilihan berkode (`hubunganWali`, `penandatangan`): `build()` dengan nilai pembanding
    → karakter pertama yang berbeda → disorot dari awal kata sampai akhir baris teksnya;
  - kolom kosong: sorot label baris tabelnya ("Tipologi") atau kata sebelum tempat nilainya di
    kalimat ("bernama", "mahar").
- **Ganti jenis surat / Kosongkan** → pratinjau langsung kembali ke paling atas (kop):
  `buildForm()` memasang `pratinjauKeAtas`, render berikutnya membawa `keAtas`.
- Gulir halus memakai animasi sendiri (`gulirKe()`, 280 ms ease-out), bukan
  `behavior:'smooth'` bawaan: gulir bawaan yang masih berjalan tidak selalu berhenti oleh
  perintah ke atas. Gulir otomatis juga berhenti bila pengguna memutar roda mouse / menyentuh layar.
- Diuji: 143 kolom di 8 surat (termasuk form Ikrar kosong) → semua tersorot & terlihat; sorotan
  hilang saat cetak; ganti surat (juga saat pratinjau masih bergulir) & Kosongkan → posisi 0;
  mengetik biasa tidak melompat. Template baru otomatis ikut, tanpa perlu menandai apa pun.

### Audit teks terhadap dokumen sumber (16-11-2026)
Dibandingkan dengan `TT PUSKESMAS.docx`, `SURAT Pernyataan memeluk agama islam.docx`,
`SURAT WAKILAH.docx`, `Surat Rekomendasi SIMAS.pdf`. Yang hilang dan sudah dikembalikan: label saksi
Ikrar. Tiga perbedaan berikut **sengaja dibiarkan** (keputusan pemilik): Rekomendasi SIMAS tanpa
"serta menerima" bantuan; Ikrar memakai "Nama Lengkap" (bukan "Nama Lengkap / Alias"); Ikrar memakai
"Kepala atau Penghulu" (tanpa "PPN") dan jabatan Kepala KUA biasa di blok Mengetahui. Perbedaan lain
adalah penyesuaian PMA (salam → "Dengan hormat,", penutup baku, tanpa gelar, dst.). Puskesmas
laki-laki, Dispensasi, N7, dan BIMWIN belum punya dokumen sumber di repo.

### Kertas otomatis F4
Pemilik menetapkan: **huruf tidak boleh dikecilkan**. Surat yang isinya bisa sangat panjang
(saat ini hanya Ikrar Taukil Wali, lewat `kertasF4BilaTumpah: true`) tetap A4, tetapi **bila isinya
tidak muat 1 halaman A4, kertas otomatis diganti ke F4 / Folio (215 × 330 mm)**. Bila data
dipendekkan lagi, kertas kembali ke A4.
- `surat.js` → `render()`: selalu dicoba A4 dulu → `lewatHal1()` → `pasangKertas('F4')`, yang
  memasang kelas `.page.f4` (lembar layar 215 × 330 mm) dan `<style>` tambahan berisi
  `@page { size: 215mm 330mm }` (ruang tepi tetap dari `@page` di `surat.css`). Ukuran kertas di
  konstanta `KERTAS`.
- **Pemberitahuan ke staf:** layar lebar → strip biru "Kertas F4 (Folio)" di bawah bilah pratinjau
  (`#previewKertas`); HP → badge + keterangan di toolbar (`html.kertas-f4`). Saat menekan **Cetak**
  dengan kertas F4 muncul dialog `KUAUtil.konfirmasiF4()` (Batal / Lanjut cetak): Simpan PDF sudah
  otomatis F4; ke printer, staf harus memasang kertas F4 dan memilih F4 / Folio bila ditanya.
- Diuji (PDF sungguhan): data normal & nama panjang → A4; alamat lengkap dusun/RT/RW di semua
  pihak → F4 dengan sisa ±10–15 mm, huruf tetap 11 pt, 1 halaman. Surat lain tetap A4.
- Sebelumnya sempat dibuat perapatan huruf otomatis (10,5/10 pt); **dibatalkan** atas permintaan
  pemilik dan diganti cara ini.
- **Cetak di HP / layar sentuh** (`pointer: coarse`, termasuk iPad mendatar): selalu lewat tab
  baru, karena `print()` dari iframe di browser HP tidak konsisten. Halaman mandiri **tidak lagi
  membuka dialog cetak otomatis**; ada tombol **← Kembali** (menutup tab → kembali ke form yang
  isiannya masih utuh) dan **Cetak Surat**, dalam satu baris (Kembali kiri, Cetak kanan); info
  "Lebih dari 1 halaman" dan "Kertas F4" tampil sebagai strip di bawahnya. Di layar sempit lembar A4 diperkecil utuh
  (bukan ditata ulang) + petunjuk "Cubit layar untuk memperbesar" pada layar sentuh.

## Tampilan form (UI)
Dirombak 16-11-2026 atas permintaan pemilik ("kurang sedap dipandang, seperti AI slop"). Acuannya
aturan dari [Impeccable](https://github.com/pbakaus/impeccable) (mode *Operate*: alat kerja harus
akrab dan tenang) dan [skill animasi Emil Kowalski](https://github.com/emilkowalski/skills).
Taste Skill tidak dipakai karena khusus landing page. **Hanya halaman form**: surat/PDF tetap
mengikuti PMA dan tidak boleh "dipercantik".
- **Token** di `:root` (`styles.css`): warna (hijau hanya untuk aksi utama, pilihan aktif, fokus),
  skala huruf tetap 12/13/14/15/17 px (`--fs-*`), radius, bayangan, `--ease-out`.
- **Dilarang:** emoji/Unicode sebagai ikon (pakai SVG garis, `currentColor`); **tanda pisah
  panjang (—)** di teks yang terlihat pengguna (pemilik menganggapnya ciri teks AI); label
  kapital kecil ala "eyebrow"; kartu di dalam kartu; `transition: all`.
- **Kontras** teks & placeholder >= 4,5:1 (`--muted` #5f6b77).
- **Kolom wajib tidak diberi bintang** (62 dari 65 kolom wajib). Kolom tidak wajib otomatis
  diberi "(opsional)" oleh `fieldHTML()` (dari `required` di `KUA_FIELDS`).
- **Layar sentuh:** isian 16px (iPhone tidak memperbesar layar saat kolom disentuh), tombol 44px.
  Efek hover hanya di `@media (hover: hover) and (pointer: fine)`.
- **Tombol aksi** menempel di bawah kartu di semua ukuran layar. "Kosongkan Form" meminta
  konfirmasi (tombol merah, fokus awal di Batal) **hanya bila** sudah ada isian.
- **Gerak** (hanya untuk perubahan keadaan): menu & kalender muncul 160 ms (`kua-pop`, skala
  0,97 dari arah pemicu), dialog 220 ms, isian baru saat ganti surat 200 ms, pemberitahuan
  memudar 200 ms, tekan tombol `scale(0.97)`. Kurva `cubic-bezier(0.23, 1, 0.32, 1)`. Saat
  "kurangi gerakan" aktif, semuanya hanya memudar. Pratinjau yang berubah setiap ketikan **tidak**
  dianimasikan.
- **Kalender** dibuka rata kanan bila kolom tanggal ada di sisi kanan (`place()` di
  `datepicker.js`), sehingga tidak memunculkan gulir horizontal. Di HP (<= 480 px) lebarnya
  mengikuti kolom tanggal; <= 340 px panah bulan disembunyikan (bulan dipilih dari dropdown).
- **Uji HP** (emulasi Chrome + sentuhan asli lewat `Input.dispatchTouchEvent`; `synthesizeTapGesture`
  tidak menghasilkan `click` di headless): 320/340/360/390/412 px tanpa gulir horizontal, isian 16 px,
  tombol 44 px, target sentuh kalender >= 36-40 px. Belum diuji di perangkat fisik / Safari asli.

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
  - `titlecaseall` → semua kata kapital termasuk setelah koma. Dipakai: **hanya kolom alamat**
    (`KUAUtil.titleCaseAll` = `titleCaseAlamat`). Singkatan **RT/RW** dan **angka Romawi**
    (Dusun II, Lorong IV) ditulis kapital semua: `dusun ii rt 002/rw 001` → `Dusun II RT 002/RW 001`.
    Singkatan lain bisa ditambah di `SINGKATAN_ALAMAT` (`util.js`). Nama orang (`titlecase`) tidak
    terpengaruh.
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
- **Nama pejabat selalu satu baris:** `namaHTML()` memberi kelas `.nama-pejabat` (`nowrap`), jadi
  blok tanda tangan melebar mengikuti nama Plh yang panjang, bukan nama yang terlipat (dicek di
  ke-8 surat). Nama wali/saksi di Ikrar **sengaja tidak** diberi `nowrap`: nama ketikan staf bisa
  sangat panjang dan bisa keluar dari kertas, jadi nama itu boleh terlipat di kolomnya.
- **Tanpa NIP di blok tanda tangan**, baik Kepala maupun Plh (keputusan pemilik 16-11-2026, demi
  keseragaman). Sebelumnya Plh memakai "NIP: ..." mengikuti contoh tanda tangan Plh di PMA.
  Pilihan `nipDiTtd: true` per entri di `config.js` masih tersedia bila nanti diperlukan.
  Formulir N7 tetap memuat NIP (bentuk formulir Kepdirjen).
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
   `judulFormulir`, `modelKode`, `kopBaris`, `tanggalTanpaKota`. Dua blok pilihan dengan daftar
   syarat **dinamis** dari field `list`; blok hanya tampil bila daftarnya diisi, dan blok yang tampil
   otomatis bertanda ☑. Penutup `wassalam: true`.

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
   `ttdHTML`: [Mengetahui Kepala KUA | Wali + kotak Meterai Rp10.000], lalu judul
   **"SAKSI-SAKSI IKRAR:"** dan [Saksi I | Saksi II], masing-masing data diri + **"Tanda Tangan
   Saksi I:"** di atas ruang tanda tangan (mengikuti `SURAT WAKILAH.docx`; dua label ini sempat
   terlewat saat template dibuat dan dikembalikan 16-11-2026). Judul + kolom saksi dibungkus
   `.saksi-blok` agar tidak terpisah antarhalaman.
   Bukan naskah dinas KUA, jadi memakai `hurufKecil` (11 pt) + `compact` agar muat 1 halaman,
   ditambah `kertasF4BilaTumpah`: bila data sangat panjang, kertas otomatis diganti ke F4 agar
   tanda tangan saksi tidak terpisah sendirian di halaman 2 (lihat *Kertas otomatis F4*).
   > **11 pt adalah keputusan pemilik (16-11-2026).** 12 pt sudah diukur: data normal pun tidak
   > muat A4 (selalu F4), dan data panjang tetap 2 halaman meski di F4. Jangan ubah tanpa bertanya.
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
- `kertasF4BilaTumpah: true` → kertas A4 otomatis diganti ke F4 / Folio bila isi tidak muat
  1 halaman A4; huruf tidak diubah (lihat *Kertas otomatis F4*). Bila F4 pun tidak muat, garis batas
  & badge "Lebih dari 1 halaman" tetap muncul. Saat ini hanya Ikrar; surat lain cukup ditambah
  properti ini bila perlu.
- `placeholder: { nomor: '...' }` → contoh isian per template (mis. format nomor SKet/Rek).

### Helper di `util.js`
- `KUAUtil.tglIndo(iso)` → "8 Juni 2026"; `KUAUtil.hariIndo(iso)` → "Senin".
- `KUAUtil.ttdAktif(d)` → entri penanda tangan yang berlaku (pilihan form, atau entri pertama
  `config.js`). Dipakai `surat.js` untuk blok tanda tangan, dan oleh template yang perlu
  menyebut identitas penanda tangan di badan surat.
- `KUAUtil.nipSaja(nip)` → buang awalan "NIP. " untuk baris yang sudah berlabel "NIP".
- `KUAUtil.konfirmasi({judul, isiHTML, teks, lanjut, batal}, fn)` → dialog `<dialog>` dua tombol
  (gaya `.kua-dialog` ada di `styles.css` **dan** `surat.css`); `fn` dipanggil setelah dialog dihapus.
  `KUAUtil.konfirmasiF4(fn)` → pengingat kertas F4 sebelum mencetak.

## Cara menambah template baru
1. (Bila perlu field baru) tambahkan di `KUA_FIELDS` (`assets/templates.js`).
2. Tambahkan satu objek baru ke `KUA_TEMPLATES` (sudah ada contoh pola di file).
3. Untuk surat panjang yang berisiko tumpah ke halaman 2, set `compact: true`.
4. Tes (lihat di bawah), lalu commit & push.

## Tampilan surat & cetak (`surat.css`)
- Halaman A4 (F4 otomatis untuk template `kertasF4BilaTumpah`), Arial 12, kop PMA (logo kiri, teks
  tengah, satu garis). Ruang tepi lewat `@page` agar berlaku di setiap halaman; halaman pertama
  atas 12 mm.
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
> Dulu `--virtual-time-budget` membatalkan cetak headless karena `window.print()` otomatis ikut
> terpicu. Cetak otomatis sudah dihapus (lihat *Pratinjau langsung*), tetapi tetap tidak perlu flag itu.
> Untuk menguji pratinjau (klik, ketik, cetak dari iframe) pakai Chrome headless + DevTools
> Protocol dari Node (Node v26 punya `WebSocket` bawaan) dengan server statis lokal, agar
> iframe sama-origin seperti di GitHub Pages.
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
- Penanda abu-abu `[Nama]` untuk kolom kosong di pratinjau (sudah dibahas; diputuskan kosong dulu).
- Opsi nomor surat otomatis (mis. simpan di `localStorage`) bila diinginkan.
- Arsip ke Google Sheets / simpan PDF ke Drive → perlu Google Apps Script (saat ini belum).
