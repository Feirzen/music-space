// Music Space · Campfire widget for Scriptable.
// Shows how campfire-ready you are, your 3-a-week sessions, and your next lesson.
//
// If you already set up the Music Space practice widget, this one uses the same
// sign-in, so there's nothing to type. Otherwise: open it in Scriptable, tap play,
// and enter your Music Space family password once.
// Made for the Medium size. Small works too.

const APP_URL = "https://feirzen.github.io/music-space/";
const KEY = "musicspace.widget";             // same sign-in as the practice widget
const CACHE = "musicspace-campfire.json";     // last good data, for offline
const C = {
  bg: new Color("#0a1214"), text: new Color("#eef4f1"), dim: new Color("#a8c7bd"), muted: new Color("#6b8580"),
  ember: new Color("#ffb06a"), gold: new Color("#f2c46b"), track: new Color("#ffffff", 0.08), ring: new Color("#3a4f52"),
};
const CHORDS = ["G","C","D","Em","Am","D7","F","A","E","Dm","E7","A7","B7","Bm","F#m"];
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function weekKey(s) { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }

/* ---------- sign-in (once, inside Scriptable) ---------- */
async function signIn() {
  const a = new Alert();
  a.title = "Music Space";
  a.message = "Type your family password once. This widget only reads your progress.";
  a.addSecureTextField("Family password");
  a.addAction("Sign in"); a.addCancelAction("Cancel");
  if (await a.presentAlert() === -1) throw new Error("Cancelled");
  const pw = a.textFieldValue(0);
  const wv = new WebView();
  await wv.loadURL(APP_URL + "unlock.json?t=" + Date.now());
  const js = `
    (async () => {
      try {
        const b = JSON.parse(document.body.innerText);
        const d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
        const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(${JSON.stringify(pw)}), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: d(b.salt), iterations: 600000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: d(b.iv) }, key, d(b.ct));
        completion(new TextDecoder().decode(pt));
      } catch (e) { completion("ERR"); }
    })();
    0;`;  // the last line has to be a plain value, or Scriptable can't read the result
  const out = await wv.evaluateJavaScript(js, true);
  if (!out || out === "ERR") throw new Error("That password didn't work");
  const sec = JSON.parse(out);
  Keychain.set(KEY, JSON.stringify({ token: sec.token, owner: sec.owner || "Feirzen", repo: sec.repo || "music-space-private", profile: "" }));
}

