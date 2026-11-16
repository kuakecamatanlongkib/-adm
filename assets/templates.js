/*
 * ============================================================================
 *  KATALOG SURAT  —  ini satu-satunya file yang perlu diedit untuk MENAMBAH
 *  template surat baru. Form & halaman cetak akan menyesuaikan otomatis.
 * ============================================================================
 *
 *  Bentuk surat mengikuti PMA Nomor 12 Tahun 2026 tentang Tata Naskah Dinas pada
 *  Kementerian Agama (lihat CATATAN-PROYEK.md). Ada tiga bentuk:
 *
 *  A. SURAT DINAS (bawaan) — surat yang ditujukan ke pejabat/instansi:
 *  {
 *    id, nama, kategori, deskripsi,
 *    hal:       'Permohonan ...',            // baris "Hal" (Sifat=Biasa, Lampiran=- bila tak diisi)
 *    yth:       ['Camat Longkib', 'di Tempat'],
 *    pembuka:   'Dengan hormat, ...',        // alinea pembuka diawali "Dengan hormat,"
 *    letterRows:[ {label, value(d)} ],       // tabel data di badan surat
 *    isi:       '...' | function(d) | [...], // boleh banyak paragraf
 *    penutup:   'Demikian, ...'
 *  }
 *
 *  B. NASKAH BERJUDUL — surat keterangan, rekomendasi, ikrar:
 *  {
 *    jenisNaskah: 'Surat Keterangan',        // baris tebal di tengah
 *    judulSurat:  'Memeluk Agama Islam',     // baris judul di bawahnya (boleh fungsi)
 *    tanggalDiTtd: true,                     // tempat-tanggal di atas jabatan penanda tangan
 *    konsiderans: [{label:'Dasar', items(d)}, {label:'Menimbang', gaya:'huruf', items(d)}],
 *    ...pembuka, letterRows, isi, penutup seperti di atas
 *  }
 *
 *  C. FORMULIR (formLayout: true) — mis. Model N7, mengikuti bentuk formulirnya.
 *
 *  KOP & tanda tangan diambil dari config.js.
 */

/* ---------------------------------------------------------------------------
 *  PUSTAKA FIELD  —  definisi input yang bisa dipakai ulang antar-template.
 *  type: 'text' | 'date' | 'textarea' | 'select' | 'list'
 *  half: true  -> ditata berdampingan 2 kolom dengan field 'half' berikutnya
 *  default: 'today' -> otomatis terisi tanggal hari ini
 *  validate(v) -> kembalikan pesan error (string) bila tidak valid, atau null
 * ------------------------------------------------------------------------- */
function cekNIK(v) { return /^\d{16}$/.test(v) ? null : 'NIK harus 16 digit angka.'; }

