# Guide authoring — adding the guidance layer to a Zii Codex tool

The guidance layer is a reusable onboarding system: a first-run welcome, a guided
tour, a help drawer with a shared glossary, first-time per-tab hints, inline term
tooltips, and tab-switch highlighting. The **engine is tool-agnostic**; each tool
only supplies a **config object**. This doc is the contract.

Reference implementation: [`guide-core.js`](guide-core.js) (engine) +
[`guide-emberforge.js`](guide-emberforge.js) (Emberforge config), wired into
[`smithy-app.html`](smithy-app.html).

---

## 1. How it plugs in

Each tool app is one big self-contained HTML file with a global `tab(n)` function
that toggles `#tab-<n>` panels / `#t-<n>` nav buttons and calls `render()`. The guide
attaches to that **at runtime** — it never modifies the app's own logic.

Add two `<script>` tags, in this order, immediately before `</body>` (after the
app's own inline `<script>`):

```html
<script src="guide-core.js"></script>
<script src="guide-<tool>.js"></script>
```

`guide-core.js` is shared verbatim by every tool. `guide-<tool>.js` is per-tool and
calls `ZiiGuide.register({...})` exactly once. The core waits for the app's `tab()`
to exist before booting, so load order relative to the app script is forgiving, but
**core must precede the config**.

There is one guide per tool page. A second `register()` is ignored (guarded by
`window.__ziiGuide`).

---

## 2. The config shape

```js
window.ZiiGuide.register({
  id:    "emberforge",   // REQUIRED. localStorage namespace + "you're here" match.
  tool:  "Emberforge",   // REQUIRED. Display name; must equal this tool's name in
                         //   the shared workshop list so the welcome card lights up.

  hints: { <tab>: [icon, title, body, showTourLink] },   // first-time per-tab banner
  how:   { <tab>: { h, s, steps: [[title, body], ...] } },// "How it works" in drawer
  tips:  [ { root:()=>el, word, html }, ... ],           // inline dotted tooltips
  steps: [ { tab, resolve:()=>el, title, body }, ... ],  // the guided tour
  emptyStates: { <elementId>: "<html>", ... },           // optional; app-specific

  gloss:     [ [term, def], ... ],        // optional; defaults to shared glossary
  workshops: [ [icon, name, desc], ... ], // optional; defaults to shared list

  nav: { fn, btnPrefix, panelPrefix },    // optional; nav binding (see below)
});
```

### `nav` — nav binding (only if the app isn't `tab()`/`t-`/`tab-`)
The engine hooks the app's global view-switch function and finds nav buttons/panels
by id prefix. Defaults match most tools: `{ fn:"tab", btnPrefix:"t-", panelPrefix:"tab-" }`
(button `#t-<view>`, panel `#tab-<view>`, switch via `tab('<view>')`). Override only
when the app differs — e.g. **Cookfire** uses `view()` with `#v-<view>` buttons and
`#view-<view>` panels:

```js
nav: { fn:"view", btnPrefix:"v-", panelPrefix:"view-" },
```

Everywhere else in the config, a "tab" is just the view id string (`"kitchen"`,
`"desk"`, …) — `hints`/`how` are keyed by it and `steps[].tab` is it. Note some apps
don't use the `.box` container class (Cookfire doesn't), so `box()`/`firstBox()` won't
resolve there — target the app's real containers with `$("#view-<v> .<realClass>")`.

### `id` and `tool`
- `id` derives the localStorage keys: `keizaal_guide_welcome_<id>` and
  `keizaal_guide_hint_<id>_<tab>`. Keep it stable — changing it resets everyone's
  "seen" state. Use the tool's internal id (`emberforge`, `loomhall`, …).
- `tool` is the human name shown in the welcome header, tour, and help title. It is
  matched against the shared workshop list to flag the "you're here" card, so it
  must match exactly (e.g. `"Loomhall"`).

### `hints` — first-time per-tab banner
Keyed by tab id. Value is `[icon, title, body, showTourLink]`:
- `icon` — one emoji.
- `title` — one short sentence, the tab's promise.
- `body` — 1–2 sentences on what the tab is for. Gloss any jargon in plain words.
- `showTourLink` — `true` adds a "Take the tour →" link (use on the 1–2 entry tabs,
  e.g. the main desk and Settings). Everywhere else `false`.

