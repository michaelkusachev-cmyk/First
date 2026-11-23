# Собирает страницы сайта: дивизионы, игроки, расписание, результаты, фото; обновляет шапку, меню и подвал на главной.
# Запуск: powershell -ExecutionPolicy Bypass -File build-pages.ps1
$root=$PSScriptRoot; $u=New-Object Text.UTF8Encoding($false)

$divs=@(
 @{id='w';  slug='zhenskiy'; name='Женский';  range='1.3-2.5'; cap='рейтинг игрока 1.3–2.5'; desc='рейтинг 1.3–2.5';
   lead='Дивизион для женских пар. Уровень — от уверенного новичка до крепкого любителя.';
   levels=@('Держите розыгрыш с задней линии в спокойном темпе','Подаёте и принимаете без лишних ошибок','Начинаете играть отскоком от стекла','У сетки — простые воллеи и защитная свечка')},
 @{id='am'; slug='lyubitel'; name='Любитель'; range='1.3-2.5'; cap='рейтинг игрока 1.3–2.5'; desc='рейтинг 1.3–2.5';
   lead='Для тех, кто уже уверенно держит розыгрыш и хочет регулярных игр с соперниками своего уровня.';
   levels=@('Держите розыгрыш с задней линии в спокойном темпе','Подаёте и принимаете без лишних ошибок','Начинаете играть отскоком от стекла','У сетки — простые воллеи и защитная свечка')},
 @{id='ma'; slug='master';   name='Мастер';   range='2.5-3.5'; cap='рейтинг игрока 2.5–3.5'; desc='рейтинг 2.5–3.5'; pairs=20;
   lead='Стабильная игра у сетки, работа со стеклом и тактика пары. Здесь матчи уже на характер.';
   levels=@('Уверенно выходите к сетке и держите её','Свечкой отбрасываете соперников назад','Играете отскоком от задней и боковой стены','Двигаетесь с партнёром синхронно')},
 @{id='pro';slug='profi';    name='Профи';    range='3.5-4.8'; cap='рейтинг игрока 3.5–4.8'; desc='рейтинг 3.5–4.8';
   lead='Самый сильный дивизион лиги: быстрые розыгрыши, смэши за пределы корта и плотная борьба за каждый мяч.';
   levels=@('Бандеха и вибора — рабочие удары, а не случайность','Смэш на выход за пределы корта','Читаете игру и управляете темпом розыгрыша','Есть турнирный опыт')},
 @{id='40'; slug='40-plus';  name='40+';      range='40+';     cap='возрастной дивизион'; desc='игроки от 40 лет';
   lead='Возрастной дивизион для игроков от 40 лет. Уровень пары подскажем при заявке — заявляйтесь, подберём соперников по силам.';
   levels=@('Обоим игрокам пары исполнилось 40 лет','Уровень пары согласуется с организатором','Те же правила, расписание и призы, что и в остальных дивизионах')}
)


