import { RING_RADIUS } from './rings.js';
import { getHandsStagePose, getJourneyTimeline, handOffRings, redrawJourney, setHandsRest } from './journey.js';
import { kneelPose, reachPose, createPoseSetter } from './couple-poses.js';
import { segmentT, EASE_MOVE, EASE_OUT } from './lib.js';

// 7.5 The proposal. #proposal pins the moment the ring journey ends (its top
// at the viewport top, the linked pair at the couple's clasped hands) and one
// scrubbed timeline plays the finale:
//
//   the pair shrinks to the hands  ->  the rings separate (his band tucks into
//   his hand, hers stays in his fingers)  ->  he kneels and holds it up  ->
//   she extends her hand  ->  the ring travels on a short arc onto her finger
//   ->  a glint, petals drift down, hearts rise, her cheeks blush.
//
// Like the journey it tweens one number (progress 0..1) and render() turns it
// into poses, so every beat scrubs backwards exactly. Layout is read only in
// measure() (every ScrollTrigger refresh); couple poses were sampled once in
// viewBox units, so a frame is arithmetic plus cached quickSetter writes.

const PIN_VH = 3; // pinned for 3 viewports of scroll
const SCRUB = 0.8; // the journey's scrub, so both lag alike at the hand-over
const EPS = 1e-4;

// Beats, as fractions of the pinned scroll
const B = {
  shrink: [0, 0.07], // linked pair settles into the clasped hands
  separate: [0.05, 0.19], // rings part: hers to his fingertips, his band into his hand
  withdraw: [0.1, 0.24], // she lets go of his hand as he goes down
  kneel: [0.16, 0.43],
  reach: [0.47, 0.58], // she extends her hand
  travel: [0.58, 0.71], // the ring slides from his fingers onto her finger
  release: [0.5, 0.76], // his hand lowers under hers: room for the ring to cross
  glint: [0.69, 0.79],
  blush: [0.69, 0.81],
  petals: [0.7, 0.79], // petal start times spread over this window
  hearts: [0.72, 0.8],
};
const PETAL_LIFE = 0.16;
const HEART_LIFE = 0.14;

// Ring sizes in couple viewBox units (outer radius)
const R_LINK = 21; // the linked pair resting in the clasped hands
const R_HOLD = 12; // her ring between his fingertips
const R_FINGER = 12; // on her finger (a touch large, so it reads at phone size)
const SQUASH = 0.55; // on the finger the ring is seen edge on: narrower along the finger
const ARC_LIFT = 26; // the slide onto her finger rises this far over the straight line
const WITHDRAW_ROT = -16; // her arm drops back toward her side while he kneels
const RELEASE_ROT = 15; // his arm lowers by this much after the ring is on

const PETALS = 14;
const HEARTS = 5;
const JASMINE = '#FFFDF6';
const MARIGOLD = '#E8833A';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPt = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const ease = (beat, p, fn = EASE_MOVE) => fn(segmentT(p, beat[0], beat[1]));

// Small seeded PRNG: the petals fall the same way on every visit.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Pose sampling (viewBox units, once) --------------------------------------

let apply = null; // cached pose setter for #couple-svg
let samples = null;

// The bride's right arm: w = let go (drops back), r = reach toward him.
const REACH = reachPose(1);
function brideArm(w, r) {
  return {
    '#bride-arm-r': { rotation: lerp(WITHDRAW_ROT * w, REACH['#bride-arm-r'].rotation, r), svgOrigin: '276 216' },
    '#bride-forearm-r': { rotation: lerp(0, REACH['#bride-forearm-r'].rotation, r), svgOrigin: '276 258' },
  };
}

// The groom at kneel progress k, his ring arm lowered by d once the ring is
// on, leaving her hand and the ring in the clear.
function groomPose(k, d) {
  const pose = kneelPose(k);
  const arm = pose['#groom-arm-r'];
  pose['#groom-arm-r'] = { ...arm, rotation: arm.rotation + RELEASE_ROT * d };
  return pose;
}

// Where markers sit in viewBox units under the current pose.
function pointsIn(svg, el, pts) {
  const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
  return pts.map(([x, y]) => {
    const p = new DOMPoint(x, y).matrixTransform(m);
    return { x: p.x, y: p.y };
  });
}

