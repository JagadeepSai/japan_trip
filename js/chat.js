/**
 * 鳥居 Trip Chat — an AI chat that knows the itinerary.
 * Threads live in localStorage; the provider key never leaves this browser.
 * Providers: OpenAI-compatible (Groq / OpenRouter / OpenAI / custom·Ollama),
 * Google Gemini, Anthropic.
 */

const CHAT_THREADS_KEY = "jp-chat-threads-v1";
const CHAT_ACTIVE_KEY = "jp-chat-active";
const CHAT_CONFIG_KEY = "jp-chat-config";

const CHAT_PROVIDERS = {
  groq: {
    label: "Groq (free tier)",
    base: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"],
    keyUrl: "https://console.groq.com/keys",
  },
  gemini: {
    label: "Google Gemini (free tier)",
    base: "",
    model: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"],
    keyUrl: "https://aistudio.google.com/apikey",
  },
  openrouter: {
    label: "OpenRouter (:free models)",
    base: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    models: ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-exp:free", "deepseek/deepseek-r1:free", "mistralai/mistral-7b-instruct:free"],
    keyUrl: "https://openrouter.ai/settings/keys",
  },
  openai: {
    label: "OpenAI",
    base: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    label: "Anthropic",
    base: "https://api.anthropic.com",
    model: "claude-3-5-haiku-latest",
    models: ["claude-3-5-haiku-latest", "claude-3-7-sonnet-latest"],
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  custom: { label: "Custom / Ollama", base: "http://localhost:11434/v1", model: "llama3.2", models: [], keyUrl: "" },
};

const CHAT_STYLE_PROMPT = `You are the in-app assistant for a friends' Japan trip. Answer in GitHub-flavoured markdown.
Be concise and on point: aim for under 120 words, prefer short bullet lists, no filler or restating the question.
Ground answers in the itinerary context below when relevant. If you are unsure (prices, hours, availability), say so briefly. Never invent bookings.`;

const chatState = {
  threads: [],
  activeId: null,
  pills: [], // [{id,label}] events attached to the next message
  busy: false,
};

/* ---------- storage ---------- */

function chatLoad() {
  try {
    chatState.threads = JSON.parse(localStorage.getItem(CHAT_THREADS_KEY)) || [];
  } catch {
    chatState.threads = [];
  }
  chatState.activeId = localStorage.getItem(CHAT_ACTIVE_KEY);
  if (!chatState.threads.find((t) => t.id === chatState.activeId)) chatState.activeId = chatState.threads[0]?.id || null;
}

function chatSave() {
  localStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(chatState.threads.slice(0, 30)));
  if (chatState.activeId) localStorage.setItem(CHAT_ACTIVE_KEY, chatState.activeId);
}

function chatConfig() {
  try {
    return JSON.parse(localStorage.getItem(CHAT_CONFIG_KEY)) || {};
  } catch {
    return {};
  }
}

function activeThread() {
  return chatState.threads.find((t) => t.id === chatState.activeId) || null;
}

function chatNewThread() {
  const t = { id: crypto.randomUUID(), title: "New thread", createdAt: new Date().toISOString(), messages: [] };
  chatState.threads.unshift(t);
  chatState.activeId = t.id;
  chatSave();
  renderChat();
  return t;
}

/* ---------- trip context ---------- */

// A compact markdown snapshot of the CURRENT itinerary — regenerated per
// request so edits are always reflected
function buildTripContext() {
  const lines = [`# Itinerary — ${TRIP.days[0].date} → ${TRIP.days[TRIP.days.length - 1].date} (${TRIP.days.length} days)`];
  TRIP.days.forEach((d, i) => {
    const city = cityById(d.cityId);
    lines.push(`\n## D${i + 1} · ${d.date} · ${city?.name || ""} — ${d.title}`);
    const emit = (w, pad) => {
      const time = w.type === "transit" ? wishTransit(w.meta).depart : wishTime(w);
      lines.push(
        `${pad}- ${w.label}${w.type === "transit" ? " [transit]" : ""}${time ? ` @${time}` : ""} (~${formatDurationMin(wishDurationMin(w))}${w.active === false ? ", maybe" : ""})`
      );
    };
    dayTopLevel(d.id).forEach((t) => {
      if (isGroup(t)) {
        lines.push(`- ${t.label} (bundle):`);
        membersOf(t.id).forEach((m) => emit(m, "  "));
      } else emit(t, "");
    });
  });
  const inbox = dayTopLevel(null);
  lines.push(`\n## Unscheduled inbox (${inbox.length})`);
  inbox.slice(0, 45).forEach((w) => lines.push(`- ${w.label}`));
  return lines.join("\n");
}

