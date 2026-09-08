# The Zii Codex — weekly runbook

First-time setup is in **SETUP.md**. This is the day-to-day operation. Every procedure is
self-contained — start each one by opening the live site and the admin panel.

**Open the panel:** go to **https://ipaintz.github.io/the-zii-codex/** → **admin** →
enter your passphrase → land on the **Customers** tab.

---

## ⚠ Golden rules — read once, then never get burned

**1. Nothing is live until you Publish.**
Generating a code, advancing the week, renewing, revoking, the kill switch — all of it only
changes your own browser until you click **Publish to GitHub**. A "unpublished changes" dot
shows in the footer whenever you have unpublished edits.
**If a customer says their code is dead, check this first: did you Publish?**

**2. The panel lives in one browser.**
Your GitHub settings, the **plaintext codes**, and your **private customer notes** are all
stored in that browser only — they are *never* published. Admin from a different browser, a
different machine, or a cleared profile and your customer list is simply **gone** (the week and
the code hashes still reload from GitHub, but the readable codes and names do not).
So: **always admin from the same browser, and take backups.** The backup is the only copy of
the plaintext codes that exists anywhere.

**3. Long-lived codes can't be recovered.**
The published file holds only **hashes**, so nothing on disk records whose a code is or what its
plaintext is. `status.json` currently has a code good through **week 52** (all five tools) and
one through **week 4** — presumably yours. **Keep your own written record of any long-lived code
you issue** (in your password manager), because once it's out of this browser's memory it can't
be read back from anywhere.

---

## Weekly reset

Run at the start of each paid week. This is what expires last week's customers.

1. Open the panel (Customers tab). Confirm **Current week** matches reality.
2. Click **Advance week ▸** (bumps the week by one). Every code paid only through the previous
   week now shows **expired**.
3. Click **Publish to GitHub**. ← nothing takes effect until you do this.
4. Confirm the green "Published ✓" line.

*Wrong number?* Use **set** to type an exact week, click **Set**, then **Publish**.

## Sell access to a new customer

1. Customers tab → **New customer**.
2. Tap the tool chips to choose which workshops the code unlocks (at least one).
3. Type the customer's name in the note box (private, stays on this device).
4. Set **weeks** = how many weeks they paid for, and click **Generate**.
5. **Copy the `KSL-…` code and send it to the customer now** — the plaintext is only kept on
   this device and can't be recovered elsewhere.
6. Click **Publish to GitHub**. ← the code will not work until you do.

## Renew an existing customer in place

No new code needed — extend the one they already have.

1. Customers tab → find their row (paste their code into **find a customer** to jump to it).
2. In the **Access** column, click **＋** once per paid week (**−** undoes a mistake).
   - An active customer gets those weeks added on top of what's left.
   - A lapsed customer restarts from the current week.
3. Click **Publish to GitHub**. ← the renewal isn't live until you do.

To change *which tools* a code unlocks, tap the chips in the **Unlocks** column (lit = granted,
dashed = add), then **Publish**.

## Revoke a leaked code

1. Customers tab → find the row (paste the code into **find a customer**).
2. Click the **✕** at the end of that row.
3. Click **Publish to GitHub**. ← the code stays valid until you do; then it's dead within a
   minute.

## Kill switch — lock everyone out

For emergencies (mass leak, etc.). Removes **every** code.

1. Customers tab → Settings tab → **Danger zone** → **Kill switch — remove all** → confirm.
2. Click **Publish to GitHub**. ← nobody is locked out until you do.

To reopen afterward, generate fresh codes (or restore from a backup) and Publish. Your own
passphrase still lets you in via the gate regardless.

## Take a backup

Do this after any session where you added or renewed customers.

1. Settings tab → **Backup** → **Download backup**.
2. This saves `keizaal-status-backup.json` — the current week, every code hash, every **plaintext
   code**, and every private note held on this device. Store it somewhere safe (password
   manager / private cloud). **This file is the only copy of your plaintext codes.**

## Restore from a backup

There is **no import button** — restore is done in two independent halves.

**A. Access (who can get in) — usually already fine.**
The week and code hashes live on GitHub, not in your browser. Just open the panel, fill in
**Settings** again (owner / repo / branch / path / token), and click **Reload live list** — the
week and every active code come straight back. If GitHub's `status.json` itself was lost, open
the backup, copy its `status` object, and paste it as the file contents of `status.json` via the
GitHub web editor (Edit → commit) — that restores access on its own.

