/* Helper bersama, dipakai oleh index.html dan surat.html (classic script, aman di file://). */
(function () {
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
               'Agustus', 'September', 'Oktober', 'November', 'Desember'];

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

  window.KUAUtil = {
    BULAN: BULAN,
    todayISO: todayISO,
    tglIndo: tglIndo,
    titleCase: titleCase,
    titleCaseAll: capWords,
    esc: esc,
    nl2br: nl2br,
    tempatTanggalLahir: tempatTanggalLahir
  };
})();