Shown full-size, steel-blue, dismissible; dismissal persists per tab. Injected at the
top of `#tab-<tab>`, so every tab you want a hint on must exist.

### `how` — "How it works" (help drawer)
Keyed by tab id. `{ h: heading, s: one-line subhead, steps: [[title, body], ...] }`.
3–5 numbered steps, each a short imperative title + a sentence. `body` may contain
`<b>` for key terms. The drawer shows the entry for the **current** tab.

### `tips` — inline dotted-underline tooltips
An array of `{ root, word, html }`:
- `root()` returns the element to search **within** (use the helpers, below).
- `word` is the exact visible text to wrap — the FIRST text-node occurrence inside
  `root` is wrapped with a dotted underline; hover shows `html`.
- `html` is the tooltip body (`<b>` renders gold).

These are **dotted words in the real UI, not ⓘ badges**. Target real jargon the
player actually sees (Rate, Buyback, Labor, Till, …). A resolver that returns `null`
is silently skipped, so a tip for a term not on a given tool simply no-ops.

### `steps` — the guided tour
An array of `{ tab, resolve, title, body }`, ~8–12 steps:
- `tab` — the tab to switch to (the engine calls `tab()` for you and pulses the nav).
- `resolve()` returns the element to spotlight. **Spotlight a SMALL representative
  element** (a table row, a single box) — never a tall panel, or the spotlight
  swallows the screen. For long lists, target one row:
  `document.querySelector("#invBody tr:not(.catrow)") || box("invBody")`.
- `title` — short.
- `body` — 1–2 sentences. Plain text (rendered as textContent).

Order the steps as the real workflow: entry/setup → build → price → checkout →
review. End on a warm closing line. If a `resolve()` returns `null` at runtime the
tour auto-advances rather than showing a broken frame, but author every step to
resolve on a fresh `?demo` load.

### `emptyStates` — instructional empty states (optional)
`{ elementId: htmlString }`. The engine sets `.innerHTML` of each element by id
(e.g. Emberforge fills `#orderEmpty` with a 3-step "what to do" and `#needEmpty`
with a nudge). Use the `zg-es*` classes (see core CSS) for consistent styling. Omit
if the tool has no empty containers worth teaching.

### `gloss` / `workshops` — shared, override rarely
Both default to the shared lists in the core:
- `ZiiGuide.SHARED_GLOSS` — the cross-tool glossary. **Keep it identical across
  tools** ("learn the terms once"). Only pass `gloss` to ADD tool-specific terms —
  and prefer `[...ZiiGuide.SHARED_GLOSS, ...extra]` so the shared set stays intact.
- `ZiiGuide.SHARED_WORKSHOPS` — the five workshop cards on the welcome screen. Every
  tool shows all five; the current one is flagged by matching `tool`. Don't override
  unless the suite's line-up changes.

---

## 3. DOM helpers (for resolvers)

The core exposes `window.ZiiGuide.helpers`. Destructure at the top of your config:

```js
const { $, el, byText, gid, box, row, lbl, lblRow, firstBox } = window.ZiiGuide.helpers;
```

| helper | returns |
|---|---|
| `gid(id)` | `document.getElementById(id)` |
| `box(id)` | nearest `.box` ancestor of `#id` |
| `row(id)` | nearest `.row` (or `.box`) ancestor of `#id` |
| `lbl(id)` | nearest `<label>` ancestor of `#id` |
| `lblRow(id)` | nearest `.row` (or `.box`) ancestor of `#id` |
| `firstBox(tab)` | first `.box` inside `#tab-<tab>` |
| `byText(scope, sel, text)` | first `sel` under `scope` whose text starts with `text` (case-insensitive). `scope` may be a selector string or an element. |
| `$(sel, root?)` | `querySelector` |
| `el(tag, attrs?, html?)` | build an element |

You can also use raw `document.querySelector(...)` in a resolver when nothing above
fits (see the Inventory-row step). Prefer the helpers for readability.

