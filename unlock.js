/* =========================================================
   unlock.js — sign a new device in with one family password.
   Your GitHub token is locked (AES-GCM encryption, key made
   from the password) and only the locked version is public in
   unlock.json. Without the password it's unreadable gibberish.
   ========================================================= */
const b64e = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function lockKey(password, salt) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
const Unlock = {
  blob: null,
  async load() {
    if (this.blob) return this.blob;
    try { const r = await fetch("unlock.json", { cache: "no-cache" }); if (r.ok) this.blob = await r.json(); } catch (e) {}
    return this.blob;
  },
  async lock(password, secret) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await lockKey(password, salt), new TextEncoder().encode(JSON.stringify(secret)));
    return { v: 1, kdf: "PBKDF2-SHA256-600000", salt: b64e(salt), iv: b64e(iv), ct: b64e(ct) };
  },
  async open(password) {
    const b = await this.load();
    if (!b) throw new Error("No family password has been set up yet");
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(b.iv) }, await lockKey(password, b64d(b.salt)), b64d(b.ct));
      return JSON.parse(new TextDecoder().decode(pt));
    } catch (e) { throw new Error("That password didn't work"); }
  },
};
function unlockCardHTML() {
  return `<div class="card unlockCard"><b>${icon("lock", 18)} Sign in to your library</b>
    <p class="hint">Type the family password once and this device syncs your songs, PDFs and progress.</p>
    <div class="row"><input id="famPw" type="password" placeholder="Family password" autocomplete="current-password" aria-label="Family password">
    <button class="btn on" data-act="famUnlock">Unlock</button></div></div>`;
}
ACT.famUnlock = async (el, ctx) => {
  const pw = ($("#famPw", ctx.root).value || "");
  if (!pw) return App.toast("Type the family password");
  el.disabled = true; el.textContent = "Checking…";
  try {
    const sec = await Unlock.open(pw);
    try { localStorage.setItem("ms.token", sec.token); } catch (e) {}
    if (sec.owner) App.state.sync.owner = sec.owner;
    if (sec.repo) App.state.sync.repo = sec.repo;
    App.save(true); AudioKit.sfx.good(); App.toast("Signed in. Syncing your library…");
    await Sync.run(true); renderCtx(ctx);
  } catch (e) { App.toast(e.message); el.disabled = false; el.textContent = "Unlock"; }
};
ACT.famShare = () => Modal.open(`<h3>Set a family password</h3>
  <p class="hint">New devices (yours or Ri's) will just type this to sign in. Use something long and not guessable, like four random words.</p>
  <label class="field">Password<input id="famNew" type="password" autocomplete="new-password"></label>
  <label class="field">Type it again<input id="famNew2" type="password" autocomplete="new-password"></label>
  <div class="row"><button class="btn on" data-act="famMake">Lock it</button><button class="btn ghost" data-act="closeModal">Cancel</button></div>`);
ACT.famMake = async () => {
  const a = $("#famNew").value, b = $("#famNew2").value;
  if (a.length < 10) return App.toast("Make it at least 10 characters");
  if (a !== b) return App.toast("Those don't match");
  let token = ""; try { token = localStorage.getItem("ms.token") || ""; } catch (e) {}
  if (!token) return App.toast("Connect this device first");
  const blob = await Unlock.lock(a, { token, owner: App.state.sync.owner, repo: App.state.sync.repo });
  const txt = JSON.stringify(blob);
  Modal.open(`<h3>Locked</h3><p class="hint">Copy this and paste it to Claude. It's scrambled, so it's safe to send. It can only be opened with your password.</p>
    <textarea id="famBlob" rows="6" readonly>${esc(txt)}</textarea>
    <div class="row"><button class="btn on" data-act="famCopy">${icon("clipboard", 16)} Copy</button><button class="btn ghost" data-act="closeModal">Done</button></div>`);
};
ACT.famCopy = async () => { const t = $("#famBlob"); try { await navigator.clipboard.writeText(t.value); App.toast("Copied"); } catch (e) { t.select(); App.toast("Long-press and copy"); } };