# ---------- все страницы сайта: шапка, меню, подвал ----------
$links=@(
 @('index.html','Главная',0), @('index.html#divisions','Дивизионы',1), @('igroki.html','Игроки',1),
 @('raspisanie.html','Расписание',1), @('rezultaty.html','Результаты',1), @('foto.html','Фото и видео',1),
 @('index.html#season','Сезон',0), @('index.html#club','Клуб',0), @('index.html#partners','Партнёрам',0)
)
$nav="<!--nav-->`n    <nav aria-label=""Разделы""><ul class=""nav"">`n"+(($links|Where-Object{$_[2]}|ForEach-Object{"      <li><a href=""$($_[0])"">$($_[1])</a></li>"}) -join "`n")+"`n    </ul></nav>`n    <!--/nav-->"
$menu="<!--menu-->`n<dialog class=""menu"" id=""menu"" aria-label=""Меню сайта"">`n  <div class=""menu-top""><a class=""mark"" href=""index.html"" aria-label=""Лига РЕ:КОРТС, на главную""><span>ЛИГА</span><span class=""wm"" aria-hidden=""true""><span data-dots=""РЕ:""></span><span class=""wm-t"">КОРТС</span></span></a><button class=""menu-close"" type=""button"">Закрыть</button></div>`n  <nav aria-label=""Все страницы""><ul class=""menu-list"">`n"+(($links|ForEach-Object{"    <li><a href=""$($_[0])""><svg aria-hidden=""true""><use href=""#spark""/></svg>$($_[1])</a></li>"}) -join "`n")+"`n  </ul></nav>`n  <a class=""btn btn-sky"" href=""index.html#apply"">Подать заявку</a>`n</dialog>`n<!--/menu-->"
$footNav="<!--footnav-->`n    <ul class=""foot-nav"">"+(($links|ForEach-Object{"<li><a href=""$($_[0])"">$($_[1])</a></li>"}) -join '')+"</ul>`n    <!--/footnav-->"
function save($name,$html){ $html=$html.Replace('{NAV}',$nav).Replace('{MENU}',$menu).Replace('{FOOTNAV}',$footNav).Replace('{CURPL}',''); [IO.File]::WriteAllText("$root\$name",$html,$u); $name }
$headTpl=@'
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="img/poster.jpg">
<meta name="theme-color" content="#a14228">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
<link rel="stylesheet" href="assets/pages.css">
</head>
<body {BODY}>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="spark" viewBox="-1 -1 2 2"><path d="M0-1C.09-.2.2-.09 1 0 .2.09.09.2 0 1-.09.2-.2.09-1 0-.2-.09-.09-.2 0-1Z"/></symbol>
</svg>

<header class="bar">
  <div class="wrap">
    <a class="mark" href="index.html" aria-label="Лига РЕ:КОРТС, на главную"><span>ЛИГА</span><span class="wm" aria-hidden="true"><span data-dots="РЕ:"></span><span class="wm-t">КОРТС</span></span></a>
{NAV}
    <a class="btn btn-sky" href="index.html#apply"{APPLY}>Подать заявку</a>
    <button class="menu-btn" type="button" aria-haspopup="dialog" aria-controls="menu" aria-expanded="false"><i></i>Меню</button>
  </div>
  <div class="prog" id="prog" aria-hidden="true"><i></i><svg><use href="#spark"/></svg></div>
</header>
{MENU}
'@

$footTpl=@'
<footer class="foot clay-night" aria-labelledby="h-where">
  <div class="wrap">
    <div class="foot-top">
      <div>
        <h2 id="h-where" class="display rise">До встречи на корте</h2>
        <p class="addr rise">Новосибирск, ул. Сухарная, 35, корпус 24</p>
        <div class="acts rise">
          <a class="btn btn-sky" href="https://yandex.ru/maps/?text=%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D0%B8%D0%B1%D0%B8%D1%80%D1%81%D0%BA%2C%20%D0%A1%D1%83%D1%85%D0%B0%D1%80%D0%BD%D0%B0%D1%8F%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%2C%2035%D0%BA24" target="_blank" rel="noopener">Яндекс Карты</a>
          <a class="btn btn-ghost" href="https://2gis.ru/novosibirsk/search/%D0%A1%D1%83%D1%85%D0%B0%D1%80%D0%BD%D0%B0%D1%8F%2035%D0%BA24" target="_blank" rel="noopener">2ГИС</a>
        </div>
      </div>
      <p class="bye rise">Пусть счёт будет в вашу пользу, а эмоции — только положительными.</p>
    </div>
    <div class="giant" aria-hidden="true"><span class="wm"><span data-dots="РЕ:" data-lazy></span><span class="wm-t">КОРТС</span></span></div>
    {FOOTNAV}
    <div class="small"><span>Лига РЕ:КОРТС · Зимний кубок 2026–2027</span><span>Заявки: 8 913 741 8706 · Партнёрам: 8 995 011 67 60</span></div>
  </div>
</footer>

