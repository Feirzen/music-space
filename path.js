/* =========================================================
   path.js — the Path map, lessons (with timer + focus XP),
   song goals with mastery, test-out, side quests, review.
   ========================================================= */
function allLessons() { return PATH.flatMap(ch => ch.lessons.map(l => ({ ...l, ch }))); }
function allSide() { return PATH.flatMap(ch => (ch.side || []).map(l => ({ ...l, ch, side: true }))); }
function findLesson(id) { return allLessons().find(l => l.id === id) || allSide().find(l => l.id === id); }
function lessonOpen(id) {
  const all = allLessons(), i = all.findIndex(l => l.id === id);
  if (i < 0) { const s = allSide().find(l => l.id === id); return s ? chapterOpen(s.ch) : false; }
  return i === 0 || !!App.state.lessonsDone[id] || !!App.state.lessonsDone[all[i - 1].id];
}
function chapterOpen(ch) { return ch.lessons.some(l => lessonOpen(l.id)); }
function currentLesson() { return allLessons().find(l => !App.state.lessonsDone[l.id]); }
function goalState(lessonId, step) {
  const { song } = resolveStepSong(step);
  if (!song) return { met: true };
  const best = bestPct(song.id), days = attemptDays(song.id), skipped = !!App.state.goalSkips[lessonId];
  return { song, best, days, skipped, met: best >= (step.min || 80) || skipped, canSkip: days >= 3 && best < (step.min || 80) };
}
function stepKey(lessonId, i) { return lessonId + ":" + i; }

