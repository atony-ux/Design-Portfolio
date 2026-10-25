// Load a page in headless Chrome, then at each delay (ms after navigation) run a probe
// expression and save a screenshot. Optional 7th arg: a second URL opened in the SAME
// session afterwards (sessionStorage kept), probed once ~400ms in.
//   node tools/live.mjs <url> <out-prefix> <w> <h> <ms,ms,...> [probe-js] [second-url]
// Node 22+, no installs (uses the built-in WebSocket + fetch).
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const [url, out, W, H, ts, probe, second] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random() * 400);
const prof = mkdtempSync(tmpdir() + "/cdp-prof-");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`,
   `--user-data-dir=${prof}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
function send(method, params = {}) { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise(r => pending.set(i, r)); }
async function evalProbe() {
  const p = await send("Runtime.evaluate", { expression: probe || "1", returnByValue: true, awaitPromise: true });
  return p.result && p.result.value;
}
try {
  let targets;
  for (let k = 0; k < 50; k++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
  ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  await send("Page.enable");
  const t0 = Date.now();
  await send("Page.navigate", { url });
  for (const t of ts.split(",").map(Number)) {
    await sleep(Math.max(0, t - (Date.now() - t0)));
    const v = await evalProbe();
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}-${t}.png`, Buffer.from(shot.data, "base64"));
    console.log(t, JSON.stringify(v));
  }
  if (second) {
    await send("Page.navigate", { url: second });
    const t1 = Date.now();
    for (const t of (process.env.SECOND_TS || "400").split(",").map(Number)) {
      await sleep(Math.max(0, t - (Date.now() - t1)));
      const v = await evalProbe();
      const shot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(`${out}-second-${t}.png`, Buffer.from(shot.data, "base64"));
      console.log("second", t, JSON.stringify(v));
    }
  }
} finally { try { ws && ws.close(); } catch {} chrome.kill(); }
