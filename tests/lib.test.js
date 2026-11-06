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
  assert.ok(ics.includes('SUMMARY:Karan & Soumya Engagement'));
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
  const ics = buildIcs({ ...EVENT, title: 'Karan, Soumya' });
  assert.ok(ics.includes('SUMMARY:Karan\\, Soumya'));
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

test('the shipped .ics file matches buildIcs(EVENT) (run npm run build:ics after editing EVENT)', async () => {
  const { readFileSync } = await import('node:fs');
  const shipped = readFileSync(new URL('../assets/karan-soumya-engagement.ics', import.meta.url), 'utf8');
  const noStamp = (s) => s.replace(/DTSTAMP:\d{8}T\d{6}Z/, 'DTSTAMP:');
  assert.equal(noStamp(shipped), noStamp(buildIcs(EVENT)));
});

test('foldIcsLine folds at 75 octets with CRLF + space, never inside a UTF-8 character', async () => {
  const { foldIcsLine } = await import('../js/lib.js');
  assert.equal(foldIcsLine('SHORT:line'), 'SHORT:line');
  const long = 'LOCATION:' + 'x'.repeat(200);
  const folded = foldIcsLine(long);
  const parts = folded.split('\r\n');
  assert.ok(parts.length > 1);
  parts.forEach((p, i) => {
    assert.ok(Buffer.byteLength(p, 'utf8') <= 75, `part ${i} is ${Buffer.byteLength(p, 'utf8')} octets`);
    if (i) assert.ok(p.startsWith(' '));
  });
  assert.equal(parts.map((p, i) => (i ? p.slice(1) : p)).join(''), long, 'unfolding gives the line back');
  // multi octet characters stay whole
  const accents = foldIcsLine('SUMMARY:' + 'é'.repeat(80));
  for (const p of accents.split('\r\n')) {
    assert.ok(Buffer.byteLength(p, 'utf8') <= 75);
    assert.ok(!p.includes('�'));
  }
});

test('buildIcs: every content line is at most 75 octets (RFC 5545 3.1)', () => {
  const ics = buildIcs(EVENT);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, line);
  assert.ok(ics.includes('\r\n '), 'the long LOCATION line is folded');
});

test('the shipped .ics file has no line over 75 octets', async () => {
  const { readFileSync } = await import('node:fs');
  const shipped = readFileSync(new URL('../assets/karan-soumya-engagement.ics', import.meta.url), 'utf8');
  for (const line of shipped.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, line);
});

test('ringTransform writes translate, rotate, scale in that order (3 decimals)', async () => {
  const { ringTransform } = await import('../js/lib.js');
  assert.equal(ringTransform({}), 'translate(0 0) rotate(0) scale(1 1)');
  assert.equal(
    ringTransform({ x: 157.12345, y: -20.5, rotation: -8, scaleX: 0.3021, scaleY: 0.25 }),
    'translate(157.123 -20.5) rotate(-8) scale(0.302 0.25)'
  );
  // the ring's own origin (0,0) lands exactly on (x, y) whatever the rotation
  // and scale: no origin offset can creep in (the refresh drift this replaces)
  const t = ringTransform({ x: 40, y: 60, rotation: 90, scaleX: 2, scaleY: 2 });
  const apply = (px, py) => {
    const [, tx, ty, r, sx, sy] = t.match(/translate\((\S+) (\S+)\) rotate\((\S+)\) scale\((\S+) (\S+)\)/).map(Number);
    const a = (r * Math.PI) / 180;
    const x = px * sx;
    const y = py * sy;
    return [tx + x * Math.cos(a) - y * Math.sin(a), ty + x * Math.sin(a) + y * Math.cos(a)];
  };
  assert.deepEqual(apply(0, 0), [40, 60]);
  const [x, y] = apply(34, 0);
  assert.ok(Math.abs(x - 40) < 1e-9 && Math.abs(y - 128) < 1e-9);
});

test('textProximity: 1 over text, easing to 0 across the feather', async () => {
  const { textProximity } = await import('../js/lib.js');
  const rects = [{ left: 0, right: 100, top: 0, bottom: 20 }];
  assert.equal(textProximity(50, 10, 34, rects, 28), 1, 'centre inside');
  assert.equal(textProximity(50, 50, 34, rects, 28), 1, 'band touching (gap 30 - 34 < 0)');
  assert.equal(textProximity(50, 20 + 34 + 28, 34, rects, 28), 0, 'clear by the feather');
  const mid = textProximity(50, 20 + 34 + 14, 34, rects, 28);
  assert.ok(mid > 0 && mid < 1);
  assert.equal(textProximity(50, 500, 34, [], 28), 0, 'no text');
});
