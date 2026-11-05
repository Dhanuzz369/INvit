import {
  SITE_URL, cleanName, countdown, guestFromSearch, personalLink, shareMessage, whatsappLink,
} from './lib.js';

// The live invitation: what is different for each guest and each day. None of
// it needs GSAP, and the page reads completely without it: without script the
// envelope says "For you, with love", the card has no greeting line, the
// facts row has no countdown and the hosts' link tool stays hidden.

// The guest's name from ?to=… on the envelope ("For Ananya & family") and on
// the card ("Dear Ananya & family, please come and bless us."). Written as
// text, never as markup.
function addressTheGuest() {
  const guest = guestFromSearch(location.search);
  if (!guest) return;
  const forLine = document.querySelector('[data-guest-for]');
  if (forLine) forLine.textContent = `For ${guest}`;
  const dear = document.querySelector('[data-guest-dear]');
  const name = dear?.querySelector('[data-guest-name]');
  if (dear && name) {
    name.textContent = guest;
    dear.hidden = false;
  }
}

// "10 days to go" in the facts row, kept true while the page stays open.
function startCountdown() {
  const fact = document.querySelector('[data-countdown]');
  const main = fact?.querySelector('[data-countdown-main]');
  const note = fact?.querySelector('[data-countdown-note]');
  if (!fact || !main || !note) return;
  const paint = () => {
    const c = countdown(new Date());
    if (!c) return;
    if (main.textContent !== c.main) main.textContent = c.main;
    if (note.textContent !== c.note) note.textContent = c.note;
    fact.hidden = false;
  };
  paint();
  setInterval(paint, 10 * 60 * 1000);
}

// For the hosts: type a guest's name, get their link to copy or send on WhatsApp.
function initHostTool() {
  const tool = document.querySelector('[data-host-tool]');
  if (!tool) return;
  const input = tool.querySelector('#guest-name');
  const out = tool.querySelector('#guest-link');
  const copy = tool.querySelector('[data-copy-link]');
  const send = tool.querySelector('[data-send-link]');
  const status = tool.querySelector('.host-tool__status');
  if (!input || !out || !copy || !send || !status) return;

  // The page's own address when it is served (any host), the canonical one
  // when it is opened from a file.
  const base = /^https?:$/.test(location.protocol) ? location.origin + location.pathname : SITE_URL;
  const update = () => {
    const name = cleanName(input.value);
    const link = personalLink(base, name);
    out.value = link;
    send.href = whatsappLink(shareMessage(link, name));
    status.textContent = '';
  };
  input.addEventListener('input', update);
  out.addEventListener('focus', () => out.select());
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(out.value);
      status.textContent = 'Copied. Paste it into your message.';
    } catch {
      out.focus();
      out.select();
      status.textContent = 'The link is selected: copy it with your keyboard, or press and hold.';
    }
  });
  update();
  tool.hidden = false;
}

// The muted loop plays only while it can be seen, and never under reduced
// motion (then the poster frame shows instead).
function calmVideos() {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  for (const video of document.querySelectorAll('video[autoplay]')) {
    let seen = !('IntersectionObserver' in window);
    const sync = () => {
      if (calm.matches) {
        if (video.hasAttribute('autoplay')) {
          video.removeAttribute('autoplay');
          video.pause();
          video.load(); // back to the poster
        }
        return;
      }
      if (seen) video.play().catch(() => {});
      else video.pause();
    };
    if (!seen) {
      new IntersectionObserver((entries) => {
        seen = entries[entries.length - 1].isIntersecting;
        sync();
      }).observe(video);
    }
    calm.addEventListener?.('change', sync);
    sync();
  }
}

export function initLive() {
  for (const step of [addressTheGuest, startCountdown, initHostTool, calmVideos]) {
    try {
      step();
    } catch (err) {
      console.error(err); // one part failing never stops the others
    }
  }
}
