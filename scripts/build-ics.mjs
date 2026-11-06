// Writes the static calendar file the "Add to calendar" links point to, from
// the same confirmed facts the page uses (js/lib.js). Run after changing
// EVENT: npm run build:ics
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EVENT, buildIcs } from '../js/lib.js';

const out = fileURLToPath(new URL('../assets/karan-sowmya-engagement.ics', import.meta.url));
writeFileSync(out, buildIcs(EVENT));
console.log(`wrote ${out}`);
