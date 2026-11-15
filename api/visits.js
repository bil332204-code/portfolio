// GET /visits  (rewritten to /api/visits in vercel.json)
// Bilal's private visitor log. It only opens on the project's *.vercel.app address, which Vercel
// locks behind your own Vercel login (Settings → Deployment Protection). On the public domain
// it just says the page is private, so visitors can never see the log.
//   Open: https://bilal-ahmed-portfolio-outlaw7.vercel.app/visits
import { list } from '@vercel/blob';
import { PREFIX, decodePathname } from './_visits.js';

const TZ = 'Asia/Karachi';
const PAGE_SIZE = 500;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countryName = c => { try { return c ? regionNames.of(c) : ''; } catch { return c; } };
const flag = c => /^[A-Z]{2}$/.test(c || '') ? String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)) : '🌐';
const fmtTime = t => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(t);
const dayKey = t => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(t);

function ago(t, now) {
  const s = Math.round((now - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`;
}

function isPrivateHost(host) {
  return /\.vercel\.app$/.test(host) || /^localhost(:\d+)?$/.test(host);
}

function top(items, n = 5) {
  const m = new Map();
  for (const k of items) if (k) m.set(k, (m.get(k) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

const page = (title, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(title)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{--bg:#16181B;--card:#1F2226;--line:#2E3238;--text:#ECEAE4;--muted:#9AA0A6;--orange:#FF7A45;--green:#5BD6A0;--blue:#7AA7FF;--violet:#B79CFF}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:28px 18px 60px}
h1{font-size:28px;margin:0 0 4px}.sub{color:var(--muted);margin:0 0 22px}
a{color:var(--blue)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.stat b{display:block;font-size:28px;line-height:1.1}.stat span{color:var(--muted);font-size:13px}
.stat:nth-child(1) b{color:var(--orange)}.stat:nth-child(2) b{color:var(--green)}.stat:nth-child(3) b{color:var(--blue)}.stat:nth-child(4) b{color:var(--violet)}
.tops{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:22px}
.top{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 16px}
.top h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}
.top li{display:flex;justify-content:space-between;gap:10px;padding:2px 0}.top ul{list-style:none;margin:0;padding:0}.top em{color:var(--muted);font-style:normal}
.tbl{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:14px}
table{width:100%;border-collapse:collapse;min-width:820px}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);position:sticky;top:0;background:var(--card)}
tr:last-child td{border-bottom:0}.muted{color:var(--muted);font-size:13px}
.id{font-family:ui-monospace,Menlo,Consolas,monospace;background:#2A2E34;border-radius:6px;padding:1px 6px}
.tag{display:inline-block;font-size:11px;border-radius:99px;padding:1px 8px;margin-left:6px;font-weight:600}
.new{background:rgba(91,214,160,.15);color:var(--green)}.ret{background:rgba(122,167,255,.15);color:var(--blue)}
.day td{background:#1A1D20;color:var(--orange);font-weight:600;font-size:13px;padding:7px 14px}
.nav{display:flex;gap:16px;margin-top:16px}.empty{padding:40px;text-align:center;color:var(--muted)}
</style></head><body><div class="wrap">${body}</div></body></html>`;

function send(res, status, html) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(html);
}

export default async function handler(req, res) {
  const host = String(req.headers.host || '').toLowerCase();
  if (!isPrivateHost(host)) {
    return send(res, 404, page('Not found', '<h1>Nothing here.</h1><p class="sub"><a href="/">Back to the homepage</a></p>'));
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return send(res, 500, page('Visitor log', '<h1>Visitor log</h1><p class="sub">The Blob store isn\'t connected (BLOB_READ_WRITE_TOKEN is missing).</p>'));

  const url = new URL(req.url, `https://${host}`);
  const cursor = url.searchParams.get('cursor') || undefined;

  let visits = [], next;
  try {
    const r = await list({ prefix: PREFIX, limit: PAGE_SIZE, cursor, token });
    visits = r.blobs.map(b => decodePathname(b.pathname)).filter(Boolean);
    next = r.hasMore ? r.cursor : undefined;
  } catch (e) {
    console.error('visits: list failed', e?.message || e);
    return send(res, 502, page('Visitor log', '<h1>Visitor log</h1><p class="sub">Couldn\'t load the log right now. Try refreshing.</p>'));
  }

  const now = Date.now();
  const today = dayKey(now);
  const unique = new Set(visits.map(v => v.v)).size;
  const todayCount = visits.filter(v => dayKey(v.t) === today).length;
  const week = visits.filter(v => now - v.t < 7 * 864e5);
  const weekPeople = new Set(week.map(v => v.v)).size;
  const label = cursor ? 'on this page' : (next ? `in the latest ${visits.length}` : 'so far');

  const stats = `<div class="stats">
    <div class="stat"><b>${visits.length}</b><span>Page views ${label}</span></div>
    <div class="stat"><b>${unique}</b><span>Different visitors ${label}</span></div>
    <div class="stat"><b>${todayCount}</b><span>Page views today</span></div>
    <div class="stat"><b>${weekPeople}</b><span>Visitors in the last 7 days</span></div>
  </div>`;

  const list5 = (title, rows) => `<div class="top"><h2>${title}</h2>${rows.length ? `<ul>${rows.map(([k, n]) => `<li><span>${k}</span><em>${n}</em></li>`).join('')}</ul>` : '<p class="muted">Nothing yet</p>'}</div>`;
  const tops = `<div class="tops">
    ${list5('Countries', top(visits.map(v => v.c)).map(([c, n]) => [`${flag(c)} ${esc(countryName(c))}`, n]))}
    ${list5('Pages', top(visits.map(v => v.p)).map(([p, n]) => [esc(p), n]))}
    ${list5('Came from', top(visits.map(v => v.s || v.ref || 'Direct / typed')).map(([s, n]) => [esc(s), n]))}
  </div>`;

  let rows = '', lastDay = '';
  for (const v of visits) {
    const d = dayKey(v.t);
    if (d !== lastDay) {
      lastDay = d;
      const dayLabel = d === today ? 'Today' : new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(v.t);
      rows += `<tr class="day"><td colspan="6">${esc(dayLabel)}</td></tr>`;
    }
    const place = [v.ci, v.rg && v.rg !== v.ci ? v.rg : '', countryName(v.c)].filter(Boolean).join(', ') || 'Unknown';
    rows += `<tr>
      <td>${esc(fmtTime(v.t))}<div class="muted">${esc(ago(v.t, now))}</div></td>
      <td><span class="id">${esc(v.v)}</span>${v.f ? '<span class="tag new">first visit</span>' : '<span class="tag ret">returning</span>'}</td>
      <td>${flag(v.c)} ${esc(place)}</td>
      <td>${esc(v.device)} · ${esc(v.os)}<div class="muted">${esc(v.browser)}${v.w ? ` · ${esc(v.w)}px screen` : ''}${v.l ? ` · ${esc(v.l)}` : ''}</div></td>
      <td>${esc(v.p)}</td>
      <td>${esc(v.s || v.ref || 'Direct / typed')}</td>
    </tr>`;
  }

  const table = visits.length
    ? `<div class="tbl"><table><thead><tr><th>When (PKT)</th><th>Visitor</th><th>Location</th><th>Device</th><th>Page</th><th>Came from</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : '<div class="tbl"><p class="empty">No visits recorded yet. They\'ll appear here as people open bilal-ahmed-builds.cyou.</p></div>';

  const nav = `<div class="nav"><a href="/visits">↻ Newest</a>${next ? `<a href="/visits?cursor=${encodeURIComponent(next)}">Older visits →</a>` : ''}</div>`;

  return send(res, 200, page('Visitor log | bilal.', `
    <h1>Who visited your portfolio</h1>
    <p class="sub">Newest first. Same visitor ID = same person (same network + browser). Location comes from their internet connection, so it's city-level and sometimes off. Open your site once with <b>?me=1</b> to stop counting yourself.</p>
    ${stats}${tops}${table}${nav}`));
}
