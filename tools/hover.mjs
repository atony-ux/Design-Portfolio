// Real-mouse hover check: load a page, scroll the Nth match of <selector> into view,
// move the actual mouse over it (headless Chrome, DevTools protocol), then report
// a probe expression before and after and save a screenshot while hovering.
//   node tools/hover.mjs <url> <out.png> <selector> <n> [probe-js]
// The probe may use `el` (the hovered element). Node 22+, no installs.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const [url, out, sel, n, probeSrc] = process.argv.slice(2);
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`,
   `--user-data-dir=${mkdtempSync(tmpdir() + "/cdp-")}`, "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (m, p = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: p })); return new Promise(r => pend.set(i, r)); };
const ev = async e => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result.value;
const pick = `document.querySelectorAll(${JSON.stringify(sel)})[${+n}]`;
const probe = `(()=>{const el=${pick}; return (${probeSrc || "1"});})()`;
try {
  let t; for (let k = 0; k < 50; k++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
  ws = new WebSocket(t.find(x => x.type === "page").webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r));
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.enable"); await send("Page.navigate", { url }); await sleep(3200);
  const pos = await ev(`(()=>{const el=${pick}; el.scrollIntoView({block:"center", behavior:"instant"}); const r=el.getBoundingClientRect(); return [r.left+r.width*0.3, r.top+r.height*0.3]})()`);
  await sleep(400);
  console.log("rest ", JSON.stringify(await ev(probe)));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pos[0], y: pos[1] }); await sleep(600);
  console.log("hover", JSON.stringify(await ev(probe)));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(out, Buffer.from(shot.data, "base64"));
} finally { try { ws && ws.close(); } catch {} chrome.kill(); }
