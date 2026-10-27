/* Velad · detector de referencias bíblicas (español). Lo usa extras.js en el navegador y el script que arma versos.json. */
(function (g) {
  "use strict";
  /* [número de libro (bolls.life), nombres y abreviaturas] */
  var BOOKS = [
    [1, "Génesis", "Genesis", "Gén", "Gen", "Gn"], [2, "Éxodo", "Exodo", "Éx", "Ex"], [3, "Levítico", "Levitico", "Lev", "Lv"],
    [4, "Números", "Numeros", "Núm", "Num", "Nm"], [5, "Deuteronomio", "Deut", "Dt"], [6, "Josué", "Josue", "Jos"],
    [7, "Jueces", "Jue"], [8, "Rut", "Rt"], [15, "Esdras", "Esd"], [16, "Nehemías", "Nehemias", "Neh"], [17, "Ester", "Est"],
    [18, "Job"], [19, "Salmos", "Salmo", "Sal"], [20, "Proverbios", "Prov", "Pr"], [21, "Eclesiastés", "Eclesiastes", "Ecl", "Ec"],
    [22, "Cantares", "Cant", "Cnt"], [23, "Isaías", "Isaias", "Is"], [24, "Jeremías", "Jeremias", "Jer", "Jr"],
    [25, "Lamentaciones", "Lam", "Lm"], [26, "Ezequiel", "Ez"], [27, "Daniel", "Dan", "Dn"], [28, "Oseas", "Os"], [29, "Joel", "Jl"],
    [30, "Amós", "Amos", "Am"], [31, "Abdías", "Abdias", "Abd"], [32, "Jonás", "Jonas", "Jon"], [33, "Miqueas", "Miq", "Mi"],
    [34, "Nahúm", "Nahum", "Nah"], [35, "Habacuc", "Hab"], [36, "Sofonías", "Sofonias", "Sof"], [37, "Hageo", "Hag"],
    [38, "Zacarías", "Zacarias", "Zac"], [39, "Malaquías", "Malaquias", "Mal"],
    [40, "Mateo", "Mat", "Mt"], [41, "Marcos", "Mar", "Mc", "Mr"], [42, "Lucas", "Luc", "Lc"], [43, "Juan", "Jn"],
    [44, "Hechos", "Hch"], [45, "Romanos", "Rom", "Ro"], [48, "Gálatas", "Galatas", "Gál", "Gal", "Gá"], [49, "Efesios", "Ef"],
    [50, "Filipenses", "Flp", "Fil"], [51, "Colosenses", "Col"], [56, "Tito", "Tit"], [57, "Filemón", "Filemon", "Flm"],
    [58, "Hebreos", "Heb", "He"], [59, "Santiago", "Stg"], [65, "Judas", "Jud"], [66, "Apocalipsis", "Apoc", "Ap"]
  ];
  /* libros con número delante: 1 Co, 2 Ts, 1 Jn... */
  var PBOOKS = [
    [[9, 10], "Samuel", "Sam", "S"], [[11, 12], "Reyes", "Re", "R"], [[13, 14], "Crónicas", "Cronicas", "Cr"],
    [[46, 47], "Corintios", "Cor", "Co"], [[52, 53], "Tesalonicenses", "Tes", "Ts"], [[54, 55], "Timoteo", "Tim", "Ti"],
    [[60, 61], "Pedro", "Ped", "Pe", "P"], [[62, 63, 64], "Juan", "Jn"]
  ];
  var ONE_CH = { 31: 1, 57: 1, 63: 1, 64: 1, 65: 1 };
  var NAMES = { 1: "Gn", 2: "Ex", 3: "Lv", 4: "Nm", 5: "Dt", 6: "Jos", 7: "Jue", 8: "Rt", 9: "1 S", 10: "2 S", 11: "1 R", 12: "2 R", 13: "1 Cr", 14: "2 Cr",
    15: "Esd", 16: "Neh", 17: "Est", 18: "Job", 19: "Sal", 20: "Pr", 21: "Ec", 22: "Cnt", 23: "Is", 24: "Jer", 25: "Lm", 26: "Ez", 27: "Dn",
    28: "Os", 29: "Jl", 30: "Am", 31: "Abd", 32: "Jon", 33: "Mi", 34: "Nah", 35: "Hab", 36: "Sof", 37: "Hag", 38: "Zac", 39: "Mal",
    40: "Mt", 41: "Mr", 42: "Lc", 43: "Jn", 44: "Hch", 45: "Ro", 46: "1 Co", 47: "2 Co", 48: "Gá", 49: "Ef", 50: "Fil", 51: "Col",
    52: "1 Ts", 53: "2 Ts", 54: "1 Ti", 55: "2 Ti", 56: "Tit", 57: "Flm", 58: "He", 59: "Stg", 60: "1 P", 61: "2 P", 62: "1 Jn",
    63: "2 Jn", 64: "3 Jn", 65: "Jud", 66: "Ap" };
  function upper(s) { return s.toUpperCase(); }
  function forms(list) {
    var out = [];
    list.forEach(function (n) { out.push(n); if (n.length > 3) out.push(upper(n)); });
    return out;
  }
  var map = {}, pmap = {}, plain = [], pref = [];
  BOOKS.forEach(function (b) { forms(b.slice(1)).forEach(function (n) { map[n] = b[0]; plain.push(n); }); });
  PBOOKS.forEach(function (b) { forms(b.slice(1)).forEach(function (n) { pmap[n] = b[0]; pref.push(n); }); });
  function byLen(a, b) { return b.length - a.length; }
  plain.sort(byLen); pref.sort(byLen);
  var D = "[-–—]";
  var REST = "\\.?\\s?(\\d{1,3}(?:\\s?:\\s?\\d{1,3})?(?:\\s?" + D + "\\s?\\d{1,3}(?::\\d{1,3})?)?" +
    "(?:,\\s?\\d{1,3}(?:" + D + "\\d{1,3})?(?![\\d:]|\\s?[A-Za-zÁÉÍÓÚÑáéíóúñ]|\\s\\d))*" +
    "(?:;\\s?\\d{1,3}:\\d{1,3}(?:" + D + "\\d{1,3}(?::\\d{1,3})?)?(?:,\\s?\\d{1,3}(?:" + D + "\\d{1,3})?(?![\\d:]|\\s?[A-Za-zÁÉÍÓÚÑáéíóúñ]|\\s\\d))*)*)(?![\\d])";
  var SRC = "(?<![\\p{L}\\d])(?:([123])\\s?(" + pref.join("|") + ")|(" + plain.join("|") + "))(?![\\p{L}])" + REST;
  function rx() { return new RegExp(SRC, "gu"); }
  /* "24:29-31" · "24" · "24–27" · "12:2-3; 14:2" · "49:14–50:3" → [{c, a, b, whole}] */
  function segs(rest, book) {
    var out = [], parts = rest.replace(/\s+/g, "").replace(/[–—]/g, "-").split(";");
    parts.forEach(function (p, pi) {
      var m = /^(\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?(.*)$/.exec(p);
      if (!m) return;
      var c = +m[1];
      if (ONE_CH[book] && m[2] == null) {
        out.push({ c: 1, a: c, b: m[3] ? +m[3] : c });
      } else if (m[2] == null) {
        out.push({ c: c, whole: true });
      } else {
        var a = +m[2], b = a;
        if (m[3] != null) b = m[4] != null ? 999 : +m[3];
        out.push({ c: c, a: a, b: b });
        (m[5] || "").split(",").forEach(function (x) {
          var k = /^(\d+)(?:-(\d+))?$/.exec(x); if (k) out.push({ c: c, a: +k[1], b: k[2] ? +k[2] : +k[1] });
        });
      }
    });
    return out;
  }
  /* devuelve [{index, length, text, book, segs, label}] */
  function find(text) {
    var out = [], r = rx(), m;
    while ((m = r.exec(text))) {
      var book = m[1] ? (pmap[m[2]] || [])[+m[1] - 1] : map[m[3]];
      if (!book) continue;
      var s = segs(m[4], book);
      if (!s.length) continue;
      var lead = m[0].replace(/[\s,;.]+$/, "");
      out.push({ index: m.index, length: lead.length, text: lead, book: book, segs: s, label: label(book, s) });
    }
    return out;
  }
  function label(book, s) {
    return NAMES[book] + " " + s.map(function (x, i) {
      var head = i && s[i - 1].c === x.c && !x.whole ? "" : x.c + (x.whole ? "" : ":");
      if (x.whole) return x.c;
      return (i && s[i - 1].c === x.c ? ", " : (i ? "; " : "")) + head + x.a + (x.b !== x.a ? "-" + (x.b === 999 ? "…" : x.b) : "");
    }).join("").replace(/^ /, "");
  }
  /* lista de versos a mostrar: tope 8; capítulo entero: 5 + "…" */
  function verses(ref, cap) {
    cap = cap || 8;
    var out = [], more = false;
    ref.segs.forEach(function (s) {
      if (out.length >= cap) { more = true; return; }
      if (s.whole) { for (var v = 1; v <= 5 && out.length < cap; v++) out.push([s.c, v]); more = true; return; }
      for (var k = s.a; k <= s.b; k++) { if (out.length >= cap) { more = true; break; } out.push([s.c, k]); }
    });
    return { list: out, more: more };
  }
  var API = { find: find, verses: verses, label: label, names: NAMES };
  g.VeladRefs = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
