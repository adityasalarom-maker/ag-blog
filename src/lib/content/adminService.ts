import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { workSchema, type Work } from './schema.ts';
import { getAllWorksAdmin, reloadWorksInMemory } from './repository.ts';

const SEED_FILE_PATH = path.resolve(process.cwd(), 'src/data/seed/works.json');

/**
 * Reads the latest raw works from the JSON seed file on disk.
 */
function readWorksFromDisk(): Work[] {
  try {
    const raw = fs.readFileSync(SEED_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.map((item: unknown, idx: number) => {
      const res = workSchema.safeParse(item);
      if (!res.success) {
        throw new Error(`[Admin Content Error] Record at index ${idx} is invalid: ${res.error.message}`);
      }
      return res.data;
    });
  } catch (err) {
    console.warn(`[Admin Service] Falling back to in-memory repository: ${(err as Error).message}`);
    return getAllWorksAdmin();
  }
}

/**
 * Safely writes works array to the JSON seed file and updates repository cache.
 */
function writeWorksToDisk(works: Work[]): void {
  // Validate all records before saving
  for (let i = 0; i < works.length; i++) {
    const res = workSchema.safeParse(works[i]);
    if (!res.success) {
      throw new Error(`Cannot save invalid work at index ${i} (${works[i].id}): ${res.error.message}`);
    }
  }

  const jsonContent = JSON.stringify(works, null, 2);
  const tempPath = `${SEED_FILE_PATH}.tmp`;
  fs.writeFileSync(tempPath, jsonContent, 'utf-8');
  fs.renameSync(tempPath, SEED_FILE_PATH);

  // Synchronize in-memory repository cache immediately
  reloadWorksInMemory(works);
}

/**
 * List all works with optional filters for status, contentType, or search term.
 */
export function getAdminWorks(filters?: {
  status?: string;
  contentType?: string;
  search?: string;
}): Work[] {
  const works = readWorksFromDisk();
  if (!filters) return works;

  return works.filter(w => {
    const matchStatus = !filters.status || filters.status === 'all' || w.status === filters.status;
    const matchType = !filters.contentType || filters.contentType === 'all' || w.contentType === filters.contentType;
    const q = (filters.search || '').trim().toLowerCase();
    const matchSearch = !q ||
      w.title.toLowerCase().includes(q) ||
      w.slug.toLowerCase().includes(q) ||
      w.creator.toLowerCase().includes(q) ||
      w.tags.some(t => t.toLowerCase().includes(q));

    return matchStatus && matchType && matchSearch;
  });
}

/**
 * Get work by stable internal ID.
 */
export function getAdminWorkById(id: string): Work | undefined {
  const works = readWorksFromDisk();
  return works.find(w => w.id === id);
}

/**
 * Get work by canonical URL slug.
 */
export function getAdminWorkBySlug(slug: string): Work | undefined {
  const works = readWorksFromDisk();
  return works.find(w => w.slug === slug);
}

/**
 * Auto-slugifies a title string.
 */
export function generateSlug(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return cleaned || `work-${Date.now()}`;
}

/**
 * Create a new literary or visual artwork.
 */
export function createWork(input: Partial<Work>): Work {
  const works = readWorksFromDisk();
  const now = new Date().toISOString();

  const slug = (input.slug || generateSlug(input.title || 'untitled')).toLowerCase();
  
  // Ensure slug uniqueness
  let finalSlug = slug;
  let counter = 1;
  while (works.some(w => w.slug === finalSlug)) {
    finalSlug = `${slug}-${counter++}`;
  }

  const id = input.id || `work-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const candidateWork: Work = {
    id,
    title: input.title || 'Untitled Work',
    slug: finalSlug,
    contentType: input.contentType || 'poem',
    language: input.language || 'hi',
    script: input.script || 'Deva',
    creator: input.creator || 'A. G. Varma',
    excerpt: input.excerpt || 'Excerpt pending editorial formulation.',
    body: input.body || '',
    coverImage: input.coverImage,
    coverAlt: input.coverAlt,
    status: input.status || 'draft',
    publishedAt: input.publishedAt || now,
    updatedAt: now,
    tags: input.tags || [],
    categories: input.categories || ['Literary'],
    collectionSlugs: input.collectionSlugs,
    translatedEditionSlug: input.translatedEditionSlug,
    translatedEditionTitle: input.translatedEditionTitle,
    translatedEditionLang: input.translatedEditionLang,
    readingTimeMinutes: input.readingTimeMinutes || (input.body ? Math.max(1, Math.round(input.body.split(/\s+/).length / 180)) : undefined),
    quoteSource: input.quoteSource,
    artworkDetails: input.artworkDetails,
    rights: input.rights || {
      declaredBy: input.creator || 'A. G. Varma',
      declarationType: 'Original Creator',
      status: 'Creator-Declared',
      notice: `© ${new Date().getFullYear()} ${input.creator || 'A. G. Varma'}. All rights reserved.`
    },
    internalNotes: input.internalNotes
  };

  const parsed = workSchema.parse(candidateWork);
  const updatedWorks = [parsed, ...works];
  writeWorksToDisk(updatedWorks);

  return parsed;
}

/**
 * Update an existing work.
 */
export function updateWork(id: string, updates: Partial<Work>): Work {
  const works = readWorksFromDisk();
  const index = works.findIndex(w => w.id === id);
  if (index === -1) {
    throw new Error(`Work with ID "${id}" does not exist.`);
  }

  const existing = works[index];
  const now = new Date().toISOString();

  // If slug is changing, verify uniqueness
  if (updates.slug && updates.slug !== existing.slug) {
    if (works.some(w => w.slug === updates.slug && w.id !== id)) {
      throw new Error(`Slug "${updates.slug}" is already taken by another work.`);
    }
  }

  const merged: Work = {
    ...existing,
    ...updates,
    id: existing.id, // Immutable ID
    updatedAt: now
  };

  const parsed = workSchema.parse(merged);
  works[index] = parsed;
  writeWorksToDisk(works);

  return parsed;
}

/**
 * Transition work to published state.
 */
export function publishWork(id: string): Work {
  const works = readWorksFromDisk();
  const work = works.find(w => w.id === id);
  if (!work) {
    throw new Error(`Work with ID "${id}" not found.`);
  }

  const now = new Date().toISOString();
  return updateWork(id, {
    status: 'published',
    publishedAt: work.status === 'published' ? work.publishedAt : now,
    updatedAt: now
  });
}

/**
 * Transition work to archived state (withdrawn from public site).
 */
export function archiveWork(id: string): Work {
  return updateWork(id, {
    status: 'archived',
    updatedAt: new Date().toISOString()
  });
}

/**
 * Revert work to draft state.
 */
export function draftWork(id: string): Work {
  return updateWork(id, {
    status: 'draft',
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete a work permanently.
 */
export function deleteWork(id: string): boolean {
  const works = readWorksFromDisk();
  const index = works.findIndex(w => w.id === id);
  if (index === -1) {
    return false;
  }

  works.splice(index, 1);
  writeWorksToDisk(works);
  return true;
}

/**
 * Generates a full content backup archive with SHA-256 checksum.
 */
export function exportBackupArchive(): {
  timestamp: string;
  checksum: string;
  counts: { works: number; published: number; drafts: number; archived: number };
  data: { works: Work[] };
} {
  const works = readWorksFromDisk();
  const timestamp = new Date().toISOString();
  const data = { works };
  const rawPayload = JSON.stringify(data);
  const checksum = crypto.createHash('sha256').update(rawPayload).digest('hex');

  const published = works.filter(w => w.status === 'published').length;
  const drafts = works.filter(w => w.status === 'draft').length;
  const archived = works.filter(w => w.status === 'archived').length;

  return {
    timestamp,
    checksum,
    counts: {
      works: works.length,
      published,
      drafts,
      archived
    },
    data
  };
}

/**
 * Restores content from a validated backup archive payload.
 */
export function restoreBackupArchive(payload: {
  checksum: string;
  data: { works: Work[] };
}): { restoredCount: number; success: boolean } {
  if (!payload || !payload.data || !Array.isArray(payload.data.works)) {
    throw new Error('Invalid backup archive structure.');
  }

  const rawPayload = JSON.stringify(payload.data);
  const computedChecksum = crypto.createHash('sha256').update(rawPayload).digest('hex');
  if (computedChecksum !== payload.checksum) {
    throw new Error(`Checksum mismatch! Expected: ${payload.checksum}, Computed: ${computedChecksum}`);
  }

  // Validate each work
  const validated = payload.data.works.map((w, idx) => {
    const res = workSchema.safeParse(w);
    if (!res.success) {
      throw new Error(`Work at index ${idx} failed schema validation: ${res.error.message}`);
    }
    return res.data;
  });

  writeWorksToDisk(validated);
  return {
    restoredCount: validated.length,
    success: true
  };
}
