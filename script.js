/* ══════════════════════════════════════════════════════════════
   Логика портфолио. Данные работ — в data/works.js
   (window.PORTFOLIO.featured, window.PORTFOLIO.works)
   ────────────────────────────────────────────────────────────── */

/* ══ КУРСОР ══ */
const cur = document.getElementById('cur'), ring = document.getElementById('cur-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px'; cur.style.top = my + 'px';
});
(function lr() {
  rx += (mx - rx) * .1; ry += (my - ry) * .1;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(lr);
})();

// Расширение курсора над интерактивными элементами — делегированно,
// чтобы динамически отрендеренные карточки тоже его получали.
const CB_SEL = 'a,button,.strip-item,.work-card,.why-card,.ach-item';
let _cbInside = false;
document.addEventListener('mouseover', e => {
  const inside = !!e.target.closest(CB_SEL);
  if (inside !== _cbInside) {
    _cbInside = inside;
    document.body.classList.toggle('cb', inside);
  }
});

/* ══ NAV SCROLL ══ */
window.addEventListener('scroll',
  () => document.getElementById('main-nav').classList.toggle('scrolled', scrollY > 40),
  { passive: true });

/* ══ ИНДИКАТОР PILL ══ */
const pills = document.getElementById('nav-pills');
function updatePill() {
  const ab = pills.querySelector('.nav-btn.active');
  if (!ab) return;
  pills.style.setProperty('--il', ab.offsetLeft + 'px');
  pills.style.setProperty('--iw', ab.offsetWidth + 'px');
}
window.addEventListener('load', updatePill);
window.addEventListener('resize', updatePill);

/* ══ SPA-НАВИГАЦИЯ ══ */
function goTo(id) {
  document.querySelectorAll('.page').forEach(p => {
    if (p.id === 'page-' + id) {
      p.style.display = 'block';
      requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('active')));
    } else {
      p.classList.remove('active');
      setTimeout(() => { if (!p.classList.contains('active')) p.style.display = 'none'; }, 600);
    }
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === id));
  setTimeout(updatePill, 20);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'works') buildTimeline();
}
document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', () => goTo(el.dataset.nav));
});

