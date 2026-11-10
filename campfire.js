/* =========================================================
   campfire.js — the Campfire path: one goal, play any song in
   the library around a fire. 15 chords you can land on from
   anywhere, 5 strum patterns, 64 ten-minute lessons (3 a week
   for about 6 months, with room for missed weeks).
   ========================================================= */

/* The 15 chords, picked from what your library actually needs once each song
   gets its easiest capo. These cover 22 of your 24 imported songs. */
const CF_CHORDS = ["G", "C", "D", "Em", "Am", "D7", "F", "A", "E", "Dm", "E7", "A7", "B7", "Bm", "F#m"];

/* Landing levels: how fast you have to arrive on the chord, on the beat */
const CF_LEVELS = [
  null,
  { beats: 4, bpm: 60, n: 10, name: "Find it",        what: "a change every 4 clicks at 60 bpm" },
  { beats: 4, bpm: 80, n: 10, name: "Smooth",         what: "a change every 4 clicks at 80 bpm" },
  { beats: 2, bpm: 70, n: 12, name: "Quick",          what: "a change every 2 clicks at 70 bpm" },
  { beats: 2, bpm: 90, n: 12, name: "Campfire ready", what: "a change every 2 clicks at 90 bpm" },
];
const CF_MAX = 4;

/* Strum patterns. One slot per eighth note: D down, U up, X muted chuck, B bass note, "" = hand moves but misses */
const CF_PATTERNS = {
  p1: { name: "Steady Eighths", slots: ["D","U","D","U","D","U","D","U"], acc: [2, 6], beats: 4, start: 60, target: 90,
        say: "down up down up, lean on 2 and 4", why: "The base of everything. Pop, worship, and palm-muted it's pop punk." },
  p2: { name: "Old Faithful", slots: ["D","","D","U","","U","D","U"], acc: [0], beats: 4, start: 60, target: 85,
        say: "down, down-up, up-down-up", why: "The most-used acoustic strum there is. Fits most of your library." },
  p3: { name: "Island Chuck", slots: ["D","","X","U","","U","X","U"], acc: [2, 6], beats: 4, start: 60, target: 85,
        say: "down, chuck-up, up-chuck-up", why: "The chuck is a muted slap on 2 and 4. I'm Yours, Count On Me, Riptide feel." },
  p4: { name: "Waltz", slots: ["D","","D","U","D","U"], acc: [0], beats: 3, start: 55, target: 80,
        say: "down, down-up, down-up (count 3)", why: "For 3/4 and 6/8 songs: Can't Help Falling in Love, The Only Exception." },
  p5: { name: "Pick and Strum", slots: ["B","","D","U","B","","D","U"], acc: [0, 4], beats: 4, start: 55, target: 80,
        say: "bass, down-up, bass, down-up", why: "Pick the chord's bass note, then strum. Instantly softer for verses and slow songs." },
};
const CF_PAT_IDS = Object.keys(CF_PATTERNS);

/* ---------------- the 8 blocks, 8 lessons each ----------------
   lesson: [title, focus chord (or "weak" = your weakest chord), progression index, kind]
   kind: meet (new chords shown) · check (end-of-block, also works as a test-out) · final */
const CF_BLOCKS = [
  { id: "b1", title: "Home Base", chords: ["G","C","D","Em"], pat: "p1",
    blurb: "G, C, D and Em. Half of every campfire song lives here.",
    progs: [["G","C","D","G"],["G","Em","C","D"],["Em","C","G","D"],["C","G","D","Em"]],
    lessons: [["Meet the home base","G",0,"meet"],["Land on C","C",1],["Land on D","D",2],["Land on Em","Em",3],["Accents on 2 and 4","G",1],["Home base, faster","C",2],["Your first full song","D",0],["Campfire check","",0,"check"]] },
  { id: "b2", title: "Minor Mood", chords: ["Am","D7"], pat: "p2",
    blurb: "Am adds the sad-pretty sound. D7 pulls you home to G.",
    progs: [["G","Em","Am","D7"],["Am","G","C","D7"],["C","Am","D7","G"],["Em","Am","D7","G"]],
    lessons: [["Meet Am and D7","Am",0,"meet"],["Old Faithful","Am",1],["Land on D7","D7",2],["Am from anywhere","Am",3],["Sevens want to resolve","D7",0],["Old Faithful, eyes closed","Am",1],["Sing while you strum","D7",2],["Campfire check","",0,"check"]] },
  { id: "b3", title: "The F Chord", chords: ["F"], pat: "p2",
    blurb: "The chord that unlocks the pop four: C, G, Am, F.",
    progs: [["C","G","Am","F"],["F","C","G","Am"],["Am","F","C","G"],["C","F","G","C"]],
    lessons: [["Meet F (the small one first)","F",0,"meet"],["F from C","F",3],["F from anywhere","F",1],["The pop four","F",0],["Full barre F, one try","F",2],["F in the loop","F",1],["Riptide territory","F",2],["Campfire check","",0,"check"]] },
  { id: "b4", title: "Bright Keys", chords: ["A","E","Dm"], pat: "p3",
    blurb: "A and E open up the bright keys. Dm finishes your minor set.",
    progs: [["A","D","E","A"],["D","A","E","D"],["Am","Dm","E","Am"],["C","Dm","F","G"]],
    lessons: [["Meet A, E and Dm","A",0,"meet"],["The chuck","E",1],["Land on A","A",0],["Land on E","E",1],["Land on Dm","Dm",2],["Island Chuck, steady","A",3],["Key of A night","E",0],["Campfire check","",0,"check"]] },
  { id: "b5", title: "Sevens", chords: ["E7","A7","B7"], pat: "p4",
    blurb: "Seventh chords add pull. B7 is the one songs in E and Em lean on.",
    progs: [["G","E7","Am","D7"],["A","A7","D","E7"],["Em","B7","Em","B7"],["E","B7","A","E"]],
    lessons: [["Meet E7, A7 and B7","E7",0,"meet"],["Waltz time","A7",1],["Land on B7","B7",2],["B7, the tricky one","B7",3],["Land on E7","E7",0],["Land on A7","A7",1],["The slow-dance waltz","B7",2],["Campfire check","",0,"check"]] },
  { id: "b6", title: "Barre Minors", chords: ["Bm","F#m"], pat: "p4",
    blurb: "Your first real barre shapes. Bm and F#m open the keys of D and A.",
    progs: [["D","A","Bm","G"],["A","E","F#m","D"],["Bm","G","D","A"],["G","D","Em","Bm"]],
    lessons: [["Meet Bm","Bm",0,"meet"],["Bm from anywhere","Bm",2],["Meet F#m","F#m",1,"meet"],["F#m from anywhere","F#m",1],["Key of D","Bm",0],["Key of A","F#m",1],["Barre night","Bm",3],["Campfire check","",0,"check"]] },
  { id: "b7", title: "Soft and Loud", chords: [], pat: "p5",
    blurb: "No new chords. Pick and Strum for soft verses, punk eighths for loud ones.",
    progs: [["C","G","Am","F"],["D","A","Bm","G"],["G","D","Em","C"],["A","E","F#m","D"]],
    lessons: [["Pick and Strum","weak",0],["Soft verse, big chorus","weak",1],["Punk eighths","weak",2,"punk"],["Weak spots","weak",3],["Pick and Strum, faster","weak",0],["Four keys, one night","weak",1],["Any song, any key","weak",2],["Campfire check","",0,"check"]] },
  { id: "b8", title: "Campfire Nights", chords: [], pat: "mix",
    blurb: "Everything together, like a real night around the fire.",
    progs: [["C","G","Am","F"],["D","A","Bm","G"],["G","D","Em","C"],["A","E","F#m","D"]],
    lessons: [["Land anything","weak",0],["A song from memory","weak",1],["Pattern roulette","weak",2],["Weak spots","weak",3],["Requests night","weak",0],["Pattern roulette II","weak",1],["Dress rehearsal","weak",2],["Campfire Night","",0,"final"]] },
];