window.KUA_FIELDS = {
  nomor: {
    label: 'Nomor Surat', type: 'text', required: true, half: true,
    placeholder: 'contoh: B/123/KUA.01.23.05/PW.01/11/2026'
  },
  tanggal: {
    label: 'Tanggal Surat', type: 'date', required: true, half: true, default: 'today'
  },
  nama: {
    label: 'Nama', type: 'text', required: true, placeholder: 'Nama lengkap',
    transform: 'titlecase'   // awal tiap kata otomatis huruf besar
  },
  nik: {
    label: 'NIK', type: 'text', required: true, inputmode: 'numeric', maxlength: 16,
    placeholder: '16 digit NIK', validate: cekNIK
  },
  tempatLahir: {
    label: 'Tempat Lahir', type: 'text', required: true, half: true,
    placeholder: 'contoh: Subulussalam', transform: 'titlecase'
  },
  tanggalLahir: {
    label: 'Tanggal Lahir', type: 'date', required: true, half: true
  },
  pekerjaan: {
    label: 'Pekerjaan', type: 'select', required: true,
    options: [
      'Belum / Tidak Bekerja',
      'Pelajar / Mahasiswa',
      'Mengurus Rumah Tangga',
      'Petani / Pekebun',
      'ASN',
      'TNI',
      'POLRI',
      'Karyawan Swasta',
      'Karyawan BUMN',
      'Karyawan BUMD',
      'Pekerjaan Lainnya'
    ],
    // Bila opsi ini dipilih, muncul kolom teks untuk mengetik pekerjaan sendiri
    otherValue: 'Pekerjaan Lainnya',
    otherPlaceholder: 'Tuliskan pekerjaan',
    transform: 'titlecase'   // hanya diterapkan pada kolom "lainnya"
  },
  alamat: {
    label: 'Alamat', type: 'textarea', required: true, placeholder: 'Alamat lengkap',
    transform: 'titlecaseall'   // setiap kata kapital (termasuk setelah koma)
  },

  // --- Field untuk surat dispensasi nikah (sepasang calon: suami & istri) ---
  namaSuami: { label: 'Nama', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama lengkap' },
  nikSuami: {
    label: 'NIK', type: 'text', required: true, inputmode: 'numeric', maxlength: 16, placeholder: '16 digit NIK',
    validate: cekNIK
  },
  tlSuami: { label: 'Tempat Lahir', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'contoh: Subulussalam' },
  tglSuami: { label: 'Tanggal Lahir', type: 'date', required: true, half: true },
  alamatSuami: { label: 'Alamat', type: 'textarea', required: true, transform: 'titlecaseall', placeholder: 'Alamat lengkap' },

  namaIstri: { label: 'Nama', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama lengkap' },
  nikIstri: {
    label: 'NIK', type: 'text', required: true, inputmode: 'numeric', maxlength: 16, placeholder: '16 digit NIK',
    validate: cekNIK
  },
  tlIstri: { label: 'Tempat Lahir', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'contoh: Subulussalam' },
  tglIstri: { label: 'Tanggal Lahir', type: 'date', required: true, half: true },
  alamatIstri: { label: 'Alamat', type: 'textarea', required: true, transform: 'titlecaseall', placeholder: 'Alamat lengkap' },

  rencanaAkad: { label: 'Rencana Akad Nikah', type: 'date', required: true },

  // --- Field untuk Formulir N7 (penolakan/pemberitahuan kehendak nikah/rujuk) ---
  jenis: { label: 'Jenis Kehendak', type: 'select', required: true, options: ['Nikah', 'Rujuk'] },
  calonPengantinWali: {
    label: 'Calon Pengantin / Wali (yang dituju)', type: 'text', required: true, transform: 'titlecase',
    placeholder: 'contoh: Sintia Sari Binti Tulia Situmorang'
  },
  calonSuami: { label: 'Nama Calon Suami', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'contoh: Lamyadi' },
  calonIstri: { label: 'Nama Calon Istri', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'contoh: Sintia Sari' },

  // type 'list' -> bisa tambah/hapus baris (jumlah dinamis). Disimpan sebagai
  // beberapa nilai dipisah baris-baru; baris kosong diabaikan saat surat dibuat.
  syaratDapat: {
    label: 'Syarat yang harus dilengkapi', type: 'list', addLabel: '+ Tambah syarat',
    placeholder: 'Tulis satu syarat, lalu “Tambah syarat” untuk baris berikutnya'
  },
  syaratTolak: {
    label: 'Alasan penolakan', type: 'list', addLabel: '+ Tambah alasan',
    placeholder: 'contoh: Umur calon pengantin Perempuan kurang dari 19 tahun'
  },

  // --- Field untuk Surat Keterangan Bimbingan Perkawinan (BIMWIN) ---
  pihak: {
    label: 'Keterangan untuk', type: 'select', required: true,
    options: ['Calon Suami', 'Calon Istri'], default: 'Calon Suami'
  },
  agama: { label: 'Agama', type: 'text', required: true, default: 'Islam', transform: 'titlecase' },
  tanggalBimwin: { label: 'Tanggal Mengikuti Bimbingan', type: 'date', required: true },

  // --- Field untuk Surat Keterangan Memeluk Agama Islam ---
  jenisKelamin: {
    label: 'Jenis Kelamin', type: 'select', required: true, options: ['Laki-laki', 'Perempuan']
  },
  agamaSebelumnya: {
    label: 'Agama Sebelumnya', type: 'select', required: true,
    options: ['Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya'],
    otherValue: 'Lainnya', otherPlaceholder: 'Tuliskan agama / kepercayaan sebelumnya',
    transform: 'titlecase'
  },
  tanggalSyahadat: { label: 'Tanggal Mengucapkan Syahadat', type: 'date', required: true },
  tempatSyahadat: {
    label: 'Tempat', type: 'text', required: true,
    placeholder: 'contoh: Masjid Baitussalam, Desa Harapan Baru'
  },
  pembimbingSyahadat: {
    label: 'Dibimbing oleh', type: 'text', required: true, transform: 'titlecase',
    placeholder: 'Nama yang menuntun pengucapan syahadat'
  },
  saksiSyahadat: {
    label: 'Saksi-saksi', type: 'list', required: true, addLabel: '+ Tambah saksi',
    placeholder: 'Nama saksi, lalu “Tambah saksi” untuk saksi berikutnya'
  },

  // --- Field untuk Surat Ikrar Taukil Wali ---
  namaWali: { label: 'Nama Lengkap', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama lengkap wali' },
  binWali: { label: 'Bin', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama ayah wali' },
  nikWali: {
    label: 'NIK', type: 'text', required: true, inputmode: 'numeric', maxlength: 16, placeholder: '16 digit NIK',
    validate: cekNIK
  },
  tlWali: { label: 'Tempat Lahir', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'contoh: Subulussalam' },
  tglWali: { label: 'Tanggal Lahir', type: 'date', required: true, half: true },
  kwnWali: { label: 'Kewarganegaraan', type: 'text', required: true, default: 'Indonesia', transform: 'titlecase' },
  alamatWali: { label: 'Alamat', type: 'textarea', required: true, transform: 'titlecaseall', placeholder: 'Alamat lengkap' },
  hubunganWali: {
    label: 'Hubungan wali dengan calon pengantin perempuan', type: 'select', required: true, default: 'ayah',
    options: [
      { value: 'ayah', text: 'Ayah kandung' },
      { value: 'kakek', text: 'Kakek (ayah dari ayah)' },
      { value: 'saudara-kandung', text: 'Saudara laki-laki kandung' },
      { value: 'saudara-seayah', text: 'Saudara laki-laki seayah' },
      { value: 'keponakan', text: 'Anak laki-laki dari saudara laki-laki' },
      { value: 'paman', text: 'Paman (saudara laki-laki ayah)' },
      { value: 'sepupu', text: 'Anak laki-laki dari paman (sepupu)' }
    ]
  },
  bintiIstri: { label: 'Binti', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama ayah calon pengantin perempuan' },
  kwnIstri: { label: 'Kewarganegaraan', type: 'text', required: true, default: 'Indonesia', transform: 'titlecase' },
  binSuami: { label: 'Bin', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'Nama ayah calon suami' },
  kuaAkad: {
    label: 'KUA Kecamatan tempat akad', type: 'text', required: true, transform: 'titlecase',
    placeholder: 'contoh: Marpoyan Damai, Kota Pekanbaru'
  },
  mahar: {
    label: 'Mahar', type: 'text', required: true,
    placeholder: 'contoh: uang sebesar Rp1.111.000,- (satu juta seratus sebelas ribu rupiah)'
  },
  pembayaranMahar: {
    label: 'Pembayaran Mahar', type: 'select', required: true,
    options: ['Dibayar Tunai', 'Terutang'], default: 'Dibayar Tunai'
  },
  saksi1Nama: { label: 'Nama', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama lengkap saksi' },
  saksi1Nik: {
    label: 'NIK', type: 'text', required: true, half: true, inputmode: 'numeric', maxlength: 16,
    placeholder: '16 digit NIK', validate: cekNIK
  },
  saksi1Umur: { label: 'Umur (tahun)', type: 'text', required: true, half: true, inputmode: 'numeric', maxlength: 3, placeholder: 'contoh: 45' },
  saksi1Alamat: { label: 'Alamat', type: 'text', required: true, transform: 'titlecaseall', placeholder: 'contoh: Desa Sikerabang' },
  saksi2Nama: { label: 'Nama', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama lengkap saksi' },
  saksi2Nik: {
    label: 'NIK', type: 'text', required: true, half: true, inputmode: 'numeric', maxlength: 16,
    placeholder: '16 digit NIK', validate: cekNIK
  },
  saksi2Umur: { label: 'Umur (tahun)', type: 'text', required: true, half: true, inputmode: 'numeric', maxlength: 3, placeholder: 'contoh: 45' },
  saksi2Alamat: { label: 'Alamat', type: 'text', required: true, transform: 'titlecaseall', placeholder: 'contoh: Desa Sikerabang' },

  // --- Field untuk Rekomendasi Bantuan Masjid (SIMAS) ---
  namaMasjid: { label: 'Nama Masjid', type: 'text', required: true, transform: 'titlecase', placeholder: 'contoh: Baitussalam' },
  idMasjid: { label: 'Nomor ID Masjid (SIMAS)', type: 'text', required: true, placeholder: 'contoh: ID.01.4.01.23.05.000011' },
  tipologi: {
    label: 'Tipologi', type: 'select', required: true,
    options: ['Masjid Besar', 'Masjid Jami\'', 'Masjid Bersejarah', 'Masjid di Tempat Publik', 'Lainnya'],
    otherValue: 'Lainnya', otherPlaceholder: 'Tuliskan tipologi sesuai SIMAS'
  },
  alamatMasjid: { label: 'Alamat Masjid', type: 'textarea', required: true, transform: 'titlecaseall', placeholder: 'Alamat lengkap masjid' },
  jenisBantuan: {
    label: 'Jenis Bantuan', type: 'select', required: true,
    options: ['Rehabilitasi', 'Pembangunan'], default: 'Rehabilitasi'
  },
  dasarRekomendasi: {
    label: 'Dasar',   // tidak wajib -> form menambahkan "(opsional)" otomatis type: 'list', addLabel: '+ Tambah dasar',
    placeholder: 'contoh: Keputusan Direktur Jenderal Bimbingan Masyarakat Islam Nomor ... Tahun 2026 tentang ...'
  },

  // --- Penanda tangan (dipakai semua surat, lihat config.js) ---
  penandatangan: {
    label: 'Ditandatangani oleh', type: 'select', required: true,
    options: (window.KUA_CONFIG.penandatangan || []).map(function (p) {
      return { value: p.id, text: p.label };
    }),
    default: (window.KUA_CONFIG.penandatangan[0] || {}).id
  }
};

// Pekerjaan wali & calon istri (taukil wali) memakai daftar yang sama dengan `pekerjaan`.
window.KUA_FIELDS.pekerjaanWali = Object.assign({}, window.KUA_FIELDS.pekerjaan);
window.KUA_FIELDS.pekerjaanIstri = Object.assign({}, window.KUA_FIELDS.pekerjaan);

/* ---------------------------------------------------------------------------
 *  Helper bersama antar-template
 * ------------------------------------------------------------------------- */
// Baris data identitas yang dipakai bersama oleh surat pengantar Puskesmas.
var BARIS_IDENTITAS = [
  { label: 'Nama', value: function (d) { return d.nama; } },
  { label: 'NIK', value: function (d) { return d.nik; } },
  { label: 'Tempat dan Tanggal Lahir', value: function (d) { return KUAUtil.tempatTanggalLahir(d); } },
  { label: 'Pekerjaan', value: function (d) { return d.pekerjaan; } },
  { label: 'Alamat', value: function (d) { return d.alamat; } }
];

// Identitas penanda tangan di badan surat (ikut pilihan Kepala/Plh di form).
var BARIS_PENANDA_TANGAN = [
  { label: 'Nama', value: function (d) { return KUAUtil.ttdAktif(d).nama; } },
  { label: 'NIP', value: function (d) { return KUAUtil.nipSaja(KUAUtil.ttdAktif(d).nip); } },
  { label: 'Jabatan', value: function (d) { return (KUAUtil.ttdAktif(d).jabatan || []).join(' '); } }
];

// Gabungkan "Tempat, Tanggal Lahir" dari pasangan field bebas.
function ttl2(tempat, iso) {
  var tg = KUAUtil.tglIndo(iso || '');
  return (tempat || '') + (tempat && tg ? ', ' : '') + tg;
}

// 'Calon Suami' -> 'calon suami' (untuk disisipkan di tengah kalimat).
function pihakKecil(d) { return String(d.pihak || '').toLowerCase(); }

// Isi field 'list' (dipisah baris-baru) -> array tanpa baris kosong.
function daftar(s) { return String(s || '').split('\n').filter(function (x) { return x.trim(); }); }

// Hubungan wali nasab: `teks` untuk "adalah wali nasab (...)", `sebutan` untuk isi ikrar.
var HUBUNGAN_WALI = {
  'ayah':            { teks: 'ayah kandung',                          sebutan: 'anak perempuan saya' },
  'kakek':           { teks: 'kakek',                                 sebutan: 'cucu perempuan saya' },
  'saudara-kandung': { teks: 'saudara laki-laki kandung',             sebutan: 'saudara perempuan saya' },
  'saudara-seayah':  { teks: 'saudara laki-laki seayah',              sebutan: 'saudara perempuan saya' },
  'keponakan':       { teks: 'anak laki-laki dari saudara laki-laki', sebutan: 'bibi saya' },
  'paman':           { teks: 'paman',                                 sebutan: 'keponakan saya' },
  'sepupu':          { teks: 'saudara sepupu',                        sebutan: 'saudara sepupu saya' }
};
function hubunganWali(d) { return HUBUNGAN_WALI[d.hubunganWali] || HUBUNGAN_WALI.ayah; }

// "Kecamatan Marpoyan Damai" / "KUA Marpoyan Damai" -> "Marpoyan Damai" (kata "KUA Kecamatan" sudah ada di kalimat).
function kuaAkadBersih(d) { return String(d.kuaAkad || '').replace(/^\s*(KUA\s+)?(Kecamatan\s+)?/i, ''); }

/* ---------------------------------------------------------------------------
 *  DAFTAR TEMPLATE
 * ------------------------------------------------------------------------- */
window.KUA_TEMPLATES = [
  {
    id: 'puskesmas-laki',
    nama: 'Pengantar Puskesmas Calon Pengantin Laki-laki',
    kategori: 'Pengantar Puskesmas',
    deskripsi: 'Permohonan pemeriksaan kesehatan & Surat Keterangan Sehat.',
    hal: 'Permohonan Pemeriksaan Kesehatan Calon Pengantin',
    formFields: ['nomor', 'tanggal', 'nama', 'nik', 'tempatLahir', 'tanggalLahir', 'pekerjaan', 'alamat'],
    yth: ['Kepala Puskesmas Kecamatan Longkib', 'di Tempat'],
    pembuka: 'Dengan hormat, bersama ini kami mohon agar yang membawa surat ini:',
    letterRows: BARIS_IDENTITAS,
    // Lanjutan kalimat pembuka setelah tabel data -> tidak menjorok.
    isi: { cls: 'tanpa-indent', text: 'dapat dilakukan pemeriksaan kesehatan dan diberikan Surat Keterangan Sehat sebagai salah satu syarat kelengkapan administrasi pernikahan.' },
    penutup: 'Demikian, atas kerja sama yang baik kami ucapkan terima kasih.'
  },
  {
    id: 'puskesmas-perempuan',
    nama: 'Pengantar Puskesmas Calon Pengantin Perempuan',
    kategori: 'Pengantar Puskesmas',
    deskripsi: 'Permohonan imunisasi TT & pemeriksaan kehamilan.',
    hal: 'Permohonan Imunisasi TT dan Pemeriksaan Kehamilan Calon Pengantin',
    formFields: ['nomor', 'tanggal', 'nama', 'nik', 'tempatLahir', 'tanggalLahir', 'pekerjaan', 'alamat'],
    yth: ['Kepala Puskesmas Kecamatan Longkib', 'di Tempat'],
    pembuka: 'Dengan hormat, bersama ini kami mohon agar yang membawa surat ini:',
    letterRows: BARIS_IDENTITAS,
    isi: { cls: 'tanpa-indent', text: 'dapat diberikan imunisasi TT dan diperiksa kehamilannya dengan hasil Negatif/Positif.' },
    penutup: 'Demikian, atas kerja sama yang baik kami ucapkan terima kasih.'
  },

  {
    id: 'dispensasi-nikah',
    nama: 'Permohonan Dispensasi Nikah (ke Camat)',
    kategori: 'Dispensasi',
    deskripsi: 'Permohonan dispensasi waktu pendaftaran nikah kepada Camat.',
    hal: 'Permohonan Dispensasi Nikah',
    formFields: [
      'nomor', 'tanggal',
      '#Calon Suami', 'namaSuami', 'nikSuami', 'tlSuami', 'tglSuami', 'alamatSuami',
      '#Calon Istri', 'namaIstri', 'nikIstri', 'tlIstri', 'tglIstri', 'alamatIstri',
      '#Jadwal', 'rencanaAkad'
    ],
    yth: ['Camat Longkib', 'di Tempat'],
    pembuka: 'Dengan hormat, sehubungan dengan adanya permohonan pendaftaran nikah dari warga atas nama:',
    letterRows: [
      { heading: 'Calon Suami' },
      { label: 'Nama', value: function (d) { return d.namaSuami; } },
      { label: 'NIK', value: function (d) { return d.nikSuami; } },
      { label: 'Tempat, Tanggal Lahir', value: function (d) { return ttl2(d.tlSuami, d.tglSuami); } },
      { label: 'Alamat', value: function (d) { return d.alamatSuami; } },
      { heading: 'Calon Istri' },
      { label: 'Nama', value: function (d) { return d.namaIstri; } },
      { label: 'NIK', value: function (d) { return d.nikIstri; } },
      { label: 'Tempat, Tanggal Lahir', value: function (d) { return ttl2(d.tlIstri, d.tglIstri); } },
      { label: 'Alamat', value: function (d) { return d.alamatIstri; } },
      { gap: true },
      { label: 'Rencana Akad Nikah', value: function (d) { return KUAUtil.tglIndo(d.rencanaAkad); } }
    ],
    isi: [
      'Bersama ini kami sampaikan bahwa pendaftaran nikah yang diajukan oleh pasangan tersebut belum memenuhi ketentuan minimal waktu pendaftaran, yaitu 10 hari kerja sebelum pelaksanaan akad nikah, sebagaimana diatur dalam ketentuan administrasi pernikahan di Kantor Urusan Agama.',
      'Namun, mengingat adanya alasan yang bersifat mendesak, kami mohon kepada Bapak Camat untuk dapat kiranya memberikan persetujuan dispensasi agar proses pencatatan pernikahan dapat dilanjutkan.'
    ],
    penutup: 'Demikian, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.'
  },

  {
    id: 'n7-penolakan-kehendak',
    nama: 'Formulir Penolakan Kehendak Nikah Rujuk (Model N7)',
    kategori: 'Lampiran Kep. Dirjen Bimas Islam',
    deskripsi: 'Pemberitahuan kekurangan syarat atau penolakan kehendak nikah/rujuk.',

    // --- Tata letak formulir (Kepdirjen Bimas Islam 473/2020), bukan bentuk surat PMA ---
    formLayout: true,                                   // kop tengah tanpa logo & tanpa garis
    lampiranRef: ['Lampiran XI', 'Keputusan Dirjen Bimas Islam No. 473 Tahun 2020'],
    judulFormulir: 'Formulir Penolakan Kehendak Nikah Rujuk',
    modelKode: 'Model N 7',
    kopBaris: ['KANTOR URUSAN AGAMA', 'KECAMATAN LONGKIB', 'KOTA SUBULUSSALAM'],
    tanggalTanpaKota: true,                             // tanggal saja, tanpa "Longkib,"

    formFields: [
      'nomor', 'tanggal', 'jenis', 'calonPengantinWali',
      'calonSuami', 'calonIstri',
      '#Syarat bila DAPAT dilaksanakan', 'syaratDapat',
      '#Alasan bila DITOLAK', 'syaratTolak'
    ],

    // Baris tambahan di blok nomor (selain "Nomor")
    metaRows: [
      { label: 'Lampiran', value: '1 (Satu) Berkas' },
      { label: 'Perihal', value: function (d) { return 'Pemberitahuan kekurangan syarat penolakan kehendak ' + (d.jenis || ''); } }
    ],

    tujuan: [
      'Kepada Yth,',
      'Calon Pengantin / Wali',
      function (d) { return d.calonPengantinWali; },
      'Di',
      'Tempat'
    ],
    salam: false,
    pembuka: function (d) {
      return 'Dengan hormat, setelah dilakukan pemeriksaan terhadap persyaratan pendaftaran pernikahan ' +
        'yang diatur dalam perundang-undangan bahwa permohonan pendaftaran ' + (d.jenis || '') +
        ' Saudara ' + (d.calonSuami || '') + ' dengan Saudari ' + (d.calonIstri || '') +
        ' diberitahukan sebagai berikut:';
    },

    // Dua blok pilihan. Daftar diambil dari field tipe 'list'; hanya baris yang diisi yang
    // ditampilkan, blok tanpa isi disembunyikan, dan blok yang tampil otomatis bertanda ☑.
    checklist: [
      { heading: 'Pernikahan dapat dilaksanakan dengan melengkapi persyaratan :', listKey: 'syaratDapat' },
      { heading: 'Tidak dapat dilaksanakan (ditolak) karena tidak melengkapi persyaratan berupa :', listKey: 'syaratTolak' }
    ],

    penutup: 'Demikian agar menjadi maklum.',
    wassalam: true                                      // tampilkan "Wassalam," di atas blok tanda tangan
  },

  {
    id: 'keterangan-bimwin',
    nama: 'Surat Keterangan Sudah Mengikuti Bimbingan Catin',
    kategori: 'Surat Keterangan',
    deskripsi: 'Keterangan telah mengikuti Bimbingan Perkawinan (BIMWIN) bagi calon pengantin.',
    placeholder: { nomor: 'contoh: 12/KUA.01.23.05/PW.01/SKet/11/2026' },

    jenisNaskah: 'Surat Keterangan',
    judulSurat: 'Sudah Mengikuti Bimbingan Perkawinan',
    tanggalDiTtd: true,

    formFields: [
      'nomor', 'tanggal', 'pihak',
      '#Data Calon Pengantin', 'nama', 'nik', 'tempatLahir', 'tanggalLahir',
      'agama', 'pekerjaan', 'alamat',
      '#Pelaksanaan Bimbingan', 'tanggalBimwin'
    ],

    pembuka: 'Yang bertanda tangan di bawah ini,',

    // Blok pertama = identitas penanda tangan (ikut pilihan Kepala/Plh di form),
    // blok kedua = identitas calon pengantin.
    letterRows: BARIS_PENANDA_TANGAN.concat([
      { text: function (d) { return 'dengan ini menerangkan bahwa ' + pihakKecil(d) + ':'; } },
      { label: 'Nama', value: function (d) { return d.nama; } },
      { label: 'NIK', value: function (d) { return d.nik; } },
      { label: 'Tempat, Tanggal Lahir', value: function (d) { return KUAUtil.tempatTanggalLahir(d); } },
      { label: 'Agama', value: function (d) { return d.agama; } },
      { label: 'Pekerjaan', value: function (d) { return d.pekerjaan; } },
      { label: 'Alamat', value: function (d) { return d.alamat; } }
    ]),

    isi: function (d) {
      return 'Benar bahwa ' + pihakKecil(d) + ' tersebut di atas telah mengikuti ' +
        'BIMBINGAN PERKAWINAN (BIMWIN) bagi calon pengantin yang diselenggarakan oleh ' +
        'Kantor Urusan Agama Kecamatan Longkib, Kota Subulussalam, pada hari ' +
        KUAUtil.hariIndo(d.tanggalBimwin) + ' tanggal ' + KUAUtil.tglIndo(d.tanggalBimwin) + '.';
    },
    penutup: 'Demikian surat keterangan ini dibuat untuk digunakan sebagai persyaratan ' +
      'kelengkapan administrasi pernikahan.'
  },

  {
    id: 'keterangan-memeluk-islam',
    nama: 'Surat Keterangan Memeluk Agama Islam',
    kategori: 'Surat Keterangan',
    deskripsi: 'Keterangan bahwa seseorang telah memeluk agama Islam dengan mengucapkan dua kalimat syahadat.',
    placeholder: { nomor: 'contoh: 13/KUA.01.23.05/BA.01/SKet/11/2026' },

    jenisNaskah: 'Surat Keterangan',
    judulSurat: 'Memeluk Agama Islam',
    tanggalDiTtd: true,

    formFields: [
      'nomor', 'tanggal',
      '#Data yang Bersangkutan', 'nama', 'nik', 'tempatLahir', 'tanggalLahir',
      'jenisKelamin', 'agamaSebelumnya', 'pekerjaan', 'alamat',
      '#Pengucapan Dua Kalimat Syahadat', 'tanggalSyahadat', 'tempatSyahadat',
      'pembimbingSyahadat', 'saksiSyahadat'
    ],

    pembuka: 'Yang bertanda tangan di bawah ini,',
    letterRows: BARIS_PENANDA_TANGAN.concat([
      { text: 'dengan ini menerangkan bahwa:' },
      { label: 'Nama', value: function (d) { return d.nama; } },
      { label: 'NIK', value: function (d) { return d.nik; } },
      { label: 'Tempat, Tanggal Lahir', value: function (d) { return KUAUtil.tempatTanggalLahir(d); } },
      { label: 'Jenis Kelamin', value: function (d) { return d.jenisKelamin; } },
      { label: 'Agama Sebelumnya', value: function (d) { return d.agamaSebelumnya; } },
      { label: 'Pekerjaan', value: function (d) { return d.pekerjaan; } },
      { label: 'Alamat', value: function (d) { return d.alamat; } },
      {
        text: 'Berdasarkan data yang diterima Kantor Urusan Agama Kecamatan Longkib, yang bersangkutan ' +
          'telah memeluk agama Islam dengan mengucapkan dua kalimat syahadat pada:',
        indent: true
      },
      // Nama hari dihitung otomatis dari tanggal, jadi tidak bisa salah hari.
      { label: 'Hari/Tanggal', value: function (d) { return KUAUtil.hariIndo(d.tanggalSyahadat) + ', ' + KUAUtil.tglIndo(d.tanggalSyahadat); } },
      { label: 'Tempat', value: function (d) { return d.tempatSyahadat; } },
      { label: 'Dibimbing oleh', value: function (d) { return d.pembimbingSyahadat; } },
      {
        label: 'Saksi-saksi', value: function (d) {
          return daftar(d.saksiSyahadat).map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n');
        }
      }
    ]),

    isi: 'Dengan demikian, terhitung sejak tanggal tersebut yang bersangkutan dinyatakan telah BERAGAMA ISLAM.',
    penutup: 'Demikian surat keterangan ini dibuat untuk digunakan sebagaimana mestinya.'
  },

  {
    id: 'ikrar-taukil-wali',
    nama: 'Surat Ikrar Taukil Wali',
    kategori: 'Pernikahan',
    deskripsi: 'Ikrar wali nasab yang berhalangan hadir, mewakilkan akad nikah kepada KUA tempat akad.',
    placeholder: { nomor: 'contoh: B/160/KUA.01.23.05/PW.01/11/2026' },
    compact: true,
    hurufKecil: true,   // bukan naskah dinas KUA (yang berikrar adalah wali); 11 pt agar muat 1 halaman
    kertasF4BilaTumpah: true, // isi tidak muat 1 halaman A4 -> kertas F4/Folio (huruf tidak dikecilkan)

    jenisNaskah: 'Surat Ikrar Taukil Wali',

    formFields: [
      'nomor', 'tanggal',
      '#Wali Nasab (yang berikrar)', 'namaWali', 'binWali', 'nikWali', 'tlWali', 'tglWali',
      'kwnWali', 'pekerjaanWali', 'alamatWali', 'hubunganWali',
      '#Calon Pengantin Perempuan', 'namaIstri', 'bintiIstri', 'nikIstri', 'tlIstri', 'tglIstri',
      'kwnIstri', 'pekerjaanIstri', 'alamatIstri',
      '#Calon Suami & Akad', 'calonSuami', 'binSuami', 'kuaAkad', 'mahar', 'pembayaranMahar',
      '#Saksi I', 'saksi1Nama', 'saksi1Nik', 'saksi1Umur', 'saksi1Alamat',
      '#Saksi II', 'saksi2Nama', 'saksi2Nik', 'saksi2Umur', 'saksi2Alamat'
    ],

    pembuka: 'Yang bertanda tangan di bawah ini:',
    letterRows: [
      { label: 'Nama Lengkap', value: function (d) { return d.namaWali; } },
      { label: 'Bin', value: function (d) { return d.binWali; } },
      { label: 'NIK', value: function (d) { return d.nikWali; } },
      { label: 'Tempat, Tanggal Lahir', value: function (d) { return ttl2(d.tlWali, d.tglWali); } },
      { label: 'Kewarganegaraan', value: function (d) { return d.kwnWali; } },
      { label: 'Agama', value: 'Islam' },
      { label: 'Pekerjaan', value: function (d) { return d.pekerjaanWali; } },
      { label: 'Alamat', value: function (d) { return d.alamatWali; } },
      { text: function (d) { return 'adalah wali nasab (' + hubunganWali(d).teks + ') dari seorang perempuan:'; } },
      { label: 'Nama Lengkap', value: function (d) { return d.namaIstri; } },
      { label: 'Binti', value: function (d) { return d.bintiIstri; } },
      { label: 'NIK', value: function (d) { return d.nikIstri; } },
      { label: 'Tempat, Tanggal Lahir', value: function (d) { return ttl2(d.tlIstri, d.tglIstri); } },
      { label: 'Kewarganegaraan', value: function (d) { return d.kwnIstri; } },
      { label: 'Agama', value: 'Islam' },
      { label: 'Pekerjaan', value: function (d) { return d.pekerjaanIstri; } },
      { label: 'Alamat', value: function (d) { return d.alamatIstri; } }
    ],

    isi: [
      { cls: 'tanpa-indent', text: 'Oleh karena saya berhalangan hadir pada pelaksanaan akad nikah, dengan ini saya berikrar di hadapan saksi-saksi bahwa:' },
      {
        cls: 'ikrar', text: function (d) {
          return '“Saya mewakilkan kepada Kepala atau Penghulu Kantor Urusan Agama Kecamatan ' + kuaAkadBersih(d) +
            ', atau orang yang ditunjuk oleh Kepala Kantor Urusan Agama tersebut, untuk menikahkan ' +
            hubunganWali(d).sebutan + ' yang namanya tersebut di atas dengan seorang laki-laki bernama ' +
            d.calonSuami + ' bin ' + d.binSuami + ' dengan mahar ' + String(d.mahar || '').replace(/[.,;\s]+$/, '') +
            ' ' + String(d.pembayaranMahar || '').toLowerCase() + '.”';
        }
      }
    ],
    penutup: 'Demikian ikrar taukil wali ini saya buat dengan sebenarnya, tanpa paksaan dari pihak mana pun, ' +
      'di hadapan 2 (dua) orang saksi yang namanya tersebut di bawah ini.',

    // Tanda tangan: [Mengetahui Kepala KUA | Wali + meterai], lalu [Saksi I | Saksi II].
    ttdHTML: function (d, h) {
      // Mengikuti SURAT WAKILAH.docx: judul "SAKSI-SAKSI IKRAR:", lalu per saksi data diri dan
      // label "Tanda Tangan Saksi I:" di atas ruang tanda tangan (tanpa label, nama di bawah
      // terlihat seperti tanpa keterangan).
      function saksi(no, nama, nik, umur, alamat) {
        return '<div class="ttd-cell">' +
          '<div class="saksi-judul">Saksi ' + no + '</div>' +
          h.tabel([['Nama', nama], ['NIK', nik], ['Umur', umur ? umur + ' Tahun' : ''], ['Alamat', alamat]], 'saksi-data') +
          '<div class="saksi-ttd">Tanda Tangan Saksi ' + no + ':</div>' +
          '<div class="space"></div>' +
          '<div class="nama">' + h.esc(nama) + '</div></div>';
      }
      return '<div class="ttd-grid">' +
          '<div class="ttd-cell"><div class="ttd-head">Mengetahui,<br />' + h.jabatanHTML(h.ttd) + '</div>' +
            '<div class="space"></div><div>' + h.namaHTML(h.ttd) + '</div></div>' +
          '<div class="ttd-cell"><div class="ttd-head">' + h.esc(h.tglTeks) + '<br />Yang Berikrar (Wali Nasab),</div>' +
            '<div class="space meterai-slot"><span class="meterai">Meterai<br />Rp10.000</span></div>' +
            '<div class="nama">' + h.esc(d.namaWali) + '</div></div>' +
        '</div>' +
        '<div class="saksi-blok">' +
          '<div class="saksi-ikrar-judul">SAKSI-SAKSI IKRAR:</div>' +
          '<div class="ttd-grid saksi">' +
            saksi('I', d.saksi1Nama, d.saksi1Nik, d.saksi1Umur, d.saksi1Alamat) +
            saksi('II', d.saksi2Nama, d.saksi2Nik, d.saksi2Umur, d.saksi2Alamat) +
          '</div>' +
        '</div>';
    }
  },

  {
    id: 'rekomendasi-simas',
    nama: 'Rekomendasi Bantuan Masjid (SIMAS)',
    kategori: 'Kemasjidan',
    deskripsi: 'Rekomendasi bagi masjid terdaftar di SIMAS untuk mengajukan bantuan pembangunan/rehabilitasi.',
    placeholder: { nomor: 'contoh: 154/KUA.01.23.05/BA.03.2/Rek/10/2026' },

    jenisNaskah: 'Rekomendasi',
    judulSurat: function (d) { return 'Pengajuan Bantuan ' + (d.jenisBantuan || '') + ' Masjid'; },
    tanggalDiTtd: true,

    formFields: [
      'nomor', 'tanggal',
      '#Data Masjid', 'namaMasjid', 'idMasjid', 'tipologi', 'alamatMasjid', 'jenisBantuan',
      '#Dasar Rekomendasi', 'dasarRekomendasi'
    ],

    // PMA 12/2026: batang tubuh rekomendasi memuat Dasar dan Menimbang.
    // Dasar diisi staf (opsional); Menimbang disusun otomatis dari data masjid.
    konsiderans: [
      { label: 'Dasar', items: function (d) { return daftar(d.dasarRekomendasi); } },
      {
        label: 'Menimbang', gaya: 'huruf', items: function (d) {
          return [
            'bahwa Masjid ' + d.namaMasjid + ' telah terdaftar pada Sistem Informasi Masjid (SIMAS) ' +
              'Kementerian Agama dengan Nomor ID ' + d.idMasjid,
            'bahwa masjid tersebut berada di wilayah kerja Kantor Urusan Agama Kecamatan Longkib, Kota Subulussalam'
          ];
        }
      }
    ],

    pembuka: 'Yang bertanda tangan di bawah ini:',
    letterRows: BARIS_PENANDA_TANGAN.concat([
      { text: 'Dengan ini memberikan rekomendasi kepada:' },
      { label: 'Nama Masjid', value: function (d) { return d.namaMasjid; } },
      { label: 'Nomor ID Masjid', value: function (d) { return d.idMasjid; } },
      { label: 'Tipologi', value: function (d) { return d.tipologi; } },
      { label: 'Alamat', value: function (d) { return d.alamatMasjid; } }
    ]),

    isi: {
      cls: 'tanpa-indent', text: function (d) {
        return 'Untuk mengajukan permohonan bantuan dana ' + String(d.jenisBantuan || '').toLowerCase() +
          ' masjid melalui Sistem Informasi Masjid (SIMAS) Kementerian Agama dalam rangka meningkatkan ' +
          'kualitas sarana dan prasarana rumah ibadah bagi masyarakat muslim di sekitarnya.';
      }
    },
    penutup: 'Demikian rekomendasi ini dibuat untuk dipergunakan seperlunya.'
  }
];

/* ---------------------------------------------------------------------------
 *  Pilihan penanda tangan (Kepala / Plh) ditambahkan otomatis ke akhir form
 *  SETIAP surat, jadi template baru tidak perlu menyebutnya di formFields.
 *  Kecuali template yang memaksa penanda tangan sendiri lewat properti `ttd`.
 * ------------------------------------------------------------------------- */
window.KUA_TEMPLATES.forEach(function (t) {
  if (t.ttd) return;
  var ff = t.formFields || (t.formFields = []);
  if (ff.indexOf('penandatangan') === -1) ff.push('#Penanda Tangan', 'penandatangan');
});
