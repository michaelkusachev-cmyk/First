// Travel.laboratory — интерактив: меню, табло, квиз, календарь, игра, заявка
(function () {
  'use strict';

  var TG = 'https://t.me/TraveLaboratory';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') el.textContent = attrs[k];
      else if (k === 'onclick') el.addEventListener('click', attrs[k]);
      else if (k === 'style') el.setAttribute('style', attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  /* ---------- Меню на телефоне ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'Закрыть' : 'Меню';
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && nav.classList.contains('open')) menuBtn.click();
  });

  /* ---------- Табло: буквы перебираются и встают на место ---------- */
  if (!reduceMotion) {
    var A = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789';
    document.querySelectorAll('.flap').forEach(function (el, i) {
      var t = el.textContent, f = 0, total = 14 + i * 2;
      var id = setInterval(function () {
        f++;
        var settled = Math.floor(f / total * t.length);
        el.textContent = t.split('').map(function (ch, k) {
          return k < settled || ' ·—,₽'.indexOf(ch) !== -1 ? ch : A[(Math.random() * A.length) | 0];
        }).join('');
        if (f >= total) { el.textContent = t; clearInterval(id); }
      }, 45);
    });
  }

  /* ---------- Квиз ---------- */
  var R = {
    asia3: { title: 'Таиланд · Малайзия · Сингапур', price: 'от 350 000 ₽ за двоих', season: 'Лучший сезон — с ноября по март.' },
    ph: { title: 'Филиппины', price: 'от 350 000 ₽ за двоих', season: 'Сухой сезон — с декабря по май.' },
    arab: { title: 'Оман и ОАЭ', price: 'от 300 000 ₽ за двоих', season: 'Комфортно с ноября по март.' },
    tr: { title: 'Юг Турции', price: 'от 290 000 ₽ за двоих', season: 'Лучше всего — май–июнь и сентябрь–октябрь.' },
    cn: { title: 'Китай', price: 'от 190 000 ₽ за двоих', season: 'Весна и осень — самое комфортное время.' },
    eu: { title: 'Европа', price: 'Стоимость по запросу', season: 'Хороша с весны до поздней осени.' }
  };
  var Q = [
    { title: 'Что хочется почувствовать?', options: [
      { id: 'relax', label: 'Перезагрузиться', hint: 'Море, тишина, красивые виды', w: { asia3: 3, arab: 3, tr: 2, ph: 2 }, why: 'Много моря и спокойных мест для перезагрузки.' },
      { id: 'adv', label: 'Приключения', hint: 'Новое, необычное, яркое', w: { ph: 3, cn: 3, asia3: 2, tr: 1 }, why: 'Здесь хватит впечатлений на целый год.' },
      { id: 'party', label: 'Праздник', hint: 'Мальчишник, день рождения, свадьба', w: { asia3: 3, arab: 2, ph: 2 }, why: 'Идеальное место для праздника, который запомнится.' },
      { id: 'love', label: 'Романтику', hint: 'Красиво и вдвоём', w: { tr: 3, arab: 2, eu: 2, asia3: 2 }, why: 'Красивые места и уютные отели для двоих.' },
      { id: 'culture', label: 'Культуру и города', hint: 'История, архитектура, еда', w: { cn: 3, eu: 3, arab: 2, tr: 1 }, why: 'История, архитектура и гастрономия в одной поездке.' }
    ] },
    { title: 'Когда планируете поехать?', options: [
      { id: 'autumn', label: 'Осенью', hint: 'Сентябрь — ноябрь', w: { tr: 3, cn: 2, arab: 2, asia3: 1 } },
      { id: 'winter', label: 'Зимой', hint: 'Декабрь — февраль', w: { asia3: 3, ph: 3, arab: 3 } },
      { id: 'spring', label: 'Весной', hint: 'Март — май', w: { cn: 3, tr: 2, ph: 2, eu: 2 } },
      { id: 'summer', label: 'Летом', hint: 'Июнь — август', w: { tr: 3, eu: 3 } }
    ] },
    { title: 'Сколько вас?', options: [
      { id: 'two', label: 'Вдвоём', hint: 'Пара или друзья', w: {}, note: '' },
      { id: 'family', label: 'Семья', hint: 'С детьми или родителями', w: {}, note: 'Подберём темп, отели и перелёты под всю семью.' },
      { id: 'crew', label: 'Компания', hint: 'Друзья, коллеги, праздник', w: {}, note: 'Организуем поездку для компании любого размера.' }
    ] }
  ];
  var quiz = { step: 0, answers: [] };
  var quizBody = document.getElementById('quiz-body');
  var quizDots = document.querySelectorAll('#quiz-progress span');

  function renderQuiz() {
    quizDots.forEach(function (d, i) { d.classList.toggle('on', i < quiz.step); });
    clear(quizBody);
    if (quiz.step < Q.length) {
      var q = Q[quiz.step];
      quizBody.appendChild(h('p', { class: 'eyebrow', style: 'margin:0 0 10px', text: 'Вопрос ' + (quiz.step + 1) + ' из ' + Q.length }));
      quizBody.appendChild(h('h3', { style: 'font-size:24px', text: q.title }));
      quizBody.appendChild(h('div', { class: 'options' }, q.options.map(function (o) {
        return h('button', { type: 'button', class: 'option', onclick: function () {
          quiz.answers = quiz.answers.slice(0, quiz.step).concat([o.id]);
          quiz.step++;
          renderQuiz();
        } }, [h('b', { text: o.label }), h('span', { text: o.hint })]);
      })));
      if (quiz.step > 0) quizBody.appendChild(h('button', { type: 'button', class: 'link-btn', text: '← Назад', onclick: function () { quiz.step--; renderQuiz(); } }));
      return;
    }
    var picked = Q.map(function (q, i) { return q.options.filter(function (o) { return o.id === quiz.answers[i]; })[0]; });
    var score = {};
    Object.keys(R).forEach(function (k) { score[k] = 0; });
    picked.forEach(function (o) { Object.keys(o.w).forEach(function (k) { score[k] += o.w[k]; }); });
    var top = Object.keys(R).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 2);
    var msg = 'Здравствуйте! Прошёл подбор на сайте. Хочется: ' + picked[0].label.toLowerCase() + ', когда: ' + picked[1].label.toLowerCase() + ', нас: ' + picked[2].label.toLowerCase() + '. Понравилось: ' + top.map(function (k) { return R[k].title; }).join(', ') + '.';

    quizBody.appendChild(h('p', { class: 'eyebrow', style: 'margin:0 0 10px', text: 'Результат' }));
    quizBody.appendChild(h('h3', { style: 'font-size:24px', text: 'Вам подойдёт' }));
    quizBody.appendChild(h('div', { class: 'results' }, top.map(function (k, i) {
      return h('div', { class: 'result' }, [
        h('span', { class: 'badge', text: i === 0 ? 'Лучшее совпадение' : 'Тоже подойдёт' }),
        h('span', { class: 't', text: R[k].title }),
        h('p', { text: picked[0].why }),
        h('p', { text: R[k].season }),
        h('span', { class: 'pr', text: R[k].price })
      ]);
    })));
    quizBody.appendChild(h('p', { class: 'muted', style: 'margin:16px 0', text: picked[2].note || 'Маршрут соберём под вас — с учётом темпа, бюджета и пожеланий.' }));
    quizBody.appendChild(h('div', { class: 'btns' }, [
      h('a', { class: 'btn solid', href: TG + '?text=' + encodeURIComponent(msg), target: '_blank', rel: 'noopener', text: 'Получить расчёт бесплатно' }),
      h('button', { type: 'button', class: 'btn quiet', text: 'Пройти заново', onclick: function () { quiz = { step: 0, answers: [] }; renderQuiz(); } })
    ]));
  }
  renderQuiz();

  /* ---------- Календарь ---------- */
  var M = [
    ['Янв', 'январе', [['Таиланд', 'Сухо, тепло и спокойное море'], ['Филиппины', 'Разгар сухого сезона'], ['ОАЭ и Оман', 'Около +25 — гулять и купаться без жары'], ['Шри-Ланка', 'Сезон на западном и южном побережье']]],
    ['Фев', 'феврале', [['Таиланд', 'Лучшее время для островов Андаманского моря'], ['Филиппины', 'Сухо и солнечно'], ['Оман', 'Идеально для пустыни и гор'], ['Мальдивы', 'Пик сухого сезона']]],
    ['Мар', 'марте', [['Филиппины', 'Тепло, сухо и отличная видимость под водой'], ['Таиланд', 'Ещё сезон, но уже жарче'], ['ОАЭ', 'Последний комфортный месяц перед жарой'], ['Япония', 'В конце месяца начинается сакура']]],
    ['Апр', 'апреле', [['Япония', 'Цветение сакуры'], ['Китай', 'Весна без жары и толп'], ['Иордания', 'Петра и пустыня в мягкую погоду'], ['Турция', 'Цветущее побережье без толп']]],
    ['Май', 'мае', [['Юг Турции', 'Тепло, но ещё без жары'], ['Греция', 'Острова до наплыва туристов'], ['Португалия', 'Солнце и комфортная погода'], ['Китай', 'Хорошая погода до сезона дождей']]],
    ['Июн', 'июне', [['Чешме и Алачати', 'Свежий эгейский ветер и тёплое море'], ['Италия', 'Длинные дни и тёплое море'], ['Черногория', 'Море прогрелось, толп ещё нет']]],
    ['Июл', 'июле', [['Бали', 'Сухой сезон в разгаре'], ['Чешме и Алачати', 'Ветер спасает от жары'], ['Грузия', 'Прохлада Кавказских гор'], ['Швейцария', 'Альпы в лучшем виде']]],
    ['Авг', 'августе', [['Бали', 'Сухо и солнечно'], ['Грузия', 'Горы, вино и начало сбора винограда'], ['Черногория', 'Самое тёплое море']]],
    ['Сен', 'сентябре', [['Юг Турции', 'Бархатный сезон: море тёплое, жары нет'], ['Греция', 'Тёплое море и меньше людей'], ['Италия', 'Сезон урожая и винограда'], ['Кипр', 'Купаться можно до ноября']]],
    ['Окт', 'октябре', [['Каш и Бодрум', 'Тепло, спокойно и без толп'], ['Китай', 'Золотая осень — кроме праздников 1–7 октября'], ['Иордания', 'Комфортная погода для Петры'], ['Кипр', 'Море ещё тёплое']]],
    ['Ноя', 'ноябре', [['ОАЭ', 'Начало сезона: тепло и тёплое море'], ['Оман', 'Сезон открывается'], ['Таиланд', 'Заканчиваются дожди, всё зелёное'], ['Вьетнам', 'На юге начинается сухой сезон']]],
    ['Дек', 'декабре', [['Таиланд', 'Высокий сезон'], ['Сингапур', 'Новогодняя иллюминация'], ['ОАЭ и Оман', 'Идеальная погода'], ['Шри-Ланка', 'Начало сезона на юго-западе']]]
  ];
  var month = new Date().getMonth();
  var monthTabs = document.getElementById('month-tabs');
  var monthPicks = document.getElementById('month-picks');
  var monthIn = document.getElementById('month-in');
  M.forEach(function (m, i) {
    monthTabs.appendChild(h('button', { type: 'button', id: 'm-' + i, text: m[0], onclick: function () { month = i; renderMonth(); } }));
  });
  function renderMonth() {
    monthIn.textContent = M[month][1];
    monthTabs.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-pressed', i === month); });
    clear(monthPicks);
    M[month][2].forEach(function (p, i) {
      monthPicks.appendChild(h('div', { class: 'cell' }, [
        h('span', { class: 'n', text: String(i + 1).padStart(2, '0') }),
        h('h3', { text: p[0] }),
        h('p', { text: p[1] })
      ]));
    });
  }
  renderMonth();

  /* ---------- Игра «Собери маршрут» ---------- */
  var regions = [
    { id: 'sea', name: 'Юго-Восточная Азия', items: [['th', 'Таиланд'], ['my', 'Малайзия'], ['sg', 'Сингапур'], ['vn', 'Вьетнам'], ['bali', 'Индонезия (Бали)'], ['ph', 'Филиппины'], ['kh', 'Камбоджа']] },
    { id: 'ea', name: 'Восточная Азия', items: [['cn', 'Китай'], ['jp', 'Япония'], ['kr', 'Южная Корея'], ['kp', 'Северная Корея']] },
    { id: 'sa', name: 'Индийский океан', items: [['lk', 'Шри-Ланка'], ['mv', 'Мальдивы'], ['in', 'Индия']] },
    { id: 'me', name: 'Ближний Восток', items: [['ae', 'ОАЭ'], ['om', 'Оман'], ['qa', 'Катар'], ['jo', 'Иордания'], ['il', 'Израиль'], ['eg', 'Египет'], ['lb', 'Ливан'], ['ir', 'Иран']] },
    { id: 'tc', name: 'Турция и Кавказ', items: [['tr', 'Турция'], ['ge', 'Грузия'], ['am', 'Армения'], ['az', 'Азербайджан']] },
    { id: 'eu', name: 'Европа', items: [['it', 'Италия'], ['fr', 'Франция'], ['es', 'Испания'], ['pt', 'Португалия'], ['de', 'Германия'], ['nl', 'Нидерланды'], ['ch', 'Швейцария'], ['at', 'Австрия'], ['cz', 'Чехия'], ['hu', 'Венгрия'], ['gr', 'Греция'], ['cy', 'Кипр'], ['rs', 'Сербия'], ['mne', 'Черногория']] }
  ];
  var special = {
    'my|th': ['green', 'Соседи: можно доехать даже поездом'],
    'my|sg': ['green', 'Пара часов на автобусе или час лёту'],
    'sg|th': ['green', 'Около двух часов прямым рейсом'],
    'kh|th': ['green', 'Соседи: короткий перелёт или переезд по суше'],
    'kh|vn': ['green', 'Соседи: короткий перелёт или автобус'],
    'ae|om': ['green', 'Можно проехать на машине вдоль побережья'],
    'ae|qa': ['green', 'Меньше часа лёту'],
    'il|jo': ['green', 'Можно пересечь границу по суше'],
    'ge|tr': ['green', 'Общая граница и много прямых рейсов'],
    'am|ge': ['green', 'Соседи: можно доехать на машине'],
    'az|ge': ['green', 'Соседи: можно доехать на машине'],
    'am|az': ['yellow', 'Граница закрыта, прямых рейсов нет — только через Грузию или Турцию'],
    'il|lb': ['red', 'Ливан не пускает тех, у кого есть следы поездки в Израиль'],
    'il|ir': ['red', 'Следы поездки в одну страну могут стать причиной отказа во въезде в другую'],
    'gr|tr': ['green', 'С турецкого побережья можно доплыть на пароме до греческих островов'],
    'es|pt': ['green', 'Соседи: можно доехать на поезде или машине'],
    'fr|it': ['green', 'Соседи: красивая дорога вдоль Ривьеры'],
    'at|cz': ['green', 'Пара часов на поезде'],
    'at|hu': ['green', 'Пара часов на поезде'],
    'ch|it': ['green', 'Поезд через Альпы — сам по себе впечатление'],
    'de|nl': ['green', 'Несколько часов на поезде'],
    'mne|rs': ['green', 'Соседи: поезд через горы или короткий перелёт'],
    'cy|il': ['green', 'Меньше часа лёту'],
    'kp|kr': ['red', 'Между странами нет никакого сообщения, а КНДР открыта только для групповых туров']
  };
  var adjacent = { 'ea|sea': 1, 'sa|sea': 1, 'me|sa': 1, 'me|tc': 1, 'eu|tc': 1, 'eu|me': 1 };
  var styles = {
    green: { label: 'Легко', color: 'var(--ok)', rank: 0 },
    yellow: { label: 'Сложно', color: 'var(--warn)', rank: 1 },
    red: { label: 'Невозможно', color: 'var(--bad)', rank: 2 }
  };
  var verdicts = [
    ['var(--ok)', 'Отличный маршрут!', 'Все связки удобные. Соберём такую поездку под ключ.', 'Хочу такой маршрут'],
    ['var(--warn)', 'Сложно, но реально', 'Есть непростые переезды — именно такие маршруты мы и любим собирать.', 'Хочу такой маршрут'],
    ['var(--bad)', 'Так не получится', 'В маршруте есть несовместимые страны. Напишите нам — предложим похожий вариант, который сработает.', 'Подобрать альтернативу']
  ];
  var MAX = 6;
  var names = {}, regionOf = {};
  regions.forEach(function (g) { g.items.forEach(function (it) { names[it[0]] = it[1]; regionOf[it[0]] = g.id; }); });

  function linkInfo(a, b) {
    var key = [a, b].sort().join('|');
    if (special[key]) return special[key];
    if (a === 'kp' || b === 'kp') return ['red', 'КНДР принимает туристов только в организованных группах — в индивидуальный маршрут её не встроить'];
    if (regionOf[a] === regionOf[b]) return ['green', 'Короткий удобный перелёт'];
    if (adjacent[[regionOf[a], regionOf[b]].sort().join('|')]) return ['green', 'Перелёт в несколько часов'];
    return ['yellow', 'Далеко: перелёт с пересадкой, заложим день на переезд'];
  }

  var route = [];
  var regionsEl = document.getElementById('game-regions');
  var routeEl = document.getElementById('game-route');
  var countEl = document.getElementById('game-count');
  var chips = {};
  regions.forEach(function (g) {
    regionsEl.appendChild(h('div', { class: 'region' }, [
      h('p', { text: g.name }),
      h('div', { class: 'chips' }, g.items.map(function (it) {
        var b = h('button', { type: 'button', class: 'chip', id: 'c-' + it[0], 'aria-pressed': 'false', text: it[1], onclick: function () {
          if (route.indexOf(it[0]) !== -1 || route.length >= MAX) return;
          route.push(it[0]);
          renderGame();
        } });
        chips[it[0]] = b;
        return b;
      }))
    ]));
  });

  function renderGame() {
    var full = route.length >= MAX;
    Object.keys(chips).forEach(function (id) {
      var used = route.indexOf(id) !== -1;
      chips[id].setAttribute('aria-pressed', used);
      chips[id].disabled = used || full;
    });
    countEl.textContent = route.length + ' из ' + MAX;
    clear(routeEl);
    if (!route.length) {
      routeEl.appendChild(h('p', { class: 'empty', text: 'Пока пусто. Выберите первую страну — до 6 стран в одной поездке.' }));
    } else {
      var worst = -1;
      var list = h('ol', { class: 'steps' });
      route.forEach(function (id, i) {
        var li = h('li');
        if (i > 0) {
          var info = linkInfo(route[i - 1], id), st = styles[info[0]];
          if (st.rank > worst) worst = st.rank;
          li.appendChild(h('div', { class: 'link' }, [
            h('span', { class: 'bar', style: 'background:' + st.color }),
            h('div', null, [h('span', { class: 'lab', style: 'color:' + st.color, text: st.label }), h('span', { class: 'txt', text: info[1] })])
          ]));
        }
        li.appendChild(h('div', { class: 'step' }, [h('span', { class: 'num', text: String(i + 1).padStart(2, '0') }), h('span', { text: names[id] })]));
        list.appendChild(li);
      });
      routeEl.appendChild(list);
      if (worst >= 0) {
        var v = verdicts[worst];
        routeEl.appendChild(h('div', { class: 'verdict', style: 'border-color:' + v[0] }, [h('b', { style: 'color:' + v[0], text: v[1] }), h('span', { text: v[2] })]));
        var text = 'Здравствуйте! Собрал маршрут на сайте: ' + route.map(function (id) { return names[id]; }).join(' → ');
        routeEl.appendChild(h('a', { class: 'btn solid', href: TG + '?text=' + encodeURIComponent(text), target: '_blank', rel: 'noopener', text: v[3] }));
      }
      routeEl.appendChild(h('div', { class: 'btns' }, [
        h('button', { type: 'button', class: 'btn quiet', text: 'Убрать последнюю', onclick: function () { route.pop(); renderGame(); } }),
        h('button', { type: 'button', class: 'btn quiet', text: 'Начать заново', onclick: function () { route = []; renderGame(); } })
      ]));
    }
    routeEl.appendChild(h('p', { class: 'fine', text: 'Подсказки ориентировочные: правила въезда меняются. Точный маршрут проверим и соберём под вас.' }));
  }
  renderGame();

  /* ---------- Заявка: пока без сервера — готовим текст и открываем Telegram ---------- */
  var form = document.getElementById('lead-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, nameEl = f.namedItem('name'), contactEl = f.namedItem('contact');
    var name = nameEl.value.trim(), contact = contactEl.value.trim(), trip = f.namedItem('trip').value.trim();
    if (!name) { nameEl.focus(); return; }
    if (!contact) { contactEl.focus(); return; }
    var text = 'Заявка с сайта\nИмя: ' + name + '\nКонтакт: ' + contact + (trip ? '\nПоездка: ' + trip : '');
    document.getElementById('lead-tg').href = TG + '?text=' + encodeURIComponent(text);
    form.hidden = true;
    document.getElementById('lead-sent').hidden = false;
  });
})();