/* ---------------- state ---------------- */
const CF = {
  st() {
    const s = App.state;
    if (!s.campfire || typeof s.campfire !== "object") s.campfire = {};
    const c = s.campfire;
    for (const k of ["done", "steps", "lvl", "from", "pat", "days", "passes", "plan"]) if (!c[k] || typeof c[k] !== "object") c[k] = {};
    return c;
  },
  lessons() {
    if (this._ls) return this._ls;
    const out = [];
    CF_BLOCKS.forEach((b, bi) => b.lessons.forEach(([title, focus, prog, kind], n) => out.push({
      id: `cf${bi + 1}-${n + 1}`, bi, n, num: bi * 8 + n + 1, title, focus, kind: kind || "", block: b,
      prog: b.progs[prog % b.progs.length],
      pat: b.pat === "mix" ? CF_PAT_IDS[(n + bi) % CF_PAT_IDS.length] : kind === "punk" ? "p1" : b.pat,
    })));
    return (this._ls = out);
  },
  lesson(id) { return this.lessons().find(l => l.id === id); },
  isDone(id) { return !!this.st().done[id]; },
  /* the next lesson to do: first one not done */
  next() { return this.lessons().find(l => !this.isDone(l.id)) || null; },
  blockDone(bi) { return CF_BLOCKS[bi].lessons.every((_, n) => this.isDone(`cf${bi + 1}-${n + 1}`)); },
  blockOpen(bi) { return bi === 0 || this.blockDone(bi - 1) || CF_BLOCKS[bi].lessons.some((_, n) => this.isDone(`cf${bi + 1}-${n + 1}`)); },
  /* lessons open in order; a block's Campfire check is open as soon as the block is (it doubles as a test-out) */
  open(id) {
    const ls = this.lessons(), i = ls.findIndex(l => l.id === id);
    if (i < 0) return false;
    const l = ls[i];
    if (this.isDone(id) || i === 0) return true;
    if ((l.kind === "check") && this.blockOpen(l.bi)) return true;
    return this.isDone(ls[i - 1].id);
  },
  /* chords you've met: every block up to the one you're working in */
  known(uptoBi) {
    const bi = uptoBi ?? this.curBlock();
    return CF_CHORDS.filter(c => CF_BLOCKS.slice(0, bi + 1).some(b => b.chords.includes(c)) || this.level(c) > 0);
  },
  curBlock() { const n = this.next(); return n ? n.bi : CF_BLOCKS.length - 1; },
  level(c) { const v = this.st().lvl[c]; return v ? Math.min(CF_MAX, v.l || 0) : 0; },
  points() { return CF_CHORDS.reduce((a, c) => a + this.level(c), 0); },
  total() { return CF_CHORDS.length * CF_MAX; },
  pct() { return Math.round((this.points() / this.total()) * 100); },
  patSolid(p) { const v = this.st().pat[p]; return !!(v && v.best >= CF_PATTERNS[p].target); },
  patsSolid() { return CF_PAT_IDS.filter(p => this.patSolid(p)).length; },
  /* lowest level first, then the one you drilled longest ago; ties rotate by lesson so it isn't always the same chord */
  weakest(list, not = [], seed = 0) {
    const pool = (list || this.known()).filter(c => !not.includes(c));
    if (!pool.length) return CF_CHORDS[0];
    const lv = pool.map((c, i) => [c, this.level(c), (this.st().lvl[c] || {}).at || 0, (i + seed) % pool.length]);
    lv.sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[3] - b[3]);
    return lv[0][0];
  },
};
window.CF = CF;

/* ---------------- dates and weeks ---------------- */
const dIso = d => d.toLocaleDateString("en-CA");
function weekKey(iso) { const d = new Date(iso + "T12:00:00"); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return dIso(d); }
function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return dIso(d); }
const CF_PASSES = 5;
CF.weekCount = (wk = weekKey(today())) => Object.keys(CF.st().days).filter(d => weekKey(d) === wk).length;
/* finished weeks that missed 3 use a free pass (5 total) so a busy week never breaks the streak */
CF.settleWeeks = () => {
  const c = CF.st();
  if (!c.start) return;
  const cur = weekKey(today());
  let wk = weekKey(c.start), changed = false;
  while (wk < cur) {
    if (CF.weekCount(wk) < 3 && !c.passes[wk] && Object.keys(c.passes).length < CF_PASSES) { c.passes[wk] = 1; changed = true; }
    wk = addDays(wk, 7);
  }
  if (changed) App.save();
};
CF.passesLeft = () => Math.max(0, CF_PASSES - Object.keys(CF.st().passes).length);
CF.weekStreak = () => {
  const c = CF.st();
  if (!c.start) return 0;
  const cur = weekKey(today()), first = weekKey(c.start);
  let n = CF.weekCount(cur) >= 3 ? 1 : 0, wk = addDays(cur, -7);
  while (wk >= first && (CF.weekCount(wk) >= 3 || c.passes[wk])) { if (CF.weekCount(wk) >= 3) n++; wk = addDays(wk, -7); }
  return n;
};
CF.finishDate = () => {
  const left = CF.lessons().filter(l => !CF.isDone(l.id)).length;
  if (!left) return null;
  const thisWeek = Math.max(0, 3 - CF.weekCount());
  const after = Math.max(0, left - thisWeek);
  const weeks = Math.ceil(after / 3);
  const d = new Date(weekKey(today()) + "T12:00:00");
  d.setDate(d.getDate() + 7 * weeks + (after ? (((after - 1) % 3) * 2) + 1 : 6));
  return d;
};
/* a session counts toward the week when you finish a lesson, or put in 5+ minutes */
CF.markSession = (ms, lessonId) => {
  const c = CF.st(), d = today();
  if (!c.start) c.start = d;
  const cur = c.days[d] || { ms: 0, n: 0 };
  c.days[d] = { ms: Math.max(cur.ms || 0, 0) + (ms || 0), n: (cur.n || 0) + (lessonId ? 1 : 0) };
  c.at = Date.now();
};

/* ---------------- songs that fit the chords you know ---------------- */
function cfShape(name) {
  const p = T.parseChord(name); if (!p) return null;
  const f = T.family(p.q), root = T.SHARPS[p.root];
  if (f === "m" || f === "m7") return root + "m";
  if (f === "7") return root + "7";
  if (f === "dim" || f === "aug") return root + f;
  return root;
}
function cfFits(shape, known) { return known.includes(shape) || (/7$/.test(shape) && known.includes(shape.slice(0, -1))); }
/* every song you could play right now with these chords, with the capo that makes it work */
CF.playable = (known = CF.known()) => {
  const out = [];
  for (const s of allSongs(true)) {
    if (s.deleted || songInst(s) !== "guitar" || !s.body || s.status === "review") continue;
    const ch = songChords(s);
    if (!ch.length) continue;
    for (let capo = 0; capo <= 7; capo++) {
      const shapes = [...new Set(ch.map(c => cfShape(T.transposeChord(c, -capo))))];
      if (shapes.every(x => x && cfFits(x, known))) { out.push({ song: s, capo, shapes, mine: !BUILTIN_SONGS.includes(s) }); break; }
    }
  }
  return out;
};
/* which chord to learn next to open up the most songs */
CF.nextUnlock = () => {
  const known = CF.known(), base = CF.playable(known).length;
  let best = null;
  for (const c of CF_CHORDS) if (!known.includes(c)) {
    const n = CF.playable([...known, c]).length - base;
    if (n > 0 && (!best || n > best.n)) best = { c, n };
  }
  return best;
};
function pickSong(l, avoid = []) {
  const list = CF.playable();
  if (!list.length) return null;
  const has = x => x.shapes.includes(l.focus);
  const score = x => (has(x) ? 0 : 2) + (x.mine ? 0 : 1) + (avoid.includes(x.song.id) ? 4 : 0) + bestPct(x.song.id) / 100 + (x.capo > 4 ? 1.5 : x.capo ? 0.1 : 0) + Math.random() * 0.8;
  return list.map(x => [score(x), x]).sort((a, b) => a[0] - b[0])[0][1];
}

