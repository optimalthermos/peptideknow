const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Load peptide data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'peptides.json'), 'utf8'));
const peptides = data.peptides;
const categories = data.categories;

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
  maxAge: '7d',
  immutable: true
}));

// Template engine
const templates = {};
function loadTemplate(name) {
  if (!templates[name]) {
    templates[name] = fs.readFileSync(path.join(__dirname, 'templates', name + '.html'), 'utf8');
  }
  return templates[name];
}

function render(templateName, vars) {
  let html = loadTemplate('layout');
  const content = loadTemplate(templateName);
  
  // Replace content block
  html = html.replace('{{CONTENT}}', content);
  
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
      "item": item.url ? `https://peptideopedia.com${item.url}` : undefined
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

// ============ ROUTES ============

// Homepage
app.get('/', (req, res) => {
  const categoryCards = categories.map(cat => {
    const count = categoryPeptides[cat.id] ? categoryPeptides[cat.id].length : 0;
    return `<a href="/categories/${cat.id}" class="category-card">
      <h3>${cat.name}</h3>
      <p>${cat.description}</p>
      <span class="count">${count} peptide${count !== 1 ? 's' : ''}</span>
    </a>`;
  }).join('');

  const featuredPeptides = ['bpc-157', 'tb-500', 'semaglutide', 'epithalon', 'thymosin-alpha-1', 'ghk-cu', 'semax', 'pt-141']
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

  const recentPeptides = peptides.slice(-8).reverse().map(p => {
    return `<a href="/peptides/${p.slug}" class="list-item">
      <span class="list-name">${p.name}</span>
      <span class="list-cat">${(p.categories || []).map(c => categoryById[c]?.name || c).join(', ')}</span>
    </a>`;
  }).join('');

  const allPeptidesList = peptides.map(p => 
    `<a href="/peptides/${p.slug}" class="az-link">${p.name}</a>`
  ).join('');

  const websiteLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PeptideOpedia",
    "alternateName": "Peptide Encyclopedia",
    "url": "https://peptideopedia.com",
    "description": "Comprehensive peptide encyclopedia and reference database. Explore 100+ research peptides with mechanisms, benefits, synergies, and clinical data.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://peptideopedia.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  });

  const orgLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PeptideOpedia",
    "url": "https://peptideopedia.com",
    "logo": "https://peptideopedia.com/static/logo.svg",
    "sameAs": []
  });

  const html = render('home', {
    TITLE: 'PeptideOpedia — Comprehensive Peptide Encyclopedia & Reference Database',
    META_DESCRIPTION: 'Explore the most comprehensive peptide reference database online. Browse 100+ research peptides organized by category with mechanisms of action, synergistic compounds, clinical research status, and more.',
    CANONICAL: 'https://peptideopedia.com/',
    OG_TITLE: 'PeptideOpedia — The Peptide Encyclopedia',
    OG_DESCRIPTION: 'Comprehensive reference database of 100+ research peptides. Mechanisms, benefits, synergies, and clinical data.',
    OG_URL: 'https://peptideopedia.com/',
    OG_IMAGE: 'https://peptideopedia.com/static/og-home.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${websiteLD}</script>\n<script type="application/ld+json">${orgLD}</script>`,
    CATEGORY_CARDS: categoryCards,
    FEATURED_PEPTIDES: featuredPeptides,
    RECENT_PEPTIDES: recentPeptides,
    ALL_PEPTIDES_LIST: allPeptidesList,
    TOTAL_PEPTIDES: String(peptides.length),
    TOTAL_CATEGORIES: String(categories.length),
    NAV_ACTIVE_HOME: 'active',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: ''
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

  const letterNav = Object.keys(grouped).sort().map(letter =>
    `<a href="#letter-${letter}" class="letter-link">${letter}</a>`
  ).join('');

  const peptideGroups = Object.keys(grouped).sort().map(letter => {
    const items = grouped[letter].map(p => {
      const cats = (p.categories || []).map(c => categoryById[c]?.name || c).join(', ');
      return `<a href="/peptides/${p.slug}" class="peptide-row">
        <span class="row-name">${p.name}</span>
        <span class="row-alt">${(p.alternativeNames || []).slice(0, 2).join(', ')}</span>
        <span class="row-cats">${cats}</span>
      </a>`;
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
    TITLE: 'All Peptides A-Z — Complete Peptide Database | PeptideOpedia',
    META_DESCRIPTION: `Browse all ${peptides.length} peptides in our database alphabetically. Find detailed information on research peptides including mechanisms of action, benefits, and synergistic compounds.`,
    CANONICAL: 'https://peptideopedia.com/peptides',
    OG_TITLE: 'All Peptides A-Z | PeptideOpedia',
    OG_DESCRIPTION: `Complete alphabetical index of ${peptides.length} research peptides with detailed profiles.`,
    OG_URL: 'https://peptideopedia.com/peptides',
    OG_IMAGE: 'https://peptideopedia.com/static/og-peptides.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>`,
    LETTER_NAV: letterNav,
    PEPTIDE_GROUPS: peptideGroups,
    TOTAL_PEPTIDES: String(peptides.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: 'active',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: ''
  });

  res.send(html);
});

// Individual peptide page
app.get('/peptides/:slug', (req, res) => {
  const p = peptideBySlug[req.params.slug];
  if (!p) return res.status(404).send(render('404', {
    TITLE: 'Page Not Found | PeptideOpedia',
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
    NAV_ACTIVE_ABOUT: ''
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

  const synLinks = (p.synergisticCompounds || []).map(name => {
    const match = peptides.find(pp => pp.name === name);
    if (match) return `<a href="/peptides/${match.slug}" class="syn-link">${name}</a>`;
    return `<span class="syn-link external">${name}</span>`;
  }).join('');

  const relatedLinks = (p.relatedPeptides || []).map(name => {
    const match = peptides.find(pp => pp.name === name);
    if (match) return `<a href="/peptides/${match.slug}" class="related-link">${name}</a>`;
    return `<span class="related-link">${name}</span>`;
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

  // FAQ for this peptide
  const faqs = [
    { q: `What is ${p.name}?`, a: p.description },
    { q: `What are the potential benefits of ${p.name}?`, a: (p.benefits || []).join('. ') },
    { q: `What compounds work synergistically with ${p.name}?`, a: (p.synergisticCompounds || []).length > 0 ? `${p.name} has been studied alongside ${p.synergisticCompounds.join(', ')} for potential synergistic effects.` : `Research on synergistic compounds for ${p.name} is ongoing.` }
  ];

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
      "mechanismOfAction": p.mechanismOfAction || ''
    },
    "url": `https://peptideopedia.com/peptides/${p.slug}`,
    "mainEntity": {
      "@type": "Drug",
      "name": p.name,
      "description": p.description
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "PeptideOpedia",
      "url": "https://peptideopedia.com"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://peptideopedia.com/" },
        { "@type": "ListItem", "position": 2, "name": "Peptides", "item": "https://peptideopedia.com/peptides" },
        { "@type": "ListItem", "position": 3, "name": p.name }
      ]
    }
  });

  const html = render('peptide-detail', {
    TITLE: `${p.name} — Mechanism, Benefits, Research & Synergies | PeptideOpedia`,
    META_DESCRIPTION: `${p.name} (${(p.alternativeNames || []).slice(0, 2).join(', ')}): ${p.description.substring(0, 140)}. Explore mechanism of action, research status, synergistic compounds, and more.`,
    CANONICAL: `https://peptideopedia.com/peptides/${p.slug}`,
    OG_TITLE: `${p.name} — Peptide Profile | PeptideOpedia`,
    OG_DESCRIPTION: p.description.substring(0, 200),
    OG_URL: `https://peptideopedia.com/peptides/${p.slug}`,
    OG_IMAGE: 'https://peptideopedia.com/static/og-peptide.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>\n<script type="application/ld+json">${articleLD}</script>\n<script type="application/ld+json">${faqLD(faqs)}</script>`,
    PEPTIDE_NAME: p.name,
    ALT_NAMES: altNames,
    CATEGORY_TAGS: catLinks,
    DESCRIPTION: p.description,
    MECHANISM: p.mechanismOfAction || 'Research ongoing.',
    BENEFITS_LIST: benefitsList,
    SIDE_EFFECTS_LIST: sideEffectsList,
    AMINO_ACID_SEQ: p.aminoAcidSequence || 'Not yet characterized',
    DOSAGE_NOTES: p.dosageNotes || 'Consult published research literature for study-specific protocols.',
    SYNERGISTIC_LINKS: synLinks || '<span class="none-listed">None currently listed</span>',
    RELATED_LINKS: relatedLinks || '<span class="none-listed">None currently listed</span>',
    QUICK_FACTS: quickFacts.join(''),
    MORE_PEPTIDES: morePeptides,
    REFERENCES: (p.references || []).map((ref, i) => `<li>${ref}</li>`).join(''),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: 'active',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: ''
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
      <div class="card-preview">Includes: ${topPeptides}</div>
    </a>`;
  }).join('');

  const bcLD = breadcrumbLD([
    { name: 'Home', url: '/' },
    { name: 'Categories' }
  ]);

  const html = render('categories-index', {
    TITLE: 'Peptide Categories — Browse by Function & Application | PeptideOpedia',
    META_DESCRIPTION: `Browse ${categories.length} peptide categories organized by biological function. From growth hormone secretagogues to neuroprotective peptides, find the research peptide information you need.`,
    CANONICAL: 'https://peptideopedia.com/categories',
    OG_TITLE: 'Peptide Categories | PeptideOpedia',
    OG_DESCRIPTION: `${categories.length} categories of research peptides organized by biological function and application.`,
    OG_URL: 'https://peptideopedia.com/categories',
    OG_IMAGE: 'https://peptideopedia.com/static/og-categories.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>`,
    CATEGORY_CARDS: cards,
    TOTAL_CATEGORIES: String(categories.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: 'active',
    NAV_ACTIVE_ABOUT: ''
  });

  res.send(html);
});

// Category detail page
app.get('/categories/:id', (req, res) => {
  const cat = categoryById[req.params.id];
  if (!cat) return res.status(404).send(render('404', {
    TITLE: 'Page Not Found | PeptideOpedia',
    META_DESCRIPTION: 'The requested page was not found.',
    CANONICAL: '', OG_TITLE: '', OG_DESCRIPTION: '', OG_URL: '', OG_IMAGE: '',
    EXTRA_HEAD: '<meta name="robots" content="noindex">', JSON_LD: '',
    NAV_ACTIVE_HOME: '', NAV_ACTIVE_PEPTIDES: '', NAV_ACTIVE_CATEGORIES: '', NAV_ACTIVE_ABOUT: ''
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
    "url": `https://peptideopedia.com/categories/${cat.id}`,
    "isPartOf": { "@type": "WebSite", "name": "PeptideOpedia", "url": "https://peptideopedia.com" },
    "numberOfItems": catPeptides.length
  });

  const html = render('category-detail', {
    TITLE: `${cat.name} Peptides — Research Database | PeptideOpedia`,
    META_DESCRIPTION: `${cat.description} Browse ${catPeptides.length} peptides in the ${cat.name} category with detailed profiles, mechanisms, and synergistic compounds.`,
    CANONICAL: `https://peptideopedia.com/categories/${cat.id}`,
    OG_TITLE: `${cat.name} Peptides | PeptideOpedia`,
    OG_DESCRIPTION: `${catPeptides.length} peptides in the ${cat.name} category. ${cat.description}`,
    OG_URL: `https://peptideopedia.com/categories/${cat.id}`,
    OG_IMAGE: 'https://peptideopedia.com/static/og-category.png',
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
    NAV_ACTIVE_ABOUT: ''
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
        p.mechanismOfAction || ''
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
    TITLE: q ? `Search: "${req.query.q}" | PeptideOpedia` : 'Search Peptides | PeptideOpedia',
    META_DESCRIPTION: 'Search the PeptideOpedia database for research peptides by name, category, mechanism of action, or application.',
    CANONICAL: 'https://peptideopedia.com/search',
    OG_TITLE: 'Search Peptides | PeptideOpedia',
    OG_DESCRIPTION: 'Search 100+ research peptides by name, function, or mechanism.',
    OG_URL: 'https://peptideopedia.com/search',
    OG_IMAGE: 'https://peptideopedia.com/static/og-home.png',
    EXTRA_HEAD: '',
    JSON_LD: '',
    SEARCH_QUERY: req.query.q || '',
    SEARCH_RESULTS: resultHTML,
    RESULT_COUNT: String(results.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: ''
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
    TITLE: 'About PeptideOpedia — Peptide Research Reference Database',
    META_DESCRIPTION: 'PeptideOpedia is an independent peptide reference database providing organized, research-backed information on bioactive peptides for researchers, clinicians, and the scientific community.',
    CANONICAL: 'https://peptideopedia.com/about',
    OG_TITLE: 'About PeptideOpedia',
    OG_DESCRIPTION: 'Independent peptide reference database for researchers and the scientific community.',
    OG_URL: 'https://peptideopedia.com/about',
    OG_IMAGE: 'https://peptideopedia.com/static/og-home.png',
    EXTRA_HEAD: '',
    JSON_LD: `<script type="application/ld+json">${bcLD}</script>`,
    TOTAL_PEPTIDES: String(peptides.length),
    TOTAL_CATEGORIES: String(categories.length),
    NAV_ACTIVE_HOME: '',
    NAV_ACTIVE_PEPTIDES: '',
    NAV_ACTIVE_CATEGORIES: '',
    NAV_ACTIVE_ABOUT: 'active'
  });

  res.send(html);
});

// Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const base = 'https://peptideopedia.com';
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/peptides</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/categories</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/search</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${base}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
`;

  categories.forEach(cat => {
    xml += `  <url><loc>${base}/categories/${cat.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  });

  peptides.forEach(p => {
    xml += `  <url><loc>${base}/peptides/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  });

  xml += '</urlset>';
  res.type('application/xml').send(xml);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: https://peptideopedia.com/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
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

// 404 catch-all
app.use((req, res) => {
  res.status(404).send(render('404', {
    TITLE: 'Page Not Found | PeptideOpedia',
    META_DESCRIPTION: 'The requested page was not found on PeptideOpedia.',
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
    NAV_ACTIVE_ABOUT: ''
  }));
});

app.listen(PORT, () => {
  console.log(`PeptideOpedia running on port ${PORT}`);
});
