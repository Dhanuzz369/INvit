import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverPoint, fitPoint, objectPositionFractions } from '../js/lib.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const PORTRAIT = { width: 1024, height: 1536 };

// --- coverPoint: picture pixels -> screen pixels -----------------------------------

test('coverPoint: a box with the picture\'s own shape shows it whole, scaled', () => {
  const box = { left: 100, top: 50, width: 512, height: 768 };
  const p = coverPoint({ x: 568, y: 1426 }, PORTRAIT, box);
  near(p.x, 100 + 284);
  near(p.y, 50 + 713);
  near(p.scale, 0.5);
  const corner = coverPoint({ x: 1024, y: 1536 }, PORTRAIT, box);
  near(corner.x, 612);
  near(corner.y, 818);
});

test('coverPoint: a wider box crops top and bottom, by object-position', () => {
  // 300 x 400 box: cover scale = max(300/1024, 400/1536) = 0.29297; the picture
  // is 300 x 450 on screen, 50px too tall
  const box = { left: 0, top: 0, width: 300, height: 400 };
  const s = 300 / 1024;
  const centred = coverPoint({ x: 0, y: 0 }, PORTRAIT, box);
  near(centred.scale, s);
  near(centred.y, -25); // half the excess cut off the top
  const low = coverPoint({ x: 0, y: 0 }, PORTRAIT, box, { x: 0.5, y: 0.85 });
  near(low.y, -42.5); // 85% of the excess cut off the top
  const bottom = coverPoint({ x: 1024, y: 1536 }, PORTRAIT, box, { x: 0.5, y: 0.85 });
  near(bottom.x, 300);
  near(bottom.y, 400 + 7.5); // 15% of the excess below the box
});

test('coverPoint: a taller box crops the sides', () => {
  const box = { left: 10, top: 20, width: 200, height: 600 };
  const s = 600 / 1536;
  const p = coverPoint({ x: 512, y: 768 }, PORTRAIT, box);
  near(p.scale, s);
  near(p.x, 10 + 100); // the picture's centre stays at the box centre
  near(p.y, 20 + 300);
  const left = coverPoint({ x: 0, y: 0 }, PORTRAIT, box, { x: 0, y: 0.5 });
  near(left.x, 10);
});

test('coverPoint: a push-in scales about its origin (box px) and grows the scale', () => {
  const box = { left: 100, top: 0, width: 512, height: 768 };
  const origin = { x: 256, y: 384 }; // the box centre
  const atCentre = coverPoint({ x: 512, y: 768 }, PORTRAIT, box, undefined, { scale: 1.08, origin });
  near(atCentre.x, 356);
  near(atCentre.y, 384); // the origin does not move
  near(atCentre.scale, 0.5 * 1.08);
  const corner = coverPoint({ x: 0, y: 0 }, PORTRAIT, box, undefined, { scale: 1.08, origin });
  near(corner.x, 100 + 256 - 256 * 1.08);
  near(corner.y, 384 - 384 * 1.08);
});

test('coverPoint: push-in on top of a cropped box (the ring target on a phone)', () => {
  const box = { left: 22, top: 230, width: 346, height: 461 }; // about 3:4
  const pos = { x: 0.5, y: 0.85 };
  const origin = { x: 0.54 * 346, y: 0.66 * 461 };
  const k = 1.08;
  const flat = coverPoint({ x: 568, y: 1426 }, PORTRAIT, box, pos);
  const zoomed = coverPoint({ x: 568, y: 1426 }, PORTRAIT, box, pos, { scale: k, origin });
  // zoomed = origin + (flat - origin) * k, in box coordinates
  near(zoomed.x - box.left, origin.x + (flat.x - box.left - origin.x) * k);
  near(zoomed.y - box.top, origin.y + (flat.y - box.top - origin.y) * k);
  near(zoomed.scale, flat.scale * k);
  // still inside the box: the ring finger is not cropped away
  assert.ok(zoomed.y < box.top + box.height && zoomed.x < box.left + box.width);
});

test('objectPositionFractions reads computed object-position percentages', () => {
  assert.deepEqual(objectPositionFractions('50% 85%'), { x: 0.5, y: 0.85 });
  assert.deepEqual(objectPositionFractions('0% 100%'), { x: 0, y: 1 });
  assert.deepEqual(objectPositionFractions(''), { x: 0.5, y: 0.5 });
  assert.deepEqual(objectPositionFractions('left top'), { x: 0, y: 0 });
  assert.deepEqual(objectPositionFractions('center bottom'), { x: 0.5, y: 1 });
});

// --- fitPoint with contain: the whole portrait, as the page now shows it -------------

test('fitPoint contain: a 2:3 box shows the whole picture, corner to corner', () => {
  const box = { left: 24, top: 210, width: 312, height: 468 };
  const tl = fitPoint({ x: 0, y: 0 }, PORTRAIT, box);
  const br = fitPoint({ x: 1024, y: 1536 }, PORTRAIT, box);
  near(tl.x, 24); near(tl.y, 210);
  near(br.x, 336); near(br.y, 678);
  near(tl.scale, 312 / 1024);
});

test('fitPoint contain: a box off the 2:3 shape letterboxes instead of cropping', () => {
  // 1px too wide: the picture keeps its height and centres, nothing is cut
  const box = { left: 0, top: 0, width: 313, height: 468 };
  const s = 468 / 1536;
  const tl = fitPoint({ x: 0, y: 0 }, PORTRAIT, box);
  near(tl.scale, s);
  near(tl.x, (313 - 1024 * s) / 2);
  near(tl.y, 0);
  // cover would have cropped the top instead
  assert.ok(coverPoint({ x: 0, y: 0 }, PORTRAIT, box).y < 0);
});

test('fitPoint contain + the push-in: both heads stay in the frame, the ring finger too', () => {
  const box = { left: 0, top: 0, width: 312, height: 468 };
  const origin = { x: 0.54 * 312, y: 0.28 * 468 }; // css transform-origin 54% 28%
  const zoom = { scale: 1.04, origin };
  const at = (x, y) => fitPoint({ x, y }, PORTRAIT, box, undefined, zoom);
  const inside = (p) => p.x >= 0 && p.x <= box.width && p.y >= 0 && p.y <= box.height;
  // Karan's crown (about 600, 25), Soumya's crown (about 250, 300), her jasmine (40, 650)
  for (const [x, y] of [[600, 25], [250, 300], [40, 650], [900, 300]]) assert.ok(inside(at(x, y)), `${x},${y}`);
  // the ring finger and the ring on it (radius 15 picture px)
  assert.ok(inside(at(568, 1426 + 15)));
});