<div class="dock" id="dock">
  <a class="btn btn-sky" href="index.html#apply"{APPLY}>Подать заявку</a>
  <a class="btn btn-chalk" href="{DOCK2HREF}">{DOCK2}</a>
</div>

<script src="assets/common.js"></script>
<script src="assets/league.js"></script>
<script src="assets/pages.js"></script>
</body>
</html>
'@

function rail($cur){
  ($divs | ForEach-Object { $c= if($_.id -eq $cur){' aria-current="page"'}else{''}; "      <li><a href=""$($_.slug).html""$c><svg aria-hidden=""true""><use href=""#spark""/></svg>$($_.name)</a></li>" }) -join "`n"
}

$divTpl=@'
<main id="top">
<section class="dhero clay" aria-labelledby="h1">
  <div class="wrap">
    <ul class="drail rise" aria-label="Дивизионы лиги">
{RAIL}
    </ul>
    <div class="dhero-grid">
      <div>
        <h1 id="h1" class="rise"><span class="pre">Дивизион</span><span class="nm">{NAME}</span></h1>
        <p class="lead rise" style="--i:1">{LEAD}</p>
        <ul class="dfacts rise" style="--i:2">
          <li><span class="sr">{PAIRS}</span><span data-dots="{PAIRS}" data-lazy aria-hidden="true"></span><span>пар в дивизионе</span></li>
          <li><span class="sr">{PLAYERS}</span><span data-dots="{PLAYERS}" data-lazy aria-hidden="true"></span><span>{PLAYERSW}</span></li>
          <li><span id="taken-dots" aria-hidden="true"></span><span>мест свободно</span></li>
        </ul>
        <div class="acts rise" style="--i:3">
          <a class="btn btn-sky" href="index.html#apply" data-apply-div="{ID}">Подать заявку в {NAME}</a>
          <a class="btn btn-ghost" href="#roster">Состав дивизиона</a>
        </div>
      </div>
      <div class="dbig rise" style="--i:2"><span class="sr">{CAP}</span><span data-dots="{RANGE}" data-lazy aria-hidden="true"></span><span class="cap" aria-hidden="true">{CAP}</span></div>
    </div>
  </div>
</section>

<div class="tapes" aria-hidden="true"><div class="tape a"><div class="run" id="run-a" data-words="Дивизион {NAME}|{PAIRS} пар|12.12 — 21.02|Чемпионат|Плей-офф|Финал 21 февраля"></div></div></div>

<section class="dlevel clay" aria-labelledby="h-lvl">
  <div class="wrap">
    <h2 id="h-lvl" class="display rise">Кто играет в {NAME}</h2>
    <ul class="lvl-list">
{LEVELS}
    </ul>
  </div>
</section>

<section class="roster-sec clay-deep" id="roster" aria-labelledby="h-roster" data-hide-dock>
  <div class="wrap">
    <div class="roster-top">
      <h2 id="h-roster" class="display rise">Состав дивизиона</h2>
      <div class="count-pairs rise" style="--i:1"><p id="taken-text">Заявки открыты</p></div>
    </div>
    <ul class="roster" id="roster-list" aria-label="Пары дивизиона {NAME}"></ul>
  </div>
</section>

<section class="dseason season sky" aria-labelledby="h-dseason">
  <div class="wrap">
    <h2 id="h-dseason" class="display rise">Как пройдёт сезон</h2>
    <ol class="stages">
      <li class="rise"><h3>Чемпионат</h3><p>Стартуем 12 декабря. {PAIRS} пар дивизиона играют по расписанию на весь сезон.</p></li>
      <li class="rise" style="--i:1"><h3>Плей-офф</h3><p>Лучшие пары разыгрывают кубок дивизиона в феврале.</p></li>
      <li class="rise" style="--i:2"><h3>Финал и вечеринка</h3><p>21 февраля — последние матчи, награждение и финальная вечеринка лиги.</p></li>
    </ol>
  </div>
</section>

