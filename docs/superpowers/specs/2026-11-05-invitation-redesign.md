# Invitation redesign brief (taste-skill v2)

Date: 2026-11-05 · Branch: feature/invitation · Direction sheet: `.taste-skill/direction.json` (reprint: `node $SK/scripts/draw.mjs --show`)
`$SK` = /Users/dhanush/.claude/plugins/cache/taste-skill/taste-skill/2.0.0/skills/taste-skill

## Why
The user says the finished page "looks plain". The taste-skill inspector agrees (9 FAILs): 0 real pictures, 5 of 5 desktop screens near-empty, 9 tiny uppercase labels, eyebrows, hairlines, outlined boxes, a shadow, 13 type sizes. Goal: a rich, beautiful, award-level invitation built by the taste-skill process, keeping everything the couple already approved.

## Keep (approved by the user; do not change)
- The story beats and all motion behaviour: sealed envelope → two rings drop in → rings meet at the story → roll and rest on the details → pinned proposal (Karan kneels, ring onto Swathi's finger, petals, hearts) → venue → closing. All JS contracts (ids listed below) keep working; ring choreography re-measures anchors on refresh, so moving anchors is fine.
- Palette family: blush, sage/mehndi green, rose gold, gold (`--keep palette,type`). Great Vibes for the names and section titles; Cormorant Garamond for everything else. Two faces only.
- Caricature couple (Karan in ivory sherwani, Swathi in rose lehenga), the rings art.
- Facts: Karan & Swathi · Sunday, 15 November 2026 · 11:00 AM · Udupi Aatithya, 11, 5th Main Rd, near Makkala Koota Park, Chikkanna Garden, Chamrajpet, Bengaluru, Karnataka · directions https://www.google.com/maps/dir/?api=1&destination=12.9570977,77.5703652 · calendar `assets/karan-swathi-engagement.ics`.
- Accessibility, fallbacks (no GSAP, reduced motion, mid-init error), per-frame performance discipline, all existing tests.

## Inventory (things only this couple has)
1. Swathi = the Swati nakshatra; in Kannada and Tamil lore, rain that falls under the Swathi star becomes a pearl in an oyster.
2. The venue is an Udupi restaurant, Udupi Aatithya ("Udupi hospitality"), in old Bengaluru's Chamrajpet.
3. Chamrajpet: one of Bengaluru's oldest planned extensions; Tipu Sultan's Summer Palace stands there; near KR Market and the old fort.
4. Their story (copy below): filter coffee, a banana leaf lunch, payasam, jasmine in her hair.
5. Mysore mallige (jasmine) strings and marigold (chendu hoova) garlands; mango leaf torana; kolam/rangoli at the door.
6. Tambula: betel leaves, areca nut, coconut, fruit, exchanged at a South Indian engagement (nischitartha).
7. Rings: a rose gold solitaire and a gold band.
8. The printed things of this world: the lagna patrike (invitation card with turmeric and kumkum touched on its corners), the Udupi hotel's banana-leaf meal and its handwritten bill.
9. Sunday morning, 11 o'clock, mid November (winter mornings in Bengaluru are clear and cool).
10. India and America in one family (Indo western dress welcome).

## The idea
> On this page, **the Udupi table where their story began (filter coffee, banana leaf, jasmine, and the Udupi hotel where they will now be engaged)** becomes **a set of stationery for the day: the invitation card, a programme card listing the morning and the banana leaf lunch, a visit card pinned over old Chamrajpet, and the card's back as the footer.**

Competitor test: another couple's invitation has no Udupi coffee story, no Udupi hotel venue, no Chamrajpet. The idea belongs to Karan and Swathi.

**Live thing:** the envelope is addressed to the guest. `?to=Ananya%20%26%20family` puts "For Ananya & family" on the envelope and "Dear Ananya & family," on the card; without a name it reads "For you, with love". The facts row carries a live countdown ("10 days to go", "Tomorrow", "Today, at 11", "With us in spirit" after the event). In the footer, a small host tool ("Make a personal link"): type a guest's name → shows and copies the personal link and offers a WhatsApp share link (`https://wa.me/?text=` + encoded message + link). The page works fully without script (generic greeting, no countdown text, the tool hidden).

## Argument (claims → proof)
1. Karan and Swathi are getting engaged, and you are invited. → The card, names huge, date/time/place on the first screen, Get directions.
2. It began over filter coffee at an Udupi table. → Story + found photograph of filter coffee; facts row with the countdown.
3. Here is the morning, hour by hour, and the lunch. → Programme stack with open-able rows and the banana leaf menu.
4. The question was asked on one knee. → The pinned proposal plate (illustration), "She said yes".
5. Here is exactly where, and how to get there. → Visit card on a full-bleed picture of old Chamrajpet; directions + calendar.
6. With love, from both families. → Back of the card: sign-off, links, stamp, picture credits, host link tool.

## Copy deck
(Sample items marked ⚑ must be confirmed by the couple; list them in the report.)

Envelope: "For {name}" / default "For you, with love" · button "Tap to open".

Top row (on the field above the card): monogram "K & S" (Great Vibes) · links "Our story" · "The day" · "Venue" · action button "Get directions".

Hero card (centred, letterpress manners):
- "Together with their families" (italic, sentence case, not tracked caps)
- h1 names: "Karan" / "&" / "Swathi" (Great Vibes; the ampersand in the SAME colour as the names, not accented)
- "are getting engaged" (italic)
- "Sunday, 15 November 2026" ◆ "11 in the morning" ◆ "Udupi Aatithya, Chamrajpet, Bengaluru" (◆ = one solid diamond shape)
- greeting line when named: "Dear {name}, please come and bless us."
- statement (p, word-by-word reveal kept): "Two hearts, two worlds, one forever."

Story section — heading "How it began"; note (verbatim, approved):
> It started the way the best South Indian stories do: over filter coffee. Our families had known each other for years, and one Sunday, somewhere between the banana leaf lunch and a second helping of payasam, the elders decided we should "just meet once."
> Karan came a little late. Swathi pretended not to notice. Then he asked about the jasmine in her hair, and the coffee went cold while we talked.
> Many calls, many festivals and one very nervous question later, two families became one.
Facts row: "Sunday" — "the ring ceremony" · "15 November" — "2026" · "11:00 AM" — "please be seated by 10:45" ⚑ · live "{N} days to go" — "counting from today".

Programme — giant word "Sunday" filling the column; rows (`<details>`, first open):
- "Welcome · 10:30" — "Jasmine for every guest at the door, kumkum, and a glass of panaka." ⚑
- "Exchange of rings · 11:00" — "Karan and Swathi exchange rings before both families, with tambula of betel leaves, areca, coconut and fruit."
- "Blessings · 11:45" — "The elders bless the couple. Time for photographs with family." ⚑
- "Udupi lunch · 12:30" — on banana leaf ⚑: Kosambari · Palya · Bisi bele bath · Rasam and rice · Holige with ghee · Payasam · Filter coffee
- "What to wear" — "Indo western or traditional; come as you are, come with love."
- "Getting there" — address + "Landmark: Makkala Koota Park" + a Get directions link.

Proposal plate — left: the couple illustration in a square plate. Right: three beat tabs that follow scroll progress (active = full ink, others = muted at full contrast): "One knee" · "The ring" · "The yes". Title swaps at ~0.8 progress from "Will you, Swathi?" to "She said yes". Description (34ch): "One knee, one ring and one very nervous question. The rest is a lifetime." Two action cells: "Add to calendar" (ink) · "Share the invitation" (tone; WhatsApp share of the page link).

Visit card — over a full-bleed picture of old Chamrajpet (Tipu Sultan's Summer Palace if an honest archival photograph exists; caption-credit it: "Tipu Sultan's Summer Palace, Chamrajpet, about 1890 · credit"). Card: title "Udupi Aatithya"; address "11, 5th Main Rd, near Makkala Koota Park, / Chikkanna Garden, Chamrajpet, Bengaluru"; rows (label left, value right, tabular figures): "Sunday" | "15 November 2026"; "Ring ceremony" | "11:00 AM"; "Lunch" | "12:30 PM" ⚑; full-width button "Get directions"; link "Add to calendar".

Footer (back of the card, scalloped top, curtain reveal) — left: "With love," + "Karan & Swathi" (Great Vibes) + "With the blessings of both families. We cannot wait to see you there." Right: links "Get directions" · "Add to calendar" · "Share on WhatsApp"; stamp = small jasmine photograph (3:4, paper margin). "Make a personal link" tool (details/summary or a small form). Imprint line (≥13px): picture credits.

## Composition (from the direction sheet; read it in full before building)
- Hero: "Invitation card, cropped" — flat field (mehndi green, see palette) fills the viewport; centred portrait card 5:7 in paper colour, top edge ~190px down (96px on phone), lower third cropped by the viewport bottom; scalloped inner corners via `clip-path`/corner circles, NO outline, NO shadow. Rings rest on the card above the names (`#ring-anchor-hero`). Top row on the field.
- Story: "Title, note, facts row" split; found filter-coffee photograph under the right half of the facts row (5 cols, 4:3). `#ring-anchor-about` beside the heading.
- Programme: "Giant word, filled bar rows" — reading column 520–640px; giant word in the brand display face sized in container units to fill the column; filled bars one tone step from the ground, 56px, 6px gaps, `details` rows. `#details-card` + `#ring-anchor-details` move to this column (rings land on its top edge). Pair it with a tall found photograph (jasmine strings or banana leaf meal) on the other side on desktop so the screen is full.
- Proposal: "Square plate, spare text" split 50/50, ≥88svh, pinned as today. Plate = paper square containing `#couple-stage`; right column as in the copy deck. Phone: plate first, then tabs/title/actions.
- Venue: "Visit card on a photograph" full-bleed; card opaque paper, square corners per page radius, sticky inside a taller section; phone: photo 70svh, card overlaps its bottom by 80px.
- Footer: "The back of the card" scalloped paper panel on the contrasting ground; curtain reveal (sticky footer under `main` with its own background and higher stacking order, no JS).

## Palette roles (brand values; a two- or three-ink print job)
- Ground/field: mehndi green `#4F6150` (contrasting ground for the hero, programme and footer fields) — verify contrast; paper text on it.
- Paper: blush `#F6ECE8` (the card, story section ground, visit card, footer card). Do not use the yellow cream `#FFFDFB` (inspector: palette-cream).
- Ink: deep sage `#2F3A2E` for running text (full ink; no soft grey body text).
- Accent: rose deep `#9A5662` — the primary action and perhaps the diamond separators. Gold `#C9A66B` only inside the ring art and the stamp margin, not as hairlines.
- Bars: one tone step from their ground (e.g. `#EADCD6` on blush, or `#5C6F5C` on green).
Check every text/ground pair ≥ 4.5:1 (large script ≥ 3:1).

## Type (five steps max)
display (names, giant word; Great Vibes or Cormorant light for the giant word), heading (Great Vibes section titles, two lines max), lead/statement (Cormorant italic ≤36px desktop / 24px phone), body 18–20px Cormorant, small ≥16px (house minimum 13px; prefer 16). No tracked uppercase anywhere.

## Imagery plan (floor: ≥4 real pictures, aim 6–8; plus one muted loop)
Search with `node $SK/scripts/assets.mjs "<query>"`, look at each, `--get <ref>` the chosen ones into `assets/`, `--credits` for the imprint. Candidate queries: "filter coffee davara tumbler", "jasmine flowers string Mysore mallige", "marigold garland India", "banana leaf meal South India", "betel leaves areca nut", "Tipu Sultan summer palace Bangalore", "Bangalore old map 1924" / "Bangalore Chamrajpet", "Mysore silk", video: "jasmine flowers", "marigold garland", "oil lamp diya flame". One treatment for all (e.g. warm, slightly lifted, same crop ratios). Never present a found picture as the couple's own venue, food, or family. Compress to sensible web sizes (≤ 250 KB each, WebP or JPEG, explicit width/height, `loading="lazy"` except above-the-fold).

## House rules to meet (inspector)
No eyebrows, no tracked tiny caps, no hairlines/1px outlined boxes, no shadows at rest, no gradients (exception: the metallic ring art — run the inspector with `--allow gradient` only if it flags the ring SVG, and say so), no styled accent word, headlines ≤ 2 lines at 1440/768/390, ≤ 5 type sizes, running text full ink ≥16px, ≤ 1 near-empty screen, ≥ 8 moving elements (entrances per section part, control feedback, one moving picture), nothing covering headlines/statements (the rings already fade over text; also keep rings off the h1 and statement), mobile composition designed on its own.

## Contracts to preserve (JS depends on them)
`#envelope`, `#open-invite`, `#seal`, `#flap`, `#letter`, `#hero-names` (+ `.names__one/.names__two` spans), `#tagline` with `.w` spans, `#ring-stage` (+ `#ring-rose`, `#ring-gold`, `#ring-link`, spark), `#ring-anchor-hero|about|details|hands`, `#details-card`, `.detail-row` (rename allowed if JS updated), `#proposal`, `#couple-stage`, `#couple-svg`, `#proposal-yes`, `#directions`, `#add-calendar`, `[data-ics]`, `.reveal`, `.reveal-end`, `footer.closing`, the inline head script classes (`js-pending`, `js-reduced`, data attributes). If you rename, update JS and tests together.

## Gate and look
`node $SK/scripts/lint.mjs index.html css js` · `node $SK/scripts/inspect.mjs index.html` → zero FAILs; WARNs fixed or defended. Then critique the screenshots with `$SK/references/critique.md` (three rounds max), plus our own checks: open the envelope and scroll the whole story at 390x844 and 1440x900 (journey, card landing, proposal, venue, curtain footer), `npm test`.

## Addendum, 6 November 2026: the portrait
The couple sent their own illustrated portrait (`assets/karan-swathi-portrait.webp` / `.jpg`). It replaces the caricature: the pinned scene is now the portrait, mounted on a paper mat with scooped corners on an ink ground; the rings arrive on the bouquet and the rose gold solitaire glides onto Swathi's ring finger (picture px 568, 1426) during a slow push-in, then the visit card is laid over the portrait. The separate venue section and the Tipu Sultan watercolour are gone. Contracts: `#couple-stage` and `#couple-svg` are retired; the scene uses `#portrait` (the img), `#venue` (the visit card, now inside `#proposal`), `#ring-anchor-hands` (on the bouquet), `#proposal-yes`, `#directions`, `#add-calendar`, `[data-ics]`. Details: `.taste-skill/portrait-report.md`.
