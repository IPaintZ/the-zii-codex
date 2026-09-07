// The Zii Codex - brand artwork generators.
// Everything here emits SVG strings. Nothing rasterises; see ../build.mjs.
//
// This is a faithful reproduction of the identity already in index.html, not a
// redesign. The hexagon coordinates, colours, type sizes and spacing are copied
// from the .brand-head / .zii / favicon rules in that file. If the app changes,
// change it here too rather than hand-editing the generated SVGs.
import { FONTS } from './fonts.mjs';

/* ------------------------------- palette ------------------------------- */

export const C = {
  bg: '#16130f', panel: '#211c16', panel2: '#2b241b', line: '#3d3325',
  ink: '#ece3d2', dim: '#a99b81',
  gold: '#d9a441', gold2: '#b98a34',
  // Derived only for surfaces the app does not have: parchment banners need a
  // darker gold to hold contrast, and flat art needs a single tone.
  goldInk: '#8a6218',
  page: '#e9dcbe', pageDeep: '#d8c69f', pageInk: '#2a2117', pageDim: '#6f6144',
  pageLine: '#c2ad84',
};

// The five workshops and their accents, from the body.tool-* rules.
export const TOOLS = [
  { key: 'smithy',  name: 'Emberforge', color: '#d9a441', dark: '#9a6f1c' },
  { key: 'tailor',  name: 'Loomhall',   color: '#c98aa8', dark: '#9c5b7c' },
  { key: 'cooking', name: 'Cookfire',   color: '#d98a4f', dark: '#a85c25' },
  { key: 'alchemy', name: 'Elixirhall', color: '#a07fd0', dark: '#6d4a9c' },
  { key: 'traders', name: 'Trademoot',  color: '#4fb39a', dark: '#2f7f6b' },
];

// Tool glyphs, copied from the ICO table in index.html (24x24, stroked).
const ICO = {
  smithy:  '<line x1="5.5" y1="18.5" x2="14.5" y2="9.5"/><rect x="12.7" y="5.6" width="7" height="3.8" rx="1.2" transform="rotate(45 16.2 7.5)"/><line x1="4.5" y1="20.5" x2="8" y2="17"/>',
  tailor:  '<line x1="5.6" y1="18.4" x2="15" y2="9"/><circle cx="16.3" cy="7.7" r="1.5"/><path d="M5.6 18.4 c-2.6 -1 -2.4 -4.2 .3 -5.2 s 2.6 -3.4 .2 -5.1"/>',
  traders: '<line x1="12" y1="4.6" x2="12" y2="19"/><circle cx="12" cy="3.6" r="1"/><line x1="5" y1="7" x2="19" y2="7"/><line x1="9" y1="20" x2="15" y2="20"/><path d="M5 7 L2.7 11.7 M5 7 L7.3 11.7 M2.4 11.7 a2.9 2.4 0 0 0 5.2 0"/><path d="M19 7 L16.7 11.7 M19 7 L21.3 11.7 M16.4 11.7 a2.9 2.4 0 0 0 5.2 0"/>',
  alchemy: '<line x1="9" y1="3.5" x2="15" y2="3.5"/><path d="M10.8 3.5 V9.2 L6.3 17.8 a1.5 1.5 0 0 0 1.35 2.2 H16.35 a1.5 1.5 0 0 0 1.35 -2.2 L13.2 9.2 V3.5"/><line x1="8.3" y1="14.5" x2="15.7" y2="14.5"/><circle cx="11" cy="17" r=".55"/><circle cx="13.6" cy="16.2" r=".5"/>',
  cooking: '<line x1="4.5" y1="10.5" x2="19.5" y2="10.5"/><path d="M6 10.5 L7 19 a1.6 1.6 0 0 0 1.6 1.4 H15.4 a1.6 1.6 0 0 0 1.6 -1.4 L18 10.5"/><path d="M6 11.8 H4.2 a1.1 1.1 0 0 1 0 -2.2"/><path d="M18 11.8 H19.8 a1.1 1.1 0 0 0 0 -2.2"/><path d="M9.6 7.6 q1.2 -1.7 0 -3.4"/><path d="M14.4 7.6 q1.2 -1.7 0 -3.4"/>',
};

