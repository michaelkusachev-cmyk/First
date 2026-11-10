#!/usr/bin/env python3
"""Собирает страницы направлений tury/<slug>.html и sitemap.xml.

Заголовок, города, цена, тексты и заставка берутся из карточек направлений в index.html,
поэтому если поменять карточку на главной — достаточно перезапустить скрипт:

    python3 scripts/build_pages.py

Здесь же — счётчик Яндекс.Метрики и коды подтверждения Яндекс.Вебмастера и Google:
впишите их в константы ниже и перезапустите скрипт — они попадут на все страницы,
включая главную и политику (в блок между <!-- seo:start --> и <!-- seo:end -->).
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://travelaboratory.ru'
TG = 'https://t.me/TraveLaboratory'

METRIKA_ID = '114165958'  # номер счётчика Метрики, например '98765432'
YANDEX_VERIFICATION = '9cadb4f136af480e'  # код из Яндекс.Вебмастера (content у meta name="yandex-verification")
GOOGLE_VERIFICATION = 'WsPUtaRtouICz4u_OTT6W3Kfyvyp4pcTcdLLjAsKXnA'  # код из Google Search Console (content у meta name="google-site-verification")

# Что добавляем к карточке с главной: свои заголовки для поиска, места маршрута и сезон.
PAGES = [
    dict(slug='asia', route='route-01',
         h1='Индивидуальный тур в Азию: Таиланд, Малайзия и Сингапур',
         title='Тур в Таиланд, Малайзию и Сингапур из Новосибирска',
         desc='Индивидуальный тур по трём странам Азии из Новосибирска: Таиланд, Малайзия, Сингапур. Перелёты, отели, трансферы и поддержка 24/7.',
         stops=[
             ('Таиланд', 'Бангкок, острова Андаманского моря или Сиамского залива, Full Moon Party на Пангане.'),
             ('Малайзия', 'Небоскрёбы Куала-Лумпура и Лангкави — остров с беспошлинной торговлей и пляжами в джунглях.'),
             ('Сингапур', 'Аэропорт Чанги с водопадом внутри, Марина-Бэй и «Сады у залива».'),
         ],
         season='Лучшее время — с ноября по март: в большей части Таиланда и на западе Малайзии сухой сезон. В Сингапуре тепло круглый год.'),
    dict(slug='turkey', route='route-04',
         h1='Индивидуальный тур в Турцию: Каш, Бодрум, Чешме, Алачати',
         title='Индивидуальный тур в Турцию из Новосибирска — Каш, Бодрум, Чешме',
         desc='Турция без пакетных отелей: Каш, Бодрум, Чешме и Алачати, пляжи Капуташ и Патара. Индивидуальный маршрут из Новосибирска, можно с арендой машины.',
         stops=[
             ('Каш', 'Один из самых красивых городков Средиземноморья, рядом — пляжи Капуташ и Патара.'),
             ('Бодрум', 'Белые домики, марина и бухты полуострова — без толп Антальи.'),
             ('Чешме и Алачати', 'Эгейское побережье: каменные улочки, ветряные мельницы и вид на греческие острова.'),
             ('Дорога на машине', 'По желанию — аренда авто и расписанный маршрут с пляжами и точками для остановок.'),
         ],
         season='Сезон — с мая по октябрь. Море тёплое с июня, а самые комфортные месяцы — июнь и сентябрь: жара мягче, людей меньше.'),
    dict(slug='bali', route='route-07',
         h1='Индивидуальный тур на Бали',
         title='Индивидуальный тур на Бали из Новосибирска — Убуд, Чангу, Улувату',
         desc='Тур на Бали под ваш ритм: Убуд, Чангу, Улувату и Нуса-Пенида. Виллы, водитель на весь отдых, маршрут без пробок. Вылет из Новосибирска.',
         stops=[
             ('Убуд', 'Рисовые террасы, водопады в джунглях и йога по утрам.'),
             ('Чангу', 'Сёрф-споты, кафе и закаты на чёрном песке.'),
             ('Улувату', 'Скалы над океаном, пляжи в бухтах и виллы с бассейном.'),
             ('Нуса-Пенида', 'Остров с самыми фотогеничными видами Бали и снорклингом с мантами.'),
         ],
         season='Сухой сезон — с апреля по октябрь. С ноября по март идут дожди, но чаще короткие, а цен и людей меньше.'),
    dict(slug='japan', route='route-08',
         h1='Индивидуальный тур в Японию',
         title='Индивидуальный тур в Японию из Новосибирска — Токио, Киото, Осака',
         desc='Тур в Японию по дням: Токио, Киото, Осака, Нара и Хаконэ. Рёканы, онсэны, поезда и помощь с визой. Вылет из Новосибирска.',
         stops=[
             ('Токио', 'Неоновые кварталы, рынки и смотровые площадки.'),
             ('Киото', 'Тысячи храмов, сады и улочки Гиона.'),
             ('Осака и Нара', 'Уличная еда Осаки и ручные олени у храмов Нары.'),
             ('Хаконэ', 'Рёканы с онсэнами и, если повезёт с погодой, вид на Фудзи.'),
         ],
         season='Самые красивые сезоны — сакура в конце марта и начале апреля и красные клёны в октябре–ноябре. Лето жаркое и влажное. Для поездки нужна виза — поможем оформить.'),
    dict(slug='philippines', route='route-02',
         h1='Индивидуальный тур на Филиппины',
         title='Индивидуальный тур на Филиппины из Новосибирска — Боракай, Себу, Эль-Нидо',
         desc='Тур на Филиппины по островам: Боракай, Себу, Эль-Нидо и Карабао. Китовые акулы, водопады, лагуны. Логистика без хаоса, вылет из Новосибирска.',
         stops=[
             ('Боракай', 'Уайт-Бич — один из лучших пляжей планеты.'),
             ('Себу', 'Китовые акулы, прыжки в водопады Кавасан, а на соседнем Бохоле — долгопяты.'),
             ('Эль-Нидо', 'Лагуны и известняковые скалы Палавана, морские прогулки по островам.'),
             ('Карабао', 'Тихий остров рядом с Боракаем — без туристов и шума.'),
         ],
         season='Лучшее время — с декабря по май, сухой сезон. С июня по ноябрь чаще идут дожди и бывают тайфуны.'),
    dict(slug='china', route='route-05',
         h1='Индивидуальный тур в Китай',
         title='Индивидуальный тур в Китай из Новосибирска — Пекин, Шанхай, Гонконг',
         desc='Китай под вас: Пекин, Шанхай, Гонконг, Макао, Гуанчжоу, Шэньчжэнь и Чунцин. Великая стена, мегаполисы, уличная еда. Маршрут из Новосибирска.',
         stops=[
             ('Пекин', 'Великая Китайская стена, Запретный город и хутуны.'),
             ('Шанхай', 'Набережная Вайтань и небоскрёбы Пудуна.'),
             ('Гонконг и Макао', 'Skyline Гонконга, португальская архитектура и казино Макао.'),
             ('Гуанчжоу, Шэньчжэнь, Чунцин', 'Шопинг, технологии и город-гора Чунцин, где живут и панды.'),
         ],
         season='Комфортнее всего в апреле–мае и в сентябре–октябре. Первую неделю октября лучше обойти: в Китае национальные праздники и весь мир путешествует.'),
    dict(slug='oman-oae', route='route-03',
         h1='Индивидуальный тур в Оман и ОАЭ',
         title='Индивидуальный тур в Оман и ОАЭ из Новосибирска',
         desc='Оман и Эмираты в одной поездке: Маскат, вади и крепости Омана, Дубай и Абу-Даби. Трансферы или аренда машины, вылет из Новосибирска.',
         stops=[
             ('Маскат', 'Набережная Корниш, рынок Матрах и Большая мечеть султана Кабуса.'),
             ('Горы и вади Омана', 'Изумрудные вади, крепость Низвы и лучшие пляжи страны.'),
             ('Дубай', 'Дубай Марина, Бурдж-Халифа, торговые центры и пляжи.'),
             ('Абу-Даби', 'Мечеть шейха Зайда и Лувр Абу-Даби — по желанию.'),
         ],
         season='Сезон — с октября по апрель. Летом жара выше +40, зато ниже цены на отели.'),
    dict(slug='sri-lanka', route='route-06',
         h1='Индивидуальный тур на Шри-Ланку',
         title='Индивидуальный тур на Шри-Ланку из Новосибирска',
         desc='Шри-Ланка без утомительных переездов: Сигирия, поезд в Эллу, сафари, киты у Мириссы и форт Галле. Индивидуальный маршрут из Новосибирска.',
         stops=[
             ('Сигирия', 'Древняя крепость на скале посреди джунглей.'),
             ('Элла', 'Чайные плантации и одна из самых красивых железных дорог мира.'),
             ('Сафари', 'Слоны и леопарды в национальных парках.'),
             ('Мирисса и Галле', 'Сёрф, киты у побережья и голландский форт Галле.'),
         ],
         season='Для юга и запада острова лучшее время — с декабря по апрель. Летом хорошо на восточном побережье — подскажем, куда ехать в ваши даты.'),
    dict(slug='balkans', route='route-11',
         h1='Индивидуальный тур по Балканам: Черногория, Сербия, Босния',
         title='Тур по Балканам из Новосибирска — Черногория, Сербия, Босния',
         desc='Роуд-трип по Балканам: Черногория, Сербия, Босния и Герцеговина. Адриатика, каньоны, серпантины и вино. Маршрут на машине из Новосибирска.',
         stops=[
             ('Черногория', 'Бока-Которская бухта, Будва и марина Порто-Монтенегро в Тивате.'),
             ('Сербия', 'Белград, Нови-Сад, сербский гриль и местные винодельни.'),
             ('Босния и Герцеговина', 'Старый мост в Мостаре и восточные улочки Сараева.'),
             ('Дорога', 'Каньон Тары, горные серпантины и городки, где стоит остаться на ночь.'),
         ],
         season='Сезон — с мая по октябрь, купаться в Адриатике лучше с июня по сентябрь. Весной и осенью хорошо для гор и городов.'),
    dict(slug='europe', route='route-10',
         h1='Индивидуальный тур в Европу',
         title='Индивидуальный тур в Европу из Новосибирска — Италия, Франция, Испания',
         desc='Европа без автобусных туров: Италия, Франция, Испания, Португалия, Швейцария. Поезда, машина или перелёты, помощь с визой. Вылет из Новосибирска.',
         stops=[
             ('Италия', 'Рим, Тоскана с винодельнями, Амальфитанское побережье.'),
             ('Франция', 'Париж и Лазурный берег.'),
             ('Испания и Португалия', 'Барселона, Лиссабон и Порту.'),
             ('Швейцария', 'Панорамные поезда через Альпы и горные деревни.'),
         ],
         season='Комфортнее всего — с апреля по июнь и в сентябре–октябре. В декабре — рождественские ярмарки. Поможем с шенгенской визой.'),
    dict(slug='seychelles', route='route-09',
         h1='Индивидуальный тур на Сейшелы',
         title='Индивидуальный тур на Сейшелы из Новосибирска — Маэ, Праслин, Ла-Диг',
         desc='Сейшелы для двоих: Маэ, Праслин и Ла-Диг. Виллы у океана, паромы между островами, пустые пляжи. Индивидуальный маршрут из Новосибирска.',
         stops=[
             ('Маэ', 'Главный остров: горы, джунгли и десятки пляжей.'),
             ('Праслин', 'Пляж Анс-Лацио и долина Валле-де-Мэ с пальмами коко-де-мер.'),
             ('Ла-Диг', 'Велосипеды вместо машин и гранитные валуны пляжа Анс-Сурс-д’Аржан.'),
             ('Гигантские черепахи', 'Живут на островах на свободе — их можно встретить совсем рядом.'),
         ],
         season='Отдыхать можно круглый год. Самое спокойное море и лучшая видимость для снорклинга — в апреле–мае и в октябре–ноябре.'),
]

INCLUDED = [
    'Международные и внутренние перелёты', 'Визы и разрешения на въезд', 'Проживание от 10 дней',
    'Все трансферы', 'Страховка', 'SIM-карта на всю поездку', 'Подробный маршрут по дням',
    'Бизнес-зал и лучшие места в самолёте', 'Поддержка 24/7 в поездке', 'Оперативное изменение маршрута',
]


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(text)


def strip_tags(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()


def cards(index):
    out = {}
    for m in re.finditer(r'<article class="route[^"]*" id="(route-\d+)">(.*?)</article>', index, re.S):
        body = m.group(2)
        g = lambda p: re.search(p, body, re.S)
        price = g(r'<p class="price">(.*?)</p>').group(1)
        out[m.group(1)] = dict(
            name=strip_tags(g(r'<h3>(.*?)</h3>').group(1)),
            places=strip_tags(g(r'<p class="places">(.*?)</p>').group(1)),
            price_html=price,
            price_from=int(re.sub(r'\D', '', price.split('<span')[0])),
            lead=[strip_tags(x) for x in g(r'<p class="lead2">(.*?)</p>').group(1).split('\n') if x.strip()],
            text=strip_tags(g(r'<p class="text">(.*?)</p>').group(1)),
            poster=g(r'data-poster="([^"]+)"').group(1),
            code=strip_tags(g(r'<span class="code">(.*?)</span>').group(1)),
        )
    return out


def seo_head():
    """Метрика и коды подтверждения — общий блок для всех страниц."""
    parts = []
    if YANDEX_VERIFICATION:
        parts.append('<meta name="yandex-verification" content="%s">' % html.escape(YANDEX_VERIFICATION))
    if GOOGLE_VERIFICATION:
        parts.append('<meta name="google-site-verification" content="%s">' % html.escape(GOOGLE_VERIFICATION))
    if METRIKA_ID:
        n = int(METRIKA_ID)
        parts.append('''<!-- Яндекс.Метрика -->
<script>
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
  ym(%d, "init", {clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/%d" style="position:absolute; left:-9999px;" alt=""></div></noscript>''' % (n, n))
    return '<!-- seo:start -->\n' + ''.join(p + '\n' for p in parts) + '<!-- seo:end -->'


def patch_seo(path):
    s = read(path)
    s2 = re.sub(r'<!-- seo:start -->.*?<!-- seo:end -->', lambda m: seo_head(), s, flags=re.S)
    if s2 != s:
        write(path, s2)


def tg_link(text):
    from urllib.parse import quote
    return TG + '?text=' + quote(text)


def page(p, c, all_pages, all_cards):
    e = html.escape
    url = '%s/tury/%s.html' % (SITE, p['slug'])
    msg = 'Здравствуйте! Хочу рассчитать поездку:\n\n%s\n%s' % (c['name'], c['places'])
    poster = '/' + c['poster']
    ld = {
        '@context': 'https://schema.org',
        '@graph': [
            {'@type': 'TouristTrip', 'name': p['h1'], 'description': p['desc'], 'url': url,
             'image': SITE + poster, 'touristType': 'Индивидуальные путешественники',
             'provider': {'@id': SITE + '/#agency'},
             'offers': {'@type': 'Offer', 'price': c['price_from'], 'priceCurrency': 'RUB',
                        'description': 'Стоимость за двоих, от', 'url': url}},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Главная', 'item': SITE + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Направления', 'item': SITE + '/#routes'},
                {'@type': 'ListItem', 'position': 3, 'name': c['name'], 'item': url}]},
        ]}
    others = ''.join('<a href="/tury/%s.html">%s</a>' % (o['slug'], e(all_cards[o['route']]['name']))
                     for o in all_pages if o is not p)
    return '''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} — Travel.laboratory</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#15100C">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Travel.laboratory">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{h1}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{site}{poster}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Golos+Text:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
<script type="application/ld+json">
{ld}
</script>
{seo}
</head>
<body>

<header class="site-header">
<div class="in">
<a class="logo" href="/">Travel<b>.</b>laboratory</a>
<nav class="dir-nav" aria-label="Навигация">
<a href="/#routes">Все направления</a>
<a class="tel" href="tel:+79137698706">8 (913) 769-87-06</a>
</nav>
</div>
</header>

<main>
<div class="dir-hero" style="background-image:url('{poster}')">
<div class="in">
<p class="eyebrow"><a href="/">Главная</a> / <a href="/#routes">Направления</a> / {name}</p>
<span class="code">{code}</span>
<h1>{h1}</h1>
<p class="places">{places}</p>
<p class="price">{price_html}</p>
<p class="dir-btns"><a class="btn solid" href="{tg}" target="_blank" rel="noopener">Рассчитать поездку</a><a class="btn quiet" href="tel:+79137698706">Позвонить</a></p>
</div>
</div>

<section class="section in dir-about">
<div class="dir-cols">
<div><p class="lead2">{lead}</p></div>
<div><p class="lead">{text}</p><p class="muted">Вылет из Новосибирска или любого другого города России и Казахстана. Собираем маршрут под ваши даты, темп и бюджет — только из мест, где были сами.</p></div>
</div>
</section>

<section class="section in">
<div class="section-head"><div><p class="eyebrow">Маршрут</p><h2>Что можно включить в поездку</h2></div></div>
<ol class="dir-stops panel">
{stops}
</ol>
</section>

<section class="section in">
<div class="section-head"><div><p class="eyebrow">Сезон</p><h2>Когда лучше ехать</h2></div><p class="lead">{season}</p></div>
</section>

<section class="section in">
<div class="panel included">
<div class="panel-head"><span>В стоимость входит</span><span>10 пунктов</span></div>
<ul>
{included}
</ul>
<div class="included-foot"><h3>Стоимость {price_text}</h3><p class="muted">Точную цену посчитаем под ваши даты и пожелания — бесплатно.</p></div>
</div>
</section>

<section class="section in">
<div class="panel dir-cta">
<div><h2>Рассчитаем вашу поездку</h2><p class="muted">Напишите в Telegram или позвоните — ответим, подберём варианты и пришлём расчёт. Офис — Новосибирск, ул. Гоголя, 51.</p></div>
<p class="dir-btns"><a class="btn solid" href="{tg}" target="_blank" rel="noopener">Написать в Telegram</a><a class="btn quiet" href="tel:+79137698706">8 (913) 769-87-06</a></p>
</div>
</section>

<section class="section in">
<p class="eyebrow">Другие направления</p>
<nav class="dir-others">{others}</nav>
</section>
</main>

<footer class="site-footer">
<div class="in"><span>© 2026 Travel.laboratory · ИП Бибишев Игорь Сергеевич · ИНН 541003058627 · ОГРНИП 313547632500246</span><span><a href="/privacy.html">Политика конфиденциальности</a> · <a href="/">travelaboratory.ru</a></span></div>
</footer>

<div class="toast" id="toast" hidden role="status"></div>
<script>
// Цели Метрики: нажали Telegram или телефон
document.addEventListener('click', function (e) {{
  var a = e.target.closest('a[href]'), id = {metrika};
  if (!a || !id || !window.ym) return;
  var href = a.getAttribute('href');
  if (href.indexOf('t.me/') > -1) ym(id, 'reachGoal', 'telegram');
  else if (href.indexOf('tel:') === 0) ym(id, 'reachGoal', 'phone');
}});
// Telegram не всегда подставляет текст в чат — копируем его, чтобы осталось вставить
document.addEventListener('click', function (e) {{
  var a = e.target.closest('a[href*="t.me/"][href*="text="]');
  if (!a || !navigator.clipboard) return;
  var text = decodeURIComponent(a.getAttribute('href').split('text=')[1]);
  navigator.clipboard.writeText(text).then(function () {{
    var t = document.getElementById('toast');
    t.textContent = 'Текст сообщения скопирован. В Telegram нажмите «Вставить» и отправьте.';
    t.hidden = false; setTimeout(function () {{ t.hidden = true; }}, 6000);
  }}, function () {{}});
}});
</script>
</body>
</html>
'''.format(
        title=e(p['title']), desc=e(p['desc']), url=url, h1=e(p['h1']), site=SITE, poster=poster,
        ld=json.dumps(ld, ensure_ascii=False, indent=1), seo=seo_head(), name=e(c['name']),
        code=e(c['code']), places=e(c['places']), price_html=c['price_html'],
        price_text=strip_tags(c['price_html']), tg=e(tg_link(msg)),
        lead='<br>'.join(e(x) for x in c['lead']), text=e(c['text']),
        stops='\n'.join('<li><b>%s</b><span>%s</span></li>' % (e(a), e(b)) for a, b in p['stops']),
        season=e(p['season']), metrika=int(METRIKA_ID or 0), included='\n'.join('<li>%s</li>' % e(x) for x in INCLUDED), others=others)


def main():
    index = read('index.html')
    cs = cards(index)
    for p in PAGES:
        write('tury/%s.html' % p['slug'], page(p, cs[p['route']], PAGES, cs))
    urls = ['/', '/privacy.html'] + ['/tury/%s.html' % p['slug'] for p in PAGES]
    prio = {'/': '1.0', '/privacy.html': '0.2'}
    freq = {'/': 'daily', '/privacy.html': 'yearly'}
    write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          ''.join('  <url><loc>%s%s</loc><changefreq>%s</changefreq><priority>%s</priority></url>\n'
                  % (SITE, u, freq.get(u, 'monthly'), prio.get(u, '0.8')) for u in urls) +
          '</urlset>\n')
    for f in ('index.html', 'privacy.html', '404.html'):
        patch_seo(f)
    print('Готово: %d страниц направлений, sitemap.xml' % len(PAGES))


if __name__ == '__main__':
    main()
