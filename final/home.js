// Entwurf 4 – nur Startseite: Live-Suche, Countdown, Logo-Wand, wandernde Punkte
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sorted = [...MEMBERS].sort((a, b) => a.n.localeCompare(b.n, "de"));
  const logo = m => m.l ? `<img src="../media/logos/${m.l}.png" alt="" loading="lazy">` : `<span class="mono" aria-hidden="true">${esc(m.n[0])}</span>`;

  // Live-Suche mit Treffern samt Logo
  const input = document.getElementById("ls");
  const hits = document.getElementById("ls-hits");
  const search = term => {
    const t = term.trim().toLowerCase();
    if (!t) { hits.hidden = true; return; }
    const found = sorted.filter(m => (m.n + " " + m.c.join(" ") + " " + m.a).toLowerCase().includes(t));
    hits.innerHTML = found.slice(0, 5).map(m =>
      `<li><a href="mitglieder.html?q=${encodeURIComponent(m.n)}"><span class="ls-logo">${logo(m)}</span><span><b>${esc(m.n)}</b><small>${esc(m.c[0] || "")} · ${esc(m.a)}</small></span></a></li>`).join("")
      + (found.length ? `<li class="ls-all"><a href="mitglieder.html?q=${encodeURIComponent(term.trim())}">Alle ${found.length} Treffer anzeigen →</a></li>` : `<li class="ls-none">Nichts gefunden – versuch ein anderes Stichwort.</li>`);
    hits.hidden = false;
  };
  input.addEventListener("input", () => search(input.value));
  input.addEventListener("focus", () => search(input.value));
  input.addEventListener("keydown", e => { if (e.key === "Enter") location.href = "mitglieder.html?q=" + encodeURIComponent(input.value.trim()); });
  document.addEventListener("click", e => { if (!e.target.closest(".live-search")) hits.hidden = true; });
  document.querySelectorAll(".quick button").forEach(b => b.addEventListener("click", () => { input.value = b.dataset.q; search(input.value); input.focus(); }));
  window.__search = t => { input.value = t; search(t); };

  // Countdown zur Schlossweihnacht (04.12.2026)
  const days = Math.ceil((new Date(2026, 11, 4) - new Date()) / 864e5);
  document.getElementById("cd").textContent = days > 0 ? days : "0";

  // Logo-Wand: zwei Reihen, gegenläufig
  const wall = document.querySelector(".wall");
  const withLogo = sorted.filter(m => m.l);
  const half = Math.ceil(withLogo.length / 2);
  const row = list => {
    const tiles = list.map(m => `<span class="logo-tile" title="${esc(m.n)}">${logo(m)}</span>`).join("");
    return `<div class="wall-row"><div class="wall-track">${tiles}${tiles.replace(/class="logo-tile"/g, 'class="logo-tile" aria-hidden="true"')}</div></div>`;
  };
  wall.innerHTML = row(withLogo.slice(0, half)) + row(withLogo.slice(half)).replace("wall-row", "wall-row rev");

  // Hero-Video öffnet sich beim Scrollen
  const media = document.querySelector(".hero4-media");

  // Die vier Punkte fliegen zwischen den Ankern der Abschnitte
  const dots = [...document.querySelectorAll(".flydots span")];
  const stages = [...document.querySelectorAll("[data-stage]")].map(s =>
    [0, 1, 2, 3].map(i => s.querySelector(`[data-a="${i}"]`)));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  function frame() {
    const vh = innerHeight;
    if (media && !reduced) {
      const p = clamp(scrollY / (vh * 0.6));
      media.style.setProperty("--inset", `${lerp(6, 0, p)}%`);
      media.style.setProperty("--zoom", lerp(1.12, 1, p));
    }
    const rects = stages.map(set => set.map(a => a.getBoundingClientRect()));
    const pos = rects.map(rs => rs.reduce((s, r) => s + r.top + r.height / 2, 0) / 4 - vh * 0.5);
    let k = 0;
    while (k < pos.length - 1 && pos[k + 1] <= 0) k++;
    let t = 0;
    if (pos[k] <= 0 && k < pos.length - 1) t = clamp(-pos[k] / (pos[k + 1] - pos[k]));
    t = reduced ? Math.round(t) : smooth(clamp((t - 0.3) / 0.45));
    const from = rects[k], to = rects[Math.min(k + 1, rects.length - 1)];
    dots.forEach((d, i) => {
      const a = from[i], b = to[i];
      const w = lerp(a.width, b.width, t);
      const x = lerp(a.left + a.width / 2, b.left + b.width / 2, t) - w / 2;
      const y = lerp(a.top + a.height / 2, b.top + b.height / 2, t) - w / 2;
      d.style.width = d.style.height = `${w}px`;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }
  let queued = false;
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);
  addEventListener("load", request);
  document.fonts?.ready.then(request);
  window.__frame = frame;
  frame();
})();
