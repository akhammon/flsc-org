document.querySelector('#year')?.replaceChildren(String(new Date().getFullYear()));
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
}), { threshold: .08 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
