/* =========================================================
   profiles.js — who's playing on this device, plus the
   practice tracker card. Songs are shared by everyone; progress
   (XP, lessons, mastery, practice days) belongs to each profile.
   ========================================================= */
const PROFILE_COLORS = ["#5fd3b5", "#ff8a73", "#9db0ff", "#f2c46b", "#b49cff", "#ff7eb6", "#7cc4ff", "#a8e07a"];
const liveProfiles = () => App.state.profiles.filter(p => !p.deleted);
const initial = n => (String(n || "?").trim()[0] || "?").toUpperCase();

function paintProfileBtn() {
  const b = $("#profBtn"); if (!b) return;
  const p = App.profile();
  b.innerHTML = `<span class="avatar" style="--c:${p.color}">${esc(initial(p.name))}</span>`;
  b.setAttribute("aria-label", "Profile: " + p.name);
}
ACT.profMenu = () => {
  const cur = App.state.activeProfile;
  Modal.open(`<h3>Who's playing?</h3>
    <div class="menuList">${liveProfiles().map(p => `<button class="btn ${p.id === cur ? "on" : "ghost"} profRow" data-act="profPick" data-id="${p.id}"><span class="avatar" style="--c:${p.color}">${esc(initial(p.name))}</span> ${esc(p.name)}${p.id === cur ? ` <small>· on this device</small>` : ""}</button>`).join("")}
      <div class="row"><input id="profNew" placeholder="Add someone, like Ri" maxlength="24" aria-label="New profile name"><button class="btn" data-act="profAdd">${icon("plus", 16)} Add</button></div>
    </div>
    <p class="hint">Your pick stays on this device. Songs are shared with everyone; progress, mastery and practice days are each person's own.</p>
    <button class="btn ghost full" data-act="closeModal">Close</button>`);
};
ACT.profPick = el => {
  Modal.close();
  if (el.dataset.id === App.state.activeProfile) return;
  App.useProfile(el.dataset.id);
  paintProfileBtn(); AudioKit.sfx.tap();
  App.toast("Hi " + App.profile().name);
};
ACT.profAdd = () => {
  const name = ($("#profNew").value || "").trim();
  if (!name) return App.toast("Type a name first");
  const used = new Set(App.state.profiles.map(p => p.color));
  const p = { id: "p-" + uid(), name, color: PROFILE_COLORS.find(c => !used.has(c)) || PROFILE_COLORS[App.state.profiles.length % PROFILE_COLORS.length], at: Date.now() };
  App.state.profiles.push(p);
  Modal.close(); App.useProfile(p.id); paintProfileBtn();
  App.toast(`Made ${name}'s profile. It's selected on this device.`);
};
function profilesSettingsHTML() {
  const cur = App.state.activeProfile;
  return `<div class="card"><b>${icon("user", 18)} Profiles</b>
    <p class="hint">Each device remembers who's playing. Tap the circle at the top to switch.</p>
    <div class="menuList">${liveProfiles().map(p => `<div class="profEdit"><span class="avatar" style="--c:${p.color}">${esc(initial(p.name))}</span>
      <input value="${esc(p.name)}" data-change="profRename" data-id="${p.id}" maxlength="24" aria-label="Profile name">
      ${p.id === cur ? `<small class="muted">this device</small>` : `<button class="iconBtn small" data-act="profDel" data-id="${p.id}" aria-label="Delete profile">${icon("trash", 16)}</button>`}</div>`).join("")}</div>
    <button class="btn ghost small" data-act="profMenu">${icon("plus", 14)} Add or switch</button></div>`;
}
ACT.profRename = el => { const p = App.state.profiles.find(x => x.id === el.dataset.id); const v = el.value.trim(); if (p && v) { p.name = v; p.at = Date.now(); App.save(); paintProfileBtn(); } };
ACT.profDel = el => Modal.open(`<h3>Delete this profile?</h3><p>Their progress goes away on every device. Songs stay.</p>
  <div class="row"><button class="btn danger on" data-act="profDelYes" data-id="${esc(el.dataset.id)}">Delete</button><button class="btn ghost" data-act="closeModal">Keep it</button></div>`);
