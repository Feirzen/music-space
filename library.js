/* =========================================================
   library.js — Library (all songs, filters, lists, inbox),
   Song view, add/import + review, song menu, rating.
   ========================================================= */
const TAGS = [["strum","Strum"],["fingerpick","Fingerpick"],["riff","Riffs"],["power","Power chords"],["3/4","3/4"],["duet","Duets"],
  ["spanish","Spanish"],["hymn","Hymns"],["crowd","Crowd pleasers"],["folk","Folk"],["country","Country"],["band","Band"]];
function songTags(s) {
  const t = new Set(s.tags || []);
  if (s.time === "3/4") t.add("3/4");
  return t;
}
function songLevel(s) { return s.level || (s.set) || 2; }
function knownChords() {
  const k = new Set(INST() === "uke" ? ["C","G","Am","F","Dm","Em","G7","C7","A7","A","D"] : INST() === "piano" ? ["C","F","G","Am","Dm","Em","G7"] : ["G","C","D","Em","Am","E","A","Dm","G7","D7","A7","E7"]);
  markedChords("solid").forEach(c => k.add(c));
  return k;
}
function cupHTML(pct, size = 34, label = true, color = "") {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return `<span class="cup ${p >= 80 ? "full" : ""}" style="--p:${p}%;--s:${size}px${color ? ";--accent:" + color : ""}" aria-label="${p}% mastered"><b></b>${label ? `<i>${p >= 100 ? icon("check", 11) : p}</i>` : ""}</span>`;
}
/* every style tag has its own color; a song wears the color of its most telling tag */
const TAG_COLOR = { strum: "sea", fingerpick: "violet", riff: "pink", power: "pink", "3/4": "sky", duet: "sky", spanish: "coral",
  hymn: "gold", crowd: "ember", folk: "lime", country: "ember", band: "pink" };
const TAG_PRIORITY = ["hymn", "spanish", "duet", "country", "folk", "fingerpick", "band", "power", "riff", "crowd", "3/4", "strum"];
const tagColor = t => TAG_COLOR[t] ? `var(--k-${TAG_COLOR[t]})` : "";
function songColor(s) {
  const t = songTags(s);
  const k = TAG_PRIORITY.find(x => t.has(x));
  return k ? tagColor(k) : "var(--accent)";
}

