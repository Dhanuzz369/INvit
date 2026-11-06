// The rose burst: when the ring is on her finger, red rose petals (and a few
// jasmine) burst out from her hand across the whole screen, flutter down and
// clear. Time based, not scrubbed: a celebration plays out at its own pace
// even if the guest keeps scrolling. One fixed layer, plain elements moved by
// transform and opacity only, 60 petals; nothing runs until it fires and the
// ticker callback leaves as soon as the last petal has gone.
//
// Each petal's path is closed form (no integration, so a slow frame never
// throws it off): velocity eases exponentially from its launch velocity to a
// gentle falling drift, p(t) = p0 + vEnd·t + (v0 − vEnd)·(1 − e^(−k·t)) / k,
// plus a sideways flutter that grows as the launch speed dies away.

const ROSES = 48;
const JASMINE = 12;
const LIFE = 5.4; // s, the longest a petal lives
const FADE = 1; // s of fading at the end of a life
const DRAG = 2; // 1/s: how fast the launch speed gives way to the drift

// Petals as small SVGs in flat colours: rose petals (broad, notched at the
// top, narrowing to the base, the base a shade deeper) and a jasmine petal.
const svg = (body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-8 -8 16 16'>${body}</svg>`)}")`;
const PETAL = 'M0 7 C -2.6 5.6, -7 1.6, -6.8 -2.6 C -6.6 -6.2, -2.8 -7.4, 0 -5.4 C 2.8 -7.4, 6.6 -6.2, 6.8 -2.6 C 7 1.6, 2.6 5.6, 0 7 Z';
const BASE = 'M0 7 C -1.8 5.8, -3.6 3.4, -3.2 1.4 C -1.6 2.4, 1.6 2.4, 3.2 1.4 C 3.6 3.4, 1.8 5.8, 0 7 Z';
const ROSE = svg(`<path d='${PETAL}' fill='#B3263A'/><path d='${BASE}' fill='#8C1B2B'/>`);
const ROSE_LIGHT = svg(`<path d='${PETAL}' fill='#CC3A4D'/><path d='${BASE}' fill='#A32235'/>`);
const ROSE_DEEP = svg(`<path d='${PETAL}' fill='#94192B'/><path d='${BASE}' fill='#6E1220'/>`);
const JAS = svg(
  "<path d='M0 -7 C 3.6 -3.6, 3.6 3.6, 0 7 C -3.6 3.6, -3.6 -3.6, 0 -7 Z' fill='#FFFDF6' stroke='#B89A6A' stroke-width='0.7'/>"
);

// Small seeded PRNG: the burst looks the same every time.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A petal's place at t seconds after launch (closed form, see above).
export function petalAt(p, t) {
  const e = (1 - Math.exp(-DRAG * t)) / DRAG;
  const grown = 1 - Math.exp(-1.6 * t); // the flutter grows as the burst calms
  return {
    x: p.x0 + p.vx1 * t + (p.vx0 - p.vx1) * e + Math.sin(t * p.w + p.phase) * p.sway * grown,
    y: p.y0 + p.vy1 * t + (p.vy0 - p.vy1) * e,
  };
}

export function createBurst(gsap) {
  const layer = document.createElement('div');
  layer.className = 'burst';
  layer.setAttribute('aria-hidden', 'true');
  const random = rng(1511);
  const petals = [];
  for (let i = 0; i < ROSES + JASMINE; i++) {
    const el = document.createElement('span');
    el.className = 'burst__petal';
    const jasmine = i >= ROSES;
    el.style.backgroundImage = jasmine ? JAS : [ROSE, ROSE_LIGHT, ROSE, ROSE_DEEP][i % 4];
    layer.appendChild(el);
    petals.push({
      el,
      jasmine,
      // half the roses fall from above across the whole width, the rest burst from the hand
      rain: !jasmine && i % 2 === 0,
      r: random(), // reused below for spread, speed, size, spin
      r2: random(),
      r3: random(),
      r4: random(),
    });
  }
  document.body.appendChild(layer);

  let start = -1;
  let running = false;

  function launch(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // launch speed scales with the screen, each way on its own (a phone is
    // narrow and tall): the burst reaches the sides and the top, not past them
    const reachX = vw * 1.5;
    const reachY = vh * 1.25;
    for (const p of petals) {
      const size = ((p.jasmine ? 15 : 20) + p.r3 * (p.jasmine ? 9 : 16)) * Math.min(Math.max(vw / 390, 1), 1.4);
      p.size = size;
      p.delay = 0;
      if (p.rain) {
        // falling across the whole screen from above, a moment after the burst
        p.x0 = p.r * vw;
        p.y0 = -size - p.r2 * vh * 0.3;
        p.vx0 = (p.r4 - 0.5) * 120;
        p.vy0 = 260;
        p.delay = 0.1 + p.r2 * 0.7;
      } else {
        // out from her hand: up and to both sides (her hand is low on the
        // screen, so they rise well up before they drift down)
        const a = -Math.PI * (0.06 + 0.88 * p.r);
        const v = 0.55 + 0.65 * p.r2;
        p.x0 = x;
        p.y0 = y;
        p.vx0 = Math.cos(a) * v * reachX;
        p.vy0 = Math.sin(a) * v * reachY;
        p.delay = p.r4 * 0.08;
      }
      p.vx1 = (p.r4 - 0.5) * 50; // the drift: slow, slightly sideways
      p.vy1 = 120 + p.r3 * 110; // falling
      p.sway = 10 + p.r * 22;
      p.w = 2.2 + p.r2 * 2.6;
      p.phase = p.r3 * 6.28;
      p.rot0 = p.r * 360;
      p.spin = (p.r2 < 0.5 ? -1 : 1) * (120 + p.r4 * 300);
      p.flip = 1.8 + p.r * 2.4;
      p.life = LIFE - p.r3 * 0.8;
      p.el.style.width = `${size}px`;
      p.el.style.height = `${size}px`;
      p.el.style.opacity = '0';
    }
  }

  function draw(now) {
    const t0 = (now - start) / 1000;
    let alive = 0;
    const bottom = window.innerHeight + 40;
    for (const p of petals) {
      const t = t0 - p.delay;
      if (t <= 0) continue;
      const { x, y } = petalAt(p, t);
      const gone = t >= p.life || y > bottom;
      if (gone) {
        if (p.el.style.opacity !== '0') p.el.style.opacity = '0';
        continue;
      }
      alive++;
      const fade = Math.min(t / 0.08, 1, (p.life - t) / FADE);
      const flip = Math.cos(t * p.flip * Math.PI);
      const sx = Math.abs(flip) < 0.35 ? 0.35 * Math.sign(flip || 1) : flip; // turning over as it falls
      p.el.style.transform =
        `translate3d(${(x - p.size / 2).toFixed(1)}px, ${(y - p.size / 2).toFixed(1)}px, 0) ` +
        `rotate(${(p.rot0 + p.spin * t).toFixed(1)}deg) scale(${sx.toFixed(3)}, 1)`;
      p.el.style.opacity = fade.toFixed(3);
    }
    return alive > 0 || t0 < 1.2;
  }

  function tick() {
    if (!draw(performance.now())) stop();
  }

  function stop() {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
    layer.classList.remove('is-on');
  }

  return {
    // burst from (x, y), viewport px
    fire(x, y) {
      launch(x, y);
      start = performance.now();
      layer.classList.add('is-on');
      if (!running) {
        running = true;
        gsap.ticker.add(tick);
      }
    },
    stop,
    remove() {
      stop();
      layer.remove();
    },
  };
}
