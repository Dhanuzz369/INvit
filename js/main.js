import { EVENT, buildIcs } from './lib.js';

// Calendar links: an .ics file generated in the page from confirmed facts only.
const icsHref = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(buildIcs(EVENT));
document.querySelectorAll('#add-calendar, [data-ics]').forEach((link) => {
  link.href = icsHref;
});
