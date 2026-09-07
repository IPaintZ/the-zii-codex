// The Zii Codex media package - regenerate everything.
//
//   node media/build.mjs             all assets
//   node media/build.mjs banner      only ids containing "banner"
//
// Writes SVG sources to media/svg/ and PNGs to media/png/<group>/, then
// rewrites media/contact-sheet.html.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as B from './src/brand.mjs';
import { launch, newPage } from './src/chrome.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SVG_DIR = join(HERE, 'svg');
const PNG_DIR = join(HERE, 'png');

// The five-colour hairline along the bottom of every banner is the one ornament
// the app itself does not have. Set false for banners with no added devices.
const ACCENT_RULE = true;

const BANNER_KEYS = ['forge', 'workshops', 'spotlight', 'page'];

// 1920x1080 covers both the Discord invite splash and a Nexus page hero.
const BANNER_SIZES = [
  { w: 960,  h: 540,  group: 'discord', prefix: 'discord-banner', note: 'Discord server banner' },
  { w: 1920, h: 1080, group: 'discord', prefix: 'hero',           note: 'Discord invite splash / Nexus hero' },
  { w: 600,  h: 240,  group: 'discord', prefix: 'profile-banner', note: 'Discord profile banner' },
  { w: 1200, h: 630,  group: 'social',  prefix: 'og-card',        note: 'Open Graph link preview' },
  { w: 1280, h: 640,  group: 'social',  prefix: 'github-social',  note: 'GitHub social preview' },
];

/* --------------------------- asset manifest ---------------------------- */

const assets = [];
const add = (a) => assets.push(a);

// -- the crest, in each colour treatment --------------------------------
for (const [skin, s] of Object.entries(B.SKINS)) {
  add({
    id: `crest-${skin}`, svg: `crest-${skin}.svg`,
    doc: B.svgDoc({ w: 512, h: 512, title: `Zii Codex crest - ${s.label}`, ...B.crest({ skin }) }),
    pngs: [1024, 512, 256].map((n) => ({ group: 'crest', name: `crest-${skin}-${n}.png`, width: n, height: n })),
  });

  add({
    id: `crest-small-${skin}`, svg: `crest-small-${skin}.svg`,
    doc: B.svgDoc({ w: 512, h: 512, title: `Zii Codex small crest - ${s.label}`, ...B.crestSmall({ skin }) }),
    pngs: [512, 256, 128, 64].map((n) => ({ group: 'crest', name: `crest-small-${skin}-${n}.png`, width: n, height: n })),
  });
}

// -- the surfaces people actually upload --------------------------------
add({
  id: 'server-icon', svg: 'server-icon.svg',
  doc: B.svgDoc({ w: 512, h: 512, title: 'Zii Codex - Discord server icon', ...B.crest({ skin: 'dark' }) }),
  pngs: [{ group: 'discord', name: 'server-icon-512.png', width: 512, height: 512, note: 'Discord server icon' }],
});
add({
  id: 'server-icon-small', svg: 'server-icon-small.svg',
  doc: B.svgDoc({ w: 512, h: 512, title: 'Zii Codex - Discord server icon (small-size drawing)', ...B.crestSmall({ skin: 'dark' }) }),
  pngs: [{ group: 'discord', name: 'server-icon-small-512.png', width: 512, height: 512, note: 'Discord server icon, heavier drawing' }],
});
for (const n of [180, 64, 32, 16]) {
  add({
    id: `favicon-${n}`, svg: `favicon-${n}.svg`,
    // scale 16 = the app's own favicon framing, edge to edge in its box
    doc: B.svgDoc({ w: 512, h: 512, title: `Zii Codex favicon ${n}`, ...B.crestSmall({ skin: 'dark', scale: 16 }) }),
    pngs: [{ group: 'web', name: `favicon-${n}.png`, width: n, height: n }],
  });
}