export function toolIcon(key, x, y, size, color, sw = 1.6) {
  const k = size / 24;
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${r(k)})" fill="none" stroke="${color}" stroke-width="${r(sw / k)}" stroke-linecap="round" stroke-linejoin="round">${ICO[key]}</g>`;
}

/* --------------------------------- type -------------------------------- */

const FACE = {
  disp: `@font-face{font-family:'Metamorphous';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${FONTS.metamorphous}) format('woff2');}`,
  italic: `@font-face{font-family:'Spectral';font-style:italic;font-weight:400;src:url(data:font/woff2;base64,${FONTS.spectralItalic}) format('woff2');}`,
};

/** Both faces, for pages that need them without knowing their content up front. */
export const ALL_FACES = `${FACE.disp}\n${FACE.italic}`;

/** Only inline the faces a document actually sets - marks carry no type at all. */
export function fontCss(body) {
  const needed = [];
  if (body.includes('Metamorphous')) needed.push(FACE.disp);
  if (body.includes('font-style="italic"')) needed.push(FACE.italic);
  return needed.join('\n');
}

const DISP = "'Metamorphous',Georgia,serif";
const SERIF = "'Spectral',Georgia,serif";

const r = (n) => Math.round(n * 1000) / 1000;
const rad = (deg) => (deg * Math.PI) / 180;

/**
 * A line of display type. text-anchor:middle counts the trailing letter-space,
 * so shift right by half of it to optically centre the run.
 */
function dispText(x, y, size, ls, fill, content, anchor = 'middle') {
  const shift = anchor === 'middle' ? (size * ls) / 2 : 0;
  return `<text x="${r(x + shift)}" y="${r(y)}" font-family="${DISP}" font-size="${r(size)}" letter-spacing="${r(size * ls)}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="middle">${content}</text>`;
}

function mottoText(x, y, size, fill, content, anchor = 'middle') {
  return `<text x="${r(x)}" y="${r(y)}" font-family="${SERIF}" font-style="italic" font-size="${r(size)}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="middle">${content}</text>`;
}

/* ------------------------------- the crest ------------------------------ */

// Verbatim from the .brand-head crest <svg> in index.html (60x60 viewBox).
const HEX_OUTER = '30,3 54,16.5 54,43.5 30,57 6,43.5 6,16.5';
const HEX_INNER = '30,10 48,20 48,40 30,50 12,40 12,20';

// Verbatim from the favicon data URI in index.html (32x32 viewBox).
const HEX_FAVICON = '16,2 29,9 29,23 16,30 3,23 3,9';

/**
 * Algiz (ᛉ), traced from the glyph the app actually renders.
 *
 * The app sets the rune as text in "Spectral",Georgia,serif - neither face
 * covers the Runic block, so it resolves through an OS fallback and looks
 * different on every machine. The outline below was measured off that rendering
 * (Chrome/Windows) by scanning the rasterised glyph, so the package reproduces
 * what the app shows while being font-independent.
 *
 * It is a trident form, not a "Y": the stem runs the full height and the two
 * arms descend from the top corners to meet it at 45% height, all terminals
 * cut flat. Measured ratios, as fractions of the ink box (W/H = 0.764):
 *   stem      x 0.425 - 0.570, full height
 *   arm tops  outer edge at x 0, inner edge at x 0.168
 *   outer edge slope 0.642 x per y, inner edge slope 0.583
 *
 * `h` is the ink height; (cx, cy) is the centre of the ink box.
 */
function runeAlgiz(cx, cy, h, fill) {
  const u = h / 200;                       // normalised: ink is 200 units tall
  const P = (x, y) => `${r(cx + x * u)} ${r(cy + y * u)}`;
  const arm = (s) => `M ${P(s * 76.4, -100)} L ${P(s * 50.73, -100)} L ${P(s * 11.1, -32.0)} L ${P(s * 11.1, 1.76)} Z`;
  return `<g fill="${fill}">`
    + `<path d="M ${P(-11.1, -100)} L ${P(11.1, -100)} L ${P(11.1, 100)} L ${P(-11.1, 100)} Z"/>`
    + `<path d="${arm(-1)}"/><path d="${arm(1)}"/>`
    + `</g>`;
}

