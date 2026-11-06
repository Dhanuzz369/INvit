import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// --- the page --------------------------------------------------------------------

const html = read('index.html');

test('the portrait replaces the caricature: real alt text, WebP with a JPEG fallback', () => {
  assert.ok(!/couple-svg|couple-stage/.test(html));
  assert.ok(!existsSync(new URL('../assets/couple.svg', import.meta.url)));
  assert.ok(!existsSync(new URL('../js/couple-poses.js', import.meta.url)));
  const img = html.match(/<img id="portrait"[^>]*>/)?.[0];
  assert.ok(img, 'img#portrait');
  assert.match(img, /alt="Illustrated portrait of Karan and Soumya; Soumya holds red roses and looks up at Karan\."/);
  assert.match(img, /src="assets\/karan-soumya-portrait\.jpg"/);
  assert.match(img, /width="1024" height="1536"/);
  assert.match(html, /<source srcset="assets\/karan-soumya-portrait\.webp" type="image\/webp">/);
});

test('the venue is a visit card over the portrait, inside the pinned scene', () => {
  const proposal = html.slice(html.indexOf('<section id="proposal"'), html.indexOf('</main>'));
  assert.match(proposal, /<section id="venue"/);
  assert.ok(proposal.indexOf('id="portrait"') < proposal.indexOf('id="venue"'));
  assert.match(proposal, /id="directions"[^>]*href="https:\/\/www\.google\.com\/maps\/dir\/\?api=1&amp;destination=12\.9570977,77\.5703652"/);
  assert.match(proposal, /id="add-calendar"[^>]*data-ics/);
  assert.match(proposal, /Sunday<\/dt><dd>15 November 2026/);
  assert.match(proposal, /Ring ceremony<\/dt><dd>11:00 AM/);
  assert.match(proposal, /Lunch<\/dt><dd>12:30 PM/);
  // the watercolour and its credit are gone
  assert.ok(!/tipu|James Hunter/i.test(html));
});