/* ---------- data ---------- */
async function loadProgress(cfg) {
  const fm = FileManager.local(), path = fm.joinPath(fm.documentsDirectory(), CACHE);
  try {
    const r = new Request(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/library.json`);
    r.headers = { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" };
    r.timeoutInterval = 20;
    const j = await r.loadJSON();
    if (!j || !j.progress) throw new Error("bad");
    fm.writeString(path, JSON.stringify({ progress: j.progress }));
    return j.progress;
  } catch (e) {
    if (fm.fileExists(path)) return JSON.parse(fm.readString(path)).progress;
    throw new Error("Couldn't reach your library");
  }
}
function pickProfile(cfg, prog) {
  const profs = (prog.profiles || []).filter(p => !p.deleted);
  if (cfg.profile && profs.some(p => p.id === cfg.profile)) return cfg.profile;
  return (profs.find(p => /naverog/i.test(p.name)) || profs[0] || { id: "p-naverog" }).id;
}
function stats(prog, pid) {
  const me = (prog.byProfile && prog.byProfile[pid]) || {};
  const cf = me.campfire || {}, lvl = cf.lvl || {}, days = cf.days || {}, sum = cf.sum || {};
  const pts = CHORDS.reduce((a, c) => a + Math.min(4, (lvl[c] && lvl[c].l) || 0), 0);
  const wk = weekKey(iso(new Date()));
  const week = Object.keys(days).filter(d => weekKey(d) === wk).length;
  return { pct: Math.round((pts / 60) * 100), pts, week, streak: sum.streak || 0, next: sum.next || null,
    finish: sum.finish || null, done: Object.keys(cf.done || {}).length, started: !!cf.start };
}

/* ---------- drawing ---------- */
function barImage(pct, w, h) {
  const fw = Math.max(h, (w * Math.min(100, pct)) / 100);
  return clipRound(w, h, fw, h / 2);
}
function clipRound(w, h, fw, r) {
  const d = new DrawContext(); d.size = new Size(w, h); d.opaque = false; d.respectScreenScale = true;
  const track = new Path(); track.addRoundedRect(new Rect(0, 0, w, h), r, r); d.addPath(track); d.setFillColor(C.track); d.fillPath();
  const fill = new Path(); fill.addRoundedRect(new Rect(0, 0, fw, h), r, r); d.addPath(fill); d.setFillColor(C.ember); d.fillPath();
  const steps = 20;
  for (let i = 1; i < steps; i++) {
    const t = i / steps, x = r + (fw - 2 * r) * t;
    if (x + r > fw) break;
    const p = new Path(); p.addRect(new Rect(x, 0, (fw - 2 * r) / steps + 1, h)); d.addPath(p); d.setFillColor(new Color(mix("#ffb06a", "#f2c46b", t))); d.fillPath();
  }
  const cap = new Path(); cap.addEllipse(new Rect(fw - h, 0, h, h)); d.addPath(cap); d.setFillColor(C.gold); d.fillPath();
  return d.getImage();
}
function mix(a, b, t) {
  const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
function dotsImage(n, size) {
  const gap = 6, w = size * 3 + gap * 2;
  const d = new DrawContext(); d.size = new Size(w, size); d.opaque = false; d.respectScreenScale = true;
  for (let i = 0; i < 3; i++) {
    const rect = new Rect(i * (size + gap) + 1, 1, size - 2, size - 2);
    if (i < n) {
      d.setFillColor(C.ember); d.fillEllipse(rect);
      d.setStrokeColor(C.bg); d.setLineWidth(2);
      const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2, s = size / 7;
      const pth = new Path(); pth.move(new Point(cx - s * 1.4, cy)); pth.addLine(new Point(cx - s * 0.3, cy + s * 1.1)); pth.addLine(new Point(cx + s * 1.5, cy - s * 1.1));
      d.addPath(pth); d.strokePath();
    } else { d.setStrokeColor(C.ring); d.setLineWidth(2); d.strokeEllipse(rect); }
  }
  return d.getImage();
}
function txt(stack, s, size, color, weight = "bold") {
  const t = stack.addText(s);
  t.font = weight === "bold" ? Font.boldRoundedSystemFont(size) : Font.mediumRoundedSystemFont(size);
  t.textColor = color; t.lineLimit = 1; t.minimumScaleFactor = 0.7;
  return t;
}
function fmtDate(s) { if (!s) return ""; const d = new Date(s + "T12:00:00"); return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

function build(st, family) {
  const small = family === "small";
  const w = new ListWidget();
  w.url = APP_URL + "#/path";
  const g = new LinearGradient(); g.colors = [new Color("#2b1a10"), C.bg]; g.locations = [0, 0.75]; w.backgroundGradient = g;
  w.setPadding(14, 16, 12, 16);

  const top = w.addStack(); top.layoutHorizontally(); top.bottomAlignContent();
  const left = top.addStack(); left.layoutVertically();
  txt(left, "CAMPFIRE READY", 9, C.muted);
  const big = left.addStack(); big.bottomAlignContent();
  txt(big, String(st.pct), small ? 36 : 40, C.ember);
  txt(big, "%", small ? 16 : 18, C.gold);
  top.addSpacer();
  if (!small) {
    const right = top.addStack(); right.layoutVertically();
    const di = right.addImage(dotsImage(st.week, 26)); di.imageSize = new Size(90, 26);
    right.addSpacer(4);
    const wt = txt(right, st.week >= 3 ? "Week done" : `${st.week} of 3 this week`, 11, st.week >= 3 ? C.gold : C.dim, "med"); wt.rightAlignText();
  }
  w.addSpacer(8);
  const bw = small ? 128 : 300;
  const bar = w.addImage(barImage(st.pct, bw, 12)); bar.imageSize = new Size(bw, 12);
  w.addSpacer(8);
  if (small) {
    const di = w.addImage(dotsImage(st.week, 20)); di.imageSize = new Size(72, 20);
  } else {
    const row = w.addStack(); row.layoutHorizontally(); row.centerAlignContent();
    const col = row.addStack(); col.layoutVertically();
    if (st.next) {
      txt(col, "Next: " + st.next.title, 13, C.text);
      col.addSpacer(2);
      txt(col, `Lesson ${st.next.num} of 64 · ${st.next.block}`, 10.5, C.muted, "med");
    } else if (st.started) txt(col, "Campfire path complete", 13, C.gold);
    else txt(col, "Open Music Space to start", 13, C.text);
    row.addSpacer();
    const r2 = row.addStack(); r2.layoutVertically();
    if (st.streak) { const s = txt(r2, `${st.streak}-wk streak`, 10.5, C.gold, "med"); s.rightAlignText(); }
    if (st.finish) { const f = txt(r2, "done ~" + fmtDate(st.finish), 10.5, C.muted, "med"); f.rightAlignText(); }
  }
  w.refreshAfterDate = new Date(Date.now() + 30 * 60000);
  return w;
}
function message(msg) {
  const w = new ListWidget(); w.backgroundColor = C.bg; w.url = APP_URL;
  txt(w, "Campfire", 13, C.ember); w.addSpacer(4);
  const t = w.addText(msg); t.font = Font.mediumRoundedSystemFont(12); t.textColor = C.dim;
  return w;
}

/* ---------- run ---------- */
let widget;
try {
  if (!Keychain.contains(KEY)) {
    if (config.runsInWidget) throw new Error("Open this script in Scriptable once to sign in.");
    await signIn();
  }
  const cfg = JSON.parse(Keychain.get(KEY));
  const prog = await loadProgress(cfg);
  widget = build(stats(prog, pickProfile(cfg, prog)), config.widgetFamily || "medium");
} catch (e) {
  widget = message(e.message);
}
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
