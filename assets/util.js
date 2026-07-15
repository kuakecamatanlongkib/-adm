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

  window.KUAUtil = {
    BULAN: BULAN,
    HARI: HARI,
    todayISO: todayISO,
    tglIndo: tglIndo,
    hariIndo: hariIndo,
    titleCase: titleCase,
    titleCaseAll: capWords,
    esc: esc,
    nl2br: nl2br,
    tempatTanggalLahir: tempatTanggalLahir,
    ttdAktif: ttdAktif,
    nipSaja: nipSaja
  };
})();
