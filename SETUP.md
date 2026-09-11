# The Zii Codex — one-time setup

Do this once. For the weekly running of the site, see **RUNBOOK.md**.

## What this is

The Zii Codex is a static site with five workshops behind a single access gate:

- **Emberforge** — weapons, armour & ingots
- **Loomhall** — clothing, cloth & thread
- **Trademoot** — buy low, sell high, haul & haggle
- **Elixirhall** — potions, poisons & reagents
- **Cookfire** — food, drink & produce

Players need a code to get in. You sell codes and manage everything from the built‑in
**admin panel**. Who has access is decided by a public file, `status.json`, that sits next to
the page: it holds the current **week number** and the SHA‑256 **hashes** of every active code.
A code works only while the week it's paid through is ≥ the current week. If `status.json`
can't be loaded, nobody gets in (fail‑closed).

The site ships with the full item catalog but **no prices** — every player fills in their own,
saved only in their own browser.

- **Repo:** https://github.com/IPaintZ/the-zii-codex (public)
- **Live URL:** https://ipaintz.github.io/the-zii-codex/

---

## 1. Create the GitHub token

The admin panel writes `status.json` through the GitHub API using a token you paste into it.
Make a **fine‑grained** token scoped to this one repo and nothing else:

1. GitHub → **Settings → Developer settings → Fine‑grained tokens → Generate new token**.
2. **Repository access → Only select repositories →** `the-zii-codex`.
3. **Permissions → Repository permissions → Contents → Read and write**. Leave everything else at
   *No access*.
4. Set an expiry you'll remember to renew (e.g. 90 days), generate, and copy the
   `github_pat_…` string.

The token lives only in the browser you paste it into. It is never written into any file and
never committed. If it leaks, revoke it on GitHub and make a new one.

## 2. Connect the admin panel

> **Do this on the live https site, not a local file.** GitHub blocks writes coming from a
> `file://` page, so the panel can only publish when you open it from the live URL.

1. Open **https://ipaintz.github.io/the-zii-codex/** → click **admin** at the bottom of the gate.
2. Enter the admin passphrase (you set this — see the note at the end).
3. Go to the **Settings** tab and fill in **GitHub connection**:
   - **Owner:** `IPaintZ`
   - **Repository:** `the-zii-codex`
   - **Branch:** `main`
   - **Status file path:** `status.json`
   - **GitHub token:** paste your `github_pat_…`
4. Click **Save settings**, then **Reload live list**. You should see a green
   "Loaded. Week N, … codes." line. If you get an error, re‑check the owner, repo, and token.

Settings are saved in **this browser only**. See RUNBOOK.md → "Golden rules" — always admin
from the same browser.

## 3. Generate your first code and unlock

1. In the **Customers** tab, under **New customer**, leave the tool chips as you like, type a
   note (e.g. `me`), set **weeks**, and click **Generate**. Copy the `KSL-…` code it shows.
2. Click **Publish to GitHub**. **The code does not work until you Publish.**
3. Close the admin panel, paste the code into the gate, and click **Unlock**. You're in.

---

## 4. Deploy the analytics beacon

Skip this and the site still works — you just lose some of your visitor numbers. Worth
twenty minutes.

The Codex counts pageviews with **GoatCounter** (cookieless, no personal data). The problem
is that tracker blocklists name GoatCounter's own hostnames outright — AdGuard's Tracking
Protection filter, on by default, carries `||gc.zgo.at^` and `||goatcounter.com^`, which
kills the script *and* the fallback pixel. Those visitors load the site fine and are simply
never counted.

The fix is to serve the beacon from a hostname of your own. `analytics/worker.js` is a
~60-line Cloudflare Worker that re-serves GoatCounter's script and forwards hits to the same
dashboard. Nothing about what is collected changes.

1. Sign up at **https://dash.cloudflare.com** (free — the Workers free tier is 100,000
   requests/day, far more than this site will ever use). No domain or credit card needed.
2. **Compute -> Workers & Pages -> Create -> Create Worker.**
3. Give it a **neutral name** — `zii-codex-edge` is good, `zii-analytics` or `zii-tracker`
   is not. The name becomes the public hostname, and obvious words are what future filter
   rules get written against. Click **Deploy** to create the placeholder.
4. **Edit code**, delete the sample, paste the whole of `analytics/worker.js`, **Deploy**.
5. Copy the Worker's URL — `https://zii-codex-edge.<your-account>.workers.dev`.
6. In `index.html`, find `ANALYTICS_HOST` near the top and put that URL in, no trailing
   slash. Commit and push.

**Check it worked:** open the live site, then browser devtools -> **Network**. You should see
`count.js` and a `count?p=...` request to your `workers.dev` hostname, both `200`. Your visit
shows up in the GoatCounter dashboard within a minute or so.

**On accuracy.** Pageview totals through the proxy are exact. *Unique visitor* counts need a
look after a few days: GoatCounter builds its daily visitor hash from the source IP, and the
Worker forwards the real one in `X-Forwarded-For`, but hosted GoatCounter decides for itself
whether to trust that header from an unknown source. If uniques look suspiciously flat next
to pageviews, that is the cause — the totals are still sound.

**To undo any of this**, set `ANALYTICS_HOST` back to `""`. The site goes straight to
GoatCounter again, exactly as before, and the Worker can be deleted.

That's setup done. Everything from here on — weekly resets, selling, renewing, revoking,
backups — is in **RUNBOOK.md**.

---

*The admin passphrase is not written in this repo on purpose: only its hash ships in
`index.html`, so a public reader can't recover it. Keep the passphrase in your own password
manager. It also works as a personal, never‑expiring key on the gate — if you ever lock
yourself out, type the passphrase into the code box.*
