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
  return lines.join('\r\n') + '\r\n';
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