// Rune metrics inside the app's crest, derived from the live DOM:
//   font-size 27 in a 60px crest, line-height 1, translate(-50%,-46%)
//   -> ink height 18.984 units, ink centre at (30, 31.00)
const RUNE_H_60 = 18.984, RUNE_CY_60 = 31.0;
// ...and inside the app's 32px favicon: font-size 16, baseline y=22, ink above.
const RUNE_H_32 = 11.25, RUNE_CY_32 = 16.375;

/**
 * Colour treatments. `dark` is the app exactly as it stands; the others exist
 * only because the app has no artwork for transparent, flat or light surfaces.
 */
export const SKINS = {
  dark:  { ground: C.panel, outer: C.gold2,   inner: C.line,     rune: C.gold,     innerOp: 1,    label: 'on panel' },
  black: { ground: C.bg,    outer: C.gold2,   inner: C.line,     rune: C.gold,     innerOp: 1,    label: 'on ground' },
  alpha: { ground: null,    outer: C.gold2,   inner: C.line,     rune: C.gold,     innerOp: 1,    label: 'transparent' },
  gold:  { ground: null,    outer: C.gold,    inner: C.gold,     rune: C.gold,     innerOp: 0.4,  label: 'flat gold' },
  light: { ground: C.page,  outer: C.goldInk, inner: C.pageLine, rune: C.goldInk,  innerOp: 1,    label: 'on parchment' },
};

/**
 * The brand-head crest on a 512 board. The 60-unit artwork is scaled 7.4x and
 * centred, which puts it inside the 460px circle Discord crops server icons to.
 */
export function crest({ skin = 'dark', ground = true } = {}) {
  const s = SKINS[skin];
  const S = 7.4, T = 256 - 30 * S;
  return {
    defs: '',
    body: `${ground && s.ground ? `<rect width="512" height="512" fill="${s.ground}"/>` : ''}
      <g transform="translate(${r(T)} ${r(T)}) scale(${S})">
        <polygon points="${HEX_OUTER}" fill="none" stroke="${s.outer}" stroke-width="1.5"/>
        <polygon points="${HEX_INNER}" fill="none" stroke="${s.inner}" stroke-width="1" opacity="${s.innerOp}"/>
        ${runeAlgiz(30, RUNE_CY_60, RUNE_H_60, s.rune)}
      </g>`,
  };
}

/**
 * The app's favicon drawing - one filled hexagon, heavier stroke, no inner ring.
 * This is the identity's own answer to small sizes, so it is what the package
 * uses below ~128px rather than shrinking the two-hexagon crest into mush.
 */
export function crestSmall({ skin = 'dark', ground = true, scale = 14.2 } = {}) {
  const s = SKINS[skin];
  // The app's favicon is drawn nearly edge-to-edge in its 32px box. At 16x that
  // leaves ~4px between the hexagon's stroke and Discord's circular crop, so
  // general-purpose renders are inset; pass scale:16 for the exact tab icon.
  const S = scale, T = 256 - 16 * S;
  const fill = skin === 'alpha' || skin === 'gold' ? 'none' : (s.ground || C.panel);
  return {
    defs: '',
    body: `${ground && s.ground ? `<rect width="512" height="512" fill="${s.ground}"/>` : ''}
      <g transform="translate(${r(T)} ${r(T)}) scale(${S})">
        <polygon points="${HEX_FAVICON}" fill="${fill}" stroke="${skin === 'dark' || skin === 'black' ? C.gold : s.outer}" stroke-width="2"/>
        ${runeAlgiz(16, RUNE_CY_32, RUNE_H_32, s.rune)}
      </g>`,
  };
}

export const MARKS = { crest, 'crest-small': crestSmall };

/** The `◆` the app sets under .brand-head, drawn rather than typed. */
function diamond(cx, cy, R, fill, opacity = 1) {
  return `<path d="M ${r(cx)} ${r(cy - R)} L ${r(cx + R * 0.62)} ${r(cy)} L ${r(cx)} ${r(cy + R)} L ${r(cx - R * 0.62)} ${r(cy)} Z" fill="${fill}" opacity="${opacity}"/>`;
}

/* ------------------------------- lockups -------------------------------- */

/** The crest scaled into a `size` box with its top-left at (x, y). */
export function placeCrest(x, y, size, opts) {
  const m = crest(opts);
  return { defs: m.defs, body: `<g transform="translate(${r(x)} ${r(y)}) scale(${r(size / 512)})">${m.body}</g>` };
}

