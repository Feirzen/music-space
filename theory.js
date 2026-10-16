/* =========================================================
   theory.js — notes, chords, shapes, transposing, capo options,
   singer range fitting, voice types, fingerpicking tabs.
   ========================================================= */

const SHARPS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLATS  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const NOTE_IDX = { C:0,"B#":0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,Fb:4,F:5,"E#":5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,Cb:11 };
const FLAT_KEYS = new Set([5,10,3,8,1]);
const mod12 = n => ((n % 12) + 12) % 12;

function midiName(m) { return SHARPS[mod12(m)] + (Math.floor(m / 12) - 1); }
function nameToMidi(s) {
  const m = String(s || "").trim().match(/^([A-Ga-g][#b]?)(-?\d)$/);
  if (!m) return null;
  const n = m[1][0].toUpperCase() + m[1].slice(1);
  if (NOTE_IDX[n] == null) return null;
  return NOTE_IDX[n] + (parseInt(m[2], 10) + 1) * 12;
}

const CHORD_RE = /^([A-G][#b]?)((?:maj|min|dim|aug|sus|add|m|M|\+|°|ø|\d|\(|\)|#|b|-)*)(?:\/([A-G][#b]?))?$/;
function parseChord(s) {
  const m = String(s).trim().match(CHORD_RE);
  if (!m || NOTE_IDX[m[1]] == null) return null;
  return { root: NOTE_IDX[m[1]], q: m[2] || "", bass: m[3] != null ? NOTE_IDX[m[3]] : null };
}
const isChord = s => !!parseChord(s);
function chordName(c, flat) {
  const n = flat ? FLATS : SHARPS;
  return n[c.root] + c.q + (c.bass != null ? "/" + n[c.bass] : "");
}
function transposeChord(name, semis, keyRoot) {
  const c = parseChord(name);
  if (!c) return name;
  const out = { root: mod12(c.root + semis), q: c.q, bass: c.bass != null ? mod12(c.bass + semis) : null };
  const flat = keyRoot != null ? FLAT_KEYS.has(mod12(keyRoot)) : /b/.test(name.slice(1, 2));
  return chordName(out, flat);
}

/* ---------- chord types (the library is every root x every type) ---------- */
const TYPES = [
  { q: "",     label: "Major",  tones: [0,4,7] },
  { q: "m",    label: "Minor",  tones: [0,3,7] },
  { q: "7",    label: "7",      tones: [0,4,7,10] },
  { q: "maj7", label: "maj7",   tones: [0,4,7,11] },
  { q: "m7",   label: "m7",     tones: [0,3,7,10] },
  { q: "sus2", label: "sus2",   tones: [0,2,7] },
  { q: "sus4", label: "sus4",   tones: [0,5,7] },
  { q: "add9", label: "add9",   tones: [0,4,7,2] },
  { q: "6",    label: "6",      tones: [0,4,7,9] },
  { q: "9",    label: "9",      tones: [0,4,7,10,2] },
  { q: "5",    label: "Power",  tones: [0,7] },
  { q: "dim",  label: "dim",    tones: [0,3,6] },
  { q: "aug",  label: "aug",    tones: [0,4,8] },
];
function family(q) {
  const s = String(q).replace(/[()]/g, "");
  if (s === "" || s === "M") return "";
  if (s === "m" || s === "min" || s === "-") return "m";
  if (s === "M7" || s === "maj7") return "maj7";
  if (s === "min7" || s === "-7") return "m7";
  if (s === "sus") return "sus4";
  if (s === "add2") return "add9";
  if (s === "°" || s === "dim7") return "dim";
  if (s === "+") return "aug";
  if (TYPES.some(t => t.q === s)) return s;
  if (s.startsWith("m")) return /7/.test(s) ? "m7" : "m";
  if (/^\d/.test(s)) return "7";
  return "";
}
function chordTones(name) {
  const c = parseChord(name);
  if (!c) return [];
  const t = TYPES.find(x => x.q === family(c.q)) || TYPES[0];
  const tones = t.tones.map(i => mod12(c.root + i));
  if (c.bass != null && !tones.includes(c.bass)) tones.push(c.bass);
  return tones;
}

/* ---------- open shapes (low E -> high e, -1 = muted) ---------- */
const OPEN = {
  "C":[-1,3,2,0,1,0],"C7":[-1,3,2,3,1,0],"Cmaj7":[-1,3,2,0,0,0],"Cadd9":[-1,3,2,0,3,0],"C6":[-1,3,2,2,1,0],"Csus2":[-1,3,0,0,1,0],"Csus4":[-1,3,3,0,1,1],"C9":[-1,3,2,3,3,0],
  "D":[-1,-1,0,2,3,2],"Dm":[-1,-1,0,2,3,1],"D7":[-1,-1,0,2,1,2],"Dm7":[-1,-1,0,2,1,1],"Dmaj7":[-1,-1,0,2,2,2],"Dsus2":[-1,-1,0,2,3,0],"Dsus4":[-1,-1,0,2,3,3],"D6":[-1,-1,0,2,0,2],"Dadd9":[-1,5,4,2,3,0],"D5":[-1,-1,0,2,3,-1],"Ddim":[-1,-1,0,1,3,1],"Daug":[-1,-1,0,3,3,2],
  "E":[0,2,2,1,0,0],"Em":[0,2,2,0,0,0],"E7":[0,2,0,1,0,0],"Em7":[0,2,0,0,0,0],"Esus4":[0,2,2,2,0,0],"Emaj7":[0,2,1,1,0,0],"E5":[0,2,2,-1,-1,-1],"Eadd9":[0,2,2,1,0,2],"E6":[0,2,2,1,2,0],"Esus2":[0,2,4,4,0,0],"E9":[0,2,0,1,0,2],"Eaug":[0,3,2,1,1,0],
  "G":[3,2,0,0,0,3],"G7":[3,2,0,0,0,1],"Gsus4":[3,3,0,0,1,3],"Gmaj7":[3,2,0,0,0,2],"G6":[3,2,0,0,0,0],"Gadd9":[3,0,0,2,0,3],"G5":[3,5,5,-1,-1,-1],"Gsus2":[3,0,0,0,3,3],
  "A":[-1,0,2,2,2,0],"Am":[-1,0,2,2,1,0],"A7":[-1,0,2,0,2,0],"Am7":[-1,0,2,0,1,0],"Amaj7":[-1,0,2,1,2,0],"Asus2":[-1,0,2,2,0,0],"Asus4":[-1,0,2,2,3,0],"A6":[-1,0,2,2,2,2],"Aadd9":[-1,0,2,4,2,0],"A5":[-1,0,2,2,-1,-1],"Am6":[-1,0,2,2,1,2],"A9":[-1,0,2,4,2,3],
  "B7":[-1,2,1,2,0,2],"Fmaj7":[-1,-1,3,2,1,0],"Bm7":[-1,2,0,2,0,2],"F#m7":[2,-1,2,2,2,0],"Cm":[-1,3,5,5,4,3],
};
const EASE = {
  "Em":0.5,"Em7":0.6,"E5":0.6,"A5":0.7,"E":1,"E7":0.8,"Esus4":0.9,"Am":1,"Am7":1,"A":1.1,"A7":1,"Asus2":1,"Asus4":1.1,"Amaj7":1.4,
  "D":1,"Dm":1.2,"D7":1.2,"Dm7":1.3,"Dmaj7":1.4,"Dsus2":1,"Dsus4":1.1,"D5":1,"G":1.1,"G7":1.3,"Gsus4":1.6,"G6":1.2,"Gmaj7":1.5,
  "C":1.2,"C7":1.5,"Cmaj7":1.1,"Cadd9":1.1,"B7":2,"Fmaj7":1.6,"Bm7":1.8,"Emaj7":1.5,"Eadd9":1.6,"G5":1.5,
};
/* movable shapes by quality, offsets from the root fret; null = muted string. 6 = root on low E, 5 = root on A */
const MOVABLE = {
  "":     [[6,[0,2,2,1,0,0]],[5,[null,0,2,2,2,0]]],
  "m":    [[6,[0,2,2,0,0,0]],[5,[null,0,2,2,1,0]]],
  "7":    [[6,[0,2,0,1,0,0]],[5,[null,0,2,0,2,0]]],
  "maj7": [[5,[null,0,2,1,2,0]],[6,[0,null,1,1,0,null]]],
  "m7":   [[6,[0,2,0,0,0,0]],[5,[null,0,2,0,1,0]]],
  "sus2": [[5,[null,0,2,2,0,0]],[6,[0,2,4,4,0,0]]],
  "sus4": [[6,[0,2,2,2,0,0]],[5,[null,0,2,2,3,0]]],
  "add9": [[5,[null,0,2,4,2,0]]],
  "6":    [[5,[null,0,2,2,2,2]],[6,[0,2,2,1,2,0]]],
  "9":    [[5,[null,0,-1,0,0,0]]],
  "5":    [[6,[0,2,2,null,null,null]],[5,[null,0,2,2,null,null]]],
  "dim":  [[6,[0,1,2,0,null,null]],[5,[null,0,1,2,1,null]]],
  "aug":  [[6,[0,3,2,1,1,0]],[5,[null,0,3,2,2,1]]],
};
const OPEN_STRINGS = [40,45,50,55,59,64];

function shapeAt(shape, rootString, root) {
  let fr = mod12(root - (rootString === 6 ? 4 : 9));
  if (fr === 0 || shape.some(x => x != null && x + fr < 1 && x < 0)) fr += 12;
  return shape.map(x => (x == null ? -1 : x + fr));
}

/* Returns { frets, barre, simplified, key } */
function chordShape(name) {
  const c = parseChord(name);
  if (!c) return null;
  const fam = family(c.q);
  for (const nm of [SHARPS[c.root], FLATS[c.root]]) {
    if (OPEN[nm + c.q]) return { frets: OPEN[nm + c.q], barre: 0, simplified: false, key: nm + c.q };
    if (OPEN[nm + fam]) return { frets: OPEN[nm + fam], barre: 0, simplified: fam !== c.q, key: nm + fam };
  }
  const opts = (MOVABLE[fam] || MOVABLE[fam.startsWith("m") ? "m" : ""]).map(([rs, sh]) => {
    const fr = shapeAt(sh, rs, c.root);
    const played = fr.filter(x => x > 0);
    return { frets: fr, low: played.length ? Math.min(...played) : 0 };
  }).sort((a, b) => a.low - b.low);
  const pick = opts[0];
  return { frets: pick.frets, barre: pick.low, simplified: !MOVABLE[fam], key: null };
}
function chordEase(name) {
  const c = parseChord(name);
  if (!c) return 2;
  const sh = chordShape(name);
  let e;
  if (sh.key && EASE[sh.key] != null) e = EASE[sh.key];
  else if (sh.key) e = 2;
  else e = 3 + (sh.barre > 7 ? 0.6 : 0) + (sh.barre === 1 ? 0.3 : 0) - (family(c.q) === "5" ? 1.6 : 0);
  if (sh.simplified) e += 0.3;
  if (c.bass != null) e += 0.3;
  return e;
}

/* ---------- capo + key options ---------- */
function shapesScore(chords, capo) {
  const counts = {};
  chords.forEach(ch => counts[ch] = (counts[ch] || 0) + 1);
  let s = 0, n = 0;
  for (const ch in counts) { const w = Math.sqrt(counts[ch]); s += chordEase(transposeChord(ch, -capo)) * w; n += w; }
  return s / (n || 1) + capo * 0.1;
}
function bestCapo(chords, maxCapo = 7) {
  let best = { capo: 0, score: Infinity };
  for (let capo = 0; capo <= maxCapo; capo++) {
    const s = shapesScore(chords, capo);
    if (s < best.score) best = { capo, score: s };
  }
  return best;
}
function rangeCost(lo, hi, p) {
  const cLo = p.comfyLo ?? p.lo, cHi = p.comfyHi ?? p.hi;
  let best = Infinity;
  for (const k of [-24, -12, 0, 12]) {
    const a = lo + k, b = hi + k;
    const hard = Math.max(0, p.lo - a) + Math.max(0, b - p.hi);
    const soft = Math.max(0, cLo - a) + Math.max(0, b - cHi);
    best = Math.min(best, hard * 4 + soft * 1.2 + Math.abs((a + b) / 2 - (cLo + cHi) / 2) * 0.05);
  }
  return best;
}
/* All sensible (shift, capo) options, best first.
   chords: written chords. melody: [lo,hi] or null. singer: person or null. curShift: used when no singer. */
function keyOptions(chords, melody, singer, curShift = 0) {
  const shifts = [];
  if (singer && melody) {
    const costs = [];
    for (let s = -6; s <= 6; s++) costs.push({ s, r: rangeCost(melody[0] + s, melody[1] + s, singer) });
    const min = Math.min(...costs.map(c => c.r));
    costs.filter(c => c.r <= min + 1.3).forEach(c => shifts.push(c));
  } else shifts.push({ s: curShift, r: 0 });
  const out = [];
  shifts.forEach(({ s, r }) => {
    const sounding = chords.map(ch => transposeChord(ch, s));
    for (let capo = 0; capo <= 7; capo++) out.push({ shift: s, capo, score: shapesScore(sounding, capo) + r + Math.abs(s) * 0.05 });
  });
  out.sort((a, b) => a.score - b.score);
  const seen = new Set(), uniq = [];
  for (const o of out) {
    const shapeKey = mod12(o.shift - o.capo);
    const k = o.shift + "|" + shapeKey;
    if (seen.has(k)) continue;
    seen.add(k); uniq.push(o);
    if (uniq.length >= 6) break;
  }
  return uniq;
}
function describeFit(melody, shift, p) {
  if (!melody || !p) return "";
  const cLo = p.comfyLo ?? p.lo, cHi = p.comfyHi ?? p.hi;
  let bestK = 0, bestC = Infinity;
  for (const k of [-24, -12, 0, 12]) {
    const a = melody[0] + shift + k, b = melody[1] + shift + k;
    const hard = Math.max(0, p.lo - a) + Math.max(0, b - p.hi);
    const cc = hard * 10 + Math.abs((a + b) / 2 - (cLo + cHi) / 2);
    if (cc < bestC) { bestC = cc; bestK = k; }
  }
  const a = melody[0] + shift + bestK, b = melody[1] + shift + bestK;
  const ok = a >= p.lo && b <= p.hi;
  return { text: midiName(a) + "–" + midiName(b), ok, comfy: a >= cLo && b <= cHi };
}

/* ---------- voice types ---------- */
const VOICES = [
  ["Bass", 40, 64], ["Baritone", 43, 67], ["Tenor", 48, 72], ["Alto", 53, 77], ["Mezzo-soprano", 57, 81], ["Soprano", 60, 84],
];
function voiceType(lo, hi) {
  if (lo == null || hi == null) return "";
  let best = null, bs = -Infinity;
  for (const [name, a, b] of VOICES) {
    const overlap = Math.max(0, Math.min(hi, b) - Math.max(lo, a));
    const s = overlap - Math.abs((lo + hi) / 2 - (a + b) / 2) * 0.6;
    if (s > bs) { bs = s; best = name; }
  }
  return best;
}

/* ---------- fingerpicking tabs from the chord shape ---------- */
function rootString(frets, root) {
  for (let s = 0; s < 6; s++) if (frets[s] >= 0 && mod12(OPEN_STRINGS[s] + frets[s]) === root) return s;
  for (let s = 0; s < 6; s++) if (frets[s] >= 0) return s;
  return 0;
}
const PATTERNS = {
  arp44:   { label: "Arpeggio", time: "4/4", steps: ["R","3","2","3","1","3","2","3"], counts: "1 & 2 & 3 & 4 &",
             blurb: "One string at a time, up and back. The easiest pattern and the prettiest on slow songs." },
  arp34:   { label: "Arpeggio (3/4)", time: "3/4", steps: ["R","3","2","1","2","3"], counts: "1 & 2 & 3 &",
             blurb: "The same rolling idea for waltzes and hymns in three." },
  travis:  { label: "Travis", time: "4/4", steps: ["R","2","A","3","R","2","A","3"], counts: "1 & 2 & 3 & 4 &",
             blurb: "Your thumb keeps a steady alternating bass like a heartbeat while your fingers fill the gaps. Folk and country staple." },
  pinch44: { label: "Bass + pinch", time: "4/4", steps: ["R+1","3","A","2","R+1","3","A","2"], counts: "1 & 2 & 3 & 4 &",
             blurb: "Thumb and ring finger pluck together on the big beats. Fuller sound, good for singing over." },
  waltz:   { label: "Bass, pinch, pinch", time: "3/4", steps: ["R","-","2+1","-","2+1","-"], counts: "1 & 2 & 3 &",
             blurb: "Boom-chick-chick in three. Simple and very campfire." },
  hybrid:  { label: "Pick + strum", time: "4/4", steps: ["R","-","S","-","A","S","S","-"], counts: "1 & 2 & 3 & 4 &",
             blurb: "Pluck the bass, then brush the top strings with your fingers. Sits between picking and strumming." },
};
function patternTab(chord, key) {
  const sh = chordShape(chord), c = parseChord(chord);
  if (!sh || !c) return null;
  const f = sh.frets;
  const R = rootString(f, c.bass != null ? c.bass : c.root);
  let A = R <= 1 ? 2 : R + 1; if (f[A] < 0) A = Math.min(5, A + 1);
  const strIdx = { "3": 3, "2": 4, "1": 5 };
  const pat = PATTERNS[key] || PATTERNS.arp44;
  const rows = [[],[],[],[],[],[]];
  pat.steps.forEach(tok => {
    const hit = new Set();
    tok.split("+").forEach(t => {
      if (t === "R") hit.add(R); else if (t === "A") hit.add(A); else if (t === "S") { hit.add(3); hit.add(4); hit.add(5); }
      else if (strIdx[t] != null) hit.add(strIdx[t]);
    });
    for (let s = 0; s < 6; s++) rows[s].push((hit.has(s) && f[s] >= 0 ? String(f[s]) : "-").padEnd(2, "-"));
  });
  const L = ["E","A","D","G","B","e"];
  return [5,4,3,2,1,0].map(s => L[s] + "|-" + rows[s].join("-") + "|").join("\n");
}

/* every chord in the library: roots x types */
function allChords() {
  const out = [];
  SHARPS.forEach((r, i) => TYPES.forEach(t => {
    const name = (FLATS[i] !== r && ["A#","D#","G#"].includes(r) ? FLATS[i] : r) + t.q;
    out.push({ name, root: i, type: t.q, open: !!(OPEN[name]) });
  }));
  return out;
}

window.Theory = { SHARPS, FLATS, NOTE_IDX, TYPES, mod12, midiName, nameToMidi, parseChord, isChord, transposeChord,
  family, chordTones, chordShape, chordEase, bestCapo, keyOptions, rangeCost, describeFit, voiceType, VOICES,
  patternTab, PATTERNS, OPEN, allChords };
