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
  function metaRow(label, value) {
    return '<tr><td class="label">' + esc(label) + '</td><td class="sep">:</td><td>' + esc(value) + '</td></tr>';
  }

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

  // --- HEADER: kop standar (logo + garis) ATAU tata letak formulir (mis. Model N7) ---
  var headerHTML;
  if (tpl.formLayout) {
    headerHTML =
      '<div class="lampiran-ref">' + (tpl.lampiranRef || []).map(esc).join('<br />') + '</div>' +
      '<div class="form-title">' + esc(tpl.judulFormulir || '') + '</div>' +
      (tpl.modelKode ? '<div class="model-kode">' + esc(tpl.modelKode) + '</div>' : '') +
      '<div class="kop-plain">' +
        (tpl.kopBaris || []).map(function (t) { return '<div>' + esc(t) + '</div>'; }).join('') +
      '</div>';
  } else {
    headerHTML = '<div class="kop">' + kopHTML + '</div>' +
      '<hr class="kop-rule" /><hr class="kop-rule thin" />';
  }

  // --- JUDUL di tengah + nomor di bawahnya (mis. Surat Keterangan BIMWIN) ---
  // Bila dipakai, nomor tidak lagi ditampilkan sebagai baris meta di kiri atas.
  var judulHTML = '';
  if (tpl.judulSurat) {
    judulHTML = '<div class="judul-surat">' + esc(tpl.judulSurat) + '</div>' +
      (data.nomor ? '<div class="judul-nomor">Nomor : ' + esc(data.nomor) + '</div>' : '');
  }

  // --- META: tanggal & nomor (+ baris meta tambahan: Lampiran/Perihal dll.) ---
  var tglTeks = (tpl.tanggalTanpaKota ? '' : (kop.kota ? kop.kota + ', ' : '')) +
    KUAUtil.tglIndo(data.tanggal);
  // tanggalDiTtd -> tanggal muncul di atas blok tanda tangan, bukan di kanan atas.
  var metaHTML = tpl.tanggalDiTtd ? '' : '<div class="tgl">' + esc(tglTeks) + '</div>';
  var hasMetaRows = tpl.metaRows && tpl.metaRows.length;
  if (tpl.nomor !== false && !tpl.judulSurat && (data.nomor || hasMetaRows)) {
    var metaRowsHTML = '';
    if (data.nomor) metaRowsHTML += metaRow('Nomor', data.nomor);
    if (hasMetaRows) {
      tpl.metaRows.forEach(function (r) { metaRowsHTML += metaRow(r.label, val(r.value)); });
    }
    metaHTML += '<table class="nomor">' + metaRowsHTML + '</table>';
  }

  // --- Tujuan (tiap baris boleh berupa fungsi data) ---
  var tujuanHTML = '';
  if (tpl.tujuan && tpl.tujuan.length) {
    tujuanHTML = '<div class="tujuan">' +
      tpl.tujuan.map(function (line) { return esc(val(line)); }).join('<br />') + '</div>';
  }

  // --- Salam ---
  var salamHTML = tpl.salam ? '<div class="salam">Assalamu\'alaikum Wr. Wb.</div>' : '';

  // --- Pembuka (boleh banyak paragraf; tiap paragraf boleh fungsi data) ---
  var pembukaHTML = '';
  if (tpl.pembuka) {
    (Array.isArray(tpl.pembuka) ? tpl.pembuka : [tpl.pembuka]).forEach(function (p) {
      pembukaHTML += '<p class="pembuka">' + esc(val(p)) + '</p>';
    });
  }

  // --- Checklist: blok pilihan berkotak centang (□) + daftar bernomor ---
  // Daftar diambil dari field tipe 'list' (data[listKey], dipisah baris-baru) atau
  // dari fungsi blk.items(d). Hanya item terisi yang ditampilkan.
  var checklistHTML = '';
  if (tpl.checklist && tpl.checklist.length) {
    tpl.checklist.forEach(function (blk) {
      var items = [];
      if (blk.listKey && data[blk.listKey]) {
        items = data[blk.listKey].split('\n').filter(function (x) { return x; });
      } else if (typeof blk.items === 'function') {
        items = blk.items(data) || [];
      }
      if (!items.length) return;   // blok tanpa isi tidak ditampilkan
      // Blok yang tampil pasti terisi -> kotak otomatis tercentang (☑).
      checklistHTML += '<div class="check-block">' +
        '<div class="check-head"><span class="check-box">☑</span>' +
        '<span>' + esc(val(blk.heading)) + '</span></div>' +
        '<ol class="syarat">' +
          items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ol>' +
        '</div>';
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
      } else if (row.text != null) {
        // Baris kalimat biasa (tidak tebal) di antara dua tabel data,
        // mis. "Menerangkan dengan sesungguhnya bahwa calon suami :"
        flush();
        dataHTML += '<p class="data-text">' + esc(val(row.text)) + '</p>';
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
  // Urutan: penanda tangan paksaan template -> pilihan form (Kepala/Plh) -> default config.
  var ttd = tpl.ttd || KUAUtil.ttdAktif(data);
  var ttdHTML = '<div class="ttd"><div class="block">' +
    (tpl.wassalam ? '<div class="wassalam">Wassalam,</div>' : '') +
    (tpl.tanggalDiTtd ? '<div class="ttd-tgl">' + esc(tglTeks) + '</div>' : '') +
    (ttd.jabatan || []).map(esc).join('<br />') +
    '<div class="space"></div>' +
    '<span class="nama">' + esc(ttd.nama) + '</span><br />' +
    esc(ttd.nip) +
    '</div></div>';

  // Mode ringkas untuk surat panjang (agar muat 1 halaman)
  if (tpl.compact) document.getElementById('page').classList.add('compact');

  // --- Rakit halaman ---
  document.getElementById('page').innerHTML =
    headerHTML +
    (metaHTML ? '<div class="meta">' + metaHTML + '</div>' : '') +
    judulHTML +
    tujuanHTML + salamHTML + pembukaHTML + dataHTML + checklistHTML + isiHTML + penutupHTML + ttdHTML;

  // Judul tab -> nama file PDF default rapi
  document.title = tpl.nama + (data.nama ? ' - ' + data.nama : '');

  // Otomatis buka dialog cetak (beri jeda agar logo/render selesai)
  window.addEventListener('load', function () {
    setTimeout(function () { window.print(); }, 400);
  });
})();
