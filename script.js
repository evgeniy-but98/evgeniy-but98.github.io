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
    img.loading = 'lazy';
    frag.appendChild(img);
  }
  if (preview) {
    const v = el('video', 'media-preview');
    v.src = preview;
    v.muted = true; v.loop = true; v.playsInline = true;
    v.preload = 'none';
    frag.appendChild(v);
  }
  // Значок «играть» — подсказка, что превью кликабельно (на тач всегда виден)
  //const badge = el('span', 'play-badge', '▶');
  //badge.setAttribute('aria-hidden', 'true');
  //frag.appendChild(badge);
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
  // Автосортировка по годам: от новых к старым. Сортировка стабильная,
  // поэтому внутри одного года сохраняется исходный порядок из data/works.js.
  // Это чинит «прыгающую» ленту лет: порядок карточек в DOM теперь
  // совпадает с порядком лет в таймлайне.
  const sorted = [...window.PORTFOLIO.works].sort((a, b) => b.year - a.year);
  sorted.forEach(w => {
    const a = el('article', 'work-card');
    a.dataset.category = w.category;
    a.dataset.year = w.year;
    a.dataset.id = w.id;
    a.tabIndex = 0;
    a.setAttribute('role', 'button');
    a.setAttribute('aria-label', w.title + ' — открыть');

    // Большая «киношная» плитка: медиа на весь кадр, текст оверлеем снизу.
    const thumb = el('div', 'work-thumb');
    thumb.appendChild(buildMedia(w.poster, w.preview, w.title));

    const info = el('div', 'work-info');
    const head = el('div', 'work-head');
    head.appendChild(el('span', 'work-role', w.role));
    head.appendChild(el('span', 'work-yr', String(w.year)));
    info.appendChild(head);
    info.appendChild(el('h2', 'work-name', w.title));
    info.appendChild(el('p', 'work-desc', w.desc));
    const tags = el('div', 'work-tags');
    (w.tags || []).slice(0, 3).forEach(t => tags.appendChild(el('span', 'wtag', t)));
    info.appendChild(tags);

    a.appendChild(thumb);
    a.appendChild(info);
    a.addEventListener('click', e => { if (!e.target.closest('a')) openWork(w); });
    a.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWork(w); }
    });
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

// Видео в работах/ленте играют САМИ, когда попадают в зону видимости
// (как на студийных сайтах-референсах), плюс мгновенный рестарт при наведении.
function initMediaPlayback() {
  const items = document.querySelectorAll('.strip-item, .work-thumb');
  if (!items.length) return;

  const io = ('IntersectionObserver' in window) ? new IntersectionObserver(es => es.forEach(e => {
    const v = e.target.querySelector('.media-preview');
    if (!v) return;
    if (e.isIntersecting) {
      e.target.classList.add('playing');
      const p = v.play(); if (p) p.catch(() => { });
    } else {
      e.target.classList.remove('playing');
      v.pause();
    }
  }), { threshold: 0.5 }) : null;

  items.forEach(elm => {
    if (elm._mpWired) return;
    elm._mpWired = true;
    const v = elm.querySelector('.media-preview');
    if (!v) return;
    if (io) io.observe(elm);
    elm.addEventListener('mouseenter', () => {
      try { v.currentTime = 0; } catch (_) { }
      const p = v.play(); if (p) p.catch(() => { });
    });
  });
}

// Фоновое видео на главной через Kinescope Player API.
// Обычные параметры в ссылке (?autoplay=1...) у Kinescope автоплей НЕ запускают —
// нужен именно Player API с behavior.autoPlay. ID видео берётся из data-kinescope-id.
function initHeroPlayer() {
  const box = document.getElementById('hero-player');
  if (!box) return;
  const id = box.dataset.kinescopeId;
  if (!id) return;

  function start() {
    if (!(window.Kinescope && window.Kinescope.IframePlayer)) return false;
    window.Kinescope.IframePlayer.create('hero-player', {
      url: 'https://kinescope.io/' + id,
      size: { width: '100%', height: '100%' },
      behavior: { autoPlay: true, muted: true, loop: true },
      ui: { controls: false }
    }).catch(() => { });
    return true;
  }

  // Скрипт плеера может ещё не загрузиться к моменту вызова — ждём его.
  if (!start()) {
    let tries = 0;
    const iv = setInterval(() => {
      if (start() || ++tries > 50) clearInterval(iv);
    }, 150);
  }
}

