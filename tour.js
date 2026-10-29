// "Inside Yaaber" tour: five tabs, one phone. Concept screens built from Yaaber's listed features (docs/01).
(() => {
  const ic = id => `<svg class="ic"><use href="#${id}"/></svg>`;
  const SCREENS = {
    reels: {
      desc: 'Reels picked around what you love. Send one to a friend and the chat opens right under it.',
      html: `<div class="ps-head">Reels</div>
        <div class="ps-reel"><div class="ps-reel-cap"><b>Street food, Old City</b><span>0:24</span></div>
          <div class="ps-reel-side"><i>${ic('i-heart')}</i><i class="on">${ic('i-send')}</i><i>${ic('i-chat')}</i></div></div>
        <div class="ps-yab">${ic('i-send')} Yab to Zara</div>`,
    },
    music: {
      desc: 'Find a song, send it, and listen together while you talk about it.',
      html: `<div class="ps-head">Music</div>
        <div class="ps-row"><span class="ps-art a1"></span><div><b>Monsoon Drive</b><small>Indie · 3:41</small></div><i>${ic('i-play')}</i></div>
        <div class="ps-row"><span class="ps-art a2"></span><div><b>Late Train</b><small>Lo-fi · 2:58</small></div><i>${ic('i-play')}</i></div>
        <div class="ps-row"><span class="ps-art a3"></span><div><b>Chai at 2am</b><small>Acoustic · 4:05</small></div><i>${ic('i-play')}</i></div>
        <div class="ps-yab">${ic('i-users')} Listen together</div>`,
    },
    news: {
      desc: 'World, tech, business and local headlines. Each one is a tap away from a conversation.',
      html: `<div class="ps-head">News</div>
        <div class="ps-chips"><span class="on">World</span><span>Tech</span><span>Business</span><span>Local</span></div>
        <div class="ps-card"><small>Tech</small><b>A headline worth a chat</b><span class="ps-talk">${ic('i-chat')} Talk about it</span></div>
        <div class="ps-card"><small>Local</small><b>Another one your group will have opinions on</b><span class="ps-talk">${ic('i-chat')} Talk about it</span></div>`,
    },
    connect: {
      desc: 'Chats sorted into friends and groups. Go from a message to an audio or video call, or press play and watch together.',
      html: `<div class="ps-head">Connect</div>
        <div class="ps-chips"><span class="on">Friends</span><span>Groups</span></div>
        <div class="ps-chat"><span class="ps-av">Z</span><div><b>Zara</b><small>sent you a reel</small></div><i>${ic('i-phone')}</i></div>
        <div class="ps-chat"><span class="ps-av g">W</span><div><b>Weekend crew</b><small>4 people · watching now</small></div><i>${ic('i-tv')}</i></div>
        <div class="ps-bubble">this is so us 😂</div>`,
    },
    wall: {
      desc: 'Pin a post to a friend’s Wall with a note. A scrapbook you build together.',
      html: `<div class="ps-head">Zara’s Wall</div>
        <div class="ps-wall"><div class="pin p1"><small>${ic('i-pin')} from you</small>that café 🍵</div><div class="pin p2"><small>${ic('i-pin')} from Omar</small>our song</div>
        <div class="pin p3"><small>${ic('i-pin')} from you</small>read this!</div><div class="pin p4"><small>${ic('i-pin')} from Lina</small>next trip?</div></div>`,
    },
  };
  const tabs = [...document.querySelectorAll('.tour-tabs [role=tab]')];
  const screen = document.getElementById('tourScreen'), desc = document.getElementById('tourDesc');
  const bar = [...document.querySelectorAll('.phone-bar span')];
  if (!screen) return;
  function show(t, focus) {
    tabs.forEach(b => { const on = b.dataset.t === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    bar.forEach(s => s.classList.toggle('on', s.dataset.t === t));
    screen.classList.remove('in'); void screen.offsetWidth;
    screen.innerHTML = SCREENS[t].html; desc.textContent = SCREENS[t].desc; screen.classList.add('in');
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => show(b.dataset.t));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (d) { e.preventDefault(); show(tabs[(i + d + tabs.length) % tabs.length].dataset.t, true); }
    });
  });
  bar.forEach(s => s.addEventListener('click', () => show(s.dataset.t)));
  show('reels');
})();
