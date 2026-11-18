// Tests for the private résumé builder (npm test). Uses a fake AI reply, so no key or quota is needed.
// Writes the sample PDFs to ./tmp-test/ so you can open them and check the layout.
import { mkdirSync, writeFileSync } from 'node:fs';
import handler from '../api/tailor.js';
import page from '../api/resume-builder.js';

let fails = 0;
const check = (ok, label, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`); if (!ok) fails++; };

const fake = kind => ({
  company: 'Acme Robotics', role: 'AI / Robotics Software Intern',
  headline: 'CS student building real-time computer vision and robot control software',
  summary: 'Computer science student at NUST SEECS who led a five-person humanoid robotics team and ships Python computer-vision systems end to end, from MediaPipe perception to robot actions and a Flask dashboard.',
  sections: [
    { title: 'Experience', items: [
      { heading: 'Humanoid Robotics Intern & Group Leader', subheading: 'Educational Robotics Lab, SEECS, NUST', date: '26 Jun – 7 Aug 2026', bullets: [
        'Led a five-person team and merged separately built modules into one terminal controller and Flask dashboard for the EZ-Robot JD humanoid.',
        'Built real-time gesture and pose control with MediaPipe, emotion control with DeepFace and offline speech commands with Faster-Whisper.',
        "Cut false triggers with an 8-of-10-frame confirmation rule and a 5-second cooldown before any robot action.",
        'Co-developed "Ask JD", a typed and spoken assistant on local LLaMA models served through Ollama.'] },
      { heading: 'Summer Intern, Volunteer Management', subheading: 'Alkhidmat Foundation Pakistan', date: '26 Jun – 7 Aug 2026', bullets: ['Worked on the two-week project "GEN Z Entrepreneurship".'] },
    ] },
    { title: 'Projects', items: [
      { heading: 'Milaan', subheading: 'Python, FastAPI, React, Gemini vision, SQLite', date: '2026', bullets: ['Built with team Prompt-Forge: reads payment screenshots with Gemini vision and matches them against a seller statement → Ship, Hold or Review.'] },
      { heading: 'Sentinel NIDS', subheading: 'Python, Scapy, Isolation Forest, FastAPI', date: '2026', bullets: ['Hybrid rules + Isolation Forest detector; caught all 60 attack windows on a 130-window test set with 12 false alarms.'] },
      { heading: 'FixIt (group leader)', subheading: 'Java, JavaFX, OOP', date: '2026', bullets: ['Led architecture, JavaFX screens and integration for a desktop marketplace for skilled workers.'] },
      ...(kind === 'cv' ? Array.from({ length: 5 }, (_, i) => ({ heading: `Extra project ${i + 1}`, subheading: 'Stack', date: '2026', bullets: ['A longer bullet that describes what was built and how it works in enough words to wrap onto a second line of the page.', 'Second bullet.'] })) : []),
    ] },
    { title: 'Education', items: [{ heading: 'BS Computer Science', subheading: 'NUST SEECS, Islamabad', date: 'Sep 2025 – 2029', text: 'Coursework: Artificial Intelligence, Data Structures & Algorithms, Computer Networks, Information Security.' }] },
    { title: 'Skills', skills: [{ label: 'Languages', items: ['Python', 'Java', 'C++', 'SQL', 'JavaScript'] }, { label: 'AI and vision', items: ['OpenCV', 'MediaPipe', 'DeepFace', 'YOLOv8', 'Faster-Whisper', 'Ollama / LLaMA'] }] },
  ],
  matched: ['Python', 'computer vision', 'robotics'], gaps: ['ROS 2', 'C++ on embedded Linux'],
});

let mode = 'resume';
globalThis.fetch = async (url) => ({
  ok: true, status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(fake(mode)) + '\n```' }] } }] }),
});
process.env.GEMINI_API_KEY = 'test-key';

function call(fn, { host = 'localhost:3000', method = 'POST', body, url = '/api/tailor' } = {}) {
  return new Promise(resolve => {
    const headers = {}; let status = 200; const chunks = [];
    const req = { method, url, headers: { host, 'content-type': 'application/json' }, body };
    const res = {
      set statusCode(v) { status = v; }, get statusCode() { return status; },
      setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
      end: b => { if (b) chunks.push(Buffer.from(b)); resolve({ status, headers, body: Buffer.concat(chunks) }); },
    };
    fn(req, res);
  });
}

const jd = 'Acme Robotics is hiring an AI / Robotics Software Intern. You will build computer vision pipelines in Python, work with ROS 2 and C++ on embedded Linux, and integrate perception with robot control.';
mkdirSync('tmp-test', { recursive: true });

const pub = await call(handler, { host: 'bilal-ahmed-builds.cyou', body: { jd, kind: 'resume' } });
check(pub.status === 404, 'tailor API is hidden on the public domain', pub.status);
const pubPage = await call(page, { host: 'bilal-ahmed-builds.cyou', method: 'GET', url: '/api/resume-builder' });
check(pubPage.status === 404, 'builder page is hidden on the public domain', pubPage.status);
const privPage = await call(page, { host: 'bilal-ahmed-portfolio-outlaw7.vercel.app', method: 'GET', url: '/api/resume-builder' });
check(privPage.status === 200 && privPage.body.toString().includes('Résumé builder'), 'builder page opens on the private vercel.app address', privPage.status);
const short = await call(handler, { body: { jd: 'too short', kind: 'resume' } });
check(short.status === 400, 'rejects a too-short job description', short.status);

for (const kind of ['resume', 'cv']) {
  mode = kind;
  const r = await call(handler, { host: 'bilal-ahmed-portfolio-outlaw7.vercel.app', body: { jd, kind } });
  const info = JSON.parse(decodeURIComponent(r.headers['x-tailor-info'] || '%7B%7D'));
  const isPdf = r.body.subarray(0, 5).toString() === '%PDF-';
  check(r.status === 200 && isPdf, `${kind}: returns a PDF`, `${r.status}, ${r.body.length} bytes`);
  check(/Bilal_Ahmed_(Resume|CV)_Acme_Robotics\.pdf/.test(r.headers['content-disposition'] || ''), `${kind}: sensible file name`, r.headers['content-disposition']);
  if (kind === 'resume') check(info.pages === 1, 'resume fits on one page', `${info.pages} page(s)`);
  else check(info.pages >= 2, 'CV can run to several pages', `${info.pages} page(s)`);
  writeFileSync(`tmp-test/sample-${kind}.pdf`, r.body);
}

delete process.env.GEMINI_API_KEY;
const nokey = await call(handler, { host: 'localhost', body: { jd, kind: 'resume' } });
check(nokey.status === 503, 'clear message when no AI key is set', nokey.status);

process.exit(fails ? 1 : 0);
