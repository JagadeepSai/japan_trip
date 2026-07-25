/* ============================================================
   Japan Trip — app shell
   ============================================================ */

const state = {
  wishes: [],
  map: null,
  markers: {},
  routeLayer: null,
  edgeLayer: null,
  showRoutes: true,
  mapActive: false,
  showHidden: false,
  shopping: [],
  groupOpen: {},
  indexOpen: false,
  boardView: "full", // full | min (compact rows)
  activePinId: null,
  indexFilter: "all",
  dayFilter: "all", // all | inbox | day id
  itineraryFilter: "all", // all | cityId | day id
  itineraryFocusDay: null,
  locPick: null,
  shopLocPick: null,
  editingWishId: null,
  timelineBound: false,
  shinkansenBound: false,
  picker: {
    target: null,
    editWishId: null,
    map: null,
    marker: null,
    pick: null,
  },
};

const STORE = {
  packing: "jp-packing",
  tastes: "jp-tastes-tried",
  shopping: "jp-shopping-v3",
  promoted: "jp-shop-promoted",
  night: "jp-night",
  boardView: "jp-board-view",
  inboxOpen: "jp-inbox-open",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cityById(id) {
  return TRIP.cities.find((c) => c.id === id);
}

function dayById(id) {
  return TRIP.days.find((d) => d.id === id);
}

/* ---------- Hidden events (秘密) — revealed only via the night boat ---------- */

function isHidden(wish) {
  return WishStore.normalizeMeta(wish.meta).some((m) => (m.key || "").trim().toLowerCase() === "hidden");
}

function visibleWishes() {
  return state.wishes.filter((w) => state.showHidden || !isHidden(w));
}

function setShowHidden(on) {
  state.showHidden = !!on;
  const btn = document.getElementById("hidden-toggle");
  btn?.classList.toggle("on", state.showHidden);
  btn?.setAttribute("aria-pressed", state.showHidden ? "true" : "false");
  refreshWishes().catch(console.error);
}

// First-run demo content: two secret stops (local mode only, never duplicated)
async function ensureHiddenSeeds() {
  return; // superseded by the curated initial database (data.js seeds)
  // eslint-disable-next-line no-unreachable
  if (WishStore.getMode() !== "local") return;
  if (state.wishes.some(isHidden)) return;
  const seeds = [
    { label: "Nonbei Yokocho hush bar", type: "experience", location_name: "Nonbei Yokocho, Shibuya", lat: 35.6604, lng: 139.7025, day_id: "d2", active: true, sort_order: 4, meta: [{ key: "hidden", value: "night only" }], items: [] },
    { label: "Ishibekoji lane wander", type: "place", location_name: "Ishibe-koji, Higashiyama, Kyoto", lat: 34.9986, lng: 135.7805, day_id: "d5", active: false, sort_order: 3, meta: [{ key: "hidden", value: "secret" }], items: [] },
  ];
  for (const s of seeds) await WishStore.create(s);
  await refreshWishes();
}

/* ---------- Transit events — the crossings between cities ---------- */

const TRANSIT_KEYS = { mode: "transit:mode", depart: "transit:depart", duration: "transit:duration" };

// Meta keys the app owns (never shown in the Links & notes editor)
function isReservedMetaKey(key) {
  const k = String(key || "").toLowerCase();
  return k === "group" || k === "time" || k === "info" || k.startsWith("transit:");
}

function metaValue(metaLike, key) {
  return WishStore.normalizeMeta(metaLike).find((m) => m.key.toLowerCase() === key)?.value || "";
}

function wishTime(w) {
  return metaValue(w.meta, "time");
}

function wishInfo(w) {
  return metaValue(w.meta, "info");
}

function wishTransit(metaLike) {
  const meta = WishStore.normalizeMeta(metaLike);
  const get = (k) => meta.find((m) => m.key.toLowerCase() === k)?.value || "";
  return { mode: get(TRANSIT_KEYS.mode), depart: get(TRANSIT_KEYS.depart), duration: get(TRANSIT_KEYS.duration) };
}

// First-run demo content: the two big city shifts (local mode only)
async function ensureTransitSeeds() {
  return; // superseded by the curated initial database
  // eslint-disable-next-line no-unreachable
  if (WishStore.getMode() !== "local") return;
  if (state.wishes.some((w) => w.type === "transit")) return;
  const seeds = [
    { label: "Tokyo → Hakone", type: "transit", location_name: "Shinjuku Station (Odakyu)", lat: 35.6896, lng: 139.6983, day_id: "d4", active: true, sort_order: -1, meta: [{ key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "08:35" }, { key: "transit:duration", value: "1h 25m" }], items: [] },
    { label: "Hakone → Kyoto", type: "transit", location_name: "Odawara Station", lat: 35.2565, lng: 139.1552, day_id: "d5", active: true, sort_order: -1, meta: [{ key: "transit:mode", value: "Shinkansen" }, { key: "transit:depart", value: "09:12" }, { key: "transit:duration", value: "2h 05m" }], items: [] },
  ];
  for (const t of seeds) await WishStore.create(t);
  await refreshWishes();
}

/* ---------- Groups (結び) — bundles of events that travel together ---------- */

const GROUP_META = { start: "group:start", end: "group:end" };

function isGroup(w) {
  return w.type === "group";
}

function wishGroupId(w) {
  return WishStore.normalizeMeta(w.meta).find((m) => m.key.toLowerCase() === "group")?.value || null;
}

// Only trust the link if the group row still exists (deleting a group frees its members)
function effectiveGroupId(w) {
  const gid = wishGroupId(w);
  return gid && state.wishes.some((g) => g.id === gid && isGroup(g)) ? gid : null;
}

function groupInfo(g) {
  const meta = WishStore.normalizeMeta(g.meta);
  const get = (k) => meta.find((m) => m.key.toLowerCase() === k)?.value || "";
  return { start: get(GROUP_META.start), end: get(GROUP_META.end) };
}

function membersOf(gid) {
  return visibleWishes()
    .filter((w) => effectiveGroupId(w) === gid)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function allGroups() {
  return visibleWishes().filter(isGroup);
}

// Top-level entries for a column: loose wishes + group vessels (members render inside)
function dayTopLevel(dayId) {
  return wishesForDay(dayId).filter((w) => !effectiveGroupId(w));
}

// The itinerary as a sequence: days in order, top-level order, bundles expanded.
// The map's pins, index numbers and thread all follow this.
function routeOrderedWishes() {
  const seq = [];
  const expand = (dayId) => {
    wishesForDay(dayId)
      .filter((w) => !effectiveGroupId(w))
      .forEach((t) => {
        if (isGroup(t)) seq.push(...membersOf(t.id));
        else seq.push(t);
      });
  };
  TRIP.days.forEach((d) => expand(d.id));
  expand(null);
  return seq;
}

function isGroupOpen(g) {
  return state.groupOpen[g.id] ?? !!g.day_id; // stacked in the inbox, open on a day
}

// First-run demo: the Mt. Takao excursion, bundled and waiting in the inbox
async function ensureGroupSeeds() {
  return; // superseded by the curated initial database
  // eslint-disable-next-line no-unreachable
  if (WishStore.getMode() !== "local") return;
  if (state.wishes.some(isGroup)) return;
  const g = await WishStore.create({
    label: "Mt. Takao",
    type: "group",
    day_id: null,
    sort_order: 2,
    meta: [
      { key: GROUP_META.start, value: "Tokyo" },
      { key: GROUP_META.end, value: "Tokyo" },
    ],
    items: [],
  });
  const link = { key: "group", value: g.id };
  const members = [
    { label: "Tokyo → Mt. Takao", type: "transit", location_name: "Keio Shinjuku Station", lat: 35.6906, lng: 139.6994, meta: [link, { key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "08:10" }, { key: "transit:duration", value: "50m" }] },
    { label: "Cablecar / chairlift", type: "experience", location_name: "Takao-tozan Cable Car, Kiyotaki Station", lat: 35.639, lng: 139.2696, meta: [link, { key: "info", value: "The funicular climbs a 31° max grade — Japan's steepest — in about 6 minutes; you can skip the first stretch or hike it instead.\nTrail 1 continues from the upper station past shops and viewpoints.\n~¥490 one-way / ~¥950 round-trip (≈ ₹284 / ₹551)." }] },
    { label: "Trail 1 to the summit", type: "experience", location_name: "Trail 1, Mt. Takao", lat: 35.633, lng: 139.259, meta: [link] },
    { label: "Yakuo-in Temple", type: "place", location_name: "Yakuo-in, Mt. Takao", lat: 35.6301, lng: 139.2481, meta: [link] },
    { label: "Summit + Fuji view", type: "place", location_name: "Mt. Takao summit (599 m)", lat: 35.6254, lng: 139.2437, meta: [link] },
    { label: "Monkey Park & wildflowers", type: "place", location_name: "Takao Monkey Park", lat: 35.631, lng: 139.256, meta: [link] },
    { label: "Takaosan Onsen Gokurakuyu", type: "experience", location_name: "Keio Takaosan Onsen, Takaosanguchi", lat: 35.642, lng: 139.2705, meta: [link] },
    { label: "Mt. Takao → Tokyo", type: "transit", location_name: "Takaosanguchi Station", lat: 35.6323, lng: 139.2699, meta: [link, { key: "transit:mode", value: "Train" }, { key: "transit:depart", value: "17:30" }, { key: "transit:duration", value: "55m" }] },
  ];
  for (let i = 0; i < members.length; i++) {
    await WishStore.create({ ...members[i], day_id: null, active: true, sort_order: i, items: [] });
  }
  await refreshWishes();
}

// Existing boards seeded before the info feature get the cablecar notes once
async function ensureInfoEnrichment() {
  return; // superseded by the curated initial database
  // eslint-disable-next-line no-unreachable
  if (WishStore.getMode() !== "local") return;
  const w = state.wishes.find((x) => x.label === "Cablecar / chairlift");
  if (!w || wishInfo(w)) return;
  await WishStore.update(w.id, {
    meta: [...WishStore.normalizeMeta(w.meta), { key: "info", value: "The funicular climbs a 31° max grade — Japan's steepest — in about 6 minutes; you can skip the first stretch or hike it instead.\nTrail 1 continues from the upper station past shops and viewpoints.\n~¥490 one-way / ~¥950 round-trip (≈ ₹284 / ₹551)." }],
  });
  await refreshWishes();
}

// First deploy: a fresh Supabase project starts empty — push the curated
// initial database (docs/plan.md + docs/things-to-do.md) exactly once.
async function ensureCloudSeeds() {
  if (WishStore.getMode() !== "supabase") return;
  if (state.wishes.length > 0) return;
  console.info("[seed] empty cloud database — seeding the initial board…");
  const groupIds = {};
  for (const g of TRIP.seedGroups || []) {
    const row = await WishStore.create({
      label: g.label,
      type: "group",
      day_id: g.day_id ?? null,
      sort_order: g.sort_order ?? 0,
      meta: [
        { key: "group:start", value: g.start || "" },
        { key: "group:end", value: g.end || g.start || "" },
      ],
      items: [],
    });
    groupIds[g.key] = row.id;
  }
  const seeds = TRIP.seedWishes || [];
  for (let i = 0; i < seeds.length; i++) {
    const w = seeds[i];
    const meta = [...(w.meta || [])];
    if (w.groupKey && groupIds[w.groupKey]) meta.push({ key: "group", value: groupIds[w.groupKey] });
    await WishStore.create({ ...w, sort_order: w.sort_order ?? w.order ?? i, meta });
  }
  if (!getShopping().length) {
    for (const item of TRIP.seedShopping || []) {
      await ShopStore.create({ ...item, done: false });
    }
    await refreshShopping();
  }
  await refreshWishes();
  console.info("[seed] done —", state.wishes.length, "rows");
}

/* Home city for a wish — the assigned day's city, else the nearest trip city */
function wishCity(wish) {
  if (wish.day_id) {
    const d = dayById(wish.day_id);
    if (d) return cityById(d.cityId) || null;
  }
  if (wish.lat != null && wish.lng != null) {
    let best = null;
    let bd = Infinity;
    TRIP.cities.forEach((c) => {
      const dist = haversineKm(wish, c);
      if (dist < bd) {
        bd = dist;
        best = c;
      }
    });
    return best;
  }
  return null;
}

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function shortDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function dayLabel(day) {
  const d = new Date(day.date + "T12:00:00");
  return `D${TRIP.days.indexOf(day) + 1} · ${d.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`;
}

function mapsDirectionsUrl(loc) {
  if (loc?.lat != null && loc?.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
  }
  if (loc?.location_name || loc?.where) {
    const q = loc.location_name || loc.where;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q + ", Japan")}`;
  }
  return null;
}

function mapsPlaceUrl(loc) {
  if (loc?.lat != null && loc?.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  }
  if (loc?.location_name || loc?.where) {
    const q = loc.location_name || loc.where;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ", Japan")}`;
  }
  return null;
}

/* ---------- Hero hubs: board ↔ map navigation ---------- */

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function tripStats() {
  const pinned = state.wishes.filter((w) => w.lat != null && w.lng != null).length;
  const inbox = state.wishes.filter((w) => !w.day_id).length;
  const daysUsed = new Set(state.wishes.filter((w) => w.day_id).map((w) => w.day_id)).size;
  const unpinned = state.wishes.length - pinned;
  const buyOpen = getShopping().filter((s) => !s.done).length;
  return { total: state.wishes.length, pinned, inbox, daysUsed, unpinned, buyOpen };
}

function renderTripPulse() {
  const mapPulse = document.getElementById("map-pulse");
  if (mapPulse) {
    const visible = filteredEntries().length;
    mapPulse.innerHTML = `<span><strong>${visible}</strong> sushi boats set to sail</span>`;
  }
}