/* ---------------- lesson steps (built once per lesson, then kept) ---------------- */
CF.plan = l => {
  const c = CF.st();
  if (c.plan[l.id] && c.plan[l.id].v === 2) return c.plan[l.id];
  const known = CF.known(l.bi);
  const focus = l.focus === "weak" ? CF.weakest(known, [], l.num) : l.focus || CF.weakest(l.block.chords.length ? l.block.chords : known, [], l.num);
  const older = known.filter(x => !l.block.chords.includes(x) && x !== focus);
  const review = CF.weakest(older.length ? older : known, [focus], l.num * 7 + 3);
  const recent = Object.values(c.plan).map(p => p.song).filter(Boolean).slice(-6);
  const sp = pickSong({ ...l, focus }, recent);
  const p = { v: 2, focus, review, song: sp ? sp.song.id : null, capo: sp ? sp.capo : 0 };
  if (l.kind === "final") {
    const set = [], list = CF.playable().filter(x => x.mine).sort(() => Math.random() - 0.5);
    list.slice(0, 3).forEach(x => set.push({ id: x.song.id, capo: x.capo }));
    p.set = set;
  }
  c.plan[l.id] = p; App.save(true);
  return p;
};
CF.steps = l => {
  const p = CF.plan(l), pat = CF_PATTERNS[l.pat], steps = [];
  const bpm = Math.min(pat.target + 5, pat.start + Math.round(l.n * (pat.target - pat.start) / 6));
  if (l.kind === "check" || l.kind === "final") {
    const list = l.kind === "final" ? CF.known().slice().sort((a, b) => CF.level(a) - CF.level(b)).slice(0, 3)
      : l.block.chords.length ? l.block.chords : [p.focus, CF.weakest(CF.known(), [p.focus], l.num)];
    steps.push({ t: "text", md: l.kind === "final" ? "Last one. Land your three weakest chords, then play a three-song set with no stops between songs. Bring someone to sing with if you can."
      : `Land each of this block's chords once more. Already solid on them? Finishing this check finishes the whole block.` });
    list.forEach(ch => steps.push({ t: "land", chord: ch, md: `Land on ${ch}.` }));
    if (l.kind === "final" && p.set && p.set.length) steps.push({ t: "set", md: "Your set. Play them back to back, start to finish." });
    else steps.push({ t: "song", md: "Play it start to finish, then rate the run-through.", rate: true });
    return steps;
  }
  if (l.kind === "meet") {
    const meetList = l.block.chords.length ? (l.bi === 5 ? [p.focus] : l.block.chords) : [];
    steps.push({ t: "chords", list: meetList, md: CF_TIPS[l.id] || "Tap each chord to see and hear it. Get each one to ring clean before you time anything." });
  } else if (CF_TIPS[l.id]) steps.push({ t: "text", md: CF_TIPS[l.id] });
  if (l.n > 0 || l.bi > 0) steps.push({ t: "land", chord: p.review, md: `Warm-up: land on ${p.review} from anything.` });
  steps.push({ t: "land", chord: p.focus, md: `Focus: land on ${p.focus} from anything you know.` });
  steps.push({ t: "strum", pat: l.pat, prog: l.prog, bpm, punk: l.kind === "punk",
    md: l.kind === "punk" ? "All downstrokes, palm resting on the strings by the bridge. This is your band sound." : `${pat.name}: ${pat.say}.` });
  steps.push({ t: "song", md: "Now use it. Play the song with the pattern you just practiced. Sing if you can. Slash chords like D/F# can be played as plain D." });
  return steps;
};
const CF_TIPS = {
  "cf1-1": "These four are home base. Make each one ring clean, one string at a time, before anything gets timed.",
  "cf1-5": "Accents: hit beats 2 and 4 a little harder. That's what makes a strum groove instead of plod.",
  "cf2-1": "Am is your C shape minus one finger move. D7 is a flipped D. Let both ring clean first.",
  "cf2-5": "D7 sounds unfinished on purpose. It wants to go to G. Feel it pull.",
  "cf2-7": "Strum on autopilot and talk the words first. Then sing them.",
  "cf3-1": "Start with the small F: just the top four strings (xx3211). Index finger flat across the top two strings at fret 1. The full barre comes later, the small one plays almost every song.",
  "cf3-2": "C to F: your ring and middle fingers just walk over one string. Keep them close to the frets.",
  "cf3-5": "Try the full barre F once (index across all six at fret 1). If it buzzes, that's normal for weeks. Go back to the small F for the song.",
  "cf4-1": "A is three fingers in a row at fret 2. E is your Am shape moved up one string. Dm is a little triangle.",
  "cf4-2": "The chuck: on beats 2 and 4, let the side of your strumming hand slap the strings as it strums so they go dead. Thump, not ring.",
  "cf5-1": "Sevens are one-finger changes from chords you know. B7 is the only new shape, and it uses all four fingers.",
  "cf5-2": "Count 1 2 3, 1 2 3. Big strum on 1, lighter after. This is slow-dance time.",
  "cf6-1": "Bm: index barres the top five strings at fret 2, then an A-minor shape two frets up. Don't press harder, press closer to the fret.",
  "cf6-3": "F#m is your Em shape with an index barre across fret 2. Same trick as Bm.",
  "cf7-1": "Thumb picks the chord's lowest note on beats 1 and 3, then strum down-up. Verses get soft right away.",
  "cf7-3": "Palm-muted punk eighths: all downs, palm resting by the bridge. Bump the tempo when it feels easy.",
  "cf8-2": "Pick a song you've played a few times. Hide the screen and play it from memory. Peek only if you're stuck.",
  "cf8-5": "Requests night: hand someone your phone and let them pick from your playable list.",
};

/* ===================================================================
   UI
   =================================================================== */
const pips = (lv, big) => `<span class="pips ${big ? "big" : ""}" aria-label="level ${lv} of ${CF_MAX}">${[1, 2, 3, 4].map(i => `<i class="${i <= lv ? "on" : ""}"></i>`).join("")}</span>`;
const fmtDay = d => d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

/* the summary the widget reads (synced with your progress) */
CF.refreshSummary = () => {
  const c = CF.st(), n = CF.next();
  const sum = { pts: CF.points(), total: CF.total(), pct: CF.pct(), pats: CF.patsSolid(), next: n ? { num: n.num, title: n.title, block: n.block.title } : null,
    done: Object.keys(c.done).length, of: CF.lessons().length, streak: CF.weekStreak() };
  const fd = CF.finishDate(); sum.finish = fd ? dIso(fd) : null;
  if (JSON.stringify(sum) !== JSON.stringify(c.sum ? { ...c.sum, at: undefined } : null)) { c.sum = { ...sum, at: Date.now() }; }
  return c.sum;
};

