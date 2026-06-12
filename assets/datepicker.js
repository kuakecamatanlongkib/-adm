/*
 * Datepicker custom — tampilan dd/mm/yyyy, popup kalender dengan dropdown
 * Bulan & Tahun. Nilai DISIMPAN dalam format ISO (yyyy-mm-dd) di input hidden,
 * sehingga sisa aplikasi (mis. tglIndo) tidak perlu berubah.
 *
 * Markup yang diharapkan di dalam .dp:
 *   <input type="text"  class="dp-display" readonly>
 *   <input type="hidden" class="dp-hidden" id="f_KEY" data-key="KEY">
 *
 * Pemakaian:  KUADatePicker.create(wrapEl)
 */
(function () {
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
               'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var DOW = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function parseISO(s) {
    if (!s) return null;
    var p = String(s).split('-');
    if (p.length !== 3) return null;
    var y = +p[0], m = +p[1], d = +p[2];
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
  function toISO(dt) {
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  }
  function isoToDMY(iso) {
    var dt = parseISO(iso);
    return dt ? pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + '/' + dt.getFullYear() : '';
  }
  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  var openInstance = null;

  function DatePicker(wrap) {
    this.wrap = wrap;
    this.display = wrap.querySelector('.dp-display');
    this.hidden = wrap.querySelector('.dp-hidden');

    var init = parseISO(this.hidden.value);
    var base = init || new Date();
    this.viewYear = base.getFullYear();
    this.viewMonth = base.getMonth();
    this.selected = init;

    this.pop = document.createElement('div');
    this.pop.className = 'dp-pop';
    this.pop.style.display = 'none';
    wrap.appendChild(this.pop);

    this.bind();
    this.syncDisplay();
  }

  DatePicker.prototype.syncDisplay = function () {
    this.display.value = isoToDMY(this.hidden.value);
  };

  DatePicker.prototype.bind = function () {
    var self = this;
    function toggle(e) { e.preventDefault(); self.isOpen() ? self.hide() : self.show(); }
    this.display.addEventListener('click', toggle);
    var icon = this.wrap.querySelector('.dp-icon');
    if (icon) icon.addEventListener('click', toggle);

    // Delegasi event di dalam popup
    this.pop.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('dp-prev')) { self.move(-1); }
      else if (t.classList.contains('dp-next')) { self.move(1); }
      else if (t.classList.contains('day') && t.dataset.day) { self.pick(+t.dataset.day); }
      else if (t.classList.contains('dp-today')) { self.setDate(new Date()); }
      else if (t.classList.contains('dp-clear')) { self.clear(); }
    });
    this.pop.addEventListener('change', function (e) {
      if (e.target.classList.contains('dp-month')) { self.viewMonth = +e.target.value; self.render(); }
      else if (e.target.classList.contains('dp-year')) { self.viewYear = +e.target.value; self.render(); }
    });
  };

  DatePicker.prototype.isOpen = function () { return this.pop.style.display !== 'none'; };

  DatePicker.prototype.show = function () {
    if (openInstance && openInstance !== this) openInstance.hide();
    openInstance = this;
    var sel = parseISO(this.hidden.value);
    if (sel) { this.viewYear = sel.getFullYear(); this.viewMonth = sel.getMonth(); }
    this.render();
    this.pop.style.display = 'block';
  };
  DatePicker.prototype.hide = function () {
    this.pop.style.display = 'none';
    if (openInstance === this) openInstance = null;
  };

  DatePicker.prototype.move = function (delta) {
    this.viewMonth += delta;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    else if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    this.render();
  };

  DatePicker.prototype.pick = function (day) {
    this.setDate(new Date(this.viewYear, this.viewMonth, day));
  };
  DatePicker.prototype.setDate = function (dt) {
    this.selected = dt;
    this.hidden.value = toISO(dt);
    this.syncDisplay();
    this.hidden.dispatchEvent(new Event('change', { bubbles: true }));
    var field = this.wrap.closest('.field');
    if (field) field.classList.remove('invalid');
    this.hide();
  };
  DatePicker.prototype.clear = function () {
    this.selected = null;
    this.hidden.value = '';
    this.syncDisplay();
    this.hide();
  };

  DatePicker.prototype.render = function () {
    var now = new Date();
    var maxYear = now.getFullYear() + 5;
    var minYear = now.getFullYear() - 100;

    var monthOpts = BULAN.map(function (b, i) {
      return '<option value="' + i + '"' + (i === this.viewMonth ? ' selected' : '') + '>' + b + '</option>';
    }, this).join('');

    var yearOpts = '';
    for (var y = maxYear; y >= minYear; y--) {
      yearOpts += '<option value="' + y + '"' + (y === this.viewYear ? ' selected' : '') + '>' + y + '</option>';
    }

    var head =
      '<div class="dp-head">' +
        '<button type="button" class="dp-nav dp-prev" aria-label="Bulan sebelumnya">‹</button>' +
        '<div class="dp-sel">' +
          '<select class="dp-month" aria-label="Bulan">' + monthOpts + '</select>' +
          '<select class="dp-year" aria-label="Tahun">' + yearOpts + '</select>' +
        '</div>' +
        '<button type="button" class="dp-nav dp-next" aria-label="Bulan berikutnya">›</button>' +
      '</div>';

    var grid = '<div class="dp-grid">';
    DOW.forEach(function (d) { grid += '<div class="dow">' + d + '</div>'; });

    var firstDow = new Date(this.viewYear, this.viewMonth, 1).getDay();
    var daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    for (var i = 0; i < firstDow; i++) grid += '<div class="empty"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var cur = new Date(this.viewYear, this.viewMonth, d);
      var cls = 'day';
      if (sameDay(cur, this.selected)) cls += ' sel';
      else if (sameDay(cur, now)) cls += ' today';
      grid += '<div class="' + cls + '" data-day="' + d + '">' + d + '</div>';
    }
    grid += '</div>';

    var foot =
      '<div class="dp-foot">' +
        '<button type="button" class="dp-today">Hari ini</button>' +
        '<button type="button" class="dp-clear">Hapus</button>' +
      '</div>';

    this.pop.innerHTML = head + grid + foot;
  };

  // Tutup bila klik di luar
  document.addEventListener('click', function (e) {
    if (openInstance && !openInstance.wrap.contains(e.target)) openInstance.hide();
  });
  // Tutup dengan Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openInstance) openInstance.hide();
  });

  window.KUADatePicker = {
    create: function (wrap) { return new DatePicker(wrap); }
  };
})();