function palette(skin) {
  const light = skin === 'light';
  return {
    inkC: light ? C.pageInk : C.ink,
    goldC: light ? C.goldInk : C.gold,
    dimC: light ? C.pageDim : C.dim,
  };
}

/**
 * The .brand-head stack, at the app's own proportions.
 * Relative to a crest of size M: gap 10/60, THE 11/60 at .4em tracking,
 * gap 8/60, wordmark 27/60 at .06em, gap 10/60, motto 12.5/60 italic.
 */
export function lockupStacked(cx, top, M, { skin = 'alpha', motto = true, divider = false } = {}) {
  const { inkC, goldC, dimC } = palette(skin);
  const m = placeCrest(cx - M / 2, top, M, { skin, ground: false });

  let y = top + M + M * 0.1667;
  const theY = y + M * 0.11;
  y += M * 0.22 + M * 0.1333;
  const wmY = y + M * 0.225;
  y += M * 0.45 + M * 0.1667;
  const mtY = y + M * 0.125;
  const end = motto ? mtY + M * 0.125 : y;

  return {
    defs: m.defs,
    height: (divider ? end + M * 0.22 : end) - top,
    body: `${m.body}
      ${dispText(cx, theY, M * 0.1833, 0.4, goldC, 'THE')}
      ${dispText(cx, wmY, M * 0.45, 0.06, inkC, `ZII <tspan fill="${goldC}">CODEX</tspan>`)}
      ${motto ? mottoText(cx, mtY, M * 0.2083, dimC, 'The soul of every recipe') : ''}
      ${divider ? diamond(cx, end + M * 0.11, M * 0.075, skin === 'light' ? C.goldInk : C.gold2) : ''}`,
  };
}

/** Crest left, type right. The app has no wide lockup; same parts, rearranged. */
export function lockupHorizontal(x, cy, M, { skin = 'alpha', motto = true } = {}) {
  const { inkC, goldC, dimC } = palette(skin);
  const m = placeCrest(x, cy - M / 2, M, { skin, ground: false });
  const tx = x + M * 1.25;

  return {
    defs: m.defs,
    body: `${m.body}
      ${dispText(tx, cy - M * (motto ? 0.44 : 0.30), M * 0.1833, 0.4, goldC, 'THE', 'start')}
      ${dispText(tx, cy + M * (motto ? 0.02 : 0.12), M * 0.45, 0.06, inkC, `ZII <tspan fill="${goldC}">CODEX</tspan>`, 'start')}
      ${motto ? mottoText(tx + M * 0.01, cy + M * 0.44, M * 0.2083, dimC, 'The soul of every recipe', 'start') : ''}`,
  };
}

/**
 * The `.zii` inline lockup from the app shell: rune, 8px gap, "Zii Codex" at
 * 14px with Codex in gold. Sized here off the rune's font-size equivalent.
 */
export function lockupInline(x, cy, fs, { skin = 'alpha' } = {}) {
  const { inkC, goldC } = palette(skin);
  const runeH = fs * 0.703;                 // ink height for a 16px rune ~ 11.25
  const tx = x + fs * 0.55 + fs * 0.5;
  return {
    defs: '',
    body: `${runeAlgiz(x + fs * 0.27, cy, runeH, goldC)}
      ${dispText(tx, cy, fs * 0.875, 0.06, inkC, `Zii <tspan fill="${goldC}">Codex</tspan>`, 'start')}`,
  };
}

/** Wordmark alone, no crest. */
export function wordmark(cx, cy, size, { skin = 'alpha', the = true } = {}) {
  const { inkC, goldC } = palette(skin);
  return {
    defs: '',
    body: `${the ? dispText(cx, cy - size * 0.72, size * 0.41, 0.4, goldC, 'THE') : ''}
      ${dispText(cx, cy, size, 0.06, inkC, `ZII <tspan fill="${goldC}">CODEX</tspan>`)}`,
  };
}

/* ------------------------------- banners -------------------------------- */