function campfireHomeHTML() {
  const c = CF.st();
  CF.settleWeeks();
  const pct = CF.pct(), pts = CF.points(), total = CF.total(), n = CF.next();
  const wk = CF.weekCount(), streak = CF.weekStreak(), fd = CF.finishDate();
  const playable = CF.playable(), mine = playable.filter(x => x.mine);
  const unlock = CF.nextUnlock();
  CF.refreshSummary();
  const weekDots = [0, 1, 2].map(i => `<span class="wkDot ${i < wk ? "on" : ""}">${i < wk ? icon("check", 18) : ""}</span>`).join("");
  return `
  <section class="cfHero">
    <div class="cfHeroTop">
      <div><div class="eyebrow">Campfire ready</div><div class="cfPct"><b data-count="${pct}">${pct}</b><span>%</span></div></div>
      <div class="cfHeroSide"><span>${pts} of ${total} chord levels</span><span>${CF.patsSolid()}/${CF_PAT_IDS.length} strum patterns</span><span>${mine.length} of your songs playable</span></div>
    </div>
    <div class="cfBar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Campfire ready"><i style="--w:${Math.max(pct, 1.5)}%"></i>
      ${[25, 50, 75].map(m => `<em style="left:${m}%"></em>`).join("")}</div>
    <p class="hint">The goal: land on any of the 15 campfire chords from any other one, on the beat. Each chord has 4 levels.</p>
  </section>

  <section class="cfWeek">
    <div class="wkDots" aria-label="${wk} of 3 sessions this week">${weekDots}</div>
    <div class="wkText"><b>${wk >= 3 ? "Week done. Nice." : `${wk} of 3 this week`}</b>
      <span>${streak ? `${streak}-week streak · ` : ""}${CF.passesLeft()} free pass${CF.passesLeft() === 1 ? "" : "es"} left${fd ? ` · done around ${fmtDay(fd)}` : ""}</span></div>
  </section>

  ${n ? `<section class="upNext" style="--bc:${blockColor(n.bi)}">
    <div class="eyebrow">Up next · lesson ${n.num} of ${CF.lessons().length} · ${esc(n.block.title)}</div>
    <h2>${esc(n.title)}</h2>
    <div class="upMeta">${icon("timer", 16)} 10 min${n.kind === "check" ? " · block check" : ""}${n.kind === "final" ? " · the big one" : ""}</div>
    <button class="btn on big full" data-act="cfStart" data-l="${n.id}">${icon("play", 20)} ${Timer.t && Timer.t.lessonId === n.id ? "Keep going" : "Start"}</button>
  </section>` : `<section class="upNext done"><h2>Campfire path complete</h2><p class="hint">Every lesson done. Keep the chords warm with Land It in Practice, and go play for people.</p></section>`}

  <section class="card cfChords">
    <div class="row"><b class="grow">Your campfire chords</b><button class="btn ghost small" data-act="go" data-h="#/land">${icon("bolt", 16)} Land It</button></div>
    <div class="cfChordGrid">${CF_CHORDS.map(ch => { const lv = CF.level(ch), met = CF.known().includes(ch);
      return `<button class="cfChord ${met ? "" : "later"} ${lv >= CF_MAX ? "max" : ""}" data-act="go" data-h="#/land/${encodeURIComponent(ch)}" aria-label="${esc(ch)}, level ${lv}">
        <b>${esc(ch)}</b>${pips(lv)}</button>`; }).join("")}</div>
    ${unlock ? `<p class="hint">${icon("sparkle", 14, "inl")} Learning <b>${esc(unlock.c)}</b> opens ${unlock.n} more song${unlock.n > 1 ? "s" : ""}.</p>` : ""}
  </section>

  ${playable.length ? `<section class="card"><b>Songs you can play right now</b>
    <div class="cfSongs">${playable.sort((a, b) => b.mine - a.mine).slice(0, 14).map(x => `<button class="cfSong" data-act="cfOpenSong" data-id="${esc(x.song.id)}" data-capo="${x.capo}">
      <span class="grow"><b>${esc(x.song.title)}</b><small>${x.capo ? "Capo " + x.capo + " · " : ""}${x.shapes.join(" ")}</small></span>${bestPct(x.song.id) ? `<em class="pctTag">${bestPct(x.song.id)}%</em>` : ""}${icon("play", 16)}</button>`).join("")}</div></section>` : ""}

  <div class="cfBlocks">${CF_BLOCKS.map((b, bi) => blockHTML(b, bi, n)).join("")}</div>`;
}
const BLOCK_COLORS = ["var(--k-ember)", "var(--k-pink)", "var(--k-gold)", "var(--k-sky)", "var(--k-violet)", "var(--k-coral)", "var(--k-lime)", "var(--k-sea)"];
const blockColor = bi => BLOCK_COLORS[bi % BLOCK_COLORS.length];
function blockHTML(b, bi, n) {
  const ls = CF.lessons().filter(l => l.bi === bi), done = ls.filter(l => CF.isDone(l.id)).length, open = CF.blockOpen(bi);
  const isCur = n && n.bi === bi;
  return `<details class="cfBlock ${open ? "" : "locked"} ${done === ls.length ? "complete" : ""}" ${isCur ? "open" : ""} style="--bc:${blockColor(bi)}">
    <summary><span class="bNum">${done === ls.length ? icon("check", 18) : bi + 1}</span>
      <span class="bText"><b>${esc(b.title)}</b><small>${b.chords.length ? b.chords.join(" · ") + " · " : ""}${b.pat === "mix" ? "all patterns" : CF_PATTERNS[b.pat].name}</small></span>
      <span class="bCount">${done}/${ls.length}</span></summary>
    <p class="hint">${esc(b.blurb)}</p>
    <div class="bBar"><i style="width:${(done / ls.length) * 100}%"></i></div>
    <div class="lessonList">${ls.map(l => { const d = CF.isDone(l.id), o = CF.open(l.id), cur = n && n.id === l.id;
      return `<button class="lRow ${d ? "done" : ""} ${cur ? "cur" : ""} ${o ? "" : "lock"}" data-act="${o ? "go" : "cfLocked"}" data-h="#/cflesson/${l.id}">
        <span class="lChk">${d ? icon("check", 14) : o ? l.num : icon("lock", 13)}</span><span class="lT">${esc(l.title)}</span>
        ${l.kind === "check" ? `<span class="tag">${d ? "check" : "check · test out"}</span>` : l.kind === "final" ? `<span class="tag">finale</span>` : ""}</button>`; }).join("")}</div>
  </details>`;
}
ACT.cfLocked = () => { AudioKit.sfx.bad(); App.toast("Finish the lesson before this one first"); };
ACT.cfStart = el => {
  const id = el.dataset.l;
  if (!Timer.t || Timer.t.lessonId !== id) { if (Timer.t) Timer.stop(); Timer.start(id); }
  Router.go("#/cflesson/" + id);
};
ACT.pathMode = el => { App.state.pathMode = el.dataset.v; App.save(true); AudioKit.sfx.tap(); Router.render(); };
ACT.cfOpenSong = el => openCfSong(el.dataset.id, +el.dataset.capo);
function openCfSong(id, capo, fromCtx) {
  const p = prefs(id);
  if (p.capo !== capo || p.shift) setPrefs(id, { capo, shift: 0 });
  if (fromCtx) openTool("song", id, {}, fromCtx); else Router.go("#/song/" + encodeURIComponent(id));
}
function pathModeToggle() {
  const m = App.state.pathMode === "classic" ? "classic" : "campfire";
  return `<div class="pathMode"><div class="seg small"><button class="${m === "campfire" ? "on" : ""}" data-act="pathMode" data-v="campfire">${icon("sparkle", 14)} Campfire</button><button class="${m === "classic" ? "on" : ""}" data-act="pathMode" data-v="classic">${icon("mountains", 14)} Classic</button></div></div>`;
}

