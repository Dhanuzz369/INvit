# Karan & Swathi Engagement Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One static, scroll-animated invitation page where two rings carry the guest from a sealed envelope to the proposal scene and the venue.

**Architecture:** `index.html` holds all copy and inline SVG (rings, envelope, couple). A fixed `#ring-stage` SVG layer holds the rings; GSAP ScrollTrigger timelines, scrubbed to scroll, move them between section anchors with MotionPathPlugin. Pure helpers (calendar file, maps URL, roll maths) live in `js/lib.js` and are unit tested with `node --test`.

**Tech Stack:** HTML, CSS, ES modules, GSAP 3.12.5 + ScrollTrigger + MotionPathPlugin from `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/`, Google Fonts (Great Vibes, Cormorant Garamond), Node 18+ for tests, Playwright (already available as the MCP browser) for screenshots.

**Spec:** `docs/superpowers/specs/2026-11-05-engagement-invitation-design.md`

## Global Constraints

- Palette tokens exactly: `--paper #F6ECE8`, `--ink #3E4A3D`, `--rose #B76E79`, `--gold #C9A66B`, `--sage #8FA58C`, `--card #FFFDFB`. Flat backgrounds; only the rings get metallic SVG gradients.
- Fonts: Great Vibes for names/section titles; Cormorant Garamond 400/500 (+italic) for everything else.
- Easing: entrances `cubic-bezier(0.22,1,0.36,1)`; on-screen moves `cubic-bezier(0.77,0,0.175,1)`; never `linear`/`ease` for UI motion (scrubbed scroll tweens use `ease: "none"` only because scroll is the clock).
- Animate only `transform` and `opacity`. No scroll event listeners; use ScrollTrigger / IntersectionObserver.
- Simple reveals: rise 32px + fade, 700ms, once.
- `prefers-reduced-motion: reduce` → no envelope animation, rings static, opacity-only fades, all content visible.
- No hyphens in copy. Real text for every detail (never baked into SVG).
- Venue: **Udupi Aatithya**, 11, 5th Main Rd, near Makkala Koota Park, Chikkanna Garden, Chamrajpet, Bengaluru, Karnataka. Coords `12.9570977,77.5703652`.
- Date/time: Sunday, 15 November 2026, 11:00 AM IST (Asia/Kolkata).
- Mobile first: `100dvh`, safe-area insets, `-webkit-tap-highlight-color: transparent`, `<meta name="theme-color" content="#F6ECE8">`.
- Caricatures are drawn from scratch in the style of the reference (§11c); never trace or embed the stock image.

## Review Focus

1. Guest scrolls fast or flicks back up mid-animation → rings must always sit at the position matching scroll (scrub, no one-shot tweens on the ring layer). Test: Task 5 step checks scroll to 0, bottom, middle in sequence.
2. Phone rotated / viewport resized after load → ring paths recompute (`ScrollTrigger.refresh()` on resize, paths built from live element rects via `invalidateOnRefresh`). Test: Task 5 resize check.
3. GSAP CDN fails to load → page must still show every detail and the directions button (content not hidden by default in CSS; JS adds `.js-anim` to `<html>` before hiding anything). Test: Task 8 check with GSAP blocked.
4. Opened inside WhatsApp/Instagram in-app browser → Get directions must open Maps (plain `<a href target="_blank" rel="noopener">`, no JS navigation). Test: Task 2 asserts the anchor attributes.
5. Calendar file opened in Google/Apple Calendar → correct 11:00 IST start (UTC `20261115T053000Z`), 3h duration, venue in LOCATION. Test: Task 1 unit tests.

---

### Task 1: Project scaffold and pure helpers

**Files:**
- Create: `package.json` (`"type": "module"`, script `"test": "node --test tests/"`), `.gitignore` (`.superpowers/`, `node_modules/`), `js/lib.js`, `tests/lib.test.js`

