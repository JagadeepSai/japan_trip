/**
 * Wishes API — Supabase when configured, otherwise localStorage.
 * meta: [{ key, value }]
 * items: string[]  — food dishes or shop product ideas
 */

const WishStore = (() => {
  // v5 = the curated initial database from docs/plan.md + docs/things-to-do.md
  // (deliberately NOT migrated from older keys — fresh start for everyone)
  const LOCAL_KEY = "jp-wishes-v5";
  let client = null;
  let mode = "local";

  function normalizeMeta(meta) {
    if (!Array.isArray(meta)) return [];
    return meta
      .filter((m) => m && String(m.key || "").trim())
      .map((m) => ({ key: String(m.key).trim(), value: String(m.value ?? "").trim() }));
  }

  function normalizeItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map((x) => String(x || "").trim()).filter(Boolean);
  }

  function ensureClient() {
    if (client || !isSupabaseConfigured()) return client;
    if (typeof supabase === "undefined" || !supabase.createClient) {
      console.warn("Supabase SDK missing — falling back to localStorage");
      return null;
    }
    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    mode = "supabase";
    return client;
  }

  function seedItemsFor(label) {
    const hit = (TRIP.seedWishes || []).find((s) => s.label === label);
    return normalizeItems(hit?.items || []);
  }

  function normalizeWish(w, i = 0) {
    let items = normalizeItems(w.items || []);
    // Older local rows had no items[]; fill from seed for food/shop labels
    if (!items.length && (w.type === "food" || w.type === "shop")) {
      items = seedItemsFor(w.label);
    }
    return {
      id: w.id || crypto.randomUUID(),
      label: w.label,
      type: w.type || "place",
      location_name: w.location_name || w.city || "",
      lat: w.lat ?? null,
      lng: w.lng ?? null,
      day_id: w.day_id ?? null,
      sort_order: w.sort_order ?? w.order ?? i,
      // Committed stop (routed by the red thread) vs a "maybe" idea. Default true
      // so pre-active rows keep behaving as before.
      active: w.active !== false,
      meta: normalizeMeta(w.meta || []),
      items,
      created_at: w.created_at || new Date().toISOString(),
    };
  }

  function seedLocal() {
    const existing = localStorage.getItem(LOCAL_KEY);
    if (existing) {
      try {
        const rows = JSON.parse(existing).map((w, i) => normalizeWish(w, i));
        // Persist item enrichment from seed labels (does not re-add deleted wishes)
        localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
        return rows;
      } catch {
        localStorage.removeItem(LOCAL_KEY);
      }
    }

    // Fresh seed: bundles first (so members can link to their generated ids)
    const groupIds = {};
    const groupRows = (TRIP.seedGroups || []).map((g, i) => {
      const id = crypto.randomUUID();
      groupIds[g.key] = id;
      return normalizeWish(
        {
          id,
          label: g.label,
          type: "group",
          day_id: g.day_id ?? null,
          sort_order: g.sort_order ?? i,
          meta: [
            { key: "group:start", value: g.start || "" },
            { key: "group:end", value: g.end || g.start || "" },
          ],
          items: [],
        },
        i
      );
    });
    const wishRows = (TRIP.seedWishes || []).map((w, i) => {
      const meta = [...(w.meta || [])];
      if (w.groupKey && groupIds[w.groupKey]) meta.push({ key: "group", value: groupIds[w.groupKey] });
      return normalizeWish({ ...w, meta }, i);
    });
    const seed = [...groupRows, ...wishRows];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(seed));
    return seed;
  }

  async function list() {
    const sb = ensureClient();
    if (sb) {
      const { data, error } = await sb
        .from("wishes")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((w) => ({
        ...w,
        meta: normalizeMeta(w.meta),
        items: normalizeItems(w.items),
      }));
    }
    return seedLocal();
  }

  async function create(wish) {
    const payload = {
      label: wish.label,
      type: wish.type || "place",
      location_name: wish.location_name || null,
      lat: wish.lat ?? null,
      lng: wish.lng ?? null,
      day_id: wish.day_id ?? null,
      sort_order: wish.sort_order ?? 0,
      active: wish.active !== false,
      meta: normalizeMeta(wish.meta),
      items: normalizeItems(wish.items),
    };
    const sb = ensureClient();
    if (sb) {
      const { data, error } = await sb.from("wishes").insert(payload).select().single();
      if (error) throw error;
      return {
        ...data,
        meta: normalizeMeta(data.meta),
        items: normalizeItems(data.items),
      };
    }
    const rows = seedLocal();
    const row = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
    rows.push(row);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
    return row;
  }

  async function update(id, patch) {
    const next = { ...patch };
    if (next.meta) next.meta = normalizeMeta(next.meta);
    if (next.items) next.items = normalizeItems(next.items);
    const sb = ensureClient();
    if (sb) {
      const { data, error } = await sb.from("wishes").update(next).eq("id", id).select().single();
      if (error) throw error;
      return {
        ...data,
        meta: normalizeMeta(data.meta),
        items: normalizeItems(data.items),
      };
    }
    const rows = seedLocal().map((w) => (w.id === id ? { ...w, ...next } : w));
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
    return rows.find((w) => w.id === id);
  }

  async function remove(id) {
    const sb = ensureClient();
    if (sb) {
      const { error } = await sb.from("wishes").delete().eq("id", id);
      if (error) throw error;
      return;
    }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(seedLocal().filter((w) => w.id !== id)));
  }

  function subscribe(onChange) {
    const sb = ensureClient();
    if (!sb) return () => {};
    const channel = sb
      .channel("wishes-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "wishes" }, () => onChange())
      .subscribe();
    return () => sb.removeChannel(channel);
  }

  function getMode() {
    ensureClient();
    return mode;
  }

  return { list, create, update, remove, subscribe, getMode, normalizeMeta, normalizeItems };
})();

