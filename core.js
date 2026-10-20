/* =========================================================
   core.js — state, themes, router, sheets (overlays), icons,
   chord diagrams, mastery, lesson timer, shared helpers.
   ========================================================= */
const T = window.Theory;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const today = () => new Date().toLocaleDateString("en-CA");
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const uid = () => Math.random().toString(36).slice(2, 9);
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/* ===================== ICONS (clean SVG, no emoji) ===================== */
const ICON = {
  notes: '<path d="M9 4.5v10.2A3.5 3.5 0 1 0 11 18V8.2l8-1.8v6.3A3.5 3.5 0 1 0 21 16V2.8z" fill="currentColor" stroke="none"/>',
  guitar: '<g transform="rotate(40 12 12)" fill="currentColor" stroke="none"><rect x="10.7" y="0.4" width="2.6" height="2.8" rx=".7"/><rect x="11.3" y="2.6" width="1.4" height="6.8"/><path fill-rule="evenodd" d="M12 8.4c2.3 0 3.7 1.4 3.7 3 0 1.2-.8 1.7-.8 2.3 0 .6 2.3 1.5 2.3 4.1 0 3-2.4 5-5.2 5s-5.2-2-5.2-5c0-2.6 2.3-3.5 2.3-4.1 0-.6-.8-1.1-.8-2.3 0-1.6 1.4-3 3.7-3zM12 13.5a1.65 1.65 0 1 0 0 3.3 1.65 1.65 0 0 0 0-3.3zM10.4 19.2h3.2v.9h-3.2z"/></g>',
  uke: '<g transform="rotate(40 12 12) translate(2.4 3) scale(.8)" fill="currentColor" stroke="none"><rect x="10.7" y="1.4" width="2.6" height="2.6" rx=".7"/><rect x="11.3" y="3.6" width="1.4" height="5.8"/><path fill-rule="evenodd" d="M12 8.4c2.3 0 3.7 1.4 3.7 3 0 1.2-.8 1.7-.8 2.3 0 .6 2.3 1.5 2.3 4.1 0 3-2.4 5-5.2 5s-5.2-2-5.2-5c0-2.6 2.3-3.5 2.3-4.1 0-.6-.8-1.1-.8-2.3 0-1.6 1.4-3 3.7-3zM12 13.5a1.65 1.65 0 1 0 0 3.3 1.65 1.65 0 0 0 0-3.3zM10.4 19.2h3.2v.9h-3.2z"/></g>',
  mountains: '<path d="M9 4l7.5 14H1.5z" fill="currentColor" stroke="none"/><path d="M17 8.5l6 9.5H12.8z" fill="currentColor" stroke="none" opacity=".65"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  transpose: '<path d="M7 4v16M7 4L3 8M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4"/>',
  singers: '<path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><rect x="2" y="15" width="5" height="6" rx="2"/><rect x="17" y="15" width="5" height="6" rx="2"/>',
  file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  refresh: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v4h4"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  seed: '<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 8-7 0 5-3 7-8 7z"/><path d="M12 15c0-3-2-5-6-5 0 4 2 5 6 5z"/>',
  drum: '<ellipse cx="12" cy="8" rx="8" ry="3"/><path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8"/><path d="M8 3l3 4M16 3l-3 4"/>',
  mic: '<path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/>',
  chord: '<path d="M6 3v18M10 3v18M14 3v18M18 3v18M6 8h12M6 13h12"/><circle cx="10" cy="10.5" r="1.3" fill="currentColor"/><circle cx="14" cy="15.5" r="1.3" fill="currentColor"/>',
  hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L20 3M16 7l3 3M14 9l2 2"/>',
  tuner: '<path d="M4 15a8 8 0 0 1 16 0M12 15l4-5M7 19h10"/>',
  metronome: '<path d="M9 3h6l4 18H5zM12 17l5-9M8 14h8"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  cards: '<path d="M4 6h10v14H4zM8 3h12v14"/>',
  wave: '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10"/>',
  review: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  diamond: '<path d="M12 3l8 9-8 9-8-9z"/>',
  ear: '<path d="M6 9a6 6 0 0 1 12 0c0 3-2 4-3 6s-1 4-3.5 4A2.5 2.5 0 0 1 9 16.5"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  record: '<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>',
  rec: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  spotify: '<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M7 9.5c3.5-1 7.5-.7 10.5 1M7.6 12.6c3-.8 6.1-.5 8.6.9M8.3 15.5c2.4-.6 4.7-.4 6.7.7" stroke="var(--bg)" stroke-width="1.6"/>',
  rewind: '<path d="M11 7l-6 5 6 5zM19 7l-6 5 6 5z" fill="currentColor" stroke="none"/>',
  forward: '<path d="M13 7l6 5-6 5zM5 7l6 5-6 5z" fill="currentColor" stroke="none"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  keys: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v10M12 4v16M16 4v10M8 14v6M16 14v6"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
};
const icon = (name, size = 22, extra = "") =>
  `<svg class="ic ${extra}" width="${size}" height="${size}" viewBox="0 0 ${name === "mountains" ? 24 : 24} 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ""}</svg>`;

