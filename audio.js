/* =========================================================
   audio.js — plucked-string sounds (Karplus-Strong, made in code,
   works offline), metronome voices, mic pitch + chord detection.
   ========================================================= */

let actx = null, master = null;
function ctx() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = 0.8;
    master.connect(actx.destination);
  }
  if (actx.state === "suspended") actx.resume();
  return actx;
}
const Sound = { on: true, vol: 0.7 };
function setSound(on, vol) {
  Sound.on = on; Sound.vol = vol;
  if (master) master.gain.value = on ? vol : 0;
}

/* ---------- plucked string ---------- */
const pluckCache = new Map();
function pluckBuffer(freq, dur = 2.4, damp = 0.4985, soft = 0.5) {
  const ac = ctx();
  const key = freq.toFixed(1) + "|" + dur + "|" + damp + "|" + soft;
  if (pluckCache.has(key)) return pluckCache.get(key);
  const sr = ac.sampleRate, n = Math.floor(sr * dur), buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(N);
  let prev = 0;
  for (let k = 0; k < N; k++) { const w = Math.random() * 2 - 1; prev = prev * soft + w * (1 - soft); ring[k] = prev * 1.6; }
  let p = 0;
  for (let k = 0; k < n; k++) {
    const a = ring[p], b = ring[(p + 1) % N];
    d[k] = a;
    ring[p] = damp * (a + b);
    p = (p + 1) % N;
  }
  const fade = Math.floor(sr * 0.05);
  for (let k = 0; k < fade; k++) d[n - 1 - k] *= k / fade;
  pluckCache.set(key, buf);
  return buf;
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function pluck(freq, { when = 0, gain = 0.22, dur = 2.4, damp = 0.4985, tone = 3200, soft = 0.5 } = {}) {
  if (!Sound.on) return;
  try {
    const ac = ctx();
    const s = ac.createBufferSource(), g = ac.createGain(), lp = ac.createBiquadFilter();
    s.buffer = pluckBuffer(freq, dur, damp, soft);
    lp.type = "lowpass"; lp.frequency.value = tone;
    g.gain.value = gain;
    s.connect(lp).connect(g).connect(master);
    s.start(ac.currentTime + when);
  } catch (e) {}
}
const GTR_OPEN = [40, 45, 50, 55, 59, 64];
function strum(chord, { up = false, spread = 0.035, gain = 0.16, when = 0 } = {}) {
  const sh = Theory.chordShape(chord);
  if (!sh) return;
  const notes = sh.frets.map((f, i) => (f < 0 ? null : GTR_OPEN[i] + f)).filter(x => x != null);
  (up ? notes.reverse() : notes).forEach((m, i) => pluck(mtof(m), { when: when + i * spread, gain }));
}
function noiseBurst({ when = 0, dur = 0.05, type = "bandpass", freq = 1800, q = 4, gain = 0.4 } = {}) {
  if (!Sound.on) return;
  const ac = ctx(), t = ac.currentTime + when;
  const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
  s.connect(f).connect(g).connect(master);
  s.start(t);
}

const sfx = {
  tap()  { pluck(mtof(76), { gain: 0.08, dur: 0.9 }); },
  tick() { noiseBurst({ dur: 0.03, freq: 2400, gain: 0.18 }); },
  good() { pluck(mtof(71), { gain: 0.13, dur: 1.2 }); pluck(mtof(76), { when: 0.08, gain: 0.13, dur: 1.4 }); },
  bad()  { pluck(mtof(45), { gain: 0.2, dur: 0.5, damp: 0.47, tone: 900 }); },
  win()  { ["G", "C", "G"].forEach((c, i) => strum(c, { when: i * 0.32, gain: 0.12, up: i === 1 })); },
  start() { strum("Em", { gain: 0.1, spread: 0.06 }); },
  done() { strum("G", { gain: 0.12, spread: 0.05 }); strum("D", { when: 0.45, gain: 0.1, spread: 0.05 }); strum("G", { when: 0.9, gain: 0.12, spread: 0.07 }); },
};
function playTone(freq, dur = 2) { pluck(freq, { gain: 0.3, dur: Math.max(1.2, dur) }); }

/* ---------- metronome ---------- */
const METRO_SOUNDS = {
  wood:   { label: "Woodblock", play: (w, acc) => noiseBurst({ when: w, dur: 0.04, freq: acc ? 1900 : 1300, q: 8, gain: acc ? 0.7 : 0.5 }) },
  click:  { label: "Soft click", play: (w, acc) => { const ac = ctx(), t = ac.currentTime + w, o = ac.createOscillator(), g = ac.createGain();
            o.frequency.value = acc ? 1500 : 1000; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(acc ? 0.5 : 0.3, t + 0.002);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); o.connect(g).connect(master); o.start(t); o.stop(t + 0.06); } },
  hat:    { label: "Hi-hat", play: (w, acc) => noiseBurst({ when: w, dur: acc ? 0.09 : 0.05, type: "highpass", freq: 7000, q: 1, gain: acc ? 0.45 : 0.3 }) },
  shaker: { label: "Shaker", play: (w, acc) => noiseBurst({ when: w, dur: 0.11, freq: 5200, q: 1.5, gain: acc ? 0.4 : 0.28 }) },
  pluck:  { label: "Guitar pluck", play: (w, acc) => pluck(mtof(acc ? 64 : 59), { when: w, gain: 0.2, dur: 0.6, damp: 0.49 }) },
};
const Metro = {
  bpm: 80, beatsPerBar: 4, running: false, next: 0, beat: 0, timer: 0, onBeat: null, sound: "wood",
  start(bpm, beatsPerBar, onBeat) {
    const ac = ctx();
    this.bpm = bpm || this.bpm; this.beatsPerBar = beatsPerBar || this.beatsPerBar;
    this.onBeat = onBeat || null; this.running = true; this.beat = 0; this.next = ac.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 25);
  },
  tick() {
    const ac = ctx();
    while (this.next < ac.currentTime + 0.12) {
      const accent = this.beat % this.beatsPerBar === 0, b = this.beat, when = this.next;
      if (Sound.on) (METRO_SOUNDS[this.sound] || METRO_SOUNDS.wood).play(Math.max(0, when - ac.currentTime), accent);
      setTimeout(() => { if (this.running && this.onBeat) this.onBeat(b); }, Math.max(0, (when - ac.currentTime) * 1000));
      this.beat++; this.next += 60 / this.bpm;
    }
  },
  stop() { this.running = false; clearInterval(this.timer); },
};

