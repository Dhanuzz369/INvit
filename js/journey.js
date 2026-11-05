import { RING_RADIUS, heroPose, markMeasured, refreshIfMoved, ringSetter, docRect } from './rings.js';
import {
  rollRotation, segmentT, bezierPoint, pairPose, EASE_OUT, ringOwner, collapsePin, textProximity,
} from './lib.js';

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
// refresh; per frame there is arithmetic and four transform writes (plain
// SVG transform attributes through ringSetter(), never GSAP's cache).
//
// Text stays readable: on phones the column is the full width, so no curve
// can go round the words. While the rings are in transit (A, B, C) and pass
// over text (hero lines, the story, the card rows), they fade to 35% and
// shrink a little (TEXT_FADE, TEXT_SHRINK), easing back as they clear it;
// at every rest they are whole. Wider screens cross less text, so the same
// rule simply fires less.

const LINK = 0.7 * RING_RADIUS; // linked pair: centres 1.4R apart, i.e. they overlap by 0.6R
const LIFT = 9; // solitaire rises above the band: centre the pair optically (as heroPose)
const MEET_AT = 0.42; // About anchor's height in the viewport when the rings link
const REST_AT = 0.3; // pair height in the viewport when it lands on the card
const ROLL_SCROLL = 0.9; // at most this many viewports of scroll for the roll
const GLIDE_SCROLL = 0.75; // ... and for the glide down to the hands
const TEXT_FADE = 0.35; // ring opacity while over text in transit
const TEXT_SHRINK = 0.82; // ... and scale
const TEXT_FEATHER = 28; // px of clear space over which they ease back
const TRANSIT_EDGE = 0.12; // first/last share of a transit over which the fade may start/stop
// Text the rings would otherwise cover in transit
const TEXT_BLOCKS = [
  '.invite__together', '#hero-names', '.invite__engaged', '.invite__when', '.invite__where',
  '.invite__dear', '#tagline',
  '#about .title', '.story p', '.fact',
  '.programme__word', '#details-card .detail-row',
].join(',');

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let timeline = null;
let handedOff = false;
let pinLength = () => 0; // px #proposal stays pinned after "hands" (Task 7)
let handsRest = null; // optional reduced motion pose at the hands (Task 7)
let redraw = null;
let geo = null;

// --- Hand-off API for Task 7 (see task-5-report.md) --------------------------

// The master timeline (module internal) is one tween of progress 0..1.
// Labels (fractions of the timeline, re-set on every refresh): "meet" (rings
// linked at About), "roll" (leave About), "card" (resting on the card),
// "glide" (leave the card), "hands" (pair centred on #ring-anchor-hands and
// #proposal's top at the viewport top) and "pinEnd" (= 1, the end of the
// proposal pin).

// The linked pair at #ring-anchor-hands in stage (viewport) coordinates at the "hands" label, i.e.
// with #proposal's top at the viewport top. This stays correct for the whole
// time #proposal is pinned there.
export function getHandsStagePose() {
  return geo ? pairPose(geo.hands.x, geo.hands.y - geo.end, 0, LINK) : null;
}

// Scroll position (px) of the "hands" label: #proposal's top at the viewport top.
export function getJourneyEnd() {
  return geo ? geo.end : null;
}

// js/proposal.js calls handOffRings(true) once, when its pinned scene is set
// up (animated branch only; under reduced motion there is no hand-off and the
// journey draws the hands rest itself, see setHandsRest). From then on the
// journey writes nothing to #ring-rose, #ring-gold or #ring-link while the
// proposal owns the rings, and draws as usual (clamped to the "hands" pose)
// otherwise, taking them back as soon as the guest scrolls back up.
//
// Who owns them: with a pin length registered (setPinLength, the normal
// case) the master timeline is ONE lagged clock for both scenes, running on
// through the pin, and the owner is ringOwner(getVirtualScroll(),
// getJourneyEnd()), so a fast flick hands over at the same lagged moment in
// both directions. Without a pin length it falls back to the raw scroll
// being at or past getJourneyEnd().
export function handOffRings(on = true) {
  handedOff = on;
}

// Task 7: px of scroll #proposal stays pinned after "hands" (read on every
// refresh; call before initJourney). The master timeline then spans 0 ..
// end + pin length, and the page offset collapses the pinned stretch.
export function setPinLength(fn) {
  pinLength = fn;
}

