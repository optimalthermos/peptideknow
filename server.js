const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Redirect non-www to www
app.use((req, res, next) => {
  const host = req.hostname || req.headers.host;
  if (host === 'peptideknow.com') {
    return res.redirect(301, `https://www.peptideknow.com${req.originalUrl}`);
  }
  next();
});

// Load peptide data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'peptides.json'), 'utf8'));
const peptides = data.peptides;
const categories = data.categories;

// Load blog data
const blogData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'blog-posts.json'), 'utf8'));
const blogPosts = blogData.posts;
const blogPostBySlug = {};
blogPosts.forEach(p => { blogPostBySlug[p.slug] = p; });

// Load blog article bodies
const blogBodies = {};
blogPosts.forEach(p => {
  // Priority: 1) explicit bodyFile field, 2) slug-based naming conventions
  const possiblePaths = [];
  if (p.bodyFile) {
    possiblePaths.push(path.join(__dirname, 'data', p.bodyFile));
  }
  possiblePaths.push(
    path.join(__dirname, 'data', `blog-${p.slug}-body.html`),
    path.join(__dirname, 'data', `blog-${p.slug.split('-').slice(0, 3).join('-')}-body.html`)
  );
  for (const bp of possiblePaths) {
    if (fs.existsSync(bp)) {
      blogBodies[p.slug] = fs.readFileSync(bp, 'utf8');
      break;
    }
  }
});

// Build lookup maps
const peptideBySlug = {};
peptides.forEach(p => { peptideBySlug[p.slug] = p; });

const categoryById = {};
categories.forEach(c => { categoryById[c.id] = c; });

// Build category → peptides map
const categoryPeptides = {};
categories.forEach(c => { categoryPeptides[c.id] = []; });
peptides.forEach(p => {
  (p.categories || []).forEach(catId => {
    if (categoryPeptides[catId]) categoryPeptides[catId].push(p);
  });
});

// Static files
app.use('/static', express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0',
  immutable: process.env.NODE_ENV === 'production'
}));

// Template engine
const templates = {};
function loadTemplate(name) {
  if (!templates[name]) {
    templates[name] = fs.readFileSync(path.join(__dirname, 'templates', name + '.html'), 'utf8');
  }
  return templates[name];
}

// === GLOBAL: News bell tooltip (shared across all pages) ===
const newsBellCount = blogPosts.length;
const latestPost = [...blogPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished))[0];
const newsBellTooltip = latestPost ? (() => {
  const d = new Date(latestPost.datePublished + 'T12:00:00Z');
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const dayLabel = isToday ? "Today's News" : d.toLocaleDateString('en-US', { weekday: 'long' }) + "'s News";
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `<a href="/blog/${latestPost.slug}" class="nbt-card">
    <div class="nbt-img"><img src="${latestPost.image}" alt="" width="80" height="56" loading="lazy"></div>
    <div class="nbt-body">
      <span class="nbt-label">${dayLabel}</span>
      <span class="nbt-title">${latestPost.title}</span>
      <span class="nbt-date">${dateStr}</span>
    </div>
  </a>`;
})() : '';

// === GLOBAL: News mega-menu (shared across all pages) ===
const sortedBlogPosts = [...blogPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
const newsMenuHTML = sortedBlogPosts.map(p => {
  const d = new Date(p.datePublished + 'T12:00:00Z');
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const excerpt = (p.excerpt || '').length > 100 ? p.excerpt.substring(0, 100) + '...' : (p.excerpt || '');
  return `<a href="/blog/${p.slug}" class="news-menu-card">
    <div class="news-menu-img"><img src="${p.image}" alt="" width="200" height="120" loading="lazy"></div>
    <div class="news-menu-body">
      <span class="news-menu-cat">${p.category || ''}</span>
      <span class="news-menu-title">${p.title}</span>
      <span class="news-menu-excerpt">${excerpt}</span>
      <span class="news-menu-meta">${dateStr} · ${p.readTime || ''}</span>
    </div>
  </a>`;
}).join('');

// === GLOBAL: Peptides mega-menu (shared across all pages) ===
const megaMenuIconMap = {
  'healing-recovery': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  'cognitive-nootropic': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.2 6H8.2C6.3 13.7 5 11.5 5 9a7 7 0 017-7z"/><path d="M9 17h6M10 21h4M12 17v4"/></svg>',
  'muscle-growth': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 6.5l4 4M13.5 13.5l4 4M4 17l3-3M17 4l3 3M7 3l4 7M13 14l4 7"/></svg>',
  'anti-aging-longevity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  'weight-loss-metabolic': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  'skin-hair': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>',
  'growth-hormone-secretagogues': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
  'immune-support': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  'pain-inflammation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z"/></svg>',
  'neuroprotective': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2A3.5 3.5 0 006 5.5V6a3 3 0 00-3 3v1a3 3 0 003 3h1.5A3.5 3.5 0 0011 16.5V18a3 3 0 003 3h0a3 3 0 003-3v-1.5a3.5 3.5 0 013.5-3.5H21a3 3 0 003-3V9a3 3 0 00-3-3h-.5A3.5 3.5 0 0017 2.5V2"/></svg>',
  'sexual-health': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M12 13v9M9 18h6"/></svg>',
  'sleep': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
  'mitochondrial': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="3" ry="6"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  'antimicrobial': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
  'related-compounds': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7.5L10 10M14 10l3-2.5M7 16.5l3-2.5M14 14l3 2.5"/></svg>',
  'sarms-related': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18.36 6.64A9 9 0 015.64 19.36 9 9 0 0118.36 6.64z"/><path d="M12 2v4M12 18v4"/></svg>',
  'reproductive': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M12 13v9M9 18h6"/></svg>'
};

// Build mega-menu HTML — show categories with peptides, sorted by count
const megaMenuCats = categories
  .map(c => ({ ...c, count: (categoryPeptides[c.id] || []).length }))
  .filter(c => c.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 16);

const megaMenuHTML = megaMenuCats.map(c => {
  const icon = megaMenuIconMap[c.id] || megaMenuIconMap['related-compounds'];
  return `<a href="/categories/${c.id}" class="mega-cat-item">
    <span class="mega-cat-icon" style="color:${c.color}">${icon}</span>
    <span class="mega-cat-info">
      <span class="mega-cat-name">${c.name}</span>
      <span class="mega-cat-count">${c.count} peptide${c.count !== 1 ? 's' : ''}</span>
    </span>
  </a>`;
}).join('');

function render(templateName, vars) {
  let html = loadTemplate('layout');
  const content = loadTemplate(templateName);
  
  // Replace content block
  html = html.replace('{{CONTENT}}', content);
  
  // Default NAV_ACTIVE_BLOG to empty if not set
  if (!vars.NAV_ACTIVE_BLOG) vars.NAV_ACTIVE_BLOG = '';
  
  // Inject global news bell tooltip
  if (!vars.NEWS_BELL_TOOLTIP) vars.NEWS_BELL_TOOLTIP = newsBellTooltip;
  if (!vars.NEWS_BELL_COUNT) vars.NEWS_BELL_COUNT = String(newsBellCount);
  
  // Inject global peptides mega-menu
  if (!vars.MEGA_MENU_CATEGORIES) vars.MEGA_MENU_CATEGORIES = megaMenuHTML;
  
  // Inject global news mega-menu
  if (!vars.NEWS_MENU_CARDS) vars.NEWS_MENU_CARDS = newsMenuHTML;
  if (!vars.NEWS_MENU_COUNT) vars.NEWS_MENU_COUNT = String(blogPosts.length);
  
  // Replace all variables
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value || '');
  }
  
  // Clean up any unreplaced variables
  html = html.replace(/\{\{[A-Z_]+\}\}/g, '');
  
  return html;
}

// Helper: generate breadcrumb JSON-LD
function breadcrumbLD(items) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url ? `https://www.peptideknow.com${item.url}` : undefined
    }))
  });
}

// Helper: generate FAQ JSON-LD
function faqLD(faqs) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  });
}

function articleLD({ title, description, url, datePublished, dateModified }) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": url,
    "datePublished": datePublished || "2026-04-15",
    "dateModified": dateModified || new Date().toISOString().split('T')[0],
    "author": {
      "@type": "Organization",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.peptideknow.com/static/logo.svg"
      }
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com"
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url }
  });
}

function softwareAppLD({ name, description, url }) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "description": description,
    "url": url,
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "isPartOf": {
      "@type": "WebSite",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com"
    }
  });
}

// ============ ROUTES ============

