# PeptideKnow.com — SEO & AI Optimization Rules

> Master reference for all SEO, structured data, and AI optimization rules.
> Every page, every feature, every new content piece must follow these rules.

---

## Table of Contents

1. [Domain & URL Architecture](#1-domain--url-architecture)
2. [Meta Tags — Every Page](#2-meta-tags--every-page)
3. [Structured Data (JSON-LD)](#3-structured-data-json-ld)
4. [Content Rules](#4-content-rules)
5. [Internal Linking](#5-internal-linking)
6. [Image Optimization](#6-image-optimization)
7. [Page-Type Specific Rules](#7-page-type-specific-rules)
8. [Sitemap & Robots](#8-sitemap--robots)
9. [AI Bot Optimization](#9-ai-bot-optimization)
10. [RSS Feed](#10-rss-feed)
11. [Performance & Technical SEO](#11-performance--technical-seo)
12. [Blog Post Checklist](#12-blog-post-checklist)
13. [New Peptide Profile Checklist](#13-new-peptide-profile-checklist)
14. [Keyword Strategy](#14-keyword-strategy)
15. [Prohibited Practices](#15-prohibited-practices)

---

## 1. Domain & URL Architecture

### Domain
- **Canonical domain**: `https://www.peptideknow.com`
- **Non-www redirect**: `http(s)://peptideknow.com` → 301 to `https://www.peptideknow.com`
- **HTTPS enforced**: All HTTP → 301 to HTTPS
- **Trailing slashes**: No trailing slashes (canonical URLs never end with `/` except root)

### URL Patterns
| Page Type | Pattern | Example |
|-----------|---------|---------|
| Homepage | `/` | `https://www.peptideknow.com/` |
| Peptide List | `/peptides` | |
| Peptide Detail | `/peptides/{slug}` | `/peptides/bpc-157` |
| Category List | `/categories` | |
| Category Detail | `/categories/{slug}` | `/categories/growth-hormone-secretagogues` |
| Blog Index | `/blog` | |
| Blog Post | `/blog/{slug}` | `/blog/brp-stanford-ai-peptide-ozempic-alternative` |
| Guide | `/guides/{slug}` | `/guides/reconstitution` |
| Calculator | `/tools/calculator` | |
| About | `/about` | |
| Search | `/search?q={query}` | |

### Slug Rules
- All lowercase
- Hyphens only (no underscores, no spaces)
- Descriptive and keyword-rich
- No stop words unless necessary for readability
- Blog slugs should target primary keyword: `{primary-keyword}-{secondary-keyword}`
- Peptide slugs match the common name: `bpc-157`, `semaglutide`, `brp-brinp2-peptide`
- **NEVER use `/#/` hash routing** — all pages are server-rendered for indexability

---

## 2. Meta Tags — Every Page

Every page MUST include all of the following meta tags:

```html
<!-- Required -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{unique 150-160 char description with primary keyword}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="{full canonical URL}">

<!-- Open Graph -->
<meta property="og:type" content="{website|article}">
<meta property="og:site_name" content="PeptideKnow">
<meta property="og:title" content="{page title}">
<meta property="og:description" content="{same or slightly different from meta description}">
<meta property="og:url" content="{canonical URL}">
<meta property="og:image" content="{absolute URL to 1200x675+ image}">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{page title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{absolute URL to image}">

<!-- Additional -->
<meta name="author" content="PeptideKnow">
<meta name="publisher" content="PeptideKnow">
<meta name="rating" content="general">
<meta name="revisit-after" content="7 days">
<meta http-equiv="content-language" content="en">
<meta name="theme-color" content="#ffffff">
```

### Title Tag Rules
- Format: `{Page Title} | PeptideKnow` (max 60 chars)
- Peptide pages: `{Peptide Name} — Peptide Profile | PeptideKnow`
- Blog posts: `{Article Title}` (no suffix needed, keep under 60 chars)
- Category pages: `{Category Name} Peptides | PeptideKnow`
- Guides: `{Guide Title} — Peptide Guide | PeptideKnow`
- Primary keyword MUST appear in first 30 characters of title

### Meta Description Rules
- 150–160 characters
- Include primary keyword naturally
- Include a value proposition or differentiator
- Unique per page — never duplicate descriptions
- Blog posts: summarize the key finding or takeaway
- Peptide pages: `{Name} ({aliases}): {first sentence of overview}. Explore mechanism, dosage, stacking, and more.`

---

## 3. Structured Data (JSON-LD)

Every page type has specific schema.org JSON-LD requirements:

### All Pages
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

### Homepage
- `WebSite` schema with `SearchAction` (sitelinks searchbox)
- `Organization` schema with name, URL, logo

### Peptide Detail Pages
- `MedicalWebPage` with nested `Drug` entity
- `FAQPage` with at least 3 Q&As:
  - "What is {peptide}?"
  - "What are the potential benefits of {peptide}?"
  - "What compounds work synergistically with {peptide}?"
  - "What is the typical dosage for {peptide}?"
- Drug entity includes: `name`, `alternateName`, `description`, `mechanismOfAction`

### Blog Posts
- `NewsArticle` (not `BlogPosting`) for Google News eligibility
- Required fields: `headline`, `description`, `url`, `datePublished`, `dateModified`, `image` (with width/height/caption), `author`, `publisher` (with logo), `mainEntityOfPage`, `keywords`, `articleSection`, `wordCount`
- `FAQPage` schema for any FAQ sections in the post
- Image must be `ImageObject` with `url`, `width`, `height`, `caption`

### Category Pages
- `CollectionPage` schema
- `ItemList` with `ListItem` entries for each peptide

### Guides
- `HowTo` or `Article` schema depending on content type

---

## 4. Content Rules

### Heading Hierarchy
- **One H1 per page** — always the peptide name, article title, or page title
- H2s for major sections
- H3s for subsections within H2s
- Never skip levels (no H1 → H3)
- Include keywords in H2s naturally

### Peptide Profile Content Requirements
Every peptide MUST have:
- [ ] Overview (200+ words, unique, not copied from other sources)
- [ ] Mechanism of Action (detailed, pathway-specific)
- [ ] Benefits list (at minimum 3 items)
- [ ] Dosage section (with typical range, frequency, notes)
- [ ] Routes of Administration (with bioavailability notes)
- [ ] Stacking Protocols (at least 1, with named stack and compounds)
- [ ] Reconstitution instructions (for injectables)
- [ ] Amino Acid Sequence (or "Not yet characterized" for pre-clinical)
- [ ] Side Effects
- [ ] Safety & Contraindications (with severity levels)
- [ ] Pharmacokinetics (half-life, storage, bioavailability)
- [ ] Quick Facts sidebar (molecular weight, sequence length, CAS, PubChem CID)
- [ ] Regulatory status badge
- [ ] Related/synergistic peptide cross-links
- [ ] References section with DOIs/URLs

### Blog Post Content Requirements
- **1,500–3,000 words** minimum
- Section IDs on all H2s for TOC navigation
- FAQ section with `<details>/<summary>` accordions
- At least 5 internal links to peptide profiles
- At least 3 external source links with real URLs
- Comparison tables where applicable
- **Every blog post gets its own unique hero image** — never reuse images from other posts
- `imageAlt` must be descriptive (not just the article title)

### Content Quality
- All medical claims must cite sources
- "Research suggests" / "Studies indicate" — never "This peptide cures/treats"
- Always include safety disclaimers where applicable
- "This information is for educational purposes only. Consult a qualified healthcare provider before using any peptide."
- First-person plural ("We examined...") or neutral third-person — never second-person imperatives
- No AI-generated filler text — every paragraph must add value

---

## 5. Internal Linking

### Minimum Link Requirements
| Page Type | Min Internal Links |
|-----------|-------------------|
| Peptide Detail | 8+ (related peptides, synergistic compounds, category pages, guides) |
| Blog Post | 5+ (to peptide profiles, related posts, guides) |
| Category Page | All peptides in category + related categories |
| Guide | 10+ (to specific peptides mentioned, related guides) |
| Homepage | Links to all categories, trending peptides, latest blog |

### Cross-Linking Rules
- Every peptide profile links to its synergistic compounds' profiles
- Every peptide profile links to its category page
- Every blog post links to every peptide it mentions
- Guide pages link to specific peptide examples
- Category pages link to all member peptides + related categories
- Footer includes links to all major sections

### Anchor Text
- Use the peptide name as anchor text: `<a href="/peptides/bpc-157">BPC-157</a>`
- For guides: descriptive anchor text matching the guide topic
- Avoid generic anchors ("click here", "learn more", "read more")
- Vary anchor text — don't always use the exact same text for the same link

---

## 6. Image Optimization

### Image Rules
- **Every blog post gets a unique hero image** — NEVER reuse the same image across posts
- All images must have descriptive `alt` text (not just the title)
- All images must have explicit `width` and `height` attributes
- Use `loading="lazy"` on all images below the fold
- Hero images: 16:9 aspect ratio, minimum 1200x675px
- OG images: minimum 1200x630px
- Format: PNG for quality, WebP for performance (serve both where possible)
- File naming: `blog-{topic-slug}.png`, `category-{slug}.png`

### Image Alt Text Rules
- Describe what's in the image, not the article title
- Include relevant keywords naturally
- 125 characters max
- Good: `"Molecular peptide structure floating above a brain model in a neuroscience laboratory"`
- Bad: `"BRP blog post image"` or `"blog-image-1"`

### OG Image Rules
- Every page type has its own OG image or shares a page-type-specific default:
  - Homepage: `/static/og-home.png`
  - Peptide pages: `/static/og-peptide.png` (or custom per-peptide if available)
  - Blog posts: The blog post's unique hero image
  - Category pages: `/static/og-category.png`
- All OG image URLs must be absolute: `https://www.peptideknow.com/static/images/...`

---

## 7. Page-Type Specific Rules

### Homepage
- Dynamic stats (peptide count, category count, dosage count, stack count)
- Trending peptides section with top 8 by popularity
- Recent peptides section
- Category grid with images
- Hero section with search input (SearchAction schema)

### Peptide A-Z Page (`/peptides`)
- All peptides listed alphabetically
- Filterable by category
- Each card shows: name, aliases, category tags, dosage preview, route tags
- Pagination or infinite scroll with indexable pages

### Category Pages
- Description of the category
- All member peptides listed as cards
- Related categories linked
- `CollectionPage` + `ItemList` schema

### Blog Index
- Reverse chronological order
- Post cards with: image, title, subtitle, date, category, read time, excerpt
- Category filter
- RSS link in `<head>`: `<link rel="alternate" type="application/rss+xml" title="PeptideKnow" href="/blog/rss.xml">`

---

## 8. Sitemap & Robots

### Sitemap (`/sitemap.xml`)
- Auto-generated, includes ALL indexable pages
- Must include `<lastmod>` for every URL
- Must include `<changefreq>` and `<priority>`
- Priority hierarchy:
  - Homepage: 1.0
  - Peptide list: 0.9
  - Blog index: 0.9
  - Category list: 0.8
  - Peptide detail pages: 0.8
  - Blog posts: 0.7
  - Category detail pages: 0.7
  - Guides: 0.7
  - Calculator: 0.6
  - About: 0.5
- Images included via `<image:image>` extension
- Blog post images with `<image:caption>` using `imageAlt`
- Total current URLs: 151

### Robots.txt (`/robots.txt`)
- `Allow: /` for all bots
- `Crawl-delay: 1` for default user-agent
- Sitemap URL included
- AI crawlers explicitly allowed (see AI section below)
- No `Disallow` rules for any indexable content

### 301 Redirects
- If a peptide slug changes, add a 301 redirect from old to new
- If a blog post slug changes, add a 301 redirect
- Never delete a URL — redirect it

---

## 9. AI Bot Optimization

### AI Crawler Access
All AI crawlers are explicitly allowed in `robots.txt`:
```
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Bytespider
Allow: /
```

### llms.txt Standard
- `/llms.txt` — Concise site description with main page links
- `/llms-full.txt` — Extended version with all peptide profiles listed
- Updated automatically when new peptides or pages are added
- Format follows the [llms.txt specification](https://llmstxt.org/):
  - `# Site Name` header
  - `> Description` blockquote
  - `## Section` headers with `- Page Name: URL` links

### AI-Friendly Content Patterns
- Use clear, factual language that AI models can reliably extract
- Structured data (JSON-LD) helps AI models understand entity relationships
- FAQ sections are especially AI-friendly — they mirror how users query AI assistants
- Tables with clear headers are preferred over prose for comparative data
- Include the peptide name in the first sentence of every section

---

## 10. RSS Feed

- **URL**: `/blog/rss.xml`
- **Format**: RSS 2.0 with Dublin Core, Atom, and Media RSS extensions
- **Auto-generated** from `blog-posts.json`
- Includes: title, link, guid, pubDate, creator, category, description (CDATA excerpt), media:content (image)
- `<link rel="alternate" type="application/rss+xml" ...>` in blog template `<head>`
- Sorted by `datePublished` descending

---

## 11. Performance & Technical SEO

### Page Speed
- Server-rendered HTML (no client-side rendering for content)
- CSS loaded in `<head>` (render-blocking is acceptable for single stylesheet)
- JavaScript deferred where possible
- Images lazy-loaded below the fold
- Express static files served with `maxAge` cache headers
- Gzip/Brotli compression enabled

### Mobile
- Responsive design — mobile-first CSS
- Viewport meta tag on every page
- Touch-friendly tap targets (min 44x44px)
- No horizontal scroll
- Readable font sizes (min 14px body text)

### Core Web Vitals Targets
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- All images have explicit `width`/`height` to prevent layout shifts

### Server
- Express.js on Railway (auto-deploy from GitHub)
- No hash-based routing (`/#/`) — all routes are server-rendered
- 404 page returns proper 404 status code
- Canonical URLs served without trailing slashes

---

## 12. Blog Post Checklist

Before publishing any new blog post, verify:

- [ ] **Unique slug** — SEO-optimized, keyword-rich, no duplicates
- [ ] **Title** — under 60 chars, primary keyword in first 30 chars
- [ ] **Subtitle** — compelling, different from title
- [ ] **Meta description** — 150-160 chars, includes primary keyword
- [ ] **Unique hero image** — NEVER reuse from another post
- [ ] **Image alt text** — descriptive, includes keywords
- [ ] **Category** — matches existing blog categories
- [ ] **Tags/keywords** — 10-15 relevant keywords
- [ ] **Author** — `PeptideKnow Editorial`
- [ ] **Date** — `YYYY-MM-DD` format
- [ ] **Read time** — accurate word count / 200
- [ ] **Body HTML** file created in `data/` directory
- [ ] **Section IDs** on all H2s for TOC navigation
- [ ] **5+ internal links** to peptide profiles
- [ ] **3+ external source links** with real URLs
- [ ] **FAQ section** with `<details>/<summary>` pattern
- [ ] **Tables** for comparison data
- [ ] **References section** with numbered citations and URLs
- [ ] **JSON-LD** — `NewsArticle` schema auto-generated by server
- [ ] **FAQ schema** — `FAQPage` auto-generated from body HTML
- [ ] **OG tags** — verified with correct unique image URL
- [ ] **Sitemap** — auto-included
- [ ] **RSS** — auto-included
- [ ] `blog-posts.json` updated with `bodyFile` reference

---

## 13. New Peptide Profile Checklist

Before adding any new peptide:

- [ ] **Unique slug** — lowercase, hyphenated, matches common name
- [ ] **Name** — full common name
- [ ] **Aliases** — all known alternate names
- [ ] **Categories** — at least one, max three
- [ ] **Overview** — 200+ words, unique content
- [ ] **Mechanism** — pathway-specific detail
- [ ] **Benefits** — at least 3 items
- [ ] **Dosage** — object with `standard`, `typical_range`, `frequency`, `notes`
- [ ] **Routes of Administration** — array of objects with `route`, `bioavailability`, `notes`
- [ ] **Stacking Protocols** — at least 1 protocol with named compounds
- [ ] **Reconstitution** — object with `solvent`, `ratio`, `notes` (for injectables)
- [ ] **Half-life** — string value
- [ ] **Storage** — string with temperature and conditions
- [ ] **Regulatory Status** — one of: `fda-approved`, `fda-category-2`, `clinical-trials`, `research-only`, `pre-clinical`
- [ ] **Contraindications** — array of objects with `severity`, `condition`, `description`
- [ ] **Drug Interactions** — array (can be empty if none known)
- [ ] **FDA Safety Notes** — string or null
- [ ] **Clinical Trial Status** — string describing current trial phase
- [ ] **Pharmacokinetics** — object with relevant PK data
- [ ] **Amino Acid Sequence** — string or "Not yet characterized"
- [ ] **Molecular Weight** — string with units
- [ ] **CAS Number** — if available
- [ ] **PubChem CID** — if available, linked to PubChem
- [ ] **Side Effects** — array of known/potential effects
- [ ] **Related Peptides** — cross-links to synergistic compounds
- [ ] **References** — at least 1 with DOI or URL

---

## 14. Keyword Strategy

### Primary Target Keywords per Page Type
- Homepage: "peptide encyclopedia", "peptide database", "peptide reference"
- Peptide pages: `{peptide name}`, `{peptide name} dosage`, `{peptide name} benefits`, `{peptide name} side effects`
- Blog posts: topic-specific long-tail keywords
- Category pages: `{category name} peptides`
- Guides: `how to {topic}`, `{topic} guide`

### Long-Tail Keyword Patterns
- `{peptide} dosage protocol`
- `{peptide} vs {peptide}` (comparison)
- `{peptide} side effects`
- `{peptide} reconstitution guide`
- `{peptide} stacking protocol`
- `{peptide} mechanism of action`
- `{peptide} FDA status`
- `{peptide} contraindications`
- `best peptides for {condition/goal}`
- `{peptide} half life`

### Keyword Placement
1. Title tag (first 30 chars)
2. H1 heading
3. First paragraph of content
4. Meta description
5. URL slug
6. Image alt text
7. At least one H2 subheading
8. Internal link anchor text from other pages

---

## 15. Prohibited Practices

**NEVER do any of the following:**

- [ ] **Hash routing** (`/#/pages`) — all pages must be server-rendered
- [ ] **Duplicate meta descriptions** across pages
- [ ] **Reuse hero images** between blog posts
- [ ] **Keyword stuffing** — don't unnaturally repeat keywords
- [ ] **Thin content** — every page must have substantial unique content
- [ ] **Broken links** — check all internal and external links
- [ ] **Missing alt text** on any image
- [ ] **Missing canonical tags** on any page
- [ ] **Missing structured data** on any page
- [ ] **Client-side-only rendering** — all content must be in the initial HTML
- [ ] **Generic anchor text** ("click here", "read more")
- [ ] **Orphan pages** — every page must be linked from at least one other page
- [ ] **Duplicate content** — no two pages should have substantially similar content
- [ ] **Missing H1** on any page
- [ ] **Multiple H1s** on any page
- [ ] **Blocking AI crawlers** — keep all AI bots allowed
- [ ] **Missing 301 redirects** when changing URLs
- [ ] **HTTP (non-HTTPS) links** to own domain
- [ ] **AI-looking design** — the site must look institutional, not generated

---

## Quick Reference: File Locations

| Asset | Path |
|-------|------|
| Peptide data | `data/peptides.json` |
| Blog posts metadata | `data/blog-posts.json` |
| Blog post bodies | `data/blog-{slug}-body.html` |
| Templates | `templates/*.html` |
| CSS | `public/style.css` |
| Images | `public/images/` |
| Server routes & rendering | `server.js` |
| Sitemap | Auto-generated at `/sitemap.xml` |
| Robots | Auto-generated at `/robots.txt` |
| llms.txt | Auto-generated at `/llms.txt` |
| RSS | Auto-generated at `/blog/rss.xml` |
| Enrichment scripts | `enrich-*.js` |

---

*Last updated: April 18, 2026*
*Total peptides: 114 | Total sitemap URLs: 151 | Total blog posts: 2*
