/* ==========================================================================
   Dra. Silvia Chagas — script.js (Vanilla JS, sem dependências)
   ========================================================================== */
(() => {
  'use strict';

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------------------------------------------------------------------
     1. WHATSAPP — número e mensagem únicos para todo o site.
     A mensagem NÃO deve ser alterada (nem receber UTMs).
     --------------------------------------------------------------------- */
  const WA_NUMBER = '5571999090838';
  const WA_MESSAGE = 'Olá! Vim do site e quero mais informações.';
  const WA_URL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

  $$('[data-cta="whatsapp"]').forEach((a) => {
    a.href = WA_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });

  /* ---------------------------------------------------------------------
     2. ORIGEM DO LEAD — UTMs persistidas durante a sessão
     --------------------------------------------------------------------- */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const UTM_STORAGE = 'dsc_utm';

  const getUtms = () => {
    let stored = {};
    try { stored = JSON.parse(sessionStorage.getItem(UTM_STORAGE)) || {}; } catch (e) { /* storage indisponível */ }
    const params = new URLSearchParams(window.location.search);
    const fresh = {};
    UTM_KEYS.forEach((k) => { const v = params.get(k); if (v) fresh[k] = v; });
    if (Object.keys(fresh).length) {
      stored = fresh; // nova campanha substitui a anterior
      try { sessionStorage.setItem(UTM_STORAGE, JSON.stringify(stored)); } catch (e) { /* noop */ }
    }
    return stored;
  };
  const utms = getUtms();

  window.dataLayer = window.dataLayer || [];

  /* Ponto de integração futura com CRM.
     Quando houver um endpoint definido, enviar `payload` aqui
     (ex.: navigator.sendBeacon(URL_DO_CRM, JSON.stringify(payload))).
     Nenhum endpoint é chamado atualmente. */
  const sendLeadToCRM = (payload) => { void payload; };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-cta]');
    if (!el) return;
    const type = el.dataset.cta;
    const payload = {
      event: type === 'whatsapp' ? 'whatsapp_click' : `${type}_click`,
      cta_origin: el.dataset.origin || 'indefinido',
      cta_label: el.dataset.label || el.textContent.replace(/\s+/g, ' ').trim(),
      page_path: window.location.pathname,
      ...utms
    };
    window.dataLayer.push(payload);
    if (type === 'whatsapp') sendLeadToCRM(payload);
  });

  /* ---------------------------------------------------------------------
     3. IMAGENS — placeholder elegante até a foto real existir em /assets
     --------------------------------------------------------------------- */
  $$('.media').forEach((fig) => {
    const img = $('img', fig);
    if (!img) return;
    const ok = () => fig.classList.add('is-loaded');
    const fail = () => fig.classList.add('is-empty');
    if (img.complete) { img.naturalWidth ? ok() : fail(); }
    else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', fail, { once: true }); }
  });

  /* ---------------------------------------------------------------------
     4. HEADER, MENU E NAVEGAÇÃO
     --------------------------------------------------------------------- */
  const header = $('#header');
  const burger = $('.burger');
  const mmenu = $('#menu-mobile');

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mmenu.classList.toggle('is-open', open);
    mmenu.setAttribute('aria-hidden', String(!open));
    doc.style.overflow = open ? 'hidden' : '';
    if (open) header.classList.add('is-scrolled'); else onScroll();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  mmenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (mmenu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    closeSub();
  });

  const subToggle = $('.nav__subtoggle');
  const submenu = $('#submenu-tratamentos');
  const closeSub = () => { subToggle.setAttribute('aria-expanded', 'false'); submenu.classList.remove('is-open'); };
  subToggle.addEventListener('click', () => {
    const open = subToggle.getAttribute('aria-expanded') !== 'true';
    subToggle.setAttribute('aria-expanded', String(open));
    submenu.classList.toggle('is-open', open);
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav__item--sub')) closeSub(); });
  submenu.addEventListener('click', (e) => { if (e.target.closest('a')) { closeSub(); e.target.closest('a').blur(); } });

  // Estado do header + visibilidade do botão flutuante
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (!mmenu.classList.contains('is-open')) header.classList.toggle('is-scrolled', y > 24);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); runParallax(); }); } }, { passive: true });

  // Link ativo conforme a seção visível
  const navLinks = $$('.nav__link');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-section]').forEach((s) => sectionObs.observe(s));

  /* ---------------------------------------------------------------------
     5. REVEAL, CURVAS E PARALLAX
     --------------------------------------------------------------------- */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      obs.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('[data-reveal]').forEach((el) => revealObs.observe(el));

  const drawObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-drawn'); obs.unobserve(en.target); } });
  }, { threshold: 0.15 });
  $$('.draw').forEach((p) => drawObs.observe(p));

  const parallaxEls = reduceMotion ? [] : $$('[data-parallax]');
  const inView = new Set();
  if (parallaxEls.length) {
    const pObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? inView.add(en.target) : inView.delete(en.target)));
      requestAnimationFrame(runParallax); // evita reflow forçado dentro do callback do observer
    }, { rootMargin: '10% 0px' });
    parallaxEls.forEach((el) => pObs.observe(el));
  }
  function runParallax() {
    if (!inView.size || window.innerWidth < 760) return;
    const vh = window.innerHeight;
    inView.forEach((el) => {
      const r = el.getBoundingClientRect();
      const delta = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
      el.style.translate = `0 ${delta.toFixed(1)}px`;
    });
  }

  /* ---------------------------------------------------------------------
     6. NECESSIDADES — painel muda conforme hover/foco
     --------------------------------------------------------------------- */
  const needs = $('[data-needs]');
  if (needs) {
    const items = $$('.need', needs);
    const panels = $$('[data-panel]');
    const num = $('[data-panel-num]');
    const activate = (el) => {
      const k = el.dataset.key;
      items.forEach((i) => i.classList.toggle('is-active', i === el));
      panels.forEach((p) => p.classList.toggle('is-shown', p.dataset.panel === k));
      if (num) num.textContent = String(+k + 1).padStart(2, '0');
    };
    needs.addEventListener('mouseover', (e) => { const el = e.target.closest('.need'); if (el) activate(el); });
    needs.addEventListener('focusin', (e) => { const el = e.target.closest('.need'); if (el) activate(el); });
  }

  /* ---------------------------------------------------------------------
     7. FAQ — accordion acessível
     --------------------------------------------------------------------- */
  const acc = $('[data-accordion]');
  if (acc) {
    acc.addEventListener('click', (e) => {
      const btn = e.target.closest('.acc__btn');
      if (!btn) return;
      const item = btn.closest('.acc');
      const open = btn.getAttribute('aria-expanded') !== 'true';
      $$('.acc', acc).forEach((other) => {
        if (other !== item) { other.classList.remove('is-open'); $('.acc__btn', other).setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------------------------------------------------------------------
     8. CASOS — antes/depois (mouse, touch e teclado via input range)
     --------------------------------------------------------------------- */
  const cases = $('[data-cases]');
  if (cases) {
    $$('.ba', cases).forEach((ba) => {
      const range = $('.ba__range', ba);
      const set = (v) => ba.style.setProperty('--pos', `${v}%`);
      range.addEventListener('input', () => set(range.value));
      range.addEventListener('pointerdown', () => ba.classList.add('is-dragging'));
      ['pointerup', 'pointercancel', 'blur'].forEach((ev) => range.addEventListener(ev, () => ba.classList.remove('is-dragging')));

      // Arraste horizontal em touch sem bloquear o scroll vertical da página
      let startX = null, startY = null, dragging = false;
      ba.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; dragging = false; }, { passive: true });
      ba.addEventListener('touchmove', (e) => {
        if (startX === null) return;
        const t = e.touches[0];
        if (!dragging && Math.abs(t.clientX - startX) > Math.abs(t.clientY - startY) + 4) dragging = true;
        if (dragging) {
          const r = ba.getBoundingClientRect();
          const v = Math.min(100, Math.max(0, ((t.clientX - r.left) / r.width) * 100));
          range.value = v; set(v);
        }
      }, { passive: true });
      ba.addEventListener('touchend', () => { startX = null; dragging = false; }, { passive: true });
    });
  }

  onScroll();
})();