function setTypeFilter(filter) {
  state.indexFilter = filter || "all";
  document.querySelectorAll("#index-filters .index-filter").forEach((b) => {
    const on = b.dataset.filter === state.indexFilter;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  renderFilterCounts();
  renderMapIndex();
  syncMapMarkers();
}

function setDayFilter(day) {
  state.dayFilter = day || "all";
  document.querySelectorAll("#day-filters .day-filter").forEach((b) => {
    b.classList.toggle("active", b.dataset.day === state.dayFilter);
  });
  renderMapIndex();
  syncMapMarkers();
  renderTripPulse();
  // Zoom to a chosen day so its stops spread out and the thread reads as a route
  if (state.map && state.dayFilter !== "all" && state.dayFilter !== "inbox") {
    const pts = filteredEntries().map((e) => [e.lat, e.lng]);
    if (pts.length > 1) state.map.fitBounds(pts, { padding: [70, 70], maxZoom: 15 });
    else if (pts.length === 1) state.map.setView(pts[0], 14, { animate: true });
  }
}

function flashWishCard(wishId) {
  const card = document.querySelector(`.wish-card[data-id="${wishId}"]`);
  if (!card) return;
  card.classList.add("wish-flash");
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setTimeout(() => card.classList.remove("wish-flash"), 1800);
}

function openWishOnBoard(wishId) {
  scrollToSection("board");
  setTimeout(() => flashWishCard(wishId), 380);
}

function focusWish(wishId) {
  const wish = state.wishes.find((w) => w.id === wishId);
  if (!wish) return;
  if (wish.lat == null || wish.lng == null) {
    openWishOnBoard(wishId);
    return;
  }
  if (state.indexFilter !== "all" && state.indexFilter !== (wish.type || "place")) {
    setTypeFilter("all");
  }
  if (state.dayFilter !== "all") {
    const want = wish.day_id || "inbox";
    if (state.dayFilter !== want) setDayFilter("all");
  }
  scrollToSection("map");
  setTimeout(() => focusPin("wish-" + wishId), 320);
}

function focusShopOnMap(shopId) {
  const item = getShopping().find((s) => s.id === shopId);
  if (!item || item.lat == null) {
    scrollToSection("shopping");
    return;
  }
  setTypeFilter("shopping");
  scrollToSection("map");
  setTimeout(() => focusPin("shop-" + shopId), 320);
}

function showDayOnMap(dayId) {
  setTypeFilter("all");
  setDayFilter(dayId == null ? "inbox" : dayId);
  scrollToSection("map");
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function ideaKey(wishId, text) {
  return `${wishId}::${text.toLowerCase()}`;
}

/* ---------- Transit times (dynamic via OSRM, haversine fallback, cached) ---------- */

const TRANSIT_CACHE_KEY = "jp-transit-cache-v3"; // v3: adds route distance (km)
let transitCache = loadJSON(TRANSIT_CACHE_KEY, {});

function transitKey(a, b) {
  const r = (n) => Number(n).toFixed(4);
  return `${r(a.lat)},${r(a.lng)}->${r(b.lat)},${r(b.lng)}`;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Great-circle estimate: short hops = walking pace, longer = ~30km/h urban transit.
function estimateTransit(a, b) {
  const km = haversineKm(a, b);
  if (km < 1.1) return { min: Math.max(1, Math.round(km / 0.075)), mode: "walk", est: true, km: Math.round(km * 10) / 10 };
  return { min: Math.max(2, Math.round(km / 0.5)), mode: "transit", est: true, km: Math.round(km * 10) / 10 };
}

async function getTransit(a, b) {
  if (a?.lat == null || b?.lat == null) return null;
  const key = transitKey(a, b);
  if (transitCache[key]) return transitCache[key];
  let result = estimateTransit(a, b);
  // Fetch real duration + simplified street geometry so map edges follow roads
  const base =
    result.mode === "walk"
      ? "https://routing.openstreetmap.de/routed-foot/route/v1/foot"
      : "https://router.project-osrm.org/route/v1/driving";
  try {
    const url = `${base}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=simplified&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const route = data?.routes?.[0];
      if (route?.duration != null) {
        result = {
          min: Math.max(1, Math.round(route.duration / 60)),
          mode: result.mode,
          est: false,
          km: route.distance != null ? Math.round(route.distance / 100) / 10 : result.km,
          geom: (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]),
        };
      }
    }
  } catch {
    /* keep haversine estimate + straight line — app must work offline */
  }
  transitCache[key] = result;
  saveJSON(TRANSIT_CACHE_KEY, transitCache);
  return result;
}

function transitLabel(t) {
  if (!t) return "";
  return t.mode === "walk" ? `Walk ${t.min} min` : `Ride ${t.min} min`;
}

// Map captions carry the distance too — the board's rotated labels stay short
function transitLabelFull(t) {
  if (!t) return "";
  const km = t.km != null ? ` · ${t.km >= 10 ? Math.round(t.km) : t.km} km` : "";
  return transitLabel(t) + km;
}

/* ---------- Ambient ---------- */

function initLantern() {
  if (localStorage.getItem(STORE.night) === "1") document.body.classList.add("night");
  document.getElementById("lantern-toggle").addEventListener("click", () => {
    document.body.classList.toggle("night");
    localStorage.setItem(STORE.night, document.body.classList.contains("night") ? "1" : "0");
    if (!document.body.classList.contains("night") && state.showHidden) setShowHidden(false);
  });
}

function initStarfield() {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [];
  let mx = 0.5;
  let my = 0.5;
  let w = 0;
  let h = 0;
  let raf = null;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = Array.from({ length: 110 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      tw: Math.random() * Math.PI * 2,
      sp: 0.015 + Math.random() * 0.03,
      depth: 0.25 + Math.random() * 0.75,
    }));
  }
  // Animation only runs while night mode is on — day mode pays zero rAF cost
  function frame() {
    if (!document.body.classList.contains("night")) {
      ctx.clearRect(0, 0, w, h);
      raf = null;
      return;
    }
    ctx.clearRect(0, 0, w, h);
    const ox = (mx - 0.5) * 40;
    const oy = (my - 0.5) * 28;
    stars.forEach((s) => {
      s.tw += s.sp;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,248,230,${0.28 + Math.sin(s.tw) * 0.32})`;
      ctx.arc(s.x + ox * s.depth, s.y + oy * s.depth, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(frame);
  }
  const ensure = () => {
    if (raf == null) raf = requestAnimationFrame(frame);
  };
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
  }, { passive: true });
  document.getElementById("lantern-toggle")?.addEventListener("click", () => setTimeout(ensure, 0));
  resize();
  ensure();
}

function initDock() {
  const items = [...document.querySelectorAll(".dock-item[data-nav]")];
  const daysBtn = document.getElementById("dock-days-btn");
  const sections = ["board", "tastes", "map", "shopping"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActive(id) {
    items.forEach((a) => a.classList.toggle("active", a.dataset.nav === id));
  }

  daysBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openItinerary();
    setActive("timeline");
  });

  const io = new IntersectionObserver(
    (entries) => {
      const drawerOpen = !document.getElementById("itinerary-overlay")?.hidden;
      if (drawerOpen) return;
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      setActive(visible.target.id);
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: [0.1, 0.35, 0.6] }
  );
  sections.forEach((s) => io.observe(s));
  setActive("board");
}

/* ---------- Hero ---------- */

function initHero() {
  document.getElementById("hero-title-ja").textContent = TRIP.titleJa;
  document.getElementById("hero-title-en").textContent = TRIP.title;
  const sub = document.getElementById("hero-sub");
  if (sub) sub.textContent = TRIP.subtitle || "一期一会 — every encounter, once in a lifetime.";
  document.title = `${TRIP.titleJa} — ${TRIP.title}`;
  const target = new Date(TRIP.departureDate + "T00:00:00");
  function tick() {
    let diff = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(diff / 86400000);
    diff %= 86400000;
    const hours = Math.floor(diff / 3600000);
    diff %= 3600000;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    document.getElementById("cd-days").textContent = String(days);
    document.getElementById("cd-clock").textContent = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  tick();
  setInterval(tick, 1000);
}

function updateSyncPill() {
  const mode = WishStore.getMode();
  const pill = document.getElementById("sync-pill");
  if (mode === "supabase") {
    pill.textContent = "Live";
    pill.classList.add("live");
  } else {
    pill.textContent = "Local";
    pill.classList.remove("live");
  }
}

/* ---------- Search / reverse geocode ---------- */

async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const cityHits = TRIP.cities
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.nameJa.includes(q))
    .map((c) => ({
      lat: c.lat,
      lng: c.lng,
      location_name: `${c.name}, Japan`,
      display: `${c.nameJa} · ${c.name}`,
    }));
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=jp&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return cityHits;
  const data = await res.json();
  const remote = data.map((item) => {
    const name = item.name || item.display_name.split(",")[0];
    const city = item.address?.city || item.address?.town || item.address?.village || item.address?.state || "";
    const location_name = [name, city].filter(Boolean).join(", ");
    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      location_name,
      display: item.display_name.split(",").slice(0, 3).join(",").trim(),
    };
  });
  return [...cityHits, ...remote].slice(0, 7);
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return { lat, lng, location_name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, display: "Dropped pin" };
  const item = await res.json();
  const name = item.name || item.address?.attraction || item.address?.road || item.display_name?.split(",")[0];
  const city = item.address?.city || item.address?.town || item.address?.village || item.address?.state || "";
  return {
    lat,
    lng,
    location_name: [name, city].filter(Boolean).join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    display: (item.display_name || "").split(",").slice(0, 3).join(",").trim() || "Dropped pin",
  };
}

/* ---------- Location picker modal ---------- */

function openLocationPicker(target, editWishId = null) {
  state.picker.target = target;
  state.picker.editWishId = editWishId;
  state.picker.pick = null;
  const overlay = document.getElementById("picker-overlay");
  overlay.hidden = false;
  document.getElementById("picker-confirm").disabled = true;
  document.getElementById("picker-selected").textContent = "No pin yet — search or click the map";
  document.getElementById("picker-search").value = "";
  document.getElementById("picker-suggest").hidden = true;
  document.getElementById("picker-title").textContent = editWishId ? "Add pin to wish" : "Place a pin";

  requestAnimationFrame(() => {
    if (!state.picker.map) {
      state.picker.map = L.map("picker-map", { scrollWheelZoom: true, touchZoom: true }).setView([35.68, 139.76], 5);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution: "&copy; OSM",
      }).addTo(state.picker.map);
      state.picker.map.on("click", async (e) => {
        const pick = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        setPickerPin(pick);
      });
    }
    state.picker.map.invalidateSize();
    const existing = target === "wish" ? state.locPick : state.shopLocPick;
    if (existing?.lat != null) {
      setPickerPin(existing);
      state.picker.map.setView([existing.lat, existing.lng], 14);
    } else {
      state.picker.map.setView([35.68, 139.76], 5);
      if (state.picker.marker) {
        state.picker.map.removeLayer(state.picker.marker);
        state.picker.marker = null;
      }
    }
  });
}

function setPickerPin(pick) {
  state.picker.pick = pick;
  if (state.picker.marker) state.picker.map.removeLayer(state.picker.marker);
  state.picker.marker = L.marker([pick.lat, pick.lng]).addTo(state.picker.map);
  document.getElementById("picker-selected").textContent = pick.display || pick.location_name;
  document.getElementById("picker-confirm").disabled = false;
}

function closeLocationPicker() {
  document.getElementById("picker-overlay").hidden = true;
}

async function applyLocPick(target, pick) {
  if (target === "wish" && state.picker.editWishId) {
    const id = state.picker.editWishId;
    state.picker.editWishId = null;
    await WishStore.update(id, {
      location_name: pick.location_name,
      lat: pick.lat,
      lng: pick.lng,
    });
    await refreshWishes();
    focusWish(id);
    return;
  }
  if (target === "wish") {
    state.locPick = pick;
    document.getElementById("wish-location").value = pick.location_name;
    const el = document.getElementById("loc-selected");
    el.hidden = false;
    const dir = mapsDirectionsUrl(pick);
    el.innerHTML = `Pinned · ${escapeHtml(pick.display || pick.location_name)} · <a href="${dir}" target="_blank" rel="noopener">Directions</a>`;
  } else {
    state.shopLocPick = pick;
    document.getElementById("shop-where").value = pick.location_name;
    const el = document.getElementById("shop-loc-selected");
    el.hidden = false;
    const dir = mapsDirectionsUrl(pick);
    el.innerHTML = `Pinned · ${escapeHtml(pick.display || pick.location_name)} · <a href="${dir}" target="_blank" rel="noopener">Directions</a>`;
  }
}

function bindAutocomplete(input, suggestEl, onPick, clearPick) {
  const run = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      suggestEl.hidden = true;
      suggestEl.innerHTML = "";
      return;
    }
    suggestEl.hidden = false;
    suggestEl.innerHTML = `<li class="loc-loading">Searching…</li>`;
    try {
      const results = await searchPlaces(q);
      if (!results.length) {
        suggestEl.innerHTML = `<li class="loc-loading">No matches</li>`;
        return;
      }
      suggestEl.innerHTML = results
        .map(
          (r, i) => `<li role="option" data-i="${i}"><strong>${escapeHtml(r.location_name)}</strong><small>${escapeHtml(r.display)}</small></li>`
        )
        .join("");
      suggestEl.querySelectorAll("[data-i]").forEach((li) => {
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
          onPick(results[Number(li.dataset.i)]);
          suggestEl.hidden = true;
        });
      });
    } catch {
      suggestEl.innerHTML = `<li class="loc-loading">Search unavailable</li>`;
    }
  }, 380);

  input.addEventListener("input", () => {
    clearPick();
    run();
  });
  input.addEventListener("blur", () => setTimeout(() => { suggestEl.hidden = true; }, 180));
  input.addEventListener("focus", () => {
    if (suggestEl.children.length) suggestEl.hidden = false;
  });
}

