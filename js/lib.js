export const EVENT = {
  title: 'Karan & Swathi Engagement',
  startUtc: '20261115T053000Z',
  endUtc: '20261115T083000Z',
  location:
    'Udupi Aatithya, 11, 5th Main Rd, near Makkala Koota Park, Chikkanna Garden, Chamrajpet, Bengaluru, Karnataka',
  lat: 12.9570977,
  lng: 77.5703652,
};

export function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// --- The live invitation: the guest's name, the countdown, personal links ---

export const SITE_URL = 'https://karan-swathi.vercel.app/';
const NAME_MAX = 60; // characters, enough for "Ananya, Rohit & the children"

// A guest's name as it may be written on the envelope: control characters,
// invisible formatting and direction overrides out (joiners stay, Kannada and
// Devanagari need them), angle brackets out, spaces collapsed, at most 60
// characters. '' when nothing is left.
const UNWANTED = /[\u0000-\u001F\u007F-\u009F\u00AD\u200B\u200E\u200F\u2028-\u202E\u2060-\u2064\u2066-\u2069\uFEFF<>]/g;
export function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  const s = raw.replace(UNWANTED, '').replace(/\s+/g, ' ').trim();
  return [...s].slice(0, NAME_MAX).join('').trim();
}

// The guest named in a page address's query (?to=Ananya%20%26%20family).
export function guestFromSearch(search) {
  try {
    return cleanName(new URLSearchParams(search || '').get('to') ?? '');
  } catch {
    return '';
  }
}

// '20261115T053000Z' (the calendar's form) as a Date.
export function icsToDate(s) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : new Date(NaN);
}

// The countdown in the facts row, counted in Bengaluru's calendar days
// (IST, UTC+5:30, whatever the guest's own time zone): { main, note }, or
// null for an invalid date.
const IST = 330 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const istDay = (t) => Math.floor((t + IST) / DAY);
export function countdown(now, event = EVENT) {
  const t = +now;
  if (!Number.isFinite(t)) return null;
  const start = +icsToDate(event.startUtc);
  const end = +icsToDate(event.endUtc);
  if (t >= end) return { main: 'With us in spirit', note: 'thank you for every blessing' };
  const days = istDay(start) - istDay(t);
  if (days <= 0) return { main: 'Today, at 11', note: 'see you at Udupi Aatithya' };
  if (days === 1) return { main: 'Tomorrow', note: 'Sunday, 11 in the morning' };
  return { main: `${days} days to go`, note: 'counting from today' };
}

// The message a guest receives with their link.
export function shareMessage(link, name = '') {
  const n = cleanName(name);
  return (
    `${n ? `Dear ${n}, ` : ''}Karan & Swathi are getting engaged on Sunday, 15 November 2026, ` +
    `at 11 in the morning, at Udupi Aatithya, Chamrajpet, Bengaluru. Your invitation: ${link}`
  );
}

// The invitation's address with the guest's name on it (no name: the plain
// address). Any query or fragment on the base is dropped.
export function personalLink(base, name = '') {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  const n = cleanName(name);
  return n ? `${url.href}?to=${encodeURIComponent(n)}` : url.href;
}

// A WhatsApp link that opens a chat with this text ready to send.
export function whatsappLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

const escapeText = (s) =>
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function buildIcs(event) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Karan and Swathi//Engagement Invitation//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.startUtc}-karan-swathi-engagement@invitation`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${event.startUtc}`,
    `DTEND:${event.endUtc}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

// RFC 5545 3.1: content lines longer than 75 octets are folded, CRLF then
// one space, never splitting a UTF-8 character.
export function foldIcsLine(line) {
  const enc = new TextEncoder();
  const parts = [];
  let cur = '';
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const max = parts.length ? 74 : 75; // continuation lines start with a space
    if (size + n > max) {
      parts.push(cur);
      cur = '';
      size = 0;
    }
    cur += ch;
    size += n;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

export function rollRotation(distancePx, radiusPx) {
  return (distancePx / (2 * Math.PI * radiusPx)) * 360;
}

// CSS cubic-bezier() as an easing function, so GSAP tweens use the exact
// curves from the design tokens without loading CustomEase.
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return sampleY(t);
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (hi - lo > 1e-7) {
      if (sampleX(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

export const EASE_OUT = cubicBezier(0.22, 1, 0.36, 1);
export const EASE_MOVE = cubicBezier(0.77, 0, 0.175, 1);

// Where v sits between start and end, clamped to 0..1 (0 when the range is empty).
export function segmentT(v, start, end) {
  if (end <= start) return v >= end ? 1 : 0;
  return Math.min(Math.max((v - start) / (end - start), 0), 1);
}

// Point on a cubic Bézier through p0..p3 ({x, y}) at parameter t.
export function bezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

// Two linked rings as one rigid body: centre (cx, cy), turned by angle
// degrees, ring centres `half` px either side. Each ring turns with the pair.
export function pairPose(cx, cy, angle, half) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * half;
  const dy = Math.sin(rad) * half;
  return {
    rose: { x: cx - dx, y: cy - dy, rotation: angle },
    gold: { x: cx + dx, y: cy + dy, rotation: angle },
  };
}

// Who draws the rings at lagged virtual scroll v (one scrubbed clock shared
// by the journey and the proposal): the journey below its end (#proposal's top
// at the viewport top), the proposal scene from there on. At v = end both draw
// the same pose (the linked pair at the hands), so the hand-over is seamless.
export function ringOwner(v, journeyEnd) {
  return v < journeyEnd ? 'journey' : 'proposal';
}

// Raw scroll with a pinned stretch [start, start + len] collapsed to start:
// how far the page content has actually moved.
export function collapsePin(raw, start, len) {
  if (raw <= start) return raw;
  return raw <= start + len ? start : raw - len;
}

// The SVG transform attribute for a ring's outer group. The stage level ring
// groups are written directly (not through GSAP's transform cache, which
// re-parses and drifts their origin after a ScrollTrigger refresh).
const num = (n) => +(+n).toFixed(3);
export function ringTransform({ x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1 }) {
  return `translate(${num(x)} ${num(y)}) rotate(${num(rotation)}) scale(${num(scaleX)} ${num(scaleY)})`;
}

// How close a ring (centre x, y, radius r) is to any of the text boxes
// ({ left, top, right, bottom }, same coordinates): 1 when it touches one,
// easing to 0 at `feather` px of clear space.
export function textProximity(x, y, r, rects, feather) {
  let gap = Infinity;
  for (const b of rects) {
    const dx = Math.max(b.left - x, 0, x - b.right);
    const dy = Math.max(b.top - y, 0, y - b.bottom);
    gap = Math.min(gap, Math.hypot(dx, dy) - r);
    if (gap <= 0) return 1;
  }
  const u = 1 - segmentT(gap, 0, feather);
  return u * u * (3 - 2 * u);
}
