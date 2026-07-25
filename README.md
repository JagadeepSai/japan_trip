# 日本の旅 — Japan Trip

Collaborative, editorial single-page trip planner (Oct 15–26, 2026 · Tokyo → Hakone → Kyoto → Osaka → Arima/Kobe).
Pure static UI (no build step) + **Supabase** for shared, realtime persistence — free to host.

**→ Full setup & deploy guide: [COMMANDS.md](COMMANDS.md)** (Supabase free tier + GitHub Pages/Netlify).

## The product

- **寿司舟 Sushi Boat** — the planning board. Events ("sushi") ride as boat cards on a horizontal
  day lane; the Inbox is a collapsible tray of unscheduled picks. Same-day active stops are tied by
  the **赤い糸 red thread** with live transit times. Cards/Compact density toggle.
- **結び Groups** — bundles (e.g. the Mt. Takao excursion) that render as rope-bound vessels on a
  day and stacked piles in the Inbox, with a `start ⇢ end` shipping tag. Drag the pile = move the
  whole excursion; drop a card onto a bundle to absorb it.
- **Map** — full-width stage with a collapsible 目次 index, cluster badges per metro, pin hover
  cards, and day routes that follow real streets (OSRM) with always-visible time/distance captions.
  Transit legs render dashed with their declared mode/duration.
- **Night mode** — the lantern (top-right) flips the whole site + map tiles; a night-only mini boat
  beside the board heading reveals **hidden events** (any event with a `hidden` key in Links & notes)
  in neon red.
- **Supporting** — shared shopping buy-list (+ wish-list ideas from shop events), food tried-list,
  itinerary drawer, packing/tips + reference modals (Visa, bookings, money, October) in the footer.

## Event fields

| Field | Notes |
| --- | --- |
| label / location | Autocomplete via Nominatim → lat/lng, or pick on a map |
| type | place / experience / food / shop / **transit** (mode + depart + duration) |
| day + order | Drag on the board; bundles carry their members |
| time | Optional — only for genuinely timed events (shows on cards + popover) |
| group | Attach to a bundle, or create one (name + start/end city) |
| info | Long-form paragraphs behind the card's (i) |
| meta | Free key/value list — URLs become links; key `hidden` makes it a night-reveal secret |

## Data

- `docs/plan.md` + `docs/things-to-do.md` are the sources of the **initial database**
  (167 rows: 12 days, 16 transits, 4 bundles, full menu in the Inbox), seeded automatically —
  into localStorage in Local mode, or into Supabase on first visit of an empty project.
- `docs/QUALITY_ITERATIONS.md` — the full design/iteration log.

## Local preview

```bash
python3 -m http.server 8765   # → http://localhost:8765/
```

No Supabase keys in `js/config.js` = Local mode (localStorage, seeded).
