# Karan & Swathi: the portrait scene

Branch `feature/invitation` · 6 November 2026 · follows `.taste-skill/redesign-report.md`

Client's request: "instead of the caricature use this image and make it interesting … after the inserting ring animation the venue should be loaded and on top of that this should be there."

## What changed

| Part | Before | Now |
| --- | --- | --- |
| Proposal scene | SVG caricature on a square paper plate (Karan kneels, reaches, ring onto her finger), 50/50 split with beats, title and two action cells | The couple's own portrait (`assets/karan-swathi-portrait.webp`, JPEG fallback through `<picture>`), mounted like the invitation card: a paper-step mat with scooped corners, no outline, no shadow, hung on an **ink ground** (the page's one dark room, distinct from the green programme before it and the green footer after it). Text column: the three beats (the playing one now carries the page's diamond instead of a tone change, since a muted tone fails contrast on the dark ground), "Will you, Swathi?" → "She said yes", the line under it. |
| Pinned motion (3 viewports, scrubbed, one lagged clock with the ring journey as before) | kneel → reach → ring → petals, hearts | 0–0.72 slow push-in on the picture (scale 1 → 1.08 about 54% 66%, between their faces and her hands) · 0–0.08 the linked pair settles on the bouquet · 0.10–0.30 the rings part: hers lifts in a small arc to wait above her hand; his band drifts to Karan's side (by his watch) and fades out over 0.18–0.34 ("tucked away") · 0.30–0.50 her ring glides down onto her ring finger, shrinking to finger size, turning −15° to stand across the finger and narrowing to a side-on ellipse, with a small bow toward Karan · 0.48–0.58 glint, then a soft shimmer that stays (ticker only while the scene is on screen) · 0.48–0.80 twelve jasmine and rose petals drift down the two edge lanes and over the bouquet, never across the faces · 0.56–0.66 "She said yes" rises, the question steps away · 0.74–0.88 the visit card rises 48px and fades in **over the portrait** · hold to 1.0. Everything is transform/opacity; scrolling back reverses exactly. |
| Venue | Separate full-bleed section on James Hunter's 1792 watercolour of Tipu Sultan's palace, sticky visit card, caption | The visit card (`<section id="venue">`, now inside `#proposal`) is laid over the portrait. Screens ≥ 83rem wide and ≥ 52.5rem tall: over Karan's sleeve on the portrait's right side, starting below his face and well right of her hands, reaching out onto the ground. Elsewhere (phones, tablets, short laptops): it follows the portrait and overlaps the mat's foot (mat + 8px of picture, below her fingertips), inset by the mat width so the mat's scooped corners show; there it is out of sight while pinned and comes fully into view as the pin lets go. Contents unchanged: Udupi Aatithya, address, Sunday · 15 November 2026, Ring ceremony · 11:00 AM, Lunch · 12:30 PM (sample), Get directions (`#directions`, same Maps URL), and now both former action cells as links: Add to calendar (`#add-calendar`, `data-ics`) and Share the invitation (`data-share`). |
| "Venue" links, `#venue` deep link, keyboard | Ordinary anchor jump | Scroll to where the card has arrived (late in the pin when it is laid over the side; just past the pin otherwise) and focus the card; tabbing into a card link before it has arrived scrolls there too. Measured: desktop nav and deep link land with the card fully in (top 253px); phone nav lands with the card top at 84px. |
| Footer credits | Six found pictures + "Drawings of Karan, Swathi and the rings are our own." | Watercolour credit removed; ends "The portrait of Karan and Swathi is their own, and so are the drawings of the rings." |

Fallbacks: **no GSAP** – the portrait is static, "Will you, Swathi?", the card visible and readable over the portrait (absolute on wide screens, at its foot elsewhere). **Reduced motion** – no pin, no push-in, no petals; the final state: solitaire on her finger (the journey's hands rest, placed with the same mapping), "She said yes", "The yes" marked, card visible. **Mid-init error** – `fallBack()` clears GSAP state, `stopProposal()` removes the petals, the push-in and the card's inline styles; verified with a forced throw in `initJourney` at 1440 and 390 (static page, nothing pinned, card readable).

Accessibility: the portrait has `alt="Illustrated portrait of Karan and Swathi; Swathi holds red roses and looks up at Karan."`; "She said yes" stays in the accessibility tree (opacity only); the card is never hidden from assistive tech (opacity only, `pointer-events: none` while it is mostly transparent). WhatsApp copy never mentioned the caricature: unchanged.

## Ring target maths

The finger: picture pixel (568, 1426) of 1024 × 1536 (checked on a 2× crop: the gold band already on the ring finger of her hand nearest Karan). New pure function `coverPoint(pt, natural, box, pos, zoom)` in `js/lib.js`:

```
s  = max(box.w / 1024, box.h / 1536)                 // object-fit: cover
ox = (box.w − 1024·s) · pos.x,  oy = (box.h − 1536·s) · pos.y   // object-position (fractions)
p  = (ox + x·s, oy + y·s)                            // in the frame, before the push-in
p' = origin + (p − origin) · k                       // push-in k about transform-origin (px)
screen = box.left/top + p',   scale = s · k          // screen px per picture px
```

`measure()` (on every ScrollTrigger refresh only) reads the frame's rect relative to `#proposal`'s top, the img's computed `object-position` (`objectPositionFractions()`) and `transform-origin`; each frame then evaluates `coverPoint` at the current `k`, so the ring tracks the finger through the push-in. On the finger the ring's outer radius is 15 picture px (`FINGER_R`, just covering her own band), `scaleY = scale · 15 / 34`, `scaleX = 0.55 · scaleY`, rotation −15°. The glint sits over the stone along the ring's rotated up axis. Tests (`tests/portrait.test.js`): uncropped, cropped top/bottom with object-position, cropped sides, push-in about an origin, push-in on a cropped phone box, object-position parsing.

**Measured landing error** (ring centre written to `#ring-rose` vs. the finger point computed independently in the page from the img's rendered, transformed rect):

| Viewport | Mode | Error | Ring outer radius on screen |
| --- | --- | --- | --- |
| 1440 × 900 | pin 50 / 65 / 80 / 100%, after the pin, scrolled back to 50% | 0.25 px | 8.1–8.2 px |
| 390 × 844 | same | 0.19 px | 5.3 px |
| 390 × 664 (3:4 crop) | pin 66% | 0.19 px | |
| 768 × 1024 | pin 66% | 0.09 px | |
| 1024 × 768 | pin 66% | 0.09 px | |
| 1440 × 900 / 390 × 844 | reduced motion | 0 px | 7.6 / 5.0 px |

## Choices

- **Ink ground, paper-step mat, paper card.** On the green field the paper card would have merged with a paper mat where it crosses it; a mat one tone down keeps the card visibly "on top". Ink makes the portrait the room's only light. Notches use a new `--notch-ink` (same SVG as `--notch`, ink fill); notch radius = mat width.
- **Gold band**: drifts to Karan's side and fades (his hands are not in the picture; a glint there would read as a stray mark).
- **Rings arrive** on the bouquet's black wrap (`#ring-anchor-hands` at 46% / 76%), where both metals read clearly, then shrink.
- **Overlay only where it fits**: the card is ~590px tall at the 88px title size; laid over the side it needs ≥ 83rem × 52.5rem to stay below Karan's face and inside the picture. Smaller desktops use the foot overlap and a centred two-column layout (text | portrait).
- **Static fallback keeps the question** ("Will you, Swathi?"), as before; reduced motion shows the answer.
- Beat labels kept ("One knee · The ring · The yes"): the question was asked on one knee, the picture need not show it.
- Address now balances its own line breaks (the hard `<br>` orphaned "Park," in narrow cards).

## Removed

`assets/couple.svg`, `js/couple-poses.js`, `tests/couple-poses.test.js`, the inlined `#couple-svg`/`#couple-stage`, the plate and action-cell CSS, the venue section CSS and drift keyframes, `assets/found/tipu-palace-1792.webp` and its entry in `assets/found/credits.json`, its imprint credit. Kept contracts: `#proposal`, `#ring-anchor-hands`, `#proposal-yes`, `#directions`, `#add-calendar`, `[data-ics]`, `[data-share]`, `.reveal`. New: `#portrait`, `#venue` inside `#proposal`, `--venue-over`. Spec addendum in `docs/superpowers/specs/2026-11-05-invitation-redesign.md`.

## Verification

- `npm test`: 47 pass, 0 fail (the caricature tests went with it; new: 6 mapping tests, 2 page tests, beat timings updated).
- `lint.mjs index.html css js`: 0 FAIL, 0 WARN.
- `inspect.mjs http://127.0.0.1:8765/index.html?to=Ananya%20%26%20family#hero`: **0 FAIL, 2 WARN** (same two as the redesign, defended the same way):
  - `pinned-over-picture` ("Will you, Swathi?", "She said yes", "Udupi Aatithya"): the titles sit on the ink ground; the "picture" under them is the transparent full-viewport ring layer the meter counts as an image. The visit card held over the portrait is the client's request.
  - `long-pin` ("Karan & Swathi", "With love,"): the curtain footer waits under the page, invisible until uncovered (the signature move).
- playwright-core (Chrome) runs at 390 × 844 and 1440 × 900: envelope → hero → programme → pin 0/20/40/50/65/80/100% → after the pin (card over the portrait) → curtain → end → back to pin 50% (card gone, "Will you, Swathi?" back, ring still on the finger) → before the pin (rings back on the glide) → programme. Same for reduced motion and cdnjs blocked; extra sizes 390 × 664, 768 × 1024, 1024 × 768; mid-init error at both sizes; Venue nav click and `#venue` deep link. No page errors (blocked-CDN runs log only the three refused script loads). Shots: `.taste-skill/shots/portrait-*.png` (git-ignored).

## Concerns

- At phone width the solitaire on her finger is small (outer radius ≈ 5 CSS px; ≈ 15 device px on a 3× screen). It is the true scale of a ring on that hand; the glint and shimmer carry it. `FINGER_R` in `js/proposal.js` is the one knob if the couple want it bolder.
- On wide screens the card covers Karan's sleeve and watch hand; on phones its top edge covers the last 8px of the picture (below her fingertips).
- Real phones have a shorter `svh` than headless 844px; the 390 × 664 run shows the 3:4 crop (top of Karan's hair trimmed first, ring hand intact).
- `assets/og.jpg` does not show the portrait; the couple may want the portrait in the share preview.
- Not deployed.

---

## v3, 6 November 2026: the client's change list (phone first)

Most guests will open it from a WhatsApp link, so this pass was designed and checked at 360 × 740, 390 × 844 and 430 × 932 first, then at 1440 × 900. Commits: `730c858` (the bride's name), `7f188fc` (content and phone pass), `34034a5` (portrait fit and rose burst).

| # | Request | Done |
| --- | --- | --- |
| 1 | Swathi → **Soumya** | Title, meta/OG/Twitter, envelope, hero h1, alt text, aria-labels, the scene, footer sign-off, WhatsApp text (static links + `shareMessage`), host tool (uses `shareMessage`), calendar (`npm run build:ics` → `assets/karan-soumya-engagement.ics`, SUMMARY/PRODID renamed; the **UID is kept** so a calendar that already imported the event updates it instead of adding a second one), portrait files renamed `karan-soumya-portrait.*`, tests. **Share preview `assets/og.jpg` regenerated** (it showed "Swathi"). Monogram stays "K & S". |
| 2 | Remove coffee, lamps clip, mallige | Removed from the page; `assets/found/` deleted entirely. |
| 3 | Remove "How it began" + story | Gone. The section is now a compact "day at a glance" on paper: `#ring-anchor-about` centred above the facts row (2 × 2 on a phone, one row on wider screens). The rings still link there; the journey's text-fade list was updated. "Our story" left both menus. |
| 4 | Remove "Will you, Swathi?" | Gone. The heading is only "She said yes", invisible (place kept, so nothing shifts) until the ring lands, then it rises in. Without motion it simply shows; the beats show "The yes". |
| 5 | Whole portrait, both heads | The frame is always exactly 2:3 with `object-fit: contain`; on phones it is as wide as the screen allows, or as tall as the space under the text allows (`--pic-w = min(avail width, (100svh − text reserve − mat) × 2/3)`), never cropped. The push-in is now 4% about 54% 28%, so the tops of both heads and the ring hand stay inside the frame (unit test + measured in the browser at every pin step, all sizes: `headsInside` true). `fitPoint()` (lib.js) handles contain and cover; the scene reads the img's computed `object-fit`. |
| 6 | Full-screen rose burst | `js/burst.js`: 48 rose petals (three reds, flat, notched petal shape with a deeper base) + 12 jasmine. Half burst from her hand up and out across the whole screen, half fall from above across the full width, all flutter, turn and clear in ~5 s. Time based (closed-form paths, no integration), transform/opacity only, one fixed `contain: strict` layer shown only while it plays. Fires once per forward crossing of the landing (re-armed below 0.36), never when a jump lands past the scene; none under reduced motion. Petals on screen at peak ≈ 44 of 60 at 390 × 844; frame times 16.7 ms median / 16.8 ms p95 at 360, 390, 430 and 1440 wide. |
| 7 | Remove credits + stamps | Credits line and the jasmine/marigold stamps removed. The page now holds only the couple's portrait and our own drawings (envelope, rings, ornaments). |
| 8 | Contact | Footer: "Call or message us" with three thumb-sized bars (56px): `+91 90353 18232`, `+91 77602 38191`, `+91 98449 42141` as `tel:+91…` links, each with a "WhatsApp" link to `https://wa.me/91…`. Visit card: a compact "Call us" row with the same three `tel:` links (48px each). No names. |
| 9 | Programme | "Udupi lunch · 12:30" is a plain, non-expandable row (no plus; its time lines up with the others); the menu is gone. "What to wear" removed; no other dress-code mention remains (test). |
| 10 | Mobile pass | 16px gutters; no horizontal scroll at 360/390/430 (scrollWidth = clientWidth, measured); every visible link/button ≥ 48px (measured, all sizes; top-row links, monogram and the "Getting there" link fixed); body 18px on phones; pinned scene fits 100svh with its text (text block fills exactly the space above the portrait); visit card fully readable (address balances its lines); the portrait is `loading="lazy"` with a low-priority `preload`, and closed programme panels have no box. The no-longer-needed video code was removed from live.js. |

### Ring landing (ring centre vs. finger point computed from the rendered picture)

| Viewport | Frame | Error after landing | Ring outer radius |
| --- | --- | --- | --- |
| 360 × 740 | 308 × 462 | 0.25–0.45 px | 4.7 px |
| 390 × 844 | 338 × 507 | 0.14 px | 5.1 px |
| 430 × 932 | 378 × 567 | 0.17 px | 5.8 px |
| 1440 × 900 | 520 × 780 | 0.12 px | 7.9 px |
| all, reduced motion | | 0 px | |

### Verification

- `npm test`: 55 pass, 0 fail (new: contain fit, push-in keeps heads and hand inside, Soumya everywhere visible, no question, no found pictures/credits/video, plain lunch row and no dress code, the three numbers with tel: and WhatsApp in the footer and by the venue).
- `lint.mjs index.html css js`: 0 FAIL, 0 WARN.
- `inspect.mjs …#hero`: 1 FAIL, 4 WARN. **Recorded, not fixed (client's decision):** `few-pictures` (1 picture: the couple's portrait) and `no-footage` (the lamps clip was removed on request). Defended: `grey-body` (the programme bars, paper on the bar tone, 4.66:1, are now the most common running text since the story left; AA, the design system's bar tone); `pinned-over-picture` and `long-pin` (the ring layer counted as a picture, the card laid over the portrait by request, the curtain footer), as before. Two findings fixed on the way: a phantom "eyebrow" from a closed programme panel that still had a layout box, and footer numbers counted as covered large text.
- Scripted runs (Chrome via playwright-core) at 360 × 740, 390 × 844, 430 × 932, 1440 × 900: envelope → hero → day at a glance → programme → pin 0/30/47% → ring lands (burst) → 80/100% → visit card → footer → end → back to pin 40% → before the pin → glance → hero; no page errors. Same at all four sizes with reduced motion (ring on finger, "She said yes", card, no burst) and with cdnjs blocked (static, whole portrait, card readable, "She said yes"); mid-init error at 1440 and 390 falls back to the static page. Burst frames at 0.45/0.9/1.5/2.3/3.3/5.2 s at each size. Shots: `.taste-skill/shots/v3-*.png`.

### Concerns

- The deployed address `karan-swathi.vercel.app` still contains "swathi" and appears in the WhatsApp message and the OG URL; changing it needs the Vercel project/domain renamed first (not done; not deployed). `package.json`'s package name and the repo folder also still say swathi (not seen by guests).
- With the story and pictures gone, the "day at a glance" band is deliberately short; the page is 7.9 screens at 1440.
- The visit card is laid over the portrait only on screens ≥ 90rem × 52.5rem (it is taller now with "Call us"); elsewhere, phones included, it overlaps the portrait's foot after the pin.
- The solitaire is small on phones (4.7–5.8 px radius), true to the hand's scale; `FINGER_R` in js/proposal.js is the knob.