function initLocationPicker() {
  document.getElementById("wish-pick-map").addEventListener("click", () => openLocationPicker("wish"));
  document.getElementById("shop-pick-map").addEventListener("click", () => openLocationPicker("shop"));
  document.getElementById("picker-close").addEventListener("click", closeLocationPicker);
  document.getElementById("picker-cancel").addEventListener("click", closeLocationPicker);
  document.getElementById("picker-overlay").addEventListener("click", (e) => {
    if (e.target.id === "picker-overlay") closeLocationPicker();
  });
  document.getElementById("picker-confirm").addEventListener("click", async () => {
    if (!state.picker.pick) return;
    await applyLocPick(state.picker.target, state.picker.pick);
    closeLocationPicker();
  });

  const searchInput = document.getElementById("picker-search");
  const suggest = document.getElementById("picker-suggest");
  const runPickerSearch = async () => {
    const q = searchInput.value.trim();
    if (q.length < 2) return;
    suggest.hidden = false;
    suggest.innerHTML = `<li class="loc-loading">Searching…</li>`;
    const results = await searchPlaces(q);
    if (!results.length) {
      suggest.innerHTML = `<li class="loc-loading">No matches</li>`;
      return;
    }
    suggest.innerHTML = results
      .map((r, i) => `<li data-i="${i}"><strong>${escapeHtml(r.location_name)}</strong><small>${escapeHtml(r.display)}</small></li>`)
      .join("");
    suggest.querySelectorAll("[data-i]").forEach((li) => {
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const pick = results[Number(li.dataset.i)];
        setPickerPin(pick);
        state.picker.map.setView([pick.lat, pick.lng], 15);
        suggest.hidden = true;
      });
    });
  };
  document.getElementById("picker-use-search").addEventListener("click", runPickerSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runPickerSearch();
    }
  });
}

/* ---------- Meta / items ---------- */

function addMetaRow(key = "", value = "") {
  const wrap = document.getElementById("meta-rows");
  const row = document.createElement("div");
  row.className = "meta-row";
  row.innerHTML = `
    <input type="text" class="meta-key" placeholder="Key" value="${escapeHtml(key)}" maxlength="40" />
    <input type="text" class="meta-val" placeholder="Value or https://…" value="${escapeHtml(value)}" maxlength="300" />
    <button type="button" class="meta-remove" aria-label="Remove">×</button>`;
  row.querySelector(".meta-remove").addEventListener("click", () => row.remove());
  wrap.appendChild(row);
  if (key === "Official site") row.querySelector(".meta-val").focus();
}

function readMetaRows() {
  return [...document.querySelectorAll("#meta-rows .meta-row")]
    .map((row) => ({
      key: row.querySelector(".meta-key").value.trim(),
      value: row.querySelector(".meta-val").value.trim(),
    }))
    .filter((m) => m.key);
}

function clearMetaRows() {
  document.getElementById("meta-rows").innerHTML = "";
}