// Параллакс + лёгкий зум фонового видео при прокрутке (отключается reduced-motion)
function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...document.querySelectorAll('[data-parallax]')];
  if (!els.length) return;
  let ticking = false;
  function update() {
    const y = window.scrollY;
    els.forEach(elm => {
      const f = parseFloat(elm.dataset.parallax) || 0.15;
      const scale = 1 + Math.min(y, 700) / 700 * 0.1;
      elm.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/* ══════════════════════════════════════════════════════════════
   STRIP — авто-прокрутка + авто-fit
   ────────────────────────────────────────────────────────────── */

function initStripAutoScroll() {
  const t = document.getElementById('strip-track'); if (!t) return;
  const sec = t.closest('section'); if (!sec) return;

  // Ширина «страницы» прокрутки = ширина одной карточки + gap
  function pageStep() {
    const item = t.querySelector('.strip-item');
    if (!item) return t.clientWidth * .8;
    const gap = parseFloat(getComputedStyle(t).columnGap || getComputedStyle(t).gap || '14') || 14;
    return item.getBoundingClientRect().width + gap;
  }

  /* ── Hover-зоны: плавная авто-прокрутка ТОЛЬКО для мыши.
     На тач-устройствах они скрыты через CSS (@media hover:none),
     поэтому больше не «перехватывают» тап по центральным карточкам
     и не уезжают до самого конца. ── */
  let raf = null;
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  function autoScroll(dir) {
    stop();
    (function step() { t.scrollLeft += dir * 10; raf = requestAnimationFrame(step); })();
  }

  const zones = [];
  function makeZone(side) {
    const z = document.createElement('div');
    z.className = 'strip-zone strip-zone-' + (side > 0 ? 'r' : 'l');
    z.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="' +
      (side > 0 ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6') + '"/></svg>';
    z.addEventListener('mouseenter', () => autoScroll(side));
    z.addEventListener('mouseleave', stop);
    // Клик по зоне — дискретный сдвиг на одну карточку (на случай, если
    // мышь не «дожимает» край).
    z.addEventListener('click', () => { stop(); t.scrollBy({ left: side * pageStep(), behavior: 'smooth' }); });
    sec.appendChild(z);
    zones.push(z);
  }
  makeZone(-1);
  makeZone(1);

  /* ── Тач-пейджер: явные кнопки ‹ › + точки под лентой.
     Видны только на тач-устройствах (CSS). Дают понятную, предсказуемую
     постраничную прокрутку вместо неудобного «листания» пальцем. ── */
  const pager = document.createElement('div');
  pager.className = 'strip-pager';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Предыдущий ролик');
  prev.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>';
  const next = document.createElement('button');
  next.type = 'button';
  next.setAttribute('aria-label', 'Следующий ролик');
  next.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>';
  const dots = document.createElement('div');
  dots.className = 'strip-dots';

  function buildDots() {
    dots.innerHTML = '';
    const items = t.querySelectorAll('.strip-item');
    items.forEach(() => dots.appendChild(document.createElement('i')));
    syncDots();
  }
  function syncDots() {
    const items = [...t.querySelectorAll('.strip-item')];
    if (!items.length) return;
    const center = t.scrollLeft + t.clientWidth / 2;
    let idx = 0, best = Infinity;
    items.forEach((it, i) => {
      const c = it.offsetLeft + it.offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < best) { best = d; idx = i; }
    });
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === idx));
  }
  prev.addEventListener('click', () => t.scrollBy({ left: -pageStep(), behavior: 'smooth' }));
  next.addEventListener('click', () => t.scrollBy({ left: pageStep(), behavior: 'smooth' }));
  pager.appendChild(prev);
  pager.appendChild(dots);
  pager.appendChild(next);
  sec.appendChild(pager);
  buildDots();

  let st = null;
  t.addEventListener('scroll', () => {
    if (st) cancelAnimationFrame(st);
    st = requestAnimationFrame(syncDots);
  }, { passive: true });

  // Если роликов мало и они помещаются — растягиваем на всю ширину,
  // прячем зоны и пейджер. На тач-устройствах режим «fit» не применяем:
  // там ленту листают пальцем/пейджером, и сжимать карточки незачем.
  function evalFit() {
    stop();
    const isTouch = window.matchMedia('(hover:none)').matches;
    t.classList.remove('fit'); // снять до замера, иначе scrollWidth == clientWidth (латч)
    const overflow = t.scrollWidth > t.clientWidth + 4;
    t.classList.toggle('fit', !overflow && !isTouch);
    zones.forEach(z => z.classList.toggle('off', !overflow));
    // На тач показываем пейджер, когда есть что листать; CSS сам решает видимость
    // через @media(hover:none), поэтому снимаем inline-стиль, а не ставим flex.
    pager.style.display = (isTouch && overflow) ? '' : 'none';
    buildDots();
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
  const els = [...document.querySelectorAll('.r')];
  const reveal = el => el.classList.add('vis');
  const inView = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.95 && r.bottom > 0; };

  const ro = new IntersectionObserver(
    es => es.forEach(e => { if (e.isIntersecting) { reveal(e.target); ro.unobserve(e.target); } }),
    { threshold: .12 });
  els.forEach(el => ro.observe(el));

  // Подстраховка: если IntersectionObserver придушен (например, вкладка была
  // в фоне при загрузке) — показываем всё, что в зоне видимости, при загрузке
  // и при возврате на вкладку. Контент никогда не «застревает» скрытым.
  const sweep = () => els.forEach(el => { if (!el.classList.contains('vis') && inView(el)) reveal(el); });
  setTimeout(sweep, 1600);
  window.addEventListener('load', sweep);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sweep(); });
}

/* ══ TIMELINE ══ */
function buildTimeline() {
  const tl = document.getElementById('tl-inner');
  if (!tl) return;
  const cards = [...document.querySelectorAll('.work-card:not(.hidden)')];
  const years = [...new Set(cards.map(c => +c.dataset.year))].sort((a, b) => b - a);
  if (!years.length) { tl.innerHTML = ''; return; }
  tl.innerHTML = years.map(y => `<div class="tl-year" data-y="${y}">${y}</div>`).join('');

  let lastCur = null;
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

    // На мобильном таймлайн горизонтальный — подкручиваем активный год к центру.
    if (cur !== lastCur) {
      lastCur = cur;
      const active = tl.querySelector('.tl-year.hl');
      if (active && window.matchMedia('(max-width:860px)').matches) {
        const target = active.offsetLeft - tl.clientWidth / 2 + active.offsetWidth / 2;
        tl.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    }
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
initHeroPlayer();
initMediaPlayback();
initStripAutoScroll();
initScrollReveal();
initWorksFilter();
initParallax();
buildTimeline();
