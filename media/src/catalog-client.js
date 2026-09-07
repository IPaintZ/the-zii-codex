/* Runtime for download-catalog.html.
 *
 * Kept in its own file rather than inlined into build.mjs's template literal so
 * it stays readable and free of backtick escaping. build.mjs reads it and drops
 * it into a <script> tag.
 *
 * Every asset is embedded as base64 in a JSON <script> block. Previews are
 * wired from the same bytes people download, so what you see is the file you
 * get. The ZIP writer is store-only (no compression) - PNGs are already
 * deflated, so compressing again buys nothing and costs a dependency.
 */
(function () {
  'use strict';

  var FILES = JSON.parse(document.getElementById('files').textContent);

  var MIME = {
    png: 'image/png',
    svg: 'image/svg+xml',
  };
  var ext = function (p) { return p.slice(p.lastIndexOf('.') + 1).toLowerCase(); };
  var base = function (p) { return p.slice(p.lastIndexOf('/') + 1); };

  function bytes(path) {
    var bin = atob(FILES[path]);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function uri(path) {
    return 'data:' + (MIME[ext(path)] || 'application/octet-stream') + ';base64,' + FILES[path];
  }

  function save(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ------------------------------ zip writer ---------------------------- */

  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  }());

  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeZip(entries) {
    var enc = new TextEncoder();
    var parts = [], central = [], offset = 0;

    entries.forEach(function (e) {
      var name = enc.encode(e.name);
      var crc = crc32(e.data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true);
      h.setUint16(4, 20, true);            // version needed
      h.setUint16(6, 0, true);             // flags
      h.setUint16(8, 0, true);             // method: store
      h.setUint16(10, 0, true);            // mod time
      h.setUint16(12, 0x21, true);         // mod date (1980-01-01)
      h.setUint32(14, crc, true);
      h.setUint32(18, e.data.length, true);
      h.setUint32(22, e.data.length, true);
      h.setUint16(26, name.length, true);
      h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, e.data);
      central.push({ name: name, crc: crc, size: e.data.length, offset: offset });
      offset += 30 + name.length + e.data.length;
    });

    var cdStart = offset;
    central.forEach(function (c) {
      var h = new DataView(new ArrayBuffer(46));
      h.setUint32(0, 0x02014b50, true);
      h.setUint16(4, 20, true);            // version made by
      h.setUint16(6, 20, true);            // version needed
      h.setUint16(8, 0, true);
      h.setUint16(10, 0, true);            // method: store
      h.setUint16(12, 0, true);
      h.setUint16(14, 0x21, true);
      h.setUint32(16, c.crc, true);
      h.setUint32(20, c.size, true);
      h.setUint32(24, c.size, true);
      h.setUint16(28, c.name.length, true);
      h.setUint16(30, 0, true);            // extra len
      h.setUint16(32, 0, true);            // comment len
      h.setUint16(34, 0, true);            // disk
      h.setUint16(36, 0, true);            // internal attrs
      h.setUint32(38, 0, true);            // external attrs
      h.setUint32(42, c.offset, true);
      parts.push(new Uint8Array(h.buffer), c.name);
      offset += 46 + c.name.length;
    });

    var eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(8, central.length, true);
    eocd.setUint16(10, central.length, true);
    eocd.setUint32(12, offset - cdStart, true);
    eocd.setUint32(16, cdStart, true);
    parts.push(new Uint8Array(eocd.buffer));

    return new Blob(parts, { type: 'application/zip' });
  }

  function zipPaths(paths, name, btn) {
    var was = btn ? btn.textContent : null;
    if (btn) { btn.textContent = 'Packing ' + paths.length + ' files…'; btn.disabled = true; }
    // Yield once so the button repaints before the main thread blocks.
    setTimeout(function () {
      try {
        save(makeZip(paths.map(function (p) { return { name: p, data: bytes(p) }; })), name);
      } finally {
        if (btn) { btn.textContent = was; btn.disabled = false; }
      }
    }, 30);
  }

  /* ------------------------------- previews ----------------------------- */

  document.querySelectorAll('img[data-file]').forEach(function (img) {
    img.src = uri(img.dataset.file);
  });

  /* ------------------------------- lightbox ----------------------------- */

  var box = document.getElementById('box');
  var stage = box.querySelector('.stage');
  var bigImg = box.querySelector('img');
  var capName = box.querySelector('.cap b');
  var capMeta = box.querySelector('.cap span');
  var capBtns = box.querySelector('.cap .btns');
  var openIdx = -1;

  function visibleItems() {
    return [].slice.call(document.querySelectorAll('.item:not([hidden])'));
  }

  function show(idx) {
    var list = visibleItems();
    if (!list.length) return;
    openIdx = (idx + list.length) % list.length;
    var item = list[openIdx];
    var thumb = item.querySelector('.thumb');
    var path = thumb.dataset.zoom;

    stage.className = 'stage ' + (thumb.classList.contains('alpha') ? 'alpha'
      : thumb.classList.contains('light') ? 'light' : '');
    bigImg.src = uri(path);
    bigImg.alt = item.dataset.label;
    capName.textContent = item.dataset.label;
    capBtns.innerHTML = item.querySelector('.btns').innerHTML;
    bigImg.onload = function () {
      capMeta.textContent = path + ' · ' + bigImg.naturalWidth + '×' + bigImg.naturalHeight + ' px';
    };
    box.classList.add('on');
  }

  function close() {
    box.classList.remove('on');
    bigImg.removeAttribute('src');
    openIdx = -1;
  }

  box.querySelector('.x').addEventListener('click', close);
  box.querySelector('.prev').addEventListener('click', function () { show(openIdx - 1); });
  box.querySelector('.next').addEventListener('click', function () { show(openIdx + 1); });
  // Click the backdrop to dismiss, but not the image or its buttons.
  box.addEventListener('click', function (ev) {
    if (ev.target === box || ev.target === stage) close();
  });
  document.addEventListener('keydown', function (ev) {
    if (!box.classList.contains('on')) return;
    if (ev.key === 'Escape') close();
    if (ev.key === 'ArrowLeft') show(openIdx - 1);
    if (ev.key === 'ArrowRight') show(openIdx + 1);
  });

  /* -------------------------------- wiring ------------------------------ */

  document.addEventListener('click', function (ev) {
    var zoom = ev.target.closest('[data-zoom]');
    if (zoom && !ev.target.closest('[data-dl]')) {
      show(visibleItems().indexOf(zoom.closest('.item')));
      return;
    }
    var one = ev.target.closest('[data-dl]');
    if (one) {
      var p = one.dataset.dl;
      save(new Blob([bytes(p)], { type: MIME[ext(p)] }), base(p));
      return;
    }
    var many = ev.target.closest('[data-zip]');
    if (many) {
      zipPaths(many.dataset.zip.split('|'), many.dataset.zipname, many);
    }
  });

  var search = document.getElementById('filter');
  var cards = [].slice.call(document.querySelectorAll('.item'));
  var groups = [].slice.call(document.querySelectorAll('section'));
  var count = document.getElementById('count');

  function applyFilter() {
    var q = search.value.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var hit = !q || c.dataset.search.indexOf(q) > -1;
      c.hidden = !hit;
      if (hit) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector('.item:not([hidden])');
    });
    count.textContent = shown === cards.length
      ? cards.length + ' assets'
      : shown + ' of ' + cards.length + ' assets';
  }

  search.addEventListener('input', applyFilter);
  applyFilter();
}());