/* ---------------- LIBRARY ---------------- */
VIEWS.library = {
  title: () => "Library",
  html(ctx) {
    const s = App.state, d = ctx.data;
    d.filters = d.filters || new Set(); d.list = d.list || "all"; d.q = d.q ?? ""; d.level = d.level || "";
    let songs = allSongs().filter(x => x.status !== "review");
    if (d.list === "due") d.list = "all";
    if (d.list !== "all") { const L = s.lists.find(l => l.id === d.list); songs = L ? songs.filter(x => L.songs.includes(x.id)) : songs; }
    const q = norm(d.q);
    if (q) songs = songs.filter(x => norm(x.title + " " + (x.artist || "")).includes(q));
    const known = knownChords();
    for (const f of d.filters) {
      if (f === "mastered") songs = songs.filter(x => bestPct(x.id) >= 80);
      else if (f === "learning") songs = songs.filter(x => bestPct(x.id) > 0 && bestPct(x.id) < 80);
      else if (f === "known") songs = songs.filter(x => { const c = songChords(x); return c.length && c.every(ch => known.has(ch) || known.has(ch.replace(/\/.*/, ""))); });
      else if (f === "ri") songs = songs.filter(x => {
        const p = person("ri"); if (!x.melody || !p) return false;
        const o = T.keyOptions(songChords(x), x.melody, p)[0];
        return o && T.rangeCost(x.melody[0] + o.shift, x.melody[1] + o.shift, p) < 2;
      });
      else songs = songs.filter(x => songTags(x).has(f));
    }
    if (d.level) songs = songs.filter(x => { const l = songLevel(x); return d.level === "easy" ? l <= 2 : d.level === "mid" ? l === 3 : l >= 4; });
    songs.sort((a, b) => a.title.localeCompare(b.title));
    const inbox = Object.values(s.userSongs).filter(x => !x.deleted && songHere(x) && (x.status === "review" || x.polish));
    const listTabs = [["all", "All songs"], ...s.lists.map(l => [l.id, l.name])];
    const FILTER_LABELS = Object.fromEntries([...TAGS, ["mastered", "Mastered"], ["learning", "Learning"], ["known", "Chords I know"], ["ri", "Fits Ri"]]);
    const nActive = d.filters.size + (d.level ? 1 : 0);
    const chip = (k, l) => `<button class="chip ${tagColor(k) ? "tint" : ""} ${d.filters.has(k) ? "on" : ""}" ${tagColor(k) ? `style="--accent:${tagColor(k)}"` : ""} data-act="libFilter" data-k="${k}">${l}</button>`;
    return `${!GH.ready() && typeof Unlock !== "undefined" && Unlock.blob ? unlockCardHTML() : ""}
      <div class="libTop">
        <label class="searchBox">${icon("search", 18)}<input id="libSearch" type="search" placeholder="Search songs" value="${esc(d.q)}" data-input="libSearch" aria-label="Search songs"></label>
        <button class="btn on" data-act="go" data-h="#/import">${icon("plus", 18)} Add song</button>
      </div>
      ${inbox.length ? `<details class="inbox"><summary>${icon("inbox", 18)} Inbox <span class="count">${inbox.length}</span></summary>
        <div class="songList">${inbox.map(x => `<button class="songRow" data-act="go" data-h="${x.status === "review" ? "#/import?edit=" + encodeURIComponent(x.id) : "#/song/" + encodeURIComponent(x.id)}">
          <span class="srMain"><b>${esc(x.title)}</b><small>${x.status === "review" ? "Waiting for your review" : "Flagged for Claude to polish"}</small></span></button>`).join("")}</div></details>` : ""}
      <div class="tabRow" role="tablist">${listTabs.map(([k, l]) => `<button class="pillTab ${d.list === k ? "on" : ""}" data-act="libList" data-k="${k}">${esc(l)}</button>`).join("")}
        <button class="pillTab ghost" data-act="newList">${icon("plus", 14)} New list</button></div>
      <div class="chips filterRow">
        <button class="chip ${d.showFilters || nActive ? "on" : ""}" data-act="libFilters" aria-expanded="${!!d.showFilters}">${icon("filter", 16)} Filter${nActive ? " · " + nActive : ""}</button>
        ${d.showFilters ? "" : [...d.filters].map(k => `<button class="chip on ${tagColor(k) ? "tint" : ""}" ${tagColor(k) ? `style="--accent:${tagColor(k)}"` : ""} data-act="libFilter" data-k="${k}">${esc(FILTER_LABELS[k] || k)} ${icon("close", 13)}</button>`).join("")}
        ${!d.showFilters && d.level ? `<button class="chip on" data-act="libLevelClear">${{ easy: "Easy", mid: "Medium", hard: "Hard" }[d.level]} ${icon("close", 13)}</button>` : ""}
        ${!d.showFilters && nActive > 1 ? `<button class="chip ghost" data-act="libClear">Clear</button>` : ""}
      </div>
      ${d.showFilters ? `<div class="filterPanel">
        <div class="fpLabel">Style</div><div class="chips">${TAGS.map(([k, l]) => chip(k, l)).join("")}</div>
        <div class="fpLabel">Progress</div><div class="chips">${chip("mastered", "Mastered")}${chip("learning", "Learning")}${INST() !== "voice" ? chip("known", "Chords I know") : ""}${chip("ri", "Fits Ri")}</div>
        <div class="fpLabel">Difficulty</div><div class="chips">${[["", "Any"], ["easy", "Easy"], ["mid", "Medium"], ["hard", "Hard"]].map(([v, l]) => `<button class="chip ${d.level === v ? "on" : ""}" data-act="libLevelSet" data-v="${v}">${l}</button>`).join("")}</div>
        <div class="row"><button class="btn on" data-act="libFilters">${icon("check", 16)} Done</button>${nActive ? `<button class="btn ghost" data-act="libClear">Clear all</button>` : ""}</div>
      </div>` : ""}
      <div class="libCount muted">${songs.length} song${songs.length === 1 ? "" : "s"}</div>
      <div class="songList">${songs.map(songRow).join("") || `<div class="empty">No songs match. Try fewer filters.</div>`}</div>
      <p class="hint center">${INST() === "guitar" ? "Built-in songs are public domain. Yours live in your private repo." : `Your ${INSTRUMENTS[INST()].word} library. Copy any guitar song over from its ⋯ menu, or add sheets here.`}</p>`;
  },
  mount(ctx) {
    const inp = $("#libSearch", ctx.root);
    if (ctx.data.focus) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); ctx.data.focus = false; }
  },
};
function songRow(x) {
  const p = bestPct(x.id);
  const tags = [...songTags(x)].sort((a, b) => TAG_PRIORITY.indexOf(a) - TAG_PRIORITY.indexOf(b)).slice(0, 3);
  return `<div class="songRow" style="--accent:${songColor(x)}">
    <button class="srHit" data-act="go" data-h="#/song/${encodeURIComponent(x.id)}" aria-label="Open ${esc(x.title)}"></button>
    ${cupHTML(p, 34)}
    <span class="srMain"><b>${esc(x.title)}</b><small>${esc(x.artist || "")}</small>
      <span class="srChips">${x.key ? `<span class="tag">${esc(x.key)}</span>` : ""}${tags.map(t => `<span class="tag tint" style="--accent:${tagColor(t) || "var(--dim)"}">${esc(t)}</span>`).join("")}${!x.body && x.type !== "pdf" ? `<span class="tag warn">needs sheet</span>` : ""}</span></span>
    <button class="iconBtn small" data-act="songMenu" data-id="${esc(x.id)}" aria-label="More for ${esc(x.title)}">${icon("more", 20)}</button>
  </div>`;
}
ACT.libSearch = (el, ctx) => { ctx.data.q = el.value; ctx.data.focus = true; renderCtx(ctx); };
ACT.libFilter = (el, ctx) => { const f = ctx.data.filters; f.has(el.dataset.k) ? f.delete(el.dataset.k) : f.add(el.dataset.k); AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.libList = (el, ctx) => { ctx.data.list = el.dataset.k; renderCtx(ctx); };
ACT.libLevel = (el, ctx) => { ctx.data.level = el.value; renderCtx(ctx); };
ACT.libFilters = (el, ctx) => { ctx.data.showFilters = !ctx.data.showFilters; AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.libLevelSet = (el, ctx) => { ctx.data.level = el.dataset.v; renderCtx(ctx); };
ACT.libLevelClear = (el, ctx) => { ctx.data.level = ""; renderCtx(ctx); };
ACT.libClear = (el, ctx) => { ctx.data.filters = new Set(); ctx.data.level = ""; renderCtx(ctx); };
ACT.newList = () => Modal.open(`<h3>New list</h3><label class="field">Name<input id="newListName" placeholder="Crowd pleasers" maxlength="40"></label>
  <div class="row"><button class="btn on" data-act="createList">Create</button><button class="btn ghost" data-act="closeModal">Cancel</button></div>`);
ACT.createList = () => {
  const name = ($("#newListName").value || "").trim();
  if (!name) return App.toast("Give the list a name");
  App.state.lists.push({ id: uid(), name, songs: [], at: Date.now() });
  App.save(); Modal.close(); if (Router.ctx) renderCtx(Router.ctx);
};
ACT.songMenu = el => {
  const s = getSong(el.dataset.id), lists = App.state.lists;
  Modal.open(`<h3>${esc(s.title)}</h3>
    <div class="menuList">
      ${lists.length ? lists.map(l => `<label class="check"><input type="checkbox" data-change="toggleInList" data-l="${l.id}" data-id="${esc(s.id)}" ${l.songs.includes(s.id) ? "checked" : ""}> ${esc(l.name)}</label>`).join("") : `<p class="hint">No lists yet.</p>`}
      <button class="btn ghost" data-act="newList">${icon("plus", 16)} New list</button>
      ${s.type ? Object.keys(INSTRUMENTS).filter(k => k !== songInst(s) && k !== "voice").map(k => `<button class="btn ghost" data-act="copyTo" data-id="${esc(s.id)}" data-k="${k}">${icon("plus", 16)} Copy to ${INSTRUMENTS[k].label}</button>`).join("") : ""}
      ${s.type ? `<button class="btn ghost" data-act="togglePolish" data-id="${esc(s.id)}">${icon("sparkle", 16)} ${s.polish ? "Unflag for Claude" : "Ask Claude to polish"}</button>
        <button class="btn ghost" data-act="go" data-h="#/import?edit=${encodeURIComponent(s.id)}">${icon("sliders", 16)} Edit details</button>
        <button class="btn ghost danger" data-act="delSong" data-id="${esc(s.id)}">${icon("trash", 16)} Delete</button>` : ""}
    </div><button class="btn ghost full" data-act="closeModal">Done</button>`);
};
ACT.copyTo = el => {
  const s = getSong(el.dataset.id), k = el.dataset.k;
  if (!s) return;
  const dupe = Object.values(App.state.userSongs).find(x => !x.deleted && songInst(x) === k && norm(x.title) === norm(s.title));
  if (dupe) { Modal.close(); return App.toast(`Already in your ${INSTRUMENTS[k].word} library`); }
  const id = norm(s.title).replace(/ /g, "-").slice(0, 40) + "-" + k + "-" + Date.now().toString(36).slice(-3);
  const copy = { ...s, id, inst: k, updatedAt: Date.now(), polish: false };
  if (k === "piano") copy.sheetCapo = 0;
  App.state.userSongs[id] = copy;
  App.save(); Modal.close(); AudioKit.sfx.good();
  App.toast(`Copied to your ${INSTRUMENTS[k].word} library. Switch to ${INSTRUMENTS[k].label} up top to see it.`);
};
ACT.toggleInList = el => {
  const L = App.state.lists.find(l => l.id === el.dataset.l); if (!L) return;
  const id = el.dataset.id;
  L.songs = el.checked ? [...new Set([...L.songs, id])] : L.songs.filter(x => x !== id);
  L.at = Date.now(); App.save();
};
ACT.togglePolish = el => {
  const s = App.state.userSongs[el.dataset.id]; if (!s) return;
  s.polish = !s.polish; s.updatedAt = Date.now(); App.save(); Modal.close();
  App.toast(s.polish ? "Flagged. I'll polish it next time we talk." : "Unflagged");
  if (Router.ctx) renderCtx(Router.ctx);
};
ACT.delSong = el => Modal.open(`<h3>Delete this song?</h3><p>It disappears from all your devices.</p>
  <div class="row"><button class="btn danger on" data-act="delSongYes" data-id="${esc(el.dataset.id)}">Delete</button><button class="btn ghost" data-act="closeModal">Keep it</button></div>`);
ACT.delSongYes = el => {
  const id = el.dataset.id;
  App.state.userSongs[id] = { id, deleted: true, updatedAt: Date.now() };
  App.save(); Modal.close(); Router.go("#/library"); Spot.soon();
};

/* ---------------- SONG VIEW ---------------- */
function prefs(id) {
  const p = App.state.songPrefs[ik(id)] || { shift: 0, capo: 0, view: "strum", singers: [] };
  return INST() === "piano" ? { ...p, capo: 0, view: "strum" } : INST() === "uke" ? { ...p, view: "strum" } : p;
}
function setPrefs(id, p) { App.state.songPrefs[ik(id)] = { ...prefs(id), ...p, at: Date.now() }; App.save(); }
function combinedSinger(ids) {
  const ps = (ids || []).map(person).filter(Boolean);
  if (!ps.length) return null;
  if (ps.length === 1) return ps[0];
  return { lo: Math.max(...ps.map(p => p.lo)), hi: Math.min(...ps.map(p => p.hi)), comfyLo: Math.max(...ps.map(p => p.comfyLo)), comfyHi: Math.min(...ps.map(p => p.comfyHi)) };
}
const Scroller = {
  on: false, speed: 18, raf: 0, last: 0, acc: 0, el: null,
  start(el) {
    this.el = el || null; this.on = true; this.last = performance.now(); this.acc = 0;
    const step = now => {
      if (!this.on) return;
      this.acc += this.speed * ((now - this.last) / 1000); this.last = now;
      if (this.acc >= 1) { const n = Math.floor(this.acc); this.el ? this.el.scrollBy(0, n) : window.scrollBy(0, n); this.acc -= n; }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
    try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => this.lock = l).catch(() => {}); } catch (e) {}
  },
  stop() { this.on = false; cancelAnimationFrame(this.raf); try { this.lock && this.lock.release(); } catch (e) {} this.lock = null; },
};

VIEWS.song = {
  title: ctx => (getSong(ctx.arg) || {}).title || "Song",
  html(ctx) {
    const song = getSong(ctx.arg);
    if (!song) return `<p class="empty">Song not found. It may still be syncing.</p>`;
    const p = prefs(song.id), d = ctx.data, s = App.state;
    if (song.type === "pdf" || d.showPdf) return pdfHTML(song, ctx);
    const kr = keyRoot(song), minor = isMinorKey(song);
    const shapeRoot = T.mod12(kr + p.shift - p.capo), soundRoot = T.mod12(kr + p.shift);
    const nm = r => T.transposeChord(T.SHARPS[kr] + (minor ? "m" : ""), r - kr, r);
    const singers = (p.singers || []).map(person).filter(Boolean);
    const fits = singers.map(sg => { const f = T.describeFit(song.melody, p.shift, sg); return f ? `<span class="fit ${f.comfy ? "ok" : f.ok ? "" : "bad"}">${esc(sg.name)}: ${f.text}</span>` : ""; }).join("");
    const panel = d.panel || "";
    const chords = [...new Set(songChords(song))].map(c => T.transposeChord(c, p.shift - p.capo, shapeRoot));
    const best = bestPct(song.id);
    return `
      <div class="songHead">
        <div class="muted">${esc(song.artist || "")}${song.time ? " · " + esc(song.time) : ""}${song.bpm ? " · ~" + song.bpm + " bpm" : ""}</div>
        <div class="keyLine">Key <b>${esc(nm(soundRoot))}</b>${p.capo ? ` · capo <b>${p.capo}</b> · play <b>${esc(nm(shapeRoot))}</b> shapes` : ""}${p.shift ? ` <span class="muted">(${p.shift > 0 ? "+" : ""}${p.shift})</span>` : ""}</div>
        ${song.note ? `<p class="sheetNote">${esc(song.note)}</p>` : ""}
        ${song.tuning && INST() === "guitar" && !/standard|^e\s*a\s*d\s*g\s*b\s*e$/i.test(song.tuning.trim()) ? `<p class="sheetNote">Tuning: ${esc(song.tuning)}. The chords here are what you'd play in standard tuning, just slightly off from the recording.</p>` : ""}
        ${fits ? `<div class="fits">${fits}</div>` : ""}
      </div>
      ${spotBarHTML(song)}
      <div class="songBar five" role="toolbar">
        ${[["transpose","transpose","Transpose","var(--accent)"],["singers","singers","Singers","var(--k-alt)"],["saved","bookmark","Saved","var(--k-gold)"],["takes","rec","Takes","var(--k-sky)"],["play","sliders","Play","var(--k-violet)"]].map(([k, ic, l, c]) =>
          `<button class="barBtn ${panel === k ? "on" : ""} ${k === "singers" && singers.length ? "lit" : ""}" ${c !== "var(--accent)" ? `style="--accent:${c}"` : ""} data-act="songPanel" data-k="${k}">${icon(ic, 20)}<span>${l}</span></button>`).join("")}
      </div>
      ${panel ? `<div class="panel">${songPanelHTML(panel, song, p, ctx)}</div>` : ""}
      <div class="chordStrip">${chords.map(c => `<button class="miniChord" data-act="chord" data-c="${esc(c)}">${markDot(c)}${chordSVG(c, 0.6)}<span>${esc(c)}</span></button>`).join("")}</div>
      ${INST() === "guitar" ? `<div class="seg big" role="tablist">
        <button class="${p.view !== "pick" ? "on" : ""}" data-act="songView" data-v="strum">${icon("guitar", 18)} Strum</button>
        <button class="${p.view === "pick" ? "on" : ""}" data-act="songView" data-v="pick">${icon("hand", 18)} Fingerpick</button>
      </div>` : ""}
      ${p.view === "pick" ? pickHTML(song, p) : song.strum && INST() !== "piano" ? `<div class="strumBox"><div class="strumPat">${esc(song.strum)}</div>${song.strumTip ? `<div class="hint">${esc(song.strumTip)}</div>` : ""}</div>` : ""}
      ${song.body ? `<div class="sheet" style="font-size:${s.font}px">${renderSheet(song.body, p.shift - p.capo, shapeRoot)}</div>`
        : `<div class="card"><p>This song card is waiting for its chord sheet. Add it once and it's yours, offline.</p><button class="btn on" data-act="go" data-h="#/import?fill=${encodeURIComponent(song.id)}">${icon("upload", 18)} Add the sheet</button></div>`}
      <div class="songFoot">
        <div class="masteryRow" style="--accent:${songColor(song)}">${cupHTML(best, 46)}<div><b>${best ? best + "% best" : "Not rated yet"}</b><div class="hint">${best >= 80 ? "Mastered. It'll come back for a light review." : "Play it through twice, then rate it."}</div></div></div>
        <div class="row wrap center">
          <button class="btn on" data-act="rateSong" data-id="${esc(song.id)}">${icon("star", 18)} Rate a run-through</button>
          ${song.file ? `<button class="btn" data-act="togglePdf">${icon("file", 18)} See original PDF</button>` : ""}
          <button class="btn ghost" data-act="songMenu" data-id="${esc(song.id)}">${icon("list", 18)} Lists & more</button>
        </div>
      </div>
      <button class="fab ${Scroller.on ? "on" : ""}" id="scrollFab" data-act="scroll" aria-label="Autoscroll">${icon(Scroller.on ? "pause" : "play", 24)}</button>`;
  },
  mount(ctx) {
    ctx.cleanups.push(() => Scroller.stop());
    const sp = $("#scrollSpeed", ctx.root);
    if (sp) sp.addEventListener("input", () => Scroller.speed = +sp.value);
    const song = getSong(ctx.arg);
    if (song && (song.type === "pdf" || ctx.data.showPdf)) mountPdf(song, ctx);
    if (song && !ctx.data.showPdf && song.type !== "pdf") SpotUI.mount(song, ctx);
    ctx.cleanups.push(() => { if (TakePlayer.audio) TakePlayer.audio.pause(); });
  },
};
function songPanelHTML(k, song, p, ctx) {
  if (k === "transpose") {
    const kr = keyRoot(song), minor = isMinorKey(song);
    const keyName = T.transposeChord(T.SHARPS[kr] + (minor ? "m" : ""), p.shift, T.mod12(kr + p.shift));
    const opts = ctx.data.opts;
    return `<div class="stepRow"><span>Key</span><button class="stepBtn" data-act="shift" data-d="-1" aria-label="Key down">${icon("minus", 18)}</button><b>${esc(keyName)}</b><button class="stepBtn" data-act="shift" data-d="1" aria-label="Key up">${icon("plus", 18)}</button></div>
      ${INST() === "piano" ? "" : `<div class="stepRow"><span>Capo</span><button class="stepBtn" data-act="capo" data-d="-1" aria-label="Capo down">${icon("minus", 18)}</button><b>${p.capo || "None"}</b><button class="stepBtn" data-act="capo" data-d="1" aria-label="Capo up">${icon("plus", 18)}</button></div>`}
      <button class="btn on full" data-act="easiest">${icon("refresh", 18)} ${INST() === "piano" ? "Easiest keys" : "Easiest shapes"}${opts ? ` · option ${opts.i + 1} of ${opts.list.length}` : ""}</button>
      <p class="hint">${(p.singers || []).length ? "Locked to your singers' range. Tap again to cycle through other easy options." : "Tap again to cycle options. Turn on a singer to keep it in their range."}</p>
      <button class="btn ghost" data-act="resetKey">${icon("refresh", 16)} Back to original</button>`;
  }
  if (k === "singers") {
    const on = new Set(p.singers || []);
    return `<div class="chips">${App.state.people.map(sg => `<button class="chip ${on.has(sg.id) ? "on" : ""}" data-act="toggleSinger" data-id="${sg.id}">${icon("user", 14)} ${esc(sg.name)}</button>`).join("")}</div>
      <p class="hint">${song.melody ? "Turn on one or more singers and the key moves to fit. Easiest shapes then only picks capo options inside that range." : "This song has no melody range yet. Add one in Edit details, or flag it for Claude to polish."}</p>
      <button class="btn ghost" data-act="tool" data-tool="range">${icon("wave", 16)} Range finder</button>`;
  }
  if (k === "takes") return takesPanelHTML(song);
  if (k === "saved") {
    const saved = p.saved || [];
    return `${saved.length ? `<div class="menuList">${saved.map((v, i) => `<div class="savedRow"><button class="btn ghost grow" data-act="applySaved" data-i="${i}">${icon("bookmark", 16)} ${esc(v.name)} <small class="muted">${v.capo ? "capo " + v.capo : ""} ${v.shift ? (v.shift > 0 ? "+" : "") + v.shift : ""}</small></button><button class="iconBtn small" data-act="delSaved" data-i="${i}" aria-label="Delete">${icon("trash", 16)}</button></div>`).join("")}</div>` : `<p class="hint">No saved versions yet.</p>`}
      <div class="row"><input id="saveName" placeholder="Name this version, like Ri's key" maxlength="40" aria-label="Version name"><button class="btn on" data-act="saveVersion">Save</button></div>`;
  }
  return `<div class="stepRow"><span>Scroll speed</span><input id="scrollSpeed" type="range" min="4" max="70" value="${Scroller.speed}" aria-label="Scroll speed"></div>
    <div class="stepRow"><span>Text</span><button class="stepBtn" data-act="font" data-d="-1" aria-label="Smaller text">A−</button><b>${App.state.font}</b><button class="stepBtn" data-act="font" data-d="1" aria-label="Bigger text">A+</button></div>
    ${Spot.connected() ? `<p class="hint">Use the Spotify bar above to play and pause the original.</p>` : `<button class="btn full" data-act="spotify">${icon("headphones", 18)} Open the original in Spotify</button><p class="hint">Connect Spotify in Settings to play and pause right here.</p>`}`;
}
ACT.songPanel = (el, ctx) => { ctx.data.panel = ctx.data.panel === el.dataset.k ? "" : el.dataset.k; ctx.data.opts = null; AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.shift = (el, ctx) => { const p = prefs(ctx.arg); setPrefs(ctx.arg, { shift: Math.max(-11, Math.min(11, p.shift + +el.dataset.d)) }); ctx.data.opts = null; renderCtx(ctx); };
ACT.capo = (el, ctx) => { const p = prefs(ctx.arg); setPrefs(ctx.arg, { capo: Math.max(0, Math.min(9, p.capo + +el.dataset.d)) }); ctx.data.opts = null; renderCtx(ctx); };
ACT.resetKey = (el, ctx) => { setPrefs(ctx.arg, { shift: 0, capo: 0 }); ctx.data.opts = null; renderCtx(ctx); };
ACT.easiest = (el, ctx) => {
  const song = getSong(ctx.arg), p = prefs(song.id);
  let o = ctx.data.opts;
  if (!o) {
    const list = T.keyOptions(songChords(song), song.melody, combinedSinger(p.singers), p.shift);
    const curI = list.findIndex(x => x.shift === p.shift && x.capo === p.capo);
    o = ctx.data.opts = { list, i: curI === 0 ? 1 % list.length : 0 };
  } else o.i = (o.i + 1) % o.list.length;
  const pick = o.list[o.i];
  setPrefs(song.id, { shift: pick.shift, capo: pick.capo });
  AudioKit.sfx.tap(); renderCtx(ctx);
};
ACT.toggleSinger = (el, ctx) => {
  const song = getSong(ctx.arg), p = prefs(song.id);
  const on = new Set(p.singers || []);
  on.has(el.dataset.id) ? on.delete(el.dataset.id) : on.add(el.dataset.id);
  const singers = [...on];
  const sg = combinedSinger(singers);
  const patch = { singers };
  if (sg && song.melody) { const best = T.keyOptions(songChords(song), song.melody, sg, p.shift)[0]; Object.assign(patch, { shift: best.shift, capo: best.capo }); }
  setPrefs(song.id, patch); ctx.data.opts = null;
  const g = person(el.dataset.id);
  if (on.has(el.dataset.id) && g && g.guess) App.toast(`${g.name}'s range is a guess until you test it in Range finder`);
  renderCtx(ctx);
};
ACT.saveVersion = (el, ctx) => {
  const name = ($("#saveName", ctx.root).value || "").trim() || "Saved " + new Date().toLocaleDateString();
  const p = prefs(ctx.arg);
  setPrefs(ctx.arg, { saved: [...(p.saved || []), { name, shift: p.shift, capo: p.capo, singers: p.singers || [], pattern: p.pattern || null }] });
  App.toast("Saved " + name); renderCtx(ctx);
};
ACT.applySaved = (el, ctx) => { const v = prefs(ctx.arg).saved[+el.dataset.i]; setPrefs(ctx.arg, { shift: v.shift, capo: v.capo, singers: v.singers || [], pattern: v.pattern || prefs(ctx.arg).pattern }); renderCtx(ctx); };
ACT.delSaved = (el, ctx) => { const s = [...(prefs(ctx.arg).saved || [])]; s.splice(+el.dataset.i, 1); setPrefs(ctx.arg, { saved: s }); renderCtx(ctx); };
ACT.songView = (el, ctx) => { setPrefs(ctx.arg, { view: el.dataset.v }); AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.pattern = (el, ctx) => { setPrefs(ctx.arg, { pattern: el.dataset.k }); AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.font = (el, ctx) => { App.state.font = Math.max(13, Math.min(34, App.state.font + +el.dataset.d * 2)); App.save(true); renderCtx(ctx); };
ACT.spotify = (el, ctx) => { const s = getSong(ctx.arg); openSpotify(s.spotify, s.title + " " + (s.artist || "")); };
ACT.scroll = (el, ctx) => {
  if (Scroller.on) Scroller.stop(); else Scroller.start(ctx.sheet ? $("#sheetBody") : null);
  const f = $("#scrollFab", ctx.root); if (f) { f.innerHTML = icon(Scroller.on ? "pause" : "play", 24); f.classList.toggle("on", Scroller.on); }
};
ACT.togglePdf = (el, ctx) => { ctx.data.showPdf = !ctx.data.showPdf; renderCtx(ctx); };

function renderSheet(body, semis, shapeRoot) {
  return body.split("\n").map(line => {
    if (/^#\s/.test(line)) return `<h3 class="sec">${esc(line.slice(2))}</h3>`;
    if (!line.trim()) return `<div class="gap"></div>`;
    if (/^\s*[eBGDAE]\s*\|/.test(line)) return `<pre class="tabline">${esc(line)}</pre>`;
    if (!/\[[^\]]+\]/.test(line)) return `<div class="ln"><span class="seg"><span class="ch"> </span><span class="ly">${esc(line)}</span></span></div>`;
    const parts = line.split(/\[([^\]]+)\]/);
    let html = parts[0] ? `<span class="seg"><span class="ch"> </span><span class="ly">${esc(parts[0])}</span></span>` : "";
    for (let i = 1; i < parts.length; i += 2) {
      const raw = parts[i], text = parts[i + 1] || "", isC = T.isChord(raw);
      const c = isC ? T.transposeChord(raw, semis, shapeRoot) : raw;
      html += `<span class="seg"><span class="ch">${isC ? `<button class="chordBtn" data-act="chord" data-c="${esc(c)}">${esc(c)}</button>` : esc(c)}</span><span class="ly">${text ? esc(text) : "&nbsp;"}</span></span>`;
    }
    return `<div class="ln">${html}</div>`;
  }).join("");
}
function pickHTML(song, p) {
  const shapeRoot = T.mod12(keyRoot(song) + p.shift - p.capo);
  const three = song.time === "3/4";
  const keys = Object.keys(T.PATTERNS).filter(k => (T.PATTERNS[k].time === "3/4") === three || k === "hybrid");
  const pk = keys.includes(p.pattern) ? p.pattern : keys.includes(song.pick) ? song.pick : keys[0];
  const pat = T.PATTERNS[pk];
  const chords = [...new Set(songChords(song).map(c => T.transposeChord(c, p.shift - p.capo, shapeRoot)))];
  return `<div class="pickBox">
    <div class="chips">${keys.map(k => `<button class="chip ${k === pk ? "on" : ""}" data-act="pattern" data-k="${k}">${esc(T.PATTERNS[k].label)}</button>`).join("")}</div>
    <p class="pickBlurb">${esc(pat.blurb)}</p>
    <div class="hint">Counts: ${pat.counts}. Same pattern for every chord.</div>
    <div class="tabRow">${chords.map(c => `<div class="tabCard"><div class="tabName">${esc(c)}</div><pre>${esc(T.patternTab(c, pk) || "")}</pre></div>`).join("")}</div>
  </div>`;
}

/* ---------------- PDF view ---------------- */
function pdfHTML(song, ctx) {
  return `<div class="songBar">
      <button class="barBtn" data-act="pdfZoom" data-d="-1">${icon("minus", 20)}<span>Smaller</span></button>
      <button class="barBtn" data-act="pdfZoom" data-d="1">${icon("plus", 20)}<span>Bigger</span></button>
      <button class="barBtn" data-act="spotify">${icon("headphones", 20)}<span>Original</span></button>
      ${song.body ? `<button class="barBtn on" data-act="togglePdf">${icon("guitar", 20)}<span>Back to chords</span></button>` : `<button class="barBtn" data-act="rateSong" data-id="${esc(song.id)}">${icon("star", 20)}<span>Rate</span></button>`}
    </div>
    <div id="pdfPages" class="pdfPages"><p class="hint center">Loading PDF…</p></div>
    <button class="fab" id="scrollFab" data-act="scroll" aria-label="Autoscroll">${icon("play", 24)}</button>`;
}
let pdfZoom = 1;
ACT.pdfZoom = (el, ctx) => { pdfZoom = Math.max(0.6, Math.min(3, pdfZoom + +el.dataset.d * 0.25)); mountPdf(getSong(ctx.arg), ctx); };
async function renderPdfInto(blob, box, zoom = 1) {
  const lib = await Importer.loadPdfLib();
  const doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  box.innerHTML = "";
  const w = Math.min(box.clientWidth || window.innerWidth, 1400) * zoom;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i), v1 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: (w / v1.width) * (window.devicePixelRatio || 1) });
    const cv = document.createElement("canvas");
    cv.width = vp.width; cv.height = vp.height; cv.style.width = w + "px";
    box.appendChild(cv);
    await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
  }
}
async function mountPdf(song, ctx) {
  const box = $("#pdfPages", ctx.root);
  try {
    const blob = await IDB.get(song.file);
    if (!blob) { box.innerHTML = `<p class="empty">This PDF isn't on this device yet. Get online and it will sync down.</p>`; return; }
    await renderPdfInto(blob, box, pdfZoom);
  } catch (e) { box.innerHTML = `<p class="empty">${esc(e.message)}</p>`; }
}