**Interfaces:**
- Produces (`js/lib.js`):
  - `EVENT` — `{ title: "Karan & Swathi Engagement", startUtc: "20261115T053000Z", endUtc: "20261115T083000Z", location: string, lat: 12.9570977, lng: 77.5703652 }`
  - `directionsUrl(lat: number, lng: number): string` → `https://www.google.com/maps/dir/?api=1&destination=12.9570977,77.5703652`
  - `buildIcs(event): string` — CRLF line endings, VCALENDAR/VEVENT with UID, DTSTAMP, DTSTART, DTEND, SUMMARY, LOCATION (commas escaped as `\,`)
  - `rollRotation(distancePx: number, radiusPx: number): number` → degrees = distance / (2πr) × 360

- [ ] **Step 1:** `git init` in the project folder; create `package.json` and `.gitignore`.
- [ ] **Step 2: Write failing tests** in `tests/lib.test.js`:
  - `directionsUrl(12.9570977, 77.5703652)` equals the exact URL above.
  - `buildIcs(EVENT)` contains `DTSTART:20261115T053000Z`, `DTEND:20261115T083000Z`, `SUMMARY:Karan & Swathi Engagement`, `LOCATION:Udupi Aatithya\, 11\, 5th Main Rd`, starts with `BEGIN:VCALENDAR\r\n`, ends with `END:VCALENDAR\r\n`.
  - `rollRotation(2 * Math.PI * 20, 20)` equals `360`; `rollRotation(0, 20)` equals `0`.
- [ ] **Step 3:** `npm test` → FAIL (module not found).
- [ ] **Step 4:** Implement `js/lib.js`.
- [ ] **Step 5:** `npm test` → all pass.
- [ ] **Step 6:** Commit `feat: scaffold project and invitation helpers`.

### Task 2: Page structure, copy and static styling

**Files:**
- Create: `index.html`, `css/styles.css`

**Interfaces:**
- Produces DOM ids later tasks animate: `#envelope` (with `button#open-invite`, `#seal`, `#flap`, `#letter`), `#hero` (`#hero-names`, `#tagline` with each word in `<span class="w">`), `#about` (`#ring-anchor-about`), `#details` (`#ring-anchor-details`, `.detail-row` ×4, `a#add-calendar`), `#proposal` (`#couple-stage`, `#ring-anchor-hands`), `#venue` (`a#directions`), `svg#ring-stage` (fixed, `aria-hidden`, contains `g#ring-rose` and `g#ring-gold`), `.reveal` class for rise+fade items.
- Consumes: `directionsUrl`, `buildIcs`, `EVENT` (Task 1).

- [ ] **Step 1:** Write `index.html` with all sections and copy from spec §7 verbatim (hero lines, About story §7.3, details rows with Whose/When/Where/How, venue block, closing "With love, Karan & Swathi" and "with the blessings of both families"). How row text: "Indo western or traditional; come as you are, come with love." Meta: title "Karan & Swathi are getting engaged", description "Sunday, 15 November 2026, 11:00 AM · Udupi Aatithya, Chamrajpet, Bengaluru", OG/Twitter tags (image URL filled in Task 8), theme-color, preconnect + fonts.
- [ ] **Step 2:** `a#directions` gets `href` = `directionsUrl(...)` written literally in HTML, `target="_blank" rel="noopener"`. `a#add-calendar` gets a `data:text/calendar` href set from `buildIcs` in `js/main.js` with `download="karan-swathi-engagement.ics"`.
- [ ] **Step 3:** `css/styles.css`: tokens, type scale (names `clamp(3.5rem, 14vw, 7rem)`), centred column max 36rem, engraved gold hairline frames, sage mehndi corner ornaments (inline SVG), detail card, primary button (rose fill, paper text, `:active` scale 0.97, 44px min height), `100dvh` sections, safe-area padding. Default state: everything visible. Hidden-before-animation states only under `html.js-anim`.
- [ ] **Step 4: Verify** in the browser pane at 390×844 and 1440×900: every detail readable, no horizontal scroll, directions link has correct href/target (`document.querySelector('#directions').href`).
- [ ] **Step 5:** Commit `feat: invitation page structure and styling`.

### Task 3: Envelope opening

