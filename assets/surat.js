/*
 * Renderer halaman surat: susun surat dari template + data + config.
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
 *
 * surat.html dipakai dengan dua cara:
 *  - MANDIRI  : surat.html?__t=...&nama=...  (HP/tablet, atau tautan langsung).
 *               Data dibaca dari URL. Staf memeriksa surat, lalu menekan "Cetak".
 *  - TERTANAM : surat.html?embed=1 di dalam iframe pratinjau index.html (layar lebar).
 *               Data dikirim lewat postMessage setiap kali form berubah:
 *                 {kua:'render', data, fokus, keAtas} -> gambar ulang surat (fokus = kunci kolom
 *                                          aktif; keAtas = surat baru/dikosongkan -> gulir ke kop)
 *                 {kua:'fokus', fokus}  -> gulir & sorot bagian surat milik kolom aktif
 *                 {kua:'zoom', mode}    -> 'halaman' (satu halaman utuh) | 'lebar'
 *                 {kua:'print', data}   -> gambar ulang, lalu cetak isi iframe
 *               Balasan ke halaman induk:
 *                 {kua:'ready'}, {kua:'info', title, lebih, kertas}, {kua:'afterprint'}
 *               (kertas = 'A4' | 'F4'; induk menampilkan pemberitahuan & pengingat F4)
 *               Dipakai postMessage (bukan akses langsung ke iframe) agar tetap
 *               berjalan saat index.html dibuka dari file:// (dobel-klik).
 */
