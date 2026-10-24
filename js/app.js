/* Page behaviors for Hark's component library: the nav, the theme toggle, tables, line charts and images. style-gates: data */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var LOGO = '<svg width="SIZE" height="SIZE" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path fill="currentColor" d="M25.096 30c-.072 0-.12-.048-.168-.12-4.776-6.384-12.216-10.8-20.736-11.688C4.048 18.168 4 18.096 4 18s.048-.168.192-.192c8.52-.888 15.96-5.304 20.736-11.688.048-.072.096-.12.168-.12s.096.024.168.072A15.02 15.02 0 0 1 31.12 18a15.02 15.02 0 0 1-5.856 11.928c-.072.048-.096.072-.168.072"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function each(a, f) { return (a || []).map(f).join(""); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function niceBounds(vals) {
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var step = Math.pow(10, Math.floor(Math.log10(Math.max(hi - lo, 1e-9))));
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    return hi === lo ? [lo - step, hi + step] : [lo, hi];
  }
  function fmtNum(v) { return Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
  function chartSVG(pts, opt, W) {
    W = Math.max(320, Math.round(W || 960));
    var L = 40, R = W - 40, T = 30, Bt = 210;
    var stagger = pts.length > 1 && (R - L) / (pts.length - 1) < 96;
    var nameY = function (i) { return 236 + (stagger && i % 2 ? 16 : 0); };
    var valueY = function (i, py) { return stagger && i % 2 ? Math.min(py + 22, Bt - 4) : py - 13; };
    var H = (opt.numbered ? 268 : 248) + (stagger ? 16 : 0);
    var bounds = niceBounds(pts.length ? pts.map(function (p) { return +p[1]; }) : [0, 1]), lo = bounds[0], hi = bounds[1];
    var x = function (i) { return L + (R - L) * (pts.length < 2 ? 0.5 : i / (pts.length - 1)); };
    var y = function (v) { return Bt - (Bt - T) * (v - lo) / (hi - lo || 1); };
    var unit = opt.unit ? " " + opt.unit : "";
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + "," + y(p[1]).toFixed(1); }).join(" ");
    var svg = '<g class="pf-grid">' + [30, 120, 210].map(function (gy) { return '<line x1="' + L + '" y1="' + gy + '" x2="' + R + '" y2="' + gy + '"></line>'; }).join("") + "</g>" +
      '<text class="pf-axis" x="0" y="34">' + fmtNum(hi) + '</text><text class="pf-axis" x="0" y="124">' + fmtNum((lo + hi) / 2) + '</text><text class="pf-axis" x="0" y="214">' + fmtNum(lo) + "</text>" +
      '<path class="pf-fill" d="' + line + " L" + R + "," + Bt + " L" + L + "," + Bt + ' Z"></path><path class="pf-line" d="' + line + '"></path>';
    pts.forEach(function (p, i) {
      var anchor = i === 0 ? ' text-anchor="start"' : i === pts.length - 1 ? ' text-anchor="end"' : "";
      svg += '<circle class="pf-dot" cx="' + x(i) + '" cy="' + y(p[1]) + '" r="4.5"></circle>' +
        '<text class="pf-alt" x="' + x(i) + '" y="' + valueY(i, y(p[1])) + '"' + anchor + ">" + esc(fmtNum(p[1]) + unit) + "</text>" +
        '<text class="pf-name" x="' + x(i) + '" y="' + nameY(i) + '"' + anchor + ">" + esc(p[0]) + "</text>";
      if (i && opt.numbered) svg += '<text class="pf-num" x="' + ((x(i - 1) + x(i)) / 2) + '" y="' + (H - 10) + '">' + pad2(i) + "</text>";
    });
    return ((opt.caption ? '<p class="chart__cap">' + esc(opt.caption) + "</p>" : "") +
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opt.label || opt.caption || "Line chart") + '">' + svg + "</svg>");
  }

  function contentWidth(el) {
    var cs = getComputedStyle(el);
    return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  }
  function drawCharts() {
    [].slice.call(doc.querySelectorAll(".chart[data-points]")).forEach(function (p) {
      var pts = p.getAttribute("data-points").split(",").map(function (x) { var m = x.split(":"); return [m[0].trim(), +m[1]]; });
      p.innerHTML = chartSVG(pts, { caption: p.getAttribute("data-caption"), unit: p.getAttribute("data-unit"),
        label: p.getAttribute("aria-label"), numbered: p.hasAttribute("data-numbered") }, contentWidth(p));
    });
  }
  function autoNav() {
    var sections = [].slice.call(doc.querySelectorAll("section[data-nav]"));
    var header = doc.querySelector("header.nav[data-auto]");
    if (header) {
      header.innerHTML = '<nav class="seg" aria-label="Sections">' +
        each(sections, function (s) { return '<a href="#' + esc(s.id) + '">' + esc(s.getAttribute("data-nav")) + "</a>"; }) + "</nav>" +
        '<button class="theme-btn" id="theme-btn" type="button" aria-label="Switch to dark theme"></button>';
    }
    [].slice.call(doc.querySelectorAll(".foot nav[data-auto]")).forEach(function (n) {
      n.innerHTML = '<a href="#top">Top</a>' + each(sections, function (s) { return '<a href="#' + esc(s.id) + '">' + esc(s.getAttribute("data-nav")) + "</a>"; });
    });
    drawCharts();
    window.addEventListener("resize", function () { clearTimeout(drawCharts.t); drawCharts.t = setTimeout(drawCharts, 150); }, { passive: true });
    [].slice.call(doc.querySelectorAll(".table-wrap table")).forEach(function (t) {
      var names = [].map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
      [].slice.call(t.querySelectorAll("tbody tr")).forEach(function (tr) {
        [].slice.call(tr.children).forEach(function (c, i) {
          if (c.tagName !== "TD") return;
          if (!c.textContent.trim() && !c.querySelector("img, svg")) c.classList.add("is-empty");
          else if (names[i] && !c.hasAttribute("data-label")) c.setAttribute("data-label", names[i]);
        });
      });
    });
    [].slice.call(doc.querySelectorAll(".compare table")).forEach(function (t) {
      t.parentNode.style.setProperty("--compare-cols", t.querySelectorAll("thead th").length);
      [].slice.call(t.querySelectorAll(".compare__media .chip")).forEach(function (chip) {
        chip.closest("th").appendChild(chip);
      });
      [].slice.call(t.querySelectorAll("tbody tr")).forEach(function (tr) {
        var head = tr.querySelector("th"), label = head ? head.textContent.trim() : "";
        [].slice.call(tr.querySelectorAll("td")).forEach(function (td) {
          if (label && !td.hasAttribute("data-label")) td.setAttribute("data-label", label);
        });
      });
    });
    [].slice.call(doc.querySelectorAll(".step__figure img, .band img")).forEach(function (im) {
      var mark = function () { if (im.naturalHeight > im.naturalWidth) im.parentNode.classList.add("is-portrait"); };
      if (im.complete) mark(); else im.addEventListener("load", mark);
    });
    [].slice.call(doc.querySelectorAll(".hark-mark:empty")).forEach(function (m) { m.innerHTML = LOGO.replace(/SIZE/g, m.getAttribute("data-size") || "20"); });
  }

  function behaviors() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var btn = doc.getElementById("theme-btn"), mq = window.matchMedia("(prefers-color-scheme: dark)");
    try { var saved = localStorage.getItem("hark-theme"); if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved); } catch (e) { /* storage blocked: follow the system theme */ }
    function current() { var t = root.getAttribute("data-theme"); return t === "light" || t === "dark" ? t : (mq.matches ? "dark" : "light"); }
    function label() { if (btn) btn.setAttribute("aria-label", current() === "dark" ? "Switch to light theme" : "Switch to dark theme"); }
    if (btn) btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("hark-theme", next); } catch (e) { /* storage blocked: the choice lasts this visit */ }
      label();
    });
    label();

    var seg = doc.querySelector(".seg");
    if (seg) {
      var links = [].slice.call(seg.querySelectorAll("a"));
      var targets = links.map(function (a) { return doc.getElementById(a.getAttribute("href").slice(1)); });
      var active = -2;
      var reveal = function (i) {
        if (i < 0) return;
        var a = links[i];
        var l = a.offsetLeft - 8, r = a.offsetLeft + a.offsetWidth + 8;
        if (l < seg.scrollLeft || r > seg.scrollLeft + seg.clientWidth) seg.scrollTo({ left: l, behavior: reduce ? "auto" : "smooth" });
      };
      var sync = function (force) {
        var line = window.innerHeight * 0.32, cur = -1;
        targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
        if (cur === active && !force) return;
        active = cur;
        links.forEach(function (a, i) { if (i === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
        reveal(cur);
      };
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return; ticking = true;
        window.requestAnimationFrame(function () { sync(false); ticking = false; });
      }, { passive: true });
      window.addEventListener("resize", function () { sync(true); }, { passive: true });
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { sync(true); });
      sync(true);
    }

    [].slice.call(doc.querySelectorAll(".chart")).forEach(function (chart) {
      if (reduce || !("IntersectionObserver" in window)) { chart.classList.add("is-in"); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { chart.classList.add("is-in"); io.disconnect(); } });
      }, { threshold: 0.3 });
      io.observe(chart);
    });
  }

  function start() {
    autoNav();
    behaviors();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})();

