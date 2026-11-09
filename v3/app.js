// Entwurf 3 – gemeinsames Verhalten aller Seiten
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Bestelladresse Städtle-Scheck: nur hier pflegen
  const SCHECK_MAIL = "wbb.klimesch@gmail.com";
  $$("[data-scheck-mail]").forEach(a => {
    a.href = `mailto:${SCHECK_MAIL}?subject=${encodeURIComponent("Städtle-Scheck")}`;
    if (a.hasAttribute("data-show")) a.textContent = SCHECK_MAIL;
  });

  // Kopf: Linie beim Scrollen, Menü auf dem Handy
  const header = $(".header");
  const onScroll = () => header?.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const menuBtn = $(".menu-btn");
  menuBtn?.addEventListener("click", () => {
    const open = $(".menu").classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });

  // Dezentes Einblenden
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$(".reveal").forEach(el => reduced ? el.classList.add("in") : io.observe(el));

  // Videos nur abspielen, wenn sichtbar
  const vio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause()), { threshold: 0.2 });
  $$("video").forEach(v => reduced ? (v.removeAttribute("autoplay"), v.pause()) : vio.observe(v));

  if (!window.MEMBERS) return;
  const sorted = [...MEMBERS].sort((a, b) => a.n.localeCompare(b.n, "de"));
  const initials = m => m.n.replace(/\b(GmbH|KG|AG|OHG|eG|e\.K\.|Co\.|&)\b/g, "").split(/\s+/).filter(w => /^[A-ZÄÖÜ]/.test(w)).slice(0, 2).map(w => w[0]).join("") || m.n[0];
  const logo = m => m.l ? `<img src="../media/logos/${m.l}.png" alt="" loading="lazy">` : `<span class="mono" aria-hidden="true">${esc(initials(m))}</span>`;

  // Logo-Reihe (Startseite)
  const track = $(".logos-track");
  if (track) {
    const tiles = sorted.filter(m => m.l).map(m => `<span class="logo-tile" title="${esc(m.n)}">${logo(m)}</span>`).join("");
    track.innerHTML = tiles + tiles.replace(/class="logo-tile"/g, 'class="logo-tile" aria-hidden="true"');
  }

  // Suche auf der Startseite führt ins Verzeichnis
  $("#home-search")?.addEventListener("submit", e => {
    e.preventDefault();
    location.href = "mitglieder.html?q=" + encodeURIComponent($("#home-q").value.trim());
  });

  // Mitgliederverzeichnis
  const list = $("#members");
  if (list) {
    const q = $("#q"), cat = $("#cat"), info = $("#info"), more = $("#more");
    cat.insertAdjacentHTML("beforeend", Object.keys(CATEGORIES).sort((a, b) => a.localeCompare(b, "de")).map(c => `<option>${esc(c)}</option>`).join(""));
    const params = new URLSearchParams(location.search);
    q.value = params.get("q") || "";
    let shown = 24;
    const render = () => {
      const t = q.value.trim().toLowerCase();
      const hits = sorted.filter(m => (!cat.value || m.c.includes(cat.value)) && (!t || (m.n + " " + m.a + " " + m.c.join(" ")).toLowerCase().includes(t)));
      info.textContent = hits.length === sorted.length ? `${hits.length} Mitgliedsbetriebe` : `${hits.length} von ${sorted.length} Betrieben`;
      list.innerHTML = hits.slice(0, shown).map(m => `<li class="member"><span class="member-logo">${logo(m)}</span><span><b>${esc(m.n)}</b><span>${esc(m.a)}</span><span class="cat">${esc(m.c[0] || "")}</span></span></li>`).join("")
        || `<li class="notice">Kein Betrieb gefunden. Versuch es mit einem anderen Stichwort.</li>`;
      more.hidden = shown >= hits.length;
    };
    q.addEventListener("input", () => { shown = 24; render(); });
    cat.addEventListener("change", () => { shown = 24; render(); });
    more.addEventListener("click", () => { shown += 24; render(); });
    render();
  }
})();

// Reiter (Städtle-Scheck) – auch ohne Mitgliederdaten
document.querySelectorAll("[role=tablist]").forEach(list => {
  const tabs = [...list.querySelectorAll("[role=tab]")];
  const select = tab => tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", e => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); }
    });
  });
  const fromHash = tabs.find(t => "#" + t.getAttribute("aria-controls") === location.hash);
  if (fromHash) select(fromHash);
});

// Beitrittsformular: Entwurf, verschickt nichts
document.querySelectorAll("form.form").forEach(f => f.addEventListener("submit", e => { e.preventDefault(); f.classList.add("sent"); }));