/* ---------------- RATE A RUN-THROUGH (sheet) ---------------- */
ACT.rateSong = (el, ctx) => Sheet.open("rate", el.dataset.id, { lesson: el.dataset.lesson || "" });
VIEWS.rate = {
  title: ctx => "Rate " + ((getSong(ctx.arg) || {}).title || "song"),
  html(ctx) {
    const s = getSong(ctx.arg), d = ctx.data;
    d.v = d.v || { changes: 70, rhythm: 70, sing: 60, sang: true };
    const v = d.v, score = Math.round((v.changes + v.rhythm) / 2), sc = songColor(s);
    const slider = (k, label, help) => `<div class="rateRow"><div class="rateHead"><b>${label}</b><span class="rateVal">${v[k]}%</span></div>
      <input type="range" min="0" max="100" step="5" value="${v[k]}" data-input="rateSlide" data-k="${k}" aria-label="${label}"><div class="hint">${help}</div></div>`;
    const days = attemptDays(s.id);
    return `<p class="lead">Play ${esc(s.title)} start to finish twice, then be honest.</p>
      ${INST() === "voice" ? slider("changes", "Pitch", "On the notes? 100 means nothing drifted flat or sharp.") + slider("rhythm", "Entrances and timing", "Came in on time after every gap and solo.")
      : `${slider("changes", "Chord changes", "Clean and on time? 100 means no stalls or buzzes.")}
      ${slider("rhythm", INST() === "piano" ? "Rhythm" : "Rhythm and strum", "Steady pattern, no stopping when you miss.")}
      <label class="check"><input type="checkbox" data-change="rateSang" ${v.sang ? "checked" : ""}> I sang along</label>
      ${v.sang ? slider("sing", "Singing while playing", "Tracked separately so it never holds your guitar progress back.") : ""}`}
      <div class="scoreBig" style="--accent:${sc}">${cupHTML(score, 64)}<div><b>${score}% ${INSTRUMENTS[INST()].word} score</b><div class="hint">${score >= 80 ? "That clears the 80% bar." : "80% clears a lesson. Days tried so far: " + days + "."}</div></div></div>
      <button class="btn on full" data-act="saveRating">${icon("check", 18)} Save rating</button>`;
  },
};
ACT.rateSlide = (el, ctx) => {
  const v = ctx.data.v; v[el.dataset.k] = +el.value;
  el.closest(".rateRow").querySelector(".rateVal").textContent = el.value + "%";
  const score = Math.round((v.changes + v.rhythm) / 2);
  const box = $(".scoreBig", ctx.root);
  if (box) box.innerHTML = `${cupHTML(score, 64)}<div><b>${score}% ${INSTRUMENTS[INST()].word} score</b><div class="hint">${score >= 80 ? "That clears the 80% bar." : "80% clears a lesson. Days tried so far: " + attemptDays(ctx.arg) + "."}</div></div>`;
};
ACT.rateSang = (el, ctx) => { ctx.data.v.sang = el.checked; renderCtx(ctx); };
ACT.saveRating = (el, ctx) => {
  const v = ctx.data.v, score = Math.round((v.changes + v.rhythm) / 2), id = ctx.arg;
  const firstMaster = bestPct(id) < 80 && score >= 80;
  recordSession(id, score, v.sang && INST() !== "voice" ? v.sing : null);
  addXP(5 + Math.round(score / 20));
  if (firstMaster) { AudioKit.sfx.done(); App.toast("Mastered! It joins your review rotation."); } else { AudioKit.sfx.good(); App.toast(`Saved: ${score}%`); }
  Sheet.close();
  if (Router.ctx) renderCtx(Router.ctx);
};