<section class="dcta clay" aria-labelledby="h-dcta">
  <div class="wrap">
    <div>
      <h2 id="h-dcta" class="display rise">{PAIRS} мест в {NAME}</h2>
      <p class="lead rise">Соберите пару или заявляйтесь один — подберём партнёра. Расписание сезона пришлём заранее.</p>
      <div class="acts rise">
        <a class="btn btn-sky" href="index.html#apply" data-apply-div="{ID}">Подать заявку</a>
        <a class="btn btn-ghost" href="https://t.me/KusachevM" target="_blank" rel="noopener">Написать в Telegram</a>
      </div>
    </div>
    <div class="rise" style="--i:1">
      <p class="who">Заявки</p>
      <a class="phone" href="tel:+79137418706">8 913 741 8706</a>
    </div>
  </div>
</section>
</main>
'@

foreach($d in $divs){
  $lv=($d.levels | ForEach-Object { "      <li class=""rise""><svg aria-hidden=""true""><use href=""#spark""/></svg><span>$_</span></li>" }) -join "`n"
  $title="Дивизион $($d.name) — Лига РЕ:КОРТС, Зимний кубок 2026–27"
  $np= if($d.pairs){$d.pairs}else{16}; $npl=2*$np
  $plw= if(($npl%10 -ge 2) -and ($npl%10 -le 4) -and (($npl%100 -lt 12) -or ($npl%100 -gt 14))){'игрока'}else{'игроков'}
  $desc="Дивизион $($d.name) падел-лиги РЕ:КОРТС: $($d.desc), $np пар, сезон 12 декабря — 21 февраля. Новосибирск, Сухарная, 35к24."
  $applyAttr=" data-apply-div=""$($d.id)"""
  $html=$headTpl.Replace('{TITLE}',$title).Replace('{DESC}',$desc).Replace('{BODY}',"data-div=""$($d.id)""").Replace('{CURPL}','').Replace('{APPLY}',$applyAttr)
  $html+="`n"+$divTpl.Replace('{RAIL}',(rail $d.id)).Replace('{LEVELS}',$lv).Replace('{NAME}',$d.name).Replace('{LEAD}',$d.lead).Replace('{ID}',$d.id).Replace('{RANGE}',$d.range).Replace('{CAP}',$d.cap).Replace('{PAIRS}',[string]$np).Replace('{PLAYERSW}',$plw).Replace('{PLAYERS}',[string]$npl)
  $html+="`n"+$footTpl.Replace('{APPLY}',$applyAttr).Replace('{DOCK2HREF}','#roster').Replace('{DOCK2}','Состав')
  save "$($d.slug).html" $html
}

# ---------- игроки ----------
$chips=(@('<button class="chip" type="button" data-f="all" aria-pressed="true">Все</button>') + ($divs | ForEach-Object { "<button class=""chip"" type=""button"" data-f=""$($_.id)"" aria-pressed=""false"">$($_.name)</button>" })) -join "`n        "
$pl=@'
<main id="top">
<section class="phero clay" aria-labelledby="h1">
  <div class="wrap">
    <div class="phero-grid">
      <div>
        <h1 id="h1" class="rise">Игроки<span>лиги</span></h1>
        <p class="lead rise" style="--i:1">Пары всех пяти дивизионов Зимнего кубка. Составы пополняются, как только заявка подтверждена.</p>
      </div>
      <ul class="dfacts rise" style="--i:2">
        <li><span id="c-pairs" aria-hidden="true"></span><span>пар заявлено</span></li>
        <li><span id="c-free" aria-hidden="true"></span><span>мест свободно</span></li>
        <li><span class="sr">5</span><span data-dots="5" data-lazy aria-hidden="true"></span><span>дивизионов</span></li>
      </ul>
    </div>
  </div>
</section>

<div class="pfilter" role="search">
  <div class="wrap">
    <div class="chips" aria-label="Дивизион">
        {CHIPS}
    </div>
    <div class="search"><label for="q">Найти игрока</label><input id="q" type="search" placeholder="Имя или фамилия" autocomplete="off"></div>
  </div>
</div>

