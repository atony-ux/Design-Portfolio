// Tiny CDP helper for scripted screen recordings (headless Chrome, no installs).
// Records Page.screencastFrame JPEGs plus a log of cursor moves, clicks and camera
// marks, which compose.py turns into a smooth video with zooms and a drawn cursor.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function open({ w, h, dpr, mobile = false, out }) {
  mkdirSync(out + "/f", { recursive: true });
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ["--headless=new", "--hide-scrollbars", "--no-first-run", "--force-color-profile=srgb", `--force-device-scale-factor=${dpr}`, `--remote-debugging-port=${port}`,
     `--user-data-dir=${mkdtempSync(tmpdir() + "/cdp-w-")}`, `--window-size=${w},${h}`, "about:blank"], { stdio: "ignore" });
  let t; for (let k = 0; k < 60; k++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
  const ws = new WebSocket(t.find(x => x.type === "page").webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const log = { vp: { w, h, dpr, mobile }, frames: [], cursor: [], marks: [] };
  let nf = 0, recording = false;
  const send = (m, p = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: p })); return new Promise(r => pend.set(i, r)); };
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); }
    if (m.method === "Page.screencastFrame") {
      const p = m.params; send("Page.screencastFrameAck", { sessionId: p.sessionId });
      if (!recording) return;
      const f = `f/${String(nf++).padStart(5, "0")}.jpg`;
      writeFileSync(`${out}/${f}`, Buffer.from(p.data, "base64"));
      log.frames.push({ f, t: p.metadata.timestamp });
    }
  });
  const now = () => Date.now() / 1000;
  const ev = async e => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); return r.result?.value; };
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile });
  if (mobile) { await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" }); }
  await send("Page.enable");
  let mx = w / 2, my = h / 2;
  const api = {
    send, ev, log, sleep,
    goto: async url => { await send("Page.navigate", { url }); await sleep(400); for (let k = 0; k < 60 && (await ev("document.readyState")) !== "complete"; k++) await sleep(150); },
    rect: async sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const r=e.getBoundingClientRect(); return [r.x,r.y,r.width,r.height]})()`),
    center: async sel => { const r = await api.rect(sel); if (!r) throw new Error("no " + sel); return [r[0] + r[2] / 2, r[1] + r[3] / 2]; },
    start: async () => { recording = true; await send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: Math.round(w * dpr), maxHeight: Math.round(h * dpr), everyNthFrame: 1 }); log.t0 = now(); },
    stop: async () => { log.t1 = now(); await send("Page.stopScreencast"); await sleep(300); recording = false; writeFileSync(`${out}/log.json`, JSON.stringify(log)); },
    // camera: frame this rect (css px) from now on; [0,0,w,h] = everything
    mark: (rect, ease = 0.9, zoomMax) => log.marks.push({ t: now(), rect, ease, zoomMax }),
    markSel: async (sel, pad = 16, ease, zoomMax) => { const r = await api.rect(sel); api.mark([r[0] - pad, r[1] - pad, r[2] + pad * 2, r[3] + pad * 2], ease, zoomMax); },
    cursor: (kind) => log.cursor.push({ t: now(), x: mx, y: my, kind }),
    move: async (x, y, ms = 700) => {
      const x0 = mx, y0 = my, n = Math.max(2, Math.round(ms / 16)), bend = (Math.random() - .5) * 0.18;
      for (let i = 1; i <= n; i++) {
        const u = i / n, e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        const nx = x0 + (x - x0) * e - (y - y0) * bend * Math.sin(Math.PI * e), ny = y0 + (y - y0) * e + (x - x0) * bend * Math.sin(Math.PI * e);
        mx = nx; my = ny; if (!mobile) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: mx, y: my });
        api.cursor("move"); await sleep(16);
      }
    },
    click: async () => {
      if (mobile) { api.cursor("down"); await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mx, y: my }] }); await sleep(90);
        await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); api.cursor("up"); return; }
      api.cursor("down"); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: mx, y: my, button: "left", clickCount: 1 }); await sleep(90);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: mx, y: my, button: "left", clickCount: 1 }); api.cursor("up");
    },
    wheel: async (dx, dy, ms) => { const n = Math.round(ms / 16); for (let i = 0; i < n; i++) {
      const u = (i + .5) / n, s = Math.sin(Math.PI * u) * Math.PI / 2 / n;   // eased wheel speed
      await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: mx, y: my, deltaX: dx * s, deltaY: dy * s }); api.cursor("move"); await sleep(16); } },
    // touch drag (finger), for phones: drags from the current point by dy over ms, with momentum-free easing
    swipe: async (dy, ms, dx = 0) => { const n = Math.round(ms / 16), y0 = my, x0 = mx;
      api.cursor("down"); await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mx, y: my }] });
      for (let i = 1; i <= n; i++) { const u = i / n, e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; my = y0 + dy * e; mx = x0 + dx * e;
        await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: mx, y: my }] }); api.cursor("drag"); await sleep(16); }
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); api.cursor("up"); },
    setPos: (x, y) => { mx = x; my = y; },
    close: () => { try { ws.close(); } catch {} chrome.kill(); },
  };
  return api;
}
