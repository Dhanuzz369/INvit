import { EASE_OUT, ringTransform } from './lib.js';

// 7.2 The rings. They live on #ring-stage, a fixed layer the size of the
// viewport whose viewBox matches it in CSS px, so a ring's x/y is simply its
// centre in viewport px.
//
// Each ring has two transform layers:
//   #ring-rose / #ring-gold   its place on the page (x, y, rotation). Owned by
//                             the scroll journey (js/journey.js), then the
//                             proposal (js/proposal.js). Written through
//                             ringSetter() as a plain transform attribute,
//                             never through GSAP (see ringSetter).
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

// Where the ring anchors sit in the document; a change means ring poses are stale.
const ANCHORS = ['ring-anchor-hero', 'ring-anchor-about', 'ring-anchor-details', 'ring-anchor-hands'];
// Document top of an anchor. Measured through its section's place in the flow
// (the pin spacer, when ScrollTrigger pins #proposal), so a pinned section
// does not read as "moved" at every scroll position.
// Exported as docRect(): { left, right, top, bottom, x (centre), cy } with the
// verticals in document coordinates, correct even mid pin (and mid refresh,
// when a pinned section may be fixed at the viewport top).
export function docRect(el) {
  const r = el.getBoundingClientRect();
  const section = el.closest('section');
  const flow = section?.parentElement?.classList.contains('pin-spacer') ? section.parentElement : section;
  const top = flow
    ? r.top - section.getBoundingClientRect().top + flow.getBoundingClientRect().top + window.scrollY
    : r.top + window.scrollY;
  return { left: r.left, right: r.right, top, bottom: top + r.height, x: r.left + r.width / 2, cy: top + r.height / 2 };
}
const docTop = (el) => docRect(el).top;
const anchorKey = () =>
  ANCHORS.map((id) => {
    const el = document.getElementById(id);
    return `${el.getBoundingClientRect().left.toFixed(1)},${docTop(el).toFixed(1)}`;
  }).join('|');
let measuredKey = '';
let refreshTimer = 0;

// Call whenever ring poses have just been measured (on every ScrollTrigger refresh).
export function markMeasured() {
  measuredKey = anchorKey();
}

// ScrollTrigger re-measures on width changes by itself, but ignores
// height-only resizes on touch devices and font swaps. Refresh (debounced
// 200ms) only when an anchor has actually moved since the last measurement,
// so the address bar showing or hiding (svh layout: anchors don't move)
// costs nothing.
export function refreshIfMoved() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    if (measuredKey && anchorKey() !== measuredKey) window.ScrollTrigger?.refresh();
  }, 200);
}

// Keep 1 stage unit = 1 CSS px as the viewport changes (rotation, URL bar).
function syncStage() {
  const svg = stage();
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return;
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  refreshIfMoved();
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

// The setter for a stage level ring group (#ring-rose, #ring-gold,
// #ring-link, #ring-sparkle), shared by every module that moves it:
// set({ x, y, rotation, scaleX, scaleY, scale, opacity }), any subset; the
// rest keep their last value. It writes the SVG transform attribute directly
// (and opacity as a style). GSAP's transform cache is kept out of these
// groups on purpose: after a ScrollTrigger refresh while scrolled it
// re-parsed them and drifted their origin, so the rings came back lopsided.
const setters = new WeakMap();
export function ringSetter(el) {
  let set = setters.get(el);
  if (set) return set;
  const s = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  let last = '';
  set = (v) => {
    if (v.scale !== undefined) s.scaleX = s.scaleY = v.scale;
    for (const k of ['x', 'y', 'rotation', 'scaleX', 'scaleY']) if (v[k] !== undefined) s[k] = v[k];
    const t = ringTransform(s);
    if (t !== last) {
      last = t;
      el.setAttribute('transform', t);
    }
    if (v.opacity !== undefined) el.style.opacity = v.opacity;
  };
  setters.set(el, set);
  return set;
}

// Prepare the stage and the hero before the envelope opens. Call once, early.
export function initRings() {
  const gsap = window.gsap;
  const { rose, gold } = rings();
  syncStage();
  if ('ResizeObserver' in window) new ResizeObserver(syncStage).observe(stage());
  else window.addEventListener('resize', syncStage);

  // Ring art is drawn around (0,0): the drop layers rotate about that point
  // (the outer layers are plain SVG transforms, see ringSetter).
  gsap.set([rose.firstElementChild, gold.firstElementChild], { svgOrigin: '0 0' });
  // Names wait for the rings.
  gsap.set('#hero-names > span', { opacity: 0 });
}

// Tagline (spec 7.6): each word goes from 30% to full opacity as it crosses
// 70% of the viewport, scrubbed so it follows the guest's scroll. One
// ScrollTrigger per word: a line's height of scroll is shared between its
// words in reading order, so line two starts as line one finishes.
export function revealTagline() {
  const gsap = window.gsap;
  const words = gsap.utils.toArray('#tagline .w');
  if (!words.length) return;
  if (reducedMotion()) {
    gsap.set(words, { opacity: 1 });
    return;
  }
  // This word's slice of its line, in px of scroll: [offset, offset + step]
  const slice = (w) => {
    const line = words.filter((o) => Math.abs(o.offsetTop - w.offsetTop) < 4);
    const step = w.offsetHeight / line.length;
    return { from: line.indexOf(w) * step, to: (line.indexOf(w) + 1) * step };
  };
  words.forEach((w) => {
    gsap.fromTo(
      w,
      { opacity: 0.3 },
      {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: w,
          start: () => `top+=${slice(w).from} 70%`,
          end: () => `top+=${slice(w).to} 70%`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
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
