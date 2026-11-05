# Karan & Swathi — Engagement Invitation Page: Design

Date: 2026-11-05
Status: approved by user 2026-11-05

## 1. Intent

A single page that *is* the engagement invitation for Karan and Swathi, sent to guests as a link (mostly opened on phones from WhatsApp/messages). It should feel like opening a real invitation, not visiting a website. The guest "enters" the invitation, discovers whose it is, and is carried by one continuous scroll animation from the first moment to the venue and directions at the end.

The visual thread is **two rings**. They drop in, meet, travel and finally land in the hands of the couple, where Karan kneels and puts the ring on Swathi's finger. The guest scrolls; the rings tell the story.

The look blends **Indian and American** engagement culture: Indian warmth (mehndi green, lehenga, gold, marigold/jasmine details) with an American formal invitation feel (engraved-card layout, script lettering, "together with their families" wording).

## 2. Goals

- Feels like a premium invitation from the first second. "Fantastic" is the bar: smooth, crafted, emotional.
- One continuous scroll story, start to end, with the rings as the guide through every section.
- Every guest leaves knowing: whose engagement, when, where, and how to get there (one tap to Google Maps directions).
- Works beautifully on a phone held in one hand. Desktop is a bonus, not the primary target.

## 3. Non-goals

- No RSVP backend, forms, login, guest list or database.
- No multi-page site, no blog, no gallery.
- No CMS; content is edited directly in the file.

## 4. Anti-goals (would be a failure even if it "works")

- Looks like a generic template or a SaaS landing page.
- Animation that stutters on a mid-range Android phone.
- Caricatures that look clumsy, childish or off-model (stiff stick figures, wrong proportions). The couple illustration must look intentional and charming.
- Venue/date hard to find or the directions button buried.
- Text that is unreadable over illustrations.

## 5. Fixed decisions (made by the user)

| Topic | Decision |
|---|---|
| Couple | Karan (groom) & Swathi (bride) |
| Date & time | Sunday, 15 November 2026, 11:00 AM |
| Venue | **Udupi Aatithya**, 11, 5th Main Rd, near Makkala Koota Park, Chikkanna Garden, Chamrajpet, Bengaluru, Karnataka |
| Directions | "Get directions" opens Google Maps for this place (coords 12.9570977, 77.5703652; place id `0x3bae157ad87c59fb:0x51e5b49225aaa251`). Use `https://www.google.com/maps/dir/?api=1&destination=12.9570977,77.5703652` or the place URL. |
| Palette | Blush, Sage & Mehndi (option C) |
| Name lettering | Great Vibes (cursive, long, flowing) |
| Culture | Blend of India and US |
| Opening | Feels like an invitation the guest enters into |
| Hero | Two rings drop in, aesthetic colours |
| Scroll 1 | Rings flow and meet → About section |
| Scroll 2 | Rings roll and travel → a new card with whose / when / where / how |
| Finale | Caricature bride & groom holding the ring; **on top** Karan kneels and puts the ring on Swathi; **below** the venue details |
| Outfits | Groom in an **ivory sherwani with gold dupatta** (as in the reference); bride in an **ethnic lehenga** |
| Design skills | Use **elayadesign/ai-design-skills** (landing-page-design) and **emilkowalski/skills** (emil-design-eng, animate, animation-performance) for building and planning |

## 6. Visual system

### Palette (option C)
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F6ECE8` | page background (blush paper) |
| `--ink` | `#3E4A3D` | main text, sage-ink |
| `--rose` | `#B76E79` | rose gold ring, accents, labels |
| `--gold` | `#C9A66B` | gold ring, borders, dividers |
| `--sage` | `#8FA58C` | mehndi leaf motifs, groom tie/pocket square (my call) |
| `--card` | `#FFFDFB` | detail cards |

Backgrounds stay flat (elayadesign rule). **My call:** the rings themselves use subtle metallic SVG gradients (rose gold and yellow gold) because flat rings read as plastic; this is the one gradient exception besides elayadesign's hero heading rule.