<section class="pbody clay" aria-label="Составы дивизионов" data-hide-dock>
  <div class="wrap">
    <div id="rosters"></div>
    <p class="empty" id="empty" hidden>Никого не нашли. Составы пополняются по мере заявок — возможно, игрок ещё не заявился.</p>
  </div>
</section>

<section class="dcta clay-deep" aria-labelledby="h-dcta">
  <div class="wrap">
    <div>
      <h2 id="h-dcta" class="display rise">Хотите в состав?</h2>
      <p class="lead rise">В дивизионах по 16 пар, в Мастере — 20. Соберите пару или заявляйтесь один — подберём партнёра. После подтверждения пара появится здесь.</p>
      <div class="acts rise">
        <a class="btn btn-sky" href="index.html#apply">Подать заявку</a>
        <a class="btn btn-ghost" href="index.html#divisions">Выбрать дивизион</a>
      </div>
    </div>
    <div class="rise" style="--i:1">
      <p class="who">Заявки</p>
      <a class="phone" href="tel:+79137418706">8 913 741 8706</a>
    </div>
  </div>
</section>
</main>
'@
$html=$headTpl.Replace('{TITLE}','Игроки — Лига РЕ:КОРТС, Зимний кубок 2026–27').Replace('{DESC}','Составы пар пяти дивизионов падел-лиги РЕ:КОРТС: Женский, Любитель, Мастер, Профи, 40+. По 16 пар в дивизионе, в Мастере — 20.').Replace('{BODY}','data-page="players"').Replace('{CURPL}',' aria-current="page"').Replace('{APPLY}','')
$html+="`n"+$pl.Replace('{CHIPS}',$chips)
$html+="`n"+$footTpl.Replace('{APPLY}','').Replace('{DOCK2HREF}','index.html#divisions').Replace('{DOCK2}','Дивизионы')
save "igroki.html" $html

# ---------- расписание ----------
$chipsAll=(@('<button class="chip" type="button" data-f="all" aria-pressed="true">Все</button>') + ($divs | ForEach-Object { "<button class=""chip"" type=""button"" data-f=""$($_.id)"" aria-pressed=""false"">$($_.name)</button>" })) -join "`n        "
$chipsDiv=($divs | ForEach-Object { "<button class=""chip"" type=""button"" data-f=""$($_.id)"" aria-pressed=""false"">$($_.name)</button>" }) -join "`n        "

$sched=@'
<main id="top">
<section class="phero clay" aria-labelledby="h1">
  <div class="wrap">
    <div class="phero-grid">
      <div>
        <h1 id="h1" class="rise">Расписание<span>сезона</span></h1>
        <p class="lead rise" style="--i:1">Все игры Зимнего кубка по дням: время, корт и соперники. Расписание на весь сезон выдаём заранее.</p>
      </div>
      <ul class="dfacts rise" style="--i:2">
        <li><span class="sr">12.12</span><span data-dots="12.12" data-lazy aria-hidden="true"></span><span>старт сезона</span></li>
        <li><span class="sr">21.02</span><span data-dots="21.02" data-lazy aria-hidden="true"></span><span>финал</span></li>
        <li><span class="sr">6</span><span data-dots="6" data-lazy aria-hidden="true"></span><span>кортов</span></li>
      </ul>
    </div>
  </div>
</section>

<div class="chips-bar">
  <div class="wrap"><div class="chips" aria-label="Дивизион">
        {CHIPS}
  </div></div>
</div>

