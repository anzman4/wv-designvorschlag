// Entwurf 2 – Suche, Countdown, Laufband, Branchen-Explorer
(() => {
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sorted = [...MEMBERS].sort((a, b) => a.n.localeCompare(b.n, "de"));
  const initials = m => m.n.replace(/\b(GmbH|KG|AG|OHG|eG|e\.K\.|Co\.|&)\b/g, "").split(/\s+/).filter(w => /^[A-ZÄÖÜ]/.test(w)).slice(0, 2).map(w => w[0]).join("") || m.n[0];
  const logo = m => m.l
    ? `<img src="../media/logos/${m.l}.png" alt="" loading="lazy">`
    : `<span class="mono" style="color:${CATEGORIES[m.c[0]] || "#111"}">${esc(initials(m))}</span>`;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Live-Suche im Hero
  const q = document.getElementById("q");
  const hits = document.getElementById("hits");
  function search(term) {
    const t = term.trim().toLowerCase();
    if (!t) { hits.hidden = true; return; }
    const found = sorted.filter(m => (m.n + " " + m.c.join(" ") + " " + m.a).toLowerCase().includes(t)).slice(0, 6);
    hits.innerHTML = found.length
      ? found.map(m => `<li><a href="#finden" data-name="${esc(m.n)}"><span class="hl-logo">${logo(m)}</span><span><b>${esc(m.n)}</b><small>${esc(m.c[0] || "")} · ${esc(m.a)}</small></span></a></li>`).join("")
      : `<li class="none">Nichts gefunden. Vielleicht ein anderes Stichwort?</li>`;
    hits.hidden = false;
  }
  q.addEventListener("input", () => search(q.value));
  q.addEventListener("focus", () => search(q.value));
  document.addEventListener("click", e => { if (!e.target.closest(".search")) hits.hidden = true; });
  document.querySelectorAll(".quick button").forEach(b => b.addEventListener("click", () => { q.value = b.dataset.q; search(q.value); q.focus(); }));
  window.__search = term => { q.value = term; search(term); };

  // Countdown zur Schlossweihnacht (Beginn 04.12.2026)
  const days = Math.ceil((new Date(2026, 11, 4) - new Date()) / 864e5);
  document.getElementById("countdown").textContent = days > 0 ? days : "Jetzt";

  // Laufband mit allen Mitgliedsnamen
  const names = sorted.map(m => `<span>${esc(m.n)}<i></i></span>`).join("");
  document.getElementById("ticker").innerHTML = names + names;

  // Branchen-Explorer
  const catsEl = document.getElementById("cats");
  const list = document.getElementById("list");
  const more = document.getElementById("more");
  const title = document.getElementById("res-title");
  const count = document.getElementById("res-count");
  let active = "", shown = 12;
  const byCat = c => sorted.filter(m => m.c.includes(c));
  catsEl.innerHTML = Object.keys(CATEGORIES)
    .sort((a, b) => byCat(b).length - byCat(a).length)
    .map(c => {
      const ms = byCat(c);
      const logos = ms.filter(m => m.l).slice(0, 3).map(m => `<span>${logo(m)}</span>`).join("");
      return `<button class="cat" data-c="${esc(c)}" aria-pressed="false" style="--c:${CATEGORIES[c]}">
        <span class="n">${ms.length}</span><b>${esc(c)}</b><span class="cat-logos" aria-hidden="true">${logos}</span></button>`;
    }).join("");

  function render() {
    const ms = active ? byCat(active) : sorted;
    title.textContent = active || "Alle Mitglieder";
    count.textContent = `${ms.length} Betriebe`;
    list.innerHTML = ms.slice(0, shown).map((m, i) =>
      `<li style="animation-delay:${(i % 12) * 30}ms"><span class="lg">${logo(m)}</span><span><b>${esc(m.n)}</b><small>${esc(m.a)}</small></span></li>`).join("");
    more.hidden = shown >= ms.length;
    catsEl.querySelectorAll(".cat").forEach(b => b.setAttribute("aria-pressed", b.dataset.c === active));
  }
  catsEl.addEventListener("click", e => {
    const b = e.target.closest(".cat");
    if (!b) return;
    active = b.dataset.c === active ? "" : b.dataset.c;
    shown = 12;
    render();
  });
  more.addEventListener("click", () => { shown += 24; render(); });
  hits.addEventListener("click", e => {
    const a = e.target.closest("a[data-name]");
    if (!a) return;
    const m = sorted.find(x => x.n === a.dataset.name);
    active = m.c[0] || "";
    shown = 99;
    render();
    hits.hidden = true;
  });
  render();

  // Zahl in der Mitglieder-Kachel hochzählen
  const big = document.querySelector("[data-count]");
  if (big && !reduced) {
    const end = +big.dataset.count, t0 = performance.now() + 400;
    const tick = now => { const t = Math.min(1, Math.max(0, (now - t0) / 1200)); big.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  // Videos nur abspielen, wenn sichtbar
  const vids = document.querySelectorAll("video");
  if (reduced) vids.forEach(v => { v.removeAttribute("autoplay"); v.pause(); });
  else {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause()), { threshold: 0.2 });
    vids.forEach(v => io.observe(v));
  }
})();
