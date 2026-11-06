import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const css = read('css/styles.css');
const html = read('index.html');

test('no color-mix() in the stylesheet (Safari < 16.2 would drop the colours)', () => {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/color-mix\(/.test(code));
});

test('the precomputed envelope shades are plain colours', () => {
  for (const name of ['--envelope', '--envelope-pocket', '--envelope-flap', '--ink-soft', '--wax-deep']) {
    const m = css.match(new RegExp(`${name}:\\s*([^;]+);`));
    assert.ok(m, name);
    assert.match(m[1].trim(), /^#[0-9A-Fa-f]{6}$/, name);
  }
});

test('overflow-x: clip has a hidden fallback; svh custom property has a vh fallback', () => {
  assert.match(css, /overflow-x: hidden;[^\n]*\n\s*overflow-x: clip;/);
  assert.match(css, /@supports not \(height: 1svh\)\s*\{\s*\.section--proposal \{ --pic-w: [^}]*100vh/);
});

test('.vercelignore keeps the build tooling and notes out of the deploy', () => {
  assert.ok(existsSync(new URL('../.vercelignore', import.meta.url)));
  const lines = read('.vercelignore').split('\n').map((l) => l.trim());
  for (const entry of ['docs/', 'tests/', 'scripts/', '.superpowers/', 'package.json', 'package-lock.json', 'node_modules/']) {
    assert.ok(lines.includes(entry), entry);
  }
});

test('the dead hand-off exports are gone', () => {
  assert.ok(!/export function getJourneyTimeline/.test(read('js/journey.js')));
  assert.ok(!/export function getHandsPose\b/.test(read('js/journey.js')));
});

test('stage level ring groups never go through GSAP transforms', () => {
  for (const file of ['js/journey.js', 'js/proposal.js', 'js/rings.js']) {
    const src = read(file);
    assert.ok(!/quickSetter\((rose|gold|link|spark),/.test(src), file);
    assert.ok(!/gsap\.set\(\[?(rose|gold|link|spark)[,\]][^)]*(svgOrigin|scale|x:|rotation)/.test(src), file);
  }
});
