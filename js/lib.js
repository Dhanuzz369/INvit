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
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

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
    `SUMMARY:${event.title}`,
    `LOCATION:${escapeText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

export function rollRotation(distancePx, radiusPx) {
  return (distancePx / (2 * Math.PI * radiusPx)) * 360;
}
