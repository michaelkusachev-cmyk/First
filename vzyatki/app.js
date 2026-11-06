(function () {
  var cases = window.CASES || [];
  var sortKey = "amount", sortDir = -1;
  var mode = "team", year = "";
  var statusLabel = { "приговор": "Приговор", "суд": "В суде", "обвинение": "Обвинение" };
  var $ = function (id) { return document.getElementById(id); };

  function money(n) {
    if (n >= 1e9) return (n / 1e9).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " млрд ₽";
    if (n >= 1e6) return (n / 1e6).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " млн ₽";
    return n.toLocaleString("ru-RU") + " ₽";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function plural(n, a, b, c) {
    var m = n % 10, h = n % 100;
    return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c;
  }

  // Фигурка человека в костюме с портфелем денег
  function person(place) {
    var tie = place === 1 ? "#d4a017" : place === 2 ? "#9aa0a6" : "#b06a35";
    return '<svg class="man" viewBox="0 0 80 120" aria-hidden="true">' +
      '<circle cx="40" cy="18" r="13" fill="#f1c9a5"/>' +
      '<path d="M27 14 Q40 0 53 14 Q48 8 40 8 Q32 8 27 14Z" fill="#3b3b3b"/>' +
      '<path d="M22 36 Q40 30 58 36 L62 78 L18 78Z" fill="#2b2f3a"/>' +
      '<path d="M36 34 L44 34 L42 40 L44 62 L40 67 L36 62 L38 40Z" fill="' + tie + '"/>' +
      '<path d="M22 38 L8 64 L14 67 L26 48Z" fill="#2b2f3a"/>' +
      '<path d="M58 38 L70 62 L64 65 L54 48Z" fill="#2b2f3a"/>' +
      '<rect x="58" y="62" width="20" height="15" rx="2" fill="#5b3a1e"/>' +
      '<text x="68" y="74" font-size="11" text-anchor="middle" fill="#ffd54a" font-weight="700">₽</text>' +
      '<rect x="24" y="78" width="13" height="40" fill="#1f222b"/>' +
      '<rect x="43" y="78" width="13" height="40" fill="#1f222b"/>' +
      '</svg>';
  }

  function count(n) { return n + " " + plural(n, "дело", "дела", "дел"); }

  // Командный зачёт — суммы по отраслям, индивидуальный — по чиновникам
  function standings(list) {
    var groups = {};
    list.forEach(function (c) {
      var k = mode === "team" ? (c.sector || "Без отрасли") : c.name;
      var g = groups[k] = groups[k] || { name: k, sum: 0, n: 0, top: null };
      g.sum += c.amount;
      g.n++;
      if (!g.top || c.amount > g.top.amount) g.top = c;
    });
    return Object.keys(groups).map(function (k) {
      var g = groups[k];
      g.info = mode === "team" ? count(g.n) + " · крупнейшее: " + g.top.name
                               : g.top.position + (g.n > 1 ? " · " + count(g.n) : "");
      return g;
    }).sort(function (a, b) { return b.sum - a.sum; });
  }

  function renderRating(list) {
    var rank = standings(list);
    $("hint").textContent = (mode === "team" ? "Какие отрасли «обошлись» дороже всего" : "Чиновники с самыми крупными суммами") +
      (year ? " в " + year + " году" : " за все годы");

    // На пьедестале порядок 2 — 1 — 3
    $("podium").innerHTML = rank.length ? [1, 0, 2].map(function (i) {
      var r = rank[i], place = i + 1;
      if (!r) return '<div class="step-wrap empty"></div>';
      return '<div class="step-wrap p' + place + '">' +
        '<div class="who">' + person(place) + '</div>' +
        '<div class="step"><span class="place">' + place + '</span>' +
          '<b>' + esc(r.name) + '</b>' +
          '<span class="sum">' + money(r.sum) + '</span>' +
          '<small>' + esc(r.info) + '</small>' +
        '</div></div>';
    }).join("") : '<p class="hint">За этот год дел нет.</p>';

    $("rest").innerHTML = rank.slice(3).map(function (r) {
      return "<li><b>" + esc(r.name) + "</b> — " + money(r.sum) + " <small>(" + esc(r.info) + ")</small></li>";
    }).join("");
  }

  // Таблица «отрасль × год»
  function renderMatrix(list) {
    var years = {}, rows = {};
    list.forEach(function (c) {
      var k = c.sector || "Без отрасли";
      years[c.year] = 1;
      rows[k] = rows[k] || { name: k, total: 0, y: {} };
      rows[k].y[c.year] = (rows[k].y[c.year] || 0) + c.amount;
      rows[k].total += c.amount;
    });
    var ys = Object.keys(years).sort();
    var rs = Object.keys(rows).map(function (k) { return rows[k]; }).sort(function (a, b) { return b.total - a.total; });
    var colSum = function (y) { return rs.reduce(function (s, r) { return s + (r.y[y] || 0); }, 0); };
    $("matrix").innerHTML =
      "<thead><tr><th>Отрасль</th>" + ys.map(function (y) { return "<th class='num'>" + y + "</th>"; }).join("") + "<th class='num'>Всего</th></tr></thead>" +
      "<tbody>" + rs.map(function (r) {
        return "<tr><td><b>" + esc(r.name) + "</b></td>" + ys.map(function (y) {
          return "<td class='num" + (y === String(year) ? " hl" : "") + "'>" + (r.y[y] ? money(r.y[y]) : "—") + "</td>";
        }).join("") + "<td class='num'><b>" + money(r.total) + "</b></td></tr>";
      }).join("") + "</tbody>" +
      "<tfoot><tr><td>Итого</td>" + ys.map(function (y) { return "<td class='num'>" + money(colSum(y)) + "</td>"; }).join("") +
      "<td class='num'>" + money(rs.reduce(function (s, r) { return s + r.total; }, 0)) + "</td></tr></tfoot>";
  }

  function render() {
    var q = $("q").value.trim().toLowerCase(), st = $("status").value, tp = $("type").value, sc = $("sector").value;
    var base = cases.filter(function (c) {
      if (st && c.status !== st) return false;
      if (tp && c.type !== tp) return false;
      return !q || [c.name, c.position, c.region, c.sector].join(" ").toLowerCase().indexOf(q) !== -1;
    });
    renderMatrix(base); // таблица по годам — по всем годам и отраслям
    base = base.filter(function (c) { return !year || String(c.year) === year; });
    renderRating(base); // рейтинг — без фильтра по отрасли
    var list = base.filter(function (c) { return !sc || c.sector === sc; }).sort(function (a, b) {
      var x = a[sortKey], y = b[sortKey];
      return (typeof x === "number" ? x - y : String(x || "").localeCompare(String(y || ""), "ru")) * sortDir;
    });

    $("rows").innerHTML = list.map(function (c) {
      return "<tr>" +
        "<td><b>" + esc(c.name) + "</b><br><small>" + esc(c.position) + "</small></td>" +
        "<td>" + esc(c.sector) + "</td>" +
        "<td>" + esc(c.region) + "</td>" +
        "<td>" + esc(c.year) + "</td>" +
        "<td>" + esc(c.type) + "</td>" +
        "<td class='num'><b>" + money(c.amount) + "</b>" + (c.note ? "<br><small>" + esc(c.note) + "</small>" : "") + "</td>" +
        "<td><span class='badge " + esc(c.status) + "'>" + esc(statusLabel[c.status] || c.status) + "</span>" +
          (c.sentence ? "<br><small>" + esc(c.sentence) + "</small>" : "") + "</td>" +
        "<td>" + (c.source ? "<a href='" + esc(c.source) + "' target='_blank' rel='noopener'>ссылка</a>" : "—") + "</td>" +
        "</tr>";
    }).join("");

    $("empty").hidden = list.length > 0;
    $("total").textContent = money(list.reduce(function (s, c) { return s + c.amount; }, 0));
    $("count").textContent = "дел: " + list.length;
    document.querySelectorAll("th[data-sort]").forEach(function (th) {
      th.className = (th.dataset.sort === sortKey ? (sortDir > 0 ? "asc" : "desc") : "") + (th.dataset.sort === "amount" ? " num" : "");
    });
  }

  // Список отраслей для фильтра
  var sectors = {};
  cases.forEach(function (c) { if (c.sector) sectors[c.sector] = 1; });
  Object.keys(sectors).sort(function (a, b) { return a.localeCompare(b, "ru"); }).forEach(function (s) {
    var o = document.createElement("option"); o.value = o.textContent = s; $("sector").appendChild(o);
  });

  // Кнопки годов и переключатель зачёта
  var allYears = {};
  cases.forEach(function (c) { allYears[c.year] = 1; });
  $("years").innerHTML = '<button data-year="" class="on">Все годы</button>' +
    Object.keys(allYears).sort().reverse().map(function (y) { return '<button data-year="' + y + '">' + y + '</button>'; }).join("");
  function tabs(id, set) {
    $(id).addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      set(b);
      this.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
      render();
    });
  }
  tabs("years", function (b) { year = b.dataset.year; });
  tabs("mode", function (b) { mode = b.dataset.mode; });

  document.querySelectorAll("th[data-sort]").forEach(function (th) {
    th.addEventListener("click", function () {
      var k = th.dataset.sort;
      sortDir = k === sortKey ? -sortDir : (k === "amount" || k === "year" ? -1 : 1);
      sortKey = k;
      render();
    });
  });
  ["q", "status", "type", "sector"].forEach(function (id) { $(id).addEventListener("input", render); });
  render();
})();
