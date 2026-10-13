#!/usr/bin/env python3
"""Build area-walks.md + KML + Maps direction links from maps/walks.json."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "maps" / "walks.json").read_text())
OUT_MD = ROOT / "docs" / "area-walks.md"
OUT_KML = ROOT / "maps" / "japan-trip-walks.kml"

OSRM = "https://router.project-osrm.org/route/v1/foot/{coords}?overview=full&geometries=geojson"


def osrm_legs(stops: list[dict]) -> tuple[list[int | None], list[list[tuple[float, float]]]]:
    pts = [(s["lng"], s["lat"]) for s in stops if "lat" in s and "lng" in s]
    if len(pts) < 2:
        return [], []
    coords = ";".join(f"{lng},{lat}" for lng, lat in pts)
    url = OSRM.format(coords=coords)
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            payload = json.loads(r.read().decode())
        route = payload["routes"][0]
        mins = [max(1, round(leg["duration"] / 60)) for leg in route["legs"]]
        geom = [(p[1], p[0]) for p in route["geometry"]["coordinates"]]  # lat,lng
        return mins, [geom]
    except Exception:
        return [], []


def maps_dir(stops: list[dict], mode: str = "walking") -> str:
    named = []
    for s in stops:
        if "lat" not in s:
            continue
        named.append(f"{s['lat']},{s['lng']}")
    if len(named) < 2:
        return ""
    travel = "walking" if mode == "walk" else "transit"
    origin = named[0]
    dest = named[-1]
    waypoints = named[1:-1][:8]
    q = {
        "api": "1",
        "origin": origin,
        "destination": dest,
        "travelmode": travel,
    }
    if waypoints:
        q["waypoints"] = "|".join(waypoints)
    return "https://www.google.com/maps/dir/?" + urllib.parse.urlencode(q, safe=",|")


def checkbox(on: bool) -> str:
    return "[x]" if on else "[ ]"


def fmt_stay(mins: int) -> str:
    if mins <= 0:
        return "—"
    if mins < 60:
        return f"{mins} min"
    h, m = divmod(mins, 60)
    return f"{h}h {m:02d}m" if m else f"{h}h"


def enrich_walk(walk: dict) -> dict:
    core = walk["core"]
    walk_stops = [s for s in core if s.get("leg_mode") in (None, "walk") or "leg_mode" not in s]
    # Only OSRM consecutive walk pairs; leave declared transit times alone
    for i in range(1, len(core)):
        prev, cur = core[i - 1], core[i]
        if cur.get("leg_mode") and cur["leg_mode"] != "walk":
            continue
        if "lat" not in prev or "lat" not in cur:
            continue
        mins, _ = osrm_legs([prev, cur])
        if mins:
            cur["osrm_min"] = mins[0]
    walk["maps_url"] = maps_dir(core, walk.get("mode", "walk"))
    return walk


def write_markdown(walks: list[dict]) -> str:
    h = DATA["hotels"]
    lines = [
        "# Japan 2026 · Area walks",
        "",
        "Working doc for the Oct 14–25 trip. Each day is one (or two) **walkable clusters**, not a city-wide zigzag.",
        "",
        "**How to edit:** tick/untick the area list, or tell me “add X, drop Y on Day N”. I rebuild the route, walking times, KML and the Google Maps link.",
        "",
        "Source of truth: [`maps/walks.json`](../maps/walks.json). Rebuild: `python3 tools/build-walks.py`.",
        "",
        "---",
        "",
        "## Hotels (every walk starts or ends here)",
        "",
        "| City | Stay | Address | Door → transit |",
        "|---|---|---|---|",
        f"| **Tokyo** · [LiVEMAX Nihonbashi-Koamicho]({h['tokyo']['maps']}) | Oct 14 15:00 → Oct 19 10:00 (5 n) | 10-7 Nihonbashi-Koamicho | Kayabacho 4 min · Ningyocho 5 min (Asakusa line → Asakusa + Haneda) |",
        f"| **Hakone** · [Senkei]({h['hakone']['maps']}) | Oct 19 15:00 → Oct 20 11:00 | Yumoto 592 | Check in **by 19:00** or dinner is cancelled. Breakfast in. Tattoos: no shared baths. |",
        f"| **Kyoto** · [Guesthouse Sign]({h['kyoto']['maps']}) | Oct 20 16:00 → Oct 24 11:00 (4 n) | 568 Nakanomachi, Shimogyo | 2 min to Nishiki · 3 min to Pontocho |",
        f"| **Osaka** · [NICO Hotel Namba]({h['osaka']['maps']}) | Oct 24 15:00 → Oct 25 (night 2 unused) | 1-2-6 Shimodera | 10 min Shinsekai · 15 min Kuromon · 20 min Dotonbori |",
        "",
        "**Locked**",
        "- Hotels above are the full set.",
        "- Tokyo is **Nihonbashi**, not Shinjuku. Day 1 stays local. Hakone trains leave from **Tokyo Station**, not the Romancecar.",
        "- Senkei dinner dies if you arrive after 19:00.",
        "- **Odawara → Kyoto shinkansen is booked 13:30 Tue Oct 20.** Leave Senkei ~12:00.",
        "- Osaka night 2 ignored. Fly **KIX 16:50 Sun Oct 25**. Arima dropped.",
        "",
        "---",
        "",
        "## Google Maps — walking time vs time spent",
        "",
        "Yes, you can show both, on two different surfaces:",
        "",
        "| What | Google Maps Directions | Google My Maps (custom map) |",
        "|---|---|---|",
        "| Walking / train time **between** stops | Automatic once the route is open | Not automatic — we write it on each pin and draw the line |",
        "| Time **spent at** a stop (the gap) | Yes — open the Directions link, tap a stop, set **time spent**. Cannot be baked into a share URL. | Pin description (“Stay 75 min · dinner”). No effect on the line. |",
        "| Layers per day | No (max ~10 stops per link) | Yes — one layer per walk |",
        "",
        "**On the trip:** open the day’s Directions link for live walking times + traffic. Open the My Maps layer for the whole trip in one place. Stay times in this doc are the planned gaps.",
        "",
        "Your existing **[Japan My Map](https://www.google.com/maps/d/edit?mid=1ddiUaduPUQycU2IgWCbR5874kPnOlkE)** is from 2 Sep — keep it.",
        "",
        "**To save these walking routes:** [My Maps](https://www.google.com/maps/d/) → Create a new map → name it `Japan 2026 area walks` → **Import** → **Upload** → [`maps/japan-trip-walks.kml`](../maps/japan-trip-walks.kml). Folders become layers.",
        "",
        "**Time spent (the gap):** cannot be baked into a share URL. Pins in the KML say `Stay 75 min`. In the Directions app, tap a stop and set **time spent**; walking time between stops is automatic.",
        "",
        "---",
        "",
        "## 12 days at a glance",
        "",
        "| Day | Date | Sleep | Walk | Food you are next to |",
        "|---|---|---|---|---|",
        "| 1 | Wed 14 | Tokyo | Nihonbashi / Tokyo Station | Ramen Street ~19:30 |",
        "| 2 | Thu 15 | Tokyo | Asakusa morning → teamLab → Shibuya evening | Nakamise snacks · Shibuya dinner 18:30 |",
        "| 3 | Fri 16 | Tokyo | Takao hike → **Shinjuku night walk** | Summit snack · Omoide 19:30 |",
        "| 4 | Sat 17 | Tokyo | Harajuku morning → Akihabara (10 min from hotel) → Womb | AFURI lunch · eat before 22:30 |",
        "| 5 | Sun 18 | Tokyo | Oedo + Ginza + Tsukiji (neighbourhood day) | Tsukiji lunch |",
        "| 6 | Mon 19 | Senkei | Hakone Freepass loop | Ekiben · **kaiseki at Senkei** |",
        "| 7 | Tue 20 | Kyoto | **13:30 Odawara shinkansen** → Higashiyama lanterns | Senkei breakfast · ekiben · Pontocho 19:30 |",
        "| 8 | Wed 21 | Kyoto | Arashiyama 08:00 → Tōji 21st market | Sagano lunch · Kiyamachi night |",
        "| 9 | Thu 22 | Kyoto | Nijo → Ginkaku-ji → **Kurama Fire Festival** | Kibune 15:00 |",
        "| 10 | Fri 23 | Kyoto | Fushimi dawn → kimono → Nishiki (2 min from hostel) | Nishiki 15:30 · Pontocho 19:30 |",
        "| 11 | Sat 24 | Osaka | South loop from NICO — one night only | Kuromon 16:00 |",
        "| 12 | Sun 25 | fly | One morning stop → **KIX 16:50** | Namba lunch 12:00 |",
        "",
        "---",
        "",
    ]

    for walk in walks:
        core = walk["core"]
        stay_total = sum(s.get("stay_min", 0) for s in core)
        move_total = 0
        for s in core[1:]:
            move_total += s.get("osrm_min") or s.get("walk_from_prev_min") or 0
        hours = (stay_total + move_total) / 60
        maps = walk.get("maps_url") or ""
        lines += [
            f"## {walk['title']}",
            "",
            f"**{walk['date']} · {walk.get('when', '')}**",
            "",
        ]
        if walk.get("why"):
            lines += [walk["why"], ""]
        meta = f"Planned on-feet + stay ≈ **{hours:.1f} h** ({fmt_stay(stay_total)} at stops · {fmt_stay(move_total)} moving)."
        if maps:
            label = "Open walking route in Google Maps" if walk.get("mode") == "walk" else "Open route in Google Maps"
            lines += [f"{meta}  ·  [{label}]({maps})", ""]
        else:
            lines += [meta, ""]

        lines += [
            "| # | Stop | Stay | Next gap | Food |",
            "|---|---|---|---|---|",
        ]
        for i, s in enumerate(core, 1):
            nxt = core[i] if i < len(core) else None
            if nxt:
                mins = nxt.get("osrm_min") or nxt.get("walk_from_prev_min")
                mode = nxt.get("leg_mode") or "walk"
                gap = f"{mins} min {mode}" if mins else mode
            else:
                gap = "end"
            food = s.get("food") or "—"
            lines.append(
                f"| {i} | **{s['name']}** | {fmt_stay(s.get('stay_min', 0))} | {gap} | {food} |"
            )
        lines.append("")

        if any(s.get("note") for s in core):
            lines.append("Notes on the core route")
            for i, s in enumerate(core, 1):
                if s.get("note"):
                    lines.append(f"- **{i}. {s['name']}** — {s['note']}")
            lines.append("")

        if walk.get("food_windows"):
            lines += ["**Where you are for food**", ""]
            for f in walk["food_windows"]:
                lines.append(f"- **{f['when']} · {f['where']}** — {f['what']}")
            lines.append("")

        if walk.get("pool"):
            lines += [
                "Area list — tick to put on the route (tell me and I rebuild)",
                "",
            ]
            for p in walk["pool"]:
                lines.append(f"- {checkbox(p.get('include', False))} **{p['name']}** — {p.get('why', '')}")
            lines.append("")

        if walk.get("after"):
            lines += [f"*After this walk:* {walk['after']}", ""]
        lines += ["---", ""]

    u = DATA["unassigned"]
    lines += [
        "## Not on a day yet (swap list)",
        "",
        "These are from the draft. They do not sit on a core walk. Tick one and say which day to steal from.",
        "",
        "### Tokyo",
        "",
    ]
    for p in u["tokyo"]:
        lines.append(f"- [ ] **{p['name']}** — {p['why']}")
    lines += ["", "### Kyoto", ""]
    for p in u["kyoto"]:
        lines.append(f"- [ ] **{p['name']}** — {p['why']}")
    lines += ["", "### Osaka", ""]
    for p in u["osaka"]:
        lines.append(f"- [ ] **{p['name']}** — {p['why']}")
    lines += [
        "",
        "---",
        "",
        "## Draft shopping still floating",
        "",
        "Same brands exist in Shinjuku, Shibuya and Ginza — buy them on the day you walk past.",
        "",
        "- Don Quijote (24h) — snacks, skincare",
        "- Onitsuka Tiger — Parco_ya Ueno is the quieter shop",
        "- Uniqlo / MUJI / GU",
        "- Seiko (or Donki for variety) · Atelier Bigi",
        "- Running shoes — Super Sports Xebio, Step Sports",
        "- Electronics — Bic / Yodobashi (Akiba or Yurakucho)",
        "",
    ]
    return "\n".join(lines) + "\n"


def kml_style(color: str, sid: str) -> str:
    # KML is aabbggrr
    aa = "ff"
    rr, gg, bb = color[0:2], color[2:4], color[4:6]
    kml_col = f"{aa}{bb}{gg}{rr}"
    return f"""
    <Style id="{sid}">
      <IconStyle>
        <color>{kml_col}</color>
        <scale>1.1</scale>
        <Icon><href>https://maps.google.com/mapfiles/kml/paddle/wht-circle.png</href></Icon>
      </IconStyle>
      <LineStyle>
        <color>{kml_col}</color>
        <width>4</width>
      </LineStyle>
    </Style>"""


def write_kml(walks: list[dict]) -> str:
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        "<Document>",
        "<name>Japan 2026 · Area walks</name>",
        "<description>Hotel-anchored walking routes. Pin notes include stay time (the gap) and the walk to the next stop.</description>",
    ]
    for hid, hotel in DATA["hotels"].items():
        parts.append(kml_style("111827", f"style-hotel-{hid}"))
    for walk in walks:
        parts.append(kml_style(walk.get("color", "0e7c3a"), f"style-{walk['id']}"))

    parts.append("<Folder><name>Hotels</name>")
    for hotel in DATA["hotels"].values():
        hid = hotel["id"]
        city = hid.replace("hotel-", "")
        desc = escape(
            f"{hotel['address']}\n{hotel['checkin']} → {hotel['checkout']}\n{hotel.get('stations') or hotel.get('note') or ''}"
        )
        parts.append(
            f"""<Placemark>
        <name>{escape(hotel['name'])}</name>
        <styleUrl>#style-hotel-{city}</styleUrl>
        <description>{desc}</description>
        <Point><coordinates>{hotel['lng']},{hotel['lat']},0</coordinates></Point>
      </Placemark>"""
        )
    parts.append("</Folder>")

    for walk in walks:
        parts.append(f"<Folder><name>{escape(walk['date'][5:] + ' · ' + walk['title'])}</name>")
        coords = []
        core = walk["core"]
        for i, s in enumerate(core, 1):
            if "lat" not in s:
                continue
            nxt = core[i] if i < len(core) else None
            if nxt:
                gap = nxt.get("osrm_min") or nxt.get("walk_from_prev_min")
                mode = nxt.get("leg_mode") or "walk"
                gap_txt = f"Then {gap} min {mode} to next." if gap else f"Then {mode} to next."
            else:
                gap_txt = "End of this walk."
            food = f" · FOOD: {s['food']}" if s.get("food") else ""
            hours = f"Hours: {s['hours']}\n" if s.get("hours") else ""
            desc = escape(
                f"{hours}Stay {fmt_stay(s.get('stay_min', 0))}{food}\n{gap_txt}\n{s.get('note') or ''}"
            )
            parts.append(
                f"""<Placemark>
        <name>{i}. {escape(s['name'])}</name>
        <styleUrl>#style-{walk['id']}</styleUrl>
        <description>{desc}</description>
        <Point><coordinates>{s['lng']},{s['lat']},0</coordinates></Point>
      </Placemark>"""
            )
            coords.append(f"{s['lng']},{s['lat']},0")
        if len(coords) >= 2:
            parts.append(
                f"""<Placemark>
        <name>Route · {escape(walk['title'])}</name>
        <styleUrl>#style-{walk['id']}</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>{" ".join(coords)}</coordinates>
        </LineString>
      </Placemark>"""
            )
        parts.append("</Folder>")

    parts += ["</Document>", "</kml>"]
    return "\n".join(parts) + "\n"


def main() -> None:
    print("Building without live OSRM (using planned gaps)…")
    walks = []
    for w in DATA["walks"]:
        w["maps_url"] = maps_dir(w["core"], w.get("mode", "walk"))
        walks.append(w)
    # area-walks.md is hand-edited (timed day format). Only refresh KML.
    OUT_KML.write_text(write_kml(walks))
    print(f"Wrote {OUT_KML.relative_to(ROOT)} (markdown left untouched)")
    for w in walks:
        print(f"  {w['id']}: {w.get('maps_url', '')[:80]}")


if __name__ == "__main__":
    main()
