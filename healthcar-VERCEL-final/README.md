# HealthCar.co — Mike Danielson | HealthCar

Static, dependency-free site. `node build.mjs` regenerates `site/` from `src/content.mjs` (all approved copy).
Deploy: upload the contents of `site/` to any static host (Hostinger/GoDaddy/Netlify/Vercel). Preview: the `healthcar` entry in `.claude/launch.json` (port 8590).

## Before launch (set in build.mjs `CFG`)
- `calendly` — Mike's Calendly URL (Contact page button)
- `contactEmail` / `formEndpoint` — contact form target (mailto fallback if no endpoint)
- `showQuoteNames` — flip to true as each quote permission arrives (names/titles are already in content.mjs)
- Optional `src/story-body.html` — the approved "What Inspired This" one-pager (The Story page body)
- Replace `site/assets/mike-hero.*` with the new headshot when ready; register mikedanielson.com and 301 to healthcar.co
- About photo tiles are hidden until real photos exist: set `showPhotos: true` in `build.mjs` `CFG`, then drop images into `.photo[data-slot]`

## Contact form (Option B)
The form posts to `api/contact.js` (Vercel serverless function), which emails every message to **mike@healthcar.co** and **tech@doodigital.co** and sends the visitor a confirmation. On success the visitor lands on `/thank-you/` (noindex, not in the sitemap).

Setup, once (Vercel, Project, Settings, Environment Variables, then redeploy). See `.env.example`.
- Gmail, recommended, no DNS changes: `SMTP_USER=tech@doodigital.co`, `SMTP_PASS=<16-character Google App password>`, `MAIL_FROM=Mike Danielson | HealthCar <mike@healthcar.co>`, `MAIL_TO=mike@healthcar.co,tech@doodigital.co`. This is the same setup as the Hostinger contact.php.
- Or Resend: leave SMTP_* empty and set `RESEND_API_KEY` (needs healthcar.co verified in Resend with SPF and DKIM records).
Then send a test message from /contact/ on desktop and phone.

Email layouts live in `api/_email.js`. Run `node scripts/preview-emails.js` to render samples into `email-previews/`.
