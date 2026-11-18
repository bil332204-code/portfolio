// POST /api/tailor   { jd, kind: "resume" | "cv", notes? }  →  a tailored PDF download
// PRIVATE: only answers on the *.vercel.app address (locked behind your Vercel login) or localhost.
// On the public domain it returns 404, so nobody else can use it or spend your AI quota.
// Used by the page at /resume-builder (api/resume-builder.js).
import { profile } from './_profile.js';
import { tailor, provider } from './_ai.js';
import { renderPdf } from './_pdf.js';

export const isPrivateHost = host => /\.vercel\.app$/.test(host) || /^localhost(:\d+)?$/.test(host);

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) raw = String(req.body);
  else { const chunks = []; for await (const c of req) chunks.push(c); raw = Buffer.concat(chunks).toString('utf8'); }
  if ((req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  return JSON.parse(raw || '{}');
}

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
const slug = s => String(s || '').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s-]+/g, '_').slice(0, 40);

function fail(req, res, status, message) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if ((req.headers['content-type'] || '').includes('application/json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: message }));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const esc = String(message).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  res.end(`<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Résumé builder</title><body style="font:16px system-ui;background:#16181B;color:#ECEAE4;padding:30px"><p>${esc}</p><p><a style="color:#7AA7FF" href="/resume-builder">Back</a></p>`);
}

export default async function handler(req, res) {
  const host = String(req.headers.host || '').toLowerCase();
  if (!isPrivateHost(host)) return fail(req, res, 404, 'Not found.');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fail(req, res, 405, 'Use the form at /resume-builder.'); }

  let body;
  try { body = await readBody(req); } catch { return fail(req, res, 400, 'Could not read the request.'); }
  const jd = clean(body.jd, 20000);
  const kind = body.kind === 'cv' ? 'cv' : 'resume';
  const notes = clean(body.notes, 800);
  if (jd.length < 60) return fail(req, res, 400, 'Paste the full job description (at least a few lines).');
  if (!provider()) return fail(req, res, 503, 'No AI key is set yet. Add GEMINI_API_KEY (free from aistudio.google.com) in Vercel → Settings → Environment Variables, then redeploy.');

  try {
    const data = await tailor({ profile, jd, kind, notes });
    const { bytes, pages } = await renderPdf(data, kind);
    const name = ['Bilal_Ahmed', kind === 'cv' ? 'CV' : 'Resume', slug(data.company)].filter(Boolean).join('_') + '.pdf';
    const info = { company: data.company, role: data.role, pages, matched: data.matched, gaps: data.gaps, provider: provider() };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('X-Tailor-Info', encodeURIComponent(JSON.stringify(info)));
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.end(Buffer.from(bytes));
  } catch (e) {
    console.error('tailor: failed', e?.message || e);
    const msg = e?.status === 503 ? e.message
      : /40[13]:/.test(e?.message || '') ? 'The AI key was rejected. Check the key in Vercel environment variables.'
      : /404:/.test(e?.message || '') ? 'The AI model name was not found. Set GEMINI_MODEL (or ANTHROPIC_MODEL) to a current model in Vercel.'
      : /429:/.test(e?.message || '') ? 'The AI free-tier limit was hit. Wait a minute and try again.'
      : /timeout|aborted/i.test(e?.message || '') ? 'The AI took too long. Try again.'
      : `Generation failed: ${e?.message || 'unknown error'}. Try again.`;
    return fail(req, res, 502, msg);
  }
}