// -- lockups: transparent, trimmed to their ink -------------------------
const LOCKUP_SKINS = ['alpha', 'gold', 'light'];
for (const skin of LOCKUP_SKINS) {
  const tag = skin === 'alpha' ? '' : `-${skin}`;

  add({
    id: `lockup-stacked${tag}`, svg: `lockup-stacked${tag}.svg`, fit: 'trim', canvas: [1400, 1500],
    doc: B.svgDoc({ w: 1400, h: 1500, title: `Zii Codex stacked lockup (${B.SKINS[skin].label})`,
      ...B.lockupStacked(700, 90, 440, { skin, divider: true }) }),
    pngs: [{ group: 'lockup', name: `stacked${tag}-1600.png`, width: 1600 }],
  });

  add({
    id: `lockup-horizontal${tag}`, svg: `lockup-horizontal${tag}.svg`, fit: 'trim', canvas: [2400, 800],
    doc: B.svgDoc({ w: 2400, h: 800, title: `Zii Codex horizontal lockup (${B.SKINS[skin].label})`,
      ...B.lockupHorizontal(120, 400, 420, { skin }) }),
    pngs: [{ group: 'lockup', name: `horizontal${tag}-2400.png`, width: 2400 }],
  });

  add({
    id: `lockup-inline${tag}`, svg: `lockup-inline${tag}.svg`, fit: 'trim', canvas: [1400, 300],
    doc: B.svgDoc({ w: 1400, h: 300, title: `Zii Codex inline lockup (${B.SKINS[skin].label})`,
      ...B.lockupInline(60, 150, 150, { skin }) }),
    pngs: [{ group: 'lockup', name: `inline${tag}-1600.png`, width: 1600 }],
  });

  add({
    id: `wordmark${tag}`, svg: `wordmark${tag}.svg`, fit: 'trim', canvas: [1800, 700],
    doc: B.svgDoc({ w: 1800, h: 700, title: `Zii Codex wordmark (${B.SKINS[skin].label})`,
      ...B.wordmark(900, 400, 200, { skin }) }),
    pngs: [{ group: 'lockup', name: `wordmark${tag}-1800.png`, width: 1800 }],
  });
}

// -- banners ------------------------------------------------------------
for (const style of BANNER_KEYS) {
  for (const s of BANNER_SIZES) {
    add({
      id: `banner-${style}-${s.w}x${s.h}`, svg: `banner-${style}-${s.w}x${s.h}.svg`,
      doc: B.svgDoc({ w: s.w, h: s.h, title: `Zii Codex - ${B.BANNER_LABEL[style]} ${s.w}x${s.h}`,
        ...B.BANNERS[style](s.w, s.h, ACCENT_RULE) }),
      pngs: [{ group: s.group, name: `${s.prefix}-${style}-${s.w}x${s.h}.png`, width: s.w, height: s.h, note: s.note }],
    });
  }
}

/* ------------------------------ the build ------------------------------ */

const filter = process.argv[2];
const todo = filter ? assets.filter((a) => a.id.includes(filter)) : assets;
if (!todo.length) { console.error(`No assets match "${filter}"`); process.exit(1); }

// A full run owns the output directories, so clear them rather than leaving
// files behind from an earlier manifest.
if (!filter) for (const d of [SVG_DIR, PNG_DIR]) rmSync(d, { recursive: true, force: true });
mkdirSync(SVG_DIR, { recursive: true });
for (const g of ['crest', 'lockup', 'discord', 'web', 'social']) mkdirSync(join(PNG_DIR, g), { recursive: true });

let svgBytes = 0;
for (const a of todo) {
  writeFileSync(join(SVG_DIR, a.svg), a.doc, 'utf8');
  svgBytes += Buffer.byteLength(a.doc);
}
console.log(`svg   ${todo.length} sources (${(svgBytes / 1024).toFixed(0)} KB)`);

const browser = await launch();
const render = await newPage(browser.conn);