/* ---------------- PATH MAP ---------------- */
VIEWS.path = {
  title: () => "Path",
  html() {
    if (INST() !== "guitar") return comingSoonHTML();
    const s = App.state, cur = currentLesson(), due = reviewDue();
    const work = markedChords("work");
    const doneN = Object.keys(s.lessonsDone).filter(id => allLessons().some(l => l.id === id)).length;
    return `
      ${progressCardHTML()}
      <div class="stats"><span>${icon("mountains", 16)} ${doneN}/${allLessons().length} lessons</span><span>${icon("star", 16)} ${s.xp.toLocaleString()} XP</span></div>
      ${due.length || work.length ? `<button class="reviewCard" data-act="tool" data-tool="review">${icon("review", 26)}<div><b>Review · about 5 min</b><span>${due.length ? due.length + " song" + (due.length > 1 ? "s" : "") + " due" : ""}${due.length && work.length ? " · " : ""}${work.length ? work.length + " chord" + (work.length > 1 ? "s" : "") + " to drill" : ""}</span></div></button>` : ""}
      ${PATH.map((ch, i) => chapterHTML(ch, cur, i)).join("")}`;
  },
  mount(ctx) {
    const curEl = $(".node.current", ctx.root);
    // the tracker card stays in view up top; only jump to your lesson when it's far down the trail
    if (curEl && !ctx.data.scrolled && curEl.getBoundingClientRect().top > window.innerHeight * 2.2) { ctx.data.scrolled = true; setTimeout(() => curEl.scrollIntoView({ block: "center", behavior: "smooth" }), 250); }
  },
};
const CHAPTER_COLORS = ["", "var(--k-ember)", "var(--k-pink)", "var(--k-violet)", "var(--k-sky)", "var(--k-gold)"];
function comingSoonHTML() {
  const w = INSTRUMENTS[INST()];
  return `${progressCardHTML()}<div class="soon">${icon(w.icon, 40)}
    <h2>${w.label} Path · coming soon!</h2>
    <p>${INST() === "voice" ? "Singing lessons are on the way. Your lyric sheets, markers, takes, pitch meter and range finder already work in voice mode." : `Lessons for ${w.word} are on the way. Your ${w.word} library, ${INST() === "uke" ? "tuner, " : ""}metronome and chord games already work in ${w.word} mode.`}</p>
    <div class="row wrap center"><button class="btn on" data-act="go" data-h="#/library">${icon("notes", 18)} ${w.label} library</button>
    <button class="btn" data-act="go" data-h="#/practice">${icon("bolt", 18)} Practice</button></div></div>
    <p class="hint center">Your guitar Path is still there. Switch to Guitar up top.</p>`;
}
function chapterHTML(ch, cur, idx = 0) {
  const s = App.state, lessons = ch.lessons;
  const done = lessons.filter(l => s.lessonsDone[l.id]).length, open = chapterOpen(ch);
  const xs = [22, 50, 76, 50];
  const rowH = 112, H = lessons.length * rowH;
  const pts = lessons.map((l, i) => [xs[i % 4], i * rowH + 44]);
  const d = pts.map((p, i) => i === 0 ? `M${p[0]} ${p[1]}` : `C ${pts[i - 1][0]} ${pts[i - 1][1] + 56}, ${p[0]} ${p[1] - 56}, ${p[0]} ${p[1]}`).join(" ");
  const roster = (ch.roster || []).map(t => { const sg = findByTitle(t); return { t, sg, pct: sg ? bestPct(sg.id) : 0 }; });
  const builtins = (ch.builtins || []).map(id => getSong(id)).filter(Boolean);
  const allDone = done === lessons.length;
  const cc = CHAPTER_COLORS[idx % CHAPTER_COLORS.length];
  return `<section class="chapter ${open ? "" : "locked"}" ${cc ? `style="--accent:${cc}"` : ""}>
    <div class="chHead">
      <span class="chIcon">${icon(ch.icon, 26)}</span>
      <div class="grow"><div class="eyebrow">Chapter ${ch.id.slice(2)}</div><h2>${esc(ch.title)}</h2><p>${esc(ch.blurb)}</p>
        <div class="bar"><i style="width:${(done / lessons.length) * 100}%"></i></div></div>
      ${ch.testOut && !allDone ? `<button class="btn small" data-act="testOut" data-ch="${ch.id}">Test out</button>` : ""}
    </div>
    <div class="roster">
      ${roster.map(r => r.sg ? `<button class="rosterCup" data-act="go" data-h="#/song/${encodeURIComponent(r.sg.id)}">${cupHTML(r.pct, 40)}<span>${esc(r.t)}</span></button>`
        : `<button class="rosterCup ghost" data-act="addRoster" data-t="${esc(r.t)}">${cupHTML(0, 40, false)}<span>${esc(r.t)}</span><small>${icon("plus", 12)} add sheet</small></button>`).join("")}
      ${builtins.map(sg => `<button class="rosterCup" data-act="go" data-h="#/song/${encodeURIComponent(sg.id)}">${cupHTML(bestPct(sg.id), 40)}<span>${esc(sg.title)}</span></button>`).join("")}
    </div>
    <div class="nodes" style="height:${H}px">
      <svg class="trail" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" vector-effect="non-scaling-stroke"/></svg>
      ${lessons.map((l, i) => {
        const isDone = !!s.lessonsDone[l.id], isOpen = lessonOpen(l.id), isCur = cur && cur.id === l.id;
        const cls = isDone ? "done" : isCur ? "current" : isOpen ? "open" : "lock";
        const x = xs[i % 4], right = x < 60;
        return `<div class="nodeWrap" style="top:${i * rowH}px;left:${x}%">
          <button class="node ${cls} ${l.boss ? "boss" : ""}" data-act="${isOpen ? "go" : "lockedLesson"}" data-h="#/lesson/${l.id}" aria-label="${esc(l.title)}${isDone ? ", done" : isOpen ? "" : ", locked"}">
            ${icon(isDone ? "check" : !isOpen ? "lock" : l.boss ? "crown" : "play", l.boss ? 28 : 24)}</button>
          <div class="nodeLabel ${right ? "right" : "left"}"><b>${esc(l.title)}</b><span>${isCur ? "Up next · " : ""}~${l.mins} min${l.boss ? " · boss" : ""}</span></div>
        </div>`;
      }).join("")}
    </div>
    ${(ch.side || []).length ? `<div class="sideRow">${ch.side.map(sq => `<button class="sideQuest ${s.lessonsDone[sq.id] ? "done" : ""}" data-act="${open ? "go" : "lockedLesson"}" data-h="#/lesson/${sq.id}">
      <span class="dia">${icon(s.lessonsDone[sq.id] ? "check" : "diamond", 16)}</span><span><b>${esc(sq.title)}</b><small>Side quest · ~${sq.mins} min</small></span></button>`).join("")}</div>` : ""}
  </section>`;
}
ACT.lockedLesson = () => { AudioKit.sfx.bad(); App.toast("Finish the lesson before this one first"); };
ACT.addRoster = el => Router.go("#/import?title=" + encodeURIComponent(el.dataset.t));

