/*
 * Identitas kantor — dipakai di KOP dan blok tanda tangan SEMUA surat.
 * Ubah di sini sekali, berlaku untuk semua template.
 *
 * Mengikuti PMA Nomor 12 Tahun 2026 tentang Tata Naskah Dinas pada Kementerian Agama.
 */
window.KUA_CONFIG = {
  appName: 'Surat KUA Longkib',

  // KOP surat (Kop Naskah Dinas KUA): baris 1 Arial 14 tebal, baris 2 Arial 12 tebal,
  // baris 3 Arial 11 tebal, alamat/telepon Arial 9 huruf awal kapital — ukuran diatur surat.css.
  kop: {
    logo: 'logo-kemenag.png',          // taruh file gambar logo di folder ini
    kota: 'Longkib',                   // dipakai pada baris "Longkib, <tanggal>"
    baris: [
      { teks: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA', ukuran: 'h1' },
      { teks: 'KANTOR KEMENTERIAN AGAMA KOTA SUBULUSSALAM', ukuran: 'h2' },
      { teks: 'KANTOR URUSAN AGAMA KECAMATAN LONGKIB', ukuran: 'h3' }
    ],
    alamat: [
      'Jalan H. Rasyid Jabat Kode Pos 24782',
      'Telepon 085834700151 Email: kuakecamatanlongkib@gmail.com'
    ]
  },

  // Daftar penanda tangan. Entri PERTAMA dipakai sebagai default di form.
  // Saat Kepala KUA cuti/dinas luar, staf memilih "Plh." pada dropdown
  // "Ditandatangani oleh" — pilihan ini berlaku untuk semua jenis surat.
  // Bila Plh berganti orang, cukup ubah nama & NIP pada entri 'plh' di bawah.
  //
  // Aturan PMA 12/2026:
  //  - nama ditulis huruf awal kapital TANPA gelar;
  //  - nip ditulis angka saja (label "NIP" ditambahkan otomatis);
  //  - Blok tanda tangan TIDAK memuat NIP, baik Kepala maupun Plh (keputusan pemilik,
  //    16-11-2026). Bila suatu saat perlu, tambahkan `nipDiTtd: true` pada entri itu
  //    -> "NIP: ..." tampil di bawah nama. Formulir N7 tetap memuat NIP (bentuk formulirnya).
  //  - nip tetap diisi: dipakai baris "NIP" di badan surat keterangan/rekomendasi.
  penandatangan: [
    {
      id: 'kepala',
      label: 'Kepala KUA',
      jabatan: ['Kepala Kantor Urusan Agama', 'Kecamatan Longkib'],
      nama: 'Apri Yudiansyah Siregar',
      nip: '199606192022031003'
    },
    {
      id: 'plh',
      label: 'Plh. Kepala KUA (Kepala cuti/dinas luar)',
      jabatan: ['Plh. Kepala Kantor Urusan Agama', 'Kecamatan Longkib'],
      nama: 'Fikri Mubarak Juli Armun Putra Rangkuti',
      nip: '198807082022031001'
    }
  ]
};