function renderMetaLinks(meta) {
  const list = WishStore.normalizeMeta(meta);
  if (!list.length) return "";
  return `<ul class="meta-chips">${list
    .map((m) => {
      if (isHttpUrl(m.value)) {
        return `<li><a href="${escapeHtml(m.value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(m.key)}</a></li>`;
      }
      return `<li><span class="meta-k">${escapeHtml(m.key)}</span> <span class="meta-v">${escapeHtml(m.value)}</span></li>`;
    })
    .join("")}</ul>`;
}

function updateItemsBlock() {
  const type = document.getElementById("wish-type").value;
  const block = document.getElementById("items-block");
  const label = document.getElementById("items-label");
  const hint = document.getElementById("items-hint");
  if (type === "food") {
    block.hidden = false;
    label.textContent = "Food items";
    hint.textContent = "These appear in the Food list below.";
  } else if (type === "shop") {
    block.hidden = false;
    label.textContent = "Shop item ideas";
    hint.textContent = "These appear as shopping ideas — promote to buy list when ready.";
  } else {
    block.hidden = true;
  }
  const transitBlock = document.getElementById("transit-block");
  if (transitBlock) transitBlock.hidden = type !== "transit";
}

/* ---------- Group modal ---------- */

function openGroupModal(gid) {
  const g = state.wishes.find((x) => x.id === gid && isGroup(x));
  if (!g) return;
  const info = groupInfo(g);
  document.getElementById("group-edit-id").value = g.id;
  document.getElementById("group-name").value = g.label;
  document.getElementById("group-start").value = info.start;
  document.getElementById("group-end").value = info.end;
  document.getElementById("group-modal").hidden = false;
  document.getElementById("group-name").focus();
}

function closeGroupModal() {
  document.getElementById("group-modal").hidden = true;
}

function initGroupModal() {
  document.getElementById("group-modal-close")?.addEventListener("click", closeGroupModal);
  document.getElementById("group-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "group-modal") closeGroupModal();
  });
  document.getElementById("group-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("group-edit-id").value;
    const name = document.getElementById("group-name").value.trim();
    if (!id || !name) return;
    const meta = [];
    const start = document.getElementById("group-start").value.trim();
    const end = document.getElementById("group-end").value.trim();
    if (start) meta.push({ key: GROUP_META.start, value: start });
    if (end) meta.push({ key: GROUP_META.end, value: end });
    await WishStore.update(id, { label: name, meta });
    closeGroupModal();
    await refreshWishes();
  });
  document.getElementById("group-ungroup")?.addEventListener("click", async () => {
    const id = document.getElementById("group-edit-id").value;
    if (!id || !confirm("Untie this bundle? The events stay on their day.")) return;
    for (const m of state.wishes.filter((w) => wishGroupId(w) === id)) {
      await WishStore.update(m.id, {
        meta: WishStore.normalizeMeta(m.meta).filter((x) => x.key.toLowerCase() !== "group"),
      });
    }
    await WishStore.remove(id);
    closeGroupModal();
    await refreshWishes();
  });
}

/* ---------- Wish form modal ---------- */

function resetWishForm() {
  document.getElementById("wish-edit-id").value = "";
  document.getElementById("wish-label").value = "";
  document.getElementById("wish-location").value = "";
  document.getElementById("wish-items").value = "";
  document.getElementById("wish-type").value = "place";
  document.getElementById("wish-day").value = "";
  state.locPick = null;
  state.editingWishId = null;
  document.getElementById("loc-selected").hidden = true;
  document.getElementById("transit-mode").value = "Shinkansen";
  document.getElementById("transit-depart").value = "";
  document.getElementById("transit-duration").value = "";
  document.getElementById("group-new-name").value = "";
  document.getElementById("group-new-start").value = "";
  document.getElementById("group-new-end").value = "";
  document.getElementById("group-new-fields").hidden = true;
  document.getElementById("wish-time").value = "";
  document.getElementById("wish-info").value = "";
  clearMetaRows();
  updateItemsBlock();
}

function openWishModal(opts = {}) {
  const modal = document.getElementById("wish-modal");
  const title = document.getElementById("wish-modal-title");
  const submit = document.getElementById("wish-submit-btn");
  resetWishForm();

  const gsel = document.getElementById("wish-group");
  if (gsel) {
    gsel.innerHTML =
      `<option value="">No group</option>` +
      allGroups()
        .map((g) => `<option value="${g.id}">結び · ${escapeHtml(g.label)}</option>`)
        .join("") +
      `<option value="__new">＋ New group…</option>`;
    gsel.value = "";
  }

  if (opts.wishId) {
    const wish = state.wishes.find((w) => w.id === opts.wishId);
    if (!wish) return;
    state.editingWishId = wish.id;
    document.getElementById("wish-edit-id").value = wish.id;
    document.getElementById("wish-label").value = wish.label || "";
    document.getElementById("wish-type").value = wish.type || "place";
    document.getElementById("wish-day").value = wish.day_id || "";
    document.getElementById("wish-location").value = wish.location_name || "";
    document.getElementById("wish-items").value = WishStore.normalizeItems(wish.items).join("\n");
    if (wish.lat != null) {
      state.locPick = {
        lat: wish.lat,
        lng: wish.lng,
        location_name: wish.location_name,
        display: wish.location_name,
      };
      const el = document.getElementById("loc-selected");
      el.hidden = false;
      el.textContent = `Pinned · ${wish.location_name || "Saved pin"}`;
    }
    WishStore.normalizeMeta(wish.meta).forEach((m) => {
      if (!isReservedMetaKey(m.key)) addMetaRow(m.key, m.value);
    });
    const t = wishTransit(wish.meta);
    if (t.mode) document.getElementById("transit-mode").value = t.mode;
    document.getElementById("transit-depart").value = t.depart || "";
    document.getElementById("transit-duration").value = t.duration || "";
    if (gsel) gsel.value = effectiveGroupId(wish) || "";
    document.getElementById("wish-time").value = wishTime(wish) || "";
    document.getElementById("wish-info").value = wishInfo(wish) || "";
    title.textContent = "Edit sushi";
    submit.textContent = "Save changes";
  } else {
    if (opts.dayId) document.getElementById("wish-day").value = opts.dayId;
    if (opts.type) document.getElementById("wish-type").value = opts.type;
    title.textContent = "Add sushi";
    submit.textContent = "Add to boat";
  }
  updateItemsBlock();
  modal.hidden = false;
  document.getElementById("wish-label").focus();
}

function closeWishModal() {
  document.getElementById("wish-modal").hidden = true;
  resetWishForm();
}

function initWishForm() {
  const daySelect = document.getElementById("wish-day");
  daySelect.innerHTML =
    `<option value="">Inbox</option>` +
    TRIP.days.map((d) => `<option value="${d.id}">${dayLabel(d)} — ${escapeHtml(d.title)}</option>`).join("");

  document.getElementById("open-wish-modal")?.addEventListener("click", () => openWishModal());
  document.getElementById("wish-modal-close")?.addEventListener("click", closeWishModal);
  document.getElementById("wish-modal-cancel")?.addEventListener("click", closeWishModal);
  document.getElementById("wish-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "wish-modal") closeWishModal();
  });

  document.getElementById("meta-add").addEventListener("click", () => addMetaRow());
  document.getElementById("meta-official").addEventListener("click", () => {
    const exists = [...document.querySelectorAll(".meta-key")].some((el) => el.value.trim() === "Official site");
    if (!exists) addMetaRow("Official site", "https://");
    else {
      const row = [...document.querySelectorAll("#meta-rows .meta-row")].find(
        (r) => r.querySelector(".meta-key").value.trim() === "Official site"
      );
      row?.querySelector(".meta-val")?.focus();
    }
  });

  document.getElementById("wish-type").addEventListener("change", updateItemsBlock);
  updateItemsBlock();

  document.getElementById("wish-group")?.addEventListener("change", (e) => {
    const isNew = e.target.value === "__new";
    const fields = document.getElementById("group-new-fields");
    if (fields) fields.hidden = !isNew;
    if (isNew) {
      const day = dayById(document.getElementById("wish-day").value);
      const cityName = day ? cityById(day.cityId)?.name || "" : "";
      const startEl = document.getElementById("group-new-start");
      if (startEl && !startEl.value) startEl.value = cityName;
    }
  });

  bindAutocomplete(
    document.getElementById("wish-location"),
    document.getElementById("loc-suggest"),
    (pick) => applyLocPick("wish", pick),
    () => {
      if (state.locPick && document.getElementById("wish-location").value.trim() !== state.locPick.location_name) {
        state.locPick = null;
        document.getElementById("loc-selected").hidden = true;
      }
    }
  );

  document.getElementById("wish-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const label = document.getElementById("wish-label").value.trim();
    if (!label) return;

    let lat = state.locPick?.lat ?? null;
    let lng = state.locPick?.lng ?? null;
    let location_name = state.locPick?.location_name || document.getElementById("wish-location").value.trim() || null;
    if (location_name && lat == null) {
      try {
        const results = await searchPlaces(location_name);
        if (results[0]) {
          lat = results[0].lat;
          lng = results[0].lng;
          location_name = results[0].location_name;
        }
      } catch { /* text only */ }
    }

    const items = document.getElementById("wish-items").value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const dayId = document.getElementById("wish-day").value || null;
    const type = document.getElementById("wish-type").value;
    const meta = readMetaRows().filter((m) => !isReservedMetaKey(m.key));
    if (type === "transit") {
      const details = {
        [TRANSIT_KEYS.mode]: document.getElementById("transit-mode").value,
        [TRANSIT_KEYS.depart]: document.getElementById("transit-depart").value,
        [TRANSIT_KEYS.duration]: document.getElementById("transit-duration").value.trim(),
      };
      Object.entries(details).forEach(([key, value]) => {
        if (value) meta.push({ key, value });
      });
    }
    if (type !== "transit") {
      const timeVal = document.getElementById("wish-time").value;
      if (timeVal) meta.push({ key: "time", value: timeVal });
    }
    const infoVal = document.getElementById("wish-info").value.trim();
    if (infoVal) meta.push({ key: "info", value: infoVal });
    const payload = {
      label,
      type,
      location_name,
      lat,
      lng,
      day_id: dayId,
      meta,
      items,
    };

    let groupId = document.getElementById("wish-group")?.value || "";
    if (groupId === "__new") {
      const gname = document.getElementById("group-new-name").value.trim();
      if (gname) {
        const gday = dayId ? dayById(dayId) : null;
        const defCity = gday ? cityById(gday.cityId)?.name || "" : "";
        const gstart = document.getElementById("group-new-start").value.trim() || defCity;
        const gend = document.getElementById("group-new-end").value.trim() || gstart;
        const gmeta = [];
        if (gstart) gmeta.push({ key: GROUP_META.start, value: gstart });
        if (gend) gmeta.push({ key: GROUP_META.end, value: gend });
        const g = await WishStore.create({ label: gname, type: "group", day_id: dayId, sort_order: wishesForDay(dayId).length, meta: gmeta, items: [] });
        groupId = g.id;
      } else {
        groupId = "";
      }
    }
    payload.meta = payload.meta.filter((m) => m.key.toLowerCase() !== "group");
    if (groupId) {
      payload.meta.push({ key: "group", value: groupId });
      const g = state.wishes.find((x) => x.id === groupId);
      if (g) payload.day_id = g.day_id ?? null; // members live on the bundle's day
    }

    const editId = document.getElementById("wish-edit-id").value || state.editingWishId;
    if (editId) {
      await WishStore.update(editId, payload);
    } else {
      await WishStore.create({
        ...payload,
        sort_order: wishesForDay(payload.day_id ?? dayId).length,
      });
    }

    closeWishModal();
    await refreshWishes();
  });
}

/* ---------- Wishes render ---------- */

async function refreshWishes() {
  state.wishes = await WishStore.list();
  renderKanban();
  renderTimeline();
  renderDayFilters();
  renderFilterCounts();
  renderMapIndex();
  syncMapMarkers();
  renderTastes();
  renderShopIdeas();
  renderTripPulse();
  renderShopProgress();
}

function wishesForDay(dayId) {
  return visibleWishes()
    .filter((w) => (dayId === null ? !w.day_id : w.day_id === dayId))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

async function reorderWish(wishId, direction) {
  const wish = state.wishes.find((w) => w.id === wishId);
  if (!wish) return;
  // Siblings: members move within their bundle; bundles and loose cards within the day
  const gid = effectiveGroupId(wish);
  const list = gid ? membersOf(gid) : dayTopLevel(wish.day_id ?? null);
  const idx = list.findIndex((w) => w.id === wishId);
  const swap = idx + direction;
  if (idx < 0 || swap < 0 || swap >= list.length) return;
  const arr = [...list];
  [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
  // Renumber the whole sibling run — also heals orders corrupted by the old mixed-list swap
  for (let i = 0; i < arr.length; i++) {
    if ((arr[i].sort_order ?? -1) !== i) await WishStore.update(arr[i].id, { sort_order: i });
  }
  await refreshWishes();
}

function renderWishCard(wish, minimal = false, omitCityId = null) {
  const mapped = wish.lat != null && wish.lng != null;
  const active = wish.active !== false;
  const type = wish.type || "place";
  const city = wishCity(wish);
  const hiddenCls = isHidden(wish) ? " is-hidden" : "";
  const transit = type === "transit" ? wishTransit(wish.meta) : null;
  const transitCls = transit ? " wish-card--transit" : "";
  const eventTime = transit?.depart || wishTime(wish);
  const info = wishInfo(wish);
  // Skip the tag when it just repeats the column's own city (compact rows need the room)
  const cityTag = city && city.id !== omitCityId ? `<span class="wc-city">${escapeHtml(city.name)}</span>` : "";

  if (minimal) {
    return `
    <article class="wish-card wish-card--min ${active ? "is-active" : "is-passive"}${hiddenCls}${transitCls}"
             draggable="true" data-id="${wish.id}" data-type="${escapeHtml(type)}" data-active="${active ? 1 : 0}"
             ${mapped ? `data-lat="${wish.lat}" data-lng="${wish.lng}"` : ""}>
      <button type="button" class="wc-min-toggle" data-toggle-active="${wish.id}" aria-pressed="${active}"
              title="${active ? "On the route — click to make it a maybe" : "Maybe — click to put it on the route"}" aria-label="Toggle on route">
        <span class="wc-min-dot" aria-hidden="true"></span>
      </button>
      <button type="button" class="wc-min" data-min-open="${wish.id}" title="Open event card">
        <span class="wc-min-name">${escapeHtml(wish.label)}</span>
        ${cityTag}
      </button>
    </article>`;
  }

  const dayOptions =
    `<option value="">Inbox</option>` +
    TRIP.days
      .map((d) => `<option value="${d.id}" ${wish.day_id === d.id ? "selected" : ""}>${escapeHtml(dayLabel(d))}</option>`)
      .join("");
  const dir = mapsDirectionsUrl(wish);
  const items = WishStore.normalizeItems(wish.items);
  const metaLinks = WishStore.normalizeMeta(wish.meta).filter((m) => isHttpUrl(m.value));
  return `
    <article class="wish-card ${mapped ? "is-mapped" : "needs-pin"} ${active ? "is-active" : "is-passive"}${hiddenCls}${transitCls}"
             draggable="true" data-id="${wish.id}" data-type="${escapeHtml(type)}" data-active="${active ? 1 : 0}"
             ${mapped ? `data-lat="${wish.lat}" data-lng="${wish.lng}"` : ""}>
      <div class="wc-top">
        <div class="wc-tags">
          <span class="wc-type">${escapeHtml(type)}</span>
          ${cityTag}
          ${!transit && eventTime ? `<span class="wc-city wc-time">${escapeHtml(eventTime)}</span>` : ""}
        </div>
        <div class="wc-top-tools">
          ${info ? `<button type="button" class="icon-btn is-bare is-sm wc-info" data-info="${wish.id}" title="More info" aria-label="More info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none"/></svg></button>` : ""}
          <button type="button" class="wc-active" data-toggle-active="${wish.id}" aria-pressed="${active}"
                  title="${active ? "On the day’s route — tied by the thread" : "Maybe — not on the route"}" aria-label="Toggle on route">
            <span class="wc-bead"></span>
          </button>
          <button type="button" class="icon-btn is-bare is-sm wc-more" data-more="${wish.id}" aria-label="More" aria-haspopup="true" aria-expanded="false">⋯</button>
        </div>
      </div>
      <h4 class="wc-title">${escapeHtml(wish.label)}</h4>
      <p class="wc-loc ${wish.location_name ? "" : "muted"}">${escapeHtml(wish.location_name || "No place yet")}</p>
      ${transit ? `<div class="wc-transit-line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3.5" width="14" height="13" rx="2.5"/><path d="M5 10h14M9.5 20.5 8 17M14.5 20.5 16 17"/><circle cx="9" cy="13.5" r="0.9" fill="currentColor" stroke="none"/><circle cx="15" cy="13.5" r="0.9" fill="currentColor" stroke="none"/></svg><span>${escapeHtml([transit.mode || "Transit", transit.depart, transit.duration].filter(Boolean).join(" · "))}</span></div>` : ""}
      ${items.length ? `<p class="wc-items">${items.map((i) => escapeHtml(i)).join(" · ")}</p>` : ""}
      <div class="wc-actions">
        ${
          mapped
            ? `<button type="button" class="chip is-xs is-info" data-focus-wish="${wish.id}">On map</button>`
            : `<button type="button" class="chip is-xs" data-pick-wish="${wish.id}">Add pin</button>`
        }
      </div>
      <div class="wc-menu" data-menu="${wish.id}" hidden>
        <button type="button" data-edit-wish="${wish.id}">Edit</button>
        ${dir ? `<a href="${dir}" target="_blank" rel="noopener noreferrer">Directions</a>` : ""}
        ${metaLinks.map((m) => `<a href="${escapeHtml(m.value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(m.key)}</a>`).join("")}
        <button type="button" data-reorder="-1">Move up</button>
        <button type="button" data-reorder="1">Move down</button>
        <label class="wc-menu-assign"><span class="sr-only">Assign day</span><select data-assign="${wish.id}">${dayOptions}</select></label>
        <button type="button" class="wc-menu-del" data-del="${wish.id}">Delete</button>
      </div>
    </article>`;
}

/* Group vessel: rope-bound container on days, stacked deck in the inbox */
function renderGroupBlock(group, minimal) {
  const members = membersOf(group.id);
  const open = isGroupOpen(group);
  const info = groupInfo(group);
  const day = group.day_id ? dayById(group.day_id) : null;
  const fallbackCity = day ? cityById(day.cityId)?.name || "" : "";
  const start = info.start || fallbackCity;
  const end = info.end || start;
  return `
  <div class="group-block ${open ? "is-open" : "is-stacked"}" draggable="true" data-id="${group.id}" data-group="${group.id}">
    <div class="group-head">
      <button type="button" class="group-toggle" data-group-toggle="${group.id}" aria-expanded="${open}" title="${open ? "Fold the bundle" : "Open the bundle"}">
        <svg class="group-knot" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M7 12a5 5 0 0 1 10 0 5 5 0 0 1-10 0Z"/><path d="M3.5 12h3.5M17 12h3.5"/></svg>
        <span class="group-name">${escapeHtml(group.label)}</span>
        <span class="group-count">${members.length}</span>
        <svg class="group-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <button type="button" class="icon-btn is-bare is-sm group-move" data-reorder="-1" title="Move bundle up" aria-label="Move bundle up">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 14l6-6 6 6"/></svg>
      </button>
      <button type="button" class="icon-btn is-bare is-sm group-move" data-reorder="1" title="Move bundle down" aria-label="Move bundle down">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 10l6 6 6-6"/></svg>
      </button>
      <button type="button" class="icon-btn is-bare is-sm group-edit" data-group-edit="${group.id}" title="Edit group" aria-label="Edit group">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4.5-1L20 7.5a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"/></svg>
      </button>
    </div>
    <div class="group-cards">
      ${members.map((m) => renderWishCard(m, open ? minimal : true)).join("") || `<p class="day-empty">Drop sushi onto the bundle</p>`}
    </div>
    <button type="button" class="group-route" data-group-edit="${group.id}" title="Start ⇢ end — click to edit">
      <span>${escapeHtml(start || "—")}</span>
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 12h15M14 6.5 19.5 12 14 17.5"/></svg>
      <span>${escapeHtml(end || "—")}</span>
    </button>
  </div>`;
}

function renderKanban() {
  const minimal = state.boardView === "min";
  const inbox = dayTopLevel(null);

  const tray = document.getElementById("inbox-tray");
  if (tray) {
    tray.classList.toggle("is-min", minimal);
    tray.innerHTML = inbox.length
      ? inbox.map((w) => (isGroup(w) ? renderGroupBlock(w, minimal) : renderWishCard(w, minimal))).join("")
      : `<p class="day-empty">Inbox is clear — every sushi has a day</p>`;
  }
  const count = document.getElementById("inbox-count");
  if (count) count.textContent = String(inbox.length);

  const board = document.getElementById("kanban");
  board.classList.toggle("is-min", minimal);
  board.innerHTML = TRIP.days
    .map((d) => {
      const wishes = dayTopLevel(d.id);
      const city = cityById(d.cityId);
      return `
    <div class="kanban-col" data-col="${d.id}">
      <div class="kanban-col-head">
        <div>
          <h3>${escapeHtml(dayLabel(d))}</h3>
          <span class="meta">${escapeHtml([city?.name, d.title].filter(Boolean).join(" · "))}</span>
        </div>
        <button type="button" class="text-link is-caps col-map-btn" data-show-day="${d.id}" title="Show this day on the map">Map</button>
      </div>
      <div class="kanban-cards" data-drop="${d.id}">
        ${wishes.map((w) => (isGroup(w) ? renderGroupBlock(w, minimal) : renderWishCard(w, minimal, minimal ? d.cityId : null))).join("") || `<p class="day-empty">Drop sushi here</p>`}
      </div>
    </div>`;
    })
    .join("");
  requestAnimationFrame(drawThreads);
}

/* 赤い糸 — hand-inked thread tying same-day ACTIVE mapped stops, with a
   rotated transit-time caption riding beside it in each gap. */
function drawThreads() {
  const board = document.getElementById("kanban");
  if (!board) return;
  board.querySelectorAll(".kanban-col").forEach((col) => {
    col.querySelector(".thread-layer")?.remove();
    col.classList.remove("has-thread");
    if (!col.dataset.col) return; // skip Inbox (data-col="")
    const wrap = col.querySelector(".kanban-cards");
    if (!wrap) return;
    const cards = [...wrap.querySelectorAll(".wish-card")]
      .filter((c) => c.dataset.active === "1" && c.dataset.lat)
      .filter((c) => {
        // a folded bundle is a single stop on the route — thread its top card only
        const pile = c.closest(".group-block.is-stacked");
        return !pile || c === pile.querySelector('.wish-card[data-active="1"][data-lat]');
      });
    if (cards.length < 2) return;
    col.classList.add("has-thread");

    requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const knots = cards.map((c) => {
        const r = c.getBoundingClientRect();
        return { y: r.top - wrapRect.top + wrap.scrollTop + r.height / 2, card: c };
      });
      const X = 20;
      let d = `M ${X} ${knots[0].y}`;
      for (let i = 1; i < knots.length; i++) {
        const y0 = knots[i - 1].y;
        const y1 = knots[i].y;
        const bow = i % 2 ? X - 9 : X + 9; // alternating slack so it reads as thread
        d += ` C ${bow} ${y0 + (y1 - y0) * 0.35}, ${bow} ${y0 + (y1 - y0) * 0.65}, ${X} ${y1}`;
      }

      const ns = "http://www.w3.org/2000/svg";
      const layer = document.createElement("div");
      layer.className = "thread-layer";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("height", wrap.scrollHeight);
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "thread-path");
      svg.appendChild(path);
      knots.forEach((k) => {
        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", X);
        dot.setAttribute("cy", k.y);
        dot.setAttribute("r", 3.4);
        dot.setAttribute("class", "thread-knot");
        svg.appendChild(dot);
      });
      layer.appendChild(svg);

      const labels = [];
      for (let i = 1; i < knots.length; i++) {
        const el = document.createElement("span");
        el.className = "thread-label";
        el.style.left = "7px";
        el.style.top = (knots[i - 1].y + knots[i].y) / 2 + "px";
        el.textContent = "…";
        layer.appendChild(el);
        labels.push({ el, a: cards[i - 1], b: cards[i] });
      }
      wrap.appendChild(layer);

      try {
        const len = path.getTotalLength();
        path.style.setProperty("--len", len);
        path.classList.add("thread-draw");
      } catch { /* getTotalLength unsupported */ }

      labels.forEach(({ el, a, b }) => {
        getTransit(
          { lat: +a.dataset.lat, lng: +a.dataset.lng },
          { lat: +b.dataset.lat, lng: +b.dataset.lng }
        ).then((t) => { if (t) el.textContent = transitLabel(t); });
      });
    });
  });
}

function initKanban() {
  // The section wraps both the inbox tray and the day lane, so one set of
  // delegated handlers serves dragging between them.
  const board = document.getElementById("board");
  const DROP_ZONES = ".kanban-col, .inbox-tray";
  let dragId = null;

  board.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".wish-card") || e.target.closest(".group-block");
    if (!item) return;
    dragId = item.dataset.id;
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragId);
  });

  board.addEventListener("dragend", (e) => {
    (e.target.closest(".wish-card") || e.target.closest(".group-block"))?.classList.remove("dragging");
    dragId = null;
    board.querySelectorAll(DROP_ZONES).forEach((c) => c.classList.remove("drag-over"));
    board.querySelectorAll(".group-block").forEach((b) => b.classList.remove("drag-over"));
  });

  board.addEventListener("dragover", (e) => {
    const col = e.target.closest(DROP_ZONES);
    if (!col) return;
    e.preventDefault();
    board.querySelectorAll(DROP_ZONES).forEach((c) => c.classList.toggle("drag-over", c === col));
    const overGroup = e.target.closest(".group-block");
    board.querySelectorAll(".group-block").forEach((b) => b.classList.toggle("drag-over", b === overGroup));
  });

  board.addEventListener("dragleave", (e) => {
    const col = e.target.closest(DROP_ZONES);
    if (col && !col.contains(e.relatedTarget)) col.classList.remove("drag-over");
  });

  board.addEventListener("drop", async (e) => {
    const col = e.target.closest(DROP_ZONES);
    const drop = col?.querySelector("[data-drop]");
    if (!drop) return;
    e.preventDefault();
    col.classList.remove("drag-over");
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (!id) return;
    const dayRaw = drop.dataset.drop;
    const day_id = dayRaw === "" ? null : dayRaw;
    const wish = state.wishes.find((w) => w.id === id);
    if (!wish) return;

    // Dropping a card onto a bundle absorbs it into the group
    const gblk = e.target.closest(".group-block");
    if (gblk && !isGroup(wish) && gblk.dataset.group !== effectiveGroupId(wish)) {
      const g = state.wishes.find((x) => x.id === gblk.dataset.group);
      if (g) {
        const meta = WishStore.normalizeMeta(wish.meta).filter((m) => m.key.toLowerCase() !== "group");
        meta.push({ key: "group", value: g.id });
        await WishStore.update(id, { meta, day_id: g.day_id ?? null, sort_order: membersOf(g.id).length });
        await refreshWishes();
        return;
      }
    }

    // Moving a bundle carries every member with it
    if (isGroup(wish)) {
      if (wish.day_id === day_id) return;
      await WishStore.update(id, { day_id, sort_order: wishesForDay(day_id).length });
      for (const m of state.wishes.filter((w) => wishGroupId(w) === id)) {
        await WishStore.update(m.id, { day_id });
      }
      await refreshWishes();
      return;
    }

    // A member dragged out of its bundle leaves the group
    if (effectiveGroupId(wish)) {
      const meta = WishStore.normalizeMeta(wish.meta).filter((m) => m.key.toLowerCase() !== "group");
      await WishStore.update(id, { meta, day_id, sort_order: wishesForDay(day_id).length });
      await refreshWishes();
      return;
    }

    if (wish.day_id === day_id) return;
    await WishStore.update(id, { day_id, sort_order: wishesForDay(day_id).length });
    await refreshWishes();
  });

  board.addEventListener("click", async (e) => {
    const gToggle = e.target.closest("[data-group-toggle]");
    if (gToggle) {
      const g = state.wishes.find((x) => x.id === gToggle.dataset.groupToggle);
      if (g) {
        state.groupOpen[g.id] = !isGroupOpen(g);
        renderKanban();
      }
      return;
    }
    const gEdit = e.target.closest("[data-group-edit]");
    if (gEdit) {
      openGroupModal(gEdit.dataset.groupEdit);
      return;
    }
    const minOpen = e.target.closest("[data-min-open]");
    if (minOpen) {
      showWishPreview(minOpen.dataset.minOpen, minOpen);
      return;
    }
    const infoBtn = e.target.closest("[data-info]");
    if (infoBtn) {
      showWishPreview(infoBtn.dataset.info, infoBtn);
      return;
    }
    const more = e.target.closest("[data-more]");
    if (more) {
      const menu = more.closest(".wish-card")?.querySelector(".wc-menu");
      const willOpen = menu && menu.hidden;
      board.querySelectorAll(".wc-menu").forEach((m) => (m.hidden = true));
      board.querySelectorAll(".wc-more").forEach((b) => b.setAttribute("aria-expanded", "false"));
      if (menu && willOpen) {
        menu.hidden = false;
        more.setAttribute("aria-expanded", "true");
      }
      return;
    }
    const toggleActive = e.target.closest("[data-toggle-active]");
    if (toggleActive) {
      const id = toggleActive.dataset.toggleActive;
      const w = state.wishes.find((x) => x.id === id);
      if (w) {
        await WishStore.update(id, { active: !(w.active !== false) });
        await refreshWishes();
      }
      return;
    }
    const reorder = e.target.closest("[data-reorder]");
    if (reorder) {
      const host = reorder.closest(".wish-card") || reorder.closest(".group-block");
      if (host) await reorderWish(host.dataset.id, Number(reorder.dataset.reorder));
      return;
    }
    const edit = e.target.closest("[data-edit-wish]");
    if (edit) {
      openWishModal({ wishId: edit.dataset.editWish });
      return;
    }
    const focus = e.target.closest("[data-focus-wish]");
    if (focus) {
      focusWish(focus.dataset.focusWish);
      return;
    }
    const pick = e.target.closest("[data-pick-wish]");
    if (pick) {
      openLocationPicker("wish", pick.dataset.pickWish);
      return;
    }
    const showDay = e.target.closest("[data-show-day]");
    if (showDay) {
      const raw = showDay.dataset.showDay;
      showDayOnMap(raw === "inbox" ? null : raw);
      return;
    }
    const del = e.target.closest("[data-del]");
    if (!del) return;
    if (!confirm("Remove this wish?")) return;
    await WishStore.remove(del.dataset.del);
    await refreshWishes();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".wish-card")) {
      board.querySelectorAll(".wc-menu").forEach((m) => (m.hidden = true));
      board.querySelectorAll(".wc-more").forEach((b) => b.setAttribute("aria-expanded", "false"));
    }
  });
  window.addEventListener("resize", debounce(drawThreads, 150));

  // Card density toggle (full cards vs compact rows)
  state.boardView = localStorage.getItem(STORE.boardView) === "min" ? "min" : "full";
  const viewToggle = document.getElementById("board-view-toggle");
  const syncViewChips = () =>
    viewToggle?.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("is-active", b.dataset.view === state.boardView));
  viewToggle?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn || btn.dataset.view === state.boardView) return;
    state.boardView = btn.dataset.view;
    localStorage.setItem(STORE.boardView, state.boardView);
    syncViewChips();
    renderKanban();
  });
  syncViewChips();

  // Collapsible inbox tray
  const trayBody = document.getElementById("inbox-tray");
  const trayToggle = document.getElementById("inbox-toggle");
  const setTray = (open) => {
    if (!trayBody) return;
    trayBody.hidden = !open;
    trayToggle?.setAttribute("aria-expanded", open ? "true" : "false");
    localStorage.setItem(STORE.inboxOpen, open ? "1" : "0");
  };
  if (localStorage.getItem(STORE.inboxOpen) === "0") setTray(false);
  trayToggle?.addEventListener("click", () => setTray(trayBody?.hidden));

  // Day-lane arrows — wrap around at either end so the days loop
  const lane = document.getElementById("kanban");
  const jumpLane = (dir) => {
    if (!lane) return;
    const max = lane.scrollWidth - lane.clientWidth;
    if (dir > 0 && lane.scrollLeft >= max - 8) lane.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && lane.scrollLeft <= 8) lane.scrollTo({ left: max, behavior: "smooth" });
    else lane.scrollBy({ left: dir * Math.max(300, lane.clientWidth * 0.7), behavior: "smooth" });
  };
  document.getElementById("lane-prev")?.addEventListener("click", () => jumpLane(-1));
  document.getElementById("lane-next")?.addEventListener("click", () => jumpLane(1));

  // 秘密 — the night boat reveals hidden events
  document.getElementById("hidden-toggle")?.addEventListener("click", () => setShowHidden(!state.showHidden));

  board.addEventListener("change", async (e) => {
    const sel = e.target.closest("[data-assign]");
    if (!sel) return;
    const id = sel.dataset.assign;
    const day_id = sel.value || null;
    const wish = state.wishes.find((w) => w.id === id);
    if (!wish || (wish.day_id || null) === day_id) return;
    const patch = {
      day_id,
      sort_order: wishesForDay(day_id).filter((w) => w.id !== id).length,
    };
    if (effectiveGroupId(wish)) {
      patch.meta = WishStore.normalizeMeta(wish.meta).filter((m) => m.key.toLowerCase() !== "group");
    }
    await WishStore.update(id, patch);
    await refreshWishes();
  });
}

/* ---------- Map ---------- */

function pinIcon(label, entry) {
  const type = entry.source === "shopping" ? "shop" : entry.kind || "place";
  const passive = entry.active === false ? " is-passive" : "";
  const hid = entry.hidden ? " pin-hidden" : "";
  return L.divIcon({
    className: `pin-marker pin-${type}${passive}${hid}`,
    html: `<div class="pin-dot"><span>${label}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function cityIcon(letter) {
  return L.divIcon({
    className: "pin-marker city-marker",
    html: `<div class="pin-dot"><span>${letter}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

function initMap() {
  const tileUrl = (night) => `https://{s}.basemaps.cartocdn.com/${night ? "dark_all" : "light_all"}/{z}/{x}/{y}{r}.png`;
  // zoomSnap 0.5: our ±0.5 pinch steps must land on valid zooms — with the
  // default snap of 1, zoom-out rounded straight back up and never took effect
  state.map = L.map("trip-map", { scrollWheelZoom: false, touchZoom: true, bounceAtZoomLimits: false, zoomSnap: 0.5 });
  state.tiles = L.tileLayer(tileUrl(document.body.classList.contains("night")), {
    attribution: "&copy; OSM &copy; CARTO",
    maxZoom: 18,
  }).addTo(state.map);
  // Basemap follows the lantern — washi-light by day, ink-dark at night.
  // Recreate the layer (not setUrl) so the swap paints immediately, even offscreen.
  document.getElementById("lantern-toggle")?.addEventListener("click", () => {
    setTimeout(() => {
      if (state.tiles) state.map.removeLayer(state.tiles);
      state.tiles = L.tileLayer(tileUrl(document.body.classList.contains("night")), {
        attribution: "&copy; OSM &copy; CARTO",
        maxZoom: 18,
      }).addTo(state.map);
    }, 0);
  });

  // Trackpad model: pinch (ctrl+wheel) always zooms at the cursor. Two-finger
  // scroll pans ONLY while the map is ACTIVE — activated by clicking the map or
  // the hand control; deactivated by clicking or scrolling outside. Inactive,
  // the page scrolls straight past the map.
  const mapEl = state.map.getContainer();

  function setMapActive(on) {
    state.mapActive = !!on;
    document.getElementById("map-layout")?.classList.toggle("map-active", state.mapActive);
    const btn = document.querySelector(".leaflet-control-pan");
    if (btn) {
      btn.classList.toggle("on", state.mapActive);
      btn.setAttribute("aria-pressed", state.mapActive ? "true" : "false");
    }
  }

  mapEl.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect = mapEl.getBoundingClientRect();
        const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
        state.map.setZoomAround(pt, state.map.getZoom() + (e.deltaY < 0 ? 0.5 : -0.5));
        return;
      }
      if (!state.mapActive) return;
      e.preventDefault();
      state.map.panBy(L.point(e.deltaX, e.deltaY), { animate: false });
    },
    { passive: false }
  );

  mapEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".leaflet-control")) return; // buttons manage themselves
    setMapActive(true);
  });
  document.addEventListener("pointerdown", (e) => {
    if (state.mapActive && !e.target.closest(".map-frame")) setMapActive(false);
  });
  window.addEventListener(
    "wheel",
    (e) => {
      if (state.mapActive && !mapEl.contains(e.target)) setMapActive(false);
    },
    { passive: true }
  );

  // Cluster overlapping stops into a single washi badge per metro; individual
  // pins (and their day threads) resolve once you zoom into a city.
  state.markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 12,
    maxClusterRadius: 56,
    iconCreateFunction: (cluster) =>
      L.divIcon({
        className: "trip-cluster",
        html: `<div class="trip-cluster-dot"><span>${cluster.getChildCount()}</span></div>`,
        iconSize: [36, 36],
      }),
  }).addTo(state.map);

  const routeCities = [];
  const seen = new Set();
  TRIP.days.forEach((d) => {
    if (!seen.has(d.cityId)) {
      seen.add(d.cityId);
      const c = cityById(d.cityId);
      if (c) routeCities.push(c);
    }
  });
  const latlngs = routeCities.map((c) => [c.lat, c.lng]);
  if (latlngs.length > 1) {
    state.routeLayer = L.polyline(latlngs, {
      color: "#c45c4a",
      weight: 2.5,
      dashArray: "6 10",
      opacity: 0.8,
    }).addTo(state.map);
  }
  routeCities.forEach((c, i) => {
    L.marker([c.lat, c.lng], { icon: cityIcon(String.fromCharCode(65 + i)), zIndexOffset: -50 })
      .addTo(state.map)
      .bindTooltip(`<strong>${c.nameJa}</strong> · ${c.name}`, { direction: "top", offset: [0, -30], className: "pin-hovercard" });
  });
  if (latlngs.length) state.map.fitBounds(latlngs, { padding: [48, 48] });
  setTimeout(() => state.map.invalidateSize(), 250);
  state.map.on("zoomend", updateMapZoomClass);
  updateMapZoomClass();

  // ⛩ recenter control — snaps the view back to the whole Japan route
  state.homeBounds = latlngs.length ? latlngs : null;
  const HomeControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const div = L.DomUtil.create("div", "leaflet-bar");
      const a = L.DomUtil.create("a", "leaflet-control-home", div);
      a.href = "#";
      a.title = "Recenter Japan";
      a.setAttribute("role", "button");
      a.setAttribute("aria-label", "Recenter Japan");
      a.innerHTML =
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 6.2c3 .9 15 .9 18 0"/><path d="M5.2 6.6V20M18.8 6.6V20"/><path d="M4.5 11h15"/><path d="M12 6.9V11"/></svg>';
      L.DomEvent.on(a, "click", (e) => {
        L.DomEvent.stop(e);
        if (state.homeBounds) state.map.fitBounds(state.homeBounds, { padding: [48, 48] });
      });
      return div;
    },
  });
  state.map.addControl(new HomeControl());

  // ✋ scroll-to-pan toggle — mirrors the map's active state
  const PanControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const div = L.DomUtil.create("div", "leaflet-bar");
      const a = L.DomUtil.create("a", "leaflet-control-pan", div);
      a.href = "#";
      a.title = "Scroll to pan — click the map or this button to activate";
      a.setAttribute("role", "button");
      a.setAttribute("aria-pressed", "false");
      a.setAttribute("aria-label", "Toggle scroll-to-pan");
      a.innerHTML =
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18"/><path d="M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/></svg>';
      L.DomEvent.on(a, "click", (e) => {
        L.DomEvent.stop(e);
        setMapActive(!state.mapActive);
      });
      return div;
    },
  });
  state.map.addControl(new PanControl());

  document.getElementById("index-filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    setTypeFilter(btn.dataset.filter);
  });

  document.getElementById("day-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day]");
    if (!btn) return;
    setDayFilter(btn.dataset.day);
  });
  document.getElementById("day-filters")?.addEventListener("change", (e) => {
    const sel = e.target.closest("#day-filter-select");
    if (!sel || !sel.value) return;
    setDayFilter(sel.value);
  });

  // Collapsible index — hidden by default, map claims full width when closed
  setIndexOpen(localStorage.getItem("jp-index-open") === "1");
  document.getElementById("index-handle")?.addEventListener("click", () => setIndexOpen(!state.indexOpen));
  document.getElementById("index-close")?.addEventListener("click", () => setIndexOpen(false));
  document.getElementById("route-toggle")?.addEventListener("click", (e) => {
    state.showRoutes = !state.showRoutes;
    e.currentTarget.setAttribute("aria-pressed", state.showRoutes ? "true" : "false");
    e.currentTarget.classList.toggle("is-active", state.showRoutes);
    syncMapMarkers();
  });

  document.body.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    const target = go.dataset.go;
    if (target === "timeline" || target === "days") {
      openItinerary();
      return;
    }
    scrollToSection(target);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!document.getElementById("picker-overlay")?.hidden) {
      closeLocationPicker();
      return;
    }
    if (!document.getElementById("wish-modal")?.hidden) {
      closeWishModal();
      return;
    }
    if (!document.getElementById("shop-modal")?.hidden) {
      closeShopModal();
      return;
    }
    for (const id of ["packing-modal", "tips-modal", "group-modal", "doc-modal"]) {
      const m = document.getElementById(id);
      if (m && !m.hidden) {
        m.hidden = true;
        return;
      }
    }
    if (!document.getElementById("wish-preview")?.hidden) {
      hideWishPreview();
      return;
    }
    if (!document.getElementById("itinerary-overlay")?.hidden) closeItinerary();
  });
}

