# Portfolio 2.0 — Handoff

Vanilla HTML/CSS/JS portfolio for Anthony N. (product designer, UC Davis). No build step.

## Where it lives
- **Project root:** `/Users/atony/Desktop/New portfolio files/Portfolio2.0/`
  (moved here from `~/Downloads/...` — Downloads copy no longer exists.)
- It is now a **git repo** (`.git` present). Note: git makes objects read-only, so a naive
  `cp -R "$SRC/." "$DEST/"` **fails on `.git/objects` (Permission denied)** — exclude `.git`
  when mirroring (copy `index.html about.html css js assets work/*.html` individually, or rsync
  with `--exclude=.git`).

## Preview setup (important, session-specific)
The in-app browser sandbox serves from a **scratchpad mirror**, not the Desktop source directly.
- Global launch config: `~/.claude/launch.json`, entry **`portfolio2`**, port **4321**,
  `--directory` currently points at THIS session's scratchpad:
  `/private/tmp/claude-501/-Users-atony/4285ef0a-fbc6-43c9-b423-bd385d896bc5/scratchpad/preview`
- **A new session has a different scratchpad path.** To get preview working again:
  1. Make your session's preview dir, e.g. `$PREVIEW="<your scratchpad>/preview"`.
  2. Mirror source into it (exclude `.git`): copy `index.html about.html css js assets` and `work/*.html`.
  3. Edit `~/.claude/launch.json` → `portfolio2` `--directory` to your `$PREVIEW`.
  4. `preview_start` name `portfolio2`; it serves at `http://localhost:4321`.
- **After every edit**, re-copy the changed file(s) into `$PREVIEW`. The preview browser also
  **caches `css/style.css` and `js/main.js` hard** — bust with a `?cb=Date.now()` query on the
  `<link>`/`<script>` when verifying, or the user should hard-refresh (Cmd+Shift+R).

## Pages
- **index.html** — hero (composite image + doodle stars, "Sumi" handwritten arrow label pointing at the mascot, no underline); Selected Works bento (3 cards w/ 3D tilt); **"More than the work"** section (`#meet`: tilted photo + mascot + "More about me →" button → about.html — this replaced the old "From code to connection" process section); compact footer.
- **about.html** — intro (**photo LEFT**, copy right, single slightly-tilted portrait + doodle star; "Hi, I'm" is IBM serif italic, NOT handwriting); **Experience & Education** as an anukul-style logo list (`.explist`/`.exprow`: rounded logo tiles, dashed connector path, role/company/note, dates right, sans labels); Hobbies bento + Photobooth strips. (The old "What I design with" toolkit section was removed.)
- **work/vendrs.html**, **work/qac-gallery.html**, **work/uc-davis-app.html** — case studies with a **sticky vertical left section-nav** (`.case-nav`, plain text, flush to left margin, scroll-spy highlight via a scroll-position calc in main.js), `.cs__body` content column. Senior-UX-voice copy, real imagery, sticky-note process artifacts, doodle annotations. **No em/en dashes anywhere.**

## Design system (css/style.css `:root`)
- Fonts: **Overused Grotesk** (`--sans`, everything), **IBM Plex Serif** (`--serif`, italic accent
  words via `.serif` / `.sec-title`), **Caveat** (`--hand`, handwritten doodle labels only).
  All three linked in every page `<head>` EXCEPT **about.html has no Caveat link** (about must not
  use the handwriting font).
- Palette: `--blue #213c97` and friends; light bg. Blue-duotone photo recipe (`.duo`).
- **Custom cursor is DISABLED** — `js/main.js` cursor block is guarded by `if (false)`; site uses the
  normal system cursor. (The themed star/dashed-ring cursor CSS still exists but is unused.)
- **Loading behavior (js/main.js):**
  - Long mascot+name **preloader shows once per session** (`sessionStorage 'anp_intro'`), then is
    skipped; subsequent page loads use only the short transition.
  - Short **page-transition wipe** (`.pt`) plays on every internal nav; it shows the mascot, the word
    **"loading"** (`.pt__loading`), and a **loading bar** (`.pt__bar`) positioned lower, below the mascot.

## Assets
- In project: `assets/graphics/vendrs/` (login, business-type, events-map, design-system + 4 videos),
  `assets/graphics/qac/` (events-cards, event-detail, workshop, rent-space),
  `assets/graphics/ucd/` (wf-home, wf-events, wf-account — mid-fi wireframe slides),
  plus `sumi/` (19 mascot poses), `photobooth/`, `portrait.jpg`, `star.png`, company `logo-*.jpg/png`.
- **Original/source exports** (outside the project, on the Desktop / Downloads):
  `~/Downloads/NEW PORTFOLIO GRAPHICS/` (has `vendrs assets/`, plus many raw graphics),
  `~/Downloads/QAC Exports/`, `~/Downloads/UC Davis Mobile REDESIGN/`.

## Environment gotchas
- Preview browser runs at **devicePixelRatio 2 (retina)** → full-window screenshots sometimes render
  tiny/misscaled. Verify exact sizes/positions via DOM measurements (`javascript_tool`); grab clean
  screenshots at a **~1200px width**, or isolate a section (hide sibling `main` children) and shoot at scroll 0.
- Programmatic scroll in the preview **does not fire `scroll`/`rAF`** reliably → can't exercise IO/scroll
  handlers via `scrollTo`; verify their logic by computing expected result instead.
- No ffmpeg / ImageMagick / PIL. Use `sips`, `qlmanage`, `swift`, `avconvert`. `qlmanage` can't thumbnail
  the `.webm` videos.
- zsh doesn't word-split unquoted vars. The Bash "safety classifier" occasionally goes down for a few
  minutes (writes/MCP tools blocked, read-only Bash still works) — wait and retry.
- Videos: onboarding & marketplace are **.webm** (Safari won't play them). No mp4 fallbacks yet.

## Open / possible next steps
- Provide **mp4 versions** of `onboarding.webm` + `marketplace.webm` for Safari; poster frames for videos.
- Real **Spotify playlist URL** for `about.html` `.spotify` href (still generic `open.spotify.com`).
- QAC/UC Davis could use more real screens (UC Davis only has mid-fi wireframes; presented honestly).
- Sierra College education row has no dates (unknown).
- Optional: extend the tilted-photo warmth / doodle treatment further; before/after visuals for the
  Marketplace iteration; real metrics or testimonials in case-study Results.