function sample(svg) {
  const hold = svg.querySelector('#groom-ring-hold');
  const finger = svg.querySelector('#ring-finger');
  // her ring sits just beyond his fingertips, pointing where his hand points
  const ringAt = () => {
    const [tip, wrist] = pointsIn(svg, hold, [[131, 323], [130, 300]]);
    const k = (0.7 * R_HOLD) / (Math.hypot(tip.x - wrist.x, tip.y - wrist.y) || 1);
    return { x: tip.x + (tip.x - wrist.x) * k, y: tip.y + (tip.y - wrist.y) * k };
  };
  const held = [];
  for (let i = 0; i <= 20; i++) {
    apply(groomPose(i / 20, 0));
    held.push(ringAt());
  }
  const lowered = [];
  for (let i = 0; i <= 10; i++) {
    apply(groomPose(1, i / 10));
    lowered.push(ringAt());
  }
  apply(brideArm(0, 1));
  const [base, wrist] = pointsIn(svg, finger, [[276, 310], [276, 298]]);
  // The ring's stone points across the finger, upward; its local x lies along the finger.
  const fx = base.x - wrist.x;
  const fy = base.y - wrist.y;
  let px = fy;
  let py = -fx;
  if (py > 0) [px, py] = [-px, -py];
  const fingerRot = (Math.atan2(px, -py) * 180) / Math.PI;
  apply(groomPose(0, 0));
  apply(brideArm(0, 0));
  return { held, lowered, finger: base, fingerRot };
}

// Linear between samples taken at even steps of t in [0, 1].
function along(list, t) {
  const f = Math.min(Math.max(t, 0), 1) * (list.length - 1);
  const i = Math.min(Math.floor(f), list.length - 2);
  return lerpPt(list[i], list[i + 1], f - i);
}

// Her ring in his fingers: kneel progress k, then his arm lowering d (which
// only starts once he is down).
const heldAt = (k, d) => (d > 0 ? along(samples.lowered, d) : along(samples.held, k));

// Call before initJourney(): poses are sampled and, under reduced motion, the
// journey learns to rest her ring on her finger instead of at the clasp.
export function prepareProposal() {
  const gsap = window.gsap;
  const svg = document.getElementById('couple-svg');
  const stage = document.getElementById('couple-stage');
  if (!gsap || !svg || !stage) return;
  apply = createPoseSetter(gsap, svg);
  samples = sample(svg);

  if (reducedMotion()) {
    setHandsRest(() => {
      const r = stage.getBoundingClientRect();
      const ppu = r.width / 400;
      const s = (R_FINGER * ppu) / RING_RADIUS;
      return {
        rose: {
          x: r.left + samples.finger.x * ppu,
          y: r.top + window.scrollY + samples.finger.y * ppu,
          rotation: samples.fingerRot,
          scaleX: s * SQUASH,
          scaleY: s,
        },
      };
    });
  }
}

// --- Petals and hearts ---------------------------------------------------------

const NS = 'http://www.w3.org/2000/svg';
const PETAL_PATH = {
  jasmine: 'M0 -6.5 C 3.4 -3.4, 3.4 3.4, 0 6.5 C -3.4 3.4, -3.4 -3.4, 0 -6.5 Z',
  marigold: 'M0 -5 C 4.2 -5.2, 5.4 -1, 4.4 2.6 C 3.4 5.2, -3.4 5.2, -4.4 2.6 C -5.4 -1, -4.2 -5.2, 0 -5 Z',
};
const HEART_PATH = 'M0 4.5 C -7.5 -0.5, -5.5 -8.5, 0 -4.6 C 5.5 -8.5, 7.5 -0.5, 0 4.5 Z';

