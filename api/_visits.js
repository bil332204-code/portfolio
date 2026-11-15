// Shared helpers for the visitor log (api/visit.js writes, api/visits.js reads).
// Files in /api that start with "_" are not turned into endpoints by Vercel.
//
// Each visit is stored as one small file in the private Vercel Blob store "portfolio-visits".
// The visit details are packed into the file name itself, so the dashboard can show
// everything with a single "list" call instead of opening every file.
// Names start with a reversed timestamp, so the newest visits always come first.

export const PREFIX = 'visits/';
const MAX_TS = 9999999999999;

const b64 = s => Buffer.from(s, 'utf8').toString('base64url');
const unb64 = s => Buffer.from(s, 'base64url').toString('utf8');

export function visitPathname(rec) {
  const inv = String(MAX_TS - rec.t).padStart(13, '0');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${PREFIX}${inv}-${rand}_${b64(JSON.stringify(rec))}.json`;
}

export function decodePathname(pathname) {
  try {
    const name = pathname.slice(PREFIX.length).replace(/\.json$/, '');
    const i = name.indexOf('_');
    if (i < 0) return null;
    return JSON.parse(unb64(name.slice(i + 1)));
  } catch { return null; }
}

export function parseUA(ua = '') {
  let os = 'Other';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let device = 'Desktop';
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = 'Tablet';
  else if (/Mobi|iPhone|iPod|Android/.test(ua)) device = 'Mobile';

  let browser = 'Other';
  if (/LinkedInApp/.test(ua)) browser = 'LinkedIn app';
  else if (/Instagram/.test(ua)) browser = 'Instagram app';
  else if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = 'Facebook app';
  else if (/WhatsApp/.test(ua)) browser = 'WhatsApp';
  else if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/Firefox|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/CriOS|Chrome/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua)) browser = 'Safari';

  return { device, os, browser };
}

export const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http|java\//i;