/* ---------------- LESSON ---------------- */
const cfStepKey = (id, i) => id + ":" + i;
VIEWS.cflesson = {
  title: ctx => (CF.lesson(ctx.arg) || {}).title || "Lesson",
  html(ctx) {
    if (INST() !== "guitar") return `<div class="soon"><h2>This is a guitar lesson</h2><p>Switch back to guitar to keep going.</p><button class="btn on" data-act="inst" data-k="guitar">${icon("guitar", 18)} Switch to guitar</button></div>`;
    const l = CF.lesson(ctx.arg);
    if (!l) return `<p class="empty">Lesson not found.</p>`;
    if (!CF.open(l.id)) return `<p class="empty">Finish the lesson before this one first.</p>`;
    const c = CF.st(), steps = CF.steps(l), p = CF.plan(l);
    const t = Timer.t, mine = t && t.lessonId === l.id, other = t && t.lessonId !== l.id;
    const ms = mine ? Timer.elapsed() : 0, capped = mine && t.capped;
    let allDone = true;
    const body = steps.map((st, i) => {
      const k = cfStepKey(l.id, i), done = !!c.steps[k];
      if (!done) allDone = false;
      let inner = "";
      if (st.t === "chords") inner = `<div class="chordStrip">${st.list.map(ch => `<button class="miniChord" data-act="chord" data-c="${esc(ch)}">${chordSVG(ch, 0.75)}<span>${esc(ch)}</span></button>`).join("")}</div>`;
      if (st.t === "land") { const lv = CF.level(st.chord), tryLv = Math.min(CF_MAX, lv + 1);
        inner = `<button class="btn" data-act="cfTool" data-tool="land" data-arg="${esc(st.chord)}" data-q="${new URLSearchParams({ lesson: l.id, step: i })}">${icon("bolt", 18)} Land It: ${esc(st.chord)} ${pips(lv)}</button>
          <div class="hint">${lv >= CF_MAX ? "Maxed. This keeps it warm." : `Going for level ${tryLv}: ${CF_LEVELS[tryLv].name}.`}</div>`; }
      if (st.t === "strum") { const pt = CF_PATTERNS[st.pat];
        inner = `${patternHTML(st.pat, false, st.punk)}<button class="btn" data-act="cfTool" data-tool="strum" data-arg="${st.pat}" data-q="${new URLSearchParams({ lesson: l.id, step: i, prog: st.prog.join(","), bpm: st.bpm, ...(st.punk ? { punk: 1 } : {}) })}">${icon("metronome", 18)} ${esc(st.punk ? "Punk Eighths" : pt.name)} · ${st.prog.join(" ")} · ${st.punk ? st.bpm + 30 : st.bpm} bpm</button>`; }
      if (st.t === "song") {
        const sg = p.song && getSong(p.song);
        inner = sg ? `<button class="songChip" data-act="cfSong" data-id="${esc(sg.id)}" data-capo="${p.capo}">${cupHTML(bestPct(sg.id), 34)}<span><b>${esc(sg.title)}</b><small>${p.capo ? "Capo " + p.capo + " · " : ""}${esc(sg.artist || "")}</small></span>${icon("play", 18)}</button>
          <div class="row wrap">${st.rate ? `<button class="btn small on" data-act="rateSong" data-id="${esc(sg.id)}" data-lesson="${l.id}">${icon("star", 15)} Rate it</button>` : ""}<button class="btn ghost small" data-act="cfSwap" data-l="${l.id}">${icon("refresh", 15)} Different song</button></div>`
          : `<p class="hint">No song fits these chords yet. Add a few in the Library and they'll show up here.</p>`;
      }
      if (st.t === "set") inner = `<div class="cfSet">${(p.set || []).map((x, j) => { const sg = getSong(x.id); return sg ? `<button class="songChip" data-act="cfSong" data-id="${esc(sg.id)}" data-capo="${x.capo}"><span class="setNum">${j + 1}</span><span><b>${esc(sg.title)}</b><small>${x.capo ? "Capo " + x.capo : "No capo"}</small></span>${icon("play", 18)}</button>` : ""; }).join("")}</div>`;
      return `<div class="step ${done ? "done" : ""}">
        <button class="stepCheck" data-act="cfStep" data-k="${k}" aria-label="${done ? "Mark not done" : "Mark done"}">${done ? icon("check", 16) : i + 1}</button>
        <div class="stepBody"><p>${esc(st.md || "")}</p>${inner}</div></div>`;
    }).join("");
    const pctT = Math.min(100, (ms / 600000) * 100), over = ms > 600000;
    return `<div class="lessonHead"><div class="eyebrow">Lesson ${l.num} of ${CF.lessons().length} · ${esc(l.block.title)}${l.kind === "check" ? " · block check" : ""}</div></div>
      <div class="timerBar cfTimer ${over ? "over" : ""}" id="timerBar">
        ${mine ? `<div class="tRing" style="--p:${pctT}">${icon("timer", 18)}</div><div class="tTime"><b class="liveTime">${fmtTime(ms)}</b><span class="cfTimeNote">${capped ? "stopped at 15" : over ? "bonus time, stops at 15" : "of 10 min"}</span></div>
          ${capped ? "" : `<button class="btn" data-act="timerToggle">${icon(Timer.running() ? "pause" : "play", 18)} ${Timer.running() ? "Pause" : "Resume"}</button>`}`
        : other ? `<div class="tTime"><span>A timer is running for another lesson.</span></div><button class="btn" data-act="timerTakeover" data-l="${l.id}">Start this one</button>`
        : `<div class="tTime">${icon("timer", 20)}<span>10 minutes. Stops you at 15.</span></div><button class="btn on" data-act="timerStart" data-l="${l.id}">${icon("play", 18)} Start</button>`}
      </div>
      ${body}
      <div class="songFoot"><button class="btn big ${allDone ? "on" : ""} full" data-act="cfFinish" data-l="${l.id}">${CF.isDone(l.id) ? "Done · finish again for practice XP" : allDone ? "Finish lesson" : "Finish for today"}</button>
      ${!allDone ? `<p class="hint center">Check off every step to complete the lesson. Finishing early still counts toward your week after 5 minutes.</p>` : ""}</div>`;
  },
  onSheetClose(ctx) { renderCtx(ctx); },
};
ACT.cfStep = (el, ctx) => { const c = CF.st(), k = el.dataset.k; if (c.steps[k]) delete c.steps[k]; else c.steps[k] = today(); c.at = Date.now(); App.save(); AudioKit.sfx.tap(); renderCtx(ctx); };
ACT.cfTool = (el, ctx) => { AudioKit.sfx.tap(); Timer.ping(); Sheet.open(el.dataset.tool, el.dataset.arg, Object.fromEntries(new URLSearchParams(el.dataset.q || ""))); };
ACT.cfSong = (el, ctx) => {
  const l = CF.lesson(Router.cur.arg);
  if (l) { const steps = CF.steps(l), i = steps.findIndex(s => s.t === "song" || s.t === "set"); if (i >= 0 && !steps[i].rate) { CF.st().steps[cfStepKey(l.id, i)] = today(); App.save(); } }
  const p = prefs(el.dataset.id), capo = +el.dataset.capo;
  if (p.capo !== capo || p.shift) setPrefs(el.dataset.id, { capo, shift: 0 });
  Timer.ping(); Sheet.open("song", el.dataset.id, {});
};
ACT.cfSwap = (el, ctx) => {
  const l = CF.lesson(el.dataset.l), c = CF.st(), p = CF.plan(l);
  const sp = pickSong({ ...l, focus: p.focus }, [p.song, ...Object.values(c.plan).map(x => x.song)].filter(Boolean));
  if (sp) { p.song = sp.song.id; p.capo = sp.capo; App.save(); }
  renderCtx(ctx);
};
/* rating a song from a lesson checks off its song step */
{
  const base = ACT.saveRating;
  ACT.saveRating = (el, ctx) => {
    const lid = ctx && ctx.q && ctx.q.lesson;
    if (lid && lid.startsWith("cf")) { const l = CF.lesson(lid); if (l) { const i = CF.steps(l).findIndex(s => s.t === "song" || s.t === "set"); if (i >= 0) CF.st().steps[cfStepKey(l.id, i)] = today(); } }
    base(el, ctx);
  };
}
ACT.cfFinish = el => {
  const l = CF.lesson(el.dataset.l), t = Timer.t, mine = t && t.lessonId === l.id;
  const ms = Math.min(mine ? Timer.elapsed() : 0, 15 * 60000);
  const c = CF.st(), steps = CF.steps(l), allDone = steps.every((_, i) => c.steps[cfStepKey(l.id, i)]);
  if (!allDone && ms < 5 * 60000 && !el.dataset.sure) {
    return Modal.open(`<h3>Stop for today?</h3><p>Your checked steps stay checked. Five minutes or more counts toward your week.</p>
      <div class="row"><button class="btn on" data-act="cfFinish" data-l="${l.id}" data-sure="1">Stop here</button><button class="btn ghost" data-act="closeModal">Keep going</button></div>`);
  }
  Modal.close();
  if (mine) Timer.stop();
  const wkBefore = CF.weekCount(), first = allDone && !c.done[l.id];
  if (allDone) c.done[l.id] = c.done[l.id] || today();
  const counts = allDone || ms >= 5 * 60000;
  if (counts) CF.markSession(ms, allDone ? l.id : null);
  c.at = Date.now();
  markDay(allDone);
  const xp = Math.round(Math.min(15, ms / 60000) * 2) + (first ? (l.kind ? 30 : 20) : 0);
  addXP(xp);
  CF.refreshSummary(); App.save();
  const wk = CF.weekCount(), nx = CF.next();
  AudioKit.sfx[wk >= 3 && wkBefore < 3 ? "win" : "done"]();
  Router.go("#/path");
  setTimeout(() => Modal.open(`<div class="cfDone">
    <div class="wkDots big">${[0, 1, 2].map(i => `<span class="wkDot ${i < wk ? "on" : ""} ${i === wk - 1 && counts ? "pop" : ""}">${i < wk ? icon("check", 22) : ""}</span>`).join("")}</div>
    <h3>${!counts ? "Saved for next time" : wk >= 3 && wkBefore < 3 ? "Three this week. Week done." : wk > 3 ? "Bonus session this week" : `${wk} of 3 this week`}</h3>
    <p class="muted">${first ? "Lesson complete · " : ""}+${xp} XP${ms ? " · " + fmtTime(ms) : ""}</p>
    <div class="cfMini"><span>Campfire ready</span><div class="cfBar small"><i style="--w:${Math.max(CF.pct(), 1.5)}%"></i></div><b>${CF.pct()}%</b></div>
    ${nx ? `<p class="hint">Next time: ${esc(nx.title)}</p>` : ""}
    <button class="btn on full" data-act="closeModal">Nice</button></div>`), 120);
};

