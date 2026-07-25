/**
 * Static trip content + the INITIAL DATABASE seeds.
 * Built from docs/plan.md (the 12-day itinerary) and docs/things-to-do.md (the menu).
 * Dates: "YYYY-MM-DD". Prices ¥ with approx ₹ at ¥100 ≈ ₹58–59.
 *
 * Seed model:
 *  - seedGroups: bundles (結び). Members reference them via `groupKey`.
 *  - seedWishes: events. `order` → sort_order; `active:false` = maybe;
 *    meta reserved keys: transit:* (mode/depart/duration), time, info, hidden.
 */

const TRIP = {
  title: "Japan Trip",
  titleJa: "日本の旅",
  subtitle: "一期一会 — every encounter, once in a lifetime.",
  departureDate: "2026-10-15",
  homeTimezone: "Asia/Kolkata",
  japanTimezone: "Asia/Tokyo",

  cities: [
    { id: "tokyo", name: "Tokyo", nameJa: "東京", lat: 35.6762, lng: 139.6503 },
    { id: "hakone", name: "Hakone", nameJa: "箱根", lat: 35.2324, lng: 139.1069 },
    { id: "kyoto", name: "Kyoto", nameJa: "京都", lat: 35.0116, lng: 135.7681 },
    { id: "nara", name: "Nara", nameJa: "奈良", lat: 34.6851, lng: 135.8048 },
    { id: "osaka", name: "Osaka", nameJa: "大阪", lat: 34.6937, lng: 135.5023 },
    { id: "kobe", name: "Kobe · Arima", nameJa: "神戸", lat: 34.6913, lng: 135.183 },
  ],

  days: [
    { id: "d1", date: "2026-10-15", cityId: "tokyo", title: "Land & ease in", morning: "Land · Welcome Suica · eSIM check", afternoon: "Hotel drop · Shinjuku wander", evening: "Omoide Yokocho · Gov Bldg night view", food: "Yakitori", transit: "HND → Shinjuku" },
    { id: "d2", date: "2026-10-16", cityId: "tokyo", title: "Iconic east + Shibuya night", morning: "Senso-ji · Nakamise (by 08:00)", afternoon: "Ueno · Ameyoko · teamLab Planets", evening: "Scramble · Shibuya Sky sunset · izakaya", food: "Melon pan · conveyor sushi", transit: "Ginza line · Yamanote" },
    { id: "d3", date: "2026-10-17", cityId: "tokyo", title: "Akihabara + Nakano + club night", morning: "Akihabara arcades · gachapon", afternoon: "Maid cafe · Nakano Broadway", evening: "Womb club night / all-night karaoke", food: "Maid-cafe omurice", transit: "Chuo line", },
    { id: "d4", date: "2026-10-18", cityId: "tokyo", title: "Okutama adventure", morning: "JR Ome line out (~1.5 h)", afternoon: "Rafting / canyoning · gorge walk", evening: "Back to Tokyo · relaxed izakaya", food: "Riverside bento", transit: "JR Chuo/Ome ~1.5 h" },
    { id: "d5", date: "2026-10-19", cityId: "tokyo", title: "Markets, Harajuku & Golden Gai", morning: "Oedo Antique Market", afternoon: "Takeshita · Meiji Jingu · Yoyogi", evening: "Golden Gai — day photos, night bar", food: "Harajuku crepes", transit: "Yamanote loop" },
    { id: "d6", date: "2026-10-20", cityId: "hakone", title: "Hakone loop + onsen night", morning: "Romancecar · Open-Air Museum", afternoon: "Owakudani · Lake Ashi cruise", evening: "Ryokan kaiseki + onsen", food: "Kuro-tamago · kaiseki", transit: "Romancecar ~85 min" },
    { id: "d7", date: "2026-10-21", cityId: "kyoto", title: "Hakone AM → Kyoto", morning: "Old Tokaido cedar avenue", afternoon: "Shinkansen · check in near Gion", evening: "Pontocho dinner · Kiyamachi", food: "Kaiseki lunch bargain", transit: "Odawara → Kyoto ~2 h" },
    { id: "d8", date: "2026-10-22", cityId: "kyoto", title: "FESTIVAL DAY — Jidai + Kurama", morning: "Samurai & Ninja experience", afternoon: "Jidai Matsuri procession", evening: "Kurama Fire Festival", food: "Nishiki bites", transit: "Eizan line to Kurama" },
    { id: "d9", date: "2026-10-23", cityId: "kyoto", title: "Fushimi dawn → kimono → Gion", morning: "Fushimi Inari full loop (dawn)", afternoon: "Kimono · Nishiki · Higashiyama", evening: "Gion Corner show", food: "Yudofu · matcha", transit: "Keihan line" },
    { id: "d10", date: "2026-10-24", cityId: "kyoto", title: "Arashiyama + countryside cycling", morning: "Bamboo grove early · Tenryu-ji", afternoon: "Sagano cycling · monkey park", evening: "Last Kyoto night — Pontocho", food: "Yudofu · sake tasting", transit: "JR Sagano line" },
    { id: "d11", date: "2026-10-25", cityId: "osaka", title: "Osaka energy → Arima Onsen", morning: "Kuromon grazing", afternoon: "Dotonbori · Ame-mura · Shinsekai", evening: "→ Arima Onsen ryokan", food: "Takoyaki · okonomiyaki · kushikatsu", transit: "Kyoto→Osaka 15 min · Arima ~1 h 15" },
    { id: "d12", date: "2026-10-26", cityId: "kobe", title: "Soak, Kobe bite, fly home", morning: "Final kinsen soak", afternoon: "Kobe beef lunch · harbour", evening: "KIX → home", food: "Kobe beef", transit: "Arima → KIX ~2 h" },
  ],

  /** Bundles (結び). Members in seedWishes point here via groupKey. */
  seedGroups: [
    { key: "okutama", label: "Okutama adventure", start: "Tokyo", end: "Tokyo", day_id: "d4", sort_order: 0 },
    { key: "takao", label: "Mt. Takao (fallback)", start: "Tokyo", end: "Tokyo", day_id: null, sort_order: 2 },
    { key: "kawagoe", label: "Kawagoe Festival", start: "Tokyo", end: "Tokyo", day_id: null, sort_order: 3 },
    { key: "nara", label: "Nara half-day", start: "Kyoto", end: "Kyoto", day_id: null, sort_order: 4 },
  ],

  seedWishes: [
    // ---------- D1 · Wed Oct 15 · Land & ease in ----------
    { label: "Haneda → Shinjuku", type: "transit", location_name: "Haneda Airport", lat: 35.5494, lng: 139.7798, day_id: "d1", order: 0, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "15:30" }, { key: "transit:duration", value: "40m" }] },
    { label: "Omoide Yokocho yakitori", type: "food", location_name: "Omoide Yokocho, Shinjuku", lat: 35.6939, lng: 139.6994, day_id: "d1", order: 1, meta: [], items: ["Yakitori", "Motsu nikomi"] },
    { label: "Tokyo Met Gov night view", type: "place", location_name: "Tokyo Metropolitan Government Bldg", lat: 35.6896, lng: 139.6917, day_id: "d1", order: 2, meta: [{ key: "info", value: "FREE 45F observatory (202 m) — the best free panorama; Skytree and Fuji on clear days.\nNightly projection-mapping show on the building, sunset–~21:45. Open ~09:30–22:00." }] },

    // ---------- D2 · Thu Oct 16 · Iconic east + Shibuya ----------
    { label: "Senso-ji & Kaminarimon", type: "place", location_name: "Senso-ji, Asakusa", lat: 35.7148, lng: 139.7967, day_id: "d2", order: 0, meta: [{ key: "info", value: "Tokyo's oldest temple (founded 645) + the great lantern gate. Free; grounds always open.\nGo by 08:00 — by 10:00 it's a wall of people." }] },
    { label: "Nakamise-dori snacks", type: "food", location_name: "Nakamise-dori, Asakusa", lat: 35.7119, lng: 139.7963, day_id: "d2", order: 1, items: ["Ningyo-yaki", "Melon pan", "Senbei"] },
    { label: "Ameyoko Market", type: "shop", location_name: "Ameyoko, Ueno", lat: 35.7095, lng: 139.7745, day_id: "d2", order: 2, items: ["Dried seafood", "Sneakers", "Cosmetics"] },
    { label: "teamLab Planets", type: "experience", location_name: "Toyosu", lat: 35.6496, lng: 139.7898, day_id: "d2", order: 3, meta: [{ key: "time", value: "15:00" }, { key: "info", value: "Wade barefoot through water rooms and a mirrored infinity garden — the most physical, viral teamLab. Wear shorts.\n¥3,200 (≈ ₹1,855), timed entry — book days ahead. Extended to end-2027." }, { key: "Official site", value: "https://www.teamlab.art/e/planets/" }] },
    { label: "Shibuya Scramble + Hachiko", type: "place", location_name: "Shibuya Crossing", lat: 35.6595, lng: 139.7005, day_id: "d2", order: 4, meta: [{ key: "info", value: "Best free overhead angles: Mag's Park rooftop or the Tsutaya Starbucks window." }] },
    { label: "Shibuya Sky sunset", type: "place", location_name: "Shibuya Scramble Square 47F", lat: 35.658, lng: 139.7026, day_id: "d2", order: 5, meta: [{ key: "time", value: "17:45" }, { key: "info", value: "Open-air 360° roof at 229 m — the city's best sunset deck.\nThe sunset slot sells out in ~2 minutes; tickets release ~2 weeks ahead at 00:00 JST. ¥2,500 advance / ¥3,000 door." }, { key: "Official site", value: "https://www.shibuya-sky.com/" }] },
    { label: "Nonbei Yokocho hush bar", type: "experience", location_name: "Nonbei Yokocho, Shibuya", lat: 35.6604, lng: 139.7025, day_id: "d2", order: 6, meta: [{ key: "hidden", value: "night only" }, { key: "info", value: "\"Drunkard's Alley\" — a sliver of tiny post-war bars steps from the Scramble; far more local than Golden Gai." }] },

    // ---------- D3 · Fri Oct 17 · Akihabara + Nakano + club ----------
    { label: "Akihabara arcades & gachapon", type: "experience", location_name: "Akihabara Electric Town", lat: 35.6984, lng: 139.7731, day_id: "d3", order: 0, meta: [{ key: "info", value: "GiGO / Taito mega-arcades (~¥100 a play), Super Potato retro games, Gachapon Kaikan capsule halls (¥300–500 a spin), Yodobashi + Mandarake shopping." }] },
    { label: "Maid cafe (@home cafe)", type: "experience", location_name: "@home cafe, Akihabara", lat: 35.7008, lng: 139.7717, day_id: "d3", order: 1, meta: [{ key: "info", value: "The classic Akiba rabbit hole — entry + set ~¥1,500–3,000 (≈ ₹870–1,740)." }] },
    { label: "Nakano Broadway", type: "shop", location_name: "Nakano Broadway", lat: 35.7086, lng: 139.6657, day_id: "d3", order: 2, meta: [{ key: "info", value: "Mandarake HQ — the retro/collector's maze. Vintage anime cels, figures, watches — often cheaper and rarer than Akihabara." }], items: ["Vintage anime cels", "Figures", "Retro games"] },
    { label: "Womb club night", type: "experience", location_name: "WOMB, Shibuya", lat: 35.6553, lng: 139.6946, day_id: "d3", order: 3, meta: [{ key: "info", value: "Legendary multi-floor club — techno/house, monster sound system. Cover ¥3,000–5,000 (usually incl. a drink), doors ~23:00–05:00.\nAlternatives: ZeroTokyo / ageHa event nights, or an all-night karaoke room." }] },

    // ---------- D4 · Sat Oct 18 · Okutama bundle ----------
    { label: "Shinjuku → Mitake", type: "transit", location_name: "JR Shinjuku (Chuo/Ome line)", lat: 35.6896, lng: 139.7006, day_id: "d4", groupKey: "okutama", order: 0, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "07:40" }, { key: "transit:duration", value: "1h 30m" }] },
    { label: "Tama River rafting", type: "experience", location_name: "Mitake Gorge, Okutama", lat: 35.8016, lng: 139.1839, day_id: "d4", groupKey: "okutama", order: 1, meta: [{ key: "info", value: "Whitewater + calm-water play through the gorge; wetsuits provided, beginner-friendly.\n⚠ Season runs Apr–Nov and October is the tail — VERIFY operation and book ahead. If closed, swap in the Mt. Takao bundle from the Inbox." }] },
    { label: "Canyoning (alt)", type: "experience", location_name: "Mitake, Okutama", lat: 35.803, lng: 139.187, day_id: "d4", groupKey: "okutama", order: 2, active: false, meta: [{ key: "info", value: "Slide natural rock chutes, jump into pools, rope down waterfalls. Rafting + canyoning combo courses exist (guided, lunch often included)." }] },
    { label: "Mitake Gorge riverside walk", type: "place", location_name: "Mitake Gorge", lat: 35.8007, lng: 139.1849, day_id: "d4", groupKey: "okutama", order: 3, meta: [{ key: "info", value: "One of Japan's \"100 best waters\" — scenic even without getting wet." }] },
    { label: "Mitake → Shinjuku", type: "transit", location_name: "JR Mitake Station", lat: 35.8016, lng: 139.1839, day_id: "d4", groupKey: "okutama", order: 4, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "17:00" }, { key: "transit:duration", value: "1h 30m" }] },

    // ---------- D5 · Sun Oct 19 · Markets + Harajuku + Golden Gai ----------
    { label: "Oedo Antique Market", type: "shop", location_name: "Tokyo International Forum", lat: 35.6767, lng: 139.7638, day_id: "d5", order: 0, meta: [{ key: "info", value: "Runs 1st & 3rd Sundays — Oct 19 is the 3rd Sunday (verify 2026 dates). Antiques, kimono, ceramics, ukiyo-e.\nBackup: Nogi-jinja / Shinjuku flea markets." }], items: ["Vintage kimono", "Ceramics", "Ukiyo-e prints"] },
    { label: "Meiji Jingu", type: "place", location_name: "Meiji Shrine, Harajuku", lat: 35.6764, lng: 139.6993, day_id: "d5", order: 1, meta: [{ key: "info", value: "Serene shrine in a 100,000-tree forest — instant calm two minutes from Harajuku. You may catch a wedding procession." }] },
    { label: "Takeshita Street", type: "shop", location_name: "Takeshita-dori, Harajuku", lat: 35.6716, lng: 139.7031, day_id: "d5", order: 2, items: ["Crepes", "Vintage tees", "Kawaii socks"] },
    { label: "Yoyogi Park buskers", type: "experience", location_name: "Yoyogi Park", lat: 35.6712, lng: 139.6949, day_id: "d5", order: 3, active: false, meta: [{ key: "info", value: "Sunday = buskers and the famous rockabilly dancers. Free." }] },
    { label: "Golden Gai by day", type: "place", location_name: "Golden Gai, Shinjuku", lat: 35.6939, lng: 139.7043, day_id: "d5", order: 4, meta: [{ key: "info", value: "~200 shoebox theme bars in a lantern maze — eerily photogenic and calm in daylight.\nReturn after dark: expect a ¥500–1,500 seat charge per bar." }] },
    { label: "Golden Gai night cap", type: "experience", location_name: "Golden Gai, Shinjuku", lat: 35.6939, lng: 139.7043, day_id: "d5", order: 5, active: false, meta: [] },

    // ---------- D6 · Mon Oct 20 · Hakone ----------
    { label: "Shinjuku → Hakone-Yumoto", type: "transit", location_name: "Odakyu Shinjuku (Romancecar)", lat: 35.6896, lng: 139.6983, day_id: "d6", order: 0, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "08:35" }, { key: "transit:duration", value: "1h 25m" }, { key: "info", value: "Buy the Hakone Freepass at Shinjuku (~¥7,100 / 2-day) — covers the whole loop: mountain train, cablecar, ropeway, buses and the Lake Ashi boat." }] },
    { label: "Hakone Open-Air Museum", type: "place", location_name: "Hakone Open-Air Museum", lat: 35.245, lng: 139.053, day_id: "d6", order: 1, meta: [{ key: "info", value: "Sculpture park with a Picasso pavilion and the stained-glass tower. ¥2,000 door / ¥1,800 online. 9:00–17:00." }] },
    { label: "Owakudani black eggs", type: "experience", location_name: "Owakudani Valley", lat: 35.2445, lng: 139.0195, day_id: "d6", order: 2, items: ["Kuro-tamago (black egg)"], meta: [{ key: "info", value: "Live volcanic valley reached by ropeway. A kuro-tamago boiled in the springs is said to add 7 years to your life. Best Fuji views on clear days." }] },
    { label: "Lake Ashi pirate cruise", type: "place", location_name: "Lake Ashi", lat: 35.202, lng: 139.0246, day_id: "d6", order: 3, meta: [{ key: "info", value: "Mock galleon across the lake (~25–40 min) — covered by the Freepass. Torii + Fuji views." }] },
    { label: "Hakone Shrine torii", type: "place", location_name: "Hakone Shrine, Moto-Hakone", lat: 35.2048, lng: 139.0256, day_id: "d6", order: 4, active: false, meta: [{ key: "info", value: "The vermilion \"Torii of Peace\" standing in the lake — iconic photo, expect a queue." }] },
    { label: "Onsen ryokan night", type: "experience", location_name: "Hakone-Yumoto", lat: 35.2324, lng: 139.1069, day_id: "d6", order: 5, meta: [{ key: "info", value: "Kaiseki dinner + baths. Autumn = crisp air and better Fuji visibility.\nBook the ryokan 12–16 weeks ahead for October." }] },

    // ---------- D7 · Tue Oct 21 · Hakone → Kyoto ----------
    { label: "Old Tokaido cedar avenue", type: "place", location_name: "Moto-Hakone", lat: 35.194, lng: 139.026, day_id: "d7", order: 0, meta: [{ key: "info", value: "Walk the Edo-era stone highway under ~400-year-old cedars — short and atmospheric." }] },
    { label: "Odawara → Kyoto", type: "transit", location_name: "Odawara Station", lat: 35.2565, lng: 139.1552, day_id: "d7", order: 1, meta: [{ key: "transit:mode", value: "Shinkansen" }, { key: "transit:depart", value: "12:30" }, { key: "transit:duration", value: "2h 05m" }, { key: "info", value: "Reserve seats via smartEX/Klook. Use Suica/ICOCA — the JR Pass does NOT pay off on this route." }] },
    { label: "Pontocho lantern dinner", type: "food", location_name: "Pontocho Alley", lat: 35.0095, lng: 135.7708, day_id: "d7", order: 2, meta: [{ key: "info", value: "Kyoto's most atmospheric lane — one person wide, lantern-lit, riverside. Reserve a river-view terrace; roll on to Kiyamachi after." }] },

    // ---------- D8 · Wed Oct 22 · FESTIVAL DAY ----------
    { label: "Samurai & Ninja experience", type: "experience", location_name: "Samurai & Ninja Museum, Nakagyo", lat: 35.005, lng: 135.767, day_id: "d8", order: 0, meta: [{ key: "info", value: "Armour, shuriken throwing, sword lesson — ~¥2,500–4,000, ~1.5 h.\nKeep the morning light: tonight is the trip's biggest night." }] },
    { label: "Jidai Matsuri procession", type: "experience", location_name: "Imperial Palace → Heian Shrine", lat: 35.0254, lng: 135.7621, day_id: "d8", order: 1, meta: [{ key: "time", value: "12:00" }, { key: "info", value: "\"Festival of the Ages\" — 2,000 people in 1,000+ years of accurate historical costume.\nLeaves the Imperial Palace ~12:00, reaches Heian Shrine ~14:30. Grab a kerb spot on Oike-dori early; paid grandstand seats sell out." }] },
    { label: "Demachiyanagi → Kurama", type: "transit", location_name: "Eizan line, Demachiyanagi", lat: 35.03, lng: 135.7727, day_id: "d8", order: 2, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "16:30" }, { key: "transit:duration", value: "30m" }, { key: "info", value: "Head north EARLY — the little Eizan line jams badly on festival night." }] },
    { label: "Kurama Fire Festival", type: "experience", location_name: "Kurama, north Kyoto", lat: 35.1173, lng: 135.771, day_id: "d8", order: 3, meta: [{ key: "time", value: "18:00" }, { key: "info", value: "Villagers haul flaming 3-m torches through the streets — wild, ancient, intense. Starts ~18:00.\nTrains back are jammed; plan to stay until ~22:00 and protect your energy all day for this." }] },

    // ---------- D9 · Thu Oct 23 · Fushimi → kimono → Gion ----------
    { label: "Fushimi Inari full loop", type: "place", location_name: "Fushimi Inari Taisha", lat: 34.9671, lng: 135.7727, day_id: "d9", order: 0, meta: [{ key: "info", value: "The 10,000 torii. The full Mt Inari loop is 2–3 h and blissfully empty before 07:30.\nMost people quit at the Yotsutsuji viewpoint — keep going for solitude." }] },
    { label: "Kimono rental day", type: "experience", location_name: "Gion / Gojo", lat: 35.0037, lng: 135.7788, day_id: "d9", order: 1, meta: [{ key: "info", value: "~¥3,000–5,000 + hair. Reserve a slot — autumn weekends book out.\nMind the geiko-photo ban in Gion's private alleys (¥10,000 fine)." }] },
    { label: "Nishiki Market grazing", type: "food", location_name: "Nishiki Market", lat: 35.005, lng: 135.7649, day_id: "d9", order: 2, meta: [{ key: "info", value: "\"Kyoto's kitchen\" — 400 m of stalls. Eat at the stall, not walking (frowned upon)." }], items: ["Tako tamago", "Soy-milk donut", "Yuba"] },
    { label: "Ninenzaka & Sannenzaka", type: "place", location_name: "Higashiyama", lat: 34.9966, lng: 135.781, day_id: "d9", order: 3, meta: [{ key: "info", value: "The preserved stone-paved slopes everyone pictures as old Kyoto." }] },
    { label: "Yasaka Shrine", type: "place", location_name: "Yasaka Shrine, Gion", lat: 35.0037, lng: 135.7786, day_id: "d9", order: 4, active: false },
    { label: "Gion Corner show", type: "experience", location_name: "Gion Corner", lat: 35.0027, lng: 135.7754, day_id: "d9", order: 5, meta: [{ key: "time", value: "18:00" }, { key: "info", value: "Sampler of 7 arts in one hour — tea, koto, ikebana, kyogen, bunraku and maiko Kyomai dance. ¥3,150.\nShows 18:00 & 19:00 — verify the current schedule and book ahead." }] },
    { label: "Ishibekoji lane wander", type: "place", location_name: "Ishibe-koji, Higashiyama", lat: 34.9986, lng: 135.7805, day_id: "d9", order: 6, meta: [{ key: "hidden", value: "secret" }, { key: "info", value: "Kyoto's most beautiful lane — stone-paved, lantern-lit, no crowds. Keep it quiet." }] },

    // ---------- D10 · Fri Oct 24 · Arashiyama ----------
    { label: "Arashiyama Bamboo Grove", type: "place", location_name: "Arashiyama", lat: 35.017, lng: 135.6716, day_id: "d10", order: 0, meta: [{ key: "info", value: "The emerald corridor. Before 8am is the only way to get it near-empty — enter via Tenryu-ji's back gate." }] },
    { label: "Tenryu-ji", type: "place", location_name: "Tenryu-ji, Arashiyama", lat: 35.0158, lng: 135.6739, day_id: "d10", order: 1, meta: [{ key: "info", value: "UNESCO Zen temple; the Sogenchi pond garden borrows the mountains. ¥500 (garden)." }] },
    { label: "Sagano countryside cycling", type: "experience", location_name: "Sagano, Arashiyama", lat: 35.019, lng: 135.667, day_id: "d10", order: 2, meta: [{ key: "info", value: "Rent bikes near the station and ride the rural lanes — rice fields, Adashino, Okochi Sanso, Saga-Toriimoto old street. Relaxed, green, un-touristy." }] },
    { label: "Iwatayama Monkey Park", type: "experience", location_name: "Iwatayama, Arashiyama", lat: 35.0093, lng: 135.6779, day_id: "d10", order: 3, active: false, meta: [{ key: "info", value: "20-min climb to wild snow monkeys + the best panorama of Kyoto. ¥800, cash only, 9:00–16:00." }] },
    { label: "Fushimi sake tasting", type: "experience", location_name: "Gekkeikan Okura Museum, Fushimi", lat: 34.9298, lng: 135.762, day_id: "d10", order: 4, active: false, meta: [{ key: "info", value: "¥600 incl. tasting, 9:30–16:30 — one of the world's oldest sake makers, in the willow-lined canal brewery district (~40 breweries)." }] },
    { label: "Last Kyoto night — Pontocho", type: "food", location_name: "Pontocho / Kiyamachi", lat: 35.009, lng: 135.7706, day_id: "d10", order: 5, meta: [] },

    // ---------- D11 · Sat Oct 25 · Osaka → Arima ----------
    { label: "Kyoto → Osaka", type: "transit", location_name: "Kyoto Station", lat: 34.9858, lng: 135.7588, day_id: "d11", order: 0, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "09:00" }, { key: "transit:duration", value: "15m" }] },
    { label: "Kuromon Ichiba grazing", type: "food", location_name: "Kuromon Ichiba Market", lat: 34.6656, lng: 135.5065, day_id: "d11", order: 1, meta: [{ key: "info", value: "600 m, 100+ stalls — \"Osaka's Kitchen\". Morning–afternoon graze; also knives and kitchenware to take home." }], items: ["Otoro", "Grilled scallop", "Wagyu skewer"] },
    { label: "Dotonbori & Glico sign", type: "experience", location_name: "Ebisubashi Bridge, Dotonbori", lat: 34.6687, lng: 135.5013, day_id: "d11", order: 2, meta: [{ key: "info", value: "Kuidaore — eat till you drop. Takoyaki ~¥500–700 a tray, okonomiyaki ~¥900–1,400, kushikatsu ~¥120–200 a skewer (NO double-dipping — iron rule).\nThe arms-up Glico pose on Ebisubashi is best at blue hour." }], items: ["Takoyaki", "Okonomiyaki", "Kushikatsu"] },
    { label: "America-mura streetwear", type: "shop", location_name: "Amerikamura, Triangle Park", lat: 34.672, lng: 135.4977, day_id: "d11", order: 3, items: ["Vintage thrift", "Sneakers", "Records"] },
    { label: "Shinsekai & Tsutenkaku", type: "place", location_name: "Shinsekai", lat: 34.6525, lng: 135.5063, day_id: "d11", order: 4, active: false, meta: [{ key: "info", value: "Retro-Showa neon district — kushikatsu birthplace (Daruma, since 1929), cheapest beers in town; tower from ¥1,500." }] },
    { label: "Umeda Sky sunset", type: "place", location_name: "Umeda Sky Building", lat: 34.7052, lng: 135.4899, day_id: "d11", order: 5, active: false, meta: [{ key: "info", value: "The open-air rooftop ring at 173 m — Osaka's best sunset. ¥2,000." }] },
    { label: "Osaka → Arima Onsen", type: "transit", location_name: "Umeda", lat: 34.7025, lng: 135.4959, day_id: "d11", order: 6, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "17:30" }, { key: "transit:duration", value: "1h 15m" }] },
    { label: "Arima Onsen ryokan", type: "experience", location_name: "Arima Onsen", lat: 34.7975, lng: 135.2478, day_id: "d11", order: 7, meta: [{ key: "info", value: "Japan's oldest hot-spring town — gold (kinsen) and silver (ginsen) baths, right behind Kobe.\nBook the ryokan 12–16 weeks ahead for October." }] },

    // ---------- D12 · Sun Oct 26 · Soak, Kobe, fly ----------
    { label: "Morning kinsen soak", type: "experience", location_name: "Arima Onsen", lat: 34.7976, lng: 135.248, day_id: "d12", order: 0, meta: [] },
    { label: "Kobe beef lunch", type: "food", location_name: "Sannomiya, Kobe", lat: 34.6946, lng: 135.1956, day_id: "d12", order: 1, meta: [{ key: "info", value: "Arima sits right behind Kobe — teppanyaki lunch + Nankinmachi Chinatown / harbour if time allows." }], items: ["Kobe beef teppanyaki"] },
    { label: "Kobe → KIX", type: "transit", location_name: "Sannomiya Station", lat: 34.6946, lng: 135.1956, day_id: "d12", order: 2, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "15:00" }, { key: "transit:duration", value: "1h 30m" }, { key: "info", value: "Allow ~2 h + buffer to KIX (via Osaka / Nankai or the Bay Shuttle)." }] },
    { label: "KIX → home", type: "transit", location_name: "Kansai International Airport", lat: 34.4347, lng: 135.2441, day_id: "d12", order: 3, meta: [{ key: "transit:mode", value: "Flight" }, { key: "transit:depart", value: "19:30" }] },

    // ---------- INBOX · the menu (passive picks from things-to-do.md) ----------
    { label: "teamLab Borderless", type: "experience", location_name: "Azabudai Hills", lat: 35.6607, lng: 139.7413, day_id: null, order: 0, active: false, meta: [{ key: "info", value: "The boundary-less flagship, reopened at Azabudai Hills (2024). ¥3,600–5,600 date-priced — book ahead." }] },
    { label: "Ghibli Museum", type: "experience", location_name: "Mitaka", lat: 35.6962, lng: 139.5704, day_id: null, order: 1, active: false, meta: [{ key: "info", value: "Reservation-only. Tickets drop the 10th of each month (10:00 JST) for the NEXT month and vanish in minutes; the name must match your passport." }] },
    { label: "Tokyo Skytree", type: "place", location_name: "Oshiage, Sumida", lat: 35.7101, lng: 139.8107, day_id: null, order: 5, active: false, meta: [{ key: "info", value: "634 m — Tembo Deck from ¥1,800 advance; +Galleria combo from ¥3,000." }] },
    { label: "USJ + Super Nintendo World", type: "experience", location_name: "Universal City, Osaka", lat: 34.6654, lng: 135.4323, day_id: null, order: 6, active: false, meta: [{ key: "info", value: "A full alternative Osaka day. Studio Pass ~¥8,600–10,900 (dynamic).\n★ Super Nintendo World needs TIMED ENTRY — free app ticket on the day (sells out fast) or the safe bet: an Express Pass including a SNW ride (~¥11,800–18,900), book ~2 months ahead. Express Pass does NOT include park admission." }] },
    { label: "Don Quijote late-night haul", type: "shop", location_name: "Don Quijote (24 h, citywide)", lat: 35.6605, lng: 139.6982, day_id: null, order: 7, active: false, items: ["KitKat variety", "Face masks", "Strange snacks"] },
    { label: "Kappabashi Kitchen Town", type: "shop", location_name: "Kappabashi, Asakusa", lat: 35.7139, lng: 139.7886, day_id: null, order: 8, active: false, items: ["Japanese knife", "Plastic food sample"], meta: [{ key: "info", value: "~1 km of chef supplies — knives, ceramics, and the famous plastic food samples." }] },

    // ---------- INBOX bundle · Mt. Takao (Day-4 fallback) ----------
    { label: "Tokyo → Mt. Takao", type: "transit", location_name: "Keio Shinjuku Station", lat: 35.6906, lng: 139.6994, day_id: null, groupKey: "takao", order: 0, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "08:10" }, { key: "transit:duration", value: "50m" }] },
    { label: "Cablecar / chairlift", type: "experience", location_name: "Takao-tozan Cable Car, Kiyotaki Station", lat: 35.639, lng: 139.2696, day_id: null, groupKey: "takao", order: 1, meta: [{ key: "info", value: "The funicular climbs a 31° max grade — Japan's steepest — in about 6 minutes; you can skip the first stretch or hike it instead.\n~¥490 one-way / ~¥950 round-trip (≈ ₹284 / ₹551)." }] },
    { label: "Trail 1 to the summit", type: "experience", location_name: "Trail 1, Mt. Takao", lat: 35.633, lng: 139.259, day_id: null, groupKey: "takao", order: 2, meta: [{ key: "info", value: "Paved main route past shops and viewpoints; other numbered trails (e.g. Trail 6 along a stream) are wilder." }] },
    { label: "Yakuo-in Temple", type: "place", location_name: "Yakuo-in, Mt. Takao", lat: 35.6301, lng: 139.2481, day_id: null, groupKey: "takao", order: 3, meta: [{ key: "info", value: "Mountainside temple with tengu (goblin) imagery en route to the top." }] },
    { label: "Summit + Fuji view", type: "place", location_name: "Mt. Takao summit (599 m)", lat: 35.6254, lng: 139.2437, day_id: null, groupKey: "takao", order: 4, meta: [{ key: "info", value: "Clear-day Mt. Fuji panorama from the top." }] },
    { label: "Monkey Park & wildflowers", type: "place", location_name: "Takao Monkey Park", lat: 35.631, lng: 139.256, day_id: null, groupKey: "takao", order: 5 },
    { label: "Takaosan Onsen Gokurakuyu", type: "experience", location_name: "Keio Takaosan Onsen, Takaosanguchi", lat: 35.642, lng: 139.2705, day_id: null, groupKey: "takao", order: 6, meta: [{ key: "info", value: "A large hot-spring complex right next to the station — the post-hike soak." }] },
    { label: "Mt. Takao → Tokyo", type: "transit", location_name: "Takaosanguchi Station", lat: 35.6323, lng: 139.2699, day_id: null, groupKey: "takao", order: 7, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "17:30" }, { key: "transit:duration", value: "55m" }] },

    // ---------- INBOX bundle · Kawagoe Festival (optional Oct 17 swap) ----------
    { label: "Ikebukuro → Kawagoe", type: "transit", location_name: "Ikebukuro (Tobu Tojo line)", lat: 35.7295, lng: 139.7109, day_id: null, groupKey: "kawagoe", order: 0, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "13:00" }, { key: "transit:duration", value: "30m" }] },
    { label: "Kurazukuri warehouse street", type: "place", location_name: "Kurazukuri Street, Kawagoe", lat: 35.9251, lng: 139.4816, day_id: null, groupKey: "kawagoe", order: 1, meta: [{ key: "info", value: "\"Little Edo\" — 200+ fireproof clay warehouses and the Toki-no-Kane bell tower." }] },
    { label: "Kashiya Yokocho candy alley", type: "food", location_name: "Kashiya Yokocho, Kawagoe", lat: 35.927, lng: 139.479, day_id: null, groupKey: "kawagoe", order: 2, items: ["Dagashi", "Giant senbei", "Sweet-potato treats"] },
    { label: "Kawagoe Festival floats", type: "experience", location_name: "Kawagoe", lat: 35.9236, lng: 139.4853, day_id: null, groupKey: "kawagoe", order: 3, meta: [{ key: "time", value: "18:00" }, { key: "info", value: "A 360+ year-old UNESCO float festival — falls Oct 17–18, 2026 (3rd Sat/Sun).\nStay for the after-dark Hikkawase float face-offs; expect big crowds." }] },
    { label: "Kawagoe → Ikebukuro", type: "transit", location_name: "Kawagoe Station", lat: 35.9174, lng: 139.4818, day_id: null, groupKey: "kawagoe", order: 4, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "21:30" }, { key: "transit:duration", value: "30m" }] },

    // ---------- INBOX bundle · Nara half-day (optional) ----------
    { label: "Kyoto → Nara", type: "transit", location_name: "Kintetsu Kyoto", lat: 34.9858, lng: 135.7588, day_id: null, groupKey: "nara", order: 0, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "09:00" }, { key: "transit:duration", value: "45m" }] },
    { label: "Nara Park bowing deer", type: "experience", location_name: "Nara Park", lat: 34.6851, lng: 135.843, day_id: null, groupKey: "nara", order: 1, items: ["Shika senbei (deer crackers)"], meta: [{ key: "info", value: "1,200+ free-roaming sika deer that bow for a cracker (~¥200). Hold crackers high and they'll bow back." }] },
    { label: "Todai-ji Great Buddha", type: "place", location_name: "Todai-ji, Nara", lat: 34.6889, lng: 135.8398, day_id: null, groupKey: "nara", order: 2, meta: [{ key: "info", value: "One of the world's largest wooden buildings, housing a 15 m bronze Buddha. Don't miss the Nandaimon gate guardians." }] },
    { label: "Kasuga Taisha lanterns", type: "place", location_name: "Kasuga Taisha, Nara", lat: 34.6818, lng: 135.8483, day_id: null, groupKey: "nara", order: 3, meta: [{ key: "info", value: "Vermilion shrine lined with 3,000+ stone and bronze lanterns; atmospheric forest approach." }] },
    { label: "Nara → Kyoto", type: "transit", location_name: "Kintetsu-Nara", lat: 34.6845, lng: 135.8281, day_id: null, groupKey: "nara", order: 4, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "16:30" }, { key: "transit:duration", value: "45m" }] },

    // ---------- INBOX menu · TOKYO (from things-to-do Part 1) ----------
    { label: "Tsukiji Outer Market", type: "food", location_name: "Tsukiji", lat: 35.6654, lng: 139.7707, day_id: null, order: 10, active: false, items: ["Tamagoyaki", "Fresh sashimi", "Uni"], meta: [{ key: "info", value: "The ultimate street-food breakfast crawl — best 07:00–13:00 (stalls close early afternoon; quiet Sun/Wed). The inner market moved to Toyosu; the outer market is very much alive." }] },
    { label: "Toyosu tuna auction", type: "experience", location_name: "Toyosu Market", lat: 35.6425, lng: 139.7846, day_id: null, order: 11, active: false, meta: [{ key: "info", value: "Watch the pre-dawn tuna auction from the viewing decks (book early) — or just eat legendary sushi for breakfast." }] },
    { label: "Tokyo Tower at night", type: "place", location_name: "Minato", lat: 35.6586, lng: 139.7454, day_id: null, order: 12, active: false, meta: [{ key: "info", value: "The retro red icon — Main Deck ¥1,500, Top Deck ¥3,300 online. Best lit up at night; the straight-on photo is from Roppongi Hills' Tokyo City View (¥2,000+)." }] },
    { label: "Imperial Palace East Gardens", type: "place", location_name: "Chiyoda", lat: 35.6852, lng: 139.7528, day_id: null, order: 13, active: false, meta: [{ key: "info", value: "Moats, stone ramparts and green calm in the city core. Free; closed Mon & Fri." }] },
    { label: "Tokyo Ramen Street", type: "food", location_name: "Tokyo Station B1", lat: 35.6812, lng: 139.7671, day_id: null, order: 14, active: false, items: ["Shoyu", "Miso", "Tonkotsu"], meta: [{ key: "info", value: "~8 famous shops under one roof, bowls ¥900–1,300. For Michelin bowls at pocket prices: Nakiryu (Otsuka) or Tsuta — expect queues." }] },
    { label: "Shinjuku Gyoen", type: "place", location_name: "Shinjuku", lat: 35.6852, lng: 139.71, day_id: null, order: 15, active: false, meta: [{ key: "info", value: "The city's best all-round garden — Japanese/English/French + glasshouse. ¥500, closed Mon." }] },
    { label: "Sumida River cruise", type: "experience", location_name: "Asakusa pier", lat: 35.7112, lng: 139.7986, day_id: null, order: 16, active: false, meta: [{ key: "info", value: "Futuristic Hotaluna/Himiko boats Asakusa → Odaiba (~¥1,560) — Skytree, bridges and the bay from the water." }] },
    { label: "Odaiba & the Gundam", type: "place", location_name: "DiverCity, Odaiba", lat: 35.6252, lng: 139.7756, day_id: null, order: 17, active: false, meta: [{ key: "info", value: "Bayside park, Rainbow Bridge sunset, the life-size Gundam, Joypolis VR park (~¥5,000 passport)." }] },
    { label: "Ueno Park museum row", type: "place", location_name: "Ueno Park", lat: 35.7188, lng: 139.7765, day_id: null, order: 18, active: false, meta: [{ key: "info", value: "National Museum, science + art museums, the pond and the zoo — culture-plus-green in one hit." }] },
    { label: "Street go-karting", type: "experience", location_name: "Akihabara / Shibuya", lat: 35.6997, lng: 139.7714, day_id: null, order: 19, active: false, meta: [{ key: "info", value: "Real karts past the neon in costume, ~¥15,000–20,000.\n⚠ Requires an International Driving Permit (Geneva convention) — arrange BEFORE you fly." }] },
    { label: "Samurai Restaurant show", type: "experience", location_name: "Kabukicho, Shinjuku", lat: 35.6949, lng: 139.7029, day_id: null, order: 20, active: false, meta: [{ key: "info", value: "The over-the-top neon dinner show that replaced the Robot Restaurant — dancers, drums, robots, lasers. ~¥8,000+." }] },
    { label: "Sumo — autumn jungyo / stable visit", type: "experience", location_name: "Ryogoku", lat: 35.6966, lng: 139.7932, day_id: null, order: 21, active: false, meta: [{ key: "info", value: "No Tokyo basho in October, but the Autumn Jungyo touring exhibition (~Oct 6–25) lets you see wrestlers up close — or book a morning stable (heya) practice viewing." }] },
    { label: "Tokyo DisneySea", type: "experience", location_name: "Maihama", lat: 35.6267, lng: 139.885, day_id: null, order: 22, active: false, meta: [{ key: "info", value: "The nautical park unique to Tokyo — adults love it. Date-priced ¥7,900–10,900; the new Fantasy Springs area needs paid Premier Access or a standby pass. Book ahead." }] },
    { label: "Harry Potter Studio Tour", type: "experience", location_name: "Warner Bros. Tokyo, Nerima", lat: 35.736, lng: 139.6516, day_id: null, order: 23, active: false, meta: [{ key: "info", value: "Walk the real Great Hall, Diagon Alley, Forbidden Forest sets — the world's largest indoor HP attraction. ~¥6,300, timed entry, routinely sold out weeks ahead." }] },
    { label: "Giants baseball @ Tokyo Dome", type: "experience", location_name: "Tokyo Dome, Bunkyo", lat: 35.7056, lng: 139.7519, day_id: null, order: 24, active: false, meta: [{ key: "info", value: "Chanting, beer girls, electric NPB atmosphere — ¥1,800–6,000. The Climax Series playoffs run mid-October: instant sell-outs, book the moment they release." }] },
    { label: "Blue Note Tokyo jazz", type: "experience", location_name: "Aoyama", lat: 35.6641, lng: 139.7128, day_id: null, order: 25, active: false, meta: [{ key: "info", value: "Name acts ~¥7,000+; for local legends try Shinjuku Pit Inn from ~¥1,500." }] },
    { label: "Animal cafe", type: "experience", location_name: "Harajuku / Akihabara", lat: 35.6702, lng: 139.7026, day_id: null, order: 26, active: false, meta: [{ key: "info", value: "Hedgehog, capybara, otter, cat… ~¥1,000–2,500 incl. drink. Pick well-reviewed, ethical spots." }] },
    { label: "Small Worlds Miniature Museum", type: "place", location_name: "Ariake", lat: 35.6338, lng: 139.7891, day_id: null, order: 27, active: false, meta: [{ key: "info", value: "Asia's largest miniature museum — Evangelion, a working airport in 1/80 scale. ~¥2,700." }] },
    { label: "Nezu Shrine torii tunnel", type: "place", location_name: "Bunkyo", lat: 35.7204, lng: 139.761, day_id: null, order: 28, active: false, meta: [{ key: "info", value: "A mini Fushimi-Inari vermilion torii tunnel without the Kyoto crowds. Free." }] },
    { label: "Yanaka Ginza & cats", type: "place", location_name: "Yanaka", lat: 35.7277, lng: 139.7669, day_id: null, order: 29, active: false, meta: [{ key: "info", value: "Time-capsule old Tokyo — retro shopping street, sunset steps, temple lanes, resident cats." }] },
    { label: "Kagurazaka evening stroll", type: "place", location_name: "Kagurazaka", lat: 35.702, lng: 139.74, day_id: null, order: 30, active: false, meta: [{ key: "info", value: "Cobbled former geisha district — stone alleys, hidden French bistros. Chic, romantic, low-tourist." }] },
    { label: "Jimbocho book town", type: "shop", location_name: "Jimbocho, Chiyoda", lat: 35.6959, lng: 139.7578, day_id: null, order: 31, active: false, items: ["Ukiyo-e prints", "Vintage books"], meta: [{ key: "info", value: "~150 second-hand bookshops + old-school coffee houses — cheap vintage prints." }] },
    { label: "Shimokitazawa thrift & live houses", type: "place", location_name: "Shimokitazawa", lat: 35.6613, lng: 139.6682, day_id: null, order: 32, active: false, meta: [{ key: "info", value: "Bohemian thrift, indie records, tiny live venues (entry ~¥2,500–3,500 +1 drink). Koenji is the punkier, cheaper cousin." }] },
    { label: "Nakameguro canal cafés", type: "place", location_name: "Nakameguro", lat: 35.644, lng: 139.6982, day_id: null, order: 33, active: false },
    { label: "Depachika food halls", type: "food", location_name: "Isetan Shinjuku / Ginza", lat: 35.6916, lng: 139.7045, day_id: null, order: 34, active: false, meta: [{ key: "info", value: "Jewel-like basement food halls — bento, wagashi, free samples. The most beautiful edible window-shopping on earth." }] },
    { label: "Pokémon Cafe", type: "food", location_name: "Nihonbashi", lat: 35.684, lng: 139.7745, day_id: null, order: 35, active: false, meta: [{ key: "info", value: "Reservation required; sets ¥1,500–3,000. Kirby Cafe at Skytree is the alternative." }] },
    { label: "Meiji Gaien Ginkgo Avenue", type: "place", location_name: "Aoyama", lat: 35.6746, lng: 139.7176, day_id: null, order: 36, active: false, meta: [{ key: "info", value: "Tokyo's most famous golden-ginkgo tunnel — colour usually mid-to-late Nov (early for this trip, still a lovely walk)." }] },
    { label: "Todoroki Valley walk", type: "place", location_name: "Setagaya", lat: 35.6089, lng: 139.6482, day_id: null, order: 37, active: false, meta: [{ key: "info", value: "A leafy ravine stream-walk that feels like countryside inside Tokyo. Free." }] },

    // ---------- INBOX menu · TOKYO DAY TRIPS (Part 2) ----------
    { label: "Nikko day trip", type: "experience", location_name: "Toshogu, Nikko (~2 h)", lat: 36.7581, lng: 139.5986, day_id: null, order: 38, active: false, meta: [{ key: "info", value: "THE October foliage pick — Toshogu's carved UNESCO shrines, Kegon Falls, Lake Chuzenji, and the 48 Irohazaka switchbacks peaking late Oct.\nTobu Spacia from Asakusa ~2 h; Nikko passes from ~¥3,000. Start early." }] },
    { label: "Kamakura + Enoshima", type: "experience", location_name: "Kamakura (~1 h)", lat: 35.3167, lng: 139.5504, day_id: null, order: 39, active: false, meta: [{ key: "info", value: "Great Buddha (¥300), Hase-dera, the Enoden coastal tram, surf beach, Enoshima's shrine lanes + Iwaya caves. The do-everything day." }] },
    { label: "Yokohama half-day", type: "experience", location_name: "Minato Mirai (~30 min)", lat: 35.456, lng: 139.638, day_id: null, order: 40, active: false, meta: [{ key: "info", value: "Japan's biggest Chinatown (graze!), Cup Noodles Museum (make your own), harbour Ferris wheel, Red Brick Warehouse. Lowest-effort trip on the list." }] },
    { label: "Fuji-Q + Kawaguchiko", type: "experience", location_name: "Fuji Five Lakes (~2 h)", lat: 35.487, lng: 138.7809, day_id: null, order: 41, active: false, meta: [{ key: "info", value: "Fuji icons + world-record coasters (Takabisha's 121° drop). 1-day pass ¥6,000–7,800 — book timed tickets online. October = snow-capped clarity." }] },
    { label: "Chureito Pagoda", type: "place", location_name: "Fujiyoshida (~2 h)", lat: 35.5017, lng: 138.801, day_id: null, order: 42, active: false, meta: [{ key: "info", value: "The single most iconic \"Japan\" photo — five-storey pagoda + Fuji, ~400 steps up. Worth the trip on a clear day; unreal in autumn." }] },
    { label: "Nokogiriyama hell-peek", type: "experience", location_name: "Chiba (~2 h)", lat: 35.1595, lng: 139.832, day_id: null, order: 43, active: false, meta: [{ key: "info", value: "Stand on the Jigoku Nozoki cliff ledge, then Japan's biggest stone Buddha (31 m). Ropeway ¥1,200 round trip; pair with the Tokyo Bay ferry." }] },
    { label: "Sawara canal town", type: "place", location_name: "Chiba (~1 h 50)", lat: 35.8886, lng: 140.4996, day_id: null, order: 44, active: false, meta: [{ key: "info", value: "The quieter \"Little Edo\" — willow canals, merchant houses, wooden boat cruise (reserve on busy days)." }] },
    { label: "Kusatsu Onsen (overnight)", type: "experience", location_name: "Gunma (~4 h)", lat: 36.6206, lng: 138.5964, day_id: null, order: 45, active: false, meta: [{ key: "info", value: "Japan's most famous onsen town — the steaming Yubatake, yumomi paddle show, riverside rotenburo. Over the 2-h line; better as an overnight (book early)." }] },

    // ---------- INBOX menu · KYOTO (Part 3) ----------
    { label: "Kinkaku-ji (Golden Pavilion)", type: "place", location_name: "NW Kyoto", lat: 35.0394, lng: 135.7292, day_id: null, order: 46, active: false, meta: [{ key: "info", value: "Gold-leaf Zen pavilion mirrored in its pond. ¥500. Small and jams fast — be at the gate at 9:00 opening." }] },
    { label: "Kiyomizu-dera", type: "place", location_name: "Higashiyama", lat: 34.9949, lng: 135.785, day_id: null, order: 47, active: false, meta: [{ key: "info", value: "The giant wooden stage over the hillside. ¥400 — opens ~6am, a rare early-open icon: go 6–7am for empty terraces. Autumn light-up from Nov 22." }] },
    { label: "Ginkaku-ji + Philosopher's Path", type: "place", location_name: "NE Higashiyama", lat: 35.027, lng: 135.7982, day_id: null, order: 48, active: false, meta: [{ key: "info", value: "The understated Silver Pavilion + raked-sand garden (¥500), then the 2 km canal-side walk to Nanzen-ji." }] },
    { label: "Ryoan-ji rock garden", type: "place", location_name: "NW Kyoto", lat: 35.0345, lng: 135.7182, day_id: null, order: 49, active: false, meta: [{ key: "info", value: "Japan's most famous Zen rock garden — 15 stones. ¥600; early morning you can actually sit in silence. Near Kinkaku-ji." }] },
    { label: "Nanzen-ji & the aqueduct", type: "place", location_name: "NE Higashiyama", lat: 35.011, lng: 135.7943, day_id: null, order: 50, active: false, meta: [{ key: "info", value: "Grand Zen complex with a photogenic brick aqueduct — free grounds, low crowds, any time." }] },
    { label: "Nijo Castle", type: "place", location_name: "Central Kyoto", lat: 35.0142, lng: 135.7481, day_id: null, order: 51, active: false, meta: [{ key: "info", value: "The shogun's castle with \"nightingale floors\" that chirp to foil ninja. ¥600; go late afternoon as temple crowds thin (last entry 16:00)." }] },
    { label: "Sanjusangen-do", type: "place", location_name: "E of Kyoto Station", lat: 34.9878, lng: 135.7716, day_id: null, order: 52, active: false, meta: [{ key: "info", value: "1,001 gold Kannon statues in one long hall — jaw-dropping, indoors (great for midday). ¥600; no photos." }] },
    { label: "Tea ceremony in kimono", type: "experience", location_name: "Maikoya, Kyoto", lat: 35.0049, lng: 135.7646, day_id: null, order: 53, active: false, meta: [{ key: "info", value: "Whisk matcha on tatami with a tea master, dressed in kimono — from ~¥10,000 (90 min incl. kimono + wagashi). Weekends sell out, book days ahead." }] },
    { label: "Wagashi-making class", type: "experience", location_name: "Downtown Kyoto", lat: 35.008, lng: 135.76, day_id: null, order: 54, active: false, meta: [{ key: "info", value: "Shape your own seasonal Kyoto sweets, then eat them with matcha. ~¥2,500–3,500 — book ahead." }] },
    { label: "Zazen meditation with a monk", type: "experience", location_name: "Zen temples, Kyoto", lat: 35.011, lng: 135.7943, day_id: null, order: 55, active: false, meta: [{ key: "info", value: "Sit zazen, often with garden + shojin (Buddhist) lunch options. ~¥1,000–3,000; some temples English-guided — reserve." }] },
    { label: "Kurama → Kibune hike", type: "experience", location_name: "North mountains", lat: 35.12, lng: 135.7738, day_id: null, order: 56, active: false, meta: [{ key: "info", value: "3.9 km forest trail over a sacred mountain between two villages (2–3 h, ¥500 Kurama-dera) — end with riverside dining in Kibune. 30 min by Eizan train." }] },
    { label: "Daimonji sunset hike", type: "experience", location_name: "From Ginkaku-ji", lat: 35.025, lng: 135.801, day_id: null, order: 57, active: false, meta: [{ key: "info", value: "~1 h climb to the giant 大 bonfire site — the best free view over all Kyoto. Do it at sunset." }] },
    { label: "Kamogawa river banks", type: "place", location_name: "Central Kyoto", lat: 35.008, lng: 135.772, day_id: null, order: 58, active: false, meta: [{ key: "info", value: "The locals' living room — picnic with a depachika haul, buskers, evenly-spaced couples. Late afternoon best." }] },
    { label: "Kaiseki lunch bargain", type: "food", location_name: "Citywide, Kyoto", lat: 35.006, lng: 135.77, day_id: null, order: 59, active: false, meta: [{ key: "info", value: "Kyoto's refined multi-course art at a fraction of dinner price — ¥3,000–6,000. Book lunch to eat high-end cheaply." }] },
    { label: "Yudofu by Nanzen-ji", type: "food", location_name: "Nanzen-ji area", lat: 35.0106, lng: 135.792, day_id: null, order: 60, active: false, items: ["Yudofu (tofu hot pot)"], meta: [{ key: "info", value: "Zen temple-style simmered tofu — Kyoto's signature vegetarian dish, warming in autumn. ~¥3,000." }] },
    { label: "Kyoto Manga Museum", type: "place", location_name: "Central Kyoto", lat: 35.0119, lng: 135.7593, day_id: null, order: 61, active: false, meta: [{ key: "info", value: "300,000 manga you can pull off the walls and read on the lawn. ~¥1,200 — the ideal crowded-midday retreat." }] },
    { label: "Uji matcha half-day", type: "experience", location_name: "Uji (~30 min)", lat: 34.8894, lng: 135.8075, day_id: null, order: 62, active: false, meta: [{ key: "info", value: "The matcha capital: Byodo-in Phoenix Hall (the ¥10-coin building, ¥700 — bring a coin), grind-your-own matcha (~¥1,000–1,500), Nakamura Tokichi parfaits.\nOctober = up to 1.5 h waits for the hall interior; go early." }] },
    { label: "Kodai-ji night illumination", type: "experience", location_name: "Higashiyama", lat: 35.0006, lng: 135.7815, day_id: null, order: 63, active: false, meta: [{ key: "time", value: "19:00" }, { key: "info", value: "Night-lit gardens + projection mapping, Oct 24–Dec 14, ¥600. Weeknights at opening beat the crowds." }] },
    { label: "Private maiko dinner (splurge)", type: "experience", location_name: "Gion", lat: 35.0037, lng: 135.7754, day_id: null, order: 64, active: false, meta: [{ key: "info", value: "Dine with a real maiko — games, dance, conversation. ~¥40,000–100,000+ pp; small capacity, book weeks ahead." }] },

    // ---------- INBOX menu · OSAKA (Part 4) ----------
    { label: "Osaka Castle", type: "place", location_name: "Osaka Castle Park", lat: 34.6873, lng: 135.5259, day_id: null, order: 65, active: false, meta: [{ key: "info", value: "The reconstructed samurai keep + moat park — ¥1,200. Go up for views, picnic in the grounds." }] },
    { label: "Abeno Harukas 300", type: "place", location_name: "Tennoji", lat: 34.6462, lng: 135.5133, day_id: null, order: 66, active: false, meta: [{ key: "info", value: "Japan's tallest skyscraper (300 m) — glass-walled 360° deck, ¥1,500, open till 21:00." }] },
    { label: "Tombori river cruise", type: "experience", location_name: "Dotonbori", lat: 34.6689, lng: 135.5013, day_id: null, order: 67, active: false, meta: [{ key: "info", value: "20-min neon canal boat under the billboards, ~¥1,000." }] },
    { label: "Hozenji Yokocho", type: "place", location_name: "Off Dotonbori", lat: 34.6673, lng: 135.503, day_id: null, order: 68, active: false, meta: [{ key: "info", value: "The moss-covered, water-splashed Buddha down a lantern alley — 2 min from the chaos. Free." }] },
    { label: "Den Den Town", type: "shop", location_name: "Nipponbashi", lat: 34.6633, lng: 135.5063, day_id: null, order: 69, active: false, items: ["Anime figures", "Retro games"], meta: [{ key: "info", value: "Osaka's Akihabara — less crowded than Tokyo's." }] },
    { label: "Ura-Namba izakaya crawl", type: "experience", location_name: "Ura-Namba", lat: 34.664, lng: 135.504, day_id: null, order: 70, active: false, meta: [{ key: "info", value: "Red-lantern backstreets of tiny 6-seat yakitori/sushi bars — the authentic drinking crawl. Drinks ¥300–600." }] },
    { label: "Kaiyukan Aquarium", type: "place", location_name: "Tempozan", lat: 34.6545, lng: 135.4289, day_id: null, order: 71, active: false, meta: [{ key: "info", value: "One of the world's biggest aquariums — whale sharks in the central tank. ¥2,400–2,700; the giant Ferris wheel next door is ¥900." }] },
    { label: "Spa World", type: "experience", location_name: "Shinsekai", lat: 34.6517, lng: 135.506, day_id: null, order: 72, active: false, meta: [{ key: "info", value: "Giant themed onsen complex — \"Europe\" & \"Asia\" bath zones, pools, 24-h baths. ¥1,200–1,500." }] },
    { label: "NGK comedy (Yoshimoto)", type: "experience", location_name: "Namba Grand Kagetsu", lat: 34.6672, lng: 135.5027, day_id: null, order: 73, active: false, meta: [{ key: "info", value: "Japan's largest comedy theater — manzai, sketches, slapstick Shinkigeki, 365 days/yr. ¥2,000–5,000; some shows use simple English/visual humor." }] },
    { label: "Namba Yasaka lion shrine", type: "place", location_name: "Namba", lat: 34.6634, lng: 135.497, day_id: null, order: 74, active: false, meta: [{ key: "info", value: "The giant open-mouthed lion-head stage — Osaka's most photogenic quirk. Free." }] },
    { label: "Sumiyoshi Taisha", type: "place", location_name: "Sumiyoshi", lat: 34.6124, lng: 135.493, day_id: null, order: 75, active: false, meta: [{ key: "info", value: "~1,800-year-old shrine with the dramatic arched Sorihashi bridge — far fewer tourists." }] },
    { label: "Takoyaki cooking class", type: "experience", location_name: "Namba", lat: 34.666, lng: 135.501, day_id: null, order: 76, active: false, meta: [{ key: "info", value: "Grill your own takoyaki + okonomiyaki with a local (~3 h incl. sake/beer), ~¥6,000–8,000 — great group activity." }] },

    // ---------- INBOX menu · KANSAI DAY TRIPS (Part 5) ----------
    { label: "Himeji Castle", type: "place", location_name: "Himeji (~30 min shinkansen)", lat: 34.8394, lng: 134.6939, day_id: null, order: 77, active: false, meta: [{ key: "info", value: "The White Heron — one of the finest surviving original castles on Earth (UNESCO). ¥2,500 (under-18 free); +Koko-en garden combo ¥2,600. Pairs with Kobe." }] },
    { label: "Koyasan temple stay", type: "experience", location_name: "Mount Koya (~1.5–2 h from Namba)", lat: 34.213, lng: 135.585, day_id: null, order: 78, active: false, meta: [{ key: "info", value: "Sleep in a working temple (shukubo, ~¥12,000–40,000 pp with monks' vegetarian meals), walk the lantern-lit Okunoin cemetery at night, join 6am fire ritual.\n⚠ The one must-book-ahead item in Kansai — 1–2+ months for October." }] },
    { label: "Minoo Falls & momiji tempura", type: "place", location_name: "Minoo (~30 min from Umeda)", lat: 34.8533, lng: 135.4715, day_id: null, order: 79, active: false, meta: [{ key: "info", value: "Easy 2.7 km forest trail to a 33 m waterfall — snack on batter-fried maple leaves (a 1,300-year-old tradition). Free; foliage peaks mid-Nov." }] },
    { label: "Mt Rokko night view", type: "place", location_name: "Kikuseidai, Kobe", lat: 34.778, lng: 135.233, day_id: null, order: 80, active: false, meta: [{ key: "info", value: "One of Japan's \"three great night views\" over Kobe + Osaka bay — ropeway from Sannomiya; pairs with the Arima finish." }] },
    { label: "Lake Biwa / Hikone Castle", type: "place", location_name: "Shiga (~50 min)", lat: 35.2766, lng: 136.2518, day_id: null, order: 81, active: false, meta: [{ key: "info", value: "A National Treasure original castle (¥1,000 incl. Genkyu-en garden), lakeside cycling, and I.M. Pei's mountaintop Miho Museum (check seasonal open dates)." }] },
    { label: "Kinosaki Onsen (overnight)", type: "experience", location_name: "Kinosaki (~2.5 h)", lat: 35.625, lng: 134.8144, day_id: null, order: 82, active: false, meta: [{ key: "info", value: "The definitive onsen-town stroll — seven public baths, canal in yukata + geta. Yumepa day pass ¥1,500; Oct–Dec is peak, book lodging early." }] },
    { label: "Amanohashidate sandbar", type: "place", location_name: "Miyazu Bay (~2 h+)", lat: 35.567, lng: 135.1902, day_id: null, order: 83, active: false, meta: [{ key: "info", value: "One of Japan's Three Great Views — view it upside-down through your legs (matanozoki) so it becomes a bridge to heaven. Chairlift ¥850." }] },
    { label: "Nachi Falls pilgrimage", type: "place", location_name: "Kumano (~4 h — overnight)", lat: 33.669, lng: 135.8898, day_id: null, order: 84, active: false, meta: [{ key: "info", value: "Japan's tallest single-drop waterfall (133 m) + the vermilion pagoda — the postcard of spiritual Japan, on the Kumano Kodo. Honestly an overnight." }] },
    { label: "Wakayama & Tomogashima", type: "experience", location_name: "Wakayama (~1 h from Namba)", lat: 34.226, lng: 135.171, day_id: null, order: 85, active: false, meta: [{ key: "info", value: "Castle views, the theatrical tuna-cutting show at Kuroshio Market, and the Laputa-like ruined island forts of Tomogashima (20-min ferry — check weather)." }] },
  ],

  seedShopping: [
    { text: "Uniqlo heattech", where: "Uniqlo Shibuya", lat: 35.6612, lng: 139.6988 },
    { text: "Muji travel bottles", where: "Muji Yurakucho", lat: 35.6749, lng: 139.7625 },
    { text: "KitKat gift boxes", where: "Bic Camera Shinjuku", lat: 35.6917, lng: 139.7003 },
    { text: "Matcha (Ippodo)", where: "Ippodo Tea, Kyoto", lat: 35.0135, lng: 135.7669 },
    { text: "Kitchen knife (Doguyasuji)", where: "Doguyasuji, Osaka", lat: 34.665, lng: 135.503 },
  ],

  packing: [
    { id: "p1", label: "Passport + photocopies" },
    { id: "p2", label: "Visa Issuance Notice on phone (+ eSIM live)" },
    { id: "p3", label: "Suica/ICOCA plan · smartEX account" },
    { id: "p4", label: "Walking shoes (15k+ steps/day)" },
    { id: "p5", label: "Light layers + rain jacket (Oct 15–25°C)" },
    { id: "p6", label: "Portable battery" },
    { id: "p7", label: "Adapter (Type A/B)" },
    { id: "p8", label: "Swim/onsen kit + small towel" },
    { id: "p9", label: "Yen float ¥20–30k cash" },
    { id: "p10", label: "Medicine" },
    { id: "p11", label: "Shopping tote (tax-free receipts)" },
    { id: "p12", label: "Space for haul" },
  ],

  tips: [
    { title: "Beat the crowds", body: "Icons before 8am or at dusk — Senso-ji, Fushimi Inari, the bamboo grove. Midday is for markets, museums and food." },
    { title: "Cash culture", body: "Tiny bars, yokocho stalls and shrines are cash-only. Carry ¥20–30k; 7-Eleven ATMs take Indian cards 24/7." },
    { title: "Trains", body: "Suica/ICOCA taps everything. Skip the JR Pass on this route — point-to-point shinkansen via smartEX wins." },
    { title: "Book early", body: "teamLab, Shibuya Sky sunset, Gion Corner, ryokan (12–16 wks), Okutama rafting — see the footer checklist." },
    { title: "Luggage", body: "Use takkyubin (luggage forwarding) between hotels on the Hakone and Arima legs — travel with a day pack." },
    { title: "Veg / Jain note", body: "Broths often hide dashi (fish). Save the phrase: niku nashi, sakana nashi, dashi nashi. HappyCow finds veg spots." },
  ],

  /** Footer reference docs — rendered as links that open a modal. */
  docs: [
    {
      id: "visa",
      title: "Visa — India → Japan",
      body: [
        "Indians get one of the cheapest long-haul visas anywhere: a flat ₹500 consular fee (single AND multiple entry) plus ~₹800 VFS service charge — about ₹1,300 all-in. India is EXEMPT from Japan's 1 July 2026 global fee hike (others now pay ¥15,000 ≈ ₹8,760).",
        "The eVisa (available to Indians since 2024) is a single-entry, short-term tourism visa (stay up to 90 days, validity ~3 months) applied online via VFS Global / accredited agencies. Processing 4–7 working days — apply 2–3 weeks ahead to absorb checks.",
        "Documents: passport (6+ months validity, 2 blank pages), form, two 45×45 mm white-background photos, cover letter, flight + hotel bookings, 6-month bank statements + ITR/salary proof, employment ID/NOC.",
        "⚠ On approval you get an electronic \"Visa Issuance Notice\" — no passport sticker. At the airport you must show it LIVE on your phone with internet (printouts/screenshots not accepted) — so land with an eSIM or roaming already working.",
      ],
      links: [
        { label: "Official eVisa portal", href: "https://www.evisa.mofa.go.jp/" },
        { label: "VFS Global — Japan visa (India)", href: "https://visa.vfsglobal.com/ind/en/jpn/" },
      ],
    },
    {
      id: "bookings",
      title: "Book-now checklist",
      body: [
        "Onsen ryokan at Hakone (D6) and Arima (D11) — 12–16 weeks ahead for October.",
        "Okutama rafting/canyoning (D4) — confirm October operation + book; fallback = the Mt. Takao bundle.",
        "teamLab Planets + Shibuya Sky sunset slot (D2) — Sky releases ~2 weeks ahead at 00:00 JST and sells in minutes.",
        "Gion Corner show, kimono rental, Samurai/Ninja experience (D8–9).",
        "Jidai Matsuri paid grandstand seat (optional) + plan the crowded late return from Kurama (D8).",
        "Shinkansen seats (Hakone→Kyoto, Kyoto→Osaka) via smartEX/Klook.",
        "Flights: book by ~mid-August — the trip ends inside the Dussehra/Diwali fare-surge window.",
      ],
      links: [],
    },
    {
      id: "money",
      title: "Money & getting around",
      body: [
        "¥100 ≈ ₹59 (mid-2026); budget ~0.62–0.64 ₹/¥ when buying forex. Carry ¥20,000–30,000 cash — small bars, stalls and shrines are cash-only. 7-Eleven and Japan Post ATMs take foreign cards 24/7.",
        "Get a Suica/ICOCA IC card (or the mobile version) on landing — it taps trains, buses, konbini and vending machines everywhere.",
        "Skip the nationwide JR Pass for this route — point-to-point shinkansen tickets via smartEX (or Klook) are cheaper for Tokyo→Kyoto→Osaka.",
        "Passes that DO pay: Hakone Freepass (~¥7,100/2-day — the whole loop), and the Osaka Amazing Pass (~¥3,300/1-day) if you're doing 3+ paid sights in a day.",
        "An International Driving Permit is mandatory for street go-karting — arrange before flying.",
      ],
      links: [],
    },
    {
      id: "october",
      title: "October notes",
      body: [
        "Foliage reality: city koyo peaks mid-Nov–early-Dec — October is green + crisp (20–25°C days, cool nights). For colour, altitude helps: Nikko (late Oct), Hakone and Mt. Takao are the early-turning picks.",
        "Festivals this trip is built around: Kawagoe Festival Oct 17–18 (UNESCO floats, optional D3 swap) and the double header on Oct 22 — Jidai Matsuri by day, Kurama Fire Festival by night.",
        "Autumn eating: chestnut and sweet-potato sweets, matsutake, momiji wagashi, limited-edition konbini/depachika seasonal snacks.",
        "October weather is dry and clear — the best Fuji-visibility odds of the year from Hakone and (on clear mornings) Chureito Pagoda.",
      ],
      links: [],
    },
  ],
};
