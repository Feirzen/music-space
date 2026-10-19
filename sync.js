/* =========================================================
   sync.js — keeps your private stuff (imported songs, PDFs,
   progress) in your PRIVATE GitHub repo, and in this device's
   storage so it all works offline.
   The token only ever lives on this device.
   ========================================================= */

/* ---------- IndexedDB: holds PDF files on the device ---------- */
const IDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open("music-space", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async get(key) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const q = db.transaction("files").objectStore("files").get(key);
      q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error);
    });
  },
  async put(key, val) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(val, key);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  },
  async del(key) {
    const db = await this.open();
    return new Promise(res => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").delete(key);
      tx.oncomplete = () => res(); tx.onerror = () => res();
    });
  },
};

/* ---------- helpers ---------- */
function b64FromText(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function textFromB64(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
async function b64FromBlob(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

/* ---------- GitHub API ---------- */
const GH = {
  cfg() {
    const s = App.state.sync || {};
    let token = "";
    try { token = localStorage.getItem("ms.token") || ""; } catch (e) {}
    return { owner: s.owner, repo: s.repo, token };
  },
  ready() { const c = this.cfg(); return !!(c.owner && c.repo && c.token); },
  url(path) { const c = this.cfg(); return `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${path}`; },
  headers(extra = {}) {
    return { Authorization: "Bearer " + this.cfg().token, "X-GitHub-Api-Version": "2022-11-28", ...extra };
  },
  async getJSON(path) {
    const r = await fetch(this.url(path) + "?t=" + Date.now(), { headers: this.headers({ Accept: "application/vnd.github+json" }), cache: "no-store" });
    if (r.status === 404) return { data: null, sha: null };
    if (!r.ok) throw new Error(r.status === 401 ? "Sync token is wrong or expired" : r.status === 404 ? "Can't find that private repo. Check the name in Settings" : "GitHub said " + r.status);
    const j = await r.json();
    let content = j.content;
    if (!content && j.download_url) {
      const raw = await fetch(this.url(path), { headers: this.headers({ Accept: "application/vnd.github.raw+json" }), cache: "no-store" });
      return { data: JSON.parse(await raw.text()), sha: j.sha };
    }
    return { data: JSON.parse(textFromB64(content)), sha: j.sha };
  },
  async getBlob(path) {
    const r = await fetch(this.url(path), { headers: this.headers({ Accept: "application/vnd.github.raw+json" }), cache: "no-store" });
    if (!r.ok) throw new Error("Couldn't download " + path);
    return await r.blob();
  },
  async sha(path) {
    const r = await fetch(this.url(path) + "?t=" + Date.now(), { method: "GET", headers: this.headers({ Accept: "application/vnd.github+json" }), cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()).sha;
  },
  async put(path, b64, sha, message) {
    const body = { message, content: b64 };
    if (sha) body.sha = sha;
    const r = await fetch(this.url(path), { method: "PUT", headers: this.headers({ "Content-Type": "application/json" }), body: JSON.stringify(body) });
    if (!r.ok) throw new Error("Save failed (" + r.status + ")");
    return (await r.json()).content.sha;
  },
};

/* ---------- merge logic (two devices never lose each other's work) ---------- */
function newest(a, b) { if (!a) return b; if (!b) return a; return (a.at || 0) >= (b.at || 0) ? a : b; }
function mergeById(a = [], b = []) {
  const m = new Map();
  [...b, ...a].forEach(x => m.set(x.id, newest(x, m.get(x.id))));
  return [...m.values()];
}
function mergeProgress(a = {}, b = {}) {
  const out = {};
  out.xp = Math.max(a.xp || 0, b.xp || 0);
  const sa = a.streak || {}, sb = b.streak || {};
  out.streak = (sa.last || "") >= (sb.last || "") ? sa : sb;
  for (const k of ["lessonsDone", "goalSkips", "lessonDays"]) out[k] = { ...(b[k] || {}), ...(a[k] || {}) };
  out.best = {};
  for (const src of [a.best || {}, b.best || {}]) for (const k in src) out.best[k] = Math.max(out.best[k] || 0, src[k]);
  out.songPrefs = {};
  for (const src of [b.songPrefs || {}, a.songPrefs || {}]) for (const k in src) out.songPrefs[k] = newest(src[k], out.songPrefs[k]);
  out.chordMarks = {};
  for (const src of [b.chordMarks || {}, a.chordMarks || {}]) for (const k in src) out.chordMarks[k] = newest(src[k], out.chordMarks[k]);
  out.mastery = {};
  for (const src of [b.mastery || {}, a.mastery || {}]) for (const k in src) {
    const cur = out.mastery[k] || { best: 0, sessions: [] }, add = src[k];
    const seen = new Set(cur.sessions.map(x => x.d + "|" + x.score));
    const sessions = [...cur.sessions, ...(add.sessions || []).filter(x => !seen.has(x.d + "|" + x.score))].sort((x, y) => x.d < y.d ? -1 : 1).slice(-40);
    out.mastery[k] = { best: Math.max(cur.best || 0, add.best || 0), sessions };
  }
  for (const k of ["vocals", "takes"]) {
    out[k] = {};
    for (const src of [b[k] || {}, a[k] || {}]) for (const id in src) out[k][id] = newest(src[id], out[k][id]);
  }
  out.spotify = newest(a.spotify, b.spotify) || { clientId: "", playlistId: "", at: 0 };
  out.people = mergeById(a.people, b.people);
  out.lists = mergeById(a.lists, b.lists);
  return out;
}
function mergeSongs(a = {}, b = {}) {
  const out = { ...b };
  for (const id in a) if (!out[id] || (a[id].updatedAt || 0) >= (out[id].updatedAt || 0)) out[id] = a[id];
  return out;
}

/* ---------- the main sync ---------- */
const Sync = {
  busy: false, timer: 0,
  soon() { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(true), 4000); },
  async run(quiet) {
    if (!GH.ready() || !navigator.onLine || this.busy) return;
    this.busy = true;
    App.setSyncStatus("syncing");
    try {
      const { data, sha } = await GH.getJSON("library.json");
      const remote = data || { songs: {}, progress: {} };
      const local = App.state;
      const songs = mergeSongs(local.userSongs, remote.songs);
      const progress = mergeProgress(App.progressSnapshot(), remote.progress);

      // download any PDFs we don't have yet
      for (const id in songs) {
        const s = songs[id];
        if (s.file && !s.deleted && !(await IDB.get(s.file))) {
          try { await IDB.put(s.file, await GH.getBlob(s.file)); } catch (e) { console.warn(e); }
        }
      }
      // upload any PDFs that only live here
      for (const id in songs) {
        const s = songs[id];
        if (s.file && !s.uploaded && !s.deleted) {
          const blob = await IDB.get(s.file);
          if (blob) {
            const existing = await GH.sha(s.file);
            await GH.put(s.file, await b64FromBlob(blob), existing, "Add " + s.title);
            s.uploaded = true; s.updatedAt = Date.now();
          }
        }
      }

      App.applySynced(songs, progress);
      // vocal sheet music: small, so every device keeps a copy
      for (const k in App.state.vocals) {
        const v = App.state.vocals[k];
        if (!v || !v.file) continue;
        if (!v.uploaded) {
          const blob = await IDB.get(v.file);
          if (blob) { await GH.put(v.file, await b64FromBlob(blob), await GH.sha(v.file), "Add sheet music"); v.uploaded = true; v.at = Date.now(); }
        } else if (!(await IDB.get(v.file))) { try { await IDB.put(v.file, await GH.getBlob(v.file)); } catch (e) {} }
      }
      // recorded takes back up to the repo; other devices download one when you press play
      if (App.state.takesBackup !== false) for (const id in App.state.takes) {
        const t = App.state.takes[id];
        if (!t || t.deleted || t.uploaded || !t.file) continue;
        const blob = await IDB.get(t.file);
        if (blob) { await GH.put(t.file, await b64FromBlob(blob), await GH.sha(t.file), "Add take"); t.uploaded = true; t.at = Date.now(); }
      }
      const next = { songs, progress: App.progressSnapshot(), updatedAt: Date.now() };
      const changed = JSON.stringify({ s: next.songs, p: next.progress }) !== JSON.stringify({ s: remote.songs, p: remote.progress });
      if (changed) await GH.put("library.json", b64FromText(JSON.stringify(next, null, 1)), sha, "Sync from " + (navigator.platform || "device"));
      App.state.sync.lastSync = Date.now();
      App.save(true);
      App.setSyncStatus("ok");
      if (!quiet) App.toast("Synced ✓");
    } catch (e) {
      console.warn(e);
      App.setSyncStatus("error");
      if (!quiet) App.toast(e.message || "Sync failed");
    } finally {
      this.busy = false;
    }
  },
};

window.IDB = IDB; window.GH = GH; window.Sync = Sync;