// Homepage
app.get('/', (req, res) => {
  // Category image mapping
  const catImages = {
    'healing-recovery': 'cat-healing.jpg',
    'cognitive-nootropic': 'cat-cognitive.jpg',
    'muscle-growth': 'cat-muscle.jpg',
    'anti-aging-longevity': 'cat-longevity.jpg',
    'weight-loss-metabolic': 'cat-metabolic.jpg',
    'skin-hair': 'cat-skin.jpg',
    'growth-hormone-secretagogues': 'cat-muscle.jpg',
    'immune-support': 'cat-healing.jpg',
    'sleep': 'cat-longevity.jpg',
    'pain-inflammation': 'cat-healing.jpg',
    'neuroprotective': 'cat-cognitive.jpg',
    'sexual-health': 'cat-longevity.jpg',
    'mitochondrial': 'cat-muscle.jpg',
    'antimicrobial': 'cat-healing.jpg',
    'reproductive': 'cat-longevity.jpg',
    'cardiovascular': 'cat-muscle.jpg',
    'gastrointestinal': 'cat-metabolic.jpg',
    'bone-mineral': 'cat-healing.jpg',
    'antiviral': 'cat-healing.jpg'
  };

  const categoryCards = categories.map(cat => {
    const count = categoryPeptides[cat.id] ? categoryPeptides[cat.id].length : 0;
    const img = catImages[cat.id] || 'cat-healing.jpg';
    return `<a href="/categories/${cat.id}" class="category-card">
      <div class="category-card-img"><img src="/static/images/${img}" alt="${cat.name}" width="400" height="300" loading="lazy"></div>
      <div class="category-card-body">
        <h3>${cat.name}</h3>
        <p>${cat.description}</p>
        <span class="count">${count} peptide${count !== 1 ? 's' : ''}</span>
      </div>
    </a>`;
  }).join('');

  // Trending peptides — sorted by popularity with rich cards
  const trendingSlugs = ['bpc-157', 'semaglutide', 'tb-500', 'ipamorelin', 'mk-677', 'retatrutide', 'epithalon', 'ghk-cu', 'semax', 'ostarine-mk-2866', 'tirzepatide', 'pt-141'];
  const trendingPeptides = trendingSlugs
    .filter(slug => peptideBySlug[slug])
    .map(slug => {
      const p = peptideBySlug[slug];
      const cats = (p.categories || []).slice(0, 2).map(c => categoryById[c]?.name || c);
      const d = p.dosage;
      const doseLine = d ? (d.typical_range || d.standard || '') : '';
      const pop = p.popularityScore || p.popularity_score || p.popularity || 0;
      const popBadge = pop >= 8 ? '<span class="trend-badge">Popular</span>' : '';
      const roa = p.routesOfAdministration || p.routes_of_administration || [];
      const roaTags = (Array.isArray(roa) && roa.length > 0)
        ? roa.slice(0, 3).map(r => typeof r === 'object' ? r.route : r).map(r => `<span class="trend-roa">${r}</span>`).join('')
        : '';
      return `<a href="/peptides/${p.slug}" class="trend-card">
        <div class="trend-header">
          <h3>${p.name}</h3>
          ${popBadge}
        </div>
        <div class="trend-cats">${cats.map(c => `<span class="trend-cat">${c}</span>`).join('')}</div>
        <p class="trend-desc">${p.description.substring(0, 120)}...</p>
        ${doseLine ? `<div class="trend-dose"><strong>Dose:</strong> ${doseLine}</div>` : ''}
        ${roaTags ? `<div class="trend-roas">${roaTags}</div>` : ''}
      </a>`;
    }).join('');

  const featuredPeptides = ['thymosin-alpha-1', 'll-37', 'aod-9604', 'selank', 'cjc-1295', 'melanotan-ii', 'dihexa', 'cerebrolysin']
    .filter(slug => peptideBySlug[slug])
    .map(slug => {
      const p = peptideBySlug[slug];
      const cats = (p.categories || []).map(c => categoryById[c]?.name || c).join(', ');
      return `<a href="/peptides/${p.slug}" class="peptide-card">
        <h3>${p.name}</h3>
        <p class="card-cats">${cats}</p>
        <p>${p.description.substring(0, 140)}...</p>
      </a>`;
    }).join('');

  // Stats counts
  const dosageCount = peptides.filter(p => p.dosage).length;
  const stackCount = peptides.reduce((sum, p) => sum + ((p.stackingProtocols || p.stacking || []).length), 0);

  const recentPeptides = peptides.slice(-8).reverse().map(p => {
    return `<a href="/peptides/${p.slug}" class="list-item">
      <span class="list-name">${p.name}</span>
      <span class="list-cat">${(p.categories || []).map(c => categoryById[c]?.name || c).join(', ')}</span>
    </a>`;
  }).join('');

  const allPeptidesList = peptides.map(p => 
    `<a href="/peptides/${p.slug}" class="az-link">${p.name}</a>`
  ).join('');

  // Latest blog posts for homepage
  const latestBlogCards = [...blogPosts]
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished))
    .slice(0, 3)
    .map(post => blogCardHTML(post))
    .join('');

  const websiteLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PeptideKnow",
    "alternateName": "Peptide Encyclopedia",
    "url": "https://www.peptideknow.com",
    "description": "Comprehensive peptide encyclopedia and reference database. Explore 100+ research peptides with mechanisms, benefits, synergies, and clinical data.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.peptideknow.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  });

  const orgLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PeptideKnow",
    "url": "https://www.peptideknow.com",
    "logo": "https://www.peptideknow.com/static/logo.svg",
    "slogan": "Your trusted source for up-to-date peptide research, news & information",
    "sameAs": []
  });

  const html = render('home', {
    TITLE: 'PeptideKnow — Comprehensive Peptide Encyclopedia & Reference Database',
    META_DESCRIPTION: 'Explore the most comprehensive peptide reference database online. Browse 100+ research peptides organized by category with mechanisms of action, synergistic compounds, clinical research status, and more.',
    CANONICAL: 'https://www.peptideknow.com/',
    OG_TITLE: 'PeptideKnow — The Peptide Encyclopedia',
    OG_DESCRIPTION: 'Comprehensive reference database of 100+ research peptides. Mechanisms, benefits, synergies, and clinical data.',
    OG_URL: 'https://www.peptideknow.com/',
    OG_IMAGE: 'https://www.peptideknow.com/static/og-home.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${websiteLD}</script>\n<script type="application/ld+json">${orgLD}</script>`,
    LATEST_BLOG_CARDS: latestBlogCards,
    HERO_NEWS_ITEMS: (() => {
      const sorted = [...blogPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
      return sorted.slice(0, 4).map(post => {
        const dateStr = new Date(post.datePublished + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const imgSrc = imgThumb(post.image);
        return `<a href="/blog/${post.slug}" class="hero-news-item">
          <img src="${imgSrc}" alt="" width="64" height="40" loading="eager">
          <div class="hero-news-item-body">
            <span class="hero-news-item-tag">${post.category || 'News'}</span>
            <span class="hero-news-item-title">${post.title}</span>
            <span class="hero-news-item-meta">${dateStr} · ${post.readTime || '5 min read'}</span>
          </div>
        </a>`;
      }).join('');
    })(),
    CATEGORY_CARDS: categoryCards,
    FEATURED_PEPTIDES: featuredPeptides,
    TRENDING_PEPTIDES: trendingPeptides,
    RECENT_PEPTIDES: recentPeptides,
    ALL_PEPTIDES_LIST: allPeptidesList,
    TOTAL_PEPTIDES: String(peptides.length),
    TOTAL_CATEGORIES: String(categories.length),
    DOSAGE_COUNT: String(dosageCount),
    STACK_COUNT: String(stackCount),
    NAV_ACTIVE_HOME: 'active',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  });

  res.send(html);
});