/* ===================== STATE ===================== */
const DEFAULT_PEOPLE = () => ([
  { id: "me", name: "Me", lo: 43, hi: 72, comfyLo: 45, comfyHi: 70, history: [], at: 1 },
  { id: "ri", name: "Ri", lo: 53, hi: 76, comfyLo: 57, comfyHi: 72, guess: true, history: [], at: 1 },
]);
const DEFAULT_STATE = () => ({
  v: 2,
  theme: "midnight", chamTone: "auto", chamLock: null, font: 19, ambient: true,
  sound: { on: true, vol: 0.7 }, metroSound: "wood",
  xp: 0, streak: { count: 0, last: "" },
  lessonsDone: {}, goalSkips: {}, lessonDays: {},
  mastery: {}, chordMarks: {}, best: {},
  songPrefs: {}, people: DEFAULT_PEOPLE(), lists: [],
  userSongs: {},
  timer: null,
  sync: { owner: "Feirzen", repo: "music-space-private", lastSync: 0 },
  instrument: "guitar",
  vocals: {}, takes: {}, spotify: { clientId: "", playlistId: "", at: 0 }, spCache: {},
  days: {}, lastSong: null,
  profiles: [{ id: "p-naverog", name: "Naverog", color: "#5fd3b5", at: 1 }], byProfile: {}, activeProfile: null,
});
/* progress that belongs to one person. Everything else (songs, singers, lists, takes, Spotify) is shared */
const PER_PROFILE = ["xp", "streak", "lessonsDone", "goalSkips", "lessonDays", "mastery", "chordMarks", "best", "songPrefs", "vocals", "days", "lastSong"];
const blankProfileData = () => { const d = DEFAULT_STATE(); return Object.fromEntries(PER_PROFILE.map(k => [k, d[k]])); };
const pickProfileData = st => Object.fromEntries(PER_PROFILE.map(k => [k, st[k]]));
const deviceProfile = () => { try { return localStorage.getItem("ms.profile") || ""; } catch (e) { return ""; } };

const App = {
  state: null,
  load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem("ms.state") || "null"); } catch (e) {}
    const st = Object.assign(DEFAULT_STATE(), s || {});
    // migrate v1 -> v2
    if (!s || s.v !== 2) {
      if (s && s.singers) {
        const me = s.singers.me, her = s.singers.her;
        st.people = DEFAULT_PEOPLE();
        if (me) Object.assign(st.people[0], { lo: me.lo, hi: me.hi, comfyLo: me.comfyLo, comfyHi: me.comfyHi });
        if (her) Object.assign(st.people[1], { name: her.name || "Ri", lo: her.lo, hi: her.hi, comfyLo: her.comfyLo, comfyHi: her.comfyHi, guess: !!her.unset });
        delete st.singers; delete st.singersAt;
      }
      if (s && s.nailed) {
        for (const id in s.nailed) st.mastery[id] = st.mastery[id] || { best: 85, sessions: [{ d: s.nailed[id] || today(), score: 85 }] };
        delete st.nailed;
      }
      if (s && s.sync && s.sync.repo === "music-space-library") st.sync.repo = "music-space-private";
      delete st.unlockAll;
      st.v = 2;
    }
    st.sync = Object.assign(DEFAULT_STATE().sync, st.sync || {});
    st.spotify = Object.assign(DEFAULT_STATE().spotify, st.spotify || {});
    st.vocals = st.vocals || {}; st.takes = st.takes || {}; st.spCache = st.spCache || {};
    if (!Array.isArray(st.people) || !st.people.length) st.people = DEFAULT_PEOPLE();
    if (!Array.isArray(st.profiles) || !st.profiles.length) st.profiles = DEFAULT_STATE().profiles;
    st.byProfile = st.byProfile || {}; st.days = st.days || {};
    // the progress already on this device belongs to whoever it was last loaded for (first time: the first profile)
    if (!st.activeProfile) st.activeProfile = st.profiles[0].id;
    this.state = st;
    const want = deviceProfile();
    if (want && want !== st.activeProfile && st.profiles.some(p => p.id === want && !p.deleted)) this.useProfile(want, true);
    T.setInstrument(st.instrument);
    document.documentElement.dataset.inst = T.instrument;
    AudioKit.setSound(st.sound.on, st.sound.vol);
    AudioKit.Metro.sound = st.metroSound;
  },
  save(noSync) {
    try { localStorage.setItem("ms.state", JSON.stringify(this.state)); } catch (e) {}
    if (!noSync && window.Sync) Sync.soon();
  },
  /* switch whose progress is loaded: park the current person's progress, load the other's */
  useProfile(id, quiet) {
    const st = this.state;
    st.byProfile[st.activeProfile] = pickProfileData(st);
    Object.assign(st, blankProfileData(), st.byProfile[id] || {});
    st.activeProfile = id;
    try { localStorage.setItem("ms.profile", id); } catch (e) {}
    if (!quiet) { this.save(); Router.render(); }
  },
  profile() { return this.state.profiles.find(p => p.id === this.state.activeProfile) || this.state.profiles[0]; },
  progressSnapshot() {
    const s = this.state;
    return { v: 3, profiles: s.profiles, people: s.people, lists: s.lists, takes: s.takes, spotify: s.spotify,
             byProfile: { ...s.byProfile, [s.activeProfile]: pickProfileData(s) } };
  },
  applySynced(songs, p) {
    const st = this.state;
    st.userSongs = songs;
    ["profiles", "people", "lists", "takes", "spotify"].forEach(k => { if (p[k]) st[k] = p[k]; });
    st.byProfile = p.byProfile || {};
    Object.assign(st, blankProfileData(), st.byProfile[st.activeProfile] || {});
    this.save(true);
    if (["library", "path"].includes(Router.cur.name)) Router.render();
  },
  setSyncStatus(st) {
    const el = $("#syncDot");
    if (el) { el.dataset.st = st; el.title = { syncing: "Syncing", ok: "Synced", error: "Sync problem, open Settings", off: "Sync not set up" }[st]; }
  },
  toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove("show"), 2600);
  },
};
window.App = App;