/* ══ HERO CANVAS — частицы ══ */
(function () {
  const cv = document.getElementById('hero-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, mx = 0, my = 0;
  const pts = [];
  const N = 100;
  function resize() {
    W = cv.width = cv.offsetWidth || cv.parentElement.offsetWidth || window.innerWidth;
    H = cv.height = cv.offsetHeight || cv.parentElement.offsetHeight || (window.innerHeight - 72);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);
  document.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
  });

  // Палитра: 60% красный, 30% синий, 10% розовый
  const COLS = [[230, 57, 70], [230, 57, 70], [230, 57, 70], [37, 99, 235], [37, 99, 235], [247, 37, 133]];
  class P {
    constructor() { this.rst() }
    rst() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.vx = (Math.random() - .5) * .4; this.vy = (Math.random() - .5) * .4;
      this.r = Math.random() * 1.8 + .4; this.a = Math.random() * .55 + .15;
      this.col = COLS[Math.floor(Math.random() * COLS.length)];
    }
    tick() {
      const dx = this.x - mx, dy = this.y - my, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) { const f = (120 - d) / 120 * .75; this.vx += dx / d * f; this.vy += dy / d * f; }
      this.vx *= .96; this.vy *= .96;
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0) this.x = W; if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H; if (this.y > H) this.y = 0;
    }
  }
  for (let i = 0; i < N; i++) pts.push(new P());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) {
        const a = (1 - d / 120) * .14;
        const c = pts[i].col;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
        ctx.lineWidth = .7; ctx.stroke();
      }
    }
    pts.forEach(p => {
      p.tick();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   РЕНДЕРИНГ ИЗ ДАННЫХ — featured strip + works cards
   ────────────────────────────────────────────────────────────── */

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

function buildMedia(poster, preview, alt) {
  const frag = document.createDocumentFragment();
  if (poster) {
    const img = el('img', 'media-poster');
    img.src = poster; img.alt = alt || '';
    frag.appendChild(img);
  }
  if (preview) {
    const v = el('video', 'media-preview');
    v.src = preview;
    v.muted = true; v.loop = true; v.playsInline = true;
    v.preload = 'none';
    frag.appendChild(v);
  }
  return frag;
}

function renderFeatured() {
  const track = document.getElementById('strip-track');
  if (!track || !window.PORTFOLIO) return;
  track.innerHTML = '';
  window.PORTFOLIO.featured.forEach(f => {
    const item = el('div', 'strip-item');
    item.dataset.id = f.id;
    item.appendChild(buildMedia(f.poster, f.preview, f.title));
    const ov = el('div', 'strip-ov');
    ov.appendChild(el('p', 'strip-cat', f.cat));
    ov.appendChild(el('p', 'strip-title', f.title));
    item.appendChild(ov);
    item.addEventListener('click', () => openWork(f));
    track.appendChild(item);
  });
}

function renderWorks() {
  const cont = document.getElementById('works-cards');
  if (!cont || !window.PORTFOLIO) return;
  cont.innerHTML = '';
  window.PORTFOLIO.works.forEach(w => {
    const a = el('article', 'work-card');
    a.dataset.category = w.category;
    a.dataset.year = w.year;
    a.dataset.id = w.id;

    const thumb = el('div', 'work-thumb');
    thumb.appendChild(buildMedia(w.poster, w.preview, w.title));

    const info = el('div', 'work-info');
    const top = el('div');
    const head = el('div', 'work-head');
    head.appendChild(el('span', 'work-role', w.role));
    head.appendChild(el('span', 'work-yr', String(w.year)));
    top.appendChild(head);
    top.appendChild(el('h2', 'work-name', w.title));
    top.appendChild(el('p', 'work-desc', w.desc));
    info.appendChild(top);

    const foot = el('div', 'work-footer');
    foot.appendChild(el('span', 'work-studio', w.studio));
    const tags = el('div', 'work-tags');
    (w.tags || []).forEach(t => tags.appendChild(el('span', 'wtag', t)));
    foot.appendChild(tags);
    info.appendChild(foot);

    a.appendChild(thumb);
    a.appendChild(info);
    a.addEventListener('click', e => { if (!e.target.closest('a')) openWork(w); });
    cont.appendChild(a);
  });
}

/* ══════════════════════════════════════════════════════════════
   МОДАЛЬНОЕ ОКНО ВИДЕО
   ────────────────────────────────────────────────────────────── */

const modal = document.getElementById('modal');
const vWrap = document.getElementById('modal-video');
const catEl = document.getElementById('modal-cat');
const titleEl = document.getElementById('modal-title');
const descEl = document.getElementById('modal-desc');

function buildRichDesc(rich) {
  // Собираем расширенное описание через DOM API — без innerHTML,
  // чтобы избежать проблем с вложенными блочными элементами.
  if (rich.lead)  descEl.appendChild(el('p', 'modal-rich-lead', rich.lead));
  if (rich.intro) descEl.appendChild(el('p', 'modal-rich-text', rich.intro));

  (rich.rows || []).forEach(r => {
    const row = el('div', 'modal-row' + (r.side === 'right' ? ' modal-row--reverse' : ''));

    const imgWrap = el('div', 'modal-row-img');
    if (r.image) {
      const img = el('img'); img.src = r.image; img.alt = r.caption || r.label || '';
      imgWrap.appendChild(img);
    }
    if (r.caption) imgWrap.appendChild(el('span', 'modal-img-cap', r.caption));

    const txt = el('div', 'modal-row-text');
    if (r.label) txt.appendChild(el('p', 'modal-rich-label', r.label));
    if (r.text)  txt.appendChild(el('p', 'modal-rich-text', r.text));

    // Порядок DOM: для side='right' (картинка справа) текст идёт первым,
    // картинка второй — CSS .modal-row--reverse визуально это поддерживает.
    if (r.side === 'right') { row.appendChild(txt); row.appendChild(imgWrap); }
    else                    { row.appendChild(imgWrap); row.appendChild(txt); }

    descEl.appendChild(row);
  });

  if (rich.tags && rich.tags.length) {
    const tg = el('div', 'modal-rich-tags');
    rich.tags.forEach(t => tg.appendChild(el('span', null, t)));
    descEl.appendChild(tg);
  }
}

function openWork(w) {
  if (!w || !w.embed) return;
  catEl.textContent = w.cat || w.role || '';
  titleEl.textContent = w.title || '';

  // Чистим описание, затем строим — либо rich, либо обычный текст
  descEl.innerHTML = '';
  if (w.rich) buildRichDesc(w.rich);
  else        descEl.textContent = w.desc || '';

  const src = w.embed + (w.embed.indexOf('?') !== -1 ? '&' : '?') + 'autoplay=1';
  const ifr = document.createElement('iframe');
  ifr.src = src;
  ifr.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;');
  ifr.setAttribute('allowfullscreen', '');
  ifr.setAttribute('frameborder', '0');
  vWrap.innerHTML = '';
  vWrap.appendChild(ifr);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  vWrap.innerHTML = '';
  descEl.innerHTML = '';
  document.body.style.overflow = '';
}

if (modal) {
  modal.querySelectorAll('[data-close]').forEach(e => e.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ══════════════════════════════════════════════════════════════
   ВИДЕО-ПРЕВЬЮ ПРИ НАВЕДЕНИИ — навешиваем после рендера
   ────────────────────────────────────────────────────────────── */

function wireHoverPreviews() {
  document.querySelectorAll('.strip-item, .work-thumb').forEach(elm => {
    const v = elm.querySelector('.media-preview');
    if (!v || elm._hpWired) return;
    elm._hpWired = true;
    elm.addEventListener('mouseenter', () => {
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => { });
    });
    elm.addEventListener('mouseleave', () => v.pause());
  });
}

/* ══════════════════════════════════════════════════════════════
   STRIP — авто-прокрутка + авто-fit
   ────────────────────────────────────────────────────────────── */

function initStripAutoScroll() {
  const t = document.getElementById('strip-track'); if (!t) return;
  const sec = t.closest('section'); if (!sec) return;

  let raf = null;
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  function scroll(dir) {
    stop();
    (function step() { t.scrollLeft += dir * 10; raf = requestAnimationFrame(step); })();
  }

  const zones = [];
  function makeZone(side) {
    const z = document.createElement('div');
    z.className = 'strip-zone strip-zone-' + (side > 0 ? 'r' : 'l');
    z.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="' +
      (side > 0 ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6') + '"/></svg>';
    z.addEventListener('mouseenter', () => scroll(side));
    z.addEventListener('mouseleave', stop);
    sec.appendChild(z);
    zones.push(z);
  }
  makeZone(-1);
  makeZone(1);

  // Если работ мало — растягиваем их на всю ширину и прячем стрелки
  function evalFit() {
    stop();
    t.classList.remove('fit');
    const overflow = t.scrollWidth > t.clientWidth + 4;
    t.classList.toggle('fit', !overflow);
    zones.forEach(z => z.classList.toggle('off', !overflow));
  }
  evalFit();
  window.addEventListener('load', evalFit);
  window.addEventListener('resize', evalFit);
}

/* ══ ФИЛЬТР РАБОТ ══ */
function initWorksFilter() {
  document.querySelectorAll('.f-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const f = btn.dataset.filter;
      document.querySelectorAll('.work-card').forEach(c =>
        c.classList.toggle('hidden', f !== 'all' && c.dataset.category !== f));
      buildTimeline();
    });
  });
}

/* ══ SCROLL REVEAL ══ */
function initScrollReveal() {
  const ro = new IntersectionObserver(
    es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); ro.unobserve(e.target); } }),
    { threshold: .1 });
  document.querySelectorAll('.r').forEach(elm => ro.observe(elm));
}

