import { EASE_OUT } from './lib.js';

// 7.2 The rings. They live on #ring-stage, a fixed layer the size of the
// viewport whose viewBox matches it in CSS px, so a ring's x/y is simply its
// centre in viewport px.
//
// Each ring has two transform layers:
//   #ring-rose / #ring-gold   its place on the page (x, y, rotation). Owned by
//                             whatever is driving the journey: followHero()
//                             for now, Task 5's scroll story later.
//   .ring__drop (inner)       the entrance only. Starts above the screen and
//                             settles to identity, so it never fights the
//                             outer layer.

export const RING_RADIUS = 34;

// Hero composition, relative to the centre of #ring-anchor-hero
const HERO_SPREAD = 40; // each ring's distance from the centre line (68px rings, 12px apart)
const HERO_TILT = 8; // leaning in towards each other
const HERO_LIFT = 9; // the solitaire rises ~18px above the band; centre the pair optically

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const stage = () => document.getElementById('ring-stage');
const rings = () => ({
  rose: document.getElementById('ring-rose'),
  gold: document.getElementById('ring-gold'),
});

// Centre of an element in viewport coordinates (= stage coordinates).
export function anchorCenter(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Keep 1 stage unit = 1 CSS px as the viewport changes (rotation, URL bar).
function syncStage() {
  const svg = stage();
  const r = svg.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${Math.round(r.width)} ${Math.round(r.height)}`);
}

// Where a ring rests in the hero, in DOCUMENT coordinates (as if scrolled to
// the top): { x, y, rotation }. which: 'rose' | 'gold'.
export function heroPose(which) {
  const c = anchorCenter(document.getElementById('ring-anchor-hero'));
  const side = which === 'rose' ? -1 : 1;
  return {
    x: c.x + side * HERO_SPREAD,
    y: c.y + window.scrollY + HERO_LIFT,
    rotation: -side * HERO_TILT,
  };
}

// Prepare the stage and the hero before the envelope opens. Call once, early.
export function initRings() {
  const gsap = window.gsap;
  const { rose, gold } = rings();
  syncStage();
  if ('ResizeObserver' in window) new ResizeObserver(syncStage).observe(stage());
  else window.addEventListener('resize', syncStage);

  // Ring art is drawn around (0,0): rotate both layers about that point.
  gsap.set([rose, gold, rose.firstElementChild, gold.firstElementChild], { svgOrigin: '0 0' });
  // Names wait for the rings.
  gsap.set('#hero-names > span', { opacity: 0 });

  // Late font swap moves the hero; let ScrollTrigger re-measure the anchors.
  document.fonts?.ready.then(() => window.ScrollTrigger?.refresh());
}

// Places the rings at the hero anchor and keeps them there as the hero scrolls
// away (the stage is fixed, so y has to follow the page). Scrubbed 1:1 with
// scroll from 0 to the bottom of the hero; re-measured on refresh.
// Task 5 replaces this with the full journey: kill the returned timeline and
// drive the same outer groups from heroPose() onwards.
export function followHero() {
  const gsap = window.gsap;
  const hero = document.getElementById('hero');
  const end = () => hero.offsetTop + hero.offsetHeight;
  const tl = gsap.timeline({
    scrollTrigger: { start: 0, end, scrub: true, invalidateOnRefresh: true },
  });
  for (const [which, el] of Object.entries(rings())) {
    const pose = () => heroPose(which);
    tl.fromTo(
      el,
      { x: () => pose().x, y: () => pose().y, rotation: () => pose().rotation },
      { x: () => pose().x, y: () => pose().y - end(), rotation: () => pose().rotation, ease: 'none' },
      0
    );
  }
  return tl;
}

// Tagline (spec 7.6): each word goes from 30% to full opacity as the line
// crosses 70% of the viewport, scrubbed so it follows the guest's scroll.
export function revealTagline() {
  const gsap = window.gsap;
  const words = gsap.utils.toArray('#tagline .w');
  if (!words.length) return;
  if (reducedMotion()) {
    gsap.set(words, { opacity: 1 });
    return;
  }
  gsap.fromTo(
    words,
    { opacity: 0.3 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.5,
      scrollTrigger: { trigger: '#tagline', start: 'top 70%', end: 'bottom 45%', scrub: true },
    }
  );
}

// The hero entrance: rings fall in and land with a soft bounce, the names
// rise in beneath them, then the rest of the hero and the tagline.
export function dropRings() {
  const gsap = window.gsap;
  const { rose, gold } = rings();
  const drops = [rose.firstElementChild, gold.firstElementChild];
  const glint = rose.querySelector('.ring__glint');
  const names = gsap.utils.toArray('#hero-names > span');
  const heroReveals = gsap.utils.toArray('#hero .reveal');
  const [label, ...rest] = heroReveals;
  const showIn = (els) => () => els.forEach((el) => el.classList.add('is-in'));

  followHero();

  // Reduced motion: everything in its final place, opacity only.
  if (reducedMotion()) {
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: EASE_OUT } });
    tl.fromTo([rose, gold], { opacity: 0 }, { opacity: 1 }, 0)
      .to(names, { opacity: 1 }, 0)
      .add(showIn(heroReveals), 0)
      .add(revealTagline, 0);
    return tl;
  }

  // The envelope finishes fading ~0.4s after it resolves; land after that.
  const tl = gsap.timeline({ delay: 0.4 });
  const fall = -0.6 * window.innerHeight;

  tl.set([rose, gold], { opacity: 1 }, 0)
    .fromTo(
      drops,
      { y: fall, rotation: (i) => (i ? 14 : -14) },
      { y: 0, rotation: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.15 },
      0
    )
    // back.out overshoots ~9% of the fall below the rest point; the label and
    // names wait until that has nearly returned (their 32px/24px rise keeps
    // them clear of it).
    .add(showIn([label]), 1.0)
    .fromTo(
      names,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.9, ease: EASE_OUT, stagger: 0.12 },
      1.05
    )
    // A glint off the stone once it has settled
    .fromTo(
      glint,
      { opacity: 0, scale: 0.2, rotation: -30, transformOrigin: '50% 50%' },
      { opacity: 1, scale: 1, rotation: 15, duration: 0.32, ease: EASE_OUT },
      1.15
    )
    .to(glint, { opacity: 0, scale: 0.4, rotation: 45, duration: 0.4, ease: EASE_OUT }, 1.47)
    .add(revealTagline, 1.4);
  // are getting engaged, divider, date: the usual 700ms rise, 0.12s apart
  rest.forEach((el, i) => tl.add(showIn([el]), 1.4 + i * 0.12));
  return tl;
}
