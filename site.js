(() => {
  const root = document.documentElement;
  const $ = s => document.querySelector(s);

  // ---- nav: scrolled state + hide on scroll down, show on scroll up ----
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY;
    root.classList.toggle('scrolled', y > 30);
    if (Math.abs(y - lastY) > 6) {
      root.classList.toggle('nav-hidden', y > lastY && y > 240);
      lastY = y;
    }
    // leading line across the How steps
    const steps = $('#howSteps');
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.3)));
      steps.style.setProperty('--p', p.toFixed(3));
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---- mobile sheet ----
  const sheet = $('#sheet'), scrim = $('#scrim'), menuBtn = $('#menuBtn');
  function setSheet(on) { sheet.classList.toggle('on', on); scrim.classList.toggle('on', on); menuBtn.setAttribute('aria-expanded', on); }
  menuBtn.onclick = () => setSheet(!sheet.classList.contains('on'));
  scrim.onclick = () => setSheet(false);
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setSheet(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') { setSheet(false); setLab(false); } });

  // ---- active section in nav ----
  const links = [...document.querySelectorAll('.nav-links a')];
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['how', 'features', 'orgs', 'faq'].forEach(id => { const el = document.getElementById(id); el && io.observe(el); });

  // ---- reveal on scroll ----
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(el => rv.observe(el));

  // ---- nav lab ----
  const lab = $('#lab'), labBtn = $('#labBtn');
  function setLab(on) { lab.classList.toggle('on', on); labBtn.setAttribute('aria-expanded', on); }
  labBtn.onclick = () => setLab(!lab.classList.contains('on'));
  const map = { navPos: 'navPos', navHide: 'navHide', navMat: 'navMat' };
  for (const name in map) {
    document.querySelectorAll(`input[name=${name}]`).forEach(inp => {
      inp.checked = root.dataset[map[name]] === inp.value;
      inp.addEventListener('change', () => {
        root.dataset[map[name]] = inp.value;
        root.classList.remove('nav-hidden');
        try { localStorage.setItem('yaaber-lab', JSON.stringify({ navPos: root.dataset.navPos, navHide: root.dataset.navHide, navMat: root.dataset.navMat })); } catch {}
      });
    });
  }

  // ---- industries (Companion) ----
  const IND = [
    ['Education', 'i-cap', 'Bring courses and campus life closer.', ['Student asks “Which course fits me?”', 'Course finder', 'Talk to an adviser']],
    ['Clinics', 'i-steth', 'Make services and appointments easy to find.', ['Patient picks a service', 'Available times', 'Request a booking']],
    ['Hospitality', 'i-bed', 'Help guests feel at home before they arrive.', ['Guest checks in early', 'Room & local tips', 'Message the front desk']],
    ['Aviation', 'i-plane', 'Give travellers a clearer view of their journey.', ['Traveller opens trip', 'Gate & updates', 'Reach the help desk']],
    ['Charities', 'i-heart', 'Connect people with your purpose.', ['Supporter browses causes', 'Upcoming events', 'Sign up to volunteer']],
    ['Retail', 'i-bag', 'Bring store info and services together.', ['Customer asks a question', 'Products & stock', 'Chat with the store']],
    ['Engineering', 'i-wrench', 'Keep teams close to approved project updates.', ['Site team opens project', 'Latest approved drawings', 'Call the office']],
    ['Places of worship', 'i-building', 'Share times, events and notices with your community.', ['Member opens the page', 'This week’s times', 'Message the office']],
    ['Professional services', 'i-chat', 'Help clients reach the right person.', ['Client asks a question', 'Services & fees', 'Book a call']],
    ['Community clubs', 'i-users', 'Keep members close to club life.', ['Member opens the club', 'This week’s activities', 'Join the group chat']]
  ];
  const list = $('#indList'), panel = $('#indPanel');
  function show(i, focus) {
    const [name, ic, line, flow] = IND[i];
    [...list.children].forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; });
    if (focus) list.children[i].focus();
    panel.innerHTML = `<div class="fade-swap"><span class="badge" style="display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--forest-2)"><svg class="ic"><use href="#${ic}"/></svg>${name} Companion</span>
      <h3>${line}</h3><p style="margin:0;color:var(--mute)">An example journey, start to finish, inside Yaaber:</p>
      <div class="flow">${flow.map((s, k) => (k ? '<svg class="ic"><use href="#i-arrow"/></svg>' : '') + `<span>${s}</span>`).join('')}</div>
      <div class="ctas"><a class="btn btn-primary" href="#">Open the ${name.toLowerCase()} demo<svg class="ic"><use href="#i-arrow"/></svg></a><a class="btn btn-ghost" href="#">Talk to us</a></div></div>`;
  }
  IND.forEach(([name, ic], i) => {
    const b = document.createElement('button');
    b.className = 'ind'; b.setAttribute('role', 'tab'); b.id = 'ind-' + i;
    b.innerHTML = `<svg class="ic"><use href="#${ic}"/></svg>${name}`;
    b.onclick = () => show(i);
    b.onkeydown = e => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); show((i + d + IND.length) % IND.length, true); }
    };
    list.append(b);
  });
  show(0);
})();
