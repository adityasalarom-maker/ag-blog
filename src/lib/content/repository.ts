import { workSchema, collectionSchema, creatorSchema, type Work, type Collection, type Creator } from './schema.ts';
import rawWorks from '../../data/seed/works.json' with { type: 'json' };
import rawCollections from '../../data/seed/collections.json' with { type: 'json' };
import rawCreators from '../../data/seed/creators.json' with { type: 'json' };

// Validate and parse raw seed records at module initialization
const validatedWorks: Work[] = rawWorks.map((raw, idx) => {
  const result = workSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`[Content Validation Error] in works.json at index ${idx} (id: ${raw?.id}): ${result.error.message}`);
  }
  return result.data;
});

const validatedCollections: Collection[] = rawCollections.map((raw, idx) => {
  const result = collectionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`[Content Validation Error] in collections.json at index ${idx} (slug: ${raw?.slug}): ${result.error.message}`);
  }
  return result.data;
});

const validatedCreators: Creator[] = rawCreators.map((raw, idx) => {
  const result = creatorSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`[Content Validation Error] in creators.json at index ${idx} (id: ${raw?.id}): ${result.error.message}`);
  }
  return result.data;
});

/**
 * Public Data Access: Returns ONLY published works.
 * CRITICAL PRIVACY RULE: Drafts and archived items are strictly excluded from public website endpoints.
 */
export function getAllPublishedWorks(): Work[] {
  return validatedWorks.filter(w => w.status === 'published');
}

/**
 * Public Data Access: Get a single published work by its canonical URL slug.
 * Returns null if the work does not exist or is in draft/archived state.
 */
export function getPublishedWorkBySlug(slug: string): Work | undefined {
  return validatedWorks.find(w => w.slug === slug && w.status === 'published');
}

/**
 * Editorial / Admin Access: Get all works including drafts.
 * Only to be called in authenticated editor environments or test harnesses.
 */
export function getAllWorksAdmin(): Work[] {
  return [...validatedWorks];
}

/**
 * Get published works filtered by content medium.
 */
export function getPublishedWorksByType(type: Work['contentType']): Work[] {
  return validatedWorks.filter(w => w.contentType === type && w.status === 'published');
}

/**
 * Get all curated collections.
 */
export function getAllCollections(): Collection[] {
  return [...validatedCollections];
}

/**
 * Get single collection by slug with only published works resolved.
 */
export function getCollectionBySlug(slug: string): { collection: Collection; works: Work[] } | undefined {
  const collection = validatedCollections.find(c => c.slug === slug);
  if (!collection) return undefined;

  const works = validatedWorks.filter(w => 
    collection.itemSlugs.includes(w.slug) && w.status === 'published'
  );

  return { collection, works };
}

/**
 * Resolves the companion translation edition of a published work.
 */
export function getCompanionTranslation(work: Work): Work | undefined {
  if (!work.translatedEditionSlug) return undefined;
  return validatedWorks.find(w => w.slug === work.translatedEditionSlug && w.status === 'published');
}

/**
 * Primary Creator profile.
 */
export function getPrimaryCreator(): Creator {
  return validatedCreators[0];
}

/**
 * Search published works by keyword and optional content filters.
 */
export function searchPublishedWorks(options: {
  query?: string;
  contentType?: string;
  language?: string;
}): Work[] {
  const query = (options.query || '').trim().toLowerCase();
  const type = options.contentType || 'all';
  const lang = options.language || 'all';

  return getAllPublishedWorks().filter(work => {
    const matchesQuery = !query ||
      work.title.toLowerCase().includes(query) ||
      work.excerpt.toLowerCase().includes(query) ||
      (work.body && work.body.toLowerCase().includes(query)) ||
      work.tags.some(t => t.toLowerCase().includes(query)) ||
      work.creator.toLowerCase().includes(query);

    const matchesType = type === 'all' || work.contentType === type;
    const matchesLang = lang === 'all' || `${work.language}-${work.script}` === lang;

    return matchesQuery && matchesType && matchesLang;
  });
}
