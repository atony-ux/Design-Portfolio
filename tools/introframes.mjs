// Capture the opening intro frame by frame (deterministic, via ?intro=hold and
// window.__introSeek), for mockups and previews.
//   node tools/introframes.mjs <page-url> <out-dir> <w> <h> <fps> <ms-total>
// Writes <out-dir>/f-0000.png ... Node 22+, headless Chrome, no installs.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const [url, out, W, H, fps, total] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const port = 9500 + Math.floor(Math.random() * 300);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`,
   `--user-data-dir=${mkdtempSync(tmpdir() + "/cdp-i-")}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (m, p = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: p })); return new Promise(r => pend.set(i, r)); };
const ev = async e => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
try {
  let t; for (let k = 0; k < 50; k++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
  ws = new WebSocket(t.find(x => x.type === "page").webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r));
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  await send("Page.enable");
  await send("Page.navigate", { url: url + (url.includes("?") ? "&" : "?") + "intro=hold" });
  for (let k = 0; k < 40 && !(await ev("typeof window.__introSeek === 'function'")); k++) await sleep(150);
  await sleep(1500);   // let the page underneath load its images
  const n = Math.ceil(+total * +fps / 1000);
  for (let i = 0; i <= n; i++) {
    const ms = i * 1000 / +fps;
    await ev(`window.__introSeek(${ms})`); await sleep(60);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}/f-${String(i).padStart(4, "0")}.png`, Buffer.from(shot.data, "base64"));
  }
  console.log("frames", n + 1);
} finally { try { ws && ws.close(); } catch {} chrome.kill(); }