function describeWishForChat(id) {
  const w = state.wishes.find((x) => x.id === id);
  if (!w) return "";
  const day = w.day_id ? dayById(w.day_id) : null;
  const city = wishCity(w);
  const time = w.type === "transit" ? wishTransit(w.meta).depart : wishTime(w);
  const info = wishInfo(w);
  return [
    `- ${w.label} (${w.type || "place"}${city ? ", " + city.name : ""}${day ? `, ${dayLabel(day)}` : ", unscheduled"}${time ? `, @${time}` : ""}, ~${formatDurationMin(wishDurationMin(w))})`,
    w.location_name ? `  location: ${w.location_name}` : "",
    info ? `  notes: ${info.slice(0, 220)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/* ---------- markdown (escape-first, so LLM output can't inject HTML) ---------- */

function mdToHtml(md) {
  const lines = escapeHtml(String(md || "")).split("\n");
  const out = [];
  let list = null;
  let inCode = false;
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };
  const inline = (s) =>
    s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|\W)\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  for (const raw of lines) {
    if (raw.trim().startsWith("```")) {
      closeList();
      inCode = !inCode;
      out.push(inCode ? "<pre><code>" : "</code></pre>");
      continue;
    }
    if (inCode) {
      out.push(raw);
      continue;
    }
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      closeList();
      const lvl = Math.min(6, h[1].length + 2);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    const li = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.*)/);
    if (li) {
      const want = /^\s*\d/.test(line) ? "ol" : "ul";
      if (list !== want) {
        closeList();
        out.push(`<${want}>`);
        list = want;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    if (line.startsWith("&gt;")) {
      closeList();
      out.push(`<blockquote>${inline(line.slice(4).trim())}</blockquote>`);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (inCode) out.push("</code></pre>");
  return out.join("");
}

/* ---------- providers ---------- */

async function callLLM(cfg, messages) {
  const provider = CHAT_PROVIDERS[cfg.provider] ? cfg.provider : "groq";
  const model = cfg.model || CHAT_PROVIDERS[provider].model;
  if (provider === "gemini") {
    const sys = messages.find((m) => m.role === "system")?.content || "";
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents, generationConfig: { maxOutputTokens: 700 } }),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 140)}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "(empty reply)";
  }
  if (provider === "anthropic") {
    const sys = messages.find((m) => m.role === "system")?.content || "";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system: sys,
        messages: messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 140)}`);
    const data = await res.json();
    return data?.content?.map((c) => c.text).join("") || "(empty reply)";
  }
  const base = provider === "custom" ? (cfg.baseUrl || CHAT_PROVIDERS.custom.base).replace(/\/$/, "") : CHAT_PROVIDERS[provider].base;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
    body: JSON.stringify({ model, messages, max_tokens: 700, temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${(await res.text()).slice(0, 140)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "(empty reply)";
}

/* ---------- UI ---------- */

function chatOpen(open = true) {
  const panel = document.getElementById("chat-panel");
  if (!panel) return;
  panel.hidden = !open;
  document.getElementById("chat-fab")?.classList.toggle("on", open);
  if (open) {
    if (!chatState.threads.length) chatNewThread();
    renderChat();
    document.getElementById("chat-input")?.focus();
  }
}

function chatAddPill(wishId) {
  const w = state.wishes.find((x) => x.id === wishId);
  if (!w) return;
  if (!chatState.pills.some((p) => p.id === wishId)) chatState.pills.push({ id: wishId, label: w.label });
  hideWishPreview();
  chatOpen(true);
  renderChatPills();
}

function renderChatPills() {
  const wrap = document.getElementById("chat-pills");
  if (!wrap) return;
  wrap.innerHTML = chatState.pills
    .map(
      (p) => `<span class="chat-pill" data-type="pill">${escapeHtml(p.label)}
        <button type="button" data-pill-remove="${p.id}" aria-label="Remove ${escapeHtml(p.label)}">×</button></span>`
    )
    .join("");
  wrap.hidden = !chatState.pills.length;
}

function renderChatThreads() {
  const sel = document.getElementById("chat-threads");
  if (!sel) return;
  sel.innerHTML = chatState.threads
    .map((t) => `<option value="${t.id}" ${t.id === chatState.activeId ? "selected" : ""}>${escapeHtml(t.title.slice(0, 34))}</option>`)
    .join("");
}

function renderChat() {
  renderChatThreads();
  renderChatPills();
  const log = document.getElementById("chat-log");
  if (!log) return;
  const t = activeThread();
  const cfg = chatConfig();
  if (!t || !t.messages.length) {
    log.innerHTML = `<div class="chat-empty">
      <svg class="chat-empty-torii" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#b23a2e" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 6.2c3 .9 15 .9 18 0"/><path d="M5.2 6.6V19M18.8 6.6V19"/><path d="M4.5 10.8h15"/><path d="M12 6.9v3.9"/></svg>
      <p>Ask anything about the trip — the chat reads the live itinerary.</p>
      <p class="soft">${cfg.apiKey || cfg.provider === "custom" ? `Connected: ${escapeHtml(CHAT_PROVIDERS[cfg.provider]?.label || cfg.provider || "")}` : "Not connected yet — open ⚙ and paste a free Groq / Gemini / OpenRouter key (stored only in this browser)."}</p>
      <p class="soft">Tip: the chat-bubble icon on any event card attaches it here.</p>
    </div>`;
    return;
  }
  log.innerHTML = t.messages
    .map((m) => {
      const pills = (m.pills || []).map((p) => `<span class="chat-pill is-sent">${escapeHtml(p.label)}</span>`).join("");
      if (m.role === "user") return `<div class="chat-msg is-user">${pills}${mdToHtml(m.content)}</div>`;
      return `<div class="chat-msg is-ai ${m.error ? "is-error" : ""}">${mdToHtml(m.content)}</div>`;
    })
    .join("");
  if (chatState.busy) log.insertAdjacentHTML("beforeend", `<div class="chat-msg is-ai is-busy"><span></span><span></span><span></span></div>`);
  log.scrollTop = log.scrollHeight;
}

async function chatSend(text) {
  const t = activeThread() || chatNewThread();
  const cfg = chatConfig();
  const pills = [...chatState.pills];
  t.messages.push({ role: "user", content: text, pills });
  if (t.title === "New thread" && text) t.title = text.slice(0, 40);
  chatState.pills = [];
  chatSave();
  if (!cfg.apiKey && cfg.provider !== "custom") {
    t.messages.push({ role: "assistant", content: "Not connected yet — open **⚙** and add a provider key (free options: Groq, Google Gemini, OpenRouter).", error: true });
    chatSave();
    renderChat();
    return;
  }
  chatState.busy = true;
  renderChat();
  try {
    const sys = `${CHAT_STYLE_PROMPT}\n\n${buildTripContext()}`;
    const history = t.messages.slice(-12).map((m, i, arr) => {
      let content = m.content;
      if (m.pills?.length) content += `\n\n[Attached events]\n${m.pills.map((p) => describeWishForChat(p.id)).join("\n")}`;
      return { role: m.role, content };
    });
    const reply = await callLLM(cfg, [{ role: "system", content: sys }, ...history]);
    t.messages.push({ role: "assistant", content: reply });
  } catch (err) {
    t.messages.push({ role: "assistant", content: `⚠ ${err.message}`, error: true });
  }
  chatState.busy = false;
  chatSave();
  renderChat();
}

function renderChatModelOptions(provider, chosen) {
  const sel = document.getElementById("chat-model-select");
  const models = CHAT_PROVIDERS[provider]?.models || [];
  const isCustom = provider === "custom" || (chosen && !models.includes(chosen));
  sel.innerHTML =
    models.map((m) => `<option value="${m}" ${m === chosen ? "selected" : ""}>${m}</option>`).join("") +
    `<option value="__custom" ${isCustom ? "selected" : ""}>Custom…</option>`;
  const input = document.getElementById("chat-model");
  input.hidden = !isCustom;
  input.value = isCustom ? chosen || "" : "";
  input.placeholder = CHAT_PROVIDERS[provider]?.model || "model id";
}

function renderChatSettings() {
  const cfg = chatConfig();
  const provider = CHAT_PROVIDERS[cfg.provider] ? cfg.provider : "groq";
  document.getElementById("chat-provider").value = provider;
  document.getElementById("chat-key").value = cfg.apiKey || "";
  renderChatModelOptions(provider, cfg.model || CHAT_PROVIDERS[provider].model);
  const hint = document.getElementById("chat-key-hint");
  const keyUrl = CHAT_PROVIDERS[provider].keyUrl;
  hint.innerHTML = keyUrl
    ? `Get a key: <a href="${keyUrl}" target="_blank" rel="noopener noreferrer">${keyUrl.replace("https://", "")}</a> — stored only in this browser.`
    : "No key needed for a local Ollama.";
  const baseRow = document.getElementById("chat-base-row");
  baseRow.hidden = provider !== "custom";
  document.getElementById("chat-base").value = cfg.baseUrl || "";
  renderChatAuth();
}

/* Google sign-in (via Supabase Auth) — only offered when the site runs in
   supabase mode; syncs the chat connection to the user's private DB row */
async function renderChatAuth() {
  const row = document.getElementById("chat-auth");
  if (!row) return;
  if (typeof AuthStore === "undefined" || !AuthStore.available()) {
    row.hidden = true;
    return;
  }
  row.hidden = false;
  const user = await AuthStore.getUser();
  row.innerHTML = user
    ? `<span>Synced as <strong>${escapeHtml(user.email || "signed in")}</strong></span>
       <button type="button" class="btn btn-ghost btn-compact" id="chat-signout">Sign out</button>`
    : `<span>Sync your key across devices:</span>
       <button type="button" class="btn btn-primary btn-compact" id="chat-signin">Sign in with Google</button>`;
  document.getElementById("chat-signin")?.addEventListener("click", () => AuthStore.signInGoogle());
  document.getElementById("chat-signout")?.addEventListener("click", async () => {
    await AuthStore.signOut();
    renderChatAuth();
  });
}

function initChat() {
  const panel = document.getElementById("chat-panel");
  if (!panel) return;
  chatLoad();
  // Signed-in users get their chat connection from their private DB row;
  // signed out, localStorage stays the source (fallback)
  if (typeof AuthStore !== "undefined" && AuthStore.available()) {
    const applyUser = async (user) => {
      if (user) {
        const s = await AuthStore.loadUserSettings().catch(() => null);
        if (s?.chat) localStorage.setItem(CHAT_CONFIG_KEY, JSON.stringify(s.chat));
      }
      renderChatAuth();
      if (!document.getElementById("chat-settings").hidden) renderChatSettings();
      renderChat();
    };
    AuthStore.getUser().then(applyUser).catch(() => {});
    AuthStore.onChange(applyUser);
  }

  document.getElementById("chat-fab")?.addEventListener("click", () => chatOpen(panel.hidden));
  document.getElementById("chat-close")?.addEventListener("click", () => chatOpen(false));
  document.getElementById("chat-new")?.addEventListener("click", () => chatNewThread());
  document.getElementById("chat-threads")?.addEventListener("change", (e) => {
    chatState.activeId = e.target.value;
    chatSave();
    renderChat();
  });
  document.getElementById("chat-delete")?.addEventListener("click", () => {
    chatState.threads = chatState.threads.filter((t) => t.id !== chatState.activeId);
    chatState.activeId = chatState.threads[0]?.id || null;
    chatSave();
    if (!chatState.threads.length) chatNewThread();
    else renderChat();
  });

  const settings = document.getElementById("chat-settings");
  document.getElementById("chat-settings-btn")?.addEventListener("click", () => {
    settings.hidden = !settings.hidden;
    if (!settings.hidden) renderChatSettings();
  });
  document.getElementById("chat-provider")?.addEventListener("change", (e) => {
    const p = e.target.value;
    renderChatModelOptions(p, CHAT_PROVIDERS[p]?.model);
    document.getElementById("chat-base-row").hidden = p !== "custom";
    const hint = document.getElementById("chat-key-hint");
    const keyUrl = CHAT_PROVIDERS[p]?.keyUrl;
    hint.innerHTML = keyUrl
      ? `Get a key: <a href="${keyUrl}" target="_blank" rel="noopener noreferrer">${keyUrl.replace("https://", "")}</a> — stored only in this browser.`
      : "No key needed for a local Ollama.";
  });
  document.getElementById("chat-model-select")?.addEventListener("change", (e) => {
    document.getElementById("chat-model").hidden = e.target.value !== "__custom";
  });
  document.getElementById("chat-settings-save")?.addEventListener("click", async () => {
    const selected = document.getElementById("chat-model-select").value;
    const cfg = {
      provider: document.getElementById("chat-provider").value,
      apiKey: document.getElementById("chat-key").value.trim(),
      model: selected === "__custom" ? document.getElementById("chat-model").value.trim() : selected,
      baseUrl: document.getElementById("chat-base").value.trim(),
    };
    localStorage.setItem(CHAT_CONFIG_KEY, JSON.stringify(cfg));
    if (typeof AuthStore !== "undefined" && AuthStore.available() && (await AuthStore.getUser())) {
      AuthStore.saveUserSettings({ chat: cfg }).catch((e) => console.warn("[auth] save", e));
    }
    settings.hidden = true;
    renderChat();
  });

  document.getElementById("chat-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if ((!text && !chatState.pills.length) || chatState.busy) return;
    input.value = "";
    input.style.height = "";
    chatSend(text || "Tell me about the attached event(s).");
  });
  const input = document.getElementById("chat-input");
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("chat-form").requestSubmit();
    }
  });
  input?.addEventListener("input", () => {
    input.style.height = "";
    input.style.height = `${Math.min(120, input.scrollHeight)}px`;
  });

  // event pills come from anywhere: cards, previews, timeline
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-chat-add]");
    if (add) chatAddPill(add.dataset.chatAdd);
    const rm = e.target.closest("[data-pill-remove]");
    if (rm) {
      chatState.pills = chatState.pills.filter((p) => p.id !== rm.dataset.pillRemove);
      renderChatPills();
    }
  });
}
