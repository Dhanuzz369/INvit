import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverPoint, objectPositionFractions } from '../js/lib.js';

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
