/* =========================================================
   app.js — Music Space
   Library · Practice · Path
   ========================================================= */
const T = window.Theory;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const today = () => new Date().toLocaleDateString("en-CA");

/* ===================== STATE ===================== */
const DEFAULT_STATE = {
  v: 1,
  theme: "midnight", chamTone: "auto", chamLock: null,
  font: 19,
  xp: 0, streak: { count: 0, last: "" },
  lessonsDone: {}, nailed: {}, best: {}, songPrefs: {},
  singers: {
    me:  { name: "Me", lo: 43, hi: 72, comfyLo: 45, comfyHi: 70 },   // G2–C5, comfy A2–A#4
    her: { name: "Ri", lo: 53, hi: 76, comfyLo: 57, comfyHi: 72, unset: true },
  },
  singersAt: 0,
  unlockAll: false,
  userSongs: {},
  sync: { owner: "Feirzen", repo: "music-space-library", lastSync: 0 },
};

const App = {
  state: null,
  load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem("ms.state") || "null"); } catch (e) {}
    this.state = Object.assign(structuredClone(DEFAULT_STATE), s || {});
    this.state.singers = Object.assign(structuredClone(DEFAULT_STATE.singers), this.state.singers || {});
    this.state.sync = Object.assign(structuredClone(DEFAULT_STATE.sync), this.state.sync || {});
  },
  save(noSync) {
    try { localStorage.setItem("ms.state", JSON.stringify(this.state)); } catch (e) {}
    if (!noSync) Sync.soon();
  },
  progressSnapshot() {
    const s = this.state;
    return { xp: s.xp, streak: s.streak, lessonsDone: s.lessonsDone, nailed: s.nailed, best: s.best,
             songPrefs: s.songPrefs, singers: s.singers, singersAt: s.singersAt };
  },
  applySynced(songs, p) {
    this.state.userSongs = songs;
    Object.assign(this.state, p);
    this.state.singers = Object.assign(structuredClone(DEFAULT_STATE.singers), p.singers || this.state.singers);
    this.save(true);
    if (["library", "path"].includes(route.name)) render();
  },
  setSyncStatus(st) {
    const el = $("#syncDot");
    if (el) { el.dataset.st = st; el.title = { syncing: "Syncing…", ok: "Synced", error: "Sync problem (tap Settings)", off: "Sync not set up" }[st]; }
  },
  toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove("show"), 2200);
  },
};
window.App = App;

function markPractice(xp = 5) {
  const s = App.state, d = today();
  if (s.streak.last !== d) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    s.streak.count = s.streak.last === y.toLocaleDateString("en-CA") ? s.streak.count + 1 : 1;
    s.streak.last = d;
  }
  s.xp += xp;
  App.save();
}

/* ===================== THEMES (matches Study Decks / Bulk Manager) ===================== */
const THEMES = {
  midnight:  { label: "Dark",      mode: "dark",  swatch: "#0f0f13" },
  paper:     { label: "Light",     mode: "light", swatch: "#f6f3ec" },
  sepia:     { label: "Sepia",     mode: "dark",  swatch: "#2a211a" },
  chameleon: { label: "Chameleon", mode: "dyn",   swatch: "conic-gradient(#f87171,#fbbf24,#34d399,#38bdf8,#a78bfa,#f87171)" },
};
const CHAM_VARS = ["bg","surface","surface2","border","border2","text","dim","muted","accent","ok","bad","star","shadow","okBg","badBg","scrim","accBg"];
let chamMode = "dark";
function makeChameleon() {
  const h = Math.floor(Math.random() * 360);
  const acc = (h + 120 + Math.floor(Math.random() * 110)) % 360;
  const tone = App.state.chamTone;
  const light = tone === "light" ? true : tone === "dark" ? false : Math.random() < 0.28;
  const H = (x, s, l, a) => `hsl(${x} ${s}% ${l}%${a ? " / " + a + "%" : ""})`;
  if (light) return { mode: "light", vars: {
    bg: H(h,32,95), surface: H(h,42,99), surface2: H(h,26,91), border: H(h,22,83), border2: H(h,20,66),
    text: H(h,38,11), dim: H(h,18,33), muted: H(h,14,50), accent: H(acc,66,37),
    ok: "hsl(158 72% 29%)", bad: "hsl(0 72% 44%)", star: "hsl(32 88% 34%)", shadow: "rgba(40,35,20,.16)",
    okBg: "hsl(158 72% 40% / 13%)", badBg: "hsl(0 72% 50% / 11%)", scrim: H(h,32,95,82), accBg: H(acc,66,45,11) } };
  return { mode: "dark", vars: {
    bg: H(h,26,7), surface: H(h,22,12), surface2: H(h,26,9), border: H(h,18,21), border2: H(h,18,33),
    text: H(h,26,95), dim: H(h,14,74), muted: H(h,12,50), accent: H(acc,74,63),
    ok: "hsl(158 66% 56%)", bad: "hsl(0 82% 73%)", star: "hsl(38 92% 55%)", shadow: "rgba(0,0,0,.5)",
    okBg: "hsl(158 66% 56% / 13%)", badBg: "hsl(0 82% 73% / 13%)", scrim: H(h,26,7,82), accBg: H(acc,74,63,14) } };
}
function paintChameleon(p) {
  chamMode = p.mode;
  CHAM_VARS.forEach(v => document.documentElement.style.setProperty("--" + v, p.vars[v]));
  syncThemeMeta();
}
function clearCham() { CHAM_VARS.forEach(v => document.documentElement.style.removeProperty("--" + v)); }
function rollChameleon() {
  if (App.state.theme !== "chameleon" || App.state.chamLock) return;
  paintChameleon(makeChameleon());
}
function applyTheme() {
  const t = THEMES[App.state.theme] ? App.state.theme : "midnight";
  document.documentElement.dataset.theme = t;
  if (t === "chameleon") paintChameleon(App.state.chamLock || makeChameleon());
  else { clearCham(); syncThemeMeta(); }
}
function syncThemeMeta() {
  requestAnimationFrame(() => {
    const m = $("#themeColorMeta");
    if (m) m.content = getComputedStyle(document.body).backgroundColor;
  });
}
function lockChameleon() {
  const vars = {};
  CHAM_VARS.forEach(v => vars[v] = getComputedStyle(document.documentElement).getPropertyValue("--" + v).trim());
  App.state.chamLock = { mode: chamMode, vars };
}
function themePickerHTML() {
  const s = App.state;
  const sw = Object.entries(THEMES).map(([k, t]) =>
    `<button class="swatch ${s.theme === k ? "on" : ""}" data-act="theme" data-k="${k}" style="background:${t.swatch}" aria-label="${t.label}"><span>${t.label}</span></button>`).join("");
  const cham = s.theme === "chameleon" ? `
    <div class="chamRow">
      <button class="btn small" data-act="chamTone">🦎 ${{ auto: "Any tone", light: "Light only", dark: "Dark only" }[s.chamTone]}</button>
      <button class="btn small" data-act="chamLock">${s.chamLock ? "🔒 Frozen" : "🔓 Changing"}</button>
      <button class="btn small" data-act="chamRoll" ${s.chamLock ? "disabled" : ""}>🎲 New colors</button>
    </div>
    <p class="hint">Chameleon picks new colors every time you change screens. Freeze it when you find one you love.</p>` : "";
  return `<div class="swatches">${sw}</div>${cham}`;
}

