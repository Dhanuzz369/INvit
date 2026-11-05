// Poses for the couple caricature (assets/couple.svg, inlined in #couple-stage).
//
// Standing is the drawn default: every animated group starts with no
// transform. Poses are GSAP vars objects keyed by selector. svgOrigin values
// are the joint pivots in each group's own local SVG units (also noted beside
// each group in the SVG), so rotations hinge at hips, knees, shoulders, elbows.
//
// kneelPose(t) is the whole kneel as a function of progress t in [0, 1]. It is
// not a straight blend of KNEEL: the body drops by THIGH * (1 - cos(thigh
// angle)), which keeps the front foot planted on the ground at every t (a
// plain tween of KNEEL would sink it ~20 units below the ground mid way).
// Drive it from a scrubbed proxy, e.g.
//   const apply = createPoseSetter(gsap, stage), s = { t: 0 };
//   tl.to(s, { t: 1, onUpdate: () => apply(kneelPose(s.t)) });
// KNEEL === kneelPose(1) is the verified final pose.

export const THIGH = 90; // hip pivot (y 282) to knee pivot (y 372)
export const KNEEL_SHIFT = -8; // he settles back a touch as he kneels

const FRONT_THIGH = -90; // front thigh swings forward to horizontal
const BACK_SHIN_SCALE = 0.6; // the back shin recedes into depth (foreshortened) as the knee lands
const BACK_FOOT = 50; // final world angle of the back foot: heel up, toes tucked under
const TUCK_FROM = 0.55; // progress at which the back heel starts to lift

// Ball of the back foot (where the mojari sole meets the ground), as an
// offset from the ankle pivot 88 462 in the foot's local frame. kneelPose keeps
// this point on the ground line (y 479) at every t.
export const BACK_BALL = { dx: 24, dy: 17 };
export const BACK_BALL_Y = 462 + BACK_BALL.dy;

const r3 = (n) => Math.round(n * 1000) / 1000 + 0; // + 0 turns -0 into 0
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const DEG = Math.PI / 180;
const smooth = (a, b, t) => { const u = clamp01((t - a) / (b - a)); return u * u * (3 - 2 * u); };

// GSAP vars for a foot nested in a shin that is rotated by shinRot and
// squashed to scaleY s: they undo the squash, so the foot keeps its shape and
// ends up turned to footAbs degrees in world space. The decomposition matches
// GSAP's own (rotation, skewX, scaleX, scaleY) parsing of an SVG matrix.
export function unsquashedFoot(shinRot, s, footAbs) {
  const t = ((footAbs - shinRot) * Math.PI) / 180;
  const k = 1 / s;
  const a = Math.cos(t), b = k * Math.sin(t), c = -Math.sin(t), d = k * Math.cos(t);
  const rotation = (Math.atan2(b, a) * 180) / Math.PI;
  const skewX = (Math.atan2(c, d) * 180) / Math.PI + rotation;
  const scaleX = Math.hypot(a, b);
  const scaleY = Math.hypot(c, d) * Math.abs(Math.cos((skewX * Math.PI) / 180));
  return { rotation: r3(rotation), skewX: r3(skewX), scaleX: r3(scaleX), scaleY: r3(scaleY) };
}

export function kneelPose(t) {
  t = clamp01(t);
  const thigh = FRONT_THIGH * t;
  const drop = r3(THIGH * (1 - Math.cos((thigh * Math.PI) / 180)));
  const body = { x: r3(KNEEL_SHIFT * t), y: drop };
  // Back leg: the thigh stays upright under the skirt while the hip drops. The
  // shin folds back just enough to keep the ball of the foot on the ground:
  // first with the foot flat, then (from TUCK_FROM) lifting the heel until the
  // knee rests on the ground at t = 1. The foreshortening follows the drop, so
  // the ankle can always reach the ground.
  const landed = drop / THIGH; // 0 standing .. 1 knee on the ground
  const squash = 1 - (1 - BACK_SHIN_SCALE) * landed;
  const foot = BACK_FOOT * smooth(TUCK_FROM, 1, t);
  const ankleY = BACK_BALL_Y - (BACK_BALL.dx * Math.sin(foot * DEG) + BACK_BALL.dy * Math.cos(foot * DEG));
  const cosShin = (ankleY - 372 - drop) / (90 * squash);
  const shin = Math.acos(Math.min(1, Math.max(-1, cosShin))) / DEG;
  return {
    '#groom-torso': { ...body },
    '#groom-skirt': { skewX: r3(14 * t), svgOrigin: '100 270' }, // drapes over the knee
    '#groom-head': { ...body, rotation: r3(-6 * t), svgOrigin: '100 168' }, // looks up at her
    '#groom-arm-l': { ...body, rotation: r3(-14 * t), svgOrigin: '70 204' },
    '#groom-forearm-l': { rotation: r3(-118 * t), svgOrigin: '70 252' }, // hand on heart
    '#groom-arm-r': { ...body, rotation: r3(-55 * t), svgOrigin: '130 204' }, // offers the ring
    '#groom-forearm-r': { rotation: r3(-20 * t), svgOrigin: '130 252' },
    '#groom-leg-front': { ...body },
    '#groom-leg-front-upper': { rotation: r3(thigh), svgOrigin: '114 282' },
    '#groom-leg-front-lower': { rotation: r3(-thigh), svgOrigin: '114 372' }, // shin stays upright
    '#groom-leg-back': { ...body },
    '#groom-leg-back-upper': { rotation: 0, svgOrigin: '88 282' },
    '#groom-leg-back-lower': { rotation: r3(shin), scaleY: r3(squash), svgOrigin: '88 372' },
    '#groom-foot-back': { ...unsquashedFoot(shin, squash, foot), svgOrigin: '88 462' },
  };
}

export const KNEEL = kneelPose(1);

// Swathi extends her right hand toward him (t in [0, 1]): the upper arm lifts
// and the forearm comes up level, so her hand ends in front of him, just
// above and left of his raised ring hand (ring finger at about 196, 240 in
// KNEEL), with clear space between their hands for the ring to cross.
export function reachPose(t) {
  t = clamp01(t);
  return {
    '#bride-arm-r': { rotation: r3(12.6 * t), svgOrigin: '276 216' },
    '#bride-forearm-r': { rotation: r3(25 * t), svgOrigin: '276 258' },
  };
}

export const REACH = reachPose(1);

// Returns apply(pose) for scrubbed use: elements are looked up once and every
// property gets one cached gsap.quickSetter, so a frame does no querySelector
// and creates no tweens. svgOrigin is set once per element (all poses of an
// element share its pivot).
const UNITS = { x: 'px', y: 'px', rotation: 'deg', skewX: 'deg' };

export function createPoseSetter(gsap, root = document) {
  const cache = new Map();
  const entry = (sel, vars) => {
    let e = cache.get(sel);
    if (!e) {
      const el = root.querySelector(sel);
      if (el && vars.svgOrigin) gsap.set(el, { svgOrigin: vars.svgOrigin });
      e = { el, set: {} };
      cache.set(sel, e);
    }
    return e;
  };
  return function apply(pose) {
    for (const sel in pose) {
      const vars = pose[sel];
      const e = entry(sel, vars);
      if (!e.el) continue;
      for (const k in vars) {
        if (k === 'svgOrigin') continue;
        (e.set[k] ||= gsap.quickSetter(e.el, k, UNITS[k] || ''))(vars[k]);
      }
    }
  };
}

