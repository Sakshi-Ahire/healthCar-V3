// Renders the shared email layouts (api/_email.js) into api/_templates.json with placeholder tokens,
// so the PHP handler for Hostinger uses exactly the same layouts as the Vercel version.
const fs = require('fs'), path = require('path');
const { notification, confirmation } = require('../api/_email.js');
const T = { name: 'XXFIRSTXX XXLASTXX', email: 'XXEMAILXX', message: 'XXMESSAGEXX', page: 'XXPAGEXX', when: 'XXWHENXX', calendly: 'XXCALENDLYXX' };
const out = { notification: notification(T), confirmation: confirmation(T) };
const dir = path.join(__dirname, '..', 'php');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, '_templates.json'), JSON.stringify(out));
console.log('Wrote php/_templates.json');
