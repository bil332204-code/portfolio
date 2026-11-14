// POST /api/contact
// Receives the contact form, checks it, and emails it to you through Resend.
// Needs these environment variables in Vercel (Project → Settings → Environment Variables):
//   RESEND_API_KEY      your Resend API key (starts with re_)
//   CONTACT_TO_EMAIL    where messages go (must be your Resend account email until you verify a domain)
//   CONTACT_FROM_EMAIL  optional, e.g. "Portfolio <hello@bilal-ahmed-builds.cyou>" once your domain is verified in Resend

const MAX = { name: 80, email: 120, topic: 60, message: 3000 };
const TOPICS = ['Internship or job', 'Freelance project', 'Collaboration', 'Just saying hi'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Simple per-instance rate limit: 5 messages per IP per 10 minutes.
// (Serverless instances don't share memory, so this is a speed bump, not a wall.
//  The honeypot and timing check below stop most bots.)
const hits = new Map();
function limited(ip) {
  const now = Date.now(), windowMs = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  const type = req.headers['content-type'] || '';
  if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  return JSON.parse(raw || '{}');
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.setHeader('Allow', 'POST'); return send(res, 204, {}); }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Use POST to send a message.' }); }

  // Only accept requests from your own site (blocks other sites posting to your API).
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://bilal-ahmed-builds.cyou,https://www.bilal-ahmed-builds.cyou')
    .split(',').map(s => s.trim());
  const isPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
  const isLocal = /^http:\/\/localhost(:\d+)?$/.test(origin);
  if (origin && !allowed.includes(origin) && !isPreview && !isLocal) return send(res, 403, { error: 'This form only works on my site.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return send(res, 429, { error: 'Too many messages in a short time. Try again in a few minutes.' });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: 'The form data could not be read.' }); }

  // Bot traps: hidden "company" field must be empty, and humans take more than 3 seconds to fill the form.
  if (clean(body.company)) return send(res, 200, { ok: true });
  const started = Number(body.t);
  if (started && Date.now() - started < 3000) return send(res, 200, { ok: true });

  const name = clean(body.name).slice(0, MAX.name);
  const email = clean(body.email).slice(0, MAX.email);
  const topic = TOPICS.includes(clean(body.topic)) ? clean(body.topic) : 'Other';
  const message = clean(body.message).slice(0, MAX.message);

  const errors = [];
  if (name.length < 2) errors.push('name');
  if (!EMAIL_RE.test(email)) errors.push('email');
  if (message.length < 10) errors.push('message');
  if (errors.length) return send(res, 400, { error: `Please check your ${errors.join(', ')}.`, fields: errors });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || 'Portfolio contact <onboarding@resend.dev>';
  if (!key || !to) {
    console.error('contact: RESEND_API_KEY or CONTACT_TO_EMAIL is not set');
    return send(res, 500, { error: 'The contact form isn\'t set up yet.' });
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="margin:0 0 4px">New message from your portfolio</h2>
      <p style="color:#666;margin:0 0 18px">${esc(topic)}</p>
      <p><strong>Name:</strong> ${esc(name)}<br><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      <div style="white-space:pre-wrap;background:#f4f4f2;border-radius:10px;padding:14px 16px">${esc(message)}</div>
      <p style="color:#888;font-size:12px;margin-top:18px">Hit reply to answer ${esc(name)} directly.</p>
    </div>`;
  const text = `New message from your portfolio\nTopic: ${topic}\nName: ${name}\nEmail: ${email}\n\n${message}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to], reply_to: email,
        subject: `Portfolio: ${topic} from ${name}`.slice(0, 150),
        html, text,
      }),
    });
    if (!r.ok) {
      console.error('contact: Resend error', r.status, await r.text().catch(() => ''));
      return send(res, 502, { error: 'The message couldn\'t be sent right now.' });
    }
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error('contact: network error', e);
    return send(res, 502, { error: 'The message couldn\'t be sent right now.' });
  }
}
