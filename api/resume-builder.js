// GET /resume-builder  (rewritten to /api/resume-builder in vercel.json)
// Bilal's private résumé/CV builder: paste a job description, pick Résumé or CV, get a tailored PDF.
// Like /visits, it only opens on the *.vercel.app address, which Vercel locks behind your own login.
//   Open: https://bilal-ahmed-portfolio-outlaw7.vercel.app/resume-builder
// /resume-builder.js (same function, ?asset=js) is the small script that runs the page.
import { provider } from './_ai.js';

const isPrivateHost = host => /\.vercel\.app$/.test(host) || /^localhost(:\d+)?$/.test(host);

const SCRIPT = `(() => {
  const f = document.getElementById('f'), btn = document.getElementById('go'), st = document.getElementById('status'), out = document.getElementById('out');
  const jd = document.getElementById('jd'), count = document.getElementById('count');
  const KEY = 'rb-last-jd';
  try { const last = localStorage.getItem(KEY); if (last && !jd.value) jd.value = last; } catch {}
  const upd = () => { count.textContent = jd.value.trim().length.toLocaleString() + ' characters'; };
  jd.addEventListener('input', upd); upd();
  document.getElementById('clear').addEventListener('click', () => { jd.value = ''; upd(); jd.focus(); try { localStorage.removeItem(KEY); } catch {} });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let lastUrl;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const kind = f.kind.value, notes = f.notes.value;
    try { localStorage.setItem(KEY, jd.value); } catch {}
    btn.disabled = true; out.hidden = true; st.className = 'status busy';
    const t0 = Date.now();
    const tick = setInterval(() => { st.textContent = 'Tailoring your ' + (kind === 'cv' ? 'CV' : 'résumé') + ' to this job… ' + Math.round((Date.now() - t0) / 1000) + 's'; }, 250);
    try {
      const r = await fetch('/api/tailor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd: jd.value, kind, notes }) });
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.error || ('Error ' + r.status)); }
      const blob = await r.blob();
      const name = ((r.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/) || [])[1] || 'Bilal_Ahmed.pdf';
      let info = {}; try { info = JSON.parse(decodeURIComponent(r.headers.get('X-Tailor-Info') || '%7B%7D')); } catch {}
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = lastUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      const chips = (list, cls) => list && list.length ? list.map(x => '<span class="chip ' + cls + '">' + esc(x) + '</span>').join('') : '<span class="muted">None</span>';
      out.innerHTML =
        '<h2>' + esc(name) + '</h2>' +
        '<p class="muted">' + esc([info.role, info.company].filter(Boolean).join(' at ') || 'Tailored PDF') + ' · ' + (info.pages || 1) + ' page' + (info.pages > 1 ? 's' : '') + ' · ' + Math.round((Date.now() - t0) / 1000) + 's</p>' +
        '<div class="row"><a class="btn" href="' + lastUrl + '" download="' + esc(name) + '">Download again</a><a class="btn ghost" href="' + lastUrl + '" target="_blank" rel="noopener">Open PDF</a></div>' +
        '<h3>Covered from the job</h3><div>' + chips(info.matched, 'ok') + '</div>' +
        '<h3>Asked for, but not in your profile</h3><div>' + chips(info.gaps, 'gap') + '</div>' +
        '<p class="muted small">Gaps are left out of the PDF on purpose. If you do have one of them, add it to api/_profile.js and generate again.</p>';
      out.hidden = false; st.className = 'status ok'; st.textContent = 'Done. Your PDF downloaded.';
    } catch (err) {
      st.className = 'status err'; st.textContent = err.message || 'Something went wrong. Try again.';
    } finally { clearInterval(tick); btn.disabled = false; }
  });
})();`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const page = (body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Résumé builder | bilal.</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{--bg:#16181B;--card:#1F2226;--line:#2E3238;--text:#ECEAE4;--muted:#9AA0A6;--orange:#FF7A45;--green:#5BD6A0;--blue:#7AA7FF;--red:#FF6B6B}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:28px 18px 60px}
h1{font-size:28px;margin:0 0 4px}.sub{color:var(--muted);margin:0 0 20px}
a{color:var(--blue)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:16px}
label{display:block;font-weight:600;margin:0 0 6px}
textarea{width:100%;background:#16181B;color:var(--text);border:1px solid var(--line);border-radius:12px;padding:12px;font:14px/1.5 system-ui,sans-serif;resize:vertical}
textarea:focus{outline:2px solid var(--orange);border-color:transparent}
#jd{min-height:260px}#notes{min-height:64px}
.meta{display:flex;justify-content:space-between;color:var(--muted);font-size:13px;margin:6px 0 16px}
.meta button{background:none;border:0;color:var(--blue);cursor:pointer;font:inherit;padding:0}
.kinds{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.kinds input{position:absolute;opacity:0}
.kinds label{border:1px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer;font-weight:400;margin:0}
.kinds label b{display:block;font-size:16px}.kinds label span{color:var(--muted);font-size:13px}
.kinds input:checked+label{border-color:var(--orange);background:rgba(255,122,69,.08)}
.kinds input:focus-visible+label{outline:2px solid var(--orange)}
.btn{display:inline-block;background:var(--orange);color:#16181B;border:0;border-radius:99px;padding:12px 22px;font:600 15px system-ui,sans-serif;cursor:pointer;text-decoration:none}
.btn:disabled{opacity:.55;cursor:wait}.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
.row{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 6px}
.status{margin:14px 0 0;min-height:22px}.status.busy{color:var(--orange)}.status.ok{color:var(--green)}.status.err{color:var(--red)}
.chip{display:inline-block;border-radius:99px;padding:2px 10px;margin:3px 4px 3px 0;font-size:13px}
.chip.ok{background:rgba(91,214,160,.14);color:var(--green)}.chip.gap{background:rgba(255,107,107,.12);color:var(--red)}
h2{font-size:18px;margin:0 0 2px;word-break:break-all}h3{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:16px 0 4px}
.muted{color:var(--muted)}.small{font-size:13px}
.warn{border-color:var(--orange)}.warn b{color:var(--orange)}
code{background:#2A2E34;border-radius:6px;padding:1px 6px;font-size:13px}
</style></head><body><div class="wrap">${body}</div><script src="/resume-builder.js" defer></script></body></html>`;

function send(res, status, type, text) {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(text);
}

export default function handler(req, res) {
  const host = String(req.headers.host || '').toLowerCase();
  const url = new URL(req.url, `https://${host || 'localhost'}`);
  if (!isPrivateHost(host)) {
    if (url.searchParams.get('asset') === 'js') return send(res, 404, 'text/javascript', '');
    return send(res, 404, 'text/html; charset=utf-8', page('<h1>Nothing here.</h1><p class="sub"><a href="/">Back to the homepage</a></p>'));
  }
  if (url.searchParams.get('asset') === 'js') return send(res, 200, 'text/javascript; charset=utf-8', SCRIPT);

  const p = provider();
  const keyNote = p ? '' : `<div class="card warn"><b>One step left:</b> add an AI key so this can work.
    Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>, then in Vercel open
    <b>bilal-ahmed-portfolio → Settings → Environment Variables</b>, add <code>GEMINI_API_KEY</code> for Production and Preview, and redeploy.</div>`;

  send(res, 200, 'text/html; charset=utf-8', page(`
    <h1>Résumé builder</h1>
    <p class="sub">Private to you. Paste a job description and get a PDF tailored to it, using only what's true in your profile. <a href="/visits">Visitor log</a></p>
    ${keyNote}
    <form class="card" id="f" method="post" action="/api/tailor">
      <label for="jd">Job description</label>
      <textarea id="jd" name="jd" required minlength="60" maxlength="20000" placeholder="Paste the whole job post here: title, company, responsibilities, requirements…"></textarea>
      <div class="meta"><span id="count">0 characters</span><button type="button" id="clear">Clear</button></div>
      <div class="kinds">
        <input type="radio" name="kind" id="k-resume" value="resume" checked><label for="k-resume"><b>Résumé</b><span>One page, only what matters for this job</span></label>
        <input type="radio" name="kind" id="k-cv" value="cv"><label for="k-cv"><b>CV</b><span>Full detail, 2–3 pages, ordered for this job</span></label>
      </div>
      <label for="notes">Extra instructions <span class="muted">(optional)</span></label>
      <textarea id="notes" name="notes" maxlength="800" placeholder="e.g. push my Python and AI projects, keep tutoring, skip the DLD project"></textarea>
      <div class="row"><button class="btn" id="go" type="submit">Generate PDF</button></div>
      <p class="status" id="status" role="status" aria-live="polite"></p>
    </form>
    <div class="card" id="out" hidden></div>
    <p class="muted small">AI: ${esc(p ? (p === 'gemini' ? `Gemini (${process.env.GEMINI_MODEL || 'gemini-flash-latest'})` : `Claude (${process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'})`) : 'not set up')} · Your facts live in <code>api/_profile.js</code> and <code>scripts/content.mjs</code>.</p>`));
}