/* test out of a chapter (Foundations) */
ACT.testOut = el => {
  const ch = PATH.find(c => c.id === el.dataset.ch);
  Modal.open(`<h3>Test out of ${esc(ch.title)}</h3><p>Check everything you can already do comfortably.</p>
    <div class="menuList">${["Switch G, C, D and Em at 70 bpm without stopping", "Play the campfire strum (D – D U – U D U) steadily", "Play Am, A, E and the common 7th chords", "Fingerpick a simple arpeggio over a song", "Use a capo and read a chord sheet", "Get through at least a mini F barre chord"]
      .map((t, i) => `<label class="check"><input type="checkbox" class="toCheck" data-change="testOutCheck"> ${t}</label>`).join("")}</div>
    <div class="row"><button class="btn on" id="toYes" data-act="testOutYes" data-ch="${ch.id}" disabled>Mark Foundations done</button><button class="btn ghost" data-act="closeModal">Cancel</button></div>`);
};
ACT.testOutCheck = () => { const all = $$(".toCheck").every(c => c.checked); $("#toYes").disabled = !all; };
ACT.testOutYes = el => {
  const ch = PATH.find(c => c.id === el.dataset.ch);
  ch.lessons.forEach(l => { if (!App.state.lessonsDone[l.id]) App.state.lessonsDone[l.id] = today(); });
  addXP(60); Modal.close(); AudioKit.sfx.done(); App.toast("Foundations done. On to Rhythm Engine.");
  if (Router.ctx) renderCtx(Router.ctx);
};