**Files:**
- Create: `js/main.js` (entry, `type="module"`), `js/envelope.js`

**Interfaces:**
- Produces: `initEnvelope(): Promise<void>` — resolves when the letter has filled the screen; locks scroll (`html.locked { overflow:hidden }`) until then. Main awaits it before hero animation.

- [ ] **Step 1:** Implement: on `#open-invite` click/Enter → seal lifts (y −6, scale 1.08) and fades, flap rotates X 0→180 (perspective on parent, `transform-origin: top`), letter rises out and scales to fill, envelope fades; total ≈1.4s, ease-out curve. Reduced motion: skip, resolve immediately.
- [ ] **Step 2: Verify** in browser: tap opens, scroll unlocked afterwards, keyboard Enter works, no layout shift.
- [ ] **Step 3:** Commit `feat: sealed envelope opening`.

### Task 4: Rings and hero drop

**Files:**
- Create: `js/rings.js`
- Modify: `index.html` (ring SVG markup in `#ring-stage`)

**Interfaces:**
- Produces: `RING_RADIUS = 34` (px in stage units); `dropRings(): gsap.core.Timeline`; `revealTagline(): void`.

- [ ] **Step 1:** Draw rings: `g#ring-rose` (rose gold band, linearGradient `#E8B4B8→#B76E79→#8E4F58`, round brilliant solitaire with white/blush facets on a small setting) and `g#ring-gold` (plain band, gradient `#F1D9A8→#C9A66B→#9C7A43`). Thin highlight stroke for shine.
- [ ] **Step 2:** `dropRings`: both start `y: -60vh`, staggered 0.15s, fall to hero positions (rose left, gold right, ±8° tilt) with `ease: "back.out(1.6)"` 1.1s, then names fade/rise in, then `revealTagline` (each `.w` from opacity 0.3 to 1 as it crosses 70% viewport, ScrollTrigger scrubbed).
- [ ] **Step 3: Verify** screenshot after opening at 390×844: rings sit above names, nothing overlaps text.
- [ ] **Step 4:** Commit `feat: ring drop hero`.

### Task 5: Ring journey — meet and roll

**Files:**
- Create: `js/journey.js`

**Interfaces:**
- Consumes: `RING_RADIUS`, `rollRotation` (Task 1), anchors `#ring-anchor-about`, `#ring-anchor-details`, `#ring-anchor-hands`.
- Produces: `initJourney(): void` — one master ScrollTrigger timeline (`scrub: 0.8`, `invalidateOnRefresh: true`) from hero to proposal; label `"hands"` at the point rings reach `#ring-anchor-hands` (Task 7 hooks onto it).

- [ ] **Step 1:** Segment A (hero → About): rings travel on mirrored curves and interlock at `#ring-anchor-about` (gold ring overlaps rose by 0.6×radius, gold drawn on top except one clip path so they look linked). Brief sparkle (scale 0→1→0 star group) when they meet.
- [ ] **Step 2:** Segment B (About → Details): interlocked pair follows an S curve (MotionPathPlugin, path computed from live anchor rects in a function so refresh recalculates) while rotating by `rollRotation(pathLength, RING_RADIUS)`; ends resting on the top edge of the details card. Detail rows reveal one by one.
- [ ] **Step 3:** Segment C (Details → Proposal): pair glides to `#ring-anchor-hands`; add label `"hands"`.
- [ ] **Step 4:** Resize handling: `ScrollTrigger.refresh()` after debounced `resize`/`orientationchange` (200ms).
- [ ] **Step 5: Verify** (Review Focus 1, 2): scroll to bottom, top, middle quickly via `window.scrollTo`; screenshot each; rings match section. Resize 390→820 wide and re-check.
- [ ] **Step 6:** Commit `feat: scroll ring journey`.

### Task 6: Couple caricature SVG

**Files:**
- Create: `assets/couple.svg` (source of truth), inlined into `#couple-stage` in `index.html`

