// Writes sample renders of both emails to ./email-previews so you can open them in a browser.
const fs = require('fs'), path = require('path');
const { notification, confirmation } = require('../api/_email.js');
const out = path.join(__dirname, '..', 'email-previews'); fs.mkdirSync(out, { recursive: true });
const sample = { name: 'Jordan Rivera', email: 'jordan@example.com', message: 'Hi Mike,\n\nWe are launching a branded ingredient in the US next spring and could use help with positioning and partners.\n\nCould we find thirty minutes this month?', page: '/contact/', when: 'Oct 26, 2026, 4:10 AM CT' };
fs.writeFileSync(path.join(out, 'notification.html'), notification(sample).html);
fs.writeFileSync(path.join(out, 'confirmation.html'), confirmation({ ...sample, calendly: 'https://calendly.com/' }).html);
console.log('Wrote email-previews/notification.html and confirmation.html');
