import { 
  getAllPublishedWorks, 
  getAllCollections, 
  getPublishedWorkBySlug, 
  getCollectionBySlug 
} from '../lib/content/repository.ts';

export type { Work, Collection, Creator, RightsDeclaration, QuoteSource, ArtworkDetails } from '../lib/content/schema.ts';

export const PUBLICATION_INFO = {
  name: "Antigravity Review",
  nameHi: "एंटीग्रेविटी समीक्षा",
  tagline: "A Bilingual Journal of Poetry, Ideas & Visual Arts",
  taglineHi: "कविता, विचार और दृश्य कला की द्विभाषी पत्रिका",
  editor: "A. G. Varma",
  editorHi: "ए. जी. वर्मा",
  description: "A sanctuary for contemplative reading, fine typography, and bilingual literary expression in Hindi and English.",
  foundedYear: 2026,
  rightsNotice: "All literary and artwork rights are explicitly declared by the creator. Unauthorised duplication prohibited."
};

/**
 * Public Works: Strictly returns published items.
 * Draft and archived works in seed store are automatically filtered out.
 */
export const WORKS = getAllPublishedWorks();

/**
 * Public Collections: Curated thematic anthologies.
 */
export const COLLECTIONS = getAllCollections();

export { getPublishedWorkBySlug, getCollectionBySlug };