/* ---------- Velad: tablero de investigación. Todo se dibuja desde data.json ---------- */
function veladMain(DATA) {
        document.documentElement.setAttribute("data-theme", "dark");
        var BW = 2900, BH = 1700;
        var view = document.getElementById("view");
        var board = document.getElementById("board");
        var svg = document.getElementById("strings");
        var dossier = document.getElementById("dossier");
        var body = document.getElementById("dossier-body");
        var kicker = document.getElementById("dossier-kicker");
        var hud = document.querySelector(".x-hud");
        /* ---------- one data tree: maps inside maps, all drawn by the same renderer ---------- */
        var TREE = DATA.tree;
        /* inherited category colour lives in a non-enumerable field, so it never ends up in data.json */
        function inherit(m, c) {
          m.nodes.forEach(function (nd) {
            Object.defineProperty(nd, "_c", { value: nd.c || c, writable: true, configurable: true, enumerable: false });
            if (nd.children) inherit(nd.children, nd._c);
          });
        }
        inherit(TREE, "x-muted");
        var crumbs = document.getElementById("crumbs"), upBtn = document.getElementById("up"), setEl = document.getElementById("set-gen");
        var BRAND = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="#c9a75a" stroke-width="1"><circle cx="10" cy="10" r="9" /><path d="M10 5v10M6.5 8.5h7" /></svg>';
        var stack = [], MAP, cur, items, LINKS, POS, tl;
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var cam = { x: 0, y: 0, s: 1 };
        var focused = null;

        /* ---------- layout: organic investigation board, loosely chronological ---------- */
        var GAP = 44;
        var pinsSvg = document.getElementById("pins");
        function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
        function mapAt(path) { var m = TREE; path.forEach(function (n) { m = n.children; }); return m; }
        function nodeById(id) { for (var i = 0; i < MAP.nodes.length; i++) if (MAP.nodes[i].id === id) return MAP.nodes[i]; return null; }
        function countOf(nd) { var k = nd.children.nodes.length; return k + (k === 1 ? " tarjeta" : " tarjetas"); }
        function pad2(i) { return String(i).padStart(2, "0"); }
        /* organic grid: staggered rows, a little deterministic jitter */
        function autoPos(m) {
          var n = m.nodes.length, cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.7))), pos = {};
          function j(i, k) { var v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v) - 0.5; }
          m.nodes.forEach(function (nd, i) {
            var c = i % cols, r = Math.floor(i / cols);
            pos[nd.id] = [120 + c * 390 + (r % 2 ? 150 : 0) + Math.round(j(i, 1) * 80), 150 + r * 300 + Math.round(j(i, 2) * 90)];
          });
          return { pos: pos, w: Math.max(1400, 240 + cols * 390 + 150) };
        }
        /* chapter / block card (maps without their own design) */
        function cardHTML(nd, i, m) {
          var pend = nd.status === "pending", n = pend ? "Pendiente" : nd.n || pad2(i + 1);
          return '<article class="x-item' + (pend ? " is-pending" : "") + (nd.center ? " x-item--center" : "") + (nd.children ? " has-map" : "") + '" data-id="' + esc(nd.id) +
            '" tabindex="0" role="button" aria-label="' + esc(nd.title) + (nd.children ? ", contiene un mapa" : "") + '" style="--c:var(--' + nd._c + ')">' +
            '<p class="x-cat">' + esc(m.kind || "Capítulo") + " <em>· " + esc(n) + "</em></p><h3>" + esc(nd.title) + "</h3>" +
            (nd.ref ? '<p class="x-ref">' + esc(nd.ref) + "</p>" : "") +
            '<p class="x-note">' + esc(nd.summary || (nd.children ? countOf(nd) : "En estudio")) + "</p></article>";
        }
        /* expediente card: photo, category, tags, notes */
        function richCardHTML(nd, i) {
          var cls = "x-item" + (nd.photo ? " x-photo" : "") + (nd.center ? " x-item--center" : "") + (nd.lg ? " x-item--lg" : "") + (nd.children ? " has-map" : "");
          var aria = nd.aria || (nd.title + (nd.ref ? ", " + nd.ref : ""));
          var num = nd.num != null && nd.num !== "" ? nd.num : pad2(i + 1);
          var inner = '<p class="x-cat">' + esc(nd.cat || "Nota") + " <em>· " + esc(num) + "</em></p><h3>" + esc(nd.title) + "</h3>" +
            (nd.media || "") +
            (nd.ref ? '<p class="x-ref">' + esc(nd.ref) + "</p>" : "") +
            (nd.note ? '<p class="x-note">' + esc(nd.note) + "</p>" : "") +
            (nd.tags && nd.tags.length ? '<ul class="x-tags">' + nd.tags.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "");
          if (nd.photo) inner = '<figure><img src="' + esc(nd.photo.src) + '" alt="' + esc(nd.photo.alt || "") + '"/><figcaption>' + esc(nd.photo.caption || "") +
            '</figcaption></figure><div class="x-body">' + inner + "</div>";
          return '<article class="' + cls + '" data-id="' + esc(nd.id) + '" tabindex="0" role="button" aria-label="' + esc(aria) +
            '" style="' + esc(nd.style || "") + "--c:var(--" + nd._c + ')">' + inner + "</article>";
        }
        function timelineHTML(t) {
          return '<nav class="x-tl" aria-label="Línea de tiempo"><span class="x-tl-title">' + esc(t.title || "Línea de tiempo") + "</span>" +
            t.marks.map(function (k) {
              return '<button class="x-mark' + (k.gold ? " x-mark--gold" : "") + '" type="button" data-target="' + esc(k.target) + '">' + k.label + "</button>";
            }).join("") + "</nav>";
        }
        function renderCrumbs() {
          var h = '<button type="button" class="x-crumb x-crumb--brand" data-depth="0">' + BRAND + esc(TREE.brand) + "</button>";
          var trail = [TREE.title].concat(stack.map(function (n) { return n.title; }));
          trail.forEach(function (t, i) {
            h += '<span class="x-sep" aria-hidden="true">›</span>';
            h += i === trail.length - 1 ? '<span aria-current="page">' + esc(t) + "</span>"
              : '<button type="button" class="x-crumb" data-depth="' + i + '">' + esc(t) + "</button>";
          });
          crumbs.innerHTML = h;
        }
        function useMap(path) {
          stack = path; MAP = mapAt(path); cur = MAP.id;
          inherit(TREE, "x-muted");
          var owner = path[path.length - 1];
          POS = {};
          if (MAP.rich) {
            setEl.innerHTML = (MAP.intro ? '<p class="x-intro">' + MAP.intro + "</p>" : "") +
              MAP.nodes.map(function (nd, i) { return richCardHTML(nd, i); }).join("") +
              (MAP.timeline && MAP.timeline.marks.length ? timelineHTML(MAP.timeline) : "");
            MAP.nodes.forEach(function (nd) { POS[nd.id] = nd.pos || [120, 150]; });
            BW = MAP.w || 2900;
          } else {
            setEl.innerHTML = MAP.nodes.map(function (nd, i) { return cardHTML(nd, i, MAP); }).join("");
            if (MAP.nodes.every(function (nd) { return nd.pos; })) { MAP.nodes.forEach(function (nd) { POS[nd.id] = nd.pos; }); BW = MAP.w || 2400; }
            else { var A = autoPos(MAP); POS = A.pos; BW = A.w; }
          }
          setEl.hidden = false;
          items = {};
          setEl.querySelectorAll(".x-item").forEach(function (el) { items[el.dataset.id] = el; });
          setEl.querySelectorAll("img").forEach(function (img) {
            if (!img.complete) img.addEventListener("load", function () { drawStrings(); if (!focused) fitView(false); });
          });
          LINKS = MAP.links || []; tl = setEl.querySelector(".x-tl");
          board.style.width = BW + "px";
          document.getElementById("exp-title").textContent = MAP.title;
          document.getElementById("exp-label").innerHTML = MAP.subtitle ||
            esc(owner ? (mapAt(path.slice(0, -1)).kind || "Capítulo") + " · " + MAP.title : MAP.title) + " · <b>" + countOf(owner || { children: MAP }) + "</b>";
          document.title = TREE.brand + " — " + [TREE.title].concat(path.map(function (n) { return n.title; })).join(" › ");
          view.setAttribute("aria-label", "Tablero de investigación: " + MAP.title);
          upBtn.hidden = !path.length;
          renderCrumbs();
          document.dispatchEvent(new CustomEvent("x-map", { detail: { set: MAP.set || MAP.route || null } }));
        }
        /* ids from the root to a node: the last id may be a node to open on arrival */
        function resolve(ids, focusLast) {
          var m = TREE, path = [], n = focusLast ? ids.length - 1 : ids.length;
          for (var i = 0; i < n; i++) {
            var nd = m.nodes.filter(function (x) { return x.id === ids[i]; })[0];
            if (!nd || !nd.children) break;
            path.push(nd); m = nd.children;
          }
          return { path: path, focus: focusLast ? ids[ids.length - 1] : null };
        }
        function openPath(path, focusId) {
          if (focused) closeFocus();
          useMap(path);
          drawStrings();
          fitView(false);
          if (focusId) setTimeout(function () { focusItem(focusId); }, 60);
        }
        window.XNav = {
          open: function (ids) { var r = resolve(ids, false); openPath(r.path); },
          set: function () { return MAP.set || MAP.route || null; }
        };
        useMap([]);
        function layout() {
          var placed = [], cardsBottom = 0, right = 0;
          Object.keys(POS).sort(function (a, b) { return POS[a][1] - POS[b][1]; }).forEach(function (id) {
            var el = items[id];
            if (!el) return;
            var x = POS[id][0], y = POS[id][1], w = el.offsetWidth, h = el.offsetHeight;
            /* nudge down until it clears every card already placed */
            var hit = true;
            while (hit) {
              hit = false;
              placed.forEach(function (p) {
                if (x < p.r + GAP && x + w + GAP > p.l && y < p.b + GAP && y + h + GAP > p.t) { y = p.b + GAP; hit = true; }
              });
            }
            el.style.left = x + "px";
            el.style.top = y + "px";
            placed.push({ l: x, t: y, r: x + w, b: y + h });
            cardsBottom = Math.max(cardsBottom, y + h);
            right = Math.max(right, x + w);
          });
          /* a card moved past the right edge widens the board */
          if (right > BW) { BW = Math.ceil(right + 60); board.style.width = BW + "px"; }
          if (tl) {
            var tlTop = cardsBottom + 100;
            tl.style.top = tlTop + "px";
            BH = tlTop + 150 + 50;
          } else BH = Math.max(900, cardsBottom + 150);
          board.style.height = BH + "px";
          svg.setAttribute("viewBox", "0 0 " + BW + " " + BH);
          pinsSvg.setAttribute("viewBox", "0 0 " + BW + " " + BH);
        }

        /* ---------- threads: always visible, straight, pin to pin ---------- */
        function box(el) {
          var l = el.offsetLeft, t = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
          return { l: l, t: t, w: w, h: h, r: l + w, b: t + h, cx: l + w / 2, cy: t + h / 2 };
        }
        function linksOf(id) {
          var out = [];
          LINKS.forEach(function (l) {
            if (!items[l[0]] || !items[l[1]]) return;
            if (l[0] === id) out.push(l[1]); else if (l[1] === id) out.push(l[0]);
          });
          return out;
        }
        function pinOf(id) { var B = box(items[id]); return [B.cx, B.t + 9]; }
        function drawThreads() {
          var out = "", pins = "";
          LINKS.forEach(function (l) {
            if (!items[l[0]] || !items[l[1]]) return;
            var a = pinOf(l[0]), b = pinOf(l[1]);
            out += '<line data-a="' + l[0] + '" data-b="' + l[1] + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
          });
          Object.keys(items).forEach(function (k) {
            if (!linksOf(k).length) return;
            var p = pinOf(k);
            pins += '<circle data-id="' + k + '" cx="' + p[0] + '" cy="' + p[1] + '" r="5"/>';
          });
          svg.innerHTML = out;
          pinsSvg.innerHTML = pins;
          drawLinks(focused);
        }
        function drawLinks(id) {
          svg.classList.toggle("is-focus", !!id);
          pinsSvg.classList.toggle("is-focus", !!id);
          var hot = {};
          if (id) { hot[id] = true; linksOf(id).forEach(function (k) { hot[k] = true; }); }
          svg.querySelectorAll("line").forEach(function (ln) {
            ln.classList.toggle("is-hot", !!id && (ln.dataset.a === id || ln.dataset.b === id));
          });
          pinsSvg.querySelectorAll("circle").forEach(function (c) { c.classList.toggle("is-hot", !!hot[c.dataset.id]); });
        }
        function drawStrings() {
          layout();
          drawThreads();
          if (focused) markLinks(focused);
        }

        /* ---------- camera ---------- */
        var animTimer;
        function apply(anim) {
          clearTimeout(animTimer);
          if (anim && !reduce) {
            board.classList.add("x-anim");
            animTimer = setTimeout(function () { board.classList.remove("x-anim"); }, 750);
          } else board.classList.remove("x-anim");
          board.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.s + ")";
        }
        function fitScale() {
          return Math.min(1, Math.min(window.innerWidth / BW, window.innerHeight / BH) * 0.96);
        }
        function clampS(s) { return Math.max(fitScale() * 0.7, Math.min(3, s)); }
        function clampPos() {
          var vw = window.innerWidth, vh = window.innerHeight;
          cam.x = Math.max(vw * 0.15 - BW * cam.s, Math.min(vw * 0.85, cam.x));
          cam.y = Math.max(vh * 0.15 - BH * cam.s, Math.min(vh * 0.85, cam.y));
        }
        function fitView(anim) {
          document.documentElement.style.setProperty("--x-hud-h", hud.offsetHeight + "px");
          var vw = window.innerWidth, vh = window.innerHeight, s = fitScale();
          var top = hud.offsetHeight + 16;
          if ((vh - BH * s) / 2 < top && vh - top > 200) s = Math.min(s, (vh - top - 8) / BH);
          /* on phones keep every pista at a tappable size: start at the left (chronological start) */
          if (vw < 600 && s < 0.36) {
            cam.s = 0.36;
            cam.x = 8;
            cam.y = Math.max(top, Math.min((vh - BH * 0.36) / 2, top + 20));
            apply(anim);
            return;
          }
          cam.s = s;
          cam.x = (vw - BW * s) / 2;
          cam.y = Math.max((vh - BH * s) / 2, top);
          apply(anim);
        }
        function zoomAt(px, py, s) {
          s = clampS(s);
          var bx = (px - cam.x) / cam.s, by = (py - cam.y) / cam.s;
          cam.s = s; cam.x = px - bx * s; cam.y = py - by * s;
          clampPos(); apply(false);
        }
        function region() {
          var vw = window.innerWidth, vh = window.innerHeight;
          var top = hud.offsetHeight + 20;
          if (vw >= 760) return { l: 0, t: top, r: vw - dossier.offsetWidth - 24, b: vh };
          return { l: 0, t: top, r: vw, b: vh - dossier.offsetHeight };
        }
        function centerOn(el, linked) {
          var g = region();
          var aw = Math.max(120, g.r - g.l), ah = Math.max(120, g.b - g.t);
          var w = el.offsetWidth * 1.08, h = el.offsetHeight * 1.08;
          var s = Math.min(2, (aw * 0.86) / w, (ah * 0.86) / h);
          var cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
          /* pull back to show the related cards too, when they fit at a readable size */
          if (linked && linked.length) {
            var U = box(el);
            linked.forEach(function (k) {
              var B = box(items[k]);
              U.l = Math.min(U.l, B.l); U.t = Math.min(U.t, B.t); U.r = Math.max(U.r, B.r); U.b = Math.max(U.b, B.b);
            });
            var su = Math.min((aw * 0.92) / (U.r - U.l + 60), (ah * 0.92) / (U.b - U.t + 60));
            if (su >= s * 0.5) { s = Math.min(s, su); cx = (U.l + U.r) / 2; cy = (U.t + U.b) / 2; }
            else s = s * 0.6;
          }
          cam.s = s;
          cam.x = (g.l + g.r) / 2 - cx * s;
          cam.y = (g.t + g.b) / 2 - cy * s;
          apply(true);
        }

        /* ---------- focus + dossier ---------- */
        function markLinks(id) {
          var list = linksOf(id), linked = {};
          list.forEach(function (k) { linked[k] = true; });
          Object.keys(items).forEach(function (k) { items[k].classList.toggle("is-linked", !!linked[k]); });
          return list.slice().sort(function (a, b) { return items[a].offsetLeft - items[b].offsetLeft || items[a].offsetTop - items[b].offsetTop; });
        }
        function titleOf(id) { return items[id].querySelector("h3").textContent; }
        function focusItem(id) {
          var el = items[id];
          if (!el) return;
          if (focused && items[focused]) items[focused].classList.remove("is-focus");
          focused = id;
          el.classList.add("is-focus");
          board.classList.add("is-focus");
          var linked = markLinks(id);
          drawLinks(id);
          document.querySelectorAll(".x-mark").forEach(function (m) { m.classList.toggle("is-on", m.dataset.target === id); });

          var nd = nodeById(id) || {}, xrefs = nd.xref || [];
          body.innerHTML = "";
          if (nd.body != null && nd.body !== "") {
            kicker.textContent = nd.kicker || "Dossier";
            body.innerHTML = nd.body;
          } else {
            kicker.textContent = nd.kicker || ((MAP.kind || "Capítulo") + " · " + (nd.status === "pending" ? "Pendiente" : nd.n || pad2(MAP.nodes.indexOf(nd) + 1)) + (nd.ref ? " · " + nd.ref : ""));
            body.innerHTML = "<h2>" + esc(nd.title) + "</h2><p>" + esc(nd.summary || nd.note || (nd.children ? countOf(nd) : "En estudio")) + "</p>";
          }
          if (nd.children) {
            var k = document.createElement("div");
            k.className = "x-key";
            k.innerHTML = "<p>Esta tarjeta contiene un mapa: <b>" + esc(nd.children.title) + "</b>, " + countOf(nd) + ".</p>" +
              '<button class="btn x-open" type="button" data-open="' + esc(id) + '">Abrir mapa →</button>';
            body.appendChild(k);
          }
          if (nd.openRoute) {
            var rk = document.createElement("div");
            rk.className = "x-key";
            rk.innerHTML = "<p>Los lugares de este bloque, parada por parada, sobre el mapa.</p>" +
              '<button class="btn x-open" type="button" data-route>Abrir recorrido →</button>';
            body.appendChild(rk);
          }
          if (linked.length || xrefs.length) {
            var h = document.createElement("h3");
            h.textContent = "Relacionado con";
            var row = document.createElement("div");
            row.className = "x-gos";
            linked.forEach(function (k) {
              var b = document.createElement("button");
              b.type = "button"; b.className = "x-go"; b.dataset.go = k;
              b.style.setProperty("--c", items[k].style.getPropertyValue("--c"));
              b.setAttribute("aria-label", "Ir a " + titleOf(k));
              b.textContent = titleOf(k);
              row.appendChild(b);
            });
            xrefs.forEach(function (x, j) {
              var b = document.createElement("button");
              b.type = "button"; b.className = "x-go"; b.dataset.xref = j;
              b.style.setProperty("--c", "var(--x-gold)");
              b.setAttribute("aria-label", "Ir a " + x.label);
              b.textContent = x.label + " ↗";
              row.appendChild(b);
            });
            body.appendChild(h); body.appendChild(row);
          }
          body.scrollTop = 0;
          dossier.classList.add("is-open");
          dossier.setAttribute("aria-hidden", "false");
          centerOn(el, linked);
        }
        function closeFocus() {
          if (!focused) return;
          var el = items[focused];
          if (el) el.classList.remove("is-focus");
          focused = null;
          board.classList.remove("is-focus");
          drawLinks(null);
          Object.keys(items).forEach(function (k) { items[k].classList.remove("is-linked"); });
          document.querySelectorAll(".x-mark.is-on").forEach(function (m) { m.classList.remove("is-on"); });
          dossier.classList.remove("is-open");
          dossier.setAttribute("aria-hidden", "true");
          fitView(true);
          return el;
        }

        /* ---------- gestures ---------- */
        var pointers = new Map(), start = null, pinch = null, moved = false, tapTarget = null;
        function beginPan(p) { start = { x: p.x, y: p.y, cx: cam.x, cy: cam.y }; }
        function editing() { return window.XEdit && window.XEdit.active(); }
        view.addEventListener("pointerdown", function (e) {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          /* Modo edición: a finger or mouse on a card drags the card instead of the board */
          if (pointers.size === 0 && editing()) {
            var card = e.target.closest(".x-item");
            if (card && window.XEdit.dragStart(e, card)) { moved = false; return; }
          }
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          board.classList.remove("x-anim");
          var m = /matrix\(([^)]+)\)/.exec(getComputedStyle(board).transform);
          if (m) { var v = m[1].split(",").map(parseFloat); cam.s = v[0]; cam.x = v[4]; cam.y = v[5]; }
          apply(false);
          if (pointers.size === 1) {
            moved = false;
            tapTarget = e.target.closest(".x-item, .x-mark");
            beginPan(pointers.get(e.pointerId));
          } else if (pointers.size === 2) {
            moved = true;
            var pts = Array.from(pointers.values());
            pinch = {
              d: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1,
              mx: (pts[0].x + pts[1].x) / 2, my: (pts[0].y + pts[1].y) / 2,
              cx: cam.x, cy: cam.y, s: cam.s
            };
          }
        });
        window.addEventListener("pointermove", function (e) {
          if (!pointers.has(e.pointerId)) return;
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.size === 1 && start) {
            var dx = e.clientX - start.x, dy = e.clientY - start.y;
            if (!moved && Math.hypot(dx, dy) > 7) { moved = true; view.classList.add("is-grab"); }
            if (moved) { cam.x = start.cx + dx; cam.y = start.cy + dy; clampPos(); apply(false); }
          } else if (pointers.size >= 2 && pinch) {
            var pts = Array.from(pointers.values());
            var d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            var mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
            var s = clampS(pinch.s * d / pinch.d);
            var bx = (pinch.mx - pinch.cx) / pinch.s, by = (pinch.my - pinch.cy) / pinch.s;
            cam.s = s; cam.x = mx - bx * s; cam.y = my - by * s;
            clampPos(); apply(false);
          }
        });
        function endPointer(e) {
          if (!pointers.has(e.pointerId)) return;
          pointers.delete(e.pointerId);
          if (pointers.size === 1) { pinch = null; beginPan(Array.from(pointers.values())[0]); return; }
          if (pointers.size > 0) return;
          view.classList.remove("is-grab");
          pinch = null; start = null;
          if (!moved && e.type === "pointerup" && !tapTarget) closeFocus();
          /* taps on pistas and marks are handled by their click events */
        }
        window.addEventListener("pointerup", endPointer);
        window.addEventListener("pointercancel", endPointer);
        view.addEventListener("wheel", function (e) {
          e.preventDefault();
          board.classList.remove("x-anim");
          var k = e.ctrlKey ? 0.01 : 0.0018;
          var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
          zoomAt(e.clientX, e.clientY, cam.s * Math.exp(-dy * k));
        }, { passive: false });
        view.addEventListener("dragstart", function (e) { e.preventDefault(); });
        ["gesturestart", "gesturechange"].forEach(function (t) {
          document.addEventListener(t, function (e) { e.preventDefault(); });
        });

        /* ---------- keyboard + buttons ---------- */
        board.addEventListener("keydown", function (e) {
          var it = e.target.closest(".x-item");
          if (it && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            if (editing()) window.XEdit.tap(it.dataset.id); else focusItem(it.dataset.id);
          }
        });
        board.addEventListener("click", function (e) {
          if (editing()) {
            var ed = e.target.closest(".x-item");
            if (ed && !window.XEdit.consumeDrag()) window.XEdit.tap(ed.dataset.id);
            return;
          }
          if (moved) return;
          var it = e.target.closest(".x-item");
          if (it) { focusItem(it.dataset.id); return; }
          var m = e.target.closest(".x-mark");
          if (m) focusItem(m.dataset.target);
        });
        board.addEventListener("dblclick", function (e) {
          if (editing()) return;
          var it = e.target.closest(".x-item.has-map");
          if (it) openPath(stack.concat([nodeById(it.dataset.id)]));
        });
        body.addEventListener("click", function (e) {
          var b = e.target.closest("[data-go]");
          if (b) { focusItem(b.dataset.go); return; }
          var o = e.target.closest("[data-open]");
          if (o) { openPath(stack.concat([nodeById(o.dataset.open)])); return; }
          if (e.target.closest("[data-route]")) { document.querySelector('.x-vw[data-view="route"]').click(); return; }
          var x = e.target.closest("[data-xref]");
          if (x && focused) {
            var r = resolve(nodeById(focused).xref[+x.dataset.xref].to, true);
            openPath(r.path, r.focus);
          }
        });
        crumbs.addEventListener("click", function (e) {
          var c = e.target.closest("[data-depth]");
          if (c) openPath(stack.slice(0, +c.dataset.depth));
        });
        upBtn.addEventListener("click", function () { if (stack.length) openPath(stack.slice(0, -1)); });
        document.getElementById("close").addEventListener("click", function () {
          var el = closeFocus();
          if (el) el.focus({ preventScroll: true });
        });
        document.getElementById("reset").addEventListener("click", function () {
          if (focused) closeFocus(); else fitView(true);
        });
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && focused) { var el = closeFocus(); if (el) el.focus({ preventScroll: true }); }
        });

        /* ---------- layout ---------- */
        var rz;
        window.addEventListener("resize", function () {
          clearTimeout(rz);
          rz = setTimeout(function () {
            drawStrings();
            if (focused && items[focused]) centerOn(items[focused], linksOf(focused)); else fitView(false);
          }, 120);
        });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
          drawStrings();
          if (!focused) fitView(false);
        });
        drawStrings();
        fitView(false);

        /* ---------- small API for Modo edición (js/edit.js) ---------- */
        window.XApp = {
          data: function () { return DATA; },
          tree: function () { return TREE; },
          replaceData: function (d) { DATA = d; TREE = d.tree; inherit(TREE, "x-muted"); },
          map: function () { return MAP; },
          stack: function () { return stack; },
          items: function () { return items; },
          pos: function () { return POS; },
          board: function () { return { w: BW, h: BH }; },
          cam: function () { return cam; },
          node: nodeById,
          mapAt: mapAt,
          resolve: resolve,
          /* redraw the current map keeping the camera where it is */
          refresh: function () {
            var f = focused;
            if (f) closeFocusQuiet();
            var ids = stack.map(function (n) { return n.id; }), r = resolve(ids, false);
            useMap(r.path); drawStrings(); apply(false);
          },
          open: function (path) { openPath(path); },
          openIds: function (ids) { var r = resolve(ids, false); openPath(r.path); },
          threads: drawThreads,
          strings: drawStrings,
          closeFocus: function () { if (focused) closeFocus(); },
          /* screen point -> board coordinates */
          toBoard: function (x, y) { return [(x - cam.x) / cam.s, (y - cam.y) / cam.s]; },
          viewCenter: function () { return [(window.innerWidth / 2 - cam.x) / cam.s, ((window.innerHeight + hud.offsetHeight) / 2 - cam.y) / cam.s]; },
          esc: esc
        };
        function closeFocusQuiet() {
          if (items[focused]) items[focused].classList.remove("is-focus");
          focused = null; board.classList.remove("is-focus");
          dossier.classList.remove("is-open"); dossier.setAttribute("aria-hidden", "true");
        }
}