### Typography
- Names and section titles: **Great Vibes** (user's choice).
- Everything else: **Cormorant Garamond** 400/500, with italics for invitation phrases.
- This **overrides** elayadesign's font list and its no-italics rule, by the user's explicit choice of cursive lettering. All other elayadesign rules still apply where they don't conflict.
- Small caps labels (e.g. "TOGETHER WITH THEIR FAMILIES") in Cormorant, letter-spaced, in `--rose`.
- Copy has no hyphens (elayadesign rule).

### Ornament
Thin gold hairline frames like an engraved card, small mehndi-style leaf/paisley corner motifs in sage, and a few drifting jasmine/marigold petals in the finale. Restrained: ornament frames, never clutters.

## 7. The scroll story (section by section)

The page is one long scroll. A fixed (pinned) SVG layer holds the two rings so they can travel between sections; sections scroll underneath.

### 7.1 Opening — the sealed invitation
- Full screen blush backdrop with an envelope (card stock texture via flat colour + hairline gold border) sealed with a rose wax seal monogram "K & S".
- Copy: "You are invited" small caps, and a hint "Tap to open".
- On tap/click (or Enter key): seal lifts slightly and cracks, flap opens (rotateX), the invitation card slides up out of the envelope and grows to fill the screen, revealing the hero. Scrolling is locked until opened (my call), so the story starts at the same moment for everyone.
- One time, rare action → allowed to be longer and delightful (~1.4s total, Emil: rare/first-time = can add delight).

### 7.2 Hero — rings drop in
- Two rings (rose gold with a small diamond solitaire = Swathi's; plain gold band = Karan's) drop from above the viewport, land with a soft spring bounce (bounce ~0.2), slightly apart and tilted.
- Below them the names write in: "Karan & Swathi" in Great Vibes (stroke reveal or word fade; elayadesign's mandatory word by word tagline reveal is used on the line beneath).
- Lines: "TOGETHER WITH THEIR FAMILIES" · *Karan & Swathi* · *are getting engaged* · "15 NOVEMBER 2026".
- A small scroll cue (thin line + "scroll") pulses gently at the bottom.

### 7.3 About — the rings flow and meet
- Scroll scrubbed: the rings glide along curved paths toward each other and interlock in the centre (a short sparkle at the moment they touch).
- The About copy rises in beside/below them: a short story of how they met, framed as "two worlds, one story" (India and US).
- Copy (written by Claude at the user's request, South Indian flavour; the user may edit):

  > **How it began**
  > It started the way the best South Indian stories do: over filter coffee. Our families had known each other for years, and one Sunday, somewhere between the banana leaf lunch and a second helping of payasam, the elders decided we should "just meet once."
  > Karan came a little late. Swathi pretended not to notice. Then he asked about the jasmine in her hair, and the coffee went cold while we talked.
  > Many calls, many festivals and one very nervous question later, two families became one.

### 7.4 Details — the rings roll and travel
- Scroll scrubbed: the interlocked rings roll (rotate as they translate, so rolling looks physically right: rotation = distance / circumference) along a curved dotted path across the page, and come to rest on the top edge of a new card.
- The card ("The Celebration") lists:
  - **Whose:** Karan & Swathi, with their families
  - **When:** Sunday, 15 November 2026 · 11:00 AM
  - **Where:** Udupi Aatithya, Chamrajpet, Bengaluru
  - **How:** dress code / note to guests **placeholder** (my suggestion: "Indo western or traditional; come as you are, come with love")
- Card rows reveal one by one (rise 32px + fade, once).
- **My call:** an "Add to calendar" link (.ics download generated in page) sits on this card.

### 7.5 Finale — the proposal
- Top: the caricature scene. Karan in an **ivory sherwani** with gold buttons and a gold dupatta over one shoulder, Swathi in a **lehenga** (blush/rose with gold border, dupatta over one shoulder, bangles, small maang tikka). Both stylised caricatures: big heads, expressive faces, slim bodies, clean vector style. Indian features and skin tones.
- Scroll scrubbed sequence:
  1. The rings arrive and separate; the couple stands holding the joined rings between them.
  2. Karan **kneels** on one knee (body lowers, leg folds), holds up the rose gold ring.
  3. Swathi extends her hand; the ring slides onto her finger.
  4. Little glint on the ring, petals (jasmine + marigold) drift down, a few hearts.
- Below: venue block
  - "Join us at" · **Udupi Aatithya** · full address · date/time
  - Primary button **Get directions** → Google Maps (opens app on phone).
  - Secondary: Add to calendar.
- Closing line in Great Vibes, e.g. *"With love, Karan & Swathi"*, and a small "with blessings of both families" line.

## 7.6 elayadesign rules in force (source: github.com/elayadesign/ai-design-skills, landing-page-design)

The skill is not installed locally; these are the rules read from it that apply here:
- Flat backgrounds, no gradients (exception: rings, see §6).
- Motion base curve `cubic-bezier(0.22,1,0.36,1)`; ~500ms for layout moves, 300ms for colour/opacity; never `ease` or `linear`.
- Animate only transform and opacity.
- Scroll reveals: rise 32px + fade, 600–800ms, once, IntersectionObserver. No unthrottled scroll listeners.
- `prefers-reduced-motion`: opacity only.
- Mandatory tagline reveal: one large line where each word goes from ~30% opacity to full as it crosses a trigger line (used under the names in the hero).
- No hyphens in copy. Sizes snap to the Tailwind type/spacing scale. Contrast 4.5:1 body, 3:1 large text.
- Overridden by the user: font list, no italics. Not applicable: SaaS section order (benefits, FAQ, CTA), since this is an invitation.

## 8. Motion principles (from both skill sets)

- Animate **transform and opacity only** (both skills). No animating layout properties, no blur on large layers.
- Easing: never `linear` or default `ease` for UI motion. Entrances `cubic-bezier(0.22, 1, 0.36, 1)` (elayadesign base, near Emil's strong ease-out). Movement on screen `cubic-bezier(0.77, 0, 0.175, 1)`. Ring drop uses a spring with subtle bounce.
- Scroll driven segments are **scrubbed** to scroll position, so the guest is in control and can scroll back.
- Simple reveals: rise 32px + fade, 600–800ms, once, via IntersectionObserver (elayadesign). No unthrottled scroll listeners.
- Use `will-change` only on the moving ring layer and the proposal figures while active.
- **Reduced motion:** if `prefers-reduced-motion`, skip the envelope animation (show card directly), show rings static in final positions per section, and use opacity only fades. All content still readable.
- Target 60fps on a mid-range Android phone. The rings and figures are SVG; heavy filters avoided.

## 9. Technical approach (my call, builder may refine)

- **Single static `index.html`** with inline SVG, one CSS file, one JS file. No framework, no build step; deployable anywhere (Vercel/Netlify/GitHub Pages) and shareable as one link.
- **GSAP 3 + ScrollTrigger + MotionPathPlugin** (pinned exact version from cdnjs) for the pinned, scrubbed ring journey and the proposal sequence. GSAP is the most reliable way to get smooth scroll scrubbing across iOS Safari and Android Chrome. Optional: Lenis for smooth scrolling if it doesn't hurt mobile feel (builder decides after testing).
- Fonts from Google Fonts (Great Vibes, Cormorant Garamond) with `display=swap` and preconnect.
- Caricatures hand drawn as layered SVG (separate groups for head, torso, arms, legs) so they can be posed and animated. Quality bar in §4 applies; if hand-built SVG falls short, the builder should stop and say so rather than ship clumsy figures.
- Open Graph meta (title "Karan & Swathi are getting engaged", description with date and venue, a preview image of the hero) so the WhatsApp link preview looks like an invitation.
- Mobile: `100dvh` instead of `100vh`, safe-area padding, no tap highlight flash, theme-color meta in blush.

## 10. Accessibility

- Real text for all details (not baked into SVG).
- Envelope opener is a `<button>` reachable by keyboard.
- Decorative SVG `aria-hidden`; the proposal scene has a short text alternative.
- Contrast: body text 4.5:1 on paper (`#3E4A3D` on `#F6ECE8` passes); script names large enough for 3:1.

## 11. Open content (placeholders until the user supplies)

1. ~~Ceremony time~~ — confirmed 11:00 AM.
2. ~~About story~~ — written by Claude (§7.3).
3. **How / dress code** line (suggestion provided).
4. Whether to name the families (e.g. "Son of … / Daughter of …").

The build can proceed with clearly marked placeholders.

**Rule (my call):** anything guests may cache (Open Graph description, .ics) uses only confirmed facts: names, date, 11:00 AM, venue. Placeholder copy (story, dress code) never goes into those.

## 11b. Delivery

- **One single build, everything included (user's decision).** No phased release: envelope, hero, About, Details, full ring journey, proposal scene and venue all ship together on one page.
- **Hosting (my call):** Vercel, static deploy. The final URL is fixed before the OG image and meta tags are written; absolute URLs throughout.
- **Internal check (my call):** the builder draws both figures (standing and kneeling) first and checks them against the style reference before wiring animation, so the figures are right before motion is layered on. This is a builder step, not a separate release.

## 11c. Caricature style reference (user supplied)

Reference: magnific.com premium vector "Cute Indian wedding couple cartoon walking together" (id 419562291). It is a licensed stock image, so it is a **style reference only**; the figures are drawn from scratch, never traced or copied.

Style to match:
- Cute cartoon caricature: large heads (~1/4 of body height), big glossy expressive eyes with highlights, soft rosy cheeks, small smiles, clean dark outlines, flat fills with one soft shade tone.
- Groom: tousled dark brown hair, light stubble, warm smile. **Outfit per user: the sherwani as in the reference** — ivory/cream sherwani with gold buttons, small pocket detail, gold dupatta draped over one shoulder, cream churidar, mojari shoes.
- Bride: shy, sweet expression; long dark hair in a braid or bun with flowers; maang tikka, nath (nose ring), earrings, bangles; **lehenga** with gold border and a dupatta over the head/shoulder. **Colour (my call):** deep rose lehenga with gold, so she stays in the Blush, Sage & Mehndi palette while keeping the bridal richness of the reference's red.
- Both with warm Indian skin tones.

## 12. Left to the builder

- Exact ring geometry, path curves and scroll lengths per section.
- Exact petal/sparkle counts and timings.
- Envelope texture details.
- Whether to use Lenis.
- Precise breakpoints for desktop layout (centred column with ornament margins is the expectation).

## 13. Done looks like

- Opening on an iPhone and an Android phone: envelope opens, rings drop, scroll carries them through About, Details and the proposal without jank, and Get directions opens the right place in Google Maps.
- Reduced motion mode readable and complete.
- WhatsApp link preview shows the invitation image and title.
