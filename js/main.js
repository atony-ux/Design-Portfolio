/* =====================================================================
   Anthony N. - Portfolio 2.0 · interactions
   custom cursor + view label
   magnetic buttons · parallax · tilt · scroll reveal + counters
   scroll-spy + hide-on-scroll nav · marquee clone · works hover-preview
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* drawably: hand-drawn controls, vendored in assets/vendor/drawably (see
     HANDOFF "drawably, vendored"). Pages that use it load drawably.classic.js, a
     plain script that sets window.drawably, just before this file. It is NOT the
     ES module build on purpose: Chrome blocks ES modules on a page opened straight
     from disk (file://, "blocked by CORS policy ... origin 'null'"), which is why
     the sketches never appeared when index.html was double-clicked. Regenerate it
     with tools/drawably-classic.py after upgrading drawably. Still a promise, so
     the callers below do not care how the library arrived. */
  /* How hand-drawn the sketches look. drawably's default roughness is 1, which
     read too scratchy here (the user asked for less rough). Every sketch on the
     site uses this one value. */
  var DW_ROUGH = 0.5;
  function loadDrawably() {
    return Promise.resolve(window.drawably || null);
  }

  /* -------------------------------------------------- Hero title reveal */
  var hTitle = $(".hero__title");
  if (hTitle) { hTitle.classList.add("reveal"); }

  /* -------------------------------------------------- Mobile nav toggle */
  var toggle = $(".nav__toggle"), nav = $(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(nav.classList.contains("is-open")));
    });
    $$(".nav__link", nav).forEach(function (l) {
      l.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* -------------------------------------------------- Nav background once scrolled
     (A blue scroll-progress bar along the top also lived in this handler; it
     was removed 2026-09-14 at the user's request, markup and CSS included.) */
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    // The nav stays put on scroll (no hide-on-scroll-down). It only gains a
    // slightly stronger background once you leave the top, so it keeps its
    // contrast over content while still reading as translucent.
    if (nav) {
      var bar = nav.closest(".nav-outer") || nav;
      bar.classList.toggle("is-stuck", y > 8);
    }
    lastY = y;
  }, { passive: true });

  /* -------------------------------------------------- Custom cursor + word labels
     A doodle star leads the pointer and a dashed ring trails it. Over anything
     worth a word the ring fills in and shows one: View, Open, Play, Drag.

     Everything is DELEGATED off document rather than bound per element at load.
     The old version bound mouseenter to a fixed list on startup, so anything
     built later (the wallet's photos) never got a
     label. Delegation also means one listener instead of hundreds.

     A word comes from the nearest data-cursor ancestor; SELECTORS below is the
     fallback so most of the site works without touching the markup. Add
     data-cursor="Whatever" to override, or data-cursor="" to silence.

     Fine pointers only, and off for reduced motion: it is a decorative layer
     that replaces a system cursor people may rely on.

     OFF as of 2026-09-12, at the user's request: the site uses the normal
     system cursor. Everything below still works, so flip CURSOR_ENABLED to
     true to bring it back. The .cursor-dot / .cursor-ring CSS is inert while
     this is off, because nothing adds body.cursor-active. */
  var CURSOR_ENABLED = false;
  if (CURSOR_ENABLED && finePointer && !reduced) {
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    var label = document.createElement("span"); label.className = "cursor-ring__label";
    ring.appendChild(label);
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add("cursor-active");

    /* First match wins, so specific beats general. Everything that lives INSIDE
       a draggable .pg-it (the links, the player buttons) has to sit above it,
       or the wrapper masks it and the whole card just says "Drag". */
    var SELECTORS = [
      [".wcard, .card, [data-cursor='view']", "View"],
      [".pg-wallet", "Photos"],
      [".pg-arrange", "Arrange"],
      ["[data-mp-play]", "Play"],
      ["[data-mp-next], [data-mp-prev]", "Skip"],
      ["[data-mp-seek]", "Scrub"],
      ["a[target='_blank']", "Open"],
      [".pg-photo", "Look"],
      [".pg-it", "Drag"],
      [".btn", "View"]
    ];
    var WARM = { Soon: 1, Chat: 1 };   /* orange instead of blue */

    function wordFor(target) {
      var tagged = target.closest("[data-cursor]");
      if (tagged) {
        var v = tagged.getAttribute("data-cursor");
        if (!v) return null;                        /* explicit silence */
        if (v.toLowerCase() === "view") return "View";
        return v;
      }
      for (var i = 0; i < SELECTORS.length; i++) {
        if (target.closest(SELECTORS[i][0])) return SELECTORS[i][1];
      }
      return null;
    }

    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, word = null;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      var t = e.target;
      if (!t || t.nodeType !== 1) return;
      var w = wordFor(t);
      if (w !== word) {
        word = w;
        label.textContent = w || "";
        ring.classList.toggle("is-label", !!w);
        ring.classList.toggle("is-label--warm", !!w && !!WARM[w]);
        /* no word, but still something clickable: just swell a little */
        ring.classList.toggle("is-hover", !w && !!t.closest("a, button, [data-magnetic], .tag"));
      }
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();

    window.addEventListener("mousedown", function () { ring.classList.add("is-down"); });
    window.addEventListener("mouseup", function () { ring.classList.remove("is-down"); });
    /* during a real drag the ring is noise, so hide it until the pointer is up */
    document.addEventListener("pointerdown", function (e) {
      if (e.target.closest && e.target.closest(".pg-it, .pg-photo, .pgd.is-photos")) {
        ring.classList.add("is-quiet"); dot.classList.add("is-quiet");
      }
    }, true);
    document.addEventListener("pointerup", function () {
      ring.classList.remove("is-quiet"); dot.classList.remove("is-quiet");
    }, true);
    document.addEventListener("mouseleave", function () { dot.style.opacity = 0; ring.style.opacity = 0; });
    document.addEventListener("mouseenter", function () { dot.style.opacity = 1; ring.style.opacity = .55; });
  }

  /* -------------------------------------------------- drawably: sketched controls
     Declarative: an element opts in with data-drawably, and this attaches the
     sketch once the library has loaded. Until then (or if it never loads) the
     element keeps its plain site styling, so nothing is ever left unstyled.
       data-drawably="button:solid"  sketchPill as a filled pill button (a link is fine)
       data-drawably="highlight"     drawablyHighlight, the marker wash
       data-drawably="pill"          sketchPill below: a rounder, thinner badge
     Colours and line weight live in the DRAWABLY section of style.css. */
  (function () {
    var nodes = $$("[data-drawably]");
    if (!nodes.length) return;
    loadDrawably().then(function (d) {
      if (!d) return;
      nodes.forEach(function (el) {
        var spec = el.getAttribute("data-drawably").split(":");
        try {
          /* not drawablyButton: its corner is a hardcoded 8px, which read boxy next
             to the site's fully rounded tags and chips, so buttons are pills too */
          if (spec[0] === "button") sketchPill(d, el, { button: true, solid: (spec[1] || "solid") === "solid" });
          else if (spec[0] === "highlight") d.drawablyHighlight(el, { roughness: DW_ROUGH });
          else if (spec[0] === "pill") sketchPill(d, el);
        } catch (err) {
          if (window.console) console.warn("drawably could not sketch", el, err);
        }
      });
    });
  })();

  /* A pill drawably does not ship. drawablyBadge hardcodes a 2px corner and has
     no radius option, so the tags and chips are drawn here from drawably's own
     exported primitives (roughRoundedRect + variants), into the same markup its
     controls produce: svg.drawably-svg holding three path.drawably-boil frames
     marked data-i. drawably's stylesheet animates exactly that structure, so the
     boil and the colour variables work unchanged. It also means this depends on
     those class names: re-check them when upgrading drawably. */
  /* opts.solid adds drawably's filled .drawably-blob layer under the outline;
     opts.button adds drawably's button classes (text colour, hover lift, press)
     and re-sketches on touch, the way drawably's own buttons do. */
  function sketchPill(d, el, opts) {
    opts = opts || {};
    var NS = "http://www.w3.org/2000/svg", INSET = 2;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "drawably-svg");
    svg.setAttribute("aria-hidden", "true");
    el.classList.add("drawably-host", "dw-pill");
    if (opts.button) el.classList.add("drawably-button", opts.solid ? "drawably-button--solid" : "drawably-button--outline");
    el.insertBefore(svg, el.firstChild);
    var seed = d.randomSeed();
    var boil = reduced ? 0 : 0.3;
    var layers = opts.solid ? ["drawably-blob", "drawably-outline"] : ["drawably-outline"];
    function draw() {
      var w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h) return;
      var ih = h - 2 * INSET;
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.textContent = "";
      layers.forEach(function (cls) {
        var frames = d.variants(function (o) {
          /* radius is half the inner height, so the ends are fully round */
          return d.roughRoundedRect(INSET, INSET, w - 2 * INSET, ih, ih / 2, o);
        }, { seed: seed, roughness: DW_ROUGH, boil: boil }, boil ? 3 : 1);
        frames.forEach(function (path, i) {
          var p = document.createElementNS(NS, "path");
          p.setAttribute("d", path);
          p.setAttribute("class", frames.length > 1 ? "drawably-boil " + cls : cls);
          p.setAttribute("data-i", String(i));
          svg.appendChild(p);
        });
      });
    }
    draw();
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(draw).observe(el);
    if (opts.button && !reduced) {
      var again = function () { seed = d.randomSeed(); draw(); };
      el.addEventListener("pointerenter", again);
      el.addEventListener("pointerdown", again);
    }
  }

  /* -------------------------------------------------- Magnetic buttons */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 0.3;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + (e.clientX - (r.left + r.width / 2)) * strength + "px," + (e.clientY - (r.top + r.height / 2)) * strength + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* -------------------------------------------------- 3D tilt on cards */
  if (finePointer && !reduced) {
    $$("[data-tilt]").forEach(function (el) {
      el.style.transformStyle = "preserve-3d";
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        // override any inline transition-delay left over from the reveal stagger
        // (that delay was making every card but the first tilt sluggishly / not at all)
        el.style.transition = "transform .22s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "perspective(1000px) rotateY(" + (px * 6) + "deg) rotateX(" + (-py * 6) + "deg) translateY(-6px) scale(1.01)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform .45s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "";
      });
    });
  }

  /* -------------------------------------------------- Parallax (desktop only, skip the scroll cost on phones) */
  if (!reduced && window.matchMedia("(min-width: 900px)").matches) {
    var parallax = $$("[data-parallax]");
    if (parallax.length) {
      var pTick = false;
      window.addEventListener("scroll", function () {
        if (pTick) return; pTick = true;
        requestAnimationFrame(function () {
          var vh = innerHeight;
          parallax.forEach(function (el) {
            var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
            var r = el.getBoundingClientRect();
            var offset = (r.top + r.height / 2 - vh / 2) * speed;
            el.style.transform = "translateY(" + (-offset) + "px) rotate(var(--rot,0deg))";
          });
          pTick = false;
        });
      }, { passive: true });
    }
  }

  /* -------------------------------------------------- Scroll reveal + stagger + counters */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    var start = null, dur = 1200;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var reveals = $$("[data-reveal], [data-reveal-stagger]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        if (t.hasAttribute("data-reveal-stagger")) {
          [].slice.call(t.children).forEach(function (c, i) { c.style.transitionDelay = (i * 0.08) + "s"; });
        }
        t.classList.add("is-in");
        $$("[data-count]", t).forEach(runCounter);
        if (t.hasAttribute("data-count")) runCounter(t);
        io.unobserve(t);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    $$("[data-count]").forEach(function (el) {
      if (!el.closest("[data-reveal],[data-reveal-stagger]")) io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
    $$("[data-count]").forEach(runCounter);
  }

  /* -------------------------------------------------- Featured work: re-pile on the way back up
     The generic reveal observer above unobserves after the first hit, so the
     cards would separate once and stay separated. This second observer toggles
     `is-in` in BOTH directions, which runs the pile animation in reverse when
     the section leaves the viewport upward. */
  var worktiles = document.querySelector(".worktiles");
  if (worktiles && "IntersectionObserver" in window && !reduced) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle("is-in", en.isIntersecting); });
    }, { threshold: 0.18 }).observe(worktiles);
  }

  /* -------------------------------------------------- Playground: drag the loose objects
     Pointer events so mouse and touch both work. Each object keeps its tilt in
     an inline `transform`, so dragging only ever writes left/top and never
     fights the rotation. Disabled below 900px, where the layout collapses to a
     plain stacked list. */
  (function () {
    var stage = document.getElementById("playground");
    if (!stage) return;
    var active = null, dx = 0, dy = 0, sx = 0, sy = 0, pid = 0, top = 20, moved = false;
    function draggable() { return window.matchMedia("(min-width: 901px)").matches; }
    /* Without this, pressing a link and moving picks up the LINK (the browser's
       native drag-and-drop of the URL) instead of moving the card: the native
       drag fires pointercancel and the card drag dies. CSS -webkit-user-drag
       covers Safari/Chrome; draggable="false" and a cancelled dragstart cover
       Firefox. Clicks are unaffected. */
    [].slice.call(stage.querySelectorAll("a, img")).forEach(function (el) {
      el.setAttribute("draggable", "false");
    });
    stage.addEventListener("dragstart", function (e) { e.preventDefault(); });
    stage.addEventListener("pointerdown", function (e) {
      if (!draggable()) return;
      var el = e.target.closest(".pg-it");
      if (!el) return;
      active = el; moved = false; pid = e.pointerId;
      sx = e.clientX; sy = e.clientY;
      var r = el.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
      /* NO preventDefault here: calling it on pointerdown stops the browser
         firing the compatibility click, which killed every link inside a
         draggable object. Selection/image-drag are handled in CSS.
         And NO pointer capture yet either: capture retargets the click to the
         .pg-it wrapper instead of the link inside it, so a plain click on
         SoundCloud, Strava, LinkedIn, Resume or the play button went nowhere.
         Capture starts in pointermove, once it is really a drag. */
    });
    stage.addEventListener("pointermove", function (e) {
      if (!active) return;
      if (!moved) {
        /* a few px of hand or trackpad jitter during a click is not a drag */
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 6) return;
        moved = true;
        active.style.zIndex = ++top;
        active.classList.add("is-drag");
        try { active.setPointerCapture(pid); } catch (err) {}
      }
      var s = stage.getBoundingClientRect();
      var x = e.clientX - s.left - dx, y = e.clientY - s.top - dy;
      x = Math.max(-40, Math.min(x, stage.clientWidth - 60));
      y = Math.max(-40, Math.min(y, stage.clientHeight - 60));
      active.style.left = x + "px"; active.style.top = y + "px";
    });
    function end() { if (active) { active.classList.remove("is-drag"); active = null; } }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    /* a drag that ends on a link or button must not also follow or press it.
       stopPropagation too: preventDefault alone does not stop a button's own
       click listener (a dragged button would still fire). */
    stage.addEventListener("click", function (e) {
      if (moved && e.target.closest("a, button")) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  })();

  /* -------------------------------------------------- Music: one player for the whole site
     The "My work" sleeve in the about playground is its home, but the audio
     lives here so it can follow the visitor: a mini bar (bottom right) takes
     over whenever the sleeve is not on screen, and on
     every other page. The bar has previous/play/next, a draggable progress line,
     volume (icon; a vertical slider pops up above it on hover, click mutes) and close.

     The site is separate pages, so audio cannot literally survive a page load.
     The state (track, position, volume, playing) is saved to sessionStorage on
     the way out and restored on the way in. If the browser refuses to autoplay
     on the new page (Safari usually does), the bar comes up paused at the same
     spot and one tap carries on.

     Tracks are AAC (.m4a) web copies of the WAV masters: about 20MB for all six
     instead of 175MB. To add one:
       afconvert -f m4af -d aac -b 160000 "<in>.wav" assets/audio/<slug>.m4a
     then add a line to TRACKS (len is its length in seconds from afinfo,
     ROUNDED DOWN: it is shown before the file loads, and the real duration is
     floored for display, so rounding up makes the time tick back by 1s). */
  (function () {
    var TRACKS = [
      { title: "10dollar",          file: "10dollar.m4a",         len: 91 },
      { title: "feel good w/ dnty", file: "feel-good-w-dnty.m4a", len: 194 },
      { title: "UNRELEASED 001",    file: "unreleased-001.m4a",   len: 165 },
      { title: "UNRELEASED 002",    file: "unreleased-002.m4a",   len: 168 },
      { title: "UNRELEASED 003",    file: "unreleased-003.m4a",   len: 160 },
      { title: "UNRELEASED 004",    file: "unreleased-004.m4a",   len: 213 }
    ];
    var KEY = "anp_music";
    var START_VOLUME = 0.5;   /* half way, so it never starts loud */
    /* main.js always lives at <root>/js/main.js, so the root is one level up
       from it, at the site root or inside /work/ alike */
    var script = document.currentScript || document.querySelector('script[src*="main.js"]');
    var ROOT = script ? new URL("../", script.src).href : "";

    var audio = new Audio();
    audio.preload = "none";
    var st = { i: 0, t: 0, playing: false, vol: START_VOLUME, active: false };
    try {
      var saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (saved) for (var k in st) if (k in saved) st[k] = saved[k];
    } catch (e) {}
    if (!(st.i >= 0 && st.i < TRACKS.length)) st.i = 0;
    st.vol = Math.max(0, Math.min(1, isFinite(+st.vol) ? +st.vol : START_VOLUME));
    var pendingSeek = null, wantPlay = false, fails = 0, lastSave = 0;
    /* st.vol is the listener's volume. fade (0..1) rides on top of it for the
       page-change fade out / fade in, so a fade never changes the saved level. */
    var fade = 1, fadeTimer = 0, fadeInOnPlay = false;
    function applyVol() { audio.volume = Math.max(0, Math.min(1, st.vol * fade)); }
    function fadeTo(to, ms) {
      clearInterval(fadeTimer);
      var from = fade, t0 = Date.now();
      fadeTimer = setInterval(function () {
        var k = Math.min(1, (Date.now() - t0) / ms);
        fade = from + (to - from) * (k * (2 - k));   /* ease out */
        applyVol();
        if (k >= 1) { clearInterval(fadeTimer); fadeTimer = 0; }
      }, 16);
    }
    applyVol();

    /* ---------- the bar, built here so no page needs its own markup */
    var PLAY = '<svg class="pg-play__i" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' +
               '<svg class="pg-play__p" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5h3v13H8zM13 5.5h3v13h-3z"/></svg>';
    var bar = document.createElement("div");
    bar.className = "mp";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Music player");
    var SPK = '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="none"/>';
    bar.innerHTML =
      '<span class="mp__disc" aria-hidden="true"><img src="' + ROOT + 'assets/graphics/cd.jpg" alt="" /></span>' +
      '<span class="mp__meta"><span class="mp__t" data-mp-title></span>' +
        '<span class="mp__s"><span data-mp-elapsed></span> / <span data-mp-dur></span> &middot; <span data-mp-count></span></span></span>' +
      '<button class="mp__btn" type="button" data-mp-prev aria-label="Previous track"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 6v12l-9-6z"/><path d="M5.3 6h2.3v12H5.3z"/></svg></button>' +
      '<button class="mp__btn mp__play" type="button" data-mp-play aria-label="Play">' + PLAY + '</button>' +
      '<button class="mp__btn" type="button" data-mp-next aria-label="Next track"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6v12l9-6z"/><path d="M16.4 6h2.3v12h-2.3z"/></svg></button>' +
      '<span class="mp__vol">' +
        '<button class="mp__btn mp__volbtn" type="button" data-mp-mute aria-label="Mute">' +
          '<svg class="mp__vol-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' + SPK + '<path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/></svg>' +
          '<svg class="mp__vol-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' + SPK + '<path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>' +
        '</button>' +
        '<span class="mp__volwrap"><input type="range" min="0" max="100" step="1" orient="vertical" aria-orientation="vertical" data-mp-vol aria-label="Volume" />' +
          '<span class="mp__volpct" data-mp-volpct aria-hidden="true"></span></span>' +
      '</span>' +
      '<button class="mp__btn mp__x" type="button" data-mp-close aria-label="Stop and close the music player"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>' +
      '<span class="pg-seek mp__seek" data-mp-seek role="slider" tabindex="0" aria-label="Seek"><span class="pg-prog"><span class="pg-prog__bar" data-mp-bar></span></span></span>';
    document.body.appendChild(bar);

    var sleeve = document.querySelector(".pg-sleeve[data-player]");
    var stage = document.getElementById("playground");
    function all(sel) { return [].slice.call(document.querySelectorAll(sel)); }
    function fmt(t) {
      if (!isFinite(t) || t < 0) t = 0;
      var m = Math.floor(t / 60), sec = Math.floor(t % 60);
      return m + ":" + (sec < 10 ? "0" : "") + sec;
    }

    /* ---------- state */
    function save() {
      if (pendingSeek != null) st.t = pendingSeek;
      else if (audio.getAttribute("src")) st.t = audio.currentTime;
      st.playing = !audio.paused;
      try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    }
    function load(i, t) {
      st.i = (i + TRACKS.length) % TRACKS.length;
      st.t = t || 0;
      pendingSeek = st.t > 0 ? st.t : null;
      audio.src = ROOT + "assets/audio/" + TRACKS[st.i].file;
    }
    function play() {
      if (!audio.getAttribute("src")) load(st.i, st.t);
      st.active = true; wantPlay = true;
      var p = audio.play();
      /* blocked (autoplay on a fresh page): stay paused, the bar shows play */
      if (p && p.catch) p.catch(function () {
        wantPlay = false; fadeInOnPlay = false; fade = 1; applyVol(); render();
      });
      render(); save();
    }
    function pause() { wantPlay = false; audio.pause(); render(); save(); }
    function next() {
      var was = !audio.paused;
      load(st.i + 1, 0);
      if (was) play(); else { render(); save(); }
    }
    function prev() {
      var was = !audio.paused;
      /* a few seconds in, back means the start of this song, as on any player */
      if (audio.getAttribute("src") && pendingSeek == null && audio.currentTime > 3) {
        audio.currentTime = 0; render(); save(); return;
      }
      load(st.i - 1, 0);
      if (was) play(); else { render(); save(); }
    }
    function mute() { audio.muted = !audio.muted; render(); }
    function dur() { return audio.duration || TRACKS[st.i].len; }
    function now() {
      if (pendingSeek != null) return pendingSeek;
      return audio.getAttribute("src") ? audio.currentTime : st.t;
    }
    function seekTo(frac) {
      var t = Math.max(0, Math.min(1, frac)) * dur();
      if (!audio.getAttribute("src")) load(st.i, t);          /* applied once it loads */
      else if (audio.readyState >= 1) audio.currentTime = Math.min(t, Math.max(0, audio.duration - 0.25));
      else pendingSeek = t;
      render(); save();
    }
    function close() {
      wantPlay = false;
      audio.pause();
      audio.removeAttribute("src"); audio.load();
      st.active = false; st.t = 0; pendingSeek = null;
      render(); save();
    }
    function setVolume(v) {
      st.vol = Math.max(0, Math.min(1, v));
      if (st.vol > 0) audio.muted = false;
      applyVol(); render(); save();
    }

    /* ---------- one render for the sleeve and the bar */
    var sleeveOnScreen = false;
    var seeking = null;   /* 0..1 while a progress bar is being dragged */
    function showBar() {
      var photos = !!(stage && stage.classList.contains("is-photos"));
      /* photo mode pulls the sleeve off the desk */
      var away = photos;
      bar.classList.toggle("is-shown", st.active && (!sleeve || !sleeveOnScreen || away));
      document.body.classList.toggle("mp-lift", photos);
    }
    function render() {
      var playing = !audio.paused;
      bar.classList.toggle("is-playing", playing);
      if (sleeve) sleeve.classList.toggle("is-playing", playing);
      var tr = TRACKS[st.i];
      var d = dur();
      var t = seeking != null ? seeking * d : now();
      var muted = audio.muted || st.vol === 0;
      bar.classList.toggle("is-muted", muted);
      if (sleeve) sleeve.classList.toggle("is-muted", muted);
      all("[data-mp-title]").forEach(function (el) { el.textContent = tr.title; });
      all("[data-mp-count]").forEach(function (el) { el.textContent = (st.i + 1) + " / " + TRACKS.length; });
      all("[data-mp-play]").forEach(function (b) { b.setAttribute("aria-label", playing ? "Pause" : "Play"); });
      all("[data-mp-bar]").forEach(function (el) { el.style.width = (d ? Math.min(100, t / d * 100) : 0) + "%"; });
      all("[data-mp-time]").forEach(function (el) { el.textContent = fmt(d - t); });
      all("[data-mp-elapsed]").forEach(function (el) { el.textContent = fmt(t); });
      all("[data-mp-dur]").forEach(function (el) { el.textContent = fmt(d); });
      all("[data-mp-seek]").forEach(function (el) {
        el.setAttribute("aria-valuemin", "0");
        el.setAttribute("aria-valuemax", String(Math.round(d)));
        el.setAttribute("aria-valuenow", String(Math.round(t)));
        el.setAttribute("aria-valuetext", fmt(t) + " of " + fmt(d));
      });
      all("[data-mp-mute]").forEach(function (b) { b.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute"); });
      all("[data-mp-volpct]").forEach(function (el) { el.textContent = muted ? "0" : String(Math.round(st.vol * 100)); });
      all("[data-mp-vol]").forEach(function (el) {
        if (document.activeElement !== el) el.value = Math.round(st.vol * 100);
      });
      showBar();
    }

    /* ---------- wiring */
    function on(sel, fn) {
      all(sel).forEach(function (b) {
        b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
      });
    }
    on("[data-mp-play]", function () { if (audio.paused) play(); else pause(); });
    on("[data-mp-next]", next);
    on("[data-mp-prev]", prev);
    on("[data-mp-mute]", mute);
    /* drag (or click, or arrow keys on) either progress bar to move through the
       song. stopPropagation: on the card this must not start a card drag, and
       the pointer is captured so the drag can leave the thin bar. */
    all("[data-mp-seek]").forEach(function (el) {
      function frac(e) { var r = el.getBoundingClientRect(); return (e.clientX - r.left) / r.width; }
      el.addEventListener("pointerdown", function (e) {
        if (e.button > 0) return;
        e.stopPropagation(); e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        el.classList.add("is-seeking");
        seeking = Math.max(0, Math.min(1, frac(e)));
        render();
      });
      el.addEventListener("pointermove", function (e) {
        if (!el.classList.contains("is-seeking")) return;
        seeking = Math.max(0, Math.min(1, frac(e)));
        render();
      });
      el.addEventListener("pointerup", function () {
        if (!el.classList.contains("is-seeking")) return;
        el.classList.remove("is-seeking");
        var f = seeking; seeking = null;
        seekTo(f);
      });
      el.addEventListener("pointercancel", function () {
        el.classList.remove("is-seeking"); seeking = null; render();
      });
      el.addEventListener("keydown", function (e) {
        var step = 5 / dur();
        if (e.key === "ArrowRight") { e.preventDefault(); seekTo(now() / dur() + step); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); seekTo(now() / dur() - step); }
      });
    });
    on("[data-mp-close]", close);
    all("[data-mp-vol]").forEach(function (r) {
      r.addEventListener("input", function () { setVolume(r.value / 100); });
    });
    /* on the card these sit inside a draggable .pg-it: without this, sliding
       the volume would pick the whole card up and drag it instead */
    all("[data-mp-vol], [data-mp-mute]").forEach(function (el) {
      el.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    });

    audio.addEventListener("loadedmetadata", function () {
      if (pendingSeek != null) {
        try { audio.currentTime = Math.min(pendingSeek, Math.max(0, audio.duration - 1)); } catch (e) {}
        pendingSeek = null;
      }
      render();
    });
    audio.addEventListener("playing", function () {
      fails = 0;
      if (fadeInOnPlay) { fadeInOnPlay = false; fadeTo(1, 900); }
    });
    audio.addEventListener("play", render);
    audio.addEventListener("pause", render);
    audio.addEventListener("volumechange", render);
    audio.addEventListener("timeupdate", function () {
      render();
      if (Date.now() - lastSave > 1000) { lastSave = Date.now(); save(); }
    });
    /* the playlist runs on: the end of one track starts the next */
    audio.addEventListener("ended", function () { load(st.i + 1, 0); play(); });
    /* a file that will not load is skipped, once round the list at most */
    audio.addEventListener("error", function () {
      if (!audio.getAttribute("src") || !wantPlay) return;
      if (++fails < TRACKS.length) { load(st.i + 1, 0); play(); }
      else { wantPlay = false; render(); }
    });
    window.addEventListener("pagehide", save);
    /* back/forward can restore this page from the browser cache with its old,
       stale music state; the newer state is whatever the last page saved */
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      clearInterval(fadeTimer); fadeTimer = 0;
      audio.pause();
      var s2 = null;
      try { s2 = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (err) {}
      if (s2) for (var k2 in st) if (k2 in s2) st[k2] = s2[k2];
      fade = 1;
      if (st.active) {
        load(st.i, st.t);
        if (st.playing) { fade = 0; fadeInOnPlay = true; applyVol(); play(); }
      }
      applyVol(); render();
    });

    if (sleeve && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        sleeveOnScreen = es[0].isIntersecting && es[0].intersectionRatio >= 0.35;
        showBar();
      }, { threshold: [0, 0.35, 1] }).observe(sleeve);
    }
    /* photo mode sucks the sleeve into the wallet, so the bar takes over */
    if (stage && "MutationObserver" in window) {
      new MutationObserver(showBar).observe(stage, { attributes: true, attributeFilter: ["class"] });
    }

    /* ---------- coming in from another page: pick up where it left off */
    if (st.active) {
      load(st.i, st.t);
      /* start silent and fade in once it is actually playing */
      if (st.playing) { fade = 0; fadeInOnPlay = true; applyVol(); play(); }
      else { audio.preload = "metadata"; audio.load(); }
    }
    render();
    /* debugging hook, harmless in production */
    window.__music = { audio: audio, state: st, tracks: TRACKS };
  })();

  /* -------------------------------------------------- The photo wallet
     Toggling it sucks every loose object into the wallet, then the photos
     burst out (the burst itself is CSS, driven by .is-photos on the stage).
     Each object's flight path is measured live rather than hardcoded, because
     the objects are draggable and may not be where the markup left them. */
  (function () {
    var stage  = document.getElementById("playground");
    var wallet = document.getElementById("pg-wallet");
    if (!stage || !wallet) return;
    var cue  = wallet.querySelector(".pg-wallet__cue");
    var open = false;

    function loose() {
      return [].slice.call(stage.querySelectorAll(".pg-it, .pg-star"));
    }
    function suck(target) {
      var w = (target || wallet).getBoundingClientRect();
      var cx = w.left + w.width / 2, cy = w.top + w.height / 2;
      loose().forEach(function (el, i) {
        if (!el.dataset.baseTransform) {
          el.dataset.baseTransform = el.style.transform || "none";
        }
        var r = el.getBoundingClientRect();
        var dx = Math.round(cx - (r.left + r.width / 2));
        var dy = Math.round(cy - (r.top + r.height / 2));
        el.style.transition = "transform .6s cubic-bezier(.5,0,.75,0), opacity .45s ease";
        el.style.transitionDelay = (i * 0.022) + "s";
        el.style.transform = "translate(" + dx + "px," + dy + "px) scale(.08) rotate(18deg)";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      });
    }
    function release() {
      loose().forEach(function (el, i) {
        el.style.transition = "transform .62s var(--ease-back), opacity .4s ease";
        el.style.transitionDelay = (i * 0.022) + "s";
        el.style.transform = el.dataset.baseTransform === "none" ? "" : el.dataset.baseTransform;
        el.style.opacity = "";
        el.style.pointerEvents = "";
      });
    }
    wallet.addEventListener("click", function () {
      open = !open;
      wallet.setAttribute("aria-pressed", String(open));
      wallet.setAttribute("aria-label", open ? "Close the photo wallet" : "Open the photo wallet");
      if (cue) cue.textContent = open ? "tap to close" : "tap to open";
      if (open) { suck(); stage.classList.add("is-photos"); }
      else { stage.classList.remove("is-photos"); release(); }
    });
  })();

  /* -------------------------------------------------- Playground photos: drag + zoom
     The photos carry their scattered position in --tx/--ty, so dragging writes
     those custom properties rather than left/top. That keeps the tilt, and keeps
     the wallet's burst/collapse maths working on the same values. */
  (function () {
    var stage = document.getElementById("playground");
    if (!stage) return;
    var photos = [].slice.call(stage.querySelectorAll(".pg-photo"));
    if (!photos.length) return;
    var top = 160, active = null, sx = 0, sy = 0, ox = 0, oy = 0;

    function num(el, prop) { return parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0; }
    /* the pan module below needs to read these too */
    window.__pgPhotoNum = num;
    function unzoomAll() {
      photos.forEach(function (p) { p.classList.remove("is-zoomed"); });
      stage.classList.remove("is-zoomedmode");
    }
    photos.forEach(function (ph) {
      /* per photo, not shared: a drag on one must not swallow the next click on
         another, which is exactly what a single shared flag did */
      var moved = false;
      ph.addEventListener("pointerdown", function (e) {
        if (!stage.classList.contains("is-photos")) return;
        if (ph.classList.contains("is-zoomed")) return;   /* zoomed photo is not draggable */
        active = ph; moved = false;
        sx = e.clientX; sy = e.clientY;
        ox = num(ph, "--tx"); oy = num(ph, "--ty");
        ph.style.zIndex = ++top;
        try { ph.setPointerCapture(e.pointerId); } catch (err) {}
        e.stopPropagation();   /* deliberately no preventDefault, see above */
      });
      ph.addEventListener("pointermove", function (e) {
        if (active !== ph) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved && Math.abs(dx) + Math.abs(dy) > 4) {
          moved = true;
          ph.classList.add("is-dragging");
          /* the burst transition would fight a live drag */
          ph.style.transition = "none";
        }
        if (!moved) return;
        ph.style.setProperty("--tx", (ox + dx) + "px");
        ph.style.setProperty("--ty", (oy + dy) + "px");
      });
      function release() {
        if (active !== ph) return;
        ph.classList.remove("is-dragging");
        ph.style.transition = "";
        /* rebase into world coordinates or the next pan frame would snap it back */
        if (moved && typeof stage.__pgRebase === "function") stage.__pgRebase(ph);
        active = null;
      }
      ph.addEventListener("pointerup", release);
      ph.addEventListener("pointercancel", release);
      ph.addEventListener("click", function (e) {
        e.stopPropagation();
        if (moved) { moved = false; return; }   /* a drag is not a click */
        var wasZoomed = ph.classList.contains("is-zoomed");
        unzoomAll();
        if (!wasZoomed) {
          /* Work out the delta to the stage centre from the photo's SETTLED
             position rather than its live rect: reading the rect mid-flight
             (clicking while the burst is still animating) would centre it on
             wherever it happened to be at that instant.
             transform is translate(-50%,-50%) then translate(tx,ty), so the
             settled centre is exactly (offsetLeft + tx, offsetTop + ty). */
          var sr = stage.getBoundingClientRect();
          var cx = ph.offsetLeft + num(ph, "--tx");
          var cy = ph.offsetTop + num(ph, "--ty");
          var zx = Math.round(sr.width / 2 - cx);
          var zy = Math.round(sr.height / 2 - cy);
          var zs = Math.min(2.6, Math.max(1.5, (sr.height * 0.62) / ph.offsetHeight));
          ph.style.setProperty("--zx", zx + "px");
          ph.style.setProperty("--zy", zy + "px");
          ph.style.setProperty("--zs", zs.toFixed(2));
          ph.classList.add("is-zoomed");
          stage.classList.add("is-zoomedmode");
        }
      });
    });
    /* clicking the surface, or Escape, puts a zoomed photo back */
    stage.addEventListener("click", function (e) {
      if (!e.target.closest(".pg-photo")) unzoomAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") unzoomAll();
    });
  })();

  /* -------------------------------------------------- Photo mode: infinite pannable surface
     With the wallet open you can drag the empty surface to look around, and the
     space wraps: keep dragging and the same photos come back round.

     There are no clones. Each photo keeps ONE element and its position is taken
     modulo a "world" bigger than the stage, so when it leaves one edge it is
     re-placed at the opposite edge. The wrap always happens off-screen because
     the world is wider and taller than the stage by more than one photo, so you
     never see anything pop.

     The world grows with the number of photos: add more to .pg-photos and the
     surface gets proportionally larger on its own.

     Also in here, because they share the same world maths:
     - a flick keeps gliding after you let go, then eases to a stop
     - Sort files the photos into labelled groups by their data-group
     - Scatter throws them loose again, at fresh random spots every time */
  (function () {
    var stage = document.getElementById("playground");
    if (!stage) return;
    var photos = [].slice.call(stage.querySelectorAll(".pg-photo"));
    if (!photos.length) return;
    var sec = stage.closest(".pg-sec") || stage;
    var layer = stage.querySelector(".pg-photos") || stage;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var CELL_W = 430, CELL_H = 380;      /* breathing room budgeted per photo */
    var panX = 0, panY = 0;
    var worldW = 0, worldH = 0, minX = 0, minY = 0;
    var dragging = false, sx = 0, sy = 0, startX = 0, startY = 0;
    var vx = 0, vy = 0, lastT = 0, lastX = 0, lastY = 0, glide = 0;
    var settleTimer = 0;

    /* Group order and names for Sort. A photo whose data-group is not listed
       here still gets sorted: it lands in a group named after its key, last. */
    var GROUPS = [
      ["friends", "Friends"],
      ["travels", "Travels"],
      ["town", "Around town"],
      ["gaming", "Gaming"],
      ["music", "Music"],
      ["school", "School"]
    ];

    function num(el, prop) { return parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0; }
    /* Only the heading rides the pan. The wallet is pinned to a dock instead:
       it is the way out of photo mode, and an exit that can drift off screen is
       not one. One fixed thing on screen also keeps you oriented. */
    function riders() {
      return [stage.querySelector(".pg-hd")].filter(Boolean);
    }
    function photoBox() {
      var w = 0, h = 0;
      photos.forEach(function (p) { w = Math.max(w, p.offsetWidth); h = Math.max(h, p.offsetHeight); });
      return { w: w, h: h };
    }

    /* ---------- the sorted layout
       One horizontal strip of groups, every group the same number of rows, so
       the strip fits the height of the screen and you pan sideways from group to
       group. The photos shrink just enough to fit four rows. */
    /* TOP/BOTTOM keep the sorted grid clear of the heading and the dock; PAD is the
       gutter between photos. The old LABEL and GAP (group captions and the space
       between group blocks) are gone: sort is one grid now. */
    var TOP = 84, BOTTOM = 150, PAD = 18;
    function groupsOf() {
      var map = {}, list = [];
      GROUPS.forEach(function (g) {
        map[g[0]] = { key: g[0], name: g[1], items: [] };
        list.push(map[g[0]]);
      });
      photos.forEach(function (p) {
        var k = p.getAttribute("data-group") || "other";
        if (!map[k]) {
          map[k] = { key: k, name: k.charAt(0).toUpperCase() + k.slice(1), items: [] };
          list.push(map[k]);
        }
        map[k].items.push(p);
      });
      return list.filter(function (g) { return g.items.length; });
    }
    /* Bento packing (2026-09-25). Every photo is the same height and its own
       width, so a row is filled left to right until it reaches the target width,
       then the next row starts underneath. Rows share a baseline grid, so the
       block lines up across AND down while the widths stay varied.
       Groups no longer form blocks: they only set the reading order. */
    function plan() {
      var box = photoBox();
      var order = [];
      groupsOf().forEach(function (g) { order = order.concat(g.items); });
      /* Rows run a little past both edges of the stage, so the block covers the
         screen instead of sitting in a neat column with margins. */
      var sw = stage.clientWidth, availH = stage.clientHeight - TOP - BOTTOM;
      var target = Math.max(box.w + PAD, sw + 170);
      var built;
      function build(t) {
        var rows = [], row = [], rowW = 0;
        order.forEach(function (p) {
          var w = p.offsetWidth;
          if (row.length && rowW + PAD + w > t) { rows.push({ items: row, w: rowW }); row = []; rowW = 0; }
          rowW += (row.length ? PAD : 0) + w;
          row.push(p);
        });
        if (row.length) rows.push({ items: row, w: rowW });
        return rows;
      }
      /* If the set is small, narrow the rows until the block is tall enough to
         fill the screen: fewer photos per row means more rows. */
      built = build(target);
      while (built.length * (box.h + PAD) - PAD < availH && target > box.w * 2 + PAD) {
        target = Math.max(box.w + PAD, target * 0.8);
        built = build(target);
      }
      var widest = built.reduce(function (m, r) { return Math.max(m, r.w); }, 0);
      /* the zigzag: every other photo in a row rides higher, and every other row
         starts half a photo further along, so the block reads hand-placed */
      return { s: 1, pw: box.w, ph: box.h, rows: built, stepY: box.h + PAD,
               w: widest, h: built.length * (box.h + PAD) - PAD };
    }

    function measure() {
      var sw = stage.clientWidth, sh = stage.clientHeight;
      /* The world floor is set by the WIDEST panned thing, not by a photo: the
         heading is far wider, and if the world were only photo-width bigger than
         the stage the heading would visibly pop as it wrapped. */
      var widest = 0, tallest = 0;
      riders().concat(photos).forEach(function (el) {
        widest = Math.max(widest, el.offsetWidth);
        tallest = Math.max(tallest, el.offsetHeight);
      });
      var area = photos.length * CELL_W * CELL_H;
      var aspect = sw / sh;
      var byCount = Math.sqrt(area * aspect);
      /* ...and the sorted block must fit inside one lap of the world in BOTH
         directions, with room to spare. The world wraps (apply() takes the
         position modulo worldW/worldH), so a block taller or wider than one lap
         comes back around and lands on top of itself: that is what made the
         sorted photos overlap once they were enlarged. Measure the block and
         give it a full cell of clearance on each axis. */
      var block = plan();
      /* one lap has to hold the whole sorted block PLUS a screen, or the far end
         of the block wraps back over its own start while you pan */
      worldW = Math.max(sw + widest + 120, byCount, block.w + sw + 160);
      worldH = Math.max(sh + tallest + 120, worldW / aspect, block.h + sh + 160);
      minX = -(worldW - sw) / 2;
      minY = -(worldH - sh) / 2;
    }
    function rebase(ph) {
      /* current on-screen centre -> world coordinates */
      ph.__wx = ph.offsetLeft + num(ph, "--tx") - panX;
      ph.__wy = ph.offsetTop + num(ph, "--ty") - panY;
    }
    stage.__pgRebase = rebase;

    /* The authored offsets are vw/svh strings, so stash the strings rather than
       resolved pixels: restoring them lets CSS re-resolve at whatever the
       viewport is now. */
    photos.forEach(function (p) {
      p.__ax = p.style.getPropertyValue("--tx");
      p.__ay = p.style.getPropertyValue("--ty");
      p.__ar = p.style.getPropertyValue("--r");
    });
    function setSorted(on) {
      stage.classList.toggle("is-sorted", on);
      var b = stage.querySelector('[data-arrange="sort"]');
      if (b) b.setAttribute("aria-pressed", String(on));
    }
    function settle() {
      clearTimeout(settleTimer);
      photos.forEach(function (p) {
        p.classList.remove("is-hopping");
        p.style.transitionDelay = "";
        p.style.animationDelay = "";
      });
    }
    function capture() {
      /* opening the wallet always returns to the authored arrangement, so a pan,
         a sort or a photo drag never permanently loses the composed layout */
      settle();
      setSorted(false);
      photos.forEach(function (p) {
        if (p.__ax) p.style.setProperty("--tx", p.__ax);
        if (p.__ay) p.style.setProperty("--ty", p.__ay);
        if (p.__ar) p.style.setProperty("--r", p.__ar);
      });
      riders().forEach(function (el) {
        el.style.setProperty("--px", "0px");
        el.style.setProperty("--py", "0px");
      });
      measure();
      panX = 0; panY = 0;
      photos.forEach(rebase);
      riders().forEach(function (el) {
        var r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        el.__wx = r.left - sr.left + r.width / 2;
        el.__wy = r.top - sr.top + r.height / 2;
      });
      apply();
    }
    function wrap(v, size, min) { return ((v - min) % size + size) % size + min; }

    function apply() {
      photos.forEach(function (p) {
        var cx = wrap(p.__wx + panX, worldW, minX);
        var cy = wrap(p.__wy + panY, worldH, minY);
        p.style.setProperty("--tx", (cx - p.offsetLeft) + "px");
        p.style.setProperty("--ty", (cy - p.offsetTop) + "px");
      });
      riders().forEach(function (el) {
        var cx = wrap(el.__wx + panX, worldW, minX);
        var cy = wrap(el.__wy + panY, worldH, minY);
        el.style.setProperty("--px", Math.round(cx - el.__wx) + "px");
        el.style.setProperty("--py", Math.round(cy - el.__wy) + "px");
      });
      /* the dot field tiles every 22px, so it needs no wrapping of its own */
      sec.style.setProperty("--pan-x", Math.round(panX) + "px");
      sec.style.setProperty("--pan-y", Math.round(panY) + "px");
    }

    /* ---------- Sort and Scatter
       Every photo gets a new world position and sets off at its own moment,
       hopping on the way, so the set runs into place like a crowd rather than
       sliding as one block. */
    function send(targets) {
      stopGlide();
      settle();
      photos.forEach(function (p, i) {
        var t = targets[i];
        p.__wx = t.x; p.__wy = t.y;
        p.style.setProperty("--r", t.r.toFixed(1) + "deg");
        var d = reduce ? "0s" : (Math.random() * 0.3).toFixed(2) + "s";
        p.style.transitionDelay = d;
        p.style.animationDelay = d;
      });
      if (!reduce) {
        void stage.offsetWidth;   /* restart the hop on a second click */
        photos.forEach(function (p) { p.classList.add("is-hopping"); });
      }
      apply();
      settleTimer = setTimeout(settle, 1300);
    }
    function sortPhotos() {
      /* the block's size depends on the photos' current size, so re-measure the
         world first: a stale world is what lets the rows wrap onto each other */
      measure();
      var p = plan(), sw = stage.clientWidth, sh = stage.clientHeight;
      /* Anchor the block in the MIDDLE OF THE WORLD, not at the current view.
         The world wraps, and its window is centred on the stage, so a block laid
         out from the screen's top edge ran past the far edge of the lap and its
         last row reappeared above the first. Centred in the world it always has
         at least half a screen of clearance on every side. Then pan the view to
         the block's top-left so the first rows are what you see. */
      var bx = minX + (worldW - p.w) / 2;
      var by = minY + (worldH - p.h) / 2;
      panX = Math.max(40, (sw - p.w) / 2) - bx;
      panY = (p.h > sh - TOP - BOTTOM ? TOP : TOP + (sh - TOP - BOTTOM - p.h) / 2) - by;
      var x0 = bx, y0 = by;
      var targets = new Array(photos.length);
      stage.style.setProperty("--sort-s", String(p.s));
      p.rows.forEach(function (row, r) {
        /* straight rows, each centred on the block (the 2026-09-25 zigzag was
           reverted the same day) */
        var x = x0 + (p.w - row.w) / 2;
        row.items.forEach(function (ph) {
          var w = ph.offsetWidth;
          targets[photos.indexOf(ph)] = {
            x: x + w / 2,
            y: y0 + r * p.stepY + p.ph / 2,
            r: 0     /* no tilt anywhere in the gallery */
          };
          x += w + PAD;
        });
      });
      setSorted(true);
      send(targets);
    }
    function scatter() {
      /* a jittered grid over the whole world, slots shuffled, so the spread is
         even everywhere but no two throws are the same */
      var n = photos.length;
      var cols = Math.max(1, Math.round(Math.sqrt(n * worldW / worldH)));
      var rows = Math.ceil(n / cols);
      var cw = worldW / cols, ch = worldH / rows, slots = [];
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) slots.push([c, r]);
      for (var i = slots.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = slots[i];
        slots[i] = slots[j]; slots[j] = t;
      }
      var targets = photos.map(function (p, k) {
        return {
          x: minX - panX + (slots[k][0] + .5 + (Math.random() - .5) * .6) * cw,
          y: minY - panY + (slots[k][1] + .5 + (Math.random() - .5) * .6) * ch,
          r: 0     /* the photos are never tilted now */
        };
      });
      setSorted(false);
      send(targets);
    }
    [].slice.call(stage.querySelectorAll("[data-arrange]")).forEach(function (b) {
      b.addEventListener("click", function () {
        if (!stage.classList.contains("is-photos")) return;
        if (b.getAttribute("data-arrange") === "sort") sortPhotos(); else scatter();
      });
    });

    /* ---------- panning, with a glide after a flick */
    function stopGlide() {
      if (glide) cancelAnimationFrame(glide);
      glide = 0;
      if (!dragging) stage.classList.remove("is-panning");
    }
    /* any touch anywhere on the surface catches a glide in progress, so it can
       never fight a photo drag or a button */
    stage.addEventListener("pointerdown", function () { if (glide) stopGlide(); }, true);

    stage.addEventListener("pointerdown", function (e) {
      if (!stage.classList.contains("is-photos")) return;
      if (e.target !== stage) return;             /* bare surface only */
      dragging = true;
      sx = e.clientX; sy = e.clientY; startX = panX; startY = panY;
      vx = 0; vy = 0; lastT = e.timeStamp; lastX = e.clientX; lastY = e.clientY;
      stage.classList.add("is-panning");
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      panX = startX + (e.clientX - sx);
      panY = startY + (e.clientY - sy);
      /* smoothed velocity in px per ms, for the glide */
      var dt = e.timeStamp - lastT;
      if (dt > 0) {
        var k = Math.min(1, dt / 50);
        vx += ((e.clientX - lastX) / dt - vx) * k;
        vy += ((e.clientY - lastY) / dt - vy) * k;
        lastT = e.timeStamp; lastX = e.clientX; lastY = e.clientY;
      }
      apply();
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      /* holding still before letting go means "stop here", not "fling" */
      if (e.type === "pointercancel" || e.timeStamp - lastT > 90) { vx = 0; vy = 0; }
      var sp = Math.sqrt(vx * vx + vy * vy), cap = 4;
      if (sp > cap) { vx *= cap / sp; vy *= cap / sp; sp = cap; }
      if (reduce || sp < 0.1) { stage.classList.remove("is-panning"); return; }
      var prev = performance.now();
      glide = requestAnimationFrame(function step(now) {
        var dt = Math.min(40, Math.max(0, now - prev));
        prev = now;
        panX += vx * dt; panY += vy * dt;
        var f = Math.pow(0.995, dt);            /* friction per ms */
        vx *= f; vy *= f;
        apply();
        if (Math.sqrt(vx * vx + vy * vy) > 0.02) glide = requestAnimationFrame(step);
        else { glide = 0; stage.classList.remove("is-panning"); }
      });
    }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);

    /* the wallet opening is what arms all this */
    var wallet = document.getElementById("pg-wallet");
    if (wallet) {
      wallet.addEventListener("click", function () {
        /* run after the wallet handler has flipped .is-photos */
        setTimeout(function () {
          /* photos open scattered, in their authored positions; Sort is what
             lines them up */
          if (stage.classList.contains("is-photos")) { capture(); return; }
          stopGlide();
          settle();
          setSorted(false);
          panX = 0; panY = 0;
          riders().forEach(function (el) {
            el.style.setProperty("--px", "0px");
            el.style.setProperty("--py", "0px");
          });
          sec.style.setProperty("--pan-x", "0px");
          sec.style.setProperty("--pan-y", "0px");
        }, 0);
      });
    }
    window.addEventListener("resize", function () {
      if (!stage.classList.contains("is-photos")) return;
      measure();
      if (stage.classList.contains("is-sorted")) sortPhotos(); else apply();
    });
  })();

  /* -------------------------------------------------- Nav shrinks inside the playground
     That section is meant to read as one screen, so the full-width bar collapses
     to a small floating pill while you are in it and expands again on the way
     out. Everywhere else the nav is unchanged.
     Deliberately NOT rAF-throttled: it is one getBoundingClientRect per scroll
     event on a passive listener, and rAF callbacks do not run in the headless
     renderer used to verify this, which made the behaviour untestable. */
  (function () {
    var bar = document.querySelector(".nav-outer");
    var sec = document.getElementById("hobbies");
    if (!bar || !sec) return;
    function update() {
      var r = sec.getBoundingClientRect();
      /* the section owns the top of the viewport */
      var inside = r.top <= 4 && r.bottom > window.innerHeight * 0.35;
      bar.classList.toggle("is-pill", inside);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* -------------------------------------------------- Case-study section nav */
  var caseNav = $(".case-nav");
  if (caseNav) {
    var cLinks = $$(".case-nav__link", caseNav);
    var cPairs = cLinks.map(function (l) {
      var id = (l.getAttribute("href") || "").replace("#", "");
      var sec = id ? document.getElementById(id) : null;
      return sec ? { link: l, sec: sec } : null;
    }).filter(Boolean);
    if (cPairs.length) {
      // scroll-position based (reliable everywhere): highlight the last section
      // whose top has scrolled above a line ~1/4 down the viewport
      var cTick = false;
      var updateActiveSection = function () {
        var line = window.innerHeight * 0.28;
        var current = cPairs[0];
        cPairs.forEach(function (p) { if (p.sec.getBoundingClientRect().top <= line) current = p; });
        cPairs.forEach(function (p) { p.link.classList.toggle("is-active", p === current); });
        /* "Back to top" joins the list once the last section has been read to its end */
        var last = cPairs[cPairs.length - 1].sec;
        var atEnd = last.getBoundingClientRect().bottom <= window.innerHeight;
        if (atEnd !== caseNav.classList.contains("is-end")) {
          caseNav.classList.toggle("is-end", atEnd);
          var inner = $(".case-nav__inner", caseNav);
          if (atEnd && inner && inner.scrollWidth > inner.clientWidth) inner.scrollTo({ left: inner.scrollWidth, behavior: "smooth" });
        }
      };
      window.addEventListener("scroll", function () {
        if (cTick) return; cTick = true;
        requestAnimationFrame(function () { updateActiveSection(); cTick = false; });
      }, { passive: true });
      updateActiveSection();
    }
  }

  /* -------------------------------------------------- Lightbox
     Click anything with [data-lightbox] (a <button> wrapping an <img>) to see
     that image full size. Backdrop click, the close button, or Escape all
     dismiss it. No-op on pages that have neither the triggers nor the panel. */
  (function () {
    var triggers = $$("[data-lightbox]");
    var box = document.getElementById("vLightbox");
    if (!triggers.length || !box) return;
    var img = $(".v-lightbox__img", box);
    var closeBtn = $(".v-lightbox__close", box);
    var lastFocus = null;

    function open(src, alt) {
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = alt || "";
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add("is-open"); });
      closeBtn.focus();
    }
    function close() {
      box.classList.remove("is-open");
      setTimeout(function () { box.hidden = true; img.src = ""; }, 250);
      if (lastFocus) lastFocus.focus();
    }
    triggers.forEach(function (t) {
      t.addEventListener("click", function () {
        var tImg = t.querySelector("img");
        if (tImg) open(tImg.src, tImg.alt);
      });
    });
    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) close();
    });
  })();

  /* -------------------------------------------------- Marquee clone */
  $$(".marquee__track, .footer__wordmark-track").forEach(function (t) { t.innerHTML += t.innerHTML; });

  /* -------------------------------------------------- Page fade when opening a case study
     Clicking a work card fades the current page out for a beat before
     navigating; the case study then fades up (main.cs in style.css). Modified
     clicks, new-tab links and reduced motion keep the plain behaviour. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.wcard[href]");
    if (!a || e.defaultPrevented || reduced) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target && a.target !== "_self") return;
    e.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(function () { window.location.href = a.href; }, 280);
  });
  /* coming back with the browser's back button can restore this page from
     cache mid-fade; clear it so the page is not left blank */
  window.addEventListener("pageshow", function () { document.body.classList.remove("is-leaving"); });

  /* -------------------------------------------------- Works: filters + hover preview */
  var filters = $$(".filter"), rows = $$(".worklist__row");
  if (filters.length) {
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        filters.forEach(function (x) { x.classList.remove("is-active"); });
        f.classList.add("is-active");
        var key = f.getAttribute("data-filter");
        rows.forEach(function (r) {
          var show = key === "all" || (r.getAttribute("data-tags") || "").indexOf(key) > -1;
          r.style.display = show ? "" : "none";
        });
      });
    });
  }
  var peek = $(".workpeek");
  if (peek && finePointer && !reduced && rows.length) {
    var peekImg = $(".workpeek .duo img");
    var px2 = 0, py2 = 0, cx = 0, cy = 0, active = false;
    rows.forEach(function (r) {
      r.addEventListener("mouseenter", function () {
        active = true;
        var src = r.getAttribute("data-preview");
        if (src && peekImg) peekImg.src = src;
        peek.classList.add("show");
        rows.forEach(function (o) { o.classList.toggle("is-dim", o !== r); });
      });
      r.addEventListener("mouseleave", function () {
        active = false;
        peek.classList.remove("show");
        rows.forEach(function (o) { o.classList.remove("is-dim"); });
      });
    });
    window.addEventListener("mousemove", function (e) { px2 = e.clientX; py2 = e.clientY; });
    (function pk() {
      cx += (px2 - cx) * 0.12; cy += (py2 - cy) * 0.12;
      if (active) peek.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(pk);
    })();
  }

  /* -------------------------------------------------- Toast helper */
  var toastEl = document.createElement("div");
  toastEl.className = "toast";
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* -------------------------------------------------- Mascot buddy companion
     The buddy now opens the chat panel (see the chat IIFE at the end of this
     file), so it no longer cycles random bubbles on click. The bubble element
     is kept for the one-time greeting nudge. */
  var buddy = $(".buddy"), bubble = $(".buddy__bubble");
  var bubbleTimer;
  function showBubble(msg) {
    if (!bubble) return;
    bubble.textContent = msg;
    bubble.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove("show"); }, 4200);
  }
  if (buddy) {
    setTimeout(function () {
      if (document.querySelector(".chat.is-open")) return;
      showBubble("ask me about Anthony ✦");
    }, 3800);
  }

  /* -------------------------------------------------- Mascot click easter eggs */
  var eggCount = 0;
  var eggLines = ["beep boop, thanks for clicking ✦", "still designing… come back later", "certified Figma + Claude enjoyer ✦", "psst, check the Vendrs case study", "you found me ★"];
  $$("[data-mascot]").forEach(function (m) {
    m.style.cursor = "pointer";
    m.addEventListener("click", function () {
      eggCount++;
      m.animate([{ transform: "rotate(0) scale(1)" }, { transform: "rotate(-8deg) scale(1.06)" }, { transform: "rotate(0) scale(1)" }], { duration: 480, easing: "cubic-bezier(0.34,1.56,0.64,1)" });
      toast(eggLines[Math.min(eggCount - 1, eggLines.length - 1)]);
    });
  });

  /* Typed easter eggs. The buffer holds the last few letters, so a word is
     recognised by its ending: "music" on the home page opens the music
     portfolio, "design" on the music page comes back. */
  var buf = "";
  window.addEventListener("keydown", function (e) {
    if (e.key.length !== 1) return;
    /* never swallow what someone is typing into the chat or a form */
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
    buf = (buf + e.key.toLowerCase()).slice(-6);
    var music = document.body.classList.contains("is-music");
    if (!music && buf.slice(-5) === "music") {
      buf = "";
      toast("the music side, unlocked \u2726");
      setTimeout(function () { window.location.href = "music.html"; }, 520);
      return;
    }
    if (music && buf === "design") {
      buf = "";
      setTimeout(function () { window.location.href = "index.html"; }, 320);
      return;
    }
  });

  /* -------------------------------------------------- Music page: unfinished album
     What I Am has no project page yet, so its card is a button. Hover and focus
     show the note in CSS; a click wobbles the sleeve and holds the note up for a
     couple of seconds, for touch screens with no hover. Drop data-wip from the
     markup (and make it an <a>) once the record is out. */
  $$(".album[data-wip]").forEach(function (card) {
    var t;
    card.addEventListener("click", function () {
      card.classList.remove("is-nudge");
      void card.offsetWidth;
      card.classList.add("is-nudge");
      clearTimeout(t);
      t = setTimeout(function () { card.classList.remove("is-nudge"); }, 2200);
    });
  });

  /* -------------------------------------------------- Case study step switcher
     The onboarding steps on work/vendrs.html are buttons: each one shows its own
     screen. Any [role=tablist] of .v-tab buttons works the same way. */
  $$('.v-tabs[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          var on = t === tab;
          t.setAttribute("aria-selected", String(on));
          if (panel) panel.hidden = !on;
        });
      });
    });
  });

  /* -------------------------------------------------- Year in footer */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* =====================================================================
   Chat: Sumi answers questions about Anthony.
   This is SCRIPTED, not a language model: each intent has keywords, the
   question is scored against them, and the best match wins. Everything it
   says is drawn from the site's own content, so keep the two in sync.
   ===================================================================== */
