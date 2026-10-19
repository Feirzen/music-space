/* =========================================================
   voice.js — Voice mode. Every song becomes a lyric sheet you
   fully own: change words, add gaps for solos and intros, cue
   notes for your entrances, and tap any word to drop a marker
   (up, down, flat, breathe, hold...). You can also attach sheet
   music (a PDF or photo) to flip to.
   Sheets start out built from the chord sheet and are saved per
   song title, so every instrument's copy shares one lyric sheet.
   ========================================================= */
const MARKS = {
  up: ["↑", "Goes up"], down: ["↓", "Goes down"], flat: ["♭", "Watch going flat"], sharp: ["♯", "Watch going sharp"],
  breath: ["V", "Breathe here"], hold: ["⌒", "Hold it"], soft: ["p", "Softer"], loud: ["f", "Louder"], harm: ["H", "Harmony"], note: ["✎", "Just a note"],
};
const MARK_COLORS = ["var(--k-gold)", "var(--k-coral)", "var(--k-sky)", "var(--k-violet)", "var(--k-sea)", "var(--k-pink)"];
const vKey = song => norm(song.title);
const vid = () => Math.random().toString(36).slice(2, 8);

function vocalFromBody(body) {
  const out = [];
  let n = 0; const vid = () => "a" + (n++);
  let sec = null;
  const flush = () => {
    if (!sec) return;
    while (sec.items.length && sec.items[sec.items.length - 1].t === "space") sec.items.pop();
    if (!sec.items.some(x => x.t === "line")) {
      if (sec.head || sec.chords) out.push({ id: vid(), t: "gap", text: (sec.head || "Instrumental") + (sec.tab ? " (riff)" : ""), c: "var(--k-sky)" });
    } else {
      if (sec.head) out.push({ id: vid(), t: "head", text: sec.head });
      out.push(...sec.items);
    }
    sec = null;
  };
  for (const line of String(body || "").split("\n")) {
    if (/^#\s/.test(line)) { flush(); sec = { head: line.slice(2).trim(), items: [], chords: 0 }; continue; }
    if (!sec) sec = { head: "", items: [], chords: 0 };
    if (/^\s*[eBGDAE]\s*\|/.test(line)) { sec.tab = true; continue; }
    let chords = 0;
    const text = line.replace(/\[([^\]]*)\]/g, (m, c) => { if (T.isChord(c)) { chords++; return ""; } return c; }).replace(/\s{2,}/g, " ").trim();
    sec.chords += chords;
    if (!text) { if (sec.items.length && sec.items[sec.items.length - 1].t !== "space") sec.items.push({ id: vid(), t: "space" }); continue; }
    if (/[a-zà-ÿ]{2}/i.test(text)) sec.items.push({ id: vid(), t: "line", text, marks: [] });
  }
  flush();
  return out;
}
function vocalOf(song) {
  const v = App.state.vocals[vKey(song)];
  return v && v.blocks ? v : { blocks: vocalFromBody(song.body), auto: true };
}
function saveVocal(song, patch) {
  const k = vKey(song), cur = App.state.vocals[k] || {};
  const blocks = patch.blocks || (cur.blocks ? cur.blocks : vocalFromBody(song.body));
  App.state.vocals[k] = { ...cur, ...patch, blocks, at: Date.now() };
  App.save();
}
const words = text => String(text).split(/\s+/).filter(Boolean);

