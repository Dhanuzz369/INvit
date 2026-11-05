import { initEnvelope } from './envelope.js';
import { initRings, dropRings } from './rings.js';
import { initJourney } from './journey.js';
import { prepareProposal, initProposal, stopProposal } from './proposal.js';

// Calendar links point at the static assets/karan-swathi-engagement.ics
// (written from js/lib.js by `npm run build:ics`), so they work without JS.

const root = document.documentElement;

// Motion only when GSAP and its plugins loaded, and only if the early
// envelope layer (js-pending, set in <head>) has not already given up on us
// (data-pending-expired: a very slow CDN; switching on now would pull the
// page out from under a guest who is already reading). Otherwise the page
// stays static and readable. Either way js-pending is handed over: to
// js-anim, or back to the plain layout.
const { gsap, ScrollTrigger, MotionPathPlugin } = window;
const expired = root.hasAttribute('data-pending-expired');
if (gsap && ScrollTrigger && MotionPathPlugin && !expired) {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
  root.classList.add('js-anim');
}
root.classList.remove('js-pending');

// Simple reveals: rise 32px + fade, once (styles in css/styles.css).
// The hero's own reveals are sequenced with the ring drop in js/rings.js.
function initReveals() {
  const items = document.querySelectorAll('.reveal:not(#hero .reveal)');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      // Items arriving together (the detail rows, a fast scroll) come in one
      // by one, 0.12s apart, in document order.
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          entry.target.style.transitionDelay = i ? `${i * 0.12}s` : '';
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  items.forEach((el) => io.observe(el));
}

// If the motion layer throws, drop back to the static page: every detail
// readable, nothing locked, pinned or still ticking, and no inline state left
// behind by GSAP (names waiting at opacity 0, reveals mid rise, posed couple).
function fallBack(err) {
  console.error(err);
  try {
    stopProposal();
    ScrollTrigger.getAll().forEach((t) => t.kill(true)); // reverts pins
    gsap.globalTimeline.getChildren(true, true, true).forEach((t) => t.kill());
    const touched = document.querySelectorAll(
      '#hero-names > span, #tagline .w, .reveal, #ring-stage .ring, #ring-stage .ring > *,' +
        ' #couple-svg g[id], #proposal-yes, #envelope *'
    );
    // only what GSAP actually touched (el._gsap), so untouched SVG keeps its markup
    const cleared = [...touched].filter((el) => el._gsap);
    if (cleared.length) gsap.set(cleared, { clearProps: 'all' });
  } catch (cleanupErr) {
    console.error(cleanupErr);
  }
  root.classList.remove('js-anim', 'locked');
  document.querySelectorAll('[inert]').forEach((el) => { el.inert = false; });
  document.querySelectorAll('#hero-names > span').forEach((el) => { el.style.opacity = '1'; });
  const envelope = document.getElementById('envelope');
  if (envelope) envelope.style.display = 'none';
}

// No top level await (Safari 14 and older reject it): an async IIFE.
(async () => {
  const animated = root.classList.contains('js-anim');
  try {
    if (animated) initRings();
    await initEnvelope();
    if (animated) {
      dropRings();
      prepareProposal(); // before the journey: it reads the reduced motion hands rest
      initJourney();
      initProposal(); // after the journey: the pin starts where the journey ends
      initReveals();
    }
  } catch (err) {
    if (animated) fallBack(err);
    else console.error(err);
  }
})();
