/*
 * Logika halaman form: membangun field dari katalog template, validasi,
 * pratinjau langsung, lalu cetak.
 *
 *  - Layar lebar (>= 1024px): pratinjau surat di panel kanan (iframe surat.html?embed=1)
 *    diperbarui setiap kali form berubah. Tombol mencetak isi pratinjau langsung.
 *  - HP / tablet layar sentuh: tombol "Pratinjau Surat" membuka surat di tab baru
 *    (cetak dari iframe di browser HP tidak konsisten), staf memeriksa lalu mencetak.
 */
(function () {
  var FIELDS = window.KUA_FIELDS;
  var TEMPLATES = window.KUA_TEMPLATES;
  var CONFIG = window.KUA_CONFIG;

  var APP_TITLE = CONFIG.appName || 'Surat KUA';
  document.getElementById('appTitle').textContent = APP_TITLE;
  document.title = APP_TITLE;

  var pickerEl = document.getElementById('tplPicker');
  var fieldsEl = document.getElementById('fields');
  var form = document.getElementById('suratForm');

  var currentId = null;   // belum ada surat terpilih sampai staf memilih

  // --- Mode tampilan ---
  var mqLebar = window.matchMedia('(min-width: 1024px)');
  var mqSentuh = window.matchMedia('(pointer: coarse)');
  function modeLebar() { return mqLebar.matches; }                        // ada panel pratinjau
  function cetakDariPratinjau() { return mqLebar.matches && !mqSentuh.matches; }
  function onMediaChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn); else mq.addListener(fn);
  }

  // --- Bangun pemilih template berupa kartu, dikelompokkan per kategori ---
  var groups = {};
  TEMPLATES.forEach(function (t) {
    var k = t.kategori || 'Lainnya';
    (groups[k] = groups[k] || []).push(t);
  });
  function tplName(id) {
    var t = TEMPLATES.filter(function (t) { return t.id === id; })[0];
    return t ? t.nama : 'Pilih Jenis Surat';
  }

  var menuHTML = '';
  Object.keys(groups).forEach(function (kat) {
    menuHTML += '<div class="tpl-cat">' +
      '<div class="tpl-cat-title">' + KUAUtil.esc(kat) + '</div>';
    groups[kat].forEach(function (t) {
      menuHTML += '<button type="button" class="tpl-card' + (t.id === currentId ? ' active' : '') +
        '" data-id="' + KUAUtil.esc(t.id) + '">' +
        '<span class="tpl-card-name">' + KUAUtil.esc(t.nama) + '</span>' +
        (t.deskripsi ? '<span class="tpl-card-desc">' + KUAUtil.esc(t.deskripsi) + '</span>' : '') +
        '</button>';
    });
    menuHTML += '</div>';
  });

  // Pemicu (tertutup) + menu kartu yang muncul saat diklik
  pickerEl.innerHTML =
    '<button type="button" class="tpl-select" id="tplTrigger" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="tpl-select-label is-placeholder" id="tplTriggerLabel">Pilih Jenis Surat</span>' +
      '<span class="tpl-select-chevron" aria-hidden="true"></span>' +
    '</button>' +
    '<div class="tpl-menu" id="tplMenu" role="listbox">' + menuHTML + '</div>';

  var trigger = document.getElementById('tplTrigger');
  var menu = document.getElementById('tplMenu');
  var triggerLabel = document.getElementById('tplTriggerLabel');

  function openMenu() { pickerEl.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
  function closeMenu() { pickerEl.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }

  function currentTemplate() {
    return TEMPLATES.filter(function (t) { return t.id === currentId; })[0] || null;
  }

  trigger.addEventListener('click', function () {
    if (pickerEl.classList.contains('open')) closeMenu(); else openMenu();
  });

  // Pilih kartu -> tandai aktif, perbarui label, tutup menu, bangun ulang form
  menu.addEventListener('click', function (e) {
    var card = e.target.closest('.tpl-card');
    if (!card) return;
    if (!card.classList.contains('active')) {
      currentId = card.getAttribute('data-id');
      menu.querySelectorAll('.tpl-card').forEach(function (c) { c.classList.toggle('active', c === card); });
      triggerLabel.textContent = tplName(currentId);
      triggerLabel.classList.remove('is-placeholder');
      buildForm(currentTemplate());
    }
    closeMenu();
  });

  // Klik di luar area pemilih -> tutup menu
  document.addEventListener('click', function (e) {
    if (!pickerEl.contains(e.target)) closeMenu();
  });

  // Aturan transformasi nilai input (mis. awal kata jadi huruf besar)
  function applyTransform(name, value) {
    if (name === 'titlecase') return KUAUtil.titleCase(value);
    if (name === 'titlecaseall') return KUAUtil.titleCaseAll(value);
    return value;
  }

  // Terapkan transform secara LANGSUNG saat mengetik, tanpa memindah kursor.
  // (Aman karena Title Case tidak mengubah panjang teks.)
  function attachLiveTransform(el, name) {
    el.addEventListener('input', function () {
      var start = el.selectionStart, end = el.selectionEnd;
      var v = applyTransform(name, el.value);
      if (v !== el.value) {
        el.value = v;
        try { el.setSelectionRange(start, end); } catch (_) {}
      }
    });
  }

  // Ikon garis (SVG, mengikuti warna teks) untuk tombol daftar dinamis
  function ikon(path) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }
  var IKON_HAPUS = ikon('<path d="M18 6 6 18M6 6l12 12"/>');
  var IKON_TAMBAH = ikon('<path d="M12 5v14M5 12h14"/>');

  // --- Bangun field form dari template ---
  function fieldHTML(key, tpl) {
    var def = FIELDS[key];
    if (!def) return '';
    // Hampir semua kolom wajib, jadi yang ditandai justru kolom yang TIDAK wajib.
    var opsional = def.required ? '' : ' <span class="opsional">(opsional)</span>';
    var attrs = 'id="f_' + key + '" data-key="' + key + '"';
    // Template boleh mengganti contoh isian, mis. format nomor surat keterangan/rekomendasi.
    var placeholder = (tpl && tpl.placeholder && tpl.placeholder[key]) || def.placeholder;
    if (placeholder) attrs += ' placeholder="' + placeholder + '"';
    if (def.inputmode) attrs += ' inputmode="' + def.inputmode + '"';
    if (def.maxlength) attrs += ' maxlength="' + def.maxlength + '"';

    var control;
    if (def.type === 'date') {
      control = '<div class="dp">' +
        '<input type="text" class="input dp-display" id="f_' + key + '_disp" readonly placeholder="dd/mm/yyyy" />' +
        '<input type="hidden" class="dp-hidden" id="f_' + key + '" data-key="' + key + '" />' +
        '<span class="dp-icon" aria-hidden="true"></span>' +
        '</div>';
    } else if (def.type === 'textarea') {
      control = '<textarea ' + attrs + '></textarea>';
    } else if (def.type === 'select') {
      var opts = '<option value="" disabled selected>Pilih salah satu</option>';
      // Opsi boleh string ('ASN') atau objek ({ value:'plh', text:'Plh. Kepala KUA' })
      // bila nilai yang disimpan perlu berbeda dari teks yang ditampilkan.
      (def.options || []).forEach(function (o) {
        var v = (o && o.value != null) ? o.value : o;
        var t = (o && o.text != null) ? o.text : o;
        opts += '<option value="' + KUAUtil.esc(v) + '">' + KUAUtil.esc(t) + '</option>';
      });
      // `required` hanya untuk gaya: opsi kosong tampil abu-abu (form tetap novalidate).
      control = '<select class="input" ' + attrs + (def.required ? ' required' : '') + '>' + opts + '</select>';
      if (def.otherValue) {
        control += '<input class="input" id="f_' + key + '_other" type="text" ' +
          (def.otherPlaceholder ? 'placeholder="' + def.otherPlaceholder + '" ' : '') +
          'style="display:none;margin-top:8px;" autocomplete="off" />';
      }
    } else if (def.type === 'list') {
      // Daftar dinamis: satu baris awal + tombol "Tambah". Baris bisa ditambah/dihapus.
      var ph = def.placeholder ? ' placeholder="' + def.placeholder + '"' : '';
      control =
        '<div class="list" id="f_' + key + '" data-key="' + key + '">' +
          '<div class="list-row">' +
            '<input class="input list-input" type="text"' + ph + ' autocomplete="off" />' +
            '<button type="button" class="list-del" tabindex="-1" aria-label="Hapus baris">' + IKON_HAPUS + '</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="list-add" data-target="' + key + '">' + IKON_TAMBAH +
          KUAUtil.esc(String(def.addLabel || 'Tambah').replace(/^\+\s*/, '')) + '</button>';
    } else {
      control = '<input class="input" type="' + (def.type || 'text') + '" ' + attrs + ' autocomplete="off" />';
    }
    return '' +
      '<div class="field" data-field="' + key + '">' +
        '<label class="flabel" for="f_' + key + '">' + def.label + opsional + '</label>' +
        control +
        '<div class="error-msg"></div>' +
      '</div>';
  }

  // Tampilan saat belum ada jenis surat dipilih
  function showEmptyState() {
    fieldsEl.innerHTML = '<p class="fields-empty">Pilih jenis surat terlebih dahulu untuk menampilkan formulir.</p>';
  }

  function buildForm(tpl) {
    var keys = tpl.formFields || [];
    var html = '';
    var i = 0;
    while (i < keys.length) {
      var key = keys[i];
      // Entri "#Judul" jadi label seksi (mis. Calon Suami / Calon Istri)
      if (key.charAt(0) === '#') {
        html += '<h3 class="form-section">' + KUAUtil.esc(key.slice(1)) + '</h3>';
        i += 1;
        continue;
      }
      var def = FIELDS[key];
      var nextKey = keys[i + 1];
      var nextDef = (nextKey && nextKey.charAt(0) !== '#') ? FIELDS[nextKey] : null;
      if (def && def.half && nextDef && nextDef.half) {
        html += '<div class="row-2">' + fieldHTML(key, tpl) + fieldHTML(nextKey, tpl) + '</div>';
        i += 2;
      } else {
        html += fieldHTML(key, tpl);
        i += 1;
      }
    }
    fieldsEl.innerHTML = html;
    fokusKolom = null;          // kolom lama sudah tidak ada
    pratinjauKeAtas = true;     // surat baru / dikosongkan: tampilkan dari kop
    // Isian baru muncul dengan memudar singkat (menandai bahwa form sudah berganti).
    fieldsEl.classList.remove('muncul');
    void fieldsEl.offsetWidth;   // mulai ulang animasi
    fieldsEl.classList.add('muncul');

    // Terapkan default & perilaku khusus
    keys.forEach(function (key) {
      if (key.charAt(0) === '#') return;
      var def = FIELDS[key];
      var el = document.getElementById('f_' + key);
      if (!el || !def) return;
      if (def.default === 'today') el.value = KUAUtil.todayISO();
      else if (def.default != null) el.value = def.default;   // mis. penanda tangan -> 'kepala'
      if (def.type === 'date') {
        KUADatePicker.create(el.closest('.dp'));
        return;
      }
      if (def.inputmode === 'numeric') {
        el.addEventListener('input', function () {
          var max = def.maxlength || 99;
          el.value = el.value.replace(/\D/g, '').slice(0, max);
        });
      }
      if (def.type === 'select' && def.otherValue) {
        var other = document.getElementById('f_' + key + '_other');
        el.addEventListener('change', function () {
          var show = el.value === def.otherValue;
          if (other) {
            other.style.display = show ? 'block' : 'none';
            if (!show) other.value = '';
            if (show) other.focus();
          }
        });
        if (def.transform && other) {
          attachLiveTransform(other, def.transform);
        }
      } else if (def.transform) {
        attachLiveTransform(el, def.transform);
      }
    });

    schedulePreview();   // surat baru langsung tampil (kop, tanggal, tanda tangan)
  }

  // Baca nilai akhir sebuah field (menangani select, opsi "lainnya", dan daftar dinamis)
  function readField(def, key) {
    var el = document.getElementById('f_' + key);
    if (def.type === 'list') {
      var items = [];
      if (el) {
        el.querySelectorAll('.list-input').forEach(function (inp) {
          var t = inp.value.trim();
          if (t) items.push(t);
        });
      }
      return items.join('\n');   // beberapa nilai dipisah baris-baru (kosong diabaikan)
    }
    if (def.type === 'select') {
      var v = el ? el.value : '';
      if (def.otherValue && v === def.otherValue) {
        var other = document.getElementById('f_' + key + '_other');
        v = other ? other.value.trim() : '';
        if (def.transform && v) v = applyTransform(def.transform, v);
      }
      return v;
    }
    var val = el ? el.value.trim() : '';
    if (def.transform && val) val = applyTransform(def.transform, val);
    return val;
  }

  function showError(key, msg) {
    var wrap = fieldsEl.querySelector('[data-field="' + key + '"]');
    if (!wrap) return;
    wrap.classList.toggle('invalid', !!msg);
    var em = wrap.querySelector('.error-msg');
    if (em && msg) em.textContent = msg;
  }

  // Kumpulkan isian form apa adanya (tanpa validasi) — dipakai pratinjau & cetak.
  function collectData(tpl) {
    var data = { __t: tpl.id };
    (tpl.formFields || []).forEach(function (key) {
      if (key.charAt(0) === '#') return;
      data[key] = readField(FIELDS[key], key);
    });
    return data;
  }

  function collectAndValidate(tpl) {
    var data = collectData(tpl);
    var ok = true;
    var firstBad = null;
    (tpl.formFields || []).forEach(function (key) {
      if (key.charAt(0) === '#') return;
      var def = FIELDS[key];
      var val = data[key];
      var msg = null;
      if (def.required && !val) msg = def.label + ' wajib diisi.';
      else if (def.validate && val) msg = def.validate(val);
      showError(key, msg);
      if (msg) { ok = false; if (!firstBad) firstBad = key; }
    });
    return { ok: ok, data: data, firstBad: firstBad };
  }

  // Tambah / hapus baris pada field tipe 'list' (delegasi: cukup dipasang sekali).
  fieldsEl.addEventListener('click', function (e) {
    var add = e.target.closest('.list-add');
    if (add) {
      var cont = document.getElementById('f_' + add.getAttribute('data-target'));
      if (cont) {
        var clone = cont.querySelector('.list-row').cloneNode(true);
        clone.querySelector('.list-input').value = '';
        cont.appendChild(clone);
        clone.querySelector('.list-input').focus();
      }
      return;
    }
    var del = e.target.closest('.list-del');
    if (del) {
      var box = del.closest('.list');
      var rows = box.querySelectorAll('.list-row');
      if (rows.length > 1) del.closest('.list-row').remove();
      else box.querySelector('.list-input').value = '';   // baris terakhir: kosongkan saja
      schedulePreview();
    }
  });

  // ------------------------------------------------------------------------
  //  Pratinjau langsung (layar lebar)
  // ------------------------------------------------------------------------
  var pane = document.getElementById('previewPane');
  var previewBody = document.getElementById('previewBody');
  var previewInfo = document.getElementById('previewInfo');
  var previewKertas = document.getElementById('previewKertas');
  var kertasSurat = 'A4';    // ukuran kertas pratinjau terakhir ('A4' | 'F4'), dari surat.js
  var zoomSeg = document.getElementById('zoomSeg');
  // Dibuka dari file:// (dobel-klik), iframe punya origin anonim ("null") yang tidak
  // cocok dengan location.origin induk ("file://" di Chrome/Edge) -> pesan dibuang
  // diam-diam. Jadi di file:// pakai '*'; di http(s) (GitHub Pages) pakai origin sendiri.
  var ORIGIN = (window.location.protocol === 'file:' || !window.location.origin ||
    window.location.origin === 'null') ? '*' : window.location.origin;

  var frame = null;          // iframe pratinjau, dibuat saat pertama dibutuhkan
  var frameReady = false;
  var judulSurat = '';       // judul dari pratinjau terakhir (dipakai sebagai nama file PDF)
  var rafId = 0;

  // Ukuran pratinjau: selalu dibuka "Pas lebar". "Satu halaman" hanya bila staf memilihnya
  // (tidak diingat, jadi setiap kali halaman dibuka kembali ke Pas lebar).
  var zoomMode = 'lebar';

  function ensureFrame() {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.className = 'preview-frame';
    frame.title = 'Pratinjau surat';
    frame.src = 'surat.html?embed=1';
    previewBody.appendChild(frame);
  }

  function kirim(msg) {
    if (frame && frameReady) frame.contentWindow.postMessage(msg, ORIGIN);
  }

  // Kolom yang sedang diisi: pratinjau bergulir ke bagian surat miliknya dan menyorotnya.
  var fokusKolom = null;
  // Form baru dibangun (ganti jenis surat / Kosongkan) -> pratinjau mulai lagi dari atas (kop).
  var pratinjauKeAtas = false;

  function updatePreview() {
    var tpl = currentTemplate();
    pane.classList.toggle('has-tpl', !!tpl);
    if (!tpl) { previewInfo.classList.remove('show'); setKertas('A4'); return; }
    if (!modeLebar()) return;
    ensureFrame();
    kirim({ kua: 'render', data: collectData(tpl), fokus: fokusKolom, keAtas: pratinjauKeAtas });
    pratinjauKeAtas = false;
  }

  // Masuk ke sebuah kolom -> beri tahu pratinjau. Fokus ke tombol / pemilih surat -> sorotan hilang.
  // (Klik pada bagian yang tidak bisa difokus, mis. tanggal di kalender, tidak mengubah fokus.)
  form.addEventListener('focusin', function (e) {
    var wrap = e.target.closest('.field');
    var key = wrap ? wrap.getAttribute('data-field') : null;
    if (key === fokusKolom) return;
    fokusKolom = key;
    kirim({ kua: 'fokus', fokus: key });
  });

  // Banyak ketikan dalam satu frame layar digabung jadi satu kali gambar ulang.
  function schedulePreview() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(function () { rafId = 0; updatePreview(); });
  }

  window.addEventListener('message', function (e) {
    if (!frame || e.source !== frame.contentWindow) return;
    var m = e.data || {};
    if (m.kua === 'ready') {
      frameReady = true;
      kirim({ kua: 'zoom', mode: zoomMode });
      updatePreview();
    } else if (m.kua === 'info') {
      judulSurat = m.title || '';
      previewInfo.classList.toggle('show', !!m.lebih);
      setKertas(m.kertas === 'F4' ? 'F4' : 'A4');
    } else if (m.kua === 'afterprint') {
      document.title = APP_TITLE;
    } else if (m.kua === 'pintasanCetak') {
      cetakLewatPintasan();   // Ctrl+P ditekan saat kursor di panel pratinjau
    }
  });

  // Surat otomatis pindah ke kertas F4 (isi tidak muat A4) -> tampilkan pemberitahuan.
  function setKertas(k) {
    kertasSurat = k;
    previewKertas.classList.toggle('show', k === 'F4');
  }

  function setZoom(mode) {
    zoomMode = mode;
    zoomSeg.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-zoom') === mode);
    });
    kirim({ kua: 'zoom', mode: mode });
  }
  zoomSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-zoom]');
    if (b) setZoom(b.getAttribute('data-zoom'));
  });
  setZoom(zoomMode);

  // Setiap perubahan isian -> pratinjau diperbarui, tanda error di kolom itu dihapus.
  function onEdit(e) {
    var wrap = e.target.closest && e.target.closest('.field.invalid');
    if (wrap) wrap.classList.remove('invalid');
    schedulePreview();
  }
  form.addEventListener('input', onEdit);
  form.addEventListener('change', onEdit);

  // ------------------------------------------------------------------------
  //  Tombol utama: label & alur cetak mengikuti mode tampilan
  // ------------------------------------------------------------------------
  var btnSubmit = document.getElementById('btnSubmit');
  var noteEl = document.getElementById('note');
  var IKON_CETAK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
  var IKON_LIHAT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>';

  var PINTASAN = /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘ P' : 'Ctrl P';

  function applyMode() {
    if (cetakDariPratinjau()) {
      btnSubmit.innerHTML = IKON_CETAK + 'Cetak Surat<span class="kbd" aria-hidden="true">' + PINTASAN + '</span>';
      btnSubmit.setAttribute('aria-keyshortcuts', 'Control+P Meta+P');
      noteEl.innerHTML = 'Pratinjau di kanan sama dengan hasil cetak. Untuk menyimpan PDF, pilih <strong>Save as PDF</strong> di dialog cetak.';
    } else {
      btnSubmit.innerHTML = IKON_LIHAT + 'Pratinjau Surat';
      btnSubmit.removeAttribute('aria-keyshortcuts');
      noteEl.innerHTML = 'Surat terbuka di tab baru. Periksa isinya, lalu tekan <strong>Cetak Surat</strong>. Untuk menyimpan PDF, pilih <strong>Save as PDF</strong> di dialog cetak.';
    }
  }
  onMediaChange(mqLebar, function () { applyMode(); updatePreview(); });
  onMediaChange(mqSentuh, applyMode);
  applyMode();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var tpl = currentTemplate();
    if (!tpl) { openMenu(); return; }   // belum memilih jenis surat -> buka menu
    var res = collectAndValidate(tpl);
    if (!res.ok) {
      var w = fieldsEl.querySelector('[data-field="' + res.firstBad + '"]');
      if (w) w.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (cetakDariPratinjau() && frameReady) {
      // Cetak isi pratinjau. Judul halaman = nama file PDF bawaan
      // (dikembalikan setelah dialog cetak ditutup).
      var cetak = function () {
        if (judulSurat) document.title = judulSurat;
        kirim({ kua: 'print', data: res.data });
      };
      // Kertas F4: ingatkan staf menyiapkan kertas F4 sebelum dialog cetak terbuka.
      if (kertasSurat === 'F4') KUAUtil.konfirmasiF4(cetak); else cetak();
    } else {
      window.open('surat.html?' + new URLSearchParams(res.data).toString(), '_blank');
    }
  });

  // Ctrl+P / ⌘P mencetak SURAT, bukan halaman aplikasi (form + panel), lewat alur yang sama
  // dengan tombol: validasi, pengingat kertas F4, lalu dialog cetak. Bila kursor sedang di
  // panel pratinjau, iframe meneruskan pintasan ini lewat {kua:'pintasanCetak'}.
  function cetakLewatPintasan() {
    if (document.querySelector('dialog[open]')) return;   // dialog konfirmasi sedang terbuka
    if (form.requestSubmit) form.requestSubmit(); else btnSubmit.click();
  }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      cetakLewatPintasan();
    }
  });

  // Apakah staf sudah mengetik sesuatu (selain nilai bawaan seperti tanggal hari ini)?
  function adaIsian(tpl) {
    return (tpl.formFields || []).some(function (key) {
      if (key.charAt(0) === '#') return false;
      var def = FIELDS[key];
      var bawaan = def.default === 'today' ? KUAUtil.todayISO() : (def.default != null ? String(def.default) : '');
      var v = readField(def, key);
      return v !== '' && v !== bawaan;
    });
  }

  // "Kosongkan": isian panjang (mis. Ikrar) jangan sampai hilang karena salah klik.
  document.getElementById('btnReset').addEventListener('click', function () {
    var tpl = currentTemplate();
    if (!tpl) { showEmptyState(); return; }
    if (!adaIsian(tpl)) { buildForm(tpl); return; }
    KUAUtil.konfirmasi({
      judul: 'Kosongkan semua isian?',
      isiHTML: '<p>Semua data yang sudah diketik pada surat ini akan dihapus.</p>',
      teks: 'Kosongkan semua isian? Semua data yang sudah diketik akan dihapus.',
      lanjut: 'Kosongkan', batal: 'Batal', bahaya: true
    }, function () { buildForm(tpl); });
  });

  // Init: belum ada surat terpilih -> tampilkan petunjuk
  showEmptyState();
})();