/* ---------- microphone ---------- */
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break; }
  const b = buf.slice(r1, r2), n = b.length, half = Math.floor(n / 2), c = new Float32Array(half);
  for (let i = 0; i < half; i++) { let s = 0; for (let j = 0; j < n - i; j++) s += b[j] * b[j + i]; c[i] = s; }
  let d = 0;
  while (d < half - 1 && c[d] > c[d + 1]) d++;
  let maxv = -1, maxp = -1;
  for (let i = d; i < half; i++) if (c[i] > maxv) { maxv = c[i]; maxp = i; }
  if (maxp <= 0 || maxp >= half - 1) return -1;
  const x1 = c[maxp - 1], x2 = c[maxp], x3 = c[maxp + 1], a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
  return sampleRate / (a ? maxp - bb / (2 * a) : maxp);
}
const freqToMidi = f => 69 + 12 * Math.log2(f / 440);

const Mic = {
  stream: null, analyser: null, raf: 0, cb: null, paused: false,
  async start(cb, { chroma = false } = {}) {
    this.cb = cb; this.paused = false;
    cancelAnimationFrame(this.raf);
    const ac = ctx();
    if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = ac.createMediaStreamSource(this.stream);
    this.analyser = ac.createAnalyser();
    this.analyser.fftSize = chroma ? 8192 : 2048;
    this.analyser.smoothingTimeConstant = chroma ? 0.5 : 0;
    src.connect(this.analyser);
    const tbuf = new Float32Array(this.analyser.fftSize), fbuf = new Float32Array(this.analyser.frequencyBinCount);
    let last = 0;
    const loop = (now = 0) => {
      this.raf = requestAnimationFrame(loop);
      if (this.paused || now - last < 55) return;
      last = now;
      this.analyser.getFloatTimeDomainData(tbuf);
      let rms = 0; for (let i = 0; i < tbuf.length; i += 4) rms += tbuf[i] * tbuf[i]; rms = Math.sqrt(rms / (tbuf.length / 4));
      const out = { rms };
      if (chroma) { this.analyser.getFloatFrequencyData(fbuf); out.chroma = chromaFrom(fbuf, ac.sampleRate, this.analyser.fftSize); }
      else { const f = detectPitch(tbuf, ac.sampleRate); out.freq = f > 40 && f < 1500 ? f : -1; }
      if (this.cb) this.cb(out);
    };
    loop();
  },
  pause(p) { this.paused = p; },
  stop() {
    cancelAnimationFrame(this.raf); this.cb = null;
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
  },
};

/* chroma: how much of each of the 12 notes is sounding */
function chromaFrom(db, sr, fft) {
  const ch = new Float32Array(12);
  const binHz = sr / fft;
  const lo = Math.floor(75 / binHz), hi = Math.min(db.length - 1, Math.ceil(1600 / binHz));
  for (let i = lo; i <= hi; i++) {
    const mag = Math.pow(10, db[i] / 20);
    if (mag < 1e-4) continue;
    const midi = 69 + 12 * Math.log2((i * binHz) / 440);
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    const w = 1 / Math.sqrt(1 + (i * binHz) / 600);
    ch[pc] += mag * mag * w;
  }
  let sum = 0; for (let i = 0; i < 12; i++) sum += ch[i];
  if (sum <= 0) return ch;
  for (let i = 0; i < 12; i++) ch[i] /= sum;
  return ch;
}
/* score each candidate chord against the chroma (cosine similarity) */
function matchChord(chroma, candidates) {
  let best = null, second = null;
  for (const name of candidates) {
    const tones = Theory.chordTones(name), root = Theory.parseChord(name).root;
    const t = new Float32Array(12);
    tones.forEach(x => t[x] = x === root ? 1.2 : 1);
    let dot = 0, a = 0, b = 0;
    for (let i = 0; i < 12; i++) { dot += chroma[i] * t[i]; a += chroma[i] * chroma[i]; b += t[i] * t[i]; }
    const score = a && b ? dot / Math.sqrt(a * b) : 0;
    if (!best || score > best.score) { second = best; best = { name, score }; }
    else if (!second || score > second.score) second = { name, score };
  }
  return { best, margin: best && second ? best.score - second.score : best ? best.score : 0 };
}

window.AudioKit = { ctx, setSound, Sound, pluck, strum, sfx, playTone, mtof, Metro, METRO_SOUNDS, Mic, freqToMidi, detectPitch, matchChord };
