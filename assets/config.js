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

  // Blok tanda tangan (penandatangan default)
  ttd: {
    jabatan: ['Kepala Kantor Urusan Agama', 'Kecamatan Longkib'],
    nama: 'Apri Yudiansyah Siregar, S.H',
    nip: 'NIP. 199606192022031003'
  }
};
