#!/usr/bin/env python3
"""Regenerate js/data.js seed arrays and supabase/schema.sql SEED section
from the LIVE database (single source of truth). Run from the repo root."""
import json, re, urllib.request

U = "https://ztiookighroixwcerrjp.supabase.co"
K = "sb_publishable_33rvwpHu-5lgUPsD-B5zwg_mLOzGt3N"
def get(path):
    r = urllib.request.Request(f"{U}/rest/v1/{path}", headers={"apikey": K, "Authorization": f"Bearer {K}"})
    return json.load(urllib.request.urlopen(r, timeout=30))

wishes = get("wishes?select=*&order=day_id.nullsfirst,sort_order&limit=500")
shopping = get("shopping?select=*&order=created_at")
groups = [w for w in wishes if w["type"] == "group"]
events = [w for w in wishes if w["type"] != "group"]
gkey = {g["id"]: re.sub(r"[^a-z0-9]+", "-", g["label"].lower()).strip("-")[:24] for g in groups}
js_str = lambda s: json.dumps(s, ensure_ascii=False)

def meta_js(meta):
    out = [f'{{ key: {js_str(m["key"])}, value: {js_str(m["value"])} }}' for m in meta or [] if m["key"] != "group"]
    return "[" + ", ".join(out) + "]"

glines = []
for g in groups:
    info = {m["key"]: m["value"] for m in (g["meta"] or [])}
    glines.append(f'    {{ key: {js_str(gkey[g["id"]])}, label: {js_str(g["label"])}, start: {js_str(info.get("group:start", ""))}, '
                  f'end: {js_str(info.get("group:end", ""))}, day_id: {js_str(g["day_id"]) if g["day_id"] else "null"}, sort_order: {g["sort_order"]} }},')
elines = []
for w in events:
    gid = next((m["value"] for m in (w["meta"] or []) if m["key"] == "group"), None)
    parts = [f'label: {js_str(w["label"])}', f'type: {js_str(w["type"])}']
    if w.get("location_name"): parts.append(f'location_name: {js_str(w["location_name"])}')
    if w.get("lat") is not None: parts.append(f'lat: {w["lat"]}, lng: {w["lng"]}')
    parts.append(f'day_id: {js_str(w["day_id"]) if w["day_id"] else "null"}')
    if gid and gid in gkey: parts.append(f'groupKey: {js_str(gkey[gid])}')
    parts.append(f'order: {w["sort_order"]}')
    if w.get("active") is False: parts.append("active: false")
    if w.get("items"): parts.append(f'items: {json.dumps(w["items"], ensure_ascii=False)}')
    m = meta_js(w["meta"])
    if m != "[]": parts.append(f"meta: {m}")
    elines.append("    { " + ", ".join(parts) + " },")
slines = []
for s in shopping:
    parts = [f'text: {js_str(s["text"])}']
    if s.get("place"): parts.append(f'where: {js_str(s["place"])}')
    if s.get("lat") is not None: parts.append(f'lat: {s["lat"]}, lng: {s["lng"]}')
    slines.append("    { " + ", ".join(parts) + " },")

src = open("js/data.js").read()
def replace_array(src, anchor, newlines):
    start = src.index(anchor); open_i = src.index("[", start); depth = 0
    for p in range(open_i, len(src)):
        if src[p] == "[": depth += 1
        elif src[p] == "]":
            depth -= 1
            if depth == 0: close_i = p; break
    return src[:open_i + 1] + "\n" + "\n".join(newlines) + "\n  " + src[close_i:]
src = replace_array(src, "seedGroups: [", glines)
src = replace_array(src, "seedWishes: [", elines)
src = replace_array(src, "seedShopping: [", slines)
open("js/data.js", "w").write(src)
print("data.js:", len(elines), "events,", len(glines), "groups,", len(slines), "shopping")

q = lambda s: "'" + str(s).replace("'", "''") + "'"
jq = lambda v: "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'"
wrows = []
for i, w in enumerate(wishes):
    cast = "::jsonb" if i == 0 else ""
    wrows.append(f"  ({q(w['id'])}, {q(w['label'])}, {q(w['type'])}, "
                 f"{q(w['location_name']) if w.get('location_name') else 'null'}, "
                 f"{w['lat'] if w.get('lat') is not None else 'null'}, {w['lng'] if w.get('lng') is not None else 'null'}, "
                 f"{q(w['day_id']) if w.get('day_id') else 'null'}, {w['sort_order']}, {'true' if w.get('active', True) else 'false'}, "
                 f"{jq(w.get('meta') or [])}{cast}, {jq(w.get('items') or [])}{cast})")
srows = [f"  ({q(s['text'])}, {q(s['place']) if s.get('place') else 'null'}, "
         f"{s['lat'] if s.get('lat') is not None else 'null'}, {s['lng'] if s.get('lng') is not None else 'null'}, false)" for s in shopping]
seed = ("-- ============================================================\n"
        "-- SEED — the initial database (regenerated from the live project)\n"
        "-- Inserts only when the table is empty.\n"
        "-- ============================================================\n\n"
        "insert into public.wishes (id, label, type, location_name, lat, lng, day_id, sort_order, active, meta, items)\n"
        "select * from (values\n" + ",\n".join(wrows) + "\n"
        ") as seed(id, label, type, location_name, lat, lng, day_id, sort_order, active, meta, items)\n"
        "where not exists (select 1 from public.wishes);\n\n"
        "insert into public.shopping (text, place, lat, lng, done)\n"
        "select * from (values\n" + ",\n".join(srows) + "\n"
        ") as seed(text, place, lat, lng, done)\n"
        "where not exists (select 1 from public.shopping);\n")
sql = open("supabase/schema.sql").read()
marker = "-- ============================================================\n-- SEED — the initial database"
sql = sql[:sql.index(marker)] + seed
open("supabase/schema.sql", "w").write(sql)
print("schema.sql seed:", len(wrows), "wishes,", len(srows), "shopping")
