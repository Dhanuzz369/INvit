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
//   const s = { t: 0 };
//   tl.to(s, { t: 1, onUpdate: () => setPose(gsap, kneelPose(s.t), stage) });
// KNEEL === kneelPose(1) is the verified final pose.

export const THIGH = 90; // hip pivot (y 282) to knee pivot (y 372)
export const KNEEL_SHIFT = -8; // he settles back a touch as he kneels

const FRONT_THIGH = -90; // front thigh swings forward to horizontal
const BACK_SHIN = 115; // back shin folds back, rising toward the heel
const BACK_SHIN_SCALE = 0.6; // ... and recedes into depth (foreshortened)
const BACK_FOOT = 40; // final world angle of the back foot: toes tucked under

const r3 = (n) => Math.round(n * 1000) / 1000 + 0; // + 0 turns -0 into 0
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));

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
  const shin = BACK_SHIN * t;
  const squash = lerp(1, BACK_SHIN_SCALE, t);
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
    '#groom-foot-back': { ...unsquashedFoot(shin, squash, lerp(0, BACK_FOOT, t)), svgOrigin: '88 462' },
  };
}

export const KNEEL = kneelPose(1);

// Swathi lifts her right hand toward his raised hand (t in [0, 1]).
export function reachPose(t) {
  t = clamp01(t);
  return {
    '#bride-arm-r': { rotation: r3(10 * t), svgOrigin: '276 216' },
    '#bride-forearm-r': { rotation: 0, svgOrigin: '276 258' },
  };
}

export const REACH = reachPose(1);

// Applies a pose instantly. gsap is passed in so this module imports in node.
export function setPose(gsap, pose, root = document) {
  for (const [sel, vars] of Object.entries(pose)) {
    const el = root.querySelector(sel);
    if (el) gsap.set(el, vars);
  }
}
