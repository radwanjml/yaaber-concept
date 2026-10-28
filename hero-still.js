// p1 hero: hit areas over the rendered still. Story/walk returns in phase 2 with characters.
(() => {
  const msg = { reel: 'Café · film a reel, Yab it to a friend', song: 'Music kiosk · pick a song, hear it together', news: 'News cart · grab a headline, talk it over', y: 'The Y · you at the foot, two friends at the ends' };
  const toastEl = document.getElementById('toast');
  const toast = t => { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 3200); };
  document.querySelectorAll('.hit').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.hit.on').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); toast(msg[b.dataset.obj]);
  }));
})();
// 3D blockout layer: loaded after the page, so the still paints first on slow connections (Kwame).
{ const img = document.querySelector('.hero-still img'), go = () => import('./hero3d.js?v=7').catch(e => console.warn('3D layer off:', e)); (img.decode ? img.decode() : Promise.resolve()).then(go, go); }
// Desktop layout (golden ratio): copy = left 38.2% of the 1240 container; island centred in the right 61.8%.
// Frame facts (anchors_pct.json): island spans x 27-87% (centre 57%), y 8.8-87% (centre 48%) of the 16:9 frame.
(() => {
  const hero = document.querySelector('.hero-still'), frame = hero.querySelector('.frame'), NAV = 110, BOTTOM = 48;
  function lay() {
    if (innerWidth <= 1024) { frame.removeAttribute('style'); return; }
    const vw = document.documentElement.clientWidth, hh = hero.clientHeight;
    const pad = Math.min(34, Math.max(16, vw * 0.04)), cw = Math.min(1360, vw) - 2 * pad, cl = (vw - cw) / 2;
    const h = Math.min((hh - NAV - BOTTOM) / 0.78, (0.618 * cw * 0.98) / 1.0667); // island fits height and the right column
    const w = h * 16 / 9, cx = cl + cw * (0.382 + 0.618 / 2), cy = NAV + (hh - NAV - BOTTOM) / 2;
    Object.assign(frame.style, { width: w + 'px', height: h + 'px', left: (cx - 0.57 * w) + 'px', top: (cy - 0.48 * h) + 'px' });
  }
  addEventListener('resize', lay); lay();
})();
