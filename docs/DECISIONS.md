# Architecture & Design Decision Log (ADR)

**Project:** Creator-Led Literary & Art Publication  
**Date:** 2026-10-14  
**Status:** Approved & Active  

---

## Decision 1: Architecture Stack Selection (Option B)
- **Context:** The publication needs custom editorial layout, preserved bilingual typography (Hindi & English), responsive art viewing, and zero-to-low recurring hosting costs.
- **Decision:** Selected **Option B: Astro (SSG) + Cloudflare Pages**, designed for seamless integration with a headless content service (Sanity / Git-backed) in Phase 2.
- **Consequences:** Provides lightning-fast initial page load, zero runtime server attack surface, generous free tier bandwidth, and complete control over HTML/CSS styling.

---

## Decision 2: Privacy Boundary for Rights and Evidence
- **Context:** The owner wishes to track provenance, copyright notes, and draft works without risking unauthorized public exposure.
- **Decision:** Strictly separate public work records from private internal notes and confidential proof files:
  1. Public datasets and frontend builds contain only declared attribution, public credit notices, and published content.
  2. Confidential provenance documents, identity proofs, or legal draft correspondence will NEVER be uploaded to public CMS media buckets.
- **Consequences:** Eliminates accidental exposure of sensitive personal or legal documentation.

---

## Decision 3: Bilingual and Multi-Script Content Model
- **Context:** Works can be in Hindi (Devanagari script), Hindi (Romanized/Latin script), English, or mixed. Translations may be independent or linked.
- **Decision:** 
  1. Every work explicitly declares `language` (`hi`, `en`, `mixed`) and `script` (`Deva`, `Latn`).
  2. Language is never inferred solely from titles or slugs.
  3. Linked editions reference the corresponding work via `translatedEditionId` or `editionLinks`, establishing reciprocal bidirectional navigation without duplication.
- **Consequences:** Eliminates character encoding mismatches, provides clean canonical URLs for each edition, and supports readers across scripts.

---

## Decision 4: Typography and Devanagari Rendering
- **Context:** Traditional web typography often misrenders complex Hindi conjuncts, diacritics (matras), or creates jarring line-height collisions between Latin and Devanagari glyphs.
- **Decision:**
  - **Editorial Display & Masthead:** `Playfair Display` and `Cinzel` for English; `Rozha One` / `Noto Serif Devanagari` for Hindi literary headlines.
  - **Reading Body (Prose):** `Newsreader` / `Literata` for English; `Noto Serif Devanagari` for Hindi prose with tailored line-height (`1.8` for Devanagari vs `1.65` for Latin).
  - **Poetry:** Preserved monospace or serif rhythm with `white-space: pre-wrap` and `font-variant-ligatures: common-ligatures`.
- **Consequences:** Ensures stunning, respectful rendering of Devanagari literature and English classics side by side.

---

## Decision 5: Reader Customization Isolation
- **Context:** Readers need comfortable reading settings (Light, Dark, Sepia; font scale), but individual reader preferences must never alter global site settings for other visitors.
- **Decision:**
  - Stored purely in the visitor's browser `localStorage`.
  - Applied via `data-theme="light|dark|sepia"` and CSS custom variables on the `<html>` root.
  - Distinct from owner-wide branding and masthead configuration.
- **Consequences:** Zero server-side state needed for reader comfort; completely private to each visitor.

---

## Decision 6: Poetry Whitespace Preservation
- **Context:** Standard HTML reflow and markdown parsers collapse adjacent spaces and wrap short poetic lines arbitrarily.
- **Decision:** All poetry bodies are wrapped in dedicated semantic containers with `white-space: pre-wrap; word-break: break-word;` and strict CSS stanza margins (`margin-block: 1.5rem`).
- **Consequences:** Authorial line breaks and intentional spacing are preserved identically across all screen sizes.

---

## Decision 7: Phase 1 Scope Boundary
- **Context:** The user authorized Phase 1 only.
- **Decision:** Build the complete approved design foundation and interactive prototype with high-fidelity local fixtures in Astro. Do not create external accounts, do not connect external APIs, and do not trigger cloud deployments.
- **Consequences:** Allows full local design review, responsive testing, and accessibility verification before committing to infrastructure.
