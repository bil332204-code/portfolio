// POST /api/visit
// Called by /assets/visit.js on every page load. Saves one visit to the private visitor log:
// when, which page, rough location (from Vercel's IP lookup), device/browser, and where they came from.
// It never stores the IP address itself, only a short scrambled "visitor ID" made from it,
// so the same person shows up with the same ID without their IP being kept.
// Needs BLOB_READ_WRITE_TOKEN (added automatically when the Blob store is connected in Vercel).
import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
import { visitPathname, parseUA, BOT_RE } from './_visits.js';

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, n);

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return JSON.parse(String(req.body) || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function done(res, status = 204) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return done(res, 405); }

  let origin = req.headers.origin || '';
  if (!origin) { try { origin = new URL(req.headers.referer || '').origin; } catch { /* none */ } }
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://bilal-ahmed-builds.cyou,https://www.bilal-ahmed-builds.cyou')
    .split(',').map(s => s.trim());
  // Only count visits to the real site (not preview links or other sites posting here).
  if (!allowed.includes(origin) && !/^http:\/\/localhost(:\d+)?$/.test(origin)) return done(res);

  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BOT_RE.test(ua)) return done(res);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { console.error('visit: BLOB_READ_WRITE_TOKEN is not set'); return done(res); }

  let body = {};
  try { body = await readBody(req); } catch { /* keep going with what the headers tell us */ }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const vid = createHash('sha256').update(`${token}|${ip}|${ua}`).digest('hex').slice(0, 8);

  let ref = '';
  try {
    const host = new URL(String(body.r || '')).hostname.replace(/^www\./, '');
    if (host && !/bilal-ahmed-builds\.cyou$/.test(host)) ref = host;
  } catch { /* no referrer */ }

  let city = '';
  try { city = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')); } catch { /* ignore */ }

  const rec = {
    t: Date.now(),
    p: clean(body.p, 80) || '/',
    v: vid,
    f: body.f === true ? 1 : 0,
    c: clean(req.headers['x-vercel-ip-country'], 2),
    rg: clean(req.headers['x-vercel-ip-country-region'], 8),
    ci: clean(city, 40),
    ...parseUA(ua),
    ref: clean(ref, 60),
    s: clean(body.s, 40),
    w: Number(body.w) > 0 ? Math.min(Math.round(Number(body.w)), 9999) : 0,
    l: clean(body.l, 12),
  };

  try {
    await put(visitPathname(rec), JSON.stringify(rec), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
      token,
    });
  } catch (e) {
    console.error('visit: could not save', e?.message || e);
  }
  return done(res);
}