/* a practice day: anything that earns XP counts. lessons are counted separately */
function markDay(lesson) {
  const s = App.state, d = today();
  const cur = s.days[d] || { p: 0, l: 0 };
  s.days[d] = { p: 1, l: (cur.l || 0) + (lesson ? 1 : 0) };
}
function addXP(n) {
  const s = App.state, d = today();
  if (s.streak.last !== d) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    s.streak.count = s.streak.last === y.toLocaleDateString("en-CA") ? s.streak.count + 1 : 1;
    s.streak.last = d;
  }
  s.xp += Math.max(0, Math.round(n));
  markDay();
  App.save();
}
const person = id => App.state.people.find(p => p.id === id);

/* ===================== INSTRUMENTS ===================== */
const INSTRUMENTS = {
  guitar: { label: "Guitar", word: "guitar", icon: "guitar" },
  uke:    { label: "Uke", word: "uke", icon: "uke" },
  piano:  { label: "Piano", word: "piano", icon: "keys" },
  voice:  { label: "Voice", word: "voice", icon: "mic" },
};
const INST = () => T.instrument;
/* progress, prefs and chord marks are kept per instrument (guitar keeps the plain keys) */
const ik = id => INST() === "guitar" ? id : INST() + ":" + id;
function switchInstrument(i) {
  App.state.instrument = i; T.setInstrument(i);
  document.documentElement.dataset.inst = T.instrument;
  App.save(true); syncThemeMeta();
  Router.render();
}
const songInst = s => s.inst || "guitar";
const songHere = s => !s.type || INST() === "voice" || songInst(s) === INST();

