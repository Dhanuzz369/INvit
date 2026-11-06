import { RING_RADIUS, ringSetter } from './rings.js';
import {
  getHandsStagePose, getJourneyEnd, getVirtualScroll, handOffRings, redrawJourney, setHandsRest, setPinLength,
} from './journey.js';
import {
  segmentT, EASE_MOVE, EASE_OUT, ringOwner, collapsePin, fitPoint, objectPositionFractions,
} from './lib.js';
import { createBurst } from './burst.js';

// 7.5 The proposal, on the couple's own portrait. #proposal pins the moment
// the ring journey ends (its top at the viewport top, the linked pair resting
// on the bouquet at #ring-anchor-hands) and one scrubbed timeline plays:
//
//   a slow, small push-in on the portrait (anchored high, so both heads stay
//   inside the frame)  ->  the pair settles and parts (her ring lifts above
//   her hand; his band drifts to Karan's side and fades, tucked away)  ->  her
//   ring glides down onto her ring finger, shrinking to finger size  ->  a
//   glint, then a soft shimmer that stays, and red rose petals burst from her
//   hand across the whole screen (js/burst.js, time based)  ->  "She said
//   yes" appears (no title before)  ->  the visit card (#venue) is laid over the portrait: over its right side on wide
//   screens, over its foot elsewhere (there mostly below the fold until the
//   pin lets go, then fully in view as the page moves on).
//
// There is ONE lagged clock: the journey's master timeline runs on through
// the pin (virtual scroll, scrubbed 0.8). Progress here is that clock's
// position inside the pin, and ringOwner() hands the rings over at the same
// lagged moment in both directions, so fast flicks never snap. Every beat is a
// function of progress, so it all scrubs backwards exactly. Layout is read
// only in measure() (every ScrollTrigger refresh); a frame is fitPoint()
// arithmetic plus cached writes.

const PIN_VH = 3; // pinned for 3 viewports of scroll
const pinLength = () => Math.round(PIN_VH * window.innerHeight);

// Beats, as fractions of the pinned scroll
const B = {
  settle: [0, 0.08], // the linked pair settles on the bouquet, a little smaller
  zoom: [0, 0.72], // the slow push-in on the portrait
  separate: [0.1, 0.3], // the rings part: hers lifts above her hand, his drifts to Karan
  goldFade: [0.18, 0.34], // ... and fades there, tucked away
  travel: [0.3, 0.5], // her ring glides down onto her finger
  glint: [0.48, 0.58], // then a slow shimmer stays on the stone through the hold
  burst: [0.49, 0.36], // the rose burst fires crossing 0.49 forwards; re-armed below 0.36
  yes: [0.56, 0.66], // "She said yes" rises in
  venue: [0.74, 0.88], // the visit card is laid over the portrait
};
const SHIMMER = 2.6; // seconds per shimmer on the stone during the hold
const ZOOM = 0.04; // the push-in: scale 1 -> 1.04 about the portrait's transform-origin (54% 28%)

// The portrait, in its own pixels (assets/karan-sowmya-portrait.*, 1024 x 1536)
const NATURAL = { width: 1024, height: 1536 };
const FINGER = { x: 568, y: 1426 }; // her ring finger, nearest Karan, where a gold ring already sits
const FINGER_R = 15; // the solitaire's outer radius on her finger (picture px): just covers her own band
const FINGER_TILT = -15; // the finger points left and a little down: the band stands across it
const SQUASH = 0.55; // seen side on, the band is a narrow ellipse
const HOVER = { x: 556, y: 1262 }; // hers waits here, above her hand, before it slides on
const HOVER_R = 30;
const GOLD_TO = { x: 800, y: 1452 }; // his band drifts to Karan's side (his hand, by his watch)
const GOLD_R = 16;
const SETTLE = 0.8; // the linked pair shrinks this much as it settles on the bouquet
const LIFT = 22; // picture px: her ring rises in a small arc as they part
const BOW = 14; // picture px: the glide down bows a little toward Karan

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPt = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const ease = (beat, p, fn = EASE_MOVE) => fn(segmentT(p, beat[0], beat[1]));
const smooth = (t) => t * t * (3 - 2 * t);
const zoomAt = (p) => 1 + ZOOM * smooth(segmentT(p, B.zoom[0], B.zoom[1]));

