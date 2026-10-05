# Portfolio 2.0 Handoff

Vanilla HTML/CSS/JS portfolio for Anthony N. (product designer, UC Davis). No build step.

**State as of 2026-09-08.** Five pages, one version (an earlier `v2/` was deleted). The home hero was
just rebuilt to the approved "version 1" split layout, "Scroll to see my work" is back, and the new
About portrait is cropped and wired in. Cache token is `?v=x21`. Nothing is mid-edit.

## Where it lives
- **Project root:** `/Users/atony/Desktop/New portfolio files/Portfolio2.0/`
  (moved here from `~/Downloads/...`, Downloads copy no longer exists.)
- It is now a **git repo** (`.git` present). Note: git makes objects read-only, so a naive
  `cp -R "$SRC/." "$DEST/"` **fails on `.git/objects` (Permission denied)**, exclude `.git`
  when mirroring (copy `index.html about.html css js assets work/*.html` individually, or rsync
  with `--exclude=.git`).

## Preview setup (important, session-specific)
The in-app browser sandbox serves from a **scratchpad mirror**, not the Desktop source directly.
- Launch config lives at **`.claude/launch.json` in the project** (a stale copy may also sit at
  `~/.claude/launch.json`). Entry **`portfolio2`**, port **4323** (4321 and 4322 both got left occupied by earlier chats), `--directory` pointing at a
  scratchpad `preview/` folder.
- **The scratchpad path is per-session, so the checked-in one is always stale.** First thing in a
  new session, repoint it and re-mirror:
  ```
  SP=<your scratchpad>            # e.g. /private/tmp/claude-501/-Users-atony/<session-id>/scratchpad
  rsync -a --delete --exclude .git --exclude .DS_Store \
    "/Users/atony/Desktop/New portfolio files/Portfolio2.0/" "$SP/preview/"
  sed -i '' "s|/private/tmp/claude-501/-Users-atony/[^/]*/scratchpad/preview|$SP/preview|" .claude/launch.json
  ```
  Then `preview_start` name `portfolio2`; it serves at `http://localhost:4323`.
- **Two gotchas hit on 2026-09-08:**
  1. `preview_start` resolved the entry from **`~/.claude/launch.json`**, not the project copy, and a
     duplicate/stale `portfolio2` there silently won (it even fell back to an unrelated `portfolio`
     entry on port 4599). Fix the **global** file too, or, simplest, make it hold exactly one
     `portfolio2` entry pointing at the current scratchpad.
  2. A dev server left running by an **earlier chat** still owned 4321 and `preview_stop` cannot kill
     another chat's server, so the port was moved to **4322**. If 4322 is likewise taken next time,
     just pick another free port (`lsof -nP -iTCP:$p -sTCP:LISTEN`) and set it in **both** files.
- **Screenshotting the preview:** the preloader and the `.pt` page-transition wipe cover the page and
  do not clear on their own in the sandbox. Strip them before shooting:
  ```
  document.querySelector('.preloader')?.remove(); document.querySelector('.pt')?.remove();
  document.querySelectorAll('[data-reveal],[data-reveal-stagger] > *')
    .forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; });
  document.querySelector('.hero__title').style.opacity = 1;   // it starts at opacity 0
  ```
- **After every edit**, re-copy the changed file(s) into `$PREVIEW`. The preview browser also
  **caches `css/style.css` and `js/main.js` hard**, bust with a `?cb=Date.now()` query on the
  `<link>`/`<script>` when verifying, or the user should hard-refresh (Cmd+Shift+R).

## Cache busting
- **Every page carries a `?v=` token** on BOTH the stylesheet and the script (the three case studies
  originally had none, so they silently served stale CSS in the preview). Bump the whole set on any
  css/js edit, `sed -i '' 's/?v=OLD/?v=NEW/g' *.html work/*.html`. **Current token: `?v=x20`.**

## Nav, mascot, and chat (shared by all 5 pages)
- **The wordmark is a handwritten signature (2026-09-10).** `.nav__brand` is **Caveat 700 at 28px in
  `--blue`**, not the old 16px sans. Caveat has a small x-height, so 28px is what puts it optically
  level with the 14px sans links beside it (measured: both centre on the same line). It is 111px
  wide, well inside the `max-width: 240px` the pill collapse animates against.
  - The full name was chosen over an "AN" monogram deliberately: Caveat's capitals are narrow and
    slanted, so two letters alone read as handwriting rather than as a mark. The name gives it
    enough runway to read as a signature.
  - **It stays visible in the pill** (at 23px), so the pill reads `Anthony N. | Works About Resume`.
  - **The hairline divider is `.nav__group::before`, pill only.** It has to live on `.nav__group`
    rather than `.nav__brand`: the brand carries `overflow: hidden` for the collapse animation, so
    an `::after` there would be clipped away. It is suppressed below 761px, where `.nav__group` is
    the collapsed mobile menu rather than an inline row.
  - The cap has moved 234 -> 336 (name restored) -> **356** (divider added).
- **The nav has no CTA any more (2026-09-10).** Resume used to be an outlined pill with a download
  icon sitting *outside* `.nav__links`; it is now an ordinary `.nav__link` inside that list, so
  Works / About / Resume are visually identical. `.nav__cta` markup, CSS and the `data-magnetic`
  hook are all deleted. The link gained `rel="noopener"` alongside its `target="_blank"`, which the
  old CTA was missing.
- **Nav** is a **flat full-width sticky bar** (modeled on jaydenbetts.design), NOT the old floating
  pill: `.nav-outer` is sticky at top 0 with a blurred background and a hairline bottom border;
  `.nav` is `space-between` with the brand LEFT and the links + Resume CTA RIGHT (the reference
  centres its links, deliberately not copied). Links are transparent pills that fill on hover; the
  CTA is an outlined pill.
- **The nav never hides.** Hide-on-scroll was removed entirely (no more `.is-hidden`). The bar is
  translucent, `rgba(250,250,250,.55)` with `backdrop-filter: blur(18px)`, and the scroll handler
  only toggles **`.is-stuck`** past 8px, which firms it to `.7` and fades in the bottom border and a
  faint shadow so the links stay readable over content. There's an `@supports not (backdrop-filter)`
  fallback that makes the bar nearly opaque where blur is unsupported, since translucency alone
  would leave the links illegible there.
  - Note when testing in the in-app preview: it does **not** advance CSS transitions or fire real
    scroll, so `getComputedStyle` reads the pre-transition value and `.is-stuck` never applies on its
    own. Set `style.transition='none'` and toggle the class by hand to verify.
- **The "Sumi" handwritten label + arrow in the hero was removed** (markup + `.sumi-note*` CSS).
- **The chat button is SOLID `--blue` with a recoloured sprite (2026-09-10).** The button uses
  `assets/graphics/sumi/default-white.png`, not `default.png`.
  - Why: the normal sprite is blue linework with white-filled interiors. Dropped straight onto solid
    blue, the lines merge into the ground and it reads as a featureless white blob. No CSS filter
    fixes this - `brightness(0) invert(1)` flattens the whole sprite to white, losing the lines too.
  - `default-white.png` inverts the relationship: **linework becomes white, the light fills become
    fully transparent** so the blue ground shows through. That gives clean white line art on blue.
  - It was generated by **`tools/whiteify.swift`** (kept in the project):
    `swift tools/whiteify.swift <in.png> <out.png>`. It un-premultiplies each pixel, treats
    luminance > 0.62 as fill (alpha 0) and everything else as line (white). Rerun it if the mascot
    art is ever redrawn, or to make white versions of other poses.
  - **The chat panel's own header avatar is unchanged** (`happy.png` on a white circle) - that sits
    on a white panel, where the original blue-on-white art is correct.
- **`Contact` was removed from the nav on all five pages (2026-09-10).** The footer's Contact column
  stays, and `<footer id="contact">` keeps its id - nothing links to it from the nav now, but the
  anchor is harmless and the footer markup must stay byte-identical across the five pages.
- **The mascot on the "More than the work" photo (`.meet__sumi`) was removed**, markup and CSS.
- **`.buddy` is now a head-only avatar.** The sprite is a ~757x1500 full body; scanning row widths
  puts the neck pinch at y=800, so **the head is the top ~53%, not the top third** (Sumi is chibi, 
  guessing "top third" crops to the hat brim). `overflow: hidden` on the circle plus
  `height: 200%; top: -5%` windows onto source rows ~37-777. The chat header avatar uses a
  **smaller** crop of the same art (`height: 155%; top: 7%`) so the head sits inset in its circle.
- **The buddy opens a chat** instead of cycling bubbles. `.chat` is a panel above the button.
  **The bot is SCRIPTED, not a model**: `INTENTS` in the chat IIFE at the end of main.js is a list of
  keyword sets scored against the question, best match wins, with a fallback. Every answer is drawn
  from the site's own content, **if you change his experience/contact/projects, update INTENTS too.**
  Case-study pages sit one level down, so the IIFE prefixes internal links with `../` via the `up`
  variable (and the avatar `src` in those files is hand-written with `../`).

## Pages
- **index.html**, full-viewport split hero (see below); **Selected Works as 16:9 project covers**
  (see below); **"More than the work"** section (`#meet`: tilted photo + mascot + "More about me"
  button to about.html); compact footer.

### The hero (`.hero` / `.hero__inner`, home), settled, do not redesign without asking
Several hero layouts were mocked up and reviewed as PNGs; the user picked this one ("version 1") and
said to stick with it. Sketch-derived alternatives that spanned the headline across the full width
("version 2") were explored and **rejected**.
- **It does NOT use `.wrap`.** It copies the NAV's width rule instead, `padding-inline: var(--gutter)`
  on `.hero`, `max-width: var(--maxw)` on `.hero__inner`, so the headline's left edge lines up with
  the "Anthony N." wordmark. `.wrap` puts the gutter *inside* the 1240px cap, which would pull the
  hero ~200px narrower than the nav and misalign them.
- Two columns, **65fr / 35fr**, vertically centred, `min-height: calc(100svh - 62px)` (62px is the
  nav). At 1440x900 that measures exactly 838px, so nav + hero fill one viewport with no scroll.
  **The copy column was widened from 47fr on 2026-09-08** so the headline sets on **two** lines
  ("Product Designer that values" / "*user-centered* digital experiences") instead of three, matching
  the approved reference PNG. At 47fr the column was ~562px and the headline needs ~780px.
- Headline: **"Product Designer that values *user-centered* digital experiences"**,
  `clamp(32px, 3.5vw, 49px)`, `line-height: 1.3` (loosened from 1.14 to match the reference's
  airier two-line setting), the accent span in IBM Plex Serif italic blue. There is **no eyebrow**
  ("PRODUCT DESIGNER" was dropped). The old copy was "I design for user-centered digital experiences".
- Sub: "Fourth-year design undergrad @ UC Davis. Certified **energy drink** enjoyer."
  (was "Figma + Claude enjoyer" until 2026-09-08). The user explicitly asked that this line be kept
  even though it is absent from the reference sketches. `max-width: 50ch` (up from 40ch) so it breaks
  after "Certified" rather than after "UC Davis.".
- Tags in this order: **AI Workflow, then Figma**.
- The cutout (`header-image.png`) is sized by **height** (`min(56svh, 505px)`), width auto. Sizing it
  by width overflows the viewport, because the art is a 548x795 portrait cutout with transparency.
  Note only ~79% of the PNG's height is actual ink (transparent padding top and bottom), so the
  rendered art looks noticeably smaller than the box.
- The hero's bottom row is three pieces, all links to `#works`:
  - `.hero__loc` ("[ Based in Sacramento, CA ]") pinned bottom-LEFT at `bottom: 72px`.
  - `.hero__scroll` ("Scroll to see my work", text only) pinned bottom-RIGHT at the **same
    `bottom: 72px`**, so the two are level. The user asked for them levelled.
  - `.hero__down`, a standalone down arrow centred at `bottom: 26px`, added on request to make the
    scroll affordance obvious. The chevron that used to live inside `.hero__scroll` was moved here,
    so the text cue is now text only.
  - **How the cue clears the mascot:** the fixed `.buddy` owns the bottom-right **96x96** of the
    viewport (74px + 22px inset). The cue was briefly lifted to `bottom: 110px` to dodge it, but
    that broke the levelling. It now stays on the 72px line and insets horizontally instead:
    `margin-right: max(0px, calc(104px - var(--gutter)))`. At 1440 the gutter is already wide
    enough so the inset is 0 and the cue is flush with the container edge (47px clear of the
    buddy); at narrower widths the inset grows to keep the gap. **Do not lift it off the 72px
    line again.**
- Two doodle stars only (`--1` at top-left `19%/0`, `--2` at `18%/69%`, moved from 41% so it sits
  above the cutout in the top-right, as in the approved PNG). The third was dropped; all are hidden
  below 1024px.
- Below 1024px the grid collapses to one column, the figure is capped at `min(100%, 420px)` /
  `52svh`, and `.hero__loc` / `.hero__scroll` go back to static flow.

### Featured work covers (`.worktiles` / `.wcard`, home), rebuilt 2026-09-08
Modeled on **creatiie.framer.website**'s projects grid, replacing the old gradient `.wtile` covers
(that CSS and markup are gone; `.card*` is untouched and still used by the case studies).
- **Image and label live inside ONE container** (`.wcard__paper`), so the pair reads as a single
  object the way the reference groups them: a white sheet with 14px padding, a 3:2 image box on top
  and a label row underneath (project name left, three pills right).
- Each card is **tilted** (`--tilt`: -2.6deg on the first, +2.2deg on the second) and pinned with a
  strip of translucent **tape** (`.wcard__tape`) at the opposite top corner of the lean, so they read
  as photos stuck to the page. Hover straightens the card to 0deg and lifts it 8px.
- **The reference's macOS window chrome was deliberately NOT copied.** Every cover there sits under a
  title bar with red/yellow/green traffic-light dots; the user explicitly asked not to look like a
  Mac app, so there is no chrome at all.
- The reference runs five projects three-up. There are **two** here, so the cards are roughly twice
  the size, two-up on one row, one-up with a 16:10 crop below 780px (**tilt goes to 0 there**, a
  lean reads as a bug in a single column).
- **A staggered second card was tried and removed**, offsetting it read as a layout bug.

#### The tilt lives on `.wcard__paper`, NOT on `.wcard`, do not move it back
`.wcard` is a bare link carrying no transform. The scroll-reveal stagger animates `transform` on it
(`[data-reveal-stagger] > *` sets `translateY(26px)`, and `.is-in > *` sets `transform: none`), so
**any rotation put on `.wcard` is silently wiped the moment the section scrolls into view.**
- This bit twice. The first fix tried to out-specify the reveal
  (`[data-reveal-stagger].is-in > .wcard { transform: rotate(var(--tilt)) }`) and produced a state
  where one card tilted and the other did not. Nesting the rotation on an inner element that nothing
  else animates is the durable fix.
- **Watch out when verifying with `tools/snap.swift`:** the usual injected snippet did
  `el.style.transform = 'none'` to force reveals open, and an inline style beats any stylesheet rule,
  so the render showed straight cards and hid the bug. **Add the site's own `is-in` class instead**
  of setting inline styles:
  `document.querySelectorAll('[data-reveal],[data-reveal-stagger]').forEach(e=>e.classList.add('is-in'))`.

#### Covers are placeholders
Generated with `tools/snap.swift` from a throwaway HTML file: brand-blue gradient + a mascot pose +
a small "<PROJECT> COVER IN PROGRESS" label. The user is making real mockups. **To swap one in, just
overwrite the file**, `assets/graphics/thumbs/vendrs-cover.png` or `qac-cover.png`, 1200x800 (3:2).
No markup change needed.
- An earlier version had a graph-paper texture baked into these covers; it was removed when the user
  asked to drop the grid.
- The `brightness(0) invert(1)` trick flattens the Sumi art to a solid silhouette (the poses have
  opaque white interiors now), so do not filter the mascot in these, place it unfiltered.

#### Only two of the three case studies are linked
Vendrs and QAC Gallery are featured. **`work/uc-davis-app.html` still exists and still works, it is
just not linked from the home page** (it is the one with only mid-fi wireframes). Re-add it by
copying an `<a class="wcard">` block in index.html and adding a third cover, but the grid is 2-up,
so a third card needs `repeat(3, 1fr)` or it will sit alone on row two.
The one-line project summaries from the old tiles were dropped, because the reference's cards carry
only a name plus pills. That copy is still in git history.

#### Pile then separate REVERSES on the way back up
`main.js` has a **second** IntersectionObserver just for `.worktiles` that does
`classList.toggle("is-in", isIntersecting)`. It exists because the generic reveal observer calls
`io.unobserve(t)` after the first hit, so the cards would separate once and stay separated. The
second observer runs the animation backwards when the section leaves the viewport upward.
Verified in WKWebView (see the verification note near the end of this file): in view -> `is-in` true,
scrolled up -> false, back in view -> true.

