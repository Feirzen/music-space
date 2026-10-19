/* =========================================================
   importer.js — turns a chord-sheet PDF or pasted text into the
   app's song format, right on your device. Reads the text layer
   of PDFs (Ultimate Guitar PDFs have one), rebuilds the columns
   so chords stay over the right words, and pulls out title,
   artist, capo, key and tuning.
   ========================================================= */
let pdfLibPromise = null;
function loadPdfLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfLibPromise) pdfLibPromise = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "vendor/pdf.min.js";
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js"; res(pdfjsLib); };
    s.onerror = () => { pdfLibPromise = null; rej(new Error("Couldn't load the PDF reader. Reopen the app once while online.")); };
    document.head.appendChild(s);
  });
  return pdfLibPromise;
}

/* PDF -> plain text with columns preserved */
async function pdfToText(blob) {
  const lib = await loadPdfLib();
  const doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const pages = [];
  let widths = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = tc.items.filter(it => it.str && it.str.length).map(it => ({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: Math.abs(it.transform[3]) || 10 }));
    items.forEach(it => { if (it.s.trim().length >= 2) widths.push(it.w / it.s.length); });
    pages.push(items);
  }
  widths.sort((a, b) => a - b);
  const cw = widths.length ? widths[Math.floor(widths.length * 0.5)] : 6;
  const out = [];
  for (const items of pages) {
    if (!items.length) continue;
    const minX = Math.min(...items.map(i => i.x));
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const it of items) {
      const ln = lines.find(l => Math.abs(l.y - it.y) < Math.max(2, it.h * 0.35));
      if (ln) ln.items.push(it); else lines.push({ y: it.y, items: [it] });
    }
    lines.sort((a, b) => b.y - a.y);
    let prevY = null;
    for (const ln of lines) {
      if (prevY != null && prevY - ln.y > ln.items[0].h * 2.2) out.push("");
      prevY = ln.y;
      ln.items.sort((a, b) => a.x - b.x);
      let s = "";
      for (const it of ln.items) {
        const col = Math.max(0, Math.round((it.x - minX) / cw));
        if (s.length < col) s = s.padEnd(col, " ");
        else if (s.length && !s.endsWith(" ") && !it.s.startsWith(" ") && it.x - minX > s.length * cw + cw * 0.3) s += " ";
        s += it.s;
      }
      out.push(s.replace(/\s+$/, ""));
    }
    out.push("");
  }
  return out.join("\n");
}

