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
