#!/usr/bin/env python3
"""Keep one real setup per picture, and add person-led frames.

Unmatched Commons dumps are dropped. Their filenames are not shot titles.
"""

from __future__ import annotations

import importlib.util
import json
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("b", ROOT / "tools" / "build-photo-ideas.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

WEAK = (
    "then the rest of the day",
    "no pose needed",
    "one frame.",
    "take one frame",
    "one frame only",
)


def filename(shot) -> str:
    return urllib.parse.unquote(shot.get("source") or "").replace("_", " ")


def clean_how(lines):
    kept = []
    for line in lines:
        if line.strip().lower().rstrip(".") in {w.rstrip(".") for w in WEAK}:
            continue
        if line.strip().lower() in {w.lower() for w in WEAK}:
            continue
        kept.append(line)
    if len(kept) < 2:
        kept.append("Wait until the middle of the frame is clear, then take one.")
    return kept[:4]


def curate(data):
    by_id = {p["id"]: p for p in mod.PLACES}
    out = []
    for place in data["places"]:
        spec_place = by_id.get(place["id"])
        if not spec_place:
            continue
        frames = spec_place["frames"]
        buckets = {i: [] for i in range(len(frames))}
        for shot in place["shots"]:
            item = {"title": filename(shot)}
            best_i, best_s = None, 0
            for i, frame in enumerate(frames):
                s = mod.score(frame, item)
                if s > best_s:
                    best_s, best_i = s, i
            if best_i is not None and best_s > 0:
                buckets[best_i].append((best_s, shot))
        shots = []
        for i, frame in enumerate(frames):
            ranked = sorted(buckets[i], key=lambda pair: -pair[0])
            for variant, (_, shot) in enumerate(ranked[:2]):
                text = mod.materialize(frame, {"title": ""}, variant)
                shots.append({
                    "id": f"{place['id']}-{len(shots) + 1:02d}",
                    "look": text["look"],
                    "image": shot["image"],
                    "source": shot["source"],
                    "credit": shot.get("credit") or "",
                    "license": shot.get("license") or "",
                    "angle": text["angle"],
                    "light": text["light"],
                    "how": clean_how(text["how"]),
                    "person": False,
                })
        out.append({
            "id": place["id"],
            "name": place["name"],
            "day": place["day"],
            "match": place["match"],
            "shots": shots,
        })
        print(f"{place['id']:16} {len(place['shots']):3} -> {len(shots)}")
    return out


PEOPLE = [
    {
        "place": "sensoji",
        "query": "Man praying at Sensō-ji",
        "need": ["praying", "senso"],
        "look": "Person at the hall",
        "angle": "One person in the lower third, in profile or from behind, facing the hall. They are sharp. The hall is the scale behind them, a little softer.",
        "light": "Morning sun on their shoulder and on the wood. If they turn into a black shape, move until the light is on their back or their hands.",
        "how": [
            "Use someone from your group. They look at the hall, not at the lens.",
            "Hands together or at their sides. Coat or a dark layer so they separate from the red wood.",
            "Wait until other people are out of the middle. One frame.",
        ],
    },
    {
        "place": "fushimi",
        "query": "Woman inside Fushimi Inari torii",
        "need": ["woman", "fushimi"],
        "look": "Person in the gates",
        "angle": "She is in the center of the tunnel, walking away, small enough that the gates still repeat behind her. Dark or red clothes so she does not blend into the vermilion.",
        "light": "Open shade inside the tunnel. Be there at 07:00, before the path fills. The gates are the light.",
        "how": [
            "Send her about ten steps ahead. She does not turn around.",
            "Shoot when she sits between two gates, not blocking a whole gate.",
            "Focus on her. The gates behind can soften.",
        ],
    },
    {
        "place": "kiyomizu",
        "query": "Girls in kimonos near a pagoda in Kiyomizu-dera",
        "need": ["kimono", "kiyomizu"],
        "look": "Person on the terrace",
        "angle": "Full length, off to one side of the wooden stage. The railing leads to her. The city is behind, not the subject.",
        "light": "Morning sun on the wood and on the kimono. If the city is a white blow-out, turn until the light is on her and the city stays in the background.",
        "how": [
            "She looks out over the city, hands on the rail or holding a sleeve.",
            "One person. The crowd stays behind you.",
            "Take it when her face and the stage are both in the light.",
        ],
    },
    {
        "place": "gion",
        "query": "Woman in maiko-style attire in Gion",
        "need": ["maiko", "gion"],
        "look": "Person in the lane",
        "angle": "She stands in the lane, full length, a machiya wall or lanterns behind her. She is the subject. The street is the frame.",
        "light": "Late afternoon or just after dusk, when the lanterns are on and her face is still readable. Avoid flat midday on a white wall.",
        "how": [
            "This is your group in the lane, not a working maiko. Do not stop a real maiko for a photo.",
            "She looks down the lane, not at the lens. One step off the center of the path.",
            "Focus on her face and the collar. The lanterns can be soft.",
        ],
    },
    {
        "place": "bamboo",
        "query": "Arashiyama bamboo path person",
        "need": ["bamboo", "arashiyama"],
        "look": "Person in the grove",
        "angle": "They stand on the path, small, walking away. The bamboo walls are the leading lines. Dark clothes so the green stays the color and they stay the subject.",
        "light": "Be at the grove at 08:00. Green shade. A little sun through the tops is enough. Later the path is people.",
        "how": [
            "Send them ahead until they are about a third of the way up the path.",
            "They do not turn. You shoot from the middle of the path, camera at your chest.",
            "One frame while the path ahead of them is empty.",
        ],
    },
    {
        "place": "scramble",
        "query": "Shibuya crossing pedestrian",
        "need": ["shibuya", "crossing"],
        "look": "Person in the crossing",
        "angle": "From the street corner, one person from your group is mid-crossing, sharp, and the rest of the crowd is the background. They are large enough to be the subject, not a speck.",
        "light": "Daylight on the crossing, or the signs just after dusk. Expose for their face or their coat, not the bright screens.",
        "how": [
            "They walk, they do not stop and pose in the traffic.",
            "You stay on the corner. Shoot as they cross, when a gap opens around them.",
            "One frame. Then get out of the crossing.",
        ],
    },
    {
        "place": "tower",
        "query": "Tokyo Tower night person",
        "need": ["tokyo tower"],
        "look": "Person and the tower",
        "angle": "They stand in the foreground, off to one side, looking up at the tower. Full length or from the waist. The tower fills the rest of the frame.",
        "light": "Dusk, when the tower is lit and the sky is still blue, not black. Light on their face from the street, the tower as the color behind them.",
        "how": [
            "They look at the tower, chin slightly up, not at you.",
            "Stand far enough back that both of them and the whole tower fit.",
            "Take it from Zojoji or the plaza when the tower lights come on.",
        ],
    },
    {
        "place": "nara",
        "query": "Nara Park deer person",
        "need": ["nara", "deer"],
        "look": "Person with the deer",
        "angle": "The person and one deer share the frame. The deer is close and sharp. The person is bowing or holding the crackers at chest height. The park is the background.",
        "light": "Open daylight on the grass. If the deer is in shade and the person is in sun, step until both are in the same light.",
        "how": [
            "They bow. They do not tease the deer or turn their bag toward it.",
            "Focus on the deer’s face and the person’s hands.",
            "One frame, then put the crackers away.",
        ],
    },
    {
        "place": "dotonbori",
        "query": "Dotonbori Glico night people",
        "need": ["dotonbori", "glico"],
        "look": "Person under the Glico sign",
        "angle": "They stand on the bridge, in the lower third, the Glico man above them. They are sharp. The sign is the light behind.",
        "light": "After dark. The neon is the light. Expose so their face still shows and the sign does not blow out to white.",
        "how": [
            "They look at the canal or up at the sign, not at the lens.",
            "A dark coat. A white shirt disappears into the sign.",
            "Wait for a gap on the bridge. One frame.",
        ],
    },
    {
        "place": "hakone-torii",
        "query": "Hakone shrine torii lake",
        "need": ["hakone", "torii"],
        "look": "Person at the water gate",
        "angle": "They stand at the edge of the water, back to you, the torii in front of them. They are in the lower third. The gate and the lake are the rest.",
        "light": "Afternoon, sun on the gate. If the gate is a silhouette, wait or walk until the red reads. The photo line is about 20 minutes when it is busy.",
        "how": [
            "They face the gate. They do not look back.",
            "You stand behind them on the path, not in the water.",
            "One frame, then leave the line.",
        ],
    },
    {
        "place": "chureito",
        "query": "Chureito pagoda stairs Fuji",
        "need": ["chureito", "pagoda"],
        "look": "Person on the stairs",
        "angle": "They are on the stairs, off-center, the pagoda and Fuji behind them. Full length. The steps lead up to them.",
        "light": "Morning, before the tour buses. Sun on Fuji and on their shoulder. If Fuji is in cloud, still take the pagoda and the person.",
        "how": [
            "They pause on a step and look up toward the pagoda, not at you.",
            "You shoot from a few steps below.",
            "One frame while the stair above them is empty.",
        ],
    },
    {
        "place": "golden-gai",
        "query": "Golden Gai Shinjuku alley night",
        "need": ["golden", "gai"],
        "look": "Person in the alley",
        "angle": "They stand in the narrow alley, under the signs, looking into a doorway. The signs stack above them. They fill the lower half.",
        "light": "The lanterns and the bar signs. Their face needs to catch that light. Flash flattens the alley.",
        "how": [
            "One person from your group. They are not blocking a bar door.",
            "They look at a sign or into the alley, not at the lens.",
            "Hold the camera at your chest so the signs stay straight.",
        ],
    },
]


def pick(query, need):
    items = mod.search(query, limit=12)
    need = [n.lower() for n in need]
    for item in items:
        hay = item["title"].lower()
        if all(n in hay for n in need):
            return item
    for item in items:
        hay = item["title"].lower()
        if any(n in hay for n in need):
            return item
    return items[0] if items else None


def add_people(places):
    by_id = {p["id"]: p for p in places}
    saved = 0
    for spec in PEOPLE:
        place = by_id.get(spec["place"])
        if not place:
            print("  missing place", spec["place"])
            continue
        item = pick(spec["query"], spec["need"])
        time.sleep(1.1)
        if not item:
            print("  no photo", spec["look"])
            continue
        folder = ROOT / "photos" / place["id"]
        folder.mkdir(parents=True, exist_ok=True)
        stem = folder / f"person-{saved + 1:02d}"
        for old in folder.glob(stem.name + ".*"):
            old.unlink()
        if not mod.download(item["url"], stem):
            print("  download failed", item["title"])
            continue
        path = next(folder.glob(stem.name + ".*"))
        place["shots"].insert(0, {
            "id": f"{place['id']}-person",
            "look": spec["look"],
            "image": f"photos/{place['id']}/{path.name}",
            "source": item["page"],
            "credit": item["artist"],
            "license": item["license"],
            "angle": spec["angle"],
            "light": spec["light"],
            "how": spec["how"],
            "person": True,
        })
        saved += 1
        print(f"  person {place['id']}: {item['title'][:80]}")
    # Renumber so person frames stay first.
    for place in places:
        for i, shot in enumerate(place["shots"], start=1):
            shot["id"] = f"{place['id']}-{i:02d}"
    return saved


def main():
    raise SystemExit("photos/ideas.json is the shot list. This Commons curator is retired.")
    data = json.loads((ROOT / "photos" / "ideas.json").read_text())
    places = curate(data)
    print("downloading person frames…")
    n = add_people(places)
    payload = {
        "note": "Each frame is one setup: where to stand, the light, and how to take it. A frame marked Person uses someone from your group as the subject.",
        "places": places,
    }
    out = ROOT / "photos" / "ideas.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1))
    total = sum(len(p["shots"]) for p in places)
    people = sum(1 for p in places for s in p["shots"] if s.get("person"))
    print(f"Wrote {out} · {len(places)} places · {total} frames · {people} person · downloaded {n}")


if __name__ == "__main__":
    main()
