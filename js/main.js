/* =====================================================================
   Anthony N. — Portfolio 2.0 · interactions
   preloader · page-transition wipe · custom cursor + view label
   magnetic buttons · parallax · tilt · scroll reveal + counters
   scroll-spy + hide-on-scroll nav · marquee clone · works hover-preview
   mascot buddy + easter eggs
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* -------------------------------------------------- Preloader (first launch only) */
  // The long mascot + name intro plays once per browsing session. After that every
  // page uses the short transition wipe instead, so it doesn't get repetitive.
  var pre = $(".preloader");
  var seenIntro = false;
  try { seenIntro = sessionStorage.getItem("anp_intro") === "1"; } catch (e) {}
  function finishPreloader() {
    if (!pre) return;
    pre.classList.add("done");
    setTimeout(function () { pre.remove(); }, 950);
  }
  if (pre && !reduced && !seenIntro) {
    try { sessionStorage.setItem("anp_intro", "1"); } catch (e) {}
    window.addEventListener("load", function () { setTimeout(finishPreloader, 1150); });
    setTimeout(finishPreloader, 2600); // safety
  } else if (pre) { pre.remove(); }

  /* -------------------------------------------------- Hero title reveal */
  // wait out the intro on the very first load, otherwise reveal promptly
  var hTitle = $(".hero__title");
  if (hTitle) { setTimeout(function () { hTitle.classList.add("reveal"); }, (reduced || seenIntro) ? 0 : 1200); }

  /* -------------------------------------------------- Page-transition wipe */
  // derive the mascot path from an existing on-page image so it resolves
  // correctly whether we're at the root or inside /work/
  var brandImg = $(".nav__brand-dot img") || $(".buddy img");
  var mascotSrc = brandImg ? brandImg.getAttribute("src") : "assets/graphics/mascot.png";
  var pt = document.createElement("div");
  pt.className = "pt";
  pt.innerHTML = "<span></span><span></span><span></span><span></span>" +
                 '<img class="pt__mascot" src="' + mascotSrc + '" alt="" />' +
                 '<div class="pt__loading">loading</div>' +
                 '<div class="pt__bar"><i></i></div>';
  document.body.appendChild(pt);
  function samePage(href) {
    var a = document.createElement("a"); a.href = href;
    return a.pathname === location.pathname;
  }
  if (!reduced) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("http") === 0) return;
      if (samePage(href)) return; // in-page anchor to same doc
      e.preventDefault();
      pt.classList.add("in");
      setTimeout(function () { window.location.href = href; }, 620);
    });
    // reverse-wipe on entry
    pt.classList.add("in");
    requestAnimationFrame(function () {
      setTimeout(function () {
        pt.classList.remove("in"); pt.classList.add("out");
        setTimeout(function () { pt.classList.remove("out"); }, 700);
      }, 40);
    });
  }

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

  /* -------------------------------------------------- Progress + hide nav */
  var progress = $(".progress");
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    if (nav) {
      if (y > lastY && y > 240) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
    }
    lastY = y;
  }, { passive: true });

  /* -------------------------------------------------- Custom cursor (disabled — using the system cursor) */
  if (false) {
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    ring.innerHTML = '<span class="cursor-ring__label">View</span>';
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add("cursor-active");
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    $$("a, button, .card, [data-magnetic], .tag, .footer__link, .hobby, .worklist__row").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-hover"); });
    });
    $$("[data-cursor='view']").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-view"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-view"); });
    });
    window.addEventListener("mousedown", function () { ring.classList.add("is-down"); });
    window.addEventListener("mouseup", function () { ring.classList.remove("is-down"); });
    document.addEventListener("mouseleave", function () { dot.style.opacity = 0; ring.style.opacity = 0; });
    document.addEventListener("mouseenter", function () { dot.style.opacity = 1; ring.style.opacity = .55; });
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

  /* -------------------------------------------------- Parallax (desktop only — skip the scroll cost on phones) */
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

  /* -------------------------------------------------- Scroll-spy nav */
  var spyLinks = $$("[data-spy]");
  var sections = spyLinks.map(function (l) { return document.getElementById(l.getAttribute("data-spy")); }).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spyLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("data-spy") === en.target.id); });
      });
    }, { threshold: 0.4 });
    sections.forEach(function (s) { spy.observe(s); });
  }

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
      // scroll-position based (reliable everywhere) — highlight the last section
      // whose top has scrolled above a line ~1/4 down the viewport
      var cTick = false;
      var updateActiveSection = function () {
        var line = window.innerHeight * 0.28;
        var current = cPairs[0];
        cPairs.forEach(function (p) { if (p.sec.getBoundingClientRect().top <= line) current = p; });
        cPairs.forEach(function (p) { p.link.classList.toggle("is-active", p === current); });
      };
      window.addEventListener("scroll", function () {
        if (cTick) return; cTick = true;
        requestAnimationFrame(function () { updateActiveSection(); cTick = false; });
      }, { passive: true });
      updateActiveSection();
    }
  }

  /* -------------------------------------------------- Marquee clone */
  $$(".marquee__track, .footer__wordmark-track").forEach(function (t) { t.innerHTML += t.innerHTML; });

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

  /* -------------------------------------------------- Mascot buddy companion */
  var buddy = $(".buddy"), bubble = $(".buddy__bubble");
  var buddyLines = [
    "hey, I'm Anthony's design buddy ✦",
    "psst, the Vendrs case study is worth a look",
    "certified Figma + Claude enjoyer ✦",
    "type “blue” anywhere… trust me",
    "still sketching. always sketching.",
    "thanks for scrolling this far ★"
  ];
  var bi = 0, bubbleTimer;
  function showBubble(msg) {
    if (!bubble) return;
    bubble.textContent = msg;
    bubble.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove("show"); }, 3200);
  }
  if (buddy) {
    setTimeout(function () { if (pre) return; showBubble(buddyLines[0]); }, 3800);
    buddy.addEventListener("click", function () {
      bi = (bi + 1) % buddyLines.length;
      showBubble(buddyLines[bi]);
      buddy.animate(
        [{ transform: "rotate(0) scale(1)" }, { transform: "rotate(-12deg) scale(1.1)" }, { transform: "rotate(0) scale(1)" }],
        { duration: 500, easing: "cubic-bezier(0.34,1.56,0.64,1)" }
      );
    });
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

  /* Konami-lite: type "blue" to tint the page */
  var buf = "";
  window.addEventListener("keydown", function (e) {
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === "blue") {
      document.body.classList.toggle("egg-blue");
      var on = document.body.classList.contains("egg-blue");
      document.documentElement.style.filter = on ? "hue-rotate(-12deg) saturate(1.15)" : "";
      toast(on ? "everything's a little more blue now ✦" : "back to normal");
    }
  });

  /* -------------------------------------------------- Year in footer */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