/* ===================== THEMES ===================== */
const THEMES = {
  midnight:  { label: "Campfire", swatch: "linear-gradient(135deg,#0a1214 40%,#2b1a10)" },
  paper:     { label: "Light", swatch: "#f2f7f4" },
  sepia:     { label: "Sepia", swatch: "#2a211a" },
  chameleon: { label: "Chameleon", swatch: "conic-gradient(#f87171,#fbbf24,#34d399,#38bdf8,#a78bfa,#f87171)" },
};
const CHAM_VARS = ["bg","surface","surface2","border","border2","text","dim","muted","accent","ok","bad","star","ember","shadow","okBg","badBg","scrim","accBg","glow"];
let chamMode = "dark";
function makeChameleon() {
  const h = Math.floor(Math.random() * 360), acc = (h + 120 + Math.floor(Math.random() * 110)) % 360;
  const tone = App.state.chamTone;
  const light = tone === "light" ? true : tone === "dark" ? false : Math.random() < 0.28;
  const H = (x, s, l, a) => `hsl(${x} ${s}% ${l}%${a ? " / " + a + "%" : ""})`;
  if (light) return { mode: "light", vars: { bg: H(h,32,95), surface: H(h,42,99), surface2: H(h,26,91), border: H(h,22,83), border2: H(h,20,66),
    text: H(h,38,11), dim: H(h,18,33), muted: H(h,14,50), accent: H(acc,66,37), ok: "hsl(158 72% 29%)", bad: "hsl(0 72% 44%)", star: "hsl(32 88% 34%)", ember: H(acc + 40,80,45),
    shadow: "rgba(40,35,20,.16)", okBg: "hsl(158 72% 40% / 13%)", badBg: "hsl(0 72% 50% / 11%)", scrim: H(h,32,95,90), accBg: H(acc,66,45,11), glow: H(acc,66,45,40) } };
  return { mode: "dark", vars: { bg: H(h,26,7), surface: H(h,22,12), surface2: H(h,26,9), border: H(h,18,21), border2: H(h,18,33),
    text: H(h,26,95), dim: H(h,14,74), muted: H(h,12,50), accent: H(acc,74,63), ok: "hsl(158 66% 56%)", bad: "hsl(0 82% 73%)", star: "hsl(38 92% 55%)", ember: H(acc + 40,90,65),
    shadow: "rgba(0,0,0,.5)", okBg: "hsl(158 66% 56% / 13%)", badBg: "hsl(0 82% 73% / 13%)", scrim: H(h,26,7,94), accBg: H(acc,74,63,14), glow: H(acc,74,63,45) } };
}
function paintChameleon(p) { chamMode = p.mode; document.documentElement.dataset.cham = p.mode; CHAM_VARS.forEach(v => document.documentElement.style.setProperty("--" + v, p.vars[v])); syncThemeMeta(); }
function clearCham() { delete document.documentElement.dataset.cham; CHAM_VARS.forEach(v => document.documentElement.style.removeProperty("--" + v)); }
function rollChameleon() { if (App.state.theme === "chameleon" && !App.state.chamLock) paintChameleon(makeChameleon()); }
function applyTheme() {
  const t = THEMES[App.state.theme] ? App.state.theme : "midnight";
  document.documentElement.dataset.theme = t;
  if (t === "chameleon") paintChameleon(App.state.chamLock || makeChameleon()); else { clearCham(); syncThemeMeta(); }
}
function syncThemeMeta() { requestAnimationFrame(() => { const m = $("#themeColorMeta"); if (m) m.content = getComputedStyle(document.body).backgroundColor; }); }
function lockChameleon() {
  const vars = {};
  CHAM_VARS.forEach(v => vars[v] = getComputedStyle(document.documentElement).getPropertyValue("--" + v).trim());
  App.state.chamLock = { mode: chamMode, vars };
}