let n = 0, pngBytes = 0;
const t0 = Date.now();
for (const a of todo) {
  for (const p of a.pngs) {
    const buf = await render(a.doc, {
      width: p.width, height: p.height, fit: a.fit || 'viewport', canvas: a.canvas,
    });
    writeFileSync(join(PNG_DIR, p.group, p.name), buf);
    pngBytes += buf.length;
    n++;
    process.stdout.write(`\rpng   ${n} rendered  ${p.group}/${p.name}`.padEnd(78));
  }
}
await browser.close();
console.log(`\rpng   ${n} rendered (${(pngBytes / 1024 / 1024).toFixed(1)} MB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`.padEnd(78));

const sheet = contactSheet();
writeFileSync(join(HERE, 'contact-sheet.html'), sheet, 'utf8');
console.log('sheet media/contact-sheet.html');

if (!filter) {
  const one = selfContained(sheet);
  writeFileSync(join(HERE, 'contact-sheet-portable.html'), one, 'utf8');
  console.log(`sheet media/contact-sheet-portable.html (${(Buffer.byteLength(one) / 1024 / 1024).toFixed(1)} MB, no server needed)`);

  const cat = downloadCatalog();
  writeFileSync(join(HERE, 'download-catalog.html'), cat, 'utf8');
  console.log(`sheet media/download-catalog.html (${(Buffer.byteLength(cat) / 1024 / 1024).toFixed(1)} MB, every file downloadable)`);
}

/**
 * A single shareable file: every preview swapped for the SVG source it was
 * rendered from, inlined as a data URI, and the webfonts inlined too. Opens by
 * double-click with no server and no network. The loose PNG/SVG files are what
 * you actually upload - this is only for showing people.
 *
 * SVG rather than the PNGs because it is a fifth of the size and stays crisp;
 * each one is a separate document inside its <img>, so the fixed gradient and
 * pattern ids in the banners cannot collide the way they would if inlined.
 */
function selfContained(html) {
  const svgFor = new Map();
  for (const a of assets) for (const p of a.pngs) svgFor.set(`${p.group}/${p.name}`, a.svg);

  const cache = new Map();
  const dataUri = (name) => {
    if (!cache.has(name)) {
      const p = join(SVG_DIR, name);
      cache.set(name, existsSync(p)
        ? 'data:image/svg+xml;base64,' + readFileSync(p).toString('base64') : null);
    }
    return cache.get(name);
  };

  let out = html.replace(/(src|href)="png\/([^"]+)"/g, (m, attr, path) => {
    const uri = svgFor.has(path) ? dataUri(svgFor.get(path)) : null;
    return uri ? `${attr}="${uri}"` : m;
  });

  return out
    .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>/, `<style>${B.ALL_FACES}</style>`)
    .replace('<div class="wrap">',
      '<div class="wrap"><p class="portable">Self-contained copy — every image is embedded, '
      + 'so this single file can be shared and opened offline. The uploadable PNGs live in '
      + '<code>media/png/</code>.</p>');
}

/* ---------------------------- contact sheet ---------------------------- */

/**
 * A single file your collaborators can pull real assets out of: every PNG and
 * SVG embedded, a download button per size, and per-section / whole-package ZIP
 * buttons. Bigger than the portable sheet because it carries the actual
 * uploadable PNGs, not just previews.
 */
