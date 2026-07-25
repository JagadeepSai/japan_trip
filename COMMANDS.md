# Setup & deploy — free DB + free hosting

日本の旅 is a pure static site (no build step) + Supabase for shared persistence.
Total cost: **₹0** — Supabase free tier + GitHub Pages/Netlify free tier.
All commands run from the repo root (`japan_trip/`).

---

## 0. Run locally (no DB needed)

```bash
python3 -m http.server 8765
# open http://localhost:8765/
```

Without Supabase configured the app runs in **Local** mode (pill top-left):
everything persists in that browser's localStorage, pre-seeded with the
initial database (the 12-day plan + full menu, 167 rows).

---

## 1. Database — Supabase (free tier)

This is what makes adds/edits **shared between friends, live**.

1. Create an account + project at [supabase.com](https://supabase.com)
   (free tier: 500 MB — this trip uses a few hundred KB).
2. **SQL Editor** → paste the whole of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   It creates two tables with public read/write policies:
   - `wishes` — every event, incl. transits, groups (bundles), hidden events,
     times and info notes (those all live in the `meta` jsonb — no extra tables).
   - `shopping` — the shared buy-list.
3. **Database → Replication** → enable **Realtime** for **both** `wishes` **and** `shopping`
   (this is what makes a friend's edit appear on your screen without a refresh).
4. **Project Settings → API** → copy the **Project URL** and the **anon public** key
   into [`js/config.js`](js/config.js):

   ```js
   const SUPABASE_CONFIG = {
     url: "https://xxxx.supabase.co",
     anonKey: "eyJ...",
   };
   ```

5. **Open the site once.** The pill flips to **Live**, and because the cloud DB is
   empty, the app **auto-seeds the initial database** (167 rows: the 12-day plan,
   bundles, transits, the full menu, and the starter buy-list). This takes ~30–60 s
   on that first load — watch the board fill in; every visitor after that gets it
   instantly.

**What syncs:** all events/sushi (board, map, groups, hidden, transit) + the
shopping buy-list. **Per-device by design:** food "tried" marks, packing checks,
night mode, view preferences.

**Resetting the shared board:** Supabase → Table Editor → select rows in
`wishes`/`shopping` → delete. (Delete *everything* and the next visitor re-seeds
the initial database automatically.)

---

## 2. Hosting — pick one (both free)

### Option A · GitHub Pages (recommended — versioned, free forever)

One-time:

```bash
# clean Windows download artifacts, then commit
find . -name "*Zone.Identifier" -delete
git add -A
git commit -m "Japan trip planner"
# create an empty repo on github.com, then:
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / (root)**.
Live at `https://<you>.github.io/<repo>/` after ~1 minute.

> The anon key in `js/config.js` is designed to be public (security lives in the
> RLS policies) — committing it is fine for this access model.

### Option B · Netlify Drop (fastest, zero git)

Drag the `japan_trip` folder onto <https://app.netlify.com/drop> → live URL in
seconds. Re-drag the folder to update. (Cloudflare Pages / Vercel work the same way.)

---

## 3. Share it

Open the URL on two devices → add a sushi on one → watch it appear on the other →
send friends the link. No accounts needed: **anyone with the URL can add/edit** —
the URL is the password. (Want real auth later? Supabase magic-link email auth is
the upgrade path.)

---

## 4. Updating the site after edits

1. Edit files.
2. Bump the cache-bust token (all 5 asset tags share one):
   ```bash
   # example — current token on the left, new one on the right
   sed -i 's/?v=20260730e/?v=20260730f/g' index.html
   ```
3. Deploy: `git add -A && git commit -m "update" && git push` (Pages)
   or re-drag the folder (Netlify). Hard-refresh (Ctrl/Cmd+Shift+R).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Pill says **Local** on the deployed site | `js/config.js` url/key empty or wrong — re-paste from Project Settings → API |
| Edits don't appear on a friend's screen until refresh | Realtime not enabled for both tables (step 1.3) |
| First deployed load shows an empty board | It's seeding (~30–60 s) — check the console for `[seed]` logs; refresh after |
| Insert errors in console mentioning a column | schema.sql not fully run — re-run the whole file (it's idempotent) |
| Old UI after deploy | Cache token not bumped (step 4.2) |
