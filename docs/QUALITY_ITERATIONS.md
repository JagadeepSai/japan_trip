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

## Iteration 22 — event images + inbox filters (2026-07-26)

- **Images:** reserved `image` meta (URL). Composer gets an Image URL field (Links & notes);
  renders as a flush banner on full cards, atop map hover cards, and in the event popover
  (lazy-loaded, self-removing on error). 23 iconic events seeded with Wikipedia thumbnails
  (330px API-guaranteed sizes — 640px upscales 400'd). SQL seed regenerated with images.
- **Inbox filters:** search + type chips + city chips inside the tray (hidden when collapsed).
  Groups match when any member matches; badge shows `shown/total`. Verified: 85 → 6 on Food,
  search "onsen" → 3.

---

## Iteration 23 — images everywhere · calendar view · 旅路 journey river (2026-07-26)

- **Images for (almost) all events:** Wikipedia search API resolver → 103/147 non-transit events
  carry a ~320px thumbnail (DB stores only URL strings; images hotlinked from Wikimedia — free-tier
  safe). `ensureImageEnrichment` merges seed images into pre-existing boards by label (fixes
  "can't see images"). SQL seed regenerated.
- **Calendar view:** third board toggle — a Mon–Sun month grid over the trip window; trip cells show
  compact rows + bundle chips and are full **drop zones** (drag between cells/inbox verified);
  off-days muted.
- **旅路 Journey section** (replaces the Days drawer): the trip as a **flowing river** — day bands
  tinted by city and blending; the river bends toward each event so cards always sit adjacent
  (solves far-side readability); **red fate-line railings** (dashed) carry rotated leg times;
  animated flow strokes (pure SVG/CSS, no deps); **transit markers sit on the river** with mode ·
  depart · duration · date and shift the river's hue per segment; event cards show images, open the
  event popover; passive = dashed, hidden = neon. Left vertical **collapse bar** (persisted).
  Dock: Days → Journey (river icon); map index "Day" buttons and data-go jump here.
- Research pass on overview patterns (multi-view apps, storyline charts, map-trace) — writeup in chat.

---

## Iteration 24 — tabbed views · map modal · inset card images · perf (2026-07-26)

- **Tabbed views:** dock switches one visible section (`setView`, localStorage `jp-view`);
  renders are view-gated with dirty flags — a store change re-renders only the visible view
  (refreshWishes: 416ms → ~10ms on non-plan views, ~260ms on plan; DCL −20%).
- **Map = modal** (`#map-overlay`): FAB + every "On map"/day-Map/taste-jump path opens it;
  ×/backdrop/Esc/view-switch close it; markers/index flush on open (`mapDirty`).
- **Card images:** `.wc-img` full-bleed banner (overhung the 3px type border, clipped corners)
  → inset framed 108px thumb below the tag row. `decoding=async` + wikimedia preconnect + favicon.
- Footer: countdown moved from hero + link pills (superseded by iteration 25's FAQ tab).
- Verified by a 5-agent adversarial workflow (39 checks passed). Its finds, all fixed:
  resize-while-hidden wiped board threads (drawThreads now view-gated); journey card preview
  dismissed by its own opening click (`data-jopen` in the ignore list); view switch smooth-scrolled
  across blank page (`behavior:"instant"`); `jp-view="toString"` blanked main (`Object.hasOwn`);
  null-deref in `closeItinerary` after drawer removal.

## Iteration 25 — per-tab postcards · FAQ guide · map modal fit (2026-07-26)

- **Dock:** Journey ↔ Plan swapped (Journey first), FAQ tab added, map FAB sits level
  (removed the raised translateY; dock align-center).
- **Per-tab theme:** `body[data-view]` — each tab gets its own hero postcard (plan: Chureito
  pagoda+Fuji · journey: Fushimi Inari torii tunnel · shop: Shibuya neon · taste: ramen ·
  faq: Hakone torii) + a matching ambient radial palette, day and night; photos idle-prefetched.
- **Hero:** full-viewport → compact banner (clamp 300–440px) with a glass kicker pill naming
  the tab (寿司舟 · Plan …); Fuji ridge SVG only on Plan.
- **Map modal:** header is just "Map 地図" + close (eyebrow/pulse gone), flex column layout,
  `overflow:hidden` (no scrollbars), map takes every spare pixel (560 → ~676px at 1440×900;
  mobile `calc(100dvh − 210px)`).
- **FAQ view (案内):** hosts all reference content — 4 fact tiles (days-to-go, dates, cities,
  events-on-days) + 6 cards with vertical kanji spines (査証/予約/両替/十月/荷造/心得) opening the
  existing modals; `[data-doc]`/`[data-open-modal]` now delegated (survives re-renders).
  Footer keeps only the countdown.
- Pin hovercard image → inset frame (was a misaligned full-bleed banner).

## Iteration 26 — full verification-workflow findings fixed (2026-07-26)

The 23-agent adversarial workflow (65+ passes) finished judging; every confirmed finding fixed:

- **Preview popover overflow (major):** `showWishPreview` assumed ≤180px; with image+info it's
  300–400px, pushing On map/Edit/Board off-screen (and any scroll dismisses it). Now measures the
  rendered popover and flips above the anchor / clamps into the viewport.
- **Mobile journey clipping (major):** right-bank `.jcard`s overflowed the viewport at 390px.
  River AMP shrinks on narrow screens and right-side cards size to the space the bank leaves them
  (verified: 51 cards, 0 overflowing).
- **Night hero lede (major):** `.hero-lede` kept day ink (~1.3:1 on the night photo) — night
  override added (#cdd9ec).
- Pile titles over-truncated: the three hover-hidden header tools reserved ~88px — they now take
  width only on hover/focus (title 67→151px at rest).
- Calendar mode renders the inbox compact (the month grid sat ~19,700px below the toggle on
  mobile behind full cards; now ~2,100px with 100 mini rows).
- Wrong-subject seed images: Oedo Antique Market (a wrestler portrait) and Golden Gai (a singer
  portrait) → venue photos in data.js + schema.sql; `ensureImageEnrichment` swaps the known-bad
  URLs on existing boards without touching user-chosen images.
- Mobile sync pill scrolls away with the hero (was fixed over the Add Sushi button); city letter
  pins step back at national zoom (opacity .6, scale .85) so cluster counts read; map-close is a
  40px bordered round button; footer band tightened (section 6rem→3.5rem bottom padding).
- Accepted as-is: renderKanban's ~200ms plan-view re-render (residual hotspot, offered as a
  future per-column optimization).

---

## Iteration 27 — 関所 password gate · integrated banner · popover behavior (2026-07-26)

- **Password gate:** full-screen 関所 card before anything else; the boot handler returns before
  ANY init when unauthed — no store init, no fetches, no realtime (verified: zero Supabase/OSRM
  requests while gated; only static assets load). Password is checked as a SHA-256 hash (the
  plaintext never appears in source) and persisted in localStorage, so a browser unlocks once.
  An inline head script restores `html.authed` instantly on revisits (no gate flash).
  Note: client-side gating — it stops casual visitors from consuming free-tier DB connections,
  not a determined reader of the source.
- **Banner integrated:** the hero is now a rounded postcard strip (~230px) inside the content
  column; the board heading sits at y≈313 — no scroll-past-a-hero at the start. Fuji ridge SVG
  retired.
- **Popover:** scrolling no longer dismisses the event card (it pins to the viewport); closes
  only via ×, Escape, or clicking outside.
- **Image quality:** aspect-scanned all 93 seed thumbs; replaced 3 that cover-crop badly or show
  the wrong subject — Shibuya Sky (skinny tower on white sky → open-air deck view), Tea ceremony
  (SVG glyph → Gokoku-ji ceremony photo), Zazen (monk portrait → Ryōan-ji kare-sansui).
  data.js + schema.sql + `BAD_SEED_IMAGES` migration for existing boards.

## Iteration 28 — banner joins the tab header (2026-07-26)

- Tab switches now land at the very top: banner postcard + section heading as one unit
  (gap tightened 2.4rem → 1.5rem). Gotcha: swapping sections re-clamps the scroll offset
  *after* the click handler returns, dragging the page ~100px down — `setView` re-asserts
  `scrollTo(0)` on the next animation frame.

## Iteration 29 — shared trip dates · journey date rail · 3D anime river (2026-07-26)

- **Countdown removed** from the page bottom (footer deleted; FAQ keeps its days-to-go fact).
- **Trip start/end dates** (Plan toolbar): `TRIP.days` is now generated from a shared range —
  the curated 12-day plan is the template (day k keeps its city/title), extra days append as
  "Open day", 30-day cap, end<start rejected. Board, calendar, journey, day-selects and FAQ all
  follow. Days dropped by shrinking fall back to the Inbox (nothing is ever hidden) and return
  when the range grows back. Synced via a new `settings` table (key/value jsonb; realtime) with
  the same local-mode fallback — schema.sql + COMMANDS.md updated.
- **Journey date rail** replaces the collapse bar: all trip days spread down a fixed left rail,
  the day under the viewport stays lit while scrolling (verified exact for d4/d8/d11), clicking
  a date sails the river there. Hidden under 940px.
- **3D anime river:** the flat stroke became a ribbon — blurred grassy bank underlay, extruded
  side wall (same path shifted +DEPTH, darkened), sunlit per-segment surface, rim-light stroke,
  feDropShadow over the whole ribbon, node pins with elliptical ground shadows, a sparkle layer
  over the two flow streams (all pause off-screen), and deeper layered shadows + hover
  perspective tilt on day plaques / cards / transit tickets. Night mode: neon railings, moonlit
  water, glowing rail chip.

## Iteration 30 — the valley around the river (2026-07-26)

- Procedural SVG scenery, deterministically placed (hash of slot index — re-renders never
  shuffle the landscape): **taiko bridges** under every transit ticket (wider than the card so
  the ends show), **torii** at each day station, **stone lanterns** (glow + halo at night),
  bushes/grass/rocks scattered on the bank opposite each card, a **source pond** and an
  **end-of-trip lake** (so the ribbon no longer tapers like a snake), and three bobbing
  **sushi boats** (bob animates the group's children — a CSS transform on the positioned
  group would override its SVG placement).
- Journey rail enlarged (0.62→0.8rem day, 0.55→0.68rem date, taller, active chip shadow).
- Counts verified: 12 torii, 10 bridges (=transits), 11 lamps, 43 bushes, 59 grass, 8 rocks,
  3 boats at exact declared coordinates; no page errors.

## Iteration 31 — timeline mode · durations · banner = header (2026-07-26)

- **Timeline** (4th board density): one continuous horizontal strip, 24h per day at 54px/h
  (12 days = 15,552px). Timed events (◷) pin to their clock time; untimed ones auto-flow from
  09:00 in board order with 15m gaps, so each day reads as a plausible plan. Overlaps stack
  into lanes — reservation uses the VISUAL span (short events render at a 46px minimum, so a
  30m block books ~1h of lane; without this, blocks overlapped). Groups render as fluid
  organic-radius bubbles wrapping their members with a 結び tag (opens group edit). Sticky
  per-day chips ride along while scrolling a day (gotcha: overflow:hidden on the band would
  become the sticky's root and kill it). Day bands tinted by city; blocks open the preview.
- **Durations:** `duration` is a reserved meta key with a composer field ("How long? ~2h");
  resolution = own meta → curated per-label map (123 entries in data.js — USJ 9h, Ghibli 3h,
  Fushimi Inari 2h30 …) → type default (exp 2h / place 1.5h / food 1.25h / shop 1h / transit 1h).
  Curated values ship as JS fallbacks, not stored rows — no seed regen, user edits win.
- **Banner is now the header:** view title (Sushi Boat / The Journey / …) sits bottom-left ON
  the postcard, kicker top-left, 日本の旅 wordmark top-right, lede bottom-right; per-section
  h2/eyebrow hidden; hidden-boat toggle relocated to board-tools; veil darkened at the foot so
  the white title reads over any photo.

## Iteration 32 — readable timeline · journey timeline · durations in the DB (2026-07-26)

- **Timeline blocks fully readable:** every block now shows thumb (40px) + full name (2-line
  wrap) + time at ≥176px label width; the TRUE time span is the colored 4px bar along the block
  bottom (a 30m stop no longer collapses to an unreadable sliver). Lane booking reserves the
  label width, so stacking guarantees zero collisions (verified 61/61).
- **Journey tab gets the horizontal timeline** just above the river, same renderer via a shared
  `.tl-scroller` (its own preview/group-edit delegation — the plan handler is scoped to #kanban),
  with a distinct water-gradient background; the plan strip also drops the board's wave pattern +
  right-edge mask that leaked in via `.section-board .kanban` specificity.
- **Day chip minimal:** one quiet line ("D1 · Thu, 15 Oct · Tokyo") — was a two-line pill.
- **Durations now live in the DB seed:** 120 seed rows in data.js AND schema.sql carry
  `{key:"duration"}` meta (all validated as JSON); boot enrichment merges missing durations
  into existing local boards; TRIP.durations stays as fallback for the 3 unmatched labels.
- **Popover follows its anchor on scroll** (positionWishPreview re-runs per scroll frame);
  its image is an inset frame (the negative-margin banner left a gap). Pin hovercard gets a
  fixed 250px width — `width:100%` had nothing to resolve against in a shrink-to-fit Leaflet
  tooltip, which squeezed the photo.
- Bushes removed from the river valley (replaced with grass tufts).

## Iteration 33 — drag-to-retime · journey = timeline hero · city date nav (2026-07-26)

- **Plan timeline drag:** blocks drag horizontally (6px threshold keeps clicks working), snap to
  15-min steps, drop writes `time` meta (`transit:depart` for transits) and `day_id` when the
  block crosses a day boundary. Gotcha: a once-capture click swallower lingered when the browser
  fired no trailing click and ate the NEXT honest click — replaced with a 350ms time-window guard.
- **River retired** (~330 lines): Journey = the horizontal timeline as a full-bleed hero, plus a
  **date navigator** — one pill per day with **fluid city bubbles** behind them. Day→city is
  inferred from the day's own events' places (transits excluded as arrivals); a day whose events
  span two cities sits inside both bubbles (verified overlaps: Hakone×Kyoto, Kyoto×Osaka).
  Pill click smooth-scrolls the strip; strip scroll lights the pill. journeyFocusDay targets the
  strip now.
- **Night always shows the hidden events** — showHidden is driven by the lantern (boat stays lit
  as an indicator); day 165 → night 167 visible.
- Popover hides when its anchor scrolls off-screen (was floating detached); timeline scrollbars
  get thin styled thumbs day+night (night default looked foreign).

## Iteration 34 — GCal create · inbox→timeline drop · agenda list · timeline dress-up (2026-07-26)

- **Create like Google Calendar:** click empty timeline → composer opens prefilled (day, time,
  1h); drag a range → dashed vermillion ghost live-labels the span ("+ 2h 30m") and prefills the
  duration. Snap 15m. Plan strip only.
- **Inbox → timeline drop:** the strip is a drop zone; dropping an inbox card sets day AND start
  time from the cursor hour (transits set depart; groups move whole with no time). Verified:
  teamLab Borderless → d2 @ 14:00.
- **List view** (5th density): agenda rows — date + weekday/city + day title left, events as
  type-spined chips with vermillion times, 結び knot pills for bundles, dashed transit chips,
  passive faded. Chips open the preview.
- **Timeline dress-up:** blocks adopt the board card language (3px type spine, Fraunces titles,
  washi paper, soft shadows, 42px thumbs); day bands get a 3-layer wash — city tint pooling under
  the header, dusk shading over the small hours at both ends, parity shade between alternate days.
- Note: the popover's off-screen guard also dismisses previews opened for below-fold anchors —
  correct behavior; a test tripped on it, not users.

## Iteration 35 — list chrome off · journey viewport-fit · map always active (2026-07-26)

- List view drops the board container (background/border/mask) — agenda floats on the page.
- Journey strip backdrop: the blue-green wash → quiet warm washi gradient (day) / ink (night);
  the day bands carry the colour.
- **Journey never scrolls the page:** `html:has(body[data-view=journey]) { overflow: hidden }`
  (body-level overflow does NOT stop the document scroller) + JS sizes the strip to
  `innerHeight − top − 14`; tall lane stacks scroll inside the strip. Verified with real wheel
  events (programmatic scrollTo bypasses overflow locks — first test draft lied).
- **Map modal is always in scroll-to-pan active state** — setMapActive(true) at init and on every
  open; the outside-click/wheel deactivators are gone (there is no page behind a modal to scroll).
- Sync audit for the round's question: all 27 wish mutations + shopping + trip dates go through
  the dual-mode stores (zero direct storage writes outside api.js); packing/tastes/night/view
  prefs are per-device by design.

## Iteration 48 — vertical journey timeline (2026-07-26)

- Orientation toggle (chip at the day-nav's right, persisted jp-journey-orient): the journey
  strip transposes — time flows DOWN, block heights = durations (lanes repacked for the 62px
  vertical minimum, not the 176px label width), hour ruler + weather lane on the left edge
  (temp maps to x, rain bars horizontal), sun markers at their hour, vertical sky cycle
  (dawn→dusk down each day), city ribbons down the left, day chips sticky-top through their
  band. Day nav stays horizontal + fixed above; nav clicks scroll vertically to 06:00; active
  pill tracks scrollTop; origin trim carries over (flight at 162px from top).
- Verified desktop + mobile: geometry exact, toggle round-trips, zero page scroll both modes,
  278-point weather curve + 23 sun markers render vertically; plan strip untouched.

## Iteration 47 — the strip origin IS 3h before the flight (2026-07-26)

- Left-scrolling into D1's dead morning was redundant → the strip's coordinate origin is now
  startMin = firstD1Event − 3h (09:35 for the 12:35 flight): scrollLeft 0 IS the trip start,
  nothing left of it exists. Ten geometry sites updated (bands/heads/ribbons/ticks, blocks,
  bubbles, sky background-phase, wx/sun markers, tlSpotFromX, drag-drop math, nav goto/active)
  — verified: flight at exactly 162px (3h×54), Senso-ji cross-day at 1211px, retime drag still
  writes correct times, no errors.

## Iteration 46 — journey banner → headband, true zero-scroll (2026-07-26)

- Journey-only banner compression: 169px postcard → 79px headband (kicker + title + wordmark
  in one band, lede hidden) via body[data-view=journey] overrides.
- Chased the residual document overhang to THREE stacked sources: body dock-clearance padding,
  the section's 3.5rem bottom padding, and the strip's own 1.6rem margin-bottom — all zeroed
  on journey. docHeight now equals viewport exactly at 1440×900, 1440×760 and 390×844.

## Iteration 45 — 6am landings · actives audit · mobile chat sheet (2026-07-26)

- Journey nav day-click now lands at 06:00 (not midnight's empty band).
- Actives audit: 12 of 15 passive day-events were inbox-promoted anchors still carrying their
  "maybe" default (Skytree, Kiyomizu, Nijo, Ginkaku-ji, Kurama hike, Kappabashi, Don Quijote…)
  — activated in DB + seeds regenerated (tools/regen-seeds.py now a reusable script). Kept as
  intentional maybes: Monkey Park, Kobe beef, Yoyogi buskers.
- Mobile chat was unusable → full-height sheet at ≤560px (own ×, above the dock), 16px inputs
  (kills iOS focus-zoom — the core bug), scrollable settings (log stays visible), safe-area
  padding on the composer.

## Iteration 44 — the REAL itinerary: Oct 14–25, flights, timed schedule (2026-07-26)

- **Flights booked & loaded:** CX BLR 01:15 → Tokyo 16:05 (Oct 14) and SQ KIX 16:50 (Oct 25)
  → BLR 10:35+1, both as timed transit events. Trip dates shifted to Oct 14–25 (weekdays
  corrected: Oct 14 = Wednesday).
- **Structural edits:** Okutama removed (tail-season risk) → Mt. Takao trek promoted to d3 with
  full timed bundle; festival day = Nijo → Ginkaku-ji/Philosopher's Path → Kurama–Kibune hike →
  night Fire Festival (Jidai Matsuri daytime skipped → inbox, passive); d7 beefed with Kiyomizu
  golden hour + Higashiyama lantern lanes; kimono = BUY vintage at the new Tōji flea market
  event (21st = the Arashiyama day) instead of renting; markets at city ends (Oedo Sun 18 =
  3rd Sunday ✓ verify note, Nishiki d10, Kuromon d11); club night lands on Saturday.
- **~60 events now carry start times** matching the plan; photos fetched for 10 previously
  imageless day-events (Tōji, Nishiki, Pontocho ×2, Gion, Kifune, Amerikamura, Arima, Sagano,
  Ginza) — map-only search results rejected.
- **Shopping researched & expanded** (LIVE JAPAN / Time Out lists): Don Quijote (KitKats,
  Megrhythm, LuLuLun, pain patches), Kappabashi (knife, chopsticks), Oedo antiques, new Itoya/
  Loft stationery event, 4 new buy-list rows (9 total).
- **Pipeline:** changeset applied to the live DB first, then data.js seeds AND the schema.sql
  SEED regenerated FROM the DB (single source of truth, real UUIDs, JSON re-validated);
  plan.md rewritten with the timed day cards. Mobile journey nav fixed (labels collided at
  390px → day-number pills + unlabeled tint bubbles). NOT pushed to GitHub per instruction.

## Iteration 43 — torii geometry · dates resilience · preview slimmed (2026-07-26)

- Nuki beam was floating mid-header (a red stripe behind the controls) — now anchored to the
  chat head's bottom boundary via ::after on the head itself.
- Preview popover drops the Board action (On map · Edit · Chat · Directions remain); dead
  handler removed.
- **"Day list not dynamic" root-caused to Live mode:** the missing `settings` table made trip
  dates fail to load on reload, snapping the day list to defaults. SettingsStore now writes a
  localStorage mirror FIRST and falls back to it when the cloud read fails — verified against
  a stubbed supabase with a 42P01 settings error: a 15-day trip persists across reload with 16
  day options. Once upgrade-settings-auth.sql runs, cloud wins again.

## Iteration 42 — going Live: real Supabase wired · auth e2e · directions (2026-07-26)

- **Real project connected** (config.js keys). Probe found an old seed (167 wishes, no image/
  duration meta) and missing `settings`/`user_settings` tables. Fixes: enrichment now runs in
  BOTH modes (cloud rows backfilled by-label, additive+idempotent — executed once from here:
  103 images + 120 durations now IN the DB, verified via REST), and
  `supabase/upgrade-settings-auth.sql` creates the two missing tables (user must run it).
- **Auth flow completed**: AuthStore.onChange follows the session (OAuth return updates the UI
  live); signed out → only "Sign in with Google"; signed in → only "Sign out" (+ email) in the
  same spot; save upserts the chat config to the user's private row; DB config wins on load;
  signed-out falls back to localStorage. E2E-verified against a mocked supabase-js (stubbed
  CDN): 4/4 scenarios. Real OAuth still needs the Google provider enabled in their dashboard.
- **Chat head polished** (title, custom pill select with SVG chevron, uniform hover icons);
  **FAB inline with the dock** on desktop (3px off center), lifted above the full-width dock on
  mobile; mobile panel spans the width with a one-row head (title hidden).
- **Directions buttons**: visible Google-Maps directions link on full cards (beside On map) and
  in the preview popover. All tests hermetic via config.js route-interception — no accidental
  writes to the live DB.

## Iteration 41 — chat polish · model dropdowns · sign-in groundwork (2026-07-26)

- **Root cause of the unpolish:** display classes (flex/grid) silently override the `hidden`
  attribute — the chat panel, settings and pills never VISUALLY closed. Fixed globally with
  `[hidden] { display: none !important; }`; regression-checked the wish modal/transit blocks.
  Then walked EVERY chat control with computed-style assertions (9/9): FAB toggle, ×, gear
  toggle, provider switch (base URL row hides), model select, save round-trip, thread +/−,
  pill add/remove, key-hint links.
- **Model dropdowns:** standard models per provider (Groq 3, Gemini 4, OpenRouter 4 :free,
  OpenAI 3, Anthropic 2) + "Custom…" revealing a free-text input; unknown saved models
  round-trip as Custom. Per-provider "Get a key" links under the key field.
- **Google sign-in groundwork** (Supabase Auth): `user_settings` table (RLS `auth.uid() =
  user_id`) in schema.sql; AuthStore (signInWithOAuth google / signOut / load+save settings);
  chat ⚙ shows a Sign-in row ONLY in supabase mode; on save while signed in the chat config
  also upserts to the user's private row, and on boot a signed-in user's row wins over
  localStorage. UNTESTED end-to-end (needs their Supabase project + Google OAuth client —
  steps documented in COMMANDS.md); local-mode hiding verified.
- Empty-state ⛩ emoji → inline SVG torii (tofu'd without emoji fonts).

## Iteration 40 — 鳥居 Trip Chat (2026-07-26)

- **AI chat** in a torii-styled panel (kasagi beam overhanging the top, vermillion pillars),
  opened by a torii FAB above the dock. Threads (new/switch/delete) persist in localStorage
  (cap 30); works only behind the gate.
- **Providers** (key stored only in the browser; ⚙ panel): Groq + Gemini + OpenRouter free
  tiers recommended; OpenAI, Anthropic (browser-access header), Custom/Ollama base URL. Three
  adapters: OpenAI-compatible chat/completions, Gemini generateContent, Anthropic messages.
- **Live trip context**: buildTripContext() renders the CURRENT itinerary (days, events with
  times/durations, bundles, inbox) as markdown into the system prompt on every request, with a
  style prompt enforcing concise (<120 words) markdown answers.
- **Event pills**: 💬 on every full card + Chat in the preview popover attach events to the
  next message (dedup, individually removable ×); the API payload gets a per-event context
  block (type, city, day, time, duration, location, notes) while the UI shows chips.
- **Markdown replies rendered rich** via an escape-first mini renderer (headings/bold/italic/
  lists/quotes/code/links-http-only) — LLM output cannot inject HTML by construction.
- Graceful states: not-connected hint, error bubbles, typing dots; COMMANDS.md §6 documents keys.
- Verified with a stubbed provider: pills→payload, md render (h/strong/li/link), thread
  persistence across reload, new-thread, no-key path; 143 card icons live; no page errors.

## Iteration 39 — droplet glyph · full-bleed banner · tab rooms (2026-07-26)

- Humidity: 湿 → tiny inline-SVG droplet (renders everywhere, self-explanatory).
- Banner is edge-to-edge on every tab (no margins/radius/side borders); its content keeps the
  1100px page column.
- **Each tab wears its own room** — pure-CSS pattern + hue per view, night variants included:
  Plan = faint planning grid over warm washi; Shop = wide noren stripes in plum/gold;
  Taste = matcha rice-dot grid; Journey = tall sky wash (no pattern — the strip is the art);
  FAQ = shippou rings in lavender.

## Iteration 38 — real sun & weather on the timeline (2026-07-26)

- **Residual choppiness solved for real:** the per-day sky divs left subpixel joints at every
  boundary after day 1 — the sky is now ONE element with a repeating gradient
  (background-size = day width): zero seams by construction.
- **Sunrise/sunset markers** (▲ 05:47 amber / ▼ 17:07 indigo) per day at exact positions —
  computed locally with the NOAA solar approximation for each day's city coords in JST, so they
  work for any date with no API (verified vs Tokyo mid-Oct almanac, ±2 min).
- **Hourly weather ribbon** in a 34px lane above the ruler: a continuous temperature polyline
  (288 points across 12 days) with translucent rain bars per hour. Data: Open-Meteo (keyless)
  — live forecast within its 16-day horizon, otherwise the same dates last year via the ERA5
  archive as a typical stand-in; one request per consecutive same-city run (5 total), cached in
  localStorage (3h forecast / 7d typical). Injection is token-guarded against re-renders and
  skips silently offline.
- **Day chips** gain `≈20°/15° · 湿87%` (max/min · mean humidity; ≈ marks typical data, title
  explains; kanji instead of an emoji droplet that tofu'd on some fonts).

## Iteration 37 — the sky-cycle backdrop (2026-07-26)

- Fourth (and right) take on the timeline backdrop: **each day's 24h is a sky** — midnight
  indigo → dawn peach (~06:30) → clear midday → golden hour (~17:30) → sunset ember → night.
  Adjacent midnights meet, so day boundaries emerge from darkness with NO divider — which also
  kills the choppy shimmer (the old 1.5px dashed border repainted badly at fractional scroll
  offsets; 61fps now). A slim city-tinted roofline (3px) along each day's top edge keeps the
  city identity (0.45 opacity at night — full-strength glared). Applies to both Plan and
  Journey strips since they share the renderer.

## Iteration 36 — journey strip goes seamless (2026-07-26)

- Third take on the journey backdrop: no background at all — the strip is transparent and
  borderless, floating on the page's own washi; day bands, dusk shading and cards carry all the
  colour. (Take 1: blue-green wash — clashed; take 2: warm gradient — read as a big beige box.)
- List view gets 1.25rem horizontal padding.

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
