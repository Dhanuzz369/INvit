import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SITE_URL, cleanName, guestFromSearch, icsToDate, countdown, shareMessage, personalLink, whatsappLink, EVENT,
} from '../js/lib.js';
import { beatAt } from '../js/proposal.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// --- the guest's name -----------------------------------------------------------

test('guestFromSearch reads ?to=, decoding %20, + and %26', () => {
  assert.equal(guestFromSearch('?to=Ananya%20%26%20family'), 'Ananya & family');
  assert.equal(guestFromSearch('?to=Ravi+Kumar'), 'Ravi Kumar');
  assert.equal(guestFromSearch('to=Meera'), 'Meera');
  assert.equal(guestFromSearch('?from=x&to=Asha&y=1'), 'Asha');
});

test('guestFromSearch: no name, an empty name or a blank name give ""', () => {
  for (const s of ['', '?', '?to=', '?to=%20%20', '?other=1', undefined, null]) assert.equal(guestFromSearch(s), '', String(s));
});

test('cleanName collapses spaces and trims', () => {
  assert.equal(cleanName('  Ananya \n\t &   family  '), 'Ananya & family');
});

test('cleanName strips control characters, direction overrides and markup brackets', () => {
  const B = String.fromCharCode;
  assert.equal(cleanName(`Ana${B(0)}nya${B(7)}`), 'Ananya');
  assert.equal(cleanName(`${B(0x202e)}Ravi${B(0x2066)}`), 'Ravi');
  assert.equal(cleanName(`Zero${B(0x200b)}width${B(0xfeff)}`), 'Zerowidth');
  assert.equal(cleanName('<img src=x onerror=alert(1)>'), 'img src=x onerror=alert(1)');
});

test('cleanName keeps joiners, accents and Kannada', () => {
  const zwj = String.fromCharCode(0x200d);
  assert.equal(cleanName(`ಸ್ವಾತಿ${zwj}`), `ಸ್ವಾತಿ${zwj}`);
  assert.equal(cleanName('Zoë & André'), 'Zoë & André');
});

test('cleanName caps a name at 60 characters, never splitting a character', () => {
  const long = 'அ'.repeat(80);
  assert.equal([...cleanName(long)].length, 60);
  assert.equal(cleanName('x'.repeat(100)).length, 60);
  assert.equal(cleanName(42), '');
});

// --- the countdown --------------------------------------------------------------

const at = (iso) => new Date(iso);

test('icsToDate reads the calendar form', () => {
  assert.equal(icsToDate(EVENT.startUtc).toISOString(), '2026-11-15T05:30:00.000Z');
  assert.ok(Number.isNaN(+icsToDate('nonsense')));
});

test('countdown: whole days to go, counted in Bengaluru calendar days', () => {
  assert.deepEqual(countdown(at('2026-11-05T12:00:00+05:30')), { main: '10 days to go', note: 'counting from today' });
  // just after midnight in Bengaluru (still the 4th in UTC): already the 5th there
  assert.equal(countdown(at('2026-11-05T00:10:00+05:30')).main, '10 days to go');
  assert.equal(countdown(at('2026-11-04T23:50:00+05:30')).main, '11 days to go');
  assert.equal(countdown(at('2026-11-13T09:00:00+05:30')).main, '2 days to go');
});

test('countdown: tomorrow, today, and after', () => {
  assert.equal(countdown(at('2026-11-14T08:00:00+05:30')).main, 'Tomorrow');
  assert.equal(countdown(at('2026-11-14T23:59:00+05:30')).main, 'Tomorrow');
  assert.equal(countdown(at('2026-11-15T00:01:00+05:30')).main, 'Today, at 11');
  assert.equal(countdown(at('2026-11-15T13:59:00+05:30')).main, 'Today, at 11');
  assert.equal(countdown(at('2026-11-15T14:00:00+05:30')).main, 'With us in spirit');
  assert.equal(countdown(at('2027-01-01T10:00:00+05:30')).main, 'With us in spirit');
});

test('countdown: an invalid date gives null', () => {
  assert.equal(countdown(new Date(NaN)), null);
});

// --- personal links ---------------------------------------------------------------

test('personalLink puts the cleaned name on the invitation address', () => {
  assert.equal(personalLink(SITE_URL, 'Ananya & family'), 'https://karan-swathi.vercel.app/?to=Ananya%20%26%20family');
  assert.equal(personalLink(SITE_URL, '  '), SITE_URL);
  assert.equal(personalLink('https://example.test/invite/index.html?to=Old#venue', 'Ravi'), 'https://example.test/invite/index.html?to=Ravi');
  assert.equal(guestFromSearch(new URL(personalLink(SITE_URL, 'Ananya & family')).search), 'Ananya & family');
});

test('shareMessage and whatsappLink make a ready to send message', () => {
  const link = personalLink(SITE_URL, 'Ananya & family');
  const text = shareMessage(link, 'Ananya & family');
  assert.ok(text.startsWith('Dear Ananya & family, Karan & Swathi are getting engaged on Sunday, 15 November 2026'));
  assert.ok(text.endsWith(`Your invitation: ${link}`));
  assert.equal(shareMessage(SITE_URL).startsWith('Karan & Swathi'), true);
  const wa = whatsappLink(text);
  assert.ok(wa.startsWith('https://wa.me/?text='));
  assert.equal(decodeURIComponent(wa.slice('https://wa.me/?text='.length)), text);
});

test('the static share links in index.html match shareMessage(SITE_URL)', () => {
  const expected = whatsappLink(shareMessage(SITE_URL)).replace(/&/g, '&amp;');
  const shares = [...html.matchAll(/<a [^>]*data-share[^>]*>/g)].map((m) => m[0]);
  assert.ok(shares.length >= 2);
  for (const tag of shares) assert.ok(tag.includes(`href="${expected}"`), tag);
});

// --- the page works without script ---------------------------------------------------

test('without script: generic envelope line, no greeting, no countdown, no host tool', () => {
  assert.match(html, /<p class="envelope__label" data-guest-for>For you, with love<\/p>/);
  assert.match(html, /<p [^>]*data-guest-dear hidden>/);
  assert.match(html, /<div [^>]*data-countdown hidden>/);
  assert.match(html, /<details [^>]*data-host-tool hidden>/);
});

test('every sample item awaiting the couple is marked in the markup', () => {
  assert.ok((html.match(/<!-- sample: confirm/g) || []).length >= 5);
});

// --- the proposal beats ---------------------------------------------------------------

test('beatAt: the roses, then the ring, then the yes', () => {
  assert.equal(beatAt(0), 0);
  assert.equal(beatAt(0.2), 0); // the rings arrive and part
  assert.equal(beatAt(0.35), 1); // hers glides onto her finger
  assert.equal(beatAt(0.5), 1);
  assert.equal(beatAt(0.6), 2); // "She said yes"
  assert.equal(beatAt(0.85), 2); // the visit card is laid over the portrait
  assert.equal(beatAt(1), 2);
});