(function () {
  var CONFIG = window.KUA_CONFIG;
  var TEMPLATES = window.KUA_TEMPLATES;
  var esc = KUAUtil.esc;
  var nl2br = KUAUtil.nl2br;

  var MM = 96 / 25.4;   // 1 mm dalam piksel CSS
  // Ukuran kertas (mm). Bawaan A4. Template ber-`kertasF4BilaTumpah` pindah ke F4 / Folio
  // HANYA bila isinya tidak muat 1 halaman A4 — huruf tidak pernah dikecilkan.
  var KERTAS = { A4: { lebar: 210, tinggi: 297 }, F4: { lebar: 215, tinggi: 330 } };
  // Ruang tepi atas (halaman 1) + bawah saat dicetak (lihat @page di surat.css), jadi
  // tinggi area isi halaman 1 = tinggi kertas - nilai ini:
  //   surat biasa : 12 + 25 = 37 mm  -> A4 260 mm, F4 293 mm
  //   formulir    : 18 + 18 = 36 mm  -> A4 261 mm
  var TEPI_ATAS_BAWAH = { biasa: 37, formulir: 36 };

  function metaRow(label, value) {
    return '<tr><td class="label">' + esc(label) + '</td><td class="sep">:</td><td>' + esc(value) + '</td></tr>';
  }
  // Tabel label : nilai sederhana, mis. identitas saksi pada blok tanda tangan.
  function tabel(rows, cls) {
    return '<table class="data' + (cls ? ' ' + cls : '') + '">' + rows.map(function (r) {
      return '<tr><td class="label">' + esc(r[0]) + '</td><td class="sep">:</td><td>' + nl2br(r[1]) + '</td></tr>';
    }).join('') + '</table>';
  }

  // --- KOP (logo di kiri, teks di tengah) — sama untuk semua surat ---
  var kop = CONFIG.kop;
  var logoImg = kop.logo
    ? '<img class="logo" src="' + esc(kop.logo) + '" alt="" onerror="this.style.visibility=\'hidden\'" />'
    : '';
  var kopTeks = '';
  (kop.baris || []).forEach(function (b) {
    kopTeks += '<div class="' + (b.ukuran || 'h2') + '">' + esc(b.teks) + '</div>';
  });
  if (kop.alamat && kop.alamat.length) {
    kopTeks += '<div class="alamat">' + kop.alamat.map(esc).join('<br />') + '</div>';
  }
  // PMA 12/2026: satu garis di bawah kop.
  var KOP_HTML = '<div class="kop"><div class="logo-slot">' + logoImg + '</div>' +
    '<div class="kop-text">' + kopTeks + '</div></div><hr class="kop-rule" />';

  /*
   * Susun HTML surat dari data. Dipanggil ulang setiap kali data berubah, jadi
   * tidak boleh punya efek samping. Mengembalikan:
   *   { html, cls (kelas .page), formulir, title (judul tab / nama file PDF) }
   */
  function build(data) {
    var tpl = TEMPLATES.filter(function (t) { return t.id === data.__t; })[0] || TEMPLATES[0];
    var formulir = !!tpl.formLayout;    // bentuk formulir (N7)
    var berjudul = !!tpl.jenisNaskah;   // surat keterangan / rekomendasi / ikrar

    function val(v) { return typeof v === 'function' ? v(data) : v; }

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
      headerHTML = KOP_HTML;
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
    // Kelas nama-pejabat = nama Kepala/Plh, selalu satu baris (lihat surat.css).
    function namaHTML(t) {
      var nip = KUAUtil.nipSaja(t.nip);
      if (formulir) {
        return '<span class="nama nama-pejabat nama-lama">' + esc(t.nama) + '</span>' + (nip ? '<br />NIP. ' + esc(nip) : '');
      }
      return '<span class="nama nama-pejabat">' + esc(t.nama) + '</span>' + (t.nipDiTtd && nip ? '<br />NIP: ' + esc(nip) : '');
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

    // Judul tab -> nama file PDF default rapi
    var subjek = data.nama || data.namaWali || data.namaMasjid || data.namaSuami || '';

    return {
      html: headerHTML + metaHTML + judulHTML + tujuanHTML + salamHTML + konsHTML +
        pembukaHTML + dataHTML + checklistHTML + isiHTML + penutupHTML + ttdHTML,
      cls: 'page' +
        (formulir ? ' formulir' : '') +
        (tpl.compact ? ' compact' : '') +      // spasi diringkas agar muat 1 halaman
        (tpl.hurufKecil ? ' kecil' : ''),      // huruf 11 pt (khusus formulir panjang)
      formulir: formulir,
      kertasF4BilaTumpah: !!tpl.kertasF4BilaTumpah,
      title: tpl.nama + (subjek ? ' - ' + subjek : '')
    };
  }

  // ------------------------------------------------------------------------
  //  Tampilan di layar
  // ------------------------------------------------------------------------
  var docEl = document.documentElement;
  var sheetEl = document.getElementById('sheet');
  var pageEl = document.getElementById('page');
  var embed = new URLSearchParams(window.location.search).get('embed') === '1';
  var zoomMode = 'lebar';   // bawaan "Pas lebar"; panel pratinjau bisa mengganti ke 'halaman'
  var hasil = null;   // hasil build() terakhir
  var dataTerakhir = {};   // data render terakhir (untuk mencari posisi kolom yang sedang diisi)
  var kertas = 'A4';  // ukuran kertas surat yang sedang tampil: 'A4' | 'F4'

  if (embed) docEl.classList.add('embed');

  // Ukuran kertas cetak: @page di surat.css = A4; untuk F4 ditimpa oleh gaya ini
  // (dipasang setelah surat.css, jadi menang). Lembar layar ikut lewat kelas .f4.
  var gayaKertas = document.createElement('style');
  document.head.appendChild(gayaKertas);
  function pasangKertas(k) {
    kertas = k;
    pageEl.classList.toggle('f4', k === 'F4');
    gayaKertas.textContent = k === 'A4' ? '' :
      '@media print { @page { size: ' + KERTAS[k].lebar + 'mm ' + KERTAS[k].tinggi + 'mm; } }';
  }

  // Posisi akhir area isi halaman 1 (px dari atas lembar). Diukur dari tata letak
  // layar, yang lebarnya sama dengan hasil cetak (skala layar tidak memengaruhi offset*).
  function batasHal1(formulir) {
    var padTop = parseFloat(window.getComputedStyle(pageEl).paddingTop) || 0;
    var tepi = formulir ? TEPI_ATAS_BAWAH.formulir : TEPI_ATAS_BAWAH.biasa;
    return padTop + (KERTAS[kertas].tinggi - tepi) * MM;
  }
  function lewatHal1(formulir) {
    var bawah = 0;
    for (var el = pageEl.firstElementChild; el; el = el.nextElementSibling) {
      bawah = Math.max(bawah, el.offsetTop + el.offsetHeight);
    }
    return bawah > batasHal1(formulir) + 1;
  }

  // Bila isi surat melewati halaman 1, beri garis putus-putus di titik akhir
  // halaman 1. Mengembalikan true bila surat lebih dari 1 halaman.
  function tandaiBatasHalaman(formulir) {
    if (!lewatHal1(formulir)) return false;
    var garis = document.createElement('div');
    garis.className = 'batas-halaman';
    garis.style.top = batasHal1(formulir) + 'px';
    garis.innerHTML = '<span>Batas halaman 1. Bagian di bawah garis ini tercetak di halaman 2</span>';
    pageEl.appendChild(garis);
    return true;
  }

  // Perkecil/perbesar lembar agar pas di layar. Tata letak surat tetap dihitung pada
  // ukuran asli kertas (210/215 mm) lalu diskalakan, jadi pemenggalan baris sama dengan hasil cetak.
  function fit() {
    function terapkan(lebarLayar) {
      var gutter = embed ? 24 : (lebarLayar < 600 ? 10 : 18);
      var w = pageEl.offsetWidth, h = pageEl.offsetHeight;
      var s = (lebarLayar - 2 * gutter) / w;
      if (zoomMode === 'halaman') s = Math.min(s, (window.innerHeight - 2 * gutter) / (KERTAS[kertas].tinggi * MM));
      s = Math.max(0.2, Math.min(s, embed ? 1.3 : 1));
      pageEl.style.transform = s === 1 ? '' : 'scale(' + s + ')';
      sheetEl.style.width = (w * s) + 'px';
      sheetEl.style.height = (h * s) + 'px';
      sheetEl.style.margin = gutter + 'px auto';
    }
    var cw = docEl.clientWidth;
    terapkan(cw);
    // Bila bilah gulir baru muncul/hilang, lebar layar berubah -> hitung sekali lagi.
    if (docEl.clientWidth !== cw) terapkan(docEl.clientWidth);
  }

  // ------------------------------------------------------------------------
  //  Ikuti kolom yang sedang diisi (panel pratinjau layar lebar)
  //  Pratinjau bergulir ke bagian surat tempat nilai kolom aktif tampil, dan bagian itu
  //  disorot tipis (CSS Custom Highlight; hanya di layar, tidak ikut tercetak).
  //  Berlaku otomatis untuk SEMUA template, tanpa penanda khusus di templates.js:
  //   - kolom teks/daftar: surat dibangun sekali lagi (tidak ditampilkan) dengan penanda
  //     tak terlihat di awal & akhir nilainya -> posisi penanda = posisi nilai di surat;
  //   - tanggal & pilihan berkode (nilainya diolah template): surat dibangun dengan nilai
  //     lain -> karakter pertama yang berbeda = posisi nilai di surat.
  // ------------------------------------------------------------------------
  var PENANDA_AWAL = '⁣', PENANDA_AKHIR = '⁤';   // karakter format tak terlihat
  var FIELDS = window.KUA_FIELDS || {};
  var dukungSorot = !!(window.CSS && CSS.highlights && window.Highlight);
  var mqKurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)');

  function teksDari(html) {
    var t = document.createElement('template');   // template: gambar tidak ikut dimuat
    t.innerHTML = html;
    return t.content.textContent;
  }
  function salin(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

  // Nilai pembanding untuk kolom yang teksnya diolah template: setiap bagiannya dibuat
  // berbeda dari nilai asli, agar perbedaan pertama jatuh tepat di awal nilai itu.
  function nilaiPembanding(def, v) {
    if (def.type === 'date') {
      var p = String(v || '').split('-');
      var y = +p[0] || 2000, m = +p[1] || 1, d = +p[2] || 1;
      return (String(y).slice(-1) === '9' ? 1988 : 1999) + '-' + (m === 2 ? '03' : '02') + '-' +
        (String(d).charAt(0) === '2' ? '13' : '28');
    }
    if (def.type === 'select') {
      var opsi = (def.options || []).map(function (o) { return (o && o.value != null) ? o.value : o; });
      for (var i = 0; i < opsi.length; i++) if (String(opsi[i]) !== String(v || '')) return opsi[i];
    }
    return null;
  }

  // Daftar rentang {awal, akhir, sampaiAkhirNode} pada teks surat tempat nilai `key` tampil.
  function rentangKolom(data, key) {
    var def = FIELDS[key];
    if (!def || !hasil) return [];
    try {
      if (def.type !== 'date') {
        var dp = salin(data);
        dp[key] = PENANDA_AWAL + (data[key] || '') + PENANDA_AKHIR;
        var t = teksDari(build(dp).html), out = [], dilewati = 0, awal = -1;
        for (var i = 0; i < t.length; i++) {
          var ch = t.charAt(i);
          if (ch === PENANDA_AWAL) { awal = i - dilewati; dilewati++; }
          else if (ch === PENANDA_AKHIR) {
            if (awal >= 0) out.push({ awal: awal, akhir: i - dilewati });
            awal = -1; dilewati++;
          }
        }
        if (awal >= 0) out.push({ awal: awal, akhir: awal });
        if (out.length) return out;
      }
      var lain = nilaiPembanding(def, data[key]);
      if (lain == null) return [];
      var dl = salin(data); dl[key] = lain;
      var a = teksDari(hasil.html), b = teksDari(build(dl).html), s = 0;
      while (s < a.length && s < b.length && a.charAt(s) === b.charAt(s)) s++;
      if (s >= a.length && s >= b.length) return [];
      return [{ awal: s, akhir: s, sampaiAkhirNode: true }];   // diperluas ke awal kata di ikutiFokus
    } catch (err) {
      return [];   // data setengah jadi: lewati saja
    }
  }

  // Posisi karakter ke-n pada teks surat -> {node, off} (teks garis batas halaman dilewati).
  function titik(n, condongMaju) {
    var w = document.createTreeWalker(pageEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (nd) {
        return nd.parentElement && nd.parentElement.closest('.batas-halaman') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var acc = 0, nd, terakhir = null;
    while ((nd = w.nextNode())) {
      var len = nd.nodeValue.length;
      if (n < acc + len || (n === acc + len && !condongMaju)) return { node: nd, off: n - acc };
      acc += len; terakhir = nd;
    }
    return terakhir ? { node: terakhir, off: terakhir.nodeValue.length } : null;
  }

  // Rentang teks -> Range DOM. Perluasan & label dibatasi di dalam satu node teks, karena
  // teks antar-elemen (mis. "kasih." lalu "Kepala") bersambung tanpa spasi.
  // Kolom yang masih kosong belum punya teks untuk disorot. Sorot penggantinya: label baris
  // tabelnya (mis. "Tipologi"), atau kata tepat sebelum tempat nilainya di kalimat (mis. "bernama").
  function sorotPengganti(rg, a) {
    var tr = a.node.parentElement && a.node.parentElement.closest('tr');
    var label = tr && tr.querySelector('td');
    if (label && label.textContent.trim()) { rg.selectNodeContents(label); return; }
    var t = a.node.nodeValue, e = a.off;
    while (e > 0 && /\s/.test(t.charAt(e - 1))) e--;
    var s = e;
    while (s > 0 && !/\s/.test(t.charAt(s - 1))) s--;
    if (s < e) { rg.setStart(a.node, s); rg.setEnd(a.node, e); }
  }

  function rangeDari(r, kosong) {
    var a = titik(r.awal, !kosong);   // kolom kosong: tetap di baris sebelumnya, bukan baris berikut
    if (!a) return null;
    var rg = document.createRange();
    rg.setStart(a.node, a.off); rg.setEnd(a.node, a.off);
    if (r.sampaiAkhirNode) {           // tanggal / pilihan: dari awal kata sampai akhir baris teksnya
      if (kosong) { sorotPengganti(rg, a); return rg; }
      var t = a.node.nodeValue, off = a.off;
      while (off > 0 && !/\s/.test(t.charAt(off - 1))) off--;
      rg.setStart(a.node, off); rg.setEnd(a.node, t.length);
      return rg;
    }
    var b = titik(r.akhir, false);
    if (!b) return null;
    rg.setEnd(b.node, b.off);
    if (rg.collapsed) sorotPengganti(rg, a);
    return rg;
  }

  // Gulir halus sendiri (bukan behavior:'smooth' bawaan) agar bisa dibatalkan dengan pasti:
  // gulir bawaan yang masih berjalan tidak selalu berhenti oleh scrollTo berikutnya.
  var animGulir = 0;
  function batalGulir() { if (animGulir) { cancelAnimationFrame(animGulir); animGulir = 0; } }
  function gulirKe(y, halus) {
    batalGulir();
    var maks = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    y = Math.max(0, Math.min(y, maks));
    var y0 = window.pageYOffset, dy = y - y0;
    if (!halus || Math.abs(dy) < 1) { window.scrollTo(0, y); return; }
    var t0 = null, DURASI = 280;
    function langkah(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DURASI);
      window.scrollTo(0, y0 + dy * (1 - Math.pow(1 - p, 4)));   // ease-out: cepat di awal, halus di akhir
      animGulir = p < 1 ? requestAnimationFrame(langkah) : 0;
    }
    animGulir = requestAnimationFrame(langkah);
  }
  // Pengguna menggulir sendiri -> gulir otomatis berhenti, tidak "berebut".
  window.addEventListener('wheel', batalGulir, { passive: true });
  window.addEventListener('touchstart', batalGulir, { passive: true });

  function ikutiFokus(key) {
    if (dukungSorot) CSS.highlights.delete('kua-fokus');
    if (!key || !hasil) return;
    var kosong = !String(dataTerakhir[key] || '').trim();
    var ranges = [];
    rentangKolom(dataTerakhir, key).forEach(function (r) {
      try { var rg = rangeDari(r, kosong); if (rg) ranges.push(rg); } catch (e) { /* lewati */ }
    });
    if (!ranges.length) return;
    var isi = ranges.filter(function (rg) { return !rg.collapsed && rg.toString().trim(); });
    if (dukungSorot && isi.length) CSS.highlights.set('kua-fokus', new Highlight(isi[0]));   // sorot kemunculan pertama
    // Gulir hanya bila bagian itu belum terlihat nyaman (tidak melompat-lompat saat mengetik).
    var rc = ranges[0].getClientRects()[0] || ranges[0].startContainer.parentElement.getBoundingClientRect();
    var tepi = 48;
    if (rc.top < tepi || rc.bottom > window.innerHeight - tepi) {
      gulirKe(window.pageYOffset + rc.top - window.innerHeight * 0.3, !mqKurangiGerak.matches);
    }
  }

  function render(data, fokus, keAtas) {
    try {
      hasil = build(data || {});
    } catch (err) {
      // Data setengah jadi saat mengetik tidak boleh merusak pratinjau: tampilkan yang terakhir.
      if (window.console) console.error(err);
      return hasil;
    }
    pageEl.className = hasil.cls;
    pageEl.innerHTML = hasil.html;
    // Selalu dicoba di A4 dulu. Bila isinya tidak muat 1 halaman A4, kertas diganti ke
    // F4 (huruf tetap). Bila data dipendekkan lagi, otomatis kembali ke A4.
    pasangKertas('A4');
    if (hasil.kertasF4BilaTumpah && lewatHal1(hasil.formulir)) pasangKertas('F4');
    document.title = hasil.title;
    var lebih = tandaiBatasHalaman(hasil.formulir);
    fit();
    if (embed) {
      window.parent.postMessage({ kua: 'info', title: hasil.title, lebih: lebih, kertas: kertas }, '*');
    } else {
      var info = document.getElementById('tbInfo');
      if (info) info.classList.toggle('show', lebih);
      docEl.classList.toggle('kertas-f4', kertas === 'F4');   // badge + keterangan F4 di toolbar
    }
    dataTerakhir = data || {};
    if (keAtas) gulirKe(0, false);   // ganti jenis surat / form dikosongkan: langsung ke kop
    ikutiFokus(fokus);   // tanpa fokus (mis. saat cetak) -> sorotan dihapus
    return hasil;
  }

  window.addEventListener('resize', fit);

  if (embed) {
    window.addEventListener('message', function (e) {
      if (e.source !== window.parent) return;
      var m = e.data || {};
      if (m.kua === 'render') {
        render(m.data, m.fokus, m.keAtas);
      } else if (m.kua === 'fokus') {
        ikutiFokus(m.fokus);   // pindah kolom tanpa mengubah isi
      } else if (m.kua === 'zoom') {
        zoomMode = m.mode === 'lebar' ? 'lebar' : 'halaman';
        fit();
      } else if (m.kua === 'print') {
        render(m.data);
        window.print();
      }
    });
    window.addEventListener('afterprint', function () {
      window.parent.postMessage({ kua: 'afterprint' }, '*');
    });
    window.parent.postMessage({ kua: 'ready' }, '*');
  } else {
    // Mandiri: data dari URL. Dialog cetak TIDAK dibuka otomatis — staf memeriksa
    // surat dulu (penting di HP), lalu menekan "Cetak / Simpan PDF".
    var data = {};
    new URLSearchParams(window.location.search).forEach(function (v, k) { data[k] = v; });
    render(data);

    document.getElementById('btnCetak').addEventListener('click', function () {
      // Kertas F4: ingatkan staf menyiapkan kertas F4 sebelum dialog cetak terbuka.
      if (kertas === 'F4') KUAUtil.konfirmasiF4(function () { window.print(); });
      else window.print();
    });
    document.getElementById('btnKembali').addEventListener('click', function () {
      // Tab ini dibuka oleh form -> tutup agar kembali ke form (isian masih utuh).
      // Bila dibuka langsung (tidak bisa ditutup skrip), arahkan ke halaman form.
      window.close();
      setTimeout(function () { if (!window.closed) window.location.href = 'index.html'; }, 300);
    });
  }
})();
