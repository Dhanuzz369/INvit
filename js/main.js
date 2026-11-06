import { initEnvelope } from './envelope.js';
import { initRings, dropRings, refreshIfMoved } from './rings.js';
import { initJourney } from './journey.js';
import { prepareProposal, initProposal, stopProposal } from './proposal.js';
import { initLive } from './live.js';

// Calendar links point at the static assets/karan-soumya-engagement.ics
// (written from js/lib.js by `npm run build:ics`), so they work without JS.

const root = document.documentElement;

// The guest's name, the countdown and the hosts' link tool come first and
// do not depend on the motion layer (js/live.js).
initLive();

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

// Reveals: each part of a section rises 24px and fades in, once, as it
// enters (styles in css/styles.css). The hero's own reveals are sequenced with
// the ring drop in js/rings.js. The back of the card waits under the page
// (the curtain footer), so it is always "in view": its parts come in when the
// end of the page itself arrives.
const STAGGER = 0.08; // s between parts arriving together
function initReveals() {
  const items = [...document.querySelectorAll('.reveal:not(#hero .reveal):not(.closing .reveal)')];
  const closingItems = [...document.querySelectorAll('.closing .reveal')];
  const show = (list) =>
    list
      .filter((el) => !el.classList.contains('is-in'))
      .forEach((el, i) => {
        // a long batch (a jump down the page) never keeps the last part waiting
        el.style.transitionDelay = i ? `${Math.min(i, 5) * STAGGER}s` : '';
        el.classList.add('is-in');
      });
  if (!('IntersectionObserver' in window)) {
    show([...items, ...closingItems]);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      // Parts arriving together (the programme rows, a fast scroll) come in
      // one by one, in document order.
      const arriving = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
      arriving.forEach((el) => io.unobserve(el));
      show(arriving);
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  items.forEach((el) => io.observe(el));

  // Where the back of the card is a curtain (the same query as in the
  // stylesheet) it lies under the page from the start, so it is "in view" all
  // along: its parts come in only once the page has slid almost all the way
  // off it (a marker after it, at the very end of the document). Elsewhere it
  // is ordinary page and its parts come in like any other.
  const curtain = window.matchMedia('(min-height: 40rem) and (min-width: 48rem)').matches;
  if (!curtain) closingItems.forEach((el) => io.observe(el));

  const marker = (parent) => {
    const m = document.createElement('span');
    m.className = 'reveal-end';
    m.setAttribute('aria-hidden', 'true');
    parent.appendChild(m);
    return m;
  };
  // The end of the page content in view: the last lines (too close to the
  // bottom to pass the 10% margin above) come in, one after another.
  const main = document.querySelector('main');
  if (main) {
    const atEnd = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      atEnd.disconnect();
      items.forEach((el) => io.unobserve(el));
      show(items);
    });
    atEnd.observe(marker(main));
  }
  if (curtain && closingItems.length) {
    const atBottom = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        atBottom.disconnect();
        show(closingItems);
      },
      { rootMargin: '0px 0px 12% 0px' }
    );
    atBottom.observe(marker(document.body));
  }
}

// Opening or closing a programme row moves everything below it, the proposal
// pin included: re-measure the ring journey once it has settled.
function watchRows() {
  document.querySelectorAll('#details details').forEach((row) => row.addEventListener('toggle', refreshIfMoved));
}

// If the motion layer throws, drop back to the static page: every detail
// readable, nothing locked, pinned or still ticking, and no inline state left
// behind by GSAP (names waiting at opacity 0, reveals mid rise); the portrait
// back at its own size and the visit card in its place (stopProposal).
function fallBack(err) {
  console.error(err);
  try {
    stopProposal();
    ScrollTrigger.getAll().forEach((t) => t.kill(true)); // reverts pins
    gsap.globalTimeline.getChildren(true, true, true).forEach((t) => t.kill());
    const touched = document.querySelectorAll(
      '#hero-names > span, #tagline .w, .reveal, #ring-stage .ring, #ring-stage .ring > *,' +
        ' #proposal-yes, #envelope *'
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
      watchRows();
    }
  } catch (err) {
    if (animated) fallBack(err);
    else console.error(err);
  }
})();
