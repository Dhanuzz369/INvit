import { RING_RADIUS, heroPose, markMeasured, refreshIfMoved } from './rings.js';
import { rollRotation, segmentT, bezierPoint, pairPose, EASE_OUT } from './lib.js';

// 7.3 / 7.4 The ring journey: hero -> About (meet and link) -> details card
// (roll as a pair) -> proposal (glide to the hands).
//
// One master timeline, scrubbed to scroll (scrub 0.8), runs from scroll 0 to
// the moment #proposal's top reaches the top of the viewport. It tweens a
// single number (progress 0..1); render() turns that into ring poses.
//
// Poses are worked out in DOCUMENT coordinates and drawn at y - scroll on the
// fixed stage, so wherever the journey holds (hero, About, card, hands) the
// rings ride with the page exactly like content: stop scrolling mid section
// and they sit where they belong. Between holds the scroll windows below move
// them along their curves.
//
// Layout is only read in measure(), which runs on every ScrollTrigger
// refresh; per frame there is arithmetic and four transform writes.

const LINK = 0.7 * RING_RADIUS; // linked pair: centres 1.4R apart, i.e. they overlap by 0.6R
const LIFT = 9; // solitaire rises above the band: centre the pair optically (as heroPose)
const MEET_AT = 0.42; // About anchor's height in the viewport when the rings link
const REST_AT = 0.3; // pair height in the viewport when it lands on the card
const ROLL_SCROLL = 0.9; // at most this many viewports of scroll for the roll
const GLIDE_SCROLL = 0.75; // ... and for the glide down to the hands

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let timeline = null;
let handedOff = false;
let claimed = null; // optional predicate from Task 7: true while it owns the rings
let handsRest = null; // optional reduced motion pose at the hands (Task 7)
let redraw = null;
let geo = null;

// --- Hand-off API for Task 7 (see task-5-report.md) --------------------------

// The master timeline: one tween of progress 0..1. Labels (positions are
// fractions of the timeline, re-set on every refresh): "meet" (rings linked
// at About), "roll" (leave About), "card" (resting on the card), "glide"
// (leave the card), "hands" (= 1, the end: pair centred on #ring-anchor-hands
// and #proposal's top at the viewport top). null before initJourney().
export function getJourneyTimeline() {
  return timeline;
}

// Document coordinate poses of the linked pair at #ring-anchor-hands:
// { rose: {x, y, rotation}, gold: {...} }. Stage y = doc y - scroll while the
// page scrolls normally; while #proposal is pinned that is doc y - journeyEnd.
export function getHandsPose() {
  return geo ? pairPose(geo.hands.x, geo.hands.y, 0, LINK) : null;
}

// The same poses in stage (viewport) coordinates at the "hands" label, i.e.
// with #proposal's top at the viewport top. This stays correct for the whole
// time #proposal is pinned there.
export function getHandsStagePose() {
  return geo ? pairPose(geo.hands.x, geo.hands.y - geo.end, 0, LINK) : null;
}

// Scroll position (px) of the "hands" label: #proposal's top at the viewport top.
export function getJourneyEnd() {
  return geo ? geo.end : null;
}

// Task 7 calls handOffRings() once its own scroll scene owns the rings past
// "hands". From then on, whenever the raw scroll is at or past
// getJourneyEnd(), the journey writes nothing to #ring-rose, #ring-gold or
// #ring-link (in both the animated and the reduced motion branch). Above it
// the journey draws as usual, clamped to that end, and takes the rings back
// as soon as the guest scrolls back up.
//
// With a `claim` predicate the gate is claim() instead of the raw scroll
// test: the journey stays silent exactly while claim() is true. Task 7 claims
// by its own lagged (scrubbed) progress, so the two scrubs hand over at the
// same lagged moment in both directions instead of jumping.
export function handOffRings(on = true, claim = null) {
  handedOff = on;
  claimed = claim;
}

// Draws the journey's current pose now (Task 7 calls it when it lets go).
export function redrawJourney() {
  redraw?.();
}