/** Hex-lattice watermark built from the crest's own outer hexagon proportions. */
function latticePattern(id, R, color, opacity, sw = 1.2) {
  const W = Math.sqrt(3) * R, H = 3 * R;
  const pts = (cx, cy) => [-90, -30, 30, 90, 150, 210]
    .map((a) => `${r(cx + R * Math.cos(rad(a)))},${r(cy + R * Math.sin(rad(a)))}`).join(' ');
  const cells = [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]
    .map(([x, y]) => `<polygon points="${pts(x, y)}"/>`).join('');
  return [
    `<pattern id="${id}" width="${r(W)}" height="${r(H)}" patternUnits="userSpaceOnUse">
       <g fill="none" stroke="${color}" stroke-width="${sw}" opacity="${opacity}">${cells}</g>
     </pattern>`,
    `url(#${id})`,
  ];
}

/**
 * One hairline split into the five workshop accents. The only ornament in this
 * package that the app itself does not have - set ACCENT_RULE=false in
 * build.mjs to drop it from every banner.
 */
export function accentRule(x, y, w, h, light = false) {
  const seg = w / TOOLS.length;
  return TOOLS.map((t, i) =>
    `<rect x="${r(x + i * seg)}" y="${r(y)}" width="${r(seg + 0.5)}" height="${r(h)}" fill="${light ? t.dark : t.color}"/>`
  ).join('');
}

const ruleFor = (W, H, on, light) =>
  on ? accentRule(0, H - Math.max(3, H * 0.009), W, Math.max(3, H * 0.009), light) : '';

/* -- Forge Dark: the default. Panel ground, lattice, ember from below. ---- */
function bannerForge(W, H, rule) {
  const M = Math.min(H * 0.28, W * 0.15);
  const probe = lockupStacked(W / 2, 0, M, { motto: H > 260, divider: H > 300 });
  const lk = lockupStacked(W / 2, H / 2 - probe.height / 2, M, { motto: H > 260, divider: H > 300 });
  const [pat, patRef] = latticePattern('forgeLattice', H * 0.11, C.gold, 0.05);

  return {
    defs: `${pat}${lk.defs}
      <linearGradient id="forgeSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1c1811"/><stop offset="1" stop-color="${C.bg}"/>
      </linearGradient>
      <radialGradient id="forgeEmber" cx="50%" cy="112%" r="72%">
        <stop offset="0" stop-color="#e0873a" stop-opacity="0.40"/>
        <stop offset="0.45" stop-color="${C.gold}" stop-opacity="0.12"/>
        <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
      </radialGradient>`,
    body: `<rect width="${W}" height="${H}" fill="url(#forgeSky)"/>
      <rect width="${W}" height="${H}" fill="${patRef}"/>
      <rect width="${W}" height="${H}" fill="url(#forgeEmber)"/>
      ${lk.body}
      ${ruleFor(W, H, rule)}`,
  };
}

/* -- Five Workshops: says what the thing actually is. --------------------- */
function bannerWorkshops(W, H, rule) {
  const M = Math.min(H * 0.22, W * 0.085);
  const padX = W * 0.06;
  const lk = lockupHorizontal(padX, H * 0.50, M, { motto: H > 200 });

  const railW = W * 0.46, railX = W - padX - railW;
  const cell = railW / 5, icon = Math.min(cell * 0.42, H * 0.19);
  const iconY = H * 0.41 - icon / 2;
  const tiles = TOOLS.map((t, i) => {
    const cx = railX + cell * (i + 0.5);
    return `${toolIcon(t.key, cx - icon / 2, iconY, icon, t.color, 1.7)}
      <text x="${r(cx)}" y="${r(iconY + icon + H * 0.095)}" font-family="${DISP}" font-size="${r(Math.min(cell * 0.135, H * 0.05))}" fill="${t.color}" text-anchor="middle" dominant-baseline="middle">${t.name}</text>`;
  }).join('');

  const [pat, patRef] = latticePattern('wsLattice', H * 0.13, C.gold, 0.038);

  return {
    defs: `${pat}${lk.defs}
      <linearGradient id="wsSky" x1="0" y1="0" x2="1" y2="0.6">
        <stop offset="0" stop-color="#221c14"/><stop offset="1" stop-color="${C.bg}"/>
      </linearGradient>`,
    body: `<rect width="${W}" height="${H}" fill="url(#wsSky)"/>
      <rect width="${W}" height="${H}" fill="${patRef}"/>
      ${lk.body}
      <line x1="${r(railX - W * 0.035)}" y1="${r(H * 0.33)}" x2="${r(railX - W * 0.035)}" y2="${r(H * 0.73)}" stroke="${C.line}" stroke-width="2"/>
      ${tiles}
      ${ruleFor(W, H, rule)}`,
  };
}