/**
 * Shopping buy-list API — same dual-mode pattern as WishStore.
 * Rows: { id, text, where, lat, lng, done, fromWishId, created_at }
 * (DB columns: text, place, lat, lng, done, from_wish_id)
 */
const ShopStore = (() => {
  const LOCAL_KEY = "jp-shopping-v4"; // v4: fresh with the curated initial database
  let client = null;
  let mode = "local";

  function ensureClient() {
    if (client || !isSupabaseConfigured()) return client;
    if (typeof supabase === "undefined" || !supabase.createClient) return null;
    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    mode = "supabase";
    return client;
  }

  const fromDb = (r) => ({
    id: r.id,
    text: r.text,
    where: r.place || "",
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    done: !!r.done,
    fromWishId: r.from_wish_id || null,
    created_at: r.created_at,
  });

  const toDb = (s) => ({
    text: s.text,
    place: s.where || null,
    lat: s.lat ?? null,
    lng: s.lng ?? null,
    done: !!s.done,
    from_wish_id: s.fromWishId ?? null,
  });

  function localRows() {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        localStorage.removeItem(LOCAL_KEY);
      }
    }
    const seed = (TRIP.seedShopping || []).map((s) => ({
      id: crypto.randomUUID(),
      text: s.text,
      where: s.where || "",
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      done: false,
    }));
    localStorage.setItem(LOCAL_KEY, JSON.stringify(seed));
    return seed;
  }

  async function list() {
    const sb = ensureClient();
    if (sb) {
      const { data, error } = await sb.from("shopping").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(fromDb);
    }
    return localRows();
  }

  async function create(item) {
    const sb = ensureClient();
    if (sb) {
      const { data, error } = await sb.from("shopping").insert(toDb(item)).select().single();
      if (error) throw error;
      return fromDb(data);
    }
    const rows = localRows();
    const row = { id: crypto.randomUUID(), ...item, done: !!item.done };
    rows.unshift(row);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
    return row;
  }

  async function update(id, patch) {
    const sb = ensureClient();
    if (sb) {
      const dbPatch = {};
      if ("done" in patch) dbPatch.done = !!patch.done;
      if ("text" in patch) dbPatch.text = patch.text;
      if ("where" in patch) dbPatch.place = patch.where || null;
      if ("lat" in patch) dbPatch.lat = patch.lat;
      if ("lng" in patch) dbPatch.lng = patch.lng;
      const { data, error } = await sb.from("shopping").update(dbPatch).eq("id", id).select().single();
      if (error) throw error;
      return fromDb(data);
    }
    const rows = localRows().map((s) => (s.id === id ? { ...s, ...patch } : s));
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
    return rows.find((s) => s.id === id);
  }

  async function remove(id) {
    const sb = ensureClient();
    if (sb) {
      const { error } = await sb.from("shopping").delete().eq("id", id);
      if (error) throw error;
      return;
    }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(localRows().filter((s) => s.id !== id)));
  }

  function subscribe(onChange) {
    const sb = ensureClient();
    if (!sb) return () => {};
    const channel = sb
      .channel("shopping-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "shopping" }, () => onChange())
      .subscribe();
    return () => sb.removeChannel(channel);
  }

  return { list, create, update, remove, subscribe };
})();

