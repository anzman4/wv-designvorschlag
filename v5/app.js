// Entwurf 5 – App-Verhalten: Ansichten, Suche, Stories, Kalender
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Bestelladresse Städtle-Scheck: nur hier pflegen
  const SCHECK_MAIL = "wbb.klimesch@gmail.com";
  $$("[data-scheck-mail]").forEach(a => { a.href = `mailto:${SCHECK_MAIL}?subject=${encodeURIComponent("Städtle-Scheck")}`; });

  // ---------- Ansichten wie in einer App (über den Hash) ----------
  const views = ["start", "suchen", "scheck", "mitmachen", "mehr"];
  function show() {
    const [name, jump] = location.hash.slice(1).split("/");
    const v = views.includes(name) ? name : "start";
    views.forEach(n => { $(`#view-${n}`).hidden = n !== v; });
    $$(".tabbar a[data-view]").forEach(a => a.dataset.view === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    document.title = `${$(`#view-${v}`).dataset.title} – Wertingen (Entwurf 5)`;
    scrollTo(0, 0);
    if (jump) document.getElementById(jump)?.scrollIntoView();
    if (v === "suchen" && sessionStorage.getItem("wv-focus")) { sessionStorage.removeItem("wv-focus"); $("#q").focus(); }
  }
  addEventListener("hashchange", show);
  $$("[data-focus]").forEach(a => a.addEventListener("click", () => { try { sessionStorage.setItem("wv-focus", "1"); } catch {} }));
  $$("[data-jump]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); location.hash = "mehr/" + a.dataset.jump; }));

  // ---------- Countdown ----------
  const days = Math.ceil((new Date(2026, 11, 4) - new Date()) / 864e5);
  $("#cd").textContent = days > 0 ? days : "0";

  // ---------- Termin in den Kalender ----------
  $("#ics").addEventListener("click", () => {
    const ev = (start, end, uid) => ["BEGIN:VEVENT", `UID:${uid}@wv-wertingen.de`, `DTSTAMP:20261109T000000Z`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`,
      "SUMMARY:Wertinger Schlossweihnacht", "LOCATION:Schlossgarten\\, Pappenheimer Schloss\\, Wertingen", "END:VEVENT"].join("\r\n");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WV Wertingen//Entwurf//DE",
      ev("20261204", "20261207", "schlossweihnacht-1"), ev("20261211", "20261214", "schlossweihnacht-2"), "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "schlossweihnacht-2026.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // ---------- Suche ----------
  const sorted = [...MEMBERS].sort((a, b) => a.n.localeCompare(b.n, "de"));
  const initials = m => m.n.replace(/\b(GmbH|KG|AG|OHG|eG|e\.K\.|Co\.|&)\b/g, "").split(/\s+/).filter(w => /^[A-ZÄÖÜ]/.test(w)).slice(0, 2).map(w => w[0]).join("") || m.n[0];
  const logo = m => m.l ? `<img src="../media/logos/${m.l}.png" alt="" loading="lazy">` : `<span class="mono" aria-hidden="true">${esc(initials(m))}</span>`;
  const short = { "Dienstleistung, Verwaltung": "Dienstleistung", "Haus + Garten": "Haus & Garten", "Gesundheit + Fitness": "Gesundheit", "Fahrzeug, Technik, Energie": "Fahrzeug & Technik",
    "Bildung, Medien, Reisen, Events": "Bildung & Events", "Kleidung, Mode, Schmuck, Accessoires": "Mode", "Lebensmittel + Getränke": "Lebensmittel", "Gaststätten+Hotels, Cafés+Imbiss": "Essen & Trinken" };
  let cat = "";
  $("#chips").innerHTML = ["", ...Object.keys(short)].map(c => `<button data-c="${esc(c)}" aria-pressed="${c === ""}">${c ? short[c] : "Alle"}</button>`).join("");
  $("#chips").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    cat = b.dataset.c;
    $$("#chips button").forEach(x => x.setAttribute("aria-pressed", x === b));
    render();
  });
  const q = $("#q");
  q.addEventListener("input", render);
  function render() {
    const t = q.value.trim().toLowerCase();
    const hits = sorted.filter(m => (!cat || m.c.includes(cat)) && (!t || (m.n + " " + m.a + " " + m.c.join(" ")).toLowerCase().includes(t)));
    $("#count").textContent = `${hits.length} Betriebe`;
    $("#list").innerHTML = hits.map((m, i) => `<li style="animation-delay:${Math.min(i, 10) * 25}ms">
      <span class="lg">${logo(m)}</span>
      <span><b>${esc(m.n)}</b><small>${esc(m.a)}</small></span>
      <a class="round" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.n + ", " + m.a)}" target="_blank" rel="noopener" aria-label="Route zu ${esc(m.n)}"><svg viewBox="0 0 24 24"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg></a>
    </li>`).join("") || `<li style="grid-template-columns:1fr">Nichts gefunden – versuch ein anderes Stichwort.</li>`;
  }
  window.__search = term => { q.value = term; render(); };
  render();

  // ---------- Segment-Reiter (Scheck) ----------
  const tabs = $$(".seg [role=tab]");
  tabs.forEach(t => t.addEventListener("click", () => tabs.forEach(o => {
    const on = o === t;
    o.setAttribute("aria-selected", on); o.tabIndex = on ? 0 : -1;
    document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
  })));

  // ---------- Formular (Entwurf) ----------
  $("#join").addEventListener("submit", e => { e.preventDefault(); e.target.classList.add("sent"); });

  // ---------- Stories ----------
  const stories = [
    { v: "../media/fruehling.mp4", cap: "Frühling in der Stadt · 2. Mai 2026" },
    { v: "../media/stand.mp4", cap: "Mitglieder zeigen sich am Markt" },
    { i: "../media/insta-scheck.jpg", cap: "Städtle-Scheck – jetzt auch bei Garten Reiter und Esso Klein" },
    { i: "../media/insta-maibaum.jpg", cap: "Maibaum in Wertingen" },
    { i: "../media/insta-vorstell-mittwoch.jpg", cap: "Vorstell-Mittwoch: Mitglieder stellen sich vor" },
  ];
  const sv = $("#sv"), media = $("#sv-media"), bars = $("#sv-bars"), cap = $("#sv-cap");
  let cur = 0, timer = 0, raf = 0, opener = null;
  bars.innerHTML = stories.map(() => "<span><i></i></span>").join("");
  function play(i) {
    cancelAnimationFrame(raf); clearTimeout(timer);
    if (i < 0) i = 0;
    if (i >= stories.length) return close();
    cur = i;
    const s = stories[i];
    $$("#sv-bars i").forEach((b, j) => { b.style.width = j < i ? "100%" : "0"; });
    $$(".story")[i]?.classList.add("seen");
    cap.textContent = s.cap;
    media.innerHTML = s.v ? `<video src="${s.v}" autoplay muted playsinline></video>` : `<img src="${s.i}" alt="">`;
    const bar = $$("#sv-bars i")[i];
    const vid = media.querySelector("video");
    const start = performance.now(), dur = 5000;
    const tick = now => {
      const p = vid ? (vid.duration ? vid.currentTime / vid.duration : 0) : (now - start) / dur;
      bar.style.width = `${Math.min(100, p * 100)}%`;
      if (p >= 1 || (vid && vid.ended)) return play(cur + 1);
      raf = requestAnimationFrame(tick);
    };
    if (!reduced) raf = requestAnimationFrame(tick);
  }
  function open(i) { opener = document.activeElement; sv.hidden = false; document.body.style.overflow = "hidden"; play(i); $("#sv-close").focus(); }
  function close() { cancelAnimationFrame(raf); sv.hidden = true; media.innerHTML = ""; document.body.style.overflow = ""; opener?.focus(); }
  $$(".story").forEach(b => b.addEventListener("click", () => open(+b.dataset.story)));
  $("#sv-close").addEventListener("click", close);
  $("#sv-next").addEventListener("click", () => play(cur + 1));
  $("#sv-prev").addEventListener("click", () => play(cur - 1));
  addEventListener("keydown", e => {
    if (sv.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") play(cur + 1);
    if (e.key === "ArrowLeft") play(cur - 1);
  });
  window.__story = open;

  show();
})();