<section class="sbody clay" aria-label="Игры по дням" data-hide-dock>
  <div class="wrap">
    <div id="days"></div>
    <div class="state" id="sched-empty" hidden>
      <div>
        <h2 class="display rise">Расписание скоро</h2>
        <p class="lead rise">Игры каждой пары на весь сезон опубликуем перед стартом 12 декабря — и пришлём заявившимся парам.</p>
        <div class="acts rise"><a class="btn btn-sky" href="index.html#apply">Подать заявку</a><a class="btn btn-ghost" href="index.html#season">Календарь сезона</a></div>
      </div>
      <div class="state-art rise" style="--i:1" aria-hidden="true">
        <div class="game"><span class="g-time">19:00</span><span class="g-pairs"><span class="bar" style="width:120px"></span><i>против</i><span class="bar" style="width:140px"></span></span><span class="g-meta"><a>Профи</a><small>Корт 1</small></span></div>
        <div class="game"><span class="g-time">20:30</span><span class="g-pairs"><span class="bar" style="width:150px"></span><i>против</i><span class="bar" style="width:110px"></span></span><span class="g-meta"><a>Мастер</a><small>Ultra Panoramic</small></span></div>
        <div class="game"><span class="g-time">21:00</span><span class="g-pairs"><span class="bar" style="width:100px"></span><i>против</i><span class="bar" style="width:130px"></span></span><span class="g-meta"><a>Любитель</a><small>Корт 4</small></span></div>
      </div>
    </div>
  </div>
</section>
</main>
'@
$html=$headTpl.Replace('{TITLE}','Расписание — Лига РЕ:КОРТС, Зимний кубок 2026–27').Replace('{DESC}','Расписание игр падел-лиги РЕ:КОРТС по дням и дивизионам: 12 декабря — 21 февраля, Новосибирск, Сухарная, 35к24.').Replace('{BODY}','data-page="schedule"').Replace('{APPLY}','')
$html+="`n"+$sched.Replace('{CHIPS}',$chipsAll)
$html+="`n"+$footTpl.Replace('{APPLY}','').Replace('{DOCK2HREF}','rezultaty.html').Replace('{DOCK2}','Результаты')
save "raspisanie.html" $html

# ---------- результаты ----------
$resu=@'
<main id="top">
<section class="phero clay" aria-labelledby="h1">
  <div class="wrap">
    <div class="phero-grid">
      <div>
        <h1 id="h1" class="rise">Результаты<span>сезона</span></h1>
        <p class="lead rise" style="--i:1">Турнирная таблица каждого дивизиона и счёт всех сыгранных матчей. Обновляем после каждого игрового дня.</p>
      </div>
      <ul class="dfacts rise" style="--i:2">
        <li><span class="sr">5</span><span data-dots="5" data-lazy aria-hidden="true"></span><span>таблиц дивизионов</span></li>
        <li><span class="sr">84</span><span data-dots="84" data-lazy aria-hidden="true"></span><span>пары в борьбе</span></li>
        <li><span class="sr">21.02</span><span data-dots="21.02" data-lazy aria-hidden="true"></span><span>финал</span></li>
      </ul>
    </div>
  </div>
</section>

<div class="chips-bar">
  <div class="wrap"><div class="chips" aria-label="Дивизион">
        {CHIPS}
  </div></div>
</div>

<section class="rbody clay" aria-labelledby="h-table" data-hide-dock>
  <div class="wrap">
    <div class="rgrid">
      <div>
        <h2 id="h-table">Таблица · <span id="res-div">Любитель</span></h2>
        <div class="tbl-wrap" id="table"></div>
      </div>
      <div>
        <h2>Последние матчи</h2>
        <ul class="results" id="results"></ul>
      </div>
    </div>
    <div class="playoff state">
      <div>
        <h2 class="display rise">Плей-офф в феврале</h2>
        <p class="lead rise">Лучшие пары каждого дивизиона по итогам чемпионата выходят в плей-офф. Сетка появится здесь, как только определятся участники.</p>
      </div>
      <div class="rise" style="--i:1">
        <p class="who">Финал — 21 февраля</p>
        <p class="note">Награждение и финальная вечеринка лиги.</p>
      </div>
    </div>
  </div>
