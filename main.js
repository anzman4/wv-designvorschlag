// Designvorschlag WV Wertingen – Scroll-Effekte
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Navigation: Hintergrund nach dem ersten Scrollen, Menü auf dem Handy
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  // Einblenden beim Erreichen des Viewports
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("is-in");
      if (e.target.matches(".stats")) countUp(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.25 });
  document.querySelectorAll(".split, .map, .stats").forEach(el => io.observe(el));
  requestAnimationFrame(() => document.querySelectorAll(".hero, .biz-hero").forEach(h => h.classList.add("is-in")));

  function countUp(root) {
    root.querySelectorAll("[data-count]").forEach(el => {
      const end = +el.dataset.count;
      const start = el.hasAttribute("data-plain") ? end - 52 : 0;
      const t0 = performance.now();
      const tick = now => {
        const t = smooth(clamp((now - t0) / 1600));
        el.textContent = Math.round(lerp(start, end, t));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // Videos nur abspielen, solange sie sichtbar sind
  const videos = document.querySelectorAll("video");
  if (reduced) videos.forEach(v => { v.removeAttribute("autoplay"); v.pause(); });
  else {
    const vio = new IntersectionObserver(entries => {
      for (const e of entries) e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause();
    }, { threshold: 0.2 });
    videos.forEach(v => vio.observe(v));
  }

  // Logo eines Mitglieds, sonst Initialen-Kachel in der Branchenfarbe
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  window.logoTile = m => {
    if (m.l) return `<img src="media/logos/${m.l}.png" alt="Logo ${esc(m.n)}" loading="lazy">`;
    const ini = m.n.replace(/\b(GmbH|KG|AG|OHG|eG|e\.K\.|Co\.|&)\b/g, "").split(/\s+/).filter(w => /^[A-ZÄÖÜ]/.test(w)).slice(0, 2).map(w => w[0]).join("");
    return `<span class="mono" style="--c:${CATEGORIES[m.c[0]] || "var(--ink)"}" role="img" aria-label="${esc(m.n)}">${ini || m.n[0]}</span>`;
  };

  // Logo-Wand: zwei Reihen, die gegenläufig durchlaufen
  document.querySelectorAll("[data-logowall]").forEach(wall => {
    if (!window.MEMBERS) return;
    const withLogo = MEMBERS.filter(m => m.l);
    const half = Math.ceil(withLogo.length / 2);
    const row = list => `<div class="lw-track">${[...list, ...list].map(m => `<span class="lw-item" title="${esc(m.n)}">${logoTile(m)}</span>`).join("")}</div>`;
    wall.innerHTML = `<div class="lw-row">${row(withLogo.slice(0, half))}</div><div class="lw-row lw-rev">${row(withLogo.slice(half))}</div>`;
    wall.querySelectorAll(".lw-track").forEach((t, i) => {
      // zweite Hälfte jeder Spur ist nur Duplikat für die Endlosschleife
      t.querySelectorAll(".lw-item").forEach((el, j) => { if (j >= t.children.length / 2) el.setAttribute("aria-hidden", "true"); });
    });
  });

  // Branchen-Chips auf der Startseite
  const catsEl = document.getElementById("cats");
  if (catsEl && window.MEMBERS) {
    const count = {};
    MEMBERS.forEach(m => m.c.forEach(c => (count[c] = (count[c] || 0) + 1)));
    catsEl.innerHTML = Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `<a class="chip" href="mitglieder.html#${encodeURIComponent(c)}" style="--c:${CATEGORIES[c]}"><i></i>${c} <small>${n}</small></a>`)
      .join("");
  }

  // Die vier Logo-Punkte wandern zwischen den Ankern der Abschnitte
  const dots = [...document.querySelectorAll(".dot")];
  const stages = [...document.querySelectorAll("[data-stage]")]
    .map(s => [...s.querySelectorAll("[data-a]")].slice(0, 4))
    .filter(a => a.length === 4);

  const heroImg = document.querySelector(".reveal-img");
  const cheque = document.querySelector(".cheque");

  function frame() {
    const vh = innerHeight;
    nav.classList.toggle("is-scrolled", scrollY > 20);

    // Hero-Bild öffnet sich beim Scrollen
    if (heroImg && !reduced) {
      const p = clamp(scrollY / (vh * 0.7));
      heroImg.style.setProperty("--clip", `${lerp(9, 0, p)}%`);
      heroImg.style.setProperty("--zoom", lerp(1.18, 1, p));
    }

    // Scheck richtet sich auf
    if (cheque && !reduced) {
      const r = cheque.getBoundingClientRect();
      const p = smooth(clamp(1 - (r.top + r.height / 2 - vh * 0.5) / (vh * 0.6)));
      cheque.style.setProperty("--rx", `${lerp(26, 0, p)}deg`);
      cheque.style.setProperty("--rz", `${lerp(-12, -3, p)}deg`);
      cheque.style.setProperty("--ty", `${lerp(80, 0, p)}px`);
    }

    if (!stages.length) return;
    const rects = stages.map(set => set.map(a => a.getBoundingClientRect()));
    // Lage jedes Abschnitts relativ zur Bildschirmmitte
    const pos = rects.map(rs => rs.reduce((s, r) => s + r.top + r.height / 2, 0) / 4 - vh * 0.55);
    let k = 0;
    while (k < pos.length - 1 && pos[k + 1] <= 0) k++;
    let t = 0;
    if (pos[k] <= 0 && k < pos.length - 1) t = clamp(-pos[k] / (pos[k + 1] - pos[k]));
    // Punkte bleiben eine Weile am Anker und fliegen dann weiter
    t = reduced ? Math.round(t) : smooth(clamp((t - 0.3) / 0.45));
    const from = rects[k], to = rects[Math.min(k + 1, rects.length - 1)];

    dots.forEach((d, i) => {
      const a = from[i], b = to[i];
      // Seitlicher Bogen, damit die Punkte nicht stur geradeaus fliegen
      const arc = Math.sin(t * Math.PI) * (i % 2 ? -1 : 1) * Math.min(120, innerWidth * 0.12);
      const w = lerp(a.width, b.width, t);
      const x = lerp(a.left + a.width / 2, b.left + b.width / 2, t) + arc - w / 2;
      const y = lerp(a.top + a.height / 2, b.top + b.height / 2, t) - w / 2;
      d.style.width = d.style.height = `${w}px`;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  let queued = false;
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; frame(); });
  };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);
  addEventListener("load", request);
  document.fonts?.ready.then(request);
  // Für Video-Aufnahmen: Abschnittswechsel auch bei programmatischem Scrollen
  window.__frame = frame;
  frame();
})();