// Reduced motion only: fn() returns the pose shown at the "hands" rest in
// DOCUMENT coordinates, { rose: {x, y, rotation, scaleX, scaleY} }, with the
// gold ring and the link hidden. Read on every refresh (layout reads allowed).
export function setHandsRest(fn) {
  handsRest = fn;
}

// -----------------------------------------------------------------------------

const docBox = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, top: r.top + window.scrollY, cy: r.top + r.height / 2 + window.scrollY };
};

// All layout reads. Returns the curves and scroll windows for render().
function measure() {
  const $ = (id) => document.getElementById(id);
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const about = docBox($('ring-anchor-about'));
  const card = docBox($('details-card'));
  const hands = docBox($('ring-anchor-hands'));
  const end = Math.max(docBox($('proposal')).top, 1);

  const meet = { x: about.x, y: about.cy + LIFT };
  const rest = { x: card.x, y: card.top - RING_RADIUS }; // bands touching the card's top edge
  const amp = Math.min(0.3 * vw, 380); // sideways swing; reaches the gutters on wide screens
  const k = amp / 0.75; // a cubic with both handles out by k bulges 0.75k

  // A: mirrored curves from the hero, swinging out, then sliding in sideways to link
  const hero = { rose: heroPose('rose'), gold: heroPose('gold') };
  const curveA = (side, from) => {
    const to = { x: meet.x + side * LINK, y: meet.y };
    const dy = to.y - from.y;
    return [from, { x: from.x + side * amp, y: from.y + 0.35 * dy }, { x: to.x + side * amp, y: to.y }, to];
  };

  // B: an S from About to the card, swinging right, back left, then landing
  const dyB = rest.y - meet.y;
  const mid = { x: (meet.x + rest.x) / 2, y: (meet.y + rest.y) / 2 };
  const pathB = window.MotionPathPlugin.getRawPath(
    `M${meet.x},${meet.y} ` +
      `C${meet.x + k},${meet.y + 0.15 * dyB} ${mid.x + k},${mid.y - 0.15 * dyB} ${mid.x},${mid.y} ` +
      `C${mid.x - k},${mid.y + 0.15 * dyB} ${rest.x - k},${rest.y - 0.15 * dyB} ${rest.x},${rest.y}`
  );
  window.MotionPathPlugin.cacheRawPathMeasurements(pathB);
  // Rolling without skidding: the pair turns by the horizontal distance it
  // has travelled (clockwise moving right, back moving left). The landing
  // spot's turn is rounded to whole turns and the difference spread over the
  // roll, so the stone always lands upright.
  const rollEnd = rollRotation(rest.x - meet.x, RING_RADIUS);
  const rollFix = Math.round(rollEnd / 360) * 360 - rollEnd;

  // C: a gentle glide from the card down to the hands
  const dyC = hands.cy - rest.y;
  const curveC = [
    rest,
    { x: rest.x - 0.5 * amp, y: rest.y + 0.35 * dyC },
    { x: hands.x + 0.35 * amp, y: hands.cy - 0.3 * dyC },
    { x: hands.x, y: hands.cy },
  ];

  // Scroll windows (px of scroll)
  const sA = Math.min(Math.max(meet.y - MEET_AT * vh, 1), end);
  const sB1 = Math.min(Math.max(rest.y - REST_AT * vh, sA), end);
  const sB0 = Math.max(sA, sB1 - ROLL_SCROLL * vh);
  const sC0 = Math.max(sB1, end - GLIDE_SCROLL * vh);

  return {
    end, meet, rest, hands: { x: hands.x, y: hands.cy }, hero, rollFix, pathB,
    restHands: handsRest ? handsRest() : null,
    roseA: curveA(-1, hero.rose), goldA: curveA(1, hero.gold), curveC,
    sA, sB0, sB1, sC0,
  };
}