// At national/regional zoom the 32 stops pile into illegible blobs over each city;
// shrink them to quiet dots (and drop the day threads) until the user zooms into a metro.
function updateMapZoomClass() {
  const el = document.getElementById("trip-map");
  if (!el || !state.map) return;
  el.classList.toggle("zoomed-out", state.map.getZoom() < 12);
}

function setIndexOpen(open) {
  state.indexOpen = !!open;
  const layout = document.getElementById("map-layout");
  const handle = document.getElementById("index-handle");
  const index = document.getElementById("map-index");
  if (!layout) return;
  layout.classList.toggle("index-open", state.indexOpen);
  handle?.setAttribute("aria-expanded", state.indexOpen ? "true" : "false");
  index?.setAttribute("aria-hidden", state.indexOpen ? "false" : "true");
  localStorage.setItem("jp-index-open", state.indexOpen ? "1" : "0");
  // Leaflet needs a resize nudge once the grid track finishes animating
  setTimeout(() => state.map && state.map.invalidateSize(), 460);
}

function mapEntries() {
  const wishEntries = routeOrderedWishes()
    .filter((w) => w.lat != null && w.lng != null)
    .map((w) => ({
      id: "wish-" + w.id,
      kind: w.type || "place",
      label: w.label,
      location_name: w.location_name,
      lat: w.lat,
      lng: w.lng,
      day_id: w.day_id,
      active: w.active !== false,
      sort_order: w.sort_order ?? 0,
      hidden: isHidden(w),
      group: (() => {
        const gid = effectiveGroupId(w);
        return gid ? state.wishes.find((x) => x.id === gid)?.label || null : null;
      })(),
      meta: w.meta,
      source: "wish",
      wishId: w.id,
    }));
  const shopEntries = getShopping()
    .filter((s) => !s.done && s.lat != null && s.lng != null)
    .map((s) => ({
      id: "shop-" + s.id,
      kind: "shopping",
      label: s.text,
      location_name: s.where,
      lat: s.lat,
      lng: s.lng,
      active: true,
      sort_order: 0,
      meta: [],
      source: "shopping",
      shopId: s.id,
    }));
  return [...wishEntries, ...shopEntries];
}

