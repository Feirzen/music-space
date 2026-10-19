/* =========================================================
   app.js — Settings and startup.
   ========================================================= */
TABS.review = "path"; TABS.rate = "library";

VIEWS.settings = {
  title: () => "Settings",
  html() {
    const s = App.state;
    let tok = ""; try { tok = localStorage.getItem("ms.token") || ""; } catch (e) {}
    const sw = Object.entries(THEMES).map(([k, t]) => `<button class="swatch ${s.theme === k ? "on" : ""}" data-act="theme" data-k="${k}" style="background:${t.swatch}"><span>${t.label}</span></button>`).join("");
    return `
      <div class="card"><b>Look</b><div class="swatches">${sw}</div>
        ${s.theme === "chameleon" ? `<div class="row wrap"><button class="btn small" data-act="chamTone">${{ auto: "Any tone", light: "Light only", dark: "Dark only" }[s.chamTone]}</button>
          <button class="btn small" data-act="chamLock">${icon(s.chamLock ? "lock" : "refresh", 14)} ${s.chamLock ? "Frozen" : "Changing"}</button>
          <button class="btn small" data-act="chamRoll" ${s.chamLock ? "disabled" : ""}>New colors</button></div>
          <p class="hint">Chameleon picks new colors each time you change screens. Freeze one you love.</p>` : ""}
        <label class="check"><input type="checkbox" data-change="ambientToggle" ${s.ambient ? "checked" : ""}> Floating embers</label></div>
      <div class="card"><b>Sound</b>
        <label class="check"><input type="checkbox" data-change="soundToggle" ${s.sound.on ? "checked" : ""}> Sound effects</label>
        <div class="stepRow"><span>Volume</span><input type="range" min="0" max="1" step="0.05" value="${s.sound.vol}" data-input="soundVol" aria-label="Volume"></div>
        <button class="btn small" data-act="soundTest">${icon("speaker", 16)} Test</button></div>
      <div class="card"><b>Private library sync</b>
        <p class="hint">Your songs, PDFs and progress save to your private GitHub repo so every device matches. The token stays on this device.</p>
        <div class="row2"><label class="field">GitHub user<input id="sOwner" value="${esc(s.sync.owner)}"></label><label class="field">Private repo<input id="sRepo" value="${esc(s.sync.repo)}"></label></div>
        <label class="field">Token<input id="sToken" type="password" value="${esc(tok)}" placeholder="github_pat_…" autocomplete="off"></label>
        <div class="row wrap"><button class="btn on" data-act="saveSync">${icon("refresh", 16)} Save & sync now</button><span class="muted small">${s.sync.lastSync ? "Last sync " + new Date(s.sync.lastSync).toLocaleString() : "Never synced"}</span></div></div>
      <div class="card"><b>Offline</b><p class="hint" id="offInfo">Checking…</p></div>
      <p class="hint center">Music Space · built for campfires</p>`;
  },
  mount(ctx) {
    (async () => {
      let msg = navigator.serviceWorker && navigator.serviceWorker.controller ? "Saved for offline use." : "Offline copy not ready yet. Reopen the app once.";
      try { if (navigator.storage && navigator.storage.persisted) msg += (await navigator.storage.persisted()) ? " Storage is protected." : " Open it from your Home Screen to keep storage safe."; } catch (e) {}
      const mine = Object.values(App.state.userSongs).filter(x => !x.deleted);
      const withPdf = mine.filter(x => x.file);
      let here = 0, backed = withPdf.filter(x => x.uploaded).length;
      for (const x of withPdf) { try { if (await IDB.get(x.file)) here++; } catch (e) {} }
      msg += ` On this device: all ${mine.length + BUILTIN_SONGS.length} songs, and ${here} of ${withPdf.length} original PDFs.`;
      if (withPdf.length && backed < withPdf.length) msg += ` ${withPdf.length - backed} PDF${withPdf.length - backed > 1 ? "s" : ""} still need to back up. Sync on the device you added them from.`;
      const el = $("#offInfo", ctx.root); if (el) el.textContent = msg;
    })();
  },
};
ACT.theme = (el, ctx) => { App.state.theme = el.dataset.k; App.state.chamLock = null; applyTheme(); App.save(true); renderCtx(ctx); };
ACT.chamTone = (el, ctx) => { const s = App.state; s.chamTone = { auto: "light", light: "dark", dark: "auto" }[s.chamTone]; paintChameleon(makeChameleon()); if (s.chamLock) lockChameleon(); App.save(true); renderCtx(ctx); };
ACT.chamLock = (el, ctx) => { if (App.state.chamLock) App.state.chamLock = null; else lockChameleon(); App.save(true); renderCtx(ctx); };
ACT.chamRoll = () => paintChameleon(makeChameleon());
ACT.ambientToggle = el => { App.state.ambient = el.checked; Ambient.set(el.checked); App.save(true); };
ACT.soundToggle = el => { App.state.sound.on = el.checked; AudioKit.setSound(el.checked, App.state.sound.vol); App.save(true); };
ACT.soundVol = el => { App.state.sound.vol = +el.value; AudioKit.setSound(App.state.sound.on, +el.value); App.save(true); };
ACT.soundTest = () => AudioKit.sfx.done();
ACT.saveSync = async (el, ctx) => {
  const s = App.state;
  s.sync.owner = $("#sOwner", ctx.root).value.trim(); s.sync.repo = $("#sRepo", ctx.root).value.trim();
  try { localStorage.setItem("ms.token", $("#sToken", ctx.root).value.trim()); } catch (e) {}
  App.save(true); await Sync.run(false); renderCtx(ctx);
};

/* first tap anywhere unlocks audio on iPhone */
document.addEventListener("pointerdown", () => { try { AudioKit.ctx(); } catch (e) {} }, { once: true });

function boot() {
  App.load();
  applyTheme();
  $("#backBtn").innerHTML = icon("back", 26);
  $("#gear").innerHTML = icon("gear", 22);
  $("#sheetClose").innerHTML = icon("close", 22);
  $$(".tab").forEach(t => { t.querySelector(".tabIcon").innerHTML = icon(t.dataset.icon, 26); });
  $("nav.tabs").addEventListener("click", e => { const t = e.target.closest(".tab"); if (t) { AudioKit.sfx.tap(); Router.go("#/" + t.dataset.tab); } });
  $("#backBtn").addEventListener("click", () => Router.back());
  $("#gear").addEventListener("click", () => Router.go("#/settings"));
  $("#sheetClose").addEventListener("click", () => Sheet.close());
  $("#timerPill").addEventListener("click", e => Router.go(e.currentTarget.dataset.h));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!$("#modal").hidden) Modal.close(); else if (Sheet.ctx) Sheet.close(); } });
  window.addEventListener("hashchange", () => { if (Sheet.ctx) Sheet.close(); Modal.close(); rollChameleon(); Router.render(); window.scrollTo(0, 0); });
  Router.render();
  Ambient.on = App.state.ambient; Ambient.init();
  App.setSyncStatus(GH.ready() ? "ok" : "off");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  if (GH.ready()) Sync.run(true);
  window.addEventListener("online", () => Sync.run(true));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") Sync.run(true); });
}
boot();