---

## 4. Conventions (match these across tools)

- **Gloss every term.** Keep the fantasy flavor, but any jargon a new player meets
  gets either a dotted tooltip (`tips`), a glossary entry, or plain-word framing in a
  hint. The shared glossary is learned once — reuse it, don't fork it.
- **Dotted tooltips, not badges.** Wrap the real word; no ⓘ icons.
- **Hints are full-size, per-tab, dismissible, persisted.** One per tab, at most two
  with a tour link.
- **Empty states teach in 3 steps.** Icon + title + a short ordered "do this" list.
- **Tours are ~10 steps, spotlighting SMALL elements**, following the real workflow,
  with a warm closing step.
- **Calm / compact spacing.** The core adds `body.zg-compact` (gentle padding
  reduction); leave it on.
- **The review dock is localhost-only.** It appears on `localhost`/`127.0.0.1`/
  `file:`/`?review` and never on the live site — so it never ships through the gate.
  Use it to demo each feature during review.
- **Welcome is persisted** ("Don't show again"); the FAB (`?`, bottom-right) and the
  help drawer are always available to reopen everything.

---

## 5. Adding a new tool — checklist

1. **Copy** `guide-emberforge.js` → `guide-<tool>.js`. Change `id` and `tool`.
   Read the app's `<nav>` and its switch function: if it isn't `tab()`/`t-`/`tab-`,
   add a `nav` override (see §2).
2. **Map the tabs.** List the tool's views (its switch-fn ids). Write a `hints` entry
   for each, and a `how` entry for each.
3. **Pick the jargon.** For each real term the tool surfaces, add a `tips` entry
   (resolver + word + gloss) or lean on the shared glossary. Add tool-specific terms
   via `gloss: [...ZiiGuide.SHARED_GLOSS, ...]` only if needed.
4. **Author the tour.** ~10 `steps` following the tool's real workflow; each
   `resolve()` targets a small element; verify each resolves on a `?demo` load.
5. **Empty states.** If the tool has empty containers (order list, needs list…),
   fill `emptyStates` by element id.
6. **Wire it up.** Add the two `<script>` tags before `</body>` in `<tool>-app.html`.
7. **Verify in the browser** at `<tool>-app.html?demo`: no console errors; welcome
   shows the five workshops with this tool flagged; each tab hint appears; every tour
   step spotlights the right small element across tab switches; dotted tooltips wrap;
   glossary lists the shared terms; the review dock appears (localhost only).

Tools differ in structure — don't assume Emberforge's element ids exist elsewhere.
Read the tool's HTML for the real ids before writing resolvers. Suggested rollout
order (most-to-least similar to Emberforge): Loomhall → Trademoot → Elixirhall →
Cookfire.

### The "pricing move" is Emberforge-specific
Emberforge moved material-price editing from Recipes (read-only now) into
Inventory → Materials (editable). That is an **app-behavior** change, not part of the
guide, and it depends on Emberforge's Inventory/Recipes structure. Do **not** assume
it applies to other tools — evaluate each tool's own structure separately before
porting anything like it.

---

## 6. Gotchas (don't regress these)

- **Spotlight uses viewport coordinates.** `.zg-spot` lives inside a `position:fixed`
  `.zg-block`, so `place()` positions it from `getBoundingClientRect()` with **no**
  scroll offset. Page scrolling is also locked during the tour (wheel/touch/scroll
  keys prevented; programmatic `scrollTo` still works). Both together keep the spot
  glued to its target.
- **Spotlight small elements.** A step targeting a ~1900px-tall panel dims almost
  nothing. Target a row or a compact box.
- **Rapid Next is guarded.** `showStep` uses a generation counter and `fillCoach()`
  sets the coach text synchronously, so fast clicks can't desync coach/tab/spotlight.
  Keep that pattern if you touch the engine.
- **`dotWord` wraps a text node**, not an icon — it walks the first matching text
  node inside `root` and splits it. If a word never wraps, check the resolver returns
  the element that actually contains that text.
- **localStorage prefix is `keizaal_`** (not `keisaal_`). The core builds keys from
  `id`; don't hand-write them.