#### Pile then separate (the work cards' entrance)
The two cards start stacked on the row's centre line and slide apart into their columns when the
section scrolls into view. Added on request 2026-09-08.
- Driven by the site's **existing `.is-in` reveal class**, not a scroll handler. The nav's scroll
  listener is the only one on the page, and programmatic scroll does not fire reliably in the
  preview sandbox, so an IntersectionObserver class flip is both simpler and actually testable.
- `--pile-x` is **52%** of a card's own width (`+` on the first, `-` on the second), which lands
  both on the row centre given two `1fr` columns plus the gap. `--pile-rot` over-rotates them so the
  stack reads as a pile. The second card carries a `.12s` transition-delay so the top one lifts off
  first.
- **`[data-reveal-stagger] > .wcard { opacity: 1 }` is load-bearing.** The stagger reveal fades its
  children in from `opacity: 0`, so without this the cards faded in *while* separating and the pile
  was never visible. If the pile stops reading, check this rule first.
- Cancelled below 780px (one card per row, nothing to pile) and under `prefers-reduced-motion`.

### Outside of design: the playground (about page) - built 2026-09-08
`#hobbies` is no longer three photo-stack cards. It is a full-bleed **desk surface** where every
object is absolutely placed, individually tilted and **draggable**. It replaced `.pt-grid` /
`.pt-card` / `.pt-stack` / `.pt-link`, whose CSS has been deleted.
- **Everything is namespaced `pg-`** and that is deliberate: the design's natural class names
  (`.card` `.chip` `.tape` `.pol` `.dist`) all already exist in this stylesheet. Do not drop the
  prefix.
- **Ground:** a small **dot field** (`radial-gradient` at 22px), not a grid. The user removed a grid
  from Featured Works earlier and asked for dots here specifically.
- **Contents, reworked 2026-09-09.** A record sleeve with a **real audio player**, an artist card
  (the name "Atony", not the platform), three **app icons** (Strava / LinkedIn / Resume), a **Tekken
  polaroid**, a ruled notepad of chips, the `tools-ui.png` doodle, and the **photo wallet**.
  The blue collage, the Sumi sticker, the Strava route card, the "on repeat" ticket, the SoundCloud
  badge, the LinkedIn card, the Resume doc and the four-photo pile were all removed; their CSS is
  deleted, not orphaned.
- **The section now has real air above it**: `.pg-sec` carries `margin-top: clamp(96px, 13vw, 200px)`
  so it separates from the "Hi, I'm Anthony" intro (measured 187px at 1440).

#### The audio player
`assets/audio/latest-release.mp3` is the file to drop in. **It does not exist yet**, and the player
handles that: on error, or if `networkState === NETWORK_NO_SOURCE`, it adds `.is-unavailable`, dims
the button to 35% and sets `aria-disabled`, so nothing looks broken and clicking does nothing.
- **`preload="metadata"` means the error can fire BEFORE main.js runs**, so the code checks
  `audio.error || audio.networkState === 3` on init as well as listening for `error`. Listening
  alone silently missed it and left a live-looking play button that did nothing. Do not remove that
  initial check.
- The time readout counts **down**, and the progress bar is `.pg-prog__bar`.

#### One screen, and the nav gets out of the way
- **`.pgd` is `height: 100svh`** (min 620px, max 1000px). The section is meant to be taken in at
  once, so nothing on the surface needs scrolling to reach.
- **The section snaps into place**: `scroll-snap-align: start` on `.pg-sec`, with
  `scroll-snap-type: y proximity` on `html`. **Proximity, not mandatory** - the playground is the
  only snap target on the site and mandatory would fight ordinary scrolling through every other
  section. `scroll-snap-stop: always` was tried and **removed**: it forced the scroll to halt at the
  section even when flinging past, which read as far too grabby. Proximity alone only snaps once you
  are already close.
- **The nav collapses to a pill inside this section.** While `#hobbies` covers the top of the
  viewport, `.nav-outer` gets `.is-pill`: the full-width bar loses its background and border, and
  `.nav` becomes a small centred floating pill (measured 989px -> 307px). The wordmark and the link
  numerals are hidden. It expands again on the way out, and nothing changes anywhere else.
  - This **replaced** the earlier hide-on-scroll (`.is-hidden`), which is gone. The pill was the
    better answer to the same problem: the bar stops eating the top of the screen without the
    nav disappearing entirely.
  - **The top row of objects starts below ~12%** so it clears the floating pill. The Atony card in
    particular sat right under it before.
  - **CASCADE TRAP, cost an hour: `.is-stuck` and `.is-pill` have identical specificity (0,2,0).**
    `.is-stuck` is on at the same time inside the section (any scroll past 8px), so whichever rule
    sits LATER in style.css wins the `background`. With the pill block written above `.is-stuck`,
    the stuck bar's `rgba(250,250,250,.7)` painted a full-width white band behind the pill. The pill
    block now lives **after** the `.is-stuck` rules and the `@supports` fallback. Do not move it back
    up, and do not "tidy" it next to the other `.nav-outer` rules.
  - **`padding: 6px 16px 0` on `.nav-outer.is-pill` is measured, not eyeballed.** The full bar puts
    its link text centre at y=30 and the bare pill at y=24; the 6px makes the type sit on exactly the
    same line, so nothing jumps vertically during the morph.
  - **The morph animates `max-width`, not `width`.** `width: fit-content` is not animatable, so the
    pill is a fixed `max-width: 234px`. **This cap has to be re-measured whenever a nav item is
    added, removed or restyled** - it has already gone 340 -> 260 (Contact removed) -> 234 (Resume
    restyled from an outlined CTA to a plain link). Measure by setting `max-width: none;
    width: fit-content` on `.nav` with `.is-pill` on, then add ~12px. `.nav` transitions max-width,
    gap, padding, border-radius, background and box-shadow; the wordmark collapses via
    `max-width: 240px -> 0` plus opacity rather than `display: none`, so the whole thing reads as one
    move in both directions. Verified end states: 1160px -> 340px wide, radius 0 -> 92px, brand
    78px -> 0, link baseline unchanged.
  - **You cannot see this morph in `tools/snap.swift`.** WKWebView does not advance CSS transitions,
    so a render mid-toggle shows a frozen half-state that looks broken. Verify the two end states in
    the browser with transitions disabled instead.
  - **The handler is deliberately NOT `requestAnimationFrame`-throttled.** rAF callbacks do not run
    in `tools/snap.swift`'s WKWebView, so an rAF-throttled version was untestable and silently did
    nothing in every headless check. It is one `getBoundingClientRect` per scroll event on a passive
    listener. Do not "optimise" it back into rAF without a way to verify it.

#### The photo wallet (`.pg-wallet` + `.pg-photos`)
Click it and every loose object is pulled into the wallet, then ten photos burst out; click again
and it runs backwards.
- **The suck-in is JS, the burst is CSS.** Each object's flight path is *measured live*
  (`getBoundingClientRect`) rather than hardcoded, because the objects are draggable and may have
  been moved. The original inline transform is stashed in `dataset.baseTransform` and restored on
  close, so the tilt comes back exactly.
- The photos are positioned at the wallet and translate out via `--tx`/`--ty`/`--r` when `.is-photos`
  is on the stage, with per-child `transition-delay` so they spill rather than appear at once.
- A wallet rather than an OS folder icon on purpose: the rest of the section is a physical desk.
- Hidden below 900px along with the burst, where there is no room to fling anything.

#### The photos: drag and click-to-zoom (2026-09-09)
Five of them, deliberately fewer and larger than before (`clamp(150px, 14vw, 202px)`), scattered on
an arc over the wallet with hand-picked tilts.
- **Dragging writes `--tx`/`--ty`, not `left`/`top`.** Those are the same custom properties the
  burst animates, so dragging a photo does not break the collapse back into the wallet, and the
  tilt in `--r` survives untouched.
- **The drag flag is per photo, not shared.** A single shared `moved` flag meant dragging one photo
  swallowed the next click on a *different* photo. Keep it inside the `forEach`.
- **Click zooms to the middle of the surface.** `--zx`/`--zy`/`--zs` are set in JS. The offset is
  computed from the photo's **settled** position (`offsetLeft + tx`, `offsetTop + ty`), NOT from
  `getBoundingClientRect`: the transform is `translate(-50%,-50%) translate(tx,ty)`, so the settled
  centre is exactly that, and reading the live rect mid-burst would centre it on wherever the photo
  happened to be at that instant.
- **`.pg-photos` is a stacking context at `z-index: 100`**, so a zoomed photo at `z-index: 200` was
  still painting *under* the wallet at 120. The fix is lifting the whole layer
  (`.pgd.is-zoomedmode .pg-photos { z-index: 210 }`), not raising the photo.
- Escape, or a click on the surface, puts a zoomed photo back. A drag never counts as a click.
- The heading's description line under "Outside of design" was removed; only the title remains.

#### Photo placement is viewport-relative (2026-09-09)
`--tx`/`--ty` are authored in **`vw` / `svh`**, not px. Fixed px offsets were tuned for 1440x900 and
pushed photos off the surface at anything narrower, which is what "one of them is cut off" was.
Verified in bounds at 960, 1024, 1440 and 1920.
- **`@property` registers `--tx` and `--ty` as `<length>`.** This is load-bearing, not decoration:
  for an *unregistered* custom property `getComputedStyle` returns the literal authored string, so
  `"-29.3vw"` would `parseFloat` to `-29.3` and both the drag and the zoom-centring maths would be
  silently, badly wrong. Do not remove those two `@property` rules.
- Three photos sit across the top and **two below the wallet**, so the lower half is no longer bare.
- Note `.pgd` is `height: 100svh` but capped by `max-height: 1000px`, so on viewports taller than
  1000px the `svh`-based offsets drift slightly from true proportion. Checked at 1920x1080 and it
  still lands in bounds.

#### The portrait on the playground
`portrait.png` now also appears as a small `.pg-pol--tall` polaroid ("that's me") with the Hobbies
pad beside it. **It is deliberately the same image as the about intro**, so the portrait shows twice
on this page in two different treatments. If that ever reads as a mistake, the polaroid is the one
to drop, not the intro. `.pg-pol--tall` forces `aspect-ratio: 3/4`; the default `.pg-pol--solo` is
4/3 and crops a standing portrait badly.
- **Real data now in:** SoundCloud is `https://soundcloud.com/atonyn` (`@atonyn`), the Tekken rank is
  **God of Destruction 2**, LinkedIn and the Resume point at the same real URLs the footer/nav use.
- **`arch-collage.png` finally has a home here**, along with `tools-ui.png`. `hero-arch.png` was
  skipped on purpose: it is the same artwork as arch-collage at a tighter crop and read as a
  duplicate.
- **Layout is percentage based off a 1440x960 design.** Below **900px** the whole thing collapses to
  a plain stacked flex list, rotations go to 0, doodles hide and drag switches off.

#### Photo mode is an infinite pannable surface (2026-09-10)
With the wallet open, dragging the bare surface pans the space, and it wraps: keep dragging and the
same photos come back round.
- **The ground pans, the wallet does not.** The dot field, the "Outside of design" heading and the
  photos all move with the drag, so it reads as a ground moving under a fixed camera (the maps /
  Figma convention) rather than as loose photos being shoved about. Moving only the photos felt
  inverted. The wallet used to ride the pan too, but it is the only way out of photo mode and it
  could be dragged off screen, so it is now pinned to a dock (see "Photo mode dock" below).
  - Dots: `.pg-sec::before` uses `background-position: var(--pan-x) var(--pan-y)`. It tiles every
    22px so it wraps for free, no maths needed.
  - The heading rides `--px`/`--py` inside its transform, wrapping on the same world. `riders()` in
    the pan module is now just the heading; do not add the wallet back.
  - **The world floor is set by the WIDEST panned item, not by a photo.** The heading is far wider
    than a photo; sized off a photo it visibly popped as it wrapped.
- **No clones.** Each photo stays one element; its position is taken modulo a "world" larger than
  the stage, so leaving one edge re-places it at the opposite edge. `worldW`/`worldH` are at least
  `stage + 2 photo widths`, which is what guarantees the wrap always happens **off-screen** - shrink
  that margin and photos will visibly pop mid-screen.
- **The world grows with the photo count**: `sqrt(N * 430 * 380 * aspect)`, floored at the stage
  size plus the widest item. Verified end to end, not just on paper. Add more `.pg-photo` elements
  to the markup and the surface enlarges on its own.
- **Panning only starts on the bare surface** (`e.target === stage`), so it never steals a drag from
  a photo or a click from the wallet.
- **A photo dragged while panned is rebased** into world coordinates on release (`stage.__pgRebase`),
  otherwise the next pan frame would snap it back to where it was.
- **Opening the wallet always restores the authored arrangement.** The authored `--tx`/`--ty` are
  stashed as their original **vw/svh strings**, not resolved pixels, so restoring them re-resolves
  correctly at any viewport. Without this, one pan permanently lost the composed arc of photos.
- `.pgd.is-panning .pg-photo { transition: none }` - the burst transition otherwise makes every
  photo lag the cursor during a pan.

#### NEVER call preventDefault on pointerdown here
The object-drag and photo-drag handlers both used to call `e.preventDefault()` on `pointerdown`.
Per spec that suppresses the browser's compatibility mouse events, **including `click`** - so every
link inside a draggable object (SoundCloud, Strava, LinkedIn, Resume) was dead, and the photos'
click-to-zoom never fired either. Neither showed up in testing because synthetic tests dispatch
`click` directly and bypass the very thing that was broken.
- Both calls are gone. Selection is already handled by `user-select: none` on `.pgd`, scrolling by
  `touch-action: none`, and native image dragging by `.pgd img { -webkit-user-drag: none }`.
- **Regression test:** dispatch a cancelable `pointerdown` at an object and assert
  `event.defaultPrevented === false`. Testing that a manually dispatched `click` reaches the anchor
  proves nothing.
- **Second cause, fixed 2026-09-11: pointer capture.** The object drag called
  `el.setPointerCapture()` on `pointerdown`. With capture on, the browser retargets the click to the
  captured `.pg-it` wrapper instead of the `<a>` inside it, so real clicks on SoundCloud, Strava,
  LinkedIn, Resume (and the play button) went nowhere. Also, ANY pointermove set `moved`, so a 1px
  wobble during a click made the capture-phase guard cancel the link.
  - Now: pointerdown only records the start. Capture, the z-index bump and `.is-drag` begin in
    pointermove once the pointer has travelled 6px, and only then does `moved` become true.
  - **Verify with REAL clicks** (`computer left_click` on the link's ref, with a window click
    listener that records `e.target` and calls preventDefault so nothing navigates). Before the
    fix all four recorded the wrapper `pg-it` and no anchor; synthetic events never showed it.
  - The photo drag also captures on pointerdown, but there the captured element IS the clicked
    button, so its click is unaffected. Do not copy that pattern onto anything containing a link.
- **Third cause, fixed 2026-09-11: native link drag.** Once capture stopped happening on
  pointerdown, pressing a link and moving made macOS browsers (Safari especially) pick up the LINK
  itself as a draggable URL; the native drag fires pointercancel and the card drag died. Fixed with
  `.pgd img, .pgd a { -webkit-user-drag: none }`, `draggable="false"` on every link and image in
  the stage, and a cancelled `dragstart` on the stage (Firefox ignores the CSS property). The pane's
  Chromium does not reproduce this with automated drags, so check it by hand in Safari.

#### The about-page photo set (2026-09-11)
**41 photos**, `assets/graphics/about-photos/p01.jpg` ... `p48.jpg` (the user deleted p02, p06, p13,
p33, p39, p41, p45, p49 on 2026-09-11; the numbering keeps its gaps). Scattered on a jittered 7x6 grid
over about +/-118vw and +/-118svh, offset (+4vw, -14svh) so it centres on the visible middle of the
stage rather than on the wallet anchor. About 9 are on screen when the wallet opens at 1440x900.
- The markup is generated: `genphotos.py` in the session scratchpad held the (file, group, caption,
  alt) table. To add or drop a photo by hand, copy one `<button class="pg-photo">` line and edit its
  `data-group`, `--tx/--ty/--r`, image, `alt`, `aria-label` and caption. Nothing else needs updating:
  the world size, Sort and Scatter all read the DOM.
- **Every photo has a caption, alt text and a group**, written from looking at each image. Captions
  only name places that are unambiguous in the frame (Japantown sign, Bay Bridge, Golden Gate,
  Yosemite Valley, the Vendrs slide, EVO) and otherwise describe what is visible. Worth a pass by the
  user for anything personal (e.g. whose dog "sleepy pup" is).
- Groups (`data-group`): friends 10, travels 14, town 9 ("Around town"), gaming 3, music 2, school 3.
- **The source folder `assets/graphics/images for about me/` is NOT web-usable**: most files are
  **HEIC**, which Chrome and Firefox cannot display at all, and the originals run to 5712x4284.
  Converted with `sips` to JPEG, max 1000px, quality 70.
  - Redo with: `sips -s format jpeg -s formatOptions 70 -Z 1000 <in> --out about-photos/pNN.jpg`
  - **The 127MB original folder is still in the project.** Move or delete it before deploying - it
    is nearly all of the repo's weight and nothing references it.