function filteredEntries() {
  let all = mapEntries();
  if (state.indexFilter !== "all") {
    all = all.filter((e) => e.kind === state.indexFilter);
  }
  if (state.dayFilter === "inbox") {
    all = all.filter((e) => e.source === "wish" && !e.day_id);
  } else if (state.dayFilter !== "all") {
    all = all.filter((e) => e.source === "wish" && e.day_id === state.dayFilter);
  }
  return all;
}

function renderFilterCounts() {
  const all = mapEntries();
  const counts = { all: all.length, place: 0, experience: 0, food: 0, shop: 0, shopping: 0, transit: 0 };
  all.forEach((e) => {
    if (counts[e.kind] != null) counts[e.kind] += 1;
  });
  document.querySelectorAll("#index-filters .index-filter").forEach((btn) => {
    const key = btn.dataset.filter;
    const n = counts[key] ?? 0;
    const label = btn.dataset.label || btn.textContent.replace(/\s*\d+$/, "").trim();
    btn.dataset.label = label;
    btn.textContent = n ? `${label} ${n}` : label;
  });
}

function renderDayFilters() {
  const wrap = document.getElementById("day-filters");
  if (!wrap) return;
  const selectActive = TRIP.days.some((d) => d.id === state.dayFilter);
  const dayOptions = TRIP.days
    .map((d) => {
      const n = wishesForDay(d.id).filter((w) => w.lat != null).length;
      const selected = state.dayFilter === d.id ? "selected" : "";
      return `<option value="${d.id}" ${selected}>D${TRIP.days.indexOf(d) + 1} · ${escapeHtml(d.title)}${n ? ` (${n})` : ""}</option>`;
    })
    .join("");
  wrap.innerHTML = `
    <button type="button" class="day-filter ${state.dayFilter === "all" ? "active" : ""}" data-day="all">All</button>
    <button type="button" class="day-filter ${state.dayFilter === "inbox" ? "active" : ""}" data-day="inbox">Inbox</button>
    <label class="day-select-wrap ${selectActive ? "active" : ""}">
      <span class="sr-only">Trip day</span>
      <select id="day-filter-select" aria-label="Filter map by day">
        <option value="" disabled ${selectActive ? "" : "selected"}>Choose day</option>
        ${dayOptions}
      </select>
    </label>`;
}

function hoverCardHtml(entry) {
  const day = entry.day_id ? dayById(entry.day_id) : null;
  const kind = entry.kind === "shopping" ? "buy" : entry.kind;
  const when = day ? dayLabel(day) : entry.source === "wish" && !entry.day_id ? "Inbox" : "";
  const maybe = entry.active === false;
  const t = entry.kind === "transit" ? wishTransit(entry.meta) : null;
  const tLine = t ? [t.mode, t.depart, t.duration].filter(Boolean).join(" · ") : "";
  return `<div class="hc ${entry.hidden ? "is-hidden" : ""}" data-type="${escapeHtml(entry.kind)}">
      <span class="hc-kicker">${entry.hidden ? "秘密 · " : ""}${entry.group ? escapeHtml(entry.group) + " · " : ""}${escapeHtml(kind)}${when ? " · " + escapeHtml(when) : ""}</span>
      <strong>${escapeHtml(entry.label)}</strong>
      ${entry.location_name ? `<small>${escapeHtml(entry.location_name)}</small>` : ""}
      ${tLine ? `<small class="hc-transit">${escapeHtml(tLine)}</small>` : ""}
      ${maybe ? `<span class="hc-maybe">maybe · not on the route</span>` : ""}
    </div>`;
}

function popupHtml(entry) {
  const dir = mapsDirectionsUrl(entry);
  const boardBtn =
    entry.source === "wish"
      ? `<button type="button" class="popup-board" data-open-wish="${entry.wishId}">On board</button>`
      : "";
  return (
    `<strong>${escapeHtml(entry.label)}</strong><br>${escapeHtml(entry.location_name || "")}` +
    (dir ? `<br><a href="${dir}" target="_blank" rel="noopener">Directions</a>` : "") +
    (boardBtn ? "<br>" + boardBtn : "")
  );
}

function syncMapMarkers() {
  if (!state.map) return;
  if (state.markerCluster) state.markerCluster.clearLayers();
  state.markers = {};
  if (!state.edgeLayer) state.edgeLayer = L.layerGroup().addTo(state.map);
  state.edgeLayer.clearLayers();

  const entries = filteredEntries();
  entries.forEach((entry, i) => {
    const passive = entry.active === false;
    const marker = L.marker([entry.lat, entry.lng], {
      icon: pinIcon(i + 1, entry),
      opacity: passive ? 0.6 : 1,
      zIndexOffset: passive ? 0 : 100,
    });
    state.markerCluster.addLayer(marker);
    marker.bindTooltip(hoverCardHtml(entry), { direction: "top", offset: [0, -30], className: "pin-hovercard", opacity: 1 });
    marker.bindPopup(popupHtml(entry));
    marker.on("click", () => focusPin(entry.id));
    marker.on("popupopen", () => {
      const btn = document.querySelector(".popup-board[data-open-wish]");
      btn?.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          openWishOnBoard(btn.dataset.openWish);
        },
        { once: true }
      );
    });
    state.markers[entry.id] = marker;
  });

  drawMapEdges(entries);
  const count = document.getElementById("index-handle-count");
  if (count) count.textContent = String(entries.length);
  renderTripPulse();
}

/* 赤い糸 on the map — a red thread joining each day's ACTIVE stops in order.
   Threads bend along real streets (OSRM geometry) and carry an always-visible
   transit caption rotated along the route. */
function edgeCaption(pts, text) {
  // Caption at the route midpoint, rotated to the local bearing
  const mi = Math.floor(pts.length / 2);
  const p1 = pts[Math.max(0, mi - 1)];
  const p2 = pts[Math.min(pts.length - 1, mi)];
  const s1 = state.map.latLngToLayerPoint(p1);
  const s2 = state.map.latLngToLayerPoint(p2);
  let deg = (Math.atan2(s2.y - s1.y, s2.x - s1.x) * 180) / Math.PI;
  if (deg > 90 || deg < -90) deg += 180;
  return L.marker([(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2], {
    interactive: false,
    icon: L.divIcon({
      className: "map-thread-label",
      html: `<span style="transform:rotate(${deg}deg) translate(0,-11px)">${escapeHtml(text)}</span>`,
    }),
  });
}

function drawMapEdges(entries) {
  if (!state.map || !state.edgeLayer || !state.showRoutes) return;
  const byWishId = new Map(
    entries.filter((e) => e.source === "wish" && e.active !== false).map((e) => [e.wishId, e])
  );

  TRIP.days.forEach((d) => {
    // Route order mirrors the board: top-level order, bundles expanded in member order
    const seq = [];
    wishesForDay(d.id)
      .filter((w) => !effectiveGroupId(w))
      .forEach((t) => {
        if (isGroup(t)) seq.push(...membersOf(t.id));
        else seq.push(t);
      });
    const stops = seq.map((w) => byWishId.get(w.id)).filter(Boolean);
    if (stops.length < 2) return;

    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1];
      const b = stops[i];

      // A transit event's outbound leg IS the journey it declares — a carried
      // (dashed, straight) leg with its own mode/duration, not a road estimate.
      const carried = a.kind === "transit" ? wishTransit(a.meta) : null;
      const isCarried = !!(carried && (carried.mode || carried.duration));

      const line = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], {
        className: "map-thread" + (isCarried ? " map-thread--carried" : ""),
        color: "#c1443a",
        weight: 2.5,
        opacity: isCarried ? 0.7 : 0.85,
        dashArray: isCarried ? "6 8" : null,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(state.edgeLayer);
      line.on("mouseover", () => line.setStyle({ weight: 4.5 }));
      line.on("mouseout", () => line.setStyle({ weight: 2.5 }));

      if (isCarried) {
        const text = [carried.mode || "Transit", carried.duration, carried.depart ? `dep ${carried.depart}` : ""]
          .filter(Boolean)
          .join(" · ");
        edgeCaption([[a.lat, a.lng], [b.lat, b.lng]], text).addTo(state.edgeLayer);
        continue;
      }

      getTransit(a, b).then((t) => {
        // The layer may have been rebuilt (filter change) while we fetched
        if (!t || !state.edgeLayer || !state.edgeLayer.hasLayer(line)) return;
        const pts = t.geom && t.geom.length > 1 ? t.geom : [[a.lat, a.lng], [b.lat, b.lng]];
        if (t.geom && t.geom.length > 1) line.setLatLngs(pts);
        edgeCaption(pts, transitLabelFull(t)).addTo(state.edgeLayer);
      });
    }
  });
}

function renderMapIndex() {
  const list = document.getElementById("map-index-list");
  const items = filteredEntries();
  if (!items.length) {
    list.innerHTML = `<li class="empty-index"><strong>Nothing pinned for this view</strong><small>Widen filters, or add a pin on the board / buy list</small>
      <div class="index-actions"><button type="button" class="text-link is-caps" data-go="board">Open board</button></div></li>`;
    return;
  }
  list.innerHTML = items
    .map((entry, i) => {
      const day = entry.day_id ? dayById(entry.day_id) : null;
      const kindLabel = entry.kind === "shopping" ? "buy" : entry.kind;
      const passive = entry.active === false;
      return `
      <li data-pin="${entry.id}" class="${state.activePinId === entry.id ? "active" : ""} ${passive ? "is-passive" : ""} ${entry.hidden ? "is-hidden" : ""}" title="Show on map">
        <span class="index-num" data-type="${escapeHtml(entry.kind)}">${i + 1}</span>
        <div class="index-body">
          <strong>${escapeHtml(entry.label)}</strong>
          <small>${escapeHtml(entry.location_name || "")} · ${escapeHtml(kindLabel)}${entry.group ? " · " + escapeHtml(entry.group) : ""}${day ? " · " + escapeHtml(dayLabel(day)) : entry.source === "wish" && !entry.day_id ? " · Inbox" : ""}${passive ? " · maybe" : ""}</small>
          <div class="index-actions">
            ${entry.wishId ? `<button type="button" class="text-link is-caps" data-open-wish="${entry.wishId}">Board</button>` : ""}
            ${entry.day_id ? `<button type="button" class="text-link is-caps" data-open-day="${entry.day_id}">Day</button>` : ""}
          </div>
        </div>
      </li>`;
    })
    .join("");
  list.onclick = (e) => {
    const openWish = e.target.closest("[data-open-wish]");
    if (openWish) {
      openWishOnBoard(openWish.dataset.openWish);
      return;
    }
    const openDay = e.target.closest("[data-open-day]");
    if (openDay) {
      openItinerary(openDay.dataset.openDay);
      return;
    }
    const focus = e.target.closest("[data-focus]");
    if (focus) {
      focusPin(focus.dataset.focus);
      return;
    }
    const li = e.target.closest("[data-pin]");
    if (li && !e.target.closest("a")) focusPin(li.dataset.pin);
  };
}