// All peptides page (A-Z index)
app.get('/peptides', (req, res) => {
  const sorted = [...peptides].sort((a, b) => a.name.localeCompare(b.name));
  
  // Group by first letter
  const grouped = {};
  sorted.forEach(p => {
    const letter = p.name[0].toUpperCase().replace(/[^A-Z]/, '#');
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(p);
  });

  // Build full A-Z nav (show all 26 letters, disable missing ones)
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letterNav = allLetters.map(letter =>
    grouped[letter]
      ? `<a href="#letter-${letter}" class="letter-link">${letter}</a>`
      : `<span class="letter-link letter-disabled">${letter}</span>`
  ).join('');

  const peptideGroups = Object.keys(grouped).sort().map(letter => {
    const items = grouped[letter].map(p => {
      const altNames = (p.alternativeNames || []).slice(0, 2).join(', ');
      const cats = (p.categories || []).map(c => {
        const cat = categoryById[c];
        return cat ? `<a href="/categories/${cat.id}" class="row-cat-pill">${cat.name}</a>` : '';
      }).join('');
      return `<div class="peptide-row">
        <a href="/peptides/${p.slug}" class="row-name">${p.name}</a>
        ${altNames ? `<span class="row-alt">${altNames}</span>` : ''}
        <div class="row-cats">${cats}</div>
      </div>`;
    }).join('');
    return `<div class="letter-group" id="letter-${letter}">
      <h2 class="letter-heading">${letter}</h2>
      ${items}
    </div>`;
  }).join('');

  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'All Peptides' }
  ]);

  const html = render('peptides-index', {
    TITLE: 'All Peptides A-Z — Complete Peptide Database | PeptideKnow',
    META_DESCRIPTION: `Browse all ${peptides.length} peptides in our database alphabetically. Find detailed information on research peptides including mechanisms of action, benefits, and synergistic compounds.`,
    CANONICAL: 'https://www.peptideknow.com/peptides',
    OG_TITLE: 'All Peptides A-Z | PeptideKnow',
    OG_DESCRIPTION: `Complete alphabetical index of ${peptides.length} research peptides with detailed profiles.`,
    OG_URL: 'https://www.peptideknow.com/peptides',
    OG_IMAGE: 'https://www.peptideknow.com/static/og-peptides.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>
<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "All Research Peptides A-Z",
      "description": "Complete alphabetical index of " + peptides.length + " research peptides and compounds",
      "numberOfItems": peptides.length,
      "itemListElement": sorted.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": p.name,
        "url": "https://www.peptideknow.com/peptides/" + p.slug
      }))
    })}</script>`,
    LETTER_NAV: letterNav,
    PEPTIDE_GROUPS: peptideGroups,
    TOTAL_PEPTIDES: String(peptides.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: 'active',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  });

  res.send(html);
});

// Individual peptide page
app.get('/peptides/:slug', (req, res) => {
  const p = peptideBySlug[req.params.slug];
  if (!p) return res.status(404).send(render('404', {
    TITLE: 'Page Not Found | PeptideKnow',
    META_DESCRIPTION: 'The requested page was not found.',
    CANONICAL: '',
    OG_TITLE: 'Page Not Found',
    OG_DESCRIPTION: '',
    OG_URL: '',
    OG_IMAGE: '',
    EXTRA_HEAD: '<meta name="robots" content="noindex">',
    JSON_LD: '',
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  }));

  const catLinks = (p.categories || []).map(c => {
    const cat = categoryById[c];
    return cat ? `<a href="/categories/${cat.id}" class="tag">${cat.name}</a>` : '';
  }).join('');

  const benefitsList = (p.benefits || []).map(b => `<li>${b}</li>`).join('');
  const sideEffectsList = (p.sideEffects || []).map(s => `<li>${s}</li>`).join('');
  
  const altNames = (p.alternativeNames || []).length > 0 
    ? `<p class="alt-names">Also known as: ${p.alternativeNames.join(', ')}</p>` 
    : '';

  const synLinks = (p.synergisticCompounds || []).map(item => {
    const compName = typeof item === 'string' ? item : item.name;
    const compSlug = typeof item === 'string' ? null : item.slug;
    const compRel = typeof item === 'string' ? '' : (item.relationship || '');
    const match = compSlug ? peptides.find(pp => pp.slug === compSlug) : peptides.find(pp => pp.name === compName);
    const tooltip = compRel ? ` title="${compRel.replace(/"/g, '&quot;')}"` : '';
    if (match) return `<a href="/peptides/${match.slug}" class="syn-link"${tooltip}>${compName}</a>`;
    return `<span class="syn-link external"${tooltip}>${compName}</span>`;
  }).join('');

  const relatedLinks = (p.relatedPeptides || []).map(item => {
    const compName = typeof item === 'string' ? item : item.name;
    const compSlug = typeof item === 'string' ? null : item.slug;
    const compRel = typeof item === 'string' ? '' : (item.relationship || '');
    const match = compSlug ? peptides.find(pp => pp.slug === compSlug) : peptides.find(pp => pp.name === compName);
    const tooltip = compRel ? ` title="${compRel.replace(/"/g, '&quot;')}"` : '';
    if (match) return `<a href="/peptides/${match.slug}" class="related-link"${tooltip}>${compName}</a>`;
    return `<span class="related-link"${tooltip}>${compName}</span>`;
  }).join('');

  // Find peptides in same categories for "More in this category"
  const sameCatPeptides = [];
  (p.categories || []).forEach(catId => {
    (categoryPeptides[catId] || []).forEach(cp => {
      if (cp.slug !== p.slug && !sameCatPeptides.find(x => x.slug === cp.slug)) {
        sameCatPeptides.push(cp);
      }
    });
  });
  const morePeptides = sameCatPeptides.slice(0, 6).map(cp => 
    `<a href="/peptides/${cp.slug}" class="more-link">${cp.name}</a>`
  ).join('');

  // Quick facts sidebar
  const quickFacts = [];
  if (p.molecularWeight) quickFacts.push(`<tr><th>Molecular Weight</th><td>${p.molecularWeight}</td></tr>`);
  if (p.sequenceLength) quickFacts.push(`<tr><th>Sequence Length</th><td>${p.sequenceLength}</td></tr>`);
  if (p.casNumber) quickFacts.push(`<tr><th>CAS Number</th><td>${p.casNumber}</td></tr>`);
  if (p.pubChemCID) quickFacts.push(`<tr><th>PubChem CID</th><td><a href="https://pubchem.ncbi.nlm.nih.gov/compound/${p.pubChemCID}" target="_blank" rel="noopener noreferrer">${p.pubChemCID}</a></td></tr>`);
  if (p.researchStatus) quickFacts.push(`<tr><th>Research Status</th><td>${p.researchStatus}</td></tr>`);
  if (p.compoundType) quickFacts.push(`<tr><th>Compound Type</th><td>${p.compoundType}</td></tr>`);

  // Popularity badge
  const popScore = p.popularityScore || p.popularity_score || p.popularity || 0;
  let popularityBadge = '';
  if (popScore >= 8) popularityBadge = '<span class="popularity-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Popular</span>';

  // === REGULATORY STATUS BADGE ===
  let regulatoryBadge = '';
  const regStatusRaw = p.regulatoryStatus;
  if (regStatusRaw) {
    const regLabels = {
      'fda-approved': { label: 'FDA Approved', cls: 'reg-approved', icon: '✓' },
      'approved': { label: 'FDA Approved', cls: 'reg-approved', icon: '✓' },
      'fda-category-2': { label: 'FDA Category 2', cls: 'reg-category2', icon: '⚠' },
      'clinical-trials': { label: 'Clinical Trials', cls: 'reg-clinical', icon: '◉' },
      'research-only': { label: 'Research Only', cls: 'reg-research', icon: '◎' },
      'pre-clinical': { label: 'Pre-Clinical', cls: 'reg-research', icon: '◎' },
      'approved-china': { label: 'Approved (China)', cls: 'reg-approved', icon: '✓' },
      'pending-approval': { label: 'NDA Filed', cls: 'reg-clinical', icon: '◉' },
      'nda-filed': { label: 'NDA Filed', cls: 'reg-clinical', icon: '◉' },
      'phase-3': { label: 'Phase 3', cls: 'reg-clinical', icon: '◉' },
      'phase-2': { label: 'Phase 2', cls: 'reg-clinical', icon: '◉' }
    };
    // Handle both string and object format
    const regKey = typeof regStatusRaw === 'string' ? regStatusRaw : (regStatusRaw.status || 'research-only');
    const regLabel = typeof regStatusRaw === 'object' && regStatusRaw.label ? regStatusRaw.label : null;
    const reg = regLabels[regKey] || { label: regKey, cls: 'reg-research', icon: '◎' };
    const displayLabel = regLabel || reg.label;
    regulatoryBadge = `<span class="regulatory-badge ${reg.cls}"><span class="reg-icon">${reg.icon}</span> ${displayLabel}</span>`;
  }

  // === RICH DOSAGE SECTION ===
  let dosageSection = '';
  let tocDosage = '';
  const d = p.dosage;
  if (d && (d.typical_range || d.beginner || d.standard)) {
    tocDosage = '<li><a href="#dosage">Dosage Protocols</a></li>';
    let rows = '';
    if (d.typical_range || d.standard) rows += `<tr><td>Typical Range</td><td><strong>${d.typical_range || d.standard}</strong></td></tr>`;
    if (d.beginner) rows += `<tr><td>Beginner</td><td>${d.beginner}</td></tr>`;
    if (d.intermediate) rows += `<tr><td>Intermediate</td><td>${d.intermediate}</td></tr>`;
    if (d.advanced) rows += `<tr><td>Advanced</td><td>${d.advanced}</td></tr>`;
    if (d.bodyWeight || d.body_weight) rows += `<tr><td>Body Weight</td><td>${d.bodyWeight || d.body_weight}</td></tr>`;
    if (d.cycle_length || d.cycleDuration) rows += `<tr><td>Cycle Duration</td><td>${d.cycle_length || d.cycleDuration}</td></tr>`;
    if (d.cycle_off) rows += `<tr><td>Cycle Off</td><td>${d.cycle_off}</td></tr>`;
    const notes = d.notes ? `<p class="dosage-note">${d.notes}</p>` : '';
    dosageSection = `<section class="detail-section" id="dosage">
      <h2>Dosage Protocols</h2>
      <p class="dosage-disclaimer">The following reflects doses used in published research studies. This is not medical advice. Consult a qualified healthcare professional.</p>
      <div class="dosage-table-wrap"><table class="data-table"><tbody>${rows}</tbody></table></div>
      ${notes}
      <p class="crosslink-inline"><a href="/tools/calculator">Use our Reconstitution Calculator</a> to determine exact syringe units for your protocol.</p>
    </section>`;
  } else {
    tocDosage = '<li><a href="#dosage">Dosage Notes</a></li>';
    dosageSection = `<section class="detail-section" id="dosage">
      <h2>Research Dosage Notes</h2>
      <p class="dosage-disclaimer">The following reflects doses used in published research studies. This is not medical advice.</p>
      <p>${p.dosageNotes || 'Consult published research literature for study-specific protocols.'}</p>
    </section>`;
  }

  // === ROA SECTION ===
  let roaSection = '';
  let tocRoa = '';
  const roa = p.routesOfAdministration || p.routes_of_administration;
  if (roa && roa.length > 0) {
    tocRoa = '<li><a href="#roa">Administration Routes</a></li>';
    let roaCards = '';
    if (typeof roa[0] === 'object') {
      roaCards = roa.map(r => {
        const bioLow = (r.bioavailability || '').toLowerCase();
          const bioLevel = bioLow.startsWith('high') ? 'high' : bioLow.startsWith('moderate') ? 'moderate' : 'low';
          const badge = r.bioavailability ? `<span class="route-badge route-badge-${bioLevel}">${r.bioavailability}</span>` : '';
        return `<div class="route-card">
          <h5>${r.route} ${badge}</h5>
          <p>${r.notes || ''}</p>
        </div>`;
      }).join('');
    } else {
      roaCards = roa.map(r => `<div class="route-card"><h5>${r}</h5></div>`).join('');
    }
    roaSection = `<section class="detail-section" id="roa">
      <h2>Routes of Administration</h2>
      <div class="dosage-routes">${roaCards}</div>
      <p class="crosslink-inline"><a href="/guides/routes-of-administration">Read our full Routes of Administration Guide</a> for detailed comparison of all delivery methods.</p>
    </section>`;
  }

  // === STACKING SECTION ===
  let stackingSection = '';
  let tocStacking = '';
  const stacks = p.stackingProtocols || p.stacking;
  if (stacks && stacks.length > 0) {
    tocStacking = '<li><a href="#stacking">Stacking Protocols</a></li>';
    const stackCards = stacks.map(s => {
      const compoundList = s.compounds || s.companions || s.peptides || [];
      const compounds = compoundList.map(c => {
        const cName = typeof c === 'string' ? c : c.name;
        const match = peptides.find(pp => pp.name === cName || pp.name.includes(cName));
        return match ? `<a href="/peptides/${match.slug}" class="stack-compound-link">${cName}</a>` : `<span class="stack-compound-tag">${cName}</span>`;
      }).join('');
      const desc = s.purpose || s.description || '';
      return `<div class="stack-card">
        <h4>${s.name}</h4>
        <p class="stack-purpose">${desc}</p>
        <div class="stack-compounds">${compounds}</div>
        <p class="stack-notes">${s.notes || ''}</p>
      </div>`;
    }).join('');
    stackingSection = `<section class="detail-section stacking-section" id="stacking">
      <h2>Stacking Protocols</h2>
      <p>Popular research stacks involving ${p.name}:</p>
      ${stackCards}
      <p class="crosslink-inline"><a href="/guides/stacking">Explore our complete Peptide Stacking Guide</a> for more combinations and safety considerations.</p>
    </section>`;
  }

  // === RECONSTITUTION SECTION ===
  let reconSection = '';
  let tocRecon = '';
  const recon = p.reconstitution;
  if (recon) {
    tocRecon = '<li><a href="#reconstitution">Reconstitution</a></li>';
    let reconRows = '';
    const vialSizes = recon.typical_vial_sizes || recon.typicalVialSize;
    if (vialSizes) reconRows += `<tr><th>Typical Vial Size</th><td>${Array.isArray(vialSizes) ? vialSizes.join(', ') : vialSizes}</td></tr>`;
    const bac = recon.recommended_bac_water || recon.recommendedWater;
    if (bac) reconRows += `<tr><th>BAC Water</th><td>${bac}</td></tr>`;
    if (recon.concentration) reconRows += `<tr><th>Concentration</th><td>${recon.concentration}</td></tr>`;
    const storage = recon.storage || recon.storageTemp;
    if (storage) reconRows += `<tr><th>Storage</th><td>${storage}</td></tr>`;
    const shelf = recon.shelf_life || recon.shelfLife;
    if (shelf) reconRows += `<tr><th>Shelf Life</th><td>${shelf}</td></tr>`;
    const reconNotes = recon.notes ? `<p class="recon-note">${recon.notes}</p>` : '';
    reconSection = `<section class="detail-section" id="reconstitution">
      <h2>Reconstitution</h2>
      <table class="data-table">${reconRows}</table>
      ${reconNotes}
      <div class="cta-box">
        <h4>Need exact syringe measurements?</h4>
        <div class="cta-links">
          <a href="/tools/calculator" class="btn-primary">Open Calculator</a>
          <a href="/guides/reconstitution" class="btn-outline">Full Guide</a>
        </div>
      </div>
    </section>`;
  }

  // === SAFETY & CONTRAINDICATIONS SECTION ===
  let safetySection = '';
  let tocSafety = '';
  const contras = p.contraindications;
  const drugInts = p.drugInteractions;
  const fdaNotes = p.fdaSafetyNotes;
  if ((contras && contras.length > 0) || (drugInts && drugInts.length > 0) || fdaNotes) {
    tocSafety = '<li><a href="#safety">Safety & Contraindications</a></li>';
    let contraHtml = '';
    if (contras && contras.length > 0) {
      const contraCards = contras.map(c => {
        if (typeof c === 'object') {
          const sev = c.severity || 'caution';
          const sevCls = sev === 'absolute' ? 'contra-absolute' : sev === 'relative' ? 'contra-relative' : 'contra-caution';
          return `<div class="contra-card ${sevCls}">
            <div class="contra-severity">${sev.charAt(0).toUpperCase() + sev.slice(1)}</div>
            <h4>${c.condition || c.name || 'Contraindication'}</h4>
            <p>${c.description || c.detail || ''}</p>
          </div>`;
        }
        return `<div class="contra-card contra-caution"><p>${c}</p></div>`;
      }).join('');
      contraHtml = `<div class="contra-grid">${contraCards}</div>`;
    }
    let drugIntHtml = '';
    if (drugInts && drugInts.length > 0) {
      const intItems = drugInts.map(di => {
        if (typeof di === 'object') {
          return `<li><strong>${di.drug || di.name || 'Drug'}</strong>: ${di.interaction || di.description || di.effect || ''}</li>`;
        }
        return `<li>${di}</li>`;
      }).join('');
      drugIntHtml = `<div class="drug-interactions">
        <h3>Drug Interactions</h3>
        <ul>${intItems}</ul>
      </div>`;
    }
    let fdaHtml = '';
    if (fdaNotes) {
      fdaHtml = `<div class="fda-safety-note">
        <h3>FDA Safety Information</h3>
        <p>${fdaNotes}</p>
        <p class="fda-source"><a href="https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks" target="_blank" rel="noopener noreferrer">FDA Source: Bulk Drug Substances Safety Risks</a></p>
      </div>`;
    }
    safetySection = `<section class="detail-section safety-section" id="safety">
      <h2>Safety & Contraindications</h2>
      <p class="safety-disclaimer">This information is for educational purposes only. Consult a qualified healthcare provider before using any peptide.</p>
      ${contraHtml}
      ${drugIntHtml}
      ${fdaHtml}
    </section>`;
  }

  // === PHARMACOKINETICS SECTION ===
  let pharmacokineticsSection = '';
  let tocPharmacokinetics = '';
  const hl = p.halfLife || p.half_life;
  const stor = p.storage;
  const bioav = p.bioavailability;
  const clearance = p.clearance;
  const vd = p.volumeOfDistribution;
  if (hl || stor || bioav || clearance || vd) {
    tocPharmacokinetics = '<li><a href="#pharmacokinetics">Pharmacokinetics</a></li>';
    let pkRows = '';
    if (hl) pkRows += `<tr><th>Half-Life</th><td>${hl}</td></tr>`;
    if (bioav) pkRows += `<tr><th>Bioavailability</th><td>${bioav}</td></tr>`;
    if (clearance) pkRows += `<tr><th>Clearance</th><td>${clearance}</td></tr>`;
    if (vd) pkRows += `<tr><th>Volume of Distribution</th><td>${vd}</td></tr>`;
    if (stor) pkRows += `<tr><th>Storage</th><td>${stor}</td></tr>`;
    pharmacokineticsSection = `<section class="detail-section" id="pharmacokinetics">
      <h2>Pharmacokinetics</h2>
      <table class="data-table">${pkRows}</table>
    </section>`;
  }

  // === GUIDE CROSSLINKS ===
  const guideCrosslinks = [
    `<a href="/guides/beginners" class="crosslink-card"><strong>Beginner's Guide</strong><span>New to peptides? Start here</span></a>`,
    `<a href="/guides/stacking" class="crosslink-card"><strong>Stacking Guide</strong><span>Synergistic combinations</span></a>`,
    `<a href="/guides/routes-of-administration" class="crosslink-card"><strong>Administration Routes</strong><span>SubQ, IM, oral, nasal & more</span></a>`,
    `<a href="/tools/calculator" class="crosslink-card"><strong>Reconstitution Calculator</strong><span>Calculate exact dosing</span></a>`,
    `<a href="/guides/peptides-vs-sarms" class="crosslink-card"><strong>Peptides vs SARMs</strong><span>Full comparison</span></a>`,
    `<a href="/guides/synthesis" class="crosslink-card"><strong>How Peptides Are Made</strong><span>SPPS, purification & QC</span></a>`
  ].join('');

  // FAQ for this peptide
  const faqs = [
    { q: `What is ${p.name}?`, a: p.description },
    { q: `What are the potential benefits of ${p.name}?`, a: (p.benefits || []).join('. ') },
    { q: `What compounds work synergistically with ${p.name}?`, a: (p.synergisticCompounds || []).length > 0 ? `${p.name} has been studied alongside ${p.synergisticCompounds.map(c => typeof c === 'string' ? c : c.name).join(', ')} for potential synergistic effects.` : `Research on synergistic compounds for ${p.name} is ongoing.` }
  ];
  if (d && (d.typical_range || d.standard)) {
    faqs.push({ q: `What is the typical dosage for ${p.name}?`, a: `Research protocols typically use ${d.typical_range || d.standard}. ${d.notes || ''}` });
  }

  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Peptides', url: '/peptides' },
    { name: p.name }
  ]);

  const articleLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": p.name,
    "about": {
      "@type": "Drug",
      "name": p.name,
      "alternateName": p.alternativeNames || [],
      "description": p.description,
      "mechanismOfAction": p.mechanismOfAction || p.mechanism || ''
    },
    "url": `https://www.peptideknow.com/peptides/${p.slug}`,
    "mainEntity": {
      "@type": "Drug",
      "name": p.name,
      "description": p.description
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.peptideknow.com/" },
        { "@type": "ListItem", "position": 2, "name": "Peptides", "item": "https://www.peptideknow.com/peptides" },
        { "@type": "ListItem", "position": 3, "name": p.name }
      ]
    }
  });

  const html = render('peptide-detail', {
    TITLE: `${p.name} — Mechanism, Benefits, Research & Synergies | PeptideKnow`,
    META_DESCRIPTION: `${p.name} (${(p.alternativeNames || []).slice(0, 2).join(', ')}): ${p.description.substring(0, 140)}. Explore mechanism of action, research status, synergistic compounds, and more.`,
    CANONICAL: `https://www.peptideknow.com/peptides/${p.slug}`,
    OG_TITLE: `${p.name} — Peptide Profile | PeptideKnow`,
    OG_DESCRIPTION: p.description.substring(0, 200),
    OG_URL: `https://www.peptideknow.com/peptides/${p.slug}`,
    OG_IMAGE: 'https://www.peptideknow.com/static/og-peptide.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${articleLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>`,
    PEPTIDE_NAME: p.name,
    ALT_NAMES: altNames,
    CATEGORY_TAGS: catLinks,
    DESCRIPTION: p.description,
    MECHANISM: p.mechanismOfAction || p.mechanism || 'Research ongoing.',
    BENEFITS_LIST: benefitsList,
    SIDE_EFFECTS_LIST: sideEffectsList,
    AMINO_ACID_SEQ: p.aminoAcidSequence || 'Not yet characterized',
    POPULARITY_BADGE: popularityBadge,
    REGULATORY_BADGE: regulatoryBadge,
    SAFETY_SECTION: safetySection,
    PHARMACOKINETICS_SECTION: pharmacokineticsSection,
    TOC_SAFETY: tocSafety,
    TOC_PHARMACOKINETICS: tocPharmacokinetics,
    DOSAGE_SECTION: dosageSection,
    ROA_SECTION: roaSection,
    STACKING_SECTION: stackingSection,
    RECONSTITUTION_SECTION: reconSection,
    TOC_DOSAGE: tocDosage,
    TOC_ROA: tocRoa,
    TOC_STACKING: tocStacking,
    TOC_RECONSTITUTION: tocRecon,
    GUIDE_CROSSLINKS: guideCrosslinks,
    SYNERGISTIC_LINKS: synLinks || '<span class="none-listed">None currently listed</span>',
    RELATED_LINKS: relatedLinks || '<span class="none-listed">None currently listed</span>',
    QUICK_FACTS: quickFacts.join(''),
    MORE_PEPTIDES: morePeptides,
    LATEST_NEWS_SECTION: (() => {
      if (!blogPosts || blogPosts.length === 0) return '';
      const sorted = [...blogPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
      const cards = sorted.slice(0, 4).map(post => {
        const imgSrc = imgThumb(post.image);
        const imgAlt = post.imageAlt || post.title;
        const dateStr = new Date(post.datePublished + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `<a href="/blog/${post.slug}" class="news-card">
          <div class="news-card-img"><img src="${imgSrc}" alt="${imgAlt}" width="400" height="225" loading="lazy"></div>
          <div class="news-card-body">
            <span class="news-card-category">${post.category || 'News'}</span>
            <h3>${post.title}</h3>
            <p>${post.excerpt || post.subtitle || ''}</p>
            <div class="news-card-meta">
              <time datetime="${post.datePublished}">${dateStr}</time>
              <span>${post.readTime || '5 min read'}</span>
            </div>
          </div>
        </a>`;
      }).join('');
      return `<section class="section latest-news-section">
        <div class="container">
          <div class="section-header-row">
            <h2>Latest News &amp; Research</h2>
            <a href="/blog" class="view-all-link">View all articles &rarr;</a>
          </div>
          <div class="news-grid">${cards}</div>
        </div>
      </section>`;
    })(),
    REFERENCES: (p.references || []).map((ref, i) => {
      if (typeof ref === 'object' && ref.url) {
        const meta = [ref.authors, ref.journal, ref.year].filter(Boolean).join('. ');
        const metaHtml = meta ? `<span class="ref-meta">${meta}</span>` : '';
        return `<li><a href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.title || ref.url}</a>${metaHtml}</li>`;
      }
      if (typeof ref === 'string' && ref.startsWith('http')) {
        const domain = ref.replace(/https?:\/\//, '').split('/')[0];
        return `<li><a href="${ref}" target="_blank" rel="noopener noreferrer">${domain}</a></li>`;
      }
      return `<li>${ref}</li>`;
    }).join(''),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: 'active',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  });

  res.send(html);
});

// Categories index
app.get('/categories', (req, res) => {
  const cards = categories.map(cat => {
    const count = categoryPeptides[cat.id] ? categoryPeptides[cat.id].length : 0;
    const topPeptides = (categoryPeptides[cat.id] || []).slice(0, 4).map(p => 
      `<a href="/peptides/${p.slug}">${p.name}</a>`
    ).join(', ');
    return `<a href="/categories/${cat.id}" class="category-card-lg">
      <h2>${cat.name}</h2>
      <p>${cat.description}</p>
      <div class="card-meta">
        <span class="count">${count} peptide${count !== 1 ? 's' : ''}</span>
      </div>
    </a>`;
  }).join('');

  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Categories' }
  ]);

  const html = render('categories-index', {
    TITLE: 'Peptide Categories — Browse by Function & Application | PeptideKnow',
    META_DESCRIPTION: `Browse ${categories.length} peptide categories organized by biological function. From growth hormone secretagogues to neuroprotective peptides, find the research peptide information you need.`,
    CANONICAL: 'https://www.peptideknow.com/categories',
    OG_TITLE: 'Peptide Categories | PeptideKnow',
    OG_DESCRIPTION: `${categories.length} categories of research peptides organized by biological function and application.`,
    OG_URL: 'https://www.peptideknow.com/categories',
    OG_IMAGE: 'https://www.peptideknow.com/static/og-categories.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>`,
    CATEGORY_CARDS: cards,
    TOTAL_CATEGORIES: String(categories.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: 'active',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  });

  res.send(html);
});

