// Vercel serverless function: POST /api/contact
// Sends each message to MAIL_TO (mike@healthcar.co and tech@doodigital.co), and an optional confirmation to the visitor.
// Transport: Gmail SMTP when SMTP_USER and SMTP_PASS are set (same setup as the Hostinger contact.php, no DNS changes needed),
// otherwise Resend when RESEND_API_KEY is set.
const net = require('node:net');
const tls = require('node:tls');
const crypto = require('node:crypto');
const { notification, confirmation } = require('./_email.js');

const hits = new Map(); // best-effort per-instance rate limit: 5 sends per 10 minutes per IP
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  return list.length > 5;
}

function parseBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch { return Object.fromEntries(new URLSearchParams(b)); } }
  return b;
}

const b64 = (x) => Buffer.from(String(x), 'utf8').toString('base64');
const encHeader = (x) => (/^[\x20-\x7e]*$/.test(x) ? x : `=?UTF-8?B?${b64(x)}?=`);
const addr = (x) => { const m = String(x).match(/<([^>]+)>/); return (m ? m[1] : String(x)).trim(); };
const nameOf = (x) => { const m = String(x).match(/^\s*"?([^"<]*?)"?\s*</); return m ? m[1].trim() : ''; };

// Minimal SMTP client: implicit TLS on 465 (Gmail), AUTH LOGIN, one RCPT per recipient.
function smtp({ from, to, reply_to, subject, html, text }) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE !== 'false';
  // Gmail only sends as the signed-in account, so the visible name stays and the address becomes SMTP_USER.
  const fromHeader = `${encHeader(nameOf(from) || 'HealthCar Website')} <${user}>`;
  const boundary = 'hc_' + crypto.randomBytes(12).toString('hex');
  const wrap = (x) => b64(x).replace(/.{1,76}/g, '$&\r\n');
  const body = [
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `From: ${fromHeader}`,
    `To: ${to.join(', ')}`,
    ...(reply_to ? [`Reply-To: ${reply_to}`] : []),
    `Subject: ${encHeader(subject)}`,
    `Message-ID: <${crypto.randomBytes(16).toString('hex')}@healthcar.co>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap(text),
    `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap(html),
    `--${boundary}--`, '',
  ].join('\r\n');
  const steps = [
    ['EHLO healthcar.co', 250], ['AUTH LOGIN', 334], [b64(user), 334], [b64(pass), 235],
    [`MAIL FROM:<${user}>`, 250], ...to.map((r) => [`RCPT TO:<${addr(r)}>`, 250]),
    ['DATA', 354], [body.replace(/^\./gm, '..') + '\r\n.', 250], ['QUIT', 221],
  ];
  return new Promise((resolve, reject) => {
    const sock = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    let buf = '', i = -1, fail = (e) => { sock.destroy(); reject(e); };
    sock.setTimeout(15000, () => fail(new Error('SMTP timeout')));
    sock.on('error', fail);
    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\r\n'); buf = lines.pop();
      for (const line of lines) {
        if (/^\d{3}-/.test(line)) continue; // multi-line reply, wait for the last line
        const code = Number(line.slice(0, 3));
        const want = i < 0 ? 220 : steps[i][1];
        if (code !== want) return fail(new Error(`SMTP ${i < 0 ? 'greeting' : steps[i][0].split(' ')[0]}: ${line}`));
        if (++i >= steps.length) { sock.end(); return resolve(); }
        sock.write(steps[i][0] + '\r\n');
      }
    });
  });
}

async function resend(payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

module.exports = async function handler(req, res) {
  const wantsJson = String(req.headers.accept || '').includes('application/json');
  const done = (status, body, redirect) => {
    if (wantsJson) return res.status(status).json(body);
    res.setHeader('Location', redirect);
    return res.status(303).end();
  };

  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }

  const d = parseBody(req);
  // Honeypot: real visitors never see this field. Pretend success so bots learn nothing.
  if (d.company_website) return done(200, { ok: true }, '/thank-you/');

  const name = String(d.name || '').trim().slice(0, 120);
  const email = String(d.email || '').trim().slice(0, 254);
  const message = String(d.message || '').trim().slice(0, 5000);
  const page = String(d.page || '/contact/').slice(0, 200);
  const errors = {};
  if (!name) errors.name = 'Please add your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (message.length < 3) errors.message = 'Please add a short message.';
  if (Object.keys(errors).length) return done(400, { ok: false, errors }, '/contact/?error=1#form');

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return done(429, { ok: false, error: 'Too many messages. Please try again in a few minutes.' }, '/contact/?error=1#form');

  const useSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const send = useSmtp ? smtp : resend;
  if (!useSmtp && !process.env.RESEND_API_KEY) {
    console.error('Neither SMTP_USER/SMTP_PASS nor RESEND_API_KEY is set');
    return done(500, { ok: false, error: 'Email is not configured yet.' }, '/contact/?error=1#form');
  }

  const from = process.env.MAIL_FROM || 'Mike Danielson | HealthCar <mike@healthcar.co>';
  const to = (process.env.MAIL_TO || 'mike@healthcar.co,tech@doodigital.co').split(',').map((s) => s.trim()).filter(Boolean);
  const when = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' }) + ' CT';

  try {
    const n = notification({ name, email, message, page, when });
    await send({ from, to, reply_to: email, subject: n.subject, html: n.html, text: n.text });
  } catch (err) {
    console.error(err);
    return done(502, { ok: false, error: 'We could not send your message. Please email mike@healthcar.co or use the booking button.' }, '/contact/?error=1#form');
  }

  if (process.env.SEND_CONFIRMATION !== 'false') {
    try {
      const c = confirmation({ name, message, calendly: process.env.CALENDLY_URL || 'https://calendly.com/mikehealthcar' });
      await send({ from, to: [email], reply_to: to[0], subject: c.subject, html: c.html, text: c.text });
    } catch (err) { console.error('Confirmation email failed', err); } // the main message already went through
  }

  return done(200, { ok: true }, '/thank-you/');
};
