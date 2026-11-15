// Records one visit per page load in Bilal's private visitor log (see api/visit.js).
// Open the site once with ?me=1 to stop counting your own visits on that browser (?me=0 to undo).
(() => {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('me') === '1') localStorage.setItem('noTrack', '1');
    if (q.get('me') === '0') localStorage.removeItem('noTrack');
    if (localStorage.getItem('noTrack') === '1') return;
  } catch { /* storage blocked: still count the visit */ }
  if (navigator.webdriver) return;

  const q = new URLSearchParams(location.search);
  let first = false;
  try { first = !localStorage.getItem('seen'); localStorage.setItem('seen', '1'); } catch { /* ignore */ }
  const data = JSON.stringify({
    f: first,
    p: location.pathname,
    r: document.referrer,
    s: q.get('utm_source') || q.get('ref') || q.get('src') || '',
    w: screen.width,
    l: navigator.language || '',
  });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/visit', new Blob([data], { type: 'application/json' }))) return;
  } catch { /* fall through */ }
  fetch('/api/visit', { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
})();
