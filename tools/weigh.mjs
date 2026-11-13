// Page-weight audit: load a page in headless Chrome, record every response,
// then scroll to the bottom (so lazy images load) and record again.
//   node tools/weigh.mjs <url> [width] [height]
// Prints: requests and bytes at first load (what blocks the first view),
// after scrolling, the 12 heaviest files, and FCP / LCP.
// Bytes are as served by the local server (no gzip), so css/js read larger than on Vercel.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const [url, W = "1440", H = "900"] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 90);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`,
   `--user-data-dir=${mkdtempSync(tmpdir() + "/cdp-w-")}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (m, p = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: p })); return new Promise(r => pend.set(i, r)); };
const ev = async e => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
const reqs = new Map(); // requestId -> {url, type, bytes}
try {
  let t; for (let k = 0; k < 50; k++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
  ws = new WebSocket(t.find(x => x.type === "page").webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r));
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); return; }
    if (m.method === "Network.responseReceived") reqs.set(m.params.requestId, { url: m.params.response.url, type: m.params.type, bytes: 0 });
    if (m.method === "Network.loadingFinished" && reqs.has(m.params.requestId)) reqs.get(m.params.requestId).bytes = m.params.encodedDataLength;
    if (m.method === "Network.dataReceived" && reqs.has(m.params.requestId)) { const r = reqs.get(m.params.requestId); r.partial = (r.partial || 0) + m.params.encodedDataLength; }
  });
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true }); await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__lcp=0;new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lcp=e.startTime}).observe({type:"largest-contentful-paint",buffered:true});` });
  await send("Page.navigate", { url }); await sleep(4000);
  const sum = () => { let n = 0, b = 0; for (const r of reqs.values()) { n++; b += r.bytes || r.partial || 0; } return [n, b]; };
  const [n1, b1] = sum();
  const perf = await ev(`({fcp: Math.round((performance.getEntriesByName("first-contentful-paint")[0]||{}).startTime||0), lcp: Math.round(window.__lcp)})`);
  await ev(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}})()`);
  await sleep(2500);
  const [n2, b2] = sum();
  const kb = b => (b / 1024).toFixed(0) + "KB";
  console.log(`${url}\n  first load: ${n1} req, ${kb(b1)}   after scroll: ${n2} req, ${kb(b2)}   FCP ${perf.fcp}ms  LCP ${perf.lcp}ms`);
  [...reqs.values()].map(r => ({ ...r, b: r.bytes || r.partial || 0 })).sort((a, b) => b.b - a.b).slice(0, 12)
    .forEach(r => console.log(`   ${kb(r.b).padStart(7)}  ${r.type.padEnd(10)} ${r.url.replace(/^https?:\/\/[^/]+/, "")}`));
} finally { try { ws && ws.close(); } catch {} chrome.kill(); }
