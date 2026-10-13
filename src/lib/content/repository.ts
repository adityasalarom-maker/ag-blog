import { workSchema, collectionSchema, creatorSchema, type Work, type Collection, type Creator } from './schema.ts';
import rawWorks from '../../data/seed/works.json' with { type: 'json' };
import rawCollections from '../../data/seed/collections.json' with { type: 'json' };
import rawCreators from '../../data/seed/creators.json' with { type: 'json' };

// In-memory store initialized from seed
let currentWorks: Work[] = rawWorks.map((raw, idx) => {
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
 * Sanitizes a work for public consumption.
 * STRICT PRIVACY RULE: Internal notes and private evidence references are never exposed.
 */
export function sanitizePublicWork(work: Work): Work {
  const { internalNotes, rights, ...rest } = work;
  const { privateEvidenceRef, ...publicRights } = rights;
  return {
    ...rest,
    rights: publicRights as Work['rights']
  };
}

/**
 * Public Data Access: Returns ONLY published works, sanitized of private data.
 * CRITICAL PRIVACY RULE: Drafts and archived items are strictly excluded from public website endpoints.
 */
export function getAllPublishedWorks(): Work[] {
  return currentWorks
    .filter(w => w.status === 'published')
    .map(sanitizePublicWork);
}

/**
 * Public Data Access: Get a single published work by its canonical URL slug.
 * Returns undefined if the work does not exist or is in draft/archived state.
 */
export function getPublishedWorkBySlug(slug: string): Work | undefined {
  const work = currentWorks.find(w => w.slug === slug && w.status === 'published');
  return work ? sanitizePublicWork(work) : undefined;
}

/**
 * Editorial / Admin Access: Get all works including drafts and private notes.
 * Only to be called in authenticated editor environments.
 */
export function getAllWorksAdmin(): Work[] {
  return [...currentWorks];
}

/**
 * Editorial / Admin Access: Get single work by ID (any status, including private notes).
 */
export function getWorkByIdAdmin(id: string): Work | undefined {
  return currentWorks.find(w => w.id === id);
}

/**
 * Editorial / Admin Access: Get single work by slug (any status, including private notes).
 */
export function getWorkBySlugAdmin(slug: string): Work | undefined {
  return currentWorks.find(w => w.slug === slug);
}

/**
 * Synchronize in-memory cache with new work records.
 */
export function reloadWorksInMemory(newWorks: Work[]): void {
  currentWorks = [...newWorks];
}

/**
 * Get published works filtered by content medium.
 */
export function getPublishedWorksByType(type: Work['contentType']): Work[] {
  return currentWorks
    .filter(w => w.contentType === type && w.status === 'published')
    .map(sanitizePublicWork);
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

  const works = currentWorks
    .filter(w => collection.itemSlugs.includes(w.slug) && w.status === 'published')
    .map(sanitizePublicWork);

  return { collection, works };
}

/**
 * Resolves the companion translation edition of a published work.
 */
export function getCompanionTranslation(work: Work): Work | undefined {
  if (!work.translatedEditionSlug) return undefined;
  const companion = currentWorks.find(w => w.slug === work.translatedEditionSlug && w.status === 'published');
  return companion ? sanitizePublicWork(companion) : undefined;
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