/* ══ TIMELINE ══ */
function buildTimeline() {
  const tl = document.getElementById('tl-inner');
  if (!tl) return;
  const cards = [...document.querySelectorAll('.work-card:not(.hidden)')];
  const years = [...new Set(cards.map(c => +c.dataset.year))].sort((a, b) => b - a);
  if (!years.length) { tl.innerHTML = ''; return; }
  tl.innerHTML = years.map(y => `<div class="tl-year" data-y="${y}">${y}</div>`).join('');

  function hl() {
    const vis = cards.filter(c => !c.classList.contains('hidden'));
    let cur = years[0];
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
    if (atBottom && vis.length) {
      cur = +vis[vis.length - 1].dataset.year;
    } else {
      vis.forEach(c => { if (c.getBoundingClientRect().top < window.innerHeight * .6) cur = +c.dataset.year; });
    }
    tl.querySelectorAll('.tl-year').forEach(elm => elm.classList.toggle('hl', +elm.dataset.y === cur));
  }
  window.removeEventListener('scroll', window._tlhl);
  window._tlhl = hl;
  window.addEventListener('scroll', hl, { passive: true });
  hl();
}

/* ══════════════════════════════════════════════════════════════
   СТАРТ
   ────────────────────────────────────────────────────────────── */
renderFeatured();
renderWorks();
wireHoverPreviews();
initStripAutoScroll();
initScrollReveal();
initWorksFilter();
buildTimeline();
