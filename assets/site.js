(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* page colour follows whatever work is in the middle of the screen */
  const setTone = el => {
    if (!el.dataset.bg) return;
    root.style.setProperty('--page-bg', el.dataset.bg);
    root.style.setProperty('--page-ink', el.dataset.ink);
  };
  const io = new IntersectionObserver(entries => entries.forEach(en => en.isIntersecting && setTone(en.target)),
    { rootMargin: '-48% 0px -48% 0px' });
  document.querySelectorAll('[data-bg]').forEach(el => io.observe(el));

  /* captions: title first, details on request */
  document.querySelectorAll('.cap-t').forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', open);
    b.querySelector('.sr').textContent = open ? 'Hide details' : 'Show details';
  }));

  /* header slides away while scrolling down, returns on the way up */
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, h = document.querySelector('.site-head');
    if (!h.classList.contains('open')) h.classList.toggle('away', y > lastY && y > 120);
    h.classList.toggle('solid', y > innerHeight * 1.5);
    lastY = y;
  }, { passive: true });

  /* mobile menu */
  const head = document.querySelector('.site-head'), menu = document.querySelector('.menu-btn');
  menu.addEventListener('click', () => {
    const open = !head.classList.contains('open');
    head.classList.toggle('open', open); menu.setAttribute('aria-expanded', open);
    menu.textContent = open ? 'Close' : 'Menu';
  });
  head.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
    head.classList.remove('open'); menu.setAttribute('aria-expanded', false); menu.textContent = 'Menu';
  }));

  /* studio band drifts a little slower than the page */
  const studio = document.querySelector('.studio img');
  if (!reduce && studio) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const r = studio.parentElement.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        studio.style.transform = `translateY(${(p * -6).toFixed(2)}%) scale(1.04)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* lightbox */
  const lb = document.querySelector('.lb'), lbImg = lb.querySelector('img');
  const items = [...document.querySelectorAll('button.open[data-lb]')];
  let cur = 0;
  const show = i => {
    cur = (i + items.length) % items.length;
    const b = items[cur];
    lbImg.src = b.dataset.lb; lbImg.alt = b.dataset.title;
    const host = b.closest('[data-bg]');
    lb.style.setProperty('--lb-bg', host ? host.dataset.bg : '');
    lb.style.setProperty('--lb-ink', host ? host.dataset.ink : '');
    lb.classList.toggle('is-wall', !!b.closest('.st'));
    lb.querySelector('.lb-t').textContent = b.dataset.title;
    lb.querySelector('.lb-d').textContent = b.dataset.details;
  };
  items.forEach((b, i) => b.addEventListener('click', () => { show(i); lb.showModal(); lb.querySelector('.lb-img').focus(); }));
  lb.addEventListener('click', e => {
    const a = e.target.closest('[data-lb]')?.dataset.lb;
    if (a === 'prev') show(cur - 1); else if (a === 'next') show(cur + 1); else if (a === 'close' || e.target === lb) lb.close();
  });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
  let sx = null;
  lb.addEventListener('pointerdown', e => sx = e.clientX);
  lb.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) show(cur + (e.clientX < sx ? 1 : -1)); sx = null; });

  /* Stacks: vertical scroll walks the wall sideways */
  const st = document.querySelector('.stacks'), track = st && st.querySelector('.stacks-track');
  if (st) {
  const desk = matchMedia('(min-width: 761px)');
  let span = 0;
  const size = () => {
    if (!desk.matches) { st.style.height = ''; track.style.transform = ''; return; }
    span = Math.max(0, track.scrollWidth - innerWidth);
    st.style.height = (span + innerHeight) + 'px';
    pan();
  };
  const pan = () => {
    if (!desk.matches) return;
    const p = Math.min(1, Math.max(0, -st.getBoundingClientRect().top / Math.max(1, span)));
    track.style.transform = `translate3d(${(-p * span).toFixed(1)}px,0,0)`;
  };
  addEventListener('scroll', () => requestAnimationFrame(pan), { passive: true });
  addEventListener('resize', size);
  desk.addEventListener('change', size);
  addEventListener('load', size);
  size();
  }

  /* CV and other folded sections: same + / x as the captions */
  document.querySelectorAll('.fold-t').forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', open);
    document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
  }));

  /* contact forms write an email in the visitor's own mail app; nothing is sent from this page */
  const TO = 'franceshilaryhahn@gmail.com';
  document.querySelectorAll('form[data-mailto]').forEach(f => {
    const piece = new URLSearchParams(location.search).get('piece');
    if (piece && f.elements.piece) f.elements.piece.value = piece;
    f.addEventListener('submit', e => {
      e.preventDefault();
      const v = n => (f.elements[n] ? f.elements[n].value.trim() : '');
      let subject, body;
      if (f.dataset.mailto === 'previews') {
        subject = 'Collector previews';
        body = `Please add me to Collector Previews.\n\n${v('email')}`;
      } else {
        subject = v('piece') ? `Inquiry: ${v('piece')}` : 'Inquiry';
        body = `${v('message')}\n\n${v('name')}\n${v('email')}`;
      }
      location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const note = f.querySelector('.form-note');
      if (note) note.hidden = false;
    });
  });
})();
