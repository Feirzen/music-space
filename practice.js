/* =========================================================
   practice.js — Practice hub, tuner, metronome, chord library,
   Chord Flash, Chord Rush (mic), Name That Shape, Range finder.
   Every tool works as a page or as an overlay over a lesson.
   ========================================================= */
const POOL = ["G","C","D","Em","Am","E","A","Dm","F","Bm","G7","C7","D7","A7","E7","B7","Am7","Em7","Dm7","Cmaj7","Fmaj7","Cadd9","Dsus2","Dsus4","Asus2","Asus4","Esus4","E5","A5","G5","D5","C5","F#m","C#m","Bb","Gm","Cm"];

VIEWS.practice = {
  title: () => "Practice",
  html() {
    const tiles = [
      ["tuner", "tuner", "Tuner", INST() === "uke" ? "Tunes G C E A through the mic." : "Listens through the mic. Works offline.", "var(--accent)"],
      ["metro", "metronome", "Metronome", "Steady time with a few sounds to pick from.", "#ffb06a"],
      ["chords", "chord", "Chord library", "Every chord, filtered your way.", "#8fb8ff"],
      ["flash", "bolt", "Chord Flash", "Switch on the beat. Don't stop strumming.", "#ffd166"],
      ["rush", "mic", "Chord Rush", "The mic counts your clean changes.", "#ff8fa3"],
      ["quiz", "cards", "Name That Shape", "Quick quiz on the chords you pick.", "#c9a7ff"],
      ["range", "wave", "Range finder", "Measure anyone's singing range.", "#7fe9cd"],
      ["takes", "rec", "Takes", "Every recording you've made, by song.", "#ff8f7a"],
    ].filter(t => !(INST() === "piano" && t[0] === "tuner") && !(INST() === "voice" && ["chords", "flash", "rush", "quiz"].includes(t[0])))
     .map(t => INST() === "voice" && t[0] === "tuner" ? ["tuner", "tuner", "Pitch", "Sing a note and see exactly where you are.", t[4]] : t);
    const work = markedChords("work");
    return `<div class="tiles">${tiles.map(([h, ic, t, d, c]) => `<button class="tile" data-act="go" data-h="#/${h}" style="--tc:${c}">
        <span class="tileIcon">${icon(ic, 30)}</span><b>${t}</b><span>${d}</span></button>`).join("")}</div>
      ${work.length ? `<div class="card"><div class="row"><b>Chords that need work</b></div>
        <div class="chordStrip">${work.map(c => `<button class="miniChord" data-act="chord" data-c="${esc(c)}">${markDot(c)}${chordSVG(c, 0.6)}<span>${esc(c)}</span></button>`).join("")}</div>
        <button class="btn on" data-act="go" data-h="#/flash?chords=${encodeURIComponent(work.join(","))}">${icon("bolt", 18)} Flash these</button></div>` : ""}
      <div class="card"><b>Three-minute warmup</b><ol class="warm">${INST() === "voice"
        ? "<li>Lip trills up and down, easy and loose.</li><li>Pitch: sing five notes up and back, watch the needle.</li><li>One song from top to bottom, then listen to the take.</li>"
        : INST() === "piano"
        ? "<li>Five-finger scale in C, both hands, slow.</li><li>Chord Flash on C, F, G, Am at 60 bpm.</li><li>One song you already know, start to finish.</li>"
        : INST() === "uke" ? "<li>Strum each open string and check it with the tuner.</li><li>Chord Flash on C, Am, F, G at 60 bpm.</li><li>One song you already know, start to finish.</li>"
        : "<li>Spider walk: frets 1-2-3-4 on every string, slow.</li><li>Chord Flash on the Starter four at 60 bpm.</li><li>One song you already know, start to finish.</li>"}</ol></div>`;
  },
};