/* ===================== SONGS ===================== */
function allSongs() {
  const user = Object.values(App.state.userSongs || {}).filter(s => !s.deleted);
  return [...BUILTIN_SONGS, ...user];
}
function getSong(id) {
  return BUILTIN_SONGS.find(s => s.id === id) || (App.state.userSongs[id] && !App.state.userSongs[id].deleted ? App.state.userSongs[id] : null);
}
function songChords(song) {
  const out = [];
  (song.body || "").replace(/\[([^\]]+)\]/g, (m, c) => { if (T.isChord(c)) out.push(c); });
  return out;
}
function keyRoot(song) {
  const k = song.key || songChords(song)[0] || "C";
  const c = T.parseChord(k);
  return c ? c.root : 0;
}
function isMinorKey(song) { return /m$/.test(song.key || "") || /^[A-G][#b]?m(?!aj)/.test(song.key || ""); }
function prefs(id) { return App.state.songPrefs[id] || { shift: 0, capo: 0, view: "strum" }; }
function setPrefs(id, p) { App.state.songPrefs[id] = { ...prefs(id), ...p, at: Date.now() }; App.save(); }

function unlockedSets() {
  if (App.state.unlockAll) return new Set([1, 2, 3, 4, 5]);
  const out = new Set([1]);
  for (let n = 1; n < 5; n++) {
    const inSet = allSongs().filter(s => (s.set || 3) === n);
    const nailed = inSet.filter(s => App.state.nailed[s.id]).length;
    if (out.has(n) && (nailed >= Math.min(3, inSet.length) && inSet.length)) out.add(n + 1);
    else if (out.has(n) && !inSet.length) out.add(n + 1);
  }
  return out;
}
function needToUnlock(n) {
  const inSet = allSongs().filter(s => (s.set || 3) === n - 1);
  const nailed = inSet.filter(s => App.state.nailed[s.id]).length;
  return Math.max(0, Math.min(3, inSet.length) - nailed);
}

/* ===================== CHORD DIAGRAM (SVG) ===================== */
function chordSVG(name, size = 1) {
  const sh = T.chordShape(name);
  if (!sh) return `<div class="nodiag">${esc(name)}</div>`;
  const f = sh.frets;
  const played = f.filter(x => x > 0);
  const maxF = played.length ? Math.max(...played) : 0;
  const minF = played.length ? Math.min(...played) : 0;
  const base = maxF <= 4 ? 1 : minF;
  const W = 92 * size, H = 112 * size, x0 = 16 * size, y0 = 22 * size, gw = 60 * size, gh = 76 * size;
  const sx = i => x0 + (gw / 5) * i, fy = n => y0 + (gh / 5) * n;
  let g = `<svg class="diag" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)} chord">`;
  // nut or base fret
  if (base === 1) g += `<rect x="${x0 - 1}" y="${y0 - 3 * size}" width="${gw + 2}" height="${4 * size}" fill="var(--text)" rx="1"/>`;
  else g += `<text x="${x0 + gw + 5 * size}" y="${fy(0.7)}" font-size="${10 * size}" fill="var(--dim)">${base}fr</text>`;
  for (let i = 0; i <= 5; i++) g += `<line x1="${x0}" y1="${fy(i)}" x2="${x0 + gw}" y2="${fy(i)}" stroke="var(--border2)" stroke-width="${size}"/>`;
  for (let i = 0; i < 6; i++) g += `<line x1="${sx(i)}" y1="${y0}" x2="${sx(i)}" y2="${y0 + gh}" stroke="var(--dim)" stroke-width="${size}"/>`;
  // barre
  if (sh.barre && sh.barre >= base) {
    const strings = f.map((x, i) => x === sh.barre ? i : -1).filter(i => i >= 0);
    if (strings.length >= 2) {
      const a = strings[0], b = 5, row = sh.barre - base + 0.5;
      g += `<rect x="${sx(a) - 5 * size}" y="${fy(row) - 5 * size}" width="${sx(b) - sx(a) + 10 * size}" height="${10 * size}" rx="${5 * size}" fill="var(--accent)"/>`;
    }
  }
  f.forEach((x, i) => {
    if (x < 0) g += `<text x="${sx(i)}" y="${y0 - 8 * size}" font-size="${10 * size}" text-anchor="middle" fill="var(--muted)">×</text>`;
    else if (x === 0) g += `<circle cx="${sx(i)}" cy="${y0 - 11 * size}" r="${3.4 * size}" fill="none" stroke="var(--dim)" stroke-width="${1.2 * size}"/>`;
    else if (!(sh.barre && x === sh.barre)) g += `<circle cx="${sx(i)}" cy="${fy(x - base + 0.5)}" r="${5.2 * size}" fill="var(--accent)"/>`;
  });
  g += `</svg>`;
  return g;
}

/* play a chord shape as a quick strum (so you can hear it) */
function strumChord(name) {
  const sh = T.chordShape(name);
  if (!sh) return;
  const open = [40, 45, 50, 55, 59, 64];
  sh.frets.forEach((x, i) => {
    if (x < 0) return;
    const m = open[i] + x;
    setTimeout(() => AudioKit.playTone(440 * Math.pow(2, (m - 69) / 12), 1.6), i * 35);
  });
}

/* ===================== IMPORT (chord sheet -> app format) ===================== */
const SKIP_TOK = /^(\||\|\||x\d+|\(x\d+\)|-+|\/|N\.C\.?|\(|\)|\*|%)$/i;
function isChordLine(line) {
  if (!line || !line.trim()) return false;
  if (/^\s*[eBGDAE]\s*\|/.test(line)) return false;
  const toks = line.trim().split(/\s+/).map(t => t.replace(/^\(|\)$/g, "")).filter(t => t && !SKIP_TOK.test(t));
  if (!toks.length) return false;
  return toks.every(t => T.isChord(t));
}
function headerOf(line) {
  const m = line.trim().match(/^\[([^\]]+)\]$/);
  if (m && !T.isChord(m[1])) return m[1];
  const m2 = line.trim().match(/^(verse|chorus|bridge|intro|outro|pre-chorus|prechorus|interlude|solo|refrain|tag|coda)\s*\d*\s*:?$/i);
  return m2 ? line.trim().replace(/:$/, "") : null;
}
function mergeChordLyric(chordLine, lyric) {
  const hits = [];
  chordLine.replace(/\S+/g, (tok, idx) => { const c = tok.replace(/^\(|\)$/g, ""); if (T.isChord(c)) hits.push({ c, idx }); return tok; });
  let out = lyric.replace(/\s+$/, "");
  const need = Math.max(...hits.map(h => h.idx), 0);
  if (out.length < need) out = out.padEnd(need, " ");
  for (let i = hits.length - 1; i >= 0; i--) out = out.slice(0, hits[i].idx) + "[" + hits[i].c + "]" + out.slice(hits[i].idx);
  return out.replace(/ {2,}(?=\[)/g, " ").replace(/\s+$/, "");
}
function convertSheet(text) {
  const lines = String(text).replace(/\r/g, "").replace(/\[\/?(tab|ch)\]/g, "").split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = headerOf(line);
    if (h) { out.push("", "# " + h); continue; }
    if (isChordLine(line)) {
      const next = lines[i + 1];
      if (next != null && next.trim() && !isChordLine(next) && !headerOf(next) && !/^\s*[eBGDAE]\s*\|/.test(next)) {
        out.push(mergeChordLyric(line, next)); i++;
      } else {
        out.push(line.trim().split(/\s+/).map(t => T.isChord(t.replace(/^\(|\)$/g, "")) ? "[" + t.replace(/^\(|\)$/g, "") + "]" : t).join(" "));
      }
      continue;
    }
    out.push(line.replace(/\s+$/, ""));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ===================== ROUTER ===================== */
let route = { name: "library", arg: null, q: {} };
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qs] = h.split("?");
  const [name, arg] = path.split("/");
  const q = Object.fromEntries(new URLSearchParams(qs || ""));
  return { name: name || "library", arg: arg ? decodeURIComponent(arg) : null, q };
}
function go(hash) { location.hash = hash; }
function back() { if (history.length > 1) history.back(); else go("#/library"); }

const TABS = { library: "library", song: "library", import: "library", practice: "practice", tuner: "practice", metro: "practice",
  chords: "practice", game: "practice", range: "practice", path: "path", lesson: "path", settings: "settings" };

function cleanup() {
  AudioKit.Mic.stop();
  AudioKit.Metro.stop();
  Scroller.stop();
  clearInterval(gameTimer);
  $("#modal").hidden = true;
}

function render() {
  route = parseHash();
  const view = VIEWS[route.name] || VIEWS.library;
  const main = $("#main");
  main.innerHTML = view.html();
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.dataset.tab === TABS[route.name]));
  $("#backBtn").hidden = !["song","import","tuner","metro","chords","game","range","lesson","settings"].includes(route.name);
  $("#title").textContent = view.title ? view.title() : "Music Space";
  if (view.mount) view.mount();
}

window.addEventListener("hashchange", () => { cleanup(); rollChameleon(); render(); window.scrollTo(0, 0); });

/* ===================== AUTOSCROLL ===================== */
const Scroller = {
  on: false, speed: 18, raf: 0, last: 0, acc: 0,
  start() {
    this.on = true; this.last = performance.now(); this.acc = 0;
    const step = now => {
      if (!this.on) return;
      const dt = (now - this.last) / 1000; this.last = now;
      this.acc += this.speed * dt;
      if (this.acc >= 1) { window.scrollBy(0, Math.floor(this.acc)); this.acc -= Math.floor(this.acc); }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
    try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => this.lock = l).catch(() => {}); } catch (e) {}
  },
  stop() { this.on = false; cancelAnimationFrame(this.raf); try { this.lock && this.lock.release(); } catch (e) {} this.lock = null; },
};

