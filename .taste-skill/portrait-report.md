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