- Photos carry `loading="lazy"` and `decoding="async"`, which matters at this count. Side effect: a
  photo flying in from off-screen during Sort can be blank for a moment on a slow connection.

#### Music: "My work" sleeve + site-wide mini bar (2026-09-11)
The old single-file "Latest release" player (which pointed at a `latest-release.mp3` that never
existed) is gone. The sleeve in the playground is now **"My work"**: a 6-track playlist with play,
**skip**, a counter ("1 / 6"), and the disc (`.pg-disc`) **spins while playing** and stops where it
is on pause (`animation-play-state`).
- **One module for every page**: the "Music" IIFE in `js/main.js` owns a single `new Audio()` and
  builds the mini bar (`.mp`) itself, so no page needs markup for it. Every control is found by
  data hooks (`data-mp-play`, `-next`, `-close`, `-vol`, `-title`, `-count`, `-bar`, `-time`), so
  the sleeve and the bar always show the same state from one `render()`.
- **When the bar shows**: music is active (started and not closed) AND the sleeve is not on screen
  (IntersectionObserver, 35%), OR photo mode is on (the sleeve is sucked into the wallet), OR any
  other page. In photo mode `body.mp-lift` raises it to `bottom: 150px` **only at <=1024px** (2026-09-11: the
  lift dated from when the bar was bottom right; bottom left already clears the dock on wider
  screens, and the user wants the bar in the same place on every page. Below 1025px the dock's Sort
  button does reach it: its left edge is about 50% - 160px and the bar ends near 330px).
  **Position: bottom LEFT** (`left: 22px`), moved from bottom right on 2026-09-11 at the user's
  request for the best spot: the chat buddy owns the bottom-right corner and its panel opens above
  it, and the middle holds the home page's scroll arrow and the playground's photo dock. The one
  thing it can sit over is the home hero's "[ Based in Sacramento, CA ]" line. Flip back with
  `right: 110px; left: auto`.
  **Compact and see-through**: white at 70% with a backdrop blur (90% on hover/focus), 30px disc,
  26px buttons. Layout: disc, title + "2 / 6 . time left", previous / play / next, volume, close,
  and a draggable progress line along the bottom edge.
  **Volume is an icon**: hovering (or KEYBOARD-focusing: `:has(:focus-visible)`, not `:focus-within`,
  which kept it open after a mouse click on mute) it pops a **vertical** slider up above the icon
  in a small frosted pill with the % under it (2026-09-11; it used to slide out sideways and widen
  the bar). Upright via `writing-mode: vertical-lr; direction: rtl` (0 at the bottom) plus
  `orient="vertical"` for older Firefox. A transparent `::after` bridge covers the 10px gap so
  moving up from the icon keeps the hover. `.mp` must NOT get `overflow: hidden` or the pill is
  clipped. Clicking the icon
  mutes/unmutes (`.is-muted` swaps the icon). On touch devices the whole volume control is hidden
  (iOS ignores `audio.volume`; hardware buttons do it).
- **Previous track** (card and bar, `data-mp-prev`): more than 3s into a song it restarts the song,
  otherwise it goes to the previous track (wrapping), like any music player.
- **Seeking** (`data-mp-seek`, `.pg-seek`): both the card's progress bar and the bar's bottom line
  can be clicked or dragged, and take Left/Right arrows (5s) when focused (`role="slider"`, aria
  values kept current). The hit area is 14-16px tall around a 3px line that thickens and grows a
  knob on hover. `pointerdown` stops propagation, so on the card it never starts a card drag, and
  the pointer is captured so a drag can leave the thin line. Seeking before a track has loaded
  is remembered and applied on `loadedmetadata`.
- The card's player is three rows (tidied 2026-09-11): **elapsed | progress bar | full length**
  (`data-mp-elapsed` / `data-mp-dur`, equal 26px min-width so the bar sits centred), then
  previous / play / next centred, then the volume row centred with a 78px slider. The volume row
  is exactly as wide as the controls row (106px) so the two read as one block; keep them matched.
  The bar's sub-line shows the same two numbers plus the track count: `elapsed / length . n / 6`
  (2026-09-11; it used to show the count and time left). `data-mp-time` is now unused.
- **Volume on the card** (2026-09-11, reworked): the mini bar's vertical pop-up, parked in the card's
  **top-right corner** (`.pg-cvol`, reusing the bar's `.mp__vol`/`.mp__volwrap`/`.mp__volpct`
  classes and data hooks). It opens **upward**, like the bar's (asked for 2026-09-11; it opened
  downward at first). Its pill is shorter (70px slider) because the card sits near the top of the
  desk and `.pg-sec` clips at its edge: a full-height pill is cut off when the stage is short. The old always-visible horizontal row was removed because
  it made the card feel lopsided; the card now ends on previous / play / next, centred.
  `data-mp-vol` / `data-mp-mute` stop `pointerdown` propagation so they never pick the card up.
  Hidden on touch devices, like the bar's.
- **Starts at 50% volume** (`START_VOLUME`); the slider (0-100) changes it and it is remembered.
- **Close** stops the music, clears the position and hides the bar.
- The playlist advances on its own at the end of a track and loops; a file that fails to load is
  skipped (at most once round the list).
- **Across pages**: the site is separate pages, so audio cannot survive a navigation. State
  (`anp_music` in sessionStorage: track, time, playing, volume, active) is saved every second and on
  `pagehide`, and restored on the next page, which calls `play()` again. **If the browser blocks
  autoplay on the new page (Safari usually does) the bar comes up paused at the same spot**; one tap
  carries on. There is always a short gap during the page change. Truly continuous playback would
  need the site turned into a single-page app (swap `<main>` over fetch); not done, it is a major
  change - ask the user first.
- The site root is derived from `main.js`'s own URL (`new URL("../", script.src)`), so the track and
  disc paths work from `/work/*.html` too.
- **Files**: `assets/audio/*.m4a`, AAC 160kbps, ~20MB total:
  `10dollar`, `feel-good-w-dnty` ("feel good w: dnty" had a colon, which breaks URLs),
  `unreleased-001..004`. Titles and lengths live in `TRACKS`. To add a track:
  `afconvert -f m4af -d aac -b 160000 "<in>.wav" assets/audio/<slug>.m4a`, then add a TRACKS line
  (`len` in seconds from `afinfo`, **rounded down**: it is shown until the file loads and the real
  duration is floored for display, so rounding up made the length tick back 1s on load).
  - **The 6 WAV masters now live outside the project** in `../Portfolio2.0 removed files/assets/audio/`
    (moved 2026-09-14, see "File cleanup"). Encode from there.
  - `python3 -m http.server` does not do HTTP range requests, so seeking can be flaky in the local
    preview; real hosts (Netlify, Vercel, GitHub Pages) support ranges.
- The disc art is `cd.jpg`, a scan of the Jet Set Radio soundtrack CD. Flagged to the user that
  under "My work" it may read as their release; their own "Reverie in Blue" cover is an option.

#### Energy drink tier list (2026-09-11)
**Currently switched off as work in progress (2026-09-11, user's call: the feature is not ready to
show yet).** The can carries `data-wip` in about.html, so: hover or focus shows a blue "Work in
progress" note above the can (`.pg-tiers__wip`), a click wobbles the can and holds that note for
2.2s (`.is-nudge`, the only cue a touch screen gets, since it has no hover), and the panel never
opens. The cue line under the label reads "coming soon" instead of "energy drinks". The tier module
in main.js returns early while `data-wip` is present, so none of the behaviour below is wired up and
the board is never built.
**To switch the finished list back on:** remove `data-wip`, `aria-disabled` and `aria-describedby`
from the button, restore `aria-haspopup="dialog" aria-expanded="false" aria-controls="pg-tierpanel"`,
delete the `.pg-tiers__wip` span, and set the cue back to "energy drinks". Everything described below
is still in the code, untouched.