function vocalSheetHTML(song, ctx) {
  const v = vocalOf(song), edit = ctx.data.edit;
  if (!v.blocks.length) return `<div class="card"><p>No lyrics found in this song's sheet yet. Tap <b>Edit</b> to type them in.</p></div>`;
  if (edit) return `<div class="vEdit">${v.blocks.map((b, i) => vEditRow(b, i, v.blocks.length)).join("")}
      <button class="btn ghost full" data-act="vAdd" data-i="${v.blocks.length - 1}">${icon("plus", 16)} Add at the end</button></div>`;
  return `<div class="vSheet" style="font-size:${App.state.font + 2}px">${v.blocks.map(b => {
    if (b.t === "head") return `<h3 class="sec">${esc(b.text)}</h3>`;
    if (b.t === "space") return `<div class="gap"></div>`;
    if (b.t === "gap") return `<div class="vgap" style="--accent:${b.c || "var(--k-sky)"}">${icon("notes", 16)}<span>${esc(b.text || "Instrumental")}</span></div>`;
    if (b.t === "cue") return `<div class="vcue" style="--accent:${b.c || "var(--k-gold)"}">${icon("flag", 15)}<span>${esc(b.text)}</span></div>`;
    const marks = new Map((b.marks || []).map(m => [m.w, m]));
    return `<div class="vline">${words(b.text).map((w, i) => {
      const m = marks.get(i);
      return `<button class="vw ${m ? "marked" : ""}" data-act="vWord" data-b="${b.id}" data-w="${i}" ${m ? `style="--accent:${m.c}"` : ""}>
        <i class="vmk">${m ? esc(MARKS[m.k] ? MARKS[m.k][0] : "•") + (m.text ? `<em>${esc(m.text)}</em>` : "") : ""}</i><span>${esc(w)}</span></button>`;
    }).join("")}</div>`;
  }).join("")}</div>`;
}
function vEditRow(b, i, n) {
  const tools = `<div class="vTools">
    <button class="iconBtn small" data-act="vMove" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Move up">${icon("up", 16)}</button>
    <button class="iconBtn small" data-act="vMove" data-i="${i}" data-d="1" ${i === n - 1 ? "disabled" : ""} aria-label="Move down">${icon("down", 16)}</button>
    <button class="iconBtn small" data-act="vAdd" data-i="${i}" aria-label="Add below">${icon("plus", 16)}</button>
    <button class="iconBtn small" data-act="vDel" data-i="${i}" aria-label="Delete">${icon("trash", 16)}</button></div>`;
  const label = { head: "Section", line: "Lyric", gap: "Gap", cue: "Cue", space: "Space" }[b.t];
  const colors = (b.t === "gap" || b.t === "cue") ? `<div class="vColors">${MARK_COLORS.map(c => `<button class="dot ${b.c === c ? "on" : ""}" style="--accent:${c}" data-act="vColor" data-i="${i}" data-c="${c}" aria-label="Color"></button>`).join("")}</div>` : "";
  const input = b.t === "space" ? `<span class="hint">blank line</span>`
    : `<input class="vIn ${b.t}" value="${esc(b.text || "")}" data-input="vText" data-i="${i}" placeholder="${b.t === "gap" ? "Guitar solo, 8 bars" : b.t === "cue" ? "Wait for the drums, then come in" : b.t === "head" ? "Chorus" : "Lyrics"}" aria-label="${label}">`;
  return `<div class="vRow ${b.t}" ${b.c ? `style="--accent:${b.c}"` : ""}><span class="vTag">${label}</span>${input}${colors}${tools}</div>`;
}

/* ---------- actions ---------- */
function curSong(ctx) { return getSong(ctx.arg); }
function editBlocks(ctx, fn, rerender = true) {
  const song = curSong(ctx), v = vocalOf(song);
  const blocks = v.blocks.map(b => ({ ...b, marks: (b.marks || []).slice() }));
  fn(blocks);
  saveVocal(song, { blocks, auto: false });
  if (rerender) renderCtx(ctx);
}
ACT.vToggleEdit = (el, ctx) => { ctx.data.edit = !ctx.data.edit; AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.vText = (el, ctx) => {
  const i = +el.dataset.i;
  editBlocks(ctx, bl => {
    bl[i].text = el.value;
    if (bl[i].marks) { const n = words(el.value).length; bl[i].marks = bl[i].marks.filter(m => m.w < n); }
  }, false);
};
ACT.vMove = (el, ctx) => editBlocks(ctx, bl => { const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= bl.length) return; [bl[i], bl[j]] = [bl[j], bl[i]]; });
ACT.vDel = (el, ctx) => editBlocks(ctx, bl => bl.splice(+el.dataset.i, 1));
ACT.vColor = (el, ctx) => editBlocks(ctx, bl => { bl[+el.dataset.i].c = el.dataset.c; });
ACT.vAdd = (el, ctx) => Modal.open(`<h3>Add below</h3><div class="menuList">
    ${[["line", "Lyric line", "notes"], ["gap", "Gap for a solo or intro", "guitar"], ["cue", "Cue note (what to wait for)", "flag"], ["head", "Section name", "list"], ["space", "Blank line", "minus"]]
      .map(([t, l, ic]) => `<button class="btn ghost" data-act="vAddType" data-i="${el.dataset.i}" data-t="${t}">${icon(ic, 16)} ${l}</button>`).join("")}
  </div><button class="btn ghost full" data-act="closeModal">Cancel</button>`);
