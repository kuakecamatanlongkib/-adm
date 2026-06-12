/*
 * ============================================================================
 *  KATALOG SURAT  —  ini satu-satunya file yang perlu diedit untuk MENAMBAH
 *  template surat baru. Form & halaman cetak akan menyesuaikan otomatis.
 * ============================================================================
 *
 *  CARA MENAMBAH SURAT BARU:
 *  1. (Jika perlu field baru) tambahkan definisinya di KUA_FIELDS.
 *  2. Tambahkan satu objek baru ke dalam array KUA_TEMPLATES (lihat contoh).
 *
 *  Struktur sebuah template:
 *  {
 *    id:        'kode-unik-surat',          // dipakai di URL, harus unik
 *    nama:      'Nama yang tampil di menu',
 *    kategori:  'Pengelompokan di menu',
 *    deskripsi: 'Keterangan singkat (opsional)',
 *    formFields:['nomor','tanggal', ...],   // field yang diisi di form (urut)
 *    tujuan:    ['Kepada Yth,', ...],        // baris alamat tujuan
 *    salam:     true,                        // tampilkan "Assalamu'alaikum Wr. Wb."
 *    pembuka:   'Kalimat pembuka :',
 *    letterRows:[ {label, value(d)} ],       // tabel data di badan surat
 *    isi:       'Kalimat inti...'            // boleh string atau function(d)
 *             | function(d){ return '...' },
 *    penutup:   'Kalimat penutup.'
 *    // KOP & tanda tangan diambil dari config.js
 *  }
 */

/* ---------------------------------------------------------------------------
 *  PUSTAKA FIELD  —  definisi input yang bisa dipakai ulang antar-template.
 *  type: 'text' | 'date' | 'textarea' | 'number'
 *  half: true  -> ditata berdampingan 2 kolom dengan field 'half' berikutnya
 *  default: 'today' -> otomatis terisi tanggal hari ini
 *  validate(v) -> kembalikan pesan error (string) bila tidak valid, atau null
 * ------------------------------------------------------------------------- */
window.KUA_FIELDS = {
  nomor: {
    label: 'Nomor Surat', type: 'text', required: true, half: true,
    placeholder: 'contoh: B-123/Kk.01.18/PW.01/06/2026'
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
    placeholder: '16 digit NIK',
    validate: function (v) { return /^\d{16}$/.test(v) ? null : 'NIK harus 16 digit angka.'; }
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
    validate: function (v) { return /^\d{16}$/.test(v) ? null : 'NIK harus 16 digit angka.'; }
  },
  tlSuami: { label: 'Tempat Lahir', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'contoh: Subulussalam' },
  tglSuami: { label: 'Tanggal Lahir', type: 'date', required: true, half: true },
  alamatSuami: { label: 'Alamat', type: 'textarea', required: true, transform: 'titlecaseall', placeholder: 'Alamat lengkap' },

  namaIstri: { label: 'Nama', type: 'text', required: true, transform: 'titlecase', placeholder: 'Nama lengkap' },
  nikIstri: {
    label: 'NIK', type: 'text', required: true, inputmode: 'numeric', maxlength: 16, placeholder: '16 digit NIK',
    validate: function (v) { return /^\d{16}$/.test(v) ? null : 'NIK harus 16 digit angka.'; }
  },
  tlIstri: { label: 'Tempat Lahir', type: 'text', required: true, half: true, transform: 'titlecase', placeholder: 'contoh: Subulussalam' },
  tglIstri: { label: 'Tanggal Lahir', type: 'date', required: true, half: true },
  alamatIstri: { label: 'Alamat', type: 'textarea', required: true, transform: 'titlecaseall', placeholder: 'Alamat lengkap' },

  rencanaAkad: { label: 'Rencana Akad Nikah', type: 'date', required: true }
};

/* ---------------------------------------------------------------------------
 *  Baris data identitas yang dipakai bersama oleh surat pengantar Puskesmas.
 * ------------------------------------------------------------------------- */
var BARIS_IDENTITAS = [
  { label: 'Nama', value: function (d) { return d.nama; } },
  { label: 'NIK', value: function (d) { return d.nik; } },
  { label: 'Tempat dan Tanggal Lahir', value: function (d) { return KUAUtil.tempatTanggalLahir(d); } },
  { label: 'Pekerjaan', value: function (d) { return d.pekerjaan; } },
  { label: 'Alamat', value: function (d) { return d.alamat; } }
];

