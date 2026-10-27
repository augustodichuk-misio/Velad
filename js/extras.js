/* ---------- Velad · funciones de estudio: Secuencia, Glosario, Paralelos, Por qué postribulación y miniatura de versículos ----------
   Todo se carga aparte (secuencia.json, glosario.json, paralelos.json, porque.json, versos.json). Si algo falla, el sitio sigue igual. */
(function () {
  "use strict";
  var doc = document, R = window.VeladRefs;
  var V = "9";
  var DATA = {}, VERSOS = null, versosP = null, CH = {};
  var VIEWS = [
    { k: "secuencia", t: "Secuencia del fin", d: "La línea de los acontecimientos, paso a paso" },
    { k: "glosario", t: "Glosario", d: "Términos clave con sus textos" },
    { k: "paralelos", t: "Pasajes paralelos", d: "Mateo 24, Marcos 13 y Lucas 21, lado a lado" },
    { k: "porque", t: "Por qué postribulación", d: "Los textos clave, uno por uno" }
  ];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function mob() { return window.innerWidth < 760; }
  function hoverable() { return !mob() && window.matchMedia("(hover: hover) and (pointer: fine)").matches; }
  function load(name) {
    return fetch(name + ".json?v=" + V, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function (e) { if (window.console) console.warn("Velad: no se pudo cargar " + name + ".json", e); return null; });
  }

  /* ---------- versículos: versos.json + respaldo bolls.life ---------- */
  function getVersos() {
    if (!versosP) versosP = load("versos").then(function (d) { VERSOS = d || {}; return VERSOS; });
    return versosP;
  }
  function chapter(b, c) {
    var k = b + ":" + c;
    if (!CH[k]) CH[k] = fetch("https://bolls.life/get-text/RV1960/" + b + "/" + c + "/")
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (a) {
        var o = {};
        (a || []).forEach(function (v) {
          o[v.verse] = String(v.text || "").replace(/<S>.*?<\/S>/g, "").replace(/<sup>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ").replace(/\s+([,;:.?!»)])/g, "$1").trim();
        });
        return o;
      })
      .catch(function () { delete CH[k]; return null; });
    return CH[k];
  }
  function versesFor(ref) {
    var want = R.verses(ref, 8);
    return getVersos().then(function (VS) {
      var need = {}, out = [];
      want.list.forEach(function (p) {
        var k = ref.book + ":" + p[0], t = VS[k] && VS[k][p[1]];
        out.push({ c: p[0], v: p[1], t: t || null });
        if (!t) need[p[0]] = 1;
      });
      var cs = Object.keys(need);
      if (!cs.length) return { list: out, more: want.more };
      return Promise.all(cs.map(function (c) { return chapter(ref.book, +c); })).then(function (res) {
        var by = {}; cs.forEach(function (c, i) { by[c] = res[i]; });
        out.forEach(function (o) { if (!o.t && by[o.c]) o.t = by[o.c][o.v] || null; });
        /* versos fuera del capítulo (rangos que cruzan de capítulo) se descartan */
        return { list: out.filter(function (o) { return o.t || !by[o.c]; }), more: want.more };
      });
    });
  }
  function versesHTML(res) {
    var multi = res.list.some(function (o, i) { return i && o.c !== res.list[0].c; });
    var ok = res.list.filter(function (o) { return o.t; });
    if (!ok.length) return '<p class="x-pop__none">No se pudo cargar el texto de este pasaje.</p>';
    return '<p class="x-pop__verse">' + ok.map(function (o) {
      return "<sup>" + (multi ? o.c + ":" : "") + o.v + "</sup>" + esc(o.t);
    }).join(" ") + (res.more ? ' <span class="x-pop__more">…</span>' : "") + "</p>";
  }
  /* versículo ya descargado en un json nuevo: {ref, v:[[n,t]] o [[c,n,t]]} */
  function quoteHTML(q, cls) {
    return '<blockquote class="' + (cls || "x-q") + '"><p>' + q.v.map(function (x) {
      return x.length === 3 ? "<sup>" + x[0] + ":" + x[1] + "</sup>" + esc(x[2]) : "<sup>" + x[0] + "</sup>" + esc(x[1]);
    }).join(" ") + '</p><cite class="x-noref">' + esc(q.ref) + " · RVR1960</cite></blockquote>";
  }

  /* ---------- marcado en tiempo de render ---------- */
  var SKIP = "button, a, summary, .x-vref, .x-gl, .x-noref, mark, input, textarea, script, style, h2, .x-anchor, blockquote, .x-pv, .x-pop__verse";
  function textNodes(root) {
    var out = [], w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || n.nodeValue.length < 2) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function markRefs(root) {
    if (!root || !R) return;
    textNodes(root).forEach(function (n) {
      var t = n.nodeValue, found = R.find(t);
      if (!found.length) return;
      var frag = doc.createDocumentFragment(), at = 0;
      found.forEach(function (f) {
        if (f.index < at) return;
        frag.appendChild(doc.createTextNode(t.slice(at, f.index)));
        var s = doc.createElement("span");
        s.className = "x-vref"; s.tabIndex = 0; s.setAttribute("role", "button");
        s.dataset.ref = f.text; s.textContent = f.text;
        frag.appendChild(s);
        at = f.index + f.length;
      });
      frag.appendChild(doc.createTextNode(t.slice(at)));
      n.parentNode.replaceChild(frag, n);
    });
  }
  /* glosario: primera aparición de cada término dentro del desglose abierto */
  var GL = null;
  function accentRx(s) {
    var M = { a: "[aáàä]", e: "[eéèë]", i: "[iíìï]", o: "[oóòö]", u: "[uúùü]" };
    return norm(s).split("").map(function (c) {
      if (M[c]) return M[c];
      if (/\s/.test(c)) return "\\s+";
      return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("");
  }
  function buildGloss(g) {
    var map = {}, pats = [];
    g.terminos.forEach(function (t) {
      [t.termino].concat(t.alias || []).forEach(function (p) {
        var k = norm(p).replace(/\s+/g, " ");
        if (!map[k]) { map[k] = t.id; pats.push(p); }
      });
    });
    pats.sort(function (a, b) { return b.length - a.length; });
    var src = "(?<![\\p{L}\\p{N}])(?:" + pats.map(accentRx).join("|") + ")(?![\\p{L}\\p{N}])";
    var byId = {}; g.terminos.forEach(function (t) { byId[t.id] = t; });
    GL = { re: new RegExp(src, "giu"), map: map, byId: byId };
  }
  function markGloss(root) {
    if (!GL || !root) return;
    var done = {};
    root.querySelectorAll(".x-gl").forEach(function (e) { done[e.dataset.gl] = 1; });
    textNodes(root).forEach(function (n) {
      var t = n.nodeValue, m, hits = [];
      GL.re.lastIndex = 0;
      while ((m = GL.re.exec(t))) {
        var id = GL.map[norm(m[0]).replace(/\s+/g, " ")];
        if (id && !done[id]) { done[id] = 1; hits.push({ i: m.index, l: m[0].length, id: id }); }
      }
      if (!hits.length) return;
      var frag = doc.createDocumentFragment(), at = 0;
      hits.forEach(function (h) {
        frag.appendChild(doc.createTextNode(t.slice(at, h.i)));
        var s = doc.createElement("span");
        s.className = "x-gl"; s.tabIndex = 0; s.setAttribute("role", "button");
        s.dataset.gl = h.id; s.textContent = t.slice(h.i, h.i + h.l);
        s.title = "Glosario: " + GL.byId[h.id].termino;
        frag.appendChild(s);
        at = h.i + h.l;
      });
      frag.appendChild(doc.createTextNode(t.slice(at)));
      n.parentNode.replaceChild(frag, n);
    });
  }
  function watch(el, fn) {
    if (!el || !window.MutationObserver) return;
    var busy = false, sched = 0;
    var mo = new MutationObserver(function () {
      if (busy || sched) return;
      sched = requestAnimationFrame(function () {
        sched = 0; busy = true;
        try { fn(el); } catch (e) { if (window.console) console.warn(e); }
        mo.takeRecords(); busy = false;
      });
    });
    mo.observe(el, { childList: true, subtree: true });
    try { fn(el); } catch (e) { /* nada */ }
  }

  /* ---------- popover / hoja inferior ---------- */
  var pop, popBody, popKick, popFor = null, popPinned = false, hoverT = 0, hideT = 0, popToken = 0;
  function makePop() {
    pop = doc.createElement("div");
    pop.className = "x-pop"; pop.id = "x-pop"; pop.hidden = true;
    pop.setAttribute("role", "dialog"); pop.setAttribute("aria-live", "polite");
    pop.innerHTML = '<span class="x-handle" aria-hidden="true"></span><div class="x-pop__bar"><p class="x-pop__kick"></p>' +
      '<button type="button" class="x-pop__x" aria-label="Cerrar">✕</button></div><div class="x-pop__body"></div>';
    doc.body.appendChild(pop);
    popBody = pop.querySelector(".x-pop__body"); popKick = pop.querySelector(".x-pop__kick");
    pop.querySelector(".x-pop__x").addEventListener("click", hidePop);
    pop.addEventListener("mouseenter", function () { clearTimeout(hideT); });
    pop.addEventListener("mouseleave", function () { if (!popPinned) hideT = setTimeout(hidePop, 220); });
  }
  function place(anchor) {
    pop.classList.toggle("is-sheet", mob());
    if (mob()) { pop.style.left = pop.style.top = ""; return; }
    var r = anchor.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var x = Math.max(12, Math.min(W - w - 12, r.left + r.width / 2 - w / 2));
    var y = r.bottom + 8;
    if (y + h > H - 12) y = Math.max(12, r.top - h - 8);
    pop.style.left = Math.round(x) + "px"; pop.style.top = Math.round(y) + "px";
  }
  function showPop(anchor, kick, html, pinned) {
    clearTimeout(hideT);
    popFor = anchor; popPinned = !!pinned;
    popKick.textContent = kick;
    popBody.innerHTML = html;
    pop.hidden = false;
    pop.classList.toggle("is-pinned", popPinned || mob());
    place(anchor);
    popBody.scrollTop = 0;
  }
  function hidePop() { if (!pop || pop.hidden) return; pop.hidden = true; popFor = null; popPinned = false; popToken++; }
  function showRef(el, pinned) {
    var f = R.find(el.dataset.ref || el.textContent)[0];
    if (!f) return;
    var tok = ++popToken, kick = f.text.replace(/\s+/g, " ") + " · RVR1960";
    showPop(el, kick, '<p class="x-pop__none">Cargando…</p>', pinned);
    versesFor(f).then(function (res) {
      if (tok !== popToken) return;
      popBody.innerHTML = versesHTML(res);
      place(el);
    }).catch(function () {
      if (tok !== popToken) return;
      popBody.innerHTML = '<p class="x-pop__none">No se pudo cargar el texto de este pasaje.</p>';
    });
  }
  function showTerm(el) {
    var t = GL && GL.byId[el.dataset.gl]; if (!t) return;
    popToken++;
    showPop(el, "Glosario", '<h3 class="x-pop__term">' + esc(t.termino) + "</h3><p>" + esc(t.def) + "</p>" +
      t.citas.map(function (q) { return quoteHTML(q, "x-q x-q--sm"); }).join("") +
      '<button type="button" class="x-pop__go" data-gl-open="' + esc(t.id) + '">Ver en el glosario →</button>', true);
    markRefs(popBody.querySelector("p"));
  }
  function bindPop() {
    doc.addEventListener("click", function (e) {
      var g = e.target.closest(".x-gl");
      if (g) { e.preventDefault(); e.stopPropagation(); if (popFor === g && !pop.hidden) hidePop(); else showTerm(g); return; }
      var v = e.target.closest(".x-vref");
      if (v && !v.closest("#set-gen")) {
        e.preventDefault(); e.stopPropagation();
        if (popFor === v && !pop.hidden && popPinned) hidePop(); else showRef(v, true);
        return;
      }
      var go = e.target.closest("[data-gl-open]");
      if (go) { hidePop(); openStudy("glosario", go.getAttribute("data-gl-open")); return; }
      if (!pop.hidden && !e.target.closest(".x-pop")) hidePop();
    }, true);
    doc.addEventListener("keydown", function (e) {
      var t = e.target;
      if ((e.key === "Enter" || e.key === " ") && t.classList && (t.classList.contains("x-vref") || t.classList.contains("x-gl"))) {
        e.preventDefault(); if (t.classList.contains("x-gl")) showTerm(t); else showRef(t, true);
      }
      if (e.key === "Escape" && pop && !pop.hidden) { hidePop(); e.stopPropagation(); }
    }, true);
    doc.addEventListener("mouseover", function (e) {
      if (!hoverable()) return;
      var v = e.target.closest && e.target.closest(".x-vref");
      if (!v) return;
      clearTimeout(hideT); clearTimeout(hoverT);
      if (popFor === v && !pop.hidden) return;
      if (popPinned && !pop.hidden) return;
      hoverT = setTimeout(function () { showRef(v, false); }, 240);
    });
    doc.addEventListener("mouseout", function (e) {
      var v = e.target.closest && e.target.closest(".x-vref");
      if (!v) return;
      clearTimeout(hoverT);
      if (!popPinned && popFor === v) hideT = setTimeout(hidePop, 260);
    });
    window.addEventListener("resize", function () { if (pop && !pop.hidden && popFor && doc.contains(popFor)) place(popFor); else hidePop(); });
    /* al desplazar el desglose o el tablero, la miniatura de escritorio se cierra */
    ["lectura-body", "dossier-body"].forEach(function (id) {
      var el = doc.getElementById(id); if (el) el.addEventListener("scroll", function () { if (!mob() && !popPinned) hidePop(); else if (!mob() && popFor && doc.contains(popFor)) place(popFor); }, { passive: true });
    });
  }

  /* ---------- panel de estudio ---------- */
  var study, sBody, sTabs, curView = null;
  function makeStudy() {
    study = doc.createElement("section");
    study.className = "x-study"; study.id = "study"; study.hidden = true;
    study.setAttribute("aria-label", "Estudio");
    study.innerHTML = '<div class="x-study__bar"><p class="x-study__kick">Estudio</p><div class="x-study__tabs" role="tablist"></div>' +
      '<button class="btn x-close" type="button" id="study-close" aria-label="Cerrar estudio">Cerrar ✕</button></div><div class="x-study__body" id="study-body"></div>';
    (doc.querySelector(".main") || doc.body).appendChild(study);
    sBody = study.querySelector(".x-study__body"); sTabs = study.querySelector(".x-study__tabs");
    study.querySelector("#study-close").addEventListener("click", closeStudy);
    sTabs.addEventListener("click", function (e) { var b = e.target.closest("[data-sv]"); if (b) openStudy(b.dataset.sv); });
    sBody.addEventListener("click", onStudyClick);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !study.hidden && (!pop || pop.hidden)) closeStudy(); });
  }
  function avail() { return VIEWS.filter(function (v) { return DATA[v.k]; }); }
  function closeMenu() { var m = doc.getElementById("menu"); if (m && m.classList.contains("is-open")) doc.getElementById("menu-close").click(); }
  function openStudy(k, focusId) {
    if (!DATA[k]) return;
    closeMenu(); hidePop();
    curView = k;
    sTabs.innerHTML = avail().map(function (v) {
      return '<button class="x-chip" type="button" role="tab" data-sv="' + v.k + '" aria-pressed="' + (v.k === k ? "true" : "false") + '">' + esc(v.t.replace("Pasajes paralelos", "Paralelos").replace("Secuencia del fin", "Secuencia").replace("Por qué postribulación", "Por qué")) + "</button>";
    }).join("");
    sBody.innerHTML = RENDER[k](DATA[k]);
    sBody.dataset.view = k;
    study.hidden = false;
    doc.body.classList.add("x-studying");
    markRefs(sBody);
    sBody.scrollTop = 0;
    if (k === "secuencia") seqInit();
    if (k === "glosario") glossInit(focusId);
    if (k === "paralelos") parInit();
    try { history.replaceState(null, "", "#" + k); } catch (e) { /* nada */ }
  }
  function closeStudy() {
    if (study.hidden) return;
    study.hidden = true; curView = null; hidePop();
    doc.body.classList.remove("x-studying");
    try { if (/^#(secuencia|glosario|paralelos|porque)/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* nada */ }
  }
  function onStudyClick(e) {
    var to = e.target.closest("[data-to]");
    if (to) {
      var ids = to.dataset.to.split("/");
      closeStudy();
      if (window.XNav && window.XNav.go) window.XNav.go(ids); else if (window.XNav) window.XNav.open(ids);
      return;
    }
    var o = e.target.closest("[data-study-open]");
    if (o) { openStudy(o.dataset.studyOpen); return; }
    var sc = e.target.closest("[data-seq]");
    if (sc) { var tr = sBody.querySelector(".x-seq"); if (tr) tr.scrollBy({ left: (+sc.dataset.seq) * Math.min(tr.clientWidth * 0.8, 960), behavior: "smooth" }); return; }
    var pt = e.target.closest("[data-pcol]");
    if (pt) {
      var par = sBody.querySelector(".x-par"); par.dataset.show = pt.dataset.pcol;
      sBody.querySelectorAll("[data-pcol]").forEach(function (b) { b.setAttribute("aria-pressed", b === pt ? "true" : "false"); });
    }
  }
  function linksHTML(ls) {
    if (!ls || !ls.length) return "";
    return '<div class="x-gos x-slinks">' + ls.map(function (l) {
      return '<button type="button" class="x-go" data-to="' + esc(l.to.join("/")) + '" style="--c:var(--x-gold)">' + esc(l.label) + " ↗</button>";
    }).join("") + "</div>";
  }
  function head(kick, d) {
    return '<header class="x-shead"><p class="x-skick">' + esc(kick) + "</p><h2>" + esc(d.titulo) + '</h2><p class="x-sintro">' + esc(d.intro || "") + "</p></header>";
  }
  var RENDER = {
    secuencia: function (d) {
      return '<div class="x-sw">' + head("Línea postribulacional · " + d.pasos.length + " pasos", d) +
        '<div class="x-seq__nav"><button class="btn" type="button" data-seq="-1" aria-label="Pasos anteriores">←</button><button class="btn" type="button" data-seq="1" aria-label="Pasos siguientes">→</button></div></div>' +
        '<div class="x-seq"><ol class="x-seq__list">' + d.pasos.map(function (p) {
          return '<li class="x-step' + (p.clave ? " is-key" : "") + '" id="seq-' + esc(p.id) + '"><span class="x-step__dot" aria-hidden="true"></span>' +
            '<article class="x-step__card"><p class="x-step__n">Paso ' + String(p.n).padStart(2, "0") + (p.clave ? " · <b>la venida</b>" : "") + "</p>" +
            "<h3>" + esc(p.titulo) + '</h3><p class="x-step__refs">' + p.refs.map(esc).join(" · ") + "</p>" +
            '<p class="x-step__t">' + esc(p.texto) + "</p>" + quoteHTML(p.verso) +
            (p.clave && DATA.porque ? '<button type="button" class="btn x-step__why" data-study-open="porque">Por qué postribulación →</button>' : "") +
            linksHTML(p.links) + "</article></li>";
        }).join("") + "</ol></div>";
    },
    glosario: function (d) {
      return '<div class="x-gwrap">' + head(d.terminos.length + " términos", d) +
        '<input class="x-search x-gsearch" id="gl-q" type="search" placeholder="Buscar un término…" autocomplete="off" aria-label="Buscar en el glosario"/>' +
        '<p class="x-menu__hint" id="gl-none" hidden>Sin resultados.</p><div class="x-gloss">' + d.terminos.map(function (t) {
          return '<article class="x-term" id="gl-' + esc(t.id) + '" data-k="' + esc(norm([t.termino].concat(t.alias || []).join(" ") + " " + t.def)) + '">' +
            "<h3>" + esc(t.termino) + "</h3>" + (t.alias && t.alias.length ? '<p class="x-term__aka">También: ' + t.alias.map(esc).join(", ") + "</p>" : "") +
            '<p class="x-term__def">' + esc(t.def) + "</p>" + t.citas.map(function (q) { return quoteHTML(q, "x-q x-q--sm"); }).join("") + linksHTML(t.links) + "</article>";
        }).join("") + "</div></div>";
    },
    paralelos: function (d) {
      var cols = d.columnas;
      function cell(row, c) {
        var a = row[c[0]];
        return '<div class="x-par__cell" data-col="' + c[0] + '" data-label="' + esc(c[1]) + '">' + (a && a.length ? a.map(function (q) {
          return '<p class="x-pv"><b class="x-pv__ref x-noref">' + esc(q.ref) + "</b> " + q.v.map(function (x) {
            return "<sup>" + (x.length === 3 ? x[0] + ":" + x[1] : x[0]) + "</sup>" + esc(x[x.length - 1]);
          }).join(" ") + "</p>";
        }).join("") : '<p class="x-pv x-pv--none">—</p>') + "</div>";
      }
      return '<div class="x-pwrap">' + head(d.filas.length + " acontecimientos · RVR1960", d) +
        '<div class="x-par__tabs" role="tablist">' + cols.map(function (c, i) {
          return '<button class="x-chip" type="button" data-pcol="' + c[0] + '" aria-pressed="' + (i ? "false" : "true") + '">' + esc(c[1].replace("Epístolas · Apocalipsis", "Epístolas")) + "</button>";
        }).join("") + '<button class="x-chip" type="button" data-pcol="todo" aria-pressed="false">Todo</button></div></div>' +
        '<div class="x-par" data-show="mt"><div class="x-par__row x-par__head x-noref"><div>Acontecimiento</div>' + cols.map(function (c) { return "<div>" + esc(c[1]) + "</div>"; }).join("") + "</div>" +
        d.filas.map(function (r, i) {
          return '<div class="x-par__row"><div class="x-par__ev"><span class="x-par__n">' + String(i + 1).padStart(2, "0") + "</span><h3>" + esc(r.evento) + "</h3><p>" + esc(r.nota) + "</p></div>" +
            cols.map(function (c) { return cell(r, c); }).join("") + "</div>";
        }).join("") + "</div>";
    },
    porque: function (d) {
      return '<div class="x-why">' + head("Expediente · " + d.puntos.length + " textos", d) + '<ol class="x-why__list">' + d.puntos.map(function (p) {
        return '<li class="x-why__item"><span class="x-why__n">' + String(p.n).padStart(2, "0") + "</span><div><h3>" + esc(p.titulo) + "</h3>" + quoteHTML(p.verso) +
          "<p>" + esc(p.texto) + "</p>" + (p.apoyo || []).map(function (q) { return quoteHTML(q, "x-q x-q--sm"); }).join("") + linksHTML(p.links) + "</div></li>";
      }).join("") + "</ol>" + (DATA.secuencia ? '<p class="x-why__end"><button class="btn" type="button" data-study-open="secuencia">← Ver la secuencia del fin</button></p>' : "") + "</div>";
    }
  };
  function seqInit() {
    var tr = sBody.querySelector(".x-seq"); if (!tr) return;
    tr.addEventListener("wheel", function (e) {
      if (mob() || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.shiftKey) return;
      e.preventDefault(); tr.scrollLeft += e.deltaY;
    }, { passive: false });
  }
  function glossInit(focusId) {
    var q = sBody.querySelector("#gl-q"), none = sBody.querySelector("#gl-none"), items = sBody.querySelectorAll(".x-term");
    q.addEventListener("input", function () {
      var t = norm(q.value.trim()), n = 0;
      items.forEach(function (it) { var ok = !t || it.dataset.k.indexOf(t) >= 0; it.hidden = !ok; if (ok) n++; });
      none.hidden = n > 0;
    });
    if (focusId) {
      var el = sBody.querySelector("#gl-" + focusId);
      if (el) setTimeout(function () { sBody.scrollTop += el.getBoundingClientRect().top - sBody.getBoundingClientRect().top - 16; el.classList.add("x-hit"); }, 30);
    } else if (!mob()) setTimeout(function () { q.focus({ preventScroll: true }); }, 60);
  }
  function parInit() { /* las pestañas solo se ven en el celu */ }

  /* ---------- menú: pestaña Estudio + accesos en el Índice ---------- */
  function menuEntries() {
    var pane = doc.querySelector('[data-pane="estudio"]'), list = avail();
    var tab = doc.querySelector('[data-tab="estudio"]');
    if (tab) tab.hidden = !list.length;
    if (pane) pane.innerHTML = '<p class="x-menu__hint">Herramientas para leer el mapa en orden.</p><ul class="x-study-links">' + list.map(function (v) {
      return '<li><button type="button" data-study-open="' + v.k + '"><span>' + esc(v.t) + "</span><small>" + esc(v.d) + "</small></button></li>";
    }).join("") + "</ul>";
    var idxPane = doc.querySelector('[data-pane="indice"]');
    if (idxPane && list.length && !idxPane.querySelector(".x-estrip")) {
      var s = doc.createElement("div");
      s.className = "x-estrip";
      s.innerHTML = "<small>Estudio</small><div>" + list.map(function (v) {
        return '<button class="x-chip" type="button" data-study-open="' + v.k + '">' + esc(v.t.replace("Pasajes paralelos", "Paralelos").replace("Secuencia del fin", "Secuencia").replace("Por qué postribulación", "Por qué post-trib.").replace("Por qué post-trib.", "Por qué")) + "</button>";
      }).join("") + "</div>";
      var hint = idxPane.querySelector(".x-menu__hint");
      idxPane.insertBefore(s, hint);
    }
    var menu = doc.getElementById("menu");
    if (menu && !menu._xstudy) {
      menu._xstudy = true;
      menu.addEventListener("click", function (e) { var b = e.target.closest("[data-study-open]"); if (b) openStudy(b.dataset.studyOpen); });
    }
  }

  /* ---------- búsqueda del menú (app.js la llama) ---------- */
  window.VeladExtras = {
    search: function (t) {
      var out = [];
      avail().forEach(function (v) {
        if (norm(v.t + " " + v.k).indexOf(t) >= 0) out.push({ title: v.t, sub: "Estudio · " + v.d, go: function () { openStudy(v.k); } });
      });
      if (GL && DATA.glosario) {
        var a = [], b = [];
        DATA.glosario.terminos.forEach(function (x) {
          var names = [x.termino].concat(x.alias || []).map(norm);
          var hit = names.some(function (n) { return n.indexOf(t) === 0; }) ? a : names.some(function (n) { return n.indexOf(t) >= 0; }) ? b : null;
          if (hit) hit.push({ title: x.termino, sub: "Glosario · " + x.def.slice(0, 90) + (x.def.length > 90 ? "…" : ""), go: function () { openStudy("glosario", x.id); } });
        });
        out = out.concat(a, b);
      }
      return out.slice(0, 6);
    },
    open: function (k) { openStudy(k); }
  };

  /* ---------- arranque ---------- */
  var started = false;
  function start() {
    if (started) return; started = true;
    makePop(); makeStudy(); bindPop();
    var lec = doc.getElementById("lectura-body"), dos = doc.getElementById("dossier-body"), set = doc.getElementById("set-gen");
    watch(lec, function (el) { markGloss(el); markRefs(el); });
    watch(dos, markRefs);
    watch(set, function (el) { if (!mob()) el.querySelectorAll(".x-ref").forEach(markRefs); });
    Promise.all(["secuencia", "glosario", "paralelos", "porque"].map(load)).then(function (r) {
      ["secuencia", "glosario", "paralelos", "porque"].forEach(function (k, i) { if (r[i]) DATA[k] = r[i]; });
      if (DATA.glosario) { try { buildGloss(DATA.glosario); if (lec) { markGloss(lec); } } catch (e) { GL = null; if (window.console) console.warn(e); } }
      menuEntries();
      var h = (location.hash || "").slice(1);
      if (DATA[h]) openStudy(h);
    });
    setTimeout(getVersos, 3500);
  }
  if (window.XNav) start();
  doc.addEventListener("velad-ready", start);
})();
