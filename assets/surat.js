/* Renderer halaman surat: ambil data dari URL, render sesuai template + config. */
(function () {
  var CONFIG = window.KUA_CONFIG;
  var TEMPLATES = window.KUA_TEMPLATES;
  var esc = KUAUtil.esc;
  var nl2br = KUAUtil.nl2br;

  var q = new URLSearchParams(window.location.search);
  var data = {};
  q.forEach(function (v, k) { data[k] = v; });

  var tpl = TEMPLATES.filter(function (t) { return t.id === data.__t; })[0] || TEMPLATES[0];

  function val(v) { return typeof v === 'function' ? v(data) : v; }

  // --- KOP (3 kolom: slot logo kiri, teks tengah, slot penyeimbang kanan) ---
  var kop = CONFIG.kop;
  var logoImg = kop.logo
    ? '<img class="logo" src="' + esc(kop.logo) + '" alt="" onerror="this.style.visibility=\'hidden\'" />'
    : '';
  var teks = '';
  (kop.baris || []).forEach(function (b) {
    teks += '<div class="' + (b.ukuran || 'h2') + '">' + esc(b.teks) + '</div>';
  });
  if (kop.alamat && kop.alamat.length) {
    teks += '<div class="alamat">' + kop.alamat.map(esc).join('<br />') + '</div>';
  }
  var kopHTML =
    '<div class="logo-slot">' + logoImg + '</div>' +
    '<div class="kop-text">' + teks + '</div>';

  // --- META: tanggal & nomor ---
  var metaHTML = '<div class="tgl">' +
    esc(kop.kota || '') + (kop.kota ? ', ' : '') + esc(KUAUtil.tglIndo(data.tanggal)) + '</div>';
  if (tpl.nomor !== false && data.nomor) {
    metaHTML += '<table class="nomor"><tr>' +
      '<td class="label">Nomor</td><td class="sep">:</td><td>' + esc(data.nomor) + '</td>' +
      '</tr></table>';
  }

  // --- Tujuan ---
  var tujuanHTML = '';
  if (tpl.tujuan && tpl.tujuan.length) {
    tujuanHTML = '<div class="tujuan">' + tpl.tujuan.map(esc).join('<br />') + '</div>';
  }

  // --- Salam ---
  var salamHTML = tpl.salam ? '<div class="salam">Assalamu\'alaikum Wr. Wb.</div>' : '';

  // --- Pembuka (boleh banyak paragraf) ---
  var pembukaHTML = '';
  if (tpl.pembuka) {
    (Array.isArray(tpl.pembuka) ? tpl.pembuka : [tpl.pembuka]).forEach(function (p) {
      pembukaHTML += '<p class="pembuka">' + esc(p) + '</p>';
    });
  }

  // --- Tabel data identitas (mendukung sub-judul {heading} & jeda {gap}) ---
  var dataHTML = '';
  if (tpl.letterRows && tpl.letterRows.length) {
    var buf = [];
    var flush = function () {
      if (buf.length) { dataHTML += '<table class="data">' + buf.join('') + '</table>'; buf = []; }
    };
    tpl.letterRows.forEach(function (row) {
      if (row.heading != null) {
        flush();
        dataHTML += '<div class="data-head">' + esc(row.heading) + '</div>';
      } else if (row.gap) {
        flush();
        dataHTML += '<div class="data-gap"></div>';
      } else {
        buf.push('<tr>' +
          '<td class="label">' + esc(row.label) + '</td>' +
          '<td class="sep">:</td>' +
          '<td>' + nl2br(val(row.value)) + '</td>' +
          '</tr>');
      }
    });
    flush();
  }

  // --- Isi (boleh banyak paragraf) & penutup ---
  var isiHTML = '';
  if (tpl.isi) {
    (Array.isArray(tpl.isi) ? tpl.isi : [tpl.isi]).forEach(function (p) {
      isiHTML += '<p class="isi">' + esc(val(p)) + '</p>';
    });
  }
  var penutupHTML = tpl.penutup ? '<p class="penutup">' + esc(tpl.penutup) + '</p>' : '';

  // --- Tanda tangan ---
  var ttd = (tpl.ttd) || CONFIG.ttd;
  var ttdHTML = '<div class="ttd"><div class="block">' +
    (ttd.jabatan || []).map(esc).join('<br />') +
    '<div class="space"></div>' +
    '<span class="nama">' + esc(ttd.nama) + '</span><br />' +
    esc(ttd.nip) +
    '</div></div>';

  // Mode ringkas untuk surat panjang (agar muat 1 halaman)
  if (tpl.compact) document.getElementById('page').classList.add('compact');

  // --- Rakit halaman ---
  document.getElementById('page').innerHTML =
    '<div class="kop">' + kopHTML + '</div>' +
    '<hr class="kop-rule" /><hr class="kop-rule thin" />' +
    '<div class="meta">' + metaHTML + '</div>' +
    tujuanHTML + salamHTML + pembukaHTML + dataHTML + isiHTML + penutupHTML + ttdHTML;

  // Judul tab -> nama file PDF default rapi
  document.title = tpl.nama + (data.nama ? ' - ' + data.nama : '');

  // Otomatis buka dialog cetak (beri jeda agar logo/render selesai)
  window.addEventListener('load', function () {
    setTimeout(function () { window.print(); }, 400);
  });
})();
