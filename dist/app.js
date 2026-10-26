const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav?.addEventListener('click', event => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.querySelector('#ride-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = encodeURIComponent(`Glider ride request — ${data.get('date')}`);
  const body = encodeURIComponent([
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Preferred date: ${data.get('date')}`,
    `Alternate date: ${data.get('alternate') || 'Not specified'}`,
    `Ride: ${data.get('ride')}`,
    `Notes: ${data.get('notes') || 'None'}`
  ].join('\n'));
  document.querySelector('.form-status').textContent = 'Opening your email app with the request prepared…';
  window.location.href = `mailto:contact@flsc.org?subject=${subject}&body=${body}`;
});
document.querySelector('#year').textContent = new Date().getFullYear();