const $ = (id) => document.getElementById(id);
const parts = () => {
  const img = $('portrait');
  return { section: $('proposal'), img, frame: img?.closest('.portrait__frame'), visit: $('venue') };
};

// Call before initJourney(): the journey's clock runs on through the pin, or,
// under reduced motion, it learns to rest her ring on her finger instead of
// at the bouquet.
export function prepareProposal() {
  const { img, frame } = parts();
  if (!window.gsap || !img || !frame) return;
  if (!reducedMotion()) {
    setPinLength(pinLength);
    return;
  }
  setHandsRest(() => {
    // no pin and no push-in under reduced motion: the frame's place in the document
    const f = frame.getBoundingClientRect();
    const box = { left: f.left, top: f.top + window.scrollY, width: f.width, height: f.height };
    const cs = getComputedStyle(img);
    const pt = fitPoint(FINGER, NATURAL, box, objectPositionFractions(cs.objectPosition), undefined, cs.objectFit);
    const s = (pt.scale * FINGER_R) / RING_RADIUS;
    return { rose: { x: pt.x, y: pt.y, rotation: FINGER_TILT, scaleX: s * SQUASH, scaleY: s } };
  });
}

// --- The three beats ----------------------------------------------------------

// Which beat is playing at progress p: "The roses" while the rings arrive,
// "The ring" from the glide onto her finger, "The yes" once "She said yes" shows.
export function beatAt(p) {
  if (p < B.travel[0]) return 0;
  return p < B.yes[0] ? 1 : 2;
}

function showBeat(list, i) {
  list.forEach((el, j) => el.classList.toggle('is-on', j === i));
}

// --- The scene ---------------------------------------------------------------

// Stops the scene for good (js/main.js calls it when the motion layer falls
// back to the static page): leaves the ticker, stops observing, removes the
// rose burst, and puts the portrait and the visit card back as the page has them.
let stopScene = null;
export function stopProposal() {
  stopScene?.();
  stopScene = null;
  const { img, visit } = parts();
  if (img) img.style.transform = '';
  if (visit) {
    visit.style.opacity = '';
    visit.style.transform = '';
    visit.style.pointerEvents = '';
  }
  const beats = [...document.querySelectorAll('#proposal .beat')];
  showBeat(beats, beats.length - 1); // the static portrait: the answer
}