// Category detail page
app.get('/categories/:id', (req, res) => {
  const cat = categoryById[req.params.id];
  if (!cat) return res.status(404).send(render('404', {
    TITLE: 'Page Not Found | PeptideKnow',
    META_DESCRIPTION: 'The requested page was not found.',
    CANONICAL: '', OG_TITLE: '', OG_DESCRIPTION: '', OG_URL: '', OG_IMAGE: '',
    EXTRA_HEAD: '<meta name="robots" content="noindex">', JSON_LD: '',
    NAV_ACTIVE_HOME: '', NAV_ACTIVE_PEPTIDES: '', NAV_ACTIVE_CATEGORIES: '', NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  }));

  const catPeptides = categoryPeptides[cat.id] || [];
  const peptideCards = catPeptides.map(p => {
    return `<a href="/peptides/${p.slug}" class="peptide-card">
      <h3>${p.name}</h3>
      <p>${p.description.substring(0, 160)}...</p>
      <span class="card-status">${p.researchStatus ? p.researchStatus.substring(0, 80) : 'Research ongoing'}</span>
    </a>`;
  }).join('');

  // Related categories
  const relatedCats = categories.filter(c => c.id !== cat.id).slice(0, 4).map(c =>
    `<a href="/categories/${c.id}" class="related-cat">${c.name}</a>`
  ).join('');

  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/categories' },
    { name: cat.name }
  ]);

  const collectionLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": cat.name,
    "description": cat.description,
    "url": `https://www.peptideknow.com/categories/${cat.id}`,
    "isPartOf": { "@type": "WebSite", "name": "PeptideKnow", "url": "https://www.peptideknow.com" },
    "numberOfItems": catPeptides.length
  });

  const html = render('category-detail', {
    TITLE: `${cat.name} Peptides — Research Database | PeptideKnow`,
    META_DESCRIPTION: `${cat.description} Browse ${catPeptides.length} peptides in the ${cat.name} category with detailed profiles, mechanisms, and synergistic compounds.`,
    CANONICAL: `https://www.peptideknow.com/categories/${cat.id}`,
    OG_TITLE: `${cat.name} Peptides | PeptideKnow`,
    OG_DESCRIPTION: `${catPeptides.length} peptides in the ${cat.name} category. ${cat.description}`,
    OG_URL: `https://www.peptideknow.com/categories/${cat.id}`,
    OG_IMAGE: 'https://www.peptideknow.com/static/og-category.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${collectionLD}</script>`,
    CATEGORY_NAME: cat.name,
    CATEGORY_DESCRIPTION: cat.description,
    PEPTIDE_CARDS: peptideCards,
    PEPTIDE_COUNT: String(catPeptides.length),
    RELATED_CATEGORIES: relatedCats,
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: 'active',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  });

  res.send(html);
});

