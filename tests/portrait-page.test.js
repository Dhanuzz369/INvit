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

test('Soumya, not Swathi, wherever a guest can see it (the deployed address aside)', () => {
  const visible = html.replace(/karan-swathi\.vercel\.app/g, '');
  assert.ok(!/swathi/i.test(visible));
  assert.match(html, /<title>Karan &amp; Soumya are getting engaged<\/title>/);
  assert.match(html, /<span class="names__two">Soumya<\/span>/);
  assert.match(html, /property="og:title" content="Karan &amp; Soumya are getting engaged"/);
  assert.match(html, /name="twitter:title" content="Karan &amp; Soumya are getting engaged"/);
  assert.match(html, /id="closing-names"[^>]*>Karan &amp; Soumya</);
  assert.match(html, /K <span class="toprow__amp">&amp;<\/span> S/); // the monogram stays K & S
  const ics = read('assets/karan-soumya-engagement.ics');
  assert.match(ics, /SUMMARY:Karan & Soumya Engagement/);
  assert.ok(!/SUMMARY:.*Swathi|PRODID:.*Swathi/.test(ics));
});

test('no question before the ring: only "She said yes"', () => {
  assert.ok(!/Will you/.test(html));
  assert.match(html, /<h2 id="proposal-title"[^>]*><span id="proposal-yes" class="proposal-yes">She said yes<\/span><\/h2>/);
});

test('only the couple\'s portrait and our own drawings: no found pictures, no credits line', () => {
  assert.ok(!existsSync(new URL('../assets/found', import.meta.url)));
  assert.ok(!/assets\/found\//.test(html));
  assert.ok(!/<video|class="imprint"|class="stamp|Pictures and footage|How it began|class="story"/.test(html));
  const imgs = [...html.matchAll(/<img [^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imgs, ['assets/karan-soumya-portrait.jpg']);
});

test('the programme: lunch is a plain row with its time; no dress code anywhere', () => {
  const lunch = html.match(/<div class="detail-row bar bar--plain[^"]*">[\s\S]*?<\/div>/)?.[0];
  assert.ok(lunch, 'plain lunch row');
  assert.match(lunch, /Udupi lunch<\/span><span class="bar__time">12:30/);
  assert.ok(!/bar__plus|<details|menu/.test(lunch));
  assert.ok(!/What to wear|Indo western|dress code|\bdress\b|traditional wear/i.test(html));
  assert.ok(!/class="menu"/.test(html));
});

test('contact: three numbers to call, each with a WhatsApp link, in the footer and by the venue', () => {
  const nums = [['919035318232', '+91 90353 18232'], ['917760238191', '+91 77602 38191'], ['919844942141', '+91 98449 42141']];
  const footer = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
  const venue = html.slice(html.indexOf('<section id="venue"'), html.indexOf('</section>', html.indexOf('<section id="venue"')));
  for (const [d, t] of nums) {
    assert.ok(footer.includes(`<a class="contact__call" href="tel:+${d}">${t}</a>`), `footer call ${t}`);
    assert.ok(footer.includes(`href="https://wa.me/${d}"`), `footer WhatsApp ${t}`);
    assert.ok(venue.includes(`href="tel:+${d}">${t}</a>`), `venue call ${t}`);
  }
});