// Gabungkan "Tempat, Tanggal Lahir" dari pasangan field bebas.
function ttl2(tempat, iso) {
  var tg = KUAUtil.tglIndo(iso || '');
  return (tempat || '') + (tempat && tg ? ', ' : '') + tg;
}

/* ---------------------------------------------------------------------------
 *  DAFTAR TEMPLATE
 * ------------------------------------------------------------------------- */
window.KUA_TEMPLATES = [
  {
    id: 'puskesmas-laki',
    nama: 'Pengantar Puskesmas — Calon Pengantin Laki-laki',
    kategori: 'Pengantar Puskesmas',
    deskripsi: 'Permohonan pemeriksaan kesehatan & Surat Keterangan Sehat.',
    formFields: ['nomor', 'tanggal', 'nama', 'nik', 'tempatLahir', 'tanggalLahir', 'pekerjaan', 'alamat'],
    tujuan: ['Kepada Yth,', 'Kepala Puskesmas Kecamatan Longkib', 'di -', 'Tempat'],
    salam: true,
    pembuka: 'Dimohon kepada saudara/i, agar yang membawa surat ini :',
    letterRows: BARIS_IDENTITAS,
    isi: 'Dapat dilakukan pemeriksaan kesehatan, dan diberikan Surat Keterangan Sehat sebagai salah satu syarat kelengkapan administrasi pernikahan.',
    penutup: 'Demikian atas kerjasama yang baik kami ucapkan terimakasih.'
  },
  {
    id: 'puskesmas-perempuan',
    nama: 'Pengantar Puskesmas — Calon Pengantin Perempuan',
    kategori: 'Pengantar Puskesmas',
    deskripsi: 'Permohonan imunisasi TT & pemeriksaan kehamilan.',
    formFields: ['nomor', 'tanggal', 'nama', 'nik', 'tempatLahir', 'tanggalLahir', 'pekerjaan', 'alamat'],
    tujuan: ['Kepada Yth,', 'Kepala Puskesmas Kecamatan Longkib', 'di -', 'Tempat'],
    salam: true,
    pembuka: 'Dimohon kepada saudara/i, agar yang membawa surat ini :',
    letterRows: BARIS_IDENTITAS,
    isi: 'Dapat diberikan imunisasi TT dan diperiksa kehamilannya dengan hasil Negatif/Positif.',
    penutup: 'Demikian atas kerjasama yang baik kami ucapkan terimakasih.'
  },

  {
    id: 'dispensasi-nikah',
    nama: 'Permohonan Dispensasi Nikah (ke Camat)',
    kategori: 'Dispensasi',
    deskripsi: 'Permohonan dispensasi waktu pendaftaran nikah kepada Camat.',
    compact: true,   // surat panjang -> spasi diringkas agar muat 1 halaman
    formFields: [
      'nomor', 'tanggal',
      '#Calon Suami', 'namaSuami', 'nikSuami', 'tlSuami', 'tglSuami', 'alamatSuami',
      '#Calon Istri', 'namaIstri', 'nikIstri', 'tlIstri', 'tglIstri', 'alamatIstri',
      '#Jadwal', 'rencanaAkad'
    ],
    tujuan: ['Kepada Yth,', 'Camat Longkib', 'di –', 'Tempat'],
    salam: true,
    pembuka: [
      'Dengan Hormat,',
      'Sehubungan dengan adanya permohonan pendaftaran nikah dari warga atas nama :'
    ],
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
    penutup: 'Demikian atas perhatian dan kerjasama yang baik kami ucapkan terimakasih.'
  }

  /*
   * CONTOH menambah surat baru di masa depan — salin pola di atas:
   *
   * ,{
   *   id: 'rekomendasi-nikah',
   *   nama: 'Surat Rekomendasi Nikah',
   *   kategori: 'Nikah',
   *   formFields: ['nomor','tanggal','nama','nik','pekerjaan','alamat'],
   *   tujuan: ['Kepada Yth,','Kepala KUA Kecamatan ...','di -','Tempat'],
   *   salam: true,
   *   pembuka: 'Yang bertanda tangan di bawah ini menerangkan bahwa :',
   *   letterRows: [
   *     { label:'Nama', value:d=>d.nama },
   *     { label:'NIK', value:d=>d.nik },
   *     { label:'Pekerjaan', value:d=>d.pekerjaan },
   *     { label:'Alamat', value:d=>d.alamat }
   *   ],
   *   isi: 'Adalah benar penduduk ... dst.',
   *   penutup: 'Demikian surat rekomendasi ini dibuat untuk dipergunakan seperlunya.'
   * }
   */
];
