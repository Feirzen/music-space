/* =========================================================
   spotify.js — your own Spotify login (no server), so Music
   Space can:
     1. play / pause / skip the real Spotify app from a song page
     2. keep a "Music Space" playlist matching your library,
        which you set to Download once in Spotify.
   Login uses PKCE: the app proves who it is with a one-time
   secret it makes on the spot, so nothing secret is stored in code.
   Tokens stay on this device. The Client ID and playlist id sync.
   ========================================================= */
const SP_SCOPES = "playlist-read-private playlist-modify-private playlist-modify-public user-read-playback-state user-modify-playback-state";
const SP_API = "https://api.spotify.com/v1";
const spRedirect = () => location.origin + location.pathname.replace(/index\.html$/, "");
const spGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const spSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const Spot = {
  get clientId() { return (App.state.spotify || {}).clientId || ""; },
  tokens() { try { return JSON.parse(spGet("ms.sp.tok") || "null"); } catch (e) { return null; } },
  connected() { return !!(this.clientId && this.tokens()); },

  async login() {
    if (!this.clientId) return App.toast("Paste your Client ID first");
    const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    const state = b64url(crypto.getRandomValues(new Uint8Array(12)));
    spSet("ms.sp.ver", verifier); spSet("ms.sp.state", state);
    const q = new URLSearchParams({ response_type: "code", client_id: this.clientId, scope: SP_SCOPES, redirect_uri: spRedirect(),
      code_challenge_method: "S256", code_challenge: challenge, state });
    location.href = "https://accounts.spotify.com/authorize?" + q;
  },
  /* Spotify sends you back to the app with ?code=… in the address */
  async finishLogin() {
    const p = new URLSearchParams(location.search);
    if (!p.has("code") && !p.has("error")) return false;
    history.replaceState(null, "", spRedirect() + "#/settings");
    if (p.get("error")) { App.toast("Spotify login was cancelled"); return true; }
    const ver = spGet("ms.sp.ver");
    if (!ver || p.get("state") !== spGet("ms.sp.state")) { App.toast("Login got mixed up. Tap Connect again from inside the app."); return true; }
    try {
      await this.tokenCall({ grant_type: "authorization_code", code: p.get("code"), redirect_uri: spRedirect(), client_id: this.clientId, code_verifier: ver });
      spSet("ms.sp.ver", null); spSet("ms.sp.state", null);
      App.toast("Spotify connected"); AudioKit.sfx.good();
      setTimeout(() => Spot.syncPlaylist(true), 800);
    } catch (e) { App.toast(e.message); }
    return true;
  },
  async tokenCall(form) {
    const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (form.grant_type === "refresh_token") spSet("ms.sp.tok", null);
      throw new Error(j.error_description ? "Spotify: " + j.error_description : "Spotify login failed");
    }
    const old = this.tokens() || {};
    spSet("ms.sp.tok", JSON.stringify({ access: j.access_token, refresh: j.refresh_token || old.refresh, exp: Date.now() + (j.expires_in - 60) * 1000 }));
  },
  async access() {
    const t = this.tokens();
    if (!t) throw new Error("Connect Spotify in Settings first");
    if (Date.now() < t.exp) return t.access;
    await this.tokenCall({ grant_type: "refresh_token", refresh_token: t.refresh, client_id: this.clientId });
    return this.tokens().access;
  },
  logout() { spSet("ms.sp.tok", null); },
  async api(method, path, body, retry = true) {
    const r = await fetch(SP_API + path, { method, headers: { Authorization: "Bearer " + await this.access(), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401 && retry) { const t = this.tokens(); if (t) { t.exp = 0; spSet("ms.sp.tok", JSON.stringify(t)); } return this.api(method, path, body, false); }
    if (r.status === 204 || r.status === 202) return null;
    const j = await r.json().catch(() => null);
    if (!r.ok) { const e = new Error((j && j.error && j.error.message) || "Spotify said " + r.status); e.status = r.status; e.reason = j && j.error && j.error.reason; throw e; }
    return j;
  },

  /* which Spotify track goes with a song */
  async uriFor(song) {
    const m = String(song.spotify || "").match(/(?:track:|open\.spotify\.com\/track\/|spotify:track:)([A-Za-z0-9]{10,})/);
    if (m) return "spotify:track:" + m[1];
    const key = norm(song.title + " " + (song.artist || ""));
    if (App.state.spCache[key]) return App.state.spCache[key];
    const q = song.spotify && !/^https?:/.test(song.spotify) ? song.spotify : song.title + " " + (song.artist || "");
    const j = await this.api("GET", "/search?type=track&limit=1&q=" + encodeURIComponent(q));
    const uri = j && j.tracks && j.tracks.items[0] && j.tracks.items[0].uri;
    if (uri) { App.state.spCache[key] = uri; App.save(true); }
    return uri || null;
  },

  /* ---------- remote control ---------- */
  async state() { return this.api("GET", "/me/player"); },
  async play(song) {
    const uri = await this.uriFor(song);
    if (!uri) throw new Error("Couldn't find this song on Spotify");
    try { await this.api("PUT", "/me/player/play", { uris: [uri] }); }
    catch (e) {
      if (e.status !== 404) throw e;
      const d = await this.api("GET", "/me/player/devices");
      const devs = (d && d.devices) || [];
      const dev = devs.find(x => x.is_active) || devs.find(x => x.type === "Smartphone") || devs[0];
      if (!dev) { const err = new Error("Open the Spotify app for a second so it wakes up, then tap play again"); err.wake = true; throw err; }
      await this.api("PUT", "/me/player/play?device_id=" + dev.id, { uris: [uri] });
    }
  },
  pause() { return this.api("PUT", "/me/player/pause"); },
  resume() { return this.api("PUT", "/me/player/play"); },
  seek(ms) { return this.api("PUT", "/me/player/seek?position_ms=" + Math.max(0, Math.round(ms))); },

  /* ---------- the "Music Space" playlist ---------- */
  busy: false,
  async syncPlaylist(quiet) {
    if (!this.connected() || this.busy || !navigator.onLine) return;
    this.busy = true;
    try {
      const sp = App.state.spotify;
      if (sp.playlistId) {
        try { await this.api("GET", "/playlists/" + sp.playlistId + "?fields=id"); }
        catch (e) { if (e.status === 404) sp.playlistId = ""; else throw e; }
      }
      if (!sp.playlistId) {
        const pl = await this.api("POST", "/me/playlists", { name: "Music Space", public: false,
          description: "Every song in my Music Space library. Turn on Download to keep them offline." });
        sp.playlistId = pl.id; sp.at = Date.now(); App.save();
      }
      const have = new Set();
      let next = "/playlists/" + sp.playlistId + "/items?limit=50";
      while (next) {
        const page = await this.api("GET", next);
        (page.items || []).forEach(it => { const t = it.item || it.track; if (t && t.uri) have.add(t.uri); });
        next = page.next ? page.next.replace(SP_API, "") : null;
      }
      const want = new Set();
      for (const s of allSongs(true)) {
        if (BUILTIN_SONGS.includes(s) && !/track:/.test(s.spotify || "")) continue; // only built-ins we know the exact recording of
        try { const u = await this.uriFor(s); if (u) want.add(u); } catch (e) {}
      }
      const add = [...want].filter(u => !have.has(u));
      const drop = sp.managed ? [...have].filter(u => !want.has(u) && sp.managed.includes(u)) : [];
      for (let i = 0; i < add.length; i += 100) await this.api("POST", "/playlists/" + sp.playlistId + "/items", { uris: add.slice(i, i + 100) });
      for (let i = 0; i < drop.length; i += 100) await this.api("DELETE", "/playlists/" + sp.playlistId + "/items", { items: drop.slice(i, i + 100).map(uri => ({ uri })) });
      sp.managed = [...want]; sp.lastSync = Date.now(); App.save(true);
      if (!quiet || add.length || drop.length) App.toast(add.length || drop.length ? `Spotify playlist updated: ${add.length} added${drop.length ? ", " + drop.length + " removed" : ""}` : "Spotify playlist is up to date");
    } catch (e) { if (!quiet) App.toast(e.message); console.warn(e); }
    finally { this.busy = false; }
  },
  soon() { clearTimeout(this._t); this._t = setTimeout(() => this.syncPlaylist(true), 6000); },
};
window.Spot = Spot;

/* ---------- mini player on a song page ---------- */
function spotBarHTML(song) {
  if (!Spot.connected()) return "";
  return `<div class="spotBar" id="spotBar">
    <button class="spBtn main" data-act="spPlay" data-id="${esc(song.id)}" aria-label="Play on Spotify">${icon("play", 20)}</button>
    <button class="spBtn" data-act="spSeek" data-d="-15000" aria-label="Back 15 seconds">${icon("rewind", 16)}</button>
    <button class="spBtn" data-act="spSeek" data-d="15000" aria-label="Forward 15 seconds">${icon("forward", 16)}</button>
    <div class="spInfo"><b id="spTitle">Play the original</b><div class="spTrack"><i id="spProg"></i></div></div>
    <span class="spLogo">${icon("spotify", 18)}</span>
  </div>`;
}
const SpotUI = {
  timer: 0, song: null, playing: false,
  mount(song, ctx) {
    if (!Spot.connected() || !$("#spotBar", ctx.root)) return;
    this.song = song; this.ctx = ctx;
    const tick = async () => {
      try {
        const st = await Spot.state();
        const bar = $("#spotBar", ctx.root); if (!bar) return;
        const mine = st && st.item && this.uri && st.item.uri === this.uri;
        this.playing = !!(st && st.is_playing && mine);
        $("[data-act=spPlay]", bar).innerHTML = icon(this.playing ? "pause" : "play", 20);
        bar.classList.toggle("on", this.playing);
        if (mine) {
          $("#spTitle", bar).textContent = (this.playing ? "Playing · " : "Paused · ") + fmtTime(st.progress_ms) + " / " + fmtTime(st.item.duration_ms);
          $("#spProg", bar).style.width = (100 * st.progress_ms / st.item.duration_ms) + "%";
        }
      } catch (e) {}
    };
    Spot.uriFor(song).then(u => { this.uri = u; tick(); }).catch(() => {});
    this.timer = setInterval(tick, 2500);
    ctx.cleanups.push(() => clearInterval(this.timer));
    this.tick = tick;
  },
};
ACT.spPlay = async (el, ctx) => {
  const song = getSong(el.dataset.id); if (!song) return;
  try {
    if (SpotUI.playing) { await Spot.pause(); SpotUI.playing = false; }
    else {
      const st = await Spot.state().catch(() => null);
      if (st && st.item && SpotUI.uri && st.item.uri === SpotUI.uri) await Spot.resume(); else await Spot.play(song);
      SpotUI.playing = true;
    }
    el.innerHTML = icon(SpotUI.playing ? "pause" : "play", 20);
    setTimeout(() => SpotUI.tick && SpotUI.tick(), 700);
  } catch (e) {
    App.toast(e.message);
    if (e.wake) setTimeout(() => openSpotify(song.spotify, song.title + " " + (song.artist || "")), 400);
  }
};
ACT.spSeek = async el => {
  try { const st = await Spot.state(); if (st && st.item) { await Spot.seek(st.progress_ms + +el.dataset.d); setTimeout(() => SpotUI.tick && SpotUI.tick(), 500); } }
  catch (e) { App.toast(e.message); }
};

/* ---------- Settings card ---------- */
function spotSettingsHTML() {
  const sp = App.state.spotify, on = Spot.connected();
  return `<div class="card"><b>${icon("spotify", 18)} Spotify</b>
    ${on ? `<p class="hint">Connected. Song pages get play and pause buttons that control your Spotify app, and your <b>Music Space</b> playlist stays matched to your library${sp.lastSync ? " (updated " + new Date(sp.lastSync).toLocaleString() + ")" : ""}.</p>
      <div class="row wrap"><button class="btn on" data-act="spSync">${icon("refresh", 16)} Update playlist now</button><button class="btn ghost" data-act="spLogout">Disconnect</button></div>
      <p class="hint">In Spotify, open the Music Space playlist and turn on <b>Download</b> once. New songs download on their own after that.</p>`
    : `<p class="hint">One-time setup, about 5 minutes. Follow the steps below, then paste your Client ID here.</p>
      <label class="field">Client ID<input id="spCid" value="${esc(sp.clientId)}" placeholder="32 letters and numbers" autocomplete="off"></label>
      <button class="btn on" data-act="spConnect">${icon("spotify", 16)} Connect Spotify</button>
      <details class="steps"><summary>Setup steps</summary><ol>
        <li>On a computer, go to <b>developer.spotify.com/dashboard</b> and log in with your Spotify account.</li>
        <li>Tap <b>Create app</b>. Name: Music Space. Description: anything.</li>
        <li>Redirect URI: paste exactly <code>${esc(spRedirect())}</code> and tap Add.</li>
        <li>Under "Which API/SDKs are you planning to use", check <b>Web API</b>. Agree to the terms and Save.</li>
        <li>Open the app's <b>Settings</b>, copy the <b>Client ID</b>, paste it above, then tap Connect Spotify and approve.</li>
      </ol><p class="hint">Do the Connect step on each device you'll use (phone, iPad, laptop). The Client ID syncs, so you only paste it once.</p></details>`}
  </div>`;
}
ACT.spConnect = (el, ctx) => {
  const v = ($("#spCid", ctx.root).value || "").trim();
  if (!/^[a-f0-9]{32}$/i.test(v)) return App.toast("That doesn't look like a Client ID (32 letters and numbers)");
  App.state.spotify.clientId = v; App.state.spotify.at = Date.now(); App.save();
  Spot.login();
};
ACT.spSync = () => Spot.syncPlaylist(false);
ACT.spLogout = (el, ctx) => { Spot.logout(); renderCtx(ctx); };
