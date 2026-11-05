import { EVENT, buildIcs } from './lib.js';
import { initEnvelope } from './envelope.js';
import { initRings, dropRings } from './rings.js';

// Calendar links: an .ics file generated in the page from confirmed facts only.
const icsHref = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(buildIcs(EVENT));
document.querySelectorAll('#add-calendar, [data-ics]').forEach((link) => {
  link.href = icsHref;
});

// Motion only when GSAP loaded; otherwise the page stays static and readable.
const { gsap, ScrollTrigger, MotionPathPlugin } = window;
if (gsap) {
  gsap.registerPlugin(...[ScrollTrigger, MotionPathPlugin].filter(Boolean));
  document.documentElement.classList.add('js-anim');
}

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
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  items.forEach((el) => io.observe(el));
}

const animated = document.documentElement.classList.contains('js-anim');
if (animated) initRings();
await initEnvelope();
if (animated) {
  dropRings();
  initReveals();
}