/* ---------------- TUNER ---------------- */
const GUITAR_STR = [["E", 40, "6th"], ["A", 45, "5th"], ["D", 50, "4th"], ["G", 55, "3rd"], ["B", 59, "2nd"], ["E", 64, "1st"]];
const UKE_STR = [["G", 67, "4th"], ["C", 60, "3rd"], ["E", 64, "2nd"], ["A", 69, "1st"]];
const tunerStrings = () => INST() === "uke" ? UKE_STR : INST() === "voice" ? [] : GUITAR_STR;
VIEWS.tuner = {
  title: () => INST() === "voice" ? "Pitch" : "Tuner",
  html(ctx) {
    const d = ctx.data; d.done = d.done || new Set();
    return `<div class="tool center">
      <button class="cornerBtn" data-act="tunerPause" aria-label="${d.paused ? "Resume" : "Pause"}">${icon(d.paused ? "play" : "pause", 20)}</button>
      <div class="tNote" id="tNote">${d.err ? "" : "—"}</div>
      <div class="tCents" aria-hidden="true"><div class="tScale"><span></span><span></span><span class="mid"></span><span></span><span></span></div><div class="tNeedle" id="tNeedle"></div></div>
      <div class="muted" id="tInfo">${d.err ? esc(d.err) : d.paused ? "Paused" : INST() === "voice" ? "Sing a steady note" : "Play one string at a time"}</div>
      ${d.err ? `<button class="btn on" data-act="tunerRetry">${icon("mic", 18)} Allow the mic</button>` : ""}
      <div class="strings">${tunerStrings().map(([n, m, s], i) => `<button class="stringBox ${d.done.has(i) ? "ok" : ""}" data-act="refTone" data-m="${m}" data-i="${i}" aria-label="${s} string ${n}, tap to hear it"><b>${n}</b><small>${s}</small></button>`).join("")}</div>
      ${INST() === "voice" ? `<p class="hint">Hold a note and watch the needle. Center means right on pitch. Fry or breathy notes won't read well.</p>` : `<p class="hint">Boxes turn green as each string lands in tune. Tap a box to hear its note.</p>`}
      ${d.done.size ? `<button class="btn ghost" data-act="tunerReset">${icon("refresh", 16)} Start over</button>` : ""}
    </div>`;
  },
  mount(ctx) { if (!ctx.data.paused && !ctx.data.err) startTuner(ctx); ctx.cleanups.push(() => AudioKit.Mic.stop()); },
};
function startTuner(ctx) {
  const hist = [], d = ctx.data;
  let streak = 0, streakString = -1;
  AudioKit.Mic.start(({ freq }) => {
    if (!freq || freq < 0) return;
    Timer.ping();
    hist.push(freq); if (hist.length > 5) hist.shift();
    const med = [...hist].sort((a, b) => a - b)[Math.floor(hist.length / 2)];
    const m = AudioKit.freqToMidi(med), near = Math.round(m), cents = Math.round((m - near) * 100);
    const n = $("#tNote", ctx.root), nd = $("#tNeedle", ctx.root), inf = $("#tInfo", ctx.root);
    if (!n) return;
    const ok = Math.abs(cents) <= 5;
    n.textContent = T.SHARPS[T.mod12(near)] + (Math.floor(near / 12) - 1);
    n.classList.toggle("ok", ok);
    nd.style.left = (50 + Math.max(-50, Math.min(50, cents))) + "%";
    nd.classList.toggle("ok", ok);
    const STR = tunerStrings(), si = STR.findIndex(g => g[1] === near);
    inf.textContent = `${cents > 0 ? "+" : ""}${cents}¢` + (INST() === "voice" ? (Math.abs(cents) <= 10 ? " · on pitch" : cents > 0 ? " · a little sharp" : " · a little flat") : ` · ${si >= 0 ? STR[si][2] + " string" : "between strings"}`);
    if (ok && si >= 0) { streak = streakString === si ? streak + 1 : 1; streakString = si; } else streak = 0;
    if (streak >= 4 && !d.done.has(si)) {
      d.done.add(si); AudioKit.sfx.good();
      const box = $$(".stringBox", ctx.root)[si]; if (box) box.classList.add("ok");
      if (d.done.size === tunerStrings().length) inf.textContent = "All strings in tune. Nice.";
    }
  }).catch(() => { d.err = "Mic is blocked. Allow microphone access for this site, then tap below."; renderCtx(ctx); });
}
ACT.tunerPause = (el, ctx) => { ctx.data.paused = !ctx.data.paused; if (ctx.data.paused) AudioKit.Mic.stop(); renderCtx(ctx); };
ACT.tunerRetry = (el, ctx) => { ctx.data.err = null; renderCtx(ctx); };
ACT.tunerReset = (el, ctx) => { ctx.data.done = new Set(); renderCtx(ctx); };
ACT.refTone = el => AudioKit.playTone(AudioKit.mtof(+el.dataset.m), 2.4);

/* ---------------- METRONOME ---------------- */
VIEWS.metro = {
  title: () => "Metronome",
  html(ctx) {
    const d = ctx.data;
    if (d.bpm == null) { d.bpm = +ctx.q.bpm || 80; d.beats = 4; d.taps = []; }
    const run = AudioKit.Metro.running;
    return `<div class="tool center metro">
      <div class="bpmDial">
        <button class="stepBtn big" data-act="bpm" data-d="-1" aria-label="Slower">${icon("minus", 22)}</button>
        <div><b id="bpmVal">${d.bpm}</b><span>bpm</span></div>
        <button class="stepBtn big" data-act="bpm" data-d="1" aria-label="Faster">${icon("plus", 22)}</button>
      </div>
      <input id="bpmRange" type="range" min="40" max="220" value="${d.bpm}" data-input="bpmRange" aria-label="Tempo">
      <div class="dots" id="dots">${Array.from({ length: d.beats }, () => `<span></span>`).join("")}</div>
      <div class="row center wrap">
        <label class="field inline">Beats<select data-change="metroBeats">${[2,3,4,5,6,7].map(n => `<option ${n === d.beats ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label class="field inline">Sound<select data-change="metroSound">${Object.entries(AudioKit.METRO_SOUNDS).map(([k, v]) => `<option value="${k}" ${App.state.metroSound === k ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
      </div>
      <div class="row center"><button class="btn big on round" data-act="metroToggle" aria-label="${run ? "Stop" : "Start"}">${icon(run ? "pause" : "play", 28)}</button><button class="btn big" data-act="tap">Tap tempo</button></div>
    </div>`;
  },
  mount(ctx) { ctx.cleanups.push(() => AudioKit.Metro.stop()); },
};
const metroBeat = ctx => b => { Timer.ping(); $$("#dots span", ctx.root).forEach((d, i) => d.classList.toggle("on", i === b % ctx.data.beats)); };
const setBpm = (ctx, v) => { ctx.data.bpm = Math.max(40, Math.min(220, Math.round(v))); AudioKit.Metro.bpm = ctx.data.bpm; const a = $("#bpmVal", ctx.root), r = $("#bpmRange", ctx.root); if (a) a.textContent = ctx.data.bpm; if (r) r.value = ctx.data.bpm; };
ACT.bpm = (el, ctx) => setBpm(ctx, ctx.data.bpm + +el.dataset.d);
ACT.bpmRange = (el, ctx) => setBpm(ctx, +el.value);
ACT.metroBeats = (el, ctx) => { ctx.data.beats = +el.value; AudioKit.Metro.beatsPerBar = ctx.data.beats; const run = AudioKit.Metro.running; renderCtx(ctx); if (run) AudioKit.Metro.start(ctx.data.bpm, ctx.data.beats, metroBeat(ctx)); };
ACT.metroSound = el => { App.state.metroSound = el.value; AudioKit.Metro.sound = el.value; App.save(true); };
ACT.metroToggle = (el, ctx) => {
  if (AudioKit.Metro.running) AudioKit.Metro.stop(); else AudioKit.Metro.start(ctx.data.bpm, ctx.data.beats, metroBeat(ctx));
  el.innerHTML = icon(AudioKit.Metro.running ? "pause" : "play", 28);
};
ACT.tap = (el, ctx) => {
  const now = performance.now(), d = ctx.data;
  d.taps = d.taps.filter(t => now - t < 2500); d.taps.push(now);
  if (d.taps.length >= 2) setBpm(ctx, 60000 / ((d.taps[d.taps.length - 1] - d.taps[0]) / (d.taps.length - 1)));
  AudioKit.sfx.tick();
};

/* ---------------- CHORD LIBRARY ---------------- */
VIEWS.chords = {
  title: () => "Chord library",
  html(ctx) {
    const d = ctx.data; d.root = d.root ?? "all"; d.type = d.type ?? "all"; d.extra = d.extra || "";
    let list = T.allChords();
    if (d.root !== "all") list = list.filter(c => c.root === +d.root);
    if (d.type !== "all") list = list.filter(c => c.type === d.type);
    if (d.extra === "open") list = list.filter(c => c.open);
    if (d.extra === "work") list = list.filter(c => markOf(c.name) === "work");
    if (d.extra === "solid") list = list.filter(c => markOf(c.name) === "solid");
    const rootChip = (v, l) => `<button class="chip ${String(d.root) === String(v) ? "on" : ""}" data-act="chordFilter" data-f="root" data-v="${v}">${l}</button>`;
    const typeChip = (v, l) => `<button class="chip ${d.type === v ? "on" : ""}" data-act="chordFilter" data-f="type" data-v="${v}">${l}</button>`;
    const exChip = (v, l) => `<button class="chip ${d.extra === v ? "on" : ""}" data-act="chordFilter" data-f="extra" data-v="${v}">${l}</button>`;
    return `<div class="filterBlock">
        <div class="chips scroll">${rootChip("all", "All roots")}${T.SHARPS.map((r, i) => rootChip(i, ["A#","D#","G#"].includes(r) ? T.FLATS[i] : r)).join("")}</div>
        <div class="chips scroll">${typeChip("all", "All types")}${T.TYPES.map(t => typeChip(t.q, t.label)).join("")}</div>
        <div class="chips">${exChip("", "Everything")}${exChip("open", INST() === "piano" ? "White keys only" : "Open shapes")}${exChip("work", "Needs work")}${exChip("solid", "Solid")}</div>
      </div>
      <div class="libCount muted">${list.length} chords</div>
      <div class="chordGrid">${list.map(c => `<button class="chordCard" data-act="chord" data-c="${esc(c.name)}">${markDot(c.name)}${chordSVG(c.name, 0.95)}<b>${esc(c.name)}</b></button>`).join("") || `<p class="empty">No chords match.</p>`}</div>`;
  },
};
ACT.chordFilter = (el, ctx) => { ctx.data[el.dataset.f] = el.dataset.v; AudioKit.sfx.tap(); renderCtx(ctx); };

/* ---------------- shared chord picker ---------------- */
const UKE_POOL = ["C","G","Am","F","Dm","Em","G7","C7","A7","D","A","E7","D7","Bb","Gm","Cm","Fm","Bm","Am7","Dm7","Em7","Cmaj7","Fmaj7","Gmaj7","Csus4","Dsus2","Asus4","E","B7","F#m"];
const PIANO_POOL = ["C","F","G","Am","Dm","Em","G7","C7","D","A","E","Bb","Eb","Ab","Db","Gm","Cm","Fm","Bm","F#m","C#m","Cmaj7","Fmaj7","Dm7","Am7","Em7","Csus4","Gsus4","Dsus2","Cadd9"];
const PRESETS_BY = {
  uke: { "Uke starter": ["C","Am","F","G"], "Island four": ["C","G","Am","F"], "Sevens": ["G7","C7","A7","D7","E7"], "Minor mood": ["Am","Dm","Em","Gm"], "Stretch": ["D","E","Bb","Bm"] },
  piano: { "Pop four": ["C","G","Am","F"], "Minor four": ["Am","F","C","G"], "Sevens": ["G7","C7","D7","A7"], "Black keys": ["Db","Eb","Ab","Bb"], "Pretty colors": ["Cmaj7","Fmaj7","Dm7","Am7"] },
};
const presetsHere = () => PRESETS_BY[INST()] || CHORD_PRESETS;
const poolHere = () => INST() === "uke" ? UKE_POOL : INST() === "piano" ? PIANO_POOL : POOL;
function pickerHTML(sel, { max = 0 } = {}) {
  const pool = [...new Set([...sel, ...poolHere()])];
  return `<div class="chips">${Object.entries(presetsHere()).map(([k, v]) => `<button class="chip" data-act="pickPreset" data-v="${v.join(",")}">${k}</button>`).join("")}<button class="chip ghost" data-act="pickClear">Clear</button></div>
    <div class="pickGrid">${pool.map(c => { const i = sel.indexOf(c); return `<button class="pickTile ${i >= 0 ? "on" : ""}" data-act="pickChord" data-c="${esc(c)}" aria-pressed="${i >= 0}">${i >= 0 && !max ? `<span class="ord">${i + 1}</span>` : ""}${chordSVG(c, 0.55)}<b>${esc(c)}</b></button>`; }).join("")}</div>`;
}
ACT.pickChord = (el, ctx) => {
  const s = ctx.data.sel, c = el.dataset.c, i = s.indexOf(c), max = ctx.data.max || 0;
  if (i >= 0) s.splice(i, 1); else { s.push(c); if (max && s.length > max) s.shift(); }
  AudioKit.strum(c, { gain: 0.08 }); renderCtx(ctx);
};
ACT.pickPreset = (el, ctx) => { ctx.data.sel = el.dataset.v.split(",").slice(0, ctx.data.max || 99); renderCtx(ctx); };
ACT.pickClear = (el, ctx) => { ctx.data.sel = []; renderCtx(ctx); };
const stepper = (key, label, val, unit = "") => `<div class="stepper"><span>${label}</span><button class="stepBtn" data-act="stepVal" data-k="${key}" data-d="-1" aria-label="Less ${label}">${icon("minus", 18)}</button><b>${val}${unit}</b><button class="stepBtn" data-act="stepVal" data-k="${key}" data-d="1" aria-label="More ${label}">${icon("plus", 18)}</button></div>`;
const STEPS = { bpm: [40, 180, 5], beats: [1, 16, 1], secs: [30, 300, 30] };
ACT.stepVal = (el, ctx) => { const [lo, hi, st] = STEPS[el.dataset.k]; ctx.data[el.dataset.k] = Math.max(lo, Math.min(hi, ctx.data[el.dataset.k] + +el.dataset.d * st)); renderCtx(ctx); };

/* ---------------- CHORD FLASH ---------------- */
VIEWS.flash = {
  title: () => "Chord Flash",
  html(ctx) {
    const d = ctx.data;
    if (!d.sel) { d.sel = (ctx.q.chords || (INST() === "guitar" ? "G,C,D,Em" : "C,G,Am,F")).split(",").filter(Boolean); d.bpm = +ctx.q.bpm || 60; d.beats = +ctx.q.beats || 4; d.secs = +ctx.q.secs || 60; d.order = ctx.q.order || "random"; d.sound = false; }
    if (d.stage === "run") return `<div class="tool center stage">
        <div class="countIn" id="cd"></div>
        <div class="bigChord" id="bigChord"></div><div id="bigDiag"></div>
        <div class="nextUp" id="nextUp"></div>
        <div class="timeLeft"><span id="tl"></span></div>
        <button class="btn ghost" data-act="flashStop">Stop</button></div>`;
    if (d.stage === "done") return `<div class="tool center stage"><div class="bigChord">Nice</div><p>${d.changes} changes at ${d.bpm} bpm. +10 XP.</p>
        <div class="row center"><button class="btn on" data-act="flashAgain">Go again</button>${ctx.sheet ? `<button class="btn" data-act="closeSheet">Back to lesson</button>` : ""}</div></div>`;
    return `<div class="tool">
      <p class="hint">Tap chords to pick them. Numbers show the order if you choose "In order".</p>
      ${pickerHTML(d.sel)}
      <div class="setGrid">
        ${stepper("bpm", "Tempo", d.bpm, " bpm")}${stepper("beats", "Beats per chord", d.beats)}${stepper("secs", "Length", d.secs >= 60 ? (d.secs / 60) + " min" : d.secs + "s")}
        <div class="stepper"><span>Order</span><div class="seg small"><button class="${d.order === "random" ? "on" : ""}" data-act="flashOrder" data-v="random">Random</button><button class="${d.order === "seq" ? "on" : ""}" data-act="flashOrder" data-v="seq">In order</button></div></div>
        <label class="check"><input type="checkbox" data-change="flashSound" ${d.sound ? "checked" : ""}> Play each chord as it comes up</label>
      </div>
      <button class="btn on big full" data-act="flashStart" ${d.sel.length < 2 ? "disabled" : ""}>${icon("play", 20)} Start</button>
    </div>`;
  },
  mount(ctx) { ctx.cleanups.push(() => AudioKit.Metro.stop()); },
};
ACT.flashOrder = (el, ctx) => { ctx.data.order = el.dataset.v; renderCtx(ctx); };
ACT.flashSound = (el, ctx) => { ctx.data.sound = el.checked; };
ACT.flashStop = (el, ctx) => { AudioKit.Metro.stop(); ctx.data.stage = null; renderCtx(ctx); };
ACT.flashAgain = (el, ctx) => { ctx.data.stage = null; renderCtx(ctx); };
ACT.flashStart = (el, ctx) => {
  const d = ctx.data; d.stage = "run"; d.changes = 0; renderCtx(ctx);
  let idx = 0;
  const nextOf = cur => {
    if (d.order === "seq") return (cur + 1) % d.sel.length;
    if (d.sel.length < 2) return 0;
    let n; do { n = Math.floor(Math.random() * d.sel.length); } while (n === cur);
    return n;
  };
  let nxt = nextOf(idx);
  const show = () => {
    const c = d.sel[idx];
    $("#bigChord", ctx.root).textContent = c;
    $("#bigDiag", ctx.root).innerHTML = chordSVG(c, 1.5);
    $("#nextUp", ctx.root).innerHTML = `next <b>${esc(d.sel[nxt])}</b>`;
    if (d.sound) AudioKit.strum(c, { gain: 0.1 });
  };
  const countIn = d.beats < 4 ? 4 : d.beats;
  let end = 0;
  AudioKit.Metro.start(d.bpm, d.beats, b => {
    Timer.ping();
    if (!$("#bigChord", ctx.root)) return;
    if (b < countIn) { $("#cd", ctx.root).textContent = countIn - b; if (b === 0) { $("#bigChord", ctx.root).textContent = d.sel[0]; $("#bigDiag", ctx.root).innerHTML = chordSVG(d.sel[0], 1.5); $("#nextUp", ctx.root).textContent = "get ready"; } return; }
    if (b === countIn) { $("#cd", ctx.root).textContent = ""; end = Date.now() + d.secs * 1000; show(); }
    else if ((b - countIn) % d.beats === 0) { idx = nxt; nxt = nextOf(idx); d.changes++; show(); }
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    $("#tl", ctx.root).textContent = left + "s";
    if (end && Date.now() >= end) { AudioKit.Metro.stop(); AudioKit.sfx.done(); addXP(10); d.stage = "done"; renderCtx(ctx); }
  });
};

/* ---------------- CHORD RUSH (mic listens) ---------------- */
VIEWS.rush = {
  title: () => "Chord Rush",
  html(ctx) {
    const d = ctx.data;
    if (!d.sel) { d.sel = (ctx.q.chords || (INST() === "guitar" ? "G,C" : "C,F")).split(",").slice(0, 2); d.max = 2; }
    const key = "rush:" + d.sel.join("-"), best = App.state.best[key] || 0;
    if (d.stage === "run") return `<div class="tool center stage">
        <div class="countIn" id="cd"></div>
        <div class="pair">${d.sel.map((c, i) => `<div class="pairChord" id="pc${i}">${chordSVG(c, 1.05)}<b>${esc(c)}</b></div>`).join("")}</div>
        <div class="rushCount" id="rc">0</div>
        <div class="hearing" id="hear">Listening…</div>
        <div class="timeLeft"><span id="tl">60s</span></div>
        <button class="btn ghost" data-act="rushStop">Stop</button></div>`;
    if (d.stage === "done") return `<div class="tool center stage"><div class="rushCount">${d.count}</div>
        <p>${d.count > d.prev ? "New best for " + esc(d.sel.join(" → ")) + "!" : "Best is " + d.prev + ". Next time."}</p>
        <div class="row center"><button class="btn on" data-act="rushAgain">Go again</button>${ctx.sheet ? `<button class="btn" data-act="closeSheet">Back to lesson</button>` : ""}</div></div>`;
    if (d.err) return `<div class="tool center"><p>${esc(d.err)}</p><button class="btn on" data-act="rushAgain">Try again</button></div>`;
    return `<div class="tool">
      <p class="hint">Pick two chords. Strum one, switch, strum the other. The mic counts every clean change for one minute. Best for this pair: <b>${best}</b>.</p>
      <p class="hint warn">Experimental. Works best in a quiet room with the phone a couple feet from the guitar.</p>
      ${pickerHTML(d.sel, { max: 2 })}
      <button class="btn on big full" data-act="rushStart" ${d.sel.length !== 2 ? "disabled" : ""}>${icon("mic", 20)} Start listening</button>
    </div>`;
  },
  mount(ctx) { ctx.cleanups.push(() => AudioKit.Mic.stop()); },
};
ACT.rushStop = (el, ctx) => { AudioKit.Mic.stop(); ctx.data.stage = null; renderCtx(ctx); };
ACT.rushAgain = (el, ctx) => { ctx.data.stage = null; ctx.data.err = null; renderCtx(ctx); };
ACT.rushStart = (el, ctx) => {
  const d = ctx.data, [A, B] = d.sel;
  d.stage = "run"; d.count = 0; d.prev = App.state.best["rush:" + d.sel.join("-")] || 0; renderCtx(ctx);
  const distract = ["G","C","D","Em","Am","E","A","Dm","F","Bm","B7","E7","G7","D7","A7"].filter(c => c !== A && c !== B);
  let cand = null, run = 0, confirmed = null, end = 0, cd = 3;
  const cdEl = $("#cd", ctx.root);
  cdEl.textContent = cd;
  const cdT = setInterval(() => { cd--; if (!$("#cd", ctx.root)) return clearInterval(cdT); if (cd <= 0) { clearInterval(cdT); cdEl.textContent = ""; end = Date.now() + 60000; } else cdEl.textContent = cd; }, 800);
  ctx.cleanups.push(() => clearInterval(cdT));
  AudioKit.Mic.start(({ chroma, rms }) => {
    if (!$("#rc", ctx.root)) return;
    Timer.ping();
    if (end) {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      $("#tl", ctx.root).textContent = left + "s";
      if (left <= 0) {
        AudioKit.Mic.stop();
        if (d.count > d.prev) App.state.best["rush:" + d.sel.join("-")] = d.count;
        addXP(10); AudioKit.sfx.done(); d.stage = "done"; renderCtx(ctx); return;
      }
    }
    if (rms < 0.012) { $("#hear", ctx.root).textContent = "Listening…"; run = 0; return; }
    const { best, margin } = AudioKit.matchChord(chroma, [A, B, ...distract]);
    const hit = best && best.score > 0.55 && margin > 0.015 ? best.name : null;
    $("#hear", ctx.root).textContent = hit ? "Hearing " + hit : "Hearing something";
    if (hit === cand) run++; else { cand = hit; run = 1; }
    if (run === 3 && (hit === A || hit === B)) {
      $$(".pairChord", ctx.root).forEach((p, i) => p.classList.toggle("lit", d.sel[i] === hit));
      if (end && confirmed && confirmed !== hit) { d.count++; $("#rc", ctx.root).textContent = d.count; AudioKit.sfx.tick(); }
      confirmed = hit;
    }
  }, { chroma: true }).catch(() => { d.stage = null; d.err = "The mic is blocked. Allow microphone access for this site."; renderCtx(ctx); });
};

/* ---------------- NAME THAT SHAPE ---------------- */
VIEWS.quiz = {
  title: () => "Name That Shape",
  html(ctx) {
    const d = ctx.data;
    if (!d.sel) { d.sel = (ctx.q.chords || (INST() === "uke" ? "C,G,Am,F,Dm,Em,G7,C7,A7,D,A,E7" : INST() === "piano" ? "C,F,G,Am,Dm,Em,G7,D,A,E,Bb,Cmaj7" : "G,C,D,Em,Am,E,A,Dm,E7,A7,D7,G7")).split(","); d.mode = "shape"; }
    if (d.stage === "run") {
      const r = d.round, ans = r.ans;
      const opt = o => {
        const wrong = r.wrong.has(o), right = r.solved && o === ans;
        return d.mode === "shape"
          ? `<button class="btn big optBtn ${wrong ? "bad" : ""} ${right ? "good" : ""}" data-act="quizPick" data-o="${esc(o)}" ${wrong || r.solved ? "disabled" : ""}>${esc(o)}</button>`
          : `<button class="optTile ${wrong ? "bad" : ""} ${right ? "good" : ""}" data-act="quizPick" data-o="${esc(o)}" ${wrong || r.solved ? "disabled" : ""} aria-label="Option">${chordSVG(o, 0.85)}</button>`;
      };
      return `<div class="tool center stage">
        <div class="muted">Round ${d.n + 1} of 10 · ${d.score} first-try</div>
        ${d.mode === "shape" ? chordSVG(ans, 1.7) : `<div class="bigChord">${esc(ans)}</div>`}
        <div class="${d.mode === "shape" ? "opts" : "optGrid"}">${r.opts.map(opt).join("")}</div>
        ${r.solved ? `<button class="btn on" data-act="quizNext">Next</button>` : `<p class="hint">Keep guessing until you get it.</p>`}</div>`;
    }
    if (d.stage === "done") {
      const prev = App.state.best.quiz || 0;
      return `<div class="tool center stage"><div class="bigChord">${d.score}/10</div><p>${d.score > prev ? "New best!" : "Best: " + prev}</p>
        <div class="row center"><button class="btn on" data-act="quizSetup">Go again</button>${ctx.sheet ? `<button class="btn" data-act="closeSheet">Back to lesson</button>` : ""}</div></div>`;
    }
    return `<div class="tool">
      <div class="seg"><button class="${d.mode === "shape" ? "on" : ""}" data-act="quizMode" data-v="shape">See the shape, name it</button><button class="${d.mode === "name" ? "on" : ""}" data-act="quizMode" data-v="name">See the name, find the shape</button></div>
      <p class="hint">Pick the chords to drill (at least 4).</p>
      ${pickerHTML(d.sel)}
      <button class="btn on big full" data-act="quizStart" ${d.sel.length < 4 ? "disabled" : ""}>${icon("play", 20)} Start</button></div>`;
  },
};
function quizRound(d) {
  const ans = d.sel[Math.floor(Math.random() * d.sel.length)];
  const opts = new Set([ans]);
  while (opts.size < Math.min(4, d.sel.length)) opts.add(d.sel[Math.floor(Math.random() * d.sel.length)]);
  d.round = { ans, opts: [...opts].sort(() => Math.random() - 0.5), wrong: new Set(), solved: false };
}
ACT.quizMode = (el, ctx) => { ctx.data.mode = el.dataset.v; renderCtx(ctx); };
ACT.quizSetup = (el, ctx) => { ctx.data.stage = null; renderCtx(ctx); };
ACT.quizStart = (el, ctx) => { const d = ctx.data; d.stage = "run"; d.n = 0; d.score = 0; quizRound(d); renderCtx(ctx); };
ACT.quizPick = (el, ctx) => {
  const d = ctx.data, r = d.round, o = el.dataset.o;
  if (o === r.ans) { if (!r.wrong.size) d.score++; r.solved = true; AudioKit.sfx.good(); AudioKit.strum(o, { gain: 0.08, when: 0.2 }); }
  else { r.wrong.add(o); AudioKit.sfx.bad(); }
  Timer.ping(); renderCtx(ctx);
};
ACT.quizNext = (el, ctx) => {
  const d = ctx.data; d.n++;
  if (d.n >= 10) { if (d.score > (App.state.best.quiz || 0)) App.state.best.quiz = d.score; addXP(10); AudioKit.sfx.done(); d.stage = "done"; }
  else quizRound(d);
  renderCtx(ctx);
};

/* ---------------- RANGE FINDER ---------------- */
const AXIS = [36, 88]; // C2..E6
const pctOf = m => ((m - AXIS[0]) / (AXIS[1] - AXIS[0])) * 100;
function rangeBar(p, live) {
  return `<div class="rangeAxis" aria-hidden="true">
    ${[36, 48, 60, 72, 84].map(c => `<span class="tickC" style="left:${pctOf(c)}%">C${c / 12 - 1}</span>`).join("")}
    ${p.lo != null ? `<div class="rangeFull" style="left:${pctOf(p.lo)}%;width:${pctOf(p.hi) - pctOf(p.lo)}%"></div>` : ""}
    ${p.comfyLo != null ? `<div class="rangeComfy" style="left:${pctOf(p.comfyLo)}%;width:${pctOf(p.comfyHi) - pctOf(p.comfyLo)}%"></div>` : ""}
    ${live != null ? `<div class="rangeLive" style="left:${pctOf(live)}%"></div>` : ""}
  </div>`;
}
VIEWS.range = {
  title: () => "Range finder",
  html(ctx) {
    const d = ctx.data, people = App.state.people;
    if (d.testing) {
      const p = person(d.testing), got = d.got;
      return `<div class="tool">
        <h3>Testing ${esc(p.name)}</h3>
        <div class="howTo"><b>How to test</b><ol>
          <li>Warm up with a few easy slides up and down first.</li>
          <li>Hit Start, then sing "ah" and slide slowly down to your lowest clear note. Hold it for a second.</li>
          <li>Then slide up to your highest clear note and hold it.</li>
          <li>Only count notes you can hold steady and clear. Vocal fry (the crackly growl at the bottom) and squeaky falsetto don't count.</li>
          <li>A little effort at the edges is normal. Pain, cracking or straining means you've gone far enough.</li></ol></div>
        <div class="tNote" id="rNote">${d.listening ? "—" : ""}</div>
        <div id="rBar">${rangeBar({ lo: got.lo, hi: got.hi }, null)}</div>
        <div class="center muted" id="rText">${got.lo != null ? T.midiName(got.lo) + " to " + T.midiName(got.hi) + " · " + T.voiceType(got.lo, got.hi) : "Nothing yet"}</div>
        <div class="row center wrap">
          ${d.listening ? `<button class="btn big on" data-act="rangeStop">${icon("pause", 20)} Stop</button>` : `<button class="btn big on" data-act="rangeListen">${icon("mic", 20)} ${got.lo != null ? "Keep going" : "Start listening"}</button>`}
          ${!d.listening && got.lo != null ? `<button class="btn big" data-act="rangeSave">${icon("check", 20)} Save</button>` : ""}
          <button class="btn ghost" data-act="rangeCancel">Cancel</button>
        </div>
        ${d.err ? `<p class="hint warn">${esc(d.err)}</p>` : ""}
      </div>`;
    }
    return `<div class="tool">
      ${people.map(p => {
        const vt = T.voiceType(p.lo, p.hi);
        return `<div class="card person">
          <div class="row"><b class="grow">${esc(p.name)}</b>${p.guess ? `<span class="tag warn">guess</span>` : `<span class="tag">${vt}</span>`}</div>
          ${rangeBar(p)}
          <div class="muted small">${T.midiName(p.lo)} to ${T.midiName(p.hi)} · comfy ${T.midiName(p.comfyLo)} to ${T.midiName(p.comfyHi)}</div>
          ${(p.history || []).length > 1 ? `<details><summary>History</summary>${p.history.slice().reverse().map(h => `<div class="histRow"><span>${h.d}</span>${rangeBar({ lo: h.lo, hi: h.hi })}</div>`).join("")}</details>` : ""}
          <div class="row wrap"><button class="btn on" data-act="rangeTest" data-id="${p.id}">${icon("mic", 18)} Test</button>
            <button class="btn ghost" data-act="rangeEdit" data-id="${p.id}">${icon("sliders", 16)} Edit</button>
            ${p.id !== "me" ? `<button class="btn ghost danger" data-act="rangeDel" data-id="${p.id}">${icon("trash", 16)}</button>` : ""}</div>
        </div>`;
      }).join("")}
      <button class="btn full" data-act="rangeAdd">${icon("plus", 18)} Add a person</button>
      <p class="hint">Light bar = full range, bright bar = comfortable range. The singer buttons on songs aim for the comfortable part.</p>
    </div>`;
  },
  mount(ctx) { ctx.cleanups.push(() => AudioKit.Mic.stop()); },
};
ACT.rangeTest = (el, ctx) => { ctx.data.testing = el.dataset.id; ctx.data.got = { lo: null, hi: null }; ctx.data.listening = false; renderCtx(ctx); };
ACT.rangeCancel = (el, ctx) => { AudioKit.Mic.stop(); ctx.data.testing = null; ctx.data.listening = false; renderCtx(ctx); };
ACT.rangeStop = (el, ctx) => { AudioKit.Mic.stop(); ctx.data.listening = false; renderCtx(ctx); };
ACT.rangeListen = (el, ctx) => {
  const d = ctx.data; d.listening = true; d.err = null; renderCtx(ctx);
  let run = 0, last = null;
  AudioKit.Mic.start(({ freq, rms }) => {
    const n = $("#rNote", ctx.root); if (!n) return;
    if (freq < 0 || rms < 0.015 || freq < 60 || freq > 1300) { run = 0; return; }
    const m = AudioKit.freqToMidi(freq), r = Math.round(m);
    n.textContent = T.midiName(r);
    if (Math.abs(m - r) < 0.4 && r === last) run++; else { run = 1; last = r; }
    if (run >= 4) {
      const g = d.got;
      if (g.lo == null || r < g.lo) g.lo = r;
      if (g.hi == null || r > g.hi) g.hi = r;
      $("#rBar", ctx.root).innerHTML = rangeBar({ lo: g.lo, hi: g.hi }, r);
      $("#rText", ctx.root).textContent = T.midiName(g.lo) + " to " + T.midiName(g.hi) + " · " + T.voiceType(g.lo, g.hi);
    }
  }).catch(() => { d.listening = false; d.err = "The mic is blocked. Allow microphone access for this site."; renderCtx(ctx); });
};
ACT.rangeSave = (el, ctx) => {
  const d = ctx.data, p = person(d.testing), g = d.got;
  if (g.hi - g.lo < 5) return App.toast("That's a pretty small range. Try sliding further, or keep going.");
  Object.assign(p, { lo: g.lo, hi: g.hi, comfyLo: g.lo + 2, comfyHi: g.hi - 2, guess: false, at: Date.now() });
  p.history = [...(p.history || []), { d: today(), lo: g.lo, hi: g.hi }];
  App.save(); AudioKit.sfx.good(); App.toast(`${p.name}: ${T.voiceType(g.lo, g.hi)}, ${T.midiName(g.lo)} to ${T.midiName(g.hi)}`);
  d.testing = null; renderCtx(ctx);
};
ACT.rangeAdd = () => Modal.open(`<h3>Add a person</h3><label class="field">Name<input id="pName" maxlength="24" placeholder="Name"></label>
  <div class="row"><button class="btn on" data-act="rangeAddYes">Add</button><button class="btn ghost" data-act="closeModal">Cancel</button></div>`);
ACT.rangeAddYes = (el, ctx) => {
  const name = ($("#pName").value || "").trim(); if (!name) return;
  App.state.people.push({ id: uid(), name, lo: 50, hi: 70, comfyLo: 52, comfyHi: 68, guess: true, history: [], at: Date.now() });
  App.save(); Modal.close(); if (Router.ctx) renderCtx(Router.ctx); if (Sheet.ctx) renderCtx(Sheet.ctx);
};
ACT.rangeDel = el => Modal.open(`<h3>Remove ${esc(person(el.dataset.id).name)}?</h3><div class="row"><button class="btn danger on" data-act="rangeDelYes" data-id="${el.dataset.id}">Remove</button><button class="btn ghost" data-act="closeModal">Keep</button></div>`);
ACT.rangeDelYes = el => { App.state.people = App.state.people.filter(p => p.id !== el.dataset.id); App.save(); Modal.close(); if (Router.ctx) renderCtx(Router.ctx); };
ACT.rangeEdit = el => {
  const p = person(el.dataset.id);
  Modal.open(`<h3>Edit ${esc(p.name)}</h3>
    <label class="field">Name<input id="eName" value="${esc(p.name)}" maxlength="24"></label>
    <div class="row2"><label class="field">Lowest<input id="eLo" value="${T.midiName(p.lo)}"></label><label class="field">Highest<input id="eHi" value="${T.midiName(p.hi)}"></label></div>
    <div class="row2"><label class="field">Comfy low<input id="eCLo" value="${T.midiName(p.comfyLo)}"></label><label class="field">Comfy high<input id="eCHi" value="${T.midiName(p.comfyHi)}"></label></div>
    <p class="hint">Use note names like G2 or C#5.</p>
    <div class="row"><button class="btn on" data-act="rangeEditYes" data-id="${p.id}">Save</button><button class="btn ghost" data-act="closeModal">Cancel</button></div>`);
};
ACT.rangeEditYes = el => {
  const p = person(el.dataset.id), v = id => T.nameToMidi($("#" + id).value);
  const lo = v("eLo"), hi = v("eHi"), cl = v("eCLo"), ch = v("eCHi");
  if ([lo, hi, cl, ch].some(x => x == null)) return App.toast("Use note names like G2 or C#5");
  Object.assign(p, { name: $("#eName").value.trim() || p.name, lo: Math.min(lo, hi), hi: Math.max(lo, hi), comfyLo: Math.max(Math.min(lo, hi), cl), comfyHi: Math.min(Math.max(lo, hi), ch), guess: false, at: Date.now() });
  App.save(); Modal.close(); if (Router.ctx) renderCtx(Router.ctx);
};