// Search page
app.get('/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let results = [];
  
  if (q) {
    results = peptides.filter(p => {
      const searchable = [
        p.name,
        ...(p.alternativeNames || []),
        p.description,
        ...(p.categories || []).map(c => categoryById[c]?.name || ''),
        p.mechanismOfAction || p.mechanism || ''
      ].join(' ').toLowerCase();
      return searchable.includes(q);
    });
  }

  const resultHTML = results.length > 0 
    ? results.map(p => {
        const cats = (p.categories || []).map(c => categoryById[c]?.name || c).join(', ');
        return `<a href="/peptides/${p.slug}" class="search-result">
          <h3>${p.name}</h3>
          <p class="result-cats">${cats}</p>
          <p>${p.description.substring(0, 200)}...</p>
        </a>`;
      }).join('')
    : (q ? '<p class="no-results">No peptides found matching your search. Try a different term or <a href="/peptides">browse all peptides</a>.</p>' : '');

  const html = render('search', {
    TITLE: q ? `Search: "${req.query.q}" | PeptideKnow` : 'Search Peptides | PeptideKnow',
    META_DESCRIPTION: 'Search the PeptideKnow database for research peptides by name, category, mechanism of action, or application.',
    CANONICAL: 'https://www.peptideknow.com/search',
    OG_TITLE: 'Search Peptides | PeptideKnow',
    OG_DESCRIPTION: 'Search 100+ research peptides by name, function, or mechanism.',
    OG_URL: 'https://www.peptideknow.com/search',
    OG_IMAGE: 'https://www.peptideknow.com/static/og-home.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      "name": "Search Peptides",
      "url": "https://www.peptideknow.com/search",
      "isPartOf": {
        "@type": "WebSite",
        "name": "PeptideKnow",
        "url": "https://www.peptideknow.com"
      }
    })}</script>`,
    SEARCH_QUERY: req.query.q || '',
    SEARCH_RESULTS: resultHTML,
    RESULT_COUNT: String(results.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  });

  res.send(html);
});

// About page
app.get('/about', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'About' }
  ]);

  const html = render('about', {
    TITLE: 'About PeptideKnow — Peptide Research Reference Database',
    META_DESCRIPTION: 'PeptideKnow is an independent peptide reference database providing organized, research-backed information on bioactive peptides for researchers, clinicians, and the scientific community.',
    CANONICAL: 'https://www.peptideknow.com/about',
    OG_TITLE: 'About PeptideKnow',
    OG_DESCRIPTION: 'Independent peptide reference database for researchers and the scientific community.',
    OG_URL: 'https://www.peptideknow.com/about',
    OG_IMAGE: 'https://www.peptideknow.com/static/og-home.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>
<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About PeptideKnow",
      "description": "PeptideKnow is an independent peptide reference database providing organized, research-backed information on bioactive peptides for researchers, clinicians, and the scientific community.",
      "url": "https://www.peptideknow.com/about",
      "isPartOf": {
        "@type": "WebSite",
        "name": "PeptideKnow",
        "url": "https://www.peptideknow.com"
      },
      "mainEntity": {
        "@type": "Organization",
        "name": "PeptideKnow",
        "url": "https://www.peptideknow.com",
        "description": "Independent peptide reference database and encyclopedia for the scientific and research community."
      }
    })}</script>`,
    TOTAL_PEPTIDES: String(peptides.length),
    TOTAL_CATEGORIES: String(categories.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: 'active',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  });

  res.send(html);
});

// Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const base = 'https://www.peptideknow.com';
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${base}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/peptides</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/categories</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/search</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${base}/about</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${base}/guides</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/guides/beginners</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/guides/stacking</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/guides/routes-of-administration</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/guides/reconstitution</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/guides/synthesis</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${base}/guides/peptides-vs-sarms</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/tools/calculator</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
`;

  categories.forEach(cat => {
    xml += `  <url><loc>${base}/categories/${cat.id}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  });

  peptides.forEach(p => {
    xml += `  <url><loc>${base}/peptides/${p.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  });

  // Blog pages
  xml += `  <url><loc>${base}/blog</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
  blogPosts.forEach(post => {
    xml += `  <url><loc>${base}/blog/${post.slug}</loc><lastmod>${post.dateModified || post.datePublished}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>
    <image:image><image:loc>${base}${post.image}</image:loc><image:caption>${(post.imageAlt || '').replace(/&/g, '&amp;')}</image:caption></image:image>
  </url>\n`;
  });

  xml += '</urlset>';
  res.type('application/xml').send(xml);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Crawl-delay: 1

Sitemap: https://www.peptideknow.com/sitemap.xml

# AI-friendly site description (llms.txt standard)
# https://www.peptideknow.com/llms.txt
# https://www.peptideknow.com/llms-full.txt

# AI Crawlers — all explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: YouBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: AI2Bot
Allow: /

User-agent: Diffbot
Allow: /

User-agent: omgili
Allow: /

User-agent: Timpibot
Allow: /

User-agent: PetalBot
Allow: /

User-agent: Scrapy
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
Allow: /

User-agent: SemrushBot
Crawl-delay: 10
Allow: /
`);
});

// API endpoint for client-side search autocomplete
app.get('/api/peptides', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) return res.json([]);
  
  const results = peptides.filter(p => {
    const searchable = [p.name, ...(p.alternativeNames || [])].join(' ').toLowerCase();
    return searchable.includes(q);
  }).slice(0, 10).map(p => ({
    name: p.name,
    slug: p.slug,
    categories: (p.categories || []).map(c => categoryById[c]?.name || c)
  }));
  
  res.json(results);
});

// Contact form API
const contactFile = path.join(__dirname, 'data', 'contact-submissions.json');
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }
  // Rate limit: max 5 per IP per hour (simple in-memory)
  const ip = req.ip || req.connection.remoteAddress;
  if (!global._contactRateLimit) global._contactRateLimit = {};
  const now = Date.now();
  const hourAgo = now - 3600000;
  global._contactRateLimit[ip] = (global._contactRateLimit[ip] || []).filter(t => t > hourAgo);
  if (global._contactRateLimit[ip].length >= 5) {
    return res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
  }
  global._contactRateLimit[ip].push(now);

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.slice(0, 200),
    email: email.slice(0, 200),
    subject: (subject || 'general').slice(0, 100),
    message: message.slice(0, 5000),
    date: new Date().toISOString(),
    ip: ip
  };
  try {
    let submissions = [];
    if (fs.existsSync(contactFile)) {
      submissions = JSON.parse(fs.readFileSync(contactFile, 'utf8'));
    }
    submissions.push(entry);
    fs.writeFileSync(contactFile, JSON.stringify(submissions, null, 2));
    console.log(`[Contact] New submission from ${name} <${email}> — ${subject}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Contact] Error saving submission:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ============ GUIDE & TOOL HELPER FUNCTIONS ============

function renderGuide(templateName, vars) {
  const defaults = {
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: '',
    NAV_ACTIVE_GUIDES: 'active',
    NAV_ACTIVE_CALCULATOR: '',
    EXTRA_HEAD: '',
    OG_IMAGE: 'https://www.peptideknow.com/static/og-home.png'
  };
  return render(templateName, { ...defaults, ...vars });
}

function renderTool(templateName, vars) {
  const defaults = {
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: 'active',
    EXTRA_HEAD: '',
    OG_IMAGE: 'https://www.peptideknow.com/static/og-home.png'
  };
  return render(templateName, { ...defaults, ...vars });
}

// ============ GUIDE ROUTES ============

// Guides index
app.get('/guides', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Guides' }
  ]);
  const html = renderGuide('guides-index', {
    TITLE: 'Peptide Guides — Dosing, Stacking, Reconstitution & More | PeptideKnow',
    META_DESCRIPTION: 'Comprehensive peptide guides covering reconstitution, stacking protocols, routes of administration, synthesis, and how peptides compare to SARMs. Start here if you are new to peptides.',
    CANONICAL: 'https://www.peptideknow.com/guides',
    OG_TITLE: 'Peptide Guides | PeptideKnow',
    OG_DESCRIPTION: 'Complete guides to peptide reconstitution, stacking, administration routes, synthesis, and more.',
    OG_URL: 'https://www.peptideknow.com/guides',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>
<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Peptide Guides & Resources",
      "description": "Comprehensive guides covering peptide reconstitution, stacking, administration, synthesis, and comparisons.",
      "numberOfItems": 6,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Beginner's Guide to Peptides", "url": "https://www.peptideknow.com/guides/beginners" },
        { "@type": "ListItem", "position": 2, "name": "Peptide Stacking Guide", "url": "https://www.peptideknow.com/guides/stacking" },
        { "@type": "ListItem", "position": 3, "name": "Routes of Administration", "url": "https://www.peptideknow.com/guides/routes-of-administration" },
        { "@type": "ListItem", "position": 4, "name": "Reconstitution Guide", "url": "https://www.peptideknow.com/guides/reconstitution" },
        { "@type": "ListItem", "position": 5, "name": "How Peptides Are Made", "url": "https://www.peptideknow.com/guides/synthesis" },
        { "@type": "ListItem", "position": 6, "name": "Peptides vs SARMs", "url": "https://www.peptideknow.com/guides/peptides-vs-sarms" }
      ]
    })}</script>`
  });
  res.send(html);
});

// Beginner's Guide
app.get('/guides/beginners', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: "Beginner's Guide" }
  ]);
  const faqs = [
    { q: 'What are peptides?', a: 'Peptides are short chains of amino acids (2-50 residues) that act as signaling molecules in the body, regulating processes like growth, healing, immune function, and metabolism.' },
    { q: 'Are peptides the same as steroids?', a: 'No. Peptides are amino acid chains that work through natural receptor pathways. Steroids are synthetic hormones with a fundamentally different mechanism and risk profile.' },
    { q: 'How are peptides administered?', a: 'The most common route is subcutaneous injection. Other routes include intramuscular injection, intranasal spray, oral capsules, sublingual tablets, and topical creams.' },
    { q: 'What is the most popular beginner peptide?', a: 'BPC-157 is widely considered the most beginner-friendly peptide due to its favorable safety profile and versatile healing properties.' }
  ];
  const html = renderGuide('beginners-guide', {
    TITLE: "Beginner's Guide to Peptides — What They Are & How to Start | PeptideKnow",
    META_DESCRIPTION: 'New to peptides? Our comprehensive beginner guide covers what peptides are, how they work, popular starter peptides like BPC-157 and TB-500, reconstitution basics, and safety considerations.',
    CANONICAL: 'https://www.peptideknow.com/guides/beginners',
    OG_TITLE: "Beginner's Guide to Peptides | PeptideKnow",
    OG_DESCRIPTION: 'Everything you need to know to get started with research peptides.',
    OG_URL: 'https://www.peptideknow.com/guides/beginners',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>\n<script type="application/ld+json">${articleLD({ title: "Beginner's Guide to Peptides", description: 'Everything you need to know to get started with research peptides.', url: 'https://www.peptideknow.com/guides/beginners' })}</script>`
  });
  res.send(html);
});

