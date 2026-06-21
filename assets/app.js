/* Logika halaman form: membangun field dari katalog template, validasi, lalu buka surat. */
(function () {
  var FIELDS = window.KUA_FIELDS;
  var TEMPLATES = window.KUA_TEMPLATES;
  var CONFIG = window.KUA_CONFIG;

  document.getElementById('appTitle').textContent = CONFIG.appName || 'Surat KUA';
  document.title = CONFIG.appName || 'Surat KUA';

  var pickerEl = document.getElementById('tplPicker');
  var fieldsEl = document.getElementById('fields');
  var form = document.getElementById('suratForm');

  var currentId = null;   // belum ada surat terpilih sampai staf memilih

  // --- Bangun pemilih template berupa kartu, dikelompokkan per kategori ---
  var groups = {};
  TEMPLATES.forEach(function (t) {
    var k = t.kategori || 'Lainnya';
    (groups[k] = groups[k] || []).push(t);
  });
  function tplName(id) {
    var t = TEMPLATES.filter(function (t) { return t.id === id; })[0];
    return t ? t.nama : '— Pilih —';
  }

  var menuHTML = '';
  Object.keys(groups).forEach(function (kat) {
    menuHTML += '<div class="tpl-cat">' +
      '<div class="tpl-cat-title"><span>' + KUAUtil.esc(kat) + '</span>' +
      '<span class="tpl-cat-count">' + groups[kat].length + '</span></div>';
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

  // --- Bangun field form dari template ---
  function fieldHTML(key) {
    var def = FIELDS[key];
    if (!def) return '';
    var reqStar = def.required ? ' <span class="req">*</span>' : '';
    var attrs = 'id="f_' + key + '" data-key="' + key + '"';
    if (def.placeholder) attrs += ' placeholder="' + def.placeholder + '"';
    if (def.inputmode) attrs += ' inputmode="' + def.inputmode + '"';
    if (def.maxlength) attrs += ' maxlength="' + def.maxlength + '"';

    var control;
    if (def.type === 'date') {
      control = '<div class="dp">' +
        '<input type="text" class="input dp-display" id="f_' + key + '_disp" readonly placeholder="dd/mm/yyyy" />' +
        '<input type="hidden" class="dp-hidden" id="f_' + key + '" data-key="' + key + '" />' +
        '<span class="dp-icon">📅</span>' +
        '</div>';
    } else if (def.type === 'textarea') {
      control = '<textarea ' + attrs + '></textarea>';
    } else if (def.type === 'select') {
      var opts = '<option value="" disabled selected>— Pilih —</option>';
      (def.options || []).forEach(function (o) {
        opts += '<option value="' + KUAUtil.esc(o) + '">' + KUAUtil.esc(o) + '</option>';
      });
      control = '<select class="input" ' + attrs + '>' + opts + '</select>';
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
            '<button type="button" class="list-del" tabindex="-1" aria-label="Hapus baris">✕</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="list-add" data-target="' + key + '">' +
          KUAUtil.esc(def.addLabel || '+ Tambah') + '</button>';
    } else {
      control = '<input class="input" type="' + (def.type || 'text') + '" ' + attrs + ' autocomplete="off" />';
    }
    return '' +
      '<div class="field" data-field="' + key + '">' +
        '<label class="flabel" for="f_' + key + '">' + def.label + reqStar + '</label>' +
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
        html += '<div class="section-label" style="margin-top:16px;">' + key.slice(1) + '</div>';
        i += 1;
        continue;
      }
      var def = FIELDS[key];
      var nextKey = keys[i + 1];
      var nextDef = (nextKey && nextKey.charAt(0) !== '#') ? FIELDS[nextKey] : null;
      if (def && def.half && nextDef && nextDef.half) {
        html += '<div class="row-2">' + fieldHTML(key) + fieldHTML(nextKey) + '</div>';
        i += 2;
      } else {
        html += fieldHTML(key);
        i += 1;
      }
    }
    fieldsEl.innerHTML = html;

    // Terapkan default & perilaku khusus
    keys.forEach(function (key) {
      if (key.charAt(0) === '#') return;
      var def = FIELDS[key];
      var el = document.getElementById('f_' + key);
      if (!el || !def) return;
      if (def.default === 'today') el.value = KUAUtil.todayISO();
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

  function collectAndValidate(tpl) {
    var data = { __t: tpl.id };
    var ok = true;
    var firstBad = null;
    (tpl.formFields || []).forEach(function (key) {
      if (key.charAt(0) === '#') return;
      var def = FIELDS[key];
      var val = readField(def, key);
      data[key] = val;

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
    }
  });

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
    var params = new URLSearchParams(res.data).toString();
    window.open('surat.html?' + params, '_blank');
  });

  document.getElementById('btnReset').addEventListener('click', function () {
    var tpl = currentTemplate();
    if (tpl) buildForm(tpl); else showEmptyState();
  });

  // Init: belum ada surat terpilih -> tampilkan petunjuk
  showEmptyState();
})();
