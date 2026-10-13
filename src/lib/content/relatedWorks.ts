import type { Work } from './schema.ts';
import { getAllPublishedWorks } from './repository.ts';

/**
 * Calculates a relevancy score between two works.
 * Emphasizes shared collections, linked translations, shared tags, and complementary medium.
 */
export function calculateRelevance(source: Work, candidate: Work): number {
  if (source.id === candidate.id || source.slug === candidate.slug) return -1;
  if (candidate.status !== 'published') return -1;

  let score = 0;

  // 1. Direct translation companion (+15 points)
  if (
    source.translatedEditionSlug === candidate.slug ||
    candidate.translatedEditionSlug === source.slug
  ) {
    score += 15;
  }

  // 2. Shared Curated Collections (+8 points per shared collection)
  if (source.collectionSlugs && candidate.collectionSlugs) {
    const sharedCollections = source.collectionSlugs.filter(c =>
      candidate.collectionSlugs!.includes(c)
    );
    score += sharedCollections.length * 8;
  }

  // 3. Shared Tags (+3 points per shared tag)
  if (source.tags && candidate.tags) {
    const sharedTags = source.tags.filter(t => 
      candidate.tags.some(ct => ct.toLowerCase() === t.toLowerCase())
    );
    score += sharedTags.length * 3;
  }

  // 4. Same Content Type (+2 points)
  if (source.contentType === candidate.contentType) {
    score += 2;
  }

  // 5. Same Creator / Author (+2 points)
  if (source.creator === candidate.creator) {
    score += 2;
  }

  // 6. Opposite language (encourages bilingual cross-reading) (+1 point)
  if (source.language !== candidate.language && candidate.language !== 'mixed') {
    score += 1;
  }

  return score;
}

/**
 * Returns top N related published works for a given work.
 * Strictly returns ONLY published works and excludes the current work.
 */
export function getRelatedWorks(work: Work, limit = 3): Work[] {
  const published = getAllPublishedWorks();

  const scored = published
    .map(candidate => ({
      work: candidate,
      score: calculateRelevance(work, candidate)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // If not enough scored items, fallback to published works of similar or diverse mediums
  if (scored.length < limit) {
    const existingIds = new Set([work.id, ...scored.map(s => s.work.id)]);
    const fallback = published.filter(w => !existingIds.has(w.id));
    return [...scored.map(s => s.work), ...fallback].slice(0, limit);
  }

  return scored.slice(0, limit).map(s => s.work);
}