function focusPin(id) {
  const entry = mapEntries().find((e) => e.id === id);
  if (!entry) return;

  // Ensure filters don't hide the pin we're focusing
  if (state.indexFilter !== "all" && state.indexFilter !== entry.kind) setTypeFilter("all");
  if (state.dayFilter !== "all") {
    const want = entry.source === "wish" ? entry.day_id || "inbox" : "all";
    if (state.dayFilter !== want && state.dayFilter !== "all") setDayFilter("all");
  }

  state.activePinId = id;
  if (!state.markers[id]) syncMapMarkers();
  renderMapIndex();
  const marker = state.markers[id];
  if (entry && marker && state.map) {
    // fly past the un-cluster zoom (12) so the marker is individual, then pop it
    state.map.flyTo([entry.lat, entry.lng], 14, { duration: 0.75 });
    state.map.once("moveend", () => {
      const m = state.markers[id];
      if (m) m.openPopup();
    });
  }
}

/* ---------- Itinerary drawer ---------- */

function openItinerary(focusDayId = null) {
  const overlay = document.getElementById("itinerary-overlay");
  overlay.hidden = false;
  document.body.classList.add("drawer-open");
  if (focusDayId) {
    state.itineraryFilter = focusDayId;
    state.itineraryFocusDay = focusDayId;
  }
  renderItineraryFilters();
  renderTimeline();
  document.querySelectorAll(".dock-item").forEach((a) => a.classList.toggle("active", a.id === "dock-days-btn" || a.dataset.nav === "timeline"));
  if (focusDayId) {
    setTimeout(() => document.getElementById(`day-${focusDayId}`)?.scrollIntoView({ block: "start" }), 80);
  }
}

function closeItinerary() {
  document.getElementById("itinerary-overlay").hidden = true;
  document.body.classList.remove("drawer-open");
  hideWishPreview();
}

function viewBoardDay(dayId) {
  closeItinerary();
  scrollToSection("board");
  setTimeout(() => {
    const col = document.querySelector(`.kanban-col[data-col="${dayId}"]`);
    if (!col) return;
    col.classList.add("kanban-col-flash");
    col.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setTimeout(() => col.classList.remove("kanban-col-flash"), 1800);
  }, 320);
}

function renderItineraryFilters() {
  const wrap = document.getElementById("itinerary-filters");
  if (!wrap) return;
  const cities = [];
  const seen = new Set();
  TRIP.days.forEach((d) => {
    if (!seen.has(d.cityId)) {
      seen.add(d.cityId);
      cities.push(cityById(d.cityId));
    }
  });
  wrap.innerHTML = `
    <button type="button" class="day-filter ${state.itineraryFilter === "all" ? "active" : ""}" data-itin-filter="all">All days</button>
    ${cities
      .filter(Boolean)
      .map(
        (c) =>
          `<button type="button" class="day-filter ${state.itineraryFilter === c.id ? "active" : ""}" data-itin-filter="${c.id}">${escapeHtml(c.name)}</button>`
      )
      .join("")}`;
}

function filteredItineraryDays() {
  if (state.itineraryFilter === "all") return TRIP.days;
  if (TRIP.days.some((d) => d.id === state.itineraryFilter)) {
    return TRIP.days.filter((d) => d.id === state.itineraryFilter);
  }
  return TRIP.days.filter((d) => d.cityId === state.itineraryFilter);
}

function showWishPreview(wishId, anchorEl) {
  const wish = state.wishes.find((w) => w.id === wishId);
  const pop = document.getElementById("wish-preview");
  if (!wish || !pop) return;
  const mapped = wish.lat != null && wish.lng != null;
  pop.classList.toggle("is-hidden", isHidden(wish));
  const pvTransit = wish.type === "transit" ? wishTransit(wish.meta) : null;
  const pvTime = pvTransit
    ? [pvTransit.mode, pvTransit.depart, pvTransit.duration].filter(Boolean).join(" · ")
    : wishTime(wish);
  const pvInfo = wishInfo(wish);
  pop.innerHTML = `
    <button type="button" class="wish-preview-close" data-preview-close aria-label="Close">×</button>
    <span class="wish-card-type">${escapeHtml(wish.type || "place")}</span>
    <strong>${escapeHtml(wish.label)}</strong>
    <p>${escapeHtml(wish.location_name || "No place yet")}</p>
    ${pvTime ? `<p class="wish-preview-time">${escapeHtml(pvTime)}</p>` : ""}
    ${pvInfo ? `<div class="wish-preview-info">${escapeHtml(pvInfo).split(/\n+/).map((para) => `<p>${para}</p>`).join("")}</div>` : ""}
    <div class="wish-preview-actions">
      ${mapped ? `<button type="button" class="chip-link ghost" data-preview-map="${wish.id}">On map</button>` : ""}
      <button type="button" class="chip-link ghost" data-preview-edit="${wish.id}">Edit</button>
      <button type="button" class="chip-link ghost" data-preview-board="${wish.id}">Board</button>
    </div>`;
  pop.hidden = false;
  const rect = anchorEl.getBoundingClientRect();
  const top = Math.min(window.innerHeight - 180, rect.bottom + 8);
  let left = rect.left;
  if (left + 300 > window.innerWidth - 16) left = window.innerWidth - 316;
  pop.style.top = `${Math.max(12, top)}px`;
  pop.style.left = `${Math.max(12, left)}px`;
}

function hideWishPreview() {
  const pop = document.getElementById("wish-preview");
  if (pop) pop.hidden = true;
}

function initWishPreview() {
  document.getElementById("wish-preview")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-preview-close]")) {
      hideWishPreview();
      return;
    }
    const map = e.target.closest("[data-preview-map]");
    if (map) {
      hideWishPreview();
      closeItinerary();
      focusWish(map.dataset.previewMap);
      return;
    }
    const edit = e.target.closest("[data-preview-edit]");
    if (edit) {
      hideWishPreview();
      openWishModal({ wishId: edit.dataset.previewEdit });
      return;
    }
    const board = e.target.closest("[data-preview-board]");
    if (board) {
      hideWishPreview();
      closeItinerary();
      openWishOnBoard(board.dataset.previewBoard);
    }
  });

  // The popover is fixed-position: it must not float free of its anchor, so any
  // scroll dismisses it, and clicking anywhere outside closes it.
  window.addEventListener("scroll", () => hideWishPreview(), { capture: true, passive: true });
  document.addEventListener("click", (e) => {
    const pop = document.getElementById("wish-preview");
    if (!pop || pop.hidden) return;
    if (e.target.closest("#wish-preview") || e.target.closest("[data-preview-wish]") || e.target.closest("[data-min-open]") || e.target.closest("[data-info]")) return;
    hideWishPreview();
  });
}

function renderTimeline() {
  const list = document.getElementById("timeline-list");
  if (!list) return;
  const days = filteredItineraryDays();
  list.innerHTML = days.length
    ? days
        .map((d) => {
          const city = cityById(d.cityId);
          const wishes = wishesForDay(d.id).filter((w) => !isGroup(w));
          const mapped = wishes.filter((w) => w.lat != null).length;
          return `
      <article class="day-card visible" id="day-${d.id}">
        <div class="day-meta">
          <span>${shortDate(d.date)}</span>
          <span class="day-city">${city ? city.nameJa + " · " + city.name : ""}</span>
          <span class="day-weather" data-weather-for="${d.cityId}" data-date="${d.date}">…</span>
        </div>
        <div class="day-title-row">
          <h3 class="day-title">${escapeHtml(d.title)}</h3>
        </div>
        <div class="day-toolbar">
          <button type="button" class="text-link is-caps" data-add-wish-day="${d.id}">+ Sushi</button>
          <button type="button" class="text-link is-caps" data-show-day="${d.id}">${mapped ? `${mapped} on map` : "Map"}</button>
        </div>
        <ul class="day-slots">
          <li><span>Morning</span> ${escapeHtml(d.morning)}</li>
          <li><span>Afternoon</span> ${escapeHtml(d.afternoon)}</li>
          <li><span>Evening</span> ${escapeHtml(d.evening)}</li>
        </ul>
        ${
          wishes.length
            ? `<div class="day-wishes">${wishes
                .map(
                  (w) => `<button type="button" class="day-wish-chip" data-preview-wish="${w.id}"><span class="pin"></span>${escapeHtml(w.label)}</button>`
                )
                .join("")}</div>`
            : `<p class="day-empty">No sushi yet — add one for this day</p>`
        }
        <div class="day-extra">
          <span>${escapeHtml(d.food)}</span>
          <span>${escapeHtml(d.transit)}</span>
        </div>
      </article>`;
        })
        .join("")
    : `<p class="day-empty">No days match this filter</p>`;

  if (!state.timelineBound) {
    state.timelineBound = true;
    list.addEventListener("click", (e) => {
      const preview = e.target.closest("[data-preview-wish]");
      if (preview) {
        showWishPreview(preview.dataset.previewWish, preview);
        return;
      }
      const add = e.target.closest("[data-add-wish-day]");
      if (add) {
        openWishModal({ dayId: add.dataset.addWishDay });
        return;
      }
      const boardDay = e.target.closest("[data-view-board-day]");
      if (boardDay) {
        viewBoardDay(boardDay.dataset.viewBoardDay);
        return;
      }
      const dayMap = e.target.closest("[data-show-day]");
      if (dayMap) {
        closeItinerary();
        showDayOnMap(dayMap.dataset.showDay);
      }
    });

    document.getElementById("itinerary-close")?.addEventListener("click", closeItinerary);
    document.getElementById("itinerary-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "itinerary-overlay") closeItinerary();
    });
    document.getElementById("itinerary-filters")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-itin-filter]");
      if (!btn) return;
      state.itineraryFilter = btn.dataset.itinFilter;
      renderItineraryFilters();
      renderTimeline();
    });
    document.getElementById("itinerary-prev")?.addEventListener("click", () => {
      const days = TRIP.days;
      const cur = state.itineraryFocusDay || days[0]?.id;
      const idx = Math.max(0, days.findIndex((d) => d.id === cur) - 1);
      state.itineraryFocusDay = days[idx].id;
      state.itineraryFilter = days[idx].id;
      renderItineraryFilters();
      renderTimeline();
      document.getElementById(`day-${days[idx].id}`)?.scrollIntoView({ block: "start" });
    });
    document.getElementById("itinerary-next")?.addEventListener("click", () => {
      const days = TRIP.days;
      const cur = state.itineraryFocusDay || days[0]?.id;
      const idx = Math.min(days.length - 1, days.findIndex((d) => d.id === cur) + 1);
      state.itineraryFocusDay = days[idx].id;
      state.itineraryFilter = days[idx].id;
      renderItineraryFilters();
      renderTimeline();
      document.getElementById(`day-${days[idx].id}`)?.scrollIntoView({ block: "start" });
    });

  }

  fetchWeather();
}