(function () {
  "use strict";
  var panel = document.querySelector(".chat");
  var btn = document.querySelector(".buddy");
  if (!panel || !btn) return;

  var log   = panel.querySelector(".chat__log");
  var form  = panel.querySelector(".chat__form");
  var input = panel.querySelector(".chat__input");
  var chips = panel.querySelector(".chat__chips");
  var close = panel.querySelector(".chat__close");

  // links need a prefix on the case-study pages, which sit one level down
  var up = /\/work\//.test(location.pathname) ? "../" : "";

  var INTENTS = [
    { k: ["hi","hello","hey","yo","sup","howdy","greetings"], scoreMin: 1,
      a: "Hey! I'm Sumi, Anthony's mascot. Ask me about his <strong>experience</strong>, his <strong>projects</strong>, or <strong>how to reach him</strong>." },

    { k: ["experience","work","worked","job","jobs","intern","internship","role","roles","career","history","employment","where has he"],
      a: "Anthony's design experience so far:<br>• <strong>#include</strong>: UX Design Lead (incoming)<br>• <strong>Prod. Davis</strong>: Graphic Designer, Sep 2026 to present<br>• <strong>Design Interactive</strong>: UX Cohort Designer, Apr to May 2026<br>• <strong>All Things Design</strong>: UI/UX Intern, Jan to Mar 2026<br>There's more detail on the <a href='" + up + "about.html'>about page</a>." },

    { k: ["school","education","study","studying","college","university","degree","major","davis","sierra","graduate","grad"],
      a: "He's a fourth-year <strong>B.A. Design</strong> student at <strong>UC Davis</strong> (expected 2026), focused on UI/UX and interactive media. Before that he did an <strong>A.A. in Applied Art &amp; Design</strong> at Sierra College. He also spent two years in computer science before switching to design." },

    { k: ["contact","email","reach","reach out","hire","hiring","message","talk","connect","linkedin","get in touch","dm"],
      a: "Best way is email: <a href='mailto:atonyn584@gmail.com'>atonyn584@gmail.com</a>. He's also on <a href='https://www.linkedin.com/in/anthony-nguyen-a79683392/' target='_blank' rel='noopener'>LinkedIn</a>." },

    { k: ["resume","cv","curriculum"],
      a: "His resume is <a href='https://drive.google.com/file/d/1PTcfJpEMcfS_W2Cb9v0fJxFMJBmGtGmB/view' target='_blank' rel='noopener'>right here</a>." },

    { k: ["project","projects","case study","case studies","portfolio","work samples","vendrs","qac","gallery","uc davis app","mobile","redesign","built","made"],
      a: "Two case studies:<br>• <a href='" + up + "work/vendrs.html'>Vendrs</a>: a platform for Gen Z business owners; he owned onboarding and the Events Map<br>• <a href='" + up + "work/qac-gallery.html'>QAC Gallery Redesign</a>: the events and booking experience for an Oakland arts gallery" },

    { k: ["skill","skills","tool","tools","software","tech","stack","figma","ai","claude","design system","prototype"],
      a: "Figma is his main tool, and he leans on AI in his workflow (this site was built with Claude). Day to day that's UX research, wireframing, prototyping, design systems, and shipping real UI." },

    { k: ["hobby","hobbies","fun","free time","outside","music","beats","produce","production","soundcloud","spotify","run","running","strava","friends","tekken","game","games"],
      a: "Outside of design: <strong>music production</strong> (on <a href='https://soundcloud.com/' target='_blank' rel='noopener'>SoundCloud</a> and <a href='https://open.spotify.com/' target='_blank' rel='noopener'>Spotify</a>), <strong>running</strong> (<a href='https://www.strava.com/' target='_blank' rel='noopener'>Strava</a>), and hanging with friends, usually with a Tekken set on." },

    { k: ["where","live","lives","based","location","from","city","sacramento","local"],
      a: "He's based in <strong>Sacramento, California</strong>, and studies up the road at UC Davis." },

    { k: ["available","availability","open","looking","opportunity","internship","full time","freelance"],
      a: "He's <strong>open to internships</strong> and new grad opportunities. Email him at <a href='mailto:atonyn584@gmail.com'>atonyn584@gmail.com</a>." },

    { k: ["who","about","yourself","himself","bio","tell me","anthony","designer"],
      a: "Anthony is a design student at UC Davis, originally from Roseville, California. He spent two years as a computer science major, and he has produced music for over 8 years and first started designing to make the graphics for his own music. Now he combines the technical thinking from CS with the creative side of music in his design work." },

    { k: ["you","sumi","mascot","who are you","your name"],
      a: "I'm <strong>Sumi</strong>, the little mascot Anthony draws all over this site. I'm scripted, not an AI. I just know his portfolio well." },

    { k: ["thanks","thank","ty","appreciate","cheers","nice","cool","awesome"],
      a: "Anytime ✦ Ask me anything else, or just <a href='mailto:atonyn584@gmail.com'>email Anthony</a>." }
  ];

  var FALLBACK = "I'm not sure about that one. I only know Anthony's portfolio. Try asking about his <strong>experience</strong>, <strong>projects</strong>, <strong>education</strong>, <strong>hobbies</strong>, or <strong>how to contact him</strong>.";

  var STARTERS = ["What's his experience?", "Show me his projects", "How do I contact him?", "What does he do for fun?"];

  function normalize(t) { return " " + t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ") + " "; }

  function answer(q) {
    var text = normalize(q), best = null, bestScore = 0;
    INTENTS.forEach(function (intent) {
      var score = 0;
      intent.k.forEach(function (kw) {
        if (text.indexOf(" " + kw + " ") > -1) score += kw.indexOf(" ") > -1 ? 3 : 2;  // phrases weigh more
        else if (text.indexOf(kw) > -1) score += 1;                                     // partial / inside a word
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    return (best && bestScore >= (best.scoreMin || 2)) ? best.a : FALLBACK;
  }

  function addMsg(html, who) {
    var el = document.createElement("div");
    el.className = "chat__msg chat__msg--" + who;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function botReply(q) {
    var typing = addMsg("…", "bot");
    setTimeout(function () {
      typing.innerHTML = answer(q);
      log.scrollTop = log.scrollHeight;
    }, 420);
  }

  function ask(q) {
    if (!q.trim()) return;
    addMsg(q.replace(/</g, "&lt;"), "user");
    botReply(q);
  }

  var started = false;
  function openChat() {
    panel.classList.add("is-open");
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    if (!started) {
      started = true;
      addMsg("Hi! I'm Sumi ✦ Ask me about Anthony's experience, work, or how to get in touch.", "bot");
      STARTERS.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "chat__chip"; b.textContent = s;
        b.addEventListener("click", function () { ask(s); chips.innerHTML = ""; input.focus(); });
        chips.appendChild(b);
      });
    }
    setTimeout(function () { input.focus(); }, 260);
  }
  function closeChat() {
    panel.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }

  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-haspopup", "dialog");
  btn.addEventListener("click", function () {
    panel.classList.contains("is-open") ? closeChat() : openChat();
  });
  close.addEventListener("click", closeChat);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
    input.value = "";
    chips.innerHTML = "";
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) closeChat();
  });
})();