/* ---------- Recorrido: one renderer, two stop arrays ---------- */
      function veladRoute() {
        /* place records and photos: OpenBible.info Bible Geocoding, CC BY 4.0 */
        var OB = "https://www.openbible.info/geo/ancient/";
        var CAP = {
          jer: "Jerusalén, vista aérea del Monte del Templo · Foto: Godot13, CC BY-SA 4.0 · vía OpenBible.info",
          olivos: "Monte de los Olivos · Foto: xiquinhosilva, CC BY 2.0 · vía OpenBible.info",
          meg: "Tel Meguido · Foto: Liorca, CC BY-SA 4.0 · vía OpenBible.info",
          bab: "Puerta de Ishtar de Babilonia · Museo de Pérgamo · Foto: Radomir Vrbovsky, CC BY-SA 4.0 · vía OpenBible.info"
        };
        var ROUTES = {
          e1: [
            { t: "El Templo de Herodes", pl: "Monte del Templo, Jerusalén", pin: "Monte del Templo", g: [35.2354, 31.7781], z: 0.045, a: "l", ref: "Mt 24:1-2",
              tx: "Cuando Jesús salió del templo y se iba, se acercaron sus discípulos para mostrarle los edificios del templo. Respondiendo él, les dijo: ¿Veis todo esto? De cierto os digo, que no quedará aquí piedra sobre piedra, que no sea derribada.",
              n: "El discurso nace frente a los edificios del templo.", ph: "templo_s.jpg", cap: "Maqueta del Segundo Templo · Museo de Israel" },
            { t: "El Monte de los Olivos", pl: "Monte de los Olivos, Jerusalén", pin: "Monte de los Olivos", g: [35.245686, 31.777946], z: 0.045, ref: "Mt 24:3",
              tx: "Y estando él sentado en el monte de los Olivos, los discípulos se le acercaron aparte, diciendo: Dinos, ¿cuándo serán estas cosas, y qué señal habrá de tu venida, y del fin del siglo?",
              n: "Desde aquí, con vista al templo, Jesús responde.", ph: "olivos_s.jpg", cap: "Vista desde el Monte de los Olivos sobre el Monte del Templo",
              ob: OB + "ac2c4c5/mount-of-olives" },
            { t: "Jerusalén sitiada", pl: "Jerusalén", pin: "Jerusalén", g: [35.2345, 31.7767], z: 0.045, a: "l", ref: "Lc 21:20",
              tx: "Pero cuando viereis a Jerusalén rodeada de ejércitos, sabed entonces que su destrucción ha llegado.",
              n: "En 70 d.C. las legiones de Tito sitiaron la ciudad (Josefo, Guerras de los judíos, libro VI).",
              ph: "ob_jerusalem.jpg", cap: CAP.jer, ob: OB + "a15257a/jerusalem" },
            { t: "El lugar santo", pl: "Monte del Templo (Monte Moriah), Jerusalén", pin: "Lugar santo", g: [35.235556, 31.777778], z: 0.045, ref: "Mt 24:15",
              tx: "Por tanto, cuando veáis en el lugar santo la abominación desoladora de que habló el profeta Daniel (el que lee, entienda),",
              n: "OpenBible.info identifica el lugar santo con el Monte Moriah.", ob: OB + "ab60a74/holy-place-2" },
            { t: "Los montes de Judea", pl: "Judea", pin: "Judea", g: [35.15, 31.70], z: 0.6, ref: "Mt 24:16",
              tx: "entonces los que estén en Judea, huyan a los montes.",
              n: "La serranía que rodea Jerusalén.", ph: "ob_judea-1.jpg", cap: "Montes de Judea · Foto: Davidbena, CC BY-SA 4.0 · vía OpenBible.info",
              ob: OB + "a149f13/judea-1" },
            { t: "Huida a los montes", pl: "Pella, actual Jordania", pin: "Pella", g: [35.617, 32.45], z: 1.4, ref: "Mt 24:16",
              tx: "entonces los que estén en Judea, huyan a los montes.",
              n: "Eusebio (Historia eclesiástica III.5.3) registra que la iglesia de Jerusalén se retiró a Pella antes de la guerra.", ph: "pella_s.jpg", cap: "Ruinas de Pella · Jordania" },
            { t: "Roma", pl: "Arco de Tito, Roma", pin: "Roma", g: [12.4884, 41.8907], z: 8, w: 5, ref: "Mt 24:2",
              tx: "De cierto os digo, que no quedará aquí piedra sobre piedra, que no sea derribada.",
              n: "El relieve del arco (c. 81 d.C.) muestra el botín del templo, incluida la menorá.", ph: "titus_s.jpg", cap: "Arco de Tito · Roma, c. 81 d.C." },
            { t: "El regreso al mismo monte", pl: "Monte de los Olivos, Jerusalén", pin: "Monte de los Olivos", g: [35.2448, 31.7784], z: 0.045, ref: "Hch 1:11",
              tx: "Varones galileos, ¿por qué estáis mirando al cielo? Este mismo Jesús, que ha sido tomado de vosotros al cielo, así vendrá como le habéis visto ir al cielo.",
              n: "El recorrido cierra donde empezó.", go: "e2",
              ph: "ob_mount-of-olives.jpg", cap: CAP.olivos, ob: OB + "ac2c4c5/mount-of-olives" }
          ],
          e2: [
            { t: "Patmos", pl: "Mar Egeo", pin: "Patmos", g: [26.541667, 37.325], z: 12, ref: "Ap 1:9",
              tx: "Yo Juan... estaba en la isla llamada Patmos, por causa de la palabra de Dios y el testimonio de Jesucristo.",
              n: "Allí Juan recibe la visión, a fines del siglo I.",
              ph: "ob_patmos.jpg", cap: "Skala, Patmos · Foto: IWYLLPA, CC BY-SA 3.0 · vía OpenBible.info", ob: OB + "a8f60f3/patmos" },
            { t: "El río Éufrates", pl: "Éufrates", pin: "Éufrates", g: [40.0, 35.5], z: 6, ref: "Ap 16:12",
              tx: "El sexto ángel derramó su copa sobre el gran río Éufrates; y el agua de este se secó, para que estuviese preparado el camino a los reyes del oriente.",
              n: "El camino a la reunión de Armagedón (16:13-16).",
              ph: "ob_euphrates.jpg", cap: "Río Éufrates · Foto: Ferrus, dominio público · vía OpenBible.info", ob: OB + "a62dec4/euphrates" },
            { t: "Meguido", pl: "Valle de Jezreel", pin: "Meguido", g: [35.185, 32.585], z: 1.4, ref: "Ap 16:16",
              tx: "Y los reunió en el lugar que en hebreo se llama Armagedón.",
              n: "Tel con más de veinte estratos de ciudades; dominaba la Vía Maris. OpenBible.info ubica Armagedón en el valle de Jezreel, junto a Meguido.",
              ph: "ob_megiddo.jpg", cap: CAP.meg, ob: OB + "a8554e3/megiddo" },
            { t: "Jerusalén", pl: "Jerusalén", pin: "Jerusalén", g: [35.2345, 31.7767], z: 0.045, a: "l", ref: "Zac 14:3",
              tx: "Después saldrá Jehová y peleará con aquellas naciones, como peleó en el día de la batalla.",
              n: "Las naciones reunidas contra Jerusalén (14:2).", ph: "olivos_s.jpg", cap: "Jerusalén desde el Monte de los Olivos" },
            { t: "Monte de los Olivos", pl: "Monte de los Olivos, Jerusalén", pin: "Monte de los Olivos", g: [35.2448, 31.7784], z: 0.045, ref: "Zac 14:4",
              tx: "Y se afirmarán sus pies en aquel día sobre el monte de los Olivos, que está en frente de Jerusalén al oriente",
              n: "El lugar de la ascensión es el lugar del regreso (Hch 1:11).", ph: "olivos2_s.jpg", cap: "Monte de los Olivos · Foto: Wikimedia Commons",
              ob: OB + "ac2c4c5/mount-of-olives" },
            { t: "El monte de Sion", pl: "Monte Sion, Jerusalén", pin: "Monte Sion", g: [35.228611, 31.771667], z: 0.045, a: "l", ref: "Ap 14:1",
              tx: "Después miré, y he aquí el Cordero estaba en pie sobre el monte de Sion, y con él ciento cuarenta y cuatro mil, que tenían el nombre de él y el de su Padre escrito en la frente.",
              n: "El Cordero en Sion.", ph: "ob_mount-zion.jpg", cap: "Monte Sion desde Abu Tor · Foto: Eman, CC0 · vía OpenBible.info", ob: OB + "abd9596/mount-zion" }
          ],
          e3: [
            { t: "Jerusalén sitiada", pl: "Jerusalén", pin: "Jerusalén", g: [35.234167, 31.776667], z: 0.045, ref: "Dn 1:1",
              tx: "En el año tercero del reinado de Joacim rey de Judá, vino Nabucodonosor rey de Babilonia a Jerusalén, y la sitió.",
              ph: "ob_jerusalem.jpg", cap: CAP.jer, ob: OB + "a15257a/jerusalem" },
            { t: "Babilonia", pl: "Babilonia, actual Irak", pin: "Babilonia", g: [44.422222, 32.543333], z: 4, ref: "Dn 1:2",
              tx: "Y el Señor entregó en sus manos a Joacim rey de Judá, y parte de los utensilios de la casa de Dios; y los trajo a tierra de Sinar, a la casa de su dios, y colocó los utensilios en la casa del tesoro de su dios.",
              n: "La Puerta de Ishtar, hoy reconstruida en el Museo de Pérgamo, Berlín.", ph: "ob_babylon-1.jpg", cap: CAP.bab, ob: OB + "a217d18/babylon-1" },
            { t: "El campo de Dura", pl: "Provincia de Babilonia", pin: "Dura", g: [46.365556, 30.774444], z: 4, ref: "Dn 3:1",
              tx: "El rey Nabucodonosor hizo una estatua de oro cuya altura era de sesenta codos, y su anchura de seis codos; la levantó en el campo de Dura, en la provincia de Babilonia.",
              n: "Identificación propuesta por OpenBible.info: Tall al-Lahm (ubicación incierta).", ob: OB + "a3bcd66/dura" },
            { t: "Susa, junto al río Ulai", pl: "Susa, provincia de Elam (actual Shush, Irán)", pin: "Susa", g: [48.25778, 32.18922], z: 4, ref: "Dn 8:2",
              tx: "Vi en visión; y cuando la vi, yo estaba en Susa, que es la capital del reino en la provincia de Elam; vi, pues, en visión, estando junto al río Ulai.",
              n: "Fundamentos del palacio de Darío el Grande.", ph: "ob_susa.jpg", cap: "Palacio de Darío, Susa · Foto: Carole Raddato, CC BY-SA 2.0 · vía OpenBible.info", ob: OB + "a033b84/susa" },
            { t: "Media y Persia", pl: "Persia (actual Irán)", pin: "Persia", g: [52.89, 29.935], z: 6, ref: "Dn 8:20",
              tx: "En cuanto al carnero que viste, que tenía dos cuernos, estos son los reyes de Media y de Persia.",
              ph: "ob_persia.jpg", cap: "Ruinas de Persépolis · Foto: Hadis Faghiri, CC BY 4.0 · vía OpenBible.info", ob: OB + "ab9696f/persia" },
            { t: "Grecia", pl: "Grecia", pin: "Grecia", g: [22.35, 40.085], z: 6, ref: "Dn 8:21",
              tx: "El macho cabrío es el rey de Grecia, y el cuerno grande que tenía entre sus ojos es el rey primero.",
              ph: "ob_greece.jpg", cap: "Monte Olimpo, Grecia · Foto: George E. Koronaios, CC BY-SA 4.0 · vía OpenBible.info", ob: OB + "a4492a0/greece" },
            { t: "El gran río Hidekel", pl: "Río Tigris", pin: "Tigris", g: [43.2, 36.3], z: 6, ref: "Dn 10:4",
              tx: "Y el día veinticuatro del mes primero estaba yo a la orilla del gran río Hidekel.",
              n: "El Hidekel es el Tigris. Allí comienza la visión final de Daniel (caps. 10–12).",
              ph: "ob_tigris.jpg", cap: "Río Tigris · Foto: Dûrzan cîrano, CC BY-SA 3.0 · vía OpenBible.info", ob: OB + "a38ebfd/tigris" }
          ],
          e4: [
            { t: "Escapá de Babilonia", pl: "Babilonia", pin: "Babilonia", g: [44.422222, 32.543333], z: 4, ref: "Zac 2:7",
              tx: "Oh Sion, la que moras con la hija de Babilonia, escápate.",
              ph: "ob_babylon-1.jpg", cap: CAP.bab, ob: OB + "a217d18/babylon-1" },
            { t: "Hadrac y Damasco", pl: "Damasco, Siria", pin: "Damasco", g: [36.30639, 33.511112], z: 1.4, ref: "Zac 9:1",
              tx: "La profecía de la palabra de Jehová está contra la tierra de Hadrac y sobre Damasco; porque a Jehová deben mirar los ojos de los hombres, y de todas las tribus de Israel.",
              ph: "ob_damascus.jpg", cap: "Muralla de la ciudadela de Damasco · Foto: Dosseman, CC BY-SA 4.0 · vía OpenBible.info", ob: OB + "a69c1d4/damascus" },
            { t: "Tiro y Sidón", pl: "Tiro, Líbano", pin: "Tiro", g: [35.196111, 33.270833], z: 1.4, a: "l", ref: "Zac 9:2",
              tx: "También Hamat será comprendida en el territorio de este; Tiro y Sidón, aunque sean muy sabias.",
              ph: "ob_tyre.jpg", cap: "Columnas en Al-Mina, Tiro · Foto: Vyacheslav Argenberg, CC BY 4.0 · vía OpenBible.info", ob: OB + "a160272/tyre" },
            { t: "Ascalón y Gaza", pl: "Costa filistea", pin: "Ascalón", g: [34.545833, 31.663889], z: 1.4, a: "l", ref: "Zac 9:5",
              tx: "Verá Ascalón, y temerá; Gaza también, y se dolerá en gran manera; asimismo Ecrón, porque su esperanza será confundida; y perecerá el rey de Gaza, y Ascalón no será habitada.",
              ph: "ob_ashkelon.jpg", cap: "Puerta cananea de Ascalón · Foto: Hanay, CC BY-SA 3.0 · vía OpenBible.info", ob: OB + "ac87d4c/ashkelon" },
            { t: "El llanto en el valle de Meguido", pl: "Valle de Meguido", pin: "Meguido", g: [35.184444, 32.585278], z: 1.4, ref: "Zac 12:11",
              tx: "En aquel día habrá gran llanto en Jerusalén, como el llanto de Hadadrimón en el valle de Meguido.",
              n: "OpenBible.info identifica Hadadrimón con Rummanah, al sur de Meguido.", ph: "ob_megiddo.jpg", cap: CAP.meg, ob: OB + "a8554e3/megiddo" },
            { t: "Sus pies sobre el monte", pl: "Monte de los Olivos, Jerusalén", pin: "Monte de los Olivos", g: [35.245686, 31.777946], z: 0.045, ref: "Zac 14:4",
              tx: "Y se afirmarán sus pies en aquel día sobre el monte de los Olivos, que está en frente de Jerusalén al oriente",
              ph: "ob_mount-of-olives.jpg", cap: CAP.olivos, ob: OB + "ac2c4c5/mount-of-olives" },
            { t: "Hasta Azal", pl: "Al este y norte de Jerusalén", pin: "Azal", g: [35.228619, 31.897515], z: 0.6, ref: "Zac 14:5",
              tx: "Y huiréis al valle de los montes, porque el valle de los montes llegará hasta Azal; huiréis de la manera que huisteis por causa del terremoto en los días de Uzías rey de Judá; y vendrá Jehová mi Dios, y con él todos los santos.",
              n: "Identificación propuesta por OpenBible.info: Khirbet Nisieh (incierta).", ob: OB + "ad041dd/azal" },
            { t: "Aguas vivas", pl: "Mar Muerto y Mediterráneo", pin: "Mar oriental", g: [35.5, 31.5], z: 1.4, ref: "Zac 14:8",
              tx: "Acontecerá también en aquel día, que saldrán de Jerusalén aguas vivas, la mitad de ellas hacia el mar oriental, y la otra mitad hacia el mar occidental, en verano y en invierno.",
              n: "Mar oriental: Mar Muerto. Mar occidental: Mediterráneo.", ph: "ob_salt-sea.jpg", cap: "Mar Muerto · Foto: Mujaddara, CC BY-SA 3.0 · vía OpenBible.info", ob: OB + "abed304/salt-sea" },
            { t: "Jerusalén enaltecida", pl: "Desde Geba hasta Rimón", pin: "Jerusalén", g: [35.234167, 31.776667], z: 0.6, a: "l", ref: "Zac 14:10",
              tx: "Toda la tierra se volverá como llanura desde Geba hasta Rimón al sur de Jerusalén; y esta será enaltecida, y habitada en su lugar desde la puerta de Benjamín hasta el lugar de la puerta primera, hasta la puerta del Ángulo, y desde la torre de Hananeel hasta los lagares del rey.",
              n: "OpenBible.info: Geba ≈ Tel el-Ful; Rimón ≈ Khirbet Umm er-Rammamin.", ph: "ob_jerusalem.jpg", cap: CAP.jer, ob: OB + "a15257a/jerusalem" }
          ]
        };

        /* simplified coastlines, [lng, lat]; open = shoreline running off the frame */
        var GEO = [
          { open: true, p: [[3.2,43.2],[4.8,43.4],[6.0,43.1],[7.0,43.6],[8.0,43.9],[8.9,44.4],[9.8,44.1],[10.3,43.6],[10.5,42.9],[11.1,42.4],[11.8,42.1],[12.25,41.75],[12.9,41.35],[13.6,41.2],[14.1,40.8],[14.4,40.6],[15.0,40.2],[15.6,40.0],[15.8,39.4],[16.1,38.9],[15.7,38.3],[15.65,37.95],[16.1,38.0],[16.6,38.4],[17.1,38.9],[17.2,39.4],[16.6,39.8],[17.0,40.4],[17.8,40.3],[18.4,40.0],[18.5,40.2],[18.0,40.7],[17.2,41.0],[16.0,41.4],[15.9,41.9],[14.7,42.1],[14.0,42.6],[13.6,43.5],[12.6,44.0],[12.3,44.8],[12.4,45.4],[13.1,45.7],[13.7,45.6],[13.9,44.9],[14.5,45.2],[15.2,44.3],[15.9,43.6],[16.5,43.5],[17.4,43.0],[18.5,42.4],[19.4,41.9],[19.5,41.3],[19.4,40.6],[19.9,40.0],[20.2,39.6],[20.7,39.0],[21.1,38.4],[21.4,37.7],[21.7,37.0],[22.2,36.6],[22.4,36.4],[22.6,36.8],[23.0,36.5],[23.2,36.4],[22.8,37.5],[23.6,37.9],[24.0,37.7],[24.0,38.2],[23.6,38.6],[22.9,39.0],[23.3,39.2],[22.7,39.6],[22.6,40.3],[22.9,40.6],[23.8,40.0],[23.9,40.4],[24.4,40.1],[24.0,40.7],[24.9,40.9],[25.9,40.85],[26.3,40.6],[26.2,40.05],[26.1,39.5],[26.8,39.3],[26.8,38.7],[26.3,38.3],[27.0,38.0],[27.3,37.4],[27.4,37.0],[28.0,36.6],[29.1,36.6],[29.6,36.2],[30.5,36.3],[30.6,36.8],[31.4,36.8],[32.0,36.5],[32.8,36.0],[33.6,36.2],[34.2,36.4],[34.7,36.8],[35.6,36.6],[36.2,36.6],[35.8,36.3],[35.8,35.8],[35.9,35.2],[35.9,34.6],[35.5,34.0],[35.1,33.1],[34.9,32.5],[34.7,31.9],[34.3,31.3],[33.8,31.1],[32.3,31.25],[31.9,31.5],[31.0,31.6],[30.4,31.45],[29.9,31.2],[29.0,30.85],[28.0,31.1],[27.2,31.35],[25.2,31.6],[24.6,32.0],[23.2,32.3],[22.4,32.9],[21.4,32.8],[20.4,32.3],[20.0,31.6],[20.1,31.0],[19.2,30.3],[18.4,30.6],[17.4,31.1],[16.0,31.4],[15.2,32.3],[13.9,32.8],[12.4,32.9],[11.5,33.1],[10.8,33.6],[10.1,33.8],[10.0,34.3],[10.7,34.8],[11.1,35.3],[10.6,36.0],[10.4,36.7],[11.1,37.0],[10.3,37.2],[9.8,37.3],[9.1,37.1],[8.6,36.95],[7.0,37.0],[5.0,36.7],[3.0,36.8]] },
          { open: true, p: [[41.5,41.5],[39.7,41.0],[38.0,40.95],[36.5,41.3],[36.0,41.7],[35.1,42.05],[33.3,41.95],[31.4,41.1],[29.1,41.2],[28.0,41.6],[27.5,42.5],[27.9,43.2],[28.6,44.0],[29.6,44.8],[29.7,45.3],[30.6,46.2],[31.6,46.55],[32.6,46.1],[32.5,45.4],[33.5,44.5],[34.4,44.6],[35.4,45.0],[36.5,45.3],[37.8,44.7],[38.6,44.3],[39.7,43.5],[41.5,42.0]] },
          { p: [[9.4,43.0],[9.55,42.6],[9.4,41.9],[9.2,41.4],[8.8,41.6],[8.6,42.0],[8.6,42.4],[9.0,42.7],[9.3,42.95]] },
          { p: [[9.2,41.25],[9.7,40.9],[9.8,40.1],[9.6,39.3],[9.1,39.2],[8.6,38.9],[8.4,39.1],[8.4,39.8],[8.5,40.3],[8.2,40.6],[8.3,41.0],[8.8,40.9]] },
          { p: [[12.4,38.0],[13.3,38.2],[14.2,38.0],[15.1,38.2],[15.6,38.3],[15.3,37.8],[15.1,37.1],[15.2,36.7],[14.5,36.75],[13.5,37.1],[12.6,37.6]] },
          { p: [[23.5,35.3],[24.3,35.35],[25.0,35.4],[25.7,35.3],[26.3,35.25],[26.1,35.0],[25.0,34.95],[24.0,35.1],[23.6,35.2]] },
          { p: [[32.3,35.1],[32.9,35.4],[33.9,35.35],[34.6,35.7],[34.0,35.0],[33.6,34.95],[33.0,34.6],[32.5,34.75]] },
          { p: [[26.5,37.36],[26.6,37.33],[26.57,37.28],[26.53,37.3]] },
          { lake: true, p: [[35.47,31.78],[35.58,31.75],[35.6,31.45],[35.5,31.1],[35.42,31.3],[35.39,31.55]] },
          { lake: true, p: [[35.53,32.88],[35.65,32.85],[35.64,32.72],[35.58,32.70],[35.52,32.78]] },
          { lake: true, open: true, p: [[35.57,32.70],[35.56,32.4],[35.55,32.1],[35.54,31.78]] },
          /* Euphrates, Tigris, Persian Gulf (northern shore) */
          { lake: true, open: true, p: [[38.6,37.2],[38.0,36.3],[40.1,35.3],[41.4,34.4],[43.3,33.1],[44.4,32.5],[46.0,31.0],[47.4,31.0]] },
          { lake: true, open: true, p: [[40.2,37.9],[42.0,37.1],[43.2,36.3],[43.8,34.6],[44.5,33.3],[46.0,32.3],[47.4,31.0]] },
          { open: true, p: [[47.9,30.0],[48.8,30.0],[50.3,29.3],[51.4,27.9],[54.0,26.5],[56.3,27.2]] }
        ];
        /* place labels: [lng, lat, text, min°, max° of visible span, sea?, rotate?] */
        var PLACES = [
          [18.5, 34.0, "Mar Mediterráneo", 6, 99, 1], [24.6, 39.0, "Mar Egeo", 4, 99, 1], [34.0, 43.3, "Mar Negro", 8, 99, 1],
          [13.6, 42.3, "Italia", 6, 99], [21.9, 39.5, "Grecia", 4, 99], [32.5, 38.8, "Asia Menor", 6, 99], [30.5, 30.0, "Egipto", 6, 99],
          [35.2354, 31.7781, "Jerusalén", 0.3, 40], [35.05, 31.5, "Judea", 0.6, 5], [35.5, 31.45, "Mar Muerto", 0.5, 4, 1],
          [35.6, 32.8, "Mar de Galilea", 0.5, 3, 1], [35.2398, 31.7705, "Valle del Cedrón", 0.01, 0.12, 0, 1],
          /* OpenBible.info places; the 8th field drops a city label below its point, in px */
          [44.422222, 32.543333, "Babilonia", 2.5, 60, 0, 0, 20], [48.25778, 32.18922, "Susa", 2.5, 40, 0, 0, 20],
          [53.6, 31.4, "Persia", 7, 99], [36.30639, 33.511112, "Damasco", 1, 20, 0, 0, 20],
          [35.196111, 33.270833, "Tiro", 1, 12, 0, 0, 20], [34.545833, 31.663889, "Ascalón", 1, 8, 0, 0, 20],
          [35.184444, 32.585278, "Meguido", 1, 8, 0, 0, 20], [26.541667, 37.325, "Patmos", 3, 60, 0, 0, 20],
          [42.1, 33.45, "Río Éufrates", 2.5, 40, 1], [45.0, 34.2, "Río Tigris", 2.5, 40, 1], [50.6, 27.4, "Golfo Pérsico", 4, 99, 1]
        ];

        var K = 40, KX = K * Math.cos(35 * Math.PI / 180), L0 = 7, A0 = 47, NS = "http://www.w3.org/2000/svg";
        function P(g) { return [(g[0] - L0) * KX, (A0 - g[1]) * K]; }
        var route = document.getElementById("route"), rmap = document.getElementById("rmap");
        var geo = document.getElementById("rgeo"), ink = document.getElementById("rink");
        var hud = document.querySelector(".x-hud"), reset = document.getElementById("reset"), hint = document.querySelector(".x-hint");
        var hintText = hint ? hint.textContent : "";
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        function el(tag, attrs, parent) {
          var e = document.createElementNS(NS, tag);
          for (var k in attrs) e.setAttribute(k, attrs[k]);
          if (parent) parent.appendChild(e);
          return e;
        }
        GEO.forEach(function (s) {
          var d = s.p.map(function (g, i) { var u = P(g); return (i ? "L" : "M") + u[0].toFixed(3) + " " + u[1].toFixed(3); }).join("") + (s.open ? "" : "Z");
          el("path", { d: d, "class": s.lake ? "x-lake" : "" }, geo);
        });

        var exp = "e1", stops = ROUTES.e1, idx = 0, cam = null, W = 1, H = 1, anim = 0;
        var lines = [], pins = [], hits = [], halo, label, places = [];

        function size() { W = rmap.clientWidth || 1; H = rmap.clientHeight || 1; }
        function target(i) {
          var st = stops[i], pts = [P(st.g)];
          if (st.w != null) pts.push(P(stops[st.w].g));
          var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
          var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
          var m = st.z * KX, pad = st.w != null ? 1.3 : 1;
          var bw = Math.max(x1 - x0, m) * pad, bh = Math.max(y1 - y0, m) * pad;
          return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, s: Math.min(W / bw, H / bh) };
        }
        function px(u) { return [(u[0] - cam.x) * cam.s + W / 2, (u[1] - cam.y) * cam.s + H / 2]; }
        function draw() {
          var vw = W / cam.s, vh = H / cam.s;
          geo.setAttribute("viewBox", (cam.x - vw / 2) + " " + (cam.y - vh / 2) + " " + vw + " " + vh);
          var span = Math.min(W, H) / cam.s / KX;
          var q = stops.map(function (s) { return px(P(s.g)); }), at = q[idx], here = stops[idx].pin;
          places.forEach(function (o) {
            var p = px(o.u), y = p[1] + o.dy;
            o.e.setAttribute("x", p[0]); o.e.setAttribute("y", y);
            if (o.r) o.e.setAttribute("transform", "rotate(-90 " + p[0] + " " + p[1] + ")");
            /* give way to the active stop's own pin label */
            var clash = o.t === here || (Math.abs(p[0] - at[0]) < 90 && Math.abs(y - at[1]) < 26);
            o.e.style.opacity = span >= o.min && span <= o.max && !clash ? 1 : 0;
          });
          lines.forEach(function (ln, i) {
            ln.setAttribute("x1", q[i][0]); ln.setAttribute("y1", q[i][1]);
            ln.setAttribute("x2", q[i + 1][0]); ln.setAttribute("y2", q[i + 1][1]);
          });
          pins.forEach(function (c, i) { c.setAttribute("cx", q[i][0]); c.setAttribute("cy", q[i][1]); hits[i].setAttribute("cx", q[i][0]); hits[i].setAttribute("cy", q[i][1]); });
          var a = q[idx], left = stops[idx].a === "l";
          halo.setAttribute("cx", a[0]); halo.setAttribute("cy", a[1]);
          label.setAttribute("x", a[0] + (left ? -13 : 13)); label.setAttribute("y", a[1] + 4);
          label.setAttribute("text-anchor", left ? "end" : "start");
        }
        function build() {
          ink.textContent = "";
          places = PLACES.map(function (p) {
            var t = el("text", { "class": p[5] ? "x-sea" : "", "text-anchor": "middle" }, ink);
            t.textContent = p[2];
            return { e: t, t: p[2], u: P(p), min: p[3], max: p[4], r: p[6], dy: p[7] || 0 };
          });
          lines = []; pins = []; hits = [];
          for (var i = 1; i < stops.length; i++) lines.push(el("line", {}, ink));
          stops.forEach(function () { pins.push(el("circle", { "class": "x-pin", r: 5.5 })); });
          halo = el("circle", { "class": "x-halo", r: 12 });
          stops.forEach(function (s, i) {
            var h = el("circle", { "class": "x-hit", r: 22 });
            h.addEventListener("click", function () { go(i); });
            hits.push(h);
          });
          label = el("text", { "class": "x-act" });
        }
        function mark() {
          lines.forEach(function (ln, i) { ln.classList.toggle("is-hot", i + 1 === idx); });
          pins.forEach(function (c, i) { c.classList.toggle("is-hot", i === idx); c.setAttribute("r", i === idx ? 7 : 5.5); });
          /* paint order: dim pins, active pin, halo, hit areas, active label */
          pins.forEach(function (c, i) { if (i !== idx) ink.appendChild(c); });
          ink.appendChild(pins[idx]); ink.appendChild(halo);
          hits.forEach(function (h) { ink.appendChild(h); });
          label.textContent = stops[idx].pin;
          ink.appendChild(label);
        }
        function fly(to) {
          cancelAnimationFrame(anim);
          if (!cam || reduce || route.hidden) { cam = to; draw(); return; }
          var from = { x: cam.x, y: cam.y, s: cam.s };
          var d = Math.hypot(to.x - from.x, to.y - from.y), l0 = Math.log(from.s), l1 = Math.log(to.s);
          var mid = Math.log(Math.min(W, H) / (d * 1.3 || 1)), bump = Math.max(0, (l0 + l1) / 2 - mid);
          var dur = bump > 0.5 ? 1300 : 800, t0 = performance.now();
          (function step(now) {
            var t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            cam = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, s: Math.exp(l0 + (l1 - l0) * e - bump * Math.sin(Math.PI * e)) };
            draw();
            if (t < 1) anim = requestAnimationFrame(step);
          })(t0);
        }
        var $ = function (id) { return document.getElementById(id); };
        function card() {
          var s = stops[idx];
          $("r-count").innerHTML = "Parada <b>" + (idx + 1) + "</b> de " + stops.length;
          $("r-dots").innerHTML = stops.map(function (x, i) { return '<i class="' + (i === idx ? "is-on" : "") + '"></i>'; }).join("");
          $("r-fig").hidden = !s.ph;
          $("r-fig").querySelectorAll("img").forEach(function (im) { im.hidden = im.dataset.k !== s.ph; });
          $("r-cap").textContent = s.cap || "";
          $("r-title").textContent = s.t;
          $("r-place").textContent = s.pl;
          $("r-text").textContent = "“" + s.tx + "”";
          $("r-ref").textContent = s.ref + " · RVR1960";
          $("r-note").textContent = s.n || "";
          $("r-note").hidden = !s.n;
          $("r-ob").hidden = !s.ob;
          if (s.ob) $("r-ob").href = s.ob;
          $("r-extra").style.display = s.go ? "" : "none";
          $("r-prev").disabled = idx === 0;
          $("r-next").disabled = idx === stops.length - 1;
          $("r-scroll").scrollTop = 0;
        }
        function go(i) {
          if (i < 0 || i >= stops.length) return;
          idx = i; mark(); card(); size(); fly(target(i));
        }
        function load(key) {
          exp = key; stops = ROUTES[key]; idx = 0;
          build(); mark(); card(); size(); fly(target(0));
        }
        function hudH() { document.documentElement.style.setProperty("--x-hud-h", hud.offsetHeight + "px"); }
        function setView(v) {
          var r = v === "route";
          document.querySelectorAll(".x-vw").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.view === v ? "true" : "false"); });
          var dossier = document.getElementById("dossier");
          if (r && dossier.classList.contains("is-open")) document.getElementById("close").click();
          route.hidden = !r;
          reset.style.display = r ? "none" : "";
          if (hint) hint.textContent = r ? "Deslizá la tarjeta o usá Anterior / Siguiente" : hintText;
          hudH();
          if (r) { size(); cam = target(idx); draw(); }
        }
        document.querySelectorAll(".x-vw").forEach(function (b) {
          b.addEventListener("click", function () { setView(b.dataset.view); });
        });
        /* Recorrido follows the open map: only maps with a route show the view switch */
        var vista = $("vista");
        function sync(set) {
          if (set && !ROUTES[set]) set = null;
          vista.hidden = !set;
          hudH();
          if (!set) { if (!route.hidden) setView("board"); return; }
          if (set !== exp) load(set);
        }
        document.addEventListener("x-map", function (e) { sync(e.detail.set); });
        /* credits sheet, opened from the corner link or the route map's attribution */
        var credits = $("credits"), credBack = null;
        function credOpen(open) {
          credits.classList.toggle("is-open", open);
          credits.setAttribute("aria-hidden", open ? "false" : "true");
          if (open) { credBack = document.activeElement; $("credits-close").focus({ preventScroll: true }); }
          else if (credBack) credBack.focus({ preventScroll: true });
        }
        document.querySelectorAll("[data-credits]").forEach(function (b) { b.addEventListener("click", function () { credOpen(true); }); });
        $("credits-close").addEventListener("click", function () { credOpen(false); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && credits.classList.contains("is-open")) credOpen(false); });
        $("r-prev").addEventListener("click", function () { go(idx - 1); });
        $("r-next").addEventListener("click", function () { go(idx + 1); });
        $("r-extra").addEventListener("click", function () { window.XNav.open(["b-apocalipsis", "lavenida"]); });
        var sw = null, rcard = $("rcard");
        rcard.addEventListener("pointerdown", function (e) { sw = { x: e.clientX, y: e.clientY }; });
        rcard.addEventListener("pointerup", function (e) {
          if (!sw) return;
          var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? idx + 1 : idx - 1);
        });
        rcard.addEventListener("pointercancel", function () { sw = null; });
        document.addEventListener("keydown", function (e) {
          if (route.hidden) return;
          if (e.key === "ArrowRight") go(idx + 1);
          else if (e.key === "ArrowLeft") go(idx - 1);
        });
        var rt;
        window.addEventListener("resize", function () {
          clearTimeout(rt);
          rt = setTimeout(function () { hudH(); if (!route.hidden) { cancelAnimationFrame(anim); size(); cam = target(idx); draw(); } }, 140);
        });
        load("e1");
        sync(window.XNav ? window.XNav.set() : null);
      }

/* ---------- arranque: data.json es la única fuente de los mapas ---------- */
(function () {
  function fail(msg) {
    var l = document.getElementById("exp-label");
    if (l) l.textContent = msg;
  }
  fetch("data.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (d) {
      veladMain(d);
      veladRoute();
      document.dispatchEvent(new CustomEvent("velad-ready"));
    })
    .catch(function (e) { fail("No se pudo cargar el mapa (data.json). Recargá la página."); if (window.console) console.error(e); });
})();