</section>
</main>
'@
$html=$headTpl.Replace('{TITLE}','Результаты и таблица — Лига РЕ:КОРТС, Зимний кубок 2026–27').Replace('{DESC}','Турнирные таблицы и результаты матчей пяти дивизионов падел-лиги РЕ:КОРТС.').Replace('{BODY}','data-page="results"').Replace('{APPLY}','')
$html+="`n"+$resu.Replace('{CHIPS}',$chipsDiv)
$html+="`n"+$footTpl.Replace('{APPLY}','').Replace('{DOCK2HREF}','raspisanie.html').Replace('{DOCK2}','Расписание')
save "rezultaty.html" $html

# ---------- фото и видео ----------
$skel=(1..6 | ForEach-Object { "<li style=""--n:$_""><svg aria-hidden=""true""><use href=""#spark""/></svg>Фотоотчёт</li>" }) -join "`n        "
$media=@'
<main id="top">
<section class="phero clay" aria-labelledby="h1">
  <div class="wrap">
    <div class="phero-grid">
      <div>
        <h1 id="h1" class="rise">Фото<span>и видео</span></h1>
        <p class="lead rise" style="--i:1">Снимаем игры лиги: фотоотчёты и видео после игровых дней. Ваши лучшие розыгрыши останутся в кадре.</p>
      </div>
      <div class="rise" style="--i:2">
        <p class="who">Отметьте лигу</p>
        <p class="note">Публикуете свои фото с матчей — пришлите нам в Telegram, добавим в отчёт.</p>
      </div>
    </div>
  </div>
</section>

<section class="mbody clay-deep" aria-label="Альбомы" data-hide-dock>
  <div class="wrap">
    <ul class="albums" id="albums"></ul>
    <div id="media-empty" hidden>
      <div class="state" style="margin-bottom:clamp(40px,5vw,64px)">
        <div>
          <h2 class="display rise">Первые кадры скоро</h2>
          <p class="lead rise">Сезон стартует 12 декабря — фотоотчёты появятся здесь после первых игр.</p>
        </div>
        <div class="acts rise" style="--i:1"><a class="btn btn-sky" href="index.html#apply">Подать заявку</a><a class="btn btn-ghost" href="https://t.me/KusachevM" target="_blank" rel="noopener">Написать в Telegram</a></div>
      </div>
      <ul class="skel" aria-hidden="true">
        {SKEL}
      </ul>
    </div>
  </div>
</section>
</main>

<dialog class="viewer" id="viewer" aria-label="Просмотр фото">
  <div class="v-top"><span class="v-cap"></span><button class="v-btn v-close" type="button">Закрыть</button></div>
  <img alt="">
  <div class="v-bot"><button class="v-btn v-prev" type="button">Назад</button><a class="v-btn v-video" href="#" target="_blank" rel="noopener" hidden>Смотреть видео</a><button class="v-btn v-next" type="button">Дальше</button></div>
</dialog>
'@
$html=$headTpl.Replace('{TITLE}','Фото и видео — Лига РЕ:КОРТС, Зимний кубок 2026–27').Replace('{DESC}','Фотоотчёты и видео игр падел-лиги РЕ:КОРТС.').Replace('{BODY}','data-page="media"').Replace('{APPLY}','')
$html+="`n"+$media.Replace('{SKEL}',$skel)
$html+="`n"+$footTpl.Replace('{APPLY}','').Replace('{DOCK2HREF}','raspisanie.html').Replace('{DOCK2}','Расписание')
save "foto.html" $html

# ---------- главная: та же шапка, меню и подвал ----------
$ip="$root\index.html"; $it=[IO.File]::ReadAllText($ip,$u)
function swap($text,$open,$close,$new){ $a=$text.IndexOf($open); $b=$text.IndexOf($close); if($a -lt 0 -or $b -lt 0){ throw "нет меток $open" }; return $text.Substring(0,$a)+$new+$text.Substring($b+$close.Length) }
$it=swap $it '<!--nav-->' '<!--/nav-->' $nav
$it=swap $it '<!--menu-->' '<!--/menu-->' $menu
$it=swap $it '<!--footnav-->' '<!--/footnav-->' $footNav
[IO.File]::WriteAllText($ip,$it,$u); "index.html (шапка, меню, подвал)"