/* ===================== VIEWS ===================== */
const VIEWS = {};

/* ---------- LIBRARY ---------- */
VIEWS.library = {
  title: () => "Library",
  html() {
    const s = App.state, open = unlockedSets(), q = (route.q.q || "").toLowerCase();
    const songs = allSongs().filter(x => !q || (x.title + " " + (x.artist || "")).toLowerCase().includes(q));
    const sets = [...new Set(songs.map(x => x.set || 3))].sort();
    if (!sets.length && !q) sets.push(1);
    const nailedCount = Object.keys(s.nailed).length;
    const sections = sets.map(n => {
      const list = songs.filter(x => (x.set || 3) === n).sort((a, b) => a.title.localeCompare(b.title));
      const locked = !open.has(n) && !q;
      const done = list.filter(x => s.nailed[x.id]).length;
      return `<section class="setSec ${locked ? "locked" : ""}">
        <div class="setHead"><h2>${locked ? "🔒 " : ""}Set ${n}</h2><span class="muted">${done}/${list.length} nailed</span></div>
        ${locked ? `<p class="hint">Nail ${needToUnlock(n)} more song${needToUnlock(n) === 1 ? "" : "s"} in Set ${n - 1} to unlock. <button class="link" data-act="peek">Peek anyway</button></p>` : ""}
        <div class="songList">${list.map(songRow).join("")}</div>
      </section>`;
    }).join("");
    return `
      <div class="libTop">
        <input id="libSearch" class="search" type="search" placeholder="Search songs" value="${esc(route.q.q || "")}">
        <button class="btn" data-act="go" data-h="#/import">＋ Add</button>
      </div>
      <div class="stats"><span>🔥 ${s.streak.count} day streak</span><span>⭐ ${s.xp} XP</span><span>✅ ${nailedCount} nailed</span></div>
      ${sections}
      <p class="hint center">Songs built in here are public domain. Your own songs live in your private repo.</p>`;
  },
  mount() {
    const inp = $("#libSearch");
    inp.addEventListener("input", () => { history.replaceState(null, "", "#/library" + (inp.value ? "?q=" + encodeURIComponent(inp.value) : "")); const pos = inp.selectionStart; render(); const n = $("#libSearch"); n.focus(); n.setSelectionRange(pos, pos); });
  },
};
function songRow(x) {
  const n = App.state.nailed[x.id];
  const tag = x.type === "pdf" ? `<span class="chip">PDF</span>` : (!x.body ? `<span class="chip warn">needs sheet</span>` : "");
  const p = prefs(x.id);
  const keyTxt = x.key ? `<span class="chip">${esc(x.key)}${p.capo ? " · capo " + p.capo : ""}</span>` : "";
  return `<button class="songRow" data-act="go" data-h="#/song/${encodeURIComponent(x.id)}">
    <span class="sTitle">${n ? "✅ " : ""}${esc(x.title)}</span>
    <span class="sMeta">${esc(x.artist || "")}</span>
    <span class="sChips">${keyTxt}${x.time ? `<span class="chip">${esc(x.time)}</span>` : ""}${tag}</span>
  </button>`;
}

/* ---------- SONG ---------- */
VIEWS.song = {
  title: () => (getSong(route.arg) || {}).title || "Song",
  html() {
    const song = getSong(route.arg);
    if (!song) return `<p class="empty">Song not found. It may still be syncing.</p>`;
    if (song.type === "pdf") return pdfHTML(song);
    const p = prefs(song.id);
    const kr = keyRoot(song);
    const minor = isMinorKey(song);
    const soundRoot = T.mod12(kr + p.shift), shapeRoot = T.mod12(kr + p.shift - p.capo);
    const nm = r => T.transposeChord(T.SHARPS[kr] + (minor ? "m" : ""), r - kr, r);
    const s = App.state;
    const fitMe = song.melody ? T.describeFit(song.melody, p.shift, s.singers.me) : "";
    const fitHer = song.melody ? T.describeFit(song.melody, p.shift, s.singers.her) : "";
    const pickBlock = p.view === "pick" ? pickHTML(song, p) : "";
    const strumBlock = p.view === "strum" && song.strum ? `<div class="strumBox"><b>Strum:</b> <code>${esc(song.strum)}</code>${song.strumTip ? `<div class="hint">${esc(song.strumTip)}</div>` : ""}</div>` : "";
    return `
      <div class="songHead">
        <div class="muted">${esc(song.artist || "")}${song.time ? " · " + esc(song.time) : ""}${song.bpm ? " · ~" + song.bpm + " bpm" : ""}</div>
        <div class="keyLine">Key <b>${esc(nm(soundRoot))}</b>${p.capo ? ` · <b>capo ${p.capo}</b> · play <b>${esc(nm(shapeRoot))}</b> shapes` : ""}${p.shift ? ` <span class="muted">(${p.shift > 0 ? "+" : ""}${p.shift} from original)</span>` : ""}</div>
        ${song.melody ? `<div class="hint">Melody for you: ${fitMe} · for ${esc(s.singers.her.name)}: ${fitHer}</div>` : ""}
      </div>
      <div class="toolbar" id="songBar">
        <div class="grp"><span class="lbl">Key</span><button class="btn small" data-act="shift" data-d="-1">−</button><button class="btn small" data-act="shift" data-d="1">＋</button></div>
        <div class="grp"><span class="lbl">Capo</span><button class="btn small" data-act="capo" data-d="-1">−</button><b class="num">${p.capo}</b><button class="btn small" data-act="capo" data-d="1">＋</button></div>
        <button class="btn small" data-act="fit" data-who="me">🎤 My range</button>
        <button class="btn small" data-act="fit" data-who="her">🎤 ${esc(s.singers.her.name)}'s range</button>
        <button class="btn small" data-act="easy">🙌 Easiest shapes</button>
        <button class="btn small" data-act="resetKey">↺</button>
        <div class="grp"><button class="btn small ${p.view === "strum" ? "on" : ""}" data-act="view" data-v="strum">Strum</button><button class="btn small ${p.view === "pick" ? "on" : ""}" data-act="view" data-v="pick">Fingerpick</button></div>
        <div class="grp"><span class="lbl">Text</span><button class="btn small" data-act="font" data-d="-1">A−</button><button class="btn small" data-act="font" data-d="1">A＋</button></div>
        <div class="grp"><button class="btn small" id="scrollBtn" data-act="scroll">▶ Scroll</button><input id="scrollSpeed" type="range" min="4" max="70" value="${Scroller.speed}" aria-label="Scroll speed"></div>
        <button class="btn small" data-act="spotify">🎧 Original</button>
      </div>
      ${strumBlock}${pickBlock}
      <div class="chordStrip">${[...new Set(songChords(song))].map(c => { const d = T.transposeChord(c, p.shift - p.capo, shapeRoot); return `<button class="miniChord" data-act="chord" data-c="${esc(d)}">${chordSVG(d, 0.62)}<span>${esc(d)}</span></button>`; }).join("")}</div>
      ${song.body ? `<div class="sheet" style="font-size:${s.font}px">${renderSheet(song.body, p.shift - p.capo, shapeRoot)}</div>`
        : `<div class="card"><p>This one's a song card. Paste the chord sheet once and it's yours forever, offline.</p>
             ${song.notes ? `<p class="hint">${esc(song.notes)}</p>` : ""}
             <button class="btn" data-act="go" data-h="#/import?fill=${encodeURIComponent(song.id)}">Paste chord sheet</button></div>`}
      <button class="fab" id="scrollFab" data-act="scroll" aria-label="Autoscroll">▶</button>
      <div class="songFoot">
        <button class="btn big ${s.nailed[song.id] ? "on" : ""}" data-act="nail">${s.nailed[song.id] ? "✅ Nailed it" : "Mark as nailed"}</button>
        ${song.type ? `<button class="btn" data-act="go" data-h="#/import?edit=${encodeURIComponent(song.id)}">Edit</button>` : ""}
      </div>`;
  },
  mount() {
    const sp = $("#scrollSpeed");
    if (sp) sp.addEventListener("input", () => Scroller.speed = +sp.value);
    const song = getSong(route.arg);
    const ps = $("#patSel");
    if (ps) ps.addEventListener("change", () => { setPrefs(song.id, { pattern: ps.value }); render(); });
    if (song && song.type === "pdf") mountPdf(song);
  },
};