function downloadCatalog() {
  const GROUPS = [
    ['crest',   'Logo',      'The .brand-head crest and the small-size drawing, in every colour treatment.'],
    ['lockup',  'Lockups',   'Crest and type together, trimmed to their ink. Transparent unless marked.'],
    ['discord', 'Discord',   'Server icon, server banner, invite splash, profile banner.'],
    ['social',  'Social',    'Link previews and the GitHub social card.'],
    ['web',     'Favicons',  'The app\'s own favicon drawing, at tab sizes.'],
  ];

  // path -> base64, for every file the package produced.
  const blob = {};
  const put = (rel, abs) => { blob[rel] = readFileSync(abs).toString('base64'); };
  for (const a of assets) {
    put(`svg/${a.svg}`, join(SVG_DIR, a.svg));
    for (const p of a.pngs) put(`png/${p.group}/${p.name}`, join(PNG_DIR, p.group, p.name));
  }

  const kb = (rel) => Math.max(1, Math.round((blob[rel].length * 0.75) / 1024));
  const sizeLabel = (p) => (p.height ? `${p.width}×${p.height}` : `${p.width} wide`);

  // One card per asset, filed under the group its PNGs belong to.
  const byGroup = new Map(GROUPS.map(([k]) => [k, []]));
  for (const a of assets) {
    const g = a.pngs[0].group;
    if (!byGroup.has(g)) continue;
    const label = (a.doc.match(/<title>(.*?)<\/title>/)?.[1] || a.id).replace(/^Zii Codex\s*-?\s*/, '');
    const note = a.pngs.find((p) => p.note)?.note || '';
    const preview = `png/${a.pngs[0].group}/${a.pngs[0].name}`;
    // Zoom against the biggest render, so "view full size" means it.
    const big = a.pngs.reduce((m, p) => (p.width > m.width ? p : m), a.pngs[0]);
    const first = a.pngs[0];
    // Wide art gets a double-width card - a 960x540 banner in a 268px column is
    // not a preview of anything. Trimmed lockups carry no height in the
    // manifest, so the stacked one is identified by name.
    const wide = first.height ? first.width / first.height >= 1.6 : !/stacked/.test(a.id);
    const files = [
      ...a.pngs.map((p) => ({ rel: `png/${p.group}/${p.name}`, txt: `${sizeLabel(p)} PNG` })),
      { rel: `svg/${a.svg}`, txt: 'SVG' },
    ];
    byGroup.get(g).push({ label, note, preview, files, id: a.id, wide, full: `png/${big.group}/${big.name}` });
  }

  const sections = GROUPS.map(([key, title, lede]) => {
    const items = byGroup.get(key);
    if (!items.length) return '';
    const all = items.flatMap((i) => i.files.map((f) => f.rel));
    // Thumbnail backing has to match what the asset actually is: parchment art
    // on parchment, anything with no ground on a checkerboard.
    const backing = (id) => (/-light$/.test(id) ? 'light'
      : /-(alpha|gold)$/.test(id) || (key === 'lockup' && !/-light$/.test(id)) ? 'alpha' : '');

    const cards = items.map((i) => `
      <div class="item${i.wide ? ' wide' : ''}" data-search="${(i.label + ' ' + i.note + ' ' + i.id).toLowerCase().replace(/"/g, '')}" data-label="${i.label}">
        <div class="thumb ${backing(i.id)}" data-zoom="${i.full}" title="Click to view full size">
          <img data-file="${i.preview}" alt="${i.label}">
        </div>
        <div class="meta">
          <b>${i.label}</b>
          ${i.note ? `<em>${i.note}</em>` : ''}
          <div class="btns">
            ${i.files.map((f) => `<button data-dl="${f.rel}" title="${f.rel} · ${kb(f.rel)} KB">${f.txt}<i>${kb(f.rel)} KB</i></button>`).join('')}
          </div>
        </div>
      </div>`).join('');

    return `<section>
      <h2>${title}<button class="zip" data-zip="${all.join('|')}" data-zipname="zii-codex-${key}.zip">Download section (${all.length})</button></h2>
      <p class="lede">${lede}</p>
      <div class="items">${cards}</div>
    </section>`;
  }).join('');

  const everything = Object.keys(blob);
  const totalMb = (everything.reduce((n, k) => n + blob[k].length * 0.75, 0) / 1024 / 1024).toFixed(1);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Zii Codex — asset downloads</title>
<link rel="icon" href="data:image/svg+xml;base64,${blob['svg/favicon-32.svg']}">
<style>
  <!--FONTS-->
  :root{--bg:${B.C.bg};--panel:${B.C.panel};--panel2:${B.C.panel2};--line:${B.C.line};
        --ink:${B.C.ink};--dim:${B.C.dim};--gold:${B.C.gold};--gold2:${B.C.gold2};
        --disp:'Metamorphous',Georgia,serif;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 "Segoe UI",system-ui,sans-serif}
  .wrap{max-width:1180px;margin:0 auto;padding:30px 22px 90px}
  header{text-align:center;padding:24px 0 26px}
  header img{width:88px;height:88px}
  header h1{font-family:var(--disp);font-size:27px;letter-spacing:.06em;margin:14px 0 4px;font-weight:400}
  header h1 em{font-style:normal;color:var(--gold)}
  header p{font-family:'Spectral',Georgia,serif;font-style:italic;color:var(--dim);margin:0}
  .bar{position:sticky;top:0;z-index:5;display:flex;gap:12px;align-items:center;flex-wrap:wrap;
    background:rgba(22,19,15,.94);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);
    padding:12px 0 12px;margin-bottom:8px}
  #filter{flex:1;min-width:200px;background:var(--panel);border:1px solid var(--line);border-radius:7px;
    color:var(--ink);padding:9px 12px;font:inherit}
  #filter:focus{outline:none;border-color:var(--gold2)}
  #count{color:var(--dim);font-size:12.5px;white-space:nowrap}
  .grab{background:var(--gold);color:#221c14;border:none;border-radius:7px;padding:10px 16px;
    font:600 13px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer;white-space:nowrap}
  .grab:hover{background:#e8b95c}
  .grab:disabled{opacity:.6;cursor:default}
  section[hidden]{display:none}
  h2{font-family:var(--disp);font-size:16px;font-weight:400;letter-spacing:.05em;color:var(--gold);
    margin:36px 0 4px;padding-bottom:8px;border-bottom:1px solid var(--line);
    display:flex;align-items:center;gap:14px}
  .zip{margin-left:auto;background:transparent;color:var(--dim);border:1px solid var(--line);
    border-radius:6px;padding:5px 11px;font:12px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer}
  .zip:hover{color:var(--ink);border-color:var(--gold2)}
  .zip:disabled{opacity:.6;cursor:default}
  .lede{color:var(--dim);margin:0 0 16px;font-size:12.5px}
  .items{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(268px,1fr))}
  .item{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;
    display:flex;flex-direction:column}
  .item.wide{grid-column:span 2}
  @media (max-width:640px){.item.wide{grid-column:span 1}}
  .item[hidden]{display:none}
  .thumb{display:grid;place-items:center;padding:12px;background:var(--panel2);min-height:130px;
    cursor:zoom-in;position:relative}
  .thumb.alpha{background:repeating-conic-gradient(#2a2a2a 0 25%,#1e1e1e 0 50%) 0 0/16px 16px}
  .thumb.light{background:#e9dcbe}
  .thumb img{max-width:100%;max-height:200px;height:auto;display:block}
  .thumb::after{content:"⤢";position:absolute;top:7px;right:9px;color:var(--dim);font-size:13px;
    opacity:0;transition:opacity .12s}
  .thumb:hover::after{opacity:1}
  /* lightbox */
  #box{position:fixed;inset:0;z-index:50;background:rgba(10,8,6,.93);display:none;
    flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:26px}
  #box.on{display:flex}
  #box .stage{max-width:94vw;max-height:74vh;display:grid;place-items:center;padding:14px;
    border:1px solid var(--line);border-radius:10px;background:var(--panel2)}
  #box .stage.alpha{background:repeating-conic-gradient(#2a2a2a 0 25%,#1e1e1e 0 50%) 0 0/20px 20px}
  #box .stage.light{background:#e9dcbe}
  #box img{max-width:92vw;max-height:70vh;display:block}
  #box .cap{text-align:center;color:var(--dim);font-size:12.5px;display:flex;flex-direction:column;gap:7px;
    align-items:center;max-width:92vw}
  #box .cap b{color:var(--ink);font-size:14px;font-weight:600}
  #box .cap .btns{justify-content:center}
  #box .x{position:absolute;top:14px;right:18px;background:none;border:none;color:var(--dim);
    font-size:26px;line-height:1;cursor:pointer}
  #box .x:hover{color:var(--ink)}
  #box .nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(33,28,22,.85);
    border:1px solid var(--line);color:var(--ink);font-size:22px;line-height:1;cursor:pointer;
    border-radius:8px;padding:12px 14px}
  #box .nav:hover{border-color:var(--gold);color:var(--gold)}
  #box .prev{left:16px} #box .next{right:16px}
  .meta{padding:10px 12px 12px;display:flex;flex-direction:column;gap:3px;flex:1}
  .meta b{font-weight:600;font-size:12.5px}
  .meta em{font-style:normal;color:var(--dim);font-size:11.5px}
  .btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:9px}
  .btns button{background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:6px;
    padding:5px 9px;font:12px/1.25 "Segoe UI",system-ui,sans-serif;cursor:pointer;text-align:left}
  .btns button:hover{border-color:var(--gold);color:var(--gold)}
  .btns i{display:block;font-style:normal;font-size:10px;color:var(--dim);margin-top:1px}
  .btns button:hover i{color:var(--gold2)}
  .note{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--gold);
    border-radius:0 8px 8px 0;padding:10px 14px;margin:0 0 4px;color:var(--dim);font-size:12.5px}
  .note code{color:var(--ink)}