/* ---------- chord-sheet text -> app format ---------- */
const SKIP_TOK = /^(\||\|\||x\d+|\(x\d+\)|\d+x|-+|\/|N\.C\.?|\(|\)|\*|%|\.\.+|→|->)$/i;
const cleanTok = t => t.replace(/^\(+|\)+$/g, "").replace(/^\[|\]$/g, "");
function isChordLine(line) {
  if (!line || !line.trim()) return false;
  if (/^\s*[eBGDAE]\s*\|/.test(line)) return false;
  const toks = line.trim().split(/\s+/).map(cleanTok).filter(t => t && !SKIP_TOK.test(t));
  if (!toks.length) return false;
  return toks.every(t => T.isChord(t));
}
const SECTION_WORDS = "verse|chorus|bridge|intro|outro|pre-chorus|prechorus|pre chorus|interlude|solo|refrain|tag|coda|instrumental|hook|post-chorus|breakdown|ending|riff|coro|estribillo|puente";
function headerOf(line) {
  const t = line.trim();
  const m = t.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (m && !T.isChord(m[1]) && !/^[x0-9]{4,6}$/i.test(m[1]) && /[a-z]{2}/i.test(m[1]) && !/\[[A-G]/.test(m[2])) return m[2] ? m[1] + " " + m[2] : m[1];
  const m2 = t.match(new RegExp("^(" + SECTION_WORDS + ")\\s*\\d*\\s*:?$", "i"));
  return m2 ? t.replace(/:$/, "") : null;
}
function mergeChordLyric(chordLine, lyric) {
  const hits = [];
  chordLine.replace(/\S+/g, (tok, idx) => { const c = cleanTok(tok); if (T.isChord(c)) hits.push({ c, idx: idx + (tok.length - tok.replace(/^\(+/, "").length) }); return tok; });
  let out = lyric.replace(/\s+$/, "");
  const need = Math.max(0, ...hits.map(h => h.idx));
  if (out.length < need) out = out.padEnd(need, " ");
  for (let i = hits.length - 1; i >= 0; i--) out = out.slice(0, hits[i].idx) + "[" + hits[i].c + "]" + out.slice(hits[i].idx);
  return out.replace(/ {2,}(?=\[)/g, " ").replace(/\s+$/, "");
}
function convertSheet(text) {
  const lines = String(text).replace(/\r/g, "").replace(/\t/g, "    ").replace(/\[\/?(tab|ch)\]/g, "").split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = headerOf(line);
    if (h) { out.push("", "# " + h); continue; }
    if (/\[[A-G][^\]\s]{0,8}\]/.test(line) && !isChordLine(line)) { out.push(line.replace(/\s+$/, "")); continue; } // already inline
    if (isChordLine(line)) {
      const next = lines[i + 1];
      if (next != null && next.trim() && !isChordLine(next) && !headerOf(next) && !/^\s*[eBGDAE]\s*\|/.test(next)) { out.push(mergeChordLyric(line, next)); i++; }
      else out.push(line.trim().split(/\s+/).map(t => T.isChord(cleanTok(t)) ? "[" + cleanTok(t) + "]" : t).join(" "));
      continue;
    }
    out.push(line.replace(/\s+$/, ""));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------- read the sheet's header info and strip page junk ---------- */
function parseSheet(raw) {
  let lines = String(raw).replace(/\r/g, "").split("\n");
  const info = { title: "", artist: "", capo: null, key: "", tuning: "" };
  const junk = /(ultimate-guitar|tabs\.ultimate|www\.|https?:\/\/|^page \d+|^\d+\s*\/\s*\d+$|^difficulty:|^author|^last edit|^rating|^print|^transpose|^font|^autoscroll|^x$|^strumming$|chords used|^tuning: e a d g b e$)/i;
  const diag = /^\s*[A-G][#b]?\S*\s+[x0-9]{6}\s*$/i;
  const keep = [];
  lines.forEach((line, idx) => {
    const t = line.trim();
    let m;
    if (!info.title && (m = t.match(/^(.+?)\s+(?:chords|tab|tabs|ukulele chords|acordes)\s+(?:by|de|por)\s+(.+?)\s*$/i))) { info.title = m[1].trim(); info.artist = m[2].trim(); return; }
    if ((m = t.match(/^capo[:\s]*(?:on\s*)?(\d{1,2})(?:st|nd|rd|th)?(?:\s*fret)?/i))) { info.capo = parseInt(m[1], 10); return; }
    if ((m = t.match(/^capo[:\s]+(i{1,3}|iv|v|vi{0,3}|ix)\b\W*$/i))) { info.capo = ["i","ii","iii","iv","v","vi","vii","viii","ix"].indexOf(m[1].toLowerCase()) + 1; return; }
    if (/^(no capo|capo[:\s]*(no|none|0))/i.test(t)) { info.capo = 0; return; }
    if ((m = t.match(/^key[:\s]+([A-G][#b]?m?)\b/i))) { info.key = m[1][0].toUpperCase() + m[1].slice(1); return; }
    if ((m = t.match(/^tuning[:\s]+(.+)$/i))) { info.tuning = m[1].trim(); return; }
    if ((m = t.match(/^artist[:\s]+(.+)$/i))) { info.artist = m[1].trim(); return; }
    if ((m = t.match(/^(?:title|song)[:\s]+(.+)$/i))) { info.title = m[1].trim(); return; }
    if (junk.test(t) || diag.test(t)) return;
    keep.push(line);
  });
  // a bare title line at the very top
  while (keep.length && !keep[0].trim()) keep.shift();
  if (!info.title && keep.length && !isChordLine(keep[0]) && !headerOf(keep[0]) && keep[0].trim().split(/\s+/).length <= 8) {
    const t = keep.shift().trim();
    const m = t.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (m) { info.title = m[1]; info.artist = info.artist || m[2]; } else info.title = t;
    if (!info.artist && keep.length && /^by\s+/i.test(keep[0].trim())) info.artist = keep.shift().trim().replace(/^by\s+/i, "");
  }
  const cl = cleanBody(convertSheet(keep.join("\n")));
  const body = cl.body;
  if (cl.bpm) info.bpm = cl.bpm;
  if (cl.note) info.note = cl.note;
  if (cl.tuning && !info.tuning) info.tuning = cl.tuning;
  const chords = [];
  body.replace(/\[([^\]]+)\]/g, (x, c) => { if (T.isChord(c)) chords.push(c); });
  // always work the key out from the chords themselves (as written on the sheet, before any capo)
  if (chords.length) info.key = T.detectKey(chords);
  const tags = [];
  if (/\[[A-G][^\]]*5\]/.test(body)) tags.push("power");
  if (/^\s*[eBGDAE]\s*\|/m.test(body)) tags.push("riff");
  info.body = body; info.chords = chords; info.tags = tags;
  return info;
}

/* Tidy a converted sheet: drop the chord list UG prints up top, the strum-pattern
   diagrams (their arrows don't survive a PDF, but the bpm does), site junk and
   stray chord-diagram codes. Returns the clean body plus anything worth keeping. */
function cleanBody(body) {
  const out = { bpm: null, note: "", tuning: "" };
  let L = String(body).split("\n");
  const isHead = l => /^#\s/.test(l);
  const chordOnly = l => { const t = l.replace(/\[([^\]]+)\]/g, (m, c) => T.isChord(c) ? "" : m).trim(); return /\[/.test(l) && !t; };
  // bracket headers with words after them become real headers
  L = L.map(l => { if (isHead(l)) return l; const h = headerOf(l); return h ? "# " + h : l; });
  // before the first section header: drop title/artist/album lines, keep tabs, chords and real notes
  const first = L.findIndex(isHead);
  if (first > 0) {
    const pre = L.slice(0, first), keepPre = [];
    for (let i = 0; i < pre.length; i++) {
      const t = pre[i].trim();
      if (/^chords$/i.test(t)) { while (pre[i + 1] != null && (!pre[i + 1].trim() || chordOnly(pre[i + 1]))) i++; continue; }
      if (/^description:/i.test(t)) {
        let txt = t.replace(/^description:\s*/i, "");
        while (pre[i + 1] && pre[i + 1].trim() && !/\[|^\s*[eBGDAE]\s*\|/.test(pre[i + 1])) txt += " " + pre[++i].trim();
        out.note = txt.replace(/\s+/g, " ").trim().slice(0, 300);
        continue;
      }
      const tab = /^\s*[eBGDAE]\s*\|/.test(pre[i]), words = t.split(/\s+/).length;
      if (/\b(chords|tabs?|acordes)\b/i.test(t) && words <= 12 && !/\[/.test(t)) continue;
      if (t && !tab && !/\[/.test(t) && words <= 8 && !/[.!?]$/.test(t) && !/^(note|tip)\b/i.test(t) && !/^[a-z-]/.test(t)) continue;
      keepPre.push(pre[i]);
    }
    L = [...keepPre, ...L.slice(first)];
  }
  const keep = [];
  for (let i = 0; i < L.length; i++) {
    const l = L[i], t = l.trim();
    let m;
    if (/^chords$/i.test(t)) { if (L[i + 1] != null && !L[i + 1].trim()) i++; if (L[i + 1] && chordOnly(L[i + 1])) i++; continue; }
    if ((m = t.match(/(?:^|\s)(\d{2,3})\s*bpm\s*$/i)) && t.split(/\s+/).length <= 9) { out.bpm = out.bpm || +m[1]; continue; }
    if (/^bpm\s*[-–:]?\s*\d+/i.test(t)) { out.bpm = out.bpm || +t.match(/\d+/)[0]; continue; }
    if (t && /^[\d\s&+.ae]+$/.test(t) && /\d/.test(t) && !/[a-df-z]/i.test(t.replace(/[ae]/g, ""))) continue; // strum counts like 1 & 2 &
    if (/click transpose|e-?mail:|@\w+\.\w+|ultimate-guitar|^time signature|^strumming\s+pattern$|^tab by\b|^standard tuning$/i.test(t) || /^capo\s+[ivx]+\b/i.test(t) && t.split(/\s+/).length <= 4) continue;
    if (/^(tune|tuned)\b.*(down|up|half|1\/2)|half[- ]step down/i.test(t)) { out.tuning = out.tuning || t.replace(/[.]$/, ""); continue; }
    keep.push(l.replace(/\s*\[[x0-9]{4,6}\]/gi, "").replace(/\s+$/, ""));
  }
  out.body = keep.join("\n").replace(/^\s+/, "").replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

/* move every chord in a song body by some semitones */
function transposeBody(body, semis) {
  if (!semis) return body;
  return String(body).replace(/\[([^\]]+)\]/g, (m, c) => T.isChord(c) ? "[" + T.transposeChord(c, semis) + "]" : m);
}

window.Importer = { pdfToText, parseSheet, convertSheet, cleanBody, loadPdfLib, transposeBody };