/* ---------------- TIMER: 10 minutes, bonus time, hard stop at 15 ---------------- */
CF.tickCap = t => {
  const mins = Timer.elapsed() / 60000;
  if (mins >= 10 && !t.ot) { t.ot = true; App.save(true); AudioKit.sfx.good(); App.toast("That's your 10. Bonus time until 15."); if (Router.ctx && Router.ctx.name === "cflesson") renderCtx(Router.ctx); }
  if (mins >= 15 && !t.capped) {
    t.capped = true; Timer.pause();
    try { AudioKit.Metro.stop(); AudioKit.Mic.stop(); } catch (e) {}
    if (Sheet.ctx) Sheet.close();
    if (Router.cur.name !== "cflesson") Router.go("#/cflesson/" + t.lessonId);
    setTimeout(() => Modal.open(`<h3>That's 15 minutes</h3><p>Stopping here on purpose. Ending while it still feels good makes the next session easy to start.</p>
      <button class="btn on full" data-act="cfFinish" data-l="${t.lessonId}" data-sure="1">${icon("check", 18)} Wrap up</button>`), 200);
  }
};

/* ---------------- LAND IT (land on a chord from anything) ---------------- */
VIEWS.land = {
  title: ctx => ctx.arg ? "Land on " + ctx.arg : "Land It",
  html(ctx) {
    const d = ctx.data, c = ctx.arg;
    if (!c) return landPickerHTML();
    const lv = CF.level(c), tryLv = Math.min(CF_MAX, lv + 1), L = CF_LEVELS[d.level || tryLv];
    if (!d.level) d.level = tryLv;
    const pool = d.pool || (d.pool = landPool(c));
    if (d.stage === "run") return `<div class="tool center stage landStage">
      <div class="countIn" id="cd"></div>
      <div class="landProg" id="lp">${[...Array(L.n)].map(() => "<i></i>").join("")}</div>
      <div class="bigChord" id="bigChord"></div><div id="bigDiag"></div>
      <div class="nextUp" id="nextUp"></div>
      <button class="btn ghost" data-act="landStop">Stop</button></div>`;
    if (d.stage === "rate") return `<div class="tool center stage">
      <h2 class="cfQ">How did the landings go?</h2><p class="muted">Clean means the chord rang on the beat, not a beat late.</p>
      <div class="rateGrid">${[["0", "All clean"], ["1", "Missed 1"], ["2", "Missed 2 or 3"], ["3", "Missed more"]].map(([v, t]) => `<button class="btn big ${+v < 2 ? "on" : ""}" data-act="landRate" data-v="${v}">${t}</button>`).join("")}</div></div>`;
    if (d.stage === "done") return `<div class="tool center stage">
      ${d.up ? `<div class="lvUp">${pips(CF.level(c), true)}</div><h2 class="cfQ">${esc(c)} is level ${CF.level(c)}</h2><p>${esc(CF_LEVELS[CF.level(c)].name)}${CF.level(c) >= CF_MAX ? ". That's campfire ready." : ". Next up: " + CF_LEVELS[CF.level(c) + 1].what + "."}</p>`
        : d.pass ? `<h2 class="cfQ">Clean</h2><p>Kept ${esc(c)} warm. +10 XP.</p>`
        : `<h2 class="cfQ">That's the work</h2><p>Landing is a reflex, and reflexes build overnight. Try once more, or slow it down.</p>`}
      <div class="row center wrap"><button class="btn ${d.pass ? "" : "on"}" data-act="landAgain">${icon("refresh", 16)} Again</button>
        ${!d.pass && d.level > 1 ? `<button class="btn" data-act="landEasier">Slower</button>` : ""}
        ${ctx.sheet ? `<button class="btn ${d.pass ? "on" : ""}" data-act="closeSheet">Back to lesson</button>` : `<button class="btn ghost" data-act="go" data-h="#/land">Other chords</button>`}</div></div>`;
    const from = (CF.st().from[c] || {});
    return `<div class="tool">
      <div class="landHead">${chordSVG(c, 1.3)}<div><div class="eyebrow">Level ${lv} of ${CF_MAX}</div>${pips(lv, true)}
        <p class="landWhat"><b>${esc(L.name)}</b> · ${esc(L.what)}</p></div></div>
      <p class="hint">The app flashes a random chord, then ${esc(c)}, then another random chord, then ${esc(c)} again. Keep strumming the whole time and be on ${esc(c)} when its beat hits. ${L.n} landings.</p>
      <div class="card"><b>Coming from</b><div class="chips">${pool.map(x => `<span class="chip ${from[x] ? "on" : ""}">${esc(x)}${from[x] ? " " + icon("check", 12) : ""}</span>`).join("")}</div>
        <p class="hint">Chords you've landed ${esc(c)} from cleanly get a check.</p></div>
      ${d.level !== tryLv ? `<p class="hint warn">Practicing at level ${d.level} (slower). It won't level you up, but it still counts.</p>` : ""}
      <label class="check"><input type="checkbox" data-change="landSound" ${d.sound ? "checked" : ""}> Play each chord as it comes up</label>
      <button class="btn on big full" data-act="landStart">${icon("play", 20)} Start</button></div>`;
  },
  mount(ctx) { ctx.cleanups.push(() => AudioKit.Metro.stop()); },
};
function landPool(c) { const k = CF.known().filter(x => x !== c); return k.length >= 2 ? k : CF_CHORDS.slice(0, 5).filter(x => x !== c); }
function landPickerHTML() {
  return `<p class="lead">Pick a chord. The drill throws random chords at you and you land on this one, on the beat.</p>
    <div class="cfChordGrid big">${CF_CHORDS.map(ch => `<button class="cfChord ${CF.known().includes(ch) ? "" : "later"} ${CF.level(ch) >= CF_MAX ? "max" : ""}" data-act="go" data-h="#/land/${encodeURIComponent(ch)}">${chordSVG(ch, 0.6)}<b>${esc(ch)}</b>${pips(CF.level(ch))}</button>`).join("")}</div>
    <p class="hint center">Weakest first is the fastest way up the bar.</p>`;
}
ACT.landSound = (el, ctx) => { ctx.data.sound = el.checked; };
ACT.landStop = (el, ctx) => { AudioKit.Metro.stop(); ctx.data.stage = null; renderCtx(ctx); };
ACT.landAgain = (el, ctx) => { ctx.data.stage = null; ctx.data.up = false; renderCtx(ctx); };
ACT.landEasier = (el, ctx) => { ctx.data.level = Math.max(1, ctx.data.level - 1); ctx.data.stage = null; renderCtx(ctx); };
ACT.landStart = (el, ctx) => {
  const d = ctx.data, c = ctx.arg, L = CF_LEVELS[d.level], pool = d.pool;
  // from, target, from, target ... never the same "from" twice in a row
  const seq = []; let last = null;
  for (let i = 0; i < L.n; i++) { let f; do { f = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && f === last); last = f; seq.push(f, c); }
  d.seq = seq; d.used = [...new Set(seq.filter(x => x !== c))]; d.stage = "run"; renderCtx(ctx);
  let idx = -1, landed = 0;
  const show = i => {
    const ch = seq[i], nx = seq[i + 1];
    const big = $("#bigChord", ctx.root); if (!big) return;
    big.textContent = ch; big.classList.toggle("target", ch === c);
    $("#bigDiag", ctx.root).innerHTML = chordSVG(ch, 1.4);
    $("#nextUp", ctx.root).innerHTML = nx ? `next <b>${esc(nx)}</b>` : "last one";
    if (d.sound) AudioKit.strum(ch, { gain: 0.1 });
    if (ch === c) { landed++; const p = $$("#lp i", ctx.root)[landed - 1]; if (p) p.classList.add("on"); }
  };
  const countIn = 4;
  AudioKit.Metro.start(L.bpm, L.beats, b => {
    Timer.ping();
    if (!$("#bigChord", ctx.root)) return;
    if (b < countIn) { $("#cd", ctx.root).textContent = countIn - b; if (b === 0) { $("#bigChord", ctx.root).textContent = seq[0]; $("#bigDiag", ctx.root).innerHTML = chordSVG(seq[0], 1.4); $("#nextUp", ctx.root).textContent = "get ready"; } return; }
    const k = b - countIn;
    if (k % L.beats === 0) {
      $("#cd", ctx.root).textContent = "";
      idx++;
      if (idx >= seq.length) { AudioKit.Metro.stop(); d.stage = "rate"; AudioKit.sfx.tap(); renderCtx(ctx); return; }
      show(idx);
    }
  });
};
ACT.landRate = (el, ctx) => {
  const d = ctx.data, c = ctx.arg, v = +el.dataset.v, cf = CF.st();
  const pass = v <= 1, tryLv = Math.min(CF_MAX, CF.level(c) + 1);
  const cur = cf.lvl[c] || { l: 0, hist: [] };
  cur.hist = [...(cur.hist || []), { d: today(), lv: d.level, miss: v }].slice(-30);
  d.up = false;
  if (pass && d.level === tryLv && CF.level(c) < CF_MAX) { cur.l = tryLv; d.up = true; }
  cur.at = Date.now(); cf.lvl[c] = cur;
  if (pass) { const f = cf.from[c] || (cf.from[c] = {}); d.used.forEach(x => f[x] = (f[x] || 0) + 1); }
  if (!cf.start) cf.start = today();
  cf.at = Date.now();
  d.pass = pass; d.stage = "done";
  // the lesson step counts as done whenever you finish the drill
  const lid = ctx.q && ctx.q.lesson;
  if (lid && ctx.q.step != null) cf.steps[cfStepKey(lid, +ctx.q.step)] = today();
  addXP(d.up ? 15 : pass ? 10 : 6);
  CF.refreshSummary(); App.save();
  AudioKit.sfx[d.up ? "win" : pass ? "good" : "tap"]();
  renderCtx(ctx);
};

/* ---------------- STRUM LAB ---------------- */
function patternHTML(pid, live, punk) {
  const p = CF_PATTERNS[pid], slots = punk ? ["D","D","D","D","D","D","D","D"] : p.slots;
  const counts = p.beats === 3 ? ["1","&","2","&","3","&"] : ["1","&","2","&","3","&","4","&"];
  const glyph = s => s === "D" ? icon("down", 22) : s === "U" ? icon("up", 22) : s === "X" ? "<b>×</b>" : s === "B" ? "<b>B</b>" : "<i>·</i>";
  return `<div class="patGrid ${live ? "live" : ""} ${punk ? "punk" : ""}" style="--n:${slots.length}">${slots.map((s, i) => `<div class="pSlot ${s ? "s" + s : "miss"} ${p.acc.includes(i) && !punk ? "acc" : ""}" data-i="${i}"><span>${glyph(s)}</span><small>${counts[i]}</small></div>`).join("")}</div>`;
}
VIEWS.strum = {
  title: ctx => ctx.q.punk ? "Punk Eighths" : (CF_PATTERNS[ctx.arg] || {}).name || "Strum Lab",
  html(ctx) {
    const d = ctx.data, pid = CF_PATTERNS[ctx.arg] ? ctx.arg : "p2", p = CF_PATTERNS[pid], punk = !!ctx.q.punk;
    if (!d.prog) { d.prog = (ctx.q.prog || "G,C,D,G").split(","); d.bpm = (+ctx.q.bpm || p.start) + (punk ? 30 : 0); d.bars = 8; }
    if (d.stage === "run") return `<div class="tool center stage">
      <div class="countIn" id="cd"></div>
      <div class="barChords" id="bc">${d.prog.map((c, i) => `<span data-i="${i}">${esc(c)}</span>`).join("")}</div>
      ${patternHTML(pid, true, punk)}
      <div class="muted" id="barN">bar 1 of ${d.bars}</div>
      <button class="btn ghost" data-act="strumStop">Stop</button></div>`;
    if (d.stage === "rate") return `<div class="tool center stage"><h2 class="cfQ">How steady was it?</h2>
      <div class="rateGrid">${[["2", "Steady the whole way"], ["1", "Mostly"], ["0", "Lost it"]].map(([v, t]) => `<button class="btn big ${v === "2" ? "on" : ""}" data-act="strumRate" data-v="${v}">${t}</button>`).join("")}</div></div>`;
    if (d.stage === "done") return `<div class="tool center stage"><h2 class="cfQ">${d.solid ? esc(p.name) + " is solid" : d.v === 2 ? "Steady at " + d.bpm : "Good reps"}</h2>
      <p>${d.solid ? "That pattern counts toward your campfire bar now." : d.v === 2 ? `Solid at ${p.target} bpm counts toward your bar. Bump it 5 next time.` : "Slow it down 5 and it locks in faster than you'd think."}</p>
      <div class="row center wrap"><button class="btn" data-act="strumAgain">${icon("refresh", 16)} Again</button>${ctx.sheet ? `<button class="btn on" data-act="closeSheet">Back to lesson</button>` : ""}</div></div>`;
    const best = (CF.st().pat[pid] || {}).best || 0;
    return `<div class="tool">
      ${patternHTML(pid, false, punk)}
      <p class="landWhat"><b>${punk ? "all downs, palm muted" : esc(p.say)}</b></p>
      <p class="hint">${punk ? "Rest the edge of your strumming palm on the strings right by the bridge. Chunky, not ringing." : esc(p.why)}</p>
      <div class="barChords">${d.prog.map(c => `<span>${esc(c)}</span>`).join("")}</div>
      <div class="setGrid">${stepper("bpm", "Tempo", d.bpm, " bpm")}</div>
      <p class="hint">Solid at ${p.target} bpm${punk ? "" : ` counts toward your bar`}. ${best ? "Your best steady: " + best + " bpm." : ""}</p>
      <div class="row"><button class="btn" data-act="strumHear">${icon("speaker", 18)} Hear it</button>
      <button class="btn on big grow" data-act="strumStart">${icon("play", 20)} Start · ${d.bars} bars</button></div></div>`;
  },
  mount(ctx) { ctx.cleanups.push(() => { AudioKit.Metro.stop(); clearTimeout(ctx.data.half); }); },
};
const patSlots = (pid, punk) => punk ? ["D","D","D","D","D","D","D","D"] : CF_PATTERNS[pid].slots;
function playSlot(s, chord, when, acc) {
  const sh = T.chordShape(chord);
  if (s === "D") AudioKit.strum(chord, { when, gain: acc ? 0.13 : 0.09, spread: 0.018 });
  else if (s === "U") AudioKit.strum(chord, { when, up: true, gain: 0.06, spread: 0.014 });
  else if (s === "X") AudioKit.chuck(when);
  else if (s === "B" && sh && sh.frets) { const i = sh.frets.findIndex(f => f >= 0); AudioKit.pluck(AudioKit.mtof([40, 45, 50, 55, 59, 64][i] + sh.frets[i]), { when, gain: 0.2 }); }
}
ACT.strumHear = (el, ctx) => {
  const d = ctx.data, pid = CF_PATTERNS[ctx.arg] ? ctx.arg : "p2", slots = patSlots(pid, !!ctx.q.punk), half = 60 / d.bpm / 2;
  const acc = CF_PATTERNS[pid].acc;
  [0, 1].forEach(bar => slots.forEach((s, i) => playSlot(s, d.prog[bar % d.prog.length], (bar * slots.length + i) * half, acc.includes(i))));
};
ACT.strumStop = (el, ctx) => { AudioKit.Metro.stop(); ctx.data.stage = null; renderCtx(ctx); };
ACT.strumAgain = (el, ctx) => { ctx.data.stage = null; renderCtx(ctx); };
ACT.strumStart = (el, ctx) => {
  const d = ctx.data, pid = CF_PATTERNS[ctx.arg] ? ctx.arg : "p2", p = CF_PATTERNS[pid], beats = p.beats;
  d.stage = "run"; renderCtx(ctx);
  const countIn = beats === 3 ? 3 : 4;
  const lit = i => $$(".patGrid .pSlot", ctx.root).forEach((x, j) => x.classList.toggle("now", j === i));
  AudioKit.Metro.start(d.bpm, beats, b => {
    Timer.ping();
    if (!$("#bc", ctx.root)) return;
    if (b < countIn) { $("#cd", ctx.root).textContent = countIn - b; return; }
    const k = b - countIn, bar = Math.floor(k / beats), beat = k % beats;
    if (bar >= d.bars) { AudioKit.Metro.stop(); lit(-1); d.stage = "rate"; renderCtx(ctx); return; }
    $("#cd", ctx.root).textContent = "";
    if (beat === 0) {
      $$("#bc span", ctx.root).forEach((x, j) => x.classList.toggle("on", j === bar % d.prog.length));
      $("#barN", ctx.root).textContent = `bar ${bar + 1} of ${d.bars}`;
    }
    lit(beat * 2);
    clearTimeout(d.half); d.half = setTimeout(() => lit(beat * 2 + 1), (60 / d.bpm / 2) * 1000);
  });
};
ACT.strumRate = (el, ctx) => {
  const d = ctx.data, v = +el.dataset.v, pid = CF_PATTERNS[ctx.arg] ? ctx.arg : "p2", cf = CF.st();
  d.v = v;
  if (v === 2 && !ctx.q.punk) { const cur = cf.pat[pid] || { best: 0 }; cur.best = Math.max(cur.best || 0, d.bpm); cur.at = Date.now(); cf.pat[pid] = cur; }
  d.solid = v === 2 && !ctx.q.punk && d.bpm >= CF_PATTERNS[pid].target;
  const lid = ctx.q && ctx.q.lesson;
  if (lid && ctx.q.step != null) cf.steps[cfStepKey(lid, +ctx.q.step)] = today();
  if (!cf.start) cf.start = today();
  cf.at = Date.now();
  addXP(v === 2 ? 10 : 6); CF.refreshSummary(); App.save();
  AudioKit.sfx[d.solid ? "win" : "good"]();
  d.stage = "done"; renderCtx(ctx);
};

/* ---------------- starred chords (the campfire 15 start starred) ---------------- */
window.isStar = c => { const s = (App.state.chordStars || {})[c]; return s ? !!s.on : CF_CHORDS.includes(c); };
ACT.starChord = el => {
  const c = el.dataset.c; App.state.chordStars = App.state.chordStars || {};
  App.state.chordStars[c] = { on: !isStar(c), at: Date.now() }; App.save(); AudioKit.sfx.tap();
  openChord(c); if (Router.ctx) renderCtx(Router.ctx);
};

/* routes */
TABS.cflesson = "path"; TABS.land = "practice"; TABS.strum = "practice";
["cflesson", "land", "strum"].forEach(v => AWAKE_VIEWS.add(v));

/* the big number counts up when the page opens */
function countUp(el) {
  const to = +el.dataset.count || 0;
  if (!to || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const t0 = performance.now(), dur = 900;
  const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); };
  el.textContent = "0"; requestAnimationFrame(step);
}
