# Architecture Options & Evaluation — Literary & Visual-Art Publication

**Date Evaluated:** 2026-10-14  
**Evaluator:** Antigravity Senior Software Architect  
**Status:** Architecture Decision Approved by Owner (Option B Selected)  

---

## 1. Option Comparison Overview

| Dimension | Option A: Hosted All-in-One CMS (Ghost / WordPress.com) | Option B: Astro Static Site + Headless CMS + Cloudflare Pages (Approved) | Option C: Custom Full-Stack SSR (Next.js + PostgreSQL / Supabase) |
|---|---|---|---|
| **Core Architecture** | Managed SaaS runtime with prebuilt themes. | Modern SSG front-end with decoupled content service and edge CDN hosting. | Dynamic fullstack application with custom database schemas and server runtime. |
| **Bilingual & Script Support** | Difficult without paid plugins or duplicate blog instances. | Native i18n routing, arbitrary custom typography tokens for Devanagari and Latin. | Fully customizable, but high boilerplate for routing and caching. |
| **Custom Visual & Literary UX** | Constrained by CMS theme engine; hard to do custom art lightbox and reader palettes cleanly. | 100% fine-grained control over HTML/CSS, dialogs, reader theme toggles, and poetry whitespace. | 100% control, but heavy client-side JavaScript runtime overhead. |
| **Initial Cost & Free Tier** | Free plans carry platform branding, strict subdomains, or limit custom CSS/code injection. | **Zero cost.** Cloudflare Pages offers unlimited static bandwidth and 500 builds/mo. Sanity free tier covers up to 100k API requests and 10GB assets. | Supabase / Neon free tiers sleep after inactivity or impose strict row/bandwidth caps. |
| **Privacy & Security** | Vendor managed; drafts stay in admin, but custom data separation is rigid. | SSG strips all private tokens. Drafts excluded at build time. Private evidence stored outside public datasets. | Custom auth and Row Level Security (RLS) required; high maintenance burden. |
| **Portability & Export** | Vendor XML or JSON export; themes non-transferable. | **High portability:** Pure Markdown/JSON content files and standard Astro components. | High schema portability (SQL), but code lock-in to hosting framework. |
| **Maintenance Burden** | Low server maintenance, but fighting platform styling limitations. | **Minimal:** Zero runtime server vulnerabilities; edge CDN handles traffic spikes effortlessly. | High: database migrations, security patches, connection pooling, and uptime monitoring. |

---

## 2. In-Depth Evaluation of Option B (Selected & Approved)

### 2.1 Front-End Layer: Astro SSG
- **Why Astro:** Generates zero-JS by default, hydrates interactive islands only where needed (e.g., Theme/Font Switcher, Lightbox Zoom Modal, Client-side Search).
- **Poetry & Typography Integrity:** Native support for `@fontsource/noto-serif-devanagari`, `Playfair Display`, and `Newsreader`. CSS utility tokens preserve exact whitespace (`white-space: pre-wrap; font-variant-ligatures: common-ligatures`).
- **Content Collections:** Strict TypeScript schema validation for content frontmatter (`zod` schema), ensuring every poem, essay, quotation, or artwork conforms to the content model at build time.

### 2.2 Content Management Layer (Phase 2 Integration)
- **Local Fixtures in Phase 1:** Rapid development and testing without premature cloud dependencies.
- **Sanity Headless CMS in Phase 2:** Rich visual editing studio for the owner, structured block-content editor for prose, dedicated media asset pipeline.
- **Privacy Boundary Enforced:**
  - *Public Dataset:* Published poems, stories, thoughts, public quotations, and artwork metadata.
  - *Private Boundary:* Private internal editor notes and copyright provenance evidence are stored locally or in a private, non-public store. Never uploaded to public asset CDNs.

### 2.3 Hosting & Delivery: Cloudflare Pages
- **Free Tier Specifications (Verified 2026-10-14):**
  - Unlimited static requests and bandwidth.
  - 500 build runs per month (plenty for creator-led publishing rhythms).
  - Global edge CDN with automated TLS certificates and preview deployments.
  - Direct Git-triggered builds.

---

## 3. Quota & Upgrade Risk Analysis

1. **Cloudflare Pages:** 500 builds/month translates to ~16 published changes per day. If the owner publishes more frequently, webhook batching or local manual builds deployable via Wrangler CLI can be used without paid tiers.
2. **Sanity Free Plan:** 2 public datasets, 100,000 API requests/month, 10 GB media asset bandwidth. For a personal literary site with optimized WebP/AVIF images, this easily handles tens of thousands of monthly visitors.
3. **Asset Privacy Caveat:** As confirmed in Sanity documentation, asset URLs uploaded to Sanity are unauthenticated. **Mitigation:** Confidential copyright proofs, identity records, and private correspondence will NEVER be uploaded to Sanity assets.

---

## 4. Fallback Architecture
If headless CMS quotas or asset privacy concerns become a bottleneck in later phases, the fallback is **Git-based Flat-File CMS (Decap CMS / Front Matter CMS / Keystatic)** operating on Markdown and JSON files in the private Git repository. This requires zero external databases, zero paid subscriptions, and offers 100% data sovereignty.
