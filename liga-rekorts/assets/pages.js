/* Страницы дивизионов и игроков: составы из assets/league.js */

/* ---------- страница дивизиона ---------- */
(function divisionPage(){
  const id=document.body.dataset.div; if(id==null) return;
  const d=divById(id), n=countPairs(id), total=capOf(id);
  const list=document.getElementById('roster-list');
  // заявленные пары карточками, свободные места — одной строкой с точками
  list.innerHTML=rosterHTML(id,'',true);
  const sk=countSeekers(id), skT=sk?` · ${seekersText(sk)}`:'';
  document.getElementById('taken-text').textContent=(n>=total?`Состав набран: ${total} из ${total} пар`:n?`Заявлено ${n} из ${total} пар`:`Заявки открыты: свободно ${total} из ${total} мест`)+skT;
  const tk=document.getElementById('taken-dots');
  if(tk){
    // мест нет, но есть игроки без пары — показываем их, чтобы одиночки тоже заявлялись
    if(n>=total&&sk){setDots(tk,String(sk)); const lb=tk.nextElementSibling; if(lb) lb.textContent=sk%10===1&&sk%100!==11?'ищет партнёра':'ищут партнёра';}
    else setDots(tk,String(total-n));
  }
  // состав появляется волной, когда до него доскроллили
  new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){if(!RM) list.classList.add('anim'); o.disconnect();}}),{threshold:.15}).observe(list);
})();

/* ---------- страница игроков ---------- */
(function playersPage(){
  if(document.body.dataset.page!=='players') return;
  const box=document.getElementById('rosters'), empty=document.getElementById('empty'), qIn=document.getElementById('q');
  const chips=[...document.querySelectorAll('.chip')];
  let cur='all', q='';
  const all=LEAGUE.divs.reduce((s,d)=>s+countPairs(d.id),0);
  setDots(document.getElementById('c-pairs'),String(all));
  setDots(document.getElementById('c-free'),String(LEAGUE.divs.reduce((s,d)=>s+capOf(d.id),0)-all));
  function render(){
    let html='';
    LEAGUE.divs.filter(d=>cur==='all'||d.id===cur).forEach(d=>{
      const r=rosterHTML(d.id,q,true); if(!r) return;
      const n=countPairs(d.id), rng=d.min==null?'игроки от 40 лет':`рейтинг ${d.min}–${d.max}`;
      html+=`<section class="pdiv" aria-labelledby="h-${d.slug}"><div class="pdiv-head"><h2 id="h-${d.slug}"><a href="${d.slug}.html">${d.name}<svg aria-hidden="true"><use href="#spark"/></svg></a></h2><p>${rng} · заявлено ${n} из ${capOf(d.id)} пар${countSeekers(d.id)?` · ${seekersText(countSeekers(d.id))}`:''}</p></div><ul class="roster${RM?'':' anim'}">${r}</ul></section>`;
    });
    box.innerHTML=html; empty.hidden=!!html;
  }
  chips.forEach(c=>c.addEventListener('click',()=>{cur=c.dataset.f; chips.forEach(x=>x.setAttribute('aria-pressed',x===c?'true':'false')); render();}));
  qIn.addEventListener('input',()=>{q=qIn.value.trim(); render();});
  // открыть сразу нужный дивизион: igroki.html#profi
  const h=location.hash.slice(1), byHash=LEAGUE.divs.find(d=>d.slug===h);
  if(byHash){cur=byHash.id; chips.forEach(x=>x.setAttribute('aria-pressed',x.dataset.f===cur?'true':'false'));}
  render();
})();

/* ---------- фильтр по дивизиону: общий для расписания и результатов ---------- */
function bindChips(onPick,initial){
  const chips=[...document.querySelectorAll('.chip')];
  const set=v=>chips.forEach(x=>x.setAttribute('aria-pressed',x.dataset.f===v?'true':'false'));
  chips.forEach(c=>c.addEventListener('click',()=>{set(c.dataset.f); onPick(c.dataset.f);}));
  const h=location.hash.slice(1), byHash=LEAGUE.divs.find(d=>d.slug===h);
  const start=byHash?byHash.id:initial; set(start); onPick(start);
}
const pairName=n=>esc(n).replace(' / ','<span class="amp"> / </span>');

/* ---------- расписание ---------- */
(function schedulePage(){
  if(document.body.dataset.page!=='schedule') return;
  const box=document.getElementById('days'), empty=document.getElementById('sched-empty');
  bindChips(cur=>{
    const list=MATCHES.filter(m=>!m.score&&(cur==='all'||m.div===cur)).sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time));
    const byDate={}; list.forEach(m=>(byDate[m.date]=byDate[m.date]||[]).push(m));
    box.innerHTML=Object.keys(byDate).map(dt=>{const r=dateRu(dt);
      return `<section class="sday rise in"><div class="sday-date"><span class="dd" data-v="${r.day}"></span><span><b>${r.month}</b><small>${r.wd}</small></span></div><ul class="games">`+
        byDate[dt].map(m=>`<li class="game"><span class="g-time">${esc(m.time||'')}</span><span class="g-pairs"><span>${pairName(m.a)}</span><i>против</i><span>${pairName(m.b)}</span></span><span class="g-meta"><a href="${divById(m.div).slug}.html">${divById(m.div).name}</a>${m.court?`<small>${esc(m.court)}</small>`:''}</span></li>`).join('')+`</ul></section>`;}).join('');
    box.querySelectorAll('.dd').forEach(el=>setDots(el,el.dataset.v));
    empty.hidden=list.length>0;
  },'all');
})();