// The shared lagged clock: virtual scroll px (scrubbed, 0 .. end + pin length).
export function getVirtualScroll() {
  return geo && timeline ? timeline.progress() * geo.total : 0;
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

// Document boxes, through the pin spacer for anything inside #proposal (a
// refresh mid pin finds it fixed at the viewport top).
const docBox = docRect;

// All layout reads. Returns the curves and scroll windows for render().
function measure() {
  const $ = (id) => document.getElementById(id);
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const about = docBox($('ring-anchor-about'));
  const card = docBox($('details-card'));
  const hands = docBox($('ring-anchor-hands'));
  const end = Math.max(docBox($('proposal')).top, 1);
  const pin = Math.max(pinLength() || 0, 0);

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

  // Text boxes in document coordinates (for the transit fade)
  const text = [...document.querySelectorAll(TEXT_BLOCKS)].map((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
  });

  return {
    end, pin, total: end + pin, text, meet, rest, hands: { x: hands.x, y: hands.cy }, hero, rollFix, pathB,
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
  // smoothstep: leaves the card and arrives at the hands at rest, so a fast
  // flick into the proposal never shows the pair stopping dead at the hand-over
  const u = segmentT(v, g.sC0, g.end);
  const t = u * u * (3 - 2 * u);
  const p = bezierPoint(...g.curveC, t);
  return { ...pairPose(p.x, p.y, 0, LINK), link: 1, spark: 0 };
}

// 0..1: how far the rings fade and shrink at virtual scroll v for this pose
// (document coordinates). Only in transit, ramped in and out at its edges so
// the rests are always whole.
function textFadeAt(v, pose) {
  const g = geo;
  const win = v < g.sA ? [0, g.sA] : v >= g.sB0 && v < g.sB1 ? [g.sB0, g.sB1] : v >= g.sC0 ? [g.sC0, g.end] : null;
  if (!win) return 0;
  const t = segmentT(v, win[0], win[1]);
  const edge = Math.min(segmentT(t, 0, TRANSIT_EDGE), segmentT(1 - t, 0, TRANSIT_EDGE));
  if (edge <= 0) return 0;
  const near = Math.max(
    textProximity(pose.rose.x, pose.rose.y, RING_RADIUS, g.text, TEXT_FEATHER),
    textProximity(pose.gold.x, pose.gold.y, RING_RADIUS, g.text, TEXT_FEATHER)
  );
  return near * edge * edge * (3 - 2 * edge);
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

  // Stage level ring groups: plain SVG transforms, never GSAP's cache
  const setRose = ringSetter(rose);
  const setGold = ringSetter(gold);
  const setLink = ringSetter(link);
  const setSpark = ringSetter(spark);
  setSpark({ opacity: 0, scale: 0 });
  if (!reduced) setLink({ opacity: 0 });

  const state = { p: 0 };
  let trigger = null;
  let last = '';
  let sparkShown = false;
  let faded = false;

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
    const virtual = state.p * geo.total;
    if (handedOff && (geo.pin ? ringOwner(virtual, geo.end) === 'proposal' : raw >= geo.end)) return;
    const scroll = handedOff ? (geo.pin ? collapsePin(raw, geo.end, geo.pin) : Math.min(raw, geo.end)) : raw;
    const v = Math.min(virtual, geo.end);
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

    // Over text in transit: fade and shrink, the pair drawing in about its
    // middle so linked bands stay linked.
    const fade = reduced ? 0 : textFadeAt(v, pose);
    const size = 1 - (1 - TEXT_SHRINK) * fade;
    const alpha = 1 - (1 - TEXT_FADE) * fade;
    if (fade > 0) {
      const cx = (pose.rose.x + pose.gold.x) / 2;
      const cy = (pose.rose.y + pose.gold.y) / 2;
      const pull = (r) => ({ ...r, x: cx + (r.x - cx) * size, y: cy + (r.y - cy) * size });
      pose = { ...pose, rose: pull(pose.rose), gold: pull(pose.gold) };
    }

    // only the reduced hands rest scales otherwise (the ring on her finger)
    const rosePose = {
      x: pose.rose.x,
      y: pose.rose.y - scroll,
      rotation: pose.rose.rotation,
      scaleX: (pose.rose.scaleX ?? 1) * size,
      scaleY: (pose.rose.scaleY ?? 1) * size,
    };
    const goldPose = { x: pose.gold.x, y: pose.gold.y - scroll, rotation: pose.gold.rotation, scaleX: size, scaleY: size };
    // ring opacity is written only around a fade (the drop and the
    // reduced motion fades own it otherwise)
    if (fade > 0 || faded) {
      faded = fade > 0;
      rosePose.opacity = alpha;
      goldPose.opacity = alpha;
    }
    setRose(rosePose);
    setGold(goldPose);
    const linkPose = { ...rosePose };
    delete linkPose.opacity;
    if (!reduced) linkPose.opacity = pose.link * alpha;
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
        return geo.total;
      },
      scrub: 0.8,
      invalidateOnRefresh: true,
      onRefresh: () => {
        const g = geo;
        for (const [name, at] of [
          ['meet', g.sA], ['roll', g.sB0], ['card', g.sB1], ['glide', g.sC0], ['hands', g.end],
        ]) timeline.addLabel(name, at / g.total);
        timeline.addLabel('pinEnd', 1);
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