/* ---------------- ADD / IMPORT / REVIEW ---------------- */
VIEWS.import = {
  title: ctx => ctx.q.edit ? "Review song" : "Add a song",
  html(ctx) {
    const d = ctx.data;
    if (!d.draft && (ctx.q.edit || ctx.q.fill)) {
      const base = getSong(ctx.q.edit || ctx.q.fill);
      if (base && BUILTIN_SONGS.includes(base)) return `<p class="empty">Built-in songs can't be edited, but you can change key, capo and view on the song itself.</p>`;
      if (base) d.draft = { ...base, capo: base.sheetCapo ?? null, body: Importer.transposeBody(base.body || "", -(base.sheetCapo || 0)),
        key: base.key && T.isChord(base.key) ? T.transposeChord(base.key, -(base.sheetCapo || 0)) : base.key };
      if (ctx.q.fill && base) d.stage = "input";
      else if (base) d.stage = "review";
    }
    if (!d.draft && ctx.q.title) {
      const h = hintFor(ctx.q.title);
      d.draft = { title: ctx.q.title, ...(h ? { artist: h.artist, spotify: h.spotify, bpm: h.bpm, time: h.time, level: h.level, tags: h.tags } : {}) };
    }
    if (!d.stage) d.stage = "input";
    if (d.stage === "input") return importInputHTML(ctx);
    if (d.stage === "bulk") return bulkHTML(ctx);
    return importReviewHTML(ctx);
  },
  mount(ctx) {
    const f = $("#pdfIn", ctx.root);
    if (f) f.addEventListener("change", () => f.files.length && handleFiles([...f.files], ctx));
    const drop = $("#drop", ctx.root);
    if (drop) {
      ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
      ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("over")));
      drop.addEventListener("drop", e => { e.preventDefault(); const files = [...e.dataTransfer.files].filter(x => /pdf$/i.test(x.type) || /\.pdf$/i.test(x.name)); if (files.length) handleFiles(files, ctx); });
    }
    if (ctx.data.stage === "review" && ctx.data.showOrig && ctx.data.pdfBlob) renderPdfInto(ctx.data.pdfBlob, $("#origPdf", ctx.root), 1).catch(() => {});
  },
};
function importInputHTML(ctx) {
  const d = ctx.data;
  return `<p class="lead">${d.draft && d.draft.title ? `Adding <b>${esc(d.draft.title)}</b>${d.draft.artist ? " by " + esc(d.draft.artist) : ""}. Drop in its chord sheet` : "Drop in a chord sheet"}. The app reads it, fills everything in, and you approve it.</p>
    <label class="dropZone" id="drop">${icon("upload", 34)}<b>Upload PDFs</b><span class="hint">Pick one to review it, or select a whole batch. Clean ones go straight into your ${INST() === "voice" ? "guitar" : INSTRUMENTS[INST()].word} library and anything odd waits in the inbox.</span><input id="pdfIn" type="file" accept="application/pdf" multiple hidden></label>
    <div class="orLine"><span>or paste the text</span></div>
    <div class="card">
      <div class="row"><button class="btn" data-act="pasteClip">${icon("clipboard", 18)} Paste</button><span class="hint">Copy everything on the chord page, then paste.</span></div>
      <textarea id="rawText" rows="10" placeholder="[Verse 1]&#10;G        C        G&#10;Lyrics go here...">${esc(d.raw || "")}</textarea>
      <button class="btn on full" data-act="convertPaste">${icon("sparkle", 18)} Convert</button>
    </div>
    ${d.busy ? `<p class="hint center">Reading…</p>` : ""}`;
}
async function handleFiles(files, ctx) {
  if (files.length === 1) return handlePdf(files[0], ctx);
  const d = ctx.data, rr = () => { if (Router.ctx === ctx || Sheet.ctx === ctx) renderCtx(ctx); };
  d.stage = "bulk"; d.bulk = files.map(f => ({ name: f.name.replace(/\.pdf$/i, ""), st: "wait" }));
  rr();
  for (let i = 0; i < files.length; i++) {
    const row = d.bulk[i];
    row.st = "reading"; rr();
    try {
      const text = await Importer.pdfToText(files[i]);
      const draft = draftFromText(text, { title: "" });
      row.title = draft.title || row.name;
      if (!draft.title) draft.title = row.name.replace(/[-_]+/g, " ").replace(/\s*(chords?|tabs?)\s*(by.*)?$/i, "").trim();
      const dupe = Object.values(App.state.userSongs).find(x => !x.deleted && songInst(x) === (INST() === "voice" ? "guitar" : INST()) && norm(x.title) === norm(draft.title));
      if (dupe) { row.st = "skip"; row.why = "Already in your library"; row.id = dupe.id; rr(); continue; }
      const issues = draftIssues(draft);
      draft.polish = false;
      row.id = await saveSong(draft, issues.length ? "review" : null, files[i]);
      row.st = issues.length ? "look" : "ok"; row.why = issues.join(", ");
    } catch (e) { row.st = "bad"; row.why = e.message || "Couldn't read it"; }
    rr();
  }
  d.bulkDone = true; AudioKit.sfx.done(); rr();
}
function draftIssues(d) {
  const out = [], chords = [];
  (d.body || "").replace(/\[([^\]]+)\]/g, (x, c) => { if (T.isChord(c)) chords.push(c); });
  if (!d.title) out.push("no title found");
  if (!d.artist) out.push("no artist");
  if (chords.length < 6) out.push("very few chords found");
  if (!/^#\s/m.test(d.body || "")) out.push("no sections found");
  if (d.tuning && !/standard|^e\s*a\s*d\s*g\s*b\s*e$/i.test(d.tuning.trim())) out.push("different tuning");
  return out;
}
function bulkHTML(ctx) {
  const d = ctx.data, b = d.bulk || [];
  const n = k => b.filter(r => r.st === k).length;
  const label = { wait: "Waiting", reading: "Reading…", ok: "Added", look: "Needs a look", skip: "Skipped", bad: "Couldn't read" };
  return `<p class="lead">${d.bulkDone ? `Done. <b>${n("ok")}</b> added${n("look") ? `, <b>${n("look")}</b> waiting in your inbox for a quick look` : ""}${n("skip") ? `, ${n("skip")} already in your library` : ""}.` : `Reading ${b.filter(r => !["wait", "reading"].includes(r.st)).length + 1} of ${b.length}… keep the app open.`}</p>
    <div class="bulkList">${b.map(r => `<div class="bulkRow"><span class="grow"><b>${esc(r.title || r.name)}</b>${r.why ? `<small>${esc(r.why)}</small>` : ""}</span>
      ${r.id && ["ok", "look"].includes(r.st) ? `<button class="st ${r.st}" data-act="go" data-h="${r.st === "look" ? "#/import?edit=" + encodeURIComponent(r.id) : "#/song/" + encodeURIComponent(r.id)}">${label[r.st]}</button>` : `<span class="st ${r.st}">${label[r.st]}</span>`}</div>`).join("")}</div>
    ${d.bulkDone ? `<div class="songFoot row wrap center"><button class="btn on" data-act="go" data-h="#/library">${icon("notes", 18)} Go to library</button><button class="btn ghost" data-act="restartImport">Add more</button></div>` : ""}`;
}
async function handlePdf(file, ctx) {
  ctx.data.busy = true; renderCtx(ctx);
  try {
    const text = await Importer.pdfToText(file);
    ctx.data.pdfBlob = file;
    buildDraft(text, ctx);
  } catch (e) { ctx.data.busy = false; renderCtx(ctx); App.toast(e.message || "Couldn't read that PDF"); }
}
function draftFromText(text, prev = {}) {
  const info = Importer.parseSheet(text);
  const hint = hintFor(info.title || prev.title || "");
  return {
    ...prev,
    title: prev.title || info.title || (hint && hint.title) || "",
    artist: prev.artist || info.artist || (hint && hint.artist) || "",
    key: info.key || prev.key || "",
    capo: info.capo ?? prev.capo ?? null,
    tuning: info.tuning || "",
    time: prev.time || (hint && hint.time) || "4/4",
    bpm: prev.bpm || (hint && hint.bpm) || info.bpm || null,
    spotify: prev.spotify || (hint && hint.spotify) || "",
    level: prev.level || (hint && hint.level) || 3,
    tags: [...new Set([...(prev.tags || []), ...(hint ? hint.tags : []), ...info.tags])],
    note: info.note || prev.note || "",
    body: info.body,
  };
}
function buildDraft(text, ctx) {
  const d = draftFromText(text, ctx.data.draft || {});
  if (!d.body.trim()) { ctx.data.busy = false; renderCtx(ctx); App.toast("No text found in that file. If it's a scan, paste the text instead."); return; }
  ctx.data.draft = d; ctx.data.stage = "review"; ctx.data.busy = false; ctx.data.raw = text;
  renderCtx(ctx);
}
ACT.pasteClip = async (el, ctx) => {
  try { const t = await navigator.clipboard.readText(); $("#rawText", ctx.root).value = t; }
  catch (e) { App.toast("Long-press the box and tap Paste instead"); }
};
ACT.convertPaste = (el, ctx) => {
  const t = $("#rawText", ctx.root).value;
  if (!t.trim()) return App.toast("Paste a chord sheet first");
  buildDraft(t, ctx);
};
function importReviewHTML(ctx) {
  const d = ctx.data.draft, m = d.melody ? d.melody.map(T.midiName) : ["", ""];
  const chords = []; (d.body || "").replace(/\[([^\]]+)\]/g, (x, c) => { if (T.isChord(c)) chords.push(c); });
  const hasOrig = !!(ctx.data.pdfBlob || d.file);
  return `<p class="lead">Check it over. Fix anything off, then approve.</p>
    <div class="card fields">
      <label class="field">Title<input id="fTitle" value="${esc(d.title)}"></label>
      <label class="field">Artist<input id="fArtist" value="${esc(d.artist)}"></label>
      <div class="row2">
        <label class="field">Key on the sheet<input id="fKey" value="${esc(d.key || "")}" placeholder="G"></label>
        <label class="field">Capo on the sheet<input id="fCapo" type="number" min="0" max="9" value="${d.capo ?? ""}" placeholder="0"></label>
      </div>
      <div class="row2">
        <label class="field">Time<select id="fTime">${["4/4","3/4","6/8","2/4"].map(t => `<option ${d.time === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="field">Difficulty<select id="fLevel">${[1,2,3,4,5].map(n => `<option value="${n}" ${+d.level === n ? "selected" : ""}>${["","Very easy","Easy","Medium","Hard","Very hard"][n]}</option>`).join("")}</select></label>
      </div>
      <div class="row2">
        <label class="field">Melody low<input id="fLo" value="${esc(m[0])}" placeholder="D4"></label>
        <label class="field">Melody high<input id="fHi" value="${esc(m[1])}" placeholder="E5"></label>
      </div>
      <label class="field">Spotify link or search<input id="fSpot" value="${esc(d.spotify || "")}" placeholder="Paste a Spotify song link"></label>
      <label class="field">Strum pattern<input id="fStrum" value="${esc(d.strum || "")}" placeholder="D – D U – U D U"></label>
      <div class="field">Tags<div class="chips">${TAGS.map(([k, l]) => `<button class="chip ${(d.tags || []).includes(k) ? "on" : ""}" data-act="draftTag" data-k="${k}">${l}</button>`).join("")}</div></div>
      ${d.tuning && !/standard|e a d g b e/i.test(d.tuning) ? `<p class="hint warn">Tuning on the sheet: ${esc(d.tuning)}</p>` : ""}
    </div>
    <div class="seg">
      <button class="${!ctx.data.showOrig && !ctx.data.editText ? "on" : ""}" data-act="reviewMode" data-m="conv">Converted</button>
      ${hasOrig ? `<button class="${ctx.data.showOrig ? "on" : ""}" data-act="reviewMode" data-m="orig">Original PDF</button>` : ""}
      <button class="${ctx.data.editText ? "on" : ""}" data-act="reviewMode" data-m="edit">Edit text</button>
    </div>
    ${ctx.data.editText ? `<textarea id="fBody" rows="18" data-input="bodyEdit">${esc(d.body)}</textarea>`
      : ctx.data.showOrig ? `<div id="origPdf" class="pdfPages"><p class="hint center">Loading…</p></div>`
      : `<div class="chordStrip">${[...new Set(chords)].map(c => `<button class="miniChord" data-act="chord" data-c="${esc(c)}">${chordSVG(c, 0.55)}<span>${esc(c)}</span></button>`).join("")}</div>
         <div class="sheet preview" style="font-size:16px">${renderSheet(d.body, 0, null)}</div>`}
    <label class="check"><input type="checkbox" id="fPolish" ${d.polish ? "checked" : ""}> Ask Claude to polish it (melody range, picking, exact recording)</label>
    <div class="songFoot row wrap center">
      <button class="btn on" data-act="approveSong">${icon("check", 18)} Approve</button>
      <button class="btn" data-act="saveInbox">${icon("inbox", 18)} Save to inbox</button>
      <button class="btn ghost" data-act="restartImport">Start over</button>
    </div>`;
}
function readDraftFields(ctx) {
  const d = ctx.data.draft, v = id => ($("#" + id, ctx.root) || {}).value;
  if ($("#fTitle", ctx.root)) {
    Object.assign(d, { title: v("fTitle").trim(), artist: v("fArtist").trim(), key: v("fKey").trim(), time: v("fTime"), level: +v("fLevel"),
      spotify: v("fSpot").trim(), strum: v("fStrum").trim() });
    const c = v("fCapo"); d.capo = c === "" ? null : +c;
    const lo = T.nameToMidi(v("fLo")), hi = T.nameToMidi(v("fHi"));
    if (lo != null && hi != null) d.melody = [Math.min(lo, hi), Math.max(lo, hi)];
    const pol = $("#fPolish", ctx.root); if (pol) d.polish = pol.checked;
  }
  return d;
}
ACT.draftTag = (el, ctx) => { const d = readDraftFields(ctx); const t = new Set(d.tags || []); t.has(el.dataset.k) ? t.delete(el.dataset.k) : t.add(el.dataset.k); d.tags = [...t]; renderCtx(ctx); };
ACT.reviewMode = (el, ctx) => { readDraftFields(ctx); ctx.data.showOrig = el.dataset.m === "orig"; ctx.data.editText = el.dataset.m === "edit"; if (ctx.data.showOrig && !ctx.data.pdfBlob && ctx.data.draft.file) IDB.get(ctx.data.draft.file).then(b => { ctx.data.pdfBlob = b; renderCtx(ctx); }); renderCtx(ctx); };
ACT.bodyEdit = (el, ctx) => { ctx.data.draft.body = el.value; };
ACT.restartImport = (el, ctx) => { ctx.data.stage = "input"; ctx.data.draft = null; ctx.data.pdfBlob = null; renderCtx(ctx); };
async function saveDraft(ctx, status) {
  const d = readDraftFields(ctx);
  if (!d.title) return App.toast("Give it a title first");
  return saveSong(d, status, ctx.data.pdfBlob);
}
/* sheets with a capo list chord SHAPES; we store the real (sounding) chords and put the capo back on in the song's settings */
async function saveSong(d, status, pdfBlob) {
  const inst = d.inst || (INST() === "voice" ? "guitar" : INST());
  const id = d.id || norm(d.title).replace(/ /g, "-").slice(0, 40) + "-" + Date.now().toString(36).slice(-4);
  const m = String(d.spotify || "").match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
  const capo = d.capo || 0;
  const body = Importer.transposeBody(d.body || "", capo);
  const song = { ...d, id, inst, type: "chords", spotify: m ? "track:" + m[1] : d.spotify, sheetCapo: capo, status, updatedAt: Date.now(), body };
  if (song.key && T.isChord(song.key)) song.key = capo ? T.transposeChord(song.key, capo) : song.key;
  else { const ch = []; body.replace(/\[([^\]]+)\]/g, (x, c) => { if (T.isChord(c)) ch.push(c); }); song.key = T.detectKey(ch); }
  delete song.capo;
  if (pdfBlob && !d.file) { song.file = "pdfs/" + id + ".pdf"; song.uploaded = false; await IDB.put(song.file, pdfBlob); }
  App.state.userSongs[id] = song;
  const pk = inst === "guitar" ? id : inst + ":" + id;
  const pr = App.state.songPrefs[pk];
  const usePc = inst === "piano" ? 0 : capo;
  if (!pr || pr.sheetCapo !== usePc) App.state.songPrefs[pk] = { ...(pr || { view: "strum", singers: [] }), shift: 0, capo: usePc, sheetCapo: usePc, at: Date.now() };
  App.save();
  if (window.Spot) Spot.soon();
  return id;
}
ACT.approveSong = async (el, ctx) => { const id = await saveDraft(ctx, null); if (!id) return; AudioKit.sfx.good(); App.toast("Added to your library"); Router.go("#/song/" + encodeURIComponent(id)); };
ACT.saveInbox = async (el, ctx) => { const id = await saveDraft(ctx, "review"); if (!id) return; App.toast("Saved to your inbox"); Router.go("#/library"); };