ACT.vAddType = (el, ctx) => {
  Modal.close();
  const t = el.dataset.t, c = t === "gap" ? "var(--k-sky)" : t === "cue" ? "var(--k-gold)" : undefined;
  const ctxNow = Router.ctx;
  editBlocks(ctxNow, bl => bl.splice(+el.dataset.i + 1, 0, { id: vid(), t, text: t === "gap" ? "Guitar solo" : "", marks: [], ...(c ? { c } : {}) }));
  setTimeout(() => { const ins = $$(".vIn", ctxNow.root)[+el.dataset.i + 1]; if (ins) ins.focus(); }, 50);
};
ACT.vRebuild = (el, ctx) => Modal.open(`<h3>Start the lyric sheet over?</h3><p>This rebuilds it from the chord sheet and removes your edits and markers.</p>
  <div class="row"><button class="btn danger on" data-act="vRebuildYes">Start over</button><button class="btn ghost" data-act="closeModal">Keep mine</button></div>`);
ACT.vRebuildYes = () => {
  Modal.close(); const ctx = Router.ctx, song = curSong(ctx);
  saveVocal(song, { blocks: vocalFromBody(song.body), auto: true }); renderCtx(ctx);
};
ACT.vWord = (el, ctx) => {
  const song = curSong(ctx), v = vocalOf(song), b = v.blocks.find(x => x.id === el.dataset.b);
  if (!b) return;
  const w = +el.dataset.w, m = (b.marks || []).find(x => x.w === w) || {};
  ctx.data.pick = { b: b.id, w, k: m.k || "", c: m.c || MARK_COLORS[0] };
  Modal.open(markPickerHTML(words(b.text)[w], ctx.data.pick, m));
};
function markPickerHTML(word, pick, m) {
  return `<h3>“${esc(word)}”</h3>
    <div class="markGrid">${Object.entries(MARKS).map(([k, [g, l]]) => `<button class="markBtn ${pick.k === k ? "on" : ""}" style="--accent:${pick.c}" data-act="vPickMark" data-k="${k}"><b>${esc(g)}</b><span>${l}</span></button>`).join("")}</div>
    <div class="vColors center">${MARK_COLORS.map(c => `<button class="dot ${pick.c === c ? "on" : ""}" style="--accent:${c}" data-act="vPickColor" data-c="${c}" aria-label="Color"></button>`).join("")}</div>
    <label class="field">Short note (optional)<input id="markText" value="${esc(m.text || "")}" maxlength="24" placeholder="like: big breath, Ri comes in"></label>
    <div class="row wrap center"><button class="btn on" data-act="vSaveMark">${icon("check", 16)} Save</button>${m.k ? `<button class="btn ghost danger" data-act="vClearMark">Remove</button>` : ""}<button class="btn ghost" data-act="closeModal">Cancel</button></div>`;
}
ACT.vPickMark = el => { const ctx = Router.ctx; ctx.data.pick.k = el.dataset.k; $$(".markBtn").forEach(b => b.classList.toggle("on", b === el)); AudioKit.sfx.tap(); };
ACT.vPickColor = el => { const ctx = Router.ctx; ctx.data.pick.c = el.dataset.c; $$(".markBtn").forEach(b => b.style.setProperty("--accent", el.dataset.c)); $$(".modalCard .dot").forEach(d => d.classList.toggle("on", d === el)); };
ACT.vSaveMark = () => {
  const ctx = Router.ctx, p = ctx.data.pick, text = ($("#markText").value || "").trim();
  if (!p.k) p.k = text ? "note" : "";
  if (!p.k) return App.toast("Pick a marker first");
  Modal.close();
  editBlocks(ctx, bl => { const b = bl.find(x => x.id === p.b); b.marks = (b.marks || []).filter(x => x.w !== p.w); b.marks.push({ w: p.w, k: p.k, c: p.c, ...(text ? { text } : {}) }); });
  AudioKit.sfx.good();
};
ACT.vClearMark = () => {
  const ctx = Router.ctx, p = ctx.data.pick; Modal.close();
  editBlocks(ctx, bl => { const b = bl.find(x => x.id === p.b); b.marks = (b.marks || []).filter(x => x.w !== p.w); });
};