</style></head><body><div class="wrap">

<header>
  <img data-file="png/crest/crest-dark-512.png" alt="">
  <h1>THE ZII <em>CODEX</em></h1>
  <p>The soul of every recipe — asset downloads</p>
</header>

<p class="note">Every file is embedded in this page. Click any button to save that
exact file — no server, no internet, nothing to install. Sizes are the real file sizes.</p>

<div class="bar">
  <input id="filter" type="search" placeholder="Filter — try &quot;banner&quot;, &quot;discord&quot;, &quot;parchment&quot;, &quot;favicon&quot;…" autocomplete="off">
  <span id="count"></span>
  <button class="grab" data-zip="${everything.join('|')}" data-zipname="zii-codex-media.zip">Download everything · ${everything.length} files · ${totalMb} MB</button>
</div>

${sections}

</div>

<div id="box" role="dialog" aria-modal="true" aria-label="Full size preview">
  <button class="x" aria-label="Close">×</button>
  <button class="nav prev" aria-label="Previous">‹</button>
  <button class="nav next" aria-label="Next">›</button>
  <div class="stage"><img alt=""></div>
  <div class="cap"><b></b><span></span><div class="btns"></div></div>
</div>

<script id="files" type="application/json">${JSON.stringify(blob)}</script>
<script><!--CLIENT--></script>
</body></html>`
    .replace('<!--FONTS-->', B.ALL_FACES)
    .replace('<!--CLIENT-->', readFileSync(join(HERE, 'src', 'catalog-client.js'), 'utf8'));
}

function contactSheet() {
  const card = (src, cap, sub, cls = '') =>
    `<figure class="${cls}"><div class="shot"><img src="${src}" alt="${cap}"></div>
       <figcaption><b>${cap}</b>${sub ? `<span>${sub}</span>` : ''}</figcaption></figure>`;

  const skins = Object.entries(B.SKINS);

  const crestRow = skins.map(([k, s]) =>
    card(`png/crest/crest-${k}-512.png`, s.label, `crest/crest-${k}-{1024,512,256}.png`,
      'sq' + (s.ground ? '' : ' alpha') + (k === 'light' ? ' light' : ''))).join('');

  const smallRow = skins.map(([k, s]) =>
    card(`png/crest/crest-small-${k}-512.png`, s.label, `crest/crest-small-${k}-*.png`,
      'sq' + (s.ground ? '' : ' alpha') + (k === 'light' ? ' light' : ''))).join('');

  const sidebar = [['server-icon-512', 'brand-head crest'], ['server-icon-small-512', 'favicon drawing']]
    .map(([f, lab]) => `<div class="rail"><img src="png/discord/${f}.png" alt=""><em>${lab}</em></div>`).join('');

  const strip = [['crest-dark', 'brand-head crest'], ['crest-small-dark', 'favicon drawing']].map(([f, lab]) =>
    `<div class="strip"><span>${lab}</span>
       <img src="png/crest/${f}-256.png" style="width:128px;height:128px">
       <img src="png/crest/${f}-256.png" style="width:64px;height:64px">
       <img src="png/crest/${f}-256.png" style="width:32px;height:32px">
       <img src="png/crest/${f}-256.png" style="width:16px;height:16px"></div>`).join('');

  const lockups = LOCKUP_SKINS.map((skin) => {
    const tag = skin === 'alpha' ? '' : `-${skin}`;
    const cls = skin === 'light' ? 'light' : 'alpha';
    return card(`png/lockup/horizontal${tag}-2400.png`, `horizontal · ${B.SKINS[skin].label}`, `lockup/horizontal${tag}-2400.png`, `wide ${cls}`)
      + card(`png/lockup/stacked${tag}-1600.png`, `stacked · ${B.SKINS[skin].label}`, `lockup/stacked${tag}-1600.png`, `tall ${cls}`)
      + card(`png/lockup/wordmark${tag}-1800.png`, `wordmark · ${B.SKINS[skin].label}`, `lockup/wordmark${tag}-1800.png`, `wide ${cls}`)
      + card(`png/lockup/inline${tag}-1600.png`, `inline · ${B.SKINS[skin].label}`, `lockup/inline${tag}-1600.png`, `wide ${cls}`);
  }).join('');

  const banners = BANNER_KEYS.map((style) => `
    <h3>${B.BANNER_LABEL[style]}</h3>
    <div class="grid">${BANNER_SIZES.map((s) =>
      card(`png/${s.group}/${s.prefix}-${style}-${s.w}x${s.h}.png`, `${s.w}×${s.h}`, s.note, 'wide')).join('')}</div>`).join('');

  const swatches = [
    ['Ground', B.C.bg], ['Panel', B.C.panel], ['Line', B.C.line],
    ['Ink', B.C.ink], ['Dim', B.C.dim], ['Gold', B.C.gold], ['Gold deep', B.C.gold2],
    ...B.TOOLS.map((t) => [t.name, t.color]),
  ].map(([nm, c]) => `<div class="sw"><i style="background:${c}"></i><b>${nm}</b><code>${c}</code></div>`).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Zii Codex — media contact sheet</title>
<link rel="icon" href="png/web/favicon-32.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Metamorphous&family=Spectral:ital@0;1&display=swap">
<style>
  :root{--bg:${B.C.bg};--panel:${B.C.panel};--panel2:${B.C.panel2};--line:${B.C.line};
        --ink:${B.C.ink};--dim:${B.C.dim};--gold:${B.C.gold};--disp:'Metamorphous',Georgia,serif;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 "Segoe UI",system-ui,sans-serif}
  .wrap{max-width:1180px;margin:0 auto;padding:34px 22px 90px}
  header{text-align:center;padding:28px 0 34px;border-bottom:1px solid var(--line);margin-bottom:34px}
  header img{width:104px;height:104px}
  header h1{font-family:var(--disp);font-size:30px;letter-spacing:.06em;margin:16px 0 4px;font-weight:400}
  header h1 em{font-style:normal;color:var(--gold)}
  header p{font-family:'Spectral',Georgia,serif;font-style:italic;color:var(--dim);margin:0}
  h2{font-family:var(--disp);font-size:17px;font-weight:400;letter-spacing:.05em;color:var(--gold);
     margin:46px 0 6px;padding-bottom:8px;border-bottom:1px solid var(--line)}
  h2 + .lede{color:var(--dim);margin:0 0 18px;font-size:12.5px}
  h3{font-family:var(--disp);font-size:14px;font-weight:400;color:var(--ink);margin:26px 0 10px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
  figure{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  figure.wide{grid-column:span 2}
  .shot{display:grid;place-items:center;padding:14px;background:var(--panel2);min-height:96px}
  .shot img{max-width:100%;height:auto;display:block}
  figure.sq .shot img{width:150px;height:150px}
  figure.tall .shot img{max-height:300px;width:auto}
  figure.alpha .shot{background:repeating-conic-gradient(#2a2a2a 0 25%,#1e1e1e 0 50%) 0 0/18px 18px}
  figure.light .shot{background:#e9dcbe}
  figcaption{padding:9px 12px;font-size:12px;display:flex;flex-direction:column;gap:2px}
  figcaption span{color:var(--dim);font-family:Consolas,monospace;font-size:11px}
  .discord{display:flex;background:#1e1f22;border-radius:12px;padding:14px 10px;width:max-content}
  .rail{display:flex;flex-direction:column;align-items:center;gap:7px;width:132px}
  .rail img{width:48px;height:48px;border-radius:50%;transition:border-radius .15s}
  .rail:hover img{border-radius:16px}
  .rail em{font-style:normal;font-size:10.5px;color:#949ba4}
  .strip{display:flex;align-items:center;gap:16px;padding:10px 14px;background:var(--panel);
         border:1px solid var(--line);border-radius:10px;margin-bottom:8px}
  .strip span{font-family:var(--disp);font-size:12px;width:170px;color:var(--dim)}
  .sws{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
  .sw{display:flex;align-items:center;gap:9px;background:var(--panel);border:1px solid var(--line);
      border-radius:8px;padding:8px 10px}
  .sw i{width:26px;height:26px;border-radius:6px;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
  .sw b{font-weight:500;font-size:12px}
  .sw code{color:var(--dim);font-size:11px;margin-left:auto}
  .portable{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--gold);
    border-radius:0 8px 8px 0;padding:10px 14px;margin:0 0 26px;color:var(--dim);font-size:12.5px}
  .portable code{color:var(--ink)}
</style></head><body><div class="wrap">

<header>
  <img src="png/crest/crest-dark-512.png" alt="">
  <h1>THE ZII <em>CODEX</em></h1>
  <p>The soul of every recipe — media contact sheet</p>
</header>

<h2>The crest</h2>
<p class="lede">The .brand-head crest from index.html, reproduced exactly, in each colour treatment.
Composed inside a 460&nbsp;px safe circle on a 512&nbsp;px board so Discord's circular crop never clips it.</p>
<div class="grid">${crestRow}</div>

<h2>The small-size drawing</h2>
<p class="lede">The identity's own favicon artwork — one filled hexagon, heavier stroke, no inner ring.
Use this below roughly 128&nbsp;px instead of shrinking the crest.</p>
<div class="grid">${smallRow}</div>

<h2>In a Discord server list</h2>
<p class="lede">Actual size, 48&nbsp;px. Hover for the rounded-square (active server) crop.</p>
<div class="discord">${sidebar}</div>

<h2>Small-size legibility</h2>
<p class="lede">128 · 64 · 32 · 16&nbsp;px, both drawings, so you can see where the crest gives out.</p>
${strip}

<h2>Lockups</h2>
<p class="lede">Crest and type together, trimmed to their ink. Stacked follows the app's own
.brand-head spacing; inline follows the .zii shell lockup.</p>
<div class="grid">${lockups}</div>

<h2>Banners</h2>
<p class="lede">Every style at every surface size.${ACCENT_RULE ? ' The five-colour hairline along the bottom is the one ornament the app does not itself have — set <code>ACCENT_RULE=false</code> in build.mjs to drop it.' : ''}</p>
${banners}

<h2>Palette</h2>
<div class="sws">${swatches}</div>

</div></body></html>`;
}
