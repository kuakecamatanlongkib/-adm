/*
 * Renderer halaman surat: ambil data dari URL, render sesuai template + config.
 *
 * Tata letak mengikuti PMA Nomor 12 Tahun 2026 tentang Tata Naskah Dinas pada
 * Kementerian Agama. Ada tiga bentuk:
 *  1. Surat dinas (bawaan)  : Nomor/Sifat/Lampiran/Hal di kiri, tempat-tanggal di
 *                             kanan sebaris Nomor, lalu "Yth." dan isi surat.
 *  2. Naskah berjudul        : template dengan `jenisNaskah` (Surat Keterangan,
 *                             Rekomendasi, Ikrar) -> judul + NOMOR di tengah,
 *                             tempat-tanggal di atas jabatan penanda tangan.
 *  3. Formulir (formLayout)  : mis. Model N7 — mengikuti bentuk formulirnya sendiri
 *                             (Kepdirjen Bimas Islam 473/2020), tidak diubah.
 */
(function () {
  var CONFIG = window.KUA_CONFIG;
  var TEMPLATES = window.KUA_TEMPLATES;
  var esc = KUAUtil.esc;
  var nl2br = KUAUtil.nl2br;

  var q = new URLSearchParams(window.location.search);
  var data = {};
  q.forEach(function (v, k) { data[k] = v; });

  var tpl = TEMPLATES.filter(function (t) { return t.id === data.__t; })[0] || TEMPLATES[0];
  var formulir = !!tpl.formLayout;    // bentuk formulir (N7)
  var berjudul = !!tpl.jenisNaskah;   // surat keterangan / rekomendasi / ikrar

  function val(v) { return typeof v === 'function' ? v(data) : v; }
  function metaRow(label, value) {
    return '<tr><td class="label">' + esc(label) + '</td><td class="sep">:</td><td>' + esc(value) + '</td></tr>';
  }
  // Tabel label : nilai sederhana, mis. identitas saksi pada blok tanda tangan.
  function tabel(rows, cls) {
    return '<table class="data' + (cls ? ' ' + cls : '') + '">' + rows.map(function (r) {
      return '<tr><td class="label">' + esc(r[0]) + '</td><td class="sep">:</td><td>' + nl2br(r[1]) + '</td></tr>';
    }).join('') + '</table>';
  }

  // --- KOP (logo di kiri, teks di tengah) ---
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

  var headerHTML;
  if (formulir) {
    headerHTML =
      '<div class="lampiran-ref">' + (tpl.lampiranRef || []).map(esc).join('<br />') + '</div>' +
      '<div class="form-title">' + esc(tpl.judulFormulir || '') + '</div>' +
      (tpl.modelKode ? '<div class="model-kode">' + esc(tpl.modelKode) + '</div>' : '') +
      '<div class="kop-plain">' +
        (tpl.kopBaris || []).map(function (t) { return '<div>' + esc(t) + '</div>'; }).join('') +
      '</div>';
  } else {
    // PMA 12/2026: satu garis di bawah kop.
    headerHTML = '<div class="kop"><div class="logo-slot">' + logoImg + '</div>' +
      '<div class="kop-text">' + teks + '</div></div><hr class="kop-rule" />';
  }

  // --- JUDUL naskah berjudul: jenis (tebal), judul, lalu NOMOR, semuanya di tengah ---
  var judulHTML = '';
  if (berjudul) {
    var sub = val(tpl.judulSurat);
    judulHTML = '<div class="judul">' +
      '<div class="judul-jenis">' + esc(tpl.jenisNaskah) + '</div>' +
      (sub ? '<div class="judul-sub">' + esc(sub) + '</div>' : '') +
      (data.nomor ? '<div class="judul-nomor">NOMOR: ' + esc(data.nomor) + '</div>' : '') +
      '</div>';
  }

  // --- Tempat & tanggal ---
  var tglTeks = (tpl.tanggalTanpaKota ? '' : (kop.kota ? kop.kota + ', ' : '')) +
    KUAUtil.tglIndo(data.tanggal);

  // --- META ---
  var metaHTML = '';
  if (formulir) {
    // Bentuk lama formulir: tanggal di kanan atas, lalu Nomor + baris meta tambahan.
    var fRows = data.nomor ? metaRow('Nomor', data.nomor) : '';
    (tpl.metaRows || []).forEach(function (r) { fRows += metaRow(r.label, val(r.value)); });
    metaHTML = '<div class="meta"><div class="tgl">' + esc(tglTeks) + '</div>' +
      (fRows ? '<table class="nomor">' + fRows + '</table>' : '') + '</div>';
  } else if (!berjudul) {
    // Surat dinas: Nomor/Sifat/Lampiran/Hal di kiri, tempat-tanggal di kanan sebaris Nomor.
    // Baris di bawah Nomor memakai lebar penuh (colspan) agar "Hal" tidak terlipat sempit.
    var lebar = function (label, value) {
      return '<tr><td class="label">' + esc(label) + '</td><td class="sep">:</td>' +
        '<td colspan="2">' + esc(value) + '</td></tr>';
    };
    metaHTML = '<table class="nomor meta-dinas">' +
      '<tr><td class="label">Nomor</td><td class="sep">:</td><td>' + esc(data.nomor || '') + '</td>' +
        '<td class="tgl">' + esc(tglTeks) + '</td></tr>' +
      lebar('Sifat', val(tpl.sifat) || 'Biasa') +
      lebar('Lampiran', val(tpl.lampiran) || '-') +
      lebar('Hal', val(tpl.hal) || '') +
      '</table>';
  }

  // --- Tujuan ---
  // `yth`  : bentuk PMA ("Yth." + nama jabatan, baris "di ..." di bawahnya).
  // `tujuan`: bentuk lama baris-per-baris (dipakai formulir N7).
  var tujuanHTML = '';
  if (tpl.yth && tpl.yth.length) {
    tujuanHTML = '<div class="yth"><span class="yth-label">Yth.</span><div class="yth-isi">' +
      tpl.yth.map(function (line) { return esc(val(line)); }).join('<br />') + '</div></div>';
  } else if (tpl.tujuan && tpl.tujuan.length) {
    tujuanHTML = '<div class="tujuan">' +
      tpl.tujuan.map(function (line) { return esc(val(line)); }).join('<br />') + '</div>';
  }

  var salamHTML = tpl.salam ? '<div class="salam">Assalamu\'alaikum Wr. Wb.</div>' : '';

  // --- Dasar / Menimbang (rekomendasi): label : daftar bernomor 1. 2. / a. b. ---
  // Butir kosong dibuang; tanda baca akhir dirapikan (";" lalu "." pada butir terakhir).
  var konsHTML = '';
  (tpl.konsiderans || []).forEach(function (k) {
    var items = (val(k.items) || []).map(function (s) {
      return String(s || '').trim().replace(/[;.,]+$/, '');
    }).filter(function (s) { return s; });
    if (!items.length) return;
    var lis = items.map(function (s, i) {
      return '<li>' + esc(s + (i === items.length - 1 ? '.' : ';')) + '</li>';
    }).join('');
    konsHTML += '<table class="konsiderans"><tr>' +
      '<td class="label">' + esc(k.label) + '</td><td class="sep">:</td>' +
      '<td><ol class="butir"' + (k.gaya === 'huruf' ? ' type="a"' : '') + '>' + lis + '</ol></td>' +
      '</tr></table>';
  });

  // --- Pembuka (boleh banyak paragraf). Pada surat dinas, alinea pembuka menjorok. ---
  var pembukaHTML = '';
  if (tpl.pembuka) {
    var clsPembuka = 'pembuka' + (!berjudul && !formulir ? ' indent' : '');
    (Array.isArray(tpl.pembuka) ? tpl.pembuka : [tpl.pembuka]).forEach(function (p) {
      pembukaHTML += '<p class="' + clsPembuka + '">' + esc(val(p)) + '</p>';
    });
  }

  // --- Checklist: blok pilihan berkotak centang + daftar bernomor (formulir N7) ---
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
      checklistHTML += '<div class="check-block">' +
        '<div class="check-head"><span class="check-box">☑</span>' +
        '<span>' + esc(val(blk.heading)) + '</span></div>' +
        '<ol class="syarat">' +
          items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ol>' +
        '</div>';
    });
  }

  // --- Tabel data (mendukung {heading}, {text, indent}, {gap}) ---
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
        flush();
        dataHTML += '<p class="data-text' + (row.indent ? ' indent' : '') + '">' + esc(val(row.text)) + '</p>';
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

  // --- Isi (boleh banyak paragraf; tiap paragraf string, fungsi, atau {text, cls}) ---
  var isiHTML = '';
  if (tpl.isi) {
    (Array.isArray(tpl.isi) ? tpl.isi : [tpl.isi]).forEach(function (p) {
      var o = (p && typeof p === 'object') ? p : { text: p };
      isiHTML += '<p class="isi' + (o.cls ? ' ' + o.cls : '') + '">' + esc(val(o.text)) + '</p>';
    });
  }
  var penutupHTML = tpl.penutup ? '<p class="penutup">' + esc(val(tpl.penutup)) + '</p>' : '';

  // --- Tanda tangan ---
  // Urutan: penanda tangan paksaan template -> pilihan form (Kepala/Plh) -> default config.
  var ttd = tpl.ttd || KUAUtil.ttdAktif(data);

  // PMA: nama jabatan diakhiri koma (formulir N7 tetap bentuk lamanya).
  function jabatanHTML(t) {
    var lines = (t.jabatan || []).slice();
    if (!formulir && lines.length) lines[lines.length - 1] += ',';
    return lines.map(esc).join('<br />');
  }
  // PMA: nama lengkap tanpa gelar, huruf awal kapital; NIP hanya bila nipDiTtd (Plh).
  function namaHTML(t) {
    var nip = KUAUtil.nipSaja(t.nip);
    if (formulir) {
      return '<span class="nama nama-lama">' + esc(t.nama) + '</span>' + (nip ? '<br />NIP. ' + esc(nip) : '');
    }
    return '<span class="nama">' + esc(t.nama) + '</span>' + (t.nipDiTtd && nip ? '<br />NIP: ' + esc(nip) : '');
  }

  var ttdHTML;
  if (typeof tpl.ttdHTML === 'function') {
    // Tata letak tanda tangan khusus (mis. ikrar taukil wali: Kepala KUA, wali & saksi).
    ttdHTML = tpl.ttdHTML(data, {
      esc: esc, nl2br: nl2br, tabel: tabel, tglTeks: tglTeks, ttd: ttd,
      jabatanHTML: jabatanHTML, namaHTML: namaHTML
    });
  } else {
    ttdHTML = '<div class="ttd"><div class="block">' +
      (tpl.wassalam ? '<div class="wassalam">Wassalam,</div>' : '') +
      (tpl.tanggalDiTtd ? '<div class="ttd-tgl">' + esc(tglTeks) + '</div>' : '') +
      jabatanHTML(ttd) +
      '<div class="space"></div>' +
      namaHTML(ttd) +
      '</div></div>';
  }

  var page = document.getElementById('page');
  if (formulir) page.classList.add('formulir');
  if (tpl.compact) page.classList.add('compact');     // spasi diringkas agar muat 1 halaman
  if (tpl.hurufKecil) page.classList.add('kecil');    // huruf 11 pt (khusus formulir panjang)

  // --- Rakit halaman ---
  page.innerHTML =
    headerHTML + metaHTML + judulHTML + tujuanHTML + salamHTML + konsHTML +
    pembukaHTML + dataHTML + checklistHTML + isiHTML + penutupHTML + ttdHTML;

  // Judul tab -> nama file PDF default rapi
  var subjek = data.nama || data.namaWali || data.namaMasjid || data.namaSuami || '';
  document.title = tpl.nama + (subjek ? ' - ' + subjek : '');

  // Otomatis buka dialog cetak (beri jeda agar logo/render selesai)
  window.addEventListener('load', function () {
    setTimeout(function () { window.print(); }, 400);
  });
})();