**Interfaces:**
- Produces named groups: `#groom` > `#groom-head`, `#groom-torso`, `#groom-arm-l`, `#groom-arm-r` (holds ring), `#groom-leg-front`, `#groom-leg-back`; `#bride` > `#bride-head`, `#bride-torso`, `#bride-arm-l`, `#bride-arm-r`, `#bride-hand` (`#ring-finger` point), `#dupatta`; each limb group has its pivot set via `transform-origin` comment. Poses: standing default; kneel achieved purely by transforms in Task 7.

- [ ] **Step 1:** Draw in the reference style (§11c): big heads (~1/4 height), glossy eyes with highlights, rosy cheeks, dark outlines (stroke `#2B211D`, 2.5px), flat fills + one shade tone. Groom: tousled dark brown hair, light stubble, ivory sherwani with gold buttons, gold dupatta on one shoulder, cream churidar, mojaris. Bride: shy smile, dark hair with jasmine, maang tikka, nath, earrings, bangles, deep rose lehenga (`#A9505E` / shade `#8C3F4C`) with gold border, blush dupatta over head and shoulder. Warm Indian skin tones (`#C98F6B` groom, `#D9A27F` bride).
- [ ] **Step 2: Verify:** render standing pose and a test kneeling pose (apply Task 7 transforms by hand) in the browser; screenshot both next to the reference. Anti-goal check (spec §4): proportions consistent, faces charming, no stiff limbs. Redraw until it passes; if it cannot pass, stop and report to the user.
- [ ] **Step 3:** Commit `feat: couple caricature`.

### Task 7: Proposal sequence and venue

**Files:**
- Create: `js/proposal.js`

**Interfaces:**
- Consumes: label `"hands"` from Task 5, groups from Task 6.
- Produces: `initProposal(): void` (pinned section, scrub).

- [ ] **Step 1:** Pinned `#proposal`, scrubbed timeline: (1) couple stands holding joined rings between them; (2) rings separate, gold ring hides behind groom's hand; (3) groom kneels: torso y down, back leg rotates to knee on ground, front leg bends 90°, head tilts up; (4) bride extends hand; (5) rose ring travels from groom's hand to `#ring-finger` and settles (scale 1→0.6); (6) glint on ring, 14 petals (jasmine white + marigold `#E8833A`) drift down with random x/rotation, 5 small hearts rise; bride's cheeks blush up.
- [ ] **Step 2:** After unpin, venue block and closing line reveal (rise+fade).
- [ ] **Step 3: Verify** screenshots at 0%, 50%, 100% of the pinned range on 390×844; ring visibly on her finger at the end.
- [ ] **Step 4:** Commit `feat: proposal scene`.

### Task 8: Resilience, accessibility, sharing

**Files:**
- Modify: `index.html`, `css/styles.css`, `js/main.js`
- Create: `assets/og.jpg` (1200×630)

- [ ] **Step 1:** `main.js` adds `html.js-anim` only after GSAP loaded and registered; otherwise the page stays fully static and readable (Review Focus 3).
- [ ] **Step 2:** Reduced motion path per Global Constraints; proposal shows final kneeling pose static.
- [ ] **Step 3:** A11y: proposal scene `role="img"` with `aria-label="Karan kneels and places the ring on Swathi's finger"`; decorative SVG `aria-hidden`; visible focus rings.
- [ ] **Step 4:** OG image: screenshot the hero (rings + names) at 1200×630 into `assets/og.jpg`; OG/Twitter tags use absolute URL of the deployed site (placeholder `https://karan-swathi.vercel.app` replaced in Task 9).
- [ ] **Step 5: Verify:** (a) block `cdnjs.cloudflare.com` in the browser, reload: all details visible, directions works; (b) emulate reduced motion: all content visible, no movement; (c) run `npm test`; (d) Lighthouse-style check: no console errors, no horizontal scroll at 360px.
- [ ] **Step 6:** Commit `feat: fallback, accessibility and share preview`.

### Task 9: Deploy (needs user's go-ahead)

- [ ] **Step 1:** Ask the user before deploying; deploy as a static Vercel project; set OG URLs to the final domain; redeploy.
- [ ] **Step 2: Verify** on the live URL at phone size; give the user the link.