/* ===================== SONGS ===================== */
function allSongs(any) {
  const list = [...BUILTIN_SONGS, ...Object.values(App.state.userSongs || {}).filter(s => !s.deleted && (any || songHere(s)))];
  if (any || INST() !== "voice") return list;
  // voice: one entry per song title, preferring the guitar copy
  const by = new Map();
  for (const s of list) { const k = norm(s.title), cur = by.get(k); if (!cur || (songInst(cur) !== "guitar" && songInst(s) === "guitar")) by.set(k, s); }
  return [...by.values()];
}
function getSong(id) {
  return BUILTIN_SONGS.find(s => s.id === id) || (App.state.userSongs[id] && !App.state.userSongs[id].deleted ? App.state.userSongs[id] : null);
}
function songChords(song) {
  const out = [];
  (song.body || "").replace(/\[([^\]]+)\]/g, (m, c) => { if (T.isChord(c)) out.push(c); });
  return out;
}
function keyRoot(song) {
  const c = T.parseChord(song.key || songChords(song)[0] || "C");
  return c ? c.root : 0;
}
const isMinorKey = song => /^[A-G][#b]?m(?!aj)/.test(song.key || "");
function findByTitle(title) {
  const n = norm(title);
  return Object.values(App.state.userSongs).find(s => !s.deleted && songInst(s) === "guitar" && s.status !== "review" && (norm(s.title) === n || norm(s.title).startsWith(n) || n.startsWith(norm(s.title)))) || null;
}
/* lesson step -> the song to use: your copy of a roster song if you have it, else the built-in fallback */
function resolveStepSong(step) {
  for (const t of step.pick || []) { const s = findByTitle(t); if (s) return { song: s, missing: null }; }
  return { song: getSong(step.fallback), missing: (step.pick || [])[0] || null };
}
function hintFor(title) {
  if (!window.SONG_HINTS) return null;
  const n = norm(title);
  for (const k in SONG_HINTS) if (norm(k) === n || norm(k).startsWith(n) && n.length > 4) {
    const [artist, id, key, bpm, ts, ch, level, tags] = SONG_HINTS[k];
    return { title: k, artist, spotify: "track:" + id, spotifyKey: key, bpm, time: ts === "3" ? "3/4" : "4/4", chapter: ch, level, tags };
  }
  return null;
}

/* ===================== MASTERY ===================== */
const REVIEW_STEPS = [1, 3, 7, 14, 30];
function mastery(id) { return App.state.mastery[ik(id)] || { best: 0, sessions: [] }; }
function masteryPct(id) { const m = mastery(id); return m.sessions.length ? m.sessions[m.sessions.length - 1].score : 0; }
function bestPct(id) { return mastery(id).best || 0; }
function recordSession(id, score, sing) {
  const m = App.state.mastery[ik(id)] || (App.state.mastery[ik(id)] = { best: 0, sessions: [] });
  m.sessions.push({ d: today(), score, sing: sing ?? null });
  if (m.sessions.length > 40) m.sessions = m.sessions.slice(-40);
  m.best = Math.max(m.best || 0, score);
  App.state.lastSong = { id, inst: INST(), at: Date.now() };
  App.save();
}
function attemptDays(id) { return new Set(mastery(id).sessions.map(s => s.d)).size; }
function dueInfo(id) {
  const m = mastery(id);
  if (!m.sessions.length) return null;
  const good = new Set(m.sessions.filter(s => s.score >= 80).map(s => s.d)).size;
  const last = m.sessions[m.sessions.length - 1];
  const gap = last.score < 60 ? 1 : REVIEW_STEPS[Math.min(REVIEW_STEPS.length - 1, Math.max(0, good - 1))];
  const due = daysBetween(last.d, today()) >= gap;
  return { due, mastered: m.best >= 80, last: last.d };
}
function reviewDue() { return allSongs().filter(s => { const d = dueInfo(s.id); return d && d.due; }); }

/* ===================== CHORD DIAGRAM ===================== */
function chordSVG(name, size = 1) {
  const sh = T.chordShape(name);
  if (!sh) return `<div class="nodiag">${esc(name)}</div>`;
  if (sh.piano) return keysSVG(sh, name, size);
  const f = sh.frets, n = f.length, played = f.filter(x => x > 0);
  const maxF = played.length ? Math.max(...played) : 0, minF = played.length ? Math.min(...played) : 0;
  const base = maxF <= 4 ? 1 : minF;
  const W = 92 * size, H = 112 * size, sp = 12 * size, gw = sp * (n - 1), x0 = (W - gw) / 2 - (base > 1 ? 4 * size : 0), y0 = 22 * size, gh = 76 * size;
  const sx = i => x0 + sp * i, fy = k => y0 + (gh / 5) * k;
  let g = `<svg class="diag" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)} chord">`;
  if (base === 1) g += `<rect x="${x0 - 1}" y="${y0 - 3 * size}" width="${gw + 2}" height="${4 * size}" fill="var(--text)" rx="1"/>`;
  else g += `<text x="${x0 + gw + 5 * size}" y="${fy(0.7)}" font-size="${10 * size}" fill="var(--dim)">${base}fr</text>`;
  for (let i = 0; i <= 5; i++) g += `<line x1="${x0}" y1="${fy(i)}" x2="${x0 + gw}" y2="${fy(i)}" stroke="var(--border2)" stroke-width="${size}"/>`;
  for (let i = 0; i < n; i++) g += `<line x1="${sx(i)}" y1="${y0}" x2="${sx(i)}" y2="${y0 + gh}" stroke="var(--dim)" stroke-width="${size}"/>`;
  const barreOn = sh.barre && sh.barre >= base && f.filter(v => v === sh.barre).length >= 2;
  if (barreOn) {
    const strs = f.map((x, i) => x === sh.barre ? i : -1).filter(i => i >= 0);
    const a = strs[0], b = strs[strs.length - 1], row = sh.barre - base + 0.5;
    g += `<rect x="${sx(a) - 5 * size}" y="${fy(row) - 5 * size}" width="${sx(b) - sx(a) + 10 * size}" height="${10 * size}" rx="${5 * size}" fill="var(--chord)"/>`;
  }
  f.forEach((x, i) => {
    if (x < 0) g += `<text x="${sx(i)}" y="${y0 - 8 * size}" font-size="${10 * size}" text-anchor="middle" fill="var(--muted)">×</text>`;
    else if (x === 0) g += `<circle cx="${sx(i)}" cy="${y0 - 11 * size}" r="${3.4 * size}" fill="none" stroke="var(--dim)" stroke-width="${1.2 * size}"/>`;
    else if (!(barreOn && x === sh.barre)) g += `<circle cx="${sx(i)}" cy="${fy(x - base + 0.5)}" r="${5.2 * size}" fill="var(--chord)"/>`;
  });
  return g + `</svg>`;
}
/* piano: two octaves from the C at or below the lowest chord note; chord keys light up, slash bass shown on its own octave */
function keysSVG(v, name, size = 1) {
  const W = 92 * size, H = 112 * size;
  // a window of white keys from one below the lowest note to one above the highest (at least 8 wide)
  let lo = v.notes[0] - 1; while (T.isBlack(lo)) lo--;
  let hi = v.notes[v.notes.length - 1] + 1; while (T.isBlack(hi)) hi++;
  const whites = [], blacks = [];
  for (let m = lo; m <= hi; m++) (T.isBlack(m) ? blacks : whites).push(m);
  while (whites.length < 8) { hi++; if (T.isBlack(hi)) blacks.push(hi); else whites.push(hi); }
  const ww = (W - 4 * size) / whites.length, top = 24 * size, kh = 62 * size, x0 = 2 * size;
  const on = new Set(v.notes), bassPc = v.bass != null ? T.mod12(v.bass) : null;
  let g = `<svg class="diag keys" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)} chord on piano">`;
  whites.forEach((m, i) => g += `<rect x="${x0 + i * ww + 0.5}" y="${top}" width="${ww - 1}" height="${kh}" rx="${1.5 * size}" fill="${on.has(m) ? "var(--chord)" : "var(--keyW)"}"/>`);
  blacks.forEach(m => {
    const wi = whites.indexOf(m - 1);
    if (wi < 0 || wi >= whites.length - 1) return;
    g += `<rect x="${x0 + (wi + 1) * ww - ww * 0.32}" y="${top}" width="${ww * 0.64}" height="${kh * 0.6}" rx="${1.2 * size}" fill="${on.has(m) ? "var(--chord)" : "var(--keyB)"}" ${on.has(m) ? `stroke="var(--keyB)" stroke-width="${size}"` : ""}/>`;
  });
  if (bassPc != null) g += `<text x="${W / 2}" y="${top + kh + 16 * size}" font-size="${10 * size}" text-anchor="middle" fill="var(--dim)">left hand: ${esc(T.SHARPS[bassPc])}</text>`;
  return g + `</svg>`;
}
const markOf = c => (App.state.chordMarks[ik(c)] || {}).m || "";
/* chord names marked a given way, for the current instrument */
const markedChords = m => Object.keys(App.state.chordMarks)
  .filter(k => (INST() === "guitar" ? !k.includes(":") : k.startsWith(INST() + ":")) && App.state.chordMarks[k].m === m)
  .map(k => k.replace(/^[a-z]+:/, ""));
function markDot(c) {
  const m = markOf(c);
  return m === "solid" ? `<span class="mk solid" title="Solid">${icon("check", 11)}</span>` : m === "work" ? `<span class="mk work" title="Needs work"></span>` : "";
}

/* ===================== ROUTER + SHEETS ===================== */
const VIEWS = {};
const TABS = { library: "library", song: "library", import: "library", takes: "practice", practice: "practice", tuner: "practice", metro: "practice",
  chords: "practice", flash: "practice", rush: "practice", quiz: "practice", range: "practice", path: "path", lesson: "path", settings: "settings" };
const ROOT_PAGES = ["library", "practice", "path"];

function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qs] = h.split("?");
  const [name, arg] = path.split("/");
  return { name: name || "path", arg: arg ? decodeURIComponent(arg) : null, q: Object.fromEntries(new URLSearchParams(qs || "")) };
}
function cleanupCtx(ctx) { if (!ctx) return; (ctx.cleanups || []).forEach(fn => { try { fn(); } catch (e) {} }); ctx.cleanups = []; }