function renderSheet(body, semis, shapeRoot) {
  return body.split("\n").map(line => {
    if (/^#\s/.test(line)) return `<h3 class="sec">${esc(line.slice(2))}</h3>`;
    if (!line.trim()) return `<div class="gap"></div>`;
    if (/^\s*[eBGDAE]\s*\|/.test(line)) return `<pre class="tabline">${esc(line)}</pre>`;
    if (!/\[[^\]]+\]/.test(line)) return `<div class="ln"><span class="seg"><span class="ch"> </span><span class="ly">${esc(line)}</span></span></div>`;
    const parts = line.split(/\[([^\]]+)\]/);
    let html = parts[0] ? `<span class="seg"><span class="ch"> </span><span class="ly">${esc(parts[0])}</span></span>` : "";
    for (let i = 1; i < parts.length; i += 2) {
      const raw = parts[i], text = parts[i + 1] || "";
      const isC = T.isChord(raw);
      const c = isC ? T.transposeChord(raw, semis, shapeRoot) : raw;
      html += `<span class="seg"><span class="ch">${isC ? `<button class="chordBtn" data-act="chord" data-c="${esc(c)}">${esc(c)}</button>` : esc(c)}</span><span class="ly">${text ? esc(text) : "&nbsp;"}</span></span>`;
    }
    return `<div class="ln">${html}</div>`;
  }).join("");
}

function pickHTML(song, p) {
  const shapeRoot = T.mod12(keyRoot(song) + p.shift - p.capo);
  const pk = p.pattern || song.pick || (song.time === "3/4" ? "arp34" : "arp44");
  const chords = [...new Set(songChords(song).map(c => T.transposeChord(c, p.shift - p.capo, shapeRoot)))];
  const opts = Object.entries(T.PATTERNS).map(([k, v]) => `<option value="${k}" ${k === pk ? "selected" : ""}>${v.label}</option>`).join("");
  return `<div class="pickBox">
    <div class="row"><b>Pattern</b> <select id="patSel">${opts}</select></div>
    <div class="hint">Counts: ${T.PATTERNS[pk].counts}. Thumb takes the bass, fingers take G, B and e. Same pattern for every chord.</div>
    <div class="tabRow">${chords.map(c => `<div class="tabCard"><div class="tabName">${esc(c)}</div><pre>${esc(T.patternTab(c, pk) || "")}</pre></div>`).join("")}</div>
  </div>`;
}

/* ---------- PDF viewer ---------- */
let pdfZoom = 1;
function pdfHTML(song) {
  return `<div class="toolbar" id="songBar">
      <div class="grp"><span class="lbl">Zoom</span><button class="btn small" data-act="pdfZoom" data-d="-1">−</button><button class="btn small" data-act="pdfZoom" data-d="1">＋</button></div>
      <div class="grp"><button class="btn small" id="scrollBtn" data-act="scroll">▶ Scroll</button><input id="scrollSpeed" type="range" min="4" max="70" value="${Scroller.speed}"></div>
      <button class="btn small" data-act="spotify">🎧 Original</button>
      <button class="btn small ${App.state.nailed[song.id] ? "on" : ""}" data-act="nail">${App.state.nailed[song.id] ? "✅ Nailed" : "Nailed it?"}</button>
      <button class="btn small" data-act="go" data-h="#/import?edit=${encodeURIComponent(song.id)}">Edit</button>
    </div>
    <button class="fab" id="scrollFab" data-act="scroll" aria-label="Autoscroll">▶</button>
    <div id="pdfPages" class="pdfPages"><p class="hint center">Loading PDF…</p></div>`;
}
let pdfLibPromise = null;
function loadPdfLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfLibPromise) pdfLibPromise = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; res(pdfjsLib); };
    s.onerror = () => { pdfLibPromise = null; rej(new Error("PDF viewer not downloaded yet. Open the app once on WiFi.")); };
    document.head.appendChild(s);
  });
  return pdfLibPromise;
}
async function mountPdf(song) {
  const box = $("#pdfPages");
  try {
    const blob = await IDB.get(song.file);
    if (!blob) { box.innerHTML = `<p class="empty">This PDF isn't on this device yet. Connect to the internet and tap sync in Settings.</p>`; return; }
    const lib = await loadPdfLib();
    const doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    box.innerHTML = "";
    const w = Math.min(box.clientWidth || window.innerWidth, 1400) * pdfZoom;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const v1 = page.getViewport({ scale: 1 });
      const scale = w / v1.width;
      const vp = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
      const cv = document.createElement("canvas");
      cv.width = vp.width; cv.height = vp.height;
      cv.style.width = w + "px";
      box.appendChild(cv);
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
    }
  } catch (e) { box.innerHTML = `<p class="empty">${esc(e.message)}</p>`; }
}

