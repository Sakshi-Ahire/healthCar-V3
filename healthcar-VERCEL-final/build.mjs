// HealthCar.co static site generator. Run: node build.mjs  (no dependencies)
// All approved copy lives in src/content.mjs. Output goes to ./site
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, QA, QA_OPEN, QUOTES, SERVICES, PARTNERS, CLIENTS } from './src/content.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'site');
const SITE = 'https://healthcar.co';
const BUILD_DATE = '2026-10-01';
const V = Date.now().toString(36);

const CFG = {
  calendly: 'https://calendly.com/mikehealthcar',          
  contactEmail: 'mike@healthcar.co',          // TODO: confirm; used only by the contact form's mailto fallback
  formEndpoint: process.env.FORM_ENDPOINT || '/api/contact',               // Vercel function api/contact.js sends to mike@healthcar.co and tech@doodigital.co
  linkedin: 'https://www.linkedin.com/in/mike-danielson-002126/',
  showPhotos: false,                          // About photo tiles stay hidden until real photos exist; set true and drop images into .photo[data-slot]
  showQuoteNames: true,                       // client approved showing names (permissions with Mike); set false to fall back to role labels
  showClients: false,                         // "Trusted by" logo row hidden for launch until the client list is confirmed
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clientMark = (c) => {
  for (const ext of ['svg', 'png', 'webp']) {
    if (existsSync(join(OUT, 'assets', 'clients', `${c.slug}.${ext}`)))
      return `<img src="/assets/clients/${c.slug}.${ext}" alt="${esc(c.name)}" height="36" loading="lazy">`;
  }
  return `<span>${esc(c.name)}</span>`;
};
const arrow = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const btn = (href, label, cls = '', ext = false) =>
  `<a class="btn ${cls}" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}<span class="arr">${arrow}</span></a>`;

const mark = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor"/><rect x="15" y="15" width="9" height="34" rx="2.5" fill="var(--paper)"/><rect x="40" y="15" width="9" height="34" rx="2.5" fill="var(--paper)"/><polygon points="24,39 40,25 40,33.5 24,47.5" fill="#FF6A13"/></svg>`;
const logo = `<a class="logo" href="/" aria-label="HealthCar by Mike Danielson, home">${mark}<span class="logo-text"><span class="logo-name">HealthCar<i>.co</i></span><span class="logo-by">by Mike Danielson</span></span></a>`;

const NAV = [
  ['/', 'Home'], ['/services/', 'Services'], ['/about/', 'About Mike'],
  ['/the-story/', 'The Story'], ['/contact/', 'Contact'],
];

/* ---------- Schema ---------- */
const ID = { mike: `${SITE}/#mike`, org: `${SITE}/#org`, site: `${SITE}/#website` };
const personNode = {
  '@type': 'Person', '@id': ID.mike, name: 'Mike Danielson',
  url: `${SITE}/about/`, image: { '@type': 'ImageObject', url: `${SITE}/assets/mike-original.jpg`, width: 500, height: 500 },
  jobTitle: 'Strategic Advisor for Strategy and Execution, Nutrition and Health',
  description: 'Mike Danielson has spent 35 years helping nutrition and health companies turn strong science into a clear brand, a practical market strategy, and the partnerships to move forward.',
  worksFor: { '@id': ID.org }, affiliation: { '@id': ID.org },
  homeLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Minneapolis', addressRegion: 'MN', addressCountry: 'US' } },
  knowsAbout: ['Nutrition and health commercialization', 'Branded ingredients', 'Business development', 'Applied AI', 'US market entry for ingredient companies', 'Brand positioning for functional ingredients', 'Brand IP built on technical IP', 'Science-to-brand commercialization'],
  sameAs: [CFG.linkedin], mainEntityOfPage: `${SITE}/about/`,
};
const orgNode = {
  '@type': ['Organization', 'ProfessionalService'], '@id': ID.org, name: 'HealthCar', legalName: 'HealthCar LLC',
  alternateName: ['HealthCar.co', 'Mike Danielson | HealthCar'], url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/assets/icon-512.png`, width: 512, height: 512 },
  image: `${SITE}/assets/og-image.jpg`,
  description: C.define, slogan: 'Serve first, success follows.',
  founder: { '@id': ID.mike }, foundingDate: '2023',
  address: { '@type': 'PostalAddress', addressLocality: 'Minneapolis', addressRegion: 'MN', addressCountry: 'US' },
  areaServed: [{ '@type': 'Country', name: 'United States' }, { '@type': 'Country', name: 'Canada' }],
  knowsAbout: personNode.knowsAbout,
  contactPoint: { '@type': 'ContactPoint', contactType: 'new client inquiries', url: `${SITE}/contact/`, availableLanguage: 'English' },
};
const siteNode = { '@type': 'WebSite', '@id': ID.site, url: `${SITE}/`, name: 'Mike Danielson | HealthCar', alternateName: ['HealthCar.co', 'Mike Danielson'], publisher: { '@id': ID.org }, about: { '@id': ID.mike }, inLanguage: 'en-US' };

function pageSchema(p) {
  const url = `${SITE}${p.path}`;
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }];
  if (p.path !== '/') crumbs.push({ '@type': 'ListItem', position: 2, name: p.crumb, item: url });
  const web = {
    '@type': p.schemaType || 'WebPage', '@id': `${url}#webpage`, url, name: p.title, description: p.desc,
    isPartOf: { '@id': ID.site }, about: { '@id': p.path === '/about/' ? ID.mike : ID.org }, inLanguage: 'en-US',
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/assets/og-image.jpg` },
    datePublished: BUILD_DATE, dateModified: BUILD_DATE, breadcrumb: { '@id': `${url}#crumbs` },
    ...(p.path === '/' ? { speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.define p', 'h1'] } } : {}),
  };
  const nodes = [personNode, orgNode, siteNode, web, { '@type': 'BreadcrumbList', '@id': `${url}#crumbs`, itemListElement: crumbs }];
  if (p.path === '/services/') {
    SERVICES.forEach((s) => nodes.push({
      '@type': 'Service', '@id': `${url}#${s.id}`, name: s.title, serviceType: s.title,
      description: s.schemaDesc, provider: { '@id': ID.org }, areaServed: { '@type': 'Country', name: 'United States' },
      url: `${url}#${s.id}`,
    }));
    nodes.push({
      '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: QA.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}

/* ---------- Layout ---------- */
function layout(p, body) {
  const url = `${SITE}${p.path}`;
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="author" content="Mike Danielson">
<meta name="theme-color" content="#FBFAF6">
<meta property="og:type" content="${p.path === '/about/' ? 'profile' : 'website'}">
<meta property="og:site_name" content="Mike Danielson | HealthCar">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-image.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Mike Danielson, strategic advisor in nutrition and health, founder of HealthCar">
<meta property="og:locale" content="en_US">
${p.path === '/about/' ? '<meta property="profile:first_name" content="Mike"><meta property="profile:last_name" content="Danielson">' : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${SITE}/assets/og-image.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/Anton-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/Inter-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v=${V}">
<script type="application/ld+json">${pageSchema(p)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap nav-row">
    ${logo}
    <button class="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="Menu"><span></span></button>
    <nav class="nav" id="nav" aria-label="Primary">
      ${NAV.map(([h, l]) => `<a href="${h}"${h === p.path ? ' aria-current="page"' : ''}>${l}</a>`).join('\n      ')}
      <a class="btn btn-sm" href="/contact/" style="padding:0 22px">Book a conversation</a>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>${logo}<p>${esc(C.define)}</p></div>
      <div><h4>Explore</h4><ul>${NAV.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>
      <div><h4>Connect</h4><ul>
        <li><a href="mailto:mike@healthcar.co">mike@healthcar.co</a></li>
        <li><a href="${CFG.linkedin}" target="_blank" rel="noopener">Mike on LinkedIn</a></li>
      </ul></div>
    </div>
    <div class="legal"><span>&copy; 2026 HealthCar LLC. Minneapolis, Minnesota.</span><span>Mike Danielson | HealthCar</span></div>
  </div>
</footer>
<script src="/assets/main.js?v=${V}" defer></script>
</body>
</html>
`;
}

const cta = (h2, p, label = 'Book a conversation') => `
<section class="cta sec bg-ink"><div class="wrap">
  <h2 class="t-h2 rv">${h2}</h2>
  <p class="rv">${p}</p>
  <div class="rv">${btn('/contact/', label, 'btn--amber')}</div>
</div></section>`;

const portrait = (cls = '', tag = true) => `
<div class="hero-portrait hero-portrait--photo ${cls}">
  <picture>
    <source srcset="/assets/mike-photo.webp" type="image/webp">
    <img src="/assets/mike-photo.jpg" width="960" height="1440" alt="Mike Danielson, strategic advisor in nutrition and health, founder of HealthCar" fetchpriority="high" decoding="async">
  </picture>
  
  ${tag ? `<div class="name-tag"><b aria-hidden="true">M</b><div><span>Mike Danielson</span><small>Founder, HealthCar</small></div></div>` : ''}
</div>`;

const garden = (cls = '') => `
<figure class="garden ${cls}">
  <div class="garden-grid">
    <picture class="g-beds"><source srcset="/assets/garden-beds.webp" type="image/webp"><img src="/assets/garden-beds.jpg" width="1500" height="1000" loading="lazy" decoding="async" alt="Cosmos and zinnias in bloom in Mike's garden"></picture>
    <picture class="g-tall"><source srcset="/assets/garden-tall.webp" type="image/webp"><img src="/assets/garden-tall.jpg" width="900" height="1350" loading="lazy" decoding="async" alt="Tall flowers and zinnias in Mike's garden"></picture>
    <picture class="g-fly"><source srcset="/assets/garden-butterfly.webp" type="image/webp"><img src="/assets/garden-butterfly.jpg" width="1500" height="1000" loading="lazy" decoding="async" alt="A butterfly resting on a zinnia in Mike's garden"></picture>
  </div>
  <figcaption>From Mike&rsquo;s own garden.</figcaption>
</figure>`;

/* ---------- Pages ---------- */
const pages = [];

// HOME
const miniStat = (n, l) => `<div class="stat"><div class="num">${n}</div><p>${l}</p></div>`;
pages.push({
  path: '/', crumb: 'Home', file: 'index.html',
  title: 'Mike Danielson | HealthCar | Nutrition and Health Strategy',
  desc: 'Mike Danielson helps nutrition and health companies turn strong science into a clear brand, a practical market strategy, and the partnerships to move forward.',
  body: `
<section class="hero bg-paper"><div class="wrap hero-grid">
  <div class="hero-copy">
    <div class="hc-head"><p class="eyebrow">Mike Danielson &middot; HealthCar</p>
    <h1 class="t-h1">${esc(C.hero.h1)}</h1></div>
    <div class="hc-rest"><p class="lede"><strong>I&rsquo;m Mike Danielson.</strong> ${esc(C.hero.sub)}</p>
    <div class="hero-actions">${btn('/contact/', C.hero.btn)}<a class="text-link" href="/services/">See how it works ${arrow}</a></div>
    </div>
  </div>
  ${portrait()}
</div></section>

<section class="trust bg-paper" aria-label="Who this is for"><div class="wrap">
  ${CFG.showClients ? `<div class="clients-wrap">
    <p class="clients-label">Trusted by teams at</p>
    <ul class="clients-row">${CLIENTS.map((c) => `<li class="cl cl-${c.style}">${clientMark(c)}</li>`).join('')}</ul>
  </div>` : ''}
  <div class="define${CFG.showClients ? '' : ' define--solo'}">
    <p class="tiny">In one sentence</p>
    <p class="pull">${esc(C.define)}</p>
  </div>
</div></section>

<section class="sec bg-paper"><div class="wrap">
  <div class="sec-head"><p class="eyebrow">The work</p>
  <h2 class="t-h2 rv">What clients actually buy</h2></div>
  <div class="pillars">
    ${C.pillars.map((x, i) => `<article class="pillar rv" style="--d:${i * 0.1}s"><span class="n">0${i + 1}</span><h3>${esc(x.t)}</h3><p>${esc(x.p)}</p></article>`).join('\n    ')}
  </div>
</div></section>

<section class="proof sec--compact bg-cedar" aria-labelledby="proof-h"><div class="wrap proof-grid">
  <div class="proof-lead">
    <p class="eyebrow">Proof</p>
    <h2 id="proof-h" class="pull rv">${esc(C.proofH)}</h2>
  </div>
  <div class="proof-stats">
    <div class="rv"><div class="num">35</div><p class="lbl">Years in nutrition and health.</p></div>
    <div class="rv" style="--d:.08s"><div class="num">Hundreds</div><p class="lbl">Of product launches.</p></div>
    <div class="rv" style="--d:.16s"><div class="num">Dozens</div><p class="lbl">Of branded ingredients.</p></div>
    <div class="rv" style="--d:.24s"><div class="num">Decades</div><p class="lbl">Client relationships measured in decades, several past 25 years.</p></div>
  </div>
</div></section>

<section class="quotes sec bg-sand" aria-labelledby="q-h"><div class="wrap q-grid">
  <div class="q-wrap">
    <h2 id="q-h" class="eyebrow">What they say</h2>
    <div class="q-stage">
      ${QUOTES.map((q, i) => `<figure class="q-item${i === 0 ? ' on' : ''}"><blockquote>${esc(q.text)}</blockquote><figcaption>${CFG.showQuoteNames && q.name ? `<strong>${esc(q.name)}</strong>${q.title ? ` <span>${esc(q.title)}</span>` : ''}` : esc(q.role)}</figcaption></figure>`).join('\n      ')}
    </div>
    <div class="q-ctrl">
      <button class="q-arrow q-arrow--prev" type="button" aria-label="Previous quote">${arrow}</button>
      <button class="q-arrow q-arrow--next" type="button" aria-label="Next quote">${arrow}</button>
      <div class="q-dots" role="tablist" aria-label="Choose a quote">
        ${QUOTES.map((q, i) => `<button class="q-dot" role="tab" aria-selected="${i === 0}" aria-label="Quote ${i + 1}"><i></i></button>`).join('')}
      </div>
    </div>
  </div>
  <aside class="q-stat rv"><div class="num">21<small>of 25</small></div><p>${esc(C.quoteCaption)}</p></aside>
</div></section>

<section class="sec bg-paper"><div class="wrap">
  <div class="sec-head sec-head--split">
    <div><p class="eyebrow">Services</p><h2 class="t-h2 rv">Four ways to work together</h2></div>
    <p class="lede rv">${esc(C.servicesTeaser)}</p>
  </div>
  <ul class="svc-list">
    ${SERVICES.map((s, i) => `<li><a href="/services/#${s.id}"><span class="n">0${i + 1}</span><span><h3>${esc(s.title)}</h3><small>${esc(s.cardLine || s.forLine)}</small></span><span class="go">${arrow}</span></a></li>`).join('\n    ')}
  </ul>
  <div class="after-list">${btn('/services/', 'See how it works', 'btn--ghost')}</div>
</div></section>

${cta(`${esc(C.cta.h)}`, esc(C.cta.p), C.hero.btn)}
`,
});

// SERVICES
const svcBlock = (s, i) => `
<section class="svc-sec ${i % 2 === 0 ? 'bg-sand' : 'bg-paper'}" id="${s.id}"><div class="wrap svc">
  <div class="svc-head"><p class="n">0${i + 1}</p><h2 class="t-svc">${esc(s.title)}</h2>
    <p class="for">${esc(s.forLine)}</p>
    ${s.chips ? `<ul class="chips" aria-label="Focus areas">${s.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
  </div>
  <div class="svc-body rv">
    ${s.paras.map((t) => `<p>${esc(t)}</p>`).join('\n    ')}
    ${s.aside ? `<p class="aside">${s.asideLink ? esc(s.aside).replace(esc(s.asideLink.text), `<a href="${s.asideLink.href}">${esc(s.asideLink.text)}</a>`) : esc(s.aside)}</p>` : ''}
  </div>
</div></section>`;
pages.push({
  path: '/services/', crumb: 'Services', file: 'services/index.html',
  title: 'Strategic Advisory, Representation, Partnerships & AI | Mike Danielson | HealthCar',
  desc: 'Strategic advisory, client representation, partnership and business development, and applied AI for supplement ingredient companies and health brands, led by Mike Danielson.',
  body: `
<section class="page-hero bg-paper"><div class="wrap">
  <p class="eyebrow">Services</p>
  <h1 class="t-h1">${esc(C.services.h1)}</h1>
  <p class="lede">${esc(C.services.intro)}</p>
</div></section>
<nav class="subnav" aria-label="Services on this page"><ul>${SERVICES.map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('')}</ul></nav>
${SERVICES.map(svcBlock).join('')}
${cta('Not sure which fits?', 'That is what the first conversation is for. Book it.')}
<section class="qa sec bg-sand" id="questions" aria-labelledby="qa-h"><div class="wrap">
  <div class="sec-head"><p class="eyebrow">Straight answers</p>
  <h2 id="qa-h" class="t-h2">Questions We Answer</h2></div>
  <div class="qa-grid">
    ${QA.slice(0, QA_OPEN).map((x) => `<div class="qa-item"><h3>${esc(x.q)}</h3><p>${esc(x.a)}</p></div>`).join('\n    ')}
    <p class="more">More questions</p>
    ${QA.slice(QA_OPEN).map((x) => `<details><summary><h3>${esc(x.q)}</h3></summary><p>${esc(x.a)}</p></details>`).join('\n    ')}
  </div>
</div></section>
`,
});

// ABOUT
const whyPull = 'Happiness is enjoyment plus satisfaction plus meaning, in that order.'; // verbatim from the "Why I do this" copy
pages.push({
  path: '/about/', crumb: 'About Mike', file: 'about/index.html', schemaType: 'AboutPage',
  title: 'About Mike Danielson | HealthCar',
  desc: 'Mike Danielson: strategic advisor for strategy and execution in nutrition and health for 35 years. Connector, builder of branded ingredients, founder of HealthCar.',
  body: `
<section class="page-hero bg-paper"><div class="wrap about-hero">
  <div>
    <p class="eyebrow">About Mike</p>
    <h1 class="t-h1">Mike Danielson</h1>
    <p class="lede">${esc(C.about.strap)}</p>
    <div class="hero-actions">${btn('/contact/', 'Book a conversation')}<a class="text-link" href="/the-story/">Read the story ${arrow}</a></div>
  </div>
  ${portrait('', false)}
</div></section>

<section class="sec--compact bg-paper"><div class="wrap">
  <p class="eyebrow">In my own words</p>
  <p class="open-q rv">${esc(C.about.opening)}</p>
</div></section>

<section class="sec bg-sand"><div class="wrap two">
  <div class="stick"><h2 class="t-h2">What 21 people wrote</h2>
  <ul class="words" aria-label="Repeated words">${C.words.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
  <div class="prose rv">${C.about.body.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
</div></section>

<section class="sec bg-cedar"><div class="wrap two">
  <div class="stick">
    <p class="eyebrow">The name</p>
    <h2 class="t-h2">Why the name HealthCar</h2>
  </div>
  <div>
    <div class="prose rv">${C.about.name.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
    <div class="callout callout--text rv"><div class="big">${esc(C.about.nameTile.h)}</div><p>${esc(C.about.nameTile.p)}</p></div>
  </div>
</div></section>

<section class="sec bg-paper"><div class="wrap">
  <div class="row-split">
    <div><p class="eyebrow">Before HealthCar</p><h2 class="t-h2">The agency era</h2></div>
    <div class="prose rv">${C.about.agency.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
  </div>
  <div class="row-split">
    <div><p class="eyebrow">Helping first</p><h2 class="t-h2">Away from the desk</h2></div>
    <div class="prose rv">${C.about.close.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
  </div>
  ${garden('garden--about')}
  ${CFG.showPhotos ? `<div class="photos" aria-label="Photography">
  ${['Alaska', 'Japan', 'The garage', 'The garden'].map((l) => `<div class="photo" data-slot="${l.toLowerCase().replace(/ /g, '-')}"><span class="cap"><span>${l}</span></span></div>`).join('')}
  </div>` : ''}
</div></section>

<section class="sec bg-sand"><div class="wrap two">
  <div class="stick"><p class="eyebrow">Purpose</p><h2 class="t-h2">Why I do this</h2>
    <blockquote class="pull" aria-hidden="true">${esc(whyPull)}</blockquote></div>
  <div class="prose rv">${C.about.why.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
</div></section>
${cta('Start with a conversation.', 'Thirty minutes, no agenda beyond understanding where you are and where you want to be.', 'Book a conversation')}
`,
});

// STORY
const storyBodyPath = join(ROOT, 'src', 'story-body.html');
const storyBody = existsSync(storyBodyPath) ? readFileSync(storyBodyPath, 'utf8') : '';
const storyPull = 'This website grew out of those examples.'; // verbatim from the "What came back" paragraph
const surveyRows = [
  ['25', 'Clients, partners, and colleagues of 20-plus years were asked.'],
  ['21', 'Responded.'],
  ['3', 'Questions, ten minutes per person.'],
];
pages.push({
  path: '/the-story/', crumb: 'The Story', file: 'the-story/index.html',
  title: 'The Story Behind HealthCar | Mike Danielson',
  desc: 'Mike Danielson asked clients and colleagues for specific examples of him at his best. What came back shaped how he explains his work, and this website.',
  body: `
<section class="page-hero bg-paper"><div class="wrap story-hero">
  <div><p class="eyebrow">The Story</p>
  <h1 class="t-serif-h1">${esc(C.story.h1)}</h1>
  <p class="lede story-lede">${esc(C.story.opening)}</p></div>
  <aside class="survey rv" aria-label="The survey at a glance">
    ${surveyRows.map(([n, t]) => `<div><span class="num">${n}</span><p>${esc(t)}</p></div>`).join('\n    ')}
  </aside>
</div></section>
<section class="sec--compact bg-paper story-qs" aria-labelledby="qs-h"><div class="wrap">
  <div class="sec-head sec-head--split"><div><p class="eyebrow">The exercise</p>
  <h2 id="qs-h" class="t-h2 rv">Three questions</h2></div>
  <p class="lede rv">Everyone answered the same three questions. Each took about ten minutes.</p></div>
  <div class="pillars">
    ${C.story.questions.map((q, i) => `<article class="pillar rv" style="--d:${i * 0.1}s"><span class="n">0${i + 1}</span><h3>${esc(q)}</h3></article>`).join('\n    ')}
  </div>
</div></section>
<section class="sec bg-sand"><div class="wrap two">
  <div class="stick">
    <blockquote class="pull" aria-hidden="true" style="margin-top:0">${esc(storyPull)}</blockquote>
    <div class="story-words"><p class="eyebrow">Their repeated words</p>
    <ul class="words" aria-label="Repeated words">${C.words.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
  </div>
  <div>
    ${storyBody ? `<div class="prose story-body rv">${storyBody}</div>` : ''}
    <p class="eyebrow">What came back</p>
    <p class="story-close rv">${esc(C.story.cameBack)}</p>
    <p class="eyebrow" style="margin-top:var(--s-12)">Try it yourself</p>
    <p class="story-close rv">${esc(C.story.offer)}</p>
  </div>
</div></section>
${cta('Start with a conversation.', 'I will happily show you how the exercise works. It might be the highest-return marketing research you ever run.')}
`,
});

// CONTACT
// The v3 paragraph is shown sentence by sentence (same words, same order) so it can be scanned.
const contactParts = C.contact.body.split(/(?<=\.)\s+/);
const splitContact = contactParts.length === 5;
pages.push({
  path: '/contact/', crumb: 'Contact', file: 'contact/index.html', schemaType: 'ContactPage',
  title: 'Contact: Book Time with Mike Danielson | HealthCar',
  desc: 'Start with a conversation. Thirty minutes with Mike Danielson, no agenda beyond understanding where you are and where you want to be.',
  body: `
<section class="page-hero bg-paper"><div class="wrap contact-grid">
  <div>
    <p class="eyebrow">Contact</p>
    <h1 class="t-h1">${esc(C.contact.h1)}</h1>
    <p class="lede">${esc(splitContact ? contactParts[0] : C.contact.body)}</p>
    ${btn(CFG.calendly, C.contact.btn, 'btn--lg', true)}
  </div>
  ${splitContact ? `<div class="expect">${contactParts.slice(1, 4).map((t) => `<p class="rv">${esc(t)}</p>`).join('')}</div>` : ''}
</div></section>
<section class="sec bg-sand" id="form"><div class="wrap form-wrap">
  ${splitContact ? `<p class="pull">${esc(contactParts[4])}</p>` : ''}
  <form class="form" id="contact-form" method="post" action="${esc(CFG.formEndpoint)}" data-endpoint="${esc(CFG.formEndpoint)}" data-email="${esc(CFG.contactEmail)}" novalidate>
    <h2>Prefer email?</h2>
    <p class="note">Three fields. I read every message.</p>
    <div class="hp" aria-hidden="true"><label for="f-hp">Leave this field empty</label><input id="f-hp" name="company_website" tabindex="-1" autocomplete="off"></div>
    <input type="hidden" name="page" value="/contact/">
    <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required aria-describedby="e-name"><p class="err" id="e-name"></p></div>
    <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="e-email"><p class="err" id="e-email"></p></div>
    <div class="field"><label for="f-msg">Message</label><textarea id="f-msg" name="message" required aria-describedby="e-message"></textarea><p class="err" id="e-message"></p></div>
    <button class="btn" type="submit">Send message<span class="arr">${arrow}</span></button>
    <p class="status" role="status" aria-live="polite"></p>
  </form>
</div></section>
`,
});

// THANK YOU (after the contact form is sent; not in nav or sitemap)
pages.push({
  path: '/thank-you/', crumb: 'Thank you', file: 'thank-you/index.html', noindex: true,
  title: 'Thank you | Mike Danielson | HealthCar',
  desc: 'Your message reached Mike Danielson. He will reply personally.',
  body: `
<section class="thanks bg-paper"><div class="wrap thanks-grid">
  <div class="thanks-main">
    <svg class="tick" viewBox="0 0 96 96" width="96" height="96" aria-hidden="true"><circle class="tick-ring" cx="48" cy="48" r="44" fill="none" stroke="currentColor" stroke-width="5"/><path class="tick-check" d="M28 50l14 14 27-31" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h1 class="t-h1">Thank you.</h1>
    <p class="lede">Your message reached me. I will reply personally.</p>
    <div class="hero-actions">
      ${btn(CFG.calendly, 'Book a conversation', 'btn--amber btn--lg', true)}
      <a class="text-link" href="/">Back to home</a>
    </div>
    <div class="signoff"><picture><source srcset="/assets/mike-photo.webp" type="image/webp"><img src="/assets/mike-photo.jpg" width="96" height="96" alt="Mike Danielson" loading="lazy" decoding="async"></picture><p><strong>Mike Danielson</strong><span>Serve first, success follows.</span></p></div>
  </div>
  <div class="thanks-side">
  <picture class="thanks-photo"><source srcset="/assets/garden-butterfly.webp" type="image/webp"><img src="/assets/garden-butterfly.jpg" width="1500" height="1000" alt="A butterfly resting on a zinnia in Mike's garden" decoding="async"></picture>
  <ol class="next" aria-label="What happens next">
    <li><span class="num" aria-hidden="true">1</span><div><h2>Confirmation sent</h2><p>A copy of your message is on its way to your inbox.</p></div></li>
    <li><span class="num" aria-hidden="true">2</span><div><h2>I reply personally</h2><p>You will hear from me directly, not from a team or a template.</p></div></li>
    <li><span class="num" aria-hidden="true">3</span><div><h2>Prefer to talk sooner?</h2><p>Book thirty minutes, no agenda beyond understanding where you are and where you want to be.</p></div></li>
  </ol>
  </div>
</div></section>
`,
});

/* ---------- Write ---------- */
for (const p of pages) {
  const f = join(OUT, p.file);
  mkdirSync(dirname(f), { recursive: true });
  const html = layout(p, p.body);
  writeFileSync(f, p.noindex ? html.replace('<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">', '<meta name="robots" content="noindex">') : html);
}

writeFileSync(join(OUT, '404.html'), layout(
  { path: '/404.html', crumb: 'Not found', title: 'Page not found | Mike Danielson | HealthCar', desc: 'This page could not be found.' },
  `<section class="page-hero bg-paper"><div class="wrap"><p class="eyebrow">404</p><h1 class="t-h1">That page took a wrong turn.</h1><p class="lede" style="margin:var(--s-6) 0 var(--s-8)">Let&rsquo;s get you back on the road.</p>${btn('/', 'Back to home')}</div></section>`
).replace('<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">', '<meta name="robots" content="noindex">'));

writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${BUILD_DATE}</lastmod><priority>${p.path === '/' ? '1.0' : p.path === '/about/' ? '0.9' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);

const bots = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'Googlebot'];
writeFileSync(join(OUT, 'robots.txt'), `# Search and AI assistants are welcome. This site is meant to be found, quoted, and attributed.
User-agent: *
Allow: /

${bots.map((b) => `User-agent: ${b}\nAllow: /\n`).join('\n')}
Sitemap: ${SITE}/sitemap.xml
`);

writeFileSync(join(OUT, 'llms.txt'), `# Mike Danielson | HealthCar

> ${C.define}

Mike Danielson is a strategic advisor with 35 years in nutrition and health: hundreds of product launches, dozens of branded ingredients across retail, e-commerce, and healthcare practitioner channels, and client relationships measured in decades. He is the founder of HealthCar LLC (Minneapolis, Minnesota) and advises ingredient innovators and health brands on building their businesses in the US market. Mike Danielson is the primary entity; HealthCar is the practice he founded.

## Pages
- [Home](${SITE}/): Who Mike Danielson is, what HealthCar does, proof, and how to start.
- [Services](${SITE}/services/): Strategic advisory, client representation, partnership and business development, AI applied. Includes ${QA.length} questions answered.
- [About Mike](${SITE}/about/): Background, operating philosophy (the order matters, serve first), and why the name HealthCar.
- [The Story](${SITE}/the-story/): Why Mike asked clients and colleagues for examples of him at his best, and what came back.
- [Contact](${SITE}/contact/): Book a 30-minute conversation.

## Key facts
- Founder: Mike Danielson. Practice: HealthCar LLC. Location: Minneapolis, Minnesota, USA.
- Services: Strategic Advisory for Strategy & Execution; Client Representation; Partnership & Business Development; AI, Applied.
- Philosophy: Serve first, success follows. The order matters: understand the science, give customers a clear reason to care, build the brand and choose the channels before spending heavily on promotion.
- LinkedIn: ${CFG.linkedin}
`);

writeFileSync(join(OUT, 'site.webmanifest'), JSON.stringify({ name: 'Mike Danielson | HealthCar', short_name: 'HealthCar', start_url: '/', display: 'standalone', background_color: '#FBFAF6', theme_color: '#FBFAF6', icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2));

writeFileSync(join(OUT, '.htaccess'), `# Apache (Hostinger/GoDaddy cPanel). Clean URLs, compression, caching, security headers.
Options -Indexes
ErrorDocument 404 /404.html
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
# Partners page removed Oct 2026: send old links home
RewriteRule ^partners(/.*)?$ / [R=301,L]
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/webp "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType font/woff2 "access plus 1 year"
ExpiresByType text/css "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
</IfModule>
<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`);
console.log(`Built ${pages.length} pages + 404, sitemap, robots, llms.txt`);