// The sparkle swells and fades over a short scroll window around the meeting
// (the rings touch about 20px of scroll before sA), long enough for a slow
// scroller to see it.
const SPARK_BEFORE = 70;
const SPARK_AFTER = 40;
function sparkAt(v) {
  const g = geo;
  const from = Math.max(g.sA - SPARK_BEFORE, 0);
  const to = g.sA + SPARK_AFTER;
  return v > from && v < to ? Math.sin(Math.PI * segmentT(v, from, to)) : 0;
}

// Poses in document coordinates for virtual scroll v.
function poseAt(v) {
  const g = geo;
  if (v < g.sA) {
    const t = segmentT(v, 0, g.sA);
    const turn = Math.min(t / 0.85, 1); // upright before they touch
    const rose = bezierPoint(...g.roseA, t);
    const gold = bezierPoint(...g.goldA, t);
    rose.rotation = g.hero.rose.rotation * (1 - turn);
    gold.rotation = g.hero.gold.rotation * (1 - turn);
    // Linked once the bands overlap
    const linked = gold.x - rose.x < 2 * RING_RADIUS - 4;
    return { rose, gold, link: linked ? 1 : 0, spark: sparkAt(v) };
  }
  if (v < g.sB0) return { ...pairPose(g.meet.x, g.meet.y, 0, LINK), link: 1, spark: sparkAt(v) };
  if (v < g.sB1) {
    const t = segmentT(v, g.sB0, g.sB1);
    const p = window.MotionPathPlugin.getPositionOnPath(g.pathB, t);
    const turn = rollRotation(p.x - g.meet.x, RING_RADIUS) + g.rollFix * t;
    return { ...pairPose(p.x, p.y, turn, LINK), link: 1, spark: sparkAt(v) };
  }
  if (v < g.sC0) return { ...pairPose(g.rest.x, g.rest.y, 0, LINK), link: 1, spark: 0 };
  const t = segmentT(v, g.sC0, g.end);
  const p = bezierPoint(...g.curveC, t);
  return { ...pairPose(p.x, p.y, 0, LINK), link: 1, spark: 0 };
}

// Reduced motion: no travel. Each rest shows the rings standing still in
// its place; in transit they are hidden. Visible while scroll is within a
// rest's hold, widened by 35% of the neighbouring transits.
function restAt(s) {
  const g = geo;
  const m = 0.35;
  if (s < m * g.sA) return 'hero';
  if (s >= g.sA - m * g.sA && s < g.sB0 + m * (g.sB1 - g.sB0)) return 'about';
  if (s >= g.sB1 - m * (g.sB1 - g.sB0) && s < g.sC0 + m * (g.end - g.sC0)) return 'card';
  if (s >= g.end - m * (g.end - g.sC0)) return 'hands';
  return null;
}
function restPose(key) {
  const g = geo;
  if (key === 'hero') return { rose: g.hero.rose, gold: g.hero.gold, link: 0, spark: 0 };
  if (key === 'hands' && g.restHands) return { rose: g.restHands.rose, gold: pairPose(g.hands.x, g.hands.y, 0, LINK).gold, link: 0, spark: 0 };
  const at = key === 'about' ? g.meet : key === 'card' ? g.rest : g.hands;
  return { ...pairPose(at.x, at.y, 0, LINK), link: 1, spark: 0 };
}

