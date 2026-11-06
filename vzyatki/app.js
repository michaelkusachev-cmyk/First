(function () {
  var cases = window.CASES || [];
  var sortKey = "amount", sortDir = -1;
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

  function renderRating(list) {
    var bySector = {};
    list.forEach(function (c) {
      var k = c.sector || "Без отрасли";
      bySector[k] = bySector[k] || { name: k, sum: 0, n: 0, top: null };
      bySector[k].sum += c.amount;
      bySector[k].n++;
      if (!bySector[k].top || c.amount > bySector[k].top.amount) bySector[k].top = c;
    });
    var rank = Object.keys(bySector).map(function (k) { return bySector[k]; })
      .sort(function (a, b) { return b.sum - a.sum; });

    // На пьедестале порядок 2 — 1 — 3
    $("podium").innerHTML = [1, 0, 2].map(function (i) {
      var r = rank[i], place = i + 1;
      if (!r) return '<div class="step-wrap empty"></div>';
      return '<div class="step-wrap p' + place + '">' +
        '<div class="who">' + person(place) + '</div>' +
        '<div class="step"><span class="place">' + place + '</span>' +
          '<b>' + esc(r.name) + '</b>' +
          '<span class="sum">' + money(r.sum) + '</span>' +
          '<small>' + r.n + ' ' + plural(r.n, "дело", "дела", "дел") + ' · крупнейшее: ' + esc(r.top.name) + '</small>' +
        '</div></div>';
    }).join("");

    $("rest").innerHTML = rank.slice(3).map(function (r) {
      return "<li><b>" + esc(r.name) + "</b> — " + money(r.sum) + " <small>(" + r.n + " " + plural(r.n, "дело", "дела", "дел") + ")</small></li>";
    }).join("");
  }

  function render() {
    var q = $("q").value.trim().toLowerCase(), st = $("status").value, tp = $("type").value, sc = $("sector").value;
    var base = cases.filter(function (c) {
      if (st && c.status !== st) return false;
      if (tp && c.type !== tp) return false;
      return !q || [c.name, c.position, c.region, c.sector].join(" ").toLowerCase().indexOf(q) !== -1;
    });
    renderRating(base); // рейтинг строится по всем отраслям, без фильтра по отрасли
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
