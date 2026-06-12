/* Logika halaman form: membangun field dari katalog template, validasi, lalu buka surat. */
(function () {
  var FIELDS = window.KUA_FIELDS;
  var TEMPLATES = window.KUA_TEMPLATES;
  var CONFIG = window.KUA_CONFIG;

  document.getElementById('appTitle').textContent = CONFIG.appName || 'Surat KUA';
  document.title = CONFIG.appName || 'Surat KUA';

  var selectEl = document.getElementById('tplSelect');
  var descEl = document.getElementById('tplDesc');
  var fieldsEl = document.getElementById('fields');
  var form = document.getElementById('suratForm');

  // --- Bangun menu template (dikelompokkan per kategori) ---
  var groups = {};
  TEMPLATES.forEach(function (t) {
    var k = t.kategori || 'Lainnya';
    (groups[k] = groups[k] || []).push(t);
  });
  Object.keys(groups).forEach(function (kat) {
    var og = document.createElement('optgroup');
    og.label = kat;
    groups[kat].forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.nama;
      og.appendChild(opt);
    });
    selectEl.appendChild(og);
  });

  function currentTemplate() {
    return TEMPLATES.filter(function (t) { return t.id === selectEl.value; })[0] || TEMPLATES[0];
  }

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

  function buildForm(tpl) {
    descEl.textContent = tpl.deskripsi || '';
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

  // Baca nilai akhir sebuah field (menangani select + opsi "lainnya")
  function readField(def, key) {
    var el = document.getElementById('f_' + key);
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

  selectEl.addEventListener('change', function () { buildForm(currentTemplate()); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var tpl = currentTemplate();
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
    buildForm(currentTemplate());
  });

  // Init
  buildForm(currentTemplate());
})();
