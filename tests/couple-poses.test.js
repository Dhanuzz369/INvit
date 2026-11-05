import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KNEEL, REACH, THIGH, kneelPose, reachPose, unsquashedFoot } from '../js/couple-poses.js';

const svg = readFileSync(new URL('../assets/couple.svg', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const rad = (d) => (d * Math.PI) / 180;

test('the SVG has every group and marker the animation relies on', () => {
  const ids = [
    'groom', 'groom-head', 'groom-torso', 'groom-skirt', 'groom-arm-l', 'groom-forearm-l',
    'groom-arm-r', 'groom-forearm-r', 'groom-hand-r', 'groom-ring-hold',
    'groom-leg-front', 'groom-leg-front-upper', 'groom-leg-front-lower', 'groom-foot-front',
    'groom-leg-back', 'groom-leg-back-upper', 'groom-leg-back-lower', 'groom-foot-back',
    'bride', 'bride-head', 'bride-hair-back', 'bride-torso', 'bride-arm-l', 'bride-forearm-l',
    'bride-arm-r', 'bride-forearm-r', 'bride-hand', 'ring-finger', 'dupatta',
  ];
  for (const id of ids) assert.match(svg, new RegExp(`id="${id}"`), id);
});

test('animated groups carry no transform of their own (GSAP owns them)', () => {
  for (const m of svg.matchAll(/<g id="([^"]+)"([^>]*)>/g)) {
    assert.ok(!/transform=/.test(m[2]), `#${m[1]} has a transform attribute`);
  }
});

test('index.html inlines the current assets/couple.svg', () => {
  const inner = svg.trim().split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  const start = html.indexOf('<svg id="couple-svg"');
  const end = html.indexOf('</svg>', start) + 6;
  assert.ok(start > 0, 'couple svg is inlined');
  const inlined = html.slice(start, end).split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  assert.equal(inlined, inner);
});

test('every posed selector exists in the SVG', () => {
  for (const sel of [...Object.keys(KNEEL), ...Object.keys(REACH)]) {
    assert.match(svg, new RegExp(`id="${sel.slice(1)}"`), sel);
  }
});

test('kneelPose(0) and reachPose(0) are the standing default', () => {
  for (const vars of [...Object.values(kneelPose(0)), ...Object.values(reachPose(0))]) {
    for (const [k, v] of Object.entries(vars)) {
      if (k === 'svgOrigin') continue;
      assert.equal(v, k.startsWith('scale') ? 1 : 0, k);
    }
  }
});

test('KNEEL is kneelPose(1): thigh level, shin upright, body dropped by the thigh', () => {
  assert.deepEqual(KNEEL, kneelPose(1));
  assert.equal(KNEEL['#groom-leg-front-upper'].rotation, -90);
  assert.equal(KNEEL['#groom-leg-front-lower'].rotation, 90);
  assert.equal(KNEEL['#groom-torso'].y, THIGH);
});

test('the front foot stays planted on the ground through the whole kneel', () => {
  for (let i = 0; i <= 20; i++) {
    const p = kneelPose(i / 20);
    const hipY = 282 + p['#groom-leg-front'].y;
    const thigh = p['#groom-leg-front-upper'].rotation;
    const shin = thigh + p['#groom-leg-front-lower'].rotation;
    const ankleY = hipY + THIGH * Math.cos(rad(thigh)) + 90 * Math.cos(rad(shin));
    assert.ok(Math.abs(ankleY - 462) < 0.01, `t=${i / 20}: ankle y ${ankleY}`);
  }
});

test('unsquashedFoot cancels the shin squash exactly', () => {
  for (const [shin, s, foot] of [[115, 0.6, 40], [57.5, 0.8, 20], [30, 0.9, 5]]) {
    const f = unsquashedFoot(shin, s, foot);
    // as GSAP renders an SVG transform (_renderSVGTransforms): the skewed
    // column is stretched by 1 / cos(skewX)
    const r = rad(f.rotation), k = rad(f.skewX), st = 1 / Math.cos(k);
    const F = [
      [Math.cos(r) * f.scaleX, -Math.sin(r - k) * f.scaleY * st],
      [Math.sin(r) * f.scaleX, Math.cos(r - k) * f.scaleY * st],
    ];
    const R = rad(shin);
    const S = [[Math.cos(R), -Math.sin(R) * s], [Math.sin(R), Math.cos(R) * s]];
    const M = [
      [S[0][0] * F[0][0] + S[0][1] * F[1][0], S[0][0] * F[0][1] + S[0][1] * F[1][1]],
      [S[1][0] * F[0][0] + S[1][1] * F[1][0], S[1][0] * F[0][1] + S[1][1] * F[1][1]],
    ];
    const W = rad(foot);
    const want = [[Math.cos(W), -Math.sin(W)], [Math.sin(W), Math.cos(W)]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      assert.ok(Math.abs(M[i][j] - want[i][j]) < 0.005, `${shin}/${s}/${foot} [${i}][${j}]`);
    }
  }
});
