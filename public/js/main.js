// TaiLand Cafe — Main JS v2

// ── Mobile nav toggle ──
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  // Close on outside click
  document.addEventListener('click', e => {
    if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !navToggle.contains(e.target)) {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

// ── Scroll reveal ──
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
  document.querySelectorAll('.sr').forEach(el => observer.observe(el));
} else {
  // Fallback: show all immediately
  document.querySelectorAll('.sr').forEach(el => el.classList.add('visible'));
}

// ── Sticky nav shadow on scroll ──
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 8
      ? '0 2px 20px rgba(28,28,28,0.08)'
      : 'none';
  }, { passive: true });
}

// ── Auto-dismiss flash messages ──
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity .4s ease, transform .4s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 400);
  }, 4500);
});

// ── Menu category filter ──
const catBtns = document.querySelectorAll('.menu-cat-btn');
if (catBtns.length) {
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      const url = new URL(window.location.href);
      if (cat === 'all') url.searchParams.delete('cat');
      else url.searchParams.set('cat', cat);
      window.location.href = url.toString();
    });
  });
}

// ── Booking: date min = today ──
const dateInput = document.getElementById('bookingDate');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