// Stacking Guide
app.get('/guides/stacking', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Stacking Guide' }
  ]);
  const faqs = [
    { q: 'What is peptide stacking?', a: 'Peptide stacking is the practice of combining two or more peptides in a protocol to leverage synergistic effects. For example, combining BPC-157 with TB-500 for enhanced tissue healing.' },
    { q: 'Can you mix peptides in the same syringe?', a: 'Some peptides can be combined in the same syringe for convenience, but always verify compatibility first. Certain peptides may degrade when mixed.' },
    { q: 'What is the best beginner peptide stack?', a: 'The BPC-157 + TB-500 "Wolverine" healing stack is widely considered the best starter stack due to its synergistic tissue repair effects and favorable safety profile.' }
  ];
  const html = renderGuide('stacking-guide', {
    TITLE: 'Peptide Stacking Guide — Synergistic Protocols & Combinations | PeptideKnow',
    META_DESCRIPTION: 'Learn how to stack peptides for maximum synergy. Covers popular stacks like BPC-157 + TB-500 (Wolverine), GH optimization, gut healing, cognitive enhancement, and metabolic reset protocols.',
    CANONICAL: 'https://www.peptideknow.com/guides/stacking',
    OG_TITLE: 'Peptide Stacking Guide | PeptideKnow',
    OG_DESCRIPTION: 'Synergistic peptide combinations: healing, GH, cognitive, metabolic stacks.',
    OG_URL: 'https://www.peptideknow.com/guides/stacking',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>\n<script type="application/ld+json">${articleLD({ title: 'Peptide Stacking Guide — Synergistic Protocols', description: 'Learn how to stack peptides for synergistic effects.', url: 'https://www.peptideknow.com/guides/stacking' })}</script>`
  });
  res.send(html);
});

// Routes of Administration
app.get('/guides/routes-of-administration', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Routes of Administration' }
  ]);
  const faqs = [
    { q: 'What is the best way to take peptides?', a: 'Subcutaneous injection is the most common and bioavailable route for most peptides. However, some peptides like BPC-157 can be taken orally, and others like Semax work well intranasally.' },
    { q: 'Are oral peptides effective?', a: 'Oral bioavailability is generally lower due to digestive degradation. However, certain peptides like BPC-157 and some GLP-1 agonists have demonstrated oral effectiveness with modified formulations.' },
    { q: 'Do peptide nasal sprays work?', a: 'Intranasal administration bypasses the blood-brain barrier for certain peptides, making it highly effective for nootropic peptides like Semax, Selank, and Dihexa.' }
  ];
  const html = renderGuide('roa-guide', {
    TITLE: 'Routes of Peptide Administration — SubQ, IM, Oral, Nasal & More | PeptideKnow',
    META_DESCRIPTION: 'Complete guide to peptide administration routes: subcutaneous injection, intramuscular, oral, sublingual, intranasal, and topical. Compare bioavailability, onset times, and best use cases.',
    CANONICAL: 'https://www.peptideknow.com/guides/routes-of-administration',
    OG_TITLE: 'Routes of Peptide Administration | PeptideKnow',
    OG_DESCRIPTION: 'Compare all peptide administration routes: SubQ, IM, oral, nasal, sublingual, topical.',
    OG_URL: 'https://www.peptideknow.com/guides/routes-of-administration',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>\n<script type="application/ld+json">${articleLD({ title: 'Routes of Peptide Administration', description: 'Compare subcutaneous, intramuscular, oral, nasal, and topical peptide administration.', url: 'https://www.peptideknow.com/guides/routes-of-administration' })}</script>`
  });
  res.send(html);
});

// Reconstitution Guide
app.get('/guides/reconstitution', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Reconstitution Guide' }
  ]);
  const faqs = [
    { q: 'What is peptide reconstitution?', a: 'Reconstitution is the process of dissolving lyophilized (freeze-dried) peptide powder with bacteriostatic water to create an injectable solution.' },
    { q: 'How much bacteriostatic water should I use?', a: 'The amount depends on the peptide quantity and desired concentration. Use our reconstitution calculator for exact measurements. A common standard is 1-2 mL per 5mg vial.' },
    { q: 'How long does reconstituted peptide last?', a: 'Reconstituted peptides typically remain stable for 3-4 weeks when stored properly at 2-8°C (refrigerated). Never freeze reconstituted peptides.' }
  ];
  const html = renderGuide('reconstitution-guide', {
    TITLE: 'How to Reconstitute Peptides — Step-by-Step Guide | PeptideKnow',
    META_DESCRIPTION: 'Step-by-step peptide reconstitution guide with bacteriostatic water. Learn proper technique, storage, dosing calculations, and common mistakes to avoid.',
    CANONICAL: 'https://www.peptideknow.com/guides/reconstitution',
    OG_TITLE: 'Peptide Reconstitution Guide | PeptideKnow',
    OG_DESCRIPTION: 'Step-by-step guide to reconstituting peptides with bacteriostatic water.',
    OG_URL: 'https://www.peptideknow.com/guides/reconstitution',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>\n<script type="application/ld+json">${articleLD({ title: 'How to Reconstitute Peptides', description: 'Step-by-step reconstitution guide with bacteriostatic water.', url: 'https://www.peptideknow.com/guides/reconstitution' })}</script>`
  });
  res.send(html);
});

// Synthesis Guide
app.get('/guides/synthesis', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'How Peptides Are Made' }
  ]);
  const html = renderGuide('synthesis-guide', {
    TITLE: 'How Peptides Are Made — SPPS, Recombinant DNA & Purification | PeptideKnow',
    META_DESCRIPTION: 'Learn how peptides are manufactured through solid-phase peptide synthesis (SPPS), recombinant DNA technology, HPLC purification, and lyophilization. Understand purity grades and quality control.',
    CANONICAL: 'https://www.peptideknow.com/guides/synthesis',
    OG_TITLE: 'How Peptides Are Made | PeptideKnow',
    OG_DESCRIPTION: 'From SPPS to lyophilization: the science behind peptide manufacturing.',
    OG_URL: 'https://www.peptideknow.com/guides/synthesis',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${articleLD({ title: 'How Peptides Are Made — SPPS, Recombinant DNA & Purification', description: 'The science behind peptide manufacturing and quality control.', url: 'https://www.peptideknow.com/guides/synthesis' })}</script>`
  });
  res.send(html);
});

