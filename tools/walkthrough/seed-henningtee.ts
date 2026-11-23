// Seeds the private video copy with ~7 weeks of believable wears, friends and guesses.
import { openDb, dayNum, dayStr, weekday } from "/Users/atony/tee-forecast/src/db.ts";
import { ensureForecast } from "/Users/atony/tee-forecast/src/forecast.ts";
import { createHash, randomUUID } from "node:crypto";
const db = await openDb();
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
await db.run("DELETE FROM guesses"); await db.run("DELETE FROM predictions"); await db.run("DELETE FROM wears");
await db.run("DELETE FROM grants"); await db.run("DELETE FROM player_keys"); await db.run("DELETE FROM players");
const ids = (await db.all<{ id: number }>("SELECT id FROM shirts WHERE retired = 0 ORDER BY id")).map(r => r.id);
const fav = new Map(ids.map(id => [id, 0.4 + rnd() * rnd() * 4]));        // a few favourites
const wk = new Map(ids.map(id => [id, Math.floor(rnd() * 7)]));          // each shirt leans to a weekday
const start = dayNum("2026-10-05"), end = dayNum("2026-11-23");
const last = new Map<number, number>(); const log: [string, number][] = [];
for (let d = start; d <= end; d++) {
  const w = ids.map(id => { const gap = d - (last.get(id) ?? -99); let p = fav.get(id)!;
    if (gap < 4) p *= 0.02; else if (gap < 9) p *= 0.5; if (wk.get(id) === weekday(d)) p *= 2.2; return p; });
  let r = rnd() * w.reduce((a, b) => a + b, 0), i = 0; while ((r -= w[i]) > 0) i++;
  last.set(ids[i], d); log.push([dayStr(d), ids[i]]);
}
const friends = ["Sam", "Maya", "Jordan", "Priya", "Leo", "Iris"].map(name => ({ id: randomUUID(), name, skill: 0.04 + rnd() * 0.12 }));
for (const f of friends) await db.run("INSERT INTO players (id, name, secret_hash, created_at) VALUES (?, ?, ?, ?)",
  f.id, f.name, createHash("sha256").update(randomUUID()).digest("hex"), "2026-10-04T18:00:00.000Z");
for (const [date, id] of log) {
  for (const f of friends) if (rnd() < 0.75) {
    const pick = rnd() < f.skill ? id : ids[Math.floor(rnd() * ids.length)];
    await db.run("INSERT INTO guesses (date, player_id, shirt_id, created_at) VALUES (?, ?, ?, ?)", date, f.id, pick, date + "T08:00:00.000Z");
  }
  await db.run("INSERT INTO wears (date, shirt_id, photo, thumb, source, confidence, notes, created_at, logged_by) VALUES (?, ?, NULL, NULL, 'manual', NULL, NULL, ?, ?)",
    date, id, date + "T17:00:00.000Z", friends[Math.floor(rnd() * friends.length)].id);
  await ensureForecast(db);
}
// tomorrow: some friends already guessed
for (const f of friends.slice(0, 4)) await db.run("INSERT INTO guesses (date, player_id, shirt_id, created_at) VALUES (?, ?, ?, ?)",
  "2026-11-24", f.id, ids[Math.floor(rnd() * ids.length)], "2026-11-23T19:00:00.000Z");
console.log("wears", log.length, "today", log.at(-1));
