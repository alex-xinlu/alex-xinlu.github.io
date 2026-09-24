(() => {
  'use strict';
  document.getElementById('year').textContent = new Date().getFullYear();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const elements = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
    elements.forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion');
    reduced.addEventListener('change', event => {
      if (event.matches) {
        document.documentElement.classList.remove('motion');
        observer.disconnect();
      }
    });
  }
  const sections = [...document.querySelectorAll('main section[id]')];
  const links = [...document.querySelectorAll('.nav-links a')];
  const progress = document.querySelector('.progress');
  let ticking = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0) + '%';
    let active = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top <= 170) active = section.id; });
    if (max > 0 && window.scrollY >= max - 3) active = 'contact';
    links.forEach(link => {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    ticking = false;
  }
  function scheduleUpdate() { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  updateScroll();
})();