// Peptides vs SARMs
app.get('/guides/peptides-vs-sarms', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Peptides vs SARMs' }
  ]);
  const faqs = [
    { q: 'Are peptides safer than SARMs?', a: 'Generally, peptides work through natural receptor signaling and have a more favorable side-effect profile. SARMs directly modulate androgen receptors and carry risks of hormonal suppression and liver strain.' },
    { q: 'Can you take peptides and SARMs together?', a: 'Some researchers combine them, but this requires careful consideration of interactions. Consult published literature and a qualified healthcare professional.' },
    { q: 'Do SARMs require PCT?', a: 'Yes, most SARMs suppress natural testosterone production and require post-cycle therapy (PCT). Most peptides do not require PCT.' }
  ];
  const html = renderGuide('peptides-vs-sarms', {
    TITLE: 'Peptides vs SARMs — Key Differences, Safety & Comparison | PeptideKnow',
    META_DESCRIPTION: 'Peptides vs SARMs: comprehensive comparison of mechanisms, safety profiles, legal status, side effects, and use cases. Understand which is better for your research goals.',
    CANONICAL: 'https://www.peptideknow.com/guides/peptides-vs-sarms',
    OG_TITLE: 'Peptides vs SARMs Comparison | PeptideKnow',
    OG_DESCRIPTION: 'Detailed comparison: mechanisms, safety, legal status, and use cases.',
    OG_URL: 'https://www.peptideknow.com/guides/peptides-vs-sarms',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>\n<script type="application/ld+json">${articleLD({ title: 'Peptides vs SARMs — Key Differences & Safety Comparison', description: 'Comprehensive comparison of peptides and SARMs.', url: 'https://www.peptideknow.com/guides/peptides-vs-sarms' })}</script>`
  });
  res.send(html);
});

// ============ TOOL ROUTES ============

// Redirect /calculator to canonical path
app.get('/calculator', (req, res) => res.redirect(301, '/tools/calculator'));

// Reconstitution Calculator
app.get('/tools/calculator', (req, res) => {
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Tools' },
    { name: 'Reconstitution Calculator' }
  ]);
  const faqs = [
    { q: 'How do I calculate peptide reconstitution?', a: 'Divide the peptide amount (in mg) by the volume of bacteriostatic water (in mL) to get concentration. Then use the desired dose to calculate how many units to draw on your syringe.' },
    { q: 'What syringe should I use for peptides?', a: 'Insulin syringes (U-100, 1mL) are standard for subcutaneous peptide injections. They provide precise measurement in units (100 units = 1 mL).' },
    { q: 'What is bacteriostatic water?', a: 'Bacteriostatic water is sterile water containing 0.9% benzyl alcohol as a preservative, allowing multiple uses from the same vial for up to 28 days.' }
  ];

  // Build peptide dosing data from peptides.json for calculator presets
  const calcPresets = {};
  peptides.forEach(p => {
    if (!p.dosage) return;
    const d = p.dosage;
    const range = d.typical_range || '';
    // Parse a default dose in mcg for auto-fill
    let dose = 250;
    const mcgDayM = range.match(/([\d.]+)(?:\s*-\s*[\d.]+)?\s*mcg\/d/i);
    const mcgM = range.match(/([\d.]+)(?:\s*-\s*[\d.]+)?\s*mcg/i);
    const mgWeekM = range.match(/([\d.]+)(?:\s*-\s*[\d.]+)?\s*mg\/week/i);
    const mgDayM = range.match(/([\d.]+)(?:\s*-\s*[\d.]+)?\s*mg\/day/i);
    if (mcgDayM) dose = Math.round(parseFloat(mcgDayM[1]));
    else if (mcgM) dose = Math.round(parseFloat(mcgM[1]));
    else if (mgWeekM) dose = Math.round(parseFloat(mgWeekM[1]) * 1000 / 2);
    else if (mgDayM) dose = Math.round(parseFloat(mgDayM[1]) * 1000);
    calcPresets[p.slug] = {
      name: p.name,
      vial: 5,
      dose,
      range: d.typical_range || '',
      beginner: d.beginner || '',
      intermediate: d.intermediate || '',
      advanced: d.advanced || '',
      cycle: d.cycle_length || '',
      notes: d.notes || ''
    };
  });
  const calcDataJSON = JSON.stringify(calcPresets).replace(/<\//g, '<\\/');

  const html = renderTool('calculator', {
    TITLE: 'Peptide Reconstitution Calculator — Dosing & Syringe Guide | PeptideKnow',
    META_DESCRIPTION: 'Free peptide reconstitution calculator. Enter peptide amount and water volume to get exact syringe units. Supports 114 peptides with preset doses, body-weight calculations, and visual syringe guide.',
    CANONICAL: 'https://www.peptideknow.com/tools/calculator',
    OG_TITLE: 'Peptide Reconstitution Calculator | PeptideKnow',
    OG_DESCRIPTION: 'Calculate exact dosing and syringe units for any peptide reconstitution.',
    OG_URL: 'https://www.peptideknow.com/tools/calculator',
    CALC_PEPTIDE_DATA: calcDataJSON,
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>\n<script type="application/ld+json">${softwareAppLD({ name: 'Peptide Reconstitution Calculator', description: 'Calculate exact bacteriostatic water volumes, syringe units, and body-weight dosing for research peptides.', url: 'https://www.peptideknow.com/tools/calculator' })}</script>`
  });
  res.send(html);
});

// llms.txt — AI crawler optimization (emerging standard)
app.get('/llms.txt', (req, res) => {
  const catList = categories.map(c => `- ${c.name}: https://www.peptideknow.com/categories/${c.id}`).join('\n');
  const topPeptides = ['bpc-157', 'semaglutide', 'tb-500', 'ipamorelin', 'mk-677', 'ghk-cu', 'epithalon', 'selank', 'semax', 'pt-141', 'tirzepatide', 'retatrutide', 'aod-9604', 'thymosin-alpha-1', 'll-37']
    .filter(s => peptideBySlug[s])
    .map(s => `- ${peptideBySlug[s].name}: https://www.peptideknow.com/peptides/${s}`)
    .join('\n');

  res.type('text/plain').send(`# PeptideKnow
> Comprehensive peptide encyclopedia and reference database

PeptideKnow is an independent reference database covering ${peptides.length} research peptides across ${categories.length} categories. It provides mechanisms of action, dosage protocols, stacking guides, reconstitution instructions, routes of administration, synergistic compound cross-references, and clinical research status for each peptide.

## Main Pages
- Homepage: https://www.peptideknow.com/
- All Peptides (A-Z): https://www.peptideknow.com/peptides
- Categories: https://www.peptideknow.com/categories
- Guides: https://www.peptideknow.com/guides
- Calculator: https://www.peptideknow.com/tools/calculator
- About: https://www.peptideknow.com/about

## Guides & Resources
- Beginner's Guide to Peptides: https://www.peptideknow.com/guides/beginners
- Peptide Stacking Guide: https://www.peptideknow.com/guides/stacking
- Routes of Administration: https://www.peptideknow.com/guides/routes-of-administration
- Reconstitution Guide: https://www.peptideknow.com/guides/reconstitution
- How Peptides Are Made: https://www.peptideknow.com/guides/synthesis
- Peptides vs SARMs: https://www.peptideknow.com/guides/peptides-vs-sarms
- Reconstitution Calculator: https://www.peptideknow.com/tools/calculator

## Categories
${catList}

## Top Peptides
${topPeptides}

## Data Available Per Peptide
Each peptide page includes: name, alternative names, molecular weight, sequence length, CAS number, PubChem CID, mechanism of action, potential benefits, dosage protocols (typical range, beginner, intermediate, advanced), routes of administration (with bioavailability data), stacking protocols, reconstitution instructions, amino acid sequence, side effects, synergistic compounds, related peptides, references, and clinical research status.

## News & Blog
- Blog: https://www.peptideknow.com/blog
- RSS Feed: https://www.peptideknow.com/blog/rss.xml

## API
Search API: https://www.peptideknow.com/api/peptides?q={query}
Sitemap: https://www.peptideknow.com/sitemap.xml
`);
});

// llms-full.txt — expanded version with all peptide summaries
app.get('/llms-full.txt', (req, res) => {
  let content = `# PeptideKnow — Full Reference\n\n`;
  content += `Total peptides: ${peptides.length}\nTotal categories: ${categories.length}\n\n`;
  
  peptides.forEach(p => {
    const cats = (p.categories || []).map(c => categoryById[c]?.name || c).join(', ');
    content += `## ${p.name}\n`;
    content += `URL: https://www.peptideknow.com/peptides/${p.slug}\n`;
    if (p.alternativeNames?.length) content += `Also known as: ${p.alternativeNames.join(', ')}\n`;
    content += `Categories: ${cats}\n`;
    content += `${p.description}\n`;
    if (p.molecularWeight) content += `Molecular weight: ${p.molecularWeight}\n`;
    if (p.sequenceLength) content += `Sequence: ${p.sequenceLength}\n`;
    content += `\n`;
  });
  
  res.type('text/plain').send(content);
});

// ============ BLOG ROUTES ============

// Helper: format date for display
function formatDateDisplay(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper: get optimized image variant (thumb or medium WebP)
function imgThumb(src) {
  if (!src) return '/static/images/blog-rfk-peptides-thumb.webp';
  return src.replace(/\.(png|jpg|jpeg)$/i, '-thumb.webp');
}
function imgMedium(src) {
  if (!src) return '/static/images/blog-rfk-peptides-med.webp';
  return src.replace(/\.(png|jpg|jpeg)$/i, '-med.webp');
}

// Helper: generate blog card HTML
function blogCardHTML(post) {
  return `<a href="/blog/${post.slug}" class="blog-card">
    <div class="blog-card-img">
      <img src="${imgMedium(post.image)}" alt="${post.imageAlt}" width="600" height="338" loading="lazy">
    </div>
    <div class="blog-card-body">
      <span class="blog-card-category">${post.category}</span>
      <h3>${post.title}</h3>
      <p>${post.excerpt.substring(0, 160)}...</p>
      <div class="blog-card-meta">
        <time datetime="${post.datePublished}">${formatDateDisplay(post.datePublished)}</time>
        <span>${post.readTime}</span>
      </div>
    </div>
  </a>`;
}

// Blog index page
app.get('/blog', (req, res) => {
  const sorted = [...blogPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
  const featured = sorted[0];
  const rest = sorted.slice(1);

  const featuredHTML = featured ? `<section class="blog-featured section">
    <div class="container">
      <a href="/blog/${featured.slug}" class="blog-featured-card">
        <div class="blog-featured-img">
          <img src="${imgMedium(featured.image)}" alt="${featured.imageAlt}" width="800" height="450" loading="eager">
        </div>
        <div class="blog-featured-body">
          <span class="blog-card-category">${featured.category}</span>
          <h2>${featured.title}</h2>
          <p>${featured.excerpt}</p>
          <div class="blog-card-meta">
            <time datetime="${featured.datePublished}">${formatDateDisplay(featured.datePublished)}</time>
            <span>${featured.readTime}</span>
          </div>
        </div>
      </a>
    </div>
  </section>` : '';

  const blogCards = sorted.map(p => blogCardHTML(p)).join('');

  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'News & Research' }
  ]);

  const blogListLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "PeptideKnow News & Research",
    "description": "Latest peptide news, FDA regulatory updates, clinical research findings, and industry analysis.",
    "url": "https://www.peptideknow.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com"
    },
    "blogPost": sorted.map(p => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "url": `https://www.peptideknow.com/blog/${p.slug}`,
      "datePublished": p.datePublished,
      "image": `https://www.peptideknow.com${p.image}`,
      "author": { "@type": "Organization", "name": "PeptideKnow" }
    }))
  });

  const html = render('blog-index', {
    TITLE: 'Peptide News & Research Updates | PeptideKnow',
    META_DESCRIPTION: 'Stay informed on the latest peptide regulations, FDA decisions, clinical trials, and industry news. Evidence-based reporting from the PeptideKnow editorial team.',
    CANONICAL: 'https://www.peptideknow.com/blog',
    OG_TITLE: 'Peptide News & Research | PeptideKnow',
    OG_DESCRIPTION: 'Latest peptide news: FDA regulatory updates, clinical research, and industry analysis.',
    OG_URL: 'https://www.peptideknow.com/blog',
    OG_IMAGE: sorted[0] ? `https://www.peptideknow.com${sorted[0].image}` : 'https://www.peptideknow.com/static/og-home.png',
    EXTRA_HEAD: '<link rel="alternate" type="application/rss+xml" title="PeptideKnow Blog RSS" href="/blog/rss.xml">',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${blogListLD}</script>`,
    FEATURED_POST: featuredHTML,
    BLOG_CARDS: blogCards,
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: '',
    NAV_ACTIVE_BLOG: 'active'
  });

  res.send(html);
});

// Individual blog post
// RSS Feed — must be before /blog/:slug to avoid being caught by the slug route
app.get('/blog/rss.xml', (req, res) => {
  const sorted = [...blogPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
  const base = 'https://www.peptideknow.com';
  
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>PeptideKnow \u2014 Peptide News &amp; Research</title>
    <link>${base}/blog</link>
    <description>Latest peptide news, FDA regulatory updates, clinical research findings, and industry analysis from PeptideKnow.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${base}/static/logo.svg</url>
      <title>PeptideKnow</title>
      <link>${base}</link>
    </image>
`;

  sorted.forEach(post => {
    const plainExcerpt = post.excerpt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    rss += `    <item>
      <title>${post.title.replace(/&/g, '&amp;')}</title>
      <link>${base}/blog/${post.slug}</link>
      <guid isPermaLink="true">${base}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.datePublished + 'T12:00:00Z').toUTCString()}</pubDate>
      <dc:creator>${post.author || 'PeptideKnow Editorial'}</dc:creator>
      <category>${post.category}</category>
      <description><![CDATA[${post.excerpt}]]></description>
      <media:content url="${base}${post.image}" medium="image" />
    </item>
`;
  });

  rss += `  </channel>
</rss>`;

  res.type('application/rss+xml').send(rss);
});

