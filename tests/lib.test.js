import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT,
  directionsUrl,
  buildIcs,
  rollRotation,
  cubicBezier,
  EASE_MOVE,
  segmentT,
  bezierPoint,
  pairPose,
} from '../js/lib.js';

test('directionsUrl builds a Google Maps directions link', () => {
  assert.equal(
    directionsUrl(12.9570977, 77.5703652),
    'https://www.google.com/maps/dir/?api=1&destination=12.9570977,77.5703652'
  );
});

test('buildIcs produces a valid CRLF calendar with escaped commas', () => {
  const ics = buildIcs(EVENT);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART:20261115T053000Z'));
  assert.ok(ics.includes('DTEND:20261115T083000Z'));
  assert.ok(ics.includes('SUMMARY:Karan & Swathi Engagement'));
  assert.ok(ics.includes('LOCATION:Udupi Aatithya\\, 11\\, 5th Main Rd'));
  assert.ok(ics.includes('UID:'));
  assert.ok(ics.includes('DTSTAMP:'));
  assert.ok(!/[^\r]\n/.test(ics), 'no bare LF line endings');
});

test('rollRotation converts distance to degrees', () => {
  assert.equal(rollRotation(2 * Math.PI * 20, 20), 360);
  assert.equal(rollRotation(0, 20), 0);
});

test('buildIcs escapes semicolons in LOCATION', () => {
  const ics = buildIcs({ ...EVENT, location: 'A; B' });
  assert.ok(ics.includes('LOCATION:A' + String.fromCharCode(92) + '; B'));
});

test('buildIcs escapes commas in SUMMARY', () => {
  const ics = buildIcs({ ...EVENT, title: 'Karan, Swathi' });
  assert.ok(ics.includes('SUMMARY:Karan\\, Swathi'));
});

test('cubicBezier matches the CSS curve endpoints and shape', () => {
  const linear = cubicBezier(0, 0, 1, 1);
  for (const x of [0, 0.25, 0.5, 0.9, 1]) assert.ok(Math.abs(linear(x) - x) < 1e-5);
  const out = cubicBezier(0.22, 1, 0.36, 1);
  assert.equal(out(0), 0);
  assert.equal(out(1), 1);
  assert.ok(out(0.25) > 0.7, 'strong ease out is mostly done by a quarter of the time');
  // in out curve: slow start, past halfway at the midpoint, monotonic
  assert.ok(EASE_MOVE(0.5) > 0.5 && EASE_MOVE(0.5) < 0.7);
  let prev = 0;
  for (let x = 0.05; x <= 1; x += 0.05) {
    assert.ok(EASE_MOVE(x) >= prev);
    prev = EASE_MOVE(x);
  }
  assert.ok(EASE_MOVE(0.2) < 0.1);
});

test('segmentT clamps progress through a scroll window', () => {
  assert.equal(segmentT(50, 0, 100), 0.5);
  assert.equal(segmentT(-10, 0, 100), 0);
  assert.equal(segmentT(150, 0, 100), 1);
  assert.equal(segmentT(5, 10, 10), 0, 'empty window before its end');
  assert.equal(segmentT(10, 10, 10), 1, 'empty window at its end');
});

test('bezierPoint hits both ends and the symmetric midpoint', () => {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0, y: 10 };
  const p2 = { x: 10, y: 10 };
  const p3 = { x: 10, y: 0 };
  assert.deepEqual(bezierPoint(p0, p1, p2, p3, 0), p0);
  assert.deepEqual(bezierPoint(p0, p1, p2, p3, 1), p3);
  const mid = bezierPoint(p0, p1, p2, p3, 0.5);
  assert.equal(mid.x, 5);
  assert.equal(mid.y, 7.5);
});

test('pairPose keeps the rings a fixed distance apart as the pair turns', () => {
  const flat = pairPose(100, 50, 0, 20);
  assert.deepEqual(flat.rose, { x: 80, y: 50, rotation: 0 });
  assert.deepEqual(flat.gold, { x: 120, y: 50, rotation: 0 });
  const turned = pairPose(100, 50, 90, 20);
  assert.ok(Math.abs(turned.rose.x - 100) < 1e-9 && Math.abs(turned.rose.y - 30) < 1e-9);
  assert.ok(Math.abs(turned.gold.y - 70) < 1e-9);
  assert.equal(turned.gold.rotation, 90);
});

test('ringOwner: the journey below its end, the proposal from the end on', async () => {
  const { ringOwner } = await import('../js/lib.js');
  assert.equal(ringOwner(0, 2776), 'journey');
  assert.equal(ringOwner(2775.9, 2776), 'journey');
  assert.equal(ringOwner(2776, 2776), 'proposal');
  assert.equal(ringOwner(5308, 2776), 'proposal');
  assert.equal(ringOwner(9999, 2776), 'proposal');
});

test('collapsePin: content offset collapses the pinned stretch', async () => {
  const { collapsePin } = await import('../js/lib.js');
  assert.equal(collapsePin(100, 2776, 2532), 100);
  assert.equal(collapsePin(2776, 2776, 2532), 2776);
  assert.equal(collapsePin(4000, 2776, 2532), 2776);
  assert.equal(collapsePin(5308, 2776, 2532), 2776);
  assert.equal(collapsePin(5408, 2776, 2532), 2876);
  assert.equal(collapsePin(500, 2776, 0), 500);
});
