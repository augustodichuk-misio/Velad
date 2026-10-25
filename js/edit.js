/* ---------- Velad · Modo edición (solo para el dueño del repo) ----------
   Se abre con el lápiz de la esquina o con ?editar en la dirección.
   Guarda data.json en GitHub con un token fine-grained que queda solo en este dispositivo. */
(function () {
  "use strict";
  var CONFIG = { owner: "augustodichuk-misio", repo: "Velad", branch: "main", path: "data.json" };
  var TOKEN_KEY = "velad-gh-token";
  var API = "https://api.github.com/repos/" + CONFIG.owner + "/" + CONFIG.repo + "/contents/" + CONFIG.path;
  var COLORS = [
    ["c-evento", "Evento"], ["c-profecia", "Profecía"], ["c-historia", "Historia"], ["c-senal", "Señal"],
    ["c-argumento", "Argumento"], ["c-lugar", "Lugar"], ["c-venida", "Venida"], ["c-reunion", "Reunión"],
    ["c-celebracion", "Celebración"], ["c-juicio", "Juicio"], ["c-reino", "Reino"], ["x-gold", "Dorado (centro)"], ["x-muted", "Gris"]
  ];

  var on = false, mode = "mover", dirty = false, baseSha = null, pick = null, drag = null, lastDrag = 0, editId = null, saving = false;
  var A = function () { return window.XApp; };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad2(i) { return String(i).padStart(2, "0"); }
  function token() { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }

  /* ---------- UI ---------- */
  var ui = {};
  function build() {
    var pencil = document.createElement("button");
    pencil.type = "button"; pencil.className = "ve-pencil"; pencil.id = "ve-pencil";
    pencil.setAttribute("aria-label", "Modo edición");
    pencil.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M13.5 3.5l3 3L7 16H4v-3z"/><path d="M11.5 5.5l3 3"/></svg>';
    document.body.appendChild(pencil);
    pencil.addEventListener("click", function () { if (on) return; start(); });
    ui.pencil = pencil;
  }
  function buildEditUI() {
    if (ui.bar) return;
    var bar = document.createElement("div");
    bar.className = "ve-bar"; bar.id = "ve-bar"; bar.hidden = true;
    bar.innerHTML =
      '<p class="ve-status" id="ve-status" aria-live="polite">Modo edición</p>' +
      '<div class="ve-row">' +
      '<div class="ve-seg" role="group" aria-label="Herramienta">' +
      '<button type="button" data-mode="mover" aria-pressed="true">Mover</button>' +
      '<button type="button" data-mode="conectar" aria-pressed="false">Hilo</button></div>' +
      '<button type="button" class="ve-b" id="ve-add">+ Tarjeta</button>' +
      '<button type="button" class="ve-b" id="ve-map">Mapa</button>' +
      '<button type="button" class="ve-b ve-b--gold" id="ve-save">Guardar</button>' +
      '<button type="button" class="ve-b" id="ve-more" aria-label="Más opciones">⋯</button>' +
      "</div>" +
      '<div class="ve-menu" id="ve-menu" hidden>' +
      '<button type="button" id="ve-exit">Salir del modo edición</button>' +
      '<button type="button" id="ve-logout">Cerrar sesión (borrar token)</button></div>';
    document.body.appendChild(bar);

    var ed = document.createElement("aside");
    ed.className = "x-dossier ve-editor"; ed.id = "ve-editor"; ed.setAttribute("aria-hidden", "true"); ed.setAttribute("aria-label", "Editor");
    ed.innerHTML = '<span class="x-handle"></span><div class="x-dossier__bar"><p id="ve-ed-kicker">Editar</p>' +
      '<button class="btn x-close" type="button" id="ve-ed-close">Listo ✓</button></div><div class="ve-ed-body" id="ve-ed-body"></div>';
    document.body.appendChild(ed);

    ui.bar = bar; ui.status = $("#ve-status"); ui.editor = ed; ui.edBody = $("#ve-ed-body"); ui.menu = $("#ve-menu");
    bar.querySelectorAll("[data-mode]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.mode); }); });
    $("#ve-add").addEventListener("click", addNode);
    $("#ve-map").addEventListener("click", openMapEditor);
    $("#ve-save").addEventListener("click", save);
    $("#ve-more").addEventListener("click", function () { ui.menu.hidden = !ui.menu.hidden; });
    $("#ve-exit").addEventListener("click", function () { ui.menu.hidden = true; stop(); });
    $("#ve-logout").addEventListener("click", function () {
      ui.menu.hidden = true;
      if (dirty && !confirm("Tenés cambios sin guardar. ¿Cerrar sesión igual? Se pierden.")) return;
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* nada */ }
      dirty = false; stop(true); toastOnly("Sesión cerrada. El token se borró de este dispositivo.");
    });
    $("#ve-ed-close").addEventListener("click", closeEditor);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && on && ui.editor.classList.contains("is-open")) closeEditor(); });
  }
  function status(t, kind) {
    if (!ui.status) return;
    ui.status.textContent = t;
    ui.status.className = "ve-status" + (kind ? " is-" + kind : "");
  }
  var toastT;
  function toastOnly(t) {
    var el = $("#ve-toast");
    if (!el) { el = document.createElement("p"); el.id = "ve-toast"; el.className = "ve-toast"; document.body.appendChild(el); }
    el.textContent = t; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 4000);
  }
  function markDirty() {
    dirty = true;
    status("Cambios sin guardar", "warn");
    $("#ve-save").classList.add("is-dirty");
  }
  function setMode(m) {
    mode = m; clearPick();
    ui.bar.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === m ? "true" : "false"); });
    document.body.classList.toggle("ve-connect", m === "conectar");
    status(m === "conectar" ? "Hilo: tocá una tarjeta y después otra (si ya están unidas, se borra el hilo)" : (dirty ? "Cambios sin guardar" : "Mover: arrastrá las tarjetas · tocá una para editarla"), m === "conectar" ? "" : (dirty ? "warn" : ""));
  }

  /* ---------- login ---------- */
  function askToken() {
    return new Promise(function (resolve) {
      var m = document.createElement("div");
      m.className = "ve-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
      m.innerHTML = '<form class="ve-card"><h2>Modo edición</h2>' +
        "<p>Pegá tu token de GitHub (fine-grained, solo para el repo <b>" + esc(CONFIG.repo) + "</b>, permiso <b>Contents: Read and write</b>). Queda guardado únicamente en este dispositivo.</p>" +
        '<input type="password" id="ve-token" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…" required>' +
        '<p class="ve-err" id="ve-err" hidden></p>' +
        '<div class="ve-actions"><button type="button" class="ve-b" id="ve-cancel">Cancelar</button><button type="submit" class="ve-b ve-b--gold">Entrar</button></div></form>';
      document.body.appendChild(m);
      var input = $("#ve-token", m), err = $("#ve-err", m);
      setTimeout(function () { input.focus(); }, 50);
      $("#ve-cancel", m).addEventListener("click", function () { m.remove(); resolve(null); });
      $("form", m).addEventListener("submit", function (e) {
        e.preventDefault();
        var t = input.value.trim();
        if (!t) return;
        err.hidden = true;
        $("button[type=submit]", m).disabled = true;
        getRemote(t).then(function (r) {
          try { localStorage.setItem(TOKEN_KEY, t); } catch (x) { /* storage bloqueado */ }
          m.remove(); resolve(r);
        }).catch(function (x) {
          $("button[type=submit]", m).disabled = false;
          err.textContent = x.message; err.hidden = false;
        });
      });
    });
  }

  /* ---------- GitHub API ---------- */
  function headers(t) {
    return { "Accept": "application/vnd.github+json", "Authorization": "Bearer " + t, "X-GitHub-Api-Version": "2022-11-28" };
  }
  function b64ToUtf8(b64) {
    var bin = atob(b64.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str), bin = "", CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(bin);
  }
  function apiError(res) {
    if (res.status === 401) return new Error("El token no es válido o venció.");
    if (res.status === 403) return new Error("El token no tiene permiso de escritura (Contents: Read and write) sobre el repo " + CONFIG.repo + ".");
    if (res.status === 404) return new Error("No encuentro " + CONFIG.owner + "/" + CONFIG.repo + "/" + CONFIG.path + ", o el token no tiene acceso a ese repo.");
    return new Error("GitHub respondió " + res.status + ".");
  }
  function getRemote(t) {
    return fetch(API + "?ref=" + encodeURIComponent(CONFIG.branch) + "&t=" + Date.now(), { headers: headers(t || token()), cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw apiError(res);
        return res.json();
      }).then(function (j) {
        var text = j.content ? b64ToUtf8(j.content) : null;
        return { sha: j.sha, text: text };
      }, function (e) {
        if (e instanceof TypeError) throw new Error("No pude conectar con GitHub. Revisá la conexión.");
        throw e;
      });
  }
  function serialize() { return JSON.stringify(A().data(), null, 1) + "\n"; }
  function buildPut(sha) {
    var body = { message: "Edición desde la web", content: utf8ToB64(serialize()), branch: CONFIG.branch };
    if (sha) body.sha = sha;
    return body;
  }
  function put(sha) {
    return fetch(API, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, headers(token())), body: JSON.stringify(buildPut(sha)) });
  }
  function save() {
    if (saving) return;
    if (!token()) { status("Falta el token. Volvé a entrar.", "err"); return; }
    if (ui.editor.classList.contains("is-open")) applyEditor();
    saving = true; status("Guardando…");
    $("#ve-save").disabled = true;
    getRemote().then(function (r) {
      if (baseSha && r.sha !== baseSha &&
        !confirm("data.json cambió en GitHub desde que empezaste a editar (quizás desde otro dispositivo). ¿Querés sobrescribirlo con tu versión?")) {
        throw new Error("Guardado cancelado. Tus cambios siguen acá, sin guardar.");
      }
      return put(r.sha);
    }).then(function (res) {
      if (res.status === 409 || res.status === 422) {
        /* conflicto: alguien guardó en el medio. Releer y preguntar */
        return getRemote().then(function (r2) {
          if (!confirm("Hubo un conflicto: el archivo cambió mientras guardabas. ¿Sobrescribir con tu versión?")) throw new Error("Guardado cancelado por conflicto. Tus cambios siguen acá.");
          return put(r2.sha);
        });
      }
      return res;
    }).then(function (res) {
      if (!res.ok) throw apiError(res);
      return res.json();
    }).then(function (j) {
      baseSha = j && j.content ? j.content.sha : null;
      dirty = false;
      $("#ve-save").classList.remove("is-dirty");
      status("Guardado ✓ (se publica en ~1 min)", "ok");
    }).catch(function (e) {
      status(e.message || "No se pudo guardar.", "err");
    }).then(function () { saving = false; $("#ve-save").disabled = false; });
  }

  /* ---------- enter / leave ---------- */
  function start() {
    var t = token();
    var p = t ? getRemote(t).catch(function (e) {
      toastOnly(e.message);
      if (/token/.test(e.message)) { try { localStorage.removeItem(TOKEN_KEY); } catch (x) { /* nada */ } return askToken(); }
      return null;
    }) : askToken();
    p.then(function (r) {
      if (!r) return;
      buildEditUI();
      baseSha = r.sha;
      /* GitHub Pages tarda ~1 min en publicar: si el repo tiene una versión más nueva, usar esa */
      if (r.text) {
        try {
          var remote = JSON.parse(r.text);
          if (JSON.stringify(remote) !== JSON.stringify(A().data())) {
            var ids = A().stack().map(function (n) { return n.id; });
            A().replaceData(remote);
            A().openIds(ids);
            toastOnly("Cargué la versión más reciente guardada en GitHub.");
          }
        } catch (e) { /* data.json remoto ilegible: seguimos con el publicado */ }
      }
      on = true;
      A().closeFocus();
      A().refresh(); /* sin las posiciones personales del visitante */
      document.body.classList.add("ve-on");
      ui.bar.hidden = false;
      setMode("mover");
      status("Mover: arrastrá las tarjetas · tocá una para editarla");
    });
  }
  function stop(force) {
    if (!force && dirty && !confirm("Tenés cambios sin guardar. ¿Salir igual? (quedan en esta pestaña hasta que recargues)")) return;
    closeEditor(); clearPick();
    on = false;
    document.body.classList.remove("ve-on", "ve-connect");
    if (ui.bar) ui.bar.hidden = true;
  }
  window.addEventListener("beforeunload", function (e) {
    if (!dirty) return;
    e.preventDefault(); e.returnValue = "";
    return "";
  });

  /* ---------- helpers on the data ---------- */
  function MAP() { return A().map(); }
  function slug(s) {
    return (String(s || "tarjeta").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "tarjeta");
  }
  function allIds() {
    var ids = {};
    (function walk(m) { ids[m.id] = true; m.nodes.forEach(function (n) { ids[n.id] = true; if (n.children) walk(n.children); }); })(A().tree());
    return ids;
  }
  function newId(base) {
    var ids = allIds(), id = slug(base), k = 2;
    if (!ids[id]) return id;
    while (ids[id + "-" + k]) k++;
    return id + "-" + k;
  }
  /* maps laid out automatically get fixed positions the first time something moves */
  function materialize() {
    var m = MAP(), items = A().items();
    if (m.nodes.every(function (n) { return n.pos; })) return;
    m.nodes.forEach(function (n) {
      var el = items[n.id];
      n.pos = el ? [el.offsetLeft, el.offsetTop] : [120, 150];
    });
    m.w = A().board().w;
  }

  /* ---------- drag (mouse + touch through pointer events) ---------- */
  function dragStart(e, card) {
    if (!on || mode !== "mover") return false;
    var cam = A().cam();
    drag = { id: card.dataset.id, el: card, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: card.offsetLeft, oy: card.offsetTop, s: cam.s, moved: false };
    window.addEventListener("pointermove", dragMove);
    window.addEventListener("pointerup", dragEnd);
    window.addEventListener("pointercancel", dragEnd);
    return true;
  }
  function dragMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var dx = (e.clientX - drag.sx) / drag.s, dy = (e.clientY - drag.sy) / drag.s;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
    if (!drag.moved) { drag.moved = true; drag.el.classList.add("ve-dragging"); }
    e.preventDefault();
    drag.el.style.left = Math.round(drag.ox + dx) + "px";
    drag.el.style.top = Math.round(Math.max(0, drag.oy + dy)) + "px";
    A().threads(); /* los hilos siguen a la tarjeta */
  }
  function dragEnd(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    window.removeEventListener("pointermove", dragMove);
    window.removeEventListener("pointerup", dragEnd);
    window.removeEventListener("pointercancel", dragEnd);
    var d = drag; drag = null;
    if (!d.moved) return; /* fue un toque: lo maneja el click */
    d.el.classList.remove("ve-dragging");
    lastDrag = Date.now();
    var x = d.el.offsetLeft, y = d.el.offsetTop;
    materialize();
    var nd = A().node(d.id);
    nd.pos = [x, y];
    A().strings();
    markDirty();
  }
  function consumeDrag() { var r = Date.now() - lastDrag < 450; lastDrag = 0; return r; }

  /* ---------- hilos ---------- */
  function clearPick() {
    if (pick) { var el = A() && A().items()[pick]; if (el) el.classList.remove("ve-pick"); }
    pick = null;
  }
  function connectTap(id) {
    var m = MAP();
    if (!pick) { pick = id; A().items()[id].classList.add("ve-pick"); status("Ahora tocá la segunda tarjeta"); return; }
    var a = pick; clearPick();
    if (a === id) { status("Hilo cancelado"); return; }
    m.links = m.links || [];
    var i = m.links.findIndex(function (l) { return (l[0] === a && l[1] === id) || (l[0] === id && l[1] === a); });
    if (i >= 0) {
      if (!confirm("Estas tarjetas ya están unidas. ¿Borrar el hilo?")) { status("Sin cambios"); return; }
      m.links.splice(i, 1); status("Hilo borrado");
    } else { m.links.push([a, id]); status("Hilo creado ✓ · tocá otra tarjeta para seguir"); }
    A().refresh(); markDirty();
  }
  function tap(id) {
    if (!on) return;
    if (mode === "conectar") connectTap(id); else openNodeEditor(id);
  }

  /* ---------- add / delete ---------- */
  function addNode() {
    var m = MAP();
    materialize();
    var c = A().viewCenter(), i = m.nodes.length;
    var pos = [Math.max(20, Math.round(c[0] - 130)), Math.max(20, Math.round(c[1] - 70))];
    var nd;
    if (m.rich) {
      nd = { id: newId("nueva"), cat: "Nota", num: pad2(i + 1), title: "Nueva tarjeta", ref: "", tags: [], c: "c-evento", pos: pos,
        kicker: "Nodo " + pad2(i + 1), body: "<h2>Nueva tarjeta</h2>\n<p>Escribí acá el contenido.</p>" };
    } else {
      nd = { id: newId("nueva"), n: pad2(i + 1), title: "Nueva tarjeta", summary: "", pos: pos };
    }
    m.nodes.push(nd);
    A().refresh(); markDirty();
    openNodeEditor(nd.id);
  }
  function deleteNode(id) {
    var m = MAP(), nd = A().node(id);
    if (!nd) return;
    var extra = nd.children ? "\n\nOjo: contiene un mapa con " + nd.children.nodes.length + " tarjetas, que también se borra." : "";
    if (!confirm("¿Borrar la tarjeta “" + nd.title + "”? También se borran sus hilos." + extra)) return;
    m.nodes.splice(m.nodes.indexOf(nd), 1);
    if (m.links) m.links = m.links.filter(function (l) { return l[0] !== id && l[1] !== id; });
    if (m.timeline) m.timeline.marks = m.timeline.marks.filter(function (k) { return k.target !== id; });
    closeEditor(true);
    A().refresh(); markDirty();
    status("Tarjeta borrada");
  }

  /* ---------- editor sheet ---------- */
  function field(label, name, value, opts) {
    opts = opts || {};
    var id = "ve-f-" + name;
    var input = opts.area ? '<textarea id="' + id + '" name="' + name + '" rows="' + (opts.rows || 2) + '">' + esc(value) + "</textarea>"
      : '<input id="' + id + '" name="' + name + '" type="text" value="' + esc(value) + '"' + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : "") + ">";
    return '<label class="ve-f" for="' + id + '"><span>' + label + "</span>" + input + (opts.help ? "<small>" + opts.help + "</small>" : "") + "</label>";
  }
  function colorSelect(value, allowInherit) {
    return '<label class="ve-f" for="ve-f-c"><span>Color</span><select id="ve-f-c" name="c">' +
      (allowInherit ? '<option value="">Heredado del bloque</option>' : "") +
      COLORS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === value ? " selected" : "") + ">" + c[1] + "</option>"; }).join("") +
      "</select></label>";
  }
  function rteHTML(html) {
    return '<div class="ve-f"><span>Texto del dossier</span>' +
      '<div class="ve-tools" role="toolbar" aria-label="Formato">' +
      '<button type="button" data-cmd="bold"><b>B</b></button>' +
      '<button type="button" data-cmd="italic"><i>I</i></button>' +
      '<button type="button" data-cmd="h2">Título</button>' +
      '<button type="button" data-cmd="h3">Subtítulo</button>' +
      '<button type="button" data-cmd="p">Párrafo</button>' +
      '<button type="button" data-cmd="ul">• Lista</button>' +
      '<button type="button" data-cmd="ol">1. Lista</button>' +
      '<button type="button" data-cmd="verse">“Cita”</button>' +
      '<button type="button" data-cmd="key">Recuadro</button>' +
      '<button type="button" data-cmd="html">HTML</button></div>' +
      '<div class="ve-rte x-dossier__body" id="ve-rte" contenteditable="true">' + (html || "") + "</div>" +
      '<textarea class="ve-html" id="ve-html" rows="12" hidden spellcheck="false"></textarea>' +
      "<small>Seleccioná texto y tocá un botón. “Cita” arma un versículo con su referencia.</small></div>";
  }
  function openSheet(kick, html) {
    A().closeFocus();
    ui.edBody.innerHTML = html;
    $("#ve-ed-kicker").textContent = kick;
    ui.editor.classList.add("is-open");
    ui.editor.setAttribute("aria-hidden", "false");
    ui.edBody.scrollTop = 0;
  }
  function closeEditor(skipApply) {
    if (!ui.editor || !ui.editor.classList.contains("is-open")) return;
    if (!skipApply) applyEditor();
    ui.editor.classList.remove("is-open");
    ui.editor.setAttribute("aria-hidden", "true");
    editId = null;
  }
  function openNodeEditor(id) {
    var m = MAP(), nd = A().node(id);
    if (!nd) return;
    editId = { type: "node", id: id };
    var h = "";
    h += field("Título", "title", nd.title);
    if (m.rich) {
      h += '<div class="ve-2">' + field("Etiqueta", "cat", nd.cat || "", { ph: "Evento, Señal…" }) + field("Número", "num", nd.num || "", { ph: "01" }) + "</div>";
      h += field("Referencia", "ref", nd.ref || "", { ph: "Mt 24:15" });
      h += field("Nota en la tarjeta", "note", nd.note || "", { area: true });
      h += field("Temas (separados por coma)", "tags", (nd.tags || []).join(", "));
      h += '<div class="ve-2">' + colorSelect(nd.c, false) + '<label class="ve-f ve-check"><input type="checkbox" name="center"' + (nd.center ? " checked" : "") + "><span>Tarjeta destacada</span></label></div>";
      h += field("Encabezado del dossier", "kicker", nd.kicker || "", { ph: "Nodo 01 · Mt 24:1-3" });
    } else {
      h += '<div class="ve-2">' + field("Número", "n", nd.n || "", { ph: "01" }) + field("Referencia", "ref", nd.ref || "") + "</div>";
      h += field("Resumen en la tarjeta", "summary", nd.summary || "", { area: true });
      h += colorSelect(nd.c || "", true);
      h += field("Encabezado del dossier", "kicker", nd.kicker || "", { ph: "Automático" });
    }
    h += rteHTML(nd.body != null ? nd.body : "");
    if (!m.rich) h += "<p class=\"ve-help\">Si dejás el texto vacío, el dossier muestra el título y el resumen.</p>";
    /* hilos de esta tarjeta */
    var links = (m.links || []).filter(function (l) { return l[0] === id || l[1] === id; });
    h += '<div class="ve-f"><span>Hilos</span><div class="ve-links">' +
      (links.length ? links.map(function (l) {
        var o = l[0] === id ? l[1] : l[0], on2 = A().node(o);
        return '<button type="button" class="ve-chip" data-unlink="' + esc(o) + '">' + esc(on2 ? on2.title : o) + " ✕</button>";
      }).join("") : "<small>Sin hilos. Usá la herramienta “Hilo” para unir tarjetas.</small>") + "</div></div>";
    h += '<div class="ve-actions ve-actions--sheet">' +
      (nd.children ? '<button type="button" class="ve-b" data-act="open">Abrir su mapa →</button>' : '<button type="button" class="ve-b" data-act="child">Crear mapa dentro</button>') +
      '<button type="button" class="ve-b ve-b--danger" data-act="delete">Borrar tarjeta</button></div>';
    openSheet("Editar tarjeta", h);
    wireSheet();
    ui.edBody.querySelectorAll("[data-unlink]").forEach(function (b) {
      b.addEventListener("click", function () {
        var o = b.dataset.unlink;
        m.links = m.links.filter(function (l) { return !((l[0] === id && l[1] === o) || (l[0] === o && l[1] === id)); });
        b.remove(); A().refresh(); markDirty();
      });
    });
    ui.edBody.querySelector('[data-act="delete"]').addEventListener("click", function () { deleteNode(id); });
    var act = ui.edBody.querySelector('[data-act="open"], [data-act="child"]');
    act.addEventListener("click", function () {
      applyEditor();
      if (act.dataset.act === "child") {
        nd.children = { id: newId("m-" + nd.id), rich: true, title: nd.title, subtitle: "", links: [], nodes: [] };
        markDirty();
      }
      closeEditor(true);
      A().open(A().stack().concat([nd]));
      status(act.dataset.act === "child" ? "Mapa nuevo creado. Agregá tarjetas con “+ Tarjeta”." : "Mover: arrastrá las tarjetas · tocá una para editarla");
    });
  }
  function openMapEditor() {
    var m = MAP();
    editId = { type: "map" };
    var h = field("Título del mapa", "title", m.title) +
      field("Línea debajo del título", "subtitle", m.subtitle || "", { help: "Podés usar &lt;b&gt;negrita&lt;/b&gt;. Vacío = automático." });
    if (m.rich) h += field("Introducción (texto grande arriba)", "intro", m.intro || "", { area: true, rows: 3 });
    else h += field("Etiqueta de las tarjetas", "kind", m.kind || "", { ph: "Capítulo" });
    if (A().stack().length) h += '<p class="ve-help">El nombre en la ruta de arriba sale del título de la tarjeta que contiene este mapa.</p>';
    openSheet("Editar mapa", h);
    wireSheet();
  }
  var applyT;
  function wireSheet() {
    ui.edBody.querySelectorAll("input, textarea:not(.ve-html), select").forEach(function (el) {
      el.addEventListener("input", function () { clearTimeout(applyT); applyT = setTimeout(applyEditor, 500); });
      el.addEventListener("change", applyEditor);
    });
    var rte = $("#ve-rte", ui.edBody);
    if (!rte) return;
    var html = $("#ve-html", ui.edBody);
    rte.addEventListener("input", function () { clearTimeout(applyT); applyT = setTimeout(applyEditor, 700); });
    html.addEventListener("input", function () { clearTimeout(applyT); applyT = setTimeout(applyEditor, 700); });
    ui.edBody.querySelectorAll("[data-cmd]").forEach(function (b) {
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); }); /* no perder la selección en iPhone */
      b.addEventListener("click", function () { format(b.dataset.cmd, rte, html); });
    });
  }
  function format(cmd, rte, html) {
    if (cmd === "html") {
      if (html.hidden) { html.value = rte.innerHTML; html.hidden = false; rte.hidden = true; }
      else { rte.innerHTML = html.value; html.hidden = true; rte.hidden = false; }
      return;
    }
    if (rte.hidden) return;
    rte.focus();
    var sel = window.getSelection(), text = sel && sel.rangeCount ? sel.toString() : "";
    try { document.execCommand("styleWithCSS", false, false); } catch (e) { /* navegador viejo */ }
    if (cmd === "bold" || cmd === "italic") document.execCommand(cmd);
    else if (cmd === "ul") document.execCommand("insertUnorderedList");
    else if (cmd === "ol") document.execCommand("insertOrderedList");
    else if (cmd === "h2" || cmd === "h3" || cmd === "p") document.execCommand("formatBlock", false, "<" + cmd + ">");
    else if (cmd === "verse") {
      var t = text || prompt("Texto del versículo:") || "";
      if (!t) return;
      var ref = prompt("Referencia (por ejemplo, Mt 24:30):") || "";
      t = t.replace(/^[“"]|[”"]$/g, "");
      document.execCommand("insertHTML", false, '<p class="x-verse">“' + esc(t) + "”" + (ref ? " <small>" + esc(ref) + "</small>" : "") + "</p><p><br></p>");
    } else if (cmd === "key") {
      document.execCommand("insertHTML", false, '<div class="x-key"><p>' + (esc(text) || "Idea clave") + "</p></div><p><br></p>");
    }
    applyEditor();
  }
  function clean(html) {
    /* contenteditable deja restos: limpiar lo vacío del final */
    return html.replace(/(<p><br><\/p>|\s)+$/g, "").replace(/&nbsp;/g, " ").trim();
  }
  function applyEditor() {
    clearTimeout(applyT);
    if (!editId || !ui.editor.classList.contains("is-open")) return;
    var f = {};
    ui.edBody.querySelectorAll("[name]").forEach(function (el) { f[el.name] = el.type === "checkbox" ? el.checked : el.value; });
    var changed = false;
    function set(obj, k, v, keepEmpty) {
      if (v === "" && !keepEmpty) { if (k in obj) { delete obj[k]; changed = true; } return; }
      if (JSON.stringify(obj[k]) !== JSON.stringify(v)) { obj[k] = v; changed = true; }
    }
    if (editId.type === "map") {
      var m = MAP();
      set(m, "title", f.title.trim() || m.title, true);
      set(m, "subtitle", f.subtitle.trim());
      if ("intro" in f) set(m, "intro", f.intro.trim());
      if ("kind" in f) set(m, "kind", f.kind.trim());
      var owner = A().stack()[A().stack().length - 1];
      if (changed) { A().refresh(); markDirty(); }
      void owner;
      return;
    }
    var nd = A().node(editId.id);
    if (!nd) return;
    var rte = $("#ve-rte", ui.edBody), html = $("#ve-html", ui.edBody);
    var bodyHTML = rte ? clean(html.hidden ? rte.innerHTML : html.value) : null;
    var oldAria = nd.title + (nd.ref ? ", " + nd.ref : "");
    set(nd, "title", f.title.trim() || nd.title, true);
    set(nd, "ref", f.ref.trim());
    if (MAP().rich) {
      set(nd, "cat", f.cat.trim());
      set(nd, "num", f.num.trim());
      set(nd, "note", f.note.trim());
      var tags = f.tags.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (tags.length || nd.tags) set(nd, "tags", tags, true);
      set(nd, "c", f.c, true);
      if (f.center) set(nd, "center", true); else set(nd, "center", "");
      set(nd, "kicker", f.kicker.trim());
      /* la etiqueta accesible acompaña al título si nunca se personalizó distinto */
      if (changed && (!nd.aria || nd.aria === oldAria)) nd.aria = nd.title + (nd.ref ? ", " + nd.ref : "");
    } else {
      set(nd, "n", f.n.trim());
      set(nd, "summary", f.summary.trim());
      set(nd, "c", f.c);
      set(nd, "kicker", f.kicker.trim());
    }
    if (bodyHTML != null) {
      if (bodyHTML === "" && !MAP().rich) set(nd, "body", "");
      else set(nd, "body", bodyHTML, true);
    }
    if (changed) { A().refresh(); markDirty(); }
  }

  window.XEdit = {
    active: function () { return on; },
    dragStart: dragStart,
    consumeDrag: consumeDrag,
    tap: tap,
    /* para pruebas */
    _buildPut: buildPut, _serialize: serialize, _utf8ToB64: utf8ToB64, _b64ToUtf8: b64ToUtf8, _config: CONFIG
  };
  function ready() {
    build();
    if (/[?&]editar\b/.test(location.search)) start();
  }
  if (window.XApp) ready(); else document.addEventListener("velad-ready", ready);
})();
