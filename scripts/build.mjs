// Generates project pages and sitemap.xml from scripts/content.mjs.
// Run with `npm run build`. Vercel runs this automatically on every deploy.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, projects } from './content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const head = ({ title, desc, path, image = '/og.png' }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${site.url}${path}">
<meta property="og:type" content="article">
<meta property="og:url" content="${site.url}${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${site.url}${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#16181B">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/page.css">
<script src="/_vercel/insights/script.js" defer></script>
<script src="/assets/visit.js" defer></script>
</head>`;

const topbar = (backHref, backText) => `
<a class="skip" href="#main">Skip to content</a>
<div class="wrap top"><a class="logo" href="/">bilal.</a><a class="back" href="${backHref}">${backText}</a></div>`;

const foot = `
<footer><div class="wrap"><span>© ${new Date().getFullYear()} ${site.name} · Islamabad</span><span><a href="/#contact">Contact</a> · <a href="${site.github}" rel="me">GitHub</a></span></div></footer>
</body>
</html>
`;

mkdirSync(join(root, 'projects'), { recursive: true });

projects.forEach((p, i) => {
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const path = `/projects/${p.slug}`;
  const ld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description: p.lead, author: { '@type': 'Person', name: site.name, url: site.url }, dateCreated: p.year, keywords: p.stack.join(', '), url: site.url + path };
  const html = `${head({ title: `${p.title}: ${p.lead.replace(/\.$/, '')} | ${site.name}`, desc: `${p.lead} Built with ${p.stack.slice(0, 4).join(', ')}.`, path })}
<body style="--c:var(--${p.color})">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${topbar('/#work', 'All projects')}
<main id="main" class="wrap">
  <header class="p-hero">
    <div class="mark" aria-hidden="true">${esc(p.mark)}</div>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.lead)}</p>
    <dl class="meta">
      <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
      <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
      <div><dt>Status</dt><dd>${esc(p.status)}</dd></div>
      <div><dt>Main tools</dt><dd>${esc(p.stack.slice(0, 3).join(', '))}</dd></div>
    </dl>
    <div class="actions">
      ${p.demo ? `<a class="btn solid" href="${esc(p.demo)}" rel="noopener">${esc(p.demoLabel || 'Open live site')}</a>` : ''}
      ${p.repo ? `<a class="btn${p.demo ? '' : ' solid'}" href="${esc(p.repo)}" rel="noopener">View source code</a>` : `<a class="btn${p.demo ? '' : ' solid'}" href="${site.github}" rel="me noopener">More on my GitHub</a>`}
      <a class="btn" href="/#contact">Ask me about it</a>
    </div>
  </header>

  <section class="block"><h2>What it does</h2><div>${p.what.map(t => `<p>${esc(t)}</p>`).join('')}</div></section>
  <section class="block"><h2>How it works</h2><ol class="steps">${p.how.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ol></section>
  <section class="block"><h2>What I did</h2><ul class="mine">${p.mine.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>
  <section class="block"><h2>Built with</h2><ul class="chips">${p.stack.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>

  <nav class="pn" aria-label="More projects">
    <a href="/projects/${prev.slug}"><small>Previous project</small><strong>${esc(prev.title)}</strong></a>
    <a class="nx" href="/projects/${next.slug}"><small>Next project</small><strong>${esc(next.title)}</strong></a>
  </nav>
</main>${foot}`;
  writeFileSync(join(root, 'projects', `${p.slug}.html`), html);
});

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const urls = ['/', '/resume', ...projects.map(p => `/projects/${p.slug}`)];
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.url}${u === '/' ? '/' : u}</loc><lastmod>${today}</lastmod><priority>${u === '/' ? '1.0' : '0.7'}</priority></url>`).join('\n')}
</urlset>
`);

console.log(`Built ${projects.length} project pages and sitemap.xml`);
