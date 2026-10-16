/* =========================================================
   theory.js — notes, chords, transposing, chord shapes,
   capo picking, and the "fit my range" math.
   ========================================================= */

const SHARPS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLATS  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const NOTE_IDX = { C:0,"B#":0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,Fb:4,F:5,"E#":5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,Cb:11 };
const FLAT_KEYS = new Set([5,10,3,8,1]); // F Bb Eb Ab Db (major roots that read better with flats)

const mod12 = n => ((n % 12) + 12) % 12;

function midiName(m) {
  return SHARPS[mod12(m)] + (Math.floor(m / 12) - 1);
}
function nameToMidi(s) {
  const m = String(s).trim().match(/^([A-G][#b]?)(-?\d)$/);
  if (!m || NOTE_IDX[m[1]] == null) return null;
  return NOTE_IDX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
}

const CHORD_RE = /^([A-G][#b]?)((?:maj|min|dim|aug|sus|add|m|M|\+|°|ø|\d|\(|\)|#|b|-)*)(?:\/([A-G][#b]?))?$/;

function parseChord(s) {
  const m = String(s).trim().match(CHORD_RE);
  if (!m || NOTE_IDX[m[1]] == null) return null;
  return { root: NOTE_IDX[m[1]], q: m[2] || "", bass: m[3] != null ? NOTE_IDX[m[3]] : null };
}
function isChord(s) { return !!parseChord(s); }

function chordName(c, preferFlat) {
  const names = preferFlat ? FLATS : SHARPS;
  return names[c.root] + c.q + (c.bass != null ? "/" + names[c.bass] : "");
}

/* Move a chord name up/down by semitones. keyRoot (0-11) decides sharps vs flats. */
function transposeChord(name, semis, keyRoot) {
  const c = parseChord(name);
  if (!c) return name;
  const out = { root: mod12(c.root + semis), q: c.q, bass: c.bass != null ? mod12(c.bass + semis) : null };
  const flat = keyRoot != null ? FLAT_KEYS.has(mod12(keyRoot)) : /b/.test(name.slice(1, 2));
  return chordName(out, flat);
}

/* ---------- quality families ---------- */
function family(q) {
  const s = q.replace(/[()]/g, "");
  if (s === "" || s === "M") return "maj";
  if (s === "m" || s === "min" || s === "-") return "m";
  if (s === "7") return "7";
  if (s === "m7" || s === "min7" || s === "-7") return "m7";
  if (s === "maj7" || s === "M7") return "maj7";
  if (s === "sus4" || s === "sus") return "sus4";
  if (s === "sus2") return "sus2";
  if (s === "add9" || s === "add2") return "add9";
  if (s === "6") return "6";
  if (s === "dim" || s === "°" || s === "dim7") return "dim";
  if (s.startsWith("m")) return "m";      // m9, m6, m11 -> play as minor
  if (/^\d/.test(s)) return "7";           // 9, 11, 13 -> play as 7
  return "maj";
}

/* ---------- open chord shapes: frets low E -> high e, -1 = don't play ---------- */
const OPEN = {
  "C":[-1,3,2,0,1,0], "C7":[-1,3,2,3,1,0], "Cmaj7":[-1,3,2,0,0,0], "Cadd9":[-1,3,2,0,3,0],
  "D":[-1,-1,0,2,3,2], "Dm":[-1,-1,0,2,3,1], "D7":[-1,-1,0,2,1,2], "Dm7":[-1,-1,0,2,1,1],
  "Dmaj7":[-1,-1,0,2,2,2], "Dsus2":[-1,-1,0,2,3,0], "Dsus4":[-1,-1,0,2,3,3],
  "E":[0,2,2,1,0,0], "Em":[0,2,2,0,0,0], "E7":[0,2,0,1,0,0], "Em7":[0,2,0,0,0,0], "Esus4":[0,2,2,2,0,0],
  "G":[3,2,0,0,0,3], "G7":[3,2,0,0,0,1], "Gsus4":[3,3,0,0,1,3],
  "A":[-1,0,2,2,2,0], "Am":[-1,0,2,2,1,0], "A7":[-1,0,2,0,2,0], "Am7":[-1,0,2,0,1,0],
  "Amaj7":[-1,0,2,1,2,0], "Asus2":[-1,0,2,2,0,0], "Asus4":[-1,0,2,2,3,0],
  "B7":[-1,2,1,2,0,2],
  "Fmaj7":[-1,-1,3,2,1,0],
};
/* how hard each open shape feels to a beginner (lower = easier) */
const EASE = {
  "Em":0.5,"Em7":0.6,"E":1,"E7":0.8,"Am":1,"Am7":1,"A":1.1,"A7":1,"Asus2":1,"Asus4":1.1,"Amaj7":1.4,
  "D":1,"Dm":1.2,"D7":1.2,"Dm7":1.3,"Dmaj7":1.4,"Dsus2":1,"Dsus4":1.1,
  "G":1.1,"G7":1.3,"Gsus4":1.6,"C":1.2,"C7":1.5,"Cmaj7":1.1,"Cadd9":1.1,
  "Esus4":0.9,"B7":2,"Fmaj7":1.6,
};
/* movable barre shapes, relative to the barre fret */
const E_SHAPE = { maj:[0,2,2,1,0,0], m:[0,2,2,0,0,0], "7":[0,2,0,1,0,0], m7:[0,2,0,0,0,0], sus4:[0,2,2,2,0,0] };
const A_SHAPE = { maj:[-1,0,2,2,2,0], m:[-1,0,2,2,1,0], "7":[-1,0,2,0,2,0], m7:[-1,0,2,0,1,0],
                  maj7:[-1,0,2,1,2,0], sus4:[-1,0,2,2,3,0], sus2:[-1,0,2,2,0,0] };

const OPEN_STRINGS = [40,45,50,55,59,64]; // E2 A2 D3 G3 B3 E4

/* Returns { frets, barre (fret or 0), simplified (bool), label } for a chord name */
function chordShape(name) {
  const c = parseChord(name);
  if (!c) return null;
  const fam = family(c.q);
  const famQ = { maj:"", m:"m", "7":"7", m7:"m7", maj7:"maj7", sus4:"sus4", sus2:"sus2", add9:"add9", "6":"6", dim:"dim" }[fam];
  for (const nm of [SHARPS[c.root], FLATS[c.root]]) {
    const exact = OPEN[nm + c.q];
    if (exact) return { frets: exact, barre: 0, simplified: false, key: nm + c.q };
    const byFam = OPEN[nm + famQ];
    if (byFam) return { frets: byFam, barre: 0, simplified: famQ !== c.q, key: nm + famQ };
  }
  // fall back to a barre shape (and simplify odd qualities to their base)
  let f = fam;
  if (!E_SHAPE[f] && !A_SHAPE[f]) f = (fam === "dim" ? "m" : (fam === "6" || fam === "add9") ? "maj" : "maj");
  const eFret = mod12(c.root - 4) || 12;
  const aFret = mod12(c.root - 9) || 12;
  const opts = [];
  if (E_SHAPE[f]) opts.push({ fr: eFret, shape: E_SHAPE[f] });
  if (A_SHAPE[f]) opts.push({ fr: aFret, shape: A_SHAPE[f] });
  opts.sort((a, b) => a.fr - b.fr);
  const pick = opts[0];
  return {
    frets: pick.shape.map(x => (x < 0 ? -1 : x + pick.fr)),
    barre: pick.fr, simplified: f !== fam, key: null,
  };
}

function chordEase(name) {
  const c = parseChord(name);
  if (!c) return 2;
  const sh = chordShape(name);
  let e;
  if (sh.key && EASE[sh.key] != null) e = EASE[sh.key];
  else if (sh.barre) e = 3 + (sh.barre > 7 ? 0.6 : 0) + (sh.barre === 1 ? 0.3 : 0);
  else e = 2.2;
  if (sh.simplified) e += 0.3;
  if (c.bass != null) e += 0.3;
  return e;
}

/* ---------- key, capo & range ---------- */

/* best capo (0-7) for a list of SOUNDING chords: returns { capo, score } */
function bestCapo(chords, maxCapo = 7) {
  const counts = {};
  chords.forEach(ch => counts[ch] = (counts[ch] || 0) + 1);
  let best = { capo: 0, score: Infinity };
  for (let capo = 0; capo <= maxCapo; capo++) {
    let s = 0, n = 0;
    for (const ch in counts) { s += chordEase(transposeChord(ch, -capo)) * Math.sqrt(counts[ch]); n += Math.sqrt(counts[ch]); }
    s = s / (n || 1) + capo * 0.1;
    if (s < best.score) best = { capo, score: s };
  }
  return best;
}

/* How well a melody [lo,hi] fits a singer. Returns overflow semitones + a small off-center cost.
   Singers can take the melody up or down an octave, so we try both. */
function rangeCost(lo, hi, singer) {
  const cLo = singer.comfyLo ?? singer.lo, cHi = singer.comfyHi ?? singer.hi;
  let best = Infinity;
  for (const k of [-24, -12, 0, 12]) {
    const a = lo + k, b = hi + k;
    const hard = Math.max(0, singer.lo - a) + Math.max(0, b - singer.hi);
    const soft = Math.max(0, cLo - a) + Math.max(0, b - cHi);
    const center = Math.abs((a + b) / 2 - (cLo + cHi) / 2);
    best = Math.min(best, hard * 4 + soft * 1.2 + center * 0.05);
  }
  return best;
}

/* The "fit my range" button.
   chords: chord names as written; melody: [loMidi, hiMidi] as written.
   Returns { shift, capo } — shift is how far the SOUND moves, capo is where to clamp. */
function fitToSinger(chords, melody, singer) {
  let best = null;
  for (let shift = -6; shift <= 6; shift++) {
    const r = melody ? rangeCost(melody[0] + shift, melody[1] + shift, singer) : 0;
    const sounding = chords.map(ch => transposeChord(ch, shift));
    const cap = bestCapo(sounding);
    const total = r * 1.0 + cap.score * 0.9 + Math.abs(shift) * 0.1;
    if (!best || total < best.total) best = { shift, capo: cap.capo, total, rc: r };
  }
  return best;
}

/* What the singer's melody looks like after a shift (for the little readout) */
function describeFit(melody, shift, singer) {
  if (!melody) return "";
  const cLo = singer.comfyLo ?? singer.lo, cHi = singer.comfyHi ?? singer.hi;
  let bestK = 0, bestC = Infinity;
  for (const k of [-24, -12, 0, 12]) {
    const a = melody[0] + shift + k, b = melody[1] + shift + k;
    const hard = Math.max(0, singer.lo - a) + Math.max(0, b - singer.hi);
    const cc = hard * 10 + Math.abs((a + b) / 2 - (cLo + cHi) / 2);
    if (cc < bestC) { bestC = cc; bestK = k; }
  }
  return midiName(melody[0] + shift + bestK) + "–" + midiName(melody[1] + shift + bestK);
}

/* ---------- fingerpicking tab, built from the actual chord shape ---------- */
function rootString(frets, root) {
  for (let s = 0; s < 6; s++) {
    if (frets[s] < 0) continue;
    if (mod12(OPEN_STRINGS[s] + frets[s]) === root) return s;
  }
  for (let s = 0; s < 6; s++) if (frets[s] >= 0) return s;
  return 0;
}
/* pattern tokens: R = root string, A = alternate bass, "3"/"2"/"1" = G/B/e strings, "-" rest */
const PATTERNS = {
  arp34:   { label: "Arpeggio (3/4)",  steps: ["R","3","2","1","2","3"], counts: "1 & 2 & 3 &" },
  arp44:   { label: "Arpeggio (4/4)",  steps: ["R","3","2","3","1","3","2","3"], counts: "1 & 2 & 3 & 4 &" },
  travis:  { label: "Travis picking",  steps: ["R","2","A","3","R","2","A","3"], counts: "1 & 2 & 3 & 4 &" },
  pinch44: { label: "Bass + pinch",    steps: ["R+1","3","A","2","R+1","3","A","2"], counts: "1 & 2 & 3 & 4 &" },
  waltz:   { label: "Bass, pinch, pinch (3/4)", steps: ["R","-","2+1","-","2+1","-"], counts: "1 & 2 & 3 &" },
};
function patternTab(chord, patternKey) {
  const sh = chordShape(chord);
  const c = parseChord(chord);
  if (!sh || !c) return null;
  const f = sh.frets;
  const R = c.bass != null ? (rootString(f, c.bass)) : rootString(f, c.root);
  let A = R <= 1 ? 2 : R + 1; if (f[A] < 0) A = Math.min(5, A + 1);
  const strIdx = { "3": 3, "2": 4, "1": 5 };
  const pat = PATTERNS[patternKey] || PATTERNS.arp44;
  const rows = [[],[],[],[],[],[]]; // index 0 = low E
  pat.steps.forEach(tok => {
    const hit = new Set();
    tok.split("+").forEach(t => {
      if (t === "R") hit.add(R); else if (t === "A") hit.add(A); else if (strIdx[t] != null) hit.add(strIdx[t]);
    });
    for (let s = 0; s < 6; s++) {
      const v = hit.has(s) && f[s] >= 0 ? String(f[s]) : "-";
      rows[s].push(v.padEnd(2, "-"));
    }
  });
  const labels = ["E","A","D","G","B","e"];
  return [5,4,3,2,1,0].map(s => labels[s] + "|-" + rows[s].join("-") + "|").join("\n");
}

window.Theory = { SHARPS, FLATS, NOTE_IDX, mod12, midiName, nameToMidi, parseChord, isChord, transposeChord,
  chordShape, chordEase, bestCapo, fitToSinger, describeFit, patternTab, PATTERNS, OPEN, family };