/* ---------- IMPORT / EDIT ---------- */
VIEWS.import = {
  title: () => route.q.edit ? "Edit song" : "Add a song",
  html() {
    const edit = route.q.edit ? getSong(route.q.edit) : null;
    const fill = route.q.fill ? getSong(route.q.fill) : null;
    const base = edit || fill || {};
    const isBuiltin = BUILTIN_SONGS.some(b => b.id === base.id);
    if (isBuiltin) return `<p class="empty">Built-in songs can't be edited, but you can change key, capo and view right on the song.</p>`;
    const mel = base.melody ? base.melody.map(T.midiName) : ["", ""];
    return `
      <div class="card">
        <label>Title <input id="fTitle" value="${esc(base.title || "")}" placeholder="Song title"></label>
        <label>Artist <input id="fArtist" value="${esc(base.artist || "")}" placeholder="Artist"></label>
        <div class="row2">
          <label>Set <select id="fSet">${[1,2,3,4,5].map(n => `<option ${((base.set || 3) === n) ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label>Time <select id="fTime">${["4/4","3/4","6/8","2/4"].map(t => `<option ${base.time === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        </div>
        <div class="row2">
          <label>Melody low <input id="fLo" value="${esc(mel[0])}" placeholder="e.g. D4"></label>
          <label>Melody high <input id="fHi" value="${esc(mel[1])}" placeholder="e.g. E5"></label>
        </div>
        <p class="hint">Melody range powers the "my range" buttons. Leave blank if you don't know, or ask Claude to fill it in.</p>
        <label>Spotify search or link <input id="fSpot" value="${esc(base.spotify || "")}" placeholder="Song name artist, or a Spotify link"></label>
        <label>Strum pattern <input id="fStrum" value="${esc(base.strum || "")}" placeholder="D – D U – U D U"></label>
      </div>
      ${base.type === "pdf" ? `<div class="card"><p>📄 This song uses a PDF. Pick a new file to replace it.</p><input id="fPdf" type="file" accept="application/pdf"></div>` : `
      <div class="card">
        <div class="row"><b>Chord sheet</b><button class="btn small" data-act="pasteClip">📋 Paste</button></div>
        <p class="hint">Copy a chord sheet (chords above lyrics, like Ultimate Guitar) and paste it here. It gets converted so transpose, capo and tap-for-fingering all work.</p>
        <textarea id="fBody" rows="14" placeholder="[Verse 1]&#10;G        C        G&#10;Lyrics go here...">${esc(base.body || "")}</textarea>
        <div id="preview" class="sheet preview"></div>
      </div>
      <div class="card"><p><b>Or use a PDF</b> (sheet music you bought). You'll get zoom and autoscroll.</p><input id="fPdf" type="file" accept="application/pdf"></div>`}
      <div class="songFoot">
        <button class="btn big on" data-act="saveSong">Save</button>
        ${edit ? `<button class="btn danger" data-act="delSong">Delete</button>` : ""}
      </div>`;
  },
  mount() {
    const ta = $("#fBody"), pv = $("#preview");
    const upd = () => { if (!ta) return; const conv = convertSheet(ta.value); pv.innerHTML = conv ? renderSheet(conv, 0, null) : ""; };
    if (ta) { ta.addEventListener("input", upd); upd(); }
  },
};

async function saveSongFromForm() {
  const edit = route.q.edit ? getSong(route.q.edit) : null;
  const fill = route.q.fill ? getSong(route.q.fill) : null;
  const base = edit || fill || {};
  const title = $("#fTitle").value.trim();
  if (!title) return App.toast("Give it a title first");
  const id = base.id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36).slice(-4);
  const lo = T.nameToMidi($("#fLo").value), hi = T.nameToMidi($("#fHi").value);
  const song = { ...base, id, title, artist: $("#fArtist").value.trim(), set: +$("#fSet").value, time: $("#fTime").value,
    spotify: $("#fSpot").value.trim(), strum: $("#fStrum").value.trim(), updatedAt: Date.now() };
  if (lo != null && hi != null) song.melody = [Math.min(lo, hi), Math.max(lo, hi)];
  const pdf = $("#fPdf") && $("#fPdf").files[0];
  if (pdf) {
    song.type = "pdf"; song.file = "pdfs/" + id + ".pdf"; song.uploaded = false; delete song.body;
    await IDB.put(song.file, pdf);
  } else if ($("#fBody")) {
    const body = convertSheet($("#fBody").value);
    if (!body && !base.body && !song.type) return App.toast("Paste a chord sheet or pick a PDF");
    song.type = "chords"; song.body = body;
    if (!song.key) { const first = songChords(song)[0]; if (first) { const c = T.parseChord(first); song.key = T.SHARPS[c.root] + (T.family(c.q) === "m" || T.family(c.q) === "m7" ? "m" : ""); } }
  }
  App.state.userSongs[id] = song;
  App.save();
  App.toast("Saved");
  go("#/song/" + encodeURIComponent(id));
}

/* ---------- PRACTICE ---------- */
VIEWS.practice = {
  title: () => "Practice",
  html() {
    const tiles = [
      ["tuner", "🎯", "Tuner", "Uses the mic. Works offline."],
      ["metro", "⏱️", "Metronome", "Steady time, tap tempo."],
      ["chords", "🖐️", "Chord library", "Every shape, tap to hear it."],
      ["game?g=flash", "⚡", "Chord Flash", "Switch on the beat. Don't stop."],
      ["game?g=rush", "🏁", "Chord Rush", "Two chords, one minute, beat your best."],
      ["game?g=quiz", "🧠", "Name That Shape", "Quick quiz on chord shapes."],
      ["range", "🎤", "Range finder", "Find your and " + esc(App.state.singers.her.name) + "'s singing range."],
    ];
    return `<div class="tiles">${tiles.map(([h, i, t, d]) => `<button class="tile" data-act="go" data-h="#/${h}"><span class="ti">${i}</span><b>${t}</b><span class="muted">${d}</span></button>`).join("")}</div>
      <div class="card"><b>Warmup (3 min)</b><ol class="warm">
        <li>Spider walk: frets 1-2-3-4 on every string, slow.</li>
        <li>Chord Flash with G, C, D, Em at 60 bpm.</li>
        <li>One song you already know, start to finish.</li></ol></div>`;
  },
};

/* ---------- TUNER ---------- */
const GUITAR = [["E2",40],["A2",45],["D3",50],["G3",55],["B3",59],["E4",64]];
VIEWS.tuner = {
  title: () => "Tuner",
  html() {
    return `<div class="tuner">
      <div class="tNote" id="tNote">—</div>
      <div class="tCents"><div class="tScale"><span></span><span></span><span class="mid"></span><span></span><span></span></div><div class="tNeedle" id="tNeedle"></div></div>
      <div class="tInfo muted" id="tInfo">Tap start, then play one string</div>
      <button class="btn big on" id="tStart" data-act="tunerStart">🎙️ Start tuner</button>
      <div class="strings">${GUITAR.map(([n, m]) => `<button class="btn" data-act="refTone" data-m="${m}">${n.replace(/\d/, "")}<small>${n.slice(-1)}</small></button>`).join("")}</div>
      <p class="hint center">Tap a string name to hear the target note. Sharp = needle right, flat = needle left.</p>
    </div>`;
  },
};
function startTuner() {
  const hist = [];
  AudioKit.Mic.start(f => {
    if (f < 0) return;
    hist.push(f); if (hist.length > 5) hist.shift();
    const med = [...hist].sort((a, b) => a - b)[Math.floor(hist.length / 2)];
    const m = AudioKit.freqToMidi(med), near = Math.round(m), cents = Math.round((m - near) * 100);
    const n = $("#tNote"), nd = $("#tNeedle"), inf = $("#tInfo");
    if (!n) return;
    n.textContent = T.SHARPS[T.mod12(near)] + (Math.floor(near / 12) - 1);
    const ok = Math.abs(cents) <= 5;
    n.classList.toggle("ok", ok);
    nd.style.left = (50 + Math.max(-50, Math.min(50, cents))) + "%";
    nd.classList.toggle("ok", ok);
    const target = GUITAR.reduce((a, b) => Math.abs(b[1] - m) < Math.abs(a[1] - m) ? b : a);
    inf.textContent = `${med.toFixed(1)} Hz · ${cents > 0 ? "+" : ""}${cents}¢ · closest string ${target[0]}`;
  }).then(() => { const b = $("#tStart"); if (b) { b.textContent = "Listening…"; b.disabled = true; } })
    .catch(() => App.toast("Mic blocked. Allow microphone access in Settings › Safari."));
}

/* ---------- METRONOME ---------- */
let metroBpm = 80, metroBeats = 4, taps = [];
VIEWS.metro = {
  title: () => "Metronome",
  html() {
    if (route.q.bpm) metroBpm = +route.q.bpm;
    return `<div class="metro">
      <div class="bpm"><b id="bpmVal">${metroBpm}</b> bpm</div>
      <input id="bpmRange" type="range" min="40" max="200" value="${metroBpm}">
      <div class="row center"><button class="btn small" data-act="bpm" data-d="-5">−5</button><button class="btn small" data-act="bpm" data-d="-1">−1</button><button class="btn small" data-act="bpm" data-d="1">＋1</button><button class="btn small" data-act="bpm" data-d="5">＋5</button></div>
      <div class="dots" id="dots">${Array.from({ length: metroBeats }, (_, i) => `<span data-i="${i}"></span>`).join("")}</div>
      <div class="row center">${[2,3,4,6].map(n => `<button class="btn small ${n === metroBeats ? "on" : ""}" data-act="beats" data-n="${n}">${n}/4</button>`).join("")}</div>
      <div class="row center"><button class="btn big on" id="mBtn" data-act="metroToggle">▶ Start</button><button class="btn big" data-act="tap">Tap</button></div>
    </div>`;
  },
  mount() {
    const r = $("#bpmRange");
    r.addEventListener("input", () => { metroBpm = +r.value; $("#bpmVal").textContent = metroBpm; AudioKit.Metro.bpm = metroBpm; });
  },
};
function metroBeat(b) {
  document.querySelectorAll("#dots span").forEach((d, i) => d.classList.toggle("on", i === b % metroBeats));
}

/* ---------- CHORD LIBRARY ---------- */
VIEWS.chords = {
  title: () => "Chord library",
  html() {
    const g = route.q.g || Object.keys(CHORD_GROUPS)[0];
    const tabs = Object.keys(CHORD_GROUPS).map(k => `<button class="btn small ${k === g ? "on" : ""}" data-act="go" data-h="#/chords?g=${encodeURIComponent(k)}">${k}</button>`).join("");
    return `<div class="row wrap">${tabs}</div>
      <div class="chordGrid">${CHORD_GROUPS[g].map(c => `<button class="chordCard" data-act="chord" data-c="${c}">${chordSVG(c, 1)}<b>${c}</b></button>`).join("")}</div>
      <p class="hint center">Tap a chord to see it big and hear how it should sound.</p>`;
  },
};

/* ---------- RANGE FINDER ---------- */
VIEWS.range = {
  title: () => "Range finder",
  html() {
    const s = App.state.singers;
    const row = (k) => `<div class="card">
      <div class="row"><b>${esc(s[k].name)}</b>${s[k].unset ? `<span class="chip warn">not measured yet</span>` : ""}</div>
      <div class="rangeBar">${T.midiName(s[k].lo)} – ${T.midiName(s[k].hi)} <span class="muted">(comfy ${T.midiName(s[k].comfyLo)} – ${T.midiName(s[k].comfyHi)})</span></div>
      <div class="row wrap"><button class="btn small" data-act="rangeCap" data-who="${k}" data-end="lo">🎙️ Sing lowest</button><button class="btn small" data-act="rangeCap" data-who="${k}" data-end="hi">🎙️ Sing highest</button></div>
      <div class="row2">
        <label>Lowest <input data-sing="${k}.lo" value="${T.midiName(s[k].lo)}"></label><label>Highest <input data-sing="${k}.hi" value="${T.midiName(s[k].hi)}"></label>
      </div>
      <div class="row2">
        <label>Comfy low <input data-sing="${k}.comfyLo" value="${T.midiName(s[k].comfyLo)}"></label><label>Comfy high <input data-sing="${k}.comfyHi" value="${T.midiName(s[k].comfyHi)}"></label>
      </div></div>`;
    return `<p class="hint">Hold the note steady for 2 seconds. The comfy range is what the "range" buttons aim for. Edges are only used if a song really needs them.</p>
      ${row("me")}${row("her")}
      <div id="rangeLive" class="tNote small">—</div>
      <button class="btn big on" data-act="saveRange">Save ranges</button>`;
  },
};

/* ---------- GAMES ---------- */
let gameTimer = 0;
VIEWS.game = {
  title: () => ({ flash: "Chord Flash", rush: "Chord Rush", quiz: "Name That Shape" })[route.q.g] || "Game",
  html() {
    const g = route.q.g;
    const chordsQ = route.q.c ? route.q.c.split(",") : null;
    if (g === "flash") {
      const groups = Object.entries(CHORD_GROUPS).map(([k, v]) => `<option value="${v.join(",")}" ${chordsQ && chordsQ.join(",") === v.join(",") ? "selected" : ""}>${k}: ${v.join(" ")}</option>`).join("");
      return `<div class="game" id="game">
        <div class="setup" id="setup">
          <label>Chords <select id="gChords">${chordsQ && !Object.values(CHORD_GROUPS).some(v => v.join(",") === chordsQ.join(",")) ? `<option value="${chordsQ.join(",")}" selected>${chordsQ.join(" ")}</option>` : ""}${groups}</select></label>
          <div class="row2"><label>BPM <input id="gBpm" type="number" value="${route.q.bpm || 60}" min="40" max="180"></label><label>Beats per chord <select id="gBeats">${[2,4,8].map(n => `<option ${(+(route.q.beats || 4)) === n ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
          <label>Length <select id="gSecs">${[60,90,120,180].map(n => `<option value="${n}" ${(+(route.q.secs || 60)) === n ? "selected" : ""}>${n / 60} min</option>`).join("")}</select></label>
          <button class="btn big on" data-act="flashStart">▶ Go</button>
        </div>
        <div class="stage" id="stage" hidden><div class="countdown" id="cd"></div><div class="bigChord" id="bigChord"></div><div id="bigDiag"></div><div class="nextUp muted" id="nextUp"></div><div class="timeLeft" id="tl"></div></div>
      </div>`;
    }
    if (g === "rush") {
      const pair = chordsQ || ["G", "C"];
      const opts = ["G","C","D","Em","Am","A","E","Dm","F","G7","D7","A7","E7","Cadd9","Bm"];
      const sel = (id, v) => `<select id="${id}">${opts.map(o => `<option ${o === v ? "selected" : ""}>${o}</option>`).join("")}</select>`;
      const best = App.state.best["rush:" + pair.join("-")] || 0;
      return `<div class="game">
        <div class="setup" id="setup">
          <div class="row2"><label>From ${sel("r1", pair[0])}</label><label>To ${sel("r2", pair[1])}</label></div>
          <p class="hint">Strum one chord, switch, strum the other. Tap the big button every clean change. One minute. Best for this pair: <b id="rBest">${best}</b></p>
          <button class="btn big on" data-act="rushStart">▶ Go</button>
        </div>
        <div class="stage" id="stage" hidden><div class="countdown" id="cd"></div>
          <div class="pair"><div>${chordSVG(pair[0], 1.1)}<b>${esc(pair[0])}</b></div><div>${chordSVG(pair[1], 1.1)}<b>${esc(pair[1])}</b></div></div>
          <button class="rushTap" id="rushTap" data-act="rushTap" disabled>0</button><div class="timeLeft" id="tl"></div></div>
      </div>`;
    }
    if (g === "quiz") return `<div class="game" id="quiz"></div>`;
    return `<p class="empty">Pick a game from Practice.</p>`;
  },
  mount() { if (route.q.g === "quiz") Quiz.start(); },
};

function countdown(n, done) {
  const cd = $("#cd"); let i = n;
  cd.textContent = i; AudioKit.sfx.tick();
  const t = setInterval(() => {
    i--; if (!$("#cd")) return clearInterval(t);
    if (i <= 0) { clearInterval(t); cd.textContent = ""; done(); }
    else { cd.textContent = i; AudioKit.sfx.tick(); }
  }, 700);
}

function flashStart() {
  const chords = $("#gChords").value.split(",");
  const bpm = +$("#gBpm").value || 60, beats = +$("#gBeats").value || 4, secs = +$("#gSecs").value || 60;
  $("#setup").hidden = true; $("#stage").hidden = false;
  let cur = chords[0], nxt = pickOther(chords, cur);
  const show = () => { $("#bigChord").textContent = cur; $("#bigDiag").innerHTML = chordSVG(cur, 1.6); $("#nextUp").textContent = "next: " + nxt; };
  show();
  const end = Date.now() + secs * 1000;
  AudioKit.Metro.start(bpm, beats, b => {
    if (!$("#stage")) return;
    if (b > 0 && b % beats === 0) { cur = nxt; nxt = pickOther(chords, cur); show(); }
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    $("#tl").textContent = left + "s";
    if (Date.now() >= end) {
      AudioKit.Metro.stop(); AudioKit.sfx.win(); markPractice(10);
      $("#stage").innerHTML = `<div class="bigChord">Nice! 🎉</div><p>+10 XP. Keep that streak going.</p><button class="btn big on" data-act="back">Done</button>`;
    }
  });
}
function pickOther(list, cur) {
  if (list.length < 2) return list[0];
  let n; do { n = list[Math.floor(Math.random() * list.length)]; } while (n === cur);
  return n;
}
let rushCount = 0;
function rushStart() {
  const a = $("#r1").value, b = $("#r2").value;
  if (route.q.c !== a + "," + b) { history.replaceState(null, "", "#/game?g=rush&c=" + a + "," + b); render(); return rushStart(); }
  $("#setup").hidden = true; $("#stage").hidden = false;
  rushCount = 0;
  countdown(3, () => {
    const tap = $("#rushTap"); tap.disabled = false;
    const end = Date.now() + 60000;
    gameTimer = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      if (!$("#tl")) return clearInterval(gameTimer);
      $("#tl").textContent = left + "s";
      if (left <= 0) {
        clearInterval(gameTimer);
        const key = "rush:" + a + "-" + b, prev = App.state.best[key] || 0;
        if (rushCount > prev) App.state.best[key] = rushCount;
        markPractice(10); AudioKit.sfx.win();
        $("#stage").innerHTML = `<div class="bigChord">${rushCount}</div><p>${rushCount > prev ? "🏆 New best for " + a + " → " + b + "!" : "Best is " + prev + ". You'll get it."}</p>
          <div class="row center"><button class="btn big on" data-act="again">Again</button><button class="btn big" data-act="back">Done</button></div>`;
      }
    }, 250);
  });
}

const Quiz = {
  pool: ["G","C","D","Em","Am","A","E","Dm","E7","A7","D7","G7","B7","Cadd9","Dsus2","Asus2","F","Bm","Cmaj7","Fmaj7"],
  round: 0, score: 0,
  start() { this.round = 0; this.score = 0; this.next(); },
  next() {
    const el = $("#quiz"); if (!el) return;
    if (this.round >= 10) {
      const prev = App.state.best.quiz || 0;
      if (this.score > prev) App.state.best.quiz = this.score;
      markPractice(10); AudioKit.sfx.win();
      el.innerHTML = `<div class="bigChord">${this.score}/10</div><p>${this.score > prev ? "🏆 New best!" : "Best: " + prev}</p><div class="row center"><button class="btn big on" data-act="quizAgain">Again</button><button class="btn big" data-act="back">Done</button></div>`;
      return;
    }
    const ans = this.pool[Math.floor(Math.random() * this.pool.length)];
    const opts = new Set([ans]);
    while (opts.size < 4) opts.add(this.pool[Math.floor(Math.random() * this.pool.length)]);
    const list = [...opts].sort(() => Math.random() - 0.5);
    el.innerHTML = `<div class="muted center">Round ${this.round + 1} of 10 · score ${this.score}</div>
      <div class="center">${chordSVG(ans, 1.8)}</div>
      <div class="opts">${list.map(o => `<button class="btn big" data-act="quizPick" data-o="${o}" data-a="${ans}">${o}</button>`).join("")}</div>`;
  },
  pick(btn) {
    const ok = btn.dataset.o === btn.dataset.a;
    if (ok) { this.score++; AudioKit.sfx.good(); btn.classList.add("good"); }
    else { AudioKit.sfx.bad(); btn.classList.add("badx"); document.querySelector(`[data-o="${btn.dataset.a}"]`).classList.add("good"); }
    document.querySelectorAll(".opts button").forEach(b => b.disabled = true);
    this.round++;
    setTimeout(() => this.next(), ok ? 600 : 1300);
  },
};

/* ---------- PATH ---------- */
function lessonList() { return PATH.flatMap(u => u.lessons.map(l => ({ ...l, unit: u }))); }
function lessonOpen(id) {
  const all = lessonList(), i = all.findIndex(l => l.id === id);
  return i === 0 || App.state.lessonsDone[id] || App.state.lessonsDone[all[i - 1].id];
}
VIEWS.path = {
  title: () => "Path",
  html() {
    const s = App.state;
    const done = Object.keys(s.lessonsDone).length, total = lessonList().length;
    let side = 0;
    return `<div class="stats"><span>🔥 ${s.streak.count} day streak</span><span>⭐ ${s.xp} XP</span><span>📘 ${done}/${total} lessons</span></div>
      ${PATH.map(u => `<section class="unit"><h2>${u.icon} ${esc(u.title)}</h2><div class="nodes">
        ${u.lessons.map(l => {
          const d = s.lessonsDone[l.id], open = lessonOpen(l.id);
          const off = ["0", "28%", "48%", "28%"][side++ % 4];
          return `<button class="node ${d ? "done" : open ? "open" : "lock"} ${l.boss ? "boss" : ""}" style="margin-left:${off}" data-act="${open ? "go" : "lockedLesson"}" data-h="#/lesson/${l.id}">
            <span class="dot">${d ? "✓" : l.boss ? "👑" : open ? "▶" : "🔒"}</span><span class="nl">${esc(l.title)}</span></button>`;
        }).join("")}</div></section>`).join("")}`;
  },
};
VIEWS.lesson = {
  title: () => (lessonList().find(l => l.id === route.arg) || {}).title || "Lesson",
  html() {
    const l = lessonList().find(x => x.id === route.arg);
    if (!l) return `<p class="empty">Lesson not found.</p>`;
    const steps = l.steps.map((st, i) => {
      let action = "";
      if (st.t === "chords") action = `<div class="chordStrip">${st.list.map(c => `<button class="miniChord" data-act="chord" data-c="${c}">${chordSVG(c, 0.8)}<span>${c}</span></button>`).join("")}</div>`;
      if (st.t === "tool") action = `<button class="btn" data-act="go" data-h="#/${st.tool}${st.bpm ? "?bpm=" + st.bpm : ""}">${st.tool === "tuner" ? "🎯 Open tuner" : "⏱️ Open metronome"}</button>`;
      if (st.t === "game") action = `<button class="btn" data-act="go" data-h="#/game?g=${st.game}${st.chords ? "&c=" + st.chords.join(",") : ""}${st.bpm ? "&bpm=" + st.bpm : ""}${st.beats ? "&beats=" + st.beats : ""}${st.secs ? "&secs=" + st.secs : ""}">${{ flash: "⚡ Chord Flash", rush: "🏁 Chord Rush", quiz: "🧠 Shape quiz" }[st.game]}</button>`;
      if (st.t === "song") { const sg = getSong(st.id); action = sg ? `<button class="btn" data-act="go" data-h="#/song/${st.id}">🎵 ${esc(sg.title)}</button>` : ""; }
      return `<div class="step"><span class="sn">${i + 1}</span><div><p>${esc(st.md || "")}</p>${action}</div></div>`;
    }).join("");
    const d = App.state.lessonsDone[l.id];
    return `<div class="muted">${l.unit.icon} ${esc(l.unit.title)}${l.boss ? " · 👑 Boss level" : ""}</div>${steps}
      <div class="songFoot"><button class="btn big ${d ? "" : "on"}" data-act="finishLesson" data-id="${l.id}">${d ? "✓ Done (do it again for XP)" : "Finish lesson"}</button></div>`;
  },
};

/* ---------- SETTINGS ---------- */
VIEWS.settings = {
  title: () => "Settings",
  html() {
    const s = App.state, tok = (() => { try { return localStorage.getItem("ms.token") || ""; } catch (e) { return ""; } })();
    return `
      <div class="card"><b>Theme</b>${themePickerHTML()}</div>
      <div class="card"><b>Private library sync</b>
        <p class="hint">Your imported songs, PDFs and progress save to a private GitHub repo so your iPhone and iPad match. The token stays on this device only.</p>
        <div class="row2"><label>GitHub user <input id="sOwner" value="${esc(s.sync.owner)}"></label><label>Private repo <input id="sRepo" value="${esc(s.sync.repo)}"></label></div>
        <label>Token <input id="sToken" type="password" value="${esc(tok)}" placeholder="github_pat_…" autocomplete="off"></label>
        <div class="row"><button class="btn on" data-act="saveSync">Save & sync now</button><span class="muted">${s.sync.lastSync ? "Last sync " + new Date(s.sync.lastSync).toLocaleString() : "Never synced"}</span></div>
      </div>
      <div class="card"><b>Sets</b>
        <label class="check"><input type="checkbox" id="sUnlock" ${s.unlockAll ? "checked" : ""}> Unlock all sets (skip the grind)</label></div>
      <div class="card"><b>Offline</b><p class="hint" id="offInfo">Checking…</p></div>
      <p class="hint center">Music Space · built for campfires</p>`;
  },
  mount() {
    $("#sUnlock").addEventListener("change", e => { App.state.unlockAll = e.target.checked; App.save(); });
    (async () => {
      let msg = navigator.serviceWorker && navigator.serviceWorker.controller ? "✅ App is saved for offline use." : "⏳ Offline copy not ready yet. Reopen the app once.";
      try {
        if (navigator.storage && navigator.storage.persisted) msg += (await navigator.storage.persisted()) ? " Storage is protected." : " Add it to your Home Screen to keep storage safe.";
      } catch (e) {}
      const el = $("#offInfo"); if (el) el.textContent = msg;
    })();
  },
};

/* ===================== CHORD POPUP ===================== */
function openChord(c) {
  const m = $("#modal");
  const pick = T.patternTab(c, "arp44");
  m.innerHTML = `<div class="sheetModal"><div class="bigChord">${esc(c)}</div>${chordSVG(c, 2)}
    ${T.chordShape(c) && T.chordShape(c).simplified ? `<p class="hint">Simplified shape (close enough for campfire).</p>` : ""}
    <div class="row center"><button class="btn" data-act="hear" data-c="${esc(c)}">🔊 Hear it</button><button class="btn" data-act="closeModal">Close</button></div>
    <details><summary>Fingerpick tab</summary><pre>${esc(pick || "")}</pre></details></div>`;
  m.hidden = false;
}

/* ===================== CLICKS ===================== */
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-act]");
  if (!el) { if (e.target.id === "modal") $("#modal").hidden = true; return; }
  const a = el.dataset.act, s = App.state;
  const song = route.name === "song" ? getSong(route.arg) : null;
  switch (a) {
    case "go": go(el.dataset.h); break;
    case "back": back(); break;
    case "tab": go("#/" + el.dataset.tab); break;
    case "peek": s.unlockAll = true; App.save(); render(); App.toast("All sets unlocked. You can relock in Settings."); break;
    case "theme": s.theme = el.dataset.k; s.chamLock = null; applyTheme(); App.save(); render(); break;
    case "chamTone": s.chamTone = { auto: "light", light: "dark", dark: "auto" }[s.chamTone]; paintChameleon(makeChameleon()); if (s.chamLock) lockChameleon(); App.save(); render(); break;
    case "chamLock": if (s.chamLock) s.chamLock = null; else lockChameleon(); App.save(); render(); break;
    case "chamRoll": paintChameleon(makeChameleon()); break;
    case "chord": openChord(el.dataset.c); break;
    case "hear": strumChord(el.dataset.c); break;
    case "closeModal": $("#modal").hidden = true; break;
    case "shift": { const p = prefs(song.id); setPrefs(song.id, { shift: Math.max(-11, Math.min(11, p.shift + +el.dataset.d)) }); render(); break; }
    case "capo": { const p = prefs(song.id); setPrefs(song.id, { capo: Math.max(0, Math.min(9, p.capo + +el.dataset.d)) }); render(); break; }
    case "resetKey": setPrefs(song.id, { shift: 0, capo: 0 }); render(); break;
    case "easy": { const p = prefs(song.id); const best = T.bestCapo(songChords(song).map(c => T.transposeChord(c, p.shift))); setPrefs(song.id, { capo: best.capo }); render(); App.toast(best.capo ? `Capo ${best.capo} gives the easiest shapes` : "Already the easiest shapes"); break; }
    case "fit": {
      const who = s.singers[el.dataset.who];
      if (!song.melody) App.toast("No melody range on this song yet, so I just picked easy shapes. Add it in Edit.");
      if (who.unset) App.toast(`${who.name}'s range isn't measured yet. Using a guess. Try Practice › Range finder.`);
      const fit = T.fitToSinger(songChords(song), song.melody, who);
      setPrefs(song.id, { shift: fit.shift, capo: fit.capo }); render();
      if (song.melody && !who.unset) App.toast(fit.shift === 0 ? `Original key already fits ${who.name}${fit.capo ? " (capo " + fit.capo + " for easier shapes)" : ""}` : `Moved ${fit.shift > 0 ? "up" : "down"} ${Math.abs(fit.shift)} half step${Math.abs(fit.shift) === 1 ? "" : "s"}${fit.capo ? ", capo " + fit.capo : ""} for ${who.name}`);
      break;
    }
    case "view": setPrefs(song.id, { view: el.dataset.v }); render(); break;
    case "font": s.font = Math.max(13, Math.min(34, s.font + +el.dataset.d * 2)); App.save(true); render(); break;
    case "pdfZoom": pdfZoom = Math.max(0.6, Math.min(3, pdfZoom + +el.dataset.d * 0.25)); mountPdf(song); break;
    case "scroll": {
      if (Scroller.on) Scroller.stop(); else Scroller.start();
      const b1 = $("#scrollBtn"), b2 = $("#scrollFab");
      if (b1) b1.textContent = Scroller.on ? "⏸ Pause" : "▶ Scroll";
      if (b2) { b2.textContent = Scroller.on ? "⏸" : "▶"; b2.classList.toggle("on", Scroller.on); }
      break;
    }
    case "spotify": {
      const sp = song.spotify || song.title + " " + (song.artist || "");
      const m = sp.match(/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/);
      location.href = m ? `https://open.spotify.com/${m[1]}/${m[2]}` : `https://open.spotify.com/search/${encodeURIComponent(sp)}`;
      break;
    }
    case "nail": if (s.nailed[song.id]) delete s.nailed[song.id]; else { s.nailed[song.id] = today(); markPractice(15); AudioKit.sfx.win(); App.toast("Nailed it! +15 XP"); } App.save(); render(); break;
    case "pasteClip": try { $("#fBody").value = await navigator.clipboard.readText(); $("#fBody").dispatchEvent(new Event("input")); } catch (err) { App.toast("Long-press the box and tap Paste instead"); } break;
    case "saveSong": saveSongFromForm(); break;
    case "delSong": if (confirm("Delete this song from all your devices?")) { const id = route.q.edit; s.userSongs[id] = { id, deleted: true, updatedAt: Date.now() }; App.save(); go("#/library"); } break;
    case "tunerStart": startTuner(); break;
    case "refTone": AudioKit.playTone(440 * Math.pow(2, (+el.dataset.m - 69) / 12), 2); break;
    case "bpm": metroBpm = Math.max(40, Math.min(200, metroBpm + +el.dataset.d)); $("#bpmVal").textContent = metroBpm; $("#bpmRange").value = metroBpm; AudioKit.Metro.bpm = metroBpm; break;
    case "beats": metroBeats = +el.dataset.n; AudioKit.Metro.beatsPerBar = metroBeats; render(); if (AudioKit.Metro.running) AudioKit.Metro.start(metroBpm, metroBeats, metroBeat); break;
    case "metroToggle": if (AudioKit.Metro.running) { AudioKit.Metro.stop(); el.textContent = "▶ Start"; } else { AudioKit.Metro.start(metroBpm, metroBeats, metroBeat); el.textContent = "⏸ Stop"; } break;
    case "tap": {
      const now = performance.now(); taps = taps.filter(t => now - t < 2500); taps.push(now);
      if (taps.length >= 2) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); metroBpm = Math.round(Math.max(40, Math.min(200, 60000 / iv))); $("#bpmVal").textContent = metroBpm; $("#bpmRange").value = metroBpm; AudioKit.Metro.bpm = metroBpm; }
      break;
    }
    case "flashStart": AudioKit.ctx(); flashStart(); break;
    case "rushStart": AudioKit.ctx(); rushStart(); break;
    case "rushTap": rushCount++; el.textContent = rushCount; AudioKit.sfx.tick(); break;
    case "again": render(); break;
    case "quizPick": Quiz.pick(el); break;
    case "quizAgain": Quiz.start(); break;
    case "lockedLesson": App.toast("Finish the lesson before this one first"); break;
    case "finishLesson": {
      const l = lessonList().find(x => x.id === el.dataset.id);
      const first = !s.lessonsDone[l.id];
      s.lessonsDone[l.id] = today();
      markPractice(first ? (l.boss ? 50 : 20) : 5);
      AudioKit.sfx.win(); App.toast(first ? `Lesson complete! +${l.boss ? 50 : 20} XP` : "+5 XP");
      go("#/path"); break;
    }
    case "rangeCap": {
      const who = el.dataset.who, end = el.dataset.end;
      const notes = [];
      el.textContent = "Listening…";
      AudioKit.Mic.start(f => {
        if (f < 0) return;
        const m = AudioKit.freqToMidi(f); notes.push(m);
        const live = $("#rangeLive"); if (live) live.textContent = T.midiName(Math.round(m));
      }).catch(() => App.toast("Mic blocked"));
      setTimeout(() => {
        AudioKit.Mic.stop();
        if (notes.length < 8) { App.toast("Didn't hear a steady note. Try again a little louder."); render(); return; }
        const sorted = notes.sort((x, y) => x - y), med = Math.round(sorted[Math.floor(sorted.length / 2)]);
        const inp = document.querySelector(`[data-sing="${who}.${end}"]`); if (inp) inp.value = T.midiName(med);
        const comfy = document.querySelector(`[data-sing="${who}.${end === "lo" ? "comfyLo" : "comfyHi"}"]`);
        if (comfy) comfy.value = T.midiName(end === "lo" ? med + 2 : med - 3);
        el.textContent = end === "lo" ? "🎙️ Sing lowest" : "🎙️ Sing highest";
        App.toast("Got " + T.midiName(med) + ". Tap Save ranges when done.");
      }, 2500);
      break;
    }
    case "saveRange": {
      let bad = false;
      document.querySelectorAll("[data-sing]").forEach(inp => {
        const [who, f] = inp.dataset.sing.split("."), v = T.nameToMidi(inp.value);
        if (v == null) bad = true; else { s.singers[who][f] = v; }
      });
      if (bad) return App.toast("Use note names like G2 or C#5");
      for (const k of ["me", "her"]) { const x = s.singers[k]; if (x.lo > x.hi) [x.lo, x.hi] = [x.hi, x.lo]; x.comfyLo = Math.max(x.lo, x.comfyLo); x.comfyHi = Math.min(x.hi, x.comfyHi); }
      s.singers.her.unset = false; s.singersAt = Date.now(); App.save(); App.toast("Ranges saved"); render(); break;
    }
    case "saveSync": {
      s.sync.owner = $("#sOwner").value.trim(); s.sync.repo = $("#sRepo").value.trim();
      try { localStorage.setItem("ms.token", $("#sToken").value.trim()); } catch (err) {}
      App.save(true); await Sync.run(false); render(); break;
    }
  }
});

/* ===================== BOOT ===================== */
function boot() {
  App.load();
  applyTheme();
  document.querySelector("nav.tabs").addEventListener("click", e => { const t = e.target.closest(".tab"); if (t) go("#/" + t.dataset.tab); });
  $("#backBtn").addEventListener("click", back);
  $("#gear").addEventListener("click", () => go("#/settings"));
  render();
  App.setSyncStatus(GH.ready() ? "ok" : "off");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  if (GH.ready()) Sync.run(true);
  window.addEventListener("online", () => Sync.run(true));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") Sync.run(true); });
}
boot();
