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
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; res(pdfjsLib); };
    s.onerror = () => { pdfLibPromise = null; rej(new Error("The PDF reader hasn't downloaded yet. Open the app once on WiFi.")); };
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
  const m = t.match(/^\[([^\]]+)\]$/);
  if (m && !T.isChord(m[1])) return m[1];
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
  const body = convertSheet(keep.join("\n"));
  const chords = [];
  body.replace(/\[([^\]]+)\]/g, (x, c) => { if (T.isChord(c)) chords.push(c); });
  if (!info.key && chords.length) {
    // the key is usually the first or last chord of the song
    const c = T.parseChord(chords[0]);
    info.key = T.SHARPS[c.root] + (T.family(c.q).startsWith("m") && T.family(c.q) !== "maj7" ? "m" : "");
  }
  const tags = [];
  if (/\[[A-G][^\]]*5\]/.test(body)) tags.push("power");
  if (/^\s*[eBGDAE]\s*\|/m.test(body)) tags.push("riff");
  info.body = body; info.chords = chords; info.tags = tags;
  return info;
}

/* move every chord in a song body by some semitones */
function transposeBody(body, semis) {
  if (!semis) return body;
  return String(body).replace(/\[([^\]]+)\]/g, (m, c) => T.isChord(c) ? "[" + T.transposeChord(c, semis) + "]" : m);
}

window.Importer = { pdfToText, parseSheet, convertSheet, loadPdfLib, transposeBody };
