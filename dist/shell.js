(() => {
  if (window.__flscShell) return;
  window.__flscShell = true;
  const enhancedStyles = document.createElement('link');
  enhancedStyles.rel = 'stylesheet'; enhancedStyles.href = 'enhancements.css';
  document.head.append(enhancedStyles);
  const brandAsset = 'assets/brand/flsc-mark.svg';
  document.querySelectorAll('.brand-mark').forEach(mark => {
    mark.replaceChildren(Object.assign(document.createElement('img'), { src: brandAsset, alt: '' }));
    mark.setAttribute('aria-hidden', 'true');
  });
  [
    ['icon', brandAsset, 'image/svg+xml'],
    ['icon', 'favicon.ico', 'image/x-icon'],
    ['apple-touch-icon', 'apple-touch-icon.png', 'image/png'],
    ['manifest', 'site.webmanifest', 'application/manifest+json']
  ].forEach(([rel, href, type]) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = rel; link.href = href; link.type = type;
    document.head.append(link);
  });
  const groups = [
    ['Explore', [['Home','index.html'],['Glider rides','rides.html'],['Learn to soar','learn.html'],['Fleet','fleet.html'],['Gallery','gallery.html'],['Visit & contact','contact.html']]],
    ['Club', [['Membership','membership.html'],['People','people.html'],['Club story','about.html'],['FAQs','faqs.html']]],
    ['Flight deck', [['Operations dashboard','dashboard.html'],['Field operations','operations.html'],['Weather & planning','dashboard.html#weather'],['Resource library','resources.html']]],
    ['Knowledge & control', [['Club wiki','https://github.com/akhammon/flsc-org/wiki'],['Member login','https://flsc.org/members/login.php'],['Member schedule','https://flsc.org/members/flying_sched.php']]]
  ];
  const header = document.querySelector('.site-header');
  if (header) {
    let toggle = header.querySelector('.menu-toggle');
    if (!toggle) { toggle = document.createElement('button'); toggle.className = 'menu-toggle'; header.append(toggle); }
    toggle.textContent = 'Menu';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'mobile-command-menu');
    toggle.setAttribute('aria-label', 'Open all-site menu');
    const overlay = document.createElement('button');
    overlay.className = 'mobile-command-overlay'; overlay.setAttribute('aria-label', 'Close menu');
    const drawer = document.createElement('aside');
    drawer.className = 'mobile-command'; drawer.id = 'mobile-command-menu'; drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `<div class="mobile-command-head"><div><span>FLSC</span><strong>All-site menu</strong></div><button class="mobile-command-close" aria-label="Close menu">×</button></div><div class="mobile-command-scroll">${groups.map(([title, links]) => `<section><h2>${title}</h2>${links.map(([label, href]) => `<a href="${href}">${label}<span>→</span></a>`).join('')}</section>`).join('')}<p class="mobile-command-note">Public pages explain and connect. Protected records and member actions stay in the secure member system.</p></div>`;
    document.body.append(overlay, drawer);
    const setMenu = open => {
      document.body.classList.toggle('menu-open', open); drawer.classList.toggle('open', open); overlay.classList.toggle('open', open);
      drawer.setAttribute('aria-hidden', String(!open)); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? 'Close' : 'Menu';
      if (open) drawer.querySelector('.mobile-command-close').focus();
    };
    let lastToggle = 0;
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      const now = Date.now();
      if (now - lastToggle < 350) return;
      lastToggle = now;
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    overlay.addEventListener('click', () => setMenu(false));
    drawer.querySelector('.mobile-command-close').addEventListener('click', () => setMenu(false));
    drawer.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  }
  const dock = document.createElement('nav');
  dock.className = 'mobile-dock'; dock.setAttribute('aria-label', 'Quick actions');
  dock.innerHTML = '<a href="index.html"><span>⌂</span>Home</a><a href="rides.html"><span>↗</span>Rides</a><a href="dashboard.html"><span>◫</span>Dashboard</a><button type="button"><span>☰</span>Menu</button>';
  document.body.append(dock);
  dock.querySelector('button').addEventListener('click', () => document.querySelector('.menu-toggle')?.click());
  document.querySelectorAll('#year').forEach(year => year.textContent = new Date().getFullYear());
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  const heroVideo = document.querySelector('.hero-video');
  const motionToggle = document.querySelector('.motion-toggle');
  if (heroVideo && motionToggle) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let userPaused = reducedMotion.matches;
    const syncMotionControl = () => {
      const paused = heroVideo.paused;
      motionToggle.innerHTML = paused ? '<span aria-hidden="true">▶</span> Play motion' : '<span aria-hidden="true">Ⅱ</span> Pause motion';
      motionToggle.setAttribute('aria-label', paused ? 'Play motion — hero montage' : 'Pause motion — hero montage');
      motionToggle.setAttribute('aria-pressed', String(paused));
    };
    const playVideo = () => heroVideo.play().catch(() => syncMotionControl());
    if (userPaused) heroVideo.pause(); else playVideo();
    motionToggle.addEventListener('click', () => {
      userPaused = !heroVideo.paused;
      if (heroVideo.paused) playVideo(); else heroVideo.pause();
      syncMotionControl();
    });
    heroVideo.addEventListener('play', syncMotionControl);
    heroVideo.addEventListener('pause', syncMotionControl);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) heroVideo.pause(); else if (!userPaused && !reducedMotion.matches) playVideo();
    });
    const heroObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) heroVideo.pause(); else if (!userPaused && !reducedMotion.matches) playVideo();
    }, { threshold: .12 });
    heroObserver.observe(document.querySelector('.hero'));
    syncMotionControl();
  }
  document.querySelectorAll('[data-email-form], #ride-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault(); const data = new FormData(form);
    const fields = [...data.entries()].filter(([, value]) => value).map(([key, value]) => `${key.replace(/[-_]/g,' ').replace(/^./, c => c.toUpperCase())}: ${value}`);
    const subject = encodeURIComponent(form.dataset.subject || `FLSC request — ${data.get('preferred-date') || data.get('date') || 'website'}`);
    form.querySelector('.form-status')?.replaceChildren('Opening your email app with the request prepared…');
    window.location.href = `mailto:contact@flsc.org?subject=${subject}&body=${encodeURIComponent(fields.join('\n'))}`;
  }));
  const lightbox = document.querySelector('#lightbox');
  document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    if (!lightbox) return; const image = button.querySelector('img');
    lightbox.querySelector('img').src = button.dataset.full || image.src; lightbox.querySelector('img').alt = image.alt;
    lightbox.querySelector('figcaption').textContent = button.dataset.caption || image.alt; lightbox.showModal();
  }));
  lightbox?.addEventListener('click', event => { if (event.target === lightbox || event.target.closest('.lightbox-close')) lightbox.close(); });
  const filters = document.querySelectorAll('[data-filter]');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('[data-category]').forEach(item => item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter);
  }));
})();
