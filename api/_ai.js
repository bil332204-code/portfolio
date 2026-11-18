// Asks an AI model to tailor Bilal's profile to a job description and return structured JSON.
// Works with either key (set ONE in Vercel → Settings → Environment Variables):
//   GEMINI_API_KEY      free from aistudio.google.com → Get API key   (model: GEMINI_MODEL, default gemini-flash-latest)
//   ANTHROPIC_API_KEY   from console.anthropic.com                    (model: ANTHROPIC_MODEL, default claude-sonnet-5-5)
// If both are set, AI_PROVIDER=gemini or AI_PROVIDER=anthropic picks one (default: Gemini).

export function provider() {
  const want = (process.env.AI_PROVIDER || '').toLowerCase();
  if (want === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (want === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

const RULES = {
  resume: `KIND: RESUME (must fit on ONE A4 page).
- headline: max 12 words, aimed at the target role.
- summary: 2-3 sentences, max 55 words.
- Include Education (degree, school, dates; one line of only the most relevant coursework as "text").
- Include only the experience entries relevant to the job (the robotics internship is almost always relevant; keep tutoring/volunteering short or drop them for purely technical roles, keep them for teaching, education, NGO or people-facing roles).
- Include the 3-4 most relevant projects.
- Bullets: most relevant experience max 4 bullets, other entries max 2, projects 1-2. Each bullet max 24 words.
- Achievements and certifications: combine into one short section if useful.
- Skills: 3-5 groups, most relevant first, max ~8 items per group.`,
  cv: `KIND: CV (comprehensive, 2-3 pages is fine).
- headline: max 14 words. summary: 3-4 sentences, max 85 words.
- Include Education with full relevant coursework as "text".
- Include ALL experience entries, ALL projects (most relevant first, 2-4 bullets each, add the tech stack and role in the subheading), achievements, certifications and full skills.
- Each bullet max 30 words.`,
};

const SCHEMA = `Return ONLY a JSON object, no markdown, shaped exactly like this:
{
  "company": "company name from the job description, or \\"\\"",
  "role": "job title from the job description, or \\"\\"",
  "headline": "one-line professional headline",
  "summary": "tailored summary paragraph",
  "sections": [
    { "title": "Experience", "items": [ { "heading": "Job title or project name", "subheading": "Organisation, place / tech stack", "date": "date range", "text": "optional short paragraph", "bullets": ["..."] } ] },
    { "title": "Skills", "skills": [ { "label": "Languages", "items": ["Python", "..."] } ] }
  ],
  "matched": ["job requirements/keywords Bilal genuinely has, short"],
  "gaps": ["job requirements Bilal does not have per the profile, short"]
}
Order the sections by what this employer cares about most (for example Projects before Experience for a software role, Education first for an internship or academic post).`;

function systemPrompt(kind) {
  return `You are an expert technical recruiter and resume writer. You tailor a candidate's resume or CV to a specific job description.

TRUTH RULES (most important):
- Use ONLY facts in the PROFILE. Never invent or inflate employers, job titles, dates, numbers, results, tools, skills, certifications, grades or responsibilities.
- Do NOT add a skill just because the job asks for it. If the profile doesn't show it, put it in "gaps" instead.
- You MAY choose what to include, reorder by relevance, shorten, merge, and reword bullets with strong action verbs and the job's vocabulary, as long as the meaning stays true.
- Keep team credit honest: when the profile says something was built with or by teammates, don't claim it alone.
- Plain text only inside strings (no markdown, no emoji). Use the dates exactly as in the profile.
- Write in English, concise and specific. No first-person "I" in bullets.

${RULES[kind]}

${SCHEMA}`;
}

function userPrompt(profile, jd, notes) {
  return `PROFILE (JSON, the only source of truth):
${JSON.stringify(profile)}

JOB DESCRIPTION (between the markers):
<<<JD
${jd}
JD>>>
${notes ? `\nEXTRA INSTRUCTIONS FROM BILAL (follow them, but the truth rules still win):\n${notes}\n` : ''}
Now return the JSON.`;
}

async function callGemini(system, user) {
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 16000 },
    }),
    signal: AbortSignal.timeout(55000),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${body?.error?.message || 'request failed'}`);
  const parts = body?.candidates?.[0]?.content?.parts || [];
  return parts.filter(p => !p.thought).map(p => p.text || '').join('');
}

async function callAnthropic(system, user) {
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 8000, temperature: 0.4, system, messages: [{ role: 'user', content: user }] }),
    signal: AbortSignal.timeout(55000),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Claude ${r.status}: ${body?.error?.message || 'request failed'}`);
  return (body.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

export function parseJson(text) {
  const t = String(text || '').replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('The AI did not return JSON.');
  return JSON.parse(t.slice(a, b + 1));
}

const str = (v, n = 400) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, n);
const arr = v => (Array.isArray(v) ? v : []);

// Make whatever the model returned safe and predictable for the PDF renderer.
export function normalize(raw, contact) {
  const sections = arr(raw.sections).slice(0, 10).map(s => {
    const title = str(s.title, 60) || 'Section';
    const skills = arr(s.skills).map(g => ({ label: str(g.label, 40), items: arr(g.items).map(i => str(i, 60)).filter(Boolean).slice(0, 16) })).filter(g => g.label && g.items.length);
    const items = arr(s.items).slice(0, 14).map(it => ({
      heading: str(it.heading, 140), subheading: str(it.subheading, 220), date: str(it.date, 40), text: str(it.text, 700),
      bullets: arr(it.bullets).map(b => str(b, 320)).filter(Boolean).slice(0, 6),
    })).filter(it => it.heading || it.text || it.bullets.length);
    return skills.length ? { title, skills } : { title, items };
  }).filter(s => s.skills?.length || s.items?.length);
  if (!sections.length) throw new Error('The AI returned an empty résumé. Try again.');
  return {
    contact,
    company: str(raw.company, 80), role: str(raw.role, 100),
    headline: str(raw.headline, 160), summary: str(raw.summary, 900),
    sections,
    matched: arr(raw.matched).map(m => str(m, 60)).filter(Boolean).slice(0, 20),
    gaps: arr(raw.gaps).map(m => str(m, 80)).filter(Boolean).slice(0, 12),
  };
}

export async function tailor({ profile, jd, kind, notes }) {
  const p = provider();
  if (!p) throw Object.assign(new Error('No AI key set. Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in Vercel, then redeploy.'), { status: 503 });
  const system = systemPrompt(kind), user = userPrompt(profile, jd, notes);
  const call = p === 'gemini' ? callGemini : callAnthropic;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await call(system, user);
      return normalize(parseJson(text), profile.contact);
    } catch (e) {
      lastErr = e;
      if (/ 4(0[0-3]|04):/.test(e.message)) break; // bad key / bad model name: retrying won't help
    }
  }
  throw lastErr;
}