function initShinkansen() {
  if (state.shinkansenBound) return;
  const train = document.getElementById("shinkansen");
  const wrap = document.querySelector(".timeline-wrap");
  const rail = document.querySelector(".rail");
  if (!train || !wrap || !rail) return;
  state.shinkansenBound = true;
  function update() {
    const rect = wrap.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    train.style.top = (scrolled / total) * (rail.clientHeight - 20) + "px";
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

async function fetchWeather() {
  const unique = {};
  TRIP.days.forEach((d) => {
    const c = cityById(d.cityId);
    if (c) unique[d.cityId] = c;
  });
  for (const city of Object.values(unique)) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=16`;
      const res = await fetch(url);
      const data = await res.json();
      document.querySelectorAll(`[data-weather-for="${city.id}"]`).forEach((el) => {
        const idx = data.daily.time.indexOf(el.dataset.date);
        el.textContent =
          idx >= 0
            ? `${Math.round(data.daily.temperature_2m_min[idx])}–${Math.round(data.daily.temperature_2m_max[idx])}°C`
            : "—";
      });
    } catch {
      document.querySelectorAll(`[data-weather-for="${city.id}"]`).forEach((el) => {
        el.textContent = "—";
      });
    }
  }
}

/* ---------- Shopping ---------- */

function getShopping() {
  return state.shopping;
}

async function refreshShopping() {
  state.shopping = await ShopStore.list();
  renderBuyList();
  renderShopIdeas();
  renderShopProgress();
  renderMapIndex();
  syncMapMarkers();
  renderFilterCounts();
}

function renderBuyList() {
  const list = document.getElementById("shop-list");
  if (!list) return;
  const items = getShopping();
  list.innerHTML = items.length
    ? items
        .map(
          (item) => `
    <li class="shop-item ${item.done ? "done" : ""}" data-id="${item.id}">
      <button type="button" class="shop-check" data-action="toggle" aria-label="Toggle bought">${item.done ? "✓" : ""}</button>
      <div>
        <span class="shop-item-text">${escapeHtml(item.text)}</span>
        ${
          item.where
            ? `<span class="shop-item-where">${escapeHtml(item.where)}</span>`
            : `<span class="shop-item-where muted">No place pinned</span>`
        }
      </div>
      <div class="shop-item-right">
        ${
          item.lat != null && !item.done
            ? `<button type="button" class="text-link is-caps" data-focus-shop="${item.id}">On map</button>`
            : ""
        }
        <button type="button" class="icon-btn is-bare is-sm shop-delete" data-action="delete" aria-label="Remove">×</button>
      </div>
    </li>`
        )
        .join("")
    : `<li class="day-empty">Buy list is empty — promote an idea or add an item</li>`;
  renderShopProgress();
}

function getPromoted() {
  return new Set(loadJSON(STORE.promoted, []));
}

function savePromoted(set) {
  saveJSON(STORE.promoted, [...set]);
}

function openShopModal() {
  document.getElementById("shop-modal").hidden = false;
  document.getElementById("shop-item").focus();
}

function closeShopModal() {
  document.getElementById("shop-modal").hidden = true;
  document.getElementById("shop-item").value = "";
  document.getElementById("shop-where").value = "";
  state.shopLocPick = null;
  document.getElementById("shop-loc-selected").hidden = true;
}

function initShopping() {
  const list = document.getElementById("shop-list");

  document.getElementById("open-shop-modal")?.addEventListener("click", openShopModal);
  document.getElementById("shop-modal-close")?.addEventListener("click", closeShopModal);
  document.getElementById("shop-modal-cancel")?.addEventListener("click", closeShopModal);
  document.getElementById("shop-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "shop-modal") closeShopModal();
  });

  bindAutocomplete(
    document.getElementById("shop-where"),
    document.getElementById("shop-loc-suggest"),
    (pick) => applyLocPick("shop", pick),
    () => {
      if (state.shopLocPick && document.getElementById("shop-where").value.trim() !== state.shopLocPick.location_name) {
        state.shopLocPick = null;
        document.getElementById("shop-loc-selected").hidden = true;
      }
    }
  );

  function renderBuyList() {
    const items = getShopping();
    list.innerHTML = items.length
      ? items
          .map(
            (item) => `
      <li class="shop-item ${item.done ? "done" : ""}" data-id="${item.id}">
        <button type="button" class="shop-check" data-action="toggle" aria-label="Toggle bought">${item.done ? "✓" : ""}</button>
        <div>
          <span class="shop-item-text">${escapeHtml(item.text)}</span>
          ${
            item.where
              ? `<span class="shop-item-where">${escapeHtml(item.where)}</span>`
              : `<span class="shop-item-where muted">No place pinned</span>`
          }
        </div>
        <div class="shop-item-right">
          ${
            item.lat != null && !item.done
              ? `<button type="button" class="text-link is-caps" data-focus-shop="${item.id}">On map</button>`
              : ""
          }
          <button type="button" class="icon-btn is-bare is-sm shop-delete" data-action="delete" aria-label="Remove">×</button>
        </div>
      </li>`
          )
          .join("")
      : `<li class="day-empty">Buy list is empty — promote an idea or add an item</li>`;
    renderShopProgress();
  }

  list.addEventListener("click", async (e) => {
    const focusShop = e.target.closest("[data-focus-shop]");
    if (focusShop) {
      focusShopOnMap(focusShop.dataset.focusShop);
      return;
    }
    const btn = e.target.closest("[data-action]");
    const row = e.target.closest(".shop-item");
    if (!btn || !row) return;
    const id = row.dataset.id;
    if (btn.dataset.action === "delete") {
      await ShopStore.remove(id);
    } else {
      const item = getShopping().find((s) => s.id === id);
      if (item) await ShopStore.update(id, { done: !item.done });
    }
    await refreshShopping();
  });

  document.getElementById("shop-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("shop-item").value.trim();
    if (!text) return;
    let where = state.shopLocPick?.location_name || document.getElementById("shop-where").value.trim();
    let lat = state.shopLocPick?.lat ?? null;
    let lng = state.shopLocPick?.lng ?? null;
    if (where && lat == null) {
      try {
        const results = await searchPlaces(where);
        if (results[0]) {
          lat = results[0].lat;
          lng = results[0].lng;
          where = results[0].location_name;
        }
      } catch { /* ignore */ }
    }
    await ShopStore.create({ text, where: where || "", lat, lng, done: false });
    closeShopModal();
    await refreshShopping();
  });

  document.getElementById("shop-ideas").addEventListener("click", async (e) => {
    const board = e.target.closest("[data-open-wish]");
    if (board) {
      openWishOnBoard(board.dataset.openWish);
      return;
    }
    const btn = e.target.closest("[data-promote]");
    if (!btn) return;
    const wishId = btn.dataset.wish;
    const text = decodeURIComponent(btn.dataset.text || "");
    const wish = state.wishes.find((w) => w.id === wishId);
    const created = await ShopStore.create({
      text,
      where: wish?.location_name || "",
      lat: wish?.lat ?? null,
      lng: wish?.lng ?? null,
      done: false,
      fromWishId: wishId,
    });
    const promoted = getPromoted();
    promoted.add(ideaKey(wishId, text));
    savePromoted(promoted);
    await refreshShopping();
    if (wish?.lat != null && wish?.lng != null && created?.id) {
      focusShopOnMap(created.id);
    }
  });
}

function renderShopIdeas() {
  const promoted = getPromoted();
  // An idea is also "promoted" when a buy-list row (possibly a friend's) came from it
  getShopping().forEach((s) => {
    if (s.fromWishId) promoted.add(ideaKey(s.fromWishId, s.text));
  });
  const ideas = [];
  visibleWishes()
    .filter((w) => w.type === "shop")
    .forEach((w) => {
      WishStore.normalizeItems(w.items).forEach((text) => {
        if (!promoted.has(ideaKey(w.id, text))) {
          ideas.push({ wishId: w.id, wishLabel: w.label, text, where: w.location_name || "" });
        }
      });
    });
  const panel = document.getElementById("shop-ideas-panel");
  const list = document.getElementById("shop-ideas");
  if (!ideas.length) {
    list.innerHTML = `<li class="day-empty">Wish list is empty — add items on a shop sushi</li>`;
    panel.hidden = false;
    return;
  }
  list.innerHTML = ideas
    .map(
      (idea) => `
    <li class="idea-item">
      <button type="button" class="idea-body" data-open-wish="${idea.wishId}" title="Open source wish on the board">
        <strong>${escapeHtml(idea.text)}</strong>
        <small>${escapeHtml(idea.wishLabel)}${idea.where ? " · " + escapeHtml(idea.where) : ""}</small>
      </button>
      <button type="button" class="icon-btn is-sm idea-add" data-promote data-wish="${idea.wishId}" data-text="${encodeURIComponent(idea.text)}" title="Move to buy list" aria-label="Move to buy list">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </li>`
    )
    .join("");
  panel.hidden = false;
}

function renderShopProgress() {
  const el = document.getElementById("shop-progress");
  if (!el) return;
  const items = getShopping();
  const done = items.filter((i) => i.done).length;
  const mapped = items.filter((i) => !i.done && i.lat != null).length;
  const ideas = document.querySelectorAll("#shop-ideas .idea-item").length;
  el.innerHTML = `
    <span><strong>${done}</strong>/${items.length || 0} bought</span>
    <button type="button" class="pulse-link" data-go="map">${mapped} open on map</button>
    <span>${ideas} on the wish list</span>`;
}

/* ---------- Food tastes ---------- */

function renderTastes() {
  const tried = loadJSON(STORE.tastes, {});
  const tastes = [];
  visibleWishes()
    .filter((w) => w.type === "food")
    .forEach((w) => {
      const items = WishStore.normalizeItems(w.items);
      if (items.length) {
        items.forEach((name) => {
          tastes.push({
            id: `${w.id}::${name}`,
            wishId: w.id,
            name,
            place: w.label,
            location_name: w.location_name,
            lat: w.lat,
            lng: w.lng,
          });
        });
      } else {
        tastes.push({
          id: `${w.id}::${w.label}`,
          wishId: w.id,
          name: w.label,
          place: w.location_name || "Food wish",
          location_name: w.location_name,
          lat: w.lat,
          lng: w.lng,
        });
      }
    });

  // Untried first, then places that already have a map pin
  tastes.sort((a, b) => {
    const ta = tried[a.id] ? 1 : 0;
    const tb = tried[b.id] ? 1 : 0;
    if (ta !== tb) return ta - tb;
    const ma = a.lat != null ? 0 : 1;
    const mb = b.lat != null ? 0 : 1;
    return ma - mb || a.name.localeCompare(b.name);
  });

  const grid = document.getElementById("tastes-grid");
  const progress = document.getElementById("tastes-progress");
  const doneCount = tastes.filter((t) => tried[t.id]).length;
  if (progress) {
    progress.innerHTML = tastes.length
      ? `<span><strong>${doneCount}</strong>/${tastes.length} tried</span>
         <button type="button" class="pulse-link" data-filter-jump="food">Show food on map</button>`
      : "";
  }

  if (!tastes.length) {
    grid.innerHTML = `<p class="day-empty">Add a food sushi with dishes on the <button type="button" class="pulse-link" data-go="board">wish board</button>.</p>`;
    return;
  }
  grid.innerHTML = tastes
    .map((t) => {
      const done = !!tried[t.id];
      return `
      <div class="taste-row ${done ? "tried" : ""}" data-taste="${escapeHtml(t.id)}">
        <button type="button" class="taste-main" data-taste-toggle aria-pressed="${done}">
          <span class="taste-mark" aria-hidden="true">${done ? "済" : "味"}</span>
          <span class="taste-copy">
            <strong>${escapeHtml(t.name)}</strong>
            <small>${escapeHtml(t.place)}</small>
          </span>
          <span class="taste-status">${done ? "Tried" : "Try"}</span>
        </button>
      </div>`;
    })
    .join("");

  grid.onclick = (e) => {
    const focus = e.target.closest("[data-focus-wish]");
    if (focus) {
      e.stopPropagation();
      focusWish(focus.dataset.focusWish);
      return;
    }
    const board = e.target.closest("[data-open-wish]");
    if (board) {
      e.stopPropagation();
      openWishOnBoard(board.dataset.openWish);
      return;
    }
    if (!e.target.closest("[data-taste-toggle]") && !e.target.closest(".taste-main")) return;
    const row = e.target.closest("[data-taste]");
    if (!row) return;
    const id = row.dataset.taste;
    const data = loadJSON(STORE.tastes, {});
    if (data[id]) delete data[id];
    else data[id] = true;
    saveJSON(STORE.tastes, data);
    renderTastes();
  };

}

/* ---------- Packing / tips ---------- */

function renderPackingProgress() {
  const el = document.getElementById("packing-progress");
  if (!el) return;
  const checked = loadJSON(STORE.packing, {});
  const total = (TRIP.packing || []).length;
  const done = Object.keys(checked).length;
  el.innerHTML = `<span><strong>${done}</strong>/${total} packed</span>
    <button type="button" class="pulse-link" data-go="board">Leave room for the haul</button>`;
}

function initPacking() {
  const checked = loadJSON(STORE.packing, {});
  const grid = document.getElementById("packing-grid");
  grid.innerHTML = TRIP.packing
    .map(
      (p) => `
    <label class="pack-item">
      <input type="checkbox" data-id="${p.id}" ${checked[p.id] ? "checked" : ""} />
      <span class="pack-check"></span>
      <span class="pack-text">${escapeHtml(p.label)}</span>
    </label>`
    )
    .join("");
  renderPackingProgress();
  grid.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    const data = loadJSON(STORE.packing, {});
    if (e.target.checked) data[e.target.dataset.id] = true;
    else delete data[e.target.dataset.id];
    saveJSON(STORE.packing, data);
    renderPackingProgress();
  });
}

function initTips() {
  document.getElementById("tips-grid").innerHTML = (TRIP.tips || [])
    .map(
      (t) => `
    <article class="tip-card pin-card">
      <h3>${escapeHtml(t.title)}</h3>
      <p>${escapeHtml(t.body)}</p>
    </article>`
    )
    .join("");
}

/* ---------- Footer reference modals (packing / tips) ---------- */

function initFooterModals() {
  const wire = (openId, modalId, closeId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    document.getElementById(openId)?.addEventListener("click", () => {
      modal.hidden = false;
    });
    document.getElementById(closeId)?.addEventListener("click", () => {
      modal.hidden = true;
    });
    modal.addEventListener("click", (e) => {
      if (e.target.id === modalId) modal.hidden = true;
    });
  };
  wire("open-packing", "packing-modal", "packing-close");
  wire("open-tips", "tips-modal", "tips-close");

  // Reference docs (visa, bookings, money, october) share one modal
  const docModal = document.getElementById("doc-modal");
  document.querySelectorAll("[data-doc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const doc = (TRIP.docs || []).find((d) => d.id === btn.dataset.doc);
      if (!doc || !docModal) return;
      document.getElementById("doc-modal-title").textContent = doc.title;
      document.getElementById("doc-modal-body").innerHTML =
        (doc.body || []).map((para) => `<p>${escapeHtml(para)}</p>`).join("") +
        ((doc.links || []).length
          ? `<div class="doc-links">${doc.links
              .map((l) => `<a href="${escapeHtml(l.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} ↗</a>`)
              .join("")}</div>`
          : "");
      docModal.hidden = false;
    });
  });
  document.getElementById("doc-modal-close")?.addEventListener("click", () => (docModal.hidden = true));
  docModal?.addEventListener("click", (e) => {
    if (e.target.id === "doc-modal") docModal.hidden = true;
  });
}

/* ---------- Boot ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  const safe = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`[boot] ${name}`, err);
    }
  };

  safe("lantern", initLantern);
  safe("starfield", initStarfield);
  safe("hero", initHero);
  safe("dock", initDock);
  safe("sync", updateSyncPill);
  safe("kanban", initKanban);
  safe("preview", initWishPreview);
  safe("picker", initLocationPicker);
  safe("wishForm", initWishForm);
  safe("groupModal", initGroupModal);
  safe("map", initMap);
  safe("shopping", initShopping);
  safe("packing", initPacking);
  safe("tips", initTips);
  safe("footerModals", initFooterModals);

  document.getElementById("tastes")?.addEventListener("click", (e) => {
    const jump = e.target.closest("[data-filter-jump]");
    if (!jump) return;
    setTypeFilter(jump.dataset.filterJump);
    scrollToSection("map");
  });

  try {
    await refreshShopping();
    await refreshWishes();
    await ensureCloudSeeds();
    await ensureHiddenSeeds();
    await ensureTransitSeeds();
    await ensureGroupSeeds();
    await ensureInfoEnrichment();
  } catch (err) {
    console.error(err);
    document.getElementById("sync-pill").textContent = "Error";
  }

  WishStore.subscribe(() => refreshWishes().catch(console.error));
  ShopStore.subscribe(() => refreshShopping().catch(console.error));
});