/* ---------------- LESSON ---------------- */
VIEWS.lesson = {
  title: ctx => (findLesson(ctx.arg) || {}).title || "Lesson",
  html(ctx) {
    const l = findLesson(ctx.arg);
    if (!l) return `<p class="empty">Lesson not found.</p>`;
    if (!lessonOpen(l.id)) return `<p class="empty">Finish the lesson before this one first.</p>`;
    const s = App.state, checks = s.lessonDays;
    const t = Timer.t, mine = t && t.lessonId === l.id, other = t && t.lessonId !== l.id;
    let allReady = true;
    const steps = l.steps.map((st, i) => {
      const k = stepKey(l.id, i), done = !!checks[k];
      let body = "", isGoal = st.t === "goal";
      if (st.t === "chords") body = `<div class="chordStrip">${st.list.map(c => `<button class="miniChord" data-act="chord" data-c="${esc(c)}">${markDot(c)}${chordSVG(c, 0.75)}<span>${esc(c)}</span></button>`).join("")}</div>`;
      if (st.t === "tool") body = `<button class="btn" data-act="tool" data-tool="${st.tool}" data-q="${st.bpm ? "bpm=" + st.bpm : ""}">${icon(st.tool === "tuner" ? "tuner" : "metronome", 18)} Open ${st.tool === "tuner" ? "tuner" : "metronome"}</button>`;
      if (st.t === "game") {
        const q = new URLSearchParams({ ...(st.chords ? { chords: st.chords.join(",") } : {}), ...(st.bpm ? { bpm: st.bpm } : {}), ...(st.beats ? { beats: st.beats } : {}), ...(st.secs ? { secs: st.secs } : {}), ...(st.order ? { order: st.order } : {}) }).toString();
        body = `<button class="btn" data-act="tool" data-tool="${st.game}" data-q="${q}">${icon({ flash: "bolt", rush: "mic", quiz: "cards" }[st.game], 18)} ${{ flash: "Chord Flash", rush: "Chord Rush", quiz: "Name That Shape" }[st.game]}</button>`;
      }
      if (st.t === "song" || st.t === "goal") {
        const { song, missing } = resolveStepSong(st);
        const modeTag = { sing: "Sing along", pick: "Fingerpick", memory: "From memory" }[st.mode] || "";
        body = song ? `<button class="songChip" data-act="tool" data-tool="song" data-arg="${esc(song.id)}">${cupHTML(bestPct(song.id), 34)}<span><b>${esc(song.title)}</b><small>${modeTag ? modeTag + " · " : ""}${esc(song.artist || "")}</small></span>${icon("play", 18)}</button>
          ${missing ? `<p class="hint">Using ${esc(song.title)} until you add <button class="link" data-act="addRoster" data-t="${esc(missing)}">${esc(missing)}</button>.</p>` : ""}` : "";
        if (isGoal && song) {
          const g = goalState(l.id, st);
          if (!g.met) allReady = false;
          body += `<div class="goalBox ${g.met ? "met" : ""}">
            <div><b>${g.skipped ? "Skipped for now" : g.best >= (st.min || 80) ? "Goal reached" : "Goal: " + (st.min || 80) + "% on a run-through"}</b>
            <div class="hint">Best ${g.best}% · tried on ${g.days} day${g.days === 1 ? "" : "s"}${g.canSkip ? " · you can skip it now" : ""}</div></div>
            <div class="row wrap"><button class="btn on" data-act="rateSong" data-id="${esc(song.id)}">${icon("star", 16)} Rate</button>
            ${g.canSkip && !g.skipped ? `<button class="btn ghost" data-act="skipGoal" data-l="${l.id}">Skip this song</button>` : ""}</div></div>`;
        }
      }
      if (!isGoal && !done) allReady = false;
      return `<div class="step ${done || (isGoal && goalState(l.id, st).met) ? "done" : ""}">
        ${isGoal ? `<span class="stepCheck goal">${icon("star", 16)}</span>` : `<button class="stepCheck" data-act="stepDone" data-k="${k}" aria-label="${done ? "Mark not done" : "Mark done"}">${done ? icon("check", 16) : i + 1}</button>`}
        <div class="stepBody"><p>${esc(st.md || "")}</p>${body}</div></div>`;
    }).join("");
    const isDone = !!s.lessonsDone[l.id];
    return `<div class="lessonHead"><div class="eyebrow">${l.side ? "Side quest" : "Chapter " + l.ch.id.slice(2) + " · " + esc(l.ch.title)}${l.boss ? " · boss" : ""}</div>
        <div class="muted">About ${l.mins} minutes</div></div>
      <div class="timerBar" id="timerBar">
        ${mine ? `<div class="tTime">${icon("timer", 20)}<b class="liveTime">${fmtTime(Timer.elapsed())}</b><span>${Timer.running() ? "running" : "paused"}</span></div>
          <button class="btn" data-act="timerToggle">${icon(Timer.running() ? "pause" : "play", 18)} ${Timer.running() ? "Pause" : "Resume"}</button>`
        : other ? `<div class="tTime"><span>A timer is running for another lesson.</span></div><button class="btn" data-act="timerTakeover" data-l="${l.id}">Start this one instead</button>`
        : `<div class="tTime">${icon("timer", 20)}<span>Timer pauses itself if you step away.</span></div><button class="btn on" data-act="timerStart" data-l="${l.id}">${icon("play", 18)} Start lesson</button>`}
      </div>
      ${steps}
      <div class="songFoot"><button class="btn big ${allReady ? "on" : ""} full" data-act="finishLesson" data-l="${l.id}" ${allReady ? "" : "disabled"}>${isDone ? "Done · finish again for practice XP" : allReady ? "Finish lesson" : "Check off each step to finish"}</button></div>`;
  },
  onSheetClose(ctx) { renderCtx(ctx); },
};
ACT.stepDone = (el, ctx) => { const k = el.dataset.k; App.state.lessonDays[k] = App.state.lessonDays[k] ? undefined : today(); if (!App.state.lessonDays[k]) delete App.state.lessonDays[k]; App.save(); AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.skipGoal = (el, ctx) => { App.state.goalSkips[el.dataset.l] = today(); App.save(); App.toast("Skipped. It stays in your library to come back to."); renderCtx(ctx); };
ACT.timerStart = (el, ctx) => { Timer.start(el.dataset.l); renderCtx(ctx); };
ACT.timerTakeover = (el, ctx) => { Timer.stop(); Timer.start(el.dataset.l); renderCtx(ctx); };
ACT.timerToggle = (el, ctx) => { Timer.running() ? Timer.pause() : Timer.resume(); renderCtx(ctx); };
ACT.finishLesson = el => {
  const l = findLesson(el.dataset.l), t = Timer.t, ms = t && t.lessonId === l.id ? Timer.elapsed() : 0;
  if (t && t.lessonId === l.id) Timer.pause();
  if (ms < 60000) return completeLesson(l, 0, 0);
  Modal.open(`<h3>How focused were you?</h3><p class="muted">${fmtTime(ms)} on the clock. Be honest, focus earns more than time.</p>
    <div class="focusRow">${[1,2,3,4,5].map(n => `<button class="focusBtn" data-act="focusPick" data-n="${n}" data-l="${l.id}" data-ms="${ms}"><b>${n}</b><small>${["", "Distracted", "On and off", "Mostly", "Locked in", "Fully locked in"][n]}</small></button>`).join("")}</div>`);
};
ACT.focusPick = el => { Modal.close(); completeLesson(findLesson(el.dataset.l), +el.dataset.ms, +el.dataset.n); };
function completeLesson(l, ms, focus) {
  const first = !App.state.lessonsDone[l.id];
  const mins = ms / 60000, mult = [0, 0.4, 0.6, 0.8, 1, 1.2][focus] || 0;
  const timeXP = Math.round((Math.min(mins, 25) + Math.max(0, Math.min(mins, 45) - 25) * 0.5) * 2 * mult);
  const bonus = first ? (l.boss ? 40 : l.side ? 10 : 20) : 0;
  App.state.lessonsDone[l.id] = App.state.lessonsDone[l.id] || today();
  if (Timer.t && Timer.t.lessonId === l.id) Timer.stop();
  markDay(true);
  addXP(timeXP + bonus);
  AudioKit.sfx.done();
  App.toast(`+${timeXP + bonus} XP${ms ? " · " + fmtTime(ms) : ""}${first ? " · lesson complete" : ""}`);
  Router.go("#/path");
}

/* ---------------- REVIEW ---------------- */
VIEWS.review = {
  title: () => "Review",
  html() {
    const due = reviewDue(), work = markedChords("work");
    return `<p class="lead">Mixed practice keeps old skills from fading. Do what's here, it's short.</p>
      ${work.length ? `<div class="card"><b>Chords to drill</b><div class="chordStrip">${work.map(c => `<button class="miniChord" data-act="chord" data-c="${esc(c)}">${chordSVG(c, 0.6)}<span>${esc(c)}</span></button>`).join("")}</div>
        <button class="btn on" data-act="tool" data-tool="flash" data-q="chords=${encodeURIComponent(work.concat(["G", "C"]).slice(0, 6).join(","))}">${icon("bolt", 18)} Flash them</button></div>` : ""}
      ${due.length ? `<div class="card"><b>Songs due</b>${due.map(sg => `<div class="songChipRow"><button class="songChip" data-act="tool" data-tool="song" data-arg="${esc(sg.id)}">${cupHTML(bestPct(sg.id), 34)}<span><b>${esc(sg.title)}</b><small>last played ${dueInfo(sg.id).last}</small></span></button>
        <button class="btn" data-act="rateSong" data-id="${esc(sg.id)}">${icon("star", 16)} Rate</button></div>`).join("")}</div>` : `<p class="hint">No songs due right now.</p>`}`;
  },
  onSheetClose(ctx) { renderCtx(ctx); },
};

/* lessons are guitar lessons for now */
{
  const base = VIEWS.lesson.html;
  VIEWS.lesson.html = ctx => INST() === "guitar" ? base(ctx)
    : `<div class="soon"><h2>This is a guitar lesson</h2><p>Switch back to guitar to keep going.</p><button class="btn on" data-act="inst" data-k="guitar">${icon("guitar", 18)} Switch to guitar</button></div>`;
  const mount = VIEWS.lesson.mount;
  if (mount) VIEWS.lesson.mount = ctx => { if (INST() === "guitar") mount(ctx); };
}