app.get('/blog/:slug', (req, res) => {
  const post = blogPostBySlug[req.params.slug];
  if (!post) return res.status(404).send(render('404', {
    TITLE: 'Article Not Found | PeptideKnow',
    META_DESCRIPTION: 'The requested article was not found.',
    CANONICAL: '', OG_TITLE: '', OG_DESCRIPTION: '', OG_URL: '', OG_IMAGE: '',
    EXTRA_HEAD: '<meta name="robots" content="noindex">', JSON_LD: '',
    NAV_ACTIVE_HOME: '', NAV_ACTIVE_PEPTIDES: '', NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '', NAV_ACTIVE_GUIDES: '', NAV_ACTIVE_CALCULATOR: '', NAV_ACTIVE_BLOG: ''
  }));

  const body = blogBodies[post.slug] || '<p>Article content is being prepared.</p>';

  // Generate TOC from h2 headings in body
  const tocMatches = [...body.matchAll(/<section id="([^"]+)">\s*<h2>([^<]+)<\/h2>/g)];
  const tocHTML = '<ul>' + tocMatches.map(m =>
    `<li><a href="#${m[1]}">${m[2]}</a></li>`
  ).join('') + '</ul>';

  // Tags
  const tagsHTML = (post.tags || []).map(t =>
    `<span class="blog-tag">${t}</span>`
  ).join('');

  // Sources
  const sources = [
    { title: 'FDA PCAC Meeting Announcement (July 23-24, 2026)', url: 'https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026' },
    { title: 'PBS: FDA to Weigh Easing Limits on Peptides Favored by RFK Jr.', url: 'https://www.pbs.org/newshour/health/fda-to-weigh-easing-limits-on-unproven-peptides-favored-by-rfk-jr-and-maha-supporters' },
    { title: 'BioPharma Dive: FDA Peptides RFK Advisory Committee Restrictions', url: 'https://www.biopharmadive.com/news/fda-peptides-rfk-advisory-committee-restrictions/817685/' },
    { title: 'RAPS: FDA Considers Adding a Dozen Peptides to Bulk Drug List', url: 'https://www.raps.org/resource/fda-considers-adding-a-dozen-peptides-to-its-bulk-drug-compounding-list.html' },
    { title: 'Ars Technica: RFK Jr. Forces FDA to Reconsider 12 Peptides', url: 'https://arstechnica.com/health/2026/04/rfk-jr-forces-fda-to-reconsider-12-unproven-peptides-after-2023-ban/' },
    { title: 'ProPublica: Peptide Safety Investigation', url: 'https://www.propublica.org/article/peptide-safety-fda-compounding-pharmacies' },
    { title: 'New York Times: Peptide Ban FDA RFK Jr.', url: 'https://www.nytimes.com/2026/03/31/health/peptide-ban-fda-rfk-jr.html' },
    { title: 'SSRP Institute: FDA Announces Change in Status of 12 Peptides', url: 'https://ssrpinstitute.org/news/fda-announces-change-in-status-of-12-peptides/' },
    { title: 'CNBC: RFK Jr. Peptides Hims Hers GLP-1', url: 'https://www.cnbc.com/2026/04/16/rfk-jr-peptides-hims-hers-glp-1.html' },
    { title: 'USA Today: RFK Jr. FDA Peptides Explainer', url: 'https://www.usatoday.com/story/news/health/2026/04/01/rfk-jr-fda-peptides-what-are-they/89402206007/' }
  ];
  const sourcesHTML = sources.map(s =>
    `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a></li>`
  ).join('');

  // Related peptide cards from article
  const mentionedSlugs = ['bpc-157', 'tb-500', 'semax', 'epithalon', 'mots-c', 'll-37', 'ghk-cu', 'dihexa', 'melanotan-ii', 'ipamorelin', 'cjc-1295', 'selank'];
  const relatedCards = mentionedSlugs
    .filter(s => peptideBySlug[s])
    .map(s => {
      const p = peptideBySlug[s];
      const cats = (p.categories || []).slice(0, 2).map(c => categoryById[c]?.name || c).join(', ');
      return `<a href="/peptides/${p.slug}" class="blog-related-card-item">
        <h4>${p.name}</h4>
        <span class="blog-related-cats">${cats}</span>
      </a>`;
    }).join('');

  // Other blog posts
  const otherPosts = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  const morePostsHTML = otherPosts.length > 0
    ? otherPosts.map(p => blogCardHTML(p)).join('')
    : '<p>More articles coming soon. Check back for daily peptide news updates.</p>';

  // JSON-LD
  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'News & Research', url: '/blog' },
    { name: post.title }
  ]);

  const blogPostLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.metaDescription || post.excerpt,
    "url": `https://www.peptideknow.com/blog/${post.slug}`,
    "datePublished": post.datePublished,
    "dateModified": post.dateModified || post.datePublished,
    "image": {
      "@type": "ImageObject",
      "url": `https://www.peptideknow.com${post.image}`,
      "width": 1200,
      "height": 675,
      "caption": post.imageAlt
    },
    "author": {
      "@type": "Organization",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PeptideKnow",
      "url": "https://www.peptideknow.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.peptideknow.com/static/logo.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.peptideknow.com/blog/${post.slug}`
    },
    "keywords": post.keywords || (post.tags || []).join(', '),
    "articleSection": post.category,
    "wordCount": body.replace(/<[^>]+>/g, '').split(/\s+/).length,
    "isPartOf": {
      "@type": "Blog",
      "name": "PeptideKnow News & Research",
      "url": "https://www.peptideknow.com/blog"
    }
  });

  // FAQ JSON-LD from the FAQ section
  const faqItems = [
    { q: 'Are these 12 peptides legal to buy now?', a: 'Not yet. The FDA has announced its intent to reclassify, but the formal process requires PCAC review and rulemaking. Until reclassification is finalized, these peptides remain on Category 2.' },
    { q: 'What is the difference between Category 1 and Category 2?', a: 'Category 1 peptides can be compounded by licensed pharmacies with a valid prescription. Category 2 peptides are deemed difficult to compound and cannot legally be compounded.' },
    { q: 'Why were GH secretagogues like Ipamorelin not included?', a: 'Growth hormone secretagogues directly stimulate growth hormone release, putting them in a more heavily regulated space with higher abuse potential concerns.' },
    { q: 'When will I be able to get BPC-157 from a pharmacy again?', a: 'If the PCAC votes favorably in July 2026 and the FDA follows the recommendation, BPC-157 could return to compounding pharmacies by late 2026 or early 2027.' },
    { q: 'Is RFK Jr. the reason these peptides are being reclassified?', a: 'RFK Jr. and the MAHA movement played a significant role, but the FDA decision also reflects input from patient advocacy groups, compounding organizations, and healthcare providers.' },
    { q: 'Are there safety concerns with compounded peptides?', a: 'Yes. Compounded drugs are not subject to the same FDA oversight as manufactured pharmaceuticals. Choosing a reputable 503B outsourcing facility with third-party testing is critical.' }
  ];

  const html = render('blog-post', {
    TITLE: `${post.title} | PeptideKnow`,
    META_DESCRIPTION: post.metaDescription || post.excerpt,
    CANONICAL: `https://www.peptideknow.com/blog/${post.slug}`,
    OG_TITLE: post.title,
    OG_DESCRIPTION: post.excerpt.substring(0, 200),
    OG_URL: `https://www.peptideknow.com/blog/${post.slug}`,
    OG_IMAGE: `https://www.peptideknow.com${post.image}`,
    EXTRA_HEAD: `<meta name="keywords" content="${post.keywords || ''}">
      <meta property="og:type" content="article">
      <meta property="article:published_time" content="${post.datePublished}">
      <meta property="article:modified_time" content="${post.dateModified}">
      <meta property="article:section" content="${post.category}">
      ${(post.tags || []).map(t => `<meta property="article:tag" content="${t}">`).join('\n      ')}
      <link rel="alternate" type="application/rss+xml" title="PeptideKnow Blog RSS" href="/blog/rss.xml">`,
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${blogPostLD}</script>\n<script type="application/ld+json">${faqLD(faqItems)}</script>`,
    POST_TITLE: post.title,
    POST_SUBTITLE: post.subtitle || '',
    POST_CATEGORY: post.category,
    POST_DATE_ISO: post.datePublished,
    POST_DATE_DISPLAY: formatDateDisplay(post.datePublished),
    POST_MODIFIED_ISO: post.dateModified || post.datePublished,
    POST_MODIFIED_DISPLAY: formatDateDisplay(post.dateModified || post.datePublished),
    POST_READ_TIME: post.readTime || '10 min read',
    POST_AUTHOR: post.author || 'PeptideKnow Editorial',
    POST_IMAGE: post.image,
    POST_IMAGE_ALT: post.imageAlt || '',
    POST_TOC: tocHTML,
    POST_BODY: body,
    POST_TAGS: tagsHTML,
    POST_SOURCES: sourcesHTML,
    RELATED_PEPTIDE_CARDS: relatedCards,
    MORE_POSTS: morePostsHTML,
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: '',
    NAV_ACTIVE_BLOG: 'active'
  });

  res.send(html);
});

// Blog RSS Feed
// 404 catch-all
app.use((req, res) => {
  res.status(404).send(render('404', {
    TITLE: 'Page Not Found | PeptideKnow',
    META_DESCRIPTION: 'The requested page was not found on PeptideKnow.',
    CANONICAL: '',
    OG_TITLE: 'Page Not Found',
    OG_DESCRIPTION: '',
    OG_URL: '',
    OG_IMAGE: '',
    EXTRA_HEAD: '<meta name="robots" content="noindex">',
    JSON_LD: '',
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: '',
    NAV_ACTIVE_GUIDES: '',
    NAV_ACTIVE_CALCULATOR: ''
  }));
});

app.listen(PORT, () => {
  console.log(`PeptideKnow running on port ${PORT}`);
});
