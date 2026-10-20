// Usage: node shot.mjs <url> <out-prefix> <w> <h> <scrollY,...>
// Drives headless Chrome over the DevTools protocol: load, scroll, wait, screenshot.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
const [url, out, W, H, ys] = process.argv.slice(2);
const prof = mkdtempSync(process.env.TMPDIR + "/cdp-prof-");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--remote-debugging-port=9333",
   `--user-data-dir=${prof}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
function send(method, params = {}) { const i = ++id; ws.send(JSON.stringify({ id: i, method, params }));
  return new Promise(r => pending.set(i, r)); }
try {
  let targets;
  for (let k = 0; k < 50; k++) { try { targets = await (await fetch("http://127.0.0.1:9333/json")).json(); break; } catch { await sleep(200); } }
  const page = targets.find(t => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(3500);
  for (const y of ys.split(",")) {
    await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${+y})` });
    await sleep(1800);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}-y${y}.png`, Buffer.from(shot.data, "base64"));
    console.log("saved", `${out}-y${y}.png`);
  }
} finally { try { ws && ws.close(); } catch {} chrome.kill(); }
