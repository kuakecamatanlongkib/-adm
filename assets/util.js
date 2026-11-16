/* Helper bersama, dipakai oleh index.html dan surat.html (classic script, aman di file://). */
(function () {
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
               'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  function todayISO() {
    var t = new Date();
    return t.getFullYear() + '-' +
      String(t.getMonth() + 1).padStart(2, '0') + '-' +
      String(t.getDate()).padStart(2, '0');
  }

  // '2026-06-12' -> '12 Juni 2026'
  function tglIndo(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    var d = parseInt(p[2], 10);
    var m = parseInt(p[1], 10) - 1;
    var y = p[0];
    if (isNaN(d) || isNaN(m) || !BULAN[m]) return iso;
    return d + ' ' + BULAN[m] + ' ' + y;
  }

  // '2026-06-08' -> 'Senin'
  function hariIndo(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    if (p.length !== 3) return '';
    var t = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return isNaN(t.getTime()) ? '' : HARI[t.getDay()];
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function nl2br(s) {
    return esc(s).replace(/\n/g, '<br />');
  }

  function capWords(s) {
    return s.toLowerCase().replace(/\S+/g, function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
  }

  // Huruf besar di setiap awal kata: "budi santoso" -> "Budi Santoso".
  // Gelar akademik selalu ditulis setelah koma, jadi bagian SETELAH koma
  // pertama dibiarkan apa adanya: "andi, S.H., M.Kom" -> "Andi, S.H., M.Kom".
  function titleCase(s) {
    s = String(s == null ? '' : s);
    var i = s.indexOf(',');
    if (i === -1) return capWords(s);
    return capWords(s.slice(0, i)) + s.slice(i);
  }

  // Singkatan yang di alamat selalu ditulis kapital semua. Tambahkan di sini bila perlu.
  var SINGKATAN_ALAMAT = ['RT', 'RW'];
  // Angka Romawi I–XXXIX (Dusun II, Lorong IV, Lingkungan XII): hanya huruf I, V, X.
  var ROMAWI = /^x{0,3}(ix|iv|v?i{0,3})$/i;

  // Title Case untuk ALAMAT: setiap kata diawali huruf besar (termasuk setelah koma),
  // kecuali singkatan RT/RW dan angka Romawi yang ditulis kapital semua.
  //   "dusun ii rt 002/rw 001, desa longkib" -> "Dusun II RT 002/RW 001, Desa Longkib"
  // Panjang teks tidak berubah, jadi aman untuk transform langsung saat mengetik.
  function titleCaseAlamat(s) {
    return capWords(String(s == null ? '' : s))
      .replace(/(^|[^A-Za-z])([A-Za-z]+)(?=[^A-Za-z]|$)/g, function (m, awal, kata) {
        var besar = kata.toUpperCase();
        if (SINGKATAN_ALAMAT.indexOf(besar) !== -1 || (kata.length > 1 && ROMAWI.test(kata))) {
          return awal + besar;
        }
        return m;
      });
  }

  // Gabungan "Tempat, Tanggal Lahir" yang sering dipakai antar-template.
  function tempatTanggalLahir(d) {
    var t = d.tempatLahir || '';
    var tg = tglIndo(d.tanggalLahir || '');
    return t + (t && tg ? ', ' : '') + tg;
  }

  // Penanda tangan yang berlaku untuk sebuah surat: pilihan pada form
  // (data.penandatangan, mis. 'plh'), atau entri pertama config sebagai default.
  // Dipakai surat.js untuk blok tanda tangan, dan oleh template yang perlu
  // menyebut identitas penanda tangan di badan surat.
  function ttdAktif(d) {
    var daftar = (window.KUA_CONFIG && window.KUA_CONFIG.penandatangan) || [];
    var dipilih = daftar.filter(function (p) { return p.id === (d && d.penandatangan); })[0];
    return dipilih || daftar[0] || {};
  }

  // 'NIP. 199606192022031003' -> '199606192022031003' (untuk baris berlabel "NIP")
  function nipSaja(s) {
    return String(s == null ? '' : s).replace(/^NIP\.?\s*/i, '');
  }

  // Dialog konfirmasi sederhana (dipakai index.html & surat.html). opsi: judul, isiHTML,
  // teks (cadangan window.confirm), lanjut, batal, bahaya (tombol lanjut merah). Gaya .kua-dialog ada
  // di styles.css dan surat.css. `lanjut` dipanggil SETELAH dialog dihapus, jadi bila isinya
  // window.print(), dialog tidak ikut tercetak.
  function konfirmasi(opsi, lanjut) {
    var dlg = document.createElement('dialog');
    if (typeof dlg.showModal !== 'function') {          // peramban lama tanpa <dialog>
      if (window.confirm(opsi.teks)) lanjut();
      return;
    }
    dlg.className = 'kua-dialog';
    dlg.innerHTML = '<h2>' + esc(opsi.judul) + '</h2>' + opsi.isiHTML +
      '<div class="kua-dialog-aksi">' +
        '<button type="button" data-ok="0">' + esc(opsi.batal || 'Batal') + '</button>' +
        '<button type="button" data-ok="1" class="utama' + (opsi.bahaya ? ' bahaya' : '') + '">' +
          esc(opsi.lanjut || 'Lanjut') + '</button>' +
      '</div>';
    function tutup(ok) {
      dlg.close();
      if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
      if (ok) lanjut();
    }
    dlg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-ok]');
      if (b) tutup(b.getAttribute('data-ok') === '1');
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); tutup(false); });   // tombol Esc
    document.body.appendChild(dlg);
    dlg.showModal();
    // Aksi berbahaya (mis. menghapus isian): fokus awal di "Batal" agar Enter tidak langsung menghapus.
    dlg.querySelector(opsi.bahaya ? '[data-ok="0"]' : '.utama').focus();
  }

  // Pengingat sebelum mencetak surat yang otomatis memakai kertas F4 (lihat surat.js).
  function konfirmasiF4(lanjut) {
    konfirmasi({
      judul: 'Surat ini memakai kertas F4',
      isiHTML:
        '<p>Isi surat tidak muat di kertas A4, jadi ukuran kertas otomatis diganti ke ' +
        '<strong>F4 / Folio (215 × 330 mm)</strong>. Ukuran huruf tidak diubah.</p>' +
        '<ul>' +
          '<li><strong>Simpan sebagai PDF:</strong> ukuran F4 sudah otomatis.</li>' +
          '<li><strong>Cetak ke printer:</strong> pasang kertas F4 di printer. Bila dialog cetak ' +
            'menampilkan pilihan <em>Ukuran kertas</em>, pilih F4 / Folio.</li>' +
        '</ul>',
      teks: 'Surat ini memakai kertas F4 / Folio (215 x 330 mm) karena isinya tidak muat di A4.\n' +
        'Pasang kertas F4 di printer sebelum mencetak. Lanjut cetak?',
      lanjut: 'Lanjut cetak',
      batal: 'Batal'
    }, lanjut);
  }

  window.KUAUtil = {
    BULAN: BULAN,
    HARI: HARI,
    todayISO: todayISO,
    tglIndo: tglIndo,
    hariIndo: hariIndo,
    titleCase: titleCase,
    titleCaseAll: titleCaseAlamat,   // transform 'titlecaseall' (hanya dipakai kolom alamat)
    esc: esc,
    nl2br: nl2br,
    tempatTanggalLahir: tempatTanggalLahir,
    ttdAktif: ttdAktif,
    nipSaja: nipSaja,
    konfirmasi: konfirmasi,
    konfirmasiF4: konfirmasiF4
  };
})();