/**
 * Shared trip settings (e.g. trip start/end dates) — same dual-mode pattern.
 * DB table: settings(key text primary key, value jsonb)
 */
const SettingsStore = (() => {
  const LOCAL_KEY = "jp-settings-v1";
  let client = null;

  function ensureClient() {
    if (client || !isSupabaseConfigured()) return client;
    if (typeof supabase === "undefined" || !supabase.createClient) return null;
    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return client;
  }

  function localAll() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
    } catch {
      return {};
    }
  }

  async function get(key) {
    const sb = ensureClient();
    if (sb) {
      try {
        const { data, error } = await sb.from("settings").select("value").eq("key", key).maybeSingle();
        if (error) throw error;
        if (data) return data.value;
      } catch (err) {
        // table missing / offline — the local mirror keeps settings usable
        console.warn("[settings] cloud read failed, using local mirror:", err?.message || err);
      }
    }
    return localAll()[key] ?? null;
  }

  async function set(key, value) {
    // always write the local mirror first, so a failed cloud write (e.g. the
    // settings table not created yet) still persists on this device
    const all = localAll();
    all[key] = value;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    const sb = ensureClient();
    if (sb) {
      const { error } = await sb.from("settings").upsert({ key, value });
      if (error) throw error;
    }
  }

  function subscribe(onChange) {
    const sb = ensureClient();
    if (!sb) return () => {};
    const channel = sb
      .channel("settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => onChange())
      .subscribe();
    return () => sb.removeChannel(channel);
  }

  return { get, set, subscribe };
})();

/**
 * Google sign-in via Supabase Auth (supabase mode only) + per-user private
 * settings (RLS: auth.uid() = user_id). Used to sync the chat connection.
 */
const AuthStore = (() => {
  let client = null;

  function ensureClient() {
    if (client || !isSupabaseConfigured()) return client;
    if (typeof supabase === "undefined" || !supabase.createClient) return null;
    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return client;
  }

  const available = () => !!ensureClient();

  async function getUser() {
    const sb = ensureClient();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  }

  async function signInGoogle() {
    const sb = ensureClient();
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname },
    });
  }

  async function signOut() {
    await ensureClient()?.auth.signOut();
  }

  async function loadUserSettings() {
    const sb = ensureClient();
    const user = await getUser();
    if (!sb || !user) return null;
    const { data, error } = await sb.from("user_settings").select("value").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return data?.value || null;
  }

  async function saveUserSettings(patch) {
    const sb = ensureClient();
    const user = await getUser();
    if (!sb || !user) return;
    const current = (await loadUserSettings()) || {};
    const { error } = await sb.from("user_settings").upsert({ user_id: user.id, value: { ...current, ...patch } });
    if (error) throw error;
  }

  // fires on OAuth return / sign-out so the UI can follow the session
  function onChange(cb) {
    const sb = ensureClient();
    if (!sb) return () => {};
    const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user || null));
    return () => data?.subscription?.unsubscribe();
  }

  return { available, getUser, signInGoogle, signOut, loadUserSettings, saveUserSettings, onChange };
})();