export function initJourney() {
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const $ = (id) => document.getElementById(id);
  const rose = $('ring-rose');
  const gold = $('ring-gold');
  const link = $('ring-link');
  const spark = $('ring-sparkle');
  const reduced = reducedMotion();

  gsap.set([link, spark], { svgOrigin: '0 0' });
  gsap.set(spark, { opacity: 0, scale: 0 });
  if (!reduced) gsap.set(link, { opacity: 0 });

  const set = (el) => gsap.quickSetter(el, 'css');
  const setRose = set(rose);
  const setGold = set(gold);
  const setLink = set(link);
  const setSpark = set(spark);

  const state = { p: 0 };
  let trigger = null;
  let last = '';
  let sparkShown = false;

  // Reduced motion: which rest is drawn, and which one we are fading to
  let placed = 'hero';
  let target = 'hero';
  const fadeTo = (key) => {
    target = key;
    const all = [rose, gold, link];
    gsap.killTweensOf(all, 'opacity');
    gsap.to(all, {
      opacity: 0,
      duration: 0.25,
      ease: EASE_OUT,
      onComplete: () => {
        placed = key;
        render(true);
        const show = key === 'hero' ? [rose, gold] : key === 'hands' && geo.restHands ? [rose] : all;
        if (key) gsap.to(show, { opacity: 1, duration: 0.4, ease: EASE_OUT });
      },
    });
  };

  function render(force) {
    if (!geo || !trigger) return;
    const raw = trigger.scroll();
    // Past "hands" Task 7 owns the rings once handed off: never fight it.
    if (handedOff && (claimed ? claimed() : raw >= geo.end)) return;
    const scroll = handedOff ? Math.min(raw, geo.end) : raw;
    const v = state.p * geo.end;
    const key = `${v.toFixed(2)}|${scroll}`;
    if (!force && key === last) return;
    last = key;

    let pose;
    if (reduced) {
      const want = restAt(scroll);
      if (want !== target) fadeTo(want);
      if (!placed) return;
      pose = restPose(placed);
    } else {
      pose = poseAt(v);
    }

    const rosePose = { x: pose.rose.x, y: pose.rose.y - scroll, rotation: pose.rose.rotation };
    if (reduced) {
      // only the reduced hands rest scales (the ring on her finger)
      rosePose.scaleX = pose.rose.scaleX ?? 1;
      rosePose.scaleY = pose.rose.scaleY ?? 1;
    }
    setRose(rosePose);
    setGold({ x: pose.gold.x, y: pose.gold.y - scroll, rotation: pose.gold.rotation });
    const linkPose = { x: pose.rose.x, y: pose.rose.y - scroll, rotation: pose.rose.rotation };
    if (!reduced) linkPose.opacity = pose.link;
    setLink(linkPose);
    if (!reduced) {
      if (pose.spark > 0 || sparkShown) {
        sparkShown = pose.spark > 0;
        setSpark({
          x: geo.meet.x,
          y: geo.meet.y - 20 - scroll, // over the upper crossing
          scale: pose.spark,
          opacity: pose.spark,
          rotation: 45 * pose.spark,
        });
      }
    }
  }

  timeline = gsap.timeline({
    defaults: { ease: 'none' }, // scroll is the clock
    onUpdate: () => render(),
    scrollTrigger: {
      start: 0,
      // measure() reads layout here, once per refresh
      end: () => {
        geo = measure();
        return geo.end;
      },
      scrub: 0.8,
      invalidateOnRefresh: true,
      onRefresh: () => {
        const g = geo;
        for (const [name, at] of [
          ['meet', g.sA], ['roll', g.sB0], ['card', g.sB1], ['glide', g.sC0], ['hands', g.end],
        ]) timeline.addLabel(name, at / g.end);
        markMeasured();
        render(true);
      },
      onUpdate: () => render(),
    },
  });
  timeline.addLabel('start', 0).fromTo(state, { p: 0 }, { p: 1, duration: 1 }).addLabel('hands', 1);
  trigger = timeline.scrollTrigger;

  // Past "hands" the master trigger stops updating; keep the rings riding
  // with the page there until Task 7 takes them.
  ST.create({ start: () => (geo || (geo = measure())).end, end: 'max', onUpdate: () => render() });

  // Late font swaps and resizes ScrollTrigger skips (debounced 200ms; refresh
  // only if an anchor moved, so the mobile address bar costs nothing).
  window.addEventListener('resize', refreshIfMoved);
  window.addEventListener('orientationchange', refreshIfMoved);
  document.fonts?.ready.then(refreshIfMoved);
  document.fonts?.addEventListener?.('loadingdone', refreshIfMoved);

  redraw = () => {
    last = '';
    render(true);
  };
  render(true);
}
