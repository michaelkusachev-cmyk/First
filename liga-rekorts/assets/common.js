/* Общий код всех страниц лиги РЕ:КОРТС */
document.documentElement.classList.add('js');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches, FINE=matchMedia('(pointer:fine)').matches;
/* если скрипт где-то упадёт, текст всё равно появится */
setTimeout(()=>document.querySelectorAll('.rise').forEach(el=>el.classList.add('in')),4000);
function replay(el,cls){el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);}

/* ---------- точечный шрифт 5×7, как на афише ---------- */
const G = {
 '0':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
 '1':['..#..','.##..','#.#..','..#..','..#..','..#..','#####'],
 '2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
 '3':['.###.','#...#','....#','..##.','....#','#...#','.###.'],
 '4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
 '5':['#####','#....','####.','....#','....#','#...#','.###.'],
 '6':['..##.','.#...','#....','####.','#...#','#...#','.###.'],
 '7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
 '8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
 '9':['.###.','#...#','#...#','.####','....#','...#.','.##..'],
 'Г':['#####','#....','#....','#....','#....','#....','#....'],
 'Й':['#.#.#','#...#','#..##','#.#.#','##..#','#...#','#...#'],
 'М':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
 '.':['.','.','.','.','.','.','#'],
 ':':['.','.','#','.','#','.','.'],
 '-':['...','...','...','###','...','...','...'],
 '+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
 ' ':['..','..','..','..','..','..','..'],
 'Р':['####.','#...#','#...#','####.','#....','#....','#....'],
 'Е':['#####','#....','#....','####.','#....','#....','#####'],
 'К':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
 'О':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
 'Т':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
 'С':['.###.','#...#','#....','#....','#....','#...#','.###.']
};
function dotSVG(text, lazy, popIn){
  const C=10, R=4.2; let x=0, out='';
  const chars=[...text];
  chars.forEach((ch,ci)=>{
    const g=G[ch]||G[' ']; const w=g[0].length;
    for(let r=0;r<7;r++) for(let c=0;c<w;c++) if(g[r][c]==='#'){
      const cx=x+c*C+C/2, cy=r*C+C/2;
      const rx=Math.sin((cx*12.9898+cy*78.233))*43758.5453, ry=Math.sin((cx*39.346+cy*11.135))*24634.6345;
      const d=lazy?` style="--d:${Math.round((x/C+c)*12+r*9)}ms;--x:${Math.round((rx-Math.floor(rx)-.5)*160)}px;--y:${Math.round((ry-Math.floor(ry)-.5)*160)}px"`
             :(popIn?` style="--d:${Math.round((x/C+c)*8+r*6)}ms"`:'');
      out+=`<circle cx="${cx}" cy="${cy}" r="${R}"${d}/>`;
    }
    x+=w*C+(ci<chars.length-1?C:0);
  });
  return `<svg class="dots${lazy?' lazy':''}${popIn?' pop':''}" viewBox="-1 -1 ${x+2} ${7*C+2}" width="${((x+2)/(7*C+2)).toFixed(3)}em" height="1em" aria-hidden="true" focusable="false">${out}</svg>`;
}
function paintDots(root=document){
  root.querySelectorAll('[data-dots]').forEach(el=>{el.innerHTML=dotSVG(el.dataset.dots, el.hasAttribute('data-lazy'));});
}
paintDots();
function setDots(el,text,pop){ if(el.dataset.v===text) return; el.dataset.v=text; el.innerHTML=dotSVG(text,false,pop&&!RM);}