A drawn blue can with an orange bolt sits on the desk at (55%, 81%), below the wallet, labelled
"Tier list / energy drinks". It is a `.pg-it` (draggable, and pulled into the photo wallet like
everything else). Clicking it pulls the loose objects into the can (the wallet's `suck()`, now
shared as `stage.__pgSuck(target)` / `stage.__pgRelease()`) and `#pg-tierpanel` grows out of the
can (main.js sets `transform-origin` to the can's centre). `.pgd.is-tier` hides the wallet and fades
the heading. Close with the x, Escape, or the can again.
- **Two tabs.** "My list" shows Anthony's ranking from `MINE` in the "Energy drink tier list" module
  in main.js; **while every tier is empty it shows a "still taste-testing" placeholder note**. To
  fill it: `var MINE = { S: ["ultra"], A: [...], ... }` using the drink ids. "Make yours" lets a
  visitor drag cans into tiers (ghost follows the pointer, the zone under it lights up), or tap a
  can then a tier, or focus a can and press S/A/B/C/D (0/Backspace unranks). Saved in
  `localStorage` (`anp_tierlist`); Reset clears it. New drinks added later land in Unranked.
- **12 drinks** in `DRINKS`: Red Bull, Monster, Monster Ultra, Celsius, Bang, Rockstar, Reign,
  Ghost, C4, Alani Nu, Prime, NOS. **Each is a real photo** (2026-09-11, downloaded with the
  user's go-ahead) from Wikimedia Commons, or Flickr for Ghost, all freely licensed, cropped to one
  can at 110x200 JPEG (~5-15KB each) in `assets/graphics/drinks/<id>.jpg` with `tools/cropimg.swift`
  (`swift tools/cropimg.swift in out.jpg x y w h 110 200`; keep crops 0.55 wide:tall). The
  originals were not kept.
  - Each drink carries `by` / `lic` / `src`; the panel builds a **"Photo credits"** `<details>` from
    them. **Keep it**: CC BY and BY-SA require attribution, and BY-SA crops must stay under BY-SA.
    Licences: Red Bull, Monster, Monster Ultra, Rockstar, NOS CC BY-SA 4.0; Prime CC BY-SA 2.0;
    Celsius, Bang CC BY 4.0; Reign, Ghost, C4 CC BY 2.0; Alani Nu CC0.
  - Crop notes: Ultra is the top half of the classic white can in a group shot (the front row hides
    the rest); C4 is cropped to the can only (the source photo has a person); Ghost comes from a
    pile of cans and is the weakest image; Red Bull, Prime and NOS show a sliver of neighbouring cans.
  - To swap one: crop a new photo to 110x200, overwrite `assets/graphics/drinks/<id>.jpg`, and update
    that drink's `by` / `lic` / `src`. A drink with no `img` falls back to a drawn can in its `c`
    colours.
- Tiers run S to D in orange to blue (brand pair, not the usual rainbow).
- **The drag only captures the pointer once it has moved 5px.** Capturing on `pointerdown`
  retargeted the click to the board, so tap-to-place silently did nothing (the same trap as the
  desk's card drag, see "Links inside draggable objects"). Verified with real clicks.
- Panel is `min(600px, 100% - 48px)` wide and scrolls inside itself if the stage is short. On
  phones (<=900px, where the desk is a stacked list) there is no pull-in and it opens as a fixed,
  centred sheet over a dimmed page.
- The drag guard on the desk now covers `button` as well as `a`, and calls `stopPropagation`:
  `preventDefault` alone does not stop a button's own click listener, so dragging the can used to
  open the list on release.
- The music bar also shows while the tier list is open (the "My work" card is pulled off the desk).
- **Phone sheet stacking fix (2026-09-14).** On phones the panel is a fixed sheet with `z-index: 300`,
  but `.pgd` is `position: relative; z-index: 1`, which is a stacking context, so the whole playground
  (the sheet and its 100vmax dimming shadow) competed with the rest of the page at layer 1. The About
  portrait's doodle star (`.about-hero__photo .doodle-star`, z-index 3) painted on top of the open
  sheet, and the nav showed through undimmed. Fixed in the phone media query by raising `.pgd.is-tier`
  to 310; the drop back is delayed .45s (`transition: z-index 0s linear .45s`) so the star cannot
  flash over the sheet while it fades out. **The star was never misplaced and was not moved**:
  moving it would have changed the About hero for every visitor and would only have fixed the one
  scroll position tested. Desktop is unaffected (there the panel is absolute inside the stage, far
  from the hero). Only reachable once `data-wip` is lifted. Verified at phone width (298px) on a throwaway
  copy with the flag removed: while open, the sheet is the topmost element at the star's centre and
  `.pgd` computes 310; nav (150), chat (140), buddy (130), music bar (129) and progress (200) all dim
  under it; opening from the can's own scroll position works too; after close `.pgd` returns to 1 and
  the star is back on top at 1.1s and 2.3s, with focus returned to the can.

#### Music across page changes: fade, not cut (2026-09-11)
- The page-change wipe now dispatches `anp:leave`; the Music module fades the audio out over the
  wipe (560ms) instead of it cutting off at unload, and the next page starts it silent and fades it
  in (900ms) once it is actually playing. There is still a short silence while the new page
  loads; removing that entirely needs the site turned into a single-page app (not done, major).
- **`st.vol` is now the listener's volume and the only thing saved.** A separate `fade` factor
  (0..1) multiplies it into `audio.volume`, so a fade never overwrites the saved level. Do not read
  `audio.volume` as "the volume" anywhere; use `st.vol`.
- **Back/forward**: a page restored from the browser's back-forward cache fires `pageshow` with
  `persisted`. The Music module re-reads the saved state and resumes from it (the cached page's own
  state is stale), and the wipe (`.pt`), which was left down when the page was cached, is lifted.

#### The Hobbies card (2026-09-11)
The ruled notepad (`.pg-pad`) was "Everything else"; it is now **Hobbies** with seven chips:
Music production, Design, Consuming energy drinks, Games, Running, Sports, Traveling (blue on the first
and last, orange on the energy drinks). It is taller than before, so check it clears the wallet.

#### Photo mode dock, glide, Sort and Scatter (2026-09-11)
- **The wallet docks.** In `.is-photos` it drops (after a .38s delay, once the photos are out) from its
  desk spot (50%, 64%; it was 46% until 2026-09-11, when it covered the right edge of the
  taller Hobbies card at 1024 wide. The photo burst anchor stays at 46%, still inside the wallet) to bottom centre, `top: calc(100% - 132px)`, scaled .8, and stays fixed while
  the ground pans. Closing sends it straight back up as the photos collapse into the anchor. The
  transitions are on `left`/`top` directly; that is what the two `.pg-wallet` transition rules are for.
- **Sort / Scatter** (`.pg-arrange`, `data-arrange="sort|scatter"`) sit either side of the docked
  wallet, offset by `clamp(60px, 5.44vw, 74.4px) + 20px` (half the scaled wallet width plus a gap).
  Hidden with `visibility` as well as opacity so they are not tabbable outside photo mode. Sort is a
  toggle (`aria-pressed`); Scatter is an action.
- **Sort** lays the groups out as ONE horizontal strip, every group the same number of rows, so it
  fits the screen height and you pan sideways between groups. `plan()` picks the largest scale from
  .84 down to .6 that fits 4 rows between `TOP` (84px, clear of the nav pill) and `BOTTOM` (150px,
  clear of the dock), writes it to `--sort-s`, and `.is-sorted .pg-photo` applies it via `--s`.
  Verified: 1440x900 -> .76, 27 photos on screen; 1024x700 -> .64, 27 on screen; 0 overlaps both.
  The strip starts where you are looking (screen -> world is `-pan`). It can be longer than the band,
  in which case its tail (School) wraps to the far side - correct, you reach it by panning on.
  - Group order and names live in `GROUPS` in the pan module. An unknown `data-group` still sorts,
    into a group named after the key, at the end.
  - Group names are `.pg-group` spans created in JS inside `.pg-photos`, positioned in world
    coordinates and wrapped like everything else. **Their position is never transitioned** (it would
    fly in from the corner); only opacity and a small rise on the separate `translate` property.
  - `measure()` sizes the world to fit the sorted strip plus `3 * GAP`, so the strip's two ends can
    never overlap. It is computed at every capture, so it never changes between Sort and Scatter.
- **Scatter** is a fresh random throw every time: a jittered grid over the whole world (the torus),
  slots shuffled, tilt +/-12deg. Opening the wallet still restores the authored layout.
- **The move animation**: each photo gets a random 0-.3s `transitionDelay`, and `.is-hopping` plays
  `pgHop` (two bounces) on the separate `translate` property so it stacks on the transform that is
  transitioning. Everything is cleared by `settle()` after 1.3s. Reduced motion: no delay, no hop.
- **Glide**: pointermove keeps a smoothed velocity (px/ms); release starts a rAF loop with friction
  `0.995^dt`, capped at 4px/ms. Pausing 90ms before release means no glide. A capture-phase
  `pointerdown` on the stage stops any glide first, so it can never fight a photo drag or a button.
  **The in-app preview throttles rAF**, so the glide looks sluggish there; measure it with a
  `setTimeout` rAF shim. Measured that way: a 1.3px/ms flick glided 266px over about 1.4s
  and stopped cleanly; a release after a pause did not glide at all.
- `.pgd.is-sorted .pg-hd` drops the heading to .1 opacity so it does not read through the groups.

#### Photo captions
Each burst photo carries a `.pg-photo__cap` in Caveat, replacing the blank `::after` lip that used
to fake the polaroid border. Captions describe what is actually in the frame - one initially read
"the crew" over a board-game photo and was corrected to "game night". The photos are ~28px taller
as a result; re-verified in bounds at 1024 and 1440.

#### Dragging
A pointer-events IIFE at the end of main.js. Notes:
- It only ever writes `left`/`top`. The tilt lives in each object's inline `transform`, so dragging
  never fights the rotation.
- z-index increments on grab so the dragged object comes to the front.
- A capture-phase `click` handler cancels the navigation if the pointer actually moved, so dragging
  a card that is a link does not also open the link.
- Guarded by `matchMedia("(min-width: 901px)")`, matching the CSS collapse.
- Positions are **not persisted**; a reload resets the arrangement.

#### Scribble pack: tried and reverted (2026-09-11)
The user added `assets/graphics/Free_Scribble_Textures_100+/` and a set of its scribbles briefly
replaced the stars on the home and about pages; **the user asked to go back to the stars**, so every
page is exactly as it was before. Left behind on purpose:
- `tools/doodlecrop.swift` - cuts one scribble out of a sheet, trims it, and bakes in a colour
  (`swift tools/doodlecrop.swift "<sheet>.png" x0 y0 x1 y1 out.png [maxdim] [hex]`, box in the
  coordinates of the sheet viewed 2000px wide). Bake the colour; do not use a CSS mask, masks are
  blocked on `file://` pages.
- **The pack folder itself (35MB, including the .ai) is still in `assets/graphics/`.** Its license
  allows use on the site but not redistributing the files, so move it out before deploying or
  pushing to a public repo.
- Known, unchanged: the blue playground star at (69%, 62%) sits under the "Currently working on"
  card (card z-index 5, stars 4), so it is not visible.

#### The sketch layer (`.works-sketch`)
Loose doodles behind the work cards so the section reads like a sketchbook page rather than a
product grid. Added 2026-09-08 when the user asked for "doodles or things behind the case studies".
- Five marks: two `star.png` doodles (one tinted orange via a second filter, one blue),
  `coffee.png` (the hand-drawn cup), an inline-SVG curved arrow, and an inline-SVG squiggle.
  Everything is `aria-hidden` and `pointer-events: none`.
- **Built the same way the old grid ground was**: `position: absolute; inset: 0; z-index: -1` inside
  a `#works` that carries `isolation: isolate` (set inline on the section). That keeps the marks
  behind the cards **without** a `> *` position rule, which is what broke the section's own doodle
  star the first time.
- **Keep every placement inside 0-100%.** A first pass used `left: -4%` and the star was clipped by
  the viewport edge, which reads as a rendering fault rather than a mark. Also keep them clear of the
  sticky nav: the arrow was originally at `top: 1%` and collided with the Resume button.
- The cards are opaque white sheets, so anything placed behind them is invisible. The marks live in
  the page margins, the gap between the two columns, and the space above and below the cards.
- Responsive: four of the five hide at <=900px (no room once the cards stack), and the whole layer
  is `display: none` below 620px.
- **`star.png` is near-black line art** and is tinted with a long `filter:` chain (`brightness(0)`
  then hue-rotate). There are two variants, `.sk-star` (blue) and `.sk-star--orange`. Note these
  filters do NOT render in `tools/snap.swift`, stars come out black in headless renders and are
  correctly tinted in the browser. Do not "fix" that based on a snap.

#### Removed on request (2026-09-08)
- **The graph-paper section ground** (`.works-ground`) and the `--grid-line` / `--grid-cell` tokens.
  Added and then removed a message later.
- **The full-bleed arch band** (`.archband`) that closed the home page.
  **`assets/graphics/arch-collage.png` is therefore UNUSED** (moved out 2026-09-14), it is the renamed
  `new header maybe.png`, the uncropped 1440x836 original of the art in the hero's
  `header-image.png` (548x795, same collage cropped to a portrait with the mascot composited in
  front). The user asked for it somewhere other than the header and then asked for that placement
  removed, so **it still needs a home.**

- **about.html**, intro (**photo LEFT**, copy right, single slightly-tilted portrait + doodle star;
  "Hi, I'm" is IBM serif italic, NOT handwriting) and the **playground** (`#hobbies`).
  Experience and Education were both removed on 2026-09-09 and live in
  `archive/`. Links css/js with
  `?v=rN` for cache busting, **bump N on every css/js edit** or the preview serves stale files.

### about.html sections (CSS blocks at end of style.css)
- **`#experience` WAS REMOVED on 2026-09-09** ("no real world experience yet"). The accordion, its
  two-column shell (`.rescol` / `.acc` / `.resrow`) and the accordion IIFE in main.js are all gone.
  - **It is archived, not lost:** `archive/experience-section.html` (**now at `../Portfolio2.0 removed files/archive/`**, moved 2026-09-14 with the logos it uses) is a **self-contained** copy that
    still renders (it inlines the CSS rather than linking `css/style.css`, so it keeps working now
    that the live rules are deleted), plus two screenshots and `archive/RESTORE.md` saying exactly
    where each of the three pieces went.
  - **Education was removed too**, later the same day. It was briefly kept as a standalone
    `#education` section; that is now gone as well, along with all `.edu*` CSS. Both versions (the
    original compact block and the standalone section) are recorded in `archive/RESTORE.md`.
  - **about.html is now just two sections: intro -> playground.** Its `<meta
    name="description">` was updated at the same time, because it still advertised "Experience,
    toolkit, and life beyond the canvas" and neither of the first two existed any more.
  - The four company logos (`logo-include.jpg`, `logo-prod.png`, `logo-di.jpg`, `logo-atd.jpg`) were
    deliberately **left in `assets/graphics/`** even though nothing references them now.
  - The chat bot still answers the "experience" question with those four roles. Its link used to be
    `about.html#experience`; that anchor is gone, so it now points at `about.html`. **If the roles
    should stop being advertised, edit `INTENTS` in main.js too.**

- **`#hobbies`, "Outside of design", `.pt-grid` / `.pt-card`**: three boxed cards in three columns
  (Music production, Running, Friends). Each card leads with a **`.pt-stack`: three photos fanned
  from a single photo-sized footprint**, two peek out behind the top one at rest and spread further
  on `.pt-card:hover`. That is how several images fit per card without a bulky collage.
  **Keep the fan inside the card**: the stack has `margin-inline: 10px`, back photos are scaled
  ~0.87, and translate stays <=7%, larger values push the photos past the card border. The stack
  also has `max-height` (300px, 240px on mobile) because a full-width card would otherwise blow the
  4:3 ratio up to something enormous; images use `object-fit: cover` so the cap just crops.
  At <=900px it is 2-up and the third card keeps a normal width (it must NOT span full width).
  Cards carry **service links as `.pt-link` pills** (icon + label, brand colour on the mark and on
  hover): SoundCloud + Spotify on music, Strava on running. Icon-only was avoided deliberately, 
  the label plus the pill shape is what makes it obvious what each is and that it is clickable.
  The three brand SVGs are inline in about.html. **All three hrefs are still generic service
  homepages** and need the real profile URLs.
- **The Snapshots filmstrip carousel was removed (2026-09-09).** `.snaps` / `.filmstrip*` markup and
  CSS are both deleted, and `.filmstrip__track` was dropped from the marquee-clone selector in
  main.js. **`photobooth/prod-bass.mp4` and `photobooth/prod-clip.mp4` were deleted** on
  2026-09-10: they were only ever played in that carousel. They are still in git history (committed
  in `46f77c3`), so `git checkout 46f77c3 -- <path>` brings them back. The nine photobooth stills
  stay; the playground's photo wallet uses them.
  - Note the marquee-clone line in main.js still names `.marquee__track` and
    `.footer__wordmark-track`, and `.marquee*` CSS plus the `scrollx` keyframe are still in
    style.css. **All of that was already dead before this change** (zero markup anywhere), so it was
    left alone rather than folded into an unrelated request. It is safe to prune.
- **Removed**: the sketchbook/sticker experiment, the hobbies bento (`.hobby*`), and the photobooth
  strips (`.pbstrip`/`.pbframe`), CSS, markup, and JS all deleted.

**Gotcha worth remembering**: a percentage `height`/`max-height` on an image inside a
`display:grid; place-items:center` box resolves to `auto`, so tall Sumi art overflows its container.
Fix that already applied in two places (`.pastime__sumi`): absolutely centre the image and clamp it
with percentage `max-width`/`max-height` against a `position:relative` parent.

## Footer (shared by ALL five pages)
Simplified to match michellegore.com: one row, `.footer__hello` ("Thanks for stopping by,
let's chat.") then three `.footer__group`s with small uppercase `.footer__label`s (Contact / Menu /
Elsewhere), over a thin `.footer__bottom` bar with the copyright and the "made with" line. Light `--band`
ground, no colour block.
- **The old CTA footer is gone**: mascot, eyebrow, giant title, email button, "open to internships"
  chip and the star-prefixed nav were all removed (markup + CSS). Sumi still appears site-wide via
  the floating `.buddy` button, the hero, `#meet`, and the page transition.
- `id="contact"` is retained on `<footer>`, the nav's Contact link targets it.
- **Menu group (2026-09-14):** the nav's links (Works, About, Resume) are repeated in the footer.
  Resume moved out of Elsewhere, which is now LinkedIn only, so no link appears twice. The hrefs follow
  each page's own nav (`#works` on home, `index.html#works` on about, `../` paths on case studies), so
  **the footer markup is no longer identical across pages: edit each page's Menu hrefs separately.**
  Grid: four columns above 1000px; at 1000px and below the line takes its own row with the three groups
  under it (four columns squeezed the email address); one column at 720px and below.
- The markup is the same on all five pages apart from the Menu hrefs (see above). **If you edit it,
  edit all five.**

- **work/vendrs.html**, **work/qac-gallery.html**, **work/uc-davis-app.html**, case studies with a **sticky vertical left section-nav** (`.case-nav`, plain text, flush to left margin, scroll-spy highlight via a scroll-position calc in main.js), `.cs__body` content column. Senior-UX-voice copy, real imagery, sticky-note process artifacts, doodle annotations. **No em/en dashes anywhere.**

## Design system (css/style.css `:root`)
- Fonts: **Archivo** (`--sans`, everything; was Overused Grotesk until 2026-09-23), **IBM Plex Serif** (`--serif`, italic accent
  words via `.serif` / `.sec-title`), **Caveat** (`--hand`, handwritten doodle labels only).
  **All three are now linked in all five pages, about.html included.** The old rule that "about must
  not use the handwriting font" is dead: the playground's polaroid captions and `.pg-hand` already
  used `--hand`, and the nav wordmark now does too.
  - **about.html had been missing its Caveat `<link>` the whole time the playground existed**, so
    those captions were silently falling back to Bradley Hand on macOS and to generic `cursive`
    anywhere else. Fixed 2026-09-10 - if you ever see handwriting look wrong on one page, check the
    font link before touching the CSS.
- Palette: `--blue #213c97` and friends; light bg. Blue-duotone photo recipe (`.duo`).
- **Orange is the secondary accent (added 2026-09-08).** Two tokens, and the split matters:
  - `--orange: #b3491a` is the **text-safe** one, 5.18:1 on `--bg`, measured in-browser, so it
    clears AA for the 12px `.sec-eyebrow` labels. Use this anywhere orange carries type.
  - `--orange-hi: #ef7a34` is **bright and decoration-only**, doodles, tape, the heading rule.
    It does NOT pass contrast for text; do not put copy in it.
  - `--orange-soft: #fbe9dd` for tints.
  Currently used on: section eyebrow labels, the hand-drawn `.sec-rule` under each heading, the
  card tape, the card's hover pill/arrow states, and one of the sketch doodles. The blue stays
  primary, orange is an accent, not a co-lead.
- **Container:** `--maxw: 1160px` + `--gutter: clamp(20px, 7vw, 112px)`.
  **Read this history before changing it, it moved twice in one session.** It started at
  1240/7vw/112px; was widened to 1320/5vw/80px when the user asked to "move the margins closer
  together"; then they clarified they wanted **more** space at the sides, so it landed at
  **1160**/7vw/112px. **"Margins closer together" meant more page margin, not less.**
  The older note that widening
  makes the hero's scroll cue collide with `.buddy` no longer applies: the cue now sits *above* the
  buddy rather than beside it.
- **`.wrap` was realigned at the same time and this is the important part.** The nav and the hero are
  "full width, gutter padding on the outside, `--maxw` cap on the inside". `.wrap` used to be
  `max-width: var(--maxw)` with the gutter *inside* that cap, which made every body section about
  100px narrower than the nav above it. It is now
  `max-width: calc(var(--maxw) + var(--gutter) * 2)`, so the content column is identical to the
  nav's at every width. Verified at the current values: at 1440 nav/works/meet all sit at left 140;
  at 1600 all at 220; at 1024 all at 72; at 390 all at 27. **If you change one of these three width
  rules, change all three or the page stops lining up.**
- **Section headings were rebuilt on 2026-09-08** to match creatiie.framer.website's
  "PROJECTS THAT TELL STORIES" / "Projects" pairing: a small **orange** uppercase `.sec-eyebrow`
  label with a short leader rule, over a large sans `.sec-title`
  (`clamp(30px, 4.3vw, 56px)`, `line-height: 1.0`, `letter-spacing: -0.032em`, `max-width: 16ch`),
  with a loose hand-drawn `.sec-rule` underline beneath it in `--orange-hi`.
  - **The titles are sentence case, NOT all caps.** They were briefly uppercase (matching the
    reference) and the user asked for that removed.
  - **`.sec-eyebrow` labels are GONE from every page** ("Projects", "Background", "Pastimes",
    "A BIT ABOUT ME", "THE PERSON BEHIND THE PIXELS"). The user asked for all of them removed. The
    CSS rule is still there but nothing uses it; delete it if it is still unused later.
  - `.sec-rule` is an inline SVG span placed right after each `<h2 class="sec-title">`. It is on
    `#works` and `#meet` (index) and `#experience` and `#hobbies` (about); it is explicitly hidden
    on the about intro (`.about-hero__copy .sec-rule { display: none }`).
  `.sec-eyebrow` used to be `display: none` and is now the label, it was already in the markup on
  `#meet` and the about intro, and was added to `#works` ("Projects"), `#experience` ("Background")
  and `#hobbies` ("Pastimes").
  - **This supersedes the old "type scale is the original, do not enlarge" note**, which came from an
    earlier request. The user asked for the reference's treatment explicitly.
  - **The about intro is deliberately exempt.** `.about-hero__copy .sec-title` keeps the original
    IBM Plex Serif italic at `clamp(26px,3.2vw,40px)` and `text-transform: none`, because
    "Hi, I'm Anthony" is a signature, not a section heading.
- Hero type is set independently of that scale (`clamp(32px, 3.5vw, 49px)`), see the hero section.
  - **Watch the fixed `.buddy` mascot** (bottom-right, 22px + 74px) when placing anything in that
    corner. The hero's scroll cue is centred rather than right-aligned partly for this reason.
- **Custom cursor is OFF.** The site uses the normal system cursor. It was rebuilt and switched on
  2026-09-12, then **switched back off the same day at the user's request**. It is now gated by
  `var CURSOR_ENABLED = false` in the cursor module of `js/main.js`; set it to true to bring it back.
  The CSS is inert while it is off, since nothing adds `body.cursor-active`. Everything below
  describes how it behaves when enabled, and all of it still works.
  - **Delegated off `document`, not bound per element.** The old version attached `mouseenter` to a
    fixed list at startup, so anything built later (the wallet's photos, the tier list's drinks)
    never got a label. One listener now, and late DOM works for free.
  - **The word comes from the nearest `data-cursor` ancestor**, else the `SELECTORS` fallback list in
    the cursor module. `data-cursor="Whatever"` overrides; `data-cursor=""` silences. Six elements
    still carry the original `data-cursor="view"` and keep working.
  - **Order in `SELECTORS` matters: first match wins, so inner controls must sit ABOVE `.pg-it`.**
    The playground's links and player buttons live inside draggable `.pg-it` wrappers, so listing
    `.pg-it` first made every link say "Drag" instead of "Open". Vocabulary: View, Photos, Soon,
    Arrange, Play, Skip, Scrub, Open, Look, Drag, Chat. `WARM` renders a word in orange (Soon, Chat)
    instead of blue.
  - **`cursor: none` is scoped, not global.** The playground's grab/grabbing hands and the zoomed
    photo's zoom-out are real affordances and are preserved explicitly in the CSS. Note the zoom rule
    must be `body.cursor-active .pgd.is-photos .pg-photo.is-zoomed` to outrank the `.pg-photo` grab.
  - Fine pointers only (`finePointer && !reduced`), and the dot/ring are already hidden by media
    query on coarse pointers and reduced motion. During a drag both fade out (`.is-quiet`).
  - Cost measured at 0.0004ms per lookup (about 40,000 per 16ms frame), so no throttling needed.
- **Loading behavior (js/main.js):**
  - Long mascot+name **preloader shows once per session** (`sessionStorage 'anp_intro'`), then is
    skipped; subsequent page loads use only the short transition.
  - Short **page-transition wipe** (`.pt`) plays on every internal nav; it shows the mascot, the word
    **"loading"** (`.pt__loading`), and a **loading bar** (`.pt__bar`) positioned lower, below the mascot.

## Assets
- In project: `assets/graphics/vendrs/` (login, business-type, events-map, design-system + 4 videos),
  `assets/graphics/qac/` (events-cards, event-detail, workshop, rent-space),
  `assets/graphics/ucd/` (wf-home, wf-events, wf-account, mid-fi wireframe slides),
  plus `sumi/` (19 mascot poses), `photobooth/`, `portrait.png`, `star.png`, company `logo-*.jpg/png`.
- **`portrait.png` (about page, served as `portrait.jpg` since 2026-09-14), Sep 2026.** The user dropped in a new full-body shot, 1086x1448,
  named `portrait.PNG` with an **uppercase** extension, replacing the old `portrait.jpg`. It is now
  cropped to **876x1060** and saved lowercase, because `.about-portrait` is `aspect-ratio: 380/460`
  (= 0.826) and `.about-hero__photo img` is `width: 100%` at the file's natural ratio, so the file
  itself has to carry the 0.826 shape. Recipe, from the untouched original:
  `sips -c 1060 876 --cropOffset 380 0 <original> --out portrait.png`. That trims dead wall above
  and pavement below and leaves the subject horizontally centred.
  - **Filename hazard:** macOS is case-insensitive, so `portrait.PNG` and `portrait.png` are the same
    file. `mv new.png portrait.png && rm portrait.PNG` therefore deletes the file you just wrote.
    Always keep an untouched copy outside the project before renaming, and keep the extension
    lowercase, a case-sensitive host would 404 on `portrait.PNG`.
- **Sumi poses were reprocessed (Aug 2026): enclosed transparent interiors are now filled opaque
  white** (they used to show the background through the body). Done with a Swift/CoreGraphics
  morphological-closing flood fill (dilate opaque mask ~10px to seal line gaps → flood exterior →
  fill unreached transparent px white). If new poses are added with the same problem, rerun that
  approach (no ffmpeg/ImageMagick on this machine; `swift` works).
- **Original/source exports** (outside the project, on the Desktop / Downloads):
  `~/Downloads/NEW PORTFOLIO GRAPHICS/` (has `vendrs assets/`, plus many raw graphics),
  `~/Downloads/QAC Exports/`, `~/Downloads/UC Davis Mobile REDESIGN/`.

## Verifying animation: what the two engines can and cannot do
Two different renderers, two different blind spots. Both cost real time on 2026-09-08.

**The in-app preview (Browser pane)** does not scroll, does not run IntersectionObserver, and does
not advance CSS transitions.
- A control `IntersectionObserver` created by hand never fired either, and `scrollIntoView` left
  `window.scrollY` at 0. So **you cannot test scroll-triggered behaviour here at all** - not the
  reveals, not the nav's `.is-stuck`, not the work cards' pile. Do not conclude the code is broken.
- `requestAnimationFrame` never fires while the pane is hidden, so `await new Promise(r =>
  requestAnimationFrame(r))` hangs until the tool times out. Use `setTimeout`.

**`tools/snap.swift` (WKWebView)** does scroll and does run IntersectionObserver, but **also does not
advance CSS transitions** - it renders offscreen, so a transitioned property stays frozen at its
"from" value forever.
- This made the photo pile look permanently broken: an injected `!important` hover transform was
  correctly applied (a probe confirmed the custom properties resolved) yet every render showed the
  stack closed. **Add `transition: none !important` to any injected override** before rendering a
  hover/end state.
- Because it does scroll, snap IS the way to verify scroll behaviour: inject a script that drives
  the page and writes the result into a big fixed-position element, then screenshot that. This is
  how the Featured Works reverse animation was confirmed.

## Superseded note: transitions do NOT advance
The in-app preview does not run CSS transitions to completion, so `getComputedStyle(...).transform`
returns a **stalled** value, usually the pre-transition one. This cost real time: the pile animation
measured as `matrix(1,0,0,1,0,0)` (identity) on both the piled and separated states, and even an
inline `transform: rotate(-2.6deg)` read back as identity a full second later, which looks exactly
like a broken transform.
- **The element had an active `CSSTransition`** (visible via `el.getAnimations()`), frozen at its
  start value.
- **To verify a transform state, kill the transition first:**
  `papers.forEach(p => p.style.transition = 'none')`, toggle the class, then read. That returns the
  true end state.
- Also note `requestAnimationFrame` never fires while the Browser pane is hidden, so an
  `await new Promise(r => requestAnimationFrame(r))` hangs until the tool times out. Use
  `setTimeout` instead.
- The same caveat is why the nav's `.is-stuck` state cannot be exercised by scrolling here.

## Fixed: a broken comment was eating a CSS rule (pre-existing)
`css/style.css` had a comment header whose opening `/*` was missing, leaving
`FILMSTRIP ... ===== */` as stray text at the top level. A CSS parser reads that as a selector and
keeps consuming until the next `{`, so it swallowed the rule that followed and
**`.snaps { overflow: hidden }` never applied.** The `/*` and `*/` counts still balanced, which is
why brace-counting sanity checks did not catch it. Repaired 2026-09-08.
- To check for this class of bug: strip `/*...*/` pairs and confirm no `*/` remains, rather than
  just counting delimiters.

## No em or en dashes, anywhere
The user asked for these gone site-wide, not just in the case studies. As of 2026-09-08 there are
**zero** `-` (em) and `-` (en) characters in `index.html`, `about.html`, `work/*.html`, `js/main.js`
and `css/style.css`, comments included. The chat bot's `INTENTS` answers were the main source; they
now use colons and full stops instead. Keep new copy clean.

## Near-miss worth knowing about (2026-09-08)
A script that replaced the work-covers CSS block computed its slice as
`s[:s.index(START)] + new + s[s.index(END):]` **without checking that START came before END**. It
ran backwards and silently deleted ~840 lines of style.css (1402 -> 563), taking `.rescol`, `.acc`,
`.pt-card`, `.filmstrip` and the whole about-page block with it. Brace counting still balanced, so
it looked fine; the about page just rendered unstyled.
- **`git HEAD` was NOT a safe restore point**, the working tree carries a lot of uncommitted work
  from earlier sessions (HEAD's style.css is ~390 lines shorter).
- It was recovered from the **previous session's scratchpad mirror**, which still had the intact
  file:
  `/private/tmp/claude-501/-Users-atony/<previous-session-id>/scratchpad/preview/css/style.css`.
  Those per-session scratchpads persist under `/private/tmp/claude-501/-Users-atony/`, so an
  older mirror is a usable backup until the OS clears it.
- **Lessons:** assert `start < end` and sanity-check the byte count before any index-based splice;
  and since this work is not committed, `git` is not a net. **Committing would make this much
  safer.**

## Environment gotchas
- Preview browser runs at **devicePixelRatio 2 (retina)** → full-window screenshots sometimes render
  tiny/misscaled. Verify exact sizes/positions via DOM measurements (`javascript_tool`); grab clean
  screenshots at a **~1200px width**, or isolate a section (hide sibling `main` children) and shoot at scroll 0.
- Programmatic scroll in the preview **does not fire `scroll`/`rAF`** reliably → can't exercise IO/scroll
  handlers via `scrollTo`; verify their logic by computing expected result instead.
- No ffmpeg / ImageMagick / PIL. Use `sips`, `qlmanage`, `swift`, `avconvert`. `qlmanage` can't thumbnail
  the `.webm` videos.
- zsh doesn't word-split unquoted vars. The Bash "safety classifier" occasionally goes down for a few
  minutes (writes/MCP tools blocked, read-only Bash still works), wait and retry.
- Videos: onboarding & marketplace are **.webm** (Safari won't play them). No mp4 fallbacks yet.

## Design-review workflow (HTML -> PNG mockups)
The user prefers to **see an image before anything is built**. There is a headless renderer for that
at **`tools/snap.swift`** (kept in the project so it survives the session):
`swift tools/snap.swift in.html out.png 1440 900` -> a 2880x1800 PNG via WKWebView. It waits for load plus
3.5s so webfonts settle. Point the mockup at copies of `header-image.png` / `star.png` and a small
standalone stylesheet.
- **Namespace mockup class names.** The shared mockup stylesheet defines `.copy` and `.fig`; reusing
  those names in a new layout silently centred the text and snapped the figure to centre. The
  surviving layouts use an `.hx-*` prefix for everything.
- Keep `white-space: nowrap` on multi-word accent phrases ("user-centered", "Figma + Claude") or they
  break across lines at the hyphen / plus.

## Open / possible next steps
- Several case-study images/videos are **placeholders**, the user plans to revisit them in depth later.
- Provide **mp4 versions** of `onboarding.webm` + `marketplace.webm` for Safari; poster frames for videos.
  (`avconvert` cannot decode webm; a browser-canvas frame grab works for posters but retrieve the
  base64 in ≤8KB chunks, one giant paste gets truncated.)
- Real **Spotify / SoundCloud / Strava profile URLs** for the `about.html` `.pt-link` pills, all
  three still point at generic service homepages.
- QAC/UC Davis could use more real screens (UC Davis only has mid-fi wireframes; presented honestly).
- Sierra College education row has no dates (unknown).
- Optional: extend the tilted-photo warmth / doodle treatment further; before/after visuals for the
  Marketplace iteration; real metrics or testimonials in case-study Results.

#### Animated case study thumbnails (2026-09-12)
The home page's Vendrs card no longer shows a flat cover image. `.wthumb` inside `.wcard__frame`
holds one frame at rest (the event page) and, on card hover, flies four supporting screens in from
off frame to land ON it. Modelled on the case study cards at vivianzhao.ca. Plain CSS transitions,
no library, no build step.
- **The CSS lives in `css/style.css` (`.wthumb`), which is the single source of truth.**
  `mockups/thumbnails.html` is only a preview harness: it links the same stylesheet and repeats the
  real `.wcard` markup, minus the preloader, nav, scroll reveal and page wipe. Tune the animation in
  style.css and both update. Do not fork the CSS back into the harness.
- **Authoring a piece.** Each `.wthumb__fly` gets a resting spot (`left`/`top`/`width`) plus a start
  offset `--fx`/`--fy`/`--fr` saying where it waits off frame, `--r` for its resting tilt and `--d`
  for its place in the stagger (40/90/140/190ms). Hover sets `translate(0,0)` and `opacity:1`. That
  is the entire animation: retuning it means editing those values and nothing else.
- **Layering is split on purpose.** `.wf--onb` and `.wf--confirm` sit at z-index 4, over the frame
  (`.wthumb__base` is 3); `.wf--feed` and `.wf--market` stay at 2, behind it. Everything in front
  reads flat. `.wf--feed` deliberately bleeds past the left edge and is clipped by the frame's
  `overflow:hidden`.
- **The base is 68% of the frame width**, and two pieces are tuned against the artwork inside it
  (2026-09-12, user's call):
  - `.wf--onb` (top right) must not land on the event page's words. In `event.jpg` the nav strip is
    the top ~8% and the "Asian Night Market" title starts around 20% of the base's height, so the
    piece is parked at `top:-14%`: it overlaps the base by about 15px (9% of its height), which is
    nav strip only, and covers 0% of the title block. Measured at 1440 wide. Going to `top:-20%`
    cleared the base completely and left a 43px sliver, which read as clipped rather than placed, so
    do not push it higher.
  - `.wf--confirm` sits in the bottom right corner with 30px of clearance from both frame edges.
    Flush to the edge (a 4px gap) read as accidentally cropped.
- **`.wthumb` sets `isolation:isolate`** so those z-indexes cannot compete with `.wcard__go` (3) and
  `.wcard__tape` (5), which live outside it. The corner arrow still sits on top on hover.
- **`height:auto` on `.wthumb__base` and `.wthumb__fly img` is load-bearing.** The global rule is
  `img { max-width:100% }` with no height, so an `<img>` carrying a `height` attribute renders that
  many CSS pixels tall. The base (width=1200 height=700) first came out 239px wide by 700px tall and
  burst out of the frame. The old `.wcard__shot` never hit this because it set `width:100%;
  height:100%; object-fit:cover`.
- **Assets** in `assets/graphics/thumbs/vendrs/` (728KB), cut from the user's exports with
  `tools/cropimg.swift`: `event.jpg` 1200x700 (base frame), `feed.jpg` 500x340, `market.jpg` 520x325,
  `onboarding.jpg` 620x441, `confirm.png` 457x537 (copied as is; its rounded corners need the alpha).
  Cut the flying pieces near their rendered size: at full width one card weighed about 1.5MB.
- **Background** is Vendrs' map motif rebuilt as inline SVG (teal gradient, two blobs that drift on
  hover, contour lines, a dotted route), not a crop of their artwork, so it recolours per project.
- Touch has no hover, so `@media (hover:none)` rests the pieces in place instead of never showing
  them. `prefers-reduced-motion` drops the travel and shows the composition directly.
- **The two flat covers were moved out** (2026-09-14) to `../Portfolio2.0 removed files/assets/graphics/thumbs/`.
- **QAC Gallery (2026-09-12).** Same machinery, second palette. Base is `events.jpg`, the top of the
  Events/Bookings page, because the case study's focus is the events and booking experience. Pieces:
  `.wf--signin` (membership sign in, from the left), `.wf--shop` (Creature Comforts workshop detail,
  top right), `.wf--workshops` (the three workshop cards, bottom left), `.wf--rent` (Rent The Space,
  bottom right corner). `.wf--shop` and `.wf--rent` are the two in front.
  - **`.wthumb--qac` is a white ground with the gallery's real paint splatters** bleeding in from all
    four edges, matching their membership sign-in page (2026-09-12, user's call; an earlier dark ink
    version with drawn blobs was replaced).
  - **The splatters are generated, not photographed.** `tools/splatgen.py` writes
    `assets/graphics/thumbs/qac/splatter.svg` (one transparent 800x520 SVG, ~20KB, `.qac-splat`).
    Re-run for a different scatter: `python3 tools/splatgen.py <out.svg> [seed]`. Transparent
    background means no blend mode and no seam, so it drops onto any ground colour.
  - **An earlier version cropped the real artwork out of the sign-in page and the user rejected it**
    as looking "weird and off" (2026-09-12). It carried that page's own lighting and edges, so it
    read as pasted in; it also needed `mix-blend-mode: multiply` to hide the white of the JPEG
    rectangles, and careful crop bounds to dodge the sign-in card's drop shadow and the footer rule.
    All of that is gone. Do not go back to cropping screenshots for this.
  - **What makes the generated version read as paint** rather than coloured blobs, which the first
    generated attempt did and was also thrown out: a SMALL core relative to its spread (splatter is
    mostly negative space), lobe depths that vary hard point to point so the silhouette is spiky,
    flicks that curve and taper to an actual point each ending in a droplet, droplet sizes on a
    steep power law (mostly specks, a few real drops), and a throw direction per cluster so
    satellites sit in a cone instead of a ring. Keep those properties if you retune it.
  - The centre of the canvas is kept clear (`CLEAR_RX/RY`) because the main frame sits on top. The
    image overhangs the frame and is clipped by `.wcard__frame`, so paint bleeds off the edges.
    `object-fit: cover` fits a 1.54 canvas into a 1.45 frame, so the overhang lands top and bottom
    and the right edge sits a touch inside; the corner clusters still reach the edges.
  - **Separation now rests entirely on the box-shadows**: the base, the four screens and the ground
    are all near-white. Do not remove the shadows on `.wthumb__base` / `.wthumb__fly` here.
  - Measured at 1440 wide: `.wf--shop` bites 9px into the base's nav strip (717px2) and covers 0% of
    the event cards; `.wf--rent` sits 17px from the right and 44px from the bottom and covers 20% of
    the cards region. Its first values were copied straight from the Vendrs pieces and were wrong,
    because this base is 1200x675 (not 700) and the pieces have different aspects: `.wf--shop`
    floated clear of the frame at 49px2. Retune per project, do not assume the Vendrs numbers carry.
  - **Assets** in `assets/graphics/thumbs/qac/` (1.0MB): `events.jpg` 1200x675 (base), `signin.jpg`
    620x495, `workshop.jpg` 560x350, `workshops.jpg` 520x297, `rent.jpg` 520x274. Sources are the
    user's exports in `~/Downloads`: `Sign in - Anthony.png`, `Workshop #3 - Anthony.png`, and
    `Events/Booking - Anthony.png` (note: `Events` is a real folder, the slash is not in the
    filename). `workshops.jpg` needed a second cut: the first clipped the card titles.
- **The harness is `mockups/thumbnails.html`** (renamed from `thumb-vendrs.html` when the second card
  landed) and now shows both cards.
- **"Case study" label (2026-09-12).** `.wthumb__tag` sits at the frame's top right on both cards.
  That corner already belonged to `.wcard__go`, so the two **crossfade**: the label shows at rest,
  the arrow on hover. Moving the arrow was the alternative, but the only other free corner is bottom
  right, which is where the last flying piece of each thumbnail lands. Its z-index is 4, above
  `.wthumb` (1) and the arrow (3) within the frame. On touch, where there is no hover, the label
  simply stays. Note the label's white pill is 93% opaque, so on QAC it picks up the orange splatter
  behind it; raise it to solid if that ever reads as muddy.

#### Work card tags (2026-09-12)
The pill rows on both home page cards were reset to one shared shape: market, platform, engagement.
The org names ("Design Interactive", "All Things Design"), the durations ("8 weeks", "3 months") and
the discipline pills ("Product Design", "UI + UX Design", removed 2026-09-12 at the user's request)
are all gone; the duration slot now carries the market type.
- **Vendrs:** **B2C** / Desktop / Client. Called B2B SaaS at first, changed 2026-09-12 on the
  user's call: its users are casual micro-sellers (street vendors, Depop sellers), individuals
  spending their own money with no procurement or approval chain, so they behave like consumers even
  though they run a business. That is also the audience the onboarding was designed around.
- **QAC Gallery:** **B2C** / Desktop / Client. A website for an Oakland LGBTQ+ arts
  organization whose audience is the public (find events, book the space, support the gallery), so
  it is consumer facing and not SaaS.
- **Both cards now carry the same three pills** (B2C / Desktop / Client), so the row no longer
  distinguishes the projects. Flagged to the user; "B2C SaaS" on Vendrs is the obvious differentiator
  if that ever matters, since it is still a subscription platform and QAC is a website.
- Three pills per card, one line at 1440 wide. Note that a card's tilt gives every pill a
  slightly different `top`, so grouping pills by `top` to detect wrapping gives a false positive:
  compare `left` instead.

#### drawably, vendored (2026-09-14)
Hand-drawn UI controls library (npm `drawably` 0.4.2, MIT, maintainer danielwh2), fetched at the
user's request because its sketch look matches the site's doodle theme. **Not installed with npm.**
The site has no build step, so the built files are vendored into `assets/vendor/drawably/` (96KB).
There is still no `package.json` or `node_modules` in the project; keep it that way.
- **Vendored:** `dist/index.js` plus the four files it imports (`composites.js`, `controls.js`,
  `prng.js`, `rough.js`), `style.css` (3KB), `font/font.css` with `font/DrawablyPen.ttf` (an
  optional pen typeface), and `LICENSE`. MIT requires the notice to travel with the code, so keep it.
- **`dist/react.js` was deliberately left out.** It is the only file with a bare import
  (`from "react"`), which a browser cannot resolve without a bundler. Every other file imports only
  relative siblings, so the library loads unbundled. Do not copy `react.js` in.
- The folder structure mirrors the package so relative paths still resolve (`font/font.css` loads
  `./DrawablyPen.ttf`).
- **Loaded as a plain script, not an ES module (changed 2026-09-14).** Pages link
  `assets/vendor/drawably/style.css` and load `assets/vendor/drawably/drawably.classic.js` just before
  `main.js`; it sets `window.drawably`. See "drawably on file://" below for why.
- **Theme it through its custom properties:** `--drawably-stroke`, `--drawably-fill`,
  `--drawably-paper`, `--drawably-error`, `--drawably-success`. It freezes to one static sketch
  under `prefers-reduced-motion`. Zero runtime dependencies; React is an optional peer that only
  the React entry uses, so npm would not pull it in either.
- **To upgrade:** `npm pack drawably` in a scratch folder, untar, check the new `dist/index.js` still
  has no bare imports, then re-copy the same files over these.
- **Live on the site (2026-09-14), on the user's picks from the preview.** Elements opt in with a
  `data-drawably` attribute; the drawably module in `main.js` loads the library (dynamic import, only
  on pages that use it) and attaches the sketch. What is used where, and what was kept:
  - "More about me" (home): `data-drawably="button:solid"` on the link, now class `.btn-sketch`, not
    `.btn`. **`.btn svg { width:18px }` would crush drawably's full-size sketch svg to arrow size**, so
    the arrow is sized by its own `.btn-sketch__arrow`. Before the sketch attaches, or if drawably
    fails, `.btn-sketch` still renders as the old filled button. (The user liked solid and outline;
    solid was used because it matches the old filled button.)
  - Work card tags (home) and hobby chips (about): `data-drawably="pill"`, drawn by `sketchPill()`,
    not `drawablyBadge`. The user asked for **thinner and rounder**. The badge corner is a hardcoded
    2px with no radius option, so the pill is drawn from drawably's exported `roughRoundedRect` +
    `variants` at radius half the height, into the same `svg.drawably-svg > path.drawably-boil[data-i]`
    structure drawably's CSS animates. **That couples `sketchPill()` to those class names: re-check
    them on any drawably upgrade.** Line is `--drawably-width: 1.2` (default 2). The Energy drinks
    chip stays warm (`.pg-chip--o.dw-pill`); work tags turn orange on card hover like the old ones.
  - "energy drink" in the home hero: **no highlight (removed 2026-09-14 at the user's request).** It is
    back to the plain blue `<b>`. The `highlight` hook still works in main.js if wanted elsewhere.
  - Tier list tabs (about): `drawablyTabs`, wired into the tier module's `render()` via
    `syncTabSketch()`. It sits after the work-in-progress early return, so **it does nothing until
    `data-wip` is lifted.** It measures with `offsetWidth`, which ignores the closed panel's
    `scale(.15)`, so drawing while the panel is shut is correct.
  - **Kept as they were, by the user's choice:** the section title underline (already hand-drawn)
    and the Currently working on card.
  - **Load-bearing details:** drawably forces `font-family: Inter` on everything it attaches to, so
    `[data-drawably].drawably-host` resets it to `inherit` (otherwise "energy drink" changes font).
    And `import()` is built with `new Function` rather than written inline, so a browser too old to
    parse it can only fail when drawably is requested, instead of rejecting all of `main.js` at load
    and breaking the music player and playground with it.
  - drawably's stylesheet is linked in the head of `index.html` and `about.html` only.
  `mockups/drawably.html` is the side-by-side preview: every real candidate (the "More about me"
  button, work card tags, hobby chips, section underline, the hero's "energy drink", the Currently
  working on list, the tier list tabs) as it looks today next to a drawably version in the site
  palette. It loads the site stylesheet, so the Today column is the real CSS. Warm variants follow
  the palette rule: `--orange-hi` for strokes only, `--orange` behind any text.
- **Two theming traps, both hit while building that preview. Apply the fixes on any live page too:**
  - `.drawably-badge` defaults to `500 12px Geist Mono` with `1px 7px` padding. Geist Mono is not
    loaded on this site, so badges fall back to the system monospace and read as cramped typewriter
    text next to the site's pills. Override with `font-family: var(--sans)` and pill-like padding.
  - Text colour comes from `--drawably-ink`, which **silently falls back to `--drawably-stroke`**.
    A warm stroke of `--orange-hi` therefore turned badge text `--orange-hi` as well, breaking the
    site rule that `--orange-hi` is never used for type. Always set `--drawably-ink` with the stroke.
- **The scribble variant hides its label** on buttons and badges alike. Fine for pure decoration,
  wrong for anything carrying words.

#### Phone playground grid, pill menu, hero tags, drawably on file:// (2026-09-14)
- **drawably on file:// (the user's "I don't see the drawably changes in Chrome").** Root cause,
  proven in the user's own Chrome run headless against the same page: over `file://` it logged
  `Access to script at 'file:///.../drawably/dist/index.js' from origin 'null' has been blocked by CORS
  policy` and rendered 0 sketched elements, while over `http://localhost` it rendered 10. Chrome
  refuses ES modules (and dynamic `import()`) on pages opened straight from disk. It would always have
  worked once hosted; it failed only for double-clicked files. **Fix:** `tools/drawably-classic.py`
  converts `dist/` into one classic script, `drawably.classic.js` (~37KB, 33 public names): each module
  in its own function scope in dependency order (prng, rough, controls, composites), imports become
  local vars, `index.js` re-exports become `window.drawably`. It aborts on any import/export form it
  does not recognise rather than emitting a broken file. `loadDrawably()` in `main.js` is now just
  `Promise.resolve(window.drawably || null)`; the old `new Function("return import(u)")` loader and its
  notes above are superseded. **Re-run the script after any drawably upgrade.** `dist/` stays as the
  build source and is still used directly by `mockups/drawably.html` (which therefore still needs a
  server). **Testing tip:** headless Chrome with `--virtual-time-budget` hangs on this site (the
  animation loops never go idle); use `--timeout=12000` plus a hard kill.
- **Less rough.** One constant, `DW_ROUGH = 0.5` (drawably default 1), passed to every sketch: the
  button, highlight, pills and tabs.
- **Hero tags** (AI Workflow, Figma): `data-drawably="pill"`, sketched in ink like the old black border,
  line and text turn blue on hover. `.tag svg { width:15px }` would crush the sketch svg (same trap as
  `.btn svg`), so `.tag .drawably-svg` restores full size and the icon is `.tag__spark`, which spins
  (`tag-spin`, 1.1s) while the tag is hovered; off under reduced motion.
- **Phone "Outside of design" is a bento grid (<=900px), after the mobile About panel at
  leahkim.design** (a two column grid of cards with 12px gaps, square photo, compact dark player card,
  full width interests chips). **Why items were "cut off":** the phone rule set `.pgd` to `height:auto`
  but never reset the desktop `max-height:1000px`, and `.pg-sec` clips with `overflow:hidden`, so the
  single column (about 2,200px) lost everything after the EVO photo. Now `max-height:none` and a
  6-column grid: me photo | music player, Atony card | EVO photo, three app icons in thirds, Hobbies
  full, Currently working on full, tools image | tier can. Cards are hooked by `.pg-it--me/--music/
  --artist/--evo/--hobbies/--now` (plus the existing `.pg-app`, `.pg-plain`, `.pg-tiers-it`) and
  placed with CSS `order`. **The HTML order must not be changed to get this**: on desktop the cards are
  absolutely positioned and later ones stack on top. Both photos are cropped square on phones so they
  match the card beside them (the portrait was 3:4 and stood 456px tall); the player is compacted
  (64px disc, smaller type) to fit a half cell.
- **Pill nav menu on phones.** Opening the menu inside the pill grew the nav from 48px to about 190px
  but kept `border-radius: 92px`, turning it into an oval whose curves cut about 45px into each corner
  of the bottom menu row. `.nav-outer.is-pill .nav.is-open` now uses a 22px card radius (<=760px).
- **Preview pane gotcha that cost time:** the in-app browser only paints the FRONT tab, so screenshots
  of a background tab come back blank white. Bring the tab forward before screenshotting.
- **Specificity trap in the phone grid block (caught by measurement, not by eye).** That
  `@media (max-width: 900px)` block sits ABOVE the base rules for the photo aspect ratios, the player
  row and the artist card, so overrides with the same specificity lost to the later base rules: the
  photos stayed 3:4 and the me | music pair stood 243px instead of lining up with square photos.
  Every reshape override in that block is now prefixed `.pgd` so it wins wherever the base rule
  lives. Keep new overrides there prefixed the same way. Desktop verified untouched at 1280x800:
  block layout, the 1000px cap, absolute rotated cards, 3:4 portrait, 4:3 EVO, hamburger hidden.

#### Radius scale, progress bar gone, pill button, phone player, chat button (2026-09-14)
- **Corner radius scale (use these for every new rule).** Defined in `:root`: `--r-pill` 92px (fully
  round; 92 rather than 999 so the nav's bar-to-pill morph, which animates border-radius, does not
  snap), `--r-lg` 20px (cards, panels, large surfaces), `--r-md` 12px (photos and surfaces inside
  cards), `--r-sm` 8px (thumbnails, tooltips, drink tokens), `--r-xs` 4px (focus rings, tiny bits).
  The old names `--r-btn` / `--r-tag` / `--r-card` / `--r-img` are now aliases onto the scale. Before
  this there were 35 distinct radius values (fully round alone was written as 999, 99, 92, 49, 40
  and 30px; cards ranged 14 to 40px); 57 hardcoded declarations were remapped selector by selector and
  a re-scan found none left off the scale. **Kept on purpose:** `50%` circles, `0`, 1 to 3px hairlines
  and photo corners, and the paper-object shapes (polaroids, the notepad, sticky notes, the wallet).
- **Blue scroll-progress bar removed** everywhere: the `.progress` div on all 5 pages, its CSS rule,
  and the width code in the scroll handler (which still toggles the nav's `.is-stuck`).
- **"More about me" is a filled sketched pill.** `sketchPill(d, el, { button: true, solid: true })`
  draws drawably's `.drawably-blob` fill under the outline, adds drawably's button classes (white text,
  hover lift, press) and re-sketches on pointerenter / pointerdown. `drawablyButton` is no longer used:
  its corner is a hardcoded 8px, which looked boxy next to the fully rounded tags and chips.
- **Phone "Outside of design" placement (supersedes the one listed earlier):** player full width / me
  | EVO / Atony as a full-width row / three app icons / Hobbies / Currently working on / tools | tier.
  The player is a 142px card: disc beside label and title, full-width progress line, controls CENTRED
  on their own line. **Two traps behind the first version's bug:** the desktop `.pg-sleeve` keeps
  `margin-top: 56px` for the disc that overhangs it, and the phone grid's equal-height rule sets
  `height: 100%`. Unreset, the card sat 56px down its cell, was forced to the cell height, and spilled
  onto the photos (its progress line hid under them). The music card on phones now sets
  `margin-top: 0; height: auto`. Controls are centred so the fixed chat button can never cover them:
  measured 0px2 for all three at the worst scroll position (before: "Next track" fully covered). Only
  the progress line's right end, the track length text, can pass under the button.
- **Chat button on phones (<=760px):** 48px, 12px from the corner (was 60px). The mini music bar's
  `right` is 72px (a 12px gap to the button) and the chat panel's `bottom` is 72px, so both clear it.
- Verified at 375px and at 1280x800 (desktop playground, music card and 74px chat button unchanged).
  Cache token `?v=x43`.

#### File cleanup (2026-09-14)
The project went from 475MB to 120MB (of which `.git` is 54MB and `assets/` 65MB).
- **Moved out, not deleted:** 108 unreferenced items (361MB) now live in
  `../Portfolio2.0 removed files/` (a sibling of this folder), each at its original relative path, with
  a `README.md` and a `moves.tsv` manifest. They are the WAV masters, `images for about me/`, the
  scribble texture pack, the two flat covers, art from removed sections (arch-collage, street-lamp,
  workflow-board, jp-*, paintings, proj-*, photobooth/, logos and so on) and `archive/`.
- **Rule used:** a file counts as used only if its path appears in the live pages, `css/style.css` or
  `main.js` with comments stripped, or in the TRACKS / drinks lists main.js builds paths from.
  **Every mascot file was kept on the user's instruction, used or not** (`sumi/`, `mascot*.png`).
  The vendored drawably folder is untouched.
- **Optimized** (full-quality originals in `../Portfolio2.0 removed files/originals-before-optimizing/`):
  - Opaque PNGs converted to JPEG and references updated: `tekken-evo.jpg` (6.3MB to 129KB, 1200px),
    `portrait.jpg`, `qac/workshop.jpg`, `qac/events-cards.jpg`, `qac/rent-space.jpg`,
    `vendrs/design-system.jpg` (1860px). **These are now `.jpg`; do not link the old `.png` names.**
  - Recompressed at quality 82 (kept only when at least 15% smaller): `from-code.jpg` (1200px),
    `vendrs/events-map.jpg`, all ten `thumbs/*/*.jpg` pieces. `star.png` scaled to 240px wide.
  - Total for those files: 13.7MB to 2.7MB.
  - **Left alone on purpose:** PNGs with real transparency (header-image, mascot, coffee, tools-ui,
    confirm), flat UI PNGs where JPEG came out bigger (`vendrs/login.png`, `business-type.png`,
    `qac/event-detail.png`, `ucd/wf-account.png`), the `ucd/wf-*` wireframes (JPEG smears thin lines
    for little gain), and the about-photos (already compressed; re-saving made them larger).
- **Verified:** no live reference points at a missing file; all five pages load with 0 broken images
  and the four videos play without error.
- **Not optimized, needs ffmpeg (not installed):** the Vendrs case study videos are the biggest
  remaining weight, about 30MB: `eventfeed.mp4` 12MB (1280x720, 46s, 2.1Mbps), `marketplace.webm`
  10MB, `dashboard.mp4` 6.5MB, `onboarding.webm` 1.8MB. The MP4s carry an audio track the muted players
  never use. macOS `avconvert` cannot drop audio or read WebM, so this was skipped.
- `.git` still holds the moved files in its history; that is expected and was not touched.

#### No float, softer shadows, sharper corners (2026-09-17)
- **Stars and the hero image no longer float.** `.doodle-star--float` now only holds each star's tilt
  (`transform: rotate(var(--rot))`, the class name kept so the markup did not change) and
  `.hero__composite` lost its `floaty` animation. **The hero image's `data-parallax` was removed too:**
  while `floaty` ran, the animation overrode the inline transform the parallax script writes, so the
  parallax was never visible; dropping only the animation would have exposed a new scroll drift that
  reads as the same float. Sumi's floats (`.about-sumi`, `.case-sumi`, preloader, page transition)
  and the Vendrs "the product, in motion" note (`.dood--float`) were not part of the request and still move.
- **Radius scale is sharper (supersedes the 20 / 12 / 8 values above):** `--r-lg` 14px, `--r-md` 10px,
  `--r-sm` 6px; `--r-xs` 4px and `--r-pill` unchanged (pills, tags, chips and the sketched buttons stay
  fully round). Photos inside paper frames (polaroid, `.pg-pol`, `.pg-photo`) use one 2px corner
  instead of a mix of 1px and 3px. Paper shapes (notepad, sticky notes, wallet) keep their own corners.
- **Shadows toned down.** Tokens: `--sh-nav` `0 2px 8px / .035`, `--sh-card` `0 4px 12px / .03`,
  `--sh-lift` `0 8px 20px / .055`. Every other outer box-shadow and drop-shadow layer (45 of them) was
  scaled by one rule so the hierarchy between them is kept: offsets and spread x0.5, blur x0.55, opacity
  x0.55. Insets, 1px rings, `0 1px 0` hairlines and the tier sheet's 100vmax dimmer were left as they
  were. Cache token `?v=x46`.

#### Sumi still, photos straight, no nav active state, no rule under "More than the work" (2026-09-17)
- **No floating left except the Vendrs doodle note.** `floaty` was removed from `.preloader__mascot`,
  `.pt__mascot` (page transition), `.case-sumi` (all three case studies), and the unused `.about-sumi` /
  `.about-wordmark` rules. The `@keyframes floaty` definition remains for `.dood--float`.
- **Photos are straight:** the home "More than the work" photo (`.meet__photo`, was -2.5deg, -1.5deg on
  phones) and the about intro portrait (`.about-hero__photo img`, was -4deg; its hover is now just a 4px
  lift). The about hero star and the meet section parallax are unchanged.
- **The nav has no active state.** Deleted the `.nav__link.is-active` rule, the `is-active` class on
  about.html's About link, the Works link's `data-spy`, and the scroll-spy IntersectionObserver in
  main.js. (`.is-active` is still used by the case-study section nav, which is separate.)
- **"More than the work" has no orange hand-drawn rule** under it (its `.sec-rule` span was deleted).
  "Featured works" keeps its rule. Cache token `?v=x47`.

#### Loading animations removed (2026-09-23)
Both were "loading" screens, so both are gone; pages now render straight away and links navigate
immediately.
- **Preloader** (blue full-screen intro: Sumi, "Anthony N." rising, a filling bar, once per session
  via `sessionStorage` key `anp_intro`): markup in index.html, the `.preloader*` CSS block, the
  `preRise` / `preLoad` keyframes, its `prefers-reduced-motion` override, and the JS block are deleted.
- **Page-transition wipe** (`.pt`: four blue panels, the mascot, the word "loading" and a bar, built in
  JS on every page): the CSS block and the whole JS section are deleted, including the link-click
  interception that delayed navigation by 620ms and the `pageshow` handler that lifted the wipe on
  back/forward.
- **Knock-ons:** the hero title reveal no longer waits 1200ms for the intro, it runs at once. The music
  player's `anp:leave` listener (faded the track out over the wipe) is deleted too, since nothing
  dispatches that event now; `pagehide` still saves playback state. The buddy's greeting nudge used to
  wait for the preloader (`if (pre && ...)`), which threw a ReferenceError once `pre` was gone; that
  check is deleted. Cache token `?v=x49`.

#### Sumi the mascot is gone, arch collage is the hero (2026-09-23)
The user asked for the arch image as the header and for the mascot to be removed entirely, and chose
to remove the chat with it. **Anything below that describes Sumi, the buddy or the chat is history now.**
- **Hero image:** `assets/graphics/hero-arch.png` (548x795, restored from the removed-files folder)
  replaces `header-image.png`, which was the same collage with the mascot composited in front. Same
  size, so no CSS changed. `header-image.png` moved out to the removed-files folder.
- **Removed markup** on all five pages: the floating `.buddy` button and the whole `.chat` panel; the
  `.case-sumi` image on the three case studies; `data-mascot` on the hero image.
- **Removed JS:** the buddy block (greeting bubble), the `[data-mascot]` click easter eggs, and the
  entire scripted chat IIFE at the end of main.js (INTENTS and all). The cursor module's
  `[".buddy", "Chat"]` label entry is gone too (that module is still disabled by `CURSOR_ENABLED`).
- **Removed CSS:** 42 rules matching `.buddy*`, `.chat*`, `.case-sumi`, `.about-sumi`, plus the dead
  `.skills__note-mascot` and `.hero__mascot` rules. The mini music bar on phones went back to
  `right: 12px` (it was 72px only to clear the chat button).
- **Assets moved out** to `../Portfolio2.0 removed files/assets/graphics/`: the whole `sumi/` folder
  (19 poses), `mascot.png`, `mascot-outline.png`, `header-image.png`. The earlier "keep every mascot
  file" instruction is superseded by this request. `assets/` is now 62MB.
- Verified: no page references a missing file, main.js parses, no console errors. Cache token `?v=x50`.

#### Chat is back, with an icon button (2026-09-23)
The user asked for the chat again, with a different icon, right after it was removed with the mascot.
- **How it was recovered:** the chat JS was not in git (HEAD's main.js is a 380-line version that
  predates it). It came back from this session's transcript, which stores a diff of the removing
  command: `~/.claude/projects/-Users-atony/<session>.jsonl`, record with
  `toolUseResult.bashEditDiff.files[].hunks[].lines`, taking the `-` lines. **Worth remembering when
  something is deleted without a commit.** The CSS came from a copy of style.css saved in the
  scratchpad before the removal.
- **Button:** `.chatbtn`, a 56px blue circle (52px coarse pointers, 48px at 760px and below) holding an
  inline speech-bubble SVG. No image file, so nothing to load. The panel opens 90px above the bottom,
  matched to the smaller button.
- **Panel:** the same `.chat` markup and CSS as before, except the header avatar is now the same
  speech-bubble SVG in a white circle (`.chat__avatar svg`), not a mascot photo, and the subtitle reads
  "Scripted answers about his work".
- **Wording:** the greeting, the intro message and the "who are you" intent no longer mention Sumi or a
  mascot. The intent's keywords are now you / who are you / your name / bot / chatbot / robot / real
  ("ai" was left out on purpose: it belongs to the skills intent). Everything else, including all other
  INTENTS, is unchanged and still scripted, not a model.
- The mini music bar on phones is back to `right: 72px` to clear the button. Cache token `?v=x51`.
- Verified: the button opens the panel, the four starter chips appear, and asking "what are his
  projects?" returns the three case studies with working links.

#### Main font is Archivo (2026-09-23)
`--sans` is now `"Archivo", "Inter", <system stack>`. The Overused Grotesk `<link>` (fonts.cdnfonts.com)
was replaced on all five pages and both mockups with the Google Fonts variable face:
`family=Archivo:ital,wght@0,300..700;1,300..700`. That range covers the 450 and 600 weights the site
asks for, so no weight is synthesised. IBM Plex Serif (italic accents) and Caveat (the handwritten
brand and doodle labels) are unchanged, as is drawably's own font.
Verified in the browser: Archivo reports as loaded and is the computed family on body, the hero title,
the nav links and the chat panel; the hero subtitle still resolves to IBM Plex Serif and the wordmark
to Caveat. Cache token `?v=x52`.

#### Sumi is back, except on the case studies (2026-09-23)
Reverses most of the removal above; read this one, not that one, for the current state. The user chose
three of the four spots.
- **Back:** the hero collage with Sumi (`header-image.png`, `data-mascot` restored), the floating
  `.buddy` button (74px, Sumi's head crop, greeting bubble after 3.8s) and the chat header avatar
  (`sumi/happy.png`), the chat's Sumi wording (greeting, intro line, "who are you" intent), and the
  `[data-mascot]` click easter eggs. **The "blue" keyboard easter egg came back with them:** it sat in
  the same block and had been removed by accident.
- **Not back:** the `.case-sumi` image on the three case studies. Those three poses
  (presenting-design, building-prototype, holding-notebook) are in `assets/graphics/sumi/` but unused.
- **Gone again:** `.chatbtn` (the speech-bubble icon button) and its CSS. The chat panel sits 108px up
  again, matching the taller button, and the header avatar is an `<img>` once more.
- `assets/graphics/sumi/`, `mascot.png`, `mascot-outline.png` and `header-image.png` moved back from the
  removed-files folder. `hero-arch.png` stays in the project but is **now unused** (it was the header
  for one round). Cache token `?v=x53`.
- Verified: hero loads `header-image.png` and clicking it toasts an easter egg line, the button opens
  the chat, and the panel greets as Sumi with the four starter chips.

#### New header, and the serif italic is gone site-wide (2026-09-24)
Direction came from vivianzhao.ca and hellokatliu.com: professional, few fonts, doodles as the fun.
The user kept the existing design and changed only the header, plus dropped the serif.
- **One text face.** `--serif` still exists as a token but now resolves to the Archivo stack, and all
  17 `font-style: italic` declarations are upright. The serif looked heavier than Archivo at the same
  weight, so these were nudged: `.hero__title .accent`, `.serif`, `.pg-hd em`, `.tl__title em`,
  `.pg-sleeve__t` to 500; `.fact__k`, `.cs-stat__n`, `.cs-donut__pct` to 600; `.cs-pull p`,
  `.case-quote p` to 500. **Caveat stays** (wordmark, polaroid captions, "Tier list"), unanswered
  question, so it was left alone.
- **Header (home).** The collage (`.hero__stage` / `.hero__composite`) and the tag row
  (`.hero__tags`) are deleted from index.html. `.hero__inner` is one column with
  `min-height: min(64svh, 540px)` and its own padding, not a full-viewport grid. Title is
  `clamp(26px, 3.1vw, 40px)` with `max-width: none`, so the sentence runs the full column and both
  margins read the same; the markup carries a hard `<br>` so "and" starts line two. Copy:
  "Product Designer that values *user-centered* digital experiences / and a *productive AI workflow*",
  both phrases in `.accent` blue. Sub is "4th year design undergrad @ UC Davis. Certified energy
  drink enjoyer." "[ Based in Sacramento, CA ]" and "Scroll to see my work" stay, moved to
  `bottom: 34px`. Stars moved out of the headline (top 4% / left -2%, top 8% / left 92%).
- **`.hero__sumi`**: the sitting-and-sketching pose, `clamp(64px, 6vw, 84px)`, absolute bottom-right
  above the scroll line; at 1024px and below it goes static under the text so it cannot cover anything.
  It keeps `data-mascot`, so the click easter egg still works.
- **Trap hit while doing this:** deleting the `.hero__tags` block by matching the next two `</div>`
  also ate `.hero__intro`'s closing tag. The hero is now div-balanced (2 open, 2 close) and the whole
  page parses with no unclosed tags.
- Mockups used to agree this: `mockups/hero-mock.html` through `hero-mock4.html` (header options) and
  `mockups/nofancy-index.html` / `nofancy-about.html` (the no-serif preview, which loads the live page
  in an iframe and injects the override, so **they only work over http, not file://**).
  `mockups/redesign.html` is the fuller vivianzhao-style direction the user rejected.
- Verified at 1440 and 375: no serif or italic left in the computed styles, no horizontal overflow, no
  console errors. Cache token `?v=x54`.

#### Home is now a peek layout, cards rest flat (2026-09-24)
Modelled on vivianzhao.ca's work section: the visitor sees the case studies without scrolling.
- **No "Featured works" heading.** The `.sec-head` block and the section's loose doodle star are gone
  from index.html, and `.worktiles` lost its `margin-top`, so the cards sit right under the header.
- **Header is short on purpose:** `.hero__inner` is `min-height: 0` with
  `padding-block: clamp(30px,4vw,54px) clamp(58px,6vw,82px)`. **Do not put a viewport-height rule back**
  or the cards drop off screen and the page reads empty.
- **Copy:** "Product Designer," / "that builds *user-centered* products with an *AI workflow*" (hard
  `<br>` after the comma). Sub is two lines and deliberately large and light now,
  `clamp(17px,1.7vw,23px)` at weight 300 in `--ink-50`, like the reference site's second line.
- **Removed from the header:** "[ Based in Sacramento, CA ]", "Scroll to see my work" and the scroll
  arrow (markup deleted; the `.hero__loc` / `.hero__scroll` / `.hero__down` CSS is still there, unused).
- **Stars (placement C):** the two hero stars are no longer one per corner. They sit as a small pair of
  different sizes near the seam between the header and the cards, right of centre
  (`right: 26% / bottom: 18px` and `right: 21% / bottom: 58px`). Still hidden below 1024px.
- **`.hero__sumi`** moved to `right: 3%; bottom: 10px`, `clamp(72px,7vw,104px)`, so it is level with the
  text block and sits just above the cards.
- **Cards rest flat.** `.wcard__paper` is `rotate(0deg)` with a much lighter shadow
  (`0 6px 14px -10px / .14`, was `0 10px 24px -12px / .23`); the tilt moved into `:hover` and `:active`
  as `rotate(var(--tilt))`, with `--tilt` softened to -2deg / 1.8deg. The reduced-motion block used to
  park the cards at `rotate(var(--tilt))`, which would have kept the old tilt for those users; it is
  `none` now. The pile-then-separate reveal and the hover fly-in thumbnails are untouched.
- Left alone for now: the `.works-sketch` doodles behind the cards (orange star, coffee cup, squiggle),
  which sit closer to the header now that the heading is gone.
- Verified at 1440 and 375: no horizontal overflow, no console errors. Cache token `?v=x55`.
- **Spacing matched to the reference (2026-09-24, same day):** header padding is now
  `clamp(46px,7.5vw,112px)` top / `clamp(30px,4vw,56px)` bottom, and `#works` overrides `.section` with
  `padding-top: clamp(10px,1.6vw,22px)`. At 1440x900 that puts the headline top at 169px
  (vivianzhao.ca: 181px), the first card top at 431px (hers: 458px), and the whole card inside the fold
  by 43px. Sumi's feet land 28px above the card, which is the "sitting just above the case study" look.

#### Outside design: heading, Sumi on the music card, sorted gallery (2026-09-25)
- **Heading is "Outside design"**, all one ink colour. The `<em>design</em>` (blue) is gone from the
  markup; `.pg-hd em` still exists in CSS but nothing uses it on this page.
- **`.pg-jam`**: `sumi/listening-to-music.png` on the Atony card, bottom-right, 54 to 74px, nodding
  with `@keyframes pg-jam-nod` (2.6s, rotate -4 to 4deg plus a 4px lift). It is the only animation left
  in this section and is switched off under `prefers-reduced-motion`.
- **Sorted view rebuilt:**
  - **Same size as scattered.** `plan()` no longer searches for a scale that fits four rows: `s = 1`
    and the row count is whatever the height allows (1 to 4). `--sort-s` is therefore 1 and
    `.pgd.is-sorted .pg-photo` defaults to 1.
  - **No group captions.** The `.pg-group` elements, the `labels` map, the label branch in
    `sortPhotos()`, the label pass in `apply()` and all `.pg-group` CSS are deleted; `LABEL` is 0.
    The GROUPS list still drives the ORDER of the strip, it just does not print names.
  - **Opens side by side.** The wallet handler now calls `capture()` and then `sortPhotos()` on the
    next frame, so photo mode starts as rows. Scatter is the only thing that throws them across the
    world, and the Sort button still re-forms the rows.
  - With 33 full-size photos the strip is wider than the screen: about 18 are in view and you pan
    sideways for the rest. That is the trade for "same size, side by side".
- **Deleted photos cleaned up:** the user removed p01, p04, p05, p20, p26, p37, p47 and p48 from
  `about-photos/`; their `<button class="pg-photo">` blocks are gone from about.html (41 to 33, and
  0 broken images). Counts per group now: travels 13, friends 7, town 7, school 3, gaming 2, music 1.
  **When more photos are deleted, delete the matching button blocks too**, or they 404 and leave
  empty frames. Cache token `?v=x57`.

#### music.html: the typed easter egg (2026-09-25)
- **How you get there:** type `music` anywhere on the home page. `js/main.js` keeps a 6-character
  buffer of typed letters (the same one the `blue` egg uses) and matches on the ending, shows a toast,
  then goes to music.html after 520ms. Typing `design` on music.html goes back. **The handler now
  ignores keystrokes aimed at an input, textarea or contenteditable**, so typing in the chat cannot
  trigger it. The page is `noindex` and nothing links to it except the nav's back link.
- **The page reuses the site shell:** same nav, hero, footer and chat markup and CSS. Music-only bits
  are scoped to `.is-music`, `.album*`, `.listen*` and `.nav__link--back`, so nothing leaks into the
  design pages. Brand reads "Atony", nav is Albums / Listen / "Design portfolio" (with a back arrow).
- **Hero:** "Music producer, / who creates with *passion* and doesn't use *AI as a tool*", with
  `sumi/listening-to-music.png` as `.hero__sumi` in place of the sketching pose.
- **Albums (4, 2x2 grid):** `.album` cards with a square sleeve. "Reverie in Blue" uses the real cover
  art (`about-photos/p12.jpg`); the other three are typographic sleeves on gradients until real art
  exists. A record (`cd.jpg`) peeks from the right edge of each sleeve and slides further out and
  rotates on hover. **All four links currently point at soundcloud.com/atonyn: swap in the per-project
  URLs when the user provides them.** Titles, years and track counts are placeholders too.
- **Listen strip** before the footer: SoundCloud (real, @atonyn), Spotify and Instagram
  (**placeholder hrefs**, marked "coming soon" / "behind the beats").
- Verified: typing `music` navigates, typing `design` returns, 4 album cards, 0 broken images, no
  failed requests on the page. Cache token `?v=x58`.
- **Album covers are real now (2026-09-25).** The user dropped `aspire-lp.png`, `What i am LP.jpg` and
  `feel good w: dnty - single.jpeg` into `assets/graphics/`; those plus the Reverie cover are converted
  to `assets/graphics/albums/{reverie-in-blue,aspire,what-i-am,feel-good}.jpg` (1000px, quality 78,
  163 to 465KB). The dropped originals moved to
  `../Portfolio2.0 removed files/assets/graphics/album-originals/`.
- **The record peeking out of the sleeve is gone** (`.album__disc` markup and CSS deleted), along with
  the gradient/wordmark placeholder sleeves. Order is Reverie in Blue, Aspire, What I Am, feel good.
- **What I Am is a work in progress:** its card is a `<button class="album album--wip" data-wip>`, not a
  link. Hover, focus or tap shows a "Work in progress" pill over the sleeve, and a click wobbles the
  sleeve and holds the pill for 2.2s (same pattern as the tier list can). **To release it: drop
  `data-wip`, swap the button back to an `<a href>` and delete the `.album__wip` span.**
- The three released albums still all point at soundcloud.com/atonyn until per-project URLs exist.
  Cache token `?v=x59`.

#### Album links, no chat on music, gallery defaults (2026-09-25)
- **Album links** now point at real SoundCloud pages, found by reading the profile:
  Aspire is an album (`/atonyn/sets/aspire-1`), feel good is a track (`/atonyn/feel-good-w-dnty`).
  **Reverie in Blue has no page on SoundCloud**, so it still points at `/atonyn`; swap it when it goes
  up. What I Am stays a work-in-progress button.
- **No Sumi chat on music.html.** The `.buddy` button and the `.chat` panel markup are deleted from
  that page only (the chat is about the design portfolio). The design pages keep it; main.js simply
  finds nothing to wire there.
- **The photo gallery opens scattered again**, in the authored positions. Sort is what lines the photos
  up, Scatter throws them back. (This reverses the "opens side by side" change made earlier the same
  day.)
- **Photos keep their own shape:** `.pg-photo img` lost `aspect-ratio: 4 / 3` and `object-fit: cover`,
  so the frame width is constant and the height follows the file. Measured heights now range 126 to
  271px in one set.
- **Sort is one aligned grid.** `plan()` no longer builds a block per group: it measures the biggest
  photo, makes every cell that size, fits as many rows as the height allows (capped at 5), then
  `cols = ceil(n / rows)`. `sortPhotos()` places each photo at its cell centre with **no rotation**, so
  the set lines up across and down. Groups now only set the reading order. `LABEL` and `GAP` are gone.
  Verified with 33 photos at 1400x880: 17 column centres, 2 row centres, every rotation 0deg.
  Cache token `?v=x60`.

#### Photo gallery: one height, bento sort, no frame or tilt (2026-09-25)
- **Sizing rule flipped.** `.pg-photo` is `width: auto` and `.pg-photo img` carries
  `height: clamp(116px, 10.5vw, 158px); width: auto`. Every photo is therefore the same height and as
  wide as its file wants, so landscape shots read larger than portraits while the set stays
  consistent. Measured: all 147px tall, widths 110 to 261px.
- **No white frame:** padding 0, `background: none`, and the `border-radius` (`--r-sm`) moved onto both
  the button and the image, so the corners stay rounded without the paper border.
- **No tilt anywhere in the gallery.** The 36 authored `--r:` values were stripped from about.html,
  `.pg-photo` defaults `--r: 0deg`, and `scatter()` now sends `r: 0` (it used to jitter up to 24deg).
- **Sort is a bento pack.** `plan()` fills a row left to right until the next photo would pass the
  target width (stage width minus 120, capped at 1180), then starts a new row; rows share the baseline
  step (photo height + 18px gutter) and each row is centred on the block. Result with 33 photos at
  1400x880: five rows of 8, 9, 9, 6 and 1, every photo square to the grid.
- **Home headline:** "Product Designer, / that builds *user-centered* products with *intention*"
  (was "using AI as a tool"). Cache token `?v=x62`.
- **Gallery photos enlarged (2026-09-25, same day):** `.pg-photo img` height went from
  `clamp(116px, 10.5vw, 158px)` to `clamp(180px, 17vw, 268px)`. At 1400x880 that is 238px tall with
  widths 179 to 423px. The bento pack reflows on its own: 7 rows instead of 5, so the sorted block is
  now taller than the stage and you pan down for the last rows. Shrink the clamp if that becomes
  annoying.

#### Sort overlap bug, and why it happened (2026-09-25)
Enlarging the photos made the sorted block taller than one lap of the pannable world, and
`apply()` positions everything **modulo worldW/worldH**, so the far end of the block wrapped back
around and landed on top of its own first rows. Three fixes, all in the playground module:
1. `measure()` now sizes the world from the sorted block as well: `worldW >= block.w + stage width +
   160` and `worldH >= block.h + stage height + 160`, so one lap always holds the block plus a screen.
2. `sortPhotos()` calls `measure()` first. The block's size depends on the photos' current size, and a
   stale world was exactly the overlap case.
3. The block is anchored to the **middle of the world**, not to the current view: it used to be laid
   out from the screen's top edge, which could run past the edge of the lap. After placing it,
   `panX/panY` are set so the view lands on the block's top-left.
Verified at 1400x880 with 33 photos at the new size: 0 overlapping pairs, block top at y=84 (right
under the heading), 7 rows, 22 photos on screen, and sorting twice in a row gives identical geometry.
**If the photos are resized again, re-check this:** the wrap only misbehaves when the block approaches
a full lap. Cache token `?v=x63`.

#### Sorted block: staggered and screen-filling (2026-09-25)
- **Less uniform.** Every other photo in a row sits 14px higher and every other row starts offset
  (+0.32 / -0.12 of a photo width), so the block reads hand-placed instead of ruler-straight. The lift
  rides **into** the 18px gutter rather than adding to it (`stepY` stays `photo height + PAD`), which is
  what keeps the rows tight; a lift larger than `PAD - 4` would start touching the row above.
- **Fills the screen.** Rows are built to `stage width + 170`, so they bleed past both edges instead of
  sitting in a centred column (measured -11px to 1733px against a 1400px stage). If the set is ever too
  small to fill the height, `plan()` narrows the target row width (x0.8 at a time, floor of two photos
  per row) so the same photos reflow into more rows. **Photos are never duplicated:** with fewer than
  about 20 at this size the block just gets denser, so adding more photos is still the real fix.
- Measured at 1400x880 with 33 photos: 0 overlapping pairs, 27 photos on screen, 73% of the surface
  covered (the rest is gutters between different-width photos). Cache token `?v=x65`.
- **Zigzag reverted the same day.** Sorted rows are straight again: no per-photo lift, no alternating
  row start, `stepY = photo height + PAD`. The screen-filling part stayed (rows built to
  `stage width + 170`, and the narrowing loop for small sets). Verified: 5 rows at tops 84 / 340 / 596 /
  852 / 1108 (an even 256px step), 0 overlapping pairs, 27 photos on screen.
- **`.pg-jam` removed**: the Sumi listening to music beside the Atony/SoundCloud card is gone from
  about.html along with its CSS and the `pg-jam-nod` keyframes. Cache token `?v=x66`.

#### work/vendrs.html rewritten around the two features (2026-09-25)
Benchmarked against jaydenbetts.design/bearings, hellokatliu.com/clubly,
nathan-portfolio-kappa.vercel.app/threadit-case-study and vivianzhao.ca/tiesandtopics. The pattern all
four share: title by the problem, an explicit "what I owned" list, decisions shown as a rejected vs
shipped pair, few words, many images.
- **Structure now:** hero (title, one-line framing, role/owned/team/timeline table) -> prototype video ->
  Context -> Research (20+ surveys, 10 interviews, the three percentages, one pull quote) ->
  Feature 01 Onboarding -> Feature 02 Events Map -> What testing changed -> Takeaway -> next project.
  **Cut:** the scoping matrix, the five-theme affinity map, personas, IA, the marketplace/dashboard
  section and the design system section (teammate work or process detail that buried the two features).
- **Onboarding is a step switcher:** `.v-tabs` buttons swap `.v-panel` figures (log in, business type,
  location, goals, whole flow). JS lives in main.js and drives any `.v-tabs[role=tablist]`.
  **Location and Goals are `.v-missing` placeholders** until the user exports those screens; replace the
  div with a `.cs-shot` image and nothing else changes.
- **New CSS block** "CASE STUDY v2", all scoped to `.cs--col` or `.v-*`: 720px column, 38px headline,
  header left-aligned on the same edge as the sections, images capped to the column, role table, stat
  row, decision cards, step switcher, placeholder box. **The other two case studies are untouched**,
  so they still run the wide layout.
- **Title:** "Helping small businesses discover their next market". Earlier drafts (kept for reference):
  "Cutting setup to four steps so vendors reach their first market" and "One answer, two features".
- **Trap I hit while applying this:** a `str.replace()` on a nav block whose replacement contained the
  search text blew work/vendrs.html up to 107k lines. The page was rebuilt from work/qac-gallery.html as
  a shell (same head, nav, footer, chat) with the new body dropped in. **Prefer slicing by index over
  replace() when the new text repeats the old.**
- Verified at 1440: h1 38px, five step tabs all switching, 840px body column centred at 365 to 1205,
  0 failed requests, no console errors. **Still missing: the location and goals screens, and any real
  testing numbers.** Cache token `?v=x67`.

#### work/qac-gallery.html rewritten the same way (2026-09-25)
Same system as the Vendrs rewrite (`.cs--col` plus the `.v-*` components, no new CSS needed).
- **Structure:** hero and role table -> the redesigned events page -> Context -> Research (the design
  question as the pull quote) -> Decision 01 Navigation (9 to 7 nav items, 3 focused pages, 1 next step
  per page as the stat row) -> Decision 02 Booking flow (date-then-workshop rejected against
  workshop-then-date shipped) -> **The pages I built** (a four-tab switcher: Events, Event detail,
  Workshops, Rent The Space, all four screens real) -> Outcome (stakeholder quote plus next steps) ->
  Takeaway.
- **Teammate work is named once**, in a single card (rebrand, membership tiers, online shop), while the
  client context and objective stay in Context and Research.
- **Cut:** the client-priorities table, the rebrand explanation and the final-designs gallery (folded
  into the page tabs).
- **Image hover lift removed site-wide:** `.cs-shot:hover { translateY(-4px) }` and its transition are
  gone. Case study images no longer move, since the motion suggested they were clickable.
- Verified at 1440: four tabs switching, 0 broken images, 0 failed requests, no console errors.
  **Outcome still rests on the stakeholder quote:** add numbers when the user has them.
  Cache token `?v=x68`.
- **Case study nav (2026-09-25):** the three `work/*.html` pages now use `.nav--case`: a "Back" link on
  the left (arrow plus label, hiding the label under 760px) and the wordmark absolutely centred. The
  nav links, the hamburger and the in-body "All work" link are all gone from those pages, since the
  sticky section nav handles in-page movement. Home and About keep the normal nav. Verified: brand
  centre lands exactly on the page centre (720 of 1440), Back sits at the left gutter, no console
  errors. Cache token `?v=x70`.
- **Case nav height matched (2026-09-25):** `.nav--case` gets `min-height: 62px` (58px at 760px and
  below). Without the links and hamburger the bar had collapsed to 43px. **`min-height` here is the
  whole box** (`box-sizing: border-box`), so 40px did nothing; it has to be the bar height, not the
  content height. Measured: case 62 / home 62 at 1440, both 58 at 375.
- **UC Davis case study removed (2026-09-25):** `work/uc-davis-app.html` and `assets/graphics/ucd/`
  moved to `../Portfolio2.0 removed files/` (page under `work/`). QAC's next-project card now points at
  Vendrs, and the chat's projects answer offers two case studies instead of three. The home page never
  linked it. Cache token `?v=x72`.

## Performance pass (2026-10-02)
- **Images are WebP now.** 82 jpg/png files (anything used and over 40KB) were converted to `.webp`
  next to where they were, and every reference in the html/css/js was rewritten. Photos use quality 80,
  big doodle/screenshot PNGs quality 86 (alpha kept), small PNGs lossless. A few oversized files were also
  downscaled (solution-*, mascot-vendor, feature-prioritization, sumi/sketching, listening-to-music-crop).
  Originals are in `../Portfolio2.0 removed files/originals-before-optimizing-2/`. **When adding new
  images, export WebP (or run them through Pillow `save(..., "WEBP", quality=80)`)**; a 1000px photo is ~100KB.
- Unused 30MB of old Vendrs videos (eventfeed, marketplace, dashboard, onboarding.webm) plus two stray PNGs
  moved to `../Portfolio2.0 removed files/unused-assets-2026-10-02/`.
- Below-the-fold `<img>` tags have `loading="lazy" decoding="async"`; hero images stay eager.
- `main.js`: looping `<video autoplay>` pauses when scrolled off screen and resumes when it returns.
- Google Fonts: dropped the unused IBM Plex Serif request and merged Archivo + Caveat into one request.
- Nav blur lightened (sticky bar 18px/1.6 to 12px/1.2, case-study side nav 12px to 8px).
- `vercel.json` sets cache headers (`/assets` 1 day + stale-while-revalidate, `/css` and `/js` 1 hour).
  Because assets are cached, **give a replaced image a new filename** or visitors can see the old one
  for up to a day. `.vercelignore` keeps mockups/tools/notes out of the deploy.
- Measured at 1440px: Vendrs 7.9MB to 3.9MB after a full scroll (2.4MB on first load), About 7.3MB to 3.5MB.

## Wider layout (2026-10-02)
- **Container tokens changed:** `--maxw` 1160px to **1280px**, `--gutter` `clamp(20px, 7vw, 112px)` to
  **`clamp(20px, 5.56vw, 80px)`**. At a 1440 screen the side margins are now 80px (were 140px), matching
  the reference portfolio (emilee369.github.io/portfolio). Nav, hero and `.wrap` all read these two tokens, so
  they still line up; **if you change one, change both.** This reverses the older "more page margin" note above.
- Home case-study cards: column gap is now `clamp(20px, 2vw, 28px)`, so at 1440 each card is 626px wide.
- `.hero__scroll` inset uses 80px (was 104px) and `.about-hero__mascot` sits at `right: var(--gutter)` so it
  stays inside the margin instead of touching the screen edge.
- **Vendrs case-study column (revised 2026-10-05).** It was widened to 1050px to fill the margins and the user said
  that was far too wide, so it is now `--col: 800px` (figures, grids, header, hero card) with `--text: 740px`
  (paragraphs and headings), both left-aligned to one edge, set about 60px in from the section list
  (`margin-left: clamp(0px, 4vw, 60px)`). 740px matches the case-study column on claireyokota.com. The original
  was 720px for everything. No image is upscaled. Below 981px the layout is the stacked one; the section pill
  bar is hidden below 1000px.
