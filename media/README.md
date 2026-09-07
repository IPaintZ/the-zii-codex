# The Zii Codex — media package

Every file you need for Discord, the web, GitHub and Nexus, built from the
identity that is **already in `index.html`**. This is a packaging job, not a
redesign: the hexagon coordinates, colours, type sizes and spacing are copied
out of the `.brand-head`, `.zii` and favicon rules in that file.

```bash
node media/build.mjs
```

Writes **48 SVG sources** to `media/svg/` and **68 PNGs** to `media/png/<group>/`,
then rewrites `media/contact-sheet.html`. Takes about 10 seconds. Pass a
substring to rebuild a subset: `node media/build.mjs banner-spotlight`.

**Open the contact sheet first** — it shows every asset, a Discord sidebar mock
at real 48 px, and a 128/64/32/16 px legibility strip. Two copies are built:

| File | Size | For |
|---|---|---|
| `download-catalog.html` | 11.5 MB | **Handing files to other people.** Every PNG and SVG is embedded, with a download button per size, a per-section ZIP, and a "download everything" ZIP. Click any thumbnail to view it full size — arrow keys step through, and the download buttons follow you into the viewer. Someone who has only this one file can browse and get any asset out of it, offline. |
| `contact-sheet-portable.html` | 1.6 MB | **Showing the work.** Same previews, no download buttons, a seventh of the size. Mail it, drop it in Discord. |
| `contact-sheet.html` | 16 KB | **Working locally.** Links to the loose files, so it reflects a rebuild immediately — but it has to be served, or the images won't resolve. |

```bash
python -m http.server 8787 --directory media
```

The first two are **gitignored** — between them they are 13 MB of base64, and a
fresh copy lands every time the artwork changes. Run `node media/build.mjs` to
produce them; the loose PNG/SVG files and `contact-sheet.html` are in git.

`contact-sheet-portable.html` embeds the **SVG** sources rather than the PNGs —
a fifth of the size, and crisp at any zoom. It is a preview of the package.
`download-catalog.html` embeds the **real PNGs** as well, which is why it is
seven times larger: it is the package. Both leave `media/png/` untouched.

The catalog's ZIP is written in the page by hand (store-only — PNGs are already
compressed, so deflating again buys nothing and would cost a dependency). It has
been checked against Windows' own extractor: every entry comes out byte-identical
to the source file, with the `png/` and `svg/` folder structure preserved.

---

## The two drawings

The identity already contains two different drawings of the same mark, and the
package keeps both rather than inventing a third.

| | What it is | Use it |
|---|---|---|
| **The crest** `crest-*` | The `.brand-head` mark: two nested hexagons, gold outer / dark inner, rune centred | 256 px and up — server icon, banners, lockups |
| **The small drawing** `crest-small-*` | The favicon artwork: one filled hexagon, heavier stroke, no inner ring | Below ~128 px — favicons, tiny avatars |

The inner hexagon is `--line` `#3d3325`, which is nearly the ground colour by
design. It reads as a subtle second ring up close and vanishes at small sizes —
that's why the identity has a separate small drawing, and why you should use it.

Each comes in five colour treatments. `on panel` and `on ground` are the app
exactly as it stands; the other three exist only because the app has no artwork
for those surfaces:

`on panel` `#211c16` · `on ground` `#16130f` · `transparent` · `flat gold` (single tone, for stickers and watermarks) · `on parchment` (darkened gold for light backgrounds)

## Lockups

| | Follows |
|---|---|
| **stacked** | The app's `.brand-head` spacing exactly — crest / THE / ZII CODEX / motto / ◆ |
| **inline** | The app's `.zii` shell lockup — rune, 8 px gap, *Zii **Codex*** |
| **horizontal** | No app precedent. Same parts, rearranged for wide surfaces. |
| **wordmark** | Type alone, no crest |

All four are trimmed to their ink and ship on transparent, in flat gold, and in
parchment ink.

## Banners

The app has no banner artwork, so these are compositions — but they are built
from the app's own parts: the crest, the lockup, the hex lattice, the `◆`.

