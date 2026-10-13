(function () {
  const DATA = "photos/ideas.json?v=2";
  let dataPromise = null;
  let dialog = null;

  function load() {
    if (!dataPromise) {
      dataPromise = fetch(DATA).then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      });
    }
    return dataPromise;
  }

  function esc(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function matchPlace(text, places) {
    const n = norm(text);
    if (!n) return null;
    let best = null;
    places.forEach((place) => {
      place.match.forEach((alias) => {
        const a = norm(alias);
        if (a.length < 4) return;
        if (n === a || n.includes(a)) {
          if (!best || a.length > best.len) best = { place, len: a.length };
        }
      });
    });
    return best ? best.place : null;
  }

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "photo-dialog";
    dialog.innerHTML = '<div class="photo-dialog-body"></div>';
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function shotHtml(place, shot) {
    const steps = (shot.how || []).map((line) => `<li>${esc(line)}</li>`).join("");
    const credit = shot.credit
      ? `<p class="photo-credit"><a href="${esc(shot.source)}" target="_blank" rel="noopener">${esc(shot.credit)}</a> · ${esc(shot.license || "Wikimedia Commons")}</p>`
      : `<p class="photo-credit"><a href="${esc(shot.source)}" target="_blank" rel="noopener">Wikimedia Commons</a></p>`;
    return `<article class="shot">
      <p class="shot-kicker">${esc(place.name)}</p>
      <h2>${esc(shot.look)}</h2>
      <img src="${esc(shot.image)}" alt="">
      <section><h3>Angle</h3><p>${esc(shot.angle)}</p></section>
      <section><h3>Light</h3><p>${esc(shot.light)}</p></section>
      <section><h3>How</h3><ol>${steps}</ol></section>
      ${credit}
    </article>`;
  }

  function openShot(place, shot, back) {
    const box = ensureDialog();
    const body = box.querySelector(".photo-dialog-body");
    body.innerHTML = `<button type="button" class="photo-back">${esc(back || "Back")}</button>${shotHtml(place, shot)}`;
    body.querySelector(".photo-back").addEventListener("click", () => openPlace(place));
    if (!box.open) box.showModal();
  }

  function card(place, shot) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "photo-card";
    button.innerHTML = `<img src="${esc(shot.image)}" alt="" loading="lazy"><span>${esc(shot.look)}</span>`;
    button.addEventListener("click", () => openShot(place, shot, place.name));
    return button;
  }

  function fillGrid(grid, place) {
    place.shots.forEach((shot) => grid.appendChild(card(place, shot)));
  }

  function openPlace(place) {
    const box = ensureDialog();
    const body = box.querySelector(".photo-dialog-body");
    body.innerHTML = `<button type="button" class="photo-back">Close</button>
      <h2>${esc(place.name)}</h2>
      <p class="photo-note">${place.shots.length} frames. Open one for the angle, the light, and how to take it.</p>
      <div class="photo-grid"></div>`;
    body.querySelector(".photo-back").addEventListener("click", () => box.close());
    fillGrid(body.querySelector(".photo-grid"), place);
    if (!box.open) box.showModal();
  }

  async function attach(root) {
    let data;
    try {
      data = await load();
    } catch (err) {
      return;
    }
    const places = data.places || [];
    root.querySelectorAll("section.day").forEach((section) => {
      const seen = new Set();
      section.querySelectorAll("a.map").forEach((link) => {
        if (link.closest("details.also")) return;
        const place = matchPlace(link.textContent, places);
        if (!place || !place.shots.length || seen.has(place.id)) return;
        seen.add(place.id);
        const table = link.closest(".table-scroll");
        const anchor = table || link.closest("li") || link.closest("p") || link;
        if (anchor.parentElement && anchor.parentElement.querySelector(`:scope > details.photos[data-place="${place.id}"]`)) return;
        const details = document.createElement("details");
        details.className = "photos";
        details.dataset.place = place.id;
        const summary = document.createElement("summary");
        summary.textContent = `Photo ideas · ${place.name} · ${place.shots.length}`;
        const note = document.createElement("p");
        note.className = "photo-note";
        note.textContent = "Reference photos of the place. Open one for the angle, the light, and how to take it.";
        const grid = document.createElement("div");
        grid.className = "photo-grid";
        details.append(summary, note, grid);
        details.addEventListener("toggle", () => {
          if (details.open && !grid.childElementCount) fillGrid(grid, place);
        });
        let after = anchor;
        while (after.nextElementSibling && after.nextElementSibling.matches("details.photos")) {
          after = after.nextElementSibling;
        }
        after.insertAdjacentElement("afterend", details);
      });
    });
  }

  function renderPage() {
    const root = document.getElementById("photo-root");
    if (!root) return;
    load().then((data) => {
      const id = location.hash.replace(/^#/, "").split("/")[0];
      const shotId = location.hash.split("/")[1];
      if (id) {
        const place = (data.places || []).find((item) => item.id === id);
        if (place) {
          const shot = shotId && place.shots.find((item) => item.id === shotId);
          document.title = `${place.name} · Photo ideas`;
          if (shot) {
            root.innerHTML = `<p><a class="photo-back-link" href="#${esc(place.id)}">${esc(place.name)}</a></p>${shotHtml(place, shot)}`;
            return;
          }
          root.innerHTML = `<p><a class="photo-back-link" href="photos.html">All places</a></p>
            <h2>${esc(place.name)}</h2>
            <p class="photo-note">${place.shots.length} frames. Open one for the angle, the light, and how to take it.</p>
            <div class="photo-grid"></div>`;
          const grid = root.querySelector(".photo-grid");
          place.shots.forEach((shot) => {
            const link = document.createElement("a");
            link.className = "photo-card";
            link.href = `#${place.id}/${shot.id}`;
            link.innerHTML = `<img src="${esc(shot.image)}" alt="" loading="lazy"><span>${esc(shot.look)}</span>`;
            grid.appendChild(link);
          });
          return;
        }
      }
      document.title = "Photo ideas · Japan trip";
      const groups = [];
      (data.places || []).forEach((place) => {
        let group = groups.find((item) => item.day === place.day);
        if (!group) {
          group = { day: place.day, places: [] };
          groups.push(group);
        }
        group.places.push(place);
      });
      root.innerHTML = `<p class="photo-note">${esc(data.note || "")}</p>` + groups.map((group) => {
        const cards = group.places.map((place) => {
          const cover = place.shots[0];
          return `<a class="place-card" href="#${esc(place.id)}">
            <img src="${esc(cover.image)}" alt="" loading="lazy">
            <span><b>${esc(place.name)}</b><small>${place.shots.length} frames</small></span>
          </a>`;
        }).join("");
        return `<section class="place-group"><h2>${esc(group.day)}</h2><div class="place-list">${cards}</div></section>`;
      }).join("");
    }).catch(() => {
      root.innerHTML = "<p>Photo ideas are not on this copy yet.</p>";
    });
  }

  window.PhotoIdeas = { attach, openPlace };
  window.addEventListener("hashchange", () => {
    if (document.body.dataset.page === "photos") renderPage();
  });
  if (document.body.dataset.page === "photos") renderPage();
})();
