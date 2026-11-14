// Runs the contact API locally with a fake Resend so you can check it without sending real email.
import handler from '../api/contact.js';
import { Readable } from 'node:stream';

let sent = null;
globalThis.fetch = async (url, opts) => { sent = { url, body: JSON.parse(opts.body) }; return { ok: true, status: 200, text: async () => '' }; };
process.env.RESEND_API_KEY = 're_test'; process.env.CONTACT_TO_EMAIL = 'me@example.com';

function call({ method = 'POST', body = {}, origin = 'https://bilal-ahmed-builds.cyou', ip = '1.1.1.1' } = {}) {
  return new Promise(resolve => {
    const req = Readable.from([Buffer.from(JSON.stringify(body))]);
    Object.assign(req, { method, headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': ip } });
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v }, end(b) { resolve({ status: this.statusCode, body: b ? JSON.parse(b) : {} }) } };
    handler(req, res);
  });
}
const good = { name: 'Ayesha', email: 'ayesha@example.com', topic: 'Internship or job', message: 'Hi Bilal, we have a robotics internship opening.', t: Date.now() - 20000 };
const cases = [
  ['valid message is sent', { body: good }, 200, () => sent && sent.body.reply_to === 'ayesha@example.com' && sent.body.to[0] === 'me@example.com'],
  ['GET is rejected', { method: 'GET' }, 405],
  ['bad email rejected', { body: { ...good, email: 'nope' }, ip: '2.2.2.2' }, 400],
  ['short message rejected', { body: { ...good, message: 'hi' }, ip: '3.3.3.3' }, 400],
  ['other website blocked', { body: good, origin: 'https://evil.example' }, 403],
  ['honeypot silently dropped', { body: { ...good, company: 'Spam Inc' }, ip: '4.4.4.4' }, 200, () => sent === null],
  ['too-fast bot silently dropped', { body: { ...good, t: Date.now() }, ip: '5.5.5.5' }, 200, () => sent === null],
  ['HTML is escaped', { body: { ...good, name: '<b>x</b>y' }, ip: '6.6.6.6' }, 200, () => !sent.body.html.includes('<b>x</b>')],
];
let fails = 0;
for (const [label, opts, want, check] of cases) {
  sent = null;
  const r = await call(opts);
  const ok = r.status === want && (!check || check());
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  (${r.status})`);
}
for (let i = 0; i < 6; i++) await call({ body: good, ip: '9.9.9.9' });
const rl = await call({ body: good, ip: '9.9.9.9' });
console.log(`${rl.status === 429 ? 'PASS' : 'FAIL'}  rate limit after 5 messages  (${rl.status})`); if (rl.status !== 429) fails++;
process.exit(fails ? 1 : 0);
