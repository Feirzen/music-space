/* =========================================================
   takes.js — record yourself on any song and keep a history
   of takes. Audio lives on the device (IndexedDB) and backs up
   to your private repo; other devices download a take when you
   press play on it.
   ========================================================= */
const Rec = {
  mr: null, chunks: [], stream: null, t0: 0, timer: 0,
  type() {
    const opts = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
    return (window.MediaRecorder && opts.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t))) || "";
  },
  async start(onTick) {
    if (!window.MediaRecorder) throw new Error("Recording isn't supported in this browser");
    AudioKit.Mic.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const type = this.type();
    this.mr = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
    this.chunks = [];
    this.mr.ondataavailable = e => e.data && e.data.size && this.chunks.push(e.data);
    this.mr.start(1000);
    this.t0 = Date.now();
    this.timer = setInterval(() => onTick && onTick(Date.now() - this.t0), 250);
  },
  stop() {
    return new Promise(res => {
      if (!this.mr) return res(null);
      clearInterval(this.timer);
      const dur = Date.now() - this.t0;
      this.mr.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mr.mimeType || "audio/mp4" });
        this.stream.getTracks().forEach(t => t.stop());
        this.mr = null; this.stream = null;
        res({ blob, dur });
      };
      this.mr.stop();
    });
  },
  get on() { return !!this.mr; },
};
const extFor = type => /webm/.test(type) ? "webm" : /ogg/.test(type) ? "ogg" : "m4a";
const takeKey = song => norm(song.title);
function takesFor(song) {
  const k = takeKey(song);
  return Object.values(App.state.takes).filter(t => t && !t.deleted && t.song === k).sort((a, b) => b.made - a.made);
}
function takeRowHTML(t, withSong) {
  const d = new Date(t.made);
  return `<div class="takeRow" id="take-${t.id}">
    <button class="spBtn main" data-act="takePlay" data-id="${t.id}" aria-label="Play take">${icon("play", 18)}</button>
    <div class="grow"><b>${esc(t.name)}</b><small>${withSong ? esc(t.title) + " · " : ""}${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · ${fmtTime(t.dur)} · ${esc(INSTRUMENTS[t.inst] ? INSTRUMENTS[t.inst].label : "")}</small>
      <div class="spTrack"><i id="tp-${t.id}"></i></div></div>
    <button class="iconBtn small" data-act="takeMenu" data-id="${t.id}" aria-label="More">${icon("more", 18)}</button>
  </div>`;
}
function takesPanelHTML(song) {
  const list = takesFor(song);
  return `<div class="recRow">
      <button class="recBtn ${Rec.on ? "on" : ""}" data-act="recToggle" data-id="${esc(song.id)}" aria-label="${Rec.on ? "Stop recording" : "Record a take"}">${icon(Rec.on ? "stop" : "record", 26)}</button>
      <div><b id="recTime">${Rec.on ? "Recording…" : "Record a take"}</b><div class="hint">${Rec.on ? "Tap to stop and save." : "Sing or play the song through, then listen back."}</div></div>
    </div>
    ${list.length ? `<div class="takeList">${list.map(t => takeRowHTML(t)).join("")}</div>` : `<p class="hint">No takes yet. Your takes will stack up here so you can hear yourself improve.</p>`}`;
}
ACT.recToggle = async (el, ctx) => {
  const song = getSong(el.dataset.id);
  try {
    if (!Rec.on) {
      await Rec.start(ms => { const t = $("#recTime"); if (t) t.textContent = "Recording · " + fmtTime(ms); });
      AudioKit.sfx.tap();
      el.classList.add("on"); el.innerHTML = icon("stop", 26); el.setAttribute("aria-label", "Stop recording");
      const h = el.parentElement.querySelector(".hint"); if (h) h.textContent = "Tap to stop and save.";
      ctx.cleanups.push(() => { if (Rec.on) saveTake(song); });
    } else await saveTake(song, ctx);
  } catch (e) { App.toast(e.name === "NotAllowedError" ? "Allow the microphone to record" : e.message); }
};
async function saveTake(song, ctx) {
  const r = await Rec.stop();
  if (!r || r.dur < 1200) { App.toast("That take was too short to keep"); if (ctx) renderCtx(ctx); return; }
  const id = uid() + Date.now().toString(36).slice(-3), n = takesFor(song).length + 1;
  const file = "takes/" + id + "." + extFor(r.blob.type);
  await IDB.put(file, r.blob);
  App.state.takes[id] = { id, song: takeKey(song), songId: song.id, title: song.title, inst: INST(), name: "Take " + n, made: Date.now(), at: Date.now(), dur: r.dur, file, uploaded: false };
  App.save(); AudioKit.sfx.good(); App.toast("Take saved");
  if (ctx) renderCtx(ctx);
}
const TakePlayer = { audio: null, id: null, url: null };
ACT.takePlay = async el => {
  const t = App.state.takes[el.dataset.id]; if (!t) return;
  const P = TakePlayer;
  if (P.audio && P.id === t.id) { if (P.audio.paused) P.audio.play(); else P.audio.pause(); return; }
  if (P.audio) { P.audio.pause(); const old = $(`[data-act=takePlay][data-id="${P.id}"]`); if (old) old.innerHTML = icon("play", 18); }
  let blob = await IDB.get(t.file);
  if (!blob) {
    if (!GH.ready() || !t.uploaded) return App.toast("This take lives on another device and hasn't backed up yet");
    try { App.toast("Downloading take…"); blob = await GH.getBlob(t.file); await IDB.put(t.file, blob); } catch (e) { return App.toast("Couldn't download it. Try again online."); }
  }
  if (P.url) URL.revokeObjectURL(P.url);
  P.url = URL.createObjectURL(blob); P.id = t.id; P.audio = new Audio(P.url);
  const btn = () => $(`[data-act=takePlay][data-id="${t.id}"]`);
  P.audio.onplay = () => { const b = btn(); if (b) b.innerHTML = icon("pause", 18); };
  P.audio.onpause = P.audio.onended = () => { const b = btn(); if (b) b.innerHTML = icon("play", 18); };
  P.audio.ontimeupdate = () => { const bar = $("#tp-" + t.id); if (bar && P.audio.duration) bar.style.width = (100 * P.audio.currentTime / P.audio.duration) + "%"; };
  P.audio.play().catch(() => App.toast("Couldn't play this take on this device"));
};
ACT.takeMenu = el => {
  const t = App.state.takes[el.dataset.id]; if (!t) return;
  Modal.open(`<h3>${esc(t.name)}</h3>
    <label class="field">Name<input id="takeName" value="${esc(t.name)}" maxlength="40"></label>
    <div class="menuList">
      <button class="btn on" data-act="takeRename" data-id="${t.id}">${icon("check", 16)} Save name</button>
      <button class="btn ghost" data-act="takeShare" data-id="${t.id}">${icon("share", 16)} Save or share the audio</button>
      <button class="btn ghost danger" data-act="takeDel" data-id="${t.id}">${icon("trash", 16)} Delete take</button>
    </div><button class="btn ghost full" data-act="closeModal">Close</button>`);
};
ACT.takeRename = el => {
  const t = App.state.takes[el.dataset.id]; const v = ($("#takeName").value || "").trim();
  if (t && v) { t.name = v; t.at = Date.now(); App.save(); }
  Modal.close(); if (Router.ctx) renderCtx(Router.ctx); if (Sheet.ctx) renderCtx(Sheet.ctx);
};
ACT.takeShare = async el => {
  const t = App.state.takes[el.dataset.id]; if (!t) return;
  const blob = await IDB.get(t.file);
  if (!blob) return App.toast("Play it once on this device first");
  const name = `${t.title} - ${t.name}.${t.file.split(".").pop()}`;
  const file = new File([blob], name, { type: blob.type });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } } catch (e) { if (e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
};
ACT.takeDel = el => {
  const t = App.state.takes[el.dataset.id]; if (!t) return;
  App.state.takes[t.id] = { id: t.id, deleted: true, at: Date.now() };
  IDB.del(t.file); App.save(); Modal.close();
  if (Router.ctx) renderCtx(Router.ctx); if (Sheet.ctx) renderCtx(Sheet.ctx);
};

/* every take, newest first (Practice > Takes) */
VIEWS.takes = {
  title: () => "Takes",
  html() {
    const all = Object.values(App.state.takes).filter(t => t && !t.deleted).sort((a, b) => b.made - a.made);
    return all.length ? `<p class="lead">Every take you've recorded, newest first. Record new ones from any song page.</p><div class="takeList">${all.map(t => takeRowHTML(t, true)).join("")}</div>`
      : `<div class="soon">${icon("mic", 40)}<h2>No takes yet</h2><p>Open any song and tap <b>Takes</b> to record yourself. They'll all collect here.</p><button class="btn on" data-act="go" data-h="#/library">${icon("notes", 18)} Pick a song</button></div>`;
  },
  mount(ctx) { ctx.cleanups.push(() => { if (TakePlayer.audio) TakePlayer.audio.pause(); }); },
};
