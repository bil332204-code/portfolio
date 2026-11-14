// Tiny local server that behaves like Vercel for this site (clean URLs, /api functions, 404 page).
// Use it if you don't want to install the Vercel CLI:  npm run local  → http://localhost:3000
// Reads .env.local if present.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const port = Number(process.env.PORT) || 3000;

if (existsSync(join(root, '.env.local'))) {
  for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf' };

async function tryFile(p) { try { const s = await stat(p); return s.isFile() ? p : null; } catch { return null; } }

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let path = decodeURIComponent(url.pathname);

  if (path.startsWith('/api/')) {
    const file = join(root, 'api', path.slice(5).replace(/[^a-z0-9-]/gi, '') + '.js');
    if (!existsSync(file)) { res.statusCode = 404; return res.end('{"error":"Not found"}'); }
    const mod = await import(pathToFileURL(file).href + '?t=' + Date.now());
    return mod.default(req, res);
  }
  if (path === '/_vercel/insights/script.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end('/* analytics only runs on Vercel */'); }
  if (path.endsWith('.html')) { res.statusCode = 308; res.setHeader('Location', path.replace(/(index)?\.html$/, '')); return res.end(); }

  const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
  const candidates = safe === '/' ? [join(pub, 'index.html')] : [join(pub, safe), join(pub, safe + '.html'), join(pub, safe, 'index.html')];
  let file = null;
  for (const c of candidates) if ((file = await tryFile(c))) break;
  const status = file ? 200 : 404;
  file = file || join(pub, '404.html');
  res.statusCode = status;
  res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
  res.end(await readFile(file));
}).listen(port, () => console.log(`Local site running at http://localhost:${port}`));
