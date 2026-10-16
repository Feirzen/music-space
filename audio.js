/* =========================================================
   audio.js — mic pitch detection (tuner + range finder),
   metronome, and little sound effects. All offline.
   ========================================================= */

let actx = null;
function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") actx.resume();
  return actx;
}

/* ---------- pitch detection (autocorrelation) ---------- */
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // too quiet

  // trim the quiet edges
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const b = buf.slice(r1, r2);
  const n = b.length;
  const half = Math.floor(n / 2);          // only need lags up to half the window
  const c = new Float32Array(half);
  for (let i = 0; i < half; i++) { let s = 0; for (let j = 0; j < n - i; j++) s += b[j] * b[j + i]; c[i] = s; }

  let d = 0;
  while (d < half - 1 && c[d] > c[d + 1]) d++;
  let maxv = -1, maxp = -1;
  for (let i = d; i < half; i++) if (c[i] > maxv) { maxv = c[i]; maxp = i; }
  if (maxp <= 0) return -1;
  let T0 = maxp;
  if (T0 >= half - 1) return -1;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
  if (a) T0 = T0 - bb / (2 * a);
  return sampleRate / T0;
}

const Mic = {
  stream: null, analyser: null, raf: 0, buf: null, cb: null,
  async start(cb) {
    this.cb = cb;
    cancelAnimationFrame(this.raf);
    const ac = ctx();
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    }
    const src = ac.createMediaStreamSource(this.stream);
    this.analyser = ac.createAnalyser();
    this.analyser.fftSize = 2048;
    src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    let last = 0;
    const loop = (now = 0) => {
      this.raf = requestAnimationFrame(loop);
      if (now - last < 50) return;          // ~20 checks a second is plenty
      last = now;
      this.analyser.getFloatTimeDomainData(this.buf);
      const f = detectPitch(this.buf, ac.sampleRate);
      if (this.cb) this.cb(f > 40 && f < 1500 ? f : -1);
    };
    loop();
  },
  stop() {
    cancelAnimationFrame(this.raf);
    this.cb = null;
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
  },
};

const freqToMidi = f => 69 + 12 * Math.log2(f / 440);

/* ---------- metronome (look-ahead scheduler, rock solid timing) ---------- */
const Metro = {
  bpm: 80, beatsPerBar: 4, running: false, next: 0, beat: 0, timer: 0, onBeat: null,
  start(bpm, beatsPerBar, onBeat) {
    const ac = ctx();
    this.bpm = bpm || this.bpm; this.beatsPerBar = beatsPerBar || this.beatsPerBar;
    this.onBeat = onBeat || null;
    this.running = true; this.beat = 0; this.next = ac.currentTime + 0.08;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 25);
  },
  tick() {
    const ac = ctx();
    while (this.next < ac.currentTime + 0.12) {
      this.click(this.next, this.beat % this.beatsPerBar === 0);
      const b = this.beat, when = this.next;
      setTimeout(() => { if (this.running && this.onBeat) this.onBeat(b); }, Math.max(0, (when - ac.currentTime) * 1000));
      this.beat++;
      this.next += 60 / this.bpm;
    }
  },
  click(t, accent) {
    const ac = ctx();
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = accent ? 1500 : 1000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.6 : 0.35, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.06);
  },
  stop() { this.running = false; clearInterval(this.timer); },
};

/* ---------- tiny sfx ---------- */
function blip(freq = 880, dur = 0.08, vol = 0.2, type = "sine") {
  try {
    const ac = ctx(), t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {}
}
const sfx = {
  good() { blip(660, 0.07); setTimeout(() => blip(990, 0.1), 70); },
  bad() { blip(200, 0.18, 0.2, "triangle"); },
  tick() { blip(1200, 0.03, 0.08); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.14, 0.2), i * 110)); },
};

/* play a reference pitch (for tuning by ear / range test) */
function playTone(freq, dur = 1.2) {
  const ac = ctx(), t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = "triangle"; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

window.AudioKit = { ctx, Mic, Metro, sfx, freqToMidi, playTone, detectPitch };