const Router = {
  cur: { name: "path" }, ctx: null,
  go(hash) { location.hash = hash; },
  back() { if (history.length > 1) history.back(); else this.go("#/path"); },
  render() {
    cleanupCtx(this.ctx);
    const r = parseHash();
    this.cur = r;
    const view = VIEWS[r.name] || VIEWS.path;
    const ctx = { root: $("#main"), name: r.name, arg: r.arg, q: r.q, view, sheet: false, cleanups: [], data: {} };
    this.ctx = ctx;
    renderCtx(ctx);
    $$(".tab").forEach(t => t.classList.toggle("on", t.dataset.tab === TABS[r.name]));
    $("#backBtn").hidden = ROOT_PAGES.includes(r.name);
    $("#logo").hidden = !ROOT_PAGES.includes(r.name);
    paintInstSwitch(ROOT_PAGES.includes(r.name));
    Awake.check();
    TimerUI.paintPill();
  },
};
function renderCtx(ctx) {
  cleanupCtx(ctx);
  const v = ctx.view;
  ctx.root.innerHTML = v.html(ctx);
  ctx.root.dataset.rootId = ctx.sheet ? "sheet" : "main";
  const title = v.title ? v.title(ctx) : "Music Space";
  if (ctx.sheet) $("#sheetTitle").textContent = title; else $("#title").textContent = title;
  if (v.mount) v.mount(ctx);
}
const Sheet = {
  ctx: null,
  open(name, arg = null, q = {}) {
    const view = VIEWS[name];
    if (!view) return;
    cleanupCtx(this.ctx);
    const wrap = $("#sheet");
    const ctx = { root: $("#sheetBody"), name, arg, q, view, sheet: true, cleanups: [], data: {} };
    this.ctx = ctx;
    wrap.hidden = false;
    requestAnimationFrame(() => wrap.classList.add("open"));
    renderCtx(ctx);
    $("#sheetBody").scrollTop = 0;
    Awake.check();
  },
  close() {
    cleanupCtx(this.ctx);
    const after = this.ctx && this.ctx.onClose;
    this.ctx = null;
    const wrap = $("#sheet");
    wrap.classList.remove("open");
    setTimeout(() => { if (!this.ctx) { wrap.hidden = true; $("#sheetBody").innerHTML = ""; } }, 260);
    if (after) after();
    if (Router.ctx && Router.ctx.view.onSheetClose) Router.ctx.view.onSheetClose(Router.ctx);
    Awake.check();
  },
};
const Modal = {
  open(html) { const m = $("#modal"); m.innerHTML = `<div class="modalCard" role="dialog">${html}</div>`; m.hidden = false; },
  close() { $("#modal").hidden = true; $("#modal").innerHTML = ""; },
};
function ctxOf(el) {
  const r = el.closest("[data-root-id]");
  if (r && r.dataset.rootId === "sheet") return Sheet.ctx;
  return Router.ctx;
}
/* open a tool: inside a lesson it opens over the lesson; otherwise as a page */
function openTool(name, arg, q, fromCtx) {
  const inLesson = fromCtx && (fromCtx.name === "lesson" || fromCtx.sheet);
  if (inLesson || q && q.overlay) Sheet.open(name, arg, q || {});
  else Router.go("#/" + name + (arg ? "/" + encodeURIComponent(arg) : "") + (q && Object.keys(q).length ? "?" + new URLSearchParams(q) : ""));
}