ACT.profDelYes = el => {
  const p = App.state.profiles.find(x => x.id === el.dataset.id);
  if (p) { p.deleted = true; p.at = Date.now(); delete App.state.byProfile[p.id]; }
  App.save(); Modal.close(); if (Router.ctx) renderCtx(Router.ctx);
};

/* ---------- practice tracker card ---------- */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function monthStats() {
  const days = App.state.days || {}, now = new Date(), ym = today().slice(0, 7);
  const count = Object.keys(days).filter(d => d.startsWith(ym) && days[d].p).length;
  const byMonth = {};
  for (const d in days) if (days[d].p && !d.startsWith(ym)) byMonth[d.slice(0, 7)] = (byMonth[d.slice(0, 7)] || 0) + 1;
  let best = null;
  for (const m in byMonth) if (!best || byMonth[m] > best.n) best = { m, n: byMonth[m] };
  return { count, elapsed: now.getDate(), inMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), month: MONTHS[now.getMonth()], best,
    newBest: count > 0 && (!best || count > best.n) && Object.keys(byMonth).length > 0 };
}
function progressCardHTML() {
  const st = monthStats(), days = App.state.days || {};
  const week = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = d.toLocaleDateString("en-CA"); return { k, day: d.toLocaleDateString(undefined, { weekday: "narrow" }), v: days[k] || {}, today: i === 6 }; });
  const ls = App.state.lastSong, song = ls && getSong(ls.id);
  let lastHTML = "";
  if (song) {
    const key = (ls.inst || "guitar") === "guitar" ? song.id : ls.inst + ":" + song.id;
    const m = App.state.mastery[key], pct = m && m.sessions.length ? m.sessions[m.sessions.length - 1].score : 0;
    lastHTML = `<button class="lastSong" data-act="go" data-h="#/song/${encodeURIComponent(song.id)}" style="--accent:${songColor(song)}">
      <span class="grow"><small>Last practiced${ls.inst && ls.inst !== "guitar" ? " · " + INSTRUMENTS[ls.inst].label : ""}</small><b>${esc(song.title)}</b>
      <span class="hbar"><i style="width:${pct}%"></i></span></span><b class="pct">${pct}%</b></button>`;
  }
  const bestTxt = st.newBest ? `<span class="newBest">${icon("star", 14)} New best month</span>`
    : st.best ? `<span class="muted">Best: ${st.best.n} days in ${MONTHS[+st.best.m.slice(5) - 1]}</span>` : `<span class="muted">Your first month. Every day counts.</span>`;
  return `<div class="progCard">
    <div class="progTop">
      <div><div class="progBig"><b>${st.count}</b><span>/${st.elapsed}</span></div><div class="muted">days practiced this ${st.month}</div></div>
      <div class="progRight">${bestTxt}<div class="hint">${App.profile().name} · ${App.state.xp.toLocaleString()} XP</div></div>
    </div>
    <div class="monthBar" aria-hidden="true">${[...Array(st.inMonth)].map((_, i) => { const k = today().slice(0, 8) + String(i + 1).padStart(2, "0"); const v = days[k]; return `<i class="${v && v.l ? "l" : v && v.p ? "p" : i + 1 > st.elapsed ? "f" : ""}"></i>`; }).join("")}</div>
    <div class="weekRow">${week.map(w => `<div class="wd ${w.today ? "today" : ""}"><span class="dot2 ${w.v.l ? "l" : w.v.p ? "p" : ""}">${w.v.l ? icon("check", 13) : ""}</span><small>${w.day}</small></div>`).join("")}
      <div class="legend"><span><i class="dot2 l"></i>lesson</span><span><i class="dot2 p"></i>practiced</span></div></div>
    ${lastHTML}
  </div>`;
}
