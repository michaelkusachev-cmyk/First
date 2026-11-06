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

  function render() {
    var q = $("q").value.trim().toLowerCase(), st = $("status").value, tp = $("type").value;
    var list = cases.filter(function (c) {
      if (st && c.status !== st) return false;
      if (tp && c.type !== tp) return false;
      return !q || [c.name, c.position, c.region].join(" ").toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) {
      var x = a[sortKey], y = b[sortKey];
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "ru")) * sortDir;
    });

    $("rows").innerHTML = list.map(function (c) {
      return "<tr>" +
        "<td><b>" + esc(c.name) + "</b><br><small>" + esc(c.position) + "</small></td>" +
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

  document.querySelectorAll("th[data-sort]").forEach(function (th) {
    th.addEventListener("click", function () {
      var k = th.dataset.sort;
      sortDir = k === sortKey ? -sortDir : (k === "amount" || k === "year" ? -1 : 1);
      sortKey = k;
      render();
    });
  });
  ["q", "status", "type"].forEach(function (id) { $(id).addEventListener("input", render); });
  render();
})();
