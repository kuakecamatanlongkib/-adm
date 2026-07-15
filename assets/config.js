/*
 * Identitas kantor — dipakai di KOP dan blok tanda tangan SEMUA surat.
 * Ubah di sini sekali, berlaku untuk semua template.
 */
window.KUA_CONFIG = {
  appName: 'Surat KUA Longkib',

  // KOP surat
  kop: {
    logo: 'logo-kemenag.png',          // taruh file gambar logo di folder ini
    kota: 'Longkib',                   // dipakai pada baris "Longkib, <tanggal>"
    baris: [
      { teks: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA', ukuran: 'h1' },
      { teks: 'KANTOR KEMENTERIAN AGAMA KOTA SUBULUSSALAM', ukuran: 'h2' },
      { teks: 'KANTOR URUSAN AGAMA KECAMATAN LONGKIB', ukuran: 'h3' }
    ],
    alamat: [
      'Jalan H. Rasyid Jabat Kode Pos 24782 Telepon: 085834700151',
      'kuakecamatanlongkib@gmail.com'
    ]
  },

  // Daftar penanda tangan. Entri PERTAMA dipakai sebagai default di form.
  // Saat Kepala KUA cuti/dinas luar, staf memilih "Plh." pada dropdown
  // "Ditandatangani oleh" — pilihan ini berlaku untuk semua jenis surat.
  // Bila Plh berganti orang, cukup ubah nama & NIP pada entri 'plh' di bawah.
  penandatangan: [
    {
      id: 'kepala',
      label: 'Kepala KUA',
      jabatan: ['Kepala Kantor Urusan Agama', 'Kecamatan Longkib'],
      nama: 'Apri Yudiansyah Siregar, S.H',
      nip: 'NIP. 199606192022031003'
    },
    {
      id: 'plh',
      label: 'Plh. Kepala KUA (Kepala cuti/dinas luar)',
      jabatan: ['Plh. Kepala Kantor Urusan Agama', 'Kecamatan Longkib'],
      nama: 'Fikri Mubarak Juli Armun Putra Rangkuti, S.Sos.I',
      nip: 'NIP. 198807082022031001'
    }
  ]
};