/* ---------- sheet music attachment ---------- */
function musicPanelHTML(song, ctx) {
  const v = App.state.vocals[vKey(song)] || {};
  return `${v.file ? `<div class="row wrap"><button class="btn on" data-act="vShowMusic">${icon(ctx.data.music ? "notes" : "file", 16)} ${ctx.data.music ? "Back to lyrics" : "View sheet music"}</button>
      <button class="btn ghost danger" data-act="vDropMusic">${icon("trash", 16)} Remove</button></div>` : ""}
    <label class="btn ${v.file ? "ghost" : "on"} full">${icon("upload", 16)} ${v.file ? "Replace with another file" : "Attach a PDF or photo of the vocal part"}<input id="vMusicIn" type="file" accept="application/pdf,image/*" hidden></label>
    <p class="hint">It saves with this song and syncs to your other devices.</p>`;
}
ACT.vShowMusic = (el, ctx) => { ctx.data.music = !ctx.data.music; renderCtx(ctx); };
ACT.vDropMusic = (el, ctx) => { const song = curSong(ctx), k = vKey(song), v = App.state.vocals[k]; if (v && v.file) IDB.del(v.file); saveVocal(song, { file: null, uploaded: false }); ctx.data.music = false; renderCtx(ctx); };
async function attachMusic(file, ctx) {
  const song = curSong(ctx), ext = file.type === "application/pdf" ? "pdf" : (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = "vocal/" + vKey(song).replace(/ /g, "-").slice(0, 40) + "-" + vid() + "." + ext;
  await IDB.put(path, file);
  saveVocal(song, { file: path, fileType: file.type, uploaded: false });
  ctx.data.music = true; AudioKit.sfx.good(); renderCtx(ctx);
}
async function mountMusic(song, ctx) {
  const box = $("#vMusic", ctx.root); if (!box) return;
  const v = App.state.vocals[vKey(song)] || {};
  const blob = v.file && await IDB.get(v.file);
  if (!blob) { box.innerHTML = `<p class="empty">The sheet music hasn't downloaded to this device yet. Get online and sync.</p>`; return; }
  if (/pdf/.test(blob.type || v.fileType || "")) { try { await renderPdfInto(blob, box, 1); } catch (e) { box.innerHTML = `<p class="empty">${esc(e.message)}</p>`; } }
  else { const url = URL.createObjectURL(blob); box.innerHTML = `<img src="${url}" alt="Sheet music" class="vImg">`; ctx.cleanups.push(() => URL.revokeObjectURL(url)); }
}

/* ---------- the voice song page ---------- */
function voiceSongHTML(ctx) {
  const song = getSong(ctx.arg);
  if (!song) return `<p class="empty">Song not found. It may still be syncing.</p>`;
  const d = ctx.data, panel = d.panel || "", gp = App.state.songPrefs[song.id] || { shift: 0, singers: [] };
  const kr = keyRoot(song), minor = isMinorKey(song);
  const keyName = T.transposeChord(T.SHARPS[kr] + (minor ? "m" : ""), gp.shift || 0, T.mod12(kr + (gp.shift || 0)));
  const fits = App.state.people.map(p => { const f = T.describeFit(song.melody, gp.shift || 0, p); return f ? `<span class="fit ${f.comfy ? "ok" : f.ok ? "" : "bad"}">${esc(p.name)}: ${f.text}</span>` : ""; }).join("");
  const v = vocalOf(song), nMarks = v.blocks.reduce((n, b) => n + (b.marks || []).length, 0), best = bestPct(song.id);
  const bars = [["edit", "pencil", d.edit ? "Done" : "Edit", "var(--accent)"], ["takes", "rec", "Takes", "var(--k-coral)"], ["music", "file", "Music", "var(--k-sky)"], ["play", "sliders", "Play", "var(--k-violet)"]];
  return `<div class="songHead">
      <div class="muted">${esc(song.artist || "")}${song.bpm ? " · ~" + song.bpm + " bpm" : ""}</div>
      <div class="keyLine">Key <b>${esc(keyName)}</b>${gp.shift ? ` <span class="muted">(your guitar key)</span>` : ""}</div>
      ${fits ? `<div class="fits">${fits}</div>` : ""}
    </div>
    ${spotBarHTML(song)}
    <div class="songBar" role="toolbar">${bars.map(([k, ic, l, c]) => `<button class="barBtn ${(k === "edit" ? d.edit : panel === k) ? "on" : ""}" ${c !== "var(--accent)" ? `style="--accent:${c}"` : ""} data-act="${k === "edit" ? "vToggleEdit" : "songPanel"}" data-k="${k}">${icon(ic, 20)}<span>${l}</span></button>`).join("")}</div>
    ${panel === "takes" ? `<div class="panel">${takesPanelHTML(song)}</div>` : panel === "music" ? `<div class="panel">${musicPanelHTML(song, ctx)}</div>` : panel === "play" ? `<div class="panel">${songPanelHTML("play", song, prefs(song.id), ctx)}</div>` : ""}
    ${d.edit ? `<div class="hint vHint">Change any words, add gaps for solos, and cue notes for your entrances. Changes save as you type.
      <button class="linkBtn" data-act="vRebuild">Rebuild from the chord sheet</button></div>`
      : !nMarks && v.auto ? `<p class="hint vHint">Tap any word to add a marker. Tap <b>Edit</b> to change words, add gaps and cues.</p>` : ""}
    ${d.music ? `<div id="vMusic" class="pdfPages"><p class="hint center">Loading…</p></div>` : vocalSheetHTML(song, ctx)}
    <div class="songFoot">
      <div class="masteryRow" style="--accent:${songColor(song)}">${cupHTML(best, 46)}<div><b>${best ? best + "% best" : "Not rated yet"}</b><div class="hint">Rate how the singing went after a run-through.</div></div></div>
      <div class="row wrap center"><button class="btn on" data-act="rateSong" data-id="${esc(song.id)}">${icon("star", 18)} Rate a run-through</button>
        <button class="btn ghost" data-act="songMenu" data-id="${esc(song.id)}">${icon("list", 18)} Lists & more</button></div>
    </div>
    ${d.edit ? "" : `<button class="fab ${Scroller.on ? "on" : ""}" id="scrollFab" data-act="scroll" aria-label="Autoscroll">${icon(Scroller.on ? "pause" : "play", 24)}</button>`}`;
}
{
  const html = VIEWS.song.html, mount = VIEWS.song.mount;
  VIEWS.song.html = ctx => INST() === "voice" ? voiceSongHTML(ctx) : html(ctx);
  VIEWS.song.mount = ctx => {
    if (INST() !== "voice") return mount(ctx);
    ctx.cleanups.push(() => Scroller.stop());
    ctx.cleanups.push(() => { if (TakePlayer.audio) TakePlayer.audio.pause(); });
    const song = getSong(ctx.arg); if (!song) return;
    const sp = $("#scrollSpeed", ctx.root); if (sp) sp.addEventListener("input", () => Scroller.speed = +sp.value);
    const f = $("#vMusicIn", ctx.root); if (f) f.addEventListener("change", () => f.files[0] && attachMusic(f.files[0], ctx));
    if (ctx.data.music) mountMusic(song, ctx);
    SpotUI.mount(song, ctx);
  };
}