/* ---------- результаты ---------- */
(function resultsPage(){
  if(document.body.dataset.page!=='results') return;
  const tbl=document.getElementById('table'), res=document.getElementById('results'), head=document.getElementById('res-div');
  bindChips(cur=>{
    const d=divById(cur); head.textContent=d.name;
    const rows=standings(cur);
    if(rows.length){
      tbl.innerHTML=`<table class="stand"><thead><tr><th scope="col">Место</th><th scope="col">Пара</th><th scope="col">Игры</th><th scope="col">Победы</th><th scope="col">Поражения</th><th scope="col">Сеты</th><th scope="col">Геймы</th></tr></thead><tbody>`+
        rows.map((r,i)=>`<tr class="${i<3&&r.p?'top':''}"><td class="pos">${i+1}</td><td class="pr">${pairName(r.pair)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.l}</td><td>${r.sf}:${r.sa}</td><td>${r.gf}:${r.ga}</td></tr>`).join('')+`</tbody></table>`;
    } else {
      tbl.innerHTML=`<p class="note-big">Таблица заполнится после первых матчей — с 12 декабря. Так она будет выглядеть:</p><table class="stand ghost-tbl" aria-hidden="true"><thead><tr><th>Место</th><th>Пара</th><th>Игры</th><th>Победы</th><th>Поражения</th><th>Сеты</th><th>Геймы</th></tr></thead><tbody>`+
        [1,2,3,4].map(i=>`<tr><td class="pos">${i}</td><td class="pr"><i class="bar" style="width:${70-i*8}%"></i></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>`).join('')+`</tbody></table>`;
    }
    const played=MATCHES.filter(m=>m.div===cur&&m.score).sort((x,y)=>(y.date+(y.time||'')).localeCompare(x.date+(x.time||'')));
    res.innerHTML=played.length?played.map(m=>{const w=winnerOf(m), r=dateRu(m.date);
      return `<li class="res"><span class="r-date">${r.day} ${r.month}${m.stage&&m.stage!=='Чемпионат'?` · ${esc(m.stage)}`:''}</span><span class="r-p ${w==='a'?'win':''}">${pairName(m.a)}</span><span class="r-score">${esc(m.score)}</span><span class="r-p ${w==='b'?'win':''}">${pairName(m.b)}</span></li>`;}).join('')
      :`<li class="res-empty">Здесь появятся счета всех сыгранных матчей дивизиона ${d.name}.</li>`;
  },'am');
})();

/* ---------- фото и видео ---------- */
(function mediaPage(){
  if(document.body.dataset.page!=='media') return;
  const grid=document.getElementById('albums'), empty=document.getElementById('media-empty'), dlg=document.getElementById('viewer');
  if(!ALBUMS.length){grid.hidden=true; empty.hidden=false; return;}
  const list=[...ALBUMS].sort((x,y)=>y.date.localeCompare(x.date));
  grid.innerHTML=list.map((a,i)=>{const r=dateRu(a.date), dv=a.div&&a.div!=='all'?divById(a.div):null;
    return `<li><button class="album" type="button" data-i="${i}"><img src="${esc(a.photos[0])}" alt="" loading="lazy"><span class="al-meta"><b>${esc(a.title)}</b><small>${r.day} ${r.month}${dv?' · '+dv.name:''} · ${a.photos.length} фото${a.video?' · видео':''}</small></span></button></li>`;}).join('');
  let al=null, k=0;
  const img=dlg.querySelector('img'), cap=dlg.querySelector('.v-cap'), vid=dlg.querySelector('.v-video');
  function show(){img.src=al.photos[k]; img.alt=`${al.title}, фото ${k+1}`; cap.textContent=`${al.title} · ${k+1} из ${al.photos.length}`;}
  grid.addEventListener('click',e=>{const b=e.target.closest('.album'); if(!b) return; al=list[+b.dataset.i]; k=0; vid.hidden=!al.video; if(al.video) vid.href=al.video; show(); dlg.showModal();});
  dlg.querySelector('.v-prev').addEventListener('click',()=>{k=(k-1+al.photos.length)%al.photos.length; show();});
  dlg.querySelector('.v-next').addEventListener('click',()=>{k=(k+1)%al.photos.length; show();});
  dlg.querySelector('.v-close').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('keydown',e=>{if(e.key==='ArrowLeft') dlg.querySelector('.v-prev').click(); if(e.key==='ArrowRight') dlg.querySelector('.v-next').click();});
})();
