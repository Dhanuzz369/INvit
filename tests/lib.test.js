import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENT, directionsUrl, buildIcs, rollRotation, cubicBezier, EASE_MOVE } from '../js/lib.js';

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
