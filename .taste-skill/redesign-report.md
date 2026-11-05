# Karan & Swathi: invitation redesign report (taste-skill v2)

Branch `feature/invitation` · 5 November 2026 · brief: `docs/superpowers/specs/2026-11-05-invitation-redesign.md`

## Direction, idea, live thing

- **Direction dealt:** "The page is the object", seed 1373288904 (sector event, tone warm, `--keep palette,type`). Hero "Invitation card, cropped"; sections intro "Title, note, facts row" → list "Giant word, filled bar rows" → showcase "Square plate, spare text" → contact "Visit card on a photograph" → footer "The back of the card"; signature move "Curtain footer". **No redraws.** The dealt "City at night" photographs were not used (none fits a Sunday morning in Chamrajpet; found pictures of the couple's world took their place).
- **Idea:** the Udupi table where their story began (filter coffee, banana leaf, jasmine, and the Udupi hotel where they will now be engaged) becomes a set of stationery for the day: the invitation card, the programme card, a visit card pinned over old Chamrajpet, and the card's back as the footer.
- **Live thing:** the envelope is addressed to the guest (`?to=Ananya%20%26%20family` → "For Ananya & family" on the envelope, "Dear Ananya & family, please come and bless us." on the card); the facts row carries a live countdown counted in Bengaluru calendar days ("10 days to go", "Tomorrow", "Today, at 11", "With us in spirit"); the back of the card has the hosts' tool "Make a personal link" (type a name → the link to copy, and a WhatsApp link with a ready message). Without script: "For you, with love", no greeting, no countdown, tool hidden.

## What changed, section by section

| Section | Before | Now |
| --- | --- | --- |
| Tokens | 13 sizes, tracked caps, gold hairlines, a shadow, cream card | Field `#4F6150`, paper `#F6ECE8`, paper step `#EADCD6`, ink `#2F3A2E`, accent `#9A5662` (action + diamonds only), gold only in the rings and stamp margins. Five sizes at every width (1440: 16/20/34/88/180; 768: 19/26/64/100/230; 390: 18/24/52/94/129). Square corners, one button shape. Every text pair ≥ 4.5:1 (paper on field 5.7, paper on bars 4.66, paper on accent 4.66, ink on paper 10.2). |
| Envelope | Blush page, outlined envelope, shadow, "YOU ARE INVITED" | Green field; flat tone-step envelope, wax seal without shadow; "For {name}" / "For you, with love" in Great Vibes; "Tap to open" paper button. Mechanics unchanged (`#envelope`, `#open-invite`, `#seal`, `#flap`, `#letter`). |
| Hero | Outlined frame with mehndi corners, column of three name lines | The invitation card cropped by the fold on the mehndi field, scooped corners (field-coloured circles, no outline), rings resting on the card above the names, names on two staggered lines at 12.5vw with the ampersand in the same ink, "are getting engaged", date ◆ time, place, the guest's greeting, and the word-by-word statement at the foot of the card. Top row on the field: monogram, three links, "Get directions". Phone: card full width minus 12px, 96px down, links move onto the card's foot. |
| How it began | Centred column with eyebrow and drop cap | Title left with the rings meeting in the space after it (above it on a phone), the approved note right; the jasmine string under the title; the facts row (Sunday · 15 November · 11:00 AM · live countdown); the filter coffee picture over eight columns under it. |
| The day | Outlined white card with ruled rows | "Sunday" set at the display size so it fills its column (the rings land on its top edge), six filled `details` bars (first open) with times in tabular figures: Welcome, Exchange of rings, Blessings, Udupi lunch with the banana leaf menu, What to wear, Getting there; a muted loop of brass lamps beside it. Rows re-measure the ring journey when opened. |
| Proposal | Couple alone on the page, "She said yes" above them | Split on a blush field: the couple on a square paper plate (still pinned, same scene); three beats that follow the scroll ("One knee", "The ring", "The yes"); one heading where "Will you, Swathi?" gives way to "She said yes"; the line "One knee, one ring and one very nervous question. The rest is a lifetime."; two action cells (Add to calendar, Share the invitation on WhatsApp). |
| Venue | Outlined white card | James Hunter's 1792 watercolour of Tipu Sultan's palace full-bleed with a slow drift; the visit card (Udupi Aatithya, address, Sunday / Ring ceremony / Lunch rows, "Get directions", "Add to calendar") held sticky over it; a caption plate. Phone: picture 70svh cropped to the colonnade, card overlapping it by 80px. |
| Footer | Two script lines | The back of the card: twelve scallops (six on a phone), "With love, / Karan & Swathi" with the message, stamps (jasmine, marigold) in gold margins, three links, the picture credits, the hosts' tool. Curtain reveal on screens ≥ 48rem wide and ≥ 40rem tall (sticky under `main`, no script). |

Motion layer: rings (unchanged choreography); text parts rise 24px and fade in, staggered 80ms; programme rows rise 16px one by one; pictures open like a shutter while settling from 1.08; the visit card is laid onto the picture; stamps settle once the curtain has nearly lifted; control feedback on buttons, cells, links, bars (tone step, rotating plus, panel settling in) and the hosts' tool; one moving picture (the lamps loop, playing only while visible) plus the watercolour drift (scroll timeline, no script). Reduced motion keeps fades and drops travel, shutters, drift and the loop (poster shown).

JS contracts kept: all ids in the brief, `.detail-row`, `.reveal`, `.reveal-end`, `footer.closing`, the head-script classes. Changes: `journey.js` text-fade list follows the new classes; `proposal.js` drives the beats and the question/answer swap (and the reduced-motion finale shows "She said yes"); `envelope.js` honours `data-skip-envelope`; `main.js` adds `initLive()`, the curtain-aware footer reveals and the row re-measure; new `js/live.js`; new pure functions in `lib.js`. New tests: `tests/live.test.js` (16 tests: name parsing and cleaning, countdown text in IST, personal and WhatsApp links, static share hrefs, no-script state, sample markers, proposal beats). `npm test`: 50 pass, 0 fail.

New small feature needed by the gate: a link straight to one part (`…/#hero`, `#about`, `#details`, `#proposal`, `#venue`) skips the envelope moment, like reduced motion does. The inspector cannot tap the envelope, so it ran on `index.html?to=Ananya%20%26%20family#hero`.

## Gate

- `lint.mjs index.html css js`: **0 FAIL, 0 WARN** (the internal `unlock` helper in `envelope.js` was renamed `releaseScroll`; three `min-height: 100vh` fallbacks carry `taste-skill-ignore` because the next line sets `svh`/`dvh`).
- `inspect.mjs …#hero`: **0 FAIL, 2 WARN**. 81 moving elements plus a playing video; 5 type sizes at 1440, 768 and 390; no screen under 20% filled.
  - `pinned-over-picture` ("Will you, Swathi?", "Udupi Aatithya", "With love,"): the "picture" under the proposal title is the transparent full-viewport ring layer (an SVG the meter counts as a picture; the rings themselves stay on the plate); the visit card held over the watercolour is the dealt blueprint; "With love," is the footer waiting under the page for the curtain.
  - `long-pin` ("Karan & Swathi", "With love,", 11 screens): the curtain footer sits stuck under `main` for the whole page, covered and invisible until the page slides off it; that is the signature move.

## Look: critique rounds (references/critique.md)

```
ROUND 1
Seen in one second: the names "Karan & Swathi" on a paper card on a green field.
Idea (one sentence): the Udupi table's world becomes the stationery of the day (card, programme, visit card, back of the card).
Live thing: the envelope addressed to the guest, the countdown, the hosts' personal-link tool.
Layout words by section: envelope=object / hero=card on field / story=split + facts row / programme=stack + tall picture / proposal=plate split / venue=full-bleed + card / footer=postcard back
Scores: design 7 · usability 8 · creativity 8 · content 8 → overall 7.6
Caps applied: motion was one identical fade on every block → design ≤ 7.
Top three problems:
1. desktop venue screen: the watercolour's sky fills the first venue screen; the colonnade only arrives a screen later (and a 60px paper strip showed above it: the card's margin collapsed through the section). Fix: crop the sky, flow-root the section.
2. desktop proposal: tabs, title, description and cells were spaced evenly, leaving the description floating in a void. Fix: title and description grouped, tabs top, cells bottom.
3. desktop story, second screen: a 600px hole under "How it began" beside the note. Fix: the jasmine picture moves under the title.
(Also fixed: tablet date line overflowing the card, tablet rings over the story text, footer stamps at the bottom instead of the top right, phone venue cropped to sky.)

ROUND 2
Seen in one second: the names; then the jasmine and coffee plates, the giant "Sunday".
Layout words by section: as round 1 (no neighbours share a layout).
Scores: design 8 · usability 8 · creativity 8.5 · content 8 → overall 8.1
Caps applied: none (choreographed motion added: shutters, row-by-row bars, drift, curtain, feedback).
Top three problems:
1. desktop story, third screen: the facts row with a 6-column coffee picture leaves a large blank left half. Fix: coffee over 8 columns, tighter gaps.
2. desktop venue: still mostly sky at the top of the section. Fix: crop 35% (was 22%), section 135svh.
3. after a jump down the page, the visit card waited ~1.6s behind a long stagger (blank card area). Fix: stagger capped at five steps.

ROUND 3
Seen in one second: the names on the card; the phone shows the same first answer with the date and place in the first screen.
Scores: design 8 · usability 8 · creativity 8.5 · content 8 → overall 8.1
Caps applied: none.
Remaining (not fixed, noted): the envelope is a gate before any content (kept: approved by the couple); the proposal pin holds for three screens; body text at 20px looks quiet against 180px names on the widest screens; story section on desktop still has a deliberate rest beside the coffee picture.
```

Final score: **8.1** (design 8, usability 8, creativity 8.5, content 8).

## Pictures and footage (all found, none of them the couple's own)

All are downloaded into `assets/found/`, cropped, given one light treatment (saturation 0.9, gamma 1.04; the watercolour untouched) and compressed (largest 194 KB). Sources and licences are in `assets/found/credits.json`. **Credits sit in the footer imprint line** ("Pictures and footage, none of them ours: …", body-size links), and each picture has its own caption on the page.

| File | Title | Creator | Licence | Source | On the page |
| --- | --- | --- | --- | --- | --- |
| `filter-coffee.webp` (1280×960, 81 KB) | Memorable Coffee | K.Sreeram 2603 | CC0 | https://commons.wikimedia.org/wiki/File:Memorable_Coffee.jpg | Story, under the facts row; caption "Filter coffee, in a davara and tumbler" |
| `jasmine-string.webp` (960×720, 67 KB) | Mangaluru Mallige (Mangalore Jasmine Flower) 5 | Yakshitha | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Mangaluru_Mallige_(Mangalore_Jasmine_Flower)_5.jpg | Story, under the title; caption "Mangaluru mallige, strung on a banana leaf" |
| `brass-lamps-loop.webm` / `.mp4` (576×720, 10 s, ~0.5 MB each) + `brass-lamps-poster.webp` | Deepavali diyas in RR Nagar, Bangalore (2025) | Gpkp | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Deepavali_diyas_in_RR_Nagar,_Bangalore_(2025).webm | Programme, muted loop; caption "Brass lamps lit for Deepavali, RR Nagar, Bengaluru" |
| `tipu-palace-1792.webp` (1920×1143, 194 KB) | Tipu Sultan's Summer Palace (North Front of Tippoo's Palace, Bangalore) | James Hunter, 1792 (Yale Center for British Art) | Public domain | https://commons.wikimedia.org/wiki/File:James_Hunter_-_Tipu_Sultan%27s_Summer_Palace_-_B1974.12.1168_-_Yale_Center_for_British_Art.jpg | Venue, full-bleed; caption plate "Tipu Sultan's palace in Chamrajpet, as James Hunter painted it in 1792." |
| `jasmine-stamp.webp` (360×480, 22 KB) | Jasmine (376619150) | Dinesh Valke | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Jasmine_(376619150).jpg | Footer stamp (cropped clear of the camera's date stamp) |
| `marigold-stamp.webp` (360×480, 35 KB) | Marigold Flowers as garland | SnapMeUp | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Marigold_Flowers_as_garland.jpg | Footer, second stamp |

CC BY-SA pictures were cropped and toned, so those versions are shared under the same licence (said in the credit line). The brief asked for an archival photograph of the Summer Palace "about 1890"; the only photograph found (Edmund David Lyon, 1860s, via rawpixel/Getty) is an album page with the print about 500px wide, too small for full bleed, so James Hunter's 1792 watercolour is used and captioned with its real date.

**Drawings standing in for photography:** the couple caricature on the proposal plate and the two rings (both approved art, kept); the envelope and seal (drawn). No drawing stands in for the venue, the food or the family. No dealt Picsum photographs are used.

## Sample items for the couple to confirm (⚑, marked `<!-- sample: confirm -->` in `index.html`)

1. Facts row: "11:00 AM — please be seated by 10:45".
2. Programme "Welcome · 10:30": "Jasmine for every guest at the door, kumkum, and a glass of panaka."
3. Programme "Blessings · 11:45": "The elders bless the couple. Time for photographs with family."
4. Programme "Udupi lunch · 12:30": the whole banana leaf menu (Kosambari, Palya, Bisi bele bath, Rasam and rice, Holige with ghee, Payasam, Filter coffee) and the short notes beside each dish, which I wrote ("moong dal and cucumber", "beans with fresh coconut", "rice, lentils and spice", "with ghee", "sweet flatbread", "a second helping welcome", "to finish").
5. Visit card: "Lunch · 12:30 PM".

Also written by me and worth a glance: the countdown's notes ("counting from today", "Sunday, 11 in the morning", "see you at Udupi Aatithya", "thank you for every blessing"), the WhatsApp message ("Karan & Swathi are getting engaged on Sunday, 15 November 2026, at 11 in the morning, at Udupi Aatithya, Chamrajpet, Bengaluru. Your invitation: …", with "Dear {name}, " in front for a personal link), the picture captions, and the host tool's labels.

## Verification

- `npm test`: 50 pass, 0 fail.
- Scripted runs (playwright-core, Chrome) at 1440×900 and 390×844, screenshots in `.taste-skill/shots/redesign-*.png`: envelope addressed to "Ananya & family" → tap → hero with rings dropped and greeting → story with the rings met → programme with the rings landed on "Sunday" → proposal 0 / 50 / 100% ("She said yes", "The yes" active, ring on her finger) → venue → curtain half open → end → host tool producing `?to=Meera%20%26%20Arjun` and a WhatsApp link → backwards to proposal 50%, programme, hero. Ring positions at the hero and programme rests are identical forwards and backwards; no page errors. Opening programme rows re-measures the pin: the pair still arrives at the hands.
- Reduced motion (both sizes): no envelope, rings at rests, static finale with "She said yes"; no errors.
- cdnjs blocked (both sizes): static page, envelope as first screen, "Tap to open" scrolls to the card, couple standing with "Will you, Swathi?", live greeting/countdown/tool still work; no errors.
- Mid-init error (forced throw in the ring journey): falls back to the static page, nothing locked or pinned, all reveals visible.
- Opened straight from the file system (`file://`): the browser refuses ES modules there, so after the 8s pending timer the page shows its static, readable layout (same as before the redesign).
- Shots: `.taste-skill/shots/redesign-{desktop,phone}-NN-*.png` (envelope, hero, story, programme, proposal 000/050/100, venue, curtain half, end, host tool, back-proposal, back-programme, back-hero), the same for `-reduced` and `-nogsap`, and `redesign-{desktop,phone}-midinit-error-proposal.png`. They are git-ignored (`.taste-skill/shots/`), as are the inspector's (`.taste-skill/inspect/`).

## Could not do / concerns

- The inspector cannot tap the envelope; on the plain URL it only sees the sealed envelope (a gate the couple approved). The gate was run on the `#hero` deep link.
- Headless screenshots show a blank strip at the right edge: `scrollbar-gutter: stable` (kept so unlocking the envelope never reflows the hero) reserves space that a real browser fills with its scrollbar.
- On phones the footer is taller than the screen, so it flows normally instead of the curtain (a sticky footer taller than the viewport would hide its top); the curtain runs on tablets and desktops.
- `assets/og.jpg` (the share preview) still shows the previous design; worth regenerating before launch.
- The CDN scripts still load without Subresource Integrity (unchanged from before).
- Not deployed.
