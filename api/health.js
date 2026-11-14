// GET /api/health
// Quick check that the backend is running and the contact form is configured.
// Shows only true/false, never the secret values themselves.
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    ok: true,
    time: new Date().toISOString(),
    contactConfigured: Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL),
    region: process.env.VERCEL_REGION || 'local',
  }));
}