| Style | What it is | Use it for |
|---|---|---|
| **Forge Dark** `forge` | Panel ground, hex-lattice watermark, ember bleeding up from the bottom | The default. Discord server banner. |
| **Five Workshops** `workshops` | Lockup left, the five tools named in their own accent colours right | Anywhere a newcomer needs to learn what this *is* |
| **Ember Spotlight** `spotlight` | Glow from the lower-left, drifting sparks, heavy vignette | Mood. The 1920×1080 splash. |
| **Codex Page** `page` | Parchment, ink-gold lockup, ruled margins | Nexus Mods, docs, print |

**One added ornament:** the five-colour hairline along the bottom edge, one
segment per workshop. It's the only device here the app doesn't already have.
Set `ACCENT_RULE = false` in `build.mjs` to drop it from every banner.

## What's in the box

```
media/
  svg/               48 sources — self-contained, fonts inlined
  png/crest/         both drawings × 5 treatments, 1024 / 512 / 256 / 128 / 64
  png/lockup/        stacked, horizontal, inline, wordmark — trimmed, transparent
  png/discord/       server icon 512², banners 960×540, 1920×1080, 600×240
  png/web/           favicons 180 / 64 / 32 / 16
  png/social/        OG card 1200×630, GitHub social 1280×640
  download-catalog.html       every file embedded + download buttons — send this
  contact-sheet-portable.html previews only, fully embedded, small
  contact-sheet.html          previews via links (needs a server)
  build.mjs                   manifest + orchestration + all three sheets
  src/brand.mjs               all artwork
  src/chrome.mjs              headless-Chrome renderer (CDP, no dependencies)
  src/catalog-client.js       catalog runtime: downloads, ZIP writer, filter
  src/build-fonts.py          refetch + re-subset the webfonts
```

### Where each file goes

| Surface | File |
|---|---|
| Discord **server icon** | `png/discord/server-icon-512.png` |
| Discord **server banner** | `png/discord/discord-banner-<style>-960x540.png` |
| Discord **invite splash** | `png/discord/hero-<style>-1920x1080.png` |
| Discord **profile banner** | `png/discord/profile-banner-<style>-600x240.png` |
| Nexus Mods hero | `png/discord/hero-page-1920x1080.png` (the parchment one) |
| GitHub social preview | `png/social/github-social-<style>-1280x640.png` |
| Link previews (`og:image`) | `png/social/og-card-<style>-1200x630.png` |
| Emoji / stickers / watermarks | `png/crest/crest-gold-1024.png` |

Discord crops server icons to a circle, so the crest is composed inside a 460 px
safe circle on a 512 px board. Note that the app's own favicon is drawn nearly
edge-to-edge in its 32 px box — at full scale that leaves only about 4 px between
the hexagon and the circular crop, so `crest-small-*` is inset slightly. The
`favicon-*` PNGs keep the original edge-to-edge framing, since nothing crops them.

## `index.html` is untouched

The package ships favicon PNGs but does **not** modify `index.html`. Its current
favicon is an inline data URI that sets ᛉ as text, so it renders through an OS
font fallback and looks slightly different on every machine. If you ever want to
fix that without changing the design, `media/svg/favicon-16.svg` is the same
drawing with the rune as a path — paste it back in as a data URI.

## Notes for whoever edits this next

- **The rune is drawn, not typed.** Algiz (ᛉ) is in a Unicode block that neither
  Metamorphous nor Spectral covers, so the app renders it via an OS fallback.
  `runeAlgiz()` reproduces that glyph as paths, traced by rasterising the real
  rendering and scanning it. It is a **trident** — full-height stem, two arms
  descending from the top corners to meet it at 45% height, all terminals cut
  flat. It is not a "Y"; if you redraw it, keep the stem running to the top.
- **Colours and type come from `index.html`.** If the app's palette moves, update
  `C` and `TOOLS` in `src/brand.mjs` and rebuild — never hand-edit generated SVGs.
- **Fonts are inlined as base64 woff2**, subsetted to printable ASCII by
  `src/build-fonts.py`. That's why the sources open correctly with no network and
  no installed fonts. Adding copy outside ASCII means widening `KEEP` and re-running it.
- **Don't round-trip these files through PowerShell.** `Get-Content`/`Set-Content`
  on PS 5.1 re-encodes the non-ASCII characters (ᛉ, —, ×) into mojibake. Use a
  UTF-8-aware editor.
- A full `build.mjs` run clears `svg/` and `png/` first, so deleting an asset from
  the manifest actually removes its files.
- The renderer talks CDP to whatever Chrome or Edge it finds — no `node_modules`,
  nothing to install.