function makeFx(stage) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'proposal-fx');
  svg.setAttribute('viewBox', '0 0 400 500');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const random = rng(1115);
  const petals = [];
  for (let i = 0; i < PETALS; i++) {
    const jasmine = i % 2 === 0;
    const g = document.createElementNS(NS, 'g');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', jasmine ? PETAL_PATH.jasmine : PETAL_PATH.marigold);
    path.setAttribute('fill', jasmine ? JASMINE : MARIGOLD);
    path.setAttribute('stroke', jasmine ? '#CDB592' : '#C8642A');
    path.setAttribute('stroke-width', '0.7');
    g.appendChild(path);
    if (!jasmine) {
      const vein = document.createElementNS(NS, 'path');
      vein.setAttribute('d', 'M0 -3.6 L 0 3.4');
      vein.setAttribute('stroke', '#C8642A');
      vein.setAttribute('stroke-width', '0.6');
      vein.setAttribute('stroke-linecap', 'round');
      g.appendChild(vein);
    }
    g.style.opacity = '0';
    svg.appendChild(g);
    // Spread across the scene in even lanes, nudged at random
    const x0 = 30 + ((i + 0.5) / PETALS) * 340 + (random() - 0.5) * 22;
    petals.push({
      el: g,
      start: lerp(B.petals[0], B.petals[1], random()),
      x0,
      y0: -40 - random() * 110,
      x1: x0 + (random() - 0.5) * 60,
      y1: 470 + random() * 18, // comes to rest on the ground
      r0: random() * 360,
      spin: (random() < 0.5 ? -1 : 1) * (160 + random() * 260),
      sway: 8 + random() * 12,
      waves: 1.2 + random() * 1.3,
      scale: 1 + random() * 0.6,
      restTilt: 70 + random() * 40, // lies flat-ish once landed
      last: -1,
    });
  }
  const hearts = [];
  for (let i = 0; i < HEARTS; i++) {
    const g = document.createElementNS(NS, 'g');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', HEART_PATH);
    path.setAttribute('fill', i % 2 ? '#E8A3A0' : '#B76E79');
    g.appendChild(path);
    g.style.opacity = '0';
    svg.appendChild(g);
    hearts.push({
      el: g,
      start: lerp(B.hearts[0], B.hearts[1], i / (HEARTS - 1)),
      x0: 196 + (random() - 0.5) * 40,
      y0: 248 + random() * 12,
      x1: 150 + (i / (HEARTS - 1)) * 110 + (random() - 0.5) * 20,
      y1: 90 + random() * 50,
      sway: 6 + random() * 6,
      scale: 1 + random() * 0.5,
      last: -1,
    });
  }
  stage.appendChild(svg);
  return { petals, hearts };
}

function petalVars(pt, u) {
  const fall = EASE_OUT(u) * 0.35 + u * 0.65; // a soft start, then a steady drift
  const land = segmentT(u, 0.86, 1);
  return {
    x: lerp(pt.x0, pt.x1, fall) + Math.sin(u * Math.PI * 2 * pt.waves) * pt.sway * (1 - land),
    y: lerp(pt.y0, pt.y1, fall),
    rotation: pt.r0 + pt.spin * u,
    scaleX: pt.scale,
    scaleY: pt.scale * lerp(1, 0.55, EASE_OUT(land)), // settles flat on the ground
    opacity: Math.min(segmentT(u, 0, 0.12), 1),
  };
}

function heartVars(h, u) {
  return {
    x: lerp(h.x0, h.x1, EASE_OUT(u)) + Math.sin(u * Math.PI * 3) * h.sway,
    y: lerp(h.y0, h.y1, EASE_OUT(u)),
    rotation: Math.sin(u * Math.PI * 2) * 10,
    scaleX: h.scale * lerp(0.4, 1, EASE_OUT(Math.min(u * 2, 1))),
    scaleY: h.scale * lerp(0.4, 1, EASE_OUT(Math.min(u * 2, 1))),
    opacity: Math.sin(Math.PI * u) ** 0.6,
  };
}

// --- The scene ---------------------------------------------------------------

