/* =========================================================
   ASC Tax Solutions: scroll-linked "assembly" animations
   Reusable classes:
     .anim-hero     → content scales down + fades as you scroll past the hero
     .anim-pin      → section pins briefly; its .anim-piece children assemble (scrub: 1)
     .anim-piece    → a piece inside .anim-pin (optional data-from="left|right")
     .anim-stagger  → direct children enter one after another
     .anim-fade     → simple fade-up block
   Nav and footer are intentionally untouched.
   ========================================================= */

/* ---------- Mobile menu (works without GSAP) ---------- */
(function () {
  const btn = document.querySelector('.menu-btn');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;
  const setOpen = (open) => {
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
})();

/* ---------- Services accordion (first item open by default) ---------- */
(function () {
  const items = document.querySelectorAll('.service');
  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.service-head').setAttribute('aria-expanded', String(open));
    const panel = item.querySelector('.service-panel');
    if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
  };
  items.forEach((item) => {
    item.querySelector('.service-head').addEventListener('click', () => {
      // Each item toggles on its own: opening one never closes the others.
      setOpen(item, !item.classList.contains('is-open'));
    });
    // Page height changes when a panel opens/closes, so re-measure scroll triggers.
    item.querySelector('.service-panel').addEventListener('transitionend', (e) => {
      if (e.propertyName === 'grid-template-rows' && window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });
})();

/* ---------- "How it works" card: zoom to her face, glass panel starts exactly at her chin ---------- */
(function () {
  const cards = document.querySelectorAll('.feature-visual');
  function fit(card) {
    const img = card.querySelector('.feature-bg');
    const glass = card.querySelector('.glass-doc');
    if (!img || !glass) return;
    // Face landmarks as fractions of the photo (set on the <img> in index.html)
    const CHIN = parseFloat(img.dataset.chin) || 0.32;
    const HEAD = parseFloat(img.dataset.head) || 0.1;
    const FX = parseFloat(img.dataset.faceX) || 0.5;
    const nw = img.naturalWidth || 1600, nh = img.naturalHeight || 1066;
    card.classList.add('chin-fit');
    const W = card.clientWidth;
    const pb = parseFloat(getComputedStyle(card).paddingBottom) || 0;
    let top = Math.round(W * 0.42);
    for (let i = 0; i < 8; i++) {
      card.style.paddingTop = top + 'px';
      const H = Math.max(card.offsetHeight, top + glass.offsetHeight + pb);
      // Scale: big enough to cover the card, and big enough that head-to-chin
      // fills most of the space above the panel.
      const faceTarget = Math.min(W * 0.36, 300);
      const s = Math.max(W / nw, H / nh, faceTarget / ((CHIN - HEAD) * nh));
      const iw = nw * s, ih = nh * s;
      let y = Math.round(W * 0.05) - HEAD * ih;              // small gap above her hair
      y = Math.min(0, Math.max(H - ih, y));                    // keep the card covered
      let x = W / 2 - FX * iw;                                 // center her face
      x = Math.min(0, Math.max(W - iw, x));
      Object.assign(img.style, { width: iw + 'px', height: ih + 'px', left: x + 'px', top: y + 'px' });
      const next = Math.round(y + CHIN * ih);
      if (Math.abs(next - top) < 1) { top = next; break; }
      top = next;
    }
    card.style.paddingTop = top + 'px';
  }
  const fitAll = () => cards.forEach(fit);
  fitAll();
  window.addEventListener('resize', fitAll);
  window.addEventListener('load', fitAll);
  cards.forEach((c) => { const i = c.querySelector('.feature-bg'); if (i) i.addEventListener('load', fitAll); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
})();

/* ---------- Scroll animations ---------- */
(function () {
  // If the CDN fails, everything simply stays visible (hidden states are only set by JS).
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const offsetX = (el, amount) => {
    const from = el.dataset.from;
    return from === 'left' ? -amount : from === 'right' ? amount : 0;
  };

  // Shared: staggered grids + fades (desktop and mobile, lighter values on mobile)
  function setupStaggerAndFade(isMobile) {
    gsap.utils.toArray('.anim-stagger').forEach((grid) => {
      gsap.from(grid.children, {
        y: isMobile ? 24 : 40,
        autoAlpha: 0,
        duration: isMobile ? 0.6 : 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: grid, start: 'top 85%', once: true }
      });
    });

    gsap.utils.toArray('.anim-fade').forEach((el) => {
      gsap.from(el, {
        y: isMobile ? 20 : 40,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 769px) and (prefers-reduced-motion: no-preference)',
      mobile: '(max-width: 768px) and (prefers-reduced-motion: no-preference)'
    },
    (ctx) => {
      const { desktop } = ctx.conditions;

      /* 1. HERO: gently scale + fade out while scrolling away */
      gsap.utils.toArray('.anim-hero').forEach((hero) => {
        gsap.to(hero, {
          scale: desktop ? 0.92 : 0.97,
          autoAlpha: desktop ? 0.15 : 0.4,
          y: desktop ? -40 : -10,
          ease: 'none',
          scrollTrigger: {
            trigger: hero.closest('section') || hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        });
      });

      /* 2. SHOWCASE SECTIONS */
      gsap.utils.toArray('.anim-pin').forEach((section) => {
        const pieces = gsap.utils.toArray(section.querySelectorAll('.anim-piece'));
        if (!pieces.length) return;

        if (!desktop) {
          // Mobile: no pinning, just a light one-shot fade-up per piece.
          pieces.forEach((el) => {
            gsap.from(el, {
              y: 24,
              autoAlpha: 0,
              duration: 0.7,
              ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 88%', once: true }
            });
          });
          return;
        }

        // Desktop: pieces visible in the first screen assemble while the section is pinned;
        // pieces further down (tall sections) get their own scrubbed reveal.
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        const firstScreen = [];
        const below = [];
        pieces.forEach((el) => {
          const top = el.getBoundingClientRect().top + window.scrollY - sectionTop;
          (top < window.innerHeight * 0.85 ? firstScreen : below).push(el);
        });

        // Assembly starts as the section scrolls in and finishes while it is pinned,
        // so the pinned frame is never empty.
        ScrollTrigger.create({
          trigger: section,
          start: 'top 24px', // pin a little lower so the fixed navbar never covers the content
          end: '+=60%',
          pin: true,
          anticipatePin: 1
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: () => '+=' + (window.innerHeight * 0.85 + window.innerHeight * 0.4),
            scrub: 1
          }
        });

        firstScreen.forEach((el, i) => {
          tl.from(
            el,
            { y: 60, x: offsetX(el, 80), scale: 0.96, autoAlpha: 0, ease: 'power2.out', duration: 1 },
            i * 0.18
          );
        });

        below.forEach((el) => {
          gsap.from(el, {
            y: 60,
            x: offsetX(el, 60),
            scale: 0.96,
            autoAlpha: 0,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 60%', scrub: 1 }
          });
        });
      });

      /* 3. CARDS & GRIDS */
      setupStaggerAndFade(!desktop);
    }
  );

  // Recalculate positions once images and fonts have loaded.
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();

/* ---------- On-load entrance: soft blur-up reveal (Linear-style) ---------- */
(function () {
  const root = document.documentElement;
  const done = () => root.classList.remove('intro');
  if (!root.classList.contains('intro')) return;          // reduced motion: nothing to do
  if (!window.gsap) { done(); return; }                   // CDN failed: just show everything

  // Split the headline into words (keeps the yellow "the rest." span intact)
  const h1 = document.querySelector('.hero-copy h1');
  const words = [];
  if (h1) {
    const split = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'intro-word';
            w.textContent = part;
            words.push(w);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    };
    split(h1);
  }

  const chip = document.querySelector('.hero-copy .chip');
  const btns = document.querySelector('.hero-copy .btn-row');
  const nav = document.querySelector('.nav-card');
  const bg = document.querySelector('.hero-bg-img');
  const ease = 'expo.out';
  const hidden = { autoAlpha: 0, filter: 'blur(10px)' };

  const tl = gsap.timeline({ defaults: { ease }, onComplete: () => {
    gsap.set([nav, chip, btns, h1, ...words].filter(Boolean), { clearProps: 'filter,transform,willChange' });
  } });

  if (bg) tl.fromTo(bg, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 2.2, ease: 'power3.out' }, 0);
  if (nav) tl.fromTo(nav, { ...hidden, y: -14 }, { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 1.2 }, 0.15);
  if (chip) tl.fromTo(chip, { ...hidden, y: 16 }, { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 1.2 }, 0.3);
  if (h1) tl.set(h1, { autoAlpha: 1 }, 0.4);
  if (words.length) tl.fromTo(words, { ...hidden, y: 22 }, { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 1.3, stagger: 0.05 }, 0.4);
  if (btns) tl.fromTo(btns, { ...hidden, y: 18 }, { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 1.2 }, 0.4 + words.length * 0.05 + 0.1);

  done(); // starting states are now set inline by GSAP, so the CSS hide can go
})();