function paintInstSwitch(show) {
  const el = $("#instSwitch");
  if (!el) return;
  el.hidden = !show;
  el.innerHTML = Object.entries(INSTRUMENTS).map(([k, v]) => `<button class="${INST() === k ? "on" : ""}" data-act="inst" data-k="${k}" aria-pressed="${INST() === k}" aria-label="${v.label}" title="${v.label}">${icon(v.icon, 17)}${INST() === k ? `<span>${v.label}</span>` : ""}</button>`).join("");
}

/* keep the screen awake on pages you play from (songs, lyrics, tools), never on menus */
const AWAKE_VIEWS = new Set(["song", "tuner", "metro", "flash", "rush", "quiz", "range", "lesson", "takes"]);
const Awake = {
  lock: null,
  want() { return AWAKE_VIEWS.has(Router.cur.name) || !!(Sheet.ctx && AWAKE_VIEWS.has(Sheet.ctx.name)); },
  async check() {
    const on = this.want() && document.visibilityState === "visible";
    try {
      if (on && !this.lock && navigator.wakeLock) { this.lock = await navigator.wakeLock.request("screen"); this.lock.addEventListener("release", () => { this.lock = null; }); }
      else if (!on && this.lock) { const l = this.lock; this.lock = null; await l.release(); }
    } catch (e) { this.lock = null; }
  },
};
document.addEventListener("visibilitychange", () => Awake.check());

/* ===================== ACTIONS ===================== */
const ACT = {};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) {
    if (e.target.id === "modal") Modal.close();
    if (e.target.id === "sheetScrim") Sheet.close();
    return;
  }
  const fn = ACT[el.dataset.act];
  if (fn) fn(el, ctxOf(el), e);
});
document.addEventListener("input", e => {
  const el = e.target.closest("[data-input]");
  if (el && ACT[el.dataset.input]) ACT[el.dataset.input](el, ctxOf(el), e);
});
document.addEventListener("change", e => {
  const el = e.target.closest("[data-change]");
  if (el && ACT[el.dataset.change]) ACT[el.dataset.change](el, ctxOf(el), e);
});
ACT.go = el => Router.go(el.dataset.h);
ACT.inst = el => { if (el.dataset.k === INST()) return; switchInstrument(el.dataset.k); if (el.dataset.k !== "voice") AudioKit.strum(el.dataset.k === "piano" ? "C" : "G", { gain: 0.1 }); else AudioKit.sfx.tap(); };
ACT.back = () => Router.back();
ACT.closeSheet = () => Sheet.close();
ACT.closeModal = () => Modal.close();
ACT.tool = (el, ctx) => { AudioKit.sfx.tap(); openTool(el.dataset.tool, el.dataset.arg || null, el.dataset.q ? Object.fromEntries(new URLSearchParams(el.dataset.q)) : {}, ctx); };

