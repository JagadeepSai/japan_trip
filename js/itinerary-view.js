(function () {
  const doc = document.getElementById("doc");
  const rail = document.getElementById("rail");
  const status = document.getElementById("status");
  const search = document.getElementById("q");
  const tabs = {
    plan: document.getElementById("tab-plan"),
    stores: document.getElementById("tab-stores"),
  };

  const sources = {
    plan: "docs/area-walks.md",
    stores: "docs/stores.md",
  };

  let mode = "plan";
  let cache = {};
  let onScroll = null;

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
    return n + suffix;
  }

  function slug(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  function fail(message) {
    status.hidden = false;
    status.innerHTML = message;
    doc.innerHTML = "";
    rail.innerHTML = "";
  }

  function enhance(root) {
    root.querySelectorAll("hr").forEach((hr) => hr.remove());
    root.querySelectorAll("h1").forEach((h) => h.remove());

    const stop = mode === "stores" ? "h2, h3" : "h2";
    [...root.querySelectorAll(stop)].forEach((heading) => {
      if (heading.closest("section")) return;
      const section = document.createElement("section");
      const day = heading.textContent.match(/^Day\s+(\d+)/);
      section.id = day ? "day-" + day[1] : slug(heading.textContent) || "section";
      section.className = day ? "day" : "block";
      heading.before(section);
      section.appendChild(heading);
      while (section.nextElementSibling && !section.nextElementSibling.matches(stop)) {
        section.appendChild(section.nextElementSibling);
      }
    });

    const introNodes = [];
    for (const child of [...root.childNodes]) {
      if (child.nodeType === 1 && child.tagName === "SECTION") break;
      introNodes.push(child);
    }
    if (introNodes.some((n) => n.textContent && n.textContent.trim())) {
      const intro = document.createElement("section");
      intro.id = "overview";
      intro.className = "block";
      introNodes[0].before(intro);
      introNodes.forEach((n) => intro.appendChild(n));
    }

    root.querySelectorAll("h3").forEach((h) => {
      const t = h.textContent.toLowerCase();
      if (/lunch|dinner|breakfast|snack/.test(t)) h.classList.add("food");
      if (/after dinner|^night|golden gai/.test(t)) h.classList.add("night");
    });

    root.querySelectorAll("p").forEach((p) => {
      if (!p.textContent.trim().startsWith("Also in this area")) return;
      const details = document.createElement("details");
      details.className = "also";
      const summary = document.createElement("summary");
      summary.textContent = p.textContent.trim();
      details.appendChild(summary);
      p.replaceWith(details);
      while (details.nextElementSibling && !details.nextElementSibling.matches("h2, h3")) {
        details.appendChild(details.nextElementSibling);
      }
    });

    root.querySelectorAll("table").forEach((table) => {
      const wrap = document.createElement("div");
      wrap.className = "table-scroll";
      table.replaceWith(wrap);
      wrap.appendChild(table);
    });

    root.querySelectorAll("a").forEach((a) => {
      if (/maps\.google|google\.com\/maps|maps\.app\.goo/.test(a.href)) {
        a.classList.add("map");
        a.target = "_blank";
        a.rel = "noopener";
      }
    });

    const glance = root.querySelector("#at-a-glance");
    if (glance) {
      glance.querySelectorAll("tbody tr").forEach((row) => {
        const cell = row.cells[0];
        const n = cell && cell.textContent.match(/^(\d+)/);
        if (!n) return;
        const link = document.createElement("a");
        link.href = "#day-" + n[1];
        link.innerHTML = cell.innerHTML;
        cell.textContent = "";
        cell.appendChild(link);
      });
    }
  }

  function buildRail() {
    const sections = [...doc.querySelectorAll("section")];
    rail.innerHTML = "";
    sections.forEach((section) => {
      const heading = section.querySelector("h2, h3");
      if (!heading) return;
      const a = document.createElement("a");
      a.href = "#" + section.id;
      const day = heading.textContent.match(/^Day\s+\d+\s+—\s+(\w+)\s+(\d+)\s+(\w+)/);
      if (day) a.textContent = ordinal(Number(day[2])) + " " + day[3] + " (" + day[1] + ")";
      else if (section.id === "overview") a.textContent = "Start";
      else a.textContent = heading.textContent.split(/[—(]/)[0].trim();
      rail.appendChild(a);
    });
    spy();
  }

  function spy() {
    if (onScroll) window.removeEventListener("scroll", onScroll);
    const links = [...rail.querySelectorAll("a")];
    const sections = links
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (!sections.length) return;
    onScroll = () => {
      const y = window.scrollY + 150;
      let current = sections[0].id;
      sections.forEach((section) => {
        if (section.offsetTop <= y) current = section.id;
      });
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const bar = document.querySelector(".top");
    if (bar) document.documentElement.style.scrollPaddingTop = bar.offsetHeight + 8 + "px";
  }

  function applySearch() {
    const q = search.value.trim().toLowerCase();
    doc.querySelectorAll("section").forEach((section) => {
      const hit = !q || section.textContent.toLowerCase().includes(q);
      section.classList.toggle("dim", !hit);
      if (hit && q) section.querySelectorAll("details.also").forEach((d) => (d.open = true));
    });
  }

  async function show(next) {
    mode = next;
    tabs.plan.setAttribute("aria-selected", String(next === "plan"));
    tabs.stores.setAttribute("aria-selected", String(next === "stores"));
    search.value = "";
    status.hidden = true;
    if (!window.marked) {
      fail("This page needs a network connection the first time, to load the formatter.");
      return;
    }
    try {
      if (!cache[next]) {
        const res = await fetch(sources[next]);
        if (!res.ok) throw new Error(res.status);
        cache[next] = await res.text();
      }
      doc.innerHTML = marked.parse(cache[next], { gfm: true });
      enhance(doc);
      if (next === "plan" && window.PhotoIdeas) await PhotoIdeas.attach(doc);
      buildRail();
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    } catch (err) {
      fail(
        "Couldn’t read the plan. Start a local server in this folder, then open <code>itinerary.html</code>:<br><br><code>python3 -m http.server 8765</code>"
      );
    }
  }

  tabs.plan.addEventListener("click", () => show("plan"));
  tabs.stores.addEventListener("click", () => show("stores"));
  search.addEventListener("input", applySearch);
  window.addEventListener("beforeprint", () => {
    doc.querySelectorAll("details.also").forEach((d) => (d.open = true));
  });

  show("plan");
})();
