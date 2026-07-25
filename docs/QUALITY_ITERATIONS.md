# Quality iterations — Japan Trip

Living report from a product lens. **Heroes: Wish board (kanban) + Map.** Every other section must feed those two or deep-link back to them.

Open: [http://localhost:8765/](http://localhost:8765/) (assets use `?v=` — hard refresh after pulls).

---

## Product north star

| Hub | Job |
|-----|-----|
| **Wish board** | Capture & schedule intent (source of truth) |
| **Map** | Spatialize intent into a trip you can scan |
| Supporting | Itinerary, shopping, food, packing, tips — never dead-ends |

Success test: from any secondary section, can you reach a board card or a map pin in ≤2 taps?

---

## Iteration 0 — Diagnosis

### What was wrong
- Empty board from stale cached JS; server down; bolted-on new UI.

### Pros (≥5)
1. Correct product model already sketched (food/shop items → lists).
2. Official site quick-add was the right shortcut.
3. Map picker concept matched traveler mental model.
4. Local/Supabase dual store kept GitHub Pages viable.
5. Dock already privileged Board + Map.

### Cons (≥5)
1. Cache busting missing → “broken site” with no error.
2. New controls looked generic vs editorial system.
3. Kanban rebound listeners on every refresh.
4. Secondary sections didn’t deep-link to hubs.
5. No shared focus API across board/map/days.

### Verdict
Rescue required before quality work.

---

## Iteration 1 — Unbreak + baseline

### Changes
Cache-bust, migrate wishes, safer boot, underline filters, pin icon, ideas vs buy, food menu, picker sheet.

### Pros (≥5)
1. Board loads again for real users.
2. Buy list stays uncluttered vs ideas.
3. Food reads as a menu, not bingo gimmick.
4. Filters match editorial type language.
5. Picker hierarchy clearer than inline-only search.

### Cons (≥5)
1. Manual `?v=` still easy to forget.
2. Migrated rows lacked `items[]`.
3. Hero secondary CTA still weak on photo.
4. No board ↔ map focus yet.
5. Composer still dense.

### Verdict
Usable. Not yet hub-centric.

---

## Iteration 2 — Contrast + enrichment

### Changes
Hero clock glass; seed item enrichment for food/shop labels; persist.

### Pros (≥5)
1. Clocks readable on Fuji.
2. Tsukiji dishes appear after migrate.
3. Food section no longer looks empty/broken.
4. Enrichment is label-scoped (safe-ish).
5. Kept localStorage as source of truth.

### Cons (≥5)
1. Enrichment only helps exact seed label matches.
2. Boards without shop wishes still empty Ideas.
3. Still no in-app map focus from food.
4. Done buys still cluttered map (later fixed).
5. No live trip stats on hero.

### Verdict
Data completeness improved; interaction graph still thin.

---

## Iteration 3 — Surface polish

### Changes
Taste side column; quiet Map links; migrate-time feature seeds; picker verified.

### Pros (≥5)
1. Visual language coherent across new lists.
2. Ideas/buy split understood in one glance.
3. Picker feels intentional, not modal spam.
4. Hover = shadow only on wish cards.
5. Recoverable from old local keys.

### Cons (≥5)
1. “Working” ≠ “connected product.”
2. Board cards only offered external Directions.
3. Map index couldn’t open the board card.
4. Day columns couldn’t show themselves on the map.
5. Packing/tips were orphan islands.

### Verdict
Ship-quality cosmetics; product graph incomplete.

---

## Iteration 4 — Hub wiring (board ↔ map)

**PM goal:** Make board and map one loop. Every wish with coords is one tap from either hub.

### Changes
- Shared navigation: `focusWish`, `openWishOnBoard`, `showDayOnMap`, `focusShopOnMap`, `flashWishCard`.
- Wish cards: **On map** / **Add pin** (opens picker and writes lat/lng onto that wish).
- Kanban column **Map** → day-scoped map filter.
- Map: type filter **counts**, **day filters**, hide completed buys, index actions **Focus / Board / Day**, popup **On board**.
- `focusPin` auto-widens filters so Focus never fails silently.
- Hero pulse chips: wishes / on map / inbox / days planned.
- Board + map pulse strips with live counts.
- Timeline shinkansen listener leak fixed (bind once).

### Pros (≥5)
1. Board → map and map → board are first-class, not Google-only exits.
2. Day filter turns the map into a day brief — huge planner win.
3. Filter counts make emptiness/fullness obvious.
4. Add pin on existing wish closes the “unmapped card” dead end.
5. Hero stats sell the hubs before scroll.
6. Completed haul no longer pollutes the trip map.
7. Column Map button teaches the mental model: columns are geographic.

### Cons (≥5)
1. More chrome on cards/index — risk of action clutter on small screens.
2. Day filter chips are many (10+ days) — can wrap densely on mobile.
3. Auto-resetting filters on Focus may surprise power users mid-filter.
4. Flash highlight is easy to miss if board is tall.
5. Pulse chips compete slightly with Fuji silhouette for attention.
6. Still no within-column reorder (`sort_order` underused).
7. Dock still omits Food (must scroll or use pulse/CTA).

### Section experience notes
| Section | Connection to heroes |
|---------|----------------------|
| Board | Source; On map / Add pin / column Map |
| Map | Sink + return path via Board / Day |
| Others | Deferred to iter 5 |

### Verdict
**Heroes finally feel like one product.** This is the structural unlock.

---

## Iteration 5 — Supporting sections feed the hubs

**PM goal:** Itinerary, shopping, food, packing, tips never dead-end; each states how it relates to board/map and offers a jump.

### Changes
- **Itinerary:** wish chip → `focusWish`; Board link; day **Map day** / N on map; empty day → assign on board.
- **Shopping:** progress (bought / on map / ideas); buy row **On map**; idea **Board** + Move to buy; copy clarifies board→ideas→buy→map.
- **Food:** tried progress; **On map** + **Board**; filter-jump to map Food.
- **Packing:** progress + link toward board (haul space).
- **Tips:** each tip has CTA into board/map/shopping/timeline/packing.
- Copy pass: section ledes name the hub relationship.

### Pros (≥5)
1. Food and shopping stop being side quests — they route through hubs.
2. Progress strips create completion psychology without gamified bingo.
3. Empty itinerary days teach the board loop.
4. Tips become navigation, not wallpaper.
5. Buy list ↔ map is explicit (“N open on map”).
6. Board remains the only place you *create* intent; lists only consume.
7. Live checks: filter counts, 6 tastes, 3 ideas, focusWish OK.

### Cons (≥5)
1. Tip CTAs are static mappings — future tips need `cta`/`go` fields.
2. Packing ↔ board link is soft (copy only), not item-level.
3. Food “Filter map · Food” listener is section-scoped; easy to overlook.
4. More interactive text links = denser pages; quiet design discipline required.
5. Promoting ideas still doesn’t auto-focus the new buy pin (extra tap).
6. No “untried food near today’s city” smart sort yet.
7. Accessibility: many icon/text buttons need continued keyboard audit.

### Verdict
**Supporting sections now orbit the heroes.** Feature-rich without inventing a third hub.

---

## Iteration 6 — PM scorecard & next bets

### Live scorecard (post 4–5)

| Area | Status | Hub link |
|------|--------|----------|
| Wish board | Strong | Hero |
| Map + index | Strong | Hero |
| Itinerary | Strong | Map + Board |
| Shopping | Strong | Board ideas → Buy → Map |
| Food list | Strong | Board → Map |
| Packing | Medium | Soft CTA to board |
| Tips | Medium | CTA routing |
| Hero | Strong | Pulse → hubs |
| Dock | Medium | Board/Map privileged; Food absent |

### Pros of current product (≥5)
1. Clear source of truth (board) and spatial view (map).
2. Cross-links are in-app, not only Google Maps.
3. Ideas vs buy prevents haul clutter.
4. Day-scoped map is a real planning tool.
5. Unpinned wishes are visible and fixable (Add pin).
6. Aesthetic system mostly holds under new chrome.
7. Local-first still works offline for most flows.

### Cons / open risks (≥5)
1. Mobile density of actions on cards + index.
2. Day filter chip sprawl on long trips.
3. Manual cache version bumps.
4. Nominatim rate limits on search/picker.
5. No collaborative presence cues beyond Supabase sync.
6. Within-day wish ordering still weak.
7. Food not in dock — discoverability lag.

### Next bets (prioritized)
1. **Compact action menus** on cards (“···”) to reduce chip clutter.
2. **Day filter as select** on narrow viewports.
3. **Auto-focus map** after promoting a buy item with coords.
4. **Dock overflow** for Food / Pack.
5. **Deploy script** that stamps `?v=gitsha`.

### Verdict
**Product-quality bar met for hub narrative.** Iterate next on density and mobile, not on inventing new sections.

---

## Iteration 7 — Fix cons + critical UI/UX per section

**PM goal:** Resolve density/sprawl/discoverability cons without adding new feature surfaces. Design each section as a calm tool that still orbits Board + Map.

### Critical UX decisions (by section)

| Section | Problem | Decision |
|---------|---------|----------|
| **Board cards** | Chip clutter | One primary CTA (On map / Add pin); Directions + reorder behind `···` |
| **Composer** | Form fatigue | Links & notes collapsed in `<details>` (optional) |
| **Map days** | 12 chip sprawl | All + Inbox chips + **Choose day** select |
| **Map index** | Too many text chips | Focus primary; Board/Day as quiet text actions |
| **Dock** | Food missing; Home redundant with hero | **Board · Taste · Map · Days · More** (Shop/Pack/Tips in sheet) |
| **Shopping** | Promote needed extra map tap | Promote with coords → auto `focusShopOnMap` |
| **Food** | Flat list, dual CTAs | Untried-first sort; row = try + single Map |
| **Packing** | Soft board link only | Item-level **Open** for haul/cash/transit-related rows |
| **Hero pulse** | Fought Fuji | Smaller frosted chips, constrained width |

### Changes shipped
- Wish card redesign: type + delete top row; primary map CTA; more menu (Directions, Move up/down).
- Within-column reorder via Move up/down (`sort_order` swap).
- Day filter bar: All / Inbox / select.
- Dock More sheet; Taste promoted to primary dock.
- Composer details for links/notes.
- Promote → map focus when pin exists.
- Food sort + denser row.
- Packing Open links (`go` on relevant items).
- Asset cache `?v=20260725g`.

### Pros (≥5)
1. Cards read as content first, actions second — less “control panel.”
2. Day select kills chip sprawl while keeping All/Inbox one-tap.
3. Taste in dock fixes the biggest discoverability gap for a list that feeds the map.
4. More sheet keeps dock at five slots without orphaning Shop/Pack/Tips.
5. Promote→map closes a real task loop (idea → buy → see it).
6. Reorder makes day columns feel planned, not append-only dumps.
7. Collapsed links reduce composer intimidation for quick adds.

### Cons (≥5)
1. Home removed from dock — return-to-top relies on scroll / hero (some users will miss it).
2. More sheet is an extra tap for Shop — haul is slightly less prominent.
3. Move up/down is slower than true drag-reorder within a column.
4. Day select “Choose day” placeholder is a bit utilitarian vs editorial chips.
5. Wish `···` menus need a click-outside habit; easy to leave one open briefly.
6. Packing Open is only on tagged items — most rows still checklist-only.
7. Still no auto `?v=` from git sha on deploy.

### Section verdicts after iter 7
| Section | UX grade | Notes |
|---------|----------|-------|
| Board | A− | Calmer; reorder present |
| Map | A− | Day select + quieter index |
| Itinerary | B+ | Unchanged wiring; still strong |
| Shopping | A− | Promote loop complete |
| Food | A− | Sorted + dock entry |
| Packing | B | Selective Open links |
| Tips | B | CTAs already routed |
| Dock | A | Heroes + Taste + overflow |

### Verdict
**Cons from iter 6 largely addressed with design discipline, not more features.** Next only if needed: true within-column drag, Home affordance revisit, deploy cache stamp.

---

## Iteration 8 — Overlays, modals, editable events (2026-07-25)

### Goal
Fix shopping form UI; remove More; make Itinerary a right drawer with filters/nav; forms as modals (create + edit); add wish from itinerary without leaving Days; wish-chip preview popover; hover reorder icons; simplify hero.

### Browser verification (localhost `?v=20260725i`)
| Check | Result |
|-------|--------|
| Hero | Title + short lede + countdown + 2 CTAs; no pulse chips / dual clocks |
| Dock | **Board · Shop · Map · Taste · Days** — More gone |
| Shop → Add item | Modal with styled inputs matching wish form |
| Days | Right drawer; city filters; ‹ › day nav; day tools +Wish / Board / Map |
| Chip → preview | Profile-card popover (On map / Edit / Board) |
| Preview → Edit | Edit wish modal over drawer; day preserved; Save changes |
| Day → + Wish | Add wish modal; day prefilled (`d1`); drawer stays open |
| Escape | Closes picker → modal → preview → drawer in order |

### Changes shipped
- Shopping + wish composers moved into centered modals; shop inputs share composer styling.
- Itinerary removed from main scroll; `#itinerary-overlay` right drawer from Days.
- Day cards: **+ Wish**, **Board** (flash column), **Map**; chips open preview.
- Wish cards: hover ↑↓ icons; **Edit** opens same modal as create.
- Hero simplified; subtitle shortened; cache `?v=20260725i`.

### Pros (≥5)
1. Shopping form no longer looks “broken” next to the wish composer — same input language.
2. Modals keep Board/Map as the scroll heroes; forms don’t eat vertical space.
3. Itinerary-as-drawer means Days is always one dock tap away without burying the board.
4. + Wish from a day never jumps to Board — planning stays in context.
5. Chip preview is a cheap “peek” (profile-card pattern) before committing to map/board.
6. Edit path is the same sheet as create — cards feel like editable events, not dump-only.
7. Hover reorder icons declutter cards vs the old `···` menu.

### Cons (≥5)
1. Packing / Tips lose dock presence (More removed) — only reachable by scroll or tip/pack CTAs.
2. Drawer + modal stacking can feel deep on small phones (drawer full-bleed).
3. Prev/next day nav switches filter to a single day — easy to forget you’re not on “All days.”
4. Wish preview positioning is viewport-clamped, not always adjacent to the chip on tall drawers.
5. Hover-only reorder tools are weaker on touch (focus-within helps, but not perfect).
6. Weather still fetches whenever timeline re-renders — slightly chatty when opening Days often.
7. No within-column drag yet; icon swap is still a compromise.

### Section verdicts after iter 8
| Section | UX grade | Notes |
|---------|----------|-------|
| Hero | A | Calm; brand-first |
| Board | A | Modal create/edit + hover reorder |
| Map | A− | Unchanged hubs |
| Itinerary | A | Drawer + filters + preview |
| Shopping | A | Modal form fixed |
| Food / Pack / Tips | B | Still useful; less docked |
| Dock | A− | Heroes clear; Pack/Tips demoted |

### Verdict
**Overlay model lands:** Days and forms are tools over the hubs, not competing pages. Biggest remaining debt is Pack/Tips discoverability and touch-friendly reorder.

---

## Iteration 9 — System redesign + the 赤い糸 route (2026-07-26)

### Goal
Make the whole thing aesthetic and *uniform*, not button-heavy. Introduce the signature
**red thread of fate (赤い糸)** that ties same-day **active** stops together on both hubs, with
dynamically-computed transit times. Independent multi-lens critique drove the direction.

### System
- **One control system, four primitives** replacing ~18 bespoke button styles:
  `.btn` (pill CTA) · `.chip` (`is-active`/`is-info`/`is-xs`) · `.text-link` (`is-primary`/`is-caps`) ·
  `.icon-btn` (`is-round`/`is-lg`/`is-sm`/`is-bare`). Tokens for radius (pill/lg/md/sm),
  elevation (sm/md/lg), control heights (24/28/36/44) and type-accents.
- **Night-mode contrast fixed** — chips/text-links were ~1.1:1 (invisible); now token-driven light-blue/warm overrides.
- **Palette discipline** — vermillion reserved for accents; off-brand green retired for gold; gold given a job (tried-state, hover, section rules).
- **Editorial polish** — Fuji blob → inked ridgeline; softer hero veil; Fraunces for all Latin headings;
  looser section rhythm; washi grain up; Godzilla removed; leaves thinned; `prefers-reduced-motion` guard.

### Active / passive + 赤い糸
- New wish field `active` (committed stop vs "maybe"). Passive = dashed card + hollow bead + dimmed pin.
- **Board:** emaki horizontal lane (kills the grid row-height gap bug) with a sticky Inbox tray; calm cards
  (type accent bar, single "On map" chip, kebab overflow, active bead). An inline-SVG **red thread** runs a
  left gutter through knots on each same-day active card, with the transit time rotated beside it.
- **Map:** collapsible index (hidden by default → map full-width; `目次 · Index` handle); pin **hover cards** (washi);
  same-day active stops joined by a red-thread polyline; **edge-hover shows transit time** rotated along the segment;
  stops **cluster per metro** (Leaflet.markercluster, washi badges) and resolve into individual pins + thread on zoom;
  choosing a day zooms to it so the route reads.
- **Transit** (`getTransit`): OSRM driving duration, walking estimate for <1.1km hops, haversine fallback offline, cached.

### Section calm
Map index rows (whole-row focus), shopping ideas (single **+** promote), food (2-col, row = tried, no per-row Map),
packing (uniform, bigger tap), tips (3×2 reference cards, no CTAs), drawer days (+Wish / N on map).

### Verdict
Uniform, calmer, and the two hubs now literally share one motif — the red thread — at two scales.

---

## Iteration 10 — Owner feedback round 2 (2026-07-26)

- **Hero:** CTA buttons removed — the dock is the nav. Dock icons redrawn (consistent stroke set,
  ramen-bowl Taste, calendar Days), uniform label sizing, vermillion active dot.
- **Board:** day lane is **full-bleed 100vw** with edge fades and **loop arrows** (wrap at either end);
  **Inbox is a collapsible tray above the lane** (drag down onto days, drag back to unschedule);
  **city tags** (Tokyo/Hakone/Kyoto/Osaka…) on cards + column headers; **Cards / Compact view toggle** —
  compact rows show dot + name (+city where it differs), click opens the event-card popover.
- **ETAs in English:** "Walk 8 min" / "Ride 25 min" on board threads and map captions.
- **Preview popover:** closes on any scroll and on click-outside (was floating detached).
- **Performance:** falling leaves removed; starfield rAF loop now runs only at night; new static
  **seigaiha (青海波)** washi background (pure CSS gradients, zero runtime cost).
- **Map:** threads now follow **real streets** (OSRM/foot geometry, cached, straight-line fallback);
  transit captions are **always visible**, rotated along the route; basemap upgraded to CARTO
  **Positron by day / Dark Matter at night** (swaps with the lantern); `touch-action:none` +
  `touchZoom` so pinch zooms the map, not the site.

---

## Iteration 11 — Owner feedback round 3 (2026-07-26)

- **Trackpad pinch** on the map: ctrl+wheel (how laptop pinch reaches the browser) now zooms the map
  at the cursor and never the page; plain scroll still passes through.
- **Backgrounds diversified:** site-wide pattern is now a faint **kumiko (組子) lattice**; the
  **seigaiha waves moved into the Wish Boats panel**, which is translucent so the harbor reads as water.
- **Copy:** both ledes removed; hero line is now **一期一会 — every encounter, once in a lifetime**.
- **宝船 Wish Boats:** board renamed (Takarabune — the treasure boat that carries wishes); button is
  **Load a wish**; every card is a little **boat** — curved hull radius + dark waterline keel,
  floating on the wave panel. City tags are auto-inferred (assigned day's city, else nearest city by coords).
- **Map stage widened** to 1460px (taller too).
- **Night mode:** `--indigo-soft` remapped lighter; explicit fixes for list headings (To buy/Ideas),
  drawer/modal/picker headings, itinerary day-card labels, event pills, shop checkboxes, tip cards;
  **itinerary drawer widened to 480px**.
- **Packing & Trip tips** removed from the page flow — now footer links that open **modals**
  (Esc/overlay-click close); dock scroll-spy updated.

---

## Iteration 12 — Owner feedback round 4 (2026-07-26)

- **Map input model:** pinch-out fixed (`zoomSnap: 0.5` — with the default snap of 1, our −0.5 steps
  rounded straight back and never took effect); plain two-finger scroll now **pans** the map instead of
  scrolling the page; ctrl+wheel (trackpad pinch) zooms both directions at the cursor.
- **Sushi Boat:** board renamed (寿司舟); **Add Sushi** button with a nigiri icon; wish→sushi terminology
  across modal titles, empty states, drawer tools ("+ Sushi").
- **Copy trims:** board stat row removed; map lede removed; map pulse now "N sushi boats set to sail".
- **Hokusai backdrops** (public domain, via Wikimedia): the board floats over **The Great Wave off
  Kanagawa** and the map section over **Red Fuji**, both under heavy washi-glass overlays (day + night variants).
- **Transit captions carry distance** ("Walk 16 min · 1.2 km") — cache v3 keeps OSRM route distance;
  board thread labels stay time-only for space. Metro/bus schedule routing still needs a keyed API
  (Google/Navitia); current times are live road/foot routing.
- **Compact rows:** the type dot is now the **active/passive toggle** (filled = sailing, hollow = maybe).
- Night: itinerary event pills made fully explicit.

---

## Iteration 13 — Owner feedback round 5 (2026-07-26)

- **Great Wave** now backs the whole Sushi Boat *section* (full-bleed, washi-glass); the board *panel*
  reverted to the quieter seigaiha translucency so cards stay readable.
- **Lantern** genuinely glows at night (layered warm halo, slow breathing animation); at night a string
  of **festival lights** hangs across the top of the boat panel.
- **Board tools** (Cards · Compact · Add Sushi) moved below the heading, one aligned row.
- **Dock:** Board → **Sushi** with the nigiri icon.
- **Day/night map refresh fixed** — the tile layer is recreated on toggle (Leaflet's `setUrl` repaint
  wasn't kicking in until the next interaction).
- **D1 opens flush** at the lane start (lane padding 1.5rem instead of centering to the content column).
- **⛩ Recenter control** under the map's +/− snaps the view back to the whole Japan route.

---

## Iteration 14 — Owner feedback round 6 (2026-07-26)

- **D1 padding** eased back to 2.5rem; **Great Wave section backdrop removed** (panel seigaiha stays).
- **Night decorations:** every boat card carries a tiny **stern lantern** (staggered twinkle) beside the
  panel-wide festival string; the toggle is now a proper **chochin SVG lantern** (caps, ribs, 灯, tassel)
  that sways gently and breathes warm light at night.
- **Dock:** sushi-boat icon (hull + two nigiri).
- **Map interaction model:** scroll-to-pan is **opt-in** — the map has an *active* state (vermillion ring)
  entered by clicking the map or the ✋ pan control (left, under ⛩), exited by clicking or scrolling
  outside. Inactive, the page scrolls straight past; pinch-zoom always works. All five behaviors
  functionally verified.

---

## Iteration 15 — Lantern + card-lighting research pass (2026-07-26)

- **Aka-chochin v3** (researched SVG-filter technique): the glow now comes from *inside* — a warm core
  gradient + a blurred duplicate of the body (`feGaussianBlur` halo) that breathes at night, with an
  irregular candle-flicker on the core. Red izakaya paper, dark caps, ribs, white 灯, gold tassel.
- **Card lighting v2 — "boats on lantern-lit water":** replaced the stern dot with (a) a warm rim of
  light along each hull's waterline (inset glow) and (b) a shimmering **reflection pool** on the water
  below each card (blurred radial, staggered scaleX/opacity shimmer). Alternatives documented:
  cursor-tracking radial glow, mask-composite gradient border ring, ambient fireflies.

---

## Iteration 16 — 秘密 hidden events (2026-07-26)

- A sushi is **hidden** when its Links & notes carry a meta row whose key is `hidden` (case-insensitive).
  Hidden events are filtered from every surface (board, map, index, drawer, food, shop ideas).
- **Night-only reveal:** a mini boat button beside the "Sushi Boat" heading (visible only at night).
  Clicking it glows **neon red** (pulsing drop-shadow) and reveals the hidden fleet; leaving night mode
  auto-conceals and resets the toggle.
- **Neon treatment** for hidden items everywhere they can appear: board cards + compact rows (dark plum
  hull, neon border/waterline, pink-red text, red reflection pool), map pins (dark dot, neon ring + glow),
  hover cards (秘密 kicker), index rows, preview popover.
- Two demo secrets seeded once in local mode (Nonbei Yokocho hush bar · D2, Ishibekoji lane wander · D5).
- Verified: hidden in day ✓, boat appears at night ✓, reveal shows 2 neon cards + glowing button ✓,
  hidden map pin renders ✓, switching to day conceals ✓.

---

## Iteration 17 — Shopping sync · transit events · runbook (2026-07-26)

- **Shopping buy-list now syncs**: new `ShopStore` in api.js (same dual-mode pattern as wishes —
  Supabase table `shopping` + realtime when configured, localStorage otherwise; existing local key kept
  so nothing is lost). main.js runs on a synced cache (`refreshShopping`); add/toggle/delete/promote all
  go through the store; "promoted" ideas are also derived from synced rows so a friend's promotion hides
  the idea for everyone. Food tried-marks + packing stay per-device by choice.
- **Transit event type** for city shifts: choose type **Transit** in Add Sushi → mode / departure time /
  duration fields appear (stored as reserved `transit:*` meta keys — no schema change, syncs like
  everything else). Renders as a **rail-blue ticket** (dashed edges, punched side notches, flat rail
  base, train icon + "Shinkansen · 09:12 · 2h 05m") — clearly not a boat. Own color across compact dots,
  map pins, hover cards, index numbers + a Transit filter tab. Two seeds: Tokyo→Hakone (D4),
  Hakone→Kyoto (D5) — pinned at their departure stations so they join the day's red thread.
- **COMMANDS.md**: run/update/deploy runbook (local serve, cache bump, Supabase setup, GitHub Pages,
  Netlify Drop).

---

## Iteration 18 — 結び groups (excursion bundles) (2026-07-26)

- **Model:** a group is a `type:"group"` wish row (name + `group:start` / `group:end` meta); members
  point at it via a `group` meta key. No schema change — groups sync/realtime like any wish. Dangling
  links are ignored (deleting a group frees its members).
- **Visual design (not tags):** on a day the group is a **rope-bound vessel** — knot header
  (name · count · chevron), members inside, and a **shipping-tag footer `START ⇢ END`** (click to edit;
  defaults to the day's city). In the **Inbox** it's a **stacked deck** — top card fanned over two
  rotated ghosts, dragging the pile drags the bundle.
- **Drag semantics:** drop the pile/vessel on a day → group + all members schedule together (and join
  the red thread); drag it back to Inbox → all unschedule; **drop any loose card onto a bundle → it's
  absorbed**; drag a member out (or reassign its day) → it leaves the group.
- **Creation:** Add/Edit Sushi has a Group select (existing bundles or ＋ New group with name/start/end,
  start defaulting to the chosen day's city). Members are pinned to the bundle's day. Group modal:
  rename, start/end, Untie (keeps events).
- **Seeded demo:** the full **Mt. Takao** excursion (transit out 08:10, cablecar, Trail 1, Yakuo-in,
  summit + Fuji view, Monkey Park, Takaosan Onsen, transit back 17:30), Tokyo ⇢ Tokyo, waiting in the Inbox.
- Verified end-to-end: pile renders (8) ✓, drop on D3 schedules all ✓, absorb-by-drop ✓, drag-out
  ungroups ✓, D3 map thread includes Takao stops ✓, composer select + new-group fields ✓, route tag edit ✓.

---

## Iteration 18b — pile fixes (2026-07-26)

- **Thread through a folded bundle:** a stacked pile's 8 hidden cards were all knotted at the same spot
  (overlapping "Ride 20 min" labels). Now a folded bundle counts as **one stop** — the thread passes
  through its top card only; opening it re-threads every member (verified: 4 knots folded → 11 open).
- **Pile compactness:** clipped the stacked window to card height with a soft fade (no more overflow
  bleed in Cards mode) and `align-items:start` on the inbox grid so a pile no longer stretches its
  neighbours into tall empty cards (pile 181px vs card 137px now).

---

## Iteration 18c — groups on the map (2026-07-26)

- **Route ordering fixed:** day edges previously sorted every stop by raw `sort_order`, so bundle
  members (0..7) interleaved with the day's own stops and the thread zigzagged across the city. The
  route is now built hierarchically, mirroring the board exactly: top-level order, bundles expanded in
  member order. Verified on D3+Takao: 10 edges, exactly one east-west hop.
- **Carried transit legs:** the edge leaving a transit event is that event's own journey — drawn as a
  **dashed straight leg** with its declared details ("Train · 50m · dep 08:10") instead of a bogus OSRM
  road estimate (trains don't follow streets). Road/walk legs keep live OSRM geometry + captions.
- Hover cards and index rows now name the bundle (e.g. "Mt. Takao · transit · D3").

---

## Iteration 19 — pile v3 · event times · (i) info · ordering fixes (2026-07-26)

- **Pile v3:** the folded bundle shows only its lead card over a stacked-paper shadow (count badge
  carries the "8"); slivers removed.
- **Event times:** any sushi can carry a start time (composer time field → reserved `time` meta).
  Shows as a tabular chip in compact rows (transit keeps its depart), as a pill on full cards, and in
  the event-card popover.
- **(i) info:** long-form notes (paragraphs) via a textarea in Links & notes (reserved `info` meta).
  Cards with info get an (i) button that opens the event-card popover with the paragraphs (scrollable).
  Reserved keys (`group`, `time`, `info`, `transit:*`) are hidden from the Links & notes editor.
  The Takao cablecar's funicular notes (31° grade, prices) are seeded/enriched as the demo.
- **Ordering bugs fixed:** `reorderWish` was swapping within the mixed day list (members + bundles +
  loose all together) — members now reorder within their bundle, bundles/loose within the day's top
  level, with full sibling renumbering that self-heals previously corrupted orders. Bundles got
  hover ↑/↓ controls. **Map entries are now emitted in route order** (days → top-level order → bundles
  expanded), so pin numbers, the index list and the thread finally agree with the board exactly.

---

## Iteration 20 — the initial database (2026-07-26)

Seeds rebuilt from **docs/plan.md** (the 12-day itinerary) + **docs/things-to-do.md** (the menu):

- **12 days, Oct 15–26**: Tokyo ×5 → Hakone → →Kyoto ×4 → Osaka → Arima/Kobe (new Kobe city anchor).
- **91 rows**: 87 events + 4 bundles. Every day carries its transits (16 total — Romancecar, shinkansen,
  Eizan to Kurama, Arima legs, KIX flight), times from the plan, info paragraphs from the research
  (booking flags, crowd tactics, prices ¥/₹), and food/shop items.
- **Bundles**: Okutama adventure (on D4), Mt. Takao fallback / Kawagoe Festival / Nara half-day
  (folded in the Inbox as optional excursions). 2 hidden gems (Nonbei Yokocho D2, Ishibekoji D9).
- **Inbox menu**: teamLab Borderless, Ghibli (ticket-drop info), Skytree, USJ + Super Nintendo World
  (Express Pass warning), Don Quijote, Kappabashi.
- **Footer reference modals** from TRIP.docs: **Visa (India → Japan eVisa — ₹500 + VFS ≈ ₹1,300,
  exemption from the Jul 2026 hike, live Visa Issuance Notice warning + official links)**, Book-now
  checklist, Money & getting around (IC cards, cash, pass verdicts), October notes (foliage reality,
  festival dates). One shared doc modal, Esc/overlay close.
- Storage keys bumped (wishes v5, shopping v4) — deliberate fresh start, no migration; seedLocal now
  creates bundle rows first and links members via `groupKey`. Old ensure* boot enrichments retired.
- Packing/tips refreshed to match (visa notice, smartEX, takkyubin, veg/Jain phrase).
- Verified: 12 columns render, Okutama on D4, 3 inbox piles, doc modals show visa/booking content,
  map day select lists 12 days, festival-day route draws. No JS errors.

---

## Iteration 21 — completeness + compact fixes (2026-07-26)

- **Full menu coverage:** +76 inbox picks from every part of things-to-do.md (Tokyo icons/quirks,
  8 day-trips as single cards, 19 Kyoto temples/experiences, 12 Osaka, 9 Kansai incl. Himeji, Koyasan,
  Minoo, Kinosaki, Nachi) — all passive, ordered by region, each with coords + info. DB now 167 rows.
- **Times only where timing is real:** stripped 29 guidance times; 7 remain (teamLab slot, Shibuya Sky
  sunset, Jidai Matsuri, Kurama, Gion Corner, Kawagoe floats, Kodai-ji illumination) + transit departs.
- **Compact rows rearranged:** names wrap to full length (`overflow-wrap: anywhere`, zero truncation
  verified) with the time/city chip on its own line beneath.
- **Card top row overlap fixed:** tags wrap; (i)/bead/kebab pinned right, never overlapped (measured).
- Verified food list (27 dishes) and shopping wish list (24 ideas) regenerate from the new seeds.

---

## Appendix — Interaction map

```
Hero ──► Board / Map CTAs
Dock ──► Board · Shop · Map · Taste · Days(drawer)
Board Add / card Edit ──► Wish modal (create | update)
Board card hover ──► ↑↓ reorder icons
Column Map ──► Map day filter
Map day bar ──► All | Inbox | Choose day ▾
Map index ──► Focus · Board · Day(drawer)
Itinerary chip ──► Preview popover → Map | Edit | Board
Itinerary day ──► + Wish (modal) · Board (flash col) · Map
Shop Add item ──► Shop modal
Food row ──► Try toggle · Map
Packing Open ──► Shop / Days
Tips CTA ──► Board | Map | Shop | Days(drawer) | Packing
```