/* chord popup with marks */
function openChord(c) {
  const sh = T.chordShape(c);
  Modal.open(`<div class="chordPop">
    <div class="bigName">${esc(c)}</div>${chordSVG(c, 2)}
    ${sh && sh.simplified ? `<p class="hint">Simplified shape, close enough for campfire.</p>` : ""}
    <div class="row center wrap">
      <button class="btn" data-act="hear" data-c="${esc(c)}">${icon("speaker", 18)} Hear it</button>
      <button class="btn ${markOf(c) === "solid" ? "on" : ""}" data-act="markChord" data-c="${esc(c)}" data-m="solid">${icon("check", 18)} Solid</button>
      <button class="btn ${markOf(c) === "work" ? "warn on" : ""}" data-act="markChord" data-c="${esc(c)}" data-m="work">Needs work</button>
    </div>
    ${INST() === "guitar" ? `<details><summary>Fingerpick tab</summary><pre>${esc(T.patternTab(c, "arp44") || "")}</pre></details>` : ""}
    <button class="btn ghost full" data-act="closeModal">Close</button></div>`);
  AudioKit.strum(c);
}
ACT.chord = el => openChord(el.dataset.c);
ACT.hear = el => AudioKit.strum(el.dataset.c);
ACT.markChord = el => {
  const c = el.dataset.c, m = el.dataset.m, cur = markOf(c);
  App.state.chordMarks[ik(c)] = { m: cur === m ? "" : m, at: Date.now() };
  App.save(); AudioKit.sfx.tap(); openChord(c);
  if (Router.ctx) renderCtx(Router.ctx);
  if (Sheet.ctx) renderCtx(Sheet.ctx);
};

/* ===================== LESSON TIMER ===================== */
const IDLE_MS = 3 * 60 * 1000;
const Timer = {
  get t() { return App.state.timer; },
  start(lessonId) {
    App.state.timer = { lessonId, accum: 0, since: Date.now(), lastActive: Date.now(), nudged: false };
    App.save(true); AudioKit.sfx.start(); TimerUI.paint();
  },
  elapsed() { const t = this.t; if (!t) return 0; return t.accum + (t.since ? Date.now() - t.since : 0); },
  running() { return !!(this.t && this.t.since); },
  pause(at) { const t = this.t; if (!t || !t.since) return; t.accum += Math.max(0, (at || Date.now()) - t.since); t.since = null; App.save(true); TimerUI.paint(); },
  resume() { const t = this.t; if (!t || t.since) return; t.since = Date.now(); t.lastActive = Date.now(); App.save(true); TimerUI.paint(); },
  ping() { if (this.t) { this.t.lastActive = Date.now(); if (!this.t.since && this.t.autoPaused) { this.t.autoPaused = false; this.resume(); } } },
  stop() { const ms = this.elapsed(); App.state.timer = null; App.save(true); TimerUI.paint(); return ms; },
  tick() {
    const t = this.t;
    if (!t || !t.since) return;
    if (Date.now() - t.lastActive > IDLE_MS) { this.pause(t.lastActive + 30000); t.autoPaused = true; App.toast("Lesson timer paused while you were away"); }
    const mins = this.elapsed() / 60000;
    if (mins >= 20 && !t.nudged) { t.nudged = true; App.toast("20 minutes in. Wrap it up soon to keep it fun."); }
  },
};
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (Timer.t && Timer.t.since) Timer.t.lastActive = Date.now(); }, { passive: true }));
document.addEventListener("visibilitychange", () => { if (document.hidden && Timer.running()) { Timer.pause(); Timer.t.autoPaused = true; } });
const fmtTime = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const TimerUI = {
  paint() { this.paintPill(); const b = $("#timerBar"); if (b && Router.ctx && Router.ctx.name === "lesson") renderCtx(Router.ctx); },
  paintPill() {
    const pill = $("#timerPill"), t = Timer.t;
    const onLessonPage = Router.cur.name === "lesson" && t && Router.cur.arg === t.lessonId;
    if (!t || onLessonPage) { pill.hidden = true; return; }
    pill.hidden = false;
    pill.innerHTML = `${icon(Timer.running() ? "timer" : "pause", 16)}<b>${fmtTime(Timer.elapsed())}</b><span>${Timer.running() ? "Lesson" : "Paused"}</span>`;
    pill.dataset.h = "#/lesson/" + t.lessonId;
  },
};
setInterval(() => {
  Timer.tick();
  const t = Timer.t;
  if (!t) return;
  $$(".liveTime").forEach(el => el.textContent = fmtTime(Timer.elapsed()));
  const pill = $("#timerPill");
  if (pill && !pill.hidden) { const b = pill.querySelector("b"); if (b) b.textContent = fmtTime(Timer.elapsed()); }
}, 1000);

/* spotify: try the app, fall back to the website */
function openSpotify(spec, title) {
  let app, web;
  const m = String(spec || "").match(/(?:track:|open\.spotify\.com\/track\/)([A-Za-z0-9]{10,})/);
  if (m) { app = "spotify:track:" + m[1]; web = "https://open.spotify.com/track/" + m[1]; }
  else { const q = spec || title; app = "spotify:search:" + encodeURIComponent(q); web = "https://open.spotify.com/search/" + encodeURIComponent(q); }
  let left = false;
  const onHide = () => { left = true; };
  document.addEventListener("visibilitychange", onHide, { once: true });
  window.addEventListener("blur", onHide, { once: true });
  location.href = app;
  setTimeout(() => { if (!left && !document.hidden) window.open(web, "_blank") || (location.href = web); }, 1400);
}