**B. Your plaintext codes and notes — from the backup only.**
These aren't on GitHub. The quickest true restore, on the live site with the panel open:

1. Open your browser's developer console (F12 → Console).
2. Paste the two objects from your backup file (`codes` and `notes`):
   ```js
   localStorage.setItem('keisaal_code_plain', JSON.stringify(/* the backup's "codes" object */));
   localStorage.setItem('keisaal_code_notes', JSON.stringify(/* the backup's "notes" object */));
   ```
3. Reload the page and reopen the panel. The Customers table now shows readable codes and names
   again.

If you skip step B, access still works fine — you just won't see the plaintext codes or names in
the table, only the backup file itself.

---

# Building new features without touching the live site

The live site is **only ever what is on the `main` branch** — GitHub Pages is configured to serve
`main` from the repo root. Anything on another branch is invisible to customers, even after you
push it to GitHub. That is the whole safety net; nothing else is needed to keep work-in-progress
off the live site.

## The three folders

```
H:\Coding\Claude\Keisaal Calculator\   →  branch main     — this IS the live version
H:\Coding\Claude\Keizaal-testing\      →  branch testing  — features being built
H:\Coding\Claude\Keizaal-lab\          →  branch lab      — mockups & notes, never merges
```

`lab` is an *orphan* branch: it shares no history with `main`, so git flatly refuses to
merge it (`fatal: refusing to merge unrelated histories`). It is also **local only and must
stay that way** — this repo is public, and `lab` holds unreleased designs. A `pre-push` hook
in `.git/hooks` blocks it from being pushed; `main` and `testing` push normally.

⚠ **`lab` is on this machine and nowhere else.** It is not on GitHub, so a disk failure loses
it. Include `H:\Coding\Claude\Keizaal-lab\` in whatever you back up.

All three are the same repository (git *worktrees*), just checked out to different branches, so
you can have the live `cook-app.html` and the testing one open side by side without switching
anything. Edit files in the testing folder and the live folder does not move.

**Rule of thumb:** if a customer could be looking at it right now, it lives in the first folder.

## Everyday loop

1. Work in `H:\Coding\Claude\Keizaal-testing\`.
2. Commit there as often as you like — `git add -A && git commit -m "…"` — none of it is live.
3. Push it if you want an off-machine backup: `git push`. Still not live.
4. When it's finished and tested, run **Send testing to live** below.

## Send testing to live

⚠ **Do the `status.json` step. Do not skip it.** The admin panel writes `status.json` straight to
`main` on GitHub every time you publish a code. That means `main` is almost always ahead of your
testing branch on that one file, and a careless merge can drag a stale copy over the live one —
**silently killing working customer codes.**

Run these from the **testing** folder, in order:

```bash
git -C "H:/Coding/Claude/Keisaal Calculator" fetch origin
git -C "H:/Coding/Claude/Keisaal Calculator" merge --ff-only origin/main
git merge main
git checkout main -- status.json
git commit -m "Sync status.json from live" --allow-empty
```

Line by line: fetch what the admin panel published → move your local `main` up to it → pull those
live changes into testing → **force `status.json` back to the live copy** → save that.

Then from the **live** folder (`H:\Coding\Claude\Keisaal Calculator`):

```bash
git merge testing
git push
```

Pages rebuilds in about a minute. Hard-refresh the live site (Ctrl+F5) and check the tool you
changed.

## After it's live

Keep using the same testing branch for the next feature — nothing to recreate. Just pull the live
state back down first so you're not building on something stale:

```bash
git -C "H:/Coding/Claude/Keizaal-testing" merge main
```

## If it goes wrong

**"I merged and a customer's code stopped working."** You dragged an old `status.json` over the
live one. Fix it from the live folder:

```bash
git checkout origin/main -- status.json
git commit -m "Restore live status.json"
git push
```

Or, faster and without git at all: open the admin panel and click **Publish to GitHub** — it
rewrites `status.json` from what's in your browser, which is the real source of truth for codes.

**"I want to throw the testing work away and start over."** From the testing folder:

```bash
git reset --hard main
```

Nothing on `main` is touched, and the live site never saw any of it.

**"I lost uncommitted work after `git reset --hard`."** That command deletes unsaved edits with no
undo. Commit first, always — that is what makes the sandbox safe to experiment in.

**"Which branch am I in?"** `git branch --show-current`, or just look at the folder name.