export function initProposal() {
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const $ = (id) => document.getElementById(id);
  const section = $('proposal');
  const stage = $('couple-stage');
  const blush = $('bride-blush');
  if (!gsap || !ST || !section || !stage || !apply) return;

  const fx = makeFx(stage);
  const setFx = (list) => list.forEach((o) => (o.set = gsap.quickSetter(o.el, 'css')));
  setFx(fx.petals);
  setFx(fx.hearts);
  gsap.set([...fx.petals, ...fx.hearts].map((o) => o.el), { svgOrigin: '0 0' });

  if (reducedMotion()) {
    // Static finale: he kneels, her hand is out, the ring is on her finger
    // (placed by the journey's hands rest), petals lie on the ground. No pin.
    apply(groomPose(1, 1));
    apply(brideArm(0, 1));
    gsap.set(blush, { opacity: 1 });
    fx.petals.forEach((pt) => pt.set(petalVars(pt, 1)));
    return;
  }

  const rose = $('ring-rose');
  const gold = $('ring-gold');
  const link = $('ring-link');
  const spark = $('ring-sparkle');
  const setRose = gsap.quickSetter(rose, 'css');
  const setGold = gsap.quickSetter(gold, 'css');
  const setLink = gsap.quickSetter(link, 'css');
  const setSpark = gsap.quickSetter(spark, 'css');
  const setBlush = gsap.quickSetter(blush, 'opacity');

  const state = { p: 0 };
  let geo = null;
  let owned = false;
  let lastScene = -1;
  let lastRings = '';

  // Layout reads: the couple stage relative to #proposal's top (which sits at
  // the viewport top for the whole pin), and the journey's arrival pose.
  function measure() {
    const s = stage.getBoundingClientRect();
    const sec = section.getBoundingClientRect();
    const ppu = s.width / 400;
    const at = (u) => ({ x: s.left + u.x * ppu, y: s.top - sec.top + u.y * ppu });
    const hands = getHandsStagePose();
    const centre = { x: (hands.rose.x + hands.gold.x) / 2, y: (hands.rose.y + hands.gold.y) / 2 };
    const size = (r) => (r * ppu) / RING_RADIUS;
    return {
      at,
      ppu,
      hands,
      centre,
      sLink: size(R_LINK),
      sHold: size(R_HOLD),
      sFinger: size(R_FINGER),
      half: hands.gold.x - centre.x, // half the linked pair's spread at scale 1
      finger: at(samples.finger),
      arcLift: ARC_LIFT * ppu,
    };
  }

  // The couple, blush, petals and hearts: a function of progress only.
  function renderScene(p) {
    if (p === lastScene) return;
    lastScene = p;
    const k = ease(B.kneel, p);
    apply(groomPose(k, ease(B.release, p)));
    apply(brideArm(ease(B.withdraw, p), ease(B.reach, p)));
    setBlush(ease(B.blush, p, EASE_OUT));
    for (const pt of fx.petals) {
      const u = segmentT(p, pt.start, pt.start + PETAL_LIFE);
      if (u === pt.last) continue;
      pt.last = u;
      pt.set(u > 0 ? petalVars(pt, u) : { opacity: 0 });
    }
    for (const h of fx.hearts) {
      const u = segmentT(p, h.start, h.start + HEART_LIFE);
      if (u === h.last) continue;
      h.last = u;
      h.set(u > 0 && u < 1 ? heartVars(h, u) : { opacity: 0 });
    }
  }

  // The rings, in stage px with #proposal's top at the viewport top; dy moves
  // them with the page before the pin (scrolling back up) and after it.
  function ringPose(p) {
    const g = geo;
    const shrink = ease(B.shrink, p);
    const sPair = lerp(1, g.sLink, shrink);
    const linked = {
      rose: { x: g.centre.x - g.half * sPair, y: g.centre.y },
      gold: { x: g.centre.x + g.half * sPair, y: g.centre.y },
    };
    const k = ease(B.kneel, p);
    const inHand = g.at(heldAt(k, ease(B.release, p)));
    const sep = ease(B.separate, p);

    let r = { x: 0, y: 0, rotation: 0, sx: 1, sy: 1 };
    if (p < B.travel[0]) {
      // Hers lifts in a small arc to his fingertips; his slips down into his hand.
      const lift = Math.sin(Math.PI * sep) * 14 * g.sHold;
      const s = lerp(sPair, g.sHold, sep);
      r = { ...lerpPt(linked.rose, inHand, sep), rotation: 0, sx: s, sy: s };
      r.y -= lift;
    } else {
      // The slide onto her finger: a short arc that rises, then settles.
      const u = ease(B.travel, p);
      const pt = lerpPt(inHand, g.finger, u);
      pt.y -= Math.sin(Math.PI * u) * g.arcLift;
      const s = lerp(g.sHold, g.sFinger, u);
      r = { ...pt, rotation: lerp(0, samples.fingerRot, u), sx: s * lerp(1, SQUASH, u), sy: s };
    }
    const goldTo = { x: inHand.x - 4 * g.ppu, y: inHand.y + 6 * g.ppu }; // into his palm
    const gs = lerp(sPair, g.sHold * 0.6, sep);
    const gp = lerpPt(linked.gold, goldTo, sep);
    return {
      rose: r,
      gold: { ...gp, s: gs, opacity: 1 - segmentT(sep, 0.35, 0.9) },
      link: 1 - segmentT(sep, 0.1, 0.35),
      glint: Math.sin(Math.PI * segmentT(p, B.glint[0], B.glint[1])),
    };
  }

  function renderRings(p, dy) {
    const key = `${p}|${dy}`;
    if (key === lastRings) return;
    lastRings = key;
    const pose = ringPose(p);
    const r = pose.rose;
    const roseVars = { x: r.x, y: r.y + dy, rotation: r.rotation, scaleX: r.sx, scaleY: r.sy };
    setRose(roseVars);
    setLink({ ...roseVars, opacity: pose.link });
    setGold({ x: pose.gold.x, y: pose.gold.y + dy, rotation: 0, scaleX: pose.gold.s, scaleY: pose.gold.s, opacity: pose.gold.opacity });
    if (pose.glint > 0) {
      // over the stone, which points across her finger
      const a = (r.rotation * Math.PI) / 180;
      const tip = 50 * r.sy;
      setSpark({
        x: r.x + Math.sin(a) * tip,
        y: r.y + dy - Math.cos(a) * tip,
        scale: 0.85 * pose.glint,
        opacity: pose.glint,
        rotation: 45 * pose.glint,
      });
    } else {
      setSpark({ opacity: 0, scale: 0 });
    }
  }

  // Hand the rings back to the journey: undo what only this scene sets.
  function release() {
    owned = false;
    lastRings = '';
    gsap.set([rose, gold, link], { scaleX: 1, scaleY: 1 });
    gsap.set([rose, gold], { opacity: 1 });
    setSpark({ opacity: 0, scale: 0 });
    redrawJourney();
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'none' }, // scroll is the clock
    scrollTrigger: {
      trigger: section,
      start: 'top top', // = the journey's end: #proposal's top at the viewport top
      end: () => `+=${Math.round(PIN_VH * window.innerHeight)}`,
      pin: true,
      anticipatePin: 1,
      scrub: SCRUB,
      invalidateOnRefresh: true,
      onRefresh: () => {
        geo = measure();
        lastScene = -1;
        lastRings = '';
        tick();
      },
    },
  });
  timeline.fromTo(state, { p: 0 }, { p: 1, duration: 1 });
  const trigger = timeline.scrollTrigger;

  // The rings are ours while our lagged progress is past 0, or once the
  // journey's lagged progress has reached its end with the scroll in the pin.
  // Both scrubs lag alike, so the hand-over happens at the same pose either way.
  const owns = (raw) => {
    if (state.p > EPS) return true;
    const jp = getJourneyTimeline()?.progress() ?? 1;
    return raw >= trigger.start && jp >= 1 - EPS;
  };
  handOffRings(true, () => (geo ? owns(trigger.scroll()) : false));

  // One per frame check (after GSAP and ScrollTrigger have updated): cheap
  // when nothing changed, and it catches hand-overs that the journey's own
  // lagged progress causes.
  function tick() {
    if (!geo) return;
    const p = state.p;
    renderScene(p);
    const raw = trigger.scroll();
    if (!owns(raw)) {
      if (owned) release();
      return;
    }
    owned = true;
    const dy = raw < trigger.start ? trigger.start - raw : raw > trigger.end ? trigger.end - raw : 0;
    renderRings(p, dy);
  }
  gsap.ticker.add(tick);
}
