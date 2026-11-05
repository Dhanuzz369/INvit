import { EASE_OUT, EASE_MOVE } from './lib.js';

// 7.1 The sealed invitation.
// Resolves once the letter has filled the screen (or at once when there is
// nothing to animate). While the envelope is shown the page is locked so the
// story starts at the same moment for everyone.
export function initEnvelope() {
  const root = document.documentElement;
  const section = document.getElementById('envelope');
  const button = document.getElementById('open-invite');
  const hero = document.getElementById('hero');
  const gsap = window.gsap;
  if (!section || !button) return Promise.resolve();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Static page (GSAP missing): the envelope is just the first screen and the
  // button scrolls on to the hero.
  // A tap (or Enter) on the envelope while the page was still loading
  // (html.js-pending) is remembered by the inline head script; honour it now.
  const early = root.hasAttribute('data-early-open');
  root.removeAttribute('data-early-open');

  if (!gsap || !root.classList.contains('js-anim')) {
    const toHero = () => hero?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    button.addEventListener('click', toHero);
    if (early) toHero();
    return Promise.resolve();
  }

  // Reduced motion, or a link straight to one part of the invitation
  // (…/#venue, see the inline head script): no envelope moment, show the
  // card directly.
  if (reduced || root.hasAttribute('data-skip-envelope')) {
    section.hidden = true;
    return Promise.resolve();
  }

  const envelope = section.querySelector('.envelope');
  const back = section.querySelector('.envelope__back');
  const pocket = section.querySelector('.envelope__pocket');
  const flap = document.getElementById('flap');
  const seal = document.getElementById('seal');
  const letter = document.getElementById('letter');
  const letterInner = letter.children;
  const hint = [section.querySelector('.envelope__label'), button];

  // Everything behind the envelope is out of reach until it opens: the
  // HTML siblings of the section and of each ancestor up to <body>, so
  // nothing outside <main> is reachable either. (The SVG layers at the top of
  // <body>, the sprite and the ring stage, are aria-hidden and hold nothing
  // focusable; scripts are skipped.)
  const behind = [];
  for (let el = section; el && el !== document.body; el = el.parentElement) {
    for (const sib of el.parentElement.children) {
      if (sib !== el && sib instanceof HTMLElement && !(sib instanceof HTMLScriptElement) && !sib.inert) {
        behind.push(sib);
      }
    }
  }
  const releaseScroll = () => {
    root.classList.remove('locked');
    behind.forEach((el) => { el.inert = false; });
  };
  root.classList.add('locked');
  behind.forEach((el) => { el.inert = true; });

  return new Promise((resolve, reject) => {
    let opened = false;
    let settled = false;

    // Anything going wrong while opening must never leave the page locked:
    // release the scroll, put the envelope away and reject, so js/main.js falls back to
    // the static page.
    const fail = (err) => {
      if (settled) return;
      settled = true;
      try {
        releaseScroll();
        section.hidden = true;
      } finally {
        reject(err);
      }
    };

    const open = () => {
      if (opened) return;
      opened = true;
      try {
        play();
      } catch (err) {
        fail(err);
      }
    };

    const play = () => {
      button.disabled = true;

      // Measure at rest so the letter lands exactly over the screen.
      const stage = section.getBoundingClientRect();
      const env = envelope.getBoundingClientRect();
      const card = letter.getBoundingClientRect();
      // Rise until the letter clears the pocket's side edges (8% down the envelope).
      const rise = card.bottom - (env.top + env.height * 0.08);
      const toX = stage.left + stage.width / 2 - (card.left + card.width / 2);
      const toY = stage.top + stage.height / 2 - (card.top + card.height / 2);
      const fill = Math.max(stage.width / card.width, stage.height / card.height) * 1.04;

      const finish = () => {
        if (settled) return;
        try {
          window.scrollTo(0, 0);
          releaseScroll();
          // Keep keyboard users in place: focus moves to the names, not the top of the body.
          const names = document.getElementById('hero-names');
          if (names) {
            names.tabIndex = -1;
            names.focus({ preventScroll: true });
          }
          settled = true;
          resolve();
        } catch (err) {
          fail(err);
        }
      };

      gsap.set([seal, flap, letter], { willChange: 'transform, opacity' });

      const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });
      tl
        // The hint steps aside
        .to(hint, { opacity: 0, y: 8, duration: 0.3 }, 0)
        // Seal lifts off the paper, then lets go
        .to(seal, { y: -6, scale: 1.08, duration: 0.18 }, 0)
        .to(seal, { y: -14, scale: 1.14, opacity: 0, duration: 0.24 }, 0.16)
        // Flap swings open and settles behind the letter once past upright
        .to(flap, { rotationX: 180, duration: 0.45, ease: EASE_MOVE }, 0.2)
        .set(flap, { zIndex: 1 }, 0.2 + 0.45 * 0.45)
        // Letter slides up out of the pocket
        .to(letter, { y: -rise, duration: 0.42, ease: EASE_MOVE }, 0.52)
        .set(letter, { zIndex: 6 }, 0.94)
        // and grows to become the page, while the envelope falls away
        .to(letter, { x: toX, y: toY, scale: fill, duration: 0.5, ease: EASE_MOVE }, 0.94)
        .to(letterInner, { opacity: 0, duration: 0.2 }, 0.94)
        .to([back, pocket, flap], { opacity: 0, duration: 0.3 }, 0.94)
        .add(finish, 1.44)
        // Paper colour gives way to the page underneath
        .set(section, { pointerEvents: 'none' }, 1.44)
        .to(section, { opacity: 0, duration: 0.4 }, 1.44)
        .add(() => {
          section.hidden = true;
          gsap.set([seal, flap, letter], { willChange: 'auto' });
        });
    };

    button.addEventListener('click', open);
    envelope.addEventListener('click', open);
    if (early) open();
  });
}
