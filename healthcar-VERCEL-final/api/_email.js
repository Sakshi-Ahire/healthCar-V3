// Email layouts for the contact form. Table-based, inline CSS, 600px, safe for Gmail, Outlook and Apple Mail.
// Fonts: Impact/Arial Narrow stand in for Anton, Georgia italic for Instrument Serif (web fonts are unreliable in email).
const C = { paper: '#FBFAF6', ink: '#0D0D0C', cedar: '#12382C', sand: '#EFE8D9', amber: '#FF6A13', line: '#D9D3C4', mute: '#5A5A50' };
const DISPLAY = "Anton,Impact,'Arial Narrow',Arial,sans-serif";
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";
const BODY = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nl2br = (s) => esc(s).replace(/\r?\n/g, '<br>');

const button = (href, label, bg = C.ink, fg = C.paper) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:${bg}"><a href="${esc(href)}" style="display:inline-block;padding:16px 28px;font:600 16px/1 ${BODY};color:${fg};text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;

function shell({ preheader, header, body, footer }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(header)}</title></head>
<body style="margin:0;padding:0;background:${C.sand};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.sand}">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.sand}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${C.paper};border-radius:20px;overflow:hidden">
    <tr><td style="background:${C.cedar};padding:28px 32px">
      <div style="font:400 26px/1 ${DISPLAY};letter-spacing:.02em;color:${C.paper};text-transform:uppercase">HealthCar<span style="color:${C.amber}">.co</span></div>
      <div style="font:italic 400 15px/1.3 ${SERIF};color:#CFE0D7;margin-top:4px">by Mike Danielson</div>
    </td></tr>
    <tr><td style="height:4px;background:${C.amber};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:36px 32px 8px">
      <h1 style="margin:0;font:400 34px/1.05 ${DISPLAY};text-transform:uppercase;color:${C.ink}">${esc(header)}</h1>
    </td></tr>
    <tr><td style="padding:16px 32px 36px;font:400 16px/1.6 ${BODY};color:${C.ink}">${body}</td></tr>
    <tr><td style="padding:20px 32px;background:${C.sand};font:400 13px/1.5 ${BODY};color:${C.mute}">${footer}</td></tr>
  </table>
</td></tr></table></body></html>`;
}

const row = (label, valueHtml) =>
  `<tr><td style="padding:12px 0;border-top:1px solid ${C.line};width:96px;vertical-align:top;font:600 13px/1.5 ${BODY};color:${C.mute}">${esc(label)}</td><td style="padding:12px 0;border-top:1px solid ${C.line};font:400 16px/1.5 ${BODY};color:${C.ink}">${valueHtml}</td></tr>`;

/** Sent to Mike and the tech team. Reply-To is the visitor, so hitting Reply answers them directly. */
function notification({ name, email, message, page, when }) {
  const subject = `New conversation request from ${String(name).replace(/[\r\n]+/g, ' ')}`;
  const body = `
    <p style="margin:0 0 20px;color:${C.mute}">Someone used the contact form on healthcar.co. Reply to this email to answer them directly.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      ${row('Name', `<strong>${esc(name)}</strong>`)}
      ${row('Email', `<a href="mailto:${esc(email)}" style="color:${C.cedar};font-weight:600">${esc(email)}</a>`)}
      ${row('Sent', esc(when))}
      ${row('Page', esc(page || '/contact/'))}
    </table>
    <div style="font:600 13px/1.5 ${BODY};color:${C.mute};margin-bottom:8px">Message</div>
    <div style="background:${C.sand};border-left:4px solid ${C.amber};border-radius:12px;padding:20px 22px;font:italic 400 19px/1.5 ${SERIF};color:${C.ink}">${nl2br(message)}</div>
    <div style="margin-top:28px">${button('mailto:' + email + '?subject=' + encodeURIComponent('Re: your message to HealthCar'), 'Reply to ' + String(name).split(' ')[0])}</div>`;
  const html = shell({
    preheader: `${name}: ${String(message).replace(/\s+/g, ' ').slice(0, 90)}`,
    header: 'New conversation request',
    body,
    footer: 'Sent automatically from the HealthCar website contact form.',
  });
  const text = `New conversation request\n\nName: ${name}\nEmail: ${email}\nSent: ${when}\nPage: ${page || '/contact/'}\n\nMessage:\n${message}\n\nReply to this email to answer ${name} directly.`;
  return { subject, html, text };
}

/** Automatic confirmation to the visitor. Short, personal, with a booking option. */
function confirmation({ name, message, calendly }) {
  const first = String(name).trim().split(/\s+/)[0] || 'there';
  const body = `
    <p style="margin:0 0 16px;font:italic 400 24px/1.3 ${SERIF}">Thank you, ${esc(first)}. I will reply personally.</p>
    <p style="margin:0 0 24px;color:${C.mute}">Your message reached me. If it is easier to talk, you can also book thirty minutes straight away, no agenda beyond understanding where you are and where you want to be.</p>
    <div style="margin-bottom:32px">${button(calendly, 'Book a conversation', C.amber, C.ink)}</div>
    <div style="font:600 13px/1.5 ${BODY};color:${C.mute};margin-bottom:8px">A copy of what you sent</div>
    <div style="background:${C.sand};border-radius:12px;padding:18px 20px;font:400 15px/1.55 ${BODY};color:${C.ink}">${nl2br(message)}</div>
    <p style="margin:28px 0 0;font:400 16px/1.5 ${BODY}">Serve first, success follows.<br><strong>Mike Danielson</strong></p>`;
  const html = shell({
    preheader: 'Your message reached Mike. He will reply personally.',
    header: 'Message received',
    body,
    footer: 'You are getting this one-time email because you used the contact form on healthcar.co. Replying to it reaches Mike.',
  });
  const text = `Thank you, ${first}. I will reply personally.\n\nIf it is easier to talk, book thirty minutes here: ${calendly}\n\nA copy of what you sent:\n${message}\n\nServe first, success follows.\nMike Danielson`;
  return { subject: 'Thanks for getting in touch | HealthCar', html, text };
}

module.exports = { notification, confirmation, esc };