export function initProposal() {
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const { section, img, frame, visit } = parts();
  // "She said yes" stays in the accessibility tree even while it is
  // invisible (no aria-hidden toggling): a screen reader reading straight
  // through never scrubs the pin, so hiding it would mean never hearing it.
  const yes = $('proposal-yes');
  // The three beats beside the portrait: the one playing carries the diamond.
  const beats = [...(section?.querySelectorAll('.beat') || [])];
  if (!gsap || !ST || !section || !img || !frame || !visit || !yes) return;

  if (reducedMotion()) {
    // Static finale: the ring is on her finger (placed by the journey's hands
    // rest), "She said yes", the visit card in its place. No pin, no push-in.
    gsap.set(yes, { opacity: 1 });
    showBeat(beats, beats.length - 1);
    return;
  }

  const burst = createBurst(gsap);
  let armed = true; // the burst fires once per crossing of the landing
  showBeat(beats, 0);

  const rose = $('ring-rose');
  const gold = $('ring-gold');
  const link = $('ring-link');
  const spark = $('ring-sparkle');
  // stage level ring groups: plain SVG transforms, never GSAP's cache (rings.js)
  const setRose = ringSetter(rose);
  const setGold = ringSetter(gold);
  const setLink = ringSetter(link);
  const setSpark = ringSetter(spark);
  const setYes = gsap.quickSetter(yes, 'css');
  let beat = 0;

  let geo = null;
  let owned = false;
  let lastScene = -1;
  let lastRings = '';
  let lastZoom = -1;
  let lastVenue = -2;
  // the per frame loop's state (see wake() below)
  let near = true;
  let running = false;
  let lastV = NaN;
  let lastScroll = NaN;

  // Layout reads: the portrait's frame relative to #proposal's top (which
  // sits at the viewport top for the whole pin), how the picture fills it,
  // the push-in's origin, the journey's arrival pose, where the visit card
  // sits, and whether it is laid over the portrait's side (--venue-over: 1,
  // wide screens) or over its foot.
  function measure() {
    const f = frame.getBoundingClientRect();
    const sec = section.getBoundingClientRect();
    const moved = visit.style.transform;
    visit.style.transform = '';
    const visitTop = visit.getBoundingClientRect().top - sec.top;
    visit.style.transform = moved;
    const cs = getComputedStyle(img);
    const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
    const box = { left: f.left, top: f.top - sec.top, width: f.width, height: f.height };
    const pos = objectPositionFractions(cs.objectPosition);
    const fit = cs.objectFit;
    const origin = { x: ox || 0, y: oy || 0 };
    const hands = getHandsStagePose();
    const centre = { x: (hands.rose.x + hands.gold.x) / 2, y: (hands.rose.y + hands.gold.y) / 2 };
    return {
      // a point of the picture in stage px (section top at the viewport top) at push-in k
      at: (pt, k) => fitPoint(pt, NATURAL, box, pos, { scale: k, origin }, fit),
      centre,
      half: hands.gold.x - centre.x, // half the linked pair's spread at scale 1
      w: f.width,
      h: f.height,
      visitTop,
      over: getComputedStyle(section).getPropertyValue('--venue-over').trim() === '1',
    };
  }

  // The portrait, title, beats and visit card: a function of progress only.
  function renderScene(p) {
    if (p === lastScene) return;
    lastScene = p;
    const k = zoomAt(p);
    if (k !== lastZoom) {
      lastZoom = k;
      img.style.transform = k === 1 ? '' : `scale(${k.toFixed(5)})`;
    }
    const said = ease(B.yes, p, EASE_OUT); // rise 32px + fade, scrubbed
    setYes({ opacity: said, y: 32 * (1 - said) });
    const now = beatAt(p);
    if (now !== beat) showBeat(beats, (beat = now));
    // the visit card is laid over the portrait: rises 48px and fades in, scrubbed
    const v = ease(B.venue, p, EASE_OUT);
    if (v !== lastVenue) {
      lastVenue = v;
      visit.style.opacity = v === 1 ? '' : v.toFixed(4);
      visit.style.transform = v === 1 ? '' : `translate3d(0, ${(48 * (1 - v)).toFixed(2)}px, 0)`;
      visit.style.pointerEvents = v < 0.6 ? 'none' : '';
    }
  }

  // The rings, in stage px with #proposal's top at the viewport top; dy moves
  // them with the page before the pin (scrolling back up) and after it.
  function ringPose(p) {
    const g = geo;
    const k = zoomAt(p);
    const sPair = lerp(1, SETTLE, ease(B.settle, p));
    const linked = {
      rose: { x: g.centre.x - g.half * sPair, y: g.centre.y },
      gold: { x: g.centre.x + g.half * sPair, y: g.centre.y },
    };
    const sep = ease(B.separate, p);
    const hover = g.at(HOVER, k);
    const sHover = (hover.scale * HOVER_R) / RING_RADIUS;

    let r;
    if (p < B.travel[0]) {
      // hers lifts in a small arc to wait above her hand
      const s = lerp(sPair, sHover, sep);
      r = { ...lerpPt(linked.rose, hover, sep), rotation: 0, sx: s, sy: s };
      r.y -= Math.sin(Math.PI * sep) * LIFT * hover.scale;
    } else {
      // the glide down onto her finger: shrinking to finger size, turning to
      // stand across the finger, bowing a little toward Karan on the way
      const u = ease(B.travel, p);
      const fin = g.at(FINGER, k);
      const sF = (fin.scale * FINGER_R) / RING_RADIUS;
      const pt = lerpPt(hover, fin, u);
      pt.x += Math.sin(Math.PI * u) * BOW * fin.scale;
      r = { ...pt, rotation: FINGER_TILT * u, sx: lerp(sHover, sF * SQUASH, u), sy: lerp(sHover, sF, u) };
    }
    const to = g.at(GOLD_TO, k);
    const gs = lerp(sPair, (to.scale * GOLD_R) / RING_RADIUS, sep);
    return {
      rose: r,
      gold: { ...lerpPt(linked.gold, to, sep), s: gs, opacity: 1 - ease(B.goldFade, p, EASE_OUT) },
      link: 1 - segmentT(sep, 0.1, 0.35),
    };
  }

  // The glint: one bright flash as the ring settles, easing into a slow,
  // soft shimmer that stays on the stone for the rest of the pin.
  function glintAt(p, time) {
    const u = segmentT(p, B.glint[0], B.glint[1]);
    if (u <= 0) return 0;
    const shimmer = 0.42 + 0.16 * Math.sin((time / SHIMMER) * Math.PI * 2);
    return u < 0.5 ? Math.sin(Math.PI * u) : lerp(1, shimmer, EASE_OUT((u - 0.5) * 2));
  }

  let lastSpark = -1;
  function renderRings(p, dy, time) {
    const key = `${p}|${dy}`;
    const pose = key === lastRings ? null : ringPose(p);
    if (pose) {
      lastRings = key;
      const r = pose.rose;
      const roseVars = { x: r.x, y: r.y + dy, rotation: r.rotation, scaleX: r.sx, scaleY: r.sy };
      setRose(roseVars);
      setLink({ ...roseVars, opacity: pose.link });
      setGold({ x: pose.gold.x, y: pose.gold.y + dy, rotation: 0, scaleX: pose.gold.s, scaleY: pose.gold.s, opacity: pose.gold.opacity });
      lastSpark = -1;
    }
    const glint = glintAt(p, time);
    if (glint === lastSpark) return;
    lastSpark = glint;
    if (glint > 0) {
      // over the stone, which stands 50 units out from the band's centre
      const r = ringPose(p).rose;
      const a = (r.rotation * Math.PI) / 180;
      setSpark({
        x: r.x + 50 * r.sy * Math.sin(a),
        y: r.y + dy - 50 * r.sy * Math.cos(a),
        scale: 0.7 * glint,
        opacity: Math.min(glint * 1.4, 1),
        rotation: 45 * glint,
      });
    } else {
      setSpark({ opacity: 0, scale: 0 });
    }
  }

  // Hand the rings back to the journey: undo what only this scene sets.
  function release() {
    owned = false;
    lastRings = '';
    setRose({ scaleX: 1, scaleY: 1, opacity: 1 });
    setGold({ scaleX: 1, scaleY: 1, opacity: 1 });
    setLink({ scaleX: 1, scaleY: 1 });
    setSpark({ opacity: 0, scale: 0 });
    redrawJourney();
  }

  // The pin only holds the section; the clock is the journey's (one lagged
  // virtual scroll for both scenes). The pin starts exactly at the journey's
  // end and lasts pinLength(), the length the journey's clock already spans.
  // refreshPriority 1: the pin spacer exists before the journey re-measures.
  const trigger = ST.create({
    trigger: section,
    start: 'top top', // = the journey's end: #proposal's top at the viewport top
    end: () => `+=${pinLength()}`,
    pin: true,
    anticipatePin: 1,
    refreshPriority: 1,
    invalidateOnRefresh: true,
    onRefresh: () => {
      geo = measure();
      lastScene = -1;
      lastRings = '';
      lastVenue = -2;
      wake();
    },
    // the scroll crossed into, through or past the pin (also a jump from the
    // footer straight to the top): wake the loop so the hand-back happens
    onUpdate: () => wake(),
    onToggle: () => wake(),
  });
  handOffRings(true);

  // The scroll position at which the visit card is in place and in view:
  // laid over the portrait's side, late in the pin (wide screens), or, past
  // the pin, with the card's top a tenth of the way down the screen.
  const venueScroll = () => {
    if (!geo) return null;
    const len = trigger.end - trigger.start;
    if (geo.over) return Math.round(trigger.start + (B.venue[1] + 0.04) * len);
    return Math.round(Math.max(trigger.end, trigger.end + geo.visitTop - 0.1 * window.innerHeight));
  };

  // The loop runs only while the scene can be seen. An IntersectionObserver
  // says when any of #proposal is on screen; the pin trigger's callbacks above
  // wake it whenever the scroll crosses the pin. Away from the screen it keeps
  // going only until the lagged clock and the scroll have settled (so a
  // hand-back to the journey, and the rings' last move off screen, still
  // happen), then leaves the ticker: no per frame work, shimmer included,
  // above or below the scene. No layout reads per frame.
  function wake() {
    if (running) return;
    running = true;
    gsap.ticker.add(tick);
  }
  const io = new IntersectionObserver((entries) => {
    near = entries[entries.length - 1].isIntersecting;
    if (near) wake();
  });
  io.observe(section);

  // "Venue" links and keyboard focus reach the visit card once it is laid
  // over the portrait: scroll to where it has arrived (an ordinary jump would
  // land inside the pin, with the card not there yet).
  const toVenue = (e) => {
    const top = venueScroll();
    if (top === null) return;
    e.preventDefault();
    window.scrollTo({ top, behavior: 'smooth' });
    visit.focus({ preventScroll: true });
  };
  const venueLinks = [...document.querySelectorAll('a[href="#venue"]')];
  venueLinks.forEach((a) => a.addEventListener('click', toVenue));
  const onFocus = (e) => {
    if (e.target === visit) return; // a "Venue" link already brought it here
    const top = venueScroll();
    if (top !== null && lastVenue < 1 && Math.abs(window.scrollY - top) > 2) window.scrollTo({ top });
  };
  visit.addEventListener('focusin', onFocus);

  stopScene = () => {
    io.disconnect();
    gsap.ticker.remove(tick);
    running = true; // wake() never adds it again
    venueLinks.forEach((a) => a.removeEventListener('click', toVenue));
    visit.removeEventListener('focusin', onFocus);
    burst.remove();
  };

  function tick(time) {
    if (geo) render(time);
    const v = getVirtualScroll();
    const scroll = trigger.scroll();
    if (!near && v === lastV && scroll === lastScroll) {
      running = false;
      gsap.ticker.remove(tick);
    }
    lastV = v;
    lastScroll = scroll;
  }

  // One frame, after GSAP and ScrollTrigger have updated: the scene follows
  // the shared clock; the rings are ours when ringOwner() says so.
  function render(time) {
    const end = getJourneyEnd();
    const v = getVirtualScroll();
    const p = segmentT(v, end, end + trigger.end - trigger.start);
    renderScene(p);
    if (ringOwner(v, end) !== 'proposal') {
      if (owned) release();
      return;
    }
    owned = true;
    // the page offset: 0 while pinned, moving with the page before and after
    const dy = trigger.start - collapsePin(trigger.scroll(), trigger.start, trigger.end - trigger.start);
    renderRings(p, dy, time);
    // The ring is on: roses burst from her hand (once per crossing, forwards
    // only, and not when a jump lands past the whole scene).
    if (armed && p >= B.burst[0] && p < B.venue[0]) {
      armed = false;
      const r = ringPose(p).rose;
      burst.fire(r.x, r.y + dy);
    } else if (!armed && p < B.burst[1]) {
      armed = true;
    }
  }
  wake();
  ST.refresh();

  // A link straight to the venue (…/#venue): open where the card has arrived.
  if (location.hash === '#venue') {
    const top = venueScroll();
    if (top !== null) requestAnimationFrame(() => window.scrollTo({ top }));
  }
}
