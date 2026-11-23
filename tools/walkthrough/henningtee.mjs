// Scripted walkthrough of HenningTee for the Studio card video.
//   node tools/walkthrough/henningtee.mjs <desktop|mobile> <base-url> <out-dir> [player-json]
// Run it against a private local copy (seed-henningtee.ts), never the live site:
// it joins as a player and saves a guess.
import { open, sleep } from "./cdp.mjs";
const [mode, base, out, playerJson] = process.argv.slice(2);
const desk = mode === "desktop";
const b = await open(desk ? { w: 1440, h: 900, dpr: 2, out } : { w: 390, h: 844, dpr: 3, mobile: true, out });
try {
  await b.goto(base);
  if (playerJson) await b.ev(`localStorage.setItem("tee-player", ${JSON.stringify(playerJson)})`);
  else await b.ev(`(async()=>{const r=await (await fetch('/api/players',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Anthony'})})).json(); localStorage.setItem('tee-player', JSON.stringify(r)); return 1})()`);
  await b.goto(base); await sleep(2500);
  console.log("PLAYER", await b.ev(`localStorage.getItem("tee-player")`));
  const W = b.log.vp.w, H = b.log.vp.h;
  const clickSel = async (sel, ms = 650) => { const [x, y] = await b.center(sel); await b.move(x, y, ms); await sleep(120); await b.click(); };
  const clickText = async (sel, text, ms = 650) => {
    const r = await b.ev(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(sel)})].find(e=>e.offsetParent&&e.textContent.includes(${JSON.stringify(text)})); if(!e) return null; e.scrollIntoView({block:'nearest'}); const r=e.getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2]})()`);
    if (!r) throw new Error("no " + text); await b.move(r[0], r[1], ms); await sleep(120); await b.click(); };
  if (desk) {
    b.setPos(980, 620); await b.move(985, 625, 50);
    await b.start(); b.mark([0, 0, W, H], 0.01);
    await sleep(1400);
    await b.markSel("#today", 24, 1.0, 1.9); await sleep(2200);              // today's shirt
    await b.markSel(".left", 0, 1.0, 1.55);
    await clickSel('.screen-tabs [data-screen-go="guess"]'); await sleep(900); // guess tab
    await clickSel('[data-act="guess-pick"]'); await sleep(700);              // picker
    await b.markSel("#picker", 10, 0.9, 1.5); await sleep(500);
    const tiles = await b.ev(`[...document.querySelectorAll('#picker-grid [data-pick]')].slice(0,18).map(e=>{const r=e.getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height*0.4]})`);
    for (const i of [7, 9, 14]) { await b.move(tiles[i][0], tiles[i][1], 420); await sleep(260); }
    await clickText("#picker-grid [data-pick]", "Miles Davis", 900); await sleep(900);
    await b.mark([0, 0, 518, 620], 1.0, 1.75); await sleep(2600);             // your pick + friends
    await b.mark([500, 0, W - 500, H], 1.1, 1.6);                              // the closet
    const [rx, ry] = await b.center("#rack"); await b.move(rx - 120, ry - 120, 900);
    await b.wheel(0, 2600, 2800); await sleep(700);
    await b.wheel(0, -900, 1300); await sleep(500);
    const hangs = await b.ev(`[...document.querySelectorAll('#rack .hang')].map(e=>{const r=e.getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height*0.55, e.getAttribute('aria-label')]}).filter(p=>p[0]>560&&p[0]<1400)`);
    const top = hangs.filter(p => p[1] < 350), bot = hangs.filter(p => p[1] > 350);
    await b.move(top[1][0], top[1][1], 700); await sleep(500);
    await b.move(top[2][0], top[2][1], 500); await sleep(500);
    await b.move(bot[2][0], bot[2][1], 600); await sleep(600);
    await b.click(); await sleep(900);                                         // shirt close-up
    await b.markSel("#sheet", 0, 1.0, 1.6); await sleep(1300);
    const sr = await b.rect("#sheet"); b.mark([sr[0] + sr[2] * 0.42, sr[1], sr[2] * 0.58, sr[3] * 0.62], 1.0, 2.2); await sleep(2400);
    b.mark([500, 0, W - 500, H], 1.0, 1.6);
    await clickSel("#sheet [data-close]", 700); await sleep(900);
    await b.move(top[4][0], top[4][1], 700); await sleep(300); await b.click(); await sleep(900);
    await b.markSel("#sheet", 0, 1.0, 1.6); await sleep(2200);
    b.mark([0, 0, W, H], 1.1);
    await clickSel("#sheet [data-close]", 700); await sleep(1600);
  } else {
    b.setPos(W * 0.62, H * 0.62);
    await b.start(); b.mark([0, 0, W, H], 0.01);
    await sleep(1500);
    await clickSel('.bottom-nav [data-screen-go="closet"]', 700); await sleep(900);   // closet
    b.mark([0, 0, W, H * 0.72], 1.0, 1.25);
    b.setPos(W * 0.8, H * 0.42); await b.move(W * 0.82, H * 0.4, 80);
    await b.swipe(-10, 700, -260); await sleep(600);                                // swipe along the line
    await b.move(W * 0.84, H * 0.62, 350); await b.swipe(8, 650, -280); await sleep(700);
    await b.move(W * 0.82, H * 0.4, 350); await b.swipe(-6, 650, -240); await sleep(800);
    await b.move(W * 0.2, H * 0.62, 450); await b.swipe(4, 600, 200); await sleep(700);
    const pick = await b.ev(`(()=>{const e=[...document.querySelectorAll('#rack .hang')].find(e=>{const r=e.getBoundingClientRect(); return r.x>40&&r.right<${W - 20}&&r.y>${H * 0.45}}); const r=e.getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height*0.55]})()`);
    await b.move(pick[0], pick[1], 600); await sleep(150); await b.click(); await sleep(900);   // 1st tap: its name
    await b.click(); await sleep(1100);                                                         // 2nd tap: the close-up
    b.mark([0, 0, W, H * 0.62], 1.0, 1.35); await sleep(1600);
    await b.move(W * 0.5, H * 0.75, 400); await b.swipe(-360, 900); await sleep(1400);
    b.mark([0, 0, W, H], 1.0);
    await b.move(W * 0.5, H * 0.4, 300); await b.swipe(360, 700); await sleep(500);
    await clickSel("#sheet [data-close]", 600); await sleep(900);
    await clickSel('.bottom-nav [data-screen-go="guess"]', 700); await sleep(1200);   // your guess
    b.mark([0, 0, W, H * 0.6], 1.0, 1.35); await sleep(2000);
    await clickText("[data-gview]", "Leaderboard", 700); await sleep(1000);
    b.mark([0, 0, W, H], 1.0); await sleep(1800);
  }
  await b.stop();
  console.log("frames", b.log.frames.length, "secs", (b.log.t1 - b.log.t0).toFixed(1));
} finally { b.close(); }