/* -- Ember Spotlight: mood. Best as the 1920x1080 splash. ---------------- */
function bannerSpotlight(W, H, rule) {
  const M = Math.min(H * 0.30, W * 0.13);
  const lk = lockupHorizontal(W * 0.30, H * 0.5, M, { motto: H > 200 });

  // Deterministic, so a re-render is byte-identical.
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const sparks = Array.from({ length: 24 }, () => {
    const x = W * (0.02 + rnd() * 0.55), y = H * (0.15 + rnd() * 0.85);
    const R = 1.5 + rnd() * 4;
    return diamond(x, y, R, rnd() > 0.55 ? '#f4d489' : '#e0873a', 0.25 + rnd() * 0.5);
  }).join('');

  return {
    defs: `${lk.defs}
      <radialGradient id="spotGlow" cx="14%" cy="105%" r="92%">
        <stop offset="0" stop-color="#f0a24a" stop-opacity="0.55"/>
        <stop offset="0.28" stop-color="#c9762e" stop-opacity="0.24"/>
        <stop offset="0.62" stop-color="${C.gold}" stop-opacity="0.06"/>
        <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="spotVig" cx="50%" cy="50%" r="72%">
        <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.6"/>
      </radialGradient>`,
    body: `<rect width="${W}" height="${H}" fill="${C.bg}"/>
      <rect width="${W}" height="${H}" fill="url(#spotGlow)"/>
      ${sparks}
      <rect width="${W}" height="${H}" fill="url(#spotVig)"/>
      ${lk.body}
      ${ruleFor(W, H, rule)}`,
  };
}

/* -- Codex Page: the light one, for Nexus and docs. ---------------------- */
function bannerPage(W, H, rule) {
  const M = Math.min(H * 0.28, W * 0.15);
  const opt = { skin: 'light', motto: H > 260, divider: H > 300 };
  const probe = lockupStacked(W / 2, 0, M, opt);
  const lk = lockupStacked(W / 2, H / 2 - probe.height / 2, M, opt);
  const [pat, patRef] = latticePattern('pgLattice', H * 0.11, '#8a7448', 0.10);
  const marginX = W * 0.055;

  return {
    defs: `${pat}${lk.defs}
      <linearGradient id="pgSky" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="#f2e7cd"/><stop offset="1" stop-color="${C.pageDeep}"/>
      </linearGradient>
      <radialGradient id="pgStain" cx="82%" cy="18%" r="60%">
        <stop offset="0" stop-color="#b99a5e" stop-opacity="0.28"/>
        <stop offset="1" stop-color="#b99a5e" stop-opacity="0"/>
      </radialGradient>`,
    body: `<rect width="${W}" height="${H}" fill="url(#pgSky)"/>
      <rect width="${W}" height="${H}" fill="${patRef}"/>
      <rect width="${W}" height="${H}" fill="url(#pgStain)"/>
      <line x1="${r(marginX)}" y1="0" x2="${r(marginX)}" y2="${H}" stroke="#a8433a" stroke-width="1.6" opacity="0.45"/>
      <line x1="${r(W - marginX)}" y1="0" x2="${r(W - marginX)}" y2="${H}" stroke="#a8433a" stroke-width="1.6" opacity="0.45"/>
      ${lk.body}
      ${ruleFor(W, H, rule, true)}`,
  };
}

export const BANNERS = { forge: bannerForge, workshops: bannerWorkshops, spotlight: bannerSpotlight, page: bannerPage };
export const BANNER_LABEL = {
  forge: 'Forge Dark', workshops: 'Five Workshops', spotlight: 'Ember Spotlight', page: 'Codex Page',
};

/* ------------------------------- assembly ------------------------------- */

export function svgDoc({ w, h, defs = '', body, title }) {
  const css = fontCss(body);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
  <title>${title}</title>
  <defs>${defs}</defs>${css ? `\n  <style>${css}</style>` : ''}
  <g id="content">${body}</g>
</svg>`;
}