/* ---------- появление ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  e.target.classList.add('in');
  e.target.querySelectorAll('.dots.lazy').forEach(d=>d.classList.add('lit'));
  if(e.target.classList.contains('giant')) e.target.querySelectorAll('.dots').forEach(d=>d.classList.add('lit'));
  io.unobserve(e.target);
}),{threshold:.15, rootMargin:'0px 0px -6% 0px'});
function observeRise(root=document){root.querySelectorAll('.rise, .giant').forEach(el=>io.observe(el));}
observeRise();
// группы внутри секции получают порядковую задержку
document.querySelectorAll('.perk-list, .club-list, .steps, .offer, .lvl-list').forEach(list=>[...list.children].forEach((li,i)=>li.style.setProperty('--i',i)));

/* ---------- мобильная панель прячется у формы и у первого экрана ---------- */
(function dockHide(){
  const dock=document.getElementById('dock'); if(!dock) return;
  const io2=new IntersectionObserver(es=>es.forEach(e=>dock.classList.toggle('hide',e.isIntersecting)),{threshold:.2});
  document.querySelectorAll('[data-hide-dock], #apply, #h1').forEach(el=>io2.observe(el));
})();

/* ---------- бегущая строка ---------- */
(function tapes(){
  const run=document.getElementById('run-a'); if(!run) return;
  const star='<svg aria-hidden="true"><use href="#spark"/></svg>';
  const A=(run.dataset.words||'84 пары в лиге|Женский|Любитель|Мастер|Профи|40+|12.12 — 21.02').split('|');
  const one=A.map(w=>`<span>${w}${star}</span>`).join(''); run.innerHTML=one+one+one+one;
  if(RM) return;
  const runs=[...document.querySelectorAll('.tape .run')].map(el=>el.getAnimations()[0]).filter(Boolean);
  let lastY=scrollY, boost=0;
  addEventListener('scroll',()=>{boost=Math.min(2.5,boost+Math.abs(scrollY-lastY)/40); lastY=scrollY;},{passive:true});
  (function loop(){boost*=.92; runs.forEach(a=>a.updatePlaybackRate?a.updatePlaybackRate(1+boost):a.playbackRate=1+boost); requestAnimationFrame(loop);})();
})();

/* ---------- прогресс прокрутки: звезда едет по голубой линии ---------- */
(function prog(){
  const el=document.getElementById('prog'); if(!el) return;
  const upd=()=>{const h=document.documentElement.scrollHeight-innerHeight; el.style.setProperty('--p',h>0?(scrollY/h).toFixed(4):0);};
  addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); upd();
})();

/* ---------- кнопки тянутся к курсору ---------- */
function magnet(root=document){
  if(RM||!FINE) return;
  root.querySelectorAll('.btn:not([data-mag])').forEach(b=>{
    b.dataset.mag='1';
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect(); b.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*14+'px'); b.style.setProperty('--my',((e.clientY-r.top)/r.height-.5)*10+'px');});
    b.addEventListener('pointerleave',()=>{b.style.setProperty('--mx','0px'); b.style.setProperty('--my','0px');});
  });
}
magnet();

/* ---------- меню (телефон и планшет) и отметка текущей страницы ---------- */
(function menu(){
  const here=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav a, .menu-list a, .foot-nav a').forEach(a=>{if(a.getAttribute('href')===here) a.setAttribute('aria-current','page');});
  const dlg=document.getElementById('menu'), btn=document.querySelector('.menu-btn'); if(!dlg||!btn) return;
  [...dlg.querySelectorAll('.menu-list li')].forEach((li,i)=>li.style.setProperty('--i',i));
  btn.addEventListener('click',()=>{dlg.showModal(); btn.setAttribute('aria-expanded','true');});
  dlg.querySelector('.menu-close').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('close',()=>btn.setAttribute('aria-expanded','false'));
  dlg.addEventListener('click',e=>{if(e.target.closest('a')) dlg.close();});
})();

/* ---------- заявка в нужный дивизион: страница дивизиона → форма на главной ---------- */
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-apply-div]'); if(!a) return;
  try{sessionStorage.setItem('applyDiv',a.dataset.applyDiv); if(a.dataset.applyTo) sessionStorage.setItem('applyTo',a.dataset.applyTo); else sessionStorage.removeItem('applyTo');}catch(err){}
});
