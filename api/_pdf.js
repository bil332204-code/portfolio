// Turns the tailored résumé/CV (plain JSON) into a clean, ATS-friendly PDF with pdf-lib.
// Real selectable text, standard fonts, no images, so applicant-tracking systems can read it.
// A résumé is shrunk slightly (down to 85%) if needed so it fits on one page.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4 = [595.28, 841.89];
const INK = rgb(0.10, 0.10, 0.11);
const MUTED = rgb(0.36, 0.37, 0.40);
const ACCENT = rgb(0.76, 0.27, 0.05);
const RULE = rgb(0.82, 0.82, 0.84);

// The built-in PDF fonts only cover Western European characters. Swap the common
// "smart" ones for safe equivalents and silently drop anything else (emoji etc.).
const SWAP = { '‘': "'", '’': "'", '“': '"', '”': '"', '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '‑': '-', '‐': '-', '−': '-', ' ': ' ', ' ': ' ', '​': '', '≈': '~', '✓': '', '★': '' };
const okChars = new Map();
function safe(font, text) {
  let out = '';
  for (const ch of String(text ?? '').replace(/[\r\n\t]+/g, ' ')) {
    const c = SWAP[ch] ?? ch;
    for (const cc of c) {
      if (!okChars.has(cc)) { try { font.widthOfTextAtSize(cc, 10); okChars.set(cc, true); } catch { okChars.set(cc, false); } }
      if (okChars.get(cc)) out += cc;
    }
  }
  return out.replace(/ {2,}/g, ' ').trim();
}

async function layout(data, kind, s) {
  const pdf = await PDFDocument.create();
  const F = {
    reg: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    ital: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };
  const cv = kind === 'cv';
  const M = { x: (cv ? 52 : 42) * s + (1 - s) * 20, top: (cv ? 50 : 38) * s, bottom: (cv ? 54 : 36) * s };
  const W = A4[0] - 2 * M.x;
  const size = { body: 9.8 * s, small: 9.1 * s, h3: 10.4 * s, h2: 10.6 * s, name: 22 * s, headline: 10.6 * s };
  const LH = 1.34;

  let page, y;
  const newPage = () => { page = pdf.addPage(A4); y = A4[1] - M.top; };
  newPage();
  const ensure = h => { if (y - h < M.bottom) newPage(); };

  // Draw words from several fonts as one wrapped paragraph. Returns nothing; moves y down.
  function rich(segments, x, width, sz, color = INK, firstIndent = 0) {
    const words = [];
    for (const seg of segments) {
      const t = safe(seg.font, seg.text);
      if (!t) continue;
      const parts = t.split(' ');
      parts.forEach((w, i) => words.push({ w, font: seg.font, color: seg.color || color, space: i === 0 ? seg.space !== false : true }));
    }
    const lineH = sz * LH;
    let line = [], lineW = 0, avail = width - firstIndent, lx = x + firstIndent;
    const flush = () => {
      ensure(lineH);
      let cx = lx;
      for (const it of line) {
        if (it.lead) cx += it.font.widthOfTextAtSize(' ', sz);
        page.drawText(it.w, { x: cx, y: y - sz, size: sz, font: it.font, color: it.color });
        cx += it.font.widthOfTextAtSize(it.w, sz);
      }
      y -= lineH;
      line = []; lineW = 0; avail = width; lx = x;
    };
    for (const it of words) {
      const ww = it.font.widthOfTextAtSize(it.w, sz);
      const sp = line.length && it.space ? it.font.widthOfTextAtSize(' ', sz) : 0;
      if (line.length && lineW + sp + ww > avail) flush();
      const lead = line.length > 0 && it.space;
      line.push({ ...it, lead });
      lineW += (lead ? it.font.widthOfTextAtSize(' ', sz) : 0) + ww;
    }
    if (line.length) flush();
  }

  // ── Header ──
  const c = data.contact;
  page.drawText(safe(F.bold, c.name), { x: M.x, y: y - size.name, size: size.name, font: F.bold, color: INK });
  y -= size.name * 1.22;
  if (data.headline) rich([{ text: data.headline, font: F.reg, color: ACCENT }], M.x, W, size.headline);
  const contactBits = [c.email, c.phone, c.website, c.github, c.linkedin, c.location].filter(Boolean);
  rich(contactBits.flatMap((b, i) => i ? [{ text: '|', font: F.reg, color: RULE }, { text: b, font: F.reg }] : [{ text: b, font: F.reg }]), M.x, W, size.small, MUTED);
  y -= 4 * s;

  const section = title => {
    ensure(size.h2 * 3.2);
    y -= 7 * s;
    page.drawText(safe(F.bold, title.toUpperCase()), { x: M.x, y: y - size.h2, size: size.h2, font: F.bold, color: ACCENT });
    y -= size.h2 + 3.5 * s;
    page.drawLine({ start: { x: M.x, y }, end: { x: M.x + W, y }, thickness: 0.6, color: RULE });
    y -= 5 * s;
  };

  if (data.summary) {
    section(cv ? 'Profile' : 'Summary');
    rich([{ text: data.summary, font: F.reg }], M.x, W, size.body);
  }

  for (const sec of data.sections) {
    section(sec.title);
    if (sec.skills?.length) {
      for (const g of sec.skills) {
        rich([{ text: `${g.label}:`, font: F.bold }, { text: g.items.join(', '), font: F.reg }], M.x, W, size.body);
        y -= 1 * s;
      }
      continue;
    }
    for (const it of sec.items || []) {
      // keep the heading, sub-heading and first bullet together on one page
      ensure(size.h3 * LH + (it.subheading ? size.small * LH : 0) + size.body * LH * 1.2 + 4 * s);
      y -= 3 * s;
      const date = safe(F.reg, it.date || '');
      const dw = date ? F.reg.widthOfTextAtSize(date, size.small) + 12 : 0;
      if (date) page.drawText(date, { x: M.x + W - dw + 12, y: y - size.h3, size: size.small, font: F.reg, color: MUTED });
      rich([{ text: it.heading, font: F.bold }], M.x, W - dw, size.h3);
      if (it.subheading) rich([{ text: it.subheading, font: F.ital }], M.x, W, size.small, MUTED);
      if (it.text) { y -= 1 * s; rich([{ text: it.text, font: F.reg }], M.x, W, size.body); }
      for (const b of it.bullets || []) {
        ensure(size.body * LH);
        y -= 0.6 * s;
        page.drawText('•', { x: M.x + 4 * s, y: y - size.body, size: size.body, font: F.reg, color: ACCENT });
        rich([{ text: b, font: F.reg }], M.x + 14 * s, W - 14 * s, size.body);
      }
      y -= 2.5 * s;
    }
  }

  // Page numbers when there is more than one page
  const pages = pdf.getPages();
  if (pages.length > 1) {
    const label = cv ? 'Curriculum Vitae' : 'Résumé';
    pages.forEach((p, i) => {
      const t = safe(F.reg, `${c.name} | ${label} | Page ${i + 1} of ${pages.length}`);
      const tw = F.reg.widthOfTextAtSize(t, 8);
      p.drawText(t, { x: (A4[0] - tw) / 2, y: 22, size: 8, font: F.reg, color: MUTED });
    });
  }

  pdf.setTitle(`${c.name} | ${cv ? 'Curriculum Vitae' : 'Résumé'}${data.role ? ` | ${data.role}` : ''}`);
  pdf.setAuthor(c.name);
  pdf.setSubject([data.role, data.company].filter(Boolean).join(' at ') || (cv ? 'Curriculum Vitae' : 'Résumé'));
  if (data.matched?.length) pdf.setKeywords(data.matched.slice(0, 30));
  pdf.setCreator('bilal-ahmed-builds.cyou résumé builder');
  pdf.setProducer('pdf-lib');
  return { pdf, pages: pages.length };
}

export async function renderPdf(data, kind) {
  const scales = kind === 'cv' ? [1] : [1, 0.96, 0.92, 0.88, 0.85];
  let out;
  for (const s of scales) {
    out = await layout(data, kind, s);
    if (out.pages === 1) break;
  }
  return { bytes: await out.pdf.save(), pages: out.pages };
}
